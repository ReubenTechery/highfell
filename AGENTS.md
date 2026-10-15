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
2. **Power is short, collecting is long.** Regular gear climbs Common → Uncommon → Rare in eight clears, while
   Epic comes from the dungeon's 3-piece set (1/35 a piece) and boss weapon (1/50, ~1/10 chance per clear at an Epic
   piece and ~50 clears for a full 4/4 Epic kit). Heroes also level up from 1 to 9 (+1 Ability Point per level to
   upgrade their 4 abilities across 2 ranks each). Beyond that, progress is sideways: sets, weapon traits, talents,
   looks, pets, mounts, titles, trophies, achievements. Skill and achievements earn looks, never power. Someone with
   three hours on a Friday is never behind.
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
| Regular gear caps at Rare in 8 clears; Epic comes from sets (1/35 a piece) and boss weapons (1/50) | ~1 in 10 clears gives an Epic piece (~50 runs for the full 4/4 Epic kit) |
| 3-piece set bonuses wait (`ready: false`) until summons exist | They change how a button works and need the summon tech |
| Duplicates become 3 Marks; Marks swap weapon traits (unlocked at Rare, 5 Marks each) | Nothing that drops is ever wasted; weapon traits stay active alongside Unique weapons |
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
| Home is a tall house cut open: zoom out to see it all, tap things in the rooms to use them | A play test: side things belong in the house, not in buttons |
| The house has one big button, always: Dungeons. Ride out is the signpost in the yard | Nobody should mistake a side trip for the main thing |
| Your other heroes wait by their beds in the house; there is no camp | One place, one less screen |
| Looks for a room or the whole house: the tavern, and each dungeon's look (and its heroic, gilded one) from finishing that dungeon's collection log. Looks only | The house shows what you've done, and a look can't be faked |
| Finishing a dungeon's whole collection log (every drop, every role) gives a house look, a title and one big prize, for keeps and never power. The Barrow's big prize is the Risen, a race | The long chase that makes the log mean something |
| Races: dwarf, elf and human from the start; gnome, goblin, the Risen (undead) and orc are earned, each in its own dungeon. Classes: warrior, cleric, mage, rogue | Races are the flex you earn; four classes keep it to four buttons |
| Not every dungeon opens a race: a log's big prize can be a race, a race and class combo, or something else | There will be a lot of dungeons |
| Every dungeon gets a Heroic version, open after 10 clears of it and made for full Epic: harder, the same drops gilded at the same power, its own kill counts and log, the dungeon's own Marks | Something to do after the gear cap, never more power |
| One self-contained HTML file, no frameworks, no runtime dependencies | It has to run anywhere, including inside claude.ai |
| A save never loses data: change its shape only with a version bump and a migration | People's progress is sacred |

The full systems design (abilities, talents, sets, drop tables, achievements, balance rules) is in
`docs/design.md`. Parked ideas and proposals are in `docs/ideas.md`. Nothing in ideas is decided.

## Rules of the game's systems (as built)

- **Loot** rolls when a boss dies (`resolveKill`): every line of its table rolls on its own, per player, and
  kill counts are per boss. Every clear also gives a Mark, a ladder piece (Common to Rare in eight clears)
  and a spare piece for another role, plus Hero XP (+35 XP per mini-boss, +65 XP per clear = 100 XP / 1 Hero Level per clear up to Level 9). Practice runs give nothing.
- **The walkout:** the final boss's drops decide the lantern's tell. Normal: it gutters out. Unique: it
  flares gold and the chest knocks twice. Pet: every light dies, the sound cuts, the lantern lifts and the
  pet walks out. The first second is identical for all three on purpose.
- **Heroes:** up to six; the last one can't be deleted; a hero the game named (from the move to heroes) can be
  renamed once. The active hero is the one by the fire in the house and the one a run plays; the others wait by their beds
  in the bunk room (tap one to play them, an empty bed makes a new hero). Each hero has its own
  male or female look (`sex`), ladder gear, XP/level (`xp`), ability tree ranks (`talents`: 2 ranks per ability across `a1..a4`), title and clears. Shared by all heroes: the collection (a unique fits any hero of its role),
  kill counts, Marks, achievements, titles, the hearth, the Vale. A race and class combo is playable once it
  has a ready class and art in `HERO_ART` (`HERO_ART_SEX` for male/female variants, keeping the same body and armour silhouette) and its race is open; the rest show as "Soon". A race marked
  `earned` (gnome, goblin, the Risen, orc) opens with the achievement that gives it (`reward.race`), and
  stays locked until a dungeon does.
- **Gear:** nothing goes on by itself. Heroes start in humble Common rags and bronze/wood weapons (`_0` icon tier), climb through Uncommon (`_1`) to Rare (`_2`) in eight clears, and earn Epic (`_3`) from dungeon sets (1/35) and boss weapons (1/50). A ladder piece (and the shared floor) waits in the hero's bag; a new
  unique waits in their `fresh` list. Your hero's tag at the top of the house (and the armour stand) counts what's waiting (plus unspent ability points); you put it
  on in the doll, which shows a side-by-side Old-vs-New comparison with exact item level, damage/healing, and health gains. A drop's sheet holds it up against what its role wears (`compareOn`): better is more item level
  or a new effect with nothing lost, worse is less or an effect lost for nothing, both at once is a trade. A
  bonus that isn't ready yet is listed but doesn't make a piece better.
- **The house:** its plan is data in `src/content/house.ts`: rooms, the things you tap and the display spots.
  Zoomed out, a tap goes into a room; zoomed in, a tap uses a thing. The hearth's first eight spot ids never
  change; a spot a save has never had takes what isn't on show when the save loads (`settleSpots`); a spot
  you emptied stays empty; something new goes to the first free spot of its kind (the hall first).
- **Looks:** every room inside the house has a look (`p.hearth.looks`, room id to look id; a room not in it is
  the tavern). A look opens with the achievement that gives it (`reward.look`: finishing that dungeon's
  collection log); a look you haven't earned is drawn as the tavern (the testing switch shows it). Decorate, then Looks, puts one on a room or the whole house. With
  every room in the same look, the frame (beams, outer walls, roof) follows it. What a look is lives in
  `src/content/house.ts` (`LOOKS`); how it's drawn, room by room, in `src/ui/houseart.ts`.
- **Collection log rewards** (`src/meta/logs.ts`): filling a dungeon's whole log (`logDone`) earns its log
  achievement (tier `log`, checked whenever something new arrives). Its reward gives a title and can open a
  house look (`reward.look`), a race (`reward.race`) or a collectible (Gilded Bones). Earned stays earned,
  even if a slot is added to the log later. The Barrow's: Barrow Hall, the Gravewarden, the Risen. Heroic
  Barrow's: Gilded Barrow Hall, the Undying, Gilded Bones (the Risen drawn in gold).
- **Heroic:** a dungeon's heroic version is its own `DungeonInfo` (`heroicOf` the normal one): the same
  bosses, the same tables with gilded ids at the same rates (gilded pieces wear exactly like the plain ones),
  its own kill counts, clears and log. It pays the normal dungeon's Marks and counts for its achievements. It
  opens after `HEROIC_AFTER` (10) clears of the normal one; the testing switch opens it.
- **Groups:** a run has three seats, one per role (`src/meta/party.ts`). You take your hero's seat; bots (Brannoc,
  Maren, Ivy) take the others at your gear level. In the Dungeons sheet a seat can be played by any of your heroes
  of that role, or a new one made for it. Friends take seats once there is online play.
- **Threat:** every hit adds threat (the tank's 1.3 times, Slam's double), heals add a little on everything in the fight,
  and a mob switches once someone beats its target by a tenth. Slam taunts and drags mobs in; Charge makes its
  target turn. Mobs off the tank for 3 seconds go wild. A caged tank can't be targeted and loses half his threat.
- **Difficulty:** each dungeon's `tune` in its engine file: `hit` scales everything that hurts a hero,
  `trashHp` the health of everything but the bosses, `bossHp` the bosses'. Barrow Crypt: 1.5 and 1.3. Its
  `heroic` tune: 3, 1.6 and bosses 1.4.
- **Balance targets** (guarded by `tests/balance.test.ts`): a Common bot clear in about 4:00 (4:10 at the new
  difficulty) with no wipes, the Gravekeeper about two minutes, full Epic at least 15% faster, the DPS alone
  dies before Sir Rattlebones. Heroic: full Epic clears in about four minutes with no wipes, Common gets buried.
- **Save versions:** v2 to v3 turned one hero per role into the roster; v3 to v4 added the Vale (`p.vale`);
  v4 to v5 gave every hero an empty bag and fresh list (gear stopped going on by itself); v5 to v6 added house
  looks (`p.hearth.looks`, every room the tavern); v6 to v7 gave every hero a male or female look (`sex`).
- **The Vale:** a place regrows 2 harvests a day and banks 6; errands come 1 a day and bank 3. A harvest is
  rolled when its close-up starts (like a kill) and Perfects add on at the end. Every cut pays Gathering XP as
  it lands and every lap of the stir pays Brewing XP. A duplicate rare becomes 2 Starlight Dew. Every errand
  gives the next page of that place's story. You start on foot; the first errand (the goats) gives a Hill Goat,
  and a mount only makes rides quicker (5 s on foot, 3 on the goat, 2 on the hare or the hound).
- **Brews:** the ingredients go in when the stir starts (leaving still bottles it). One bottle a run, drunk
  at the door; practice uses the brew but keeps the bottle. Effects live in the engine under the recipe id
  (`tonic`, `fizz`, `glow`, `elixir`).
- **Onboarding:** a fresh save with no heroes opens on a 60-second prologue run (`start: 'intro'`) as Brannoc in
  full Epic gear, the Barrowguard set and *The Gravedigger* alongside Maren and Ivy in the Ossuary and Sir
  Rattlebones's tomb. A Welcome card lets the player start the 1-minute tutorial or skip straight to the hero
  maker. During the run, the game pauses at five key teaching moments (`Cleave`, `Slam` to peel for a party
  mate, `Dodge` out of `Shield Charge`'s red lane, `Raise Shield` to perfect-block `Cleaving Sweep`'s gold cone,
  and `Charge` to punish the boss during his Perfect Block stagger) and spotlights the
  exact glowing button to press; heroes cannot drop below 20% health, and `Skip intro` is always available.
  Killing Sir Rattlebones plays the gold `unique` walkout tell and opens an example chest reveal
  (`reveal.showIntro`) with four cards stamped `Example` (regular ladder piece, shared warband piece, 1/50 set
  piece, 1/50 hearth trophy) alongside the player's real `0 / 16` Barrow Crypt Collection Log and its three
  completion prizes, then leads into the hero maker. Creating your first hero starts a 3-step guided camera
  tour of the Hearth (`hall` → `yard` signpost → `cellar` Barrow door). Both can be replayed from Settings.
- The game's name isn't final: it lives in one constant, `GAME_NAME` in `src/content/index.ts`.

## Map of the code

- `src/core`: math, RNG (a seeded combat stream and separate loot streams), the event bus, the save store.
- `src/content`: data only. Roles and abilities, gear and traits, `folk.ts` (the races, which are earned, the
  four classes, which race and class combos have art in `HERO_ART`, name lists), one folder per dungeon
  (`barrow/`: map, mobs, bosses, script, items, loot tables, collectibles, achievements, and `heroic.ts`, its
  heroic version and gilded drops), and `vale/` (ingredients, recipes,
  the map, ranks, one file per place). `house.ts` is the house's plan. Register new content in `src/content/index.ts`; `checkContent()`
  and the tests catch broken ids.
- `src/dungeon`: the engine, plain JS with no DOM: state `S`, entities, heroes, mobs, bots, the loop,
  rendering to a canvas, and `walkout.js` (the lantern tells). It reaches the screen only through `HOOKS`
  and `emit`.
- `src/meta`: TypeScript rules for everything that lasts: the profile and its migrations (heroes live here),
  loot (and when heroic opens), gear, achievements, what the collection log gives (`logs.ts`), the hearth,
  the party's seats (`party.ts`), and `vale.ts` (regrowth, harvests, errands, ranks, brewing).
- `src/ui`: the screens. Scenes: the hearth (the house: `hearth.ts`, its zoom `camera.ts`, its drawing
  `houseart.ts`, every room in each look), the hero maker, the Vale (`vale.ts`, `valeart.ts`, `toys.ts` for the
  close-ups), the cauldron (`brew.ts`), the run (HUD and input) and the reveal. Sheets over them: the dungeons
  (`dungeonsheet.ts`), a hero (`herosheet.ts`), an item and how it compares (`itemsheet.ts`), the house's looks
  (`lookssheet.ts`), the logs (`logsheet.ts`), settings (`settingssheet.ts`), the gear doll, satchel and spot
  picker. Toasts,
  sound. `styles.css` is inlined by the build.
- `src/sim` and `scripts/sim.mjs`: headless bot runs of the real engine (the balance numbers).
- `tools/`: the art pipeline (Python writes SVG into `art/*.json`; the heroes are in `art_heroes.py`, their
  faces in `art_heads.py`), `art_sheet.py` (look at your art), `pw_check.py` (screenshot the built game),
  `pw_perf.py` (measure the house's speed on a slowed-down phone).
- `tests/`: `balance.test.ts` (bot clears must stay in their bands), `dungeon.test.ts` (threat, cages,
  numbers, tuning, where each hero's weapon and head are), `meta.test.ts`, `vale.test.ts`.

## Commands

```bash
npm ci                 # once per checkout
npm run all            # type-check, tests (with the balance sims), build dist/highfell.html. Must pass.
npm run preview        # play it: http://localhost:5173, and a phone address on the same Wi-Fi
npm run sim            # the balance table (--gear 3, --solo, --seeds N)
python3 tools/pw_check.py shot.png --w 390 --h 844 --touch    # a phone screenshot of the built game
python3 tools/pw_check.py shot.png --w 1440 --h 900           # a desktop screenshot
python3 tools/pw_perf.py                                      # how heavy the house is on a slowed-down phone
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

In the page, `window.highfell` is the running app: `highfell.startRun({ start, testRar, role?, heroic? })`,
`highfell.run.autoplay(seconds)`, `highfell.reveal.preview('normal' | 'unique' | 'pet' | 'log')`, `highfell.showVale()`,
`highfell.showBrew()`, `highfell.showHearth('bunks')` (any room's id), and `highfell.p` is the live save (change it, then
`highfell.save()`). A fresh browser opens on the prologue run: click `#intro-skip` (then `#cr-go`) to make the rolled hero.
Settings has testing switches (walkout and log-complete previews, free Vale harvests, lucky ×50,
"Everything open": the log rewards and Heroic before they're earned, and buttons to replay the prologue and Hearth tour).

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
