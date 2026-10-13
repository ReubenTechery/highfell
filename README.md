# Highfell: source backup, 13 Oct 2026

Start here: [Highfell Start Here](https://claude.ai/artifact/CKgMqHaxJsEvyuQxFWZvP7) links every design canvas, playable page and doc, and lists what's locked. Those all live on claude.ai; this folder holds the code behind the playable pages.

## What's in here

- `dungeon/barrow-crypt.html`: the built Barrow Crypt dungeon, byte for byte the published page.
- `fight/barrow-king-fight.html`: the built Barrow King fight, version 3.
- `build/dungeon/`: dungeon source. `template.html`, `js/01_core.js` to `js/13_main.js`, `art.json` (sprites) and `tiles.json` (ability and item icons).
- `build/fight/`: fight source. `template3.html` is version 3; the TV scene, boss and hero art sit beside it, with older versions.
- `build/fonts/`: local fonts for the screenshot tests.
- Everything else in `build/`: earlier venue-era pages and generators.
- `tools/`: the Python tools for art, builds, bot sims and screenshots.
- `highfell/`, `lookbook/`, `raidnight/`: working copies of the three design canvases. The live versions are on claude.ai.

## Build

- `python3 tools/dgart.py` draws the dungeon sprites into `build/dungeon/art.json`.
- `python3 tools/dgtiles.py` draws the ability and item icons into `build/dungeon/tiles.json`.
- `python3 tools/dgbuild.py` assembles `dungeon/barrow-crypt.html` and checks the visible text.
- `python3 tools/fightbuild.py` assembles `fight/barrow-king-fight.html`; pass `v2` to rebuild the old version.

The tools find this folder from their own location. Set `HIGHFELL_ROOT` to point them somewhere else.

## Test (needs Playwright and Chromium)

- `python3 tools/dgtest.py sim ROLE [seed] [start] [solo] [tier] [skill]`: a fast bot-sim run.
- `python3 tools/dgtest.py real ROLE W H prefix secs [start] [tier]`: a real-time run with screenshots.
- `python3 tools/dgprobe.py ROLE seed start [n]`: peeks at game state during a sim.
- `python3 tools/dgscreens.py W H prefix [wipe|solo|loot|all]`: UI screenshots.

The dungeon page exposes `window.__crypt` (start, step, respawn, snap, live, peek, wipeNow) for these tests.
