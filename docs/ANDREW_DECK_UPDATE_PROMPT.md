# Prompt for Andrew's Claude Code: deck update (student ratings + new polish)

Paste everything in the box into the same Claude Code chat that built the deck, as one message.

```
Update the ForkCast deck with what we shipped Saturday afternoon. Keep the existing look, story and timing (about 3 minutes); change only what's below. Don't rebuild slides that don't need it.

## New in the app (all live at https://forkcast-usc.vercel.app)
1. **Student ratings, 1–10.** Any student can score a dish from 1 ("skip it") to 10 ("get it again"). Everyone sees the average as a small dark pill with a gold star, like "★ 8.2 · 12". No account: each browser counts once per dish, and rating again replaces your old score. Ratings follow the dish name, so a dish that comes back next week keeps its score.
2. **"How was lunch at EVK?"** After a meal, ForkCast asks you to rate the dishes it picked for you, right on the home screen: one 1–10 row per dish, then Done (or "Didn't go"). This is how the ratings grow without anyone hunting for a form.
3. **A /rate page** to score anything on today's menus, by meal and hall. The daily email links to it.
4. **Ratings show everywhere you choose food:** on your picks, in each hall's dish list, and on the swipe cards in setup.
5. **Smoother taste learning:** thumbs are now quiet outline icons that pop; a 👎 slides the dish away with an Undo, and nothing reshuffles while you tap. Setup has an optional **Quick taste check**: swipe right or left through 10 of today's real dishes.
6. **Friendlier emails:** one card per meal ("🍽️ Dinner · go to USC Village", with walk time and hours), dishes grouped into 🍛 Mains and 🥗 Sides with icons. Let the visuals carry this; don't add a slide just for email.

## The story change
Before, ForkCast answered "what can I eat?". Now it also answers **"what's actually good?"**, and students answer it for each other. Frame it as a two-layer system and make the difference obvious:
- **USC's labels decide what's allowed** (allergens and diets, enforced by code, never by AI or by votes).
- **Students decide what's good** (1–10 ratings), and **AI explains the pick**.
Ratings never override allergens. Say that out loud; judges will wonder.

## Edits I want
- **"It learns you" slide → "It learns you, and from each other."** Add a phone screenshot of the "How was brunch at EVK?" card and one of a pick card showing the ★ badge. Animate one score being tapped (the row fills up to the number, like a meter), then the average badge ticking up, e.g. ★ 7.8 → ★ 8.0. Keep it under 600 ms, no bounce.
- **Pipeline/funnel slide:** add a final small layer after "code verifies": "students rate". Draw it so it's clear it can re-rank dishes but can never bring back a dish the allergen filter removed.
- **Impact slide:** add one line: "The more students use it, the better it gets, for everyone." (A network effect, which is a feasibility and impact point.)
- **What's next slide:** replace "weekly alerts for favorite dishes" with "Top-rated dishes this week, and alerts when your favorites are back". Keep the NetID and USC Hospitality report bullets. Add: "Ratings give USC Hospitality real feedback on every dish" (that's the pitch to the university).
- **Demo hand-off slide / backup video notes:** the demo flow becomes: open app → pick restrictions → today's card → "Why?" evidence → switch profile → open the rating card and tap a score.
- **Speaker notes:** update the affected slides and keep the total at about 3 minutes. Cut words elsewhere if needed.

## Numbers and honesty
- Our team of three is seeding the first ratings tonight, so on Sunday the averages are real but come from only a few people. Don't claim student adoption. If a slide shows a count, use a placeholder like [# ratings so far] that I'll fill in before presenting.
- Tests: say "61 automated tests" now (was 54).
- Never write "safe". Keep "no flagged allergens per USC labels, confirm with dining staff".

## Screenshots I need to give you
Tell me exactly which ones, with the same instructions as before (Chrome DevTools, iPhone 15 size). Likely: (1) the "How was brunch at EVK?" card on the home screen; (2) a pick card with a ★ badge; (3) the /rate page with one dish open on the 1–10 row; (4) a swipe card in the Quick taste check. The rating card appears about 45 minutes after you've looked at a meal's picks, once that meal has started. For the screenshot, Viktor can trigger it on demand, so just ask me.

When done: export the PNGs, check them yourself at 1920×1080 and 1280×720 like before, update the PDF, and give me a short list of what changed.
```
