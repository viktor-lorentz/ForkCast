import { getRecommendation } from "../cached-recommend";
import { hoursOn } from "../hours";
import { getHours } from "../hours-server";
import { getEnrichedDay } from "../menus";
import { foodTags } from "../plate";
import type { Profile } from "../profile";
import type { Recommendation } from "../recommend";
import { shareUrl } from "../share";
import { HALLS } from "../types";
import { describeClaim } from "../verify";
import { findDorm } from "../walking";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const hallName = (id: string) => HALLS.find((h) => h.id === id)?.name ?? id;

export interface Digest {
  subject: string;
  html: string;
  text: string;
}

/**
 * Today's picks for every meal, as an email. Uses the same cached, verified recommendations
 * as the app, so the email and the screen always agree.
 */
export async function buildDigest(
  profile: Profile,
  date: string,
  links: { origin: string; confirm?: string; unsubscribe?: string },
): Promise<Digest> {
  const [day, hours] = await Promise.all([getEnrichedDay(date), getHours()]);
  const meals = [...new Set(day.halls.flatMap((h) => h.meals))];
  const recs = (await Promise.all(meals.map((m) => getRecommendation(day, profile, m).catch(() => null)))).filter(
    (r): r is Recommendation => r !== null,
  );
  const dorm = findDorm(profile.dorm);
  const appLink = shareUrl(links.origin, profile);
  const pretty = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

  const mealHtml = recs.map((r) => {
    const h = hours.halls.find((x) => x.hall === r.hall);
    const open = h ? hoursOn(h, date).hours : "";
    const walk = r.halls.find((x) => x.hall === r.hall)?.walk;
    const meta = [walk != null && dorm ? `${walk} min walk from ${dorm.name}` : "", open ? `Open ${open}` : ""].filter(Boolean).join(" · ");
    const picks = r.picks
      .map((p) => {
        const tags = [...p.claims.map(describeClaim), ...foodTags(p)].join(" · ");
        return `<li style="margin:0 0 6px"><strong>${esc(p.name)}</strong>${tags ? `<br><span style="color:#57534e;font-size:13px">${esc(tags)}</span>` : ""}</li>`;
      })
      .join("");
    return `<div style="background:#fff;border:1px solid #e7e5e4;border-radius:14px;padding:16px;margin:0 0 14px">
<div style="color:#990000;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase">${esc(r.meal)}</div>
<div style="font-size:22px;font-weight:700;margin:2px 0 4px">${r.picks.length ? esc(hallName(r.hall)) : "No hall has a match"}</div>
${meta ? `<div style="color:#78716c;font-size:13px;margin:0 0 6px">${esc(meta)}</div>` : ""}
<p style="margin:0 0 10px;color:#292524">${esc(r.summary)}</p>
${picks ? `<ul style="padding-left:18px;margin:0">${picks}</ul>` : ""}
</div>`;
  });

  const confirmBlock = links.confirm
    ? `<div style="background:#fff7d6;border:1px solid #ffcc00;border-radius:14px;padding:14px;margin:0 0 14px">
<strong>Want this every morning?</strong> <a href="${esc(links.confirm)}" style="color:#990000;font-weight:700">Yes, send it daily</a><br>
<span style="color:#78716c;font-size:13px">If you didn't ask for this, ignore it and nothing more will be sent.</span></div>`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#faf7f2;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:520px;margin:0 auto;padding:20px 16px">
<div style="font-size:20px;font-weight:700;color:#990000">Where should I eat?</div>
<div style="color:#78716c;margin:0 0 16px">${esc(pretty)}</div>
${confirmBlock}
${mealHtml.join("") || `<p>USC hasn't posted menus for today yet.</p>`}
<p style="margin:16px 0"><a href="${esc(appLink)}" style="background:#990000;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;display:inline-block">Open my picks in the app</a></p>
<p style="color:#78716c;font-size:12px;line-height:1.5">Based on USC Hospitality's allergen and diet labels. Labels can change and kitchens share equipment, so always confirm with dining staff if you have a serious allergy.${
    links.unsubscribe ? ` <a href="${esc(links.unsubscribe)}" style="color:#78716c">Unsubscribe</a>` : ""
  }</p>
</div></body></html>`;

  const text = [
    `Where should I eat? ${pretty}`,
    links.confirm ? `\nWant this every morning? ${links.confirm}\n` : "",
    ...recs.map((r) => `${r.meal}: ${r.picks.length ? hallName(r.hall) : "no match"}\n${r.summary}\n${r.picks.map((p) => `- ${p.name}`).join("\n")}\n`),
    `Open the app: ${appLink}`,
    "Based on USC's labels. Always confirm with dining staff if you have a serious allergy.",
    links.unsubscribe ? `Unsubscribe: ${links.unsubscribe}` : "",
  ].join("\n");

  const first = recs[0];
  const subject = first?.picks.length ? `${first.meal}: ${hallName(first.hall)}${recs[1]?.picks.length ? ` · ${recs[1].meal}: ${hallName(recs[1].hall)}` : ""}` : "Today's dining picks";
  return { subject, html, text };
}
