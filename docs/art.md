# Highfell art bible

The look is locked: **TV-cartoon fantasy**. Think a bright, flat-coloured animated sitcom that has wandered
into a fantasy MMO: chunky heroic armour, big shoulders, big weapons, warm colour, cosy and epic at once.
Every picture in the game is SVG **drawn by code** in `tools/*.py`. No image generators, no photos, no
bitmaps, no traced art. That is the main reason it doesn't look AI-made.

## The rules

1. **One ink.** Every outline is `#1E1A1A`. Line weights: 4 on characters and creatures, 3 to 3.5 on small
   details, 5 or more only on big props. Round joins and round caps, always.
2. **Flat colour.** Objects are flat fills from the palette below. Light and shine are separate flat shapes
   (a lighter patch, a white curve, a glint), never shading or gradients inside an object. Gradients are only
   for light itself: a glow, a sky, a vignette.
3. **Big simple shapes first.** Block the silhouette, then add a few details. Test: fill the sprite solid
   black. If you can't tell what it is at 40 pixels tall, simplify.
4. **Chunky and exaggerated.** Big heads, hands, shoulders and weapons. Short legs on dwarves and gnomes;
   elves and the Risen slim and long in the limb. A dwarf stands about 3 heads tall, a human and an elf about
   4, the elf slimmer and in a tall hat.
5. **Few details, all on purpose.** A rivet, a stitch, a strap, a chip in a blade. No texture noise, no
   random scribbles, no detail that doesn't read at game size.
6. **Faces stay simple.** Eyes are white circles with a black dot (or a single arc), brows carry the mood,
   mouths are one shape. No realistic noses, lips or shading.
7. **Heroes stay heroic; jokes go in props.** A kettle with legs, bunting made of trousers, a screaming root.
   Never make a hero's silhouette silly.
8. **Everything is original.** No designs, logos, characters or names from other games.

## Palette

| Use | Colours |
| --- | --- |
| Ink | `#1E1A1A` |
| Bone | `#F0E8D2`, shade `#D8CDB0` |
| Ghost green | `#9BE15D`, light `#D8FFB8` |
| Steel | `#9AA7B8`, dark `#7D8FA3`, light `#C9D2DC` |
| Gold | `#F2C230`, dark `#D9A520` |
| Red | `#C8403F`, dark `#9E2F2E` |
| Blue | `#4F6FA8`, dark `#3D5A8C` |
| Wood | `#8A5A34`, dark `#6B4528`, rust `#A0703F` |
| Purple | `#6A4BA3`, dark `#4F3780` |
| Stone | `#8C8098`, light `#A69BB2`, dark `#6E6382` |
| Frost | `#8FD6FF`, light `#DDF3FF` |
| Fire | `#FF8A4C`, flame `#FFE08A` |
| Cream panels (UI) | `#FFF8EC`, `#F3E6CC` |
| Night backgrounds | `#17121F`, `#2E2A55`, `#3A3150` |
| Race lights (glow behind a hero) | dwarf `#FF8A4C`, gnome `#9BD068`, elf `#8FD6FF`, human `#F4B942` |
| Rarity | Common `#8E8A84`, Uncommon `#4E9A4A`, Rare `#3D7FC1`, Epic `#8A63D2`, Unique gold `#E7B53C` |

New colours are fine when a thing needs one; keep them flat and in this family (warm, bright, never neon).

## How sprites are built

- **Ground point at (0, 0).** x goes right, y goes down, so the art sits at negative y with its feet on 0.
  The game places sprites by that point. Each sprite is stored as `{ "svg": "...", "vb": [x, y, w, h] }`.
- **Sizes at k = 1:** heroes about 110 to 150 tall to the tip of a hat or staff (the top of the head: a dwarf
  about 100, the others about 115), ordinary mobs about 110, the Gravekeeper 312, pets 60 to
  110, mounts about 160. Icons are 64×64 tiles: a flat coloured square, one black line, one idea each.
- **Heroes:** `<name>_f` (front) and `<name>_b` (back, the weapon in the other hand). They are drawn "Big
  Shoulders": the armour is the silhouette (huge pauldrons or mantles, big hands and weapons) over one of the
  faces in `art_heads.py`, each drawn once around the middle of its eyes. `art_heroes.py` writes its shapes at
  1.25 times game size and shrinks them by `Z` as it draws, keeping the ink at full weight. `HERO_ART` in
  `src/content/folk.ts` maps a race and class to a sprite name; a combo is playable once it has art and an
  entry in `HERO_FIT` (`src/dungeon/render.js`: where its weapon glows, where the top of its head is; a test
  checks). Mounts face right and carry a `saddle` offset in their collectible so a hero sits on them.
- **Heroic drops are gilded:** `gild()` in `art_sprites.py` turns a picture's bone and steel to gold; on a 64x64
  tile it also gives a dark gold ground and a sparkle in the corner. Every heroic drop uses it, so a gilded piece
  reads as the heroic one at a glance.
- **Helpers:** every tool has the same small helpers (`s()` a filled shape with the ink line, `ln()` a line,
  `c()` a circle, `mirror()` for symmetric parts). Reuse them; don't invent a new drawing style.

| Tool | Draws | Writes |
| --- | --- | --- |
| `tools/art_heroes.py`, `tools/art_heads.py` | the heroes, front and back (the Risen too, gilded as well); their faces and the backs of their heads | `art/sprites.json` (through `art_sprites.py`) |
| `tools/art_sprites.py` | mobs, bosses, dungeon props, effects, and `gild()`; builds the heroes in with them | `art/sprites.json` |
| `tools/art_icons.py` | ability icons | `art/icons.json` |
| `tools/art_hearth.py` | the house's props (the lectern, armour stand, weapon rack, larder, bunks, signpost, the Barrow door, bricked arches, the brewing bench, the paddock's hay and trough), the fireplace and furniture, pets, mounts, trophies, banners, lanterns, collectible icons | `art/hearth.json`, `art/collect_icons.json` |
| `tools/art_vale.py` | the Vale: places, villagers, plants, Vale pets and mounts, ingredient and brew icons | `art/vale.json`, `art/vale_icons.json` |
| `src/ui/valeart.ts`, `src/ui/houseart.ts`, `src/ui/toys.ts` | scenery, the house's rooms in each look (the tavern, Barrow Hall) and its roof, and close-ups, drawn live in the page, same rules | (in the page) |

## The loop for any new art

1. Find the closest existing piece and read how it's drawn.
2. Draw the new piece in the right tool, with the same helpers and line weights.
3. Run the tool (for example `python3 tools/art_vale.py`).
4. **Look at it:** `python3 tools/art_sheet.py shots/new.png art/vale.json --only your_sprite,its_neighbour`.
   Put it next to an existing sprite of the same kind. Same line weight? Same chunkiness? Same palette?
   Readable small? Fix it until it sits with the others like it was always there.
5. `npm run all`, then check it in the game at real size (`npm run preview` or `tools/pw_check.py`).
6. Commit the `.py` and the `.json` together.

## Signs it has gone wrong

- Thin, scratchy or uneven lines; lines in colours other than the ink.
- Shading, gradients or soft shadows inside objects.
- Lots of small detail that turns to mush at game size.
- Realistic anatomy or faces; anything that looks like a stock fantasy illustration.
- A piece that would look at home in a different game. Redraw it.
