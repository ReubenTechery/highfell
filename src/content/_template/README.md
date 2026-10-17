# The dungeon template

Copy this folder to start a new dungeon. It is a small, working dungeon: bots clear it in about 3:10 in Common
gear, the Warden takes about 40 seconds and the Sovereign about 80 (`tests/template.test.ts` keeps it so). It is
not in the game. Its names, numbers and art are stand-ins.

## The rules for every new dungeon

1. **One signature idea.** The one mechanic the dungeon is about. Its trash uses it and both bosses use it, so
   the packs teach it and the fights test it. It lives in `signature.js` and the engine def names it
   (`signature` in `engine.ts`). The example is beacons: they pulse the party until a DPS breaks them, and
   shield the boss who planted them.
2. **One or two new enemy types.** Everything else is the shared kinds (`melee`, `ranged`, `brute`) dressed
   as this dungeon's own. The example's new type is the Beaconkeeper, which carries the signature.
3. **Two bosses of two or three moves each.** The mini boss takes about 40 seconds. The final boss has two
   phases and takes about 80 seconds. Build every move from the shared parts in `src/dungeon/moves.js`: cone,
   line and circle telegraphs, Exposed windows, adds, a party pulse. In each fight every role gets one clear
   job (tank, healer, DPS). Write the job on the move (`job`).
4. **A different layout shape.** Not another line of rooms. Layouts are data (`map.js`, built by
   `src/dungeon/layout.js`): any number of rooms, doors on any side, branches, side rooms, round rooms.
5. **No puzzle on Normal.** The three-seat seal is a Heroic-only hook (`seal` in `script.js`). Normal never
   gets one.
6. **A run is about 3 to 4 minutes** for bots in Common gear, and melts toward half that in full Epic.
7. **The art is the main cost.** Every dungeon needs its 3-piece sets, its boss weapons and the armour stands
   that show them in the collection log (`tools/art_wardrobe.py`). Then the two bosses, the one or two new
   enemies, the props and the theme. Spend the art there; reuse the rest.
8. **Every achievement says why.** Its `how` is one plain, exact sentence (the toast, the chest, the
   achievements page and the titles list all show it): name the dungeon, the move by its name in the game, and
   the seat when only one seat can do it ("As the healer, ..."); a count that adds up over runs just says the
   number. Every title comes from exactly one achievement. `checkContent()` checks both.

## What's in here

| File | What it holds |
| --- | --- |
| `map.js` | The layout: rooms, links (doors and corridors), gates, the dressing |
| `mobs.js` | Every mob, and the packs: who stands where, in the order the party meets them |
| `bosses.js` | The two bosses, each a list of moves for `brain()` |
| `signature.js` | The signature: its mobs, and the hooks the trash and the bosses call |
| `script.js` | Gates, starts from a boss (for tests and sims), pulls and the chest, from `makeDungeonScript`; the optional Heroic seal |
| `engine.ts` | The dungeon as the engine sees it: theme, layout, mobs, script, signature, how hard it hits |
| `index.ts` | The dungeon as the rest of the game sees it: bosses, loot, collection log, achievements, its door |
| `items.ts`, `loot.ts`, `collectibles.ts`, `achievements.ts` | Sets, boss weapons, drops, pets, mounts, titles, the log's prize |
| `heroic.ts` | Its Heroic, from `makeHeroicDungeon`: the Normal loot, plus a gilding kit for each unique (`src/content/kits.ts`). Its log is the kits |
| `stage.ts` | Its door on the Dungeons sheet: the door, the final boss in the doorway, and three clear spots for your heroes |

## Making a new dungeon

1. Copy this folder to `src/content/<id>/` and rename every `template` id, name and export.
2. Pick or add a theme in `DUNGEON_THEMES` (`src/dungeon/template.js`).
3. Draw the layout in `map.js`. Number the rooms in the order the party meets them: a checkpoint only moves
   on to a higher number. Give a boss's room `cp: 'out'` so a wipe puts you outside his door.
4. Write the signature, the new enemy types, the packs and the two bosses.
5. Register it in `src/content/index.ts` (`DUNGEONS`, `DUNGEON_ENGINES`, `ITEMS`, `SETS`, `COLLECTIBLES`,
   `TITLES`, `ACHIEVEMENTS`, and its Heroic's `KITS`). `checkContent()` and the tests catch broken ids.
   Draw its door in `stage.ts` (`tests/meta.test.ts` checks there's room for the heroes), and its door in the
   house's cellar: name it `houseDoor` in `index.ts` and draw it in `tools/art_doors.py` in its four states (plain,
   lit, a gold trim, gilded; `tests/house.test.ts` checks). It takes its place in the Hall of Doors by its place in
   the Act 1 list (`src/content/act1.ts`).
6. Give it its own walkout tell: name it in the engine def (`walkout`), on the same clock as the Barrow's
   lantern (`src/dungeon/walkout.js`). Thimblebriar's cuckoo clock (`src/dungeon/cuckoo.js`) is the example,
   and `TELL_SPRITES` in walkout.js is what the reveal shows beside the chest.
7. Give its final boss a garden seed (`seeds` in `index.ts`).
8. Run `npm run sim -- --dungeon <id>` until the times land, then copy the checks in `tests/template.test.ts`.
9. `npm run all`, look at it on a phone and a desktop, and write it up in `docs/design.md`.

## The layout, in short

```js
rooms: [
  { id: 'hall', name: 'Long Hall', x0, y0, x1, y1, floor: 'stone', wall: 110 },          // a box
  { id: 'arena', name: 'The Arena', round: true, x, y, r, floor: 'yard', wall: 130, cp: 'out' },  // round
],
links: [
  // the door is on `side` of `from`; `at` is its middle (x for n and s, y for e and w); `w` its width (160)
  { from: 'hall', to: 'arena', side: 'n', at: 940, gate: { id: 'finalIn', end: 'to' } },
],
```

The builder refuses a layout that doesn't hold together: a door off its wall, rooms on the wrong side of each
other, a room you can't reach. Leave the links out and the rooms make a line from the bottom up (Barrow).

## The shared moves, in short

```js
cone(m, { dmg, r, arc, warn })            // a wedge at the tank: he blocks, a perfect block opens the boss up
line(m, { dmg, w, warn, charge })         // a lane at someone else: step out; with charge the boss runs it
circle(m, { block, all, at, r, dmg })     // under the tank (block), under everyone (all), or on a spot
adds(m, { types, expose })                // mobs join; the last one down opens the boss up
pulse(m, { dmg, name })                   // everyone takes it: the healer heals through
```

`brain({ moves, phases, enrage, tick })` makes a boss's `ai` from its moves. The boss bar names the move it's
doing from the mob's `acts`.

## Engine limits to know

- `kind: 'caller'` is the Barrow's Gravecaller: it curses and raises Barrow's skeletons. Don't use it without
  them.
- `makeCage` (the Gravekeeper's Bone Cage) is built from Barrow's `rattler`.
- A mob with `priority: true` is what DPS bots go for first (the example's beacons).
- Something on the floor that isn't a fighter (Thimblebriar's bombs, `src/dungeon/bombs.js`) is a mob with
  `thing: true` (no threat, no pulls, no pushing), its own `tick`, `onHit` (what any hero's hit does to it) and
  `draw`. A mob's `onDeath` runs when it dies (a Waddlecap's spore cloud) and `tally` names the lifetime counter
  its kills add to. `phaseSprites` swaps a boss's sprite by phase. Wall decor can be any sprite: one whose name
  ends in `_lamp` glows like a torch.
- A curse can wear its own look and do its own thing when it bursts or is lifted (`curseHero(m, h, o)` in
  `src/dungeon/mobs.js`): Thimblebriar's Sticky Bomb is one, so the healer's swipe, the frames and the bots
  all work for it.
- The sprites and props here are Barrow's, standing in until the dungeon's own art is drawn.
