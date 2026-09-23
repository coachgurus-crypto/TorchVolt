export type ContentType = "post" | "page";
export type ContentStatus = "draft" | "published" | "scheduled";

export type CmsContent = {
  id: string;
  type: ContentType;
  parentId: string | null;
  categoryId: string | null;
  title: string;
  slug: string;
  permalink: string;
  excerpt: string;
  content: string;
  status: ContentStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  seoTitle: string;
  metaDescription: string;
  featuredImage: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CmsCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentInput = {
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ContentStatus;
  parentId?: string | null;
  categoryId?: string | null;
  scheduledAt?: string | null;
  seoTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  tags?: string[];
};

export type PathLookup =
  | { content: CmsContent; redirect?: undefined; category?: undefined; contents?: undefined }
  | { redirect: string; content?: undefined; category?: undefined; contents?: undefined }
  | {
      category: Pick<CmsCategory, "id" | "name" | "slug" | "path">;
      contents: CmsContent[];
      content?: undefined;
      redirect?: undefined;
    };

function adminHeaders(pin: string) {
  return {
    "Content-Type": "application/json",
    "X-Admin-Pin": pin,
  };
}

export function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function permalinkHref(permalink: string) {
  return `/${permalink.replace(/^\/+/, "")}`;
}

export function previewPermalink(opts: {
  type: ContentType;
  slug: string;
  categoryPath?: string | null;
  parentPermalink?: string | null;
}) {
  const slug = slugifyTitle(opts.slug);
  if (!slug) return opts.type === "post" ? "/blog/…" : "/…";
  if (opts.type === "page") {
    return opts.parentPermalink
      ? `/${opts.parentPermalink}/${slug}`
      : `/${slug}`;
  }
  return opts.categoryPath ? `/blog/${opts.categoryPath}/${slug}` : `/blog/${slug}`;
}

export async function lookupPath(path: string): Promise<PathLookup> {
  const res = await fetch(`/api/content?path=${encodeURIComponent(path)}`);
  const data = (await res.json()) as PathLookup & { error?: string };
  if (!res.ok) throw new Error(data.error || "Not found");
  return data;
}

export async function fetchLiveContent(type: ContentType): Promise<CmsContent[]> {
  const res = await fetch(`/api/content?type=${type}`);
  const data = (await res.json()) as { contents?: CmsContent[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load content");
  return data.contents ?? [];
}

export async function fetchAdminContent(
  pin: string,
  type: ContentType,
): Promise<CmsContent[]> {
  const res = await fetch(`/api/content?type=${type}`, {
    headers: { "X-Admin-Pin": pin },
  });
  const data = (await res.json()) as { contents?: CmsContent[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load content");
  return data.contents ?? [];
}

export async function createContent(pin: string, input: ContentInput) {
  const res = await fetch("/api/content", {
    method: "POST",
    headers: adminHeaders(pin),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { content?: CmsContent; error?: string };
  if (!res.ok || !data.content) throw new Error(data.error || "Could not create");
  return data.content;
}

export async function updateContent(pin: string, id: string, input: ContentInput) {
  const res = await fetch(`/api/content?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: adminHeaders(pin),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { content?: CmsContent; error?: string };
  if (!res.ok || !data.content) throw new Error(data.error || "Could not update");
  return data.content;
}

export async function deleteContent(pin: string, id: string) {
  const res = await fetch(`/api/content?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-Admin-Pin": pin },
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error || "Could not delete");
}

export async function fetchCategories(): Promise<CmsCategory[]> {
  const res = await fetch("/api/categories");
  const data = (await res.json()) as { categories?: CmsCategory[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load categories");
  return data.categories ?? [];
}

export async function createCategory(
  pin: string,
  input: { name: string; slug: string; parentId: string | null },
) {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: adminHeaders(pin),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { category?: CmsCategory; error?: string };
  if (!res.ok || !data.category) throw new Error(data.error || "Could not create category");
  return data.category;
}

export async function updateCategory(
  pin: string,
  id: string,
  input: { name: string; slug: string; parentId: string | null },
) {
  const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: adminHeaders(pin),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { category?: CmsCategory; error?: string };
  if (!res.ok || !data.category) throw new Error(data.error || "Could not update category");
  return data.category;
}

export async function deleteCategory(pin: string, id: string) {
  const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-Admin-Pin": pin },
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error || "Could not delete category");
}
