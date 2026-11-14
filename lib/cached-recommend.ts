import { unstable_cache } from "next/cache";
import type { EnrichedDay } from "./menus";
import { profileKey, type Profile } from "./profile";
import { recommend, type Recommendation } from "./recommend";

/**
 * Same profile + date + meal → same answer for a few hours; saves time and API spend.
 * The day's menu is loaded by the caller and closed over: loading it inside the cached function
 * skipped the menu cache and re-ran AI tagging on every cold server instance.
 */
export async function getRecommendation(day: EnrichedDay, profile: Profile, meal: string): Promise<Recommendation> {
  const cached = unstable_cache(
    async () => {
      const rec = await recommend(day, meal, profile);
      // Only verified AI answers are cached, so a fallback gets a fresh AI attempt next time.
      if (rec.source !== "ai") throw Object.assign(new Error("rules fallback"), { rec });
      return rec;
    },
    ["recommend-v5", day.date, meal, profileKey(profile)],
    { revalidate: 3 * 3600 },
  );
  try {
    return await cached();
  } catch (err) {
    return (err as { rec?: Recommendation }).rec ?? recommend(day, meal, profile);
  }
}
