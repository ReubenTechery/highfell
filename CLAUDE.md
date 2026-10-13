# Highfell

A three-seat co-op dungeon game (tank, healer, DPS) for phone and desktop, played as a single web page.
Dungeons are the junk food: short, grindable, OSRS-style loot. The complex stuff is saved for raids.
The name is not final; it lives in one constant, `GAME_NAME` in `src/content/index.ts`.

## Where things live

| What | Where |
| --- | --- |
| The live game (republish here) | https://claude.ai/artifact/LYyryT29gsopt6UPoNceVd |
| Start Here doc (index of every artifact) | https://claude.ai/artifact/CKgMqHaxJsEvyuQxFWZvP7 |
| Dungeon Systems doc (abilities, loot, achievements) | https://claude.ai/artifact/1JtG4R1SNrsTanWw8KGMhK |
| Barrow Crypt v1 (the first test build, frozen) | https://claude.ai/artifact/PCWjjDHnK42uQb5tUUR8tU |

The design canvases (Concept, Look Book, Raid Night, Barrow King Fight) are linked from Start Here.

## The loop for any change

```bash
npm ci                 # once per checkout
npm run all            # type-check, tests (incl. balance sims), build dist/highfell.html
npm run sim            # balance table: clear times, pack times, damage share (--gear 3, --solo, --seeds N)
python3 tools/pw_check.py shot.png --w 390 --h 844 --touch   # screenshot the built page (phone)
python3 tools/pw_check.py shot.png --w 1440 --h 900 --js "highfell.reveal.preview('pet')"
```

Then:
1. Publish `dist/highfell.html` to the live game URL above (Artifact tool, `url` = the live game).
   Keep the declared capabilities `db` and `user`: they hold everyone's save.
2. Commit with a plain-English message, then `git push origin main`. Push `main` only: never `--all`,
   tags or stashes. The repo is public.
3. If the change matters to the design, update the Dungeon Systems doc and the "Where it's at" part of Start Here.

`window.highfell` is the running app in the page: `highfell.startRun({ start, testRar, role? })` plays the active
hero (`role` picks one of your heroes in that seat; with none, it is practice in plain gear),
`highfell.run.autoplay(seconds, until?)` lets the bots play your seat fast, `highfell.reveal.preview('normal' | 'unique' | 'pet')`,
`highfell.showCamp()` / `showCreate()` / `showHearth()` / `showVale()` (the map) / `showBrew()` (the cauldron), and
`highfell.p` is the live profile (change it, then `highfell.save()`). Settings has Vale testing switches (free harvests, lucky ×50).
A fresh browser has no heroes, so the page opens on the hero maker: click `#cr-go` to make the rolled one.

## Map of the code

- `src/core` — math, RNG (seeded combat stream, separate loot streams), the event bus, the save store.
- `src/content` — data only. Roles and abilities, gear and traits, `folk.ts` (the four races, the six classes,
  which race and class combos have art in `HERO_ART`, name lists), and one folder per dungeon
  (`barrow/`: map, mobs, bosses, script, items, loot tables, collectibles, achievements).
  Register a dungeon in `src/content/index.ts`; `checkContent()` and the tests catch broken ids.
  `vale/` is the overland: ingredients, recipes, the map, skill ranks, and one file per place (`bramblewick.ts`).
- `src/dungeon` — the engine (plain JS, DOM-free): state `S`, entities, heroes, mobs, bots, the loop,
  rendering, and `walkout.js` (the lantern tells). It reaches the screen only through `HOOKS` and `emit`.
- `src/meta` — TypeScript rules for everything that lasts: profile + migrations (heroes live here), loot, gear,
  achievements, hearth, and `vale.ts` (regrowth, harvests, errands, ranks, brewing, the brew a run drinks).
- `src/ui` — the screens: app shell; scenes for the hearth (your hero by the fire), the camp (all your heroes),
  the hero maker, the run (HUD and input) and the reveal; sheets over them (dungeon, the gear doll, the logs with
  the collection log by boss and gathering spot, the satchel, settings, spot picker, item); toasts, sound.
  The Vale: `vale.ts` (the map, the ride, a place, errands), `valeart.ts` (its scenery), `toys.ts` (the gathering
  close-ups), `brew.ts` (the cauldron). `styles.css` is inlined by the build.
- `src/sim` + `scripts/sim.mjs` — headless bot runs of the real engine.
- `tools/` — the art pipeline (Python writes SVG into `art/*.json`: `art_sprites.py`, `art_icons.py`, `art_hearth.py`, `art_vale.py`)
  and `pw_check.py`. Re-run the matching tool after editing art, then build.

## Rules of the game's systems

- Loot is OSRS-style: every line of a boss table rolls on its own per player; kill counts are per boss;
  duplicates become 3 Marks; every clear also gives a mark, a ladder piece (Common to Epic in about ten clears)
  and a spare piece for another role. Practice runs give nothing. Loot rolls when the boss dies (`resolveKill`).
- The walkout: the final boss's drops decide the lantern's tell. Normal: it gutters out. Unique: it flares
  gold and the chest knocks twice. Pet: every light dies, sound cuts, the lantern lifts and the pet walks out.
  The first second is identical for all three on purpose.
- Heroes are alts: race and class are fixed when made, up to six, the last one can't be deleted, and a hero the
  game named (the move from one hero per role) can be renamed once. The active hero is the one on the hearth and
  the one a run plays. Each hero has its own regular gear (the ladder), title and clears. Shared by everyone:
  the collection (a unique fits any hero of its role), kill counts, Marks, achievements, titles, the hearth.
  Shared gear (`warband`) is a floor per role, capped at Rare: spare pieces and your own ladder raise it, and
  every hero of that role, made now or later, wears at least it. Epic is earned on the hero.
- A combo is makeable when it has a ready class and art in `HERO_ART`. The rest show in the maker as "Soon".
- Achievement rewards are looks, titles, trophies and pets, never power.
- Balance targets (guarded by `tests/balance.test.ts`): Common bot clear about 4:00 with no wipes, the
  Gravekeeper about two minutes, full Epic at least 15% faster, the DPS alone dies before Sir Rattlebones.
- Changing the save's shape: bump `PROFILE_VERSION` in `src/meta/profile.ts` and add a migration step.
  Never drop a field players have. v2 to v3 turned one hero per role into the roster: the role you last played
  became your first hero, the others' gear became shared gear. v3 to v4 added the Vale (`p.vale`), empty.
- Set 3-piece bonuses are designed but marked `ready: false` until their summons exist.
- The Vale (riding out) stays small: one button on the hearth, about five minutes a trip, no open world, no crafted
  gear, no inventory, no streaks. A place regrows 2 harvests a day and banks 6; errands come 1 a day and bank 3.
  A harvest is rolled when its close-up starts (like a kill); Perfects add on at the end. Rares roll per line,
  OSRS style; a duplicate becomes 2 Starlight Dew. Every errand gives the next page of that place's story.
  Everyone's first ride gives a Hill Goat.
- Brews are fun twists for one run, never power a raid needs. One bottle a run, drunk at the door; practice uses
  the brew but keeps the bottle. Effects live in the engine under the recipe id (`tonic`, `fizz`, `glow`, `elixir`).

## House style

- Visible text is plain and short. Never use the word "stroke" anywhere a player can read it (the build warns).
- Everything is original: no names, characters or ability names copied from other games.
- No business or venue material in this repo; it is public.
- Art follows the locked TV-cartoon style: one black line (#1E1A1A), flat colour, chunky shapes.
