const STEPS = [
  {
    n: "01",
    title: "Tick what you power",
    body: "Fridge, fans, lights, decoder, pump, AC — with quantities that match the house.",
  },
  {
    n: "02",
    title: "Say how you use grid",
    body: "Frequent outages, evening-only, or a shop that must stay open. That changes battery.",
  },
  {
    n: "03",
    title: "See the class. Then talk.",
    body: "You get kW, kWh and panel count. A TorchVolt officer quotes from recent prices.",
  },
];

export function HomeHowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-solar">
          Guided sizing
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">
          Answer a few questions. The load updates as you go.
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
