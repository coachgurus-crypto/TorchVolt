export type PostStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  publishedAt: string | null;
};

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: PostStatus;
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

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const res = await fetch("/api/posts");
  const data = (await res.json()) as { posts?: BlogPost[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load posts");
  return data.posts ?? [];
}

export async function fetchPublishedPost(slug: string): Promise<BlogPost> {
  const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`);
  const data = (await res.json()) as { post?: BlogPost; error?: string };
  if (!res.ok || !data.post) throw new Error(data.error || "Post not found");
  return data.post;
}

export async function fetchAdminPosts(pin: string): Promise<BlogPost[]> {
  const res = await fetch("/api/posts", { headers: { "X-Admin-Pin": pin } });
  const data = (await res.json()) as { posts?: BlogPost[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load posts");
  return data.posts ?? [];
}

export async function createPost(
  pin: string,
  input: BlogPostInput,
): Promise<BlogPost> {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: adminHeaders(pin),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { post?: BlogPost; error?: string };
  if (!res.ok || !data.post) throw new Error(data.error || "Could not create post");
  return data.post;
}

export async function updatePost(
  pin: string,
  id: string,
  input: BlogPostInput,
): Promise<BlogPost> {
  const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: adminHeaders(pin),
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { post?: BlogPost; error?: string };
  if (!res.ok || !data.post) throw new Error(data.error || "Could not update post");
  return data.post;
}

export async function deletePost(pin: string, id: string): Promise<void> {
  const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-Admin-Pin": pin },
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error || "Could not delete post");
}
