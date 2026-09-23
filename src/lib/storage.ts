import { STORAGE_KEYS } from "@/lib/constants";
import type { GridProfileId, Quote } from "@/lib/types";

export type SiteKind = "home" | "shop";

export interface DraftQuote {
  quantities: Record<string, number>;
  hours: Record<string, number>;
  sizes?: Record<string, string>;
  gridProfileId: GridProfileId;
  city: string;
  siteKind?: SiteKind;
  usesGenerator?: boolean | null;
  genHoursPerDay?: number;
  quote?: Quote;
}

export function loadDraft(): DraftQuote | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.quote);
    if (!raw) return null;
    return JSON.parse(raw) as DraftQuote;
  } catch {
    return null;
  }
}

export function saveDraft(draft: DraftQuote) {
  localStorage.setItem(STORAGE_KEYS.quote, JSON.stringify(draft));
}
