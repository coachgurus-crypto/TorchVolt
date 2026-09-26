import { json, requireAdmin } from "../_lib/cms.js";
import { DEFAULT_HOMEPAGE_COPY, mergeHomepageCopy } from "../_lib/homepage.js";

/** @type {PagesFunction} */
export const onRequestOptions = async () => json(null, 204);

async function ensureTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS homepage_copy (
        id TEXT PRIMARY KEY CHECK (id = 'main'),
        json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      )`,
    )
    .run();
}

async function readCopy(db) {
  await ensureTable(db);
  const row = await db
    .prepare(`SELECT json FROM homepage_copy WHERE id = 'main'`)
    .first();
  if (!row?.json) return mergeHomepageCopy(DEFAULT_HOMEPAGE_COPY);
  try {
    return mergeHomepageCopy(JSON.parse(row.json));
  } catch {
    return mergeHomepageCopy(DEFAULT_HOMEPAGE_COPY);
  }
}

/** @type {PagesFunction<{ DB: D1Database, DASHBOARD_PIN: string }>} */
export const onRequestGet = async (context) => {
  const copy = await readCopy(context.env.DB);
  return json({ copy });
};

/** @type {PagesFunction<{ DB: D1Database, DASHBOARD_PIN: string }>} */
export const onRequestPut = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const copy = mergeHomepageCopy(body?.copy ?? body);
  const updatedAt = new Date().toISOString();
  await ensureTable(context.env.DB);
  await context.env.DB.prepare(
    `INSERT INTO homepage_copy (id, json, updated_at)
     VALUES ('main', ?, ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
  )
    .bind(JSON.stringify(copy), updatedAt)
    .run();

  return json({ copy, updatedAt });
};
