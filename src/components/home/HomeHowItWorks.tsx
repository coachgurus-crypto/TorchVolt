const STEPS = [
  {
    n: "01",
    title: "Pick what stays on",
    body: "Fridge, fans, lights, TV, pump, AC — whatever matters in your home or office.",
  },
  {
    n: "02",
    title: "Tell us about power cuts",
    body: "All day, evenings only, or a shop that must stay open. That shapes the right package.",
  },
  {
    n: "03",
    title: "Get a free quote",
    body: "We suggest a package that fits. A TorchVolt person follows up with clear pricing.",
  },
];

export function HomeHowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
          Simple steps
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">
          A few quick answers. Then your quote.
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="font-mono text-sm font-semibold text-gold">{step.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
