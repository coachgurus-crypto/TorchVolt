"use client";

import { HomeHero } from "@/components/home/HomeHero";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { SizerWizard } from "@/components/sizer/SizerWizard";
import { useHomepageCopy } from "@/lib/useHomepageCopy";

export function HomePageContent() {
  const copy = useHomepageCopy();

  return (
    <div>
      <HomeHero copy={copy} />
      <HomeHowItWorks copy={copy.how} />

      <section
        id="size"
        className="scroll-mt-24 bg-gradient-to-b from-slate-100 to-slate-50 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
            {copy.size.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {copy.size.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {copy.size.body}
          </p>
        </div>
        <SizerWizard embedded />
      </section>
    </div>
  );
}
