# Judge Q&A: ForkCast (team Overcooked)

The hardest questions judges might ask, each with a two-sentence answer you can say out loud. Every answer was checked against the code on `main` on Saturday Nov 14; anything in `[brackets]` is a number or fact only the team can fill in.

**Three rules for answering**

1. Never say "safe." Say "no flagged allergens per USC labels, confirm with dining staff."
2. If you don't know, say so and say what you'd check. Judges punish bluffing more than gaps.
3. Lead with the one line: **AI understands the food. Code enforces the allergens.**

**Who takes what:** Viktor takes questions 2, 5, 6, 12, 13, 16, 22. Andrew takes 1, 3, 8, 9, 10, 11, 24, 25. Hailey takes 7, 10, 15, 17 and anything about interviews.

---

## The 12 hardest

### 1. A student with a severe allergy trusts your app and gets sick. Who is liable?
ForkCast never makes its own allergen claim: it only repeats USC's published labels, never uses the word "safe," and tells students on every screen to confirm with dining staff. It is also stricter than USC's own site, because any dish USC marks "not analyzed for allergens" is hidden from anyone avoiding an allergen.

### 2. How do you know the AI isn't inventing dishes or allergen labels?
The AI is never asked about allergens: it can only pick from dishes that code already filtered, and it has to cite each one by ID. Code then checks every answer before it is shown (the dish is on today's menu, at the chosen hall, carries no allergen you avoid, and every label claim matches USC's), retries once on a failure, and otherwise falls back to a pick made by plain rules.

### 3. USC's menu site already has an allergen filter, and Trojan Dining exists. Why build this?
Those tools show you one hall's menu at a time, so you still compare three halls for every meal yourself. ForkCast makes the decision across all three halls, personalizes it, and shows its evidence. `[Andrew: confirm whether Trojan Dining and DineOn still work, and say what you found.]`

### 4. What if USC's own labels are wrong or missing?
We can't be more accurate than USC's kitchen, which is why every screen says to confirm with dining staff and why "not analyzed" dishes are hidden from allergy profiles. What we add is that a labeled allergen never slips through, and the "Why?" panel shows exactly which USC label hid each dish.

### 5. What happens if USC changes or blocks its menu feed?
If a live fetch fails, the app falls back to the saved copy of that day's menus, and it has a demo mode that runs entirely on saved menus. Long term the fix is an official feed from USC Hospitality, which is part of our ask to USG.

### 6. Why does this need AI at all? Couldn't a filter do it?
A filter can hide dishes, but it can't tell a main from a condiment, know that a dish is spicy or a rice bowl, turn "I'm halal and hate mushrooms" into a profile, or explain a pick in one sentence. That is the only work the AI does; everything that affects an allergy is plain code.

### 7. What data do you collect about students?
There are no accounts: your profile lives in your own browser and moves between devices through a link or QR code. The server only keeps data if you opt in to the daily email (your @usc.edu address and profile) or rate a dish (an anonymous random ID and a score).

### 8. What does it cost per student?
`[Viktor: total Anthropic spend so far √∑ number of AI picks served = cost per pick.]` Costs stay low by design: the menu is tagged by the cheaper model once a day for everyone, and each pick is cached for three hours, so students with the same profile share one AI call.

### 9. How would USG or USC Hospitality actually adopt this?
It needs no integration to start: it is a web link that reads the menus USC already publishes, so USG could promote it tomorrow. The next steps are NetID login, an official menu feed, and a report for Hospitality showing which diets each hall underserves at each meal.

### 10. Did students actually ask for this?
We surveyed 33 USC students today and 20 of them reported a dietary restriction or allergy (18 of 30 if you leave out our own three teammates), so about 6 in 10 either way. `[Hailey: number of interviews, one result, one real quote.]`

### 11. Isn't this only useful for a small group of students?
In our survey the "special case" was the majority, and the app also works for students with no restrictions through taste, walking time, hours and fitness goals. Restrictions are simply where the pain is sharpest and where a wrong answer matters most.

### 12. What happens when the AI is slow or down?
The hall comparison is computed by code and appears immediately, so the app is useful before the AI answers. If the AI fails its checks or times out, the student gets the rules-based pick, and only verified AI answers are ever cached.

---

## New features

### 13. Where do the nutrition estimates come from?
USC's menu feed has no nutrition data, so the AI estimates calories and macros from each dish name. Those estimates are only used to rank dishes and to show plain labels such as "High protein" or "Lighter," and all the arithmetic is done by code.

### 14. Why don't you show calorie numbers?
Without recipes or portion sizes the numbers would look precise while being rough guesses, and students might rely on them. The estimates are good enough to say which dish has more protein, so we show labels and call them estimates.

### 15. How do you protect students' email addresses?
Only @usc.edu addresses are accepted, the daily 7 AM email starts only after you click a confirmation link, and every daily email has a one-click unsubscribe that deletes your record. An unconfirmed signup expires after 7 days, one address can be emailed at most once every 10 minutes, and the list is capped at 300 subscribers for now.

### 16. What stops someone from abusing your AI and running up the bill?
Caching does most of the work: identical requests reuse a stored answer for three hours, inputs are capped in length, and emails and ratings are rate limited. `[Viktor: confirm the prepaid Anthropic budget, which is the hard ceiling, and whether /api/recommend has its own per-visitor rate limit. As of Saturday afternoon it does not.]`

### 17. Can't students game the dish ratings?
Each browser gets one score per dish (rating again replaces the old score) and each network address is limited to 300 ratings an hour. Someone determined could still clear their browser to vote again, which is one reason NetID login is next on our list.

### 18. How reliable are the pescatarian, keto and Word of Wisdom filters?
USC has no label for those, so they are judged from the dish name and the AI's tags, and the app calls them a best guess. They are still applied by code, and the "Why?" panel says the reason came from the dish name rather than a USC label.

### 19. Is the halal filter certified halal?
No. USC's label is "halal ingredients," and that is exactly what we show, without claiming certification. A student who needs certified halal food should confirm with dining staff.

### 20. What about kosher, or allergies USC doesn't label, like mustard or kiwi?
We can only enforce what USC labels: its 10 allergens plus halal ingredients, vegan and vegetarian. For anything else you can add a dislike, which pushes dishes with that word in the name down the ranking, but that is a taste preference and not an allergen check, and we say so.

### 21. Does the thumbs-down really stick, or does the AI just "consider" it?
Code enforces it: a dish you thumbed down is removed before the AI ever sees the list, and the verifier rejects any answer that includes one. Your thumbs are stored in your browser and travel with your profile link.

### 22. How fast is it?
A brand-new profile gets its AI pick in about 3 to 7 seconds, and a cached one in about 0.2 seconds. The day's other meals load in the background, so switching from Brunch to Dinner is instant.

---

## Also likely

### 23. What did you actually build this weekend?
Everything: the menu reader, the filter and verifier, the AI pipeline, the phone app, walking times for 23 residences, and email. It is live at forkcast-usc.vercel.app, with automated tests `[Viktor: current count from npm test; it was 54]` that run the same sample students judges can open.

### 24. Could this work at other universities?
The filter, verifier and AI pipeline don't depend on USC; only the menu reader does. Any campus that publishes menus with allergen labels could be added by writing one new reader.

### 25. How will you know it's working?
We would track how many students return each week and how often they open "Why?", which is the trust signal. For USC the measure is the Hospitality report: fewer meals where a diet has no main dish at any hall.

### 26. Where do the walking times come from?
They are precomputed foot routes from OpenStreetMap for 23 residences to each hall, and the app labels them as estimates. Code checks that any walking time the AI mentions matches that data.

### 27. Why should we trust an explanation written by AI?
Because the explanation is checked too: every label claim in it has to match USC's labels or the answer is rejected. The "Why?" panel shows the checks that passed and the dishes that were hidden, with USC's label as the reason.

---

## Gaps to close before judging

- **AI rate limit (Viktor):** `/api/recommend` and `/api/parse-profile` have no per-visitor rate limit. Either add one before code freeze or be ready to answer question 16 with caching plus the prepaid budget.
- **Cost number (Viktor):** fill in question 8 from the Anthropic Console.
- **Competitors (Andrew):** open Trojan Dining and DineOn once and note what they do today.
- **Interviews (Hailey):** fill in question 10.
- **Test count (Viktor):** fill in question 23.
