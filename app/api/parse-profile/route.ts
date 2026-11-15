import { parseProfileText } from "@/lib/parse-profile";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "parse-profile");
  if (limited) return limited;
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || !text.trim() || text.length > 2000) {
    return Response.json({ error: "text required" }, { status: 400 });
  }
  try {
    return Response.json(await parseProfileText(text));
  } catch (err) {
    console.error("parse-profile failed:", err);
    return Response.json({ error: "Couldn't read that right now" }, { status: 502 });
  }
}
