import { BRAND } from "@/lib/constants";
import { APPLIANCES, GRID_PROFILES, applianceWatts } from "@/lib/data/appliances";
import { PACKAGES } from "@/lib/data/packages";
import type { GridProfileId, Quote, SolarPackage } from "@/lib/types";

export interface LoadResult {
  runningWatts: number;
  coincidentSurgeW: number;
  dailyKwh: number;
}

export function computeLoad(
  quantities: Record<string, number>,
  gridProfileId: GridProfileId,
  hoursOverride: Record<string, number> = {},
  sizes: Record<string, string> = {},
): LoadResult {
  let runningWatts = 0;
  let dailyKwh = 0;
  const surgeEvents: number[] = [];

  for (const appliance of APPLIANCES) {
    const qty = quantities[appliance.id] ?? 0;
    if (qty <= 0) continue;
    const power = applianceWatts(appliance, sizes[appliance.id]);
    const running = power.runningWatts * qty;
    runningWatts += running;
    surgeEvents.push(power.runningWatts * power.surgeMultiplier * qty);
    const hours =
      hoursOverride[appliance.id] ?? appliance.hoursByProfile[gridProfileId];
    dailyKwh += (running * hours * appliance.dutyCycle) / 1000;
  }

  const largestMotorStart = surgeEvents.length ? Math.max(...surgeEvents) : 0;
  const coincidentSurgeW = Math.round(largestMotorStart + runningWatts * 0.18);

  return {
    runningWatts,
    coincidentSurgeW,
    dailyKwh: Number(dailyKwh.toFixed(2)),
  };
}

function packageFits(pkg: SolarPackage, load: LoadResult, neededBatteryKwh: number): boolean {
  const continuousOk = pkg.inverterKw * 1000 >= load.runningWatts * 1.2;
  const surgeOk = pkg.inverterSurgeW >= load.coincidentSurgeW;
  const batteryOk = pkg.batteryKwh >= neededBatteryKwh * 0.92;
  return continuousOk && surgeOk && batteryOk;
}

export function recommendPackage(
  quantities: Record<string, number>,
  gridProfileId: GridProfileId,
  hoursOverride: Record<string, number> = {},
  sizes: Record<string, string> = {},
): { pkg: SolarPackage; load: LoadResult; neededBatteryKwh: number } {
  const load = computeLoad(quantities, gridProfileId, hoursOverride, sizes);
  const profile = GRID_PROFILES.find((p) => p.id === gridProfileId)!;
  const neededBatteryKwh = Number((load.dailyKwh * profile.autonomyDays).toFixed(1));

  const fit =
    PACKAGES.find((pkg) => packageFits(pkg, load, neededBatteryKwh)) ??
    PACKAGES[PACKAGES.length - 1];

  return { pkg: fit, load, neededBatteryKwh };
}

export function dailyGenerationKwh(pkg: SolarPackage): number {
  const arrayKw = (pkg.panelCount * pkg.panelWatts) / 1000;
  return Number((arrayKw * BRAND.peakSunHours * BRAND.performanceRatio).toFixed(1));
}

export function monthlySavingsNgn(
  load: LoadResult,
  gridProfileId: GridProfileId,
): number {
  const profile = GRID_PROFILES.find((p) => p.id === gridProfileId)!;
  const genHourRate = 4_200;
  const gridTariff = 209;
  const genCost = profile.genHoursPerDay * genHourRate * 30;
  const displacedGrid = load.dailyKwh * 0.55 * gridTariff * 30;
  return Math.round(Math.min(genCost * 0.85 + displacedGrid, genCost + displacedGrid));
}

export function monthlyPayment(cashPriceNgn: number): number {
  return Math.round((cashPriceNgn * 1.125) / 18);
}

export function buildQuote(
  quantities: Record<string, number>,
  gridProfileId: GridProfileId,
  city = "Ibadan",
  hoursOverride: Record<string, number> = {},
  sizes: Record<string, string> = {},
): Quote {
  const { pkg, load } = recommendPackage(
    quantities,
    gridProfileId,
    hoursOverride,
    sizes,
  );
  const cash = pkg.cashPriceNgn;
  const generation = dailyGenerationKwh(pkg);

  return {
    id: `Q-${pkg.id}-${gridProfileId}`,
    createdAt: "",
    city,
    quantities,
    sizes,
    gridProfileId,
    packageId: pkg.id,
    peakLoadW: load.runningWatts,
    surgeW: load.coincidentSurgeW,
    cashPriceNgn: cash,
    monthlyPaymentNgn: monthlyPayment(cash),
    dailyGenerationKwh: generation,
    monthlySavingsNgn: monthlySavingsNgn(load, gridProfileId),
    lines: [
      {
        sku: `${pkg.inverterBrand}-HYB-${pkg.inverterKw}`,
        name: `${pkg.inverterBrand} ${pkg.inverterKw}kW Hybrid Inverter`,
        qty: 1,
        unitPriceNgn: Math.round(cash * 0.22),
      },
      {
        sku: `${pkg.batteryBrand}-${pkg.batteryKwh}`,
        name: `${pkg.batteryBrand} ${pkg.batteryKwh}kWh Lithium`,
        qty: 1,
        unitPriceNgn: Math.round(cash * 0.46),
      },
      {
        sku: `${pkg.panelBrand}-${pkg.panelWatts}`,
        name: `${pkg.panelBrand} ${pkg.panelWatts}W × ${pkg.panelCount}`,
        qty: pkg.panelCount,
        unitPriceNgn: Math.round((cash * 0.2) / pkg.panelCount),
      },
      {
        sku: "TV-BOS-INSTALL",
        name: "Mounting, cabling, changeover & commissioning",
        qty: 1,
        unitPriceNgn: Math.round(cash * 0.12),
      },
    ],
  };
}

export function estimateWhatsAppText(quote: Quote, pkg: SolarPackage): string {
  const sizeBits = APPLIANCES.filter((a) => (quote.quantities[a.id] ?? 0) > 0)
    .map((a) => {
      const qty = quote.quantities[a.id];
      const power = applianceWatts(a, quote.sizes[a.id]);
      const size = power.sizeLabel ? ` ${power.sizeLabel}` : "";
      return `${qty}× ${a.name}${size}`;
    })
    .join(", ");

  return [
    `Hello TorchVolt, I estimated my power need on the site.`,
    `City: ${quote.city}`,
    sizeBits ? `Appliances: ${sizeBits}` : null,
    `Suggested package: ${pkg.name}`,
    `Please send a quote on WhatsApp.`,
  ]
    .filter(Boolean)
    .join("\n");
}
