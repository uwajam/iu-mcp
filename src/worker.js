import { handleMcpGatewayRequest } from "../apps/gateway/src/index.js";
import { SITE_HTML } from "../apps/gateway/src/site.js";
import { handleSyllabusApiRequest } from "../services/syllabus/src/index.js";
import { emptyResponse, htmlResponse, jsonResponse, notFoundResponse, textResponse } from "../packages/shared/src/http.js";

const ROBOTS_TXT = `# As a condition of accessing this website, you agree to abide by the following content signals:
#
# (a) If a content-signal = yes, you may collect content for the corresponding use.
# (b) If a content-signal = no, you may not collect content for the corresponding use.
# (c) If the website operator does not include a content signal for a corresponding use, the website operator neither grants nor restricts permission via content signal with respect to the corresponding use.
# The content signals and their meanings are:
#
# search: building a search index and providing search results, such as returning hyperlinks and short excerpts. Search does not include providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models, such as retrieval augmented generation, grounding, or other real-time taking of content for generative AI search answers.
# ai-train: training or fine-tuning AI models.
# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED RIGHTS IN THE DIGITAL SINGLE MARKET.

User-agent: *
Content-Signal: search=yes, ai-train=no
Allow: /
Disallow: /mcp
Disallow: /api/
Disallow: /courses
Disallow: /health
Disallow: /status
`;

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return emptyResponse(204);
      }

      if (url.pathname === "/" && request.method === "GET") {
        return htmlResponse(SITE_HTML);
      }

      if (url.pathname === "/robots.txt" && request.method === "GET") {
        return textResponse(ROBOTS_TXT, "text/plain; charset=utf-8");
      }

      if (url.pathname === "/mcp") {
        return handleMcpGatewayRequest(request, env);
      }

      if (url.pathname.startsWith("/api/syllabus/")) {
        return handleSyllabusApiRequest(request, env);
      }

      if (url.pathname === "/health" && request.method === "GET") {
        return jsonResponse({ ok: true, service: "iu-mcp-gateway" });
      }

      return notFoundResponse();
    } catch (error) {
      return jsonResponse({ error: "internal error", message: error.message }, 500);
    }
  }
};
