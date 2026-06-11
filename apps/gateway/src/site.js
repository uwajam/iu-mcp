export const SITE_HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>茨城大学学務情報MCP</title>
  <meta name="description" content="茨城大学の公開学務情報をAIから検索できる読み取り専用MCP endpointです。">
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
      text-decoration: none;
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
      <a class="brand" href="/" aria-label="茨城大学学務情報MCP"><span class="mark">IU</span><span>茨城大学学務情報MCP</span></a>
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
          <div class="eyebrow"><span class="dot"></span>非公式 / 読み取り専用 / 公式URL付き / 認証不要</div>
          <h1>茨城大学学務情報MCP</h1>
          <p class="lead">Codex や Claude Code から茨城大学の公開学務情報を検索できます。現在はシラバス検索のみ提供しており、履修案内PDF、学務文書PDF、図書館キャッシュAPIを後から束ねられるGateway構成です。</p>
          <div class="actions">
            <a class="button" href="#connect">接続方法を見る</a>
            <a class="button secondary" href="#tools">ツール仕様を見る</a>
          </div>
          <div class="status-row">
            <span class="status">認証不要</span>
            <span class="status">2026年度データ</span>
            <span class="status">定期更新</span>
          </div>
        </div>
        <div class="console" aria-label="MCP request example">
          <div class="console-head"><span>syllabus.search_courses</span></div>
          <pre><code>syllabus.search_courses({
  academicYear: 2026,
  query: "地域社会",
  limit: 3
})

syllabus.get_course({
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
          <article class="item"><div class="num">01</div><h3>条件を自然文で伝える</h3><p>「火曜2限」「LAから始まる科目」「地域社会について学べる授業」など、曖昧なまま相談できます。</p></article>
          <article class="item"><div class="num">02</div><h3>MCPが内部APIを呼ぶ</h3><p>MCP GatewayはDBを直接読まず、保存済みデータを返すシラバスAPIへ問い合わせます。</p></article>
          <article class="item"><div class="num">03</div><h3>公式URLで確認する</h3><p>返却結果には公式シラバスURLを含めます。履修判断の最後は必ず公式情報で確認してください。</p></article>
        </div>
      </div>
    </section>

    <section id="tools">
      <div class="shell">
        <div class="section-head">
          <h2>公開ツール</h2>
          <p class="section-note">ツール名は名前空間付きです。PDFや図書館機能を追加しても衝突しにくい形にしています。</p>
        </div>
        <div class="tool">
          <div class="tool-name">syllabus.search_courses</div>
          <div>
            <h3>授業候補を検索する</h3>
            <p>授業名、教員名、概要、科目番号、曜日、時限、学期、科目番号プレフィックスで候補を返します。</p>
            <div class="params"><span>query</span><span>academicYear</span><span>courseNumberPrefix</span><span>instructor</span><span>term</span><span>day</span><span>period</span><span>limit</span></div>
          </div>
        </div>
        <div class="tool">
          <div class="tool-name">syllabus.get_course</div>
          <div>
            <h3>シラバス詳細を取得する</h3>
            <p><code>courseId</code>、<code>syllabusId</code>、科目番号、時間割コード、公式URLから詳細を取得します。</p>
            <div class="params"><span>courseId</span><span>sections</span><span>overview</span><span>officialUrl</span></div>
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
            <code id="copy-endpoint">https://iu.mcp.uwaja.net/mcp</code>
          </div>
          <button class="copy light" data-copy="endpoint">Copy</button>
        </div>
        <div class="connect">
          <div class="console">
            <div class="console-head"><span>Codex</span><button class="copy" data-copy="codex">Copy</button></div>
            <pre><code id="copy-codex">codex mcp add iu-mcp --url https://iu.mcp.uwaja.net/mcp</code></pre>
          </div>
          <div class="console">
            <div class="console-head"><span>~/.codex/config.toml</span><button class="copy" data-copy="config">Copy</button></div>
            <pre><code id="copy-config">[mcp_servers.iu-mcp]
enabled = true
url = "https://iu.mcp.uwaja.net/mcp"</code></pre>
          </div>
          <div class="console">
            <div class="console-head"><span>Claude Code</span><button class="copy" data-copy="claude">Copy</button></div>
            <pre><code id="copy-claude">claude mcp add --transport http \\
  --scope project \\
  iu-mcp \\
  https://iu.mcp.uwaja.net/mcp</code></pre>
          </div>
        </div>
        <p class="notice">このサービスは茨城大学公式ではありません。公開情報のみを扱い、個人の履修情報、manaba、メール、休講情報は含みません。情報が食い違う場合は、必ず大学ホームページを優先してください。</p>
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
              <p>茨城大学で、2026年度に開講される「地域社会」について学べる授業を探して。授業名、担当教員、曜日時限、概要を短くまとめて。</p>
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
              <p>茨城大学で、科目番号がLAから始まる2026年度の授業を検索して。前期に開講されるものを中心に、10件まで候補を出して。</p>
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
        </div>
        <div class="faq-grid">
          <article class="item faq">
            <h3>アカウントやAPIキーは必要ですか？</h3>
            <p>不要です。公開MCP endpointとして、そのまま接続できます。</p>
          </article>
          <article class="item faq">
            <h3>データは更新されますか？</h3>
            <p>はい。定期的にシラバスを収集し直します。必要な場合は手動でも更新しています。</p>
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
      <span>茨城大学学務情報MCP</span>
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
