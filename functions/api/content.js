import {
  applyPermalinkChange,
  json,
  mapContent,
  normalizePath,
  requireAdmin,
  resolvePermalink,
  slugify,
} from "../_lib/cms.js";
import { bustPaths } from "../_lib/seo.js";

/** @type {PagesFunction} */
export const onRequestOptions = async () => json(null, 204);

function nowIso() {
  return new Date().toISOString();
}

function liveWhere() {
  return `(status = 'published' OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?))`;
}

/** @type {PagesFunction<Env>} */
export const onRequestGet = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const path = normalizePath(url.searchParams.get("path") ?? "");
  const type = url.searchParams.get("type");
  const categoryPath = normalizePath(url.searchParams.get("category") ?? "");
  const isAdmin = requireAdmin(context);
  const now = nowIso();
  const db = context.env.DB;

  if (id) {
    if (!isAdmin) return json({ error: "Unauthorized" }, 401);
    const row = await db.prepare(`SELECT * FROM contents WHERE id = ?`).bind(id).first();
    if (!row) return json({ error: "Not found" }, 404);
    return json({ content: mapContent(row) });
  }

  if (path) {
    const resolved = await resolveIncomingPath(db, path, { preview: isAdmin, now });
    if (resolved.status === "content") return json({ content: resolved.content });
    if (resolved.status === "redirect") return json({ redirect: resolved.to });
    if (resolved.status === "category") {
      return json({ category: resolved.category, contents: resolved.contents });
    }
    return json({ error: "Not found" }, 404);
  }

  if (categoryPath) {
    const category = await db
      .prepare(`SELECT * FROM categories WHERE path = ?`)
      .bind(categoryPath)
      .first();
    if (!category) return json({ error: "Not found" }, 404);
    const { results } = await db
      .prepare(
        `SELECT * FROM contents
         WHERE type = 'post' AND category_id = ? AND ${liveWhere()}
         ORDER BY COALESCE(published_at, created_at) DESC
         LIMIT 100`,
      )
      .bind(category.id, now)
      .all();
    return json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
      },
      contents: (results ?? []).map(mapContent),
    });
  }

  const wantedType = type === "page" ? "page" : type === "post" ? "post" : null;

  if (isAdmin) {
    const sql = wantedType
      ? `SELECT * FROM contents WHERE type = ? ORDER BY updated_at DESC LIMIT 300`
      : `SELECT * FROM contents ORDER BY updated_at DESC LIMIT 300`;
    const stmt = wantedType
      ? db.prepare(sql).bind(wantedType)
      : db.prepare(sql);
    const { results } = await stmt.all();
    return json({ contents: (results ?? []).map(mapContent) });
  }

  if (!wantedType) {
    const { results } = await db
      .prepare(
        `SELECT * FROM contents WHERE type = 'post' AND ${liveWhere()}
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT 100`,
      )
      .bind(now)
      .all();
    return json({ contents: (results ?? []).map(mapContent) });
  }

  const { results } = await db
    .prepare(
      `SELECT * FROM contents WHERE type = ? AND ${liveWhere()}
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 100`,
    )
    .bind(wantedType, now)
    .all();
  return json({ contents: (results ?? []).map(mapContent) });
};

function normalizeStatus(body) {
  if (body.status === "published") return "published";
  if (body.status === "scheduled") return "scheduled";
  return "draft";
}

function timestampsFor(status, scheduledAt, current) {
  const now = nowIso();
  let publishedAt = current?.published_at ?? null;
  let nextScheduled = null;

  if (status === "published") {
    publishedAt = publishedAt || now;
  } else if (status === "scheduled") {
    nextScheduled = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    if (!nextScheduled) throw new Error("scheduledAt is required");
    publishedAt = nextScheduled;
  } else {
    publishedAt = null;
  }

  return { publishedAt, scheduledAt: nextScheduled };
}

async function writeContent(db, body, current) {
  const type = current?.type ?? (body.type === "page" ? "page" : "post");
  const title = String(body.title ?? current?.title ?? "").trim().slice(0, 160);
  const excerpt = String(body.excerpt ?? current?.excerpt ?? "").trim().slice(0, 400);
  const content = String(body.content ?? current?.content ?? "").slice(0, 100_000);
  const seoTitle = String(body.seoTitle ?? current?.seo_title ?? "").trim().slice(0, 70);
  const metaDescription = String(body.metaDescription ?? current?.meta_description ?? "")
    .trim()
    .slice(0, 180);
  const featuredImage = String(body.featuredImage ?? current?.featured_image ?? "")
    .trim()
    .slice(0, 500);
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
    : (() => {
        try {
          return JSON.parse(current?.tags_json || "[]");
        } catch {
          return [];
        }
      })();
  const slug = slugify(body.slug || title) || current?.slug;
  const status = normalizeStatus(body);
  const parentId =
    type === "page"
      ? body.parentId === undefined
        ? current?.parent_id ?? null
        : body.parentId || null
      : null;
  const categoryId =
    type === "post"
      ? body.categoryId === undefined
        ? current?.category_id ?? null
        : body.categoryId || null
      : null;

  if (!title || !slug) throw new Error("Title is required");
  if (current && parentId === current.id) throw new Error("A page cannot be its own parent");

  const permalink = await resolvePermalink(db, type, { slug, parentId, categoryId });
  const times = timestampsFor(status, body.scheduledAt, current);

  return {
    type,
    title,
    slug,
    excerpt,
    content,
    seoTitle,
    metaDescription,
    featuredImage,
    tagsJson: JSON.stringify(tags),
    status,
    parentId,
    categoryId,
    permalink,
    ...times,
  };
}

/** @type {PagesFunction<Env>} */
export const onRequestPost = async (context) => {
  if (!requireAdmin(context)) return json({ error: "Unauthorized" }, 401);
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    const next = await writeContent(context.env.DB, body, null);
    const clash = await context.env.DB
      .prepare(`SELECT id FROM contents WHERE permalink = ?`)
      .bind(next.permalink)
      .first();
    if (clash) return json({ error: "Another item already uses that permalink" }, 409);

    const id = crypto.randomUUID();
    const now = nowIso();
    await context.env.DB
      .prepare(
        `INSERT INTO contents (
          id, type, parent_id, category_id, title, slug, permalink,
          excerpt, content, status, published_at, scheduled_at,
          seo_title, meta_description, featured_image, tags_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        next.type,
        next.parentId,
        next.categoryId,
        next.title,
        next.slug,
        next.permalink,
        next.excerpt,
        next.content,
        next.status,
        next.publishedAt,
        next.scheduledAt,
        next.seoTitle,
        next.metaDescription,
        next.featuredImage,
        next.tagsJson,
        now,
        now,
      )
      .run();

    const row = await context.env.DB
      .prepare(`SELECT * FROM contents WHERE id = ?`)
      .bind(id)
      .first();
    context.waitUntil(bustPaths(context.request.url, [next.permalink]));
    return json({ content: mapContent(row) }, 201);
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
    .prepare(`SELECT * FROM contents WHERE id = ?`)
    .bind(id)
    .first();
  if (!current) return json({ error: "Not found" }, 404);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    const next = await writeContent(context.env.DB, body, current);
    const now = nowIso();
    await context.env.DB
      .prepare(
        `UPDATE contents SET
          parent_id = ?, category_id = ?, title = ?, slug = ?, excerpt = ?,
          content = ?, status = ?, published_at = ?, scheduled_at = ?,
          seo_title = ?, meta_description = ?, featured_image = ?, tags_json = ?,
          updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        next.parentId,
        next.categoryId,
        next.title,
        next.slug,
        next.excerpt,
        next.content,
        next.status,
        next.publishedAt,
        next.scheduledAt,
        next.seoTitle,
        next.metaDescription,
        next.featuredImage,
        next.tagsJson,
        now,
        id,
      )
      .run();
    await applyPermalinkChange(context.env.DB, current, next.permalink);

    const row = await context.env.DB
      .prepare(`SELECT * FROM contents WHERE id = ?`)
      .bind(id)
      .first();
    context.waitUntil(
      bustPaths(context.request.url, [current.permalink, next.permalink]),
    );
    return json({ content: mapContent(row) });
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
    .prepare(`SELECT id FROM contents WHERE parent_id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (child) {
    return json({ error: "Move or delete child pages first" }, 409);
  }

  const current = await context.env.DB
    .prepare(`SELECT permalink FROM contents WHERE id = ?`)
    .bind(id)
    .first();

  const result = await context.env.DB
    .prepare(`DELETE FROM contents WHERE id = ?`)
    .bind(id)
    .run();
  if (!result.meta.changes) return json({ error: "Not found" }, 404);
  if (current?.permalink) {
    context.waitUntil(bustPaths(context.request.url, [current.permalink]));
  }
  return json({ ok: true });
};
