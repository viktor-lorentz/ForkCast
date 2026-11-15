import { HALLS, type HallId } from "./types";

/** Opening hours from USC Hospitality's "Hours of Operation" page. */
export interface HallHours {
  hall: HallId;
  /** "Mon".."Sun" → "7:00AM – 10:00PM" (or "Closed"). */
  regular: Record<string, string>;
  /** Date-specific overrides such as game days and holidays; date is "MM/DD". */
  special: { label: string; date: string; hours: string }[];
}

export interface HoursData {
  source: "live" | "saved";
  halls: HallHours[];
}

export const HOURS_URL = "https://hospitality.usc.edu/hours-of-operation/";
const PAGE_NAMES: Record<HallId, string> = {
  evk: "Everybody’s Kitchen",
  parkside: "Parkside Residential Dining Hall",
  "university-village": "USC Village Dining Hall",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function textLines(html: string): string[] {
  const entities: Record<string, string> = { "&amp;": "&", "&#8217;": "’", "&#8211;": "–", "&nbsp;": " ", "&#038;": "&", "&#39;": "'" };
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&#?\w+;/g, (e) => entities[e] ?? e)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Pulls the three residential halls out of the page. Throws if the page layout changed. */
export function parseHours(html: string): HallHours[] {
  const lines = textLines(html);
  return HALLS.map(({ id }) => {
    const name = PAGE_NAMES[id];
    const start = lines.indexOf(name);
    const end = lines.indexOf(`Go to ${name}`, start);
    if (start < 0 || end < 0) throw new Error(`Hours for ${name} not found`);
    const out: HallHours = { hall: id, regular: {}, special: [] };
    let label = "";
    for (let i = start + 1; i < end; i++) {
      const block = lines[i].match(/^(.*?)\s+hours for /);
      if (block) {
        label = block[1].trim();
        continue;
      }
      const key = lines[i];
      const value = lines[i + 1] ?? "";
      const isHours = /\d(:\d\d)?\s*[AP]M|closed/i.test(value);
      if (!isHours) continue;
      if (DAYS.includes(key) && /regular/i.test(label)) out.regular[key] = value;
      else if (/^\d{1,2}\/\d{1,2}$/.test(key)) out.special.push({ label, date: key.padStart(5, "0"), hours: value });
      else continue;
      i++;
    }
    if (Object.keys(out.regular).length < 7) throw new Error(`Regular hours for ${name} incomplete`);
    return out;
  });
}

/** Hours for one hall on a YYYY-MM-DD date, preferring a special-day entry. */
export function hoursOn(h: HallHours, date: string): { hours: string; label: string | null } {
  const mmdd = date.slice(5).replace("-", "/");
  const special = h.special.find((s) => s.date === mmdd);
  if (special) return { hours: special.hours, label: special.label };
  const [y, m, d] = date.split("-").map(Number);
  const dow = DAYS[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];
  return { hours: h.regular[dow] ?? "Hours not posted", label: null };
}

/** Minutes after midnight for "7:00AM" / "10PM"; null if unreadable. */
export function minutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2})(?::(\d\d))?\s*([AP])M$/i);
  if (!m) return null;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "P" ? 12 : 0)) * 60 + Number(m[2] ?? 0);
}

/** "Open now · closes 10:00PM", "Opens 8:30AM", "Closed for today" for a range like "7:00AM – 10:00PM". */
export function openStatus(hours: string, nowMinutes: number): { open: boolean; text: string } | null {
  if (/closed/i.test(hours)) return { open: false, text: "Closed today" };
  const [a = "", b = ""] = hours.split(/\s*[–-]\s*/);
  const from = minutes(a);
  const to = minutes(b);
  if (from === null || to === null) return null;
  if (nowMinutes < from) return { open: false, text: `Opens ${a.trim()}` };
  if (nowMinutes < to) return { open: true, text: `Open now · closes ${b.trim()}` };
  return { open: false, text: "Closed for today" };
}
