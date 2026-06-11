export async function searchDocuments(db, args) {
  const limit = clampInt(args.limit ?? args.pageSize, 1, 20, 10);
  const query = String(args.q ?? args.query ?? "").trim();
  const where = [];
  const values = [];

  if (query) {
    const like = `%${escapeLike(normalizeText(query))}%`;
    where.push(`(
      c.text_normalized LIKE ? ESCAPE '\\'
      OR lower(c.heading) LIKE ? ESCAPE '\\'
      OR lower(d.title) LIKE ? ESCAPE '\\'
      OR lower(d.source_url) LIKE ? ESCAPE '\\'
    )`);
    values.push(like, like, like, like);
  }

  if (args.documentId) {
    where.push("d.document_id = ?");
    values.push(String(args.documentId));
  }

  let sql = `
    SELECT
      d.document_id,
      d.title,
      d.source_url,
      d.academic_year,
      d.category,
      c.chunk_id,
      c.page_number,
      c.heading,
      c.text
    FROM pdf_chunks c
    JOIN pdf_documents d ON d.document_id = c.document_id
  `;
  if (where.length) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }
  sql += " ORDER BY d.document_id ASC, c.page_number ASC, c.chunk_index ASC LIMIT ?";
  values.push(limit);

  const result = await db.prepare(sql).bind(...values).all();
  return (result.results ?? []).map(rowToSearchResult);
}

function rowToSearchResult(row) {
  return {
    documentId: row.document_id,
    documentTitle: row.title,
    document_title: row.title,
    title: row.title,
    source_url: row.source_url,
    sourceUrl: row.source_url,
    academicYear: row.academic_year,
    category: row.category,
    chunkId: row.chunk_id,
    page: row.page_number,
    heading: row.heading,
    chunkText: row.text
  };
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").toLowerCase();
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, match => `\\${match}`);
}

function clampInt(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}
