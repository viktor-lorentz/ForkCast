import { getEnrichedDay } from "@/lib/menus";
import { addDays, isValidDate, todayLA } from "@/lib/usc";

export const maxDuration = 60;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? todayLA();
  const today = todayLA();
  if (!isValidDate(date) || date < addDays(today, -1) || date > addDays(today, 7)) {
    return Response.json({ error: "date must be YYYY-MM-DD within the next week" }, { status: 400 });
  }
  try {
    return Response.json(await getEnrichedDay(date));
  } catch (err) {
    console.error("menu failed:", err);
    return Response.json({ error: "Couldn't load USC's menus right now" }, { status: 502 });
  }
}
