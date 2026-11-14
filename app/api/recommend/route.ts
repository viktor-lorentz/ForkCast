import { unstable_cache } from "next/cache";
import { getEnrichedDay } from "@/lib/menus";
import { cleanProfile, profileKey, type Profile } from "@/lib/profile";
import { recommend } from "@/lib/recommend";
import { currentMeal } from "@/lib/score";
import { isValidDate, todayLA } from "@/lib/usc";

export const maxDuration = 60;

// Same profile + date + meal → same answer for an hour; saves time and API spend during demos.
const cachedRecommend = unstable_cache(
  async (_key: string, profile: Profile, date: string, meal: string) => {
    const rec = await recommend(await getEnrichedDay(date), meal, profile);
    if (rec.source !== "ai") throw Object.assign(new Error("rules fallback"), { rec });
    return rec;
  },
  ["recommend-v3"],
  { revalidate: 3600 },
);

export async function POST(request: Request) {
  let body: { profile?: unknown; date?: string; meal?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
  let profile: Profile;
  try {
    profile = cleanProfile(body.profile);
  } catch {
    return Response.json({ error: "invalid profile" }, { status: 400 });
  }
  const date = body.date ?? todayLA();
  if (!isValidDate(date)) return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });

  try {
    const day = await getEnrichedDay(date);
    const meals = [...new Set(day.halls.flatMap((h) => h.meals))];
    const meal = body.meal && meals.includes(body.meal) ? body.meal : currentMeal(meals);
    if (!meal) return Response.json({ error: `No meals listed for ${date}` }, { status: 404 });
    try {
      return Response.json(await cachedRecommend(profileKey(profile), profile, date, meal));
    } catch (err) {
      // Rules fallbacks aren't cached, so the AI gets another chance next time.
      const rec = (err as { rec?: unknown }).rec ?? (await recommend(day, meal, profile));
      return Response.json(rec);
    }
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
