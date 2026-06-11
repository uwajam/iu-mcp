# iu-mcp

茨城大学の公開学務情報をMCP経由で利用するためのCloudflare Workersプロジェクトです。

表示名は「茨城大学学務情報MCP」です。リポジトリ名・Worker名・MCP登録名は `iu-mcp` に寄せています。

現在はシラバス検索・詳細取得に対応しています。今後、履修案内PDF、学務文書PDF、図書館キャッシュAPIを追加する予定です。

公開Workerは大学サイトへリアルタイム検索を行いません。シラバス検索はD1に投入済みの静的データだけを読みます。

説明サイト: `https://syllabus.iu.mcp.uwaja.net/`

## Disclaimer

このプロジェクトは茨城大学公式ではありません。扱うのは公開情報のみです。個人の履修情報、manaba、メール、休講情報、成績、学生アカウントに紐づく情報は含めません。

## Architecture

外部から見ると1つのMCPサーバーですが、内部ではGateway層とservice API層を分けています。

```text
apps/gateway
  MCP endpointと説明サイト。DBやcrawlerには触らず、service APIをfetchする。

services/syllabus
  シラバス検索・詳細取得API。D1 schemaに沿って検索する。

services/pdf
  将来のPDF API用の境界。現時点では未実装。

services/library
  将来の図書館API用の境界。現時点では未実装。

packages/shared
  共通レスポンス、JSON-RPC helperなど。

jobs/syllabus-crawler
  大学サイトからシラバスをページ単位で収集し、SQLite/D1 seedを生成する。

jobs/pdf-importer
  将来のPDF取得・テキスト抽出・インデックス作成用の境界。現時点では未実装。

migrations
  D1 schema。

src/worker.js
  Cloudflare Workerの薄いHTTPルーター。
```

## Responsibility

- crawler
  - `jobs/syllabus-crawler/crawl-syllabus.py`
  - 大学サイトのセッションを確立し、検索結果ページをページ単位で辿り、詳細ページをSQLiteへ保存します。
- DB schema / migration
  - `migrations/0001_schema.sql`
  - D1の `courses` tableとindexを定義します。
- search / detail取得ロジック
  - `services/syllabus/src/repository.js`
  - D1 prepared statementだけを使って検索・詳細取得を行います。
- HTTP syllabus API
  - `services/syllabus/src/index.js`
  - `/api/syllabus/search`、`/api/syllabus/courses/:id`、`/api/syllabus/health` を提供します。
- MCP tools
  - `apps/gateway/src/index.js`
  - `syllabus.search_courses` / `syllabus.get_course` を公開し、tool呼び出し時にsyllabus APIをfetchします。

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
python jobs/syllabus-crawler/export-d1-seed.py --db path/to/ibaraki_syllabus.sqlite --out work/d1_seed.sql
npx wrangler d1 execute ibaraki_syllabus --remote --file work/d1_seed.sql
```

件数が多い場合は分割して投入します。

```sh
python jobs/syllabus-crawler/export-d1-seed.py --db work/ibaraki_syllabus.sqlite --chunk-size 500
npx wrangler d1 execute ibaraki_syllabus --remote --file work/d1_seed/0001.sql
npx wrangler d1 execute ibaraki_syllabus --remote --file work/d1_seed/0002.sql
```

deploy:

```sh
npm run deploy
```

## Update Data

GitHub Actionsでシラバスをページ単位でクロールし、SQLiteからD1 seedを作ってremote D1へ投入します。

定期実行は毎週日曜 22:00 UTC、つまり日本時間では毎週月曜 07:00です。相手サイトへの負荷と長時間セッションを避けるため、定期実行は8ページずつ処理します。全72ページを9週間で一周します。

必要なRepository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

手動実行:

```text
Actions -> Update syllabus D1 -> Run workflow
```

例:

```text
start_page = 1, end_page = 8
start_page = 9, end_page = 16
start_page = 17, end_page = 24
```

一気に全ページを指定せず、8ページ前後ずつに分けるのがおすすめです。

検索結果に載っていても一時的に取得できない詳細ページがあるため、個別シラバス取得の失敗は警告として記録し、一定数までは処理を続行します。

ローカルで小さく試す場合:

```sh
python jobs/syllabus-crawler/crawl-syllabus.py --year 2026 --start-page 1 --end-page 1 --limit 10 --db work/ibaraki_syllabus.sqlite
python jobs/syllabus-crawler/export-d1-seed.py --db work/ibaraki_syllabus.sqlite --chunk-size 500
```

公開Workerはクロールを行わず、D1だけを読みます。

## HTTP API

```text
GET  /api/syllabus/health
GET  /api/syllabus/search?academicYear=2026&query=入門&limit=20
POST /api/syllabus/search
GET  /api/syllabus/courses/:id
POST /mcp
```

`/api/syllabus/courses/:id` は `courseId`、`syllabusId`、科目番号、時間割コード、公式URLを受け付けます。URLを渡す場合はpath segmentとしてURL encodeしてください。

## MCP

`POST /mcp` は軽量なJSON-RPC endpointです。

対応メソッド:

- `initialize`
- `tools/list`
- `tools/call`

公開ツール:

- `syllabus.search_courses`
- `syllabus.get_course`

MCP GatewayはD1を直接参照しません。tool呼び出しは内部HTTP APIへ変換されます。

## Security

- リアルタイム検索は公開APIに入れていません。
- SQLはD1 prepared statementだけを使います。
- `courseId` 系入力はrepository側で想定形式に寄せています。
- raw HTMLはD1に入れず、APIレスポンスにも返しません。

## Contact

不具合報告は GitHub Issues をご利用ください。
その他のお問い合わせは contact@uwaja.net までお願いいたします。
