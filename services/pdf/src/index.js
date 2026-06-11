import { jsonResponse } from "../../../packages/shared/src/http.js";
import { searchDocuments } from "./repository.js";

export async function handlePdfApiRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/pdf/health" && request.method === "GET") {
    return jsonResponse({ ok: true, service: "iu-pdf-service" });
  }

  if (url.pathname === "/api/pdf/search") {
    if (request.method === "GET") {
      return jsonResponse(await searchDocuments(env.DB, argsFromSearchParams(url.searchParams)));
    }
    if (request.method === "POST") {
      return jsonResponse(await searchDocuments(env.DB, await readJsonBody(request)));
    }
    return methodNotAllowed("GET, POST, OPTIONS");
  }

  return jsonResponse({ error: "not found" }, 404);
}

function argsFromSearchParams(params) {
  const args = {};
  for (const [key, value] of params.entries()) {
    args[key] = key === "limit" ? Number(value) : value;
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
