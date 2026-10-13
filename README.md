# Highfell

A three-seat co-op dungeon game for phone and desktop: a tank, a healer and a DPS, with bots in the seats
nobody is sitting in. Make heroes (a race and a class each, for keeps) and keep alts at the camp. Short
dungeons, OSRS-style loot (every drop rolls on its own, kill counts, a collection log by boss), a home to show
off what you find, and a lantern that tells you what is in the chest before you open it.

The first dungeon is **Barrow Crypt**: five packs, Sir Rattlebones, and the Gravekeeper in his yard.

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
