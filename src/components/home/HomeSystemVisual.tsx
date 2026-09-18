export function HomeSystemVisual() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/90">
        Planning view · not a quote
      </p>
      <p className="mt-2 text-lg font-semibold text-white">Typical 3-bed evening load</p>
      <p className="mt-1 text-sm text-slate-400">
        Fridge, fans, lights, decoder — plus headroom for a 1.5HP inverter AC.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        {[
          ["Running", "2.4 kW"],
          ["Surge", "3.6 kW"],
          ["Daily use", "12–16 kWh"],
          ["Class", "5 kW hybrid"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-black/25 px-3 py-3 ring-1 ring-white/10">
            <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <svg
        viewBox="0 0 340 128"
        className="mt-5 h-auto w-full max-w-full"
        role="img"
        aria-label="Roof array feeding an inverter and lithium bank"
      >
        <rect x="8" y="16" width="88" height="48" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
        <rect x="18" y="26" width="20" height="28" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="42" y="26" width="20" height="28" rx="2" fill="currentColor" opacity="0.55" />
        <rect x="66" y="26" width="20" height="28" rx="2" fill="currentColor" opacity="0.75" />
        <text x="52" y="84" textAnchor="middle" fill="#94a3b8" fontSize="11">
          Array
        </text>
        <path d="M96 40 H132" stroke="#16a34a" strokeWidth="2" />
        <circle cx="132" cy="40" r="4" fill="#16a34a" />
        <rect x="142" y="18" width="72" height="44" rx="8" fill="none" stroke="#16a34a" strokeWidth="1.5" />
        <text x="178" y="44" textAnchor="middle" fill="#bbf7d0" fontSize="11">
          Inverter
        </text>
        <text x="178" y="84" textAnchor="middle" fill="#94a3b8" fontSize="11">
          Hybrid
        </text>
        <path d="M214 40 H248" stroke="#16a34a" strokeWidth="2" />
        <rect x="248" y="16" width="80" height="48" rx="8" fill="none" stroke="#eab308" strokeWidth="1.5" />
        <text x="288" y="44" textAnchor="middle" fill="#fde68a" fontSize="11">
          Lithium
        </text>
        <text x="288" y="84" textAnchor="middle" fill="#94a3b8" fontSize="11">
          Battery
        </text>
        <path d="M178 62 V104 H28" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
        <rect x="8" y="96" width="44" height="22" rx="4" fill="rgba(255,255,255,0.08)" />
        <text x="30" y="111" textAnchor="middle" fill="#cbd5e1" fontSize="10">
          Loads
        </text>
      </svg>
    </div>
  );
}
