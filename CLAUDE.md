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

`window.highfell` is the running app in the page: `highfell.startRun({ role, start, testRar })`,
`highfell.run.autoplay(seconds, until?)` lets the bots play your seat fast, `highfell.reveal.preview('normal' | 'unique' | 'pet')`.

## Map of the code

- `src/core` — math, RNG (seeded combat stream, separate loot streams), the event bus, the save store.
- `src/content` — data only. Roles and abilities, gear and traits, and one folder per dungeon
  (`barrow/`: map, mobs, bosses, script, items, loot tables, collectibles, achievements).
  Register a dungeon in `src/content/index.ts`; `checkContent()` and the tests catch broken ids.
- `src/dungeon` — the engine (plain JS, DOM-free): state `S`, entities, heroes, mobs, bots, the loop,
  rendering, and `walkout.js` (the lantern tells). It reaches the screen only through `HOOKS` and `emit`.
- `src/meta` — TypeScript rules for everything that lasts: profile + migrations, loot, gear, achievements, hearth.
- `src/ui` — the screens: app shell, hearth, sheets (dungeon, gear, logs, settings, spot picker), run HUD and
  input, reveal, toasts, sound. `styles.css` is inlined by the build.
- `src/sim` + `scripts/sim.mjs` — headless bot runs of the real engine.
- `tools/` — the art pipeline (Python writes SVG into `art/*.json`: `art_sprites.py`, `art_icons.py`, `art_hearth.py`)
  and `pw_check.py`. Re-run the matching tool after editing art, then build.

## Rules of the game's systems

- Loot is OSRS-style: every line of a boss table rolls on its own per player; kill counts are per boss;
  duplicates become 3 Marks; every clear also gives a mark, a ladder piece (Common to Epic in about ten clears)
  and a spare piece for another role. Practice runs give nothing. Loot rolls when the boss dies (`resolveKill`).
- The walkout: the final boss's drops decide the lantern's tell. Normal: it gutters out. Unique: it flares
  gold and the chest knocks twice. Pet: every light dies, sound cuts, the lantern lifts and the pet walks out.
  The first second is identical for all three on purpose.
- Achievement rewards are looks, titles, trophies and pets, never power.
- Balance targets (guarded by `tests/balance.test.ts`): Common bot clear about 4:00 with no wipes, the
  Gravekeeper about two minutes, full Epic at least 15% faster, the DPS alone dies before Sir Rattlebones.
- Changing the save's shape: bump `PROFILE_VERSION` in `src/meta/profile.ts` and add a migration step.
  Never drop a field players have.
- Set 3-piece bonuses are designed but marked `ready: false` until their summons exist.

## House style

- Visible text is plain and short. Never use the word "stroke" anywhere a player can read it (the build warns).
- Everything is original: no names, characters or ability names copied from other games.
- No business or venue material in this repo; it is public.
- Art follows the locked TV-cartoon style: one black line (#1E1A1A), flat colour, chunky shapes.
