export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "size",
  "blog",
  "read",
  "view",
  "portal",
  "partner",
]);

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Pin",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
  });
}

export function requireAdmin(context) {
  const pin = (context.request.headers.get("X-Admin-Pin") ?? "").trim();
  const expected = String(context.env.DASHBOARD_PIN ?? "").trim();
  if (!expected) return false;
  return Boolean(pin && pin === expected);
}

/** Distinguishes missing server config from a wrong PIN (no secrets leaked). */
export function adminAuthError(context) {
  const expected = String(context.env.DASHBOARD_PIN ?? "").trim();
  if (!expected) {
    return {
      error: "Admin PIN is not configured on the server (DASHBOARD_PIN).",
      status: 503,
    };
  }
  return { error: "Unauthorized", status: 401 };
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizePath(value) {
  return String(value ?? "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

export function mapCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    path: row.path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContent(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    categoryId: row.category_id,
    title: row.title,
    slug: row.slug,
    permalink: row.permalink,
    excerpt: row.excerpt,
    content: row.content,
    status: row.status,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    seoTitle: row.seo_title ?? "",
    metaDescription: row.meta_description ?? "",
    featuredImage: row.featured_image ?? "",
    tags: (() => {
      try {
        const parsed = JSON.parse(row.tags_json || "[]");
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    })(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isLive(row, nowIso) {
  if (row.status === "published") return true;
  if (row.status === "scheduled" && row.scheduled_at && row.scheduled_at <= nowIso) {
    return true;
  }
  return false;
}

export async function resolvePermalink(db, type, { slug, parentId, categoryId }) {
  if (type === "page") {
    if (parentId) {
      const parent = await db
        .prepare(`SELECT permalink FROM contents WHERE id = ? AND type = 'page'`)
        .bind(parentId)
        .first();
      if (!parent) throw new Error("Parent page not found");
      return `${parent.permalink}/${slug}`;
    }
    if (RESERVED_SLUGS.has(slug)) {
      throw new Error(`“/${slug}” is reserved`);
    }
    return slug;
  }

  if (categoryId) {
    const category = await db
      .prepare(`SELECT path FROM categories WHERE id = ?`)
      .bind(categoryId)
      .first();
    if (!category) throw new Error("Category not found");
    return `blog/${category.path}/${slug}`;
  }
  return `blog/${slug}`;
}

export async function recordRedirect(db, fromPath, toPath) {
  if (!fromPath || !toPath || fromPath === toPath) return;
  await db
    .prepare(
      `INSERT INTO permalink_redirects (id, from_path, to_path, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(from_path) DO UPDATE SET to_path = excluded.to_path`,
    )
    .bind(crypto.randomUUID(), fromPath, toPath, new Date().toISOString())
    .run();
  await db
    .prepare(`DELETE FROM permalink_redirects WHERE from_path = ?`)
    .bind(toPath)
    .run();
}

export async function applyPermalinkChange(db, row, nextPermalink) {
  if (row.permalink === nextPermalink) return;
  const clash = await db
    .prepare(`SELECT id FROM contents WHERE permalink = ? AND id != ?`)
    .bind(nextPermalink, row.id)
    .first();
  if (clash) throw new Error("Another item already uses that permalink");

  await db
    .prepare(`UPDATE contents SET permalink = ? WHERE id = ?`)
    .bind(nextPermalink, row.id)
    .run();
  await recordRedirect(db, row.permalink, nextPermalink);

  const { results: children } = await db
    .prepare(`SELECT * FROM contents WHERE parent_id = ?`)
    .bind(row.id)
    .all();
  for (const child of children ?? []) {
    await applyPermalinkChange(db, child, `${nextPermalink}/${child.slug}`);
  }
}

export async function rebuildCategoryPath(db, category) {
  let path = category.slug;
  if (category.parent_id) {
    const parent = await db
      .prepare(`SELECT path FROM categories WHERE id = ?`)
      .bind(category.parent_id)
      .first();
    if (!parent) throw new Error("Parent category not found");
    path = `${parent.path}/${category.slug}`;
  }
  return path;
}

export async function retargetCategoryPosts(db, categoryId, newPath, oldPath) {
  const { results } = await db
    .prepare(`SELECT * FROM contents WHERE category_id = ?`)
    .bind(categoryId)
    .all();
  for (const row of results ?? []) {
    const next = `blog/${newPath}/${row.slug}`;
    await applyPermalinkChange(db, row, next);
  }
  const { results: children } = await db
    .prepare(`SELECT * FROM categories WHERE parent_id = ?`)
    .bind(categoryId)
    .all();
  for (const child of children ?? []) {
    const childPath = `${newPath}/${child.slug}`;
    if (child.path !== childPath) {
      await db
        .prepare(`UPDATE categories SET path = ?, updated_at = ? WHERE id = ?`)
        .bind(childPath, new Date().toISOString(), child.id)
        .run();
    }
    await retargetCategoryPosts(db, child.id, childPath, child.path);
  }
}
