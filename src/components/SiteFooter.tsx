import Link from "next/link";
import { BRAND, telUrl, whatsappUrl } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="max-w-md text-2xl font-semibold tracking-tight text-white">
          Ready for solar at home or work? Talk to TorchVolt.
        </p>
        <p className="mt-3 max-w-md text-sm leading-6">
          We help Nigerian homes and offices get the right solar package — then a clear quote.
        </p>
        <div className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <Link href="/#size" className="hover:text-white">
            Get a free quote
          </Link>
          <Link href="/blog" className="hover:text-white">
            Blog
          </Link>
          <a
            href={whatsappUrl("Hello TorchVolt, I sized my loads and want a quote.")}
            className="hover:text-white"
          >
            WhatsApp
          </a>
          <a href={telUrl()} className="hover:text-white">
            {BRAND.phoneDisplay}
          </a>
          <span>{BRAND.city}</span>
          <Link href="/admin" className="text-slate-500 hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
