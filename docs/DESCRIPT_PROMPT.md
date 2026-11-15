# Descript: what to upload + the prompt

## 1. Upload checklist
Rename each file to exactly this name **before** uploading. Descript reads the names, and the prompt refers to them.

**Voice (19 files)**
- [ ] `O-01` … `O-07`: Omar's lines (7 files)
- [ ] `A-01` … `A-08`: Andrew's lines (8 files)

**Filmed tonight (9 files)**
- [ ] `A1-dark-phone`: Omar scrolling his phone in the dark
- [ ] `A2-table`: Omar at the table, laptop, gym bag
- [ ] `A3-menu-scroll`: over-the-shoulder scroll of USC's menu site
- [ ] `A4-friends-left`: phone face down, Andrew leaves in the background
- [ ] `A5-pushups`
- [ ] `A6-fridge`
- [ ] `A7-mom-text`: Omar reading and replying to a text
- [ ] `A8-walk-out`: Omar grabs his jacket and leaves
- [ ] `A9-three-leave`: Omar, Andrew and Viktor head out together

**Screen recordings (3 files)**
- [ ] `R02-setup`: the app setup, as Omar
- [ ] `R03-pick`: the Parkside red card, plate and bars (on **Dinner**)
- [ ] `DECK-graphics`: the deck on autoplay (`A`), one take, about 2:13

**Footage we already have** (in `~/Desktop/ForkCast-video/public/footage/`)
- [ ] `T1-jaden-take1.mp4`: Jayden's testimonial
- [ ] `T3-courtyard-student.mov`: Samikshya's testimonial
- [ ] `B02-walk-to-parkside.mp4`: Parkside entrance, no people
- [ ] `B03-usc-menu-hand.mp4`: backup for A3

**Music**
- [ ] One track, about 2:30, ideally soft piano that lifts halfway (YouTube Audio Library, free)

**Do NOT upload:** `B01B` (diners' faces, no consent), `X-do-not-use-take2`, `B04B`, anything in `_old-tests`.

## 2. Where each slide is in `DECK-graphics`
Autoplay timing is fixed, so each slide sits at the same spot in the recording. Times are measured from the moment you press `A`. If you started recording earlier, every slide is shifted later by that gap. Each slide fades in over the first half second.

| Slide | In the recording |
|---|---|
| G01 Home · Philadelphia | 0:02–0:06 |
| G02 Meet Omar | 0:06–0:12 |
| G03 Three menus | 0:12–0:18 |
| G04 Group chat 1 | 0:18–0:26 |
| G05 Same week | 0:26–0:31 |
| G05b Mom texts | 0:31–0:37 |
| G06 Survey 27 of 50 | 0:37–0:44 |
| G07 Quote Samikshya | 0:44–0:49 |
| G08 Quote Jayden | 0:49–0:53 |
| G09 Group chat 2 | 0:53–0:57 |
| G10 Parkside: yes | 0:57–1:02 |
| G11 Group chat 3 + 10 s | 1:02–1:07 |
| G12 Quick questions | 1:07–1:13 |
| G13 How it picks | 1:13–1:29 |
| G14 Every hall | 1:29–1:35 |
| G15 Plate | 1:35–1:43 |
| G16 Features | 1:43–1:51 |
| G17 Numbers | 1:51–1:58 |
| G18 Text to Mom | 1:58–2:05 |
| G19 End card | 2:05–2:13 |

## 3. The prompt (paste into Descript's AI, Underlord)
If it gets something wrong, fix that one scene by hand or ask it again for just that part. Splitting the deck at the times in section 2 is the most reliable step to do yourself.

```text
Edit a 2:30 hackathon demo video for "ForkCast", a web app that tells USC students which dining hall has food they can eat. 16:9, 1080p. Use only the files I uploaded. Don't add stock footage, AI-generated video, or AI voices.

STORY: Omar, a real USC freshman from Philadelphia, is halal, doesn't eat pork, and is trying to bulk. He misses his mom's cooking. Finding food he can eat takes so long that his friends eat without him. ForkCast fixes that. Two voices: Omar tells his story (files O-01 to O-07), Andrew narrates the product (A-01 to A-08).

THE TIMELINE IS THE VOICE. Lay the voice files end to end in this order, with about 0.3 s between them, and remove flubs, repeated takes and long pauses:
O-01, O-02, O-03, O-04, O-05, [6 s with no voice], A-01, [9 s for the two testimonials], O-06, [7 s with no voice], A-02, A-03, A-04, A-05, A-06, A-07, [4 s with no voice], O-07, A-08.

DECK-graphics is one screen recording of animated slides. Split it into slides at these times (from the start of the recording): G01 0:02-0:06, G02 0:06-0:12, G03 0:12-0:18, G04 0:18-0:26, G05 0:26-0:31, G05b 0:31-0:37, G06 0:37-0:44, G07 0:44-0:49, G08 0:49-0:53, G09 0:53-0:57, G10 0:57-1:02, G11 1:02-1:07, G12 1:07-1:13, G13 1:13-1:29, G14 1:29-1:35, G15 1:35-1:43, G16 1:43-1:51, G17 1:51-1:58, G18 1:58-2:05, G19 2:05-2:13. Use slides full screen, never cropped. Don't speed them up or cut them short: each one animates and needs its full length.

SCENES, IN ORDER (the video under each voice line):
1. O-01: A1-dark-phone for the first half, then G01.
2. O-02: A2-table, then G02 (name card) for the end of the line and 2 s after.
3. O-03: A3-menu-scroll (or B03-usc-menu-hand if A3 is shaky), then G03 for its full 6 s.
4. O-04: G04 group chat (the voice starts about 3 s into the slide), then A4-friends-left.
5. O-05: A5-pushups, then A6-fridge, then G05.
6. The 6 s gap: G05b (texts from Mom), cutting once to A7-mom-text and back. Music only.
7. A-01: G06 survey slide.
8. Testimonials, with their OWN audio (music ducked low): T3-courtyard-student (Samikshya, about 4 s), then G07 for 2 s; T1-jaden-take1 (Jayden, about 3 s), then G08 for 2 s. Trim each to the sentence about dining-hall food. Keep their faces; both agreed to be filmed.
9. O-06: G09, then R03-pick (the red card, about 2 s), then G10.
10. The 7 s gap: G11, then A8-walk-out, then B02-walk-to-parkside (2 s). Music swells here.
11. A-02: G12, then R02-setup at 1.5x speed for the rest of the line.
12. A-03: G13 for its full 16 s. Extend the shot if the line is shorter; never cut G13 short.
13. A-04: G14.
14. A-05: G15.
15. A-06: G16.
16. A-07: G17.
17. The 4 s gap + O-07: A9-three-leave, then G18 (text to Mom) under O-07. Music swells.
18. A-08: G19 end card, held 3 s after the line, then fade to black.

TRANSITIONS: Hard cuts between film shots. A quick 0.3 s cross-fade into and out of slides. Nothing flashy.

AUDIO: Studio Sound on all O and A voice files. Music on its own track for the whole video: duck it about 18 dB under any voice or testimonial, and bring it up in the gaps (scenes 6, 10, 17). Fade it out over the last 2 s. Mute the camera audio on every A1-A9 shot and on R02/R03. Keep audio only on the T1 and T3 testimonials.

CAPTIONS: Burned-in captions from the transcript, for both narrators and the testimonials. Clean sans-serif, white with a soft dark shadow, bottom center, at most 2 lines, no word-by-word highlight animation. These must be spelled exactly: ForkCast, Omar, Qabuli palaw, mantu, bolani, USC, Parkside, EVK, halal, Claude, Samikshya, Jayden. Hide captions while a slide is on screen that already shows the same words (G04, G05b, G09, G11, G18 are text chats; skip captions there unless someone is speaking).

TEXT ON SCREEN: Don't add titles, lower thirds or stickers beyond the captions. The slides already have all the text. Don't add any numbers or claims that aren't in the slides.

COLOR: Leave the film shots natural. Slightly warm A1-A9 if they look blue. Don't change colors on the slides or screen recordings.

LENGTH: Aim for 2:20 to 2:35. If it's long, tighten pauses in the voice first. Never cut slides G06, G13 or G17.

EXPORT: 1080p MP4, 30 fps.
```

## 4. Before you export, check by eye
- [ ] The survey slide says **27 of 50**.
- [ ] No other students' faces appear except Jayden and Samikshya.
- [ ] The R03 red card says **Parkside** and matches slides G10 and G13.
- [ ] Captions spell *ForkCast* and *qabuli palaw* right.
- [ ] Music doesn't cover any voice.
- [ ] The end card holds long enough to scan the QR code (about 3 s).
