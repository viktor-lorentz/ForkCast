# Recording the app with OBS on the Mac (clips R01–R11)

This is the screen footage for the video. Each clip has an ID that matches [`VIDEO_SCRIPT.md`](VIDEO_SCRIPT.md), and the Remotion project places each file automatically by its name. Plan on about 45 minutes. **⚠️ R09 can only be recorded between 9:20 and 9:55 PM tonight.**

## 1. Chrome: a phone-sized window (5 min)
1. Open a **new Chrome window** with https://forkcast-usc.vercel.app/api/warm, wait for it to finish loading, then go to https://forkcast-usc.vercel.app
2. **⌘⌥I** opens DevTools. In DevTools: **⋮ → Dock side → Undock into separate window** (the first icon), so DevTools isn't in the recording.
3. Back in the page window, press **⌘⇧M** (or click the phone icon in DevTools) to turn on the device toolbar.
4. In the toolbar at the top of the page: **Dimensions: iPhone 14 Pro** (393×852), **zoom 100%**. In the toolbar's ⋮ menu: **Show device frame: off**, **Add device pixel ratio**, and set **DPR to 3**.
5. Make the Chrome window tall enough that the whole 852-px phone screen shows, with nothing cut off.
6. macOS: **Control Center → Focus → Do Not Disturb** on (no notification pop-ups). Close other tabs with personal stuff.

## 2. OBS settings (one time, 5 min)
**OBS → Settings:**
- **Video:**
  - Base (Canvas) Resolution: type **786x1704**
  - Output (Scaled) Resolution: **786x1704**
  - Common FPS: **30**
  (393×852 phone points × 2 on a Retina screen; it matches the screenshots we already use.)
- **Output** (Output Mode: Simple):
  - Recording Path: `~/Desktop/ForkCast-video/public/footage`
  - Recording Quality: **Indistinguishable Quality, Large File Size**
  - Recording Format: **Fragmented MP4** (or MPEG-4)
  - Encoder: **Hardware (Apple, H.264)**
- **Audio:** Desktop Audio and Mic/Auxiliary Audio both **Disabled**. Narration is recorded separately (section 5).
- **Hotkeys:** Start Recording **⌃⌥R**, Stop Recording **⌃⌥S**. (Avoid ⌘⇧R; in Chrome that's a hard reload.)

**The source:**
1. In the main OBS window, **Sources → + → macOS Screen Capture**.
2. Method: **Window Capture**, Window: the Chrome window with ForkCast. **Uncheck "Show cursor"**: tap ripples get added in the edit, and a mouse arrow on a phone looks wrong.
3. Crop to just the phone screen: right-click the source → **Transform → Edit Transform** → set Crop Top/Bottom/Left/Right until only the 393×852 page area is left (no Chrome toolbar or device toolbar). Then right-click → **Transform → Fit to screen**.
4. Check the preview: it should look exactly like a phone screen, edge to edge.

## 3. How to record each clip
- Start recording (⌃⌥R), **wait 2 seconds**, do the steps **slowly**, pause **about 2 seconds before and after every click**, wait 2 seconds at the end, stop (⌃⌥S).
- **Scroll with the trackpad, slowly.** Clicks act as taps (touch emulation). Swipes in the taste check: click and drag the card sideways.
- One clean take per clip. If you fumble, stop and redo the whole clip. Never edit inside OBS.
- **Rename each file right after stopping** to its ID: `R01-usc-menus.mp4`, `R02-first-run.mp4` and so on. The ID at the start is what matters; the rest is for humans.
- Keep the app in **light mode and English** unless the clip says otherwise.

## 4. The clips

**R01 · USC's menu site · 15 s**
Same window → https://hospitality.usc.edu/dining-hall-menus/
1. Scroll slowly through Everybody's Kitchen's menu.
2. Hover over a dish with several tiny allergen icons and pause there (the zoom gets added in the edit).
3. Click the **Parkside** tab, scroll a bit, then **USC Village**, scroll a bit.

**R02 · First run, as Omar · 45–60 s**
**⌘⇧N** opens an Incognito window, so there's no saved profile. Redo steps 1.3–1.5 (device toolbar on, iPhone 14 Pro, DPR 3), then point the OBS source at this window and re-check the crop. Go to https://forkcast-usc.vercel.app
1. Hold 2 s on the welcome screen, then **Get started**.
2. **Any allergies?** → tap **Pork** → **Next**.
3. **Do you follow a diet?** → tap **Halal** → **Next**.
4. **Any fitness goal?** → tap **Bulk up** (it moves on by itself).
5. **What do you love?** → tap **chicken** and **rice**, type **beef** in the box and tap **Add** → **Next**.
6. **Where do you live?** → **Pardee Tower** → **Next**.
7. **Anything else?** → **Skip**.
8. **What looks good?** Drag 3–4 cards right and 2 left.
9. The pick appears. **Hold 4 s on the red card.**
**Keep this Incognito window open for R03–R11** so every clip shows Omar's profile (halal, no pork, bulking, Pardee Tower). Where a clip below gives a `?demo=` link, just stay on the main page instead.

**R03 · The pick · 30 s** (same window)
1. Hold 3 s on the red card (at dinner on Nov 15 it says **Everybody's Kitchen**).
2. Scroll slowly through **Your plate**.
3. Stop at **Dishes that fit you, by hall** and hold on the ★ OUR PICK row.
4. Click a hall row to open it, scroll its list a little, click again to close.

**R04 · How we checked · 15 s** (same page)
1. Scroll to **Why EVK? How we checked** and click it.
2. Hold 4 s on the green checks.
3. Scroll to **Hidden at EVK for you** and hold on a *Contains Pork (USC label)* row.

**R06 · Thumbs, I ate this, rate · 20 s** → https://forkcast-usc.vercel.app/?demo=halal-sesame
In **Your plate**:
1. 👍 on one dish.
2. 👎 on another: it slides away (leave Undo alone).
3. **I ate this** on the top dish → **How was it?** → **8** → hold on *✓ Saved. Thanks!*

**R07 · Rating card + /rate · 25 s · optional, not in the current cut** → https://forkcast-usc.vercel.app/?demo=halal-sesame&ask=rate
1. The **How was dinner at EVK?** card: score 2–3 dishes, then **Done**.
2. Scroll to the bottom → **Ate something else? Rate a dish** → on /rate, click a dish → **9**.

**R08 · This week · 20 s** → https://forkcast-usc.vercel.app/?demo=halal-sesame
1. Click **This week**, then scroll slowly through the 7 days.
2. Click **Monday** → hold 3 s on its pick.
3. Click **Today**.

**R09 · Closing soon · 10 s · ⚠️ 9:20–9:55 PM only** → https://forkcast-usc.vercel.app/?demo=halal-sesame
1. Hold 3 s on the red card showing **Closes at 10:00PM**.
2. Scroll to the hall bars. After about 9:44, EVK and Village show **⏱ Closes in N min**, and Parkside shows **Closed now**.

**R10 · Languages + dark mode · 25 s** (same page)
1. Globe (**EN**) → **Español**. Keep holding while the AI's sentence switches too (a few seconds).
2. Globe → **中文**, hold 3 s.
3. **Sun/moon switch** → dark. Scroll a little, then switch back to light.
4. Globe → **English**.

**R11 · Email & share · 30 s** (same page)
1. **Envelope** → type `vlorentz@usc.edu` → **Email me** → hold on *Sent to...*
2. **Show QR code**, hold 2 s → **Close**. Stop recording.
3. Prepare part 2 off camera: in the same phone-sized window, open USC email (Outlook on the web) and **search "ForkCast"**, so no other emails or names are on screen.
4. Record part 2 as `R11b-email.mp4`: open the email and scroll slowly through the meal cards.

## 5. Narration
Andrew reads the lines in [NARRATION_ANDREW.md](NARRATION_ANDREW.md) (VO-01 … VO-14), one file per line. Put the files in `~/Desktop/ForkCast-video/public/vo/`.

## 6. Hand-off
Put everything in `~/Desktop/ForkCast-video/public/`:
- `footage/`: R01–R11 (plus `R11b`), the apartment scenes **A1–A7**, hall scenes **H1–H3**, and the existing B-roll and T1/T3 clips
- `vo/`: VO-01 … VO-11
- `music/`: one track (see the editing guide in VIDEO_SCRIPT.md for where to find one)

Then tell Claude "footage is in". It checks every clip, sets the trims and zooms, renders the full draft, and sends you the MP4.
