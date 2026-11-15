# Devpost submission: ForkCast

Copy each section into the matching Devpost field. Anything in `[brackets]` still needs filling in.

**Project name:** ForkCast

**Tagline (short description):** Know before you go: the USC dining hall with food you can actually eat, every meal.

**Try it:** https://forkcast-usc.vercel.app (sample student: https://forkcast-usc.vercel.app/?demo=halal-sesame)

**Slide deck:** `[Netlify link]` · **Video:** `[Hailey: video link]` · **Code:** https://github.com/viktor-lorentz/ForkCast

---

## Inspiration

Three times a day, many USC students ask the same question: where should I eat? For most of us, it's just whatever's closest. For a student who is halal, vegan, celiac, or has allergies, it's homework. USC's dining menu site shows one dining hall at a time, and every dish is followed by a row of tiny icons you have to decode by hand. Do that for three halls, before every meal, and you end up settling for whichever one is closest.

We asked around. Of the 42 students we surveyed on Saturday, 24 (57%) have some form of dietary restriction or allergy. The "special" case is the normal case.

## What it does

ForkCast is a phone-first web app that works like a weather forecast for your next meal. You tell it what you can't eat, what you love and where you live. No login.

- **One answer.** It reads USC's live menus for EVK, Parkside and USC Village and names the best hall for this meal, with a suggested plate and a one-line reason for each dish.
- **Evidence.** It shows how many dishes fit you at each hall, the walk from your residence and each hall's hours. "Why?" lists the checks every answer passed and the dishes it hid, with USC's own label as the reason.
- **It learns you.** A quick swipe through real dishes, thumbs up or down on any dish, and fitness goals (build muscle, lean out, bulk up) shape your picks.
- **And from each other.** After a meal it asks how the food was. Students rate dishes from 1 to 10 and everyone sees the average.
- **Planning.** It flags halls that will close before you could walk there, and shows the best hall for each meal of the coming week.
- **For everyone.** Dark mode, screen-reader labels, text that scales, and seven languages: English, Español, Français, 中文, 한국어, हिन्दी and Tiếng Việt.
- **Take it with you.** A QR code or link moves your profile to another device without an account, and an optional daily email sends your picks to your @usc.edu address.

## How we use AI, responsibly

**AI understands the food. Code enforces the allergens.**

1. **AI sorts** each dish: main or side, cuisine, spicy. It is never asked about allergens.
2. **Code filters** using only USC's own allergen and diet labels. Dishes USC marks "not analyzed for allergens" are hidden from anyone avoiding an allergen.
3. **AI picks and explains,** seeing only the dishes that passed.
4. **Code verifies** every answer before it is shown: each dish is on today's menu, at the chosen hall, carries no allergen you avoid, and every claim matches USC's labels. A failed check gets one retry, then a rules-based pick.
5. **Students rate.** Ratings can re-rank what's allowed. They can never bring back a dish the filter hid.

We never call food "safe." We say "no flagged allergens per USC labels" and tell students to confirm with dining staff.

## How we built it

- **App:** Next.js 16, TypeScript and Tailwind 4, hosted on Vercel.
- **AI:** Claude through the Anthropic SDK. A fast model classifies dishes and turns a one-sentence description into a profile; a stronger model picks the plate and writes the explanation. Every model output is validated with zod.
- **Data:** USC Hospitality's public menu feed and hours; walking times for 22 residences precomputed from OpenStreetMap foot routes.
- **Storage:** profiles live in the student's browser. Upstash Redis holds only opt-in email subscriptions and anonymous dish ratings.
- **Quality:** 206 automated tests run the same sample students judges can open.
- **Deck:** built in Slidev, with real screenshots and real numbers from the live app.

## Challenges we ran into

- **Finding the data.** USC's menu page loads its dishes with JavaScript, so we had to find the feed behind it and keep saved copies in case it changed mid-weekend.
- **Making the AI trustworthy.** Early on we decided the model would never judge an allergen. Building the verifier that checks every AI sentence against USC's labels took longer than the AI itself.
- **No nutrition data.** USC publishes none, so fitness goals use AI estimates from dish names. We show only plain labels like "High protein," never calorie numbers.
- **Speed.** A fresh AI pick takes 3 to 7 seconds, so the hall comparison is computed by code and appears first, and repeat answers are cached at about 0.2 seconds.
- **AI doesn't know our campus.** One of our sample students "lived" in Fluor Tower, a residence hall that was demolished years ago, and the mistake made it all the way onto our title slide before a teammate who actually walks the campus caught it. Everything AI helped us write got a human check against what we know firsthand.
- **Usage limits.** We ran into Claude's five-hour usage limits mid-build, more than once. It forced us to plan before prompting and to batch changes instead of fixing one thing at a time.

## Accomplishments that we're proud of

- It is live, on real menus, and anyone can try it from a QR code.
- Zero allergen decisions are made by AI, and every answer shows its evidence.
- No account, no install, and it still remembers you and moves between devices.
- A two-layer design: USC's labels decide what's allowed, students decide what's good.

## What we learned

- The hard part of an AI product isn't the AI; it's deciding what the AI is not allowed to do.
- Students with dietary needs don't want more information. They want one answer and the proof behind it.
- **Andrew:** a UX that feels effortless is much harder to produce than I expected.
- **Viktor:** every new feature brings new bugs. Debugging is harder than coming up with ideas or generating code.
- **Hailey:** `[Hailey: one line]`

## What's next for ForkCast

- **USC NetID login,** with student government, so ratings are one per student.
- **A report for USC Hospitality** showing which diets each hall underserves at each meal.
- **Real feedback on every dish** from student ratings, shared with the dining team.
- **Top-rated dishes this week,** and alerts when your favorites are back.

## Built with

`next.js` `typescript` `tailwindcss` `claude` `anthropic` `zod` `vitest` `upstash-redis` `vercel` `openstreetmap` `slidev`

## Team Overcooked

Viktor (ECE), tech lead · Andrew (BUAD), product and pitch · Hailey (BCA), video and interviews
