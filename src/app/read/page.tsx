"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BlogShell, BlogSidebar } from "@/components/BlogSidebar";
import { formatDate } from "@/lib/format";
import { renderStoredContent } from "@/lib/richText";
import { fetchPublishedPost, type BlogPost } from "@/lib/posts";

function slugFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("slug");
  if (fromQuery) return fromQuery;
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "blog" && parts[1] && parts[1] !== "post") return parts[1];
  return "";
}

export default function BlogPostReaderPage() {
  const [slug, setSlug] = useState("");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSlug(slugFromLocation());
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Missing post");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPublishedPost(slug)
      .then((row) => {
        if (!cancelled) {
          setPost(row);
          document.title = `${row.title} · TorchVolt`;
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <BlogShell sidebar={<BlogSidebar excludeId={post?.id} />}>
      <Link href="/blog" className="text-sm font-semibold text-slate-600 hover:text-navy">
        ← All posts
      </Link>

      {loading ? <p className="mt-10 text-sm text-slate-600">Loading…</p> : null}
      {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

      {post ? (
        <article className="mt-8">
          <p className="text-sm text-slate-500">
            {formatDate(post.publishedAt ?? post.createdAt)}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{post.title}</h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg leading-8 text-slate-600">{post.excerpt}</p>
          ) : null}
          <div
            className="blog-prose mt-10"
            dangerouslySetInnerHTML={{ __html: renderStoredContent(post.content) }}
          />
          <div className="mt-12 border-t border-slate-200 pt-8">
            <Link
              href="/#size"
              className="inline-flex h-12 items-center rounded-full bg-navy px-6 text-sm font-semibold text-white"
            >
              Size your system
            </Link>
          </div>
        </article>
      ) : null}
    </BlogShell>
  );
}
