# Highfell

A three-seat co-op dungeon game for phone and desktop: a tank, a healer and a DPS, with bots in the seats
nobody is sitting in. Make heroes (a race and a class each, for keeps) and keep alts at the camp. Short
dungeons, OSRS-style loot (every drop rolls on its own, kill counts, a collection log by boss), a home to show
off what you find, and a lantern that tells you what is in the chest before you open it.

The first dungeon is **Barrow Crypt**: five packs, Sir Rattlebones, and the Gravekeeper in his yard.

Between dungeons you can **ride out** into the Vale: a map, a short ride on your mount, and a one-screen place
to visit. The first is **Bramblewick Hollow**, where you gather herbs in close-up little games, do a daily
errand for Dottle the inventor (each one turns up a page of the hollow's story) and chase rare pets, trophies
and a mount. What you gather you brew at the cauldron at home, and a brew is a small twist for one run.

## Build

```bash
npm ci
npm run all      # type-check, tests, build -> dist/highfell.html (one self-contained page)
npm run sim      # balance numbers from headless bot runs
```

The page is a fragment meant for a host that adds the document skeleton; `tools/pw_check.py` wraps it for
local screenshots.

## Layout

`src/content` is data, `src/dungeon` is the engine, `src/meta` is progression, `src/ui` is the screens,
`tools/` draws the art. See `CLAUDE.md` for the full map and the rules the systems follow.
