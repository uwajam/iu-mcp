import argparse
import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "work" / "ibaraki_syllabus.sqlite"
DEFAULT_OUT = ROOT / "work" / "d1_seed.sql"

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
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(args.db) as conn, out_path.open("w", encoding="utf-8", newline="\n") as f:
        conn.row_factory = sqlite3.Row
        f.write("BEGIN TRANSACTION;\n")
        sql = "SELECT * FROM courses ORDER BY academic_year, timetable_code, title"
        if args.limit > 0:
            sql += f" LIMIT {args.limit}"
        count = 0
        for row in conn.execute(sql):
            values = [sql_literal(row_value(row, column)) for column in EXPORT_COLUMNS]
            f.write(
                f"INSERT OR REPLACE INTO courses ({', '.join(EXPORT_COLUMNS)}) VALUES ({', '.join(values)});\n"
            )
            count += 1
        f.write("COMMIT;\n")

    print(json.dumps({"ok": True, "out": str(out_path), "rows": count}, ensure_ascii=False, indent=2))


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
