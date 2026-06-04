# ibaraki-syllabus-worker

茨城大学シラバスを Cloudflare Workers + D1 で公開するためのAPI/MCP endpointです。

公開Workerは大学サイトへリアルタイム検索を行いません。D1に投入済みの静的データだけを読み、raw HTMLもレスポンスには含めません。

説明サイト: `https://iu.syllabus-mcp.uwaja.net/`

## 構成

- `src/worker.js`
  - HTTP API と HTTP MCP endpoint。
- `migrations/0001_schema.sql`
  - D1 schema。
- `scripts/export-d1-seed.py`
  - 既存のSQLiteスナップショットからD1投入用SQLを生成する移行補助。
- `wrangler.toml`
  - Worker名とD1 binding設定。

## Setup

```sh
npm install
npm run cf:login
npm run d1:create
```

作成された `database_id` を `wrangler.toml` に設定してから、schemaを適用します。

```sh
npm run d1:migrate
```

既存のSQLiteスナップショットをD1へ投入する場合:

```sh
python scripts/export-d1-seed.py --db path/to/ibaraki_syllabus.sqlite --out work/d1_seed.sql
npx wrangler d1 execute ibaraki_syllabus --remote --file work/d1_seed.sql
```

件数が多い場合は分割して投入します。

```sh
python scripts/export-d1-seed.py --db work/ibaraki_syllabus.sqlite --chunk-size 500
npx wrangler d1 execute ibaraki_syllabus --remote --file work/d1_seed/0001.sql
npx wrangler d1 execute ibaraki_syllabus --remote --file work/d1_seed/0002.sql
```

deploy:

```sh
npm run deploy
```

## Update Data

GitHub Actionsでシラバスをページ単位でクロールし、SQLiteからD1 seedを作ってremote D1へ投入します。

定期実行は毎月1日 18:12 UTC、つまり日本時間では毎月2日 03:12です。相手サイトへの負荷と長時間セッションを避けるため、定期実行のデフォルトは検索結果1ページ目だけです。全体更新は手動でページ範囲を分けて実行します。

必要なRepository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

手動実行:

```text
Actions -> Update syllabus D1 -> Run workflow
```

例:

```text
start_page = 1, end_page = 5
start_page = 6, end_page = 10
start_page = 11, end_page = 15
```

一気に全ページを指定せず、5ページ前後ずつに分けるのがおすすめです。

ローカルで小さく試す場合:

```sh
python scripts/crawl-syllabus.py --year 2026 --start-page 1 --end-page 1 --limit 10 --db work/ibaraki_syllabus.sqlite
python scripts/export-d1-seed.py --db work/ibaraki_syllabus.sqlite --chunk-size 500
```

公開Workerはクロールを行わず、D1だけを読みます。

## API

```text
GET /health
GET /courses?academicYear=2026&query=入門&limit=20
GET /courses?academicYear=2026&courseNumberPrefix=T3
GET /courses/2026/04_T3003
POST /mcp
```

`GET /courses/{year}/{syllabusId}` は `20xx` と `^[0-9A-Z]+_[A-Z0-9-]+$` のみ受け付けます。

## MCP

`POST /mcp` は軽量なJSON-RPC endpointです。

対応メソッド:

- `initialize`
- `tools/list`
- `tools/call`

公開ツール:

- `search_courses`
- `get_course`

`search_courses` はD1だけを検索します。`get_course` は `courseId`、`syllabusId`、`courseNumber`、または公式URLで詳細を取得できます。

## Security

- リアルタイム検索は公開APIに入れていません。
- SQLはD1 prepared statementだけを使います。
- `course_id` 系入力は大文字英数字、アンダースコア、ハイフン、URLの想定範囲だけに寄せています。
- raw HTMLはD1に入れず、APIレスポンスにも返しません。

`html_r2_key` は将来raw HTMLをR2へ退避するための予約フィールドです。現時点のWorkerはR2を読みません。
