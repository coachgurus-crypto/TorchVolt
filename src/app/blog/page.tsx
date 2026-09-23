"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchLiveContent, permalinkHref, type CmsContent } from "@/lib/content";
import { formatDate } from "@/lib/format";

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<CmsContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLiveContent("post")
      .then((rows) => {
        if (!cancelled) setPosts(rows);
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
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
        Blog
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Notes on solar
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        Practical notes from TorchVolt — sizing, install reality, and how to buy
        without brochure kits.
      </p>

      {loading ? <p className="mt-10 text-sm text-slate-600">Loading posts…</p> : null}
      {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && posts.length === 0 ? (
        <p className="mt-10 text-slate-600">
          No published posts yet. Check back soon.
        </p>
      ) : null}

      <ul className="mt-10 space-y-8">
        {posts.map((post) => (
          <li key={post.id} className="border-b border-slate-200 pb-8">
            <p className="text-sm text-slate-500">
              {formatDate(post.publishedAt ?? post.createdAt)}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              <Link href={permalinkHref(post.permalink)} className="hover:text-solar">
                {post.title}
              </Link>
            </h2>
            {post.excerpt ? (
              <p className="mt-2 text-base leading-7 text-slate-600">{post.excerpt}</p>
            ) : null}
            <Link
              href={permalinkHref(post.permalink)}
              className="mt-4 inline-flex text-sm font-semibold text-navy"
            >
              Read article →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
