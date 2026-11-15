# Prompt for Andrew's Claude Code: deck fixes (Saturday evening review)

Viktor's Claude reviewed every slide of https://forkcastproject.netlify.app (all clicks shown) against the live app. The deck's structure, story and numbers hold up: the slide 4 funnel adds up (65 − 33 = 32) and the survey math is right (24 of 42 = 57%). Below are the fixes. Paste everything in the box into the same Claude Code chat that built the deck, as one message.

```
Update the ForkCast deck. Keep the look, story, order and timing (about 3 minutes). Change only what's listed; don't rebuild slides that don't need it.

## Must fix
1. **"Powered by Netlify" badge.** On the published site a Netlify badge sits in the bottom-right corner of every slide, and on slides 3 and 7 it covers the phone. It isn't in our build; Netlify adds it. Turn it off in the Netlify site settings if there's an option, or publish the same build somewhere without it (Vercel, Cloudflare Pages, GitHub Pages). Check at 1920×1080 that the corner is clean. For the live pitch, present from the offline copy anyway.
2. **Slide 3 phone is out of date.** It shows a "★ Rate" button in the header, which the app no longer has, and is missing what the header has now: an envelope (email & share), a sun/moon dark-mode switch and a globe language button. The date row is now "Today · Tomorrow · This week". Replace the screen with a current screenshot: `docs/cover/screenshot-1.png` in Viktor's repo (393×852 at 3×, taken today) is ready to use. Keep the phone fully inside the slide; right now its bottom runs off the edge.
3. **Hall bars changed meaning (slides 1 and 3).** Each bar now shows how much of that hall's menu fits the student, labeled "11 of 20 fit you", and the chosen hall has a red "★ OUR PICK" pill. The "mains · sides" count moved to a small line under the bar. Update the hero card on slide 1 to match.
4. **Test count:** 61 → **206 automated tests** (slides 6 and 9).
5. **Slide 7, taste check:** the setup now shows **8** cards, picked so they cover different kinds of food (not "5 real dishes"). The rating flow is now: tap **"I ate this"** on a dish → **"How was it?"** → 1 to 10. Update the label and, if it fits, the mock.
6. **Slide 1:** remove "press → to advance" from the title slide. On a projector it reads like a leftover.

## Clarify (a judge could catch these)
7. Slide 4 says EVK hides 9 dishes; slide 6 says "1 hidden for allergies at EVK". Both are true: slide 4 also counts dishes hidden because they aren't labeled halal. Label slide 4 "hidden by code (allergens + halal)", or slide 6 "hidden for allergies (halal handled separately)".

## Shipped today, not in the deck yet
All are live at https://forkcast-usc.vercel.app. Don't add slides; fold them in:
- **7 languages:** English, Español, Français, 中文, 한국어, हिन्दी, Tiếng Việt. The whole app switches, and the AI writes its explanation in that language (still checked by code).
- **"This week":** the best hall for every meal for the next 7 days, from code scoring only. Tap a day for its full pick.
- **Closing soon:** if a hall closes before you could walk there and eat, it's marked "Closes in 20 min" or "Closed now" and isn't picked. The pick card shows the closing time when it's within 45 minutes.
- **"I ate this":** it remembers what you ate this week and steers you to variety.
- **Dark mode** (switch in the header), and **email & share** moved to the header (envelope): the daily 7 AM email, plus a link/QR code to open your profile on another phone.

Where to put them:
- **Slide 7 chips:** replace "Thumbs up or down · Fitness goals · Walk from 23 residences · Live hours" with two rows: "Thumbs up or down · I ate this · Fitness goals" and "Walk from 23 residences · Closing soon · This week".
- **Slide 9, "Today" column:** under the four stat cards, add one line of small chips: "7 languages · Dark mode · Daily email · 7-day planner".
- **Slide 9, Next #4** ("alerts when your favorites are back"): Viktor is building a "Coming up" card for this tonight. Keep it under Next until Viktor says it shipped, then move it to Today.
- Optional, if you have the time: on slide 3, a 1-second flip of the phone screen from English to Español. It shows the languages without a new slide.

## Rules (unchanged)
Never write "safe" or "allergen-free". Keep "no flagged allergens per USC labels, confirm with dining staff". No calorie or gram numbers. No adoption claims; ratings so far come from our team.

When done: check every slide at 1920×1080 and 1280×720, republish the public link, update the offline copy, rebuild `forkcast-deck-web.zip` and send it to Viktor (it goes in `docs/deck/`), and list what changed.
```
