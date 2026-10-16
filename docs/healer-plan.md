# Healer plan: make the healer matter

**Status: a plan, not built yet.** Worked out with the owner on 2026-10-16. Nothing here gets built until the
owner says go. Once it is built, its rules move into `docs/design.md` and `AGENTS.md`, and this page goes.

## Why

The owner's first run as the healer, in no gear: half the dungeon went by without needing to heal the tank.

The bots agree (Barrow Crypt, Common gear, 4 seeds, run with the real engine):

- With the normal bot healer, the tank never drops below about 77% on trash. Only the two bosses push the tank
  lower.
- With a healer who never heals, the tank lives through packs A, B and C (lowest 34–61%, in the Bonebrute pack)
  and dies at Sir Rattlebones, every seed. The party wipes there.

Three reasons:

1. Between packs, everyone heals 9% of max health a second for free while the healer is alive (`heroTick` in
   `src/dungeon/heroes.js`). Every pack starts full.
2. Trash hits the tank too softly. No single pack can kill the tank on its own.
3. Smite heals the most hurt ally for the damage it deals, so attacking also heals.

## Decisions from the grill

| Question | Answer |
| --- | --- |
| What does healing feel like when it's great? | Big spikes and clutch saves, not a steady drip |
| The trick only the healer has | Lift curses with a swipe, like the Gravekeeper's chains |
| If the healer stops healing, when does the party wipe? | Before Sir Rattlebones: the tank dies in pack B |
| What does a missed curse do? | Drops that mate to 10%. It never kills on its own |
| What does a clutch save give? | Just the feel: gold "SAVED!", a chime, a slow-mo blink. No boost |

## What

Trash hits harder, in spikes, so the healer heals in every pack. Only the healer can lift curses, with a swipe.
Catching someone near death feels big. The bug that stops swipes on the left of the screen gets fixed first.

## The player's moment (phone, as the healer)

1. Pack A. A Gravecaller curses a mate (say Ivy, the DPS). A purple skull appears over Ivy, with a ring counting
   down 4 seconds. Ivy's name turns purple.
2. You swipe across Ivy, from anywhere on the screen, left side too. Gold slash, "Lifted!", +5 mana.
3. If you miss it, it bursts. Ivy drops to 10%. The name throbs red and a heartbeat thumps.
4. You heal Ivy: gold "SAVED!", a chime, a tiny slow-mo blink.
5. All along, the tank's bar drops in big chunks, not a drip. Stop healing and the tank dies in pack B.

## Rules and numbers

- **Curse:** lasts 4 seconds. It can land on anyone: you, the tank, the DPS. Lift it by swiping across them, or
  cast Sunburst to lift them all (Sunburst's text already says it clears curses).
- **A missed curse** drops that mate to 10% health. It never kills on its own; under 10% it does nothing more.
- **Lifting one** gives +5 mana, like banishing a wisp.
- **Who curses:** Gravecallers. One takes a rattler's place in packs A and C (pack D already has one), and one
  rises with Sir Rattlebones' rally. The Gravekeeper keeps the chains and wisps.
- **Every pack has a healer job:** curses in A, C, D and Sir Rattlebones' second phase; the Bonebrute's big swings
  on the tank in B; the ambush hitting everyone in E (Sunburst and Prayer circle); chains and wisps at the
  Gravekeeper.
- **Harder trash:** tuned until a healer who never heals loses the tank before Sir Rattlebones (a new balance
  test). The old targets hold: bots clear Common in about 4:00 with no wipes, full BiS in under 62% of that,
  Heroic in full Epic in about 4:00 with no wipes, and a DPS alone still dies before Sir Rattlebones.
- **SAVED!:** your heal lands on a mate under 15%. It shows for your own saves only, once per mate every 6
  seconds (the save lock that's already there). Not On My Watch keeps counting saves the same way (still up 3
  seconds later).
- **Heartbeat:** when you're the healer, a mate under 15% makes their name throb red and a heartbeat play.
- **Bots:** the bot healer lifts curses in about 1 second, 95% of the time (like chains). When you play tank or
  DPS, your bot healer handles curses; your own bar just moves more.
- **First curse tip:** the first time a curse lands while you're the healer, one line: "Swipe across Ivy to lift
  the curse." Remembered in `p.counters`, like the hearth tour, so the save's shape doesn't change.
- **Stays the same:** the free top-up between packs (no waiting around), Smite's heal, the four buttons and the
  dodge. No curses in the Crypt Trial.

## Not in this version

- Raising a fallen mate mid-fight.
- Boosts for saves.
- New buttons.
- Crypt Trial changes.

## Changes to the brief

These go in their own pull request once the owner says yes:

- A new balance target in `AGENTS.md` and `tests/balance.test.ts`: a healer who never heals loses the tank before
  Sir Rattlebones.
- Curses join chains and wisps as the healer's job (`AGENTS.md`'s boss mechanics rules, and the Chains and Wisps
  line in `docs/design.md`).
- The Barrow's `tune` numbers, and packs A and C.

## Done means

- `npm run all` passes, with new tests: the curse rules in `tests/dungeon.test.ts`, the no-heal wipe in
  `tests/balance.test.ts`, and every old balance target still green.
- Phone (390×844) and desktop (1440×900) screenshots look right: the skull, the ring, the purple and red names.
- On the owner's phone, as the healer in Common gear: you heal in every pack, a curse shows up in pack A, and a
  swipe that starts on the left lifts it. Miss one, catch the mate: SAVED!.
- Playing tank or DPS with a bot healer still clears.

## Plan (build order)

1. **Fix the swipe bug, in its own commit.** A touch that starts in the bottom-left becomes the walk stick unless
   it lands right on a chain or wisp (`inStickZone` and `onMechanic` in `src/ui/input.ts`). A swipe starts beside
   the thing, so the hero walks instead and nothing is cut. Fix: that touch still walks, but if the healer's
   finger crosses a chain, a wisp or a cursed mate, it cuts it. Catch: walking your thumb over a wisp kills it.
   That's fine.
2. **A sim switch for a healer who never heals** (`src/sim/run.ts`, `src/dungeon/bots.js`) and the new balance
   test, written first so it fails today.
3. **Curse rules, tests first:** `src/dungeon/mobs.js` (Gravecallers cast it), `src/content/barrow/bosses.js` (the
   rally), `src/dungeon/heroes.js` and `src/dungeon/entities.js` (the timer, the burst, lifting, Sunburst),
   `src/dungeon/bots.js` (the bot healer lifts), `src/ui/input.ts` (the swipe lifts).
4. **Packs and tuning:** `src/content/barrow/mobs.js` (packs A and C) and `src/content/barrow/engine.ts` (`tune`),
   until the new test passes and the old targets hold (`npm run sim`, with `--gear 3`, `--heroic --gear 3` and
   `--solo`).
5. **The feel:** `src/dungeon/render.js` (the skull and ring), `src/ui/run.ts` (purple and red names, the
   heartbeat, SAVED!, the first tip) and the sounds.
6. **Art:** one curse skull, drawn in the art pipeline (`tools/`, following `docs/art.md`) and checked on a
   contact sheet.
7. **Docs:** `AGENTS.md`, `docs/design.md` and the Dungeon Systems doc on claude.ai.
