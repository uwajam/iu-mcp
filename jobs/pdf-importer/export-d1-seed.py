import argparse
import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "work" / "iu_mcp.sqlite"
DEFAULT_OUT = ROOT / "work" / "pdf_d1_seed.sql"
DEFAULT_CHUNK_DIR = ROOT / "work" / "pdf_d1_seed"

DOCUMENT_COLUMNS = [
    "document_id",
    "title",
    "source_url",
    "academic_year",
    "category",
    "page_count",
    "fetched_at",
    "imported_at",
]

FILE_COLUMNS = [
    "file_id",
    "source_page_url",
    "source_url",
    "title",
    "content_sha256",
    "etag",
    "last_modified",
    "content_length",
    "status",
    "document_id",
    "first_seen_at",
    "last_seen_at",
    "imported_at",
    "missing_at",
]

CHUNK_COLUMNS = [
    "chunk_id",
    "document_id",
    "chunk_index",
    "page_number",
    "heading",
    "text",
    "text_normalized",
    "imported_at",
]


def main():
    parser = argparse.ArgumentParser(description="Export local SQLite PDF index rows as D1 seed SQL.")
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--chunk-dir", default="")
    parser.add_argument("--chunk-size", type=int, default=0)
    parser.add_argument("--mode", choices=["replace", "upsert"], default="replace")
    parser.add_argument("--transaction", action="store_true")
    args = parser.parse_args()

    with sqlite3.connect(args.db) as conn:
        conn.row_factory = sqlite3.Row
        statements = list(build_statements(conn, args.mode))

    if args.chunk_size > 0:
        chunk_dir = Path(args.chunk_dir) if args.chunk_dir else DEFAULT_CHUNK_DIR
        result = write_chunks(statements, chunk_dir, args.chunk_size, args.transaction)
    else:
        result = write_single(statements, Path(args.out), args.transaction)

    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))


def build_statements(conn, mode):
    if mode == "replace":
        yield "DELETE FROM pdf_chunks;\n"
        yield "DELETE FROM pdf_documents;\n"
        yield "DELETE FROM pdf_files;\n"
    for row in conn.execute("SELECT * FROM pdf_files ORDER BY source_url, first_seen_at, file_id"):
        yield insert_sql("pdf_files", FILE_COLUMNS, row)
    for row in conn.execute("SELECT * FROM pdf_documents ORDER BY document_id"):
        yield delete_document_chunks_by_source_url(row["source_url"])
        yield insert_sql("pdf_documents", DOCUMENT_COLUMNS, row)
    for row in conn.execute("SELECT * FROM pdf_chunks ORDER BY document_id, chunk_index"):
        yield insert_sql("pdf_chunks", CHUNK_COLUMNS, row)


def write_single(statements, out_path, use_transaction):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with out_path.open("w", encoding="utf-8", newline="\n") as f:
        if use_transaction:
            f.write("BEGIN TRANSACTION;\n")
        for statement in statements:
            f.write(statement)
            count += 1
        if use_transaction:
            f.write("COMMIT;\n")
    return {"out": str(out_path), "statements": count}


def write_chunks(statements, chunk_dir, chunk_size, use_transaction):
    chunk_dir.mkdir(parents=True, exist_ok=True)
    files = []
    current = []
    for statement in statements:
        current.append(statement)
        if len(current) >= chunk_size:
            files.append(write_chunk(chunk_dir, len(files) + 1, current, use_transaction))
            current = []
    if current:
        files.append(write_chunk(chunk_dir, len(files) + 1, current, use_transaction))
    return {"chunkDir": str(chunk_dir), "files": files}


def write_chunk(chunk_dir, index, statements, use_transaction):
    path = chunk_dir / f"{index:04d}.sql"
    with path.open("w", encoding="utf-8", newline="\n") as f:
        if use_transaction:
            f.write("BEGIN TRANSACTION;\n")
        for statement in statements:
            f.write(statement)
        if use_transaction:
            f.write("COMMIT;\n")
    return str(path)


def insert_sql(table, columns, row):
    quoted = ", ".join(columns)
    values = ", ".join(sql_value(row[column]) for column in columns)
    primary_key = "source_url" if table == "pdf_documents" else columns[0]
    updates = ", ".join(f"{column} = excluded.{column}" for column in columns if column != primary_key)
    return (
        f"INSERT INTO {table} ({quoted}) VALUES ({values}) "
        f"ON CONFLICT({primary_key}) DO UPDATE SET {updates};\n"
    )


def delete_document_chunks_by_source_url(source_url):
    return (
        "DELETE FROM pdf_chunks "
        f"WHERE document_id IN (SELECT document_id FROM pdf_documents WHERE source_url = {sql_value(source_url)});\n"
    )


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


if __name__ == "__main__":
    main()
