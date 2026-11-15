> **Superseded:** the current script is [OMARSCRIPT.md](OMARSCRIPT.md). This Maya version is kept for reference.

# ForkCast demo video: script (v2, "Maya")

**Length:** about 2:26. **Format:** 16:9 landscape, 4K.
**Style:** dark and cinematic: film grain, huge condensed type, a real USC street map, and real data as animated dots. Modeled on the structure of Brendan's Cal Hacks video: a human story first, then the problem in numbers, then the product live, then why you can trust it.

## The idea in one line
Maya, a homesick first-semester freshman who's halal and allergic to sesame, keeps giving up on dinner because three menus full of tiny icons are a puzzle. ForkCast solves the puzzle in a few taps, and she ends up eating at the Village with friends.

## Honesty rules (they make the video stronger, not weaker)
- **Maya is a character**, played by a teammate or friend. Her scenes carry a small "Dramatization" tag, and the narration says so out loud: *"Maya is a character. Her problem isn't."* That line turns the story into evidence.
- **Every number is real**: today's actual USC menus, real walking routes from OpenStreetMap, our real test suite, and a cited allergy statistic (table below).
- **Jayden and Samikshya are real students** and are labeled that way. Use only what they actually said (take 1 for Jayden).
- **No AI-generated footage.** The animations and transitions are generated in code (Remotion), from real data.

## Maya (character sheet for whoever plays her)
- First semester at USC, first time away from home. Lives in **Cardinal Gardens** (3 min to the Village, 10 to EVK, 12 to Parkside).
- **Halal, allergic to sesame.** This matches the app's halal + sesame demo, so the screen recordings line up.
- Misses her mom's cooking. Mom texts every night: "Did you eat yet? ❤️"
- Not dramatic or crying. Just tired, a little lonely, quietly giving up. Small moments: a sigh, rubbing her eyes, a long look at the family photo.
- Wardrobe: hoodie or sweatshirt, the same outfit in every apartment scene (it's one night). For the hall scenes (the next night), a different top.

## The script
| Time | Scene | On screen | Narration (Andrew) | Text / animation |
|---|---|---|---|---|
| 0:00 | **A1** apartment, dark | Maya on her bed, only the phone lights her face | *(no narration; room tone, a fridge hum)* | Typewriter stamp: **Week 3 · Tuesday, 7:40 PM** |
| 0:04 | **A2** phone close-up | A text from "Mom": *Did you eat yet? ❤️* She doesn't answer. | | |
| 0:08 | **A3** her desk | Maya at her laptop, a family photo beside it | VO-01: "This is Maya. First semester at USC, first time living on her own." | Huge name card: **MAYA** · Freshman · first semester · *Halal · allergic to sesame* · "Dramatization" tag |
| 0:13 | **A4** laptop, over the shoulder | She opens USC's dining site, sighs, rubs her eyes | VO-02: "She's halal, and she's allergic to sesame. And every night, dinner starts like this." | |
| 0:17 | **R01** in the phone frame | USC menu site, zoom on the tiny icons, switching hall tabs | VO-03: "Three dining hall menus. Tiny allergen icons on every dish. And no way to tell which hall actually has something she can eat." | **3 MENUS** · Tiny icons on every dish |
| 0:24 | Map (animation) | Dark USC street map. Three halls pulse; three walking routes draw from her apartment. | VO-04: "Guess wrong, and it's a twelve-minute walk to find out." | **EVK 10 min · PARKSIDE 12 min · USC VILLAGE 3 min** |
| 0:28 | **A5** kitchen → desk | Kettle, instant noodles, she eats alone at her desk | *(music only)* | **AGAIN.** |
| 0:33 | Dots (animation) | 271 dots, one per real menu item, fill three blocks; they turn gold as the labels count up | VO-05: "Maya is a character. Her problem isn't. Today, USC's three dining halls served 271 menu items, with 604 allergen and diet labels." | **271** menu items today · **604** allergen & diet labels to read |
| 0:42 | **T3** quote card | Samikshya's real clip in a frame | *(her own voice)* "It can be very tricky to find food that matches my dietary restrictions at the dining halls." | Samikshya · Freshman, USC (real student) |
| 0:47 | **T1** quote card | Jayden's real clip | *(his voice)* "It's so difficult finding the perfect food." | Jayden · Freshman, USC (real student) |
| 0:52 | Stat (animation) | | VO-06: "About one in ten U.S. adults has a food allergy. And for Maya, tonight, only 8 of Parkside's 23 dinner dishes fit." | **1 IN 10** U.S. adults has a food allergy · *Gupta et al., JAMA Network Open, 2019* |
| 0:57 | Dots filter (animation) | Tonight's dinner dishes; everything labeled sesame or not halal turns red and falls | | EVK 12 of 21 · Parkside 8 of 23 · Village 14 of 23 |
| 1:02 | Logo slam | **FORKCAST** hits the screen with a red flash and shake | VO-07: "So we built ForkCast." | Know before you go. |
| 1:06 | **A6** apartment | A text from her roommate with a ForkCast link. She taps it, sits up. | | |
| 1:09 | **R02** in the phone frame | Setup, at 1.5×: Sesame → Halal → No goal → spicy, rice → Cardinal Gardens → Skip → swipes | VO-08: "She answers a few taps: what she can't eat, what she loves, and where she lives." | **A FEW TAPS** |
| 1:16 | Dots filter (animation) | The same filter, now ForkCast doing it | VO-09: "ForkCast reads all three menus and removes every dish USC labels with something she can't eat." | |
| 1:23 | **R03** in the phone frame | The pick appears (Village), push in on the red card, scroll *Your plate* | VO-10: "In about four seconds, it tells her where to go: the Village, three minutes away, and what to put on her plate." | **4 SECONDS** |
| 1:31 | Map (animation) | Only the green route to the Village draws | | **USC VILLAGE · 3 min walk** |
| 1:34 | **H1** outside the hall | Maya walks into the Village dining hall, a small smile | | |
| 1:38 | **H2** food stations | She fills her plate | | |
| 1:41 | Pipeline (animation) | USC MENUS → CODE FILTER (red dots drop out) → CLAUDE → CHECKER → YOU, then a huge **0** | VO-11: "AI understands the food, but it never makes an allergen decision. Code removes flagged dishes before the AI sees the menu, then checks every answer before she does. Two hundred and six automated tests fail if a flagged dish is ever recommended." | **AI understands the food. Code enforces the allergens.** → **0** allergen decisions made by AI |
| 1:57 | **R06, R08, R09, R10, R11** montage | Thumbs and rating → This week → Closes in N min → language switch → morning email | VO-12: "It learns from every thumbs up, plans the whole week, knows when halls close, speaks seven languages, and emails her picks every morning." | **IT LEARNS · THE WHOLE WEEK · CLOSING SOON · 7 LANGUAGES · EVERY MORNING** |
| 2:10 | **H3** at a table | Maya eating with two friends, laughing | *(music swells)* | |
| 2:14 | **A7** phone close-up | She sends Mom a photo of her plate. Mom: ❤️ | VO-13: "ForkCast can't cure homesickness. But nobody should skip dinner because the menu is a puzzle." | |
| 2:18 | End card | Logo, line, QR code | VO-14: "ForkCast. Know before you go." | forkcast-usc.vercel.app · Team Overcooked · AI@USC Hackathon 2026 · Built with Claude |

## What to film in real life (phone, landscape)
**Settings for every shot:** Samsung S26 Ultra → **Pro Video**, **4K 30 fps**, landscape, shutter **1/60**, ISO as low as the scene allows (lock it), white balance **3200–3800K** indoors at night (warm), focus locked on Maya. Hold each shot **8–10 s** and do 2–3 takes; we only use 3–6 s. Turn off overhead lights in the apartment; use desk lamps and the phone/laptop screen as the light (that's what makes it look like a film, not a vlog).

**Apartment (one night, same outfit):**
- **A1 · Bed, dark (8 s).** Room nearly dark. Maya lies on her bed scrolling; the phone lights her face. Camera low at the foot of the bed, slow push in if you can.
- **A2 · Phone close-up (8 s).** Over her shoulder, focus on the screen: a message from a contact named **Mom**: "Did you eat yet? ❤️" (a teammate sends it for real). Her thumb hovers, then she locks the phone.
- **A3 · Desk, family photo (10 s).** Medium shot from the side: Maya at her laptop, a framed or printed family photo next to it in focus first, then rack focus to her (tap to refocus while recording).
- **A4 · Laptop, over the shoulder (10 s).** She opens hospitality.usc.edu/dining-hall-menus, scrolls, sighs, rubs her eyes. Screen slightly out of focus is fine; R01 shows the details.
- **A5 · Noodles (3 shots × 5 s).** (a) the kettle clicking off, (b) pouring water into instant noodles, (c) wide: eating alone at her desk, laptop glow.
- **A6 · The link (8 s).** A text from "Roommate" with the link `forkcast-usc.vercel.app`. She taps it, sits up a little.
- **A7 · Photo to Mom (8 s).** Phone close-up at the dining hall table: she sends a photo of her plate, Mom replies ❤️ (the teammate replies live).

**Dining hall (the next day, a different top):**
- **H1 · Walking in (10 s).** Outside USC Village Dining Hall, Maya walks toward the door glancing at her phone, small smile. Camera on the other side of the path, wide.
- **H2 · Plate (8 s).** Close on her hands taking food at a station (halal items, if labeled). Ask staff first; don't film other students' faces.
- **H3 · Friends (10 s).** Maya and two friends at a table, talking and laughing. Natural, not posed: give them a real topic to talk about.

**Already have (reused as backups if a shot doesn't happen):** B01 food stations, B01B dining room, B02 walk to Parkside, B04B walk to the hall, T1 Jayden, T3 Samikshya.

## What to screen record (OBS, see [OBS_RECORDING.md](OBS_RECORDING.md))
R01 USC menus · R02 setup as Maya · R03 the pick · R04 how we checked · R06 thumbs & rating · R08 this week · R09 closing soon (9:20–9:55 PM only) · R10 languages · R11 email. Record **R02 to R11 in the same Incognito window** so it's Maya's profile throughout.

## Real data used on screen (all checked)
| Claim | Source |
|---|---|
| 271 menu items, 604 allergen & diet labels | USC Hospitality menus for Sat Nov 14, 2026 (EVK 57, Parkside 91, Village 123), via ForkCast's `/api/menu` |
| Tonight's dinner for halal + sesame: EVK 12/21, Parkside 8/23, Village 14/23 | Same menus run through the app's own filter (`lib/filter.ts`). Parkside's Allergen Awareness Zone counts as hidden because Maya isn't registered. |
| 3, 10 and 12 min walks from Cardinal Gardens | OpenStreetMap foot routing |
| "About four seconds" to a pick | Measured on the live site: 3.8–4.5 s for a fresh (uncached) recommendation |
| 206 automated tests, including 8 student profiles that fail if a flagged dish is recommended | `npm test` in the repo |
| 1 in 10 U.S. adults has a food allergy | Gupta et al., *JAMA Network Open*, 2019 (10.8% of U.S. adults) |
| 0 allergen decisions made by AI | How the app is built: code filters before Claude sees the menu and verifies after |

If you film on a different day, tell me and I'll re-pull that day's menus so the numbers match the date on screen.

## Animations and transitions (generated in code, nothing to do)
All in `~/Desktop/ForkCast-video` (Remotion): typewriter time stamp, documentary name card, the USC street map with walking routes, the 271-dot menu grid and the dinner filter, quote cards, the 1-in-10 stat, the FORKCAST logo slam with flash and shake, the pipeline with dishes flowing and dropping out, the "0" card, the language swap, the end card, film grain over everything, burned-in subtitles, and slide/wipe/fade transitions between scenes. If a scene ever renders wrong, a fallback is Brendan's trick: build those beats as slides and screen-record clicking through them.

## How it comes together
1. Film **A1–A7** and **H1–H3**; record **R01–R11**; Andrew records **VO-01…VO-14** ([NARRATION_ANDREW.md](NARRATION_ANDREW.md)).
2. Name each file by its ID (`A3-desk.mov`, `R02-setup.mp4`, `VO-05.m4a` …) and drop them in `~/Desktop/ForkCast-video/public/footage/` (video) and `public/vo/` (voice). Add one music track to `public/music/` (YouTube Audio Library: search "cinematic piano" or "lofi emotional").
3. Tell me. I trim, time and render the 4K final. Anything missing shows as a labeled placeholder in the draft, so we always know what's left.
