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
| **Tier 2** | **Thimblebriar Hollow** (`thimblebriar`) | **Barrow Epic Sets & Weapons (`ilvl 22–26`)** (walking in with `ilvl 10` rags gets you flattened!) | **Tier 2 Epic Sets & Weapons (`ilvl 34`)** | **Gnome Fairytale Mushroom & Brass-Clockwork Burrow.** Warm amber roots (`#5A3E2B`), glowing giant toadstools, Fairy-Ring Bounce Pads, Bursting Spore-Pods, Spinning Gear Arena. | **Clockwork & Alchemy Sparks:** Spring-Shield Bomb Decoys (*Clockguard*), Healing Spore Blooms (*Sporebloom*), Arc-Spark Volleys (*Arcspark*), Wind-Up Doubles (*Gearshade*). | **Race:** *Gnome* (unlocked in Free Trial!)<br>**Look:** *Toadstool Workshop*<br>**Title:** *the Clockwork Knight* | **Clock-Cap** (planned) |
| **Tier 3** | **Moonmere Sanctum** (`moonmere`) | **Thimblebriar Epic Sets & Weapons (`ilvl 30–34`)** | **Tier 3 Epic Sets & Weapons (`ilvl 42`)** | **Woodland Elf Twilight Glade & Sunken Moon-Ruins.** Emerald moss (`#2D4C3E`), silver moon-shallows, Starlight Conduits, Living Briar Ambush, Lunar Eclipse Ring. | **Starlight & Living Wilds:** Entangling Thorn-Ward (*Sylvanguard*), Moonwell Tidal Blooms (*Moonweaver*), Starfall Lunar Beams (*Starcaller*), Silverbark Bleed (*Nightbough*). | **Form/Mount:** *Starlight Form / Great Silverstag*<br>**Look:** *Moonmere Glade*<br>**Title:** *the Starcaller* | **Moon-Lotus** (planned) |

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

## 4. The Dungeon Template

A new dungeon starts as a copy of `src/content/_template/`, a small working dungeon that isn't in the game.
Its `README.md` is the guide, and `docs/design.md` (Making a new dungeon) has the rules: one signature idea
used by the trash and both bosses, one or two new enemy types, two bosses of two or three moves (the mini boss
about 40 seconds, the final boss two phases and about 80), a different layout shape (layouts are data, any
shape: `src/dungeon/layout.js`), no puzzle on Normal, and the art budget (the 3-piece sets, the boss weapons and
their armour stands) as the main cost.
