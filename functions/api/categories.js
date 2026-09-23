import {
  json,
  mapCategory,
  rebuildCategoryPath,
  requireAdmin,
  retargetCategoryPosts,
  slugify,
} from "../_lib/cms.js";

/** @type {PagesFunction} */
export const onRequestOptions = async () => json(null, 204);

/** @type {PagesFunction<Env>} */
export const onRequestGet = async (context) => {
  const { results } = await context.env.DB.prepare(
    `SELECT * FROM categories ORDER BY path ASC`,
  ).all();
  return json({ categories: (results ?? []).map(mapCategory) });
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

  const name = String(body.name ?? "").trim().slice(0, 80);
  const slug = slugify(body.slug || name);
  const parentId = body.parentId || null;
  if (!name || !slug) return json({ error: "Name is required" }, 400);

  try {
    const path = await rebuildCategoryPath(context.env.DB, {
      slug,
      parent_id: parentId,
    });
    const clash = await context.env.DB
      .prepare(`SELECT id FROM categories WHERE path = ?`)
      .bind(path)
      .first();
    if (clash) return json({ error: "That category path already exists" }, 409);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await context.env.DB
      .prepare(
        `INSERT INTO categories (id, parent_id, name, slug, path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, parentId, name, slug, path, now, now)
      .run();
    const row = await context.env.DB
      .prepare(`SELECT * FROM categories WHERE id = ?`)
      .bind(id)
      .first();
    return json({ category: mapCategory(row) }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not create" }, 400);
  }
};

/** @type {PagesFunction<Env>} */
export const onRequestPut = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const current = await context.env.DB
    .prepare(`SELECT * FROM categories WHERE id = ?`)
    .bind(id)
    .first();
  if (!current) return json({ error: "Not found" }, 404);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = String(body.name ?? current.name).trim().slice(0, 80);
  const slug = slugify(body.slug || name) || current.slug;
  const parentId = body.parentId === undefined ? current.parent_id : body.parentId || null;
  if (parentId === id) return json({ error: "A category cannot be its own parent" }, 400);

  try {
    const path = await rebuildCategoryPath(context.env.DB, {
      slug,
      parent_id: parentId,
    });
    const clash = await context.env.DB
      .prepare(`SELECT id FROM categories WHERE path = ? AND id != ?`)
      .bind(path, id)
      .first();
    if (clash) return json({ error: "That category path already exists" }, 409);

    const now = new Date().toISOString();
    await context.env.DB
      .prepare(
        `UPDATE categories SET parent_id = ?, name = ?, slug = ?, path = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(parentId, name, slug, path, now, id)
      .run();

    if (path !== current.path) {
      await retargetCategoryPosts(context.env.DB, id, path, current.path);
    }

    const row = await context.env.DB
      .prepare(`SELECT * FROM categories WHERE id = ?`)
      .bind(id)
      .first();
    return json({ category: mapCategory(row) });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not update" }, 400);
  }
};

/** @type {PagesFunction<Env>} */
export const onRequestDelete = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const child = await context.env.DB
    .prepare(`SELECT id FROM categories WHERE parent_id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (child) return json({ error: "Move or delete child categories first" }, 409);

  const post = await context.env.DB
    .prepare(`SELECT id FROM contents WHERE category_id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (post) return json({ error: "Reassign posts in this category first" }, 409);

  const result = await context.env.DB
    .prepare(`DELETE FROM categories WHERE id = ?`)
    .bind(id)
    .run();
  if (!result.meta.changes) return json({ error: "Not found" }, 404);
  return json({ ok: true });
};
