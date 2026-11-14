# PRD: dining hall picker

Full team plan, schedule and roles: [HACKATHON_PLAN.md](HACKATHON_PLAN.md).

## Problem
Students with allergies or diets (halal, vegan, vegetarian, gluten-free) check three dining hall menus on a cluttered site before every meal. USC's filter works one hall at a time, so the comparison is left to them.

## User
A USC student on a meal plan with at least one dietary restriction, deciding where to eat in the next hour, on their phone.

## Demo flow (90 seconds)
1. Open the link. Pick restrictions (e.g. sesame, halal) and likes (e.g. spicy, rice bowls). No login.
2. Today's card: "Dinner: go to EVK. 5 dishes for you vs 2 at Village and 1 at Parkside."
3. Tap **Why?**: reasons, USC label evidence, and the dishes we hid with the label that hid them.
4. Switch to a vegan + gluten-free profile; the pick changes.

## In scope
- Live menus for EVK, Parkside, USC Village for today and tomorrow, every meal period
- Onboarding with USC's 11 allergen labels, 3 diet labels, likes and dislikes, plus a free-text box the AI turns into preferences
- Hall recommendation with dish picks, explanation, hidden-dish evidence, verifier badge
- Walking time from the student's residence to each hall (precomputed OpenStreetMap routes), shown per hall and weighed in the pick
- Demo mode on saved menus; judge links that load a sample profile

## Out of scope (until the core is done)
Accounts, push notifications, macros or calories, chat. Daily email is the first stretch goal.

## AI design
1. **Classify** (Haiku): each dish name gets a kind (main, side, condiment, dessert, drink, notice), cuisine, protein, spicy flag. Never allergens.
2. **Filter** (code): drop dishes with a flagged allergen; drop "not analyzed" dishes for anyone avoiding an allergen; require diet labels.
3. **Score** (code): rank halls by eligible mains and sides plus taste matches. Shown instantly.
4. **Pick and explain** (Sonnet): sees only eligible dishes, cites them by ID, writes reasons.
5. **Verify** (code): every cited dish exists, is eligible, is at the chosen hall, and every claim matches a USC label. Failures retry once, then fall back to the code-only pick.

## Risks
| Risk | Fallback |
| --- | --- |
| USC endpoint changes or goes down | Demo mode on saved snapshots |
| Model invents dishes or labels | ID-only citations plus the code verifier |
| Allergen liability | Never say "safe"; cite USC labels; "confirm with dining staff" on every screen |
| Slow model responses | Code-only pick renders first; AI explanation streams in after |
