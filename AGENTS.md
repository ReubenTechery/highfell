# Highfell: the brief for any agent

Read this whole file before you change anything. It is the same brief for Claude, Gemini or anyone else;
`CLAUDE.md` and `GEMINI.md` only add notes for their own tools. The owner decides; you build what was
asked, well, and say so when you think something is a mistake.

## What we are making, and why

A three-seat co-op dungeon game (tank, healer, DPS) for phone and desktop, played in one web page.
Portrait first, 2D, touch first (keys on desktop too).

**Who it's for:** people who loved MMO dungeons and OSRS endgame PvE grinds but can't give a game months any more. A parent
with a free evening or three hours on a Friday night. The owner is the target player. When they can play,
it has to be worth it: big moments, real loot, dramatic power creep that melts dungeons you used to struggle in, a reason to come back, and never a chore.

**The best of two games, nothing else:**
- From **WoW**: the trinity (tank, healer, DPS) and teamwork between them, smashing abilities and seeing
  big crits (especially after a new weapon), the gear treadmill, talent trees with two specs a class, dungeons
  with friends, a cosy tavern home, lore.
- From **OSRS**: loot with a fixed drop rate per item, every item rolled on its own, kill counts, XP for every
  kill and the long climb to 99, the collection log, rare pets as the flex, dry streaks that become stories, content you can grind 100+ times, and later dungeons dropping upgrade attachments that awaken older dungeon gear.

**Dungeons are the main game. The shape is fixed: hearth → dungeon + collection log → heroic → next dungeon.**
The hearth is home, where you show off what you found and gear up your Warband. Dungeons and their collection
logs are the core loop: four-minute runs you grind 100+ times to complete logs, feel steep power creep as your
Warband gears up and melts packs, unlock Heroics, and move to the next dungeon. Raids are a later bonus activity,
not the core loop. Nothing else gets added to that shape without the owner saying so.

**Normal is solo, Heroic is the group flex.** Normal is fully playable on your own: your own Warband heroes from
your bunk room fill the other two seats in their real gear (bots stand in for roles you have no hero for), and a
Normal collection log can always be finished solo. Your Warband opens once you've cleared every dungeon once: until
then bots, in gear at your hero's level, fill the other seats, so your first hero is the star. You can group up on Normal if you want. Heroic is the optional
group flex: at least two real players, plus a bot if there are only two, never your Warband. It drops the Normal
loot (for the Normal log, so grouping up is never a worse evening than playing solo) plus gilding kits: gilded
looks at the same power, in a log of their own. Teamwork between roles is the heart of the combat.

## Pillars: if a change fights one of these, the change is wrong

1. **Dungeons are the core loop.** About 3 to 4 minutes a run in beginner gear (about 2 when melted in full BiS),
   all three roles needed, loot every time. Four buttons and a dodge, never more: sets, boss weapons and talents
   change what buttons do, they never add one. Mistakes in beginner gear are genuinely dangerous, and skilled play opens
   windows to hit back harder.
2. **Power creep you can feel, collecting that lasts.** Regular gear climbs Common → Rare in eight clears; Epic
   comes from each dungeon's 3-piece sets and boss weapons, and power climbs steeply enough that a geared party
   melts the dungeon in roughly half the time. Gear, sets, weapon traits and boss weapons are most of the power.
   Under them, XP and talents are the steady climb (the owner's call, 17 Oct): every kill pays XP, one level for
   all your heroes, and each level a talent point in one of the class's two spec trees, whose stat talents stay
   small and whose other talents change how a button works. Beyond that, progress is sideways: collection logs,
   Heroic gilded logs, looks, pets, mounts, titles, trophies, achievements.
3. **Honest OSRS loot.** Every line of a table rolls on its own at a fixed rate. No pity. Kill counts
   everywhere. The walkout tells you what's in the chest before it opens, and it never lies.
4. **Respect the player's time.** No streaks, no daily chores, nothing lost for missing a day (things bank up),
   no inventory to manage, no drinking for mana, no waiting around.
5. **Anti-bloat.** Every system is a cost forever. A feature earns its place by making the core loop better
   (hearth → dungeon → loot → hearth). Deepen what exists before adding something new. No currency: every
   reward is a drop, a log or an achievement. One potion system (brews). When in doubt, leave it out and
   write it in `docs/ideas.md`.
6. **Original and hand-made.** No names, characters, ability names or designs lifted from other games. The art
   is drawn as code in one locked style (`docs/art.md`). It must never look AI-generated.

## Decisions already made (don't reopen them; tell the owner if you think one is wrong)

| Decision | Why |
| --- | --- |
| 4 gear slots: weapon, helm, shoulders, chest | The weapon chase stays separate from the set chase |
| Regular gear caps at Rare; Epic comes only from dungeon sets and boss weapons | A quick ladder, then a long chase |
| The ladder is short (Common 10, Uncommon 12, Rare 14); a set piece is 12 above Rare and a boss weapon 16 (Power 26 and 30 in the Barrow, 8 more a dungeon tier) | Forty-odd runs for a set has to feel like it (17 Oct) |
| XP is yours, not a hero's: every kill pays it, kept even if the run wipes or you leave; every chest pays the clear, Lore Pages and rare tomes; levels go to 99 | A run always gives something you can see, and alts share the climb |
| A talent point a level from level 2 to 30 (29 points, a full tree); two specs a class, free to switch, each keeping its points; taking points back is free | A choice of how you play, never a chore or a wrong pick |
| Talents never add a button; a full damage tree clears about a fifth faster, well under what Epic gear does (a test checks it) | Four buttons and a dodge stay; gear stays the big jump |
| A rogue's crits are 2.5×, everyone else's 2× | The rogue's big hits keep up with the mage's (17 Oct) |
| A steep power curve: full BiS melts a dungeon in about half the time | Grinding 100+ runs has to feel it |
| No currency: duplicates count in the collection log, and weapon traits swap free at Rare | Nothing to grind or spend |
| Race and class are for keeps; up to 6 heroes | Alts, like WoW, sharing the collection and kill counts |
| Normal is fully solo with your Warband, and its collection log can always be finished solo | Nobody needs a group to finish a dungeon |
| The Warband opens once every dungeon has been cleared once (and stays open); until then you have one hero and bots at its gear level fill the seats | You fall for one main first; alts come because you want more, not as homework |
| Heroic is the optional group flex: at least two real players plus a bot, never your Warband | Playing together is the flex, never a wall |
| Shared gear floor per role, capped at Rare, raised by your ladder in the role you play; Epic is earned on the hero | A new hero of a role you play never starts cold, mains still mean something |
| Your Warband heroes come to help and never get loot; one sits in only when its gear is at least as good as the bot's, best-geared first | Your hero is the main character; the loot is all yours (17 Oct) |
| Gear is never put on for you | Putting it on yourself is the dopamine |
| The tank earns threat, and bosses crush anyone else they hit | Tanking has a real job; nobody else can facetank |
| Beginner gear is meant to struggle: dungeons hit hard, telegraphs pierce shields | Tanking, healing, dodging and blocking matter |
| Only the tank is caged; inside, the boss turns on someone else | The party feels the tank's absence |
| You see only your own numbers; mates' spell effects stay | Less noise, your numbers mean more |
| The four buttons and Mend share a one-second beat; a press made up to 0.4 s early waits and fires on time, and nothing buzzes for being early | Mashing is never wrong, as in WoW (the combat plan, `docs/combat.md`) |
| Every class has a filler with no cooldown to press every beat (Cleave, Smite, Icicle or Fire's Firebolt, Viper Blades), a payoff it sets up and two cooldowns; casters have no automatic attacks, melee keep small ones | Your presses do the damage, and every beat has something worth pressing |
| Casts stop only to interrupts (Charge, Rime burst or Fire's Ember burst, Fan of Blades, Shadowstep), never to damage, and an interrupt Exposes the caster; Exposed is every class's payoff setup | A job for the tank and the DPS, and burn windows the party hits together |
| The gold glow is for payoffs only; warnings keep their words without it | One glow you can't miss beats five you learn to ignore |
| On the phone a held button repeats and the filler is the big button under the thumb; on a computer each class's buttons sit on E, Q, F and R beside WASD, a held key fires once, and Settings rebinds them, kept in the browser, never the save | The thumb can rest, your fingers never leave WASD, and bindings belong to a keyboard |
| The first garden harvest gives the Hill Goat | Earned, and it stands in the paddock |
| Every mount in the game has a place in the paddock beside the house; one you lack is a shadow with a "?" | Like the collection log, you see what's left to chase |
| No trading or selling between players, ever | The collection log has to mean "I did this" |
| A DPS alone dies before the mini boss (a test checks it) | All three roles are needed |
| Only the healer lifts curses (a swipe or Sunburst); a missed curse drops its hero to a tenth and never kills | Something only the healer can do, in the packs as well as the bosses |
| An idle healer wipes the party by Sir Rattlebones; you as tank in Common gear with a bot healer still clear (tests check both) | The healer matters, and the other seats are never punished for it |
| Crypt Seals are Heroic only | Normal got curses instead, so it doesn't get busier |
| A class's first five runs glow the one button whose moment has come, fading out; a new class's first run offers its Crypt Trial | Teach in the moment, on the phone, with no new buttons and no walls of text |
| Garden seeds drop from dungeon bosses and grow in clears, never on a clock | It feeds the dungeon loop with no timers or chores |
| Brews are party-wide buffs that speed a run up, never needed to clear | Brewing pays off without being a chore |
| Home is a tall house cut open that opens zoomed out on all of it: tap a room to go in (a room with one clear job opens it as you land), tap things to use them | Side things belong in the house, not in buttons, and the whole house is home |
| The house has one big button, always: Dungeons | Nobody should mistake a side trip for the main thing |
| Your other heroes wait by their beds in the house; there is no camp | One place, one less screen |
| House looks come only from finishing a dungeon's log (a gilded one from its Heroic log) | The house shows what you've done; a look can't be faked |
| A finished collection log gives a house look, a title and one big prize, never power | The long chase that makes the log mean something |
| A log's pet, mount and dye (on Heroic: the gilded pet, mount and plume) are bonus slots, never needed to finish it | The rarest drops stay a flex, and finishing never waits on them |
| Dwarf, elf and human from the start; the other races are earned in dungeons; four classes | Races are the flex you earn; four classes keep it to four buttons |
| A log's big prize can be a race, a race and class combo, or something else | There will be a lot of dungeons |
| Heroic opens once you've found 3 pieces of that dungeon's Normal log, never by clears | A drop gate keeps the "so close, one more run" pull going |
| Every dungeon gets a Heroic: harder; it drops the Normal loot plus a gilding kit per unique (its gilded look for good, any seat, same power); its log is the kits | Grouping up is never a worse evening than solo; something to chase after the gear cap, never more power |
| One self-contained HTML file, no frameworks, no runtime dependencies; only the music streams, from the live page's own files, and the game is whole without it | It has to run anywhere, including inside claude.ai |
| A save never loses data: change its shape only with a version bump and a migration | People's progress is sacred |

How every system works as built, with its numbers and the code that runs it (loot, gear and sets, threat and
boss mechanics, the house and its looks, the garden and brews, onboarding, saves, balance), is in
`docs/design.md`: read the part you're touching before you change it. Parked ideas and proposals are in
`docs/ideas.md`. Nothing in ideas is decided.

## Map of the code

- `src/core`: math, RNG (a seeded combat stream and separate loot streams), the event bus, the save store.
- `src/content`: data only. Roles and abilities, gear and traits, `folk.ts` (the races, which are earned, the
  four classes, which race and class combos have art in `HERO_ART`, name lists), one folder per dungeon
  (`barrow/`: map, mobs, bosses, script, items, loot tables, collectibles, achievements, `stage.ts`, its door
  for the Dungeons sheet, and `heroic.ts`, its heroic version: its gilding kits and gilded twins;
  `thimblebriar/`, dungeon 2, the same shape plus `signature.js`, its bombs), `_template/`
  (a small working dungeon to copy for a new one; its `README.md` has the rules for every new dungeon),
  `kits.ts` (gilding kits, Heroic's own drops, built from any dungeon's tables), `act1.ts` (the dungeons in the order
  you meet them, built or still to come), `keys.ts` (each class's keys on a computer), `xp.ts` (what kills, clears
  and the chest's pages and tomes pay, and the level curve), `levels.ts` (your level's achievements), `talents/`
  (each class's two specs in a file, `make.ts` for stat talents, and its index: the rows and `buttonFor`, Fire's
  buttons) and `vale/` (ingredients, recipes, ranks, and `garden.ts`).
  `house.ts` is the house's plan (each room's `main`, what a tap from far away opens, the paddock's places and the
  cellar's Hall of Doors). Register new content in `src/content/index.ts`; `checkContent()`
  and the tests catch broken ids.
- `src/dungeon`: the engine, plain JS with no DOM: state `S`, entities, heroes, mobs, bots, the loop,
  rendering to a canvas, `walkout.js` (the lantern tells; `cuckoo.js`, Thimblebriar's clock) and `coach.js`
  (which button's moment has come, for a class's first runs). `buttons.js` is what each class's four buttons and Mend
  do (the fillers and their payoffs; the rogue's are in `rogue.js`), and `heroes.js` fires them. `specs.js` is what
  every talent does in a fight, by its id, and `fire.js` the Fire mage's four buttons and Burn. `press.js` is the beat and the press queue: every
  press of yours goes through it, and bots ask its `ready()` before they press. `bombs.js` is Thimblebriar's bombs as a shared
  part (any hit knocks one back, a perfect block bats one back, the Sticky Bomb) and `gadgets.js` its sets'
  bonuses and boss weapons. A dungeon's layout is data built by `layout.js` (rooms and the doors between them,
  any shape) and drawn by `mapdraw.js`; its bosses are built from the shared moves in `moves.js`; its run
  script and themes come from `template.js`. `render.js` draws the dungeon and everyone in it, and `drawfx.js` what
  flies over them (shots, effects, the numbers). It reaches the screen only through `HOOKS` and `emit`.
- `src/meta`: TypeScript rules for everything that lasts: the profile and its migrations (heroes live here),
  loot (and when heroic opens), gear, achievements, what the collection log gives (`logs.ts`), the hearth,
  the party's seats and the under-powered warning (`party.ts`), when your Warband opens (`warband.ts`), `vale.ts` (seeds, planter beds, harvests,
  ranks, brewing), `tips.ts` (which first-time tip the house and the Dungeons door show), `brag.ts` (what a
  run had to show off, for the Share card), `xp.ts` (gaining XP, your level, the chest's XP) and `talents.ts`
  (talent points, specs, the tree's rules and what a run gets from them, `talentLoadout`).
- `src/ui`: the screens. Scenes: the hearth (the house: `hearth.ts`, its zoom `camera.ts`, drawn on one canvas by
  `housecanvas.ts` from pictures `housepaint.ts` makes, its bits moved by `housemotion.ts`; its drawing
  `houseart.ts`, every room in each look, the Toadstool Workshop's in `houseworkshop.ts`, the cellar's doors
  `halldoors.ts`, your hero's name tag `nametag.ts`, its tour and tips as data `tours.ts`), the hero maker, the garden (`garden.ts`, `valeart.ts`, `toys.ts` for the
  close-ups), the cauldron (`brew.ts`), the run (HUD and input; `runguard.ts` keeps a back swipe from leaving it; the Crypt Trial's lessons in `trial.ts`) and the reveal. Sheets over them: the dungeons
  (`dungeonsheet.ts`, its door's picture in `stage.ts`), a hero and your heroes (`herosheet.ts`), an item and how it compares (`itemsheet.ts`), the house's looks
  (`lookssheet.ts`), the logs and the mounts (`logsheet.ts`; the collection log as a wardrobe in `logbook.ts`, a slot's closer look in `logpeek.ts`, an achievement's row and card in `achcard.ts`), settings (`settingssheet.ts`; your keys on a computer in `keybinds.ts`), a hero's gear in the armoury
  (`armoury.ts`; the card for the piece you pick in `armourycard.ts`; its Talents tab in `talentstab.ts`), the satchel and the spot picker. A hero is a body wearing a layer per gear slot, put together from the save by `heroart.ts`. Toasts, sound (`sound.ts`: the embedded effects, each with its synthesised fallback) and music
  (`music.ts`: the streamed loops and the victory sting). The Share card (`sharecard.ts`: a moment drawn on a canvas)
  and its screen (`share.ts`: the share sheet, or the picture to save). `styles.css` is inlined by the build.
- `audio/`: the sounds, made by `tools/audio.py` from `tools/audio_list.py`: `sfx/*.mp3` and `sfx.json` (the
  build embeds it), `music/*.mp3` and `music.json` (streamed from the live page's own files, never embedded).
- `src/sim` and `scripts/sim.mjs`: headless bot runs of the real engine (the balance numbers).
- `tools/`: the art pipeline (Python writes SVG into `art/*.json`; the log's armour stands are in `art_wardrobe.py`; the heroes are drawn in layers: bodies with their anchors in `art_bodies.py`, each class's gear drawn once in `art_gear_tank.py`, `_healer`, `_mage` and `_rogue`, put together by `art_gear.py`, shared shapes in `art_heroes.py` and faces in `art_heads.py`), `art_sheet.py` (look at your art), `pw_check.py` (screenshot the built game),
  `pw_perf.py` (measure the house's speed on a slowed-down phone, or a run's with `--run`), `audio.py` (the sounds: ElevenLabs takes,
  trimmed, levelled and compressed; needs ffmpeg).
- `tests/`: `balance.test.ts` (bot clears must stay in their bands), `dungeon.test.ts` (threat, cages,
  curses, numbers, tuning, where each hero's weapon and head are), `coach.test.ts` (which button the coach
  names), `combos.test.ts` (the combos on bosses), `input.test.ts` (the touch controls, party-frame swipes, the
  keys and the press queue, driven without a browser), `meta.test.ts`, `achievements.test.ts` (each says what to do, what it gives and
  where it went; every title's source; the kill count it came at), `brag.test.ts` (what a run had to show off),
  `power.test.ts` (seasons, Power and the under-powered warning), `vale.test.ts`, `tips.test.ts` (which first-time
  tip shows when), `warband.test.ts` (when the Warband opens and who sits in), `housemotion.test.ts` (how the house's bits move),
  `xp.test.ts` (what kills and chests pay, levels, old saves' XP), `talents.test.ts` (specs, rows, pairs, points).

## Commands

```bash
npm ci                 # once per checkout
npm run all            # type-check, tests (with the balance sims), build dist/highfell.html. Must pass.
npm run preview        # play it: http://localhost:5173, and a phone address on the same Wi-Fi
npm run sim            # the balance table (--gear 3, --solo, --seeds N)
python3 tools/pw_check.py shot.png --w 390 --h 844 --touch    # a phone screenshot of the built game
python3 tools/pw_check.py shot.png --w 1440 --h 900           # a desktop screenshot
python3 tools/pw_perf.py                                      # how heavy the house is on a slowed-down phone (--run: a fight)
python3 tools/art_sheet.py shots/art.png art/vale.json        # a contact sheet of the art
python3 tools/audio.py takes crit --n 3     # new takes of a sound (needs ELEVENLABS_API_KEY), into .cache/audio
python3 tools/audio.py page shots/takes.html crit   # a page to listen to every take of it
python3 tools/audio.py make crit            # the take picked in tools/audio_list.py -> audio/sfx (and the pack)
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

In the page, `window.highfell` is the running app: `highfell.startRun({ start, testRar, role?, heroic?, dungeon? })`,
`highfell.run.autoplay(seconds)`, `highfell.reveal.preview('normal' | 'unique' | 'pet' | 'log', dungeon?)`, `highfell.garden.open(bed)`,
`highfell.showBrew()`, `highfell.showHearth('bunks')` (any room's id), `highfell.share.card(brag)` (a Share card's PNG), `highfell.music.now()` (what's playing),
`highfell.sfx.clips` (the decoded effects), and `highfell.p` is the live save (change it, then `highfell.save()`). A fresh browser opens on the hero maker: click `#cr-go` to make the rolled hero, then `#intro-skip` to skip the Crypt Trial.
Settings has testing switches (walkout and log-complete previews of the dungeon picked on the Dungeons sheet, instant garden growth, lucky ×50,
"Everything open": the log rewards and Heroic before they're earned, and buttons to replay the Crypt Trial and Hearth tour).

## How we keep the code good (no vibe coding)

- **Put things where they belong.** Content is data in `src/content`. Rules are plain functions in `src/meta`
  with tests. The engine stays DOM-free. The UI draws from the save and never holds a game rule.
- **No new dependencies, frameworks or build tools** without the owner's OK. The game ships as one HTML file.
- **Saves:** change the profile's shape only with a `PROFILE_VERSION` bump, a migration step and a test.
  Never drop a field players have.
- **Tests first for rules.** New loot, gear, progression or garden rules get a test in `tests/`. Keep
  `tests/balance.test.ts` green; if a change should move the targets, ask first.
- **Combat randomness uses the seeded `rng`** from `src/core/rng`, never `Math.random`; loot uses its own streams.
- **Strict TypeScript.** No `any` in `src/meta`, no `@ts-ignore`, no commented-out code left behind.
- **Small, focused changes.** One feature per branch. No drive-by refactors or renames. Keep files under
  about 600 lines; split by responsibility, not by size alone.
- **Read before you write.** Find the existing helper before making a new one (art helpers, `actions()`,
  `placeSprite`, `tile`, the sheet pattern, toasts, `SFX`).
- **Visible text is plain and short,** and never uses the word "stroke" (the build warns). Say "Power", never
  "item level" or "ilvl", and show it as a whole number (Power 13, never 13.2); the code and the save keep
  their own names (`score`, `ilvl`). The game's name isn't final: it lives in one constant, `GAME_NAME` in
  `src/content/index.ts`, with `PLAY_URL`, the link on Share cards.
- **Achievements and titles say why.** Every achievement's `how` is one plain, exact sentence, shown wherever
  it shows (toast, chest, page, titles list), and every title comes from exactly one achievement.
  `checkContent()` checks both.
- **Done means:** `npm run all` passes, you looked at the change on a phone-sized screenshot (390×844) and a
  desktop one (1440×900) and fixed what looked wrong, and the docs that describe it are updated
  (`docs/design.md` for how a system works, this file for decisions and rules for agents).

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
- It would change a pillar or a row of the decisions table. That happens only in its own pull request, never
  inside a feature.

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
| The combat plan (WoW-style combat in six stages, the calls the owner made, the targets) | `docs/combat.md` (a copy of the Combat Overhaul doc on claude.ai) |
| The art bible | `docs/art.md` |
| Parked ideas and proposals | `docs/ideas.md` |
| The code | https://github.com/ReubenTechery/highfell |
