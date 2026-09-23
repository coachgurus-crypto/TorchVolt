"use client";

import { useEffect, useState } from "react";
import { APPLIANCES, GRID_PROFILES, applianceWatts } from "@/lib/data/appliances";
import { formatDate, formatKwh, formatWatts } from "@/lib/format";
import { fetchLeads, type LeadRecord } from "@/lib/leads";

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseQuantitiesPayload(raw: string): {
  quantities: Record<string, number>;
  sizes: Record<string, string>;
} {
  const parsed = parseJson<unknown>(raw, {});
  if (
    parsed &&
    typeof parsed === "object" &&
    "quantities" in parsed &&
    typeof (parsed as { quantities: unknown }).quantities === "object"
  ) {
    const bag = parsed as {
      quantities: Record<string, number>;
      sizes?: Record<string, string>;
    };
    return { quantities: bag.quantities ?? {}, sizes: bag.sizes ?? {} };
  }
  return {
    quantities: (parsed as Record<string, number>) ?? {},
    sizes: {},
  };
}

function applianceLines(quantitiesJson: string, hoursJson: string) {
  const { quantities, sizes } = parseQuantitiesPayload(quantitiesJson);
  const hours = parseJson<Record<string, number>>(hoursJson, {});
  return APPLIANCES.filter((a) => (quantities[a.id] ?? 0) > 0).map((a) => {
    const qty = quantities[a.id];
    const hrs = hours[a.id];
    const power = applianceWatts(a, sizes[a.id]);
    return {
      id: a.id,
      label: power.sizeLabel ? `${a.name} (${power.sizeLabel})` : a.name,
      qty,
      hours: hrs,
      watts: power.runningWatts * qty,
    };
  });
}

function gridLabel(id: string) {
  return GRID_PROFILES.find((p) => p.id === id)?.title ?? id;
}

export function CustomersPanel({
  pin,
  onAuthError,
}: {
  pin: string;
  onAuthError: () => void;
}) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLeads(pin)
      .then((rows) => {
        if (cancelled) return;
        setLeads(rows);
        setSelectedId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        if (err.message.toLowerCase().includes("unauthorized")) onAuthError();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pin, onAuthError]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const selectedLoads = selected
    ? applianceLines(selected.quantities_json, selected.hours_json)
    : [];

  if (loading) {
    return <p className="mt-8 text-sm text-slate-600">Loading customers…</p>;
  }

  if (error) {
    return (
      <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (leads.length === 0) {
    return (
      <p className="mt-8 text-slate-600">
        No customer estimates yet. When someone finishes the sizer and saves
        their details, they appear here.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {leads.map((lead) => {
          const active = lead.id === selectedId;
          return (
            <li key={lead.id}>
              <button
                type="button"
                onClick={() => setSelectedId(lead.id)}
                className={`w-full px-4 py-4 text-left transition ${
                  active ? "bg-navy text-white" : "hover:bg-slate-50"
                }`}
              >
                <p className="font-semibold">{lead.customer_name}</p>
                <p
                  className={`mt-1 text-sm ${
                    active ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {lead.city} · {formatDate(lead.created_at)}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    active ? "text-gold" : "text-slate-600"
                  }`}
                >
                  {formatWatts(lead.running_watts)} · {lead.package_summary}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{selected.customer_name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {selected.site_kind === "shop" ? "Shop" : "Home"} · {selected.city}{" "}
                · saved {formatDate(selected.created_at)}
              </p>
            </div>
            <a
              href={`tel:${selected.customer_phone}`}
              className="inline-flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white"
            >
              {selected.customer_phone}
            </a>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Running load" value={formatWatts(selected.running_watts)} />
            <Stat label="Surge" value={formatWatts(selected.surge_watts)} />
            <Stat label="Daily use" value={formatKwh(selected.daily_kwh)} />
            <Stat
              label="Battery target"
              value={`${selected.needed_battery_kwh} kWh`}
            />
          </dl>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Suggested class
            </h3>
            <p className="mt-2 text-lg font-semibold text-navy">
              {selected.package_summary}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Grid profile: {gridLabel(selected.grid_profile_id)}
            </p>
            {selected.uses_generator != null ? (
              <p className="mt-1 text-sm text-slate-600">
                Generator:{" "}
                {selected.uses_generator
                  ? `yes · ~${selected.gen_hours_per_day ?? "?"} hrs/day`
                  : "no"}
              </p>
            ) : null}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Selected loads
            </h3>
            <ul className="mt-3 divide-y divide-slate-100">
              {selectedLoads.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium text-navy">{item.label}</span>
                  <span className="text-slate-600">
                    ×{item.qty}
                    {item.hours != null ? ` · ${item.hours}h` : ""} ·{" "}
                    {formatWatts(item.watts)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-navy">{value}</dd>
    </div>
  );
}
