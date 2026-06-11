import argparse
import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "work" / "ibaraki_syllabus.sqlite"
DEFAULT_OUT = ROOT / "work" / "d1_seed.sql"
DEFAULT_CHUNK_DIR = ROOT / "work" / "d1_seed"

EXPORT_COLUMNS = [
    "url",
    "course_id",
    "source",
    "academic_year",
    "course_number",
    "syllabus_id",
    "department",
    "timetable_code",
    "numbering",
    "title",
    "alternate_title",
    "instructors",
    "instructors_json",
    "credits",
    "year_level",
    "term",
    "schedule",
    "schedule_days_json",
    "schedule_periods_json",
    "target_year",
    "overview",
    "remarks",
    "official_url",
    "source_url",
    "detail_language",
    "detail_fields_json",
    "sections_json",
    "html_r2_key",
    "served_from",
    "detail_fetched_at",
    "fetched_at",
]


def main():
    parser = argparse.ArgumentParser(description="Export local SQLite syllabus rows as a D1 seed SQL file.")
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--chunk-dir", default="")
    parser.add_argument("--chunk-size", type=int, default=0)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    with sqlite3.connect(args.db) as conn:
        conn.row_factory = sqlite3.Row
        sql = "SELECT * FROM courses ORDER BY academic_year, timetable_code, title"
        if args.limit > 0:
            sql += f" LIMIT {args.limit}"
        rows = conn.execute(sql)

        if args.chunk_size > 0:
            chunk_dir = Path(args.chunk_dir) if args.chunk_dir else DEFAULT_CHUNK_DIR
            result = write_chunks(rows, chunk_dir, args.chunk_size)
        else:
            out_path = Path(args.out)
            result = write_single(rows, out_path)

    print(json.dumps({"ok": True, **result}, ensure_ascii=False, indent=2))


def write_single(rows, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with out_path.open("w", encoding="utf-8", newline="\n") as f:
        write_begin(f)
        for row in rows:
            write_insert(f, row)
            count += 1
        write_commit(f)
    return {"out": str(out_path), "rows": count}


def write_chunks(rows, chunk_dir, chunk_size):
    chunk_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    chunk_index = 0
    current_file = None
    current_path = None
    files = []

    try:
        for row in rows:
            if count % chunk_size == 0:
                if current_file:
                    write_commit(current_file)
                    current_file.close()
                chunk_index += 1
                current_path = chunk_dir / f"{chunk_index:04d}.sql"
                files.append(str(current_path))
                current_file = current_path.open("w", encoding="utf-8", newline="\n")
                write_begin(current_file)
            write_insert(current_file, row)
            count += 1
    finally:
        if current_file:
            write_commit(current_file)
            current_file.close()

    return {"chunkDir": str(chunk_dir), "chunkSize": chunk_size, "chunks": len(files), "files": files, "rows": count}


def write_begin(f):
    return None


def write_commit(f):
    return None


def write_insert(f, row):
    values = [sql_literal(row_value(row, column)) for column in EXPORT_COLUMNS]
    f.write(f"INSERT OR REPLACE INTO courses ({', '.join(EXPORT_COLUMNS)}) VALUES ({', '.join(values)});\n")


def row_value(row, column):
    if column == "html_r2_key":
        return None
    try:
        return row[column]
    except (KeyError, IndexError):
        return None


def sql_literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


if __name__ == "__main__":
    main()
