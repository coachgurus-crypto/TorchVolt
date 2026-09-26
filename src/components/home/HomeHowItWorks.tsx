import type { HomepageCopy } from "@/lib/homepageCopy";

export function HomeHowItWorks({ copy }: { copy: HomepageCopy["how"] }) {
  return (
    <section id="how" className="scroll-mt-24 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
          {copy.eyebrow}
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">
          {copy.heading}
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {copy.steps.map((step, index) => (
            <li key={index}>
              <span className="font-mono text-sm font-semibold text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
