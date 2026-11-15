# For Andrew's deck AI: Omar's story (use case)

Paste everything in the box below into the AI that's building the pitch deck.

```text
Add our user story to the ForkCast pitch deck. It's the same story as our demo video, so the deck and video should match. Keep it to 2–3 slides placed BEFORE the product slides (problem → proof → solution), in the deck's existing style. Use only the facts below. Don't invent quotes, numbers or details.

WHO: Omar Musazai, a real USC freshman from Philadelphia. His story is true, and he agreed to be in our video and deck. He lives in Cardinal Gardens.
- Halal, doesn't eat pork.
- Bulking: works out every day and needs real protein at dinner.
- Homesick: back home, his mom cooked Afghan food for him every night (qabuli palaw, mantu, bolani). He never had to ask what was in it.

THE PROBLEM (his "series of unfortunate events"):
1. Every meal starts the same way: three dining hall menus, one hall at a time, with a row of tiny allergen and diet icons after every dish. On Sun Nov 15, 2026, that was 264 dishes and 617 labels.
2. His friends text the group chat "Parkside in 10?" By the time he figures out where he can actually eat, they've already sat down. He says "go ahead, I'll catch up."
3. Since he's never sure, dinner ends up being rice and salad, which is not much of a bulk.
4. His mom texts, "Omar jan, are you eating?" He says, "Yeah, Mom. I'm eating."

PROOF HE'S NOT ALONE: We surveyed 50 USC students on Nov 14, 2026. 27 of 50 (more than half) listed a dietary restriction, ranging from lactose intolerance and vegetarian to halal, kosher and life-threatening allergies. Raw data (names removed) is in our GitHub repo at docs/survey/responses.csv. Two students said on camera: "It can be very tricky to find food that matches my dietary restrictions at the dining halls." (Samikshya, freshman) and "It's so difficult finding the perfect food." (Jayden, freshman).

THE SOLUTION, using Omar as the example:
- Setup is four taps: Pork (what he can't eat) → Halal (how he eats) → Bulk up (his goal) → Cardinal Gardens (where he lives).
- Every meal, ForkCast reads all three USC menus. Code, not AI, removes anything USC labels with pork or without halal ingredients, before the AI sees it. Claude picks the hall and the dishes. Code then checks every answer (6 checks) before Omar sees it.
- His real result for dinner on Nov 15: Parkside, a 12 min walk. Parkside had 14 of 22 dishes that fit him, USC Village 17 of 29 (3 min), EVK 12 of 21 (10 min). It picked Parkside for the chicken, beef and rice he likes, so the closest hall isn't always the best one.
- It built a protein-forward plate from what was actually served: Green Chile Chicken, Beef and Rice Soup, Sauteed Chipotle Butter Shrimp, Spanish Rice, Braised Black Beans. The pick took 3.3 seconds and passed all 6 checks.
- Now, when the group chat says Parkside, he knows in about ten seconds if he can eat there and replies "omw 🏃 save me a seat."

THE PAYOFF: Omar goes to dinner with his friends. He texts his mom: "Not as good as yours. But close." She replies: "❤️ proud of you." His closing line: "It's not my mom's cooking. But it's dinner with my friends."

TRUST NUMBERS (only if there's room): 0 allergen decisions made by AI (all label filtering is code), 206 automated tests, and USC's own labels as the source.

RULES:
- Never say "safe" or "allergen-free". Say "no flagged allergens per USC labels."
- No calorie or gram numbers.
- Don't use photos of other students' faces. Omar, Andrew and Viktor are fine.
- The tagline is "Know before you go."
```
