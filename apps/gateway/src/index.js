import { emptyResponse, jsonResponse, rpcError, rpcResult } from "../../../packages/shared/src/http.js";

const SERVER_INFO = {
  name: "iu-mcp-gateway",
  version: "0.2.0"
};

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const TOOLS = [
  {
    name: "syllabus.search_courses",
    description: "Search cached Ibaraki University syllabus courses via the syllabus API.",
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
    name: "syllabus.get_course",
    description: "Get a cached Ibaraki University syllabus course by courseId, syllabusId, course number, timetable code, or official URL.",
    inputSchema: {
      type: "object",
      properties: {
        courseId: { type: "string" }
      },
      required: ["courseId"]
    }
  }
];

export async function handleMcpGatewayRequest(request, env) {
  if (request.method === "GET" || request.method === "DELETE") {
    return methodNotAllowedResponse();
  }
  if (request.method !== "POST") {
    return methodNotAllowedResponse();
  }

  let message;
  try {
    message = await request.json();
  } catch {
    return jsonResponse(rpcError(null, -32700, "Parse error"), 400);
  }

  const response = await handleMcpMessage(message, request, env);
  return response instanceof Response ? response : jsonResponse(response);
}

async function handleMcpMessage(message, request, env) {
  if (!message || typeof message !== "object") {
    return rpcError(null, -32600, "Invalid Request");
  }

  if (!("method" in message)) {
    return acceptedResponse();
  }

  const id = message.id ?? null;
  const method = message.method;
  const params = message.params ?? {};
  const isNotification = !("id" in message);

  if (method === "initialize") {
    const requestedVersion = params.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
      ? requestedVersion
      : SUPPORTED_PROTOCOL_VERSIONS[0];
    return rpcResult(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO
    });
  }

  if (method === "notifications/initialized" || isNotification) {
    return acceptedResponse();
  }

  if (method === "tools/list") {
    return rpcResult(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const result = await callTool(params.name, params.arguments ?? {}, request, env);
    if (result?.__rpcError) {
      return rpcError(id, -32602, result.message);
    }
    return rpcResult(id, {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    });
  }

  return rpcError(id, -32601, `Unsupported method: ${method}`);
}

async function callTool(name, args, request, env) {
  if (name === "syllabus.search_courses") {
    return callSyllabusApi(request, env, "/api/syllabus/search", {
      method: "POST",
      body: JSON.stringify(args)
    });
  }

  if (name === "syllabus.get_course") {
    const courseId = String(args.courseId ?? "");
    if (!courseId) return { error: "courseId is required" };
    return callSyllabusApi(request, env, `/api/syllabus/courses/${encodeURIComponent(courseId)}`);
  }

  return { __rpcError: true, message: `Unknown tool: ${name}` };
}

async function callSyllabusApi(request, env, path, init = {}) {
  const url = new URL(env.SYLLABUS_API_BASE_URL || request.url);
  url.pathname = path;
  url.search = "";

  const response = await fetch(url.toString(), {
    method: init.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    },
    body: init.body
  });

  const result = await response.json();
  return response.ok ? result : { error: result.error ?? "syllabus api error", status: response.status };
}

function acceptedResponse() {
  return emptyResponse(202);
}

function methodNotAllowedResponse() {
  return new Response(null, {
    status: 405,
    headers: {
      allow: "POST, OPTIONS",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "accept, content-type, mcp-protocol-version, mcp-session-id"
    }
  });
}
