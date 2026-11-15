# Security

ForkCast is a hackathon project, built in a weekend and reviewed before submission. This page says what protects it, what we checked, and what we would still tighten.

## What protects students

- **No accounts and no passwords.** A profile (allergens, diet, likes) lives in the student's browser. Share links carry it after `#`, which browsers never send to a server.
- **Little stored data.** The server keeps only opt-in daily email subscriptions, anonymous 1–10 dish ratings keyed by a random browser ID, and rate-limit counters. Unconfirmed subscriptions expire after 7 days, and every email has a one-click unsubscribe that deletes the record.
- **Allergen decisions are code, not AI.** USC's labels are the only source of truth, and every AI answer is re-checked against them before it is shown ([`lib/verify.ts`](lib/verify.ts)).

## What protects the service

| Risk | Control |
| --- | --- |
| Running up the AI bill | Per-IP limits on every endpoint that calls a model ([`lib/rate-limit.ts`](lib/rate-limit.ts)), a Vercel Firewall rule behind them (set in Vercel, not in this repo), and caching so identical requests do no new work |
| Using the email form to spam | @usc.edu addresses only, one email per address per 10 minutes, 5 sends per minute per IP, 300 subscriber cap, double opt-in |
| Bad input | Profiles are validated against a zod schema: allergens, diets, goals and languages must be known codes, and free-text fields are capped in length and count ([`lib/profile.ts`](lib/profile.ts)); dates must match `YYYY-MM-DD` within a one-week window; text and dish names are length-capped; tokens must match a fixed pattern before any lookup |
| Prompt injection | The free-text box goes to a parser whose output is constrained to a zod schema. Likes and dislikes are short capped strings. Whatever the picker is told, it can only choose from dishes the filter already allowed, and code verifies its answer, so a manipulated answer that breaks a rule is rejected |
| Model output we cannot trust | Every model response is parsed against a zod schema; a failure falls back to code-only behavior |
| Leaked keys | Secrets live only in Vercel's settings and a git-ignored `.env.local`. [`.env.example`](.env.example) holds names only |
| Triggering the daily email from outside | `/api/email/daily` requires a bearer `CRON_SECRET` |
| Browser attacks | No `eval`, and the only inline HTML is one fixed theme script with no user input ([`app/layout.tsx`](app/layout.tsx)); React escapes all other text; responses send `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS from Vercel |

## What we checked on Nov 15, 2026

- **Secrets:** scanned every commit in the history for API keys, tokens and private keys. None found, and no `.env` file was ever committed.
- **Dependencies:** `npm audit --omit=dev` reports 0 vulnerabilities in what ships. The full audit lists 7 moderate advisories, all inside ESLint's tooling, which runs only on a developer's machine.
- **Input handling:** 10 malformed or hostile requests against the live site, each rejected with the right status. See [docs/VERIFICATION.md](docs/VERIFICATION.md).
- **Code review** of every API route for missing validation, missing limits and data exposure.

## Known limits

- Both cron routes go through `lib/cron-auth.ts`. When `CRON_SECRET` is set, `/api/email/daily` and `/api/warm` require it. If it is ever missing in production, `/api/email/daily` refuses every request instead of falling open; `/api/warm` stays callable because it only fills the cache.
- Rate limits allow requests through if Redis is unreachable, so an outage never blocks a student from seeing a pick. The Vercel Firewall rule is the backstop.
- Ratings are one per browser, not one per student. USC NetID login is the planned fix.
- There is no Content-Security-Policy header yet.

## Reporting a problem

Open an issue on this repository, or contact the team through our Devpost page.
