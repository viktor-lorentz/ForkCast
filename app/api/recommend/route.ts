import { getRecommendation } from "@/lib/cached-recommend";
import { getEnrichedDay } from "@/lib/menus";
import { cleanProfile, type Profile } from "@/lib/profile";
import { currentMeal } from "@/lib/score";
import { addDays, isValidDate, todayLA } from "@/lib/usc";

export const maxDuration = 60;

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
  const today = todayLA();
  const date = body.date ?? today;
  if (!isValidDate(date) || date < addDays(today, -1) || date > addDays(today, 7)) {
    return Response.json({ error: "date must be YYYY-MM-DD within the next week" }, { status: 400 });
  }

  try {
    const day = await getEnrichedDay(date);
    const meals = [...new Set(day.halls.flatMap((h) => h.meals))];
    const meal = body.meal && meals.includes(body.meal) ? body.meal : currentMeal(meals);
    if (!meal) return Response.json({ error: `No meals listed for ${date}` }, { status: 404 });
    return Response.json(await getRecommendation(profile, date, meal));
  } catch (err) {
    console.error("recommend failed:", err);
    return Response.json({ error: "Couldn't build a recommendation right now" }, { status: 502 });
  }
}
