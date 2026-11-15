import { unstable_cache } from "next/cache";
import type { EnrichedDay } from "./menus";
import { profileKey, type Profile } from "./profile";
import { createHash } from "node:crypto";
import { formatAvg } from "./ratings";
import { lookupScores } from "./ratings-store";
import { recommend, type RatingMap, type Recommendation } from "./recommend";
import { scoreHalls } from "./score";
import { getSwitches } from "./switches";

/** Student ratings for the dishes this profile could get at this meal; empty if the store is down. */
async function relevantRatings(day: EnrichedDay, profile: Profile, meal: string): Promise<RatingMap> {
  const names = scoreHalls(day, meal, profile).flatMap((s) => (s.open ? [...s.mains, ...s.sides, ...s.desserts] : [])).map((d) => d.name);
  try {
    return await lookupScores(names);
  } catch {
    return {};
  }
}

/** Changes when a relevant rating moves by about half a point, so picks refresh as students rate. */
function ratingsKey(r: RatingMap): string {
  const parts = Object.entries(r)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${formatAvg(Math.round(v.avg * 2) / 2)}/${Math.min(v.n, 5)}`);
  return parts.length ? createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12) : "none";
}

/**
 * Same profile + date + meal → same answer for a few hours; saves time and API spend.
 * The day's menu is loaded by the caller and closed over: loading it inside the cached function
 * skipped the menu cache and re-ran AI tagging on every cold server instance.
 */
export async function getRecommendation(day: EnrichedDay, profile: Profile, meal: string): Promise<Recommendation> {
  const [ratings, switches] = await Promise.all([relevantRatings(day, profile, meal), getSwitches()]);
  // Emergency switch: code-only picks, no AI call and no cached AI answer.
  if (switches.rulesOnly) return recommend(day, meal, profile, ratings, { rulesOnly: true });
  const cached = unstable_cache(
    async () => {
      const rec = await recommend(day, meal, profile, ratings);
      // Only verified AI answers are cached, so a fallback gets a fresh AI attempt next time.
      if (rec.source !== "ai") throw Object.assign(new Error("rules fallback"), { rec });
      return rec;
    },
    ["recommend-v7", day.date, meal, profileKey(profile), ratingsKey(ratings)],
    { revalidate: 3 * 3600 },
  );
  try {
    return await cached();
  } catch (err) {
    return (err as { rec?: Recommendation }).rec ?? recommend(day, meal, profile, ratings);
  }
}
