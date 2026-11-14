import { unstable_cache } from "next/cache";
import { getEnrichedDay } from "./menus";
import { profileKey, type Profile } from "./profile";
import { recommend, type Recommendation } from "./recommend";

// Same profile + date + meal → same answer for a few hours; saves time and API spend.
const cached = unstable_cache(
  async (_key: string, profile: Profile, date: string, meal: string) => {
    const rec = await recommend(await getEnrichedDay(date), meal, profile);
    // Only verified AI answers are cached, so a fallback gets a fresh AI attempt next time.
    if (rec.source !== "ai") throw Object.assign(new Error("rules fallback"), { rec });
    return rec;
  },
  ["recommend-v4"],
  { revalidate: 3 * 3600 },
);

export async function getRecommendation(profile: Profile, date: string, meal: string): Promise<Recommendation> {
  try {
    return await cached(profileKey(profile), profile, date, meal);
  } catch (err) {
    const rec = (err as { rec?: Recommendation }).rec;
    return rec ?? recommend(await getEnrichedDay(date), meal, profile);
  }
}
