"use client";

import Link from "next/link";
import { BRAND, telUrl, whatsappUrl } from "@/lib/constants";
import { useHomepageCopy } from "@/lib/useHomepageCopy";

export function SiteFooter() {
  const { footer } = useHomepageCopy();
  return (
    <footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="max-w-md text-2xl font-semibold tracking-tight text-white">
          {footer.heading}
        </p>
        <p className="mt-3 max-w-md text-sm leading-6">{footer.body}</p>
        <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <Link href="/#size" className="hover:text-white">
            {footer.quoteLink}
          </Link>
          <Link href="/blog" className="hover:text-white">
            {footer.blogLink}
          </Link>
          <a
            href={whatsappUrl("Hello TorchVolt, I sized my loads and want a quote.")}
            className="hover:text-white"
          >
            {footer.whatsappLabel}
          </a>
          <a href={telUrl()} className="hover:text-white">
            {BRAND.phoneDisplay}
          </a>
          <span>{footer.cities}</span>
          <Link href="/admin" className="text-slate-500 hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
