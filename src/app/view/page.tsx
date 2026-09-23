"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { renderPostContent } from "@/lib/blocks";
import {
  lookupPath,
  permalinkHref,
  type CmsCategory,
  type CmsContent,
} from "@/lib/content";
import { formatDate } from "@/lib/format";
import { cmsSrcSet } from "@/lib/images";

declare global {
  interface Window {
    __CMS_BOOTSTRAP__?: {
      content?: CmsContent;
      category?: Pick<CmsCategory, "id" | "name" | "slug" | "path">;
      contents?: CmsContent[];
    };
  }
}

function pathFromLocation() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.replace(/^\/+|\/+$/g, "");
}

export default function CmsViewPage() {
  const [path, setPath] = useState("");
  const [item, setItem] = useState<CmsContent | null>(null);
  const [category, setCategory] = useState<Pick<
    CmsCategory,
    "id" | "name" | "slug" | "path"
  > | null>(null);
  const [posts, setPosts] = useState<CmsContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = pathFromLocation();
    setPath(current);
    const boot = window.__CMS_BOOTSTRAP__;
    if (boot?.content) {
      setItem(boot.content);
      setLoading(false);
      return;
    }
    if (boot?.category) {
      setCategory(boot.category);
      setPosts(boot.contents ?? []);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!path) return;
    if (item || category) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    lookupPath(path)
      .then((result) => {
        if (cancelled) return;
        if ("redirect" in result && result.redirect) {
          window.location.replace(result.redirect);
          return;
        }
        if ("content" in result && result.content) {
          setItem(result.content);
          return;
        }
        if ("category" in result && result.category) {
          setCategory(result.category);
          setPosts(result.contents ?? []);
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
  }, [path, item, category]);

  const backHref = item?.type === "page" ? "/" : "/blog";
  const backLabel = item?.type === "page" ? "← Home" : "← All posts";
  const seoTitle = item?.seoTitle || item?.title;
  const seoDescription = item?.metaDescription || item?.excerpt;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {item ? (
        <>
          <title>{`${seoTitle} · TorchVolt`}</title>
          {seoDescription ? <meta name="description" content={seoDescription} /> : null}
        </>
      ) : null}

      <Link
        href={category ? "/blog" : backHref}
        className="text-sm font-semibold text-slate-600 hover:text-navy"
      >
        {category ? "← All posts" : backLabel}
      </Link>

      {loading ? <p className="mt-10 text-sm text-slate-600">Loading…</p> : null}
      {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

      {category ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
            Category
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{category.name}</h1>
          <ul className="mt-10 space-y-8">
            {posts.map((post) => (
              <li key={post.id} className="border-b border-slate-200 pb-8">
                <p className="text-sm text-slate-500">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  <Link href={permalinkHref(post.permalink)} className="hover:text-solar">
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt ? (
                  <p className="mt-2 text-base leading-7 text-slate-600">{post.excerpt}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {item ? (
        <article className="mt-8">
          {item.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.featuredImage}
              srcSet={cmsSrcSet(item.featuredImage)}
              sizes="(min-width: 768px) 720px, 100vw"
              alt=""
              width={1200}
              height={630}
              className="mb-8 aspect-[1.91] w-full rounded-2xl object-cover"
            />
          ) : null}
          {item.type === "post" ? (
            <p className="text-sm text-slate-500">
              {formatDate(item.publishedAt ?? item.createdAt)}
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
              Page
            </p>
          )}
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{item.title}</h1>
          {item.excerpt ? (
            <p className="mt-4 text-lg leading-8 text-slate-600">{item.excerpt}</p>
          ) : null}
          <div
            className="blog-prose mt-10"
            dangerouslySetInnerHTML={{ __html: renderPostContent(item.content) }}
          />
          {item.type === "post" ? (
            <div className="mt-12 border-t border-slate-200 pt-8">
              <Link
                href="/#size"
                className="inline-flex h-12 items-center rounded-full bg-navy px-6 text-sm font-semibold text-white"
              >
                Size your system
              </Link>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
