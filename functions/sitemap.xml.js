import { mapCategory, mapContent } from "./_lib/cms.js";

function liveWhere() {
  return `(status = 'published' OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?))`;
}

/** @type {PagesFunction} */
export async function onRequestGet(context) {
  const origin = new URL(context.request.url).origin;
  const now = new Date().toISOString();
  const urls = [`${origin}/`, `${origin}/blog`, `${origin}/size`];

  const { results: posts } = await context.env.DB.prepare(
    `SELECT * FROM contents WHERE ${liveWhere()} ORDER BY updated_at DESC LIMIT 500`,
  )
    .bind(now)
    .all();

  const { results: categories } = await context.env.DB.prepare(
    `SELECT * FROM categories ORDER BY path ASC`,
  ).all();

  for (const row of categories ?? []) {
    const cat = mapCategory(row);
    urls.push(`${origin}/blog/${cat.path}`);
  }
  for (const row of posts ?? []) {
    const item = mapContent(row);
    urls.push(`${origin}/${item.permalink}`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)]
  .map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
