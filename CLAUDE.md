@AGENTS.md

# ForkCast: USC dining hall picker (team Overcooked)

Phone-first web app for the AI@USC Hackathon (Nov 14–15, 2026). It tells a USC student which residential dining hall (EVK, Parkside, USC Village) has food they can eat this meal, with USC's own allergen labels as evidence. Team plan: `docs/HACKATHON_PLAN.md`. Product spec: `docs/PRD.md`.

## Stack
- Next.js 16 (App Router, no Cache Components) + TypeScript + Tailwind 4
- `@anthropic-ai/sdk`: `claude-haiku-5-5` classifies dishes and parses profiles; `claude-sonnet-5-5` picks dishes and explains
- `zod` validates every model output; `vitest` for tests
- No accounts. Profiles live in the browser and move between devices with a `#p=` share link/QR (`lib/share.ts`); enriched menus and AI picks are cached in Next's data cache (`unstable_cache`)
- Optional email (`lib/email/`): Gmail SMTP sends picks to @usc.edu addresses only; daily subscribers live in Upstash Redis with double opt-in; a cron at 15:00 UTC sends them
- Hosted on Vercel: every push to `main` deploys to https://forkcast-usc.vercel.app; daily crons hit `/api/warm` and `/api/email/daily`

## Data source
`GET https://hospitality.usc.edu/wp-json/hsp-api/v1/get-res-dining-menus/{evk|parkside|university-village}?y=YYYY&m=MM&d=DD`
returns `{date, location, meals:[{name, stations:[{station, subtitle, menu:[{item, allergens[], preferences[]}]}]}]}`.
Saved copies live in `data/snapshots/<date>/<hall>.json`; `DEMO_MODE=1` reads only those.

## Layout
- `lib/`: data (`usc.ts`, `hours.ts`), AI (`enrich.ts`, `recommend.ts`, `profile.ts`), rules (`filter.ts`, `score.ts`, `verify.ts`), taste and fitness (`taste.ts` thumbs ratings, `plate.ts` estimates and goal plates, `styles.ts` pescatarian/keto/Word of Wisdom), student ratings (`ratings.ts` 1–10 scores averaged across browsers, stored in Upstash by `ratings-store.ts`; `/rate` page)
- `app/`: pages and `app/api/*` route handlers
- `data/test-profiles/`: sample students plus expected results (Andrew edits these)
- `data/snapshots/`: saved USC menus for tests and demo mode
- `data/walking.json`: walking minutes from each residence to each hall, precomputed by `scripts/walking.mjs` from OpenStreetMap foot routes
- `docs/`: plan, PRD, pitch, Devpost copy, video notes (Andrew and Hailey edit these)

## The one demo flow
Open on phone → pick restrictions and likes (no login) → today's card names the best hall with counts per hall → "Why?" shows reasons, USC label evidence, and the dishes we hid → switch profile, pick changes.

## Rules
- **Allergens are enforced by code, never by the model.** USC labels are the only source of truth. Model output must cite dish IDs and pass `lib/verify.ts`.
- Macro estimates are AI guesses from dish names: use them for ranking and show only labels (High protein, Lighter, Hearty, Low carb), never calorie or gram numbers.
- Never write "safe" in the UI. Say "no flagged allergens per USC labels" and tell people to confirm with dining staff.
- Never break `main`: `npm test` and `npm run build` must pass before merging.
- Work on a `feat/*` branch, open a PR, and merge it yourself once checks pass. Docs-only edits can go straight to `main`.
- Never commit secrets. Keys go in `.env.local` (gitignored) and in the host's secrets settings.
