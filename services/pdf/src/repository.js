export async function searchDocuments(db, args) {
  const limit = clampInt(args.limit ?? args.pageSize, 1, 20, 10);
  const queries = normalizeQueries(args);
  const includeToc = Boolean(args.includeToc);
  const where = [];
  const values = [];
  let scoreSql = "0";
  let scoreValues = [];

  if (queries.length) {
    const tokens = uniqueTokens(queries.flatMap(queryTokens));
    const tokenConditions = [];
    const scoreParts = [];
    for (const token of tokens) {
      const like = `%${escapeLike(token)}%`;
      const condition = `(
        c.text_normalized LIKE ? ESCAPE '\\'
        OR lower(c.heading) LIKE ? ESCAPE '\\'
        OR lower(d.title) LIKE ? ESCAPE '\\'
        OR lower(d.source_url) LIKE ? ESCAPE '\\'
      )`;
      tokenConditions.push(condition);
      values.push(like, like, like, like);
      scoreParts.push(`CASE WHEN ${condition} THEN 1 ELSE 0 END`);
      scoreValues.push(like, like, like, like);
    }
    where.push(`(${tokenConditions.join(" OR ")})`);
    const tocPenalty = includeToc ? "0" : `CASE WHEN ${TOC_SQL} THEN 4 ELSE 0 END`;
    scoreSql = `(${scoreParts.join(" + ")}) - ${tocPenalty}`;
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
      c.text,
      (${scoreSql}) AS match_score,
      CASE WHEN ${TOC_SQL} THEN 1 ELSE 0 END AS is_toc
    FROM pdf_chunks c
    JOIN pdf_documents d ON d.document_id = c.document_id
  `;
  if (where.length) {
    sql += ` WHERE ${where.join(" AND ")}`;
  }
  if (!includeToc) {
    sql += where.length ? ` AND NOT (${TOC_SQL})` : ` WHERE NOT (${TOC_SQL})`;
  }
  sql += " ORDER BY match_score DESC, d.document_id ASC, c.page_number ASC, c.chunk_index ASC LIMIT ?";
  values.unshift(...scoreValues);
  values.push(limit);

  const result = await db.prepare(sql).bind(...values).all();
  return (result.results ?? []).map(rowToSearchResult);
}

const TOC_SQL = `(
  c.heading = '目 次'
  OR c.heading = '目次'
  OR c.text LIKE '目 次%'
  OR c.text LIKE '目次%'
  OR c.text LIKE '%････････%'
)`;

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
    isToc: Boolean(row.is_toc),
    chunkText: row.text
  };
}

function normalizeQueries(args) {
  const values = [];
  if (Array.isArray(args.queries)) {
    values.push(...args.queries);
  }
  values.push(args.q, args.query);
  return [...new Set(values.map(value => String(value ?? "").trim()).filter(Boolean))];
}

function normalizeText(value) {
  return String(value).normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function queryTokens(value) {
  const normalized = normalizeText(value);
  return normalized.split(/\s+/).filter(Boolean);
}

function uniqueTokens(tokens) {
  return [...new Set(tokens.filter(token => token.length > 0))];
}

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, match => `\\${match}`);
}

function clampInt(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(minimum, Math.min(maximum, number));
}
