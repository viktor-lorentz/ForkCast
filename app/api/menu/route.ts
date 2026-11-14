import { getDayMenus, isValidDate, todayLA } from "@/lib/usc";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? todayLA();
  if (!isValidDate(date)) return Response.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  try {
    return Response.json(await getDayMenus(date));
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
