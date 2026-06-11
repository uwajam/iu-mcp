CREATE TABLE IF NOT EXISTS courses (
  url TEXT PRIMARY KEY,
  course_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'ibaraki',
  academic_year INTEGER NOT NULL,
  course_number TEXT,
  syllabus_id TEXT,
  department TEXT,
  timetable_code TEXT,
  numbering TEXT,
  title TEXT,
  alternate_title TEXT,
  instructors TEXT,
  instructors_json TEXT,
  credits REAL,
  year_level TEXT,
  term TEXT,
  schedule TEXT,
  schedule_days_json TEXT,
  schedule_periods_json TEXT,
  target_year TEXT,
  overview TEXT,
  remarks TEXT,
  official_url TEXT,
  source_url TEXT,
  detail_language TEXT,
  detail_fields_json TEXT,
  sections_json TEXT,
  html_r2_key TEXT,
  served_from TEXT,
  detail_fetched_at TEXT,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_year ON courses(academic_year);
CREATE INDEX IF NOT EXISTS idx_courses_course_id ON courses(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_syllabus ON courses(academic_year, syllabus_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_number ON courses(academic_year, course_number);
CREATE INDEX IF NOT EXISTS idx_courses_timetable_code ON courses(academic_year, timetable_code);
CREATE INDEX IF NOT EXISTS idx_courses_term ON courses(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_courses_schedule ON courses(academic_year, schedule);
CREATE INDEX IF NOT EXISTS idx_courses_title ON courses(academic_year, title);

CREATE TABLE IF NOT EXISTS pdf_documents (
  document_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  academic_year INTEGER,
  category TEXT,
  page_count INTEGER,
  fetched_at TEXT NOT NULL,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pdf_files (
  file_id TEXT PRIMARY KEY,
  source_page_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT,
  content_sha256 TEXT NOT NULL,
  etag TEXT,
  last_modified TEXT,
  content_length INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  document_id TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  imported_at TEXT,
  missing_at TEXT,
  UNIQUE (source_url, content_sha256)
);

CREATE TABLE IF NOT EXISTS pdf_chunks (
  chunk_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  heading TEXT,
  text TEXT NOT NULL,
  text_normalized TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES pdf_documents(document_id)
);

CREATE INDEX IF NOT EXISTS idx_pdf_files_source_url ON pdf_files(source_url);
CREATE INDEX IF NOT EXISTS idx_pdf_files_status ON pdf_files(status);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_document ON pdf_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_page ON pdf_chunks(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_text ON pdf_chunks(text_normalized);
