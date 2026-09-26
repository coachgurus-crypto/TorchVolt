import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { HomeSystemVisual } from "@/components/home/HomeSystemVisual";
import type { HomepageCopy } from "@/lib/homepageCopy";

export function HomeHero({ copy }: { copy: HomepageCopy }) {
  const { hero } = copy;
  return (
    <section className="hero-mesh relative text-white">
      <div className="hero-grid pointer-events-none absolute inset-0 overflow-hidden opacity-70" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        <div>
          <p className="text-sm font-medium text-slate-300">{hero.cities}</p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            {hero.headline}{" "}
            <span className="font-display text-gold">{hero.headlineAccent}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
            {hero.body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#size"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gold px-7 text-base font-semibold text-navy"
            >
              {hero.primaryCta}
              <ArrowDown className="h-4 w-4" />
            </Link>
            <Link
              href="/#how"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/15 px-7 text-base font-semibold text-white"
            >
              {hero.secondaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="min-w-0">
          <HomeSystemVisual copy={copy.example} />
        </div>
      </div>
    </section>
  );
}
