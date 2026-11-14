import type { EnrichedDish } from "./enrich";
import { hasPref, hideReason } from "./filter";
import type { Profile } from "./profile";
import { ratingOf } from "./taste";
import { ALLERGENS, HALLS, LABEL_NAMES, PREFERENCES } from "./types";

/** A claim the AI makes about a dish, checked against USC labels. "no:<allergen>" or a diet code. */
export type Claim = string;

export interface Pick {
  dishId: string;
  why: string;
  claims: Claim[];
}

export interface AiRecommendation {
  hall: string;
  picks: Pick[];
  summary: string;
}

export interface Check {
  ok: boolean;
  text: string;
}

export interface Verification {
  passed: boolean;
  checks: Check[];
}

const BANNED = /\b(safe|safely|guaranteed|allergen[- ]free)\b/i;

function claimHolds(claim: Claim, dish: EnrichedDish): boolean {
  if (claim.startsWith("no:")) {
    const allergen = claim.slice(3);
    return (ALLERGENS as readonly string[]).includes(allergen) && !dish.allergens.includes(allergen) && !dish.allergens.includes("not-analyzed");
  }
  return (PREFERENCES as readonly string[]).includes(claim) && hasPref(dish, claim);
}

export function describeClaim(claim: Claim): string {
  return claim.startsWith("no:") ? `no ${LABEL_NAMES[claim.slice(3)] ?? claim.slice(3)}` : (LABEL_NAMES[claim] ?? claim);
}

/**
 * Checks an AI recommendation against the real menu. Everything here is plain code:
 * the model can't talk its way past it.
 */
export function verify(
  rec: AiRecommendation,
  dishes: EnrichedDish[],
  meal: string,
  profile: Profile,
  /** Walking minutes per hall, when known. Any "N min" the AI writes must be one of these. */
  walkMinutes: number[] = [],
): Verification {
  const checks: Check[] = [];
  const add = (ok: boolean, text: string) => checks.push({ ok, text });
  const byId = new Map(dishes.map((d) => [d.id, d]));

  const hall = HALLS.find((h) => h.id === rec.hall);
  add(Boolean(hall), hall ? `${hall.name} is a real dining hall` : `Unknown hall "${rec.hall}"`);
  add(rec.picks.length > 0, `${rec.picks.length} dishes picked`);

  const ids = rec.picks.map((p) => p.dishId);
  if (new Set(ids).size !== ids.length) add(false, "The same dish was picked twice");
  if (rec.picks.length > 6) add(false, "Too many dishes picked");

  let allExist = true;
  let allEligible = true;
  let allClaimsHold = true;
  for (const p of rec.picks) {
    const d = byId.get(p.dishId);
    if (!d || d.hall !== rec.hall || d.meal !== meal || d.kind === "notice") {
      allExist = false;
      add(false, `Dish ${p.dishId} is not on today's ${meal} menu at this hall`);
      continue;
    }
    if (ratingOf(profile.taste, d.name) === -1) {
      allEligible = false;
      add(false, `${d.name} got a thumbs down from you`);
    }
    if (hideReason(d, profile)) {
      allEligible = false;
      add(false, `${d.name} conflicts with your profile`);
    }
    for (const c of p.claims) {
      if (!claimHolds(c, d)) {
        allClaimsHold = false;
        add(false, `Claim "${describeClaim(c)}" about ${d.name} doesn't match USC labels`);
      }
    }
    if (BANNED.test(p.why)) {
      allClaimsHold = false;
      add(false, `Reason for ${d.name} overstates safety`);
    }
  }
  if (allExist) add(true, "Every dish is on today's USC menu");
  if (allEligible) add(true, `No dish carries an allergen you avoid${profile.diet.length ? " or misses a diet label you need" : ""}`);
  if (allClaimsHold) add(true, "Every label claim matches USC's labels");
  if (BANNED.test(rec.summary)) add(false, "Summary overstates safety");

  const text = [rec.summary, ...rec.picks.map((p) => p.why)].join(" ");
  const stated = [...text.matchAll(/(\d+)[\s-]*min/gi)].map((m) => Number(m[1]));
  if (stated.length > 0) {
    const ok = stated.every((n) => walkMinutes.includes(n));
    add(ok, ok ? "Walking times match the map data" : "A walking time in the answer doesn't match the map data");
  }

  // Macro numbers are estimates added up by code and shown by the app; the AI isn't allowed to state its own.
  if (/\b\d+\s*(g|grams?|k?cal|calories?)\b/i.test(text)) add(false, "The answer states a calorie or gram number; only the app's own totals are shown");

  return { passed: checks.every((c) => c.ok), checks };
}
