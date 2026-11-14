import { emailEnabled } from "@/lib/email/send";
import { storeEnabled } from "@/lib/email/store";

/** Lets the app hide the email card until email is set up. */
export async function GET() {
  return Response.json({ enabled: emailEnabled(), daily: emailEnabled() && storeEnabled() });
}
