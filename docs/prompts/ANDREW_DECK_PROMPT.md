# Prompt for Andrew's Claude Code: the ForkCast pitch deck

Copy everything in the box below (GitHub shows a copy button in its top-right corner) and paste it into Claude Code as one message. It assumes Claude already has the project background from earlier in the chat. Work in a new folder like `~/Desktop/forkcast-deck`. Never put it inside the app repo: that repo deploys to the live site.

```
New goal: build the pitch deck that wins this hackathon. You already have the background on our project. Here's what has changed and what I want.

## Updates to the background
- The app is now called **ForkCast**. Our team name is **Overcooked**. Team: Viktor (tech lead), Andrew (me: product and pitch).
- Live app: https://forkcast-usc.vercel.app (use this exact URL on slides and in the QR code). Code: https://github.com/viktor-lorentz/ForkCast
- New live features since your background info:
  - 👍/👎 on any dish, remembered in the browser. A thumbs-down dish is never recommended again, and code enforces that.
  - Fitness goals (build muscle, lean out, bulk up) with a suggested plate and tags like "High protein" and "Lighter". There are deliberately no calorie numbers, because USC publishes no nutrition data.
  - More diets: pescatarian, keto and Word of Wisdom as best guesses, next to USC's own halal, vegan and vegetarian labels.
  - Live dining hall hours and open/closed status, pulled from USC Hospitality's site.
  - "Take it with you": a QR code or link moves your profile to another device with no account.
  - Email: today's picks to your @usc.edu address, and an optional daily 7 AM email (being set up today).
  - The day's other meals load in the background, so switching Brunch → Dinner is instant.
- True numbers you may use: 3 dining halls; about 250 menu items checked per day; USC's 10 allergen labels; walking times for 23 residences; 54 automated tests; an AI pick in about 3–7 seconds for a new profile and about 0.2 seconds when cached; every AI answer checked by code before it's shown. Don't invent other numbers. Use visible placeholders like [# students interviewed] and [quote] for things only we know.

## The bar
Judges see a dozen decks in a row. Ours should feel like an Apple keynote crossed with a weather report: confident, calm, very few words, every animation telling part of the story. Rubric: Impact 30%, Technical & AI 25%, Feasibility 25%, UX 20%. Every slide should earn points on at least one of those. The pitch is about 3 minutes, so plan 8–10 slides at roughly 15–25 seconds each.

## Tools: your call, but here's my starting point
You're the expert, so pick whatever produces the best result. I'm not a coder. I have Node.js and limited Claude usage, so the tool also needs to be reliable for me to run. My suggestion is **Slidev** (sli.dev): Markdown and Vue slides, smooth transitions, click-by-click builds, `v-motion` animations, Magic Move morphs between slides, a presenter view with notes, and one command to build a static site you can publish as a link. If you think something else would look clearly better, tell me why in two sentences before setting it up. Examples: a custom Vite + React + Motion deck for fully custom animation, or reveal.js. Either way:
- Explain each command in one line before I run it, and fix errors yourself before asking me to do anything.
- If the tooling fights us for more than about 20 minutes, simplify. A polished simple deck beats a broken fancy one.
- Work in small steps and batch your edits. Don't regenerate the whole deck for small changes.

## Creative direction
- **Concept: "Your dining ForkCast."** Lean into the weather-forecast idea without being cheesy. The opening could look like a forecast card: "Today's ForkCast · Dinner · USC Village · 12 mains for you · 4 min walk." It should look like the real app's main card.
- **Brand:** USC cardinal #990000, gold #ffcc00, warm off-white #faf7f2, near-black #1c1917. One clean sans-serif (Geist or Inter), big confident type, generous white space. Use the app's own look (rounded cards, label chips) so the deck and the product feel like one thing.
- **Show the real product, not bullet points.** Use real screenshots in a clean phone frame. Ask me for them and tell me exactly how to take them: Chrome DevTools phone view at iPhone 15 size, the `/?demo=halal-sesame` and `/?demo=no-restrictions` sample students, and the "Why? How we checked" panel open.
- **Animation rules:** every motion explains something. Ideas:
  - **The funnel:** about 250 dishes rain down, the ones with the student's allergens get struck out in red, and only the ones they can eat land in the right hall. This makes "code enforces allergens" something judges can see.
  - **The pipeline:** USC menu → AI sorts dishes → code filters allergens → AI picks and explains → code verifies. Build it step by step, with the "code" steps visibly locking the AI steps in place.
  - **Profile switch:** the same day, two students, the hall pick morphs from EVK to Village (Magic Move or a shared-element transition).
  - **Trust:** the verification checklist ticks in one ✓ at a time.
  - Keep it smooth and quick (200–600 ms, ease-out), with no bounces, spins or flying text. It has to look good on a projector and on a judge's laptop screen.

## Story (improve it if you see a stronger arc)
1. **Hook:** a forecast-style card. "Every student asks this three times a day: where should I eat?"
2. **Problem:** three halls, three menus, tiny allergen icons. For a student with a sesame allergy who eats halal, that's ten minutes of squinting, every meal. Leave a placeholder for a real student quote.
3. **Meet ForkCast:** the phone, one answer, "Go to USC Village", in about three seconds.
4. **How it decides:** the funnel and pipeline animation. The key line: "AI understands the food. Code enforces the allergens."
5. **Trust:** the verification checks, the hidden dishes shown with USC's own label as the reason, and "never says safe, always says confirm with staff." This is where we win Technical & AI and Feasibility.
6. **It learns you:** 👍/👎, fitness-goal plates, walking time from your dorm, open/closed hours.
7. **Live demo or video beat:** one slide that hands off to the demo or our video. Also a backup: a short screen recording embedded in the slide, so it works without Wi-Fi.
8. **Impact:** who it helps (students with allergies and dietary needs, international students, athletes) and why now. Use placeholders for interview results.
9. **What's next:** USC NetID login with student government, a report for USC Hospitality on which diets each hall underserves, and weekly alerts for favorite dishes.
10. **Close:** "ForkCast. Know before you go." (or something better), team Overcooked, and a big QR code to the live app that judges can scan from their seats.
Write speaker notes for every slide: what I say, in plain spoken sentences, timed to about 3 minutes total.

## How we'll work
1. First reply: your tool choice (with one line on why), a one-paragraph visual concept, and the slide list. Wait for my OK before building.
2. Build the design system first (colors, type, the phone frame, the forecast card, label chips) and show me one finished slide, so we agree on the look before building the rest.
3. Then build two or three slides at a time. After each batch, export PNGs of the slides, look at them yourself, and fix spacing, alignment, overflow and contrast before showing me. Also check each slide at 1920×1080 and at a projector-like 1280×720.
4. Ask me for screenshots and our real quotes and numbers when you need them. Never fake them.

## Done means
- The deck runs full screen with presenter notes, and every animation plays on click without stutter.
- The deck published as a web link that anyone can open in a browser, with animations intact (this is what goes on Devpost; the organizers confirmed a PDF isn't required). Pick the simplest reliable host for a non-coder, e.g. Netlify Drop (drag the built folder onto app.netlify.com/drop) or Vercel. Never put it inside the app repo.
- An offline copy that runs on my laptop without Wi-Fi, as a backup.
- The QR code tested with a real phone camera, and the URL correct.
- A short checklist for me: how to start presenter mode, the clicker or arrow keys, what to do if Wi-Fi dies (switch to the embedded video and the offline copy on my laptop), and a reminder for Viktor to open https://forkcast-usc.vercel.app/api/warm 10 minutes before judging.
- Our deadlines: feature freeze Saturday 9 PM, code freeze Sunday 9 AM, Devpost submission target Sunday 10:30 AM (hard deadline 11:00 AM PT). Have the deck link live and tested in a private window before 10:30 on Sunday.
```
