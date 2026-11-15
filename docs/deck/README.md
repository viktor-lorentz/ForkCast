# ForkCast pitch deck

Two copies of the same 12-slide deck (Omar's story, built Sun Nov 15, 2026):

- **`forkcast-deck.html`**: the whole deck in one file, with every animation, picture and font inside it. Download it and double-click to open it in a browser. It needs no server and no internet, and it carries no hosting badge. It can also be hosted anywhere as a single file.
- **`forkcast-deck-web.zip`**: the multi-file web build, exactly what is published on Netlify. Unzip it, run `npx serve <that folder>` in Terminal, and open the address it prints. Its `index.html` does not work by double-clicking.

Both are kept as plain files under `docs/` so they never affect the app's build, tests or lint.

## Controls

→ or Space: next click or slide · ←: back · F: full screen · O: overview

## Source

The deck's source (Slidev) lives outside this repo, in Andrew's `forkcast-deck` folder. `npm run onefile` there rebuilds the one-file version.
