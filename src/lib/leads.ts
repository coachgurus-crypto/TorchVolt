export type LeadPayload = {
  customerName: string;
  customerPhone: string;
  city: string;
  siteKind: "home" | "shop";
  gridProfileId: string;
  usesGenerator: boolean | null;
  genHoursPerDay: number;
  quantities: Record<string, number>;
  hours: Record<string, number>;
  sizes: Record<string, string>;
  runningWatts: number;
  surgeWatts: number;
  dailyKwh: number;
  neededBatteryKwh: number;
  packageId: string;
  packageSummary: string;
};

export type LeadRecord = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  site_kind: string;
  grid_profile_id: string;
  uses_generator: number | null;
  gen_hours_per_day: number | null;
  quantities_json: string;
  hours_json: string;
  running_watts: number;
  surge_watts: number;
  daily_kwh: number;
  needed_battery_kwh: number;
  package_id: string;
  package_summary: string;
};

export async function submitLead(payload: LeadPayload): Promise<{ id: string }> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { id?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not save estimate");
  return { id: data.id! };
}

export async function fetchLeads(pin: string): Promise<LeadRecord[]> {
  const res = await fetch("/api/leads", {
    headers: { "X-Admin-Pin": pin },
  });
  const data = (await res.json()) as { leads?: LeadRecord[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load leads");
  return data.leads ?? [];
}
