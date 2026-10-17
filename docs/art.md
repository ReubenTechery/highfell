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
- **Heroes are drawn in layers:** a body (race, sex and class, in plain linen underclothes: `art_bodies.py`)
  wearing a layer for each gear slot (chest, shoulders, helm, weapon), drawn from the piece worn there, so what
  a hero wears is what you see. Front (`_f`) and back (`_b`, the weapon in the other hand). They are drawn "Big
  Shoulders": the armour is the silhouette (big pauldrons or mantles, big hands and weapons) over one of the
  faces in `art_heads.py`, each drawn once around the middle of its eyes; but the head always reads at run size,
  so big pauldrons are drawn a quarter smaller than they stand and scaled to each body.
  - **Bands:** a hero is drawn band by band, back to front (`BANDS` in `art_gear.py`: the cape, the legs, the
    torso, the arms, what the other hand holds, the shoulders, the weapon, the hands, the head, the helm, and
    others; one order for the front and one for the back). The body and every layer put each shape in a band, so
    a layer can sit behind one part of the body and in front of another (a shield under the pauldron, a beard
    over the plate).
  - **Anchors:** each class's gear is drawn once, on its reference body (the warrior's is the dwarf, the cleric's
    and the rogue's the human, the mage's the elf). Every body has a fit: where the reference's landmarks fall on
    it (the middle of the eyes, the shoulder line, the shoulders, both grips, and knots down the spine). Each
    shape of a layer names a region (`spine`, `head`, `sh`, `arm`, `arm2`, `main`, `off`) and moves onto the
    body by it; only the coordinates move, so the ink keeps its weight on a gnome as on a dwarf. A new body needs
    its fit; a new piece needs a layer for its class (`tests/heroart.test.ts` checks both).
  - **Set pieces and boss weapons** are their stands' pieces from the wardrobe, moved onto the hero
    (`from_stand()`, `held()`), with the sleeves, legs and backs a stand doesn't have. A stand's shaft or strap
    is redrawn at the hero's weight (`shaft()`); at hero size the stand's own would be all ink.
  - Shapes are written at 1.25 times game size and shrunk by `Z` as they're drawn (the helpers in
    `art_heroes.py`), keeping the ink at full weight. `python3 tools/art_gear.py` writes `art/heroes.json` (the
    page composes each hero from it, `src/ui/heroart.ts`) and a contact sheet per class: every body in Common,
    Uncommon, Rare, a mixed outfit and each set, gilded too, front and back. Look at it before it goes in:
    `python3 tools/art_sheet.py shots/heroes_mage.png shots/heroes_mage.json --cols 16`.
  - `HERO_ART` in `src/content/folk.ts` maps a race and class (and sex, `HERO_ART_SEX`) to its body. Mounts face
    right and carry a `saddle` offset in their collectible so a hero sits on them.
- **Heroic drops are gilded:** `gild()` in `art_sprites.py` turns a picture's bone and steel to gold; on a 64x64
  tile it also gives a dark gold ground and a sparkle in the corner. Every heroic drop uses it (a gilding kit is
  drawn as its piece, gilded), so a gilded piece reads as the heroic one at a glance. A hero wearing a gilded
  piece wears that layer through `gild()`, that piece alone.
- **The wardrobe:** each set stands on its own armour stand in the collection log (`art_wardrobe.py`). The stand
  is drawn bare, then every piece (helm, shoulders, chest, and the boss weapon of the set's role) is a layer of its
  own around the stand's ground point, split into its silhouette (`sil`) and its details (`det`): a piece you
  haven't found is drawn as one dashed line round its whole silhouette (the silhouette masks out its own line, so
  shapes that overlap don't show) with a faint fill. So every silhouette shape is a closed, filled shape: draw a
  shaft with `bar()` or `band()`, never a `beam()` or a bare line, and tuck plates that meet under each other so
  no seam shows. Each set is drawn from its `look` in its dungeon's `items.ts`, and the set's 64×64 icons are cut
  from the same pieces (`cut()`), so the tile and the stand always agree. Each piece also has its box, for showing
  it on its own (the log's closer look). The stand is 270 tall at k = 1, a little taller than the house's armour
  stand.
- **Helpers:** every tool has the same small helpers (`s()` a filled shape with the ink line, `ln()` a line,
  `c()` a circle, `mirror()` for symmetric parts). Reuse them; don't invent a new drawing style.

| Tool | Draws | Writes |
| --- | --- | --- |
| `tools/art_gear.py`, `tools/art_bodies.py`, `tools/art_gear_tank.py`, `_healer.py`, `_mage.py`, `_rogue.py`, `tools/art_heads.py`, `tools/art_heroes.py` | the heroes in layers: the bands, anchors and how a layer moves onto a body; every body, front and back, with its fit; each class's gear (regular, sets and boss weapons); the faces and backs of heads; the helpers, shapes and colours they share | `art/heroes.json`, and `shots/heroes_<class>.json` to look at |
| `tools/art_sprites.py` | mobs, bosses, dungeon props, effects, and `gild()` | `art/sprites.json` |
| `tools/art_icons.py` | ability icons, gear icons, the set pieces' icons (cut from the wardrobe) | `art/icons.json` |
| `tools/art_wardrobe.py` | the wardrobe: the bare stand and every set piece and boss weapon as a layer, plain and gilded | `art/wardrobe.json` |
| `tools/art_hearth.py` | the house's props (the lectern, armour stand, weapon rack, larder, bunks, signpost, the brewing bench, the paddock's hay and trough), the fireplace and furniture, pets, mounts, trophies (and the dye bottle for the log's shelf), banners, lanterns, collectible icons | `art/hearth.json`, `art/collect_icons.json` |
| `tools/art_doors.py` | the cellar's Hall of Doors: each dungeon's door in its own style, in four states (plain, lit, a gold trim, gilded), and the bricked arch with a "?" for one still to come | `art/hearth.json` (through `art_hearth.py`) |
| `tools/art_thimble.py`, `tools/art_thimble2.py` | Thimblebriar Hollow: its mobs and two bosses; the bombs, the cuckoo clock (the reveal's three with hands), props, the round door and decals | `art/sprites.json` (through `art_sprites.py`) |
| `tools/art_wardrobe_tb.py`, `tools/art_hearth_tb.py` | Thimblebriar's four sets and weapons on their stands (their icons are in `art_icons.py`); its pets, mount, trophies and dye | `art/wardrobe.json`, `art/hearth.json` (through `art_wardrobe.py` and `art_hearth.py`) |
| `tools/art_vale.py` | the Vale: places, villagers, plants, Vale pets and mounts, ingredient and brew icons | `art/vale.json`, `art/vale_icons.json` |
| `src/ui/valeart.ts`, `src/ui/houseart.ts`, `src/ui/houseworkshop.ts`, `src/ui/toys.ts` | scenery, the house's rooms in each look (the tavern, Barrow Hall, the Toadstool Workshop) and its roof, and close-ups, drawn live in the page, same rules | (in the page) |

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
