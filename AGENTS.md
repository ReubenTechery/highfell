# Highfell: the brief for any agent

Read this whole file before you change anything. It is the same brief for Claude, Gemini or anyone else;
`CLAUDE.md` and `GEMINI.md` only add notes for their own tools. The owner decides; you build what was
asked, well, and say so when you think something is a mistake.

## What we are making, and why

A three-seat co-op dungeon game (tank, healer, DPS) for phone and desktop, played in one web page.
Portrait first, 2D, touch first (keys on desktop too). Bots fill the seats nobody is in.

**Who it's for:** people who loved MMO dungeons and raids but can't give a game months any more. A parent
with a free evening or three hours on a Friday night. The owner is the target player. When they can play,
it has to be worth it: big moments, real loot, a reason to come back, and never a chore.

**The best of two games, nothing else:**
- From **WoW**: the trinity (tank, healer, DPS) and teamwork between them, smashing abilities and seeing
  big crits (especially after a new weapon), the gear treadmill, dungeons and raids with friends, a cosy
  tavern home, lore.
- From **OSRS**: loot with a fixed drop rate per item, every item rolled on its own, kill counts, the
  collection log, rare pets as the flex, dry streaks that become stories, content you can grind.

**The shape is fixed: hearth → dungeon → raid.** The hearth is home, where you show off what you found.
Dungeons are junk food: four-minute runs you can grind. Raids (later) hold the complex mechanics and the
big group moments. Between dungeons you can ride out to the Vale for a few cosy minutes (built as a test
slice). Nothing else gets added to that shape without the owner saying so.

**Social:** made to play with friends (three seats). Teamwork between roles is the heart of the combat.

## Pillars: if a change fights one of these, the change is wrong

1. **Junk-food dungeons.** About 4 minutes a run, all three roles needed, loot every time. Four buttons and a
   dodge, never more: talents and sets change what buttons do, they never add one. If a mechanic needs a
   guide to understand, it is a raid mechanic.
2. **Power is short, collecting is long.** Gear climbs Common → Uncommon → Rare → Epic in about ten clears,
   then stops. After that, progress is sideways: sets, weapon traits, talents, looks, pets, mounts, titles,
   trophies, achievements. Skill and achievements earn looks, never power. Someone with three hours on a
   Friday is never behind.
3. **Honest OSRS loot.** Every line of a table rolls on its own at a fixed rate. No pity. Kill counts
   everywhere. The walkout tells you what's in the chest before it opens, and it never lies.
4. **Respect the player's time.** No streaks, no daily chores, nothing lost for missing a day (things bank up),
   no inventory to manage, no drinking for mana, no waiting around.
5. **Anti-bloat.** Every system is a cost forever. A feature earns its place by making the core loop better
   (hearth → dungeon → loot → hearth). Deepen what exists before adding something new. One currency per
   dungeon (Marks), one potion system (Vale brews). When in doubt, leave it out and write it in `docs/ideas.md`.
6. **Original and hand-made.** No names, characters, ability names or designs lifted from other games. The art
   is drawn as code in one locked style (`docs/art.md`). It must never look AI-generated.

## Decisions already made (don't reopen them; tell the owner if you think one is wrong)

| Decision | Why |
| --- | --- |
| 4 gear slots: weapon, helm, shoulders, chest | The weapon chase stays separate from the set chase |
| Each dungeon drops 3 sets (one per role), 3 pieces each, 1/50 a piece | A full set is a goal of hours, not months |
| 3-piece set bonuses wait (`ready: false`) until summons exist | They change how a button works and need the summon tech |
| Duplicates become 3 Marks; Marks swap Epic weapon traits (5 each) | Nothing that drops is ever wasted |
| Heroes: race and class are for keeps, up to 6 alts | Alts, like WoW; the collection, kill counts and Marks are shared |
| Shared gear floor per role, capped at Rare; Epic is earned on the hero | Alts never start cold, mains still mean something |
| Gear is never put on for you: new pieces wait until you put them on in Gear | Putting it on yourself is the dopamine |
| The tank earns threat: his hits make only a third more threat, Slam taunts and drags in, Charge grabs one | Tanking has a job; mobs off the tank go for the squishies |
| Barrow Crypt hits 1.5 times as hard as its numbers, ordinary mobs have 1.3 times the health (`tune`) | So tanking and healing matter; one knob for harder tiers later |
| Only the tank is caged; inside, the boss turns on someone else | The party feels the tank's absence |
| You see only your own numbers (your hits, your heals, what hits you); mates' spell effects stay | Less noise, your numbers mean more |
| No free mount: you start on foot, Dottle's first errand (herding goats) gives the Hill Goat | A mount is earned; it makes rides quicker, nothing else |
| No trading or selling between players, ever | The collection log has to mean "I did this" |
| A DPS alone dies before the mini boss (a test checks it) | All three roles are needed |
| The Vale stays small: one place per race's hometown, about 5 minutes a trip | A cosy break, not a second game |
| Brews are one-run twists, never power a raid needs | Fun, not a tax |
| One self-contained HTML file, no frameworks, no runtime dependencies | It has to run anywhere, including inside claude.ai |
| A save never loses data: change its shape only with a version bump and a migration | People's progress is sacred |

The full systems design (abilities, talents, sets, drop tables, achievements, balance rules) is in
`docs/design.md`. Parked ideas and proposals are in `docs/ideas.md`. Nothing in ideas is decided.

## Rules of the game's systems (as built)

- **Loot** rolls when a boss dies (`resolveKill`): every line of its table rolls on its own, per player, and
  kill counts are per boss. Every clear also gives a Mark, a ladder piece (Common to Epic in about ten clears)
  and a spare piece for another role. Practice runs give nothing.
- **The walkout:** the final boss's drops decide the lantern's tell. Normal: it gutters out. Unique: it
  flares gold and the chest knocks twice. Pet: every light dies, the sound cuts, the lantern lifts and the
  pet walks out. The first second is identical for all three on purpose.
- **Heroes:** up to six; the last one can't be deleted; a hero the game named (from the move to heroes) can be
  renamed once. The active hero is the one on the hearth and the one a run plays. Each hero has its own
  ladder gear, title and clears. Shared by all heroes: the collection (a unique fits any hero of its role),
  kill counts, Marks, achievements, titles, the hearth, the Vale. A race and class combo is playable once it
  has a ready class and art in `HERO_ART`; the rest show as "Soon".
- **Gear:** nothing goes on by itself. A ladder piece (and the shared floor) waits in the hero's bag; a new
  unique waits in their `fresh` list. The Gear button counts what's waiting; you put it on in the doll.
- **Threat:** every hit adds threat (the tank's 1.3 times, Slam's double), heals add a little on everything in the fight,
  and a mob switches once someone beats its target by a tenth. Slam taunts and drags mobs in; Charge makes its
  target turn. Mobs off the tank for 3 seconds go wild. A caged tank can't be targeted and loses half his threat.
- **Difficulty:** each dungeon's `tune` in its engine file: `hit` scales everything that hurts a hero,
  `trashHp` the health of everything but the bosses. Barrow Crypt: 1.5 and 1.3.
- **Balance targets** (guarded by `tests/balance.test.ts`): a Common bot clear in about 4:00 (4:10 at the new
  difficulty) with no wipes, the Gravekeeper about two minutes, full Epic at least 15% faster, the DPS alone
  dies before Sir Rattlebones.
- **Save versions:** v2 to v3 turned one hero per role into the roster; v3 to v4 added the Vale (`p.vale`);
  v4 to v5 gave every hero an empty bag and fresh list (gear stopped going on by itself).
- **The Vale:** a place regrows 2 harvests a day and banks 6; errands come 1 a day and bank 3. A harvest is
  rolled when its close-up starts (like a kill) and Perfects add on at the end. Every cut pays Gathering XP as
  it lands and every lap of the stir pays Brewing XP. A duplicate rare becomes 2 Starlight Dew. Every errand
  gives the next page of that place's story. You start on foot; the first errand (the goats) gives a Hill Goat,
  and a mount only makes rides quicker (5 s on foot, 3 on the goat, 2 on the hare or the hound).
- **Brews:** the ingredients go in when the stir starts (leaving still bottles it). One bottle a run, drunk
  at the door; practice uses the brew but keeps the bottle. Effects live in the engine under the recipe id
  (`tonic`, `fizz`, `glow`, `elixir`).
- The game's name isn't final: it lives in one constant, `GAME_NAME` in `src/content/index.ts`.

## Map of the code

- `src/core`: math, RNG (a seeded combat stream and separate loot streams), the event bus, the save store.
- `src/content`: data only. Roles and abilities, gear and traits, `folk.ts` (the four races, the six classes,
  which race and class combos have art in `HERO_ART`, name lists), one folder per dungeon (`barrow/`: map,
  mobs, bosses, script, items, loot tables, collectibles, achievements), and `vale/` (ingredients, recipes,
  the map, ranks, one file per place). Register new content in `src/content/index.ts`; `checkContent()`
  and the tests catch broken ids.
- `src/dungeon`: the engine, plain JS with no DOM: state `S`, entities, heroes, mobs, bots, the loop,
  rendering to a canvas, and `walkout.js` (the lantern tells). It reaches the screen only through `HOOKS`
  and `emit`.
- `src/meta`: TypeScript rules for everything that lasts: the profile and its migrations (heroes live here),
  loot, gear, achievements, the hearth, and `vale.ts` (regrowth, harvests, errands, ranks, brewing).
- `src/ui`: the screens. Scenes: the hearth, the camp (your heroes), the hero maker, the Vale (`vale.ts`,
  `valeart.ts`, `toys.ts` for the close-ups), the cauldron (`brew.ts`), the run (HUD and input) and the
  reveal. Sheets over them: dungeon, the gear doll, logs, satchel, settings, spot picker, item. Toasts,
  sound. `styles.css` is inlined by the build.
- `src/sim` and `scripts/sim.mjs`: headless bot runs of the real engine (the balance numbers).
- `tools/`: the art pipeline (Python writes SVG into `art/*.json`), `art_sheet.py` (look at your art),
  `pw_check.py` (screenshot the built game).
- `tests/`: `balance.test.ts` (bot clears must stay in their bands), `dungeon.test.ts` (threat, cages,
  numbers, tuning), `meta.test.ts`, `vale.test.ts`.

## Commands

```bash
npm ci                 # once per checkout
npm run all            # type-check, tests (with the balance sims), build dist/highfell.html. Must pass.
npm run preview        # play it: http://localhost:5173, and a phone address on the same Wi-Fi
npm run sim            # the balance table (--gear 3, --solo, --seeds N)
python3 tools/pw_check.py shot.png --w 390 --h 844 --touch    # a phone screenshot of the built game
python3 tools/pw_check.py shot.png --w 1440 --h 900           # a desktop screenshot
python3 tools/art_sheet.py shots/art.png art/vale.json        # a contact sheet of the art
```

**First time on a new computer** (once):

1. Install Git, Node.js 22 or newer and Python 3 (Windows: `winget install -e --id Git.Git`, and the same for
   `OpenJS.NodeJS.LTS` and `Python.Python.3.13`), then restart the editor so it finds them. On Windows, type
   `python` where this file says `python3`.
2. `npm ci`, then `npm run all`. It must pass before you change anything.
3. Screenshots and art sheets need Playwright: `python3 -m pip install playwright`, then
   `python3 -m playwright install chromium`.
4. GitHub: the owner signs in once with the GitHub CLI (`gh auth login`; Windows: `winget install -e --id
   GitHub.cli`). Then push your branch and open the pull request with `gh pr create`.

In the page, `window.highfell` is the running app: `highfell.startRun({ start, testRar, role? })`,
`highfell.run.autoplay(seconds)`, `highfell.reveal.preview('normal' | 'unique' | 'pet')`, `highfell.showVale()`,
`highfell.showBrew()`, `highfell.showCamp()`, and `highfell.p` is the live save (change it, then
`highfell.save()`). A fresh browser opens on the hero maker: click `#cr-go` to make the rolled hero.
Settings has testing switches (walkout previews, free Vale harvests, lucky ×50).

## How we keep the code good (no vibe coding)

- **Put things where they belong.** Content is data in `src/content`. Rules are plain functions in `src/meta`
  with tests. The engine stays DOM-free. The UI draws from the save and never holds a game rule.
- **No new dependencies, frameworks or build tools** without the owner's OK. The game ships as one HTML file.
- **Saves:** change the profile's shape only with a `PROFILE_VERSION` bump, a migration step and a test.
  Never drop a field players have.
- **Tests first for rules.** New loot, gear, progression or Vale rules get a test in `tests/`. Keep
  `tests/balance.test.ts` green; if a change should move the targets, ask first.
- **Combat randomness uses the seeded `rng`** from `src/core/rng`, never `Math.random`; loot uses its own streams.
- **Strict TypeScript.** No `any` in `src/meta`, no `@ts-ignore`, no commented-out code left behind.
- **Small, focused changes.** One feature per branch. No drive-by refactors or renames. Keep files under
  about 600 lines; split by responsibility, not by size alone.
- **Read before you write.** Find the existing helper before making a new one (art helpers, `actions()`,
  `placeSprite`, `tile`, the sheet pattern, toasts, `SFX`).
- **Visible text is plain and short,** and never uses the word "stroke" (the build warns).
- **Done means:** `npm run all` passes, you looked at the change on a phone-sized screenshot (390×844) and a
  desktop one (1440×900) and fixed what looked wrong, and the docs that describe it are updated
  (`docs/design.md` for systems, this file for rules and decisions).

## How a task runs

1. Read this file, the part of `docs/design.md` you're touching, and the code you'll change.
2. Write a short plan: what changes, which files, which tests. Anything bigger than a small fix: show the
   owner the plan before building.
3. Tests first for any rule; then the change.
4. `npm run all`, then look at it: `npm run preview` or `tools/pw_check.py`. Art: `tools/art_sheet.py`.
5. Commit on a branch (`gemini/armour-sets`, `claude/vale-moonmere`, …) with a plain-English message and open
   a pull request. CI runs `npm run all` on every push. **Only the owner merges into `main`.** Never force-push,
   never push tags or stashes. The repo is public.

## Stop and ask the owner when

- A change would add a new system, currency, screen, resource or daily task.
- It touches the save's shape, balance targets, drop rates or the walkout.
- You want a new dependency or tool.
- Content would borrow a name or design from another game.
- Two designs both seem right, or the brief and the code disagree.

## Art, in one paragraph

Every picture is SVG drawn by code in `tools/*.py`, in the locked TV-cartoon style: one black line
(`#1E1A1A`), flat bright colour, chunky heroic shapes, every sprite drawn around its ground point (0, 0).
No image generators, no bitmaps, no gradients on objects (only on light). Follow `docs/art.md`, copy the
helpers in the existing tools, and look at a contact sheet of what you drew before it goes in the game.

## Where things live

| What | Where |
| --- | --- |
| The live game (published from `main` by Claude) | https://claude.ai/artifact/LYyryT29gsopt6UPoNceVd |
| The systems design | `docs/design.md` (a copy of the Dungeon Systems doc on claude.ai) |
| The art bible | `docs/art.md` |
| Parked ideas and proposals | `docs/ideas.md` |
| The code | https://github.com/ReubenTechery/highfell |
