import { getEnrichedDay } from "@/lib/menus";
import { cleanProfile, type Profile } from "@/lib/profile";
import { rateLimit } from "@/lib/rate-limit";
import { addDays, todayLA } from "@/lib/usc";
import { notPosted, planDay, WEEK_DAYS } from "@/lib/week";

export const maxDuration = 60;

/** The next 7 days for one profile: best hall and top 2 dishes per meal, code scoring only (no AI picks). */
export async function POST(request: Request) {
  const limited = await rateLimit(request, "week");
  if (limited) return limited;
  let profile: Profile;
  try {
    profile = cleanProfile((await request.json()).profile);
  } catch {
    return Response.json({ error: "invalid profile" }, { status: 400 });
  }
  const today = todayLA();
  const dates = Array.from({ length: WEEK_DAYS }, (_, i) => addDays(today, i));
  const days = await Promise.all(
    dates.map(async (date) => {
      try {
        return planDay(await getEnrichedDay(date), profile);
      } catch (err) {
        console.warn(`Week: ${date} unavailable:`, (err as Error).message);
        return notPosted(date);
      }
    }),
  );
  return Response.json({ days });
}
