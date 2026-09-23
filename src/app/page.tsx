import { HomeHero } from "@/components/home/HomeHero";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { SizerWizard } from "@/components/sizer/SizerWizard";

export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <HomeHowItWorks />

      <section
        id="size"
        className="scroll-mt-24 bg-gradient-to-b from-slate-100 to-slate-50 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-3xl px-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
            Free quote
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            What do you want to keep on?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Pick the appliances for your home or office. We&apos;ll suggest a
            package that fits — then you can WhatsApp or call for your quote.
          </p>
        </div>
        <SizerWizard embedded />
      </section>
    </div>
  );
}
