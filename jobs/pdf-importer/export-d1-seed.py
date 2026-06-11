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
    args = parser.parse_args()

    with sqlite3.connect(args.db) as conn:
        conn.row_factory = sqlite3.Row
        statements = list(build_statements(conn))

    if args.chunk_size > 0:
        chunk_dir = Path(args.chunk_dir) if args.chunk_dir else DEFAULT_CHUNK_DIR
        result = write_chunks(statements, chunk_dir, args.chunk_size)
    else:
        result = write_single(statements, Path(args.out))

    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))


def build_statements(conn):
    yield "DELETE FROM pdf_chunks;\n"
    yield "DELETE FROM pdf_documents;\n"
    for row in conn.execute("SELECT * FROM pdf_documents ORDER BY document_id"):
        yield insert_sql("pdf_documents", DOCUMENT_COLUMNS, row)
    for row in conn.execute("SELECT * FROM pdf_chunks ORDER BY document_id, chunk_index"):
        yield insert_sql("pdf_chunks", CHUNK_COLUMNS, row)


def write_single(statements, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with out_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write("BEGIN TRANSACTION;\n")
        for statement in statements:
            f.write(statement)
            count += 1
        f.write("COMMIT;\n")
    return {"out": str(out_path), "statements": count}


def write_chunks(statements, chunk_dir, chunk_size):
    chunk_dir.mkdir(parents=True, exist_ok=True)
    files = []
    current = []
    for statement in statements:
        current.append(statement)
        if len(current) >= chunk_size:
            files.append(write_chunk(chunk_dir, len(files) + 1, current))
            current = []
    if current:
        files.append(write_chunk(chunk_dir, len(files) + 1, current))
    return {"chunkDir": str(chunk_dir), "files": files}


def write_chunk(chunk_dir, index, statements):
    path = chunk_dir / f"{index:04d}.sql"
    with path.open("w", encoding="utf-8", newline="\n") as f:
        f.write("BEGIN TRANSACTION;\n")
        for statement in statements:
            f.write(statement)
        f.write("COMMIT;\n")
    return str(path)


def insert_sql(table, columns, row):
    quoted = ", ".join(columns)
    values = ", ".join(sql_value(row[column]) for column in columns)
    return f"INSERT OR REPLACE INTO {table} ({quoted}) VALUES ({values});\n"


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


if __name__ == "__main__":
    main()
