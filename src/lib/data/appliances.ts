import type { Appliance, GridProfileId } from "@/lib/types";

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
    name: "Inverter AC (1.5HP)",
    localLabel: "Split inverter — not compressor AC",
    runningWatts: 1500,
    surgeMultiplier: 1.35,
    defaultQty: 0,
    minQty: 0,
    maxQty: 6,
    qtyStep: 1,
    note: "Running 1,500W. Inverter compressors surge ~1.35×, not 3×.",
    hoursByProfile: {
      outages_24_7: 8,
      few_hours: 5,
      night_only: 4,
      daytime_shop: 6,
    },
    dutyCycle: 0.7,
  },
  {
    id: "fridge",
    name: "Double-Door Refrigerator",
    localLabel: "Thermocool-class fridge/freezer",
    runningWatts: 300,
    surgeMultiplier: 3.5,
    defaultQty: 1,
    minQty: 0,
    maxQty: 4,
    qtyStep: 1,
    note: "Running 300W. Compressor start ~1,050W — sized into surge headroom.",
    hoursByProfile: {
      outages_24_7: 24,
      few_hours: 24,
      night_only: 24,
      daytime_shop: 24,
    },
    dutyCycle: 0.38,
  },
  {
    id: "pump",
    name: "Water Pumping Machine (1HP)",
    localLabel: "Borehole or surface pump",
    runningWatts: 900,
    surgeMultiplier: 4,
    defaultQty: 0,
    minQty: 0,
    maxQty: 2,
    qtyStep: 1,
    note: "Running 900W. Induction start can hit ~3,600W for a few seconds.",
    hoursByProfile: {
      outages_24_7: 1.5,
      few_hours: 1.2,
      night_only: 1,
      daytime_shop: 0.8,
    },
    dutyCycle: 1,
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
