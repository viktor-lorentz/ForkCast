import { notice } from "@/lib/email/page";
import { confirm } from "@/lib/email/store";

export async function GET(request: Request) {
  const sub = await confirm(new URL(request.url).searchParams.get("t") ?? "");
  return sub
    ? notice("You're subscribed", "Your picks will arrive every morning around 7 AM. Every email has an unsubscribe link.")
    : notice("Link expired", "Open the app and ask for the daily email again.");
}
