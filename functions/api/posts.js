/**
 * @typedef {{
 *   DB: D1Database,
 *   DASHBOARD_PIN: string,
 * }} Env
 */

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Pin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
}

function requireAdmin(context) {
  const pin = (context.request.headers.get("X-Admin-Pin") ?? "").trim();
  const expected = String(context.env.DASHBOARD_PIN ?? "").trim();
  return Boolean(expected && pin && pin === expected);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapPost(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    publishedAt: row.published_at,
  };
}

/** @type {PagesFunction} */
export const onRequestOptions = async () => json(null, 204);

/** @type {PagesFunction<Env>} */
export const onRequestGet = async (context) => {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  const id = url.searchParams.get("id");
  const isAdmin = requireAdmin(context);

  if (id) {
    if (!isAdmin) return json({ error: "Unauthorized" }, 401);
    const row = await context.env.DB.prepare(`SELECT * FROM posts WHERE id = ?`)
      .bind(id)
      .first();
    if (!row) return json({ error: "Not found" }, 404);
    return json({ post: mapPost(row) });
  }

  if (slug) {
    const row = await context.env.DB.prepare(`SELECT * FROM posts WHERE slug = ?`)
      .bind(slug)
      .first();
    if (!row) return json({ error: "Not found" }, 404);
    if (row.status !== "published" && !isAdmin) {
      return json({ error: "Not found" }, 404);
    }
    return json({ post: mapPost(row) });
  }

  if (isAdmin) {
    const { results } = await context.env.DB.prepare(
      `SELECT * FROM posts ORDER BY updated_at DESC LIMIT 200`,
    ).all();
    return json({ posts: (results ?? []).map(mapPost) });
  }

  const { results } = await context.env.DB.prepare(
    `SELECT * FROM posts
     WHERE status = 'published'
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT 100`,
  ).all();
  return json({ posts: (results ?? []).map(mapPost) });
};

/** @type {PagesFunction<Env>} */
export const onRequestPost = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const title = String(body.title ?? "").trim().slice(0, 160);
  const excerpt = String(body.excerpt ?? "").trim().slice(0, 400);
  const content = String(body.content ?? "").slice(0, 100_000);
  const status = body.status === "published" ? "published" : "draft";
  let slug = slugify(body.slug || title);

  if (!title || !slug) {
    return json({ error: "Title is required" }, 400);
  }

  const existing = await context.env.DB.prepare(
    `SELECT id FROM posts WHERE slug = ?`,
  )
    .bind(slug)
    .first();
  if (existing) {
    slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const publishedAt = status === "published" ? now : null;

  await context.env.DB.prepare(
    `INSERT INTO posts (
      id, created_at, updated_at, title, slug, excerpt, content, status, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, now, now, title, slug, excerpt, content, status, publishedAt)
    .run();

  const row = await context.env.DB.prepare(`SELECT * FROM posts WHERE id = ?`)
    .bind(id)
    .first();
  return json({ post: mapPost(row) }, 201);
};

/** @type {PagesFunction<Env>} */
export const onRequestPut = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const current = await context.env.DB.prepare(`SELECT * FROM posts WHERE id = ?`)
    .bind(id)
    .first();
  if (!current) return json({ error: "Not found" }, 404);

  const title = String(body.title ?? current.title).trim().slice(0, 160);
  const excerpt = String(body.excerpt ?? current.excerpt).trim().slice(0, 400);
  const content = String(body.content ?? current.content).slice(0, 100_000);
  const status = body.status === "published" ? "published" : "draft";
  let slug = slugify(body.slug || title) || current.slug;

  if (!title || !slug) {
    return json({ error: "Title is required" }, 400);
  }

  const clash = await context.env.DB.prepare(
    `SELECT id FROM posts WHERE slug = ? AND id != ?`,
  )
    .bind(slug, id)
    .first();
  if (clash) {
    return json({ error: "Another post already uses that slug" }, 409);
  }

  const now = new Date().toISOString();
  let publishedAt = current.published_at;
  if (status === "published" && !publishedAt) publishedAt = now;
  if (status === "draft") publishedAt = null;

  await context.env.DB.prepare(
    `UPDATE posts SET
      updated_at = ?, title = ?, slug = ?, excerpt = ?, content = ?,
      status = ?, published_at = ?
     WHERE id = ?`,
  )
    .bind(now, title, slug, excerpt, content, status, publishedAt, id)
    .run();

  const row = await context.env.DB.prepare(`SELECT * FROM posts WHERE id = ?`)
    .bind(id)
    .first();
  return json({ post: mapPost(row) });
};

/** @type {PagesFunction<Env>} */
export const onRequestDelete = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const result = await context.env.DB.prepare(`DELETE FROM posts WHERE id = ?`)
    .bind(id)
    .run();

  if (!result.meta.changes) return json({ error: "Not found" }, 404);
  return json({ ok: true });
};
