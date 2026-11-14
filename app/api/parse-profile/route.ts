import { parseProfileText } from "@/lib/profile";

export async function POST(request: Request) {
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "text required" }, { status: 400 });
  }
  try {
    return Response.json(await parseProfileText(text));
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
