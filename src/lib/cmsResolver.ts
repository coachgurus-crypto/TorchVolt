import type { CmsCategory, CmsContent } from "@/lib/content";

/** Normalized permalink: no leading/trailing slashes, e.g. `blog/solar/my-post`. */
export type CmsPath = string;

export type CmsContentRow = CmsContent & {
  status: CmsContent["status"];
};

export type CmsResolveResult =
  | { status: "pass" }
  | { status: "not_found" }
  | { status: "redirect"; to: string; permanent: true }
  | { status: "content"; content: CmsContent }
  | {
      status: "category";
      category: Pick<CmsCategory, "id" | "name" | "slug" | "path">;
      contents: CmsContent[];
    };

/** Persistence adapter — Prisma, D1, Supabase, or an HTTP CMS API. */
export type CmsStore = {
  findByPermalink(path: CmsPath): Promise<CmsContentRow | null>;
  findRedirect(path: CmsPath): Promise<string | null>;
  findCategoryByPath(path: CmsPath): Promise<Pick<
    CmsCategory,
    "id" | "name" | "slug" | "path"
  > | null>;
  listLivePostsByCategory(categoryId: string, nowIso: string): Promise<CmsContent[]>;
};

export const CMS_PASSTHROUGH = new Set([
  "",
  "admin",
  "api",
  "size",
  "blog",
  "read",
  "view",
]);

const FILEISH = /\.[a-z0-9]{1,8}$/i;

export function normalizeCmsPath(pathname: string): CmsPath {
  return pathname.split("?")[0].split("#")[0].replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
}

export function shouldPassthrough(pathname: string): boolean {
  const path = normalizeCmsPath(pathname);
  if (CMS_PASSTHROUGH.has(path)) return true;
  const head = path.split("/")[0] ?? "";
  if (head.startsWith("_") || head === "api" || head === "_next") return true;
  if (FILEISH.test(path)) return true;
  return false;
}

export function isLiveContent(row: CmsContentRow, nowIso: string): boolean {
  if (row.status === "published") return true;
  return Boolean(
    row.status === "scheduled" && row.scheduledAt && row.scheduledAt <= nowIso,
  );
}

function categoryPathFromPermalink(path: CmsPath): CmsPath | null {
  if (path.startsWith("blog/") && path.length > 5) return path.slice(5);
  if (path && path !== "blog") return path;
  return null;
}

/**
 * Dynamic permalink resolver.
 * Match order: exact content → redirect chain → nested category archive → 404.
 */
export async function resolveCmsPath(
  pathname: string,
  store: CmsStore,
  opts?: { now?: string; preview?: boolean; maxRedirects?: number },
): Promise<CmsResolveResult> {
  if (shouldPassthrough(pathname)) return { status: "pass" };

  const now = opts?.now ?? new Date().toISOString();
  const preview = opts?.preview ?? false;
  const maxRedirects = opts?.maxRedirects ?? 8;
  let path = normalizeCmsPath(pathname);
  const seen = new Set<string>();

  for (let i = 0; i <= maxRedirects; i += 1) {
    if (!path || seen.has(path)) return { status: "not_found" };
    seen.add(path);

    const content = await store.findByPermalink(path);
    if (content && (preview || isLiveContent(content, now))) {
      if (content.permalink !== path) {
        return { status: "redirect", to: `/${content.permalink}`, permanent: true };
      }
      return { status: "content", content };
    }

    const redirected = await store.findRedirect(path);
    if (redirected) {
      const next = normalizeCmsPath(redirected);
      if (!next || next === path) return { status: "not_found" };
      if (i === maxRedirects) {
        return { status: "redirect", to: `/${next}`, permanent: true };
      }
      path = next;
      continue;
    }

    const catPath = categoryPathFromPermalink(path);
    if (catPath) {
      const category = await store.findCategoryByPath(catPath);
      if (category) {
        const contents = await store.listLivePostsByCategory(category.id, now);
        return { status: "category", category, contents };
      }
    }

    return { status: "not_found" };
  }

  return { status: "not_found" };
}

/** Turn a resolve result into a Fetch API Response (Next/Remix/Workers). */
export function cmsResultToResponse(
  result: CmsResolveResult,
  requestUrl: string,
): Response | null {
  if (result.status === "pass") return null;
  if (result.status === "not_found") {
    return new Response("Not found", { status: 404 });
  }
  if (result.status === "redirect") {
    return Response.redirect(new URL(result.to, requestUrl), 301);
  }
  return null;
}

/** HTTP-backed store — use from Next.js middleware / Remix loaders. */
export function createHttpCmsStore(origin: string): CmsStore {
  return {
    async findByPermalink(path) {
      const data = await getJson(`${origin}/api/content?path=${encodeURIComponent(path)}`);
      return data.content ?? null;
    },
    async findRedirect(path) {
      const data = await getJson(`${origin}/api/content?path=${encodeURIComponent(path)}`);
      return data.redirect ? normalizeCmsPath(data.redirect) : null;
    },
    async findCategoryByPath(path) {
      const data = await getJson(
        `${origin}/api/content?path=${encodeURIComponent(`blog/${path}`)}`,
      );
      return data.category ?? null;
    },
    async listLivePostsByCategory(categoryId, _nowIso) {
      const data = await getJson(
        `${origin}/api/content?id=${encodeURIComponent(categoryId)}`,
      );
      return data.contents ?? [];
    },
  };
}

async function getJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`CMS lookup failed (${res.status})`);
  return (await res.json()) as {
    content?: CmsContentRow;
    redirect?: string;
    category?: Pick<CmsCategory, "id" | "name" | "slug" | "path">;
    contents?: CmsContent[];
  };
}
