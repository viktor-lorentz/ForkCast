# PS5 Winners Hackathon Plan

As of 2026-11-13 · Viktor Lorentz
Live, commentable version: https://claude.ai/artifact/7KrMXiUWrCNptRfiFVCLz1

We're building a mobile web app that tells each USC student which dining hall has food they can actually eat today, and proves it with USC's own allergen labels. This is the shared plan for the AI@USC Hackathon (Nov 14–15, 2026). Comment or open a PR; Viktor makes the final call.

## Contents

- [Ground rules](#ground-rules)
- [Decisions so far](#decisions-so-far)
- [The idea](#the-idea)
- [How the AI works](#how-the-ai-works)
- [Stack and tools](#stack-and-tools)
- [Who does what](#who-does-what)
- [Schedule](#schedule)
- [Claude prompts for Andrew](#claude-prompts-for-andrew)
- [Risks and fallbacks](#risks-and-fallbacks)
- [Before Saturday](#before-saturday)
- [Sources](#sources)

## Ground rules

No code or design assets until Viktor types `GO — hackathon has started` on Saturday. The hackathon requires everything to be built during the event. This plan is the only file added before then. After GO, it becomes `docs/PRD.md` and `CLAUDE.md` during the first 30 minutes.

- Talking, researching and planning are fine now. Building is not.
- Pitch text, the deck and the video get made after GO as well. Prompts for them are in [Claude prompts for Andrew](#claude-prompts-for-andrew), ready to run.

## Decisions so far

| Question | Decision | Why |
| --- | --- | --- |
| Language | TypeScript + Next.js | Nobody on the team is faster in Python, and Claude writes all the code. One Next.js app gives us the phone UI, the API and the daily job in one deploy. |
| Claude Code plan | Viktor's Claude Pro: Opus for features, Sonnet for small fixes, Fable (free this weekend) for planning, hard bugs and the final review | Pro has tighter usage limits than Max, and a 13-hour build will hit them. Andrew's Pro is the overflow (see prompts section). |
| API credits | **Yes, load $20 on the Anthropic Console** | Claude Pro subscriptions only cover chatting with Claude and Claude Code. The deployed app calls Claude by itself every day, and that needs an API key with credits. Expected spend is a few dollars for the weekend (approximate). Ask AWS/Google at check-in about credits as a backup. |
| Domain + email | **No domain. The web app is the product; email is a stretch goal** | Judges score the app they open on their phone. Resend can only email your own address without a verified domain. If we have time, send the daily email from a new team Gmail (an app password works without a domain). Otherwise pitch it as a next step. |
| Team | Hailey (Cinema) joins as video and visual lead | The demo video and pitch visuals are a big part of the 20% UX score and the final pitch. |
| Competitors | Two apps already exist. We still need a clear answer for how we're different | See [The idea](#the-idea). |

## The idea

**Lead with dietary restrictions; personal taste comes second.** "Which hall has better food" is a toy. "I'm halal with a sesame allergy, and every meal I check three halls on a cluttered website" is a real problem. It fits USG's focus on inclusion and gives the AI a job we can verify.

**Pitch line:** Tell it what you can't eat and what you love. Every day it tells you which dining hall actually has food for you, with USC's own labels as proof.

### What already exists (verify before the pitch)

| Existing option | What it does | How we're different |
| --- | --- | --- |
| [USC menu site](https://hospitality.usc.edu/residential-dining-menus/) | One hall at a time, with a "hide items containing" allergen filter | You still check 3 halls × 4 meals yourself. We compare every hall and pick for you. |
| [Trojan Dining app](https://apps.apple.com/us/app/trojan-dining/id1446368951) ([GitHub](https://www.github.com/goldenagellc/Trojan-Dining)) | Student-built menu viewer with allergen filters | Its listing still mentions McCarthy (now closed), so it may be unmaintained. It shows menus; it doesn't recommend. Rishi checks whether it still works. |
| [DineOn](https://apps.apple.com/us/app/id6749644621) | Unknown, appeared in a USC dining search | Rishi checks it Saturday morning. |

The judge question to prepare for: "USC's site already has an allergen filter." Our answer is that the filter works per hall and per meal. We make the decision across all halls, personalize it, explain it, and never show an item marked "not analyzed for allergens" to someone with an allergy. The cluttered USC site is our "before" shot in the video.

### The 90-second demo

1. Open the link on a phone. Pick restrictions (sesame, halal), foods you love (spicy, rice bowls) and your dorm. Three taps, no login.
2. Today's card: "Dinner: go to EVK. 5 dishes for you vs 2 at Village and 1 at Parkside." The top dishes show label chips.
3. Tap **Why?** to see the explanation and the evidence, including what we hid: "Sesame Noodles (USC label: sesame)."
4. Switch the profile to vegan + gluten-free. The pick changes live.
5. Stretch goal: show tomorrow's email.

## How the AI works

The AI ranks and explains, but plain code enforces allergens. So even if the AI makes a mistake, the system can't recommend a dish USC labeled with your allergen.

1. **Scrape (once a day).** The USC page loads its dishes with JavaScript after the page opens; they aren't in the raw HTML. We find the data feed the page calls in the browser's Network tab and pull from it directly. Labels show up as icons named after the allergen (`gluten.svg`, `sesame.svg`, `halal-ingredients.svg`), which code can read exactly.
2. **Normalize (Claude Haiku 4.5, once a day for everyone).** Turn the raw data into clean dishes: hall, meal, station, name, USC labels, plus inferred tags like cuisine and protein. Inferred tags never override USC labels.
3. **Filter (plain code).** Remove every dish with a flagged allergen. For allergy profiles, also remove dishes marked "Food Not Analyzed For Allergens."
4. **Rank and explain (Claude Sonnet 5.5).** Given only the dishes that passed the filter plus the student's tastes, pick a hall and write the reason. Dishes are cited by ID, so it can't invent one.
5. **Verify (plain code).** Every cited dish must exist today. Every claim like "vegan" or "halal" must match a USC label. A flagged allergen must never get through. Results that fail are regenerated or dropped. Rishi's test profiles run against this check automatically.

The USC page also offers Brunch, so weekend meal names differ. Meal periods are read from the data, not hardcoded. The page shows no calories or macros, so macros stay out unless we find real data.

## Stack and tools

| Part | Choice | Verdict | Note |
| --- | --- | --- | --- |
| App | Next.js + TypeScript + Tailwind, phone-first | Add | Judges open it on phones. No login: profile saved in a link or cookie. |
| Database | Replit's built-in Postgres | Add | Replit's deployed file storage resets, so no SQLite files. |
| Writing code | Claude Code on Viktor's laptop | Keep | One AI, one codebase. Andrew's Claude Code is overflow only, on separate branches. |
| Source of truth | GitHub `viktor-lorentz/PS5-winners` | Keep + add | Turn on branch protection so `main` needs a PR. |
| Hosting + daily job | Replit, imported from GitHub | Keep | Deploys don't happen automatically on merge: Viktor pulls in Replit, then redeploys. The daily job is a separate scheduled deployment. |
| AI in the app | Haiku 4.5 normalizes, Sonnet 5.5 ranks and explains | Change | There's no "Haiku 5.5". Needs API credits (see decisions). |
| Email | Stretch goal: team Gmail with an app password | Change | Resend needs a domain to email anyone but us. |
| Replit Agent, Fly.io, DeepSeek | Not using | Keep | Same reasons as the kickoff doc. |
| Safety net | Demo mode on a saved snapshot of Saturday's real menu | Add | The demo works even if USC's site goes down Sunday. |

## Who does what

| Person | Owns | Edits in the repo |
| --- | --- | --- |
| Viktor (ECE) | Runs Claude Code, architecture, merges every PR, Replit deploys | Everything |
| Andrew (Business) | Scope calls, Devpost page, deck, video script and narration, overflow Claude | `docs/` |
| Rishi (Real Estate) | Interviews, test profiles, accuracy checks against the real menu, live user testing, judge Q&A | `data/test-profiles/`, `docs/` |
| Hailey (Cinema) | Demo video (storyboard, filming, editing), b-roll at the halls, "before vs after" visuals, deck design help | `docs/` (video notes) |

Andrew, Rishi and Hailey open PRs from the GitHub website and only touch their folders. Everything else is a GitHub Issue for Viktor.

## Schedule

The goal: a live phone link by 17:00 Saturday, feature freeze at 21:00, submission by 10:30 Sunday (30 minutes before the deadline).

| Time | Viktor + Claude | Andrew | Rishi | Hailey |
| --- | --- | --- | --- | --- |
| Sat 9:00–10:30 | Check-in, opening; ask sponsors about credits | Same | Same | Same |
| 10:30–11:00 (GO) | CLAUDE.md, PRD, Issues, branch protection, empty app live on Replit | Devpost skeleton, deck outline | Check the menu site and save copies; check Trojan Dining and DineOn | Storyboard v1 |
| 11:00–13:00 | Menu scraper, Haiku normalizer, database, saved snapshot | Problem story, stats, competitor answer | Interview 5–10 students with dietary needs | Film interviews with Rishi (with consent); b-roll at the halls |
| 13:00–15:00 | Filter, Sonnet ranking, verifier, tests on Rishi's profiles | Deck draft | Write 6–8 test profiles with expected picks; check labels against the real site | Record the "before" footage of the cluttered USC site |
| 15:00–17:00 | Phone UI: onboarding, today's card, Why? panel. **Live by 17:00** | Video script v1 with Hailey | First phone tests with 2–3 students | Visual style for the deck |
| 17:00–19:00 | Demo mode; email if ahead | Screenshots, deck v2 | Structured user testing; log Issues | Screen-record the app flow |
| 19:00–21:00 | Fix what testing found, polish, Fable final review | Judge Q&A doc with Rishi | Judge Q&A doc with Andrew | Rough cut |
| 21:00–22:00 | **Feature freeze.** Tag `main` as demo-ready | Narration recording | Final accuracy check | Edit with narration |
| Sun 8:00–9:00 | Critical fixes only. **Code freeze 9:00** | Devpost text final | Re-test the live link | Final cut, under 3:00 |
| Sun 9:00–10:30 | Check the deploy, help where needed | **Submit on Devpost by 10:30** | Practice the 3-min pitch | Upload video |

## Claude prompts for Andrew

Run these in claude.ai **after GO**. Paste the relevant sections of this doc into the chat first so Claude has the context.

1. **Devpost description.** "You're writing a Devpost submission for a 24-hour hackathon. Using the plan I pasted, write the description with these headings: Inspiration, What it does, How we built it, Challenges, Accomplishments, What we learned, What's next. Keep it under 600 words, specific and concrete, no buzzwords. Mention the AI pipeline (Haiku normalizes, Sonnet ranks and explains, code verifies allergens) and the rubric: impact, technical execution, feasibility, UX."
2. **Deck outline.** "Draft a 7-slide pitch deck for a 3-minute pitch to judges and later USC Student Government: problem, who it hurts (with a stat), demo, how the AI works and checks itself, why it's safe and feasible, the path to campus adoption, team. For each slide give a title, at most 3 short bullets, and a speaker note of 2 sentences."
3. **Video script.** "Write a 2:45 demo video script with columns for time, what's on screen, and narration. Open with the cluttered USC menu site as the 'before', show the 90-second demo flow, end with the pitch line. Narration should sound like a student, not an ad."
4. **Judge Q&A.** "List the 12 hardest questions judges might ask this team (liability for allergens, accuracy, existing apps like Trojan Dining, cost per student, what happens if USC changes its site, privacy, how USG would adopt it) and draft a 2-sentence answer to each."
5. **Interview guide (for Rishi and Hailey).** "Write a 5-minute interview guide for USC students with dietary restrictions: 6 open questions about how they decide where to eat, time spent checking menus, bad experiences, and what would make them trust an app. Include a one-line consent script for filming."

**Coding overflow (only if Viktor runs out of Claude Code usage):** Andrew installs Claude Code with his Pro account, clones the repo, and works on one Issue on its own branch, for example `feat/email-template`. Start prompt: "Read CLAUDE.md and docs/PRD.md. Work only on Issue #N on this branch, touch only the files it names, and open a PR when tests pass." Viktor still reviews and merges.

## Risks and fallbacks

| Risk | Fallback |
| --- | --- |
| Menu data loads by JavaScript (confirmed) and the feed is hard to find | Find the feed in DevTools tonight. If that fails, use a headless browser. Always keep a saved snapshot for demo mode. |
| USC changes or blocks the site during the weekend | Demo mode on Saturday's snapshot. Record the video on the snapshot too. |
| AI invents dishes or labels | Dishes are cited by ID only, and code checks every claim against USC labels. |
| Allergen liability | Never say "safe." Say "no flagged allergens per USC labels," add a permanent "confirm with dining staff" note, and hide "not analyzed" items from allergy profiles. |
| Judges say "this already exists" | Our answer: those show menus, we decide across halls and explain why (see [The idea](#the-idea)). |
| Claude Code usage limits | Sonnet for small tasks; Andrew's Claude Code as overflow on separate branches. |
| API credits run out | $20 is far more than we need. Backup: sponsor credits (Bedrock or Gemini). |
| Replit deploy or scheduled job friction | Trigger a protected refresh endpoint from any free cron service. |
| Venue wifi or a judge's phone | QR code on the last slide, plus a backup screen recording. |
| Scope creep | Out until 21:00 Saturday: macros, maps/distance, push notifications, accounts, chat. Distance goes first if we're ahead. |

## Before Saturday

- [ ] Viktor: load $20 on the Anthropic Console; never commit the key to the repo
- [ ] Viktor: add Andrew, Rishi and Hailey as GitHub collaborators
- [ ] Viktor: make sure the Replit account and hackathon credits are active
- [ ] Rishi: open the USC menu page in Chrome, then DevTools → Network → reload, and screenshot the request that returns the dishes
- [ ] Rishi + Hailey: line up 5–10 students with dietary needs for Saturday interviews
- [ ] Rishi: find a stat on how many students have food allergies or dietary restrictions
- [ ] Andrew: read this doc and comment on the pitch line and the demo flow
- [ ] Hailey: think about the video's story arc (no filming or editing until GO)

## Sources

- [USC Residential Dining Menus](https://hospitality.usc.edu/residential-dining-menus/): page structure, allergen filters, meal tabs (checked Nov 13)
- [Trojan Dining on the App Store](https://apps.apple.com/us/app/trojan-dining/id1446368951) and [on GitHub](https://www.github.com/goldenagellc/Trojan-Dining)
- [DineOn on the App Store](https://apps.apple.com/us/app/id6749644621)
