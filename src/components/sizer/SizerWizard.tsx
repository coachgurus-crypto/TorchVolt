"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryCharging,
  Building2,
  Check,
  Droplets,
  Fan,
  Home,
  Lightbulb,
  Minus,
  Phone,
  Plus,
  Refrigerator,
  Shield,
  Snowflake,
  Sun,
  Tv,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BRAND, telUrl, whatsappUrl } from "@/lib/constants";
import { APPLIANCES, GRID_PROFILES } from "@/lib/data/appliances";
import { formatKwh, formatWatts } from "@/lib/format";
import { buildQuote, estimateWhatsAppText, recommendPackage } from "@/lib/sizing";
import { saveDraft, type SiteKind } from "@/lib/storage";
import type { GridProfileId } from "@/lib/types";

const SCREENS = ["who", "city", "grid", "loads", "generator", "result"] as const;
type Screen = (typeof SCREENS)[number];

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Benin"];

const ICONS: Record<string, ReactNode> = {
  inverter_ac: <Snowflake className="h-5 w-5" />,
  fridge: <Refrigerator className="h-5 w-5" />,
  pump: <Droplets className="h-5 w-5" />,
  tv: <Tv className="h-5 w-5" />,
  fans: <Fan className="h-5 w-5" />,
  lights: <Lightbulb className="h-5 w-5" />,
  wifi: <Wifi className="h-5 w-5" />,
};

const HOUR_CHOICES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24];
const PUMP_HOURS = [0.25, 0.5, 1, 1.5, 2];

function emptyQty() {
  return Object.fromEntries(APPLIANCES.map((a) => [a.id, 0]));
}

export function SizerWizard({ embedded = false }: { embedded?: boolean }) {
  const [screen, setScreen] = useState<Screen>("who");
  const [city, setCity] = useState("Lagos");
  const [siteKind, setSiteKind] = useState<SiteKind | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>(emptyQty);
  const [hours, setHours] = useState<Record<string, number>>({});
  const [gridProfileId, setGridProfileId] = useState<GridProfileId>("outages_24_7");
  const [usesGenerator, setUsesGenerator] = useState<boolean | null>(null);
  const [genHours, setGenHours] = useState(4);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const quote = useMemo(
    () => buildQuote(quantities, gridProfileId, city, hours),
    [quantities, gridProfileId, city, hours],
  );
  const { pkg, load, neededBatteryKwh } = useMemo(
    () => recommendPackage(quantities, gridProfileId, hours),
    [quantities, gridProfileId, hours],
  );

  useEffect(() => {
    if (!hydrated) return;
    saveDraft({
      quantities,
      hours,
      gridProfileId,
      city,
      siteKind: siteKind ?? undefined,
      usesGenerator,
      genHoursPerDay: genHours,
      quote,
    });
  }, [
    quantities,
    hours,
    gridProfileId,
    city,
    siteKind,
    usesGenerator,
    genHours,
    quote,
    hydrated,
  ]);

  const index = SCREENS.indexOf(screen);
  const selectedCount = Object.values(quantities).filter((n) => n > 0).length;
  const chatHref = whatsappUrl(estimateWhatsAppText(quote, pkg));

  function go(next: Screen) {
    setScreen(next);
  }

  function bump(id: string, delta: number) {
    const appliance = APPLIANCES.find((a) => a.id === id)!;
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) + delta * appliance.qtyStep;
      return {
        ...prev,
        [id]: Math.min(appliance.maxQty, Math.max(0, next)),
      };
    });
  }

  function toggleLoad(id: string) {
    setQuantities((prev) => {
      const on = (prev[id] ?? 0) > 0;
      const appliance = APPLIANCES.find((a) => a.id === id)!;
      return { ...prev, [id]: on ? 0 : Math.max(1, appliance.qtyStep) };
    });
  }

  const canContinue =
    (screen === "who" && siteKind !== null) ||
    screen === "city" ||
    screen === "grid" ||
    (screen === "loads" && selectedCount > 0) ||
    (screen === "generator" && usesGenerator !== null) ||
    screen === "result";

  function continueNext() {
    if (!canContinue) return;
    if (screen === "result") return;
    go(SCREENS[index + 1]);
  }

  const copy = COPY[screen];

  return (
    <div className={`mx-auto max-w-2xl px-4 ${embedded ? "py-0 pb-8" : "py-6 pb-10"}`}>
      <div
        className={
          embedded
            ? "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
            : ""
        }
      >
        <div className="h-1 bg-slate-100">
          <motion.div
            className="h-full bg-gold"
            animate={{ width: `${((index + 1) / SCREENS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <div className="flex items-center justify-between px-5 pt-5 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-solar">
            {index + 1} / {SCREENS.length}
          </p>
          <LiveLoad watts={load.runningWatts} count={selectedCount} />
        </div>

        <div className="min-h-[28rem] px-5 pb-6 pt-4 sm:px-8">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {copy.title(siteKind)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                {copy.lead}
              </p>

              {screen === "who" ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Choice
                    selected={siteKind === "home"}
                    icon={<Home className="h-6 w-6" />}
                    title="A home"
                    body="Flat, duplex or compound. Fridge, fans, lights, maybe AC and a pump."
                    onClick={() => {
                      setSiteKind("home");
                      setGridProfileId("outages_24_7");
                      setQuantities(emptyQty());
                      setHours({});
                    }}
                  />
                  <Choice
                    selected={siteKind === "shop"}
                    icon={<Building2 className="h-6 w-6" />}
                    title="A shop or office"
                    body="POS, lights, fans and fridge through business hours."
                    onClick={() => {
                      setSiteKind("shop");
                      setGridProfileId("daytime_shop");
                      setQuantities(emptyQty());
                      setHours({});
                    }}
                  />
                </div>
              ) : null}

              {screen === "city" ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`h-12 rounded-full px-5 text-sm font-semibold ${
                        city === c
                          ? "bg-navy text-white"
                          : "border border-slate-200 bg-slate-50 text-navy"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : null}

              {screen === "grid" ? (
                <div className="mt-6 space-y-3">
                  {GRID_PROFILES.filter((p) =>
                    siteKind === "shop" ? true : p.id !== "daytime_shop",
                  ).map((profile) => (
                    <button
                      type="button"
                      key={profile.id}
                      onClick={() => setGridProfileId(profile.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        profile.id === gridProfileId
                          ? "border-navy bg-navy text-white"
                          : "border-slate-200 bg-white hover:border-navy/30"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{profile.title}</span>
                        {profile.id === gridProfileId ? (
                          <Check className="h-5 w-5 text-gold" />
                        ) : null}
                      </span>
                      <span
                        className={`mt-1 block text-sm ${
                          profile.id === gridProfileId ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {profile.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {screen === "loads" ? (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {APPLIANCES.map((appliance) => {
                      const on = (quantities[appliance.id] ?? 0) > 0;
                      return (
                        <button
                          key={appliance.id}
                          type="button"
                          onClick={() => toggleLoad(appliance.id)}
                          className={`inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition ${
                            on
                              ? "border-navy bg-navy text-white"
                              : "border-slate-200 bg-white text-navy"
                          }`}
                        >
                          {ICONS[appliance.id]}
                          {appliance.name.replace("Standing / ", "")}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 space-y-3">
                    {APPLIANCES.filter((a) => (quantities[a.id] ?? 0) > 0).map((appliance) => (
                      <div
                        key={appliance.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{appliance.name}</p>
                            <p className="text-xs text-slate-500">
                              {appliance.runningWatts}W each · {appliance.localLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="touch-btn inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white"
                              onClick={() => bump(appliance.id, -1)}
                              aria-label={`Decrease ${appliance.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-lg font-semibold">
                              {quantities[appliance.id]}
                            </span>
                            <button
                              type="button"
                              className="touch-btn inline-flex items-center justify-center rounded-xl bg-navy text-white"
                              onClick={() => bump(appliance.id, 1)}
                              aria-label={`Increase ${appliance.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Hours / day
                          <select
                            className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-navy"
                            value={
                              hours[appliance.id] ??
                              appliance.hoursByProfile[gridProfileId]
                            }
                            onChange={(e) =>
                              setHours((prev) => ({
                                ...prev,
                                [appliance.id]: Number(e.target.value),
                              }))
                            }
                          >
                            {(appliance.id === "pump" ? PUMP_HOURS : HOUR_CHOICES).map((h) => (
                              <option key={h} value={h}>
                                {h < 1
                                  ? `${Math.round(h * 60)} minutes`
                                  : `${h} hour${h === 1 ? "" : "s"}`}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedCount === 0 ? (
                    <p className="mt-6 text-sm text-slate-500">
                      Tap every load you want on solar. Quantity and hours open next.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {screen === "generator" ? (
                <div className="mt-8 space-y-3">
                  <Choice
                    selected={usesGenerator === true}
                    title="Yes — diesel or petrol"
                    body="We’ll size lithium so you can cut generator hours, not guess them."
                    onClick={() => setUsesGenerator(true)}
                  />
                  <Choice
                    selected={usesGenerator === false}
                    title="No generator"
                    body="Solar and lithium need to cover the outages on their own."
                    onClick={() => setUsesGenerator(false)}
                  />
                  <AnimatePresence>
                    {usesGenerator ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mb-2 mt-4 text-sm font-medium">
                          About how many hours a day does it run?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[2, 4, 6, 8, 12].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setGenHours(h)}
                              className={`h-11 rounded-full px-4 text-sm font-semibold ${
                                genHours === h
                                  ? "bg-navy text-white"
                                  : "border border-slate-200 bg-white"
                              }`}
                            >
                              {h} hrs
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}

              {screen === "result" ? (
                <div className="mt-6 space-y-4">
                  <section className="overflow-hidden rounded-2xl bg-navy p-5 text-white">
                    <p className="text-xs uppercase tracking-wider text-gold">
                      {siteKind === "shop" ? "Shop" : "Home"} · {city}
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold">
                      {formatWatts(load.runningWatts)} running
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Suggested class: {pkg.inverterKw}kW hybrid · ~{pkg.batteryKwh}kWh
                      lithium · {pkg.panelCount} × {pkg.panelWatts}W array
                    </p>
                    {usesGenerator ? (
                      <p className="mt-3 text-sm text-slate-300">
                        Generator about {genHours} hrs/day — lithium is aimed at cutting
                        those hours, not replacing the quote.
                      </p>
                    ) : null}
                  </section>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric
                      icon={<Zap className="h-4 w-4" />}
                      label="Peak load"
                      value={formatWatts(load.runningWatts)}
                      hint={`Surge ${formatWatts(load.coincidentSurgeW)}`}
                    />
                    <Metric
                      icon={<Sun className="h-4 w-4" />}
                      label="Daily use"
                      value={formatKwh(load.dailyKwh)}
                      hint="From your hours, not a brochure"
                    />
                    <Metric
                      icon={<BatteryCharging className="h-4 w-4" />}
                      label="Battery target"
                      value={`${neededBatteryKwh} kWh`}
                      hint={`Bank around ${pkg.batteryKwh}kWh`}
                      accent
                    />
                  </div>
                  <p className="flex gap-2 text-sm text-slate-600">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-solar" />
                    This is a planning estimate. A TorchVolt officer quotes from recent
                    prices after looking at the roof and DB board.
                  </p>
                  <div className="grid gap-3">
                    <a
                      href={telUrl()}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gold text-base font-semibold text-navy"
                    >
                      <Phone className="h-4 w-4" />
                      Call for your solar system setup
                    </a>
                    <a
                      href={chatHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-14 items-center justify-center rounded-2xl bg-[#25D366] text-base font-semibold text-white"
                    >
                      Get recent price quotation on WhatsApp
                    </a>
                  </div>
                </div>
              ) : null}
          </motion.div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-8">
          {index > 0 ? (
            <button
              type="button"
              onClick={() => go(SCREENS[index - 1])}
              className="h-12 rounded-full px-4 font-semibold text-navy"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {screen !== "result" ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={continueNext}
              className="h-12 min-w-36 rounded-full bg-navy px-6 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setQuantities(emptyQty());
                setHours({});
                setSiteKind(null);
                setUsesGenerator(null);
                go("who");
              }}
              className="h-12 rounded-full border border-slate-200 px-5 font-semibold"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const COPY: Record<
  Screen,
  { title: (kind: SiteKind | null) => string; lead: string }
> = {
  who: {
    title: () => "What do you want to power?",
    lead: "We’ll only ask the next questions that match that answer.",
  },
  city: {
    title: () => "Where is the site?",
    lead: "Sun hours are similar nationwide. City helps us route the right crew.",
  },
  grid: {
    title: (kind) =>
      kind === "shop" ? "How is power at the shop?" : "How is NEPA at the house?",
    lead: "Battery size follows outages. Inverter size follows the loads you pick next.",
  },
  loads: {
    title: () => "Tap everything that must stay on.",
    lead: "Then set quantity and hours. The running load at the top updates as you tap.",
  },
  generator: {
    title: () => "Do you run a generator today?",
    lead: "If yes, tell us roughly how long. We use it to shape backup hours — not a website price.",
  },
  result: {
    title: () => "Your free solar recommendation",
    lead: "Call or WhatsApp for a quotation based on recent prices.",
  },
};

function LiveLoad({ watts, count }: { watts: number; count: number }) {
  return (
    <div className="rounded-full bg-slate-100 px-3 py-1.5 text-right">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {count === 1 ? "1 load" : `${count} loads`}
      </p>
      <motion.p
        key={watts}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-sm font-semibold text-navy"
      >
        {formatWatts(watts)}
      </motion.p>
    </div>
  );
}

function Choice({
  selected,
  title,
  body,
  onClick,
  icon,
}: {
  selected: boolean;
  title: string;
  body: string;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white hover:border-navy/30"
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-3">
          {icon ? <span className={selected ? "text-gold" : "text-navy"}>{icon}</span> : null}
          <span>
            <span className="block font-semibold">{title}</span>
            <span className={`mt-1 block text-sm ${selected ? "text-slate-300" : "text-slate-600"}`}>
              {body}
            </span>
          </span>
        </span>
        {selected ? <Check className="h-5 w-5 shrink-0 text-gold" /> : null}
      </span>
    </button>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold ${accent ? "text-solar" : "text-navy"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
