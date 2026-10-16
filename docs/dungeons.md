# Highfell Dungeon Roadmap, Pricing Tiers & Dungeon Template Guide

> This document defines Highfell's commercial content targets (Free Trial → Base Game → Expansions), the Act 1 Stepped Treadmill (**Barrow Crypt → Thimblebriar Hollow → Moonmere Sanctum**), the removal of Marks in favor of **Dungeon Seeds for the Garden + Duplicate Tracking**, and how to build a new dungeon from `src/content/_template/` and `src/dungeon/template.js`.

---

## 1. Release Tiers & Pricing Structure

Highfell uses an honest, old-school buy-once model: **a generous 3-dungeon Free Trial**, **a $5.99–$6.99 Full Base Game**, and **$3.99–$4.99 Regional Expansion Packs**. Never cash-shop pets, never energy timers, never currency shops.

| Tier | Content Volume | Collection Log & Loot Scope | Player Playtime | Purpose |
| --- | --- | --- | --- | --- |
| **1. Free Trial (Act 1)** | **3 Normal Dungeons** (*Barrow Crypt* → *Thimblebriar Hollow* → *Moonmere Sanctum*) | **~50 Log Slots** (16–18 per dungeon). Starter `Common` → `Rare` (`ilvl 10–18`) warband floor, then a **3-tier OSRS-style Unique Treadmill**: Barrow Sets/Weapons (`ilvl 26`) → Thimblebriar Sets/Weapons (`ilvl 34`) → Moonmere Sets/Weapons (`ilvl 42`), plus **The Risen** & **Gnome** playable races unlocked from logs! Normal Mode only. | **3 – 6 hours** | Hook players with three radically different worlds and a real gear treadmill where you need Barrow uniques to survive Thimblebriar, and Thimblebriar uniques to survive Moonmere—then prompt upgrading when **Heroic Mode** and Act 2 open up. |
| **2. Full Base Game ($5.99–$6.99)** | **+5 Dungeons + 2 Capstone Raids + Heroic Mode** (8 Dungeons × Normal/Heroic = 16 Logs + 2 Capstone Raids) | **~130–160 Log Slots.** Unlocks **Heroic Mode** (`heroic.ts`) for all 8 dungeons (including Act 1), remaining earned races (**Goblin**, **Orc**), late-game **OSRS Upgrade Kits / Duplicate Synthesis** (to awaken earlier dungeon sets to endgame ilvl), and full Vale/Brewing tiers (`brew.ts`). | **20 – 45+ hours** | Instant-buy value for $6.99. Heroic Mode doubles the endgame chase of every dungeon we build; late-game Upgrade Kits and Capstone Raids tie all 8 dungeons into one endgame loop. |
| **3. Expansion Pack ($3.99–$4.99)** | **3 to 4 Dungeons + 1 Multi-Boss Raid** (New Region, e.g., *Sunken Karst* or *Skyforge Peaks*) | **~45–60 Log Slots.** 1 new Class (`roles.ts`) or Race/Class mastery, 3–4 new Dungeon Set families, new dungeon seeds and brews, +1 Raid-exclusive attachment chase item. | **8 – 15 hours** | Scoped to ship in a couple of months off the Dungeon Template; meaty enough for players to instant-buy. |

---

## 2. The Act 1 Stepped Treadmill: "Dungeon Uniques ARE the Ladder"

All 3 Free Trial dungeons are **open from Clear 0** (no artificial lock icons), but they are tuned as a **true OSRS-style Stepped Gear Treadmill (`1 → 2 → 3`)** where your hero and your bunk-room Warband companions need the previous dungeon's `1/35` Epic Sets and `1/50` Boss Weapons to survive the next dungeon:

| Tier | Dungeon | Entry Gear Needed | Drops (Set & Weapon ilvl) | Scenery & Signature Toys | 3-Piece Set Fantasy | Log Completion Prizes | Garden Seed (final boss) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Tier 1** | **Barrow Crypt** (`barrow`) | **Starter Common → Rare** (`ilvl 10–18`, earned in your first ~8 clears + shared Warband floor) | **Tier 1 Epic Sets & Weapons (`ilvl 26`)** | **Gothic Undead Crypt & Graveyard.** Slate/purple stone (`#4A4060`), Crypt Seals (3-seat rune speed trial), Coffin Ambush, Soul Chains & Wisps, Moving Green Lantern Ring. | **Raise the Dead & Shadow:** Skeleton Thralls (*Barrowguard*), Ghost Saves (*Candlewake*), Frost Skeletons (*Rimebone*), Shadow Clones (*Shadeveil*). | **Race:** *The Risen* (Undead)<br>**Look:** *Barrow Hall*<br>**Title:** *the Gravewarden* | **Glowcap** (Gravekeeper `1/5`, Heroic `1/3`) |
| **Tier 2** | **Thimblebriar Hollow** (`thimblebriar`) | **Barrow Epic Sets & Weapons (`ilvl 22–26`)** (Rare gear wipes there: the owner's pick, 16 Oct) | **Tier 2 Epic Sets & Weapons (`ilvl 34`)** | **Gnome mushroom & brass-clockwork burrow,** a winding line of round chambers. Signature: **bombs you knock back** (in full below). | **Bombs & gadgets:** a perfect block drops a lit bomb (*Clockguard*), Ward leaves a patch-up turret (*Sporebloom*), Comet splits into bombs (*Arcspark*), daggers stick a bomb on (*Gearshade*). | **Race:** *Gnome*<br>**Look:** *Toadstool Workshop*<br>**Title:** *the Clockwork Knight* | **Bramble** (the Tinker King `1/5`, Heroic `1/3`) |
| **Tier 3** | **Moonmere Sanctum** (`moonmere`) | **Thimblebriar Epic Sets & Weapons (`ilvl 30–34`)** | **Tier 3 Epic Sets & Weapons (`ilvl 42`)** | **Woodland Elf Twilight Glade & Sunken Moon-Ruins.** Emerald moss (`#2D4C3E`), silver moon-shallows, Starlight Conduits, Living Briar Ambush, Lunar Eclipse Ring. | **Starlight & Living Wilds:** Entangling Thorn-Ward (*Sylvanguard*), Moonwell Tidal Blooms (*Moonweaver*), Starfall Lunar Beams (*Starcaller*), Silverbark Bleed (*Nightbough*). | **Form/Mount:** *Starlight Form / Great Silverstag*<br>**Look:** *Moonmere Glade*<br>**Title:** *the Starcaller* | **Moon-Lotus** (planned) |

### Thimblebriar Hollow, in full (agreed 16 Oct, not built yet)

**What:** dungeon 2, Tier II. A gnome family's burrow under Bramblewick, half mushroom cellar, half brass
workshop, where the inventions went wrong. Built from the template (`src/content/_template/`).

**Why:** a new feel after the Barrow: fast, bouncy and loud, with big hits you earn by knocking the gnomes' own
bombs back at them. And the next step up the gear ladder: Barrow's epics are what get you through.

#### The signature: bombs you knock back

- Bombs come from the trash and both bosses. A bomb lands, ticks for 3 seconds (a ring runs down round it),
  then blows: a circle about 110 wide that hurts any hero in it.
- **Hit it first.** Any hero's hit (a swing, a spell, any button) sends it flying about 260 away from that
  hero. It turns gold: it's yours now. When it blows it hurts mobs, not heroes, and one that blows beside a
  boss opens him up (Exposed) for 2.5 seconds.
- **Bat it back.** A bomb thrown at the tank and perfect-blocked flies straight back and blows on its thrower.
- No new button: it's the four you have, and the dodge for the ones you can't reach.

#### A run, on your phone

1. Pick Thimblebriar on the Dungeons sheet with a Warband in Barrow epics, and go in through a round green door.
2. The first chamber: Bombwrights lob ticking bombs. You smack one and it sails back into their pack: a big gold
   number.
3. Waddlecaps waddle in. One dies and bursts into a spore cloud: the tank drags the pack off it.
4. Old Toadstool's ring: block his Cap Slam, knock his puffballs back into him, the healer heals through his
   Spore Burst.
5. Two more chambers, then the Grand Workshop: the Tinker King in his clockwork suit. Block his Wrench Smash,
   knock his bombs back at him, and the healer swipes his Sticky Bombs off your mates.
6. At half health his suit cracks open and the bombs come faster. He falls, his cuckoo clock drops, and the
   cuckoo pops out twice, in gold: a unique.

#### The layout: a winding burrow

Seven round chambers, joined by short tunnels that zig-zag east and west on the way up (north). Not a line.

```
                ( 6 the Grand Workshop: the Tinker King, big and round )
                   |
      ( 5 the Gearworks ) - ( 4 Old Toadstool's ring )
                                |
      ( 2 the Spore Cellar ) - ( 3 the Root Tunnel )
           |
      ( 1 the Mushroom Hall ) - ( 0 the round front door )
```

Packs: A in the Mushroom Hall, B in the Spore Cellar, C in the Root Tunnel, Old Toadstool in his ring, D in the
Gearworks, the Tinker King in the Grand Workshop. Gates shut behind you at each boss, as in the Barrow.

#### The two new enemies

| Enemy | What it does | Whose job |
| --- | --- | --- |
| **Bombwright** (a gnome tinker) | Lobs a bomb every few seconds; now and then sticks one on a hero instead | Everyone knocks the bombs back; the healer swipes sticky ones off |
| **Waddlecap** (a walking toadstool) | Waddles in and hits; when it dies it bursts into a spore cloud (about 120 wide, 5 seconds) | The tank drags the pack out of the cloud |

The rest are the shared kinds dressed as gnomes and mushrooms (melee, ranged, a brute).

#### The bosses

**Old Toadstool**, the mini boss: a giant mushroom, about 40 seconds. From half health everything comes faster.

| Move | What happens | Job |
| --- | --- | --- |
| Cap Slam | A heavy circle on the tank: block it; a perfect block knocks him dizzy (Exposed) | Tank |
| Puffball Volley | Three spore-bombs round the party (the signature): knock them back into him | DPS, everyone |
| Spore Burst | A puff that hits the whole party, nobody can dodge it | Healer |

**The Tinker King**, the final boss: a gnome inventor in a giant clockwork suit, in the round Grand Workshop.
Two phases, about 80 seconds.

| Move | What happens | Job |
| --- | --- | --- |
| Wrench Smash | A heavy circle that follows the tank for a moment: block it; a perfect block opens him up | Tank |
| Bomb Barrage | Four bombs round the workshop (the signature): knock them back at him | DPS, everyone |
| Sticky Bomb | Stuck on a mate (never the tank), 4 seconds. Only the healer can swipe it off (or Sunburst), and it flies back and blows on him (Exposed). Missed, its hero drops to a tenth of their health and mates beside them take a hit. It never kills on its own | Healer |

Phase 2 at half health: the suit cracks open, the Barrage comes every 11 seconds instead of 16, and two Sticky
Bombs at once.

#### Sets and weapons: bombs and gadgets

Four sets, one per class, each three pieces (helm, shoulders, chest), at item level 34.

| Set | Class | Looks like | 2 pieces | 3 pieces |
| --- | --- | --- | --- | --- |
| **Clockguard** | Warrior (tank) | Riveted brass plate, spring-coiled pauldrons, a ticking bulwark | A perfect block winds your spring: a 150 brass shield | Your perfect block drops a lit bomb at the attacker's feet |
| **Sporebloom** | Cleric (healer) | A glowing toadstool cap, an amber root mantle, a fairy-lantern censer | Mend plants a glowing spore that heals 45 more over 4 seconds | Ward leaves a little patch-up turret for 6 seconds that heals the most hurt mate near it |
| **Arcspark** | Mage (DPS) | A copper filament crown, coil shoulders, star-threaded robes | Comet on a frozen foe arcs to 2 more | Comet splits into four small frost bombs that blow a moment later |
| **Gearshade** | Rogue (DPS) | A clockwork lens visor, spring-blade spaulders, a velvet burrower's coat | Crits with Shadowstrike or Viper Blades throw a 55 spark | Viper Blades stick a little bomb on the target, and Shadowstrike sets it off |

The Tinker King's weapons, one per class (1/50 each):

| Weapon | Class | Looks like | What it does |
| --- | --- | --- | --- |
| **The Mainspring Maul** | Warrior | A brass hammer with a wind-up key | Charge winds the spring: your next Cleave hits twice |
| **The Sporelight Censer** | Cleric | A mushroom-cap censer with a lamp inside | Mend's spore bursts to heal everyone near it; Sunburst sends a bomb flying |
| **The Arcwright's Coil** | Mage | A staff wound with copper coil | Icicle chains to 2 more foes; a frozen foe's Icicle bounces twice |
| **The Fusecutters** | Rogue | Twin daggers with fuse cord on the hilts | Shadowstep leaves a lit bomb where you were |

Names, looks and effects are drafts: the numbers are tuned in the build, and every bonus changes how a button
works, never adds one.

#### The log

- Every drop rolls on its own, at the Barrow's rates: set pieces 1/35 each, weapons 1/50, Old Toadstool's
  trophy (**Toadstool's Cap**) 1/50, the **Sporeglow Dye** 1/1,000, the **Clockwork Beetle** mount 1/1,000,
  the **Pint-sized Tinker King** pet 1/2,500. The pet, mount and dye are bonus slots.
- **The prize: the Gnome race,** as any class (gnome heroes are already drawn). Plus the house look
  **Toadstool Workshop** and the title **the Clockwork Knight**.
- **Seed:** Bramble, from the Tinker King at 1/5 (Heroic 1/3). It's already in the garden, with no source yet.

#### The walkout tell: the cuckoo clock

| What you see after the Tinker King falls | What it means |
| --- | --- |
| His cuckoo clock drops, ticks a few times, and stops | A normal chest |
| The cuckoo pops out twice, in gold, and the chest lid jumps | A unique is coming |
| It strikes midnight, every light goes out, and the cuckoo flies down carrying the little Tinker King | The pet |

The first second is the same for all three, and it never lies.

#### Heroic

The kit rule: Heroic drops the Normal loot plus gilding kits (the Heroic rewards work; Thimblebriar follows
whatever lands there). Harder, and made for Thimblebriar's own epics. No Heroic-only puzzle in this version.

#### Rules and numbers

- **Tuned for Barrow's epics** (the owner's pick): bots at power 1.72 (about a Barrow weapon and a set piece
  each) clear in 3:30 to 4:00 with no wipes. Bots in Rare (1.48) wipe at least once in most runs, mostly at the
  Tinker King. Full Barrow epics (1.96): about 3:00. Thimblebriar's own full kit (2.44): about half of 1.72's
  time.
- Old Toadstool about 40 seconds (30 to 50), the Tinker King about 80 (65 to 95), at power 1.72.
- Bombs: 3-second fuse, about 110 wide, a hit sends one about 260; a knocked-back bomb opens a boss up for 2.5
  seconds. Sticky Bomb: 4 seconds, only the healer lifts it, never kills on its own.

#### Not in this version

- A Heroic-only puzzle or seal.
- New garden plants (Bramble is already there).
- A door for it in the house's cellar (it's on the Dungeons sheet).
- The gnomes' racial trick.
- Moonmere, dungeon 3.

#### Changes to the brief (their own pull request)

- A decision row: each new dungeon is tuned for the last one's epics (Thimblebriar for Barrow's); Rare gear
  wipes there.
- The old placeholder list in `docs/design.md` gave bombs to the goblins' dungeon: goblins need a new idea.

#### Done means

- `npm run all` passes, with tests for: the clear times and boss times above at power 1.72; Rare bots wiping;
  bombs from the trash and both bosses; a hit knocking a bomb back so it hurts mobs; only the healer lifting a
  Sticky Bomb; Barrow unchanged.
- On your phone: knock a bomb into the Tinker King and see the big number; as the healer, swipe a Sticky Bomb
  off; see the cuckoo pop twice for a unique; with the testing switch, fill the log and see a Gnome on the
  plinth.

#### Plan

- `src/content/thimblebriar/`, copied from the template: the winding burrow, the mobs and packs, the two bosses,
  the bombs signature, the script, items, loot, collectibles, 12 achievements (drafted for you first), and Heroic
  by the kit rule. Registered in `src/content/index.ts`, with the Bramble seed.
- Engine: a bomb part in `src/dungeon/moves.js` (a hero's hit sends it flying; a perfect block bats it back),
  the Sticky Bomb on the healer's swipe (`src/ui/input.ts` and the bots), and a walkout tell per dungeon
  (`src/dungeon/walkout.js`).
- Art (`tools/`): Old Toadstool, the Tinker King, the Bombwright, the Waddlecap, the bomb, the cuckoo clock,
  burrow props and theme, the four sets and four weapons on their stands, the Toadstool Workshop look, the pet,
  mount and dye, and its door stage for the dungeon finder once that lands.
- Tests: `tests/thimblebriar.test.ts`. Docs: `docs/design.md`.

---

## 3. Zero Currency Bloat: Killing Marks, Free Weapon Traits & Dungeon Seeds

Per Pillar 5 (*Anti-bloat: every cosmetic and item comes from boss drops, logs, and achievements—never a shop*), **Marks are removed from the game**:

1. **All Cosmetics, Gear, Mounts & Pets Come From Drops/Logs Only:** There is no currency shop. If you see a hero with a mount, pet, title, house look, or weapon, they earned it from a boss or collection log.
2. **Weapon Traits Unlock Automatically at Rare (`ilvl 18`) and Toggle for Free:**
   - Once your regular weapon reaches `Rare` (~Clear 8), all 3 Weapon Traits for your class are unlocked and can be swapped freely in the Gear screen at any time (staying active alongside Unique boss weapons).
3. **Every Dungeon's Final Boss Drops Its Own Seed for the Garden:**
   - Each line rolls on its own at a fixed rate, OSRS style (the Gravekeeper's Glowcap: `1/5` Normal, `1/3` Heroic); a save's very first run never drops one (`rollSeeds`, `resolveKill`).
   - **No real-time timers:** a planted seed grows over 3 dungeon clears in the Hearth yard's 3 planter beds (`growBeds`), then harvests into herbs you stir in the cauldron for a party-wide brew (`docs/design.md`, The Garden & Brews).
4. **Duplicate Uniques (`p.collection[id].n`) Are Tracked for Late-Game Synthesis:**
   - Rolling a duplicate unique increments its counter in your Collection Log (`Seen 2 times`, `Seen 5 times`).
   - In late-game Base Game / Raid content, duplicate uniques + boss-dropped Awakening Orbs/Kits can be combined to forge Awakened/Endgame versions of earlier dungeon weapons and sets.

---

## 4. The Dungeon Template Architecture (`src/dungeon/template.js` & `src/content/_template/`)

Every dungeon in Highfell shares the same **4-minute, 6-room vertical spine** so bots, cameras, touch controls, checkpoints, walkouts, and balance sims work out of the box—while looking and playing completely differently through **Themes, Set-Piece Toys, Mob Archetypes, and Boss Scripts**.

### Standard 6-Room Spine (Bottom to Top, `x = 500`)
1. **Room 0 (`r0`) — Entrance Threshold:** Where the party spawns and drinks their Cauldron brew.
2. **Room 1 (`r1`) — Warm-Up Hall (Pack A):** 4 melee trash mobs to build rhythm and test AoE/threat.
3. **Room 2 (`r2`) — Two-Pack Hall (Packs B & C):** Pack B introduces the dungeon's heavy **Brute** (deals 1.85× Crushing Blows to non-tanks); Pack C introduces **Ranged/Casters**.
4. **Room 3 (`r3`) — Mini-Boss Arena (Pack K):** Gate closes behind the party (`g3b`), northern gate (`g3t`) stays locked until the Mini-Boss falls. 2-phase fight with Perfect-Block and Dodge-Crash **Exposed** (`+35%` damage taken) windows.
5. **Room 4 (`r4`) — Set-Piece & Ambush Hall (Pack D + 3-Seat Trial + Ambush Pack E):**
   - **Pack D:** Caller/Caster pack guarding the room.
   - **3-Seat Trial (`S.seal`):** Fast 2-second 3-hero formation pad puzzle (`makeSealTrial`) that shatters for an 18s speed/damage surge.
   - **Prop-Swap Ambush (`Pack E`):** Stepping past the midpoint pops room props open (`makeAmbush`: coffins, giant spore-pods, or briar cocoons) and spawns a fast swarm + Brute.
6. **Room 5 (`r5`) — Final Boss Yard/Sanctum (Pack G):** Circular arena (`MAP.arena`), 3 phases, signature role mechanics (tank cage/peel, healer chain/wisp/cleanse, DPS burn during **Exposed** windows, and Phase 3 boss-anchored moving safe-zone ring), ending with the **Chest & Lantern Walkout**.
