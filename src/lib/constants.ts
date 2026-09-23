export const BRAND = {
  name: "TorchVolt",
  tagline: "Solar for your home or office — with a free quote.",
  city: "Ibadan · Lagos · Abuja",
  phoneE164: "2348165452992",
  phoneDisplay: "+234 816 545 2992",
  whatsappE164: "2348165452992",
  peakSunHours: 4.5,
  performanceRatio: 0.75,
} as const;

export const STORAGE_KEYS = {
  quote: "torchvolt.quote.v2",
} as const;

export function whatsappUrl(text: string): string {
  return `https://wa.me/${BRAND.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export function telUrl(): string {
  return `tel:+${BRAND.phoneE164}`;
}
