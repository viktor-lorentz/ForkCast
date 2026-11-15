import { getRecommendation } from "@/lib/cached-recommend";
import { getEnrichedDay } from "@/lib/menus";
import { cleanProfile, type Profile } from "@/lib/profile";
import { rateLimit } from "@/lib/rate-limit";
import { currentMeal } from "@/lib/score";
import { addDays, isValidDate, todayLA } from "@/lib/usc";

export const maxDuration = 60;

const BOOT = Date.now();

export async function POST(request: Request) {
  const limited = await rateLimit(request, "recommend");
  if (limited) return limited;
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
  const today = todayLA();
  const date = body.date ?? today;
  if (!isValidDate(date) || date < addDays(today, -1) || date > addDays(today, 7)) {
    return Response.json({ error: "date must be YYYY-MM-DD within the next week" }, { status: 400 });
  }

  try {
    const t0 = Date.now();
    const day = await getEnrichedDay(date);
    const t1 = Date.now();
    const meals = [...new Set(day.halls.flatMap((h) => h.meals))];
    const meal = body.meal && meals.includes(body.meal) ? body.meal : currentMeal(meals);
    if (!meal) return Response.json({ error: `No meals listed for ${date}` }, { status: 404 });
    const rec = await getRecommendation(day, profile, meal);
    // Visible in browser dev tools (Network → Timing) for diagnosing slow responses.
    return Response.json(rec, { headers: { "server-timing": `menu;dur=${t1 - t0}, pick;dur=${Date.now() - t1}, boot;dur=${t0 - BOOT}` } });
  } catch (err) {
    console.error("recommend failed:", err);
    return Response.json({ error: "Couldn't build a recommendation right now" }, { status: 502 });
  }
}
