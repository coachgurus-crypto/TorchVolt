export type GridProfileId =
  | "outages_24_7"
  | "few_hours"
  | "night_only"
  | "daytime_shop";

export interface Appliance {
  id: string;
  name: string;
  localLabel: string;
  runningWatts: number;
  surgeMultiplier: number;
  defaultQty: number;
  minQty: number;
  maxQty: number;
  qtyStep: number;
  note: string;
  hoursByProfile: Record<GridProfileId, number>;
  dutyCycle: number;
}

export interface QuoteLine {
  sku: string;
  name: string;
  qty: number;
  unitPriceNgn: number;
}

export interface Quote {
  id: string;
  customerId?: string;
  createdAt: string;
  city: string;
  quantities: Record<string, number>;
  gridProfileId: GridProfileId;
  packageId: string;
  peakLoadW: number;
  surgeW: number;
  cashPriceNgn: number;
  monthlyPaymentNgn: number;
  dailyGenerationKwh: number;
  monthlySavingsNgn: number;
  lines: QuoteLine[];
}

export interface SolarPackage {
  id: string;
  name: string;
  tagline: string;
  inverterKw: number;
  inverterSurgeW: number;
  inverterBrand: string;
  batteryKwh: number;
  batteryBrand: string;
  panelWatts: number;
  panelCount: number;
  panelBrand: string;
  cashPriceNgn: number;
  installDays: string;
}
