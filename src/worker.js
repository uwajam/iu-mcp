const SERVER_INFO = {
  name: "ibaraki-syllabus-cloudflare",
  version: "0.1.0"
};

const TOOLS = [
  {
    name: "search_courses",
    description: "Search cached Ibaraki University syllabus courses from D1.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        keyword: { type: "string" },
        academicYear: { type: "integer" },
        instructor: { type: "string" },
        term: { type: "string" },
        day: { type: "string" },
        period: { type: "string" },
        courseNumberPrefix: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 50 }
      }
    }
  },
  {
    name: "get_course",
    description: "Get a cached Ibaraki University syllabus course by courseId, syllabusId, course number, or official URL. Raw HTML is not returned.",
    inputSchema: {
      type: "object",
      properties: {
        courseId: { type: "string" }
      },
      required: ["courseId"]
    }
  }
];

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") {
        return emptyResponse(204);
      }

      if (url.pathname === "/health" && request.method === "GET") {
        return jsonResponse({ ok: true, service: SERVER_INFO.name });
      }

      if (url.pathname === "/courses" && request.method === "GET") {
        return jsonResponse(await searchCourses(env.DB, argsFromSearchParams(url.searchParams)));
      }

      const coursePathMatch = url.pathname.match(/^\/courses\/(20\d{2})\/([0-9A-Z]+_[A-Z0-9-]+)$/);
      if (coursePathMatch && request.method === "GET") {
        const [, academicYear, syllabusId] = coursePathMatch;
        return jsonResponse(await getCourseByYearAndSyllabusId(env.DB, Number(academicYear), syllabusId));
      }

      if (url.pathname === "/mcp" && request.method === "POST") {
        return jsonResponse(await handleMcp(await request.json(), env.DB));
      }

      return jsonResponse({ error: "not found" }, 404);
    } catch (error) {
      return jsonResponse({ error: "internal error", message: error.message }, 500);
    }
  }
};

async function handleMcp(message, db) {
  const id = message.id ?? null;
  const method = message.method;
  const params = message.params ?? {};

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: params.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO
    });
  }

  if (method === "notifications/initialized") {
    return { ok: true };
  }

  if (method === "tools/list") {
    return rpcResult(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = params.name;
    const args = params.arguments ?? {};
    let result;
    if (name === "search_courses") {
      result = await searchCourses(db, args);
    } else if (name === "get_course") {
      result = await getCourse(db, args);
    } else {
      return rpcError(id, -32602, `Unknown tool: ${name}`);
    }
    return rpcResult(id, {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    });
  }

  return rpcError(id, -32601, `Unsupported method: ${method}`);
}

async function searchCourses(db, args) {
  const limit = clampInt(args.limit ?? args.pageSize, 1, 50, 20);
  const query = String(args.query ?? args.keyword ?? "").trim();
  const where = [];
  const values = [];

  if (args.academicYear) {
    where.push("academic_year = ?");
    values.push(Number(args.academicYear));
  }

  if (query) {
    const like = `%${escapeLike(query)}%`;
    where.push(`(
      title LIKE ? ESCAPE '\\' OR alternate_title LIKE ? ESCAPE '\\'
      OR course_number LIKE ? ESCAPE '\\' OR timetable_code LIKE ? ESCAPE '\\'
      OR instructors LIKE ? ESCAPE '\\' OR overview LIKE ? ESCAPE '\\'
    )`);
    values.push(like, like, like, like, like, like);
  }

  if (args.courseNumberPrefix) {
    const prefix = String(args.courseNumberPrefix).toUpperCase();
    if (!/^[A-Z0-9-]{1,16}$/.test(prefix)) {
      return [];
    }
    where.push("(course_number LIKE ? ESCAPE '\\' OR timetable_code LIKE ? ESCAPE '\\')");
    values.push(`${escapeLike(prefix)}%`, `${escapeLike(prefix)}%`);
  }

  if (args.instructor) {
    const like = `%${escapeLike(String(args.instructor))}%`;
    where.push("(instructors LIKE ? ESCAPE '\\' OR instructors_json LIKE ? ESCAPE '\\')");
    values.push(like, like);
  }

  if (args.term) {
    where.push("term LIKE ? ESCAPE '\\'");
    values.push(`%${escapeLike(String(args.term))}%`);
  }

  if (args.day) {
    const day = normalizeDay(args.day);
    where.push("(schedule LIKE ? ESCAPE '\\' OR schedule_days_json LIKE ? ESCAPE '\\')");
    values.push(`%${escapeLike(String(args.day))}%`, `%${escapeLike(day)}%`);
  }

  if (args.period) {
    const period = String(args.period);
    if (!/^[0-9]+$/.test(period)) {
      return [];
    }
    where.push("(schedule LIKE ? ESCAPE '\\' OR schedule_periods_json LIKE ? ESCAPE '\\')");
    values.push(`%${escapeLike(period)}%`, `%"${period}"%`);
  }

  let sql = "SELECT * FROM courses";
  if (where.length) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }
  sql += " ORDER BY academic_year DESC, timetable_code ASC, title ASC LIMIT ?";
  values.push(limit);

  const result = await db.prepare(sql).bind(...values).all();
  return (result.results ?? []).map(rowToSearchJson);
}

async function getCourse(db, args) {
  const key = String(args.courseId ?? "");
  if (!key) {
    return { error: "courseId is required" };
  }

  if (key.startsWith("ibaraki:")) {
    const row = await db.prepare("SELECT * FROM courses WHERE course_id = ? LIMIT 1").bind(key).first();
    return row ? rowToCourseJson(row) : { error: `Course '${key}' was not found` };
  }

  if (/^[0-9A-Z]+_[A-Z0-9-]+$/.test(key)) {
    const row = await db.prepare("SELECT * FROM courses WHERE syllabus_id = ? LIMIT 1").bind(key).first();
    return row ? rowToCourseJson(row) : { error: `Course '${key}' was not found` };
  }

  if (/^[A-Z0-9-]+$/.test(key)) {
    const row = await db.prepare("SELECT * FROM courses WHERE course_number = ? OR timetable_code = ? LIMIT 1").bind(key, key).first();
    return row ? rowToCourseJson(row) : { error: `Course '${key}' was not found` };
  }

  return { error: "Unsupported courseId format" };
}

async function getCourseByYearAndSyllabusId(db, academicYear, syllabusId) {
  const row = await db.prepare(
    "SELECT * FROM courses WHERE academic_year = ? AND syllabus_id = ? LIMIT 1"
  ).bind(academicYear, syllabusId).first();
  return row ? rowToCourseJson(row) : { error: "course not found" };
}

function rowToSearchJson(row) {
  return {
    courseId: row.course_id,
    source: row.source,
    academicYear: row.academic_year,
    courseNumber: row.course_number ?? row.timetable_code,
    syllabusId: row.syllabus_id,
    title: row.title,
    alternateTitle: row.alternate_title,
    credits: row.credits,
    yearLevel: row.year_level,
    term: row.term,
    schedule: row.schedule,
    scheduleDays: loadJson(row.schedule_days_json, []),
    schedulePeriods: loadJson(row.schedule_periods_json, []),
    instructors: loadJson(row.instructors_json, []),
    overview: row.overview,
    officialUrl: row.official_url ?? row.url,
    sourceUrl: row.source_url
  };
}

function rowToCourseJson(row) {
  return {
    ...rowToSearchJson(row),
    remarks: row.remarks,
    detailLanguage: row.detail_language,
    detailFetchedAt: row.detail_fetched_at,
    sections: loadJson(row.sections_json, []),
    servedFrom: row.served_from ?? "d1"
  };
}

function argsFromSearchParams(params) {
  const args = {};
  for (const [key, value] of params.entries()) {
    args[key] = key === "academicYear" || key === "limit" ? Number(value) : value;
  }
  return args;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

function emptyResponse(status) {
  return new Response(null, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function loadJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, match => `\\${match}`);
}

function normalizeDay(day) {
  return {
    "月": "mon",
    "火": "tue",
    "水": "wed",
    "木": "thu",
    "金": "fri",
    "土": "sat",
    "日": "sun",
    mon: "mon",
    tue: "tue",
    wed: "wed",
    thu: "thu",
    fri: "fri",
    sat: "sat",
    sun: "sun"
  }[String(day).toLowerCase()] ?? String(day).toLowerCase();
}

function clampInt(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}
