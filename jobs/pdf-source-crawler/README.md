# PDF Source Crawler

Daily crawler for public PDF listing pages.

Default target:

```text
https://www.eng.ibaraki.ac.jp/education/class/
```

It extracts `.pdf` links, normalizes relative URLs, downloads each PDF, computes SHA-256, and imports only new or changed files through `jobs/pdf-importer/import-pdf.py`.

Deleted links are not removed immediately. Previously active files from the source page are marked as `missing`.

Usage:

```sh
python jobs/pdf-source-crawler/crawl-pdf-source.py --db work/iu_mcp.sqlite
python jobs/pdf-importer/export-d1-seed.py --db work/iu_mcp.sqlite --chunk-size 500
```
