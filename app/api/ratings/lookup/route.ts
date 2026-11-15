import { lookupScores } from "@/lib/ratings-store";
import { isDate, validRater } from "@/lib/ratings";

/** POST { names: string[], rater? } → { scores: { [dishKey]: { avg, n, mine? } } }. Dishes nobody rated are left out. */
export async function POST(request: Request) {
  let body: { names?: unknown; rater?: unknown; date?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
  const names = Array.isArray(body.names) ? body.names.filter((n): n is string => typeof n === "string" && n.length <= 140).slice(0, 400) : [];
  try {
    return Response.json({ scores: await lookupScores(names, validRater(body.rater) ? body.rater : undefined, isDate(body.date) ? body.date : undefined) });
  } catch (err) {
    console.error("rating lookup failed:", err);
    return Response.json({ scores: {} });
  }
}
