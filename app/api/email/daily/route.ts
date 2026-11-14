import { buildDigest } from "@/lib/email/digest";
import { emailEnabled, sendEmail } from "@/lib/email/send";
import { confirmedSubscribers } from "@/lib/email/store";
import { todayLA } from "@/lib/usc";

export const maxDuration = 300;

/** Daily Vercel cron (vercel.json): sends each confirmed subscriber today's picks. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!emailEnabled()) return Response.json({ sent: 0, note: "email not set up" });
  // Vercel provides the production domain; APP_URL overrides it.
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = process.env.APP_URL ?? (prod ? `https://${prod}` : "https://ps-5-winners.vercel.app");
  const date = todayLA();
  const subs = await confirmedSubscribers();
  let sent = 0;
  let failed = 0;
  // A few at a time: each digest asks the AI once per meal (cached for identical profiles).
  for (let i = 0; i < subs.length; i += 3) {
    const results = await Promise.allSettled(
      subs.slice(i, i + 3).map(async ({ token, sub }) => {
        const d = await buildDigest(sub.profile, date, { origin, unsubscribe: `${origin}/api/email/unsubscribe?t=${token}` });
        await sendEmail(sub.email, d.subject, d.html, d.text);
      }),
    );
    sent += results.filter((r) => r.status === "fulfilled").length;
    failed += results.filter((r) => r.status === "rejected").length;
  }
  return Response.json({ sent, failed });
}
