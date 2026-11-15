# Verification report

Everything below was run on **Sunday, Nov 15, 2026, between 6:10 and 7:00 AM PT**, before the Devpost deadline, against this repository and the live site at https://forkcast-usc.vercel.app. Anyone can repeat it with the commands shown.

## Summary

| Check | Command | Result |
| --- | --- | --- |
| Unit and scenario tests | `npm test` | **206 of 206 passed**, 16 files, 0.4 s, no network or API key |
| Lint | `npm run lint` | **0 errors, 0 warnings** |
| Type check and production build | `npm run build` | **Passed** (TypeScript strict mode, 21 routes) |
| Shipped dependencies | `npm audit --omit=dev` | **0 vulnerabilities** |
| Secrets in git history | pattern scan of all 128 commits | **None found** |
| Live site, end to end | `npm run verify:live` | **28 of 28 passed** |
| Local build with no AI key | `node scripts/verify-live.mjs http://localhost:3111` | **28 of 28 passed** (rules-only fallback) |
| Phone layout | Opened `/?demo=halal-sesame` and `/rate` at 375×812 | Rendered correctly, **0 console errors** |
| Deck | Compared the live deck with [deck/forkcast-deck.html](deck/forkcast-deck.html) | **Identical file** |

## Live site, end to end

[`scripts/verify-live.mjs`](../scripts/verify-live.mjs) does not trust the app's own "checks passed" badge. For each of the eight sample students it asks the live app for a pick, then re-checks every picked dish against the menu feed with separate code: the dish must be on today's menu at the chosen hall and meal, carry no allergen the student avoids, not be marked "not analyzed" by USC, carry every diet label the student requires, and the wording must not overstate safety.

| Area | Check | Result | Detail |
| --- | --- | --- | --- |
| Pages | GET / | Pass | HTTP 200 |
| Pages | GET /rate | Pass | HTTP 200 |
| Pages | GET /manifest.webmanifest | Pass | HTTP 200 |
| Pages | GET /forkcast-deck.html | Pass | HTTP 200 |
| Pages | GET /?demo=halal-sesame | Pass | HTTP 200 |
| Data | GET /api/menu returns 3 halls with dishes | Pass | 3 halls, 264 dishes for 2026-11-15 |
| Data | GET /api/hours | Pass | HTTP 200 |
| Data | GET /api/switches | Pass | HTTP 200 |
| Data | GET /api/email/status | Pass | HTTP 200 |
| Input checks | GET /api/menu with a malformed date | Pass | HTTP 400 |
| Input checks | GET /api/menu a year ahead | Pass | HTTP 400 |
| Input checks | POST /api/recommend with a broken body | Pass | HTTP 400 |
| Input checks | POST /api/recommend with an unknown allergen | Pass | HTTP 400 |
| Input checks | POST /api/recommend with an out-of-range date | Pass | HTTP 400 |
| Input checks | POST /api/week with no profile | Pass | HTTP 400 |
| Input checks | POST /api/parse-profile with empty text | Pass | HTTP 400 |
| Input checks | POST /api/email/send to a non-USC address | Pass | HTTP 400 |
| Input checks | POST /api/ratings with score 11 | Pass | HTTP 400 |
| Input checks | GET /api/email/confirm with a made-up token | Pass | HTTP 200 |
| Picks | celiac (Brunch, 2026-11-15) | Pass | parkside, 5 dishes, 11 hidden, source: ai |
| Picks | egg-soy (Brunch, 2026-11-15) | Pass | university-village, 5 dishes, 9 hidden, source: ai |
| Picks | halal-sesame (Brunch, 2026-11-15) | Pass | evk, 4 dishes, 2 hidden, source: ai |
| Picks | no-restrictions (Brunch, 2026-11-15) | Pass | evk, 5 dishes, 0 hidden, source: ai |
| Picks | nut-allergy (Brunch, 2026-11-15) | Pass | university-village, 4 dishes, 0 hidden, source: ai |
| Picks | seafood-allergy (Brunch, 2026-11-15) | Pass | university-village, 5 dishes, 0 hidden, source: ai |
| Picks | vegan-gluten-free (Brunch, 2026-11-15) | Pass | parkside, 5 dishes, 10 hidden, source: ai |
| Picks | vegetarian-dairy-free (Brunch, 2026-11-15) | Pass | university-village, 5 dishes, 10 hidden, source: ai |
| Planning | POST /api/week returns 7 days | Pass | HTTP 200, 7 days |

28 of 28 checks passed against https://forkcast-usc.vercel.app.

"source: ai" means the pick came from the model and passed verification on the live site. The same script against a local build with no API key returned "source: rules" for all eight students and passed the same checks, which shows the fallback path works on its own.

## What the tests cover

| File | What it proves |
| --- | --- |
| `lib/recommend.test.ts` | No sample student is ever given a dish with an avoided allergen; the verifier rejects an invented dish, a wrong hall, a false label claim, a duplicate, a made-up walking time and the word "safe"; closing halls, walking distance, ratings, languages and the rules-only switch behave as designed |
| `lib/features.test.ts`, `lib/exclude.test.ts`, `lib/starters.test.ts` | Thumbs ratings, eating styles, fitness goals, and foods USC does not label, such as beef, are removed by name |
| `lib/lang.test.ts` | Wording that overstates safety or states calorie and gram numbers is caught |
| `lib/closing.test.ts`, `lib/week.test.ts`, `lib/history.test.ts` | Closing-time warnings, the week plan, and "I ate this" history |
| `lib/ratings.test.ts`, `lib/rate-limit.test.ts`, `lib/switches.test.ts` | Rating math and validation, per-IP limits, emergency switches default to off |
| `lib/usc.test.ts`, `lib/enrich.test.ts`, `lib/taste-cards.test.ts` | USC's feed is normalized correctly; dishes still get tagged when the AI is unavailable |
| `lib/i18n.test.ts`, `lib/contrast.test.ts` | All six translations contain every string; text contrast meets WCAG AA |

## Security

See [SECURITY.md](../SECURITY.md) for the full review. In short: no secrets in the history, no vulnerable shipped dependency, every hostile request in the table above was rejected, and standard security headers were added and confirmed on the live site. After that change deployed, the live check was run again: 28 of 28 passed.

## Not checked

We would rather say so than imply otherwise.

- Sending a real email end to end. We tested that bad addresses are rejected, but did not send mail during this run.
- Settings that live in Vercel and not in this repo: `CRON_SECRET`, the Firewall rate-limit rule, and the emergency switches store.
- Physical phones. The phone check above used a browser at phone size. The team tested on real phones on Saturday.
- The six non-English languages were checked for completeness by tests, not read by a native speaker during this run.
