import { buildDigest } from "@/lib/email/digest";
import { cleanUscEmail, emailEnabled, sendEmail } from "@/lib/email/send";
import { addPending, allowSend } from "@/lib/email/store";
import { cleanProfile } from "@/lib/profile";
import { todayLA } from "@/lib/usc";

export const maxDuration = 60;

/** POST {email, profile, daily?} → sends today's picks now; with daily, the email also carries a confirm link. */
export async function POST(request: Request) {
  if (!emailEnabled()) return Response.json({ error: "Email isn't set up yet" }, { status: 503 });
  let body: { email?: unknown; profile?: unknown; daily?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }
  const email = cleanUscEmail(body.email);
  if (!email) return Response.json({ error: "Use your @usc.edu email" }, { status: 400 });
  let profile;
  try {
    profile = cleanProfile(body.profile);
  } catch {
    return Response.json({ error: "invalid profile" }, { status: 400 });
  }
  if (!(await allowSend(email))) return Response.json({ error: "We just emailed that address. Try again in a few minutes." }, { status: 429 });

  const origin = new URL(request.url).origin;
  const token = body.daily === true ? await addPending(email, profile) : null;
  try {
    const digest = await buildDigest(profile, todayLA(), {
      origin,
      confirm: token ? `${origin}/api/email/confirm?t=${token}` : undefined,
    });
    await sendEmail(email, digest.subject, digest.html, digest.text);
    return Response.json({ sent: true, daily: Boolean(token) });
  } catch (err) {
    console.error("email send failed:", err);
    return Response.json({ error: "Couldn't send the email right now" }, { status: 502 });
  }
}
