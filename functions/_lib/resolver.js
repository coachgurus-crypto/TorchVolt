import { isLive, mapContent, normalizePath } from "./cms.js";

export async function resolveIncomingPath(db, pathname, { preview = false, now = new Date().toISOString() } = {}) {
  let path = normalizePath(pathname);
  const seen = new Set();

  for (let hop = 0; hop < 8; hop += 1) {
    if (!path || seen.has(path)) return { status: "not_found" };
    seen.add(path);

    const row = await db
      .prepare(`SELECT * FROM contents WHERE permalink = ?`)
      .bind(path)
      .first();

    if (row && (preview || isLive(row, now))) {
      if (row.permalink !== path) {
        return { status: "redirect", to: `/${row.permalink}` };
      }
      return { status: "content", content: mapContent(row) };
    }

    const redirected = await db
      .prepare(`SELECT to_path FROM permalink_redirects WHERE from_path = ?`)
      .bind(path)
      .first();
    if (redirected?.to_path) {
      path = normalizePath(redirected.to_path);
      if (hop === 7) return { status: "redirect", to: `/${path}` };
      continue;
    }

    const catPath = path.startsWith("blog/") ? path.slice(5) : path;
    const category = catPath
      ? await db.prepare(`SELECT * FROM categories WHERE path = ?`).bind(catPath).first()
      : null;
    if (category) {
      const { results } = await db
        .prepare(
          `SELECT * FROM contents
           WHERE type = 'post' AND category_id = ?
             AND (status = 'published' OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?))
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT 100`,
        )
        .bind(category.id, now)
        .all();
      return {
        status: "category",
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          path: category.path,
        },
        contents: (results ?? []).map(mapContent),
      };
    }

    return { status: "not_found" };
  }

  return { status: "not_found" };
}

export function isCmsCandidatePath(pathname) {
  const path = normalizePath(pathname);
  if (!path) return false;
  const head = path.split("/")[0];
  if (
    ["admin", "api", "size", "blog", "read", "view"].includes(path) ||
    head === "api" ||
    head.startsWith("_")
  ) {
    return false;
  }
  if (/\.[a-z0-9]{1,8}$/i.test(path)) return false;
  return true;
}
