import { isCmsCandidatePath, resolveIncomingPath } from "./_lib/resolver.js";
import { normalizePath } from "./_lib/cms.js";
import { bootstrapScript, CMS_CACHE, headTags, seoTitle } from "./_lib/seo.js";

const PASS_EXACT = new Set(["", "admin", "api", "size", "blog", "read", "view"]);

/** @param {EventContext} context */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (context.request.method !== "GET") return context.next();

  const path = normalizePath(url.pathname);
  const head = path.split("/")[0] ?? "";
  if (PASS_EXACT.has(path) || head === "api" || head.startsWith("_")) {
    return context.next();
  }
  if (!isCmsCandidatePath(url.pathname)) return context.next();

  const result = await resolveIncomingPath(context.env.DB, path);
  if (result.status === "redirect") {
    return Response.redirect(new URL(result.to, url.origin), 301);
  }
  if (result.status === "not_found") {
    return context.next();
  }

  const cacheKey = new Request(url.toString(), { method: "GET" });
  const hit = await caches.default.match(cacheKey);
  if (hit) return hit;

  const originPage = await context.next();
  const title =
    result.status === "content"
      ? `${seoTitle(result.content)} · TorchVolt`
      : `${result.category.name} · TorchVolt`;
  const payload =
    result.status === "content"
      ? { content: result.content }
      : { category: result.category, contents: result.contents };

  const rewritten = new HTMLRewriter()
    .on("title", {
      element(el) {
        el.setInnerContent(title);
      },
    })
    .on("head", {
      element(el) {
        el.append(
          headTags({
            origin: url.origin,
            path,
            content: result.content,
            category: result.category,
          }),
          { html: true },
        );
      },
    })
    .on("body", {
      element(el) {
        el.prepend(bootstrapScript(payload), { html: true });
      },
    })
    .transform(originPage);

  const headers = new Headers(rewritten.headers);
  headers.set("Cache-Control", CMS_CACHE);
  headers.set("CDN-Cache-Control", CMS_CACHE);
  headers.set("Cache-Tag", `cms,cms-${path.replace(/\//g, "-")}`);

  const response = new Response(rewritten.body, {
    status: rewritten.status,
    headers,
  });
  context.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
}
