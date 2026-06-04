const SERVER_INFO = {
  name: "ibaraki-syllabus-cloudflare",
  version: "0.1.0"
};

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /mcp
Disallow: /courses
Disallow: /health
Disallow: /status
`;

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

const SITE_HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>茨城大学シラバス MCP</title>
  <meta name="description" content="茨城大学シラバスをAIから検索できる読み取り専用MCP endpointです。">
  <style>
    :root {
      color-scheme: light;
      --ink: #17201b;
      --muted: #5e6862;
      --line: #d9dfda;
      --soft: #f4f7f4;
      --wash: #eef5f1;
      --brand: #176b4b;
      --brand-2: #1f4f7a;
      --accent: #b34b2f;
      --panel: #ffffff;
      --code: #111916;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: #fbfcfb;
      font-family: Inter, "Noto Sans JP", "Yu Gothic", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.72;
    }
    a { color: inherit; }
    .shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
    header {
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid rgba(23, 32, 27, .1);
      background: rgba(251, 252, 251, .9);
      backdrop-filter: blur(14px);
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 64px;
      gap: 20px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 750;
      letter-spacing: 0;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 1px solid var(--line);
      background: var(--wash);
      color: var(--brand);
      font-weight: 800;
      border-radius: 8px;
    }
    .links {
      display: flex;
      align-items: center;
      gap: 18px;
      color: var(--muted);
      font-size: 14px;
    }
    .links a { text-decoration: none; }
    .links a:hover { color: var(--ink); }
    .hero {
      padding: 86px 0 58px;
      border-bottom: 1px solid var(--line);
      background:
        linear-gradient(180deg, #fbfcfb 0%, #f1f6f2 100%);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
      gap: 52px;
      align-items: center;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--brand);
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 18px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--brand);
    }
    h1 {
      margin: 0;
      font-size: clamp(40px, 7vw, 78px);
      line-height: 1.05;
      letter-spacing: 0;
      max-width: 760px;
    }
    .lead {
      margin: 24px 0 0;
      max-width: 700px;
      color: var(--muted);
      font-size: 18px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 32px;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 18px;
      border: 1px solid var(--ink);
      background: var(--ink);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      border-radius: 8px;
    }
    .button.secondary {
      background: transparent;
      color: var(--ink);
      border-color: var(--line);
    }
    .status-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
    }
    .status {
      padding: 7px 10px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,.65);
      color: var(--muted);
      font-size: 13px;
      border-radius: 999px;
    }
    .console {
      border: 1px solid #cdd7cf;
      background: #101713;
      color: #d9f5e3;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 18px 45px rgba(22, 37, 29, .14);
    }
    .console-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,.1);
      color: #9fc2ad;
      font-size: 13px;
    }
    .copy {
      min-width: 62px;
      height: 28px;
      border: 1px solid rgba(217,245,227,.28);
      background: rgba(255,255,255,.08);
      color: #d9f5e3;
      font: 12px/1 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      border-radius: 7px;
      cursor: pointer;
    }
    .copy:hover { background: rgba(255,255,255,.16); }
    .lights { display: flex; gap: 7px; }
    .lights span { width: 10px; height: 10px; border-radius: 50%; background: #7bb08e; }
    .lights span:nth-child(2) { background: #d0ad5b; }
    .lights span:nth-child(3) { background: #bf6b58; }
    pre {
      margin: 0;
      overflow-x: auto;
      padding: 18px;
      color: #e6f7ea;
      background: var(--code);
      font: 13px/1.6 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }
    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; }
    section { padding: 72px 0; }
    .section-head {
      margin-bottom: 28px;
    }
    h2 {
      margin: 0;
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.18;
      letter-spacing: 0;
    }
    .section-note {
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.75;
      max-width: 760px;
    }
    .steps, .usecases, .tools {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .item {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
      padding: 22px;
    }
    .num {
      color: var(--brand);
      font-weight: 800;
      font-size: 13px;
      margin-bottom: 14px;
    }
    h3 {
      margin: 0 0 10px;
      font-size: 20px;
      line-height: 1.32;
      letter-spacing: 0;
    }
    .item p, .tool p, .faq p {
      margin: 0;
      color: var(--muted);
    }
    .tool {
      border-top: 1px solid var(--line);
      padding: 24px 0;
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 28px;
    }
    .tool-name {
      color: var(--brand-2);
      font-weight: 800;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
    }
    .params {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .params span {
      border: 1px solid var(--line);
      color: var(--muted);
      padding: 5px 8px;
      border-radius: 999px;
      font-size: 13px;
    }
    .connect {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 18px;
    }
    .connect.stack {
      grid-template-columns: 1fr;
    }
    .notice {
      border-left: 4px solid var(--accent);
      background: #fff7f3;
      padding: 16px 18px;
      color: #5f3428;
      border-radius: 8px;
      margin-top: 18px;
    }
    .endpoint {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 18px;
    }
    .endpoint-label {
      display: block;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 5px;
    }
    .endpoint code {
      display: block;
      color: var(--ink);
      font-size: 15px;
      overflow-wrap: anywhere;
    }
    .copy.light {
      border-color: var(--line);
      background: var(--soft);
      color: var(--ink);
    }
    .copy.light:hover { background: var(--wash); }
    .faq-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .example-list {
      display: grid;
      gap: 18px;
    }
    .example {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 8px;
      overflow: hidden;
    }
    .example-row {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr);
      gap: 18px;
      padding: 18px 20px;
    }
    .example-row + .example-row {
      border-top: 1px solid var(--line);
      background: var(--soft);
    }
    .example-label {
      color: var(--brand);
      font-weight: 800;
      font-size: 13px;
    }
    .example p {
      margin: 0;
      color: var(--ink);
    }
    .example .muted {
      color: var(--muted);
      margin-top: 8px;
    }
    footer {
      border-top: 1px solid var(--line);
      padding: 28px 0 44px;
      color: var(--muted);
      font-size: 14px;
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    @media (max-width: 860px) {
      .hero-grid, .connect, .tool { grid-template-columns: 1fr; }
      .steps, .usecases, .tools, .faq-grid { grid-template-columns: 1fr; }
      .endpoint { grid-template-columns: 1fr; }
      .example-row { grid-template-columns: 1fr; gap: 8px; }
      .hero { padding-top: 56px; }
      .links { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <nav class="shell">
      <a class="brand" href="/" aria-label="茨城大学シラバス MCP">
        <span class="mark">IU</span>
        <span>茨城大学シラバス MCP</span>
      </a>
      <div class="links">
        <a href="#usage">使い方</a>
        <a href="#tools">ツール</a>
        <a href="#connect">接続方法</a>
        <a href="#examples">質問例</a>
        <a href="#faq">FAQ</a>
      </div>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="shell hero-grid">
        <div>
      <div class="eyebrow"><span class="dot"></span>読み取り専用 / 公式URL付き / 認証不要</div>
          <h1>茨城大学シラバス MCP</h1>
          <p class="lead">接続先、ツール名、質問例を忘れたときのためのメモページです。Codex や Claude Code から茨城大学シラバスを検索し、授業概要と公式URLを確認できます。</p>
          <div class="actions">
            <a class="button" href="#connect">接続方法を見る</a>
            <a class="button secondary" href="#tools">ツール仕様を見る</a>
          </div>
          <div class="status-row">
            <span class="status">認証不要</span>
            <span class="status">2026年度データ</span>
            <span class="status">定期更新</span>
            <span class="status">raw HTMLは返しません</span>
          </div>
        </div>
        <div class="console" aria-label="MCP request example">
          <div class="console-head">
            <span>search_courses</span>
            <div class="lights"><span></span><span></span><span></span></div>
          </div>
          <pre><code>search_courses({
  academicYear: 2026,
  query: "地域社会",
  limit: 3
})

get_course({
  courseId: "ibaraki:2026:13_LA0007"
})</code></pre>
        </div>
      </div>
    </section>

    <section id="usage">
      <div class="shell">
        <div class="section-head">
          <h2>何に使えるか</h2>
          <p class="section-note">時間割の候補出し、授業概要の確認、科目コードからの詳細取得を、AIとの会話に寄せるための入口です。</p>
        </div>
        <div class="steps">
          <article class="item">
            <div class="num">01</div>
            <h3>条件を自然文で伝える</h3>
            <p>「火曜2限」「LAから始まる科目」「地域社会について学べる授業」など、曖昧なまま相談できます。</p>
          </article>
          <article class="item">
            <div class="num">02</div>
            <h3>MCPが保存済みデータを検索する</h3>
            <p>公開Workerは大学サイトをリアルタイムに叩かず、事前収集したデータだけを読みます。</p>
          </article>
          <article class="item">
            <div class="num">03</div>
            <h3>公式URLで確認する</h3>
            <p>返却結果には公式シラバスURLを含めます。履修判断の最後は必ず公式情報で確認してください。</p>
          </article>
        </div>
      </div>
    </section>

    <section id="tools">
      <div class="shell">
        <div class="section-head">
          <h2>公開ツール</h2>
          <p class="section-note">今は検索と詳細取得の2つに絞っています。履修ルールはまだ含めていません。</p>
        </div>
        <div class="tool">
          <div class="tool-name">search_courses</div>
          <div>
            <h3>授業候補を検索する</h3>
            <p>授業名、教員名、概要、科目番号、曜日、時限、学期、科目番号プレフィックスで候補を返します。</p>
            <div class="params">
              <span>query</span><span>academicYear</span><span>courseNumberPrefix</span><span>instructor</span><span>term</span><span>day</span><span>period</span><span>limit</span>
            </div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-name">get_course</div>
          <div>
            <h3>シラバス詳細を取得する</h3>
            <p><code>courseId</code>、<code>syllabusId</code>、科目番号、時間割コードから詳細を取得します。raw HTMLは返しません。</p>
            <div class="params">
              <span>courseId</span><span>sections</span><span>overview</span><span>officialUrl</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="connect">
      <div class="shell">
        <div class="section-head">
          <h2>接続方法</h2>
          <p class="section-note">認証不要のStreamable HTTP MCPです。使っているクライアントに合わせて登録してください。</p>
        </div>
        <div class="endpoint">
          <div>
            <span class="endpoint-label">MCP Server URL</span>
            <code id="copy-endpoint">https://iu.syllabus-mcp.uwaja.net/mcp</code>
          </div>
          <button class="copy light" data-copy="endpoint">Copy</button>
        </div>
        <div class="connect stack">
          <div class="console">
            <div class="console-head"><span>Codex</span><button class="copy" data-copy="codex">Copy</button></div>
            <pre><code id="copy-codex">codex mcp add ibaraki-syllabus --url https://iu.syllabus-mcp.uwaja.net/mcp</code></pre>
          </div>
          <div class="console">
            <div class="console-head"><span>~/.codex/config.toml</span><button class="copy" data-copy="config">Copy</button></div>
            <pre><code id="copy-config">[mcp_servers.ibaraki-syllabus]
enabled = true
url = "https://iu.syllabus-mcp.uwaja.net/mcp"</code></pre>
          </div>
        </div>
        <div class="connect stack" style="margin-top:18px">
          <div class="console">
            <div class="console-head"><span>Claude Code</span><button class="copy" data-copy="claude">Copy</button></div>
            <pre><code id="copy-claude">claude mcp add --transport http \\
  --scope project \\
  ibaraki-syllabus \\
  https://iu.syllabus-mcp.uwaja.net/mcp</code></pre>
          </div>
        </div>
        <p class="notice">このサービスは茨城大学公式ではありません。情報が食い違う場合は、必ず公式シラバスを優先してください。</p>
      </div>
    </section>

    <section id="examples">
      <div class="shell">
        <div class="section-head">
          <h2>質問例</h2>
          <p class="section-note">MCPを登録したあと、AIにこう頼むと授業検索に使えます。</p>
        </div>
        <div class="example-list">
          <article class="example">
            <div class="example-row">
              <div class="example-label">質問</div>
              <p>ibaraki-syllabusで、2026年度に開講される「地域社会」について学べる授業を探して。授業名、担当教員、曜日時限、概要を短くまとめて。</p>
            </div>
            <div class="example-row">
              <div class="example-label">回答例</div>
              <div>
                <p>関連しそうな授業を候補として一覧にします。授業名、学期、曜日時限、担当教員、概要を見比べられる形で返します。</p>
                <p class="muted">気になる授業があれば、そのcourseIdで詳細を開き、到達目標や成績評価まで確認できます。</p>
              </div>
            </div>
          </article>
          <article class="example">
            <div class="example-row">
              <div class="example-label">質問</div>
              <p>ibaraki-syllabusで、科目番号がLAから始まる2026年度の授業を検索して。前期に開講されるものを中心に、10件まで候補を出して。</p>
            </div>
            <div class="example-row">
              <div class="example-label">回答例</div>
              <div>
                <p>LAで始まる科目を検索し、授業名、単位数、開講学期、曜日時限を一覧にします。</p>
                <p class="muted">必要なら候補ごとにget_courseで詳細を開き、授業概要、到達目標、成績評価、履修上の注意まで確認します。</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="faq">
      <div class="shell">
        <div class="section-head">
          <h2>FAQ</h2>
          <p class="section-note">忘れたときに見るための短いメモです。</p>
        </div>
        <div class="faq-grid">
          <article class="item faq">
            <h3>アカウントやAPIキーは必要ですか？</h3>
            <p>不要です。公開MCP endpointとして、そのまま接続できます。</p>
          </article>
          <article class="item faq">
            <h3>データは更新されますか？</h3>
            <p>はい。定期的にシラバスを収集し直します。必要な場合は手動でも更新できます。</p>
          </article>
          <article class="item faq">
            <h3>大学サイトを毎回見に行きますか？</h3>
            <p>いいえ。公開Workerは保存済みデータだけを読みます。クロールは低頻度のバッチで実行します。</p>
          </article>
          <article class="item faq">
            <h3>何年度に対応していますか？</h3>
            <p>現在は主に2026年度データです。収集済みの年度は <code>academicYear</code> で指定できます。</p>
          </article>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="shell footer-row">
      <span>茨城大学シラバス MCP</span>
      <span>非公式ツールです。最終確認は公式シラバスで行ってください。</span>
    </div>
  </footer>
  <script>
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const target = document.getElementById("copy-" + button.dataset.copy);
        if (!target) return;
        try {
          await navigator.clipboard.writeText(target.textContent.trim());
          const original = button.textContent;
          button.textContent = "Copied";
          setTimeout(() => { button.textContent = original; }, 1200);
        } catch {
          button.textContent = "Select";
        }
      });
    });
  </script>
</body>
</html>`;

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

      if (url.pathname === "/mcp") {
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

        const response = await handleMcp(message, env.DB);
        return response instanceof Response ? response : jsonResponse(response);
      }

      return jsonResponse({ error: "not found" }, 404);
    } catch (error) {
      return jsonResponse({ error: "internal error", message: error.message }, 500);
    }
  }
};

async function handleMcp(message, db) {
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

  if (method === "notifications/initialized") {
    return acceptedResponse();
  }

  if (isNotification) {
    return acceptedResponse();
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
      "access-control-allow-headers": "accept, content-type, mcp-protocol-version, mcp-session-id"
    }
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}

function textResponse(text, contentType, status = 200) {
  return new Response(text, {
    status,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=3600"
    }
  });
}

function emptyResponse(status) {
  return new Response(null, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "accept, content-type, mcp-protocol-version, mcp-session-id"
    }
  });
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
