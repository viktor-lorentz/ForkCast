# Judge Q&A, round 2: questions the deck itself will trigger

Round 1 (`judge-qa.md`) covers the classic hard questions: liability, accuracy, cost, existing apps, privacy. Keep practicing those, because the deck only answers a few of them. This round is different: these are the follow-ups a judge asks *after* seeing our slides and the newest features. Each answer is two sentences you can say out loud.

Anything in `[brackets]` is for the team to fill in. Never say "safe"; say "no flagged allergens per USC labels, confirm with dining staff."

---

## About the numbers on our slides

### 1. Your survey is 42 students. Why should we believe 57%?
We don't claim it's all of USC: it's 24 of the 42 students we could reach in one day, mostly freshmen on meal plans, who are exactly the people who eat in these halls. The point is that dietary needs are common enough to be the normal case, and Hailey's interviews say the same thing. `[Hailey: one interview result]`

### 2. Who did you survey, and could it be biased?
It was a Google Form shared with students around us on Saturday, and we left our own three answers out. It is a convenience sample, so we show the raw count on the slide and would rerun it through USG for a campus-wide number.

### 3. Your funnel shows Village with more dishes left than EVK. Why did it pick EVK?
The pick isn't a dish count: real mains matter most, then your taste, then the walk. EVK had as many mains as Village and was one minute from that student's dorm instead of ten.

### 4. "0 allergen decisions made by AI." What does the AI actually decide, then?
It decides what kind of food a dish is (main or side, cuisine, spicy), which eligible dishes make the best plate, and how to explain that in a sentence. Whether a dish is allowed is decided only by code reading USC's labels.

### 5. Your slide says 0.2 seconds, but also 3 to 7. Which is it?
A brand-new profile takes 3 to 7 seconds because the AI is writing a fresh pick; the same profile and meal after that is 0.2 seconds from cache. The hall comparison is code, so it shows instantly either way.

### 6. You hid "Pork Vindaloo" for a halal student. Isn't that obvious? Show me a hard one.
The obvious ones prove the rule works; the hard ones are the bagels on slide 2, labeled halal ingredients but containing sesame, and dishes USC marks "not analyzed," which we hide from anyone with an allergy. A student skimming icons misses those; code doesn't.

### 7. 206 tests on what, exactly?
They run the same sample students judges can open against saved USC menus and check that no hidden dish ever reaches a pick, that the verifier catches bad AI answers, and that walking times and labels match the data. `[Viktor: one test you're proud of.]`

---

## About ratings (the newest layer)

### 8. If ratings re-rank dishes, can a popular dish with my allergen float back up?
No. The allergen filter runs first and ratings only reorder what survived it, and the verifier rejects any answer that includes a hidden dish.

### 9. Three teammates seeded the ratings. Isn't your "average" meaningless right now?
Yes, today's averages come from a handful of people and we don't claim adoption. What we built is the loop: the app asks after each meal, so ratings grow with use instead of needing a campaign.

### 10. What stops one person from tanking a dish they dislike?
Each browser gets one score per dish, rating again replaces it, and each network address is limited per hour. The real fix is NetID login, which is first on our roadmap.

### 11. Ratings follow the dish name. What if the recipe changes or two halls cook it differently?
That's a real limit: today a rating follows the name across halls and weeks. Splitting scores by hall is a small change once there are enough ratings to make it worthwhile.

### 12. Why 1 to 10 and not thumbs or stars?
Thumbs teach the app *your* taste and stay private in your browser; the 1 to 10 score is the shared signal, and a wider scale separates "fine" from "get it again." Students already think in "out of 10."

---

## About features added Saturday night

### 13. What's "closing soon"?
The app knows each hall's hours and your walking time, so it marks a hall as closing before you could walk there and eat, and ranks it lower. The verifier enforces that too, so the AI can't send you to a hall that's about to close.

### 14. You have a 7-day forecast. Is the AI predicting menus?
No, USC publishes menus about a week ahead and we read them. The weekly view uses code scoring only, with no AI call, so it is fast and costs nothing.

### 15. It speaks other languages. How do you keep the wording careful in French?
The AI writes the summary in the student's language, and the verifier checks the safety wording and the walking minutes in every language we support. If a translated answer fails those checks, the student gets the checked fallback instead. We support seven: English, Spanish, French, Chinese, Korean, Hindi and Vietnamese.

### 16. What about accessibility?
It has a dark theme that follows the phone, WCAG AA contrast, focus rings, screen-reader labels, and text that scales. It's also a website, so it works on any phone without an install.

### 17. What stops someone from spamming your AI?
Every AI and email endpoint has a per-visitor rate limit with a friendly "slow down" message, identical requests are served from cache, and there are emergency switches to turn the AI off and fall back to rules. `[Viktor: the limits per hour, and the prepaid budget.]`

### 18. "I ate this" tracks my meals. Where does that go?
It stays in your browser for seven days and is only used to nudge your picks toward variety. It never hides a dish and it isn't sent to anyone else.

---

## The uncomfortable ones

### 19. You listed kosher and "several severe allergies" on your impact slide. Can ForkCast help those students?
Only partly, and we say so: USC has no kosher label and labels just ten allergens, so we can't enforce mustard or kiwi. Those students still get the cross-hall comparison, and that gap is exactly what our report to USC Hospitality would surface.

### 20. Diabetic and high cholesterol are on your slide too. Do you handle those?
Not as rules. We show plain labels like "Lighter" and "Low carb" from AI estimates, clearly marked as estimates, because USC publishes no nutrition data for us to enforce.

### 21. If this is so useful, why hasn't USC built it?
USC's job is publishing accurate labels, and it does that; nobody owns the decision across halls. We sit on top of their data without changing anything on their side, which is why it could ship in a weekend.

### 22. What happens Monday? Does this die after the hackathon?
It runs itself: menus refresh daily, the cache warms each morning, and the cost per student is small. `[Viktor: monthly cost at current use.]` To grow it needs a home, which is our ask to USG.

### 23. What would you cut if you had to?
The fitness labels and the weekly view. The core is one thing: read three menus, enforce USC's labels in code, and name one hall with evidence.

### 24. What's the one thing that could make this fail?
Trust: one wrong allergen answer would end it. That's why allergens never touch the AI, every answer is verified, and we tell students to confirm with dining staff every time.

### 25. What did each of you actually do?
Viktor (ECE) built the app and the verification pipeline; Andrew (BUAD) owned the product decisions, the pitch and this deck; Hailey (BCA) ran the survey and interviews and made the demo video. `[Each of you: one specific thing you're proud of.]`

---

## Updates to round 1

- **Question 10:** the survey is now 24 of 42 students (57%), not 18 of 30.
- **Question 16:** per-visitor rate limits now exist on the AI and email endpoints, so drop the "as of Saturday afternoon it does not" note.
- **Question 23:** the test count is now 206.
