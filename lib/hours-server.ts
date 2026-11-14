import { readFileSync } from "node:fs";
import path from "node:path";
import { HOURS_URL, parseHours, type HoursData } from "./hours";

function saved(): HoursData {
  const file = path.join(process.cwd(), "data", "hours.json");
  return { source: "saved", halls: JSON.parse(readFileSync(file, "utf8")) };
}

/** Live hours (refetched at most every 6 hours), or the saved copy if USC's page is down or changed. */
export async function getHours(): Promise<HoursData> {
  if (process.env.DEMO_MODE === "1") return saved();
  try {
    const res = await fetch(HOURS_URL, { next: { revalidate: 6 * 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { source: "live", halls: parseHours(await res.text()) };
  } catch (err) {
    console.warn("Hours fetch failed, using saved copy:", (err as Error).message);
    return saved();
  }
}
