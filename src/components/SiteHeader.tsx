"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useHomepageCopy } from "@/lib/useHomepageCopy";

export function SiteHeader() {
  const { header } = useHomepageCopy();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/blog"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy sm:inline-flex"
          >
            {header.blog}
          </Link>
          <Link
            href="/#how"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-navy md:inline-flex"
          >
            {header.howItWorks}
          </Link>
          <Link
            href="/#size"
            className="inline-flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white"
          >
            {header.cta}
          </Link>
        </nav>
      </div>
    </header>
  );
}
