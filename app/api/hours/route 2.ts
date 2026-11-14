import { getHours } from "@/lib/hours-server";

/** Dining hall hours from USC Hospitality, refreshed every few hours. */
export async function GET() {
  return Response.json(await getHours());
}
