# Kickoff prompt for Claude Code — Team "Overcooked" (formerly "PS5 Winners") (AI@USC Hackathon)

Paste everything below the line into Claude Code, run from the root of the `ForkCast` repo.

---

You're joining our team as the lead engineering partner for the AI@USC Hackathon. Read all of this before you reply.

## HARD RULE: do not write any code yet

The hackathon rules say all code, design assets and working prototypes must be created during the event (Saturday Nov 14 and Sunday Nov 15, 2026). Until I type exactly `GO — hackathon has started`:

- Do not create, edit or commit any files in this repo.
- Do not scaffold projects, install packages, run generators, or write code snippets meant to be pasted in later.
- Only talk: ask questions, poke holes in the idea, and plan the architecture in words.

If I ask for something that would break this rule before GO, remind me of the rule and don't do it.

## The event

- **Prompt:** "Build an AI-powered tool, prototype, or solution that makes campus life better for USC students or student organizations." Theme: "By Trojans, For Trojans." Suggested directions are Professional (career readiness), Academic (academic success) and Campus Community (club tools and campus apps). They're starting points, not rules.
- **Where/when:** Ginsburg Hall, USC. Check-in 9:00 AM Saturday, opening ceremony 10:00 AM. The building closes 10 PM Saturday and reopens 8 AM Sunday. **Submission deadline: Sunday 11:00 AM PT on Devpost.**
- **Required submission:** project description (problem, solution, tech stack, challenges, next steps), a working prototype link, a demo video of 3 minutes max, a slide deck, and at least one screenshot.
- **Judging:** round 1 (11 AM–2 PM Sunday) picks 10 finalists. Finalists pitch for 3 minutes (3:00–4:30 PM), and the top teams pitch to USC Student Government to bring the idea to campus.
- **Rubric:** Impact & Campus Relevance 30%, Technical & AI Execution 25%, Feasibility & Implementation 25%, User Experience & Design 20%.
- **Prizes:** $8,000 / $4,000 / $2,000 cash for 1st, 2nd and 3rd, plus PS5s and other prizes. Sponsors and judges include K1 Investment Management, AWS, Replit and Google. Participants get free Replit credits.
- **Real build time:** about 13 hours Saturday plus about 1 hour Sunday morning. Code freeze is 9:00 AM Sunday. Scope has to fit that.

## The team

- **Viktor (ECE):** tech lead. Runs you, owns the repo, architecture, AI pipeline and deployment.
- **Andrew (Business Administration):** product and pitch. Scope calls, Devpost page, deck, video script and narration. Has Claude Pro.
- **Rishi (Real Estate Finance & Development):** users and data. Student interviews, test data, accuracy checks, live user testing at the event, judge Q&A.

## The idea (draft, not final)

An AI tool that pulls the USC residential dining hall menus every day (USC Village Dining Hall, EVK, Parkside) and tells each student which hall they'd prefer, based on their preferences. It might send a daily email or notification.

What we know about the data (please verify Saturday before building on it):

- Menus are published daily at https://hospitality.usc.edu/residential-dining-menus/
- Items are labeled for the top 8 allergens, sesame and pork, plus vegan, vegetarian and halal-friendly. Parkside is a peanut/nut-sensitive facility.
- All 3 halls are open 7 days a week, so live data should exist during the demo weekend.

We want to develop the idea further. Before GO, help us make it win:

1. Push on **impact (30%)**. "Which hall has better food today" is fun but could score low. Strong angles to test: students with allergies or dietary restrictions (halal, vegan, gluten) finding safe food fast; fitness and macro goals; distance from your dorm or next class; meal-swipe value. Tell us which angle makes the strongest "real problem" story for judges and USG.
2. Make the **AI do real work (25%)**, not just a chatbot: turning messy menu pages into structured data, matching against a preference profile, explaining *why* it picked a hall, and checking itself (for example, never recommending a dish that contains a flagged allergen, with the menu label as evidence).
3. Name the **single user flow** we'll demo in under 90 seconds.
4. List the **biggest risks** (the menu site may be JavaScript-rendered or change format; notification delivery; allergen accuracy and liability) and a fallback for each.

## Tool decisions already made (explain them back to us; push back if you disagree)

| Part | Tool | Why |
| --- | --- | --- |
| Writing all code | Claude Code (you), on Viktor's machine, Claude Max | One AI editing one codebase avoids conflicts. Opus 5.5 for features, Sonnet/Haiku for small tasks, Fable 5.2 only for planning, hard bugs and the final review |
| Source of truth | GitHub repo `viktor-lorentz/ForkCast` | Everyone works through branches and pull requests here |
| Hosting + daily job | Replit, deployed from the GitHub repo, using the free hackathon credits | Free credits, Replit is a sponsor and judge, imports straight from GitHub, and Scheduled Deployments handle the daily menu pull and email job |
| Not using | Fly.io | It would work, but it costs money and adds Docker/config time we don't have. Revisit only if Replit blocks us |
| Not using for the main code | Replit Agent | Two AI agents editing the same code causes conflicts. OK only for throwaway experiments outside this repo |
| AI inside the app | Claude API: Haiku 5.5 to turn menu pages into structured JSON, Sonnet 5.5 for recommendations and explanations | Paid from the API credits included with Claude Max. Backup: Google Gemini or AWS Bedrock credits if sponsors offer them |
| Not using | DeepSeek | No real cost or quality advantage at our scale, and a US provider is a simpler privacy story when pitching to USG |
| Email | A transactional email API with a free tier (for example Resend) | Daily "where to eat" email is easier and more reliable than push notifications in 13 hours |

Before GO, give us your recommendation for each row (keep, change, or add), plus the stack you'd use (language, framework, database) given that Viktor can build fast and judges open the app on their phones. Explain each choice in a sentence or two. Don't write code.

## Teamwork setup (plan it now, create it after GO)

After GO, set this up in the first 30 minutes:

1. A `CLAUDE.md` with the stack, folder layout, the one demo flow, and these rules: never break `main`; every change goes through a branch and PR; never commit API keys (use Replit Secrets and a `.env` that's in `.gitignore`).
2. A short PRD in `docs/PRD.md` (problem, user, demo flow, features in and out of scope, AI design, risks).
3. GitHub Issues for every task, each tagged with an owner (Viktor, Andrew or Rishi) and an order. Keep tasks small enough to finish in about 1 hour.
4. Branch plan: `main` stays demo-safe and deploys to Replit. Feature branches look like `feat/menu-scraper`, `feat/recommender`, `feat/ui`, `feat/email`. Viktor reviews and merges.
5. Folders Andrew and Rishi can edit without touching code: `docs/` (pitch, Devpost copy, video script) and `data/test-profiles/` (sample student preference profiles plus the expected recommendations, used as tests).
6. A verifier: an automated check that each recommendation's reasons match the real menu labels, and that flagged allergens never get through.

For now, describe how the three of us should collaborate with you, Saturday hour by hour, in a short plan. Assume Andrew and Rishi are added as GitHub collaborators and can open PRs from the GitHub website.

## What I want from you right now

Reply with, in this order:

1. Questions you need answered (at most 5).
2. Your take on the idea: the strongest angle, the demo flow, and a sharper one-line pitch.
3. Your recommendations on the tool table and stack.
4. The teamwork plan.
5. Top risks and fallbacks.

Then stop and wait. No files, no code, until I say `GO — hackathon has started`.
