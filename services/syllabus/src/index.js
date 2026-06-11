import { jsonResponse } from "../../../packages/shared/src/http.js";
import { getCourse, getCourseByYearAndSyllabusId, getSyllabusStats, searchCourses } from "./repository.js";

export async function handleSyllabusApiRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/syllabus/health" && request.method === "GET") {
    return jsonResponse({ ok: true, service: "iu-syllabus-service", ...(await getSyllabusStats(env.DB)) });
  }

  if (url.pathname === "/api/syllabus/search") {
    if (request.method === "GET") {
      return jsonResponse(await searchCourses(env.DB, argsFromSearchParams(url.searchParams)));
    }
    if (request.method === "POST") {
      return jsonResponse(await searchCourses(env.DB, await readJsonBody(request)));
    }
    return methodNotAllowed("GET, POST, OPTIONS");
  }

  const courseMatch = url.pathname.match(/^\/api\/syllabus\/courses\/(.+)$/);
  if (courseMatch && request.method === "GET") {
    const key = decodeURIComponent(courseMatch[1]);
    const yearAndSyllabus = key.match(/^(20\d{2})\/([0-9A-Z]+_[A-Z0-9-]+)$/);
    const result = yearAndSyllabus
      ? await getCourseByYearAndSyllabusId(env.DB, Number(yearAndSyllabus[1]), yearAndSyllabus[2])
      : await getCourse(env.DB, key);
    return jsonResponse(result, result.error ? 404 : 200);
  }

  return jsonResponse({ error: "not found" }, 404);
}

function argsFromSearchParams(params) {
  const args = {};
  for (const [key, value] of params.entries()) {
    args[key] = key === "academicYear" || key === "limit" ? Number(value) : value;
  }
  return args;
}

async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

function methodNotAllowed(allow) {
  return new Response(null, {
    status: 405,
    headers: {
      allow,
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "accept, content-type, mcp-protocol-version, mcp-session-id"
    }
  });
}
