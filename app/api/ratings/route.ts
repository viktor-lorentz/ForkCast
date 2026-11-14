import { isScore, validRater } from "@/lib/ratings";
import { ratingsEnabled, saveScore, underRateLimit } from "@/lib/ratings-store";

/** POST { dish, score (1–10, or null to clear), rater } → the dish's new average. */
export async function POST(request: Request) {
  if (!ratingsEnabled()) return Response.json({ error: "Ratings aren't set up" }, { status: 503 });
  let body: { dish?: unknown; score?: unknown; rater?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
  const dish = typeof body.dish === "string" ? body.dish.trim() : "";
  if (!dish || dish.length > 140) return Response.json({ error: "dish name required" }, { status: 400 });
  if (!(body.score === null || isScore(body.score))) return Response.json({ error: "score must be 1–10" }, { status: 400 });
  if (!validRater(body.rater)) return Response.json({ error: "rater id required" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await underRateLimit(ip))) return Response.json({ error: "Too many ratings, try again later" }, { status: 429 });
  try {
    return Response.json({ score: await saveScore(dish, body.rater, body.score as number | null) });
  } catch (err) {
    console.error("rating failed:", err);
    return Response.json({ error: "Couldn't save that rating" }, { status: 502 });
  }
}
