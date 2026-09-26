"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchLiveContent,
  permalinkHref,
  type CmsContent,
} from "@/lib/content";
import { BRAND, whatsappUrl } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export function BlogSidebar({
  excludeId,
  posts: providedPosts,
}: {
  excludeId?: string;
  /** Optional preloaded posts (avoids a second fetch on the index page). */
  posts?: CmsContent[];
}) {
  const [posts, setPosts] = useState<CmsContent[]>(providedPosts ?? []);

  useEffect(() => {
    if (providedPosts) {
      setPosts(providedPosts);
      return;
    }
    let cancelled = false;
    fetchLiveContent("post")
      .then((rows) => {
        if (!cancelled) setPosts(rows);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [providedPosts]);

  const recent = posts
    .filter((p) => p.id !== excludeId)
    .slice(0, 5);

  return (
    <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-solar">
          Get a quote
        </p>
        <p className="mt-3 text-[15px] leading-7 text-slate-600">
          Not sure what size system you need? Tell us what should stay on — we
          send a free quote.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            href="/#size"
            className="inline-flex h-11 items-center justify-center rounded-full bg-navy px-5 text-sm font-semibold text-white"
          >
            Size your system
          </Link>
          <a
            href={whatsappUrl(
              `Hi TorchVolt — I read your blog and want a free solar quote.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-navy transition hover:border-navy"
          >
            WhatsApp {BRAND.phoneDisplay}
          </a>
        </div>
      </section>

      {recent.length > 0 ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-solar">
            Recent posts
          </p>
          <ul className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
            {recent.map((post) => (
              <li key={post.id} className="py-4">
                <p className="text-[12px] text-slate-500">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </p>
                <Link
                  href={permalinkHref(post.permalink)}
                  className="mt-1 block text-[15px] font-semibold leading-snug text-navy transition hover:text-solar"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/blog"
            className="mt-2 inline-flex text-sm font-semibold text-navy hover:text-solar"
          >
            All posts →
          </Link>
        </section>
      ) : null}
    </aside>
  );
}

export function BlogShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">{children}</div>
        <div className="min-w-0 border-t border-slate-200 pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {sidebar}
        </div>
      </div>
    </div>
  );
}
