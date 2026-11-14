import { notice } from "@/lib/email/page";
import { removeToken } from "@/lib/email/store";

export async function GET(request: Request) {
  await removeToken(new URL(request.url).searchParams.get("t") ?? "");
  return notice("Unsubscribed", "You won't get any more daily emails. Your profile is deleted from our list.");
}
