/**
 * Guards the cron endpoints. Vercel sends `Authorization: Bearer $CRON_SECRET` with each cron request
 * when the secret is set in the project.
 *
 * - Secret set: the header must match, everywhere.
 * - Secret missing: allowed in local dev and previews. In production, `strict` routes (the ones that
 *   send email) refuse, so a missing secret can never let strangers email every subscriber.
 */
export function cronAuthorized(request: Request, { strict }: { strict: boolean }): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  return !(strict && process.env.VERCEL_ENV === "production");
}
