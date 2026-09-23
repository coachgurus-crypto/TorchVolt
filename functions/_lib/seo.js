export function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function seoTitle(content) {
  return (content.seoTitle || content.title || "TorchVolt").slice(0, 70);
}

export function seoDescription(content) {
  return (content.metaDescription || content.excerpt || "").slice(0, 180);
}

export function cmsImageSrc(src, width, origin) {
  if (!src || src.startsWith("data:")) return src;
  if (!origin || src.includes("/cdn-cgi/image/")) return src;
  const absolute = src.startsWith("http")
    ? src
    : `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
  return `${origin}/cdn-cgi/image/format=auto,fit=cover,width=${width},quality=75/${absolute}`;
}

export function headTags({ origin, path, content, category }) {
  const url = `${origin}/${path}`;
  if (category) {
    const title = `${category.name} · TorchVolt`;
    return [
      `<link rel="canonical" href="${escapeAttr(url)}" />`,
      `<meta name="description" content="${escapeAttr(`${category.name} articles from TorchVolt.`)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${escapeAttr(title)}" />`,
      `<meta property="og:url" content="${escapeAttr(url)}" />`,
    ].join("");
  }

  const title = `${seoTitle(content)} · TorchVolt`;
  const description = seoDescription(content);
  const image = content.featuredImage
    ? cmsImageSrc(content.featuredImage, 1200, origin)
    : "";
  const type = content.type === "article" || content.type === "post" ? "article" : "website";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": content.type === "page" ? "WebPage" : "BlogPosting",
    headline: seoTitle(content),
    description,
    datePublished: content.publishedAt || content.createdAt,
    dateModified: content.updatedAt,
    mainEntityOfPage: url,
    image: image || undefined,
    publisher: { "@type": "Organization", name: "TorchVolt" },
  };

  return [
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    image
      ? `<meta property="og:image" content="${escapeAttr(image)}" />`
      : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("");
}

export function bootstrapScript(payload) {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<script>window.__CMS_BOOTSTRAP__=${json}</script>`;
}

export const CMS_CACHE =
  "public, s-maxage=60, stale-while-revalidate=86400";

export async function bustPaths(requestUrl, paths) {
  const cache = caches.default;
  const origin = new URL(requestUrl).origin;
  const unique = [...new Set(["sitemap.xml", "robots.txt", ...paths])];
  await Promise.all(
    unique.map((p) => {
      const url = new URL(p.startsWith("/") ? p : `/${p}`, origin);
      return cache.delete(new Request(url.toString(), { method: "GET" }));
    }),
  );
}
