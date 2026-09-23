import type { Appliance, ApplianceSize, GridProfileId } from "@/lib/types";

export const GRID_PROFILES: {
  id: GridProfileId;
  title: string;
  subtitle: string;
  autonomyDays: number;
  genHoursPerDay: number;
}[] = [
  {
    id: "outages_24_7",
    title: "Frequent outages — need 24/7 backup",
    subtitle: "NEPA comes and goes. Fridge, fans and lights must never drop.",
    autonomyDays: 0.55,
    genHoursPerDay: 8,
  },
  {
    id: "few_hours",
    title: "Few hours of light daily",
    subtitle: "Grid is on 4–8 hours. Cover evenings, pumping and fridge.",
    autonomyDays: 0.4,
    genHoursPerDay: 5,
  },
  {
    id: "night_only",
    title: "Night & weekend backup",
    subtitle: "Work from the grid by day. Run home loads after 6pm.",
    autonomyDays: 0.35,
    genHoursPerDay: 4,
  },
  {
    id: "daytime_shop",
    title: "Shop / office daytime",
    subtitle: "POS, fans, lights and fridge through business hours.",
    autonomyDays: 0.32,
    genHoursPerDay: 6,
  },
];

export const APPLIANCES: Appliance[] = [
  {
    id: "inverter_ac",
    name: "Inverter AC",
    localLabel: "Split AC for the room",
    runningWatts: 1500,
    surgeMultiplier: 1.35,
    defaultQty: 0,
    minQty: 0,
    maxQty: 6,
    qtyStep: 1,
    note: "Pick the HP on the outdoor unit label.",
    hoursByProfile: {
      outages_24_7: 8,
      few_hours: 5,
      night_only: 4,
      daytime_shop: 6,
    },
    dutyCycle: 0.7,
    sizePrompt: "What HP is the AC?",
    defaultSizeId: "1_5",
    sizes: [
      { id: "1", label: "1 HP", runningWatts: 900 },
      { id: "1_5", label: "1.5 HP", runningWatts: 1500 },
      { id: "2", label: "2 HP", runningWatts: 1900 },
      { id: "2_5", label: "2.5 HP", runningWatts: 2300 },
    ],
  },
  {
    id: "fridge",
    name: "Refrigerator",
    localLabel: "Fridge or fridge-freezer",
    runningWatts: 300,
    surgeMultiplier: 3.5,
    defaultQty: 1,
    minQty: 0,
    maxQty: 4,
    qtyStep: 1,
    note: "Bigger fridge-freezers draw more when the compressor kicks in.",
    hoursByProfile: {
      outages_24_7: 24,
      few_hours: 24,
      night_only: 24,
      daytime_shop: 24,
    },
    dutyCycle: 0.38,
    sizePrompt: "What size is the fridge?",
    defaultSizeId: "double",
    sizes: [
      { id: "small", label: "Small / single door", runningWatts: 150, surgeMultiplier: 3 },
      { id: "double", label: "Double-door", runningWatts: 300, surgeMultiplier: 3.5 },
      { id: "large", label: "Large / side-by-side", runningWatts: 450, surgeMultiplier: 3.5 },
      { id: "freezer", label: "Deep freezer", runningWatts: 400, surgeMultiplier: 4 },
    ],
  },
  {
    id: "pump",
    name: "Water Pumping Machine",
    localLabel: "Borehole or surface pump",
    runningWatts: 900,
    surgeMultiplier: 4,
    defaultQty: 0,
    minQty: 0,
    maxQty: 2,
    qtyStep: 1,
    note: "Check the HP stamped on the pump or nameplate.",
    hoursByProfile: {
      outages_24_7: 1.5,
      few_hours: 1.2,
      night_only: 1,
      daytime_shop: 0.8,
    },
    dutyCycle: 1,
    sizePrompt: "What HP is the pump?",
    defaultSizeId: "1",
    sizes: [
      { id: "0_5", label: "0.5 HP", runningWatts: 400 },
      { id: "1", label: "1 HP", runningWatts: 900 },
      { id: "1_5", label: "1.5 HP", runningWatts: 1200 },
      { id: "2", label: "2 HP", runningWatts: 1500 },
    ],
  },
  {
    id: "washer",
    name: "Washing Machine",
    localLabel: "Automatic or semi-auto",
    runningWatts: 500,
    surgeMultiplier: 2.5,
    defaultQty: 0,
    minQty: 0,
    maxQty: 2,
    qtyStep: 1,
    note: "Motor size is usually on the back label.",
    hoursByProfile: {
      outages_24_7: 1.5,
      few_hours: 1,
      night_only: 1,
      daytime_shop: 0.5,
    },
    dutyCycle: 0.6,
    sizePrompt: "About what size / power?",
    defaultSizeId: "mid",
    sizes: [
      { id: "small", label: "Small (~300W)", runningWatts: 300, surgeMultiplier: 2 },
      { id: "mid", label: "Medium (~500W)", runningWatts: 500, surgeMultiplier: 2.5 },
      { id: "1hp", label: "About 1 HP", runningWatts: 750, surgeMultiplier: 3 },
    ],
  },
  {
    id: "tv",
    name: "LED TVs & Decoder",
    localLabel: "DSTV / GOtv + LED screen",
    runningWatts: 120,
    surgeMultiplier: 1.2,
    defaultQty: 1,
    minQty: 0,
    maxQty: 6,
    qtyStep: 1,
    note: "Running 120W combined per living-room setup.",
    hoursByProfile: {
      outages_24_7: 7,
      few_hours: 6,
      night_only: 5,
      daytime_shop: 4,
    },
    dutyCycle: 1,
  },
  {
    id: "fans",
    name: "Standing / Ceiling Fans",
    localLabel: "Ox / Binatone class",
    runningWatts: 70,
    surgeMultiplier: 1.8,
    defaultQty: 3,
    minQty: 0,
    maxQty: 16,
    qtyStep: 1,
    note: "70W each. Qty selector — typical 3-bed flat uses 3–6.",
    hoursByProfile: {
      outages_24_7: 12,
      few_hours: 10,
      night_only: 9,
      daytime_shop: 8,
    },
    dutyCycle: 1,
  },
  {
    id: "lights",
    name: "Lighting / LED Bulbs",
    localLabel: "Indoor + compound lights",
    runningWatts: 15,
    surgeMultiplier: 1,
    defaultQty: 12,
    minQty: 0,
    maxQty: 48,
    qtyStep: 2,
    note: "15W LED each. Count rooms, passage, compound.",
    hoursByProfile: {
      outages_24_7: 8,
      few_hours: 6,
      night_only: 6,
      daytime_shop: 10,
    },
    dutyCycle: 1,
  },
  {
    id: "wifi",
    name: "Wi-Fi Router & Laptops",
    localLabel: "Work-from-home stack",
    runningWatts: 100,
    surgeMultiplier: 1.2,
    defaultQty: 1,
    minQty: 0,
    maxQty: 4,
    qtyStep: 1,
    note: "100W combined per workstation stack (router + 1–2 laptops).",
    hoursByProfile: {
      outages_24_7: 16,
      few_hours: 12,
      night_only: 6,
      daytime_shop: 10,
    },
    dutyCycle: 1,
  },
];

export function defaultQuantities(): Record<string, number> {
  return Object.fromEntries(APPLIANCES.map((a) => [a.id, 0]));
}

export function defaultSizes(): Record<string, string> {
  return Object.fromEntries(
    APPLIANCES.filter((a) => a.sizes?.length).map((a) => [
      a.id,
      a.defaultSizeId ?? a.sizes![0].id,
    ]),
  );
}

export function resolveSize(
  appliance: Appliance,
  sizeId?: string,
): ApplianceSize | null {
  if (!appliance.sizes?.length) return null;
  const id = sizeId ?? appliance.defaultSizeId ?? appliance.sizes[0].id;
  return appliance.sizes.find((s) => s.id === id) ?? appliance.sizes[0];
}

export function applianceWatts(
  appliance: Appliance,
  sizeId?: string,
): { runningWatts: number; surgeMultiplier: number; sizeLabel?: string } {
  const size = resolveSize(appliance, sizeId);
  if (!size) {
    return {
      runningWatts: appliance.runningWatts,
      surgeMultiplier: appliance.surgeMultiplier,
    };
  }
  return {
    runningWatts: size.runningWatts,
    surgeMultiplier: size.surgeMultiplier ?? appliance.surgeMultiplier,
    sizeLabel: size.label,
  };
}
