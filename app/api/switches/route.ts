import { getSwitches } from "@/lib/switches";

export const dynamic = "force-dynamic";

/** Only the banner is public; the app shows it as a one-line notice. */
export async function GET() {
  const { banner } = await getSwitches();
  return Response.json({ banner }, { headers: { "cache-control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30" } });
}
