import nodemailer from "nodemailer";

/** Email goes out through a team Gmail account (no domain needed). Off until both settings exist. */
export const emailEnabled = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!emailEnabled()) throw new Error("Email isn't set up");
  transport ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await transport.sendMail({ from: `"Where Should I Eat?" <${process.env.GMAIL_USER}>`, to, subject, html, text });
}

/** Only USC addresses: blocks using the form to spam strangers, and fits who the app is for. */
export function cleanUscEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const e = input.trim().toLowerCase();
  return /^[a-z0-9._%+-]{1,64}@usc\.edu$/.test(e) ? e : null;
}
