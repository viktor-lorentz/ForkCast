# ForkCast demo video: script, shot list and camera settings

**Length:** about 2:45 (hard limit 3:00). **Narration:** about 390 words, relaxed pace.
**Format:** **landscape 16:9, 3840×2160 (4K) at 30 fps**, exported as 1080p or 4K MP4 (H.264).
**Camera:** Galaxy S26 Ultra. **Screen clips:** phone screen recordings (#37). **Edit and narration:** Hailey (CapCut desktop). **Animated graphics:** Claude, rendered with Remotion (G01–G11).

Everything you need to shoot is in this file: each row of the script names its shot ID, and each shot ID has its camera settings below.

---

## Footage status (Sat 8:45 PM)
**Have** (in `~/Desktop/ForkCast-video/public/footage/`, renamed by ID):
| ID | File | What | Used at |
|---|---|---|---|
| B01 | `B01-food-stations.mp4` | Food stations, close | 0:00 under the title |
| B01B | `B01B-dining-room.mp4` | Dining room, wide, students eating | 1:52 |
| B02 | `B02-walk-to-parkside.mp4` | Walking up to Parkside's doors | 0:05 |
| B03 | `B03-usc-menu-hand.mp4` | Hands scrolling USC's menu site | 0:20 |
| B04 | `B04-over-shoulder-app.mov` | Over the shoulder, using ForkCast | 0:58 |
| B04A | `B04A-over-shoulder-short.mov` | Same, 2.6 s (spare) | — |
| B04B | `B04B-walk-to-hall.mov` | Looks at phone, walks across the courtyard to the hall | 2:35, ending |
| T1 | `T1-jaden-take1.mp4` | Jayden | 0:08 |
| T3 | `T3-courtyard-student.mov` | Samikshya | 0:14 |

**Dropped (not shot):** B05 (plate + rating) → the wide dining-room shot covers it. B06 (team) → the end card runs longer. T2 "reaction after trying the app" → replaced by B04B with "Live now. Try it tonight."

**Still to record:** screen clips R01–R12 (OBS, [`OBS_RECORDING.md`](OBS_RECORDING.md)), narration VO-01…VO-11, one music track.

**Testimonial lines used** (Claude transcribed the clips locally):
- **T1, Jayden, 46.9–53.3 s:** "It's so difficult finding like the perfect food. You walk into McCarthy dining hall, you're thinking: what will I eat today?" Lower third: *Jayden · Freshman, USC*.
- **T3, 16.0–21.2 s:** "Yes, it can be very tricky to find food that matches my dietary restrictions at the dining halls." Lower third: *Samikshya · Freshman, USC*.
- **Jayden's take 2 is not used** (the file is renamed `X-do-not-use-take2.mp4`).

## How it all comes together (start here)
1. **B-roll:** rename Andrew's files by shot ID (`B01-hall-wide.mp4` …) and put them in `~/Desktop/ForkCast-video/public/footage/`.
2. **Screen clips R01–R12:** record them with OBS on the Mac, following [`OBS_RECORDING.md`](OBS_RECORDING.md). They go in the same folder.
3. **Narration VO-01…VO-11:** the lines are listed in OBS_RECORDING.md. Optionally clean them up with Descript's Studio Sound, then put them in `public/vo/`. Pick one music track and put it in `public/music/`.
4. **Claude assembles the video** in the `ForkCast-video` Remotion project: every clip placed by its ID, inside the phone frame, with the animated graphics (G01–G11), zooms, captions and music ducking, timed to the narration. It also sets the trim points after looking at frames from each clip. Out comes `out/forkcast-draft.mp4`.
5. **Review:** watch it once muted on a phone and once on a laptop with sound. Send timestamped notes ("1:23: zoom is too fast"). Claude changes the timeline and re-renders in minutes.
6. **Hailey's pass** (when she's back): she watches the draft and either sends notes, or brings Claude's graphics (`npm run graphics` renders them separately) into CapCut for hand-finishing. Either way, the final is exported in 4K (`npm run final`) and uploaded unlisted to YouTube.

Why not Descript or Opus Clip for the whole edit: Descript is great for cleaning up voice and trimming talking footage by editing the transcript, but it doesn't assemble a multi-source, phone-in-frame edit from a script. Opus Clip cuts long videos into short clips for social media. Its own docs say it can't join moments that aren't next to each other, and it's built around 9:16. It *would* be good afterwards for a 30-second vertical teaser for Instagram/TikTok.

## Why landscape
- Judges watch on a laptop or a projector, and Devpost embeds YouTube/Vimeo, all 16:9. A portrait video plays as a narrow strip with black bars on both sides.
- The app is portrait, and that's fine: in the edit, every screen clip sits **inside a phone frame, centered or slightly right, on the ForkCast cream background (#faf7f2)**. The empty space on the left holds the on-screen text from the script (big, bold, cardinal #990000 or dark #1c1917). This looks deliberate and polished, like Apple's product videos.
- B-roll and the face to camera in the "Option B" testimonials are filmed landscape, so they fill the frame.

## Pro Video or normal Video?
**Pro Video for everything filmed standing still** (B01, B03, B05, T1–T3). Auto mode keeps changing brightness and color under dining hall lights, so cuts don't match and the lights can flicker on screen. Pro Video locks exposure, white balance and focus, so every clip looks the same.
**Normal Video mode for the shots that move** (B02, B04): Pro Video has no Super Steady, and walking shots shake.

Menu names below are from recent Galaxy phones; on the S26 Ultra they may be worded a little differently.

### One-time camera setup (Camera → ⚙ Settings)
- **Advanced video options:**
  - **High efficiency video:** OFF (H.264 opens in every editor).
  - **HDR10+ video:** OFF (looks washed out in most editors).
  - **Log:** OFF (needs color grading; no time tonight).
- **Video stabilization:** ON.
- **Auto FPS:** OFF.
- **Grid lines:** ON (to keep horizons straight and the subject on a third).
- **Storage:** check 15+ GB free. 4K is about 400 MB a minute.

### Presets
| Preset | Mode | Settings |
|---|---|---|
| **A · Locked B-roll** | Pro Video | **UHD 4K, 30 fps**, 1× lens. **Shutter 1/60** (avoids flicker under US lights and gives natural motion blur). **ISO:** as low as still looks bright, about 100–400 indoors, 50 outdoors in daylight. **WB:** fixed, **4300K** indoors under LEDs (5500K outdoors in daylight, 3200K under warm bulbs); nudge until white napkins look white. **Focus:** manual (MF), tap the focus peaking on, set on the subject. Prop the phone on something or use a tripod. |
| **B · Moving B-roll** | Video (normal) | **UHD 4K, 30 fps**, 1× lens, **Super Steady OFF** (it crops and drops to lower resolution), stabilization ON. Walk slowly, elbows in, phone with both hands. Tap and hold on the subject to lock focus and exposure (AE/AF lock) before you move. |
| **C · Interview** | Pro Video | Like A, but: **3× lens** if there's space (2–3 m back, flattering, blurs the background), or 1× close. **Audio:** Mic → **Omni** or the external mic if you have one; **Wind filter ON** outside. Phone on a stand at eye height. |
| **D · Screen clips** | Screen recorder | See #37. iPhone: Control Center → Screen Recording, microphone off. S26: Quick panel → **Screen recorder** → Sound: **No sound**, Video quality: **highest**, "Show taps and touches" **OFF**. Do Not Disturb on. |
| **E · Narration** | Voice Recorder app | Mode **Standard** (or **Interview**), high quality. Quiet small room with soft stuff around (a closet or under a blanket works). Phone 15–20 cm from the mouth, slightly to the side so breath doesn't pop. Record each script line as its own take, leaving 2 s of silence. |

**Framing rules for every camera shot:** landscape, horizon level, subject on a third (grid line), hold each shot **8–10 seconds without moving** (Hailey needs room to cut), no faces of students who didn't agree to be filmed, no allergen claims written on screen beyond USC's own labels.

---

## Shot list: camera (B-roll and testimonials)

| ID | Shot | Preset | Notes |
|---|---|---|---|
| **B01** | Wide of a dining hall line or the food stations | A | Tripod or prop at chest height. Students blurred or from behind is fine. 10 s. |
| **B02** | Walking toward a dining hall entrance (EVK or Village) | B | Slow walk, 10 s, starting about 10 m away. Golden hour or evening lights. |
| **B03** | Close-up of a student's hand scrolling USC's menu site on a phone, squinting at icons | A | Over-the-shoulder, phone screen in focus (MF on the screen). Pairs with R01. |
| **B04** | Over-the-shoulder: student opens ForkCast, looks up, walks toward a hall | B | Phone in focus first, then rack focus to the hall (or just follow). The "aha" shot. |
| **B05** | Close-up of a plate of food at the table, then a hand tapping a score on the phone next to it | A | Top-down or 45°. Pairs with R06 (rating). Warm WB (about 3800K) makes food look good. |
| **B06** | Team shot: Viktor, Andrew and Hailey at the hackathon laptop, then turning to camera | A | For the end card. 10 s. |
| **T1–T3** | Testimonials (see below) | C | Each 15–40 s raw; we use 5–8 s. |

---

## Testimonials: keep them or drop them?
**Our take: keep one or two short real ones if you can get them tonight; drop them if you can't.**
- **What they add:** judges score *impact*, and a real student saying "I actually check three menus every night" is the most convincing 7 seconds in the video. It also matches our survey slide (57% of students we asked have a dietary restriction or allergy).
- **What dropping them costs:** not much, if the replacement is strong. Use the survey number on screen instead (see "No-testimonial version" below). The video still holds up; it just feels a little less human.
- **What to avoid:** a stiff, read-aloud quote. Judges can tell, it looks worse than no testimonial, and handing students lines to recite as their own opinion would be presenting staged words as real reactions. So below are **questions** that reliably get the kind of answer we want, in their own words, not a script for them to read.

### Option A: real students (best)
Film with preset C. Ask permission first ("Can we use this in our hackathon video?") and get a yes **on camera**. Ask one question at a time, let them talk, and don't finish their sentences. Ask them to **restate the question in the answer** ("Finding food I can eat is..." rather than "Yeah, it's hard"), so the clip makes sense without your voice.

**T1, the problem** (plays at 0:08):
- "How do you figure out where to eat on a normal day?"
- "What's the hardest part about eating at the dining halls with your diet?"
- Follow-up if they're short: "Walk me through last night: how did you pick?"
- *What we're hoping for* (don't say it to them): a specific moment, like checking several menus, getting to a hall and finding nothing, or asking staff about every dish.

**T2, the reaction** (plays at 2:34). Let them use ForkCast on their own phone for a minute first (QR from the deck's last slide or https://forkcast-usc.vercel.app):
- "What did it just tell you?"
- "Would that have changed what you did tonight?"
- "What would you tell a friend about it?"
- *Hoping for:* a reaction to the pick being right for them, or how quick it was.

**T3, spare:** "Is there anything you wish it did?" Useful for the judges' Q&A even if it's not in the video.

### Option B: a teammate, honestly framed (fallback)
If a teammate has a real dietary restriction, they can speak as themselves, named on screen ("Andrew, Team Overcooked"), in their own words, about their own experience. That's honest and still human. Prompt them with the T1 questions; don't read a script.

### No-testimonial version
- **0:08–0:16:** replace T1 with B03 (squinting at USC's menu) plus big on-screen text: **"57% of USC students we surveyed have a dietary restriction or allergy."** Small text under it: *Our survey, Nov 14, 2026 · 24 of 42 students*.
- **2:34–2:40:** replace T2 with B04 (the walk to the hall) plus on-screen text: **"Live now. Try it tonight."**

---

## How the script and the recordings line up
Screen clips are **R01–R12** (#37), camera shots are **B01–B06** and **T1–T3**. Every recording is saved under its ID (e.g. `R04-why-panel.mov`, `B03-usc-menu-hand.mp4`). Each row below says which clip, and which moment in it, plays under each line. **App clips (R) always go inside the phone frame on the cream background, with that row's on-screen text on the left.**

Rules for the words (spoken and on screen): never say "safe" or "allergen-free"; say "no flagged allergens per USC labels". No calorie or gram numbers. Don't claim students already use it; ratings come from our team so far.

## Script

| Time | Narration (voice-over) | Picture | On-screen text |
|---|---|---|---|
| 0:00–0:08 | *(no narration, music in)* | **B01** food stations with the **G01** title (5 s) → **B02** walking up to Parkside (3 s) | **Where should I eat?** → ForkCast logo |
| 0:08–0:20 | *(students speak)* | **T1** Jayden (6.4 s) → **T3** Samikshya (5.2 s) | Lower thirds |
| 0:16–0:32 | "Three times a day, every USC student asks the same question: where should I eat? If you're halal with a sesame allergy, that means opening three menus and decoding tiny icons on every dish." | **B03** (4 s) → **R01** in phone frame: scroll, zoom on icons, switch hall tabs | **3 halls · ~250 dishes · every meal** |
| 0:32–0:40 | "We built ForkCast. Tell it once how you eat..." | **R02, start:** welcome screen, typing in "Describe how you eat" | **ForkCast** (logo) |
| 0:40–0:55 | "...in your own words. AI fills in your profile from USC's own labels: allergies, diet, what you love, where you live. Then swipe through a few real dishes from today's menus so it learns your taste." | **R02, middle:** *Fill in for me* → steps slide by with answers filled in → dorm → taste cards | **Set up in 30 seconds** |
| 0:55–1:10 | "And in seconds: your dining hall for this meal, how far you walk, and the dishes to get." | **B04** over the shoulder (3 s) → **R02, end** (the pick appears) → **R03:** hold on the red card, scroll *Your plate* | **Your hall. Your plate.** |
| 1:10–1:20 | "It compares all three halls, and shows how much of each menu actually fits you." | **R03, end:** hall bars, **★ Our pick**, tap a hall open | **All 3 halls compared** |
| 1:20–1:42 | "Here's the important part. AI understands the food, but it never makes an allergen decision. Code removes anything USC labels with your allergens before the AI sees the menu, then checks every answer: real hall, real dishes, no flagged allergens, every label claim true. And it shows you what it hid, and why." | **R04:** *How we checked* → green checks → hidden list | **AI understands the food. Code enforces the allergens.** then **0 allergen decisions made by AI** |
| 1:42–1:52 | "A different student gets a different answer." | **R05:** switch the sample student → the hall changes | **Every student, their own pick** |
| 1:52–2:10 | "It learns as you go. Thumbs up or down on any dish. Ate it? Tap *I ate this*, rate it from one to ten, and the next student sees today's scores. It even avoids serving you the same thing all week." | **B01B** dining room (3 s) → **R06:** 👍, 👎 slides away, *I ate this* → 8 → *Saved* (optional cutaway **R07**) | **Students rate. Everyone benefits.** |
| 2:10–2:22 | "Plan ahead with the whole week, and it won't send you to a hall that's about to close." | **R08:** This week → open a day → **R09:** *Closes in N min* or *Closes at 10:00PM* | **7 days ahead · closing-time aware** |
| 2:22–2:34 | "It speaks seven languages, has a dark mode, and can email you the day's picks every morning." | **R10:** Español → 中文 → dark mode → **R11:** envelope → email arrives | **English · Español · Français · 中文 · 한국어 · हिन्दी · Tiếng Việt** |
| 2:34–2:40 | *(music only)* | **B04B**: she looks at her phone and walks across the courtyard to the hall | **Live now. Try it tonight.** |
| 2:40–2:48 | "ForkCast. Know before you go." | **G10** end card: logo, URL, QR code (8 s) | **forkcast-usc.vercel.app** · *Team Overcooked · AI@USC Hackathon 2026* |

**If it runs long:** cut 1:42–1:52 (R05) first, then shorten the 2:22 line to "It speaks seven languages and emails you the day's picks."
**If R09 is missing:** end the 2:10 line at "...with the whole week."

## Editing guide: making it look produced, not recorded

The goal: by 0:15, judges should feel this team ships. That comes from four things, roughly in this order of impact: **sound** (clean voice, good music, cuts on the beat), **motion** (nothing sits still for long; the phone moves, taps get zoomed), **type** (big bold words on screen, in our brand), and **pacing** (no shot over 4 s without something changing).

### Who does what
| Who | Job | Tool |
|---|---|---|
| **Hailey** | Main edit: timeline, cuts, music, captions, export | **CapCut desktop** (free, easiest; auto captions, keyframes, beat markers) or **DaVinci Resolve** (free, pro) if she already knows it. Premiere is fine too. |
| **Claude (Viktor's Claude Code)** | Assembles the full draft from the footage, plus the animated graphics (list below) | **Remotion** project in `~/Desktop/ForkCast-video` |
| **Viktor** | Screen clips R01–R12 (#37), records the narration if Hailey prefers | Phone screen recorder, Voice Recorder |
| **Andrew** | B-roll B01–B06, testimonials T1–T3 | S26 Ultra (presets above) |
| **Anyone** | Narration cleanup | **Descript**, free tier: drop in the VO, click **Studio Sound** (makes a phone recording sound like a studio mic), delete "um"s by deleting words in the transcript. Or CapCut's **Enhance voice**. |

**About AI video tools.** Use AI to *clean up and speed up*: voice enhancement, auto captions, beat detection, silence removal, background removal. **Don't** use AI to generate footage of the app, students or the dining halls. Judges will be looking at whether the product is real, and fake footage would undercut the strongest thing we have: it's live, and you can scan the QR right now. Use our real voice for narration (an AI voice sounds generic, and real is more convincing). Viktor: if you find out which tool Brendan used, tell Claude and we'll fit it in. Descript, CapCut and Opus Clip are the common ones.

### The animated graphics (Claude builds these with Remotion)
Each one is rendered at 3840×2160, 30 fps, as **MP4** (full-screen pieces) and **MOV with transparency** (overlays), into `ForkCast video / graphics` in the Drive. Hailey just drops them on the timeline.

| ID | Where | What it looks like | Length |
|---|---|---|---|
| **G01 Cold open title** | 0:00 over B01 | "Where should I eat?" types in word by word, big and bold, then **ForkCast** with the logo springs in and holds | 4 s |
| **G02 Problem counter** | 0:16 | Three menu cards (EVK, Parkside, Village) slide in, tiny allergen dots multiply across them, a counter runs to **~250 dishes**, "every meal" lands | 6 s |
| **G03 Phone frame** | every R clip | A clean phone frame on cream; Hailey puts the screen clip inside. Comes with the **slide-in** (from the right, 12 frames, ease-out) and the slow **push-in** (100% → 104% over the clip) built in. Also a "tap ripple" overlay (a soft cardinal circle) to place on taps | template |
| **G04 Pipeline** | 1:20 | The deck's slide 5, animated: USC menus → AI sorts → **CODE filters** (lock icon snaps shut) → AI picks → **CODE verifies** (checkmarks tick in, one per beat). "AI understands the food." / "Code enforces the allergens." swap in | 8 s |
| **G05 Zero** | 1:36 | A big **0** counts down from 9 to 0, then "allergen decisions made by AI" | 3 s |
| **G06 Two students** | 1:42 | Split screen: two phone frames, two profiles ("Halal · no sesame" / "Nut allergy"), two different halls flip in | 5 s |
| **G07 Ratings meter** | 1:58 | A 1–10 row fills up to 8 like a meter, then a ★ 7.8 → 8.0 badge ticks up | 3 s |
| **G08 Week strip** | 2:10 | Seven day tiles flip over one by one, each showing a hall | 4 s |
| **G09 Language wave** | 2:22 | "Where should I eat?" in all 7 languages, cycling fast (English → Español → Français → 中文 → 한국어 → हिन्दी → Tiếng Việt) | 4 s |
| **G10 End card** | 2:40 | Logo, **Know before you go.**, URL, QR, team names; QR gently pulses | 7 s |
| **G11 Lower thirds** | testimonials | Name / year bar slides in from the left (MOV with transparency) | template |

### Style rules (so it all feels like one product)
- **Colors:** cream #faf7f2 backgrounds, cardinal #990000 for emphasis, gold #ffcc00 only for small highlights (★, a badge), dark #1c1917 text. Same as the app and deck.
- **Font:** Geist (free from Google Fonts), **bold** for statements, tight letter spacing. Never more than ~7 words on screen at once.
- **Motion:** ease-out on the way in, ease-in on the way out, 8–15 frames (0.25–0.5 s). Nothing bounces or spins. One thing moves at a time.
- **Zoom to the tap:** whenever a screen clip shows a tap that matters (Fill in for me, How we checked, I ate this, the language menu), zoom the phone to about **160% on that spot** for 1–2 s, then back. In CapCut: select the clip → **Keyframe** at the start of the move, another 10 frames later with **Scale 160%** and **Position** on the button; copy the pair to zoom back out. Add the tap ripple (G03) on the exact frame of the tap.
- **Speed:** screen clips can play at **120–150%** during scrolling (Speed → 1.3×); keep taps and reveals at 100%. Cut out all waiting and loading.
- **Transitions:** mostly **hard cuts on the beat**. Between sections, use a **slide/push** (the next clip pushes the last one left, 10 frames). No star wipes, no cross-dissolves, no glitch presets.
- **Captions:** burned in, 2 lines max, Geist bold, white on a 60% dark rounded box, lower third; highlight the keyword in gold (CapCut: Captions → Auto captions → pick a style → edit any wrong words, especially "ForkCast", "EVK", "USC").

### Sound (half of what makes it feel pro)
- **Music:** one upbeat, modern track at about **110–125 BPM** that builds. It should start minimal (0:00–0:16), drop when the product appears (0:32), stay steady under the explanation, and lift for the ending (2:22). Free sources: **YouTube Audio Library** (studio.youtube.com → Audio library, filter "Attribution not required") or **Pixabay Music**. Search "upbeat tech", "corporate inspiring", "future bass". Check the license allows YouTube use.
- **Beat markers:** in CapCut, select the music → **Beats → Auto generate**. Snap cuts and text pops to the markers.
- **Levels:** voice peaks around **−6 dB**; music around **−20 dB** under voice, up to −12 dB where nobody talks; dip it more under testimonials. In CapCut, select the music → **Audio → Ducking** (lowers music automatically under voice).
- **Sound effects** (quiet, about −24 dB): a soft **whoosh** on each slide-in, a light **click/tap** on zoomed taps, a soft **pop** when checkmarks tick in, a **riser** in the 1 s before 0:32 (the product reveal). Free in CapCut's Audio → Sound effects, or Pixabay.
- **Silence is a tool:** cut the music for half a second right before "ForkCast. Know before you go." and bring it back on the logo.

### Section-by-section edit notes
| Time | Edit |
|---|---|
| 0:00–0:08 | B01 with **G01** over it. Music starts quiet. Slow push-in on B01. Cut to B02 on the first strong beat. |
| 0:08–0:16 | T1 full screen, **G11** lower third. Music down. If no testimonial: B03 + the 57% card. |
| 0:16–0:32 | B03 (4 s) → **G02** → R01 in **G03**, zoom on the tiny icons (200%). Narration carries it. Riser in the last second. |
| 0:32–0:55 | **Beat drop on "ForkCast."** R02 in the phone frame, sped up 1.3× while typing; zoom to "Fill in for me"; chips lighting up at 100%; taste-card swipes at 100% (they're satisfying). |
| 0:55–1:20 | The pick appears: **hold 1.5 s, no zoom** (let it land), then push in on the red card. R03 scroll at 1.3×. Zoom on the ★ OUR PICK pill. |
| 1:20–1:42 | **G04** full screen (slow down here: this is the "why we're different" moment), then R04 with each checkmark highlighted in time with the words "real hall, real dishes, no flagged allergens..." End on **G05**. |
| 1:42–1:52 | **G06** split screen, or R05 if G06 isn't ready. |
| 1:52–2:10 | B01B (3 s) → R06, zoom on 👍, then on "I ate this", **G07** meter. Quick. |
| 2:10–2:22 | **G08** → R08 at 1.3× → R09 zoomed on "Closes in N min". |
| 2:22–2:34 | **G09** → R10 language switch (zoom on the globe menu) → a 1 s dark-mode flash → R11 email arriving. Fastest section: cut on every beat. |
| 2:34–2:40 | T2, music lifts. |
| 2:40–2:47 | Half a second of silence → B06 → **G10**. Hold the end card 3 s so people can scan the QR. |

### Step by step (CapCut desktop, Hailey)
1. **Organize (10 min):** one project at **3840×2160, 30 fps** (Project → Settings). Import folders: `VO`, `R screen`, `B broll`, `T testimonials`, `G graphics`, `Music`, `SFX`.
2. **Radio edit first (30 min):** lay down only the narration (VO-01…12) and testimonials, in order, with the gaps from the script. Trim breaths. It should run 2:40–2:50. **This sets the timing for everything else.**
3. **Music (15 min):** add the track, auto-generate beats, line up the drop with "ForkCast" at about 0:32 (move the music, not the voice), turn on ducking.
4. **Picture (90 min):** follow the script table row by row: put each R clip inside **G03**, B-roll and G graphics on top. Cut on beat markers.
5. **Motion (45 min):** zooms to taps, push-ins, speed changes, tap ripples.
6. **Captions (20 min):** auto captions, fix names, apply the style, check that nothing covers a button being tapped.
7. **Sound effects (15 min):** whooshes, taps, pops, riser.
8. **Rough cut review (Sat night):** export 1080p and send it to the team chat. Everyone watches it **once on a phone with the sound off** and **once on a laptop with the sound on**, and writes timestamps of what to fix.
9. **Final pass (Sun morning, by 9:00):** fixes, color consistency (if a B-roll shot looks off: Adjust → Auto adjust, or match brightness by eye), last listen on headphones.
10. **Export:** 3840×2160 or 1920×1080, 30 fps, H.264, high bitrate (CapCut: Export → Quality "Higher"). Check the length is **under 3:00**. Upload to YouTube as **Unlisted**, paste the link into Devpost (#12). Keep the MP4 as a backup.

### Final check before uploading
- [ ] Under 3:00, sound levels steady (no jump between VO lines), no clipping.
- [ ] Watched muted: the story still makes sense from the captions and on-screen text alone.
- [ ] No "safe" or "allergen-free" anywhere, spoken or written. No calorie or gram numbers.
- [ ] Every app shot is real footage of the live app. Nothing generated.
- [ ] The QR on the end card scans from a laptop screen.
- [ ] Music license allows YouTube; credit it in the YouTube description if the license asks.

## Clip list
| ID | File | What | Length | How |
|---|---|---|---|---|
| R01 | `R01-usc-menus` | USC's own menu site | 15 s | D |
| R02 | `R02-first-run` | Describe → Fill in for me → dorm → taste cards → pick | 60–75 s | D |
| R03 | `R03-the-pick` | Pick card, plate, hall bars | 30 s | D |
| R04 | `R04-why-panel` | How we checked, hidden dishes | 15 s | D |
| R05 | `R05-switch-student` | Sample student switch | 15 s | D |
| R06 | `R06-thumbs-ate-rate` | 👍/👎, I ate this, rate | 20 s | D |
| R07 | `R07-rate-card-and-page` | Rating card, /rate page | 25 s | D |
| R08 | `R08-this-week` | This week → a day | 20 s | D |
| R09 | `R09-closing-soon` | Closing soon (7:35–7:55 or 9:20–9:55 PM) | 10 s | D |
| R10 | `R10-languages-dark` | Español, 中文, dark mode | 25 s | D |
| R11 | `R11-email-share` | Email & share, email arrives | 30 s | D |
| R12 | `R12-fitness-plate` | Fitness goal plate (spare) | 10 s | D |
| B01 | `B01-hall-wide` | Dining hall line, wide | 10 s | A |
| B02 | `B02-walk-in` | Walking to a hall | 10 s | B |
| B03 | `B03-usc-menu-hand` | Hand on USC's menu site | 10 s | A |
| B04 | `B04-forkcast-walk` | Opens ForkCast, walks to the hall | 10 s | B |
| B05 | `B05-plate-rate` | Plate + tapping a score | 10 s | A |
| B06 | `B06-team` | Team at the laptop | 10 s | A |
| T1–T3 | `T1-problem` … | Testimonials | 15–40 s raw | C |
| VO | `VO-01` … `VO-11` | Narration, one file per script line | — | E |
| G01–G11 | `G01-cold-open` … | Animated graphics (Claude, Remotion) | 3–8 s | — |
