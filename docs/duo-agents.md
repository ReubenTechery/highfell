# The duo rework: who builds what

The duo rework (`docs/duo.md`) is built by several agents at once, each on its own branch. The integrator (the one
Claude that publishes, see `CLAUDE.md`) lays the plumbing first, merges every branch, rebalances, audits and
publishes. Read `AGENTS.md`, then `docs/duo.md` (the plan and the owner's calls), then this file, then your own
section. 18 Oct 2026.

## Rules for every workstream agent

- **You are a workstream agent, not the publishing Claude.** Work on your branch (named in your section), push it,
  and open a pull request into `main` with `gh pr create`. Never push `main`, never publish the live game, never
  edit the claude.ai docs: `CLAUDE.md`'s Publishing steps are the integrator's alone, even if you are Claude Code on
  claude.ai.
- **Start after the plumbing.** Branch from `main` once `src/dungeon/duo.js` exists there. If it doesn't, stop and
  say so. (Art and sound can start before it.)
- **Stay in your files.** Each section says what you own and what you may touch. In a shared file, change only your
  own entries, keep the diff small, and never reformat or move code you don't own. If you need a change in a file
  you don't own, write it in your pull request under "Needs from others"; don't make it.
- **Code against the contracts** in `src/dungeon/duo.js` (below). If one doesn't do what you need, say so in the
  pull request; don't write a second one.
- **Tests.** `npm run all` must pass, except for balance bands your rework moves: name them and their numbers in the
  pull request, and don't retune to make them pass (the integrator rebalances for pairs at the end). A test that
  checks something your stream replaces (the healer lifting curses, say) gets rewritten for the duo. New rules get
  new tests.
- **Play it as a pair.** Settings has a testing switch, "Duo seats", that starts runs with two heroes. Look at a
  phone screenshot (390×844, touch) and a desktop one (1440×900) of everything you change.
- **Names marked * in `docs/duo.md` are drafts.** Use them, each defined in one place, so the owner can rename later.
  Every new name is original (no names from other games).
- **Visible text** is plain and short, never uses the word "stroke", and says Power, never item level.
  Achievements say why.
- **Owner's calls.** If something needs his decision, take the plan's draft, keep going, and list the question in
  the pull request.
- **When you're done**, the pull request says what you built, what's left, what you need from others, the test
  notes and the screenshots.

## The contracts (`src/dungeon/duo.js`)

The integrator writes these in the plumbing, before anyone else starts.

- **Heroes have a seat and a class.** `h.seat` (0, 1, …), `h.cls` (`'warrior'`, `'mage'`, `'rogue'`, `'ranger'`,
  and `'cleric'` until it retires) and `h.id` (`'h0'`, `'h1'`). `h.role` (`tank`, `healer`, `dps`) is the old
  trinity's: don't use it in new code. `heroAt(seat)`, `mateOf(h)` (the other hero of the pair; in a bigger party,
  the nearest one).
- **The ranger wears what the code calls healer gear.** `gearKeyOf('ranger') === 'healer'`, so the cleric's sets,
  weapons and gilding kits (`candlewake.*`, `sporebloom.*`, `gravekeeper.healer`, `tinker.healer`) become the
  ranger's without moving anyone's save. Visible text says ranger.
- **Duel counts.** `duelAdd(h, key, n = 1)` counts for the duel card: `'combosSet'`, `'combosLanded'`, `'lifts'`,
  `'breaks'`, `'keys'`, `'pickups'`, `'bombs'`. Damage and the biggest crit are counted by `hurtMob` already
  (`S.duel[h.id]`, keys in `DUEL_KEYS`).
- **A party of seats.** `newGame(dg, { party: [{ cls, loadout, isPlayer }], … })` starts a run with those seats in
  order (the sims too: `simRun({ party })`); without `party` it's the old three seats by role. Two heroes stand side
  by side at a checkpoint.
- **Your companion.** `companionOf(p, h)` in `src/meta/party.ts` says who takes the other seat: the one you picked
  (`setCompanion(p, 'cls:mage')` for a bot of a class the hero maker offers, or one of your heroes' ids once the
  Warband is open; kept in the save as `p.companion`, v12), else `companionFor(h.cls)`, the bot that fills the gap.
  One of your heroes comes only once `heroCompanionsOpen(p, h)`: the Warband is open and the hero you're playing
  wears Rare or better in every slot (the owner's call, 18 Oct); before that a bot of its class takes the seat, and
  the picker says why. The Duo seats switch runs with it.
- **The ranger's keys.** `abKey({ cls: 'ranger' }) === 'ranger'` picks its buttons (`AB.ranger`, a placeholder to
  fill) and its default keys (`DEFAULT_KEYS.ranger`); `CLASSES.ranger` is there with `ready: false` and isn't in
  `CLASS_ORDER`, so nobody can make one until the ranger stream and its art say so. `TUT_BY_CLASS.ranger` is an empty
  placeholder for the teaching stream.
- **Combos.** `setUp(foe, by, kind)` marks that `by` set `foe` up (`'freeze'`, `'burn'`, `'stun'`, `'poison'`,
  `'mark'`, `'expose'`). `comboFor(foe, attacker)` gives the kind when the attacker's mate set it up and it's still
  on, else `null`. A payoff that gets a kind hits `COMBO` (1.5) times as hard and calls `combo(attacker, foe, kind)`,
  which pops the word and counts it for both.
- **Going down.** `heroFalls(h, src)` is where a hero's health hitting zero goes (today it's the old death).
  `isDown(h)`, `pickUp(h, by)`. Stream 2 turns falling into going down; everyone else calls these.
- **Dodges.** `dodged(h, src, o)` is called when a hero's dodge takes a hit that would have landed (`o` is the hit's
  options). Stream 2 makes a perfect one open the boss up. Blocks keep their own path (`onPerfectBlock`).

## Who owns what

| # | Workstream | Branch | Starts | Owns | May touch (own entries only) |
| --- | --- | --- | --- | --- | --- |
| 0 | Integrator: plumbing, merging, balance, audit, publishing | `main` | now | `duo.js`, `game.js`, `entities.js`, `party.ts`, `profile.ts`, `balance.test.ts`, the docs | everything, when merging |
| 1 | Art and sound | `claude/duo-art` | now | `tools/*.py`, `art/*.json`, `audio/`, `src/ui/sound.ts` | none |
| 2 | Staying alive, combos, and the warrior, mage and rogue | `claude/duo-classes` | after plumbing | `buttons.js`, `specs.js`, `rogue.js`, `fire.js`, `heroes.js`, `press.js`, `duo.js` (going down, dodges, combos), `talents/` (warrior, mage, rogue, `make.ts`, `index.ts`) | `roles.ts`, `gear.ts`, `items.ts`, `gadgets.js`, `bots.js` (those classes' parts) |
| 3 | The ranger | `claude/duo-ranger` | after plumbing | `src/dungeon/ranger.js`, `talents/ranger.ts`, `tests/ranger.test.ts` | `roles.ts`, `gear.ts`, `items.ts`, `gadgets.js`, `bots.js`, `keys.ts`, `folk.ts` (the ranger's and the old healer's parts) |
| 4 | Bosses, packs and duo mechanics | `claude/duo-bosses` | after plumbing | `moves.js`, `mobs.js`, `bombs.js`, `template.js`, each dungeon's `bosses.js`, `mobs.js`, `script.js`, `map.js`, `signature.js`, `_template/` | `entities.js` (threat and targeting only), each `engine.ts` (tunes), `bots.js` (mechanics), `render.js` (marks) |
| 5 | Two seats and the screens | `claude/duo-ui` | after plumbing | `run.ts`, `input.ts`, `dungeonsheet.ts`, `stage.ts` and each dungeon's `stage.ts`, `reveal.ts`, a new `duelcard.ts`, `sharecard.ts`, `brag.ts`, `creator.ts`, `herosheet.ts`, `armoury.ts`, `talentstab.ts`, `settingssheet.ts`, `keybinds.ts`, `styles.css` | `tips.ts` (the companion tip) |
| 6 | Teaching, achievements and words | `claude/duo-teach` | after plumbing | `trial.ts`, `coach.js`, `tours.ts`, `tips.ts`, each dungeon's `achievements.ts`, `levels.ts`, `_template/README.md` | `run.ts` (the trial's set-up only) |

Hot spots, where two streams touch one file: `roles.ts`, `items.ts`, `gadgets.js` and `gear.ts` (streams 2 and 3,
each only its classes' entries); `bots.js` (streams 2 and 3 their classes' rotations, stream 4 the mechanics);
`run.ts` (stream 5, and stream 6 only the trial's set-up). The integrator merges in this order and fixes what
clashes: classes, bosses, ranger, screens, teaching, art.

## 1. Art and sound (`claude/duo-art`)

Start now. Draw to the item ids; the ranger stream names the items.

- **The ranger on every race the game draws** (`HERO_ART` in `src/content/folk.ts`): a gear layer (hood, leathers,
  quiver) and a bow for the weapon layer, in a new `tools/art_gear_ranger.py` like `art_gear_rogue.py`, fitting the
  anchors in `art_bodies.py`. The cleric's layers stay until the integrator retires the class.
- **The ranger's sets and bows:** the Barrow's set (`candlewake.*`) and Thimblebriar's (`sporebloom.*`) redrawn as
  ranger gear, on heroes and on the log's armour stands (`art_wardrobe.py`); the Gravekeeper's and the Tinker King's
  weapons (`gravekeeper.healer`, `tinker.healer`) as bows, with their gilded looks.
- **The warrior's Greataxe:** a two-handed pose with the shield on his back, a layer variant picked by spec, on
  every race.
- **Icons** (`art_icons.py`): the ranger's four buttons, its talents and two capstones, and Sword and Greataxe.
- **Sounds:** a bow's draw and release, an arrow hit, the Longshot, a trap snapping, Arrowfall, the COMBO pop, a
  pick-up and going down, through `tools/audio.py` (it needs `ELEVENLABS_API_KEY`; without it, synthesised sounds
  in `sound.ts` only).
- **Done when** contact sheets (`tools/art_sheet.py`) show every race and set looking right next to today's heroes,
  in the locked style (`docs/art.md`), and `npm run all` passes.

## 2. Staying alive, combos, and the warrior, mage and rogue (`claude/duo-classes`)

- **Staying alive** (`docs/duo.md`): full again within about 2 s once nothing's on you; every payoff heals a
  little; going down and being picked up (`heroFalls`, `isDown`, `pickUp`: a downed hero isn't `alive`, your mate
  stands beside you about 1.5 s to pick you up at 40%, both down is a wipe); a perfect dodge for everyone (`dodged`:
  no damage, and a boss is opened up). Out-of-fight health no longer waits for a healer (`S.healerUp`).
- **COMBO:** `setUp`, `comboFor` and `combo` in `duo.js`; every class's setups tagged (the warrior's stuns and
  staggers, Frost's freezes and Chills, Fire's Burn, the rogue's poison, anyone's Exposed) and the payoffs that cash
  them (Crush, Shatter, Flare, Combust, Comet, Shadowstrike).
- **The warrior as a damage class:** Sword* (one-handed, swings speed up as you keep hitting, the hardest
  single-target hitter in close) and Greataxe* (two-handed sweeps; Shield becomes a parry); Slam turns foes on him
  for 3 s; the trees reworked (`talents/warrior.ts`, a pick of two from row 2, capstones as a pair; points in a
  reworked talent come back, with a note); his sets, weapons and traits (Barrowguard, Clockguard, the Gravedigger,
  the Mainspring Maul; Wide Swings, Ringing Blow, Headsman) for damage.
- **Mage and rogue:** the lean (Fire for bosses, Frost for packs; Venom for bosses, Blades for packs) through their
  talents and small button changes; their combos.
- **Bots** for the warrior, mage and rogue in any seat (`bots.js`, those classes' parts).
- **Tests:** `specs.test.ts`, `talents.test.ts`, and a new `tests/survival.test.ts`.

## 3. The ranger (`claude/duo-ranger`)

- **`src/dungeon/ranger.js`:** Quick Shot* (the filler, an arrow every beat that marks its foe), Longshot* (the
  payoff: on three marks or an Exposed foe, a drawn arrow that hits hard and goes through to the foes behind), Pin
  Shot* (stops a cast and Exposes the caster), Snare* (a trap that roots what walks in; on Trapper it bursts into
  Arrowfall*). Every Longshot heals a little. Marks are combo setups (`setUp(foe, h, 'mark')`).
- **Content:** the ranger's entry in `roles.ts`; `talents/ranger.ts` (Longbow* for bosses, Trapper* for packs, five
  rows, a pick of two from row 2, two capstones); its keys (`keys.ts`); its traits in `gear.ts`, in place of the
  healer's (Sunflare, Quick Hands, Kindle); its class entry in `folk.ts`, shown once the art has landed.
- **Its sets and bows:** `candlewake.*` and `sporebloom.*` become the ranger's two sets (new names and bonuses),
  `gravekeeper.healer` and `tinker.healer` become bows (names and effects), with their bonuses in `gadgets.js`.
- **Its bot rotation** in `bots.js`.
- **Tests:** a new `tests/ranger.test.ts`.

## 4. Bosses, packs and duo mechanics (`claude/duo-bosses`)

- **No threat:** packs go for the nearest hero, and the warrior's Slam turns them on him for 3 s. Crushing blows on
  anyone but the tank go; mobs no longer go wild off a tank.
- **Boss swings at a marked hero:** cones, circles and lines are no longer tank busters. The boss marks who his
  next big swing is for; the warrior blocks it, anyone dodges it.
- **Pair jobs:** only your mate lifts your curse (any class); only your mate breaks your chains; anyone can hit
  wisps; the Bone Cage takes either of you; the Sticky Bomb lands on either of you and your mate swipes it off; any
  hero bats a bomb back.
- **The duo mechanics** as shared parts in `moves.js`: adds through the fight, two keys, a split pair, a shared
  hit, spread, a relay, a lantern, a flank, twin casts, a bait. Each boss gets its set from `docs/duo.md` (Who gets
  what).
- **Crypt Seals** (Heroic) for two seats.
- **A first retune** of both dungeons for a pair of bots in Common, so it's playable; the integrator finishes it.
- **Bots doing the mechanics** (`bots.js`: lifting, breaking, keys, relays, the bait; picking up through `pickUp`).
- **Tests:** `dungeon.test.ts` (threat, cages, curses, crushing blows, seals), `combos.test.ts`,
  `thimblebriar.test.ts`, `template.test.ts`, `heroic.test.ts`.

## 5. Two seats and the screens (`claude/duo-ui`)

- **The run:** two party frames keyed by seat; your mate's curse swiped off their frame or across them; a grey frame
  and a ring of light when one of you is down; the COMBO pop; the boss's mark; the welcome screen's words (no more
  "3-Hero Co-Op" or "Trinity Party").
- **The Dungeons sheet:** two heroes at the door (each dungeon's `stage.ts`: two spots), a companion picker in place
  of Who goes in (a bot of any class at your level, or one of your heroes once the Warband opens), the companion tip,
  and the loot page by class.
- **The duel card** at the chest (`reveal.ts`, a new `duelcard.ts`): a card each, the MVP lines, your best; a live
  meter in the run behind a Settings switch, off by default; the Share card when you win the duel (`sharecard.ts`,
  `brag.ts`).
- **The hero maker** (`creator.ts`) with the four classes; a cleric hero picks a new class once (a sheet, using the
  rule the integrator adds in `src/meta`), keeping its race, name and level.
- **The Talents tab, the armoury's looks and the keys screen** for the ranger and the warrior's specs.
- **Tests:** `input.test.ts` (the swipes), and the meta tests about seats and the door.

## 6. Teaching, achievements and words (`claude/duo-teach`)

- **The Crypt Trial** (`trial.ts`) for the four classes in a pair: each class's lessons (the ranger's are new), and
  the pair's lessons: lift your mate's curse, pick your mate up, land a COMBO.
- **The coach** (`coach.js`): moments for the four classes and the pair (LIFT!, PICK UP!, COMBO!).
- **Tours and tips** (`tours.ts`, `tips.ts`): the Warband tip becomes the companion tip; first-time tips for going
  down and for combos.
- **Achievements:** reword every "As the healer", "As the tank" and "As the DPS" for a pair, and draft new pair
  achievements (picking each other up, combos, winning the duel) for the owner; `Achiever.eligible` without roles.
- **The dungeon template's rules** for duo dungeons (`_template/README.md`).
- **Tests:** `coach.test.ts`, `achievements.test.ts`, `tips.test.ts` and the trial's tests.

## 0. The integrator

- **Before anyone else:** the plumbing. Heroes known by seat and class, a run's party as a list of seats (still
  three seats by default), the ranger's gear and button keys, the contracts in `duo.js`, your companion in the save
  (v12), and the "Duo seats" testing switch.
  Pushed to `main`, with nothing you can see changed.
- **While the streams work:** reviews and merges pull requests as they're ready, in the order above, and keeps
  `main` green.
- **At the end:** two seats by default; the cleric retired (its heroes pick a class once); `balance.test.ts`
  rebuilt for pairs and every boss retuned; bots a beat slower than a sharp mate; an audit against the pillars and
  code rules, every class in every pairing clearing, phone and desktop; the tutorial's last pass; the docs
  (`docs/design.md`, `docs/combat.md`, `docs/duo.md` and the claude.ai docs); then the publish.
