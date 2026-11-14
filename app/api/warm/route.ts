import { getEnrichedDay } from "@/lib/menus";
import { addDays, todayLA } from "@/lib/usc";

export const maxDuration = 60;

/** Called by a daily Vercel cron (vercel.json) so the first student each morning doesn't wait on AI tagging. */
export async function GET() {
  const today = todayLA();
  const days = await Promise.allSettled([today, addDays(today, 1)].map(getEnrichedDay));
  return Response.json(days.map((d) => (d.status === "fulfilled" ? { date: d.value.date, aiTagged: d.value.aiTagged } : { error: String(d.reason) })));
}
