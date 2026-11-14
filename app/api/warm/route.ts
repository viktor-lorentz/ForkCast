import { getRecommendation } from "@/lib/cached-recommend";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import { getEnrichedDay } from "@/lib/menus";
import { cleanProfile } from "@/lib/profile";
import { addDays, todayLA } from "@/lib/usc";

export const maxDuration = 300;

/**
 * Called by a daily Vercel cron (vercel.json), and by hand before a demo. Tags today's and tomorrow's
 * menus, then precomputes today's picks for the sample students so their links open instantly.
 */
export async function GET() {
  const today = todayLA();
  const days = await Promise.allSettled([today, addDays(today, 1)].map(getEnrichedDay));
  const menus = days.map((d) => (d.status === "fulfilled" ? { date: d.value.date, aiTagged: d.value.aiTagged } : { error: String(d.reason) }));

  let warmed = 0;
  const first = days[0];
  if (first.status === "fulfilled") {
    const meals = [...new Set(first.value.halls.flatMap((h) => h.meals))];
    const jobs = DEMO_PROFILES.flatMap((d) => meals.map((meal) => ({ profile: cleanProfile(d.profile), meal })));
    // A few at a time, to stay well inside API rate limits.
    for (let i = 0; i < jobs.length; i += 6) {
      const done = await Promise.allSettled(jobs.slice(i, i + 6).map((j) => getRecommendation(first.value, j.profile, j.meal)));
      warmed += done.filter((r) => r.status === "fulfilled" && r.value.source === "ai").length;
    }
  }
  return Response.json({ menus, warmed });
}
