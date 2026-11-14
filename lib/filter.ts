import type { EnrichedDish } from "./enrich";
import type { Profile } from "./profile";
import { STYLE_REASONS, styleConflict, type StyleId } from "./styles";
import { LABEL_NAMES, NOT_ANALYZED } from "./types";

export type HideReason =
  | { type: "allergen"; label: string }
  | { type: "not-analyzed" }
  | { type: "diet"; label: string }
  | { type: "restricted" }
  | { type: "style"; style: StyleId };

/** Parkside's Allergen Awareness Zone requires registering with USC Hospitality. */
export const isRestrictedStation = (station: string) => /allergen awareness zone/i.test(station);

export interface Hidden {
  dish: EnrichedDish;
  reason: HideReason;
}

export function hasPref(dish: { prefs: string[] }, pref: string): boolean {
  if (dish.prefs.includes(pref)) return true;
  // USC sometimes labels vegan items without also labeling them vegetarian.
  return pref === "vegetarian" && dish.prefs.includes("vegan");
}

/** Why this dish is off-limits for the profile, or null if it's allowed. Uses USC labels only. */
export function hideReason(dish: EnrichedDish, profile: Profile): HideReason | null {
  const allergen = profile.avoid.find((a) => dish.allergens.includes(a));
  if (allergen) return { type: "allergen", label: allergen };
  if (profile.avoid.length > 0 && dish.allergens.includes(NOT_ANALYZED)) return { type: "not-analyzed" };
  if (!profile.aaz && isRestrictedStation(dish.station)) return { type: "restricted" };
  const missing = profile.diet.find((p) => !hasPref(dish, p));
  if (missing) return { type: "diet", label: missing };
  const style = styleConflict(dish, profile.styles);
  if (style) return { type: "style", style };
  return null;
}

export function describeReason(r: HideReason): string {
  if (r.type === "allergen") return `Contains ${LABEL_NAMES[r.label] ?? r.label} (USC label)`;
  if (r.type === "not-analyzed") return "Not analyzed for allergens by USC";
  if (r.type === "style") return STYLE_REASONS[r.style];
  if (r.type === "restricted") return "Allergen Awareness Zone: registered students only";
  return `Not labeled ${LABEL_NAMES[r.label] ?? r.label} by USC`;
}

export interface FilterResult {
  eligible: EnrichedDish[];
  hidden: Hidden[];
}

/** Splits dishes into eligible and hidden. Notices are dropped entirely: they aren't food. */
export function filterDishes(dishes: EnrichedDish[], profile: Profile): FilterResult {
  const eligible: EnrichedDish[] = [];
  const hidden: Hidden[] = [];
  for (const dish of dishes) {
    if (dish.kind === "notice") continue;
    const reason = hideReason(dish, profile);
    if (reason) hidden.push({ dish, reason });
    else eligible.push(dish);
  }
  return { eligible, hidden };
}
