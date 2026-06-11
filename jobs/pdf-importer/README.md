# PDF Importer

Fetch public academic PDFs, extract text, split into chunks, and build SQLite rows for `services/pdf`.

Default target:

```text
茨城大学工学部 履修要項 令和8年度入学者用（2026）
https://www.eng.ibaraki.ac.jp/common/education/class/2026-course-registration02.pdf
```

Usage:

```sh
python jobs/pdf-importer/import-pdf.py --db work/iu_mcp.sqlite
python jobs/pdf-importer/export-d1-seed.py --db work/iu_mcp.sqlite --chunk-size 500
```
