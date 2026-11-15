import { getRecommendation } from "../cached-recommend";
import { hoursOn } from "../hours";
import { getHours } from "../hours-server";
import { getEnrichedDay } from "../menus";
import { dishEmoji, MEAL_EMOJI } from "../emoji";
import { findGoal, foodTags } from "../plate";
import type { Profile } from "../profile";
import type { Recommendation } from "../recommend";
import { shareUrl } from "../share";
import { HALLS, LABEL_NAMES } from "../types";
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

  const pill = (text: string, tone: "green" | "amber" | "stone") => {
    const c = { green: ["#ecfdf5", "#065f46"], amber: ["#fffbeb", "#92400e"], stone: ["#f5f5f4", "#57534e"] }[tone];
    return `<span style="display:inline-block;background:${c[0]};color:${c[1]};border-radius:999px;padding:3px 9px;font-size:12px;font-weight:600;margin:4px 4px 0 0;white-space:nowrap">${esc(text)}</span>`;
  };
  const chip = (text: string) =>
    `<span style="display:inline-block;background:rgba(255,255,255,0.16);color:#ffffff;border-radius:999px;padding:5px 11px;font-size:13px;font-weight:600;margin:6px 6px 0 0;white-space:nowrap">${esc(text)}</span>`;

  const group = (title: string, picks: Recommendation["picks"]) =>
    picks.length === 0
      ? ""
      : `<tr><td style="padding:16px 20px 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a8a29e">${title}</td></tr>` +
        picks
          .map((p) => {
            const labels = p.claims.map((c) => pill(describeClaim(c), "green")).join("");
            const tags = foodTags(p).map((t) => pill(t, "amber")).join("");
            return `<tr><td style="padding:8px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="44" valign="top" style="font-size:28px;line-height:1">${dishEmoji(p.name)}</td>
<td valign="top"><div style="font-size:16px;font-weight:700;color:#1c1917;line-height:1.3">${esc(p.name)}</div>
<div style="font-size:13px;color:#78716c;margin-top:2px">${esc(p.why)}</div>
<div>${labels}${tags}</div></td>
</tr></table></td></tr>`;
          })
          .join("");

  const mealHtml = recs.map((r) => {
    const h = hours.halls.find((x) => x.hall === r.hall);
    const open = h ? hoursOn(h, date).hours : "";
    const walk = r.halls.find((x) => x.hall === r.hall)?.walk;
    const chips = [walk != null && dorm ? chip(`🚶 ${walk} min walk`) : "", open ? chip(`🕐 ${open}`) : ""].join("");
    const mains = r.picks.filter((p) => p.kind === "main");
    const others = r.picks.filter((p) => p.kind !== "main");
    return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border-radius:20px;overflow:hidden;margin:0 0 18px;border:1px solid #e7e5e4">
<tr><td style="background:#990000;padding:18px 20px 16px;color:#ffffff">
<div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffcc00">${MEAL_EMOJI[r.meal] ?? "🍴"} ${esc(r.meal)} · go to</div>
<div style="font-size:26px;font-weight:800;margin-top:4px">${r.picks.length ? esc(hallName(r.hall)) : "No hall has a match"}</div>
<div>${chips}</div>
</td></tr>
<tr><td style="padding:14px 20px 0;font-size:15px;line-height:1.5;color:#292524">${esc(r.summary)}</td></tr>
${group("🍛 Mains", mains)}${group("🥗 Sides & more", others)}
<tr><td style="height:14px"></td></tr>
</table>`;
  });

  const profileChips = [
    ...profile.avoid.map((a) => `No ${LABEL_NAMES[a] ?? a}`),
    ...profile.diet.map((d) => LABEL_NAMES[d] ?? d),
    ...(profile.goal ? [findGoal(profile.goal)?.name ?? ""] : []),
  ]
    .filter(Boolean)
    .map((t) => pill(t, "stone"))
    .join("");

  const confirmBlock = links.confirm
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff7d6;border:1px solid #ffcc00;border-radius:16px;margin:0 0 18px"><tr><td style="padding:14px 18px;font-size:15px">
☀️ <strong>Want this every morning?</strong> <a href="${esc(links.confirm)}" style="color:#990000;font-weight:700">Yes, send it daily</a>
<div style="color:#78716c;font-size:13px;margin-top:4px">If you didn't ask for this, ignore it and nothing more will be sent.</div></td></tr></table>`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:520px;margin:0 auto;padding:24px 14px">
<div style="font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:40px"><img src="${esc(links.origin)}/logo-mark.png" width="40" height="40" alt="" style="vertical-align:middle;border:0;margin-right:8px"><span style="vertical-align:middle;color:#1c1917">Fork</span><span style="vertical-align:middle;color:#990000">Cast</span></div>
<div style="color:#78716c;font-size:15px;margin:2px 0 4px">Your dining forecast for ${esc(pretty)}</div>
<div style="margin:0 0 18px">${profileChips}</div>
${confirmBlock}
${mealHtml.join("") || `<p>USC hasn't posted menus for today yet.</p>`}
<div style="text-align:center;margin:22px 0"><a href="${esc(appLink)}" style="background:#990000;color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;display:inline-block;font-size:16px">Open ForkCast</a><div style="margin-top:12px;font-size:14px"><a href="${esc(links.origin)}/rate" style="color:#990000;font-weight:600;text-decoration:none">⭐ Ate something yesterday? Rate it 1–10</a></div></div>
<p style="color:#a8a29e;font-size:12px;line-height:1.5;text-align:center">Based on USC Hospitality's allergen and diet labels. Labels can change and kitchens share equipment, so always confirm with dining staff if you have a serious allergy.${
    links.unsubscribe ? `<br><a href="${esc(links.unsubscribe)}" style="color:#a8a29e">Unsubscribe</a>` : ""
  }</p>
</div></body></html>`;

  const text = [
    `ForkCast · your dining forecast for ${pretty}`,
    links.confirm ? `\nWant this every morning? ${links.confirm}\n` : "",
    ...recs.map((r) => `${r.meal}: ${r.picks.length ? hallName(r.hall) : "no match"}\n${r.summary}\n${r.picks.map((p) => `- ${p.name}`).join("\n")}\n`),
    `Open the app: ${appLink}`,
    `Rate what you ate: ${links.origin}/rate`,
    "Based on USC's labels. Always confirm with dining staff if you have a serious allergy.",
    links.unsubscribe ? `Unsubscribe: ${links.unsubscribe}` : "",
  ].join("\n");

  const first = recs[0];
  const subject = first?.picks.length ? `${first.meal}: ${hallName(first.hall)}${recs[1]?.picks.length ? ` · ${recs[1].meal}: ${hallName(recs[1].hall)}` : ""}` : "Today's dining picks";
  return { subject, html, text };
}
