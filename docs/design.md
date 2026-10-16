# Highfell Dungeon Systems

> A copy of the Dungeon Systems doc on claude.ai, made 14 Oct 2026, so every agent can read it. Keep it
> true: when a system changes, change it here in the same pull request. Where it and the code disagree about
> what's built, the code wins; for what's planned, this doc wins.

Dungeons and their collection logs are the core loop of the whole game: OSRS endgame PvE style grind-loot-RNG runs (~3 to 4 minutes in starter gear, ~2 minutes when melted in full BiS) with four buttons and a swipe, where you grind a dungeon 100+ times to fill its collection log, feel steep power creep as your Warband gears up, unlock Heroic mode, and move on to the next dungeon (where future dungeons also drop OSRS-style upgrade attachments that awaken older dungeon gear). Raids are a later bonus activity, not the core loop.

## In the live game

What [Highfell](https://claude.ai/artifact/LYyryT29gsopt6UPoNceVd) has as of 16 Oct, and what is still only on this page.

| Part | Built | Still design |
| --- | --- | --- |
| Heroes & Warband | Race, class and male or female look picked once, for keeps; up to 6 heroes in the bunk room; on Normal, your own Warband heroes automatically fill the other two party seats wearing their real gear, sets, traits, and Boss Weapons (bots stand in only for empty roles) or you can group with friends; Heroic needs at least two real players, a bot in any empty seat, never your Warband. Dwarf, Elf and Human from the start; the Risen (undead) earned from the Barrow's collection log; Gnomes and Goblins drawn as pint-sized heroes across all 4 classes (`Warrior`, `Cleric`, `Mage`, `Rogue`), both sexes, and all 3 visual gear tiers (`_rags`, `_iron`, and full armour) | Gnomes', goblins' and orcs' own dungeons; the remaining starter race/class combos; racial tricks |
| Abilities | Four buttons per role plus the dodge; a perfect block stuns, counter-strikes, resets Cleave and opens a Boss `Exposed` window (+35% damage taken) | Ults |
| Gear, Power Creep & Sets | 4 slots on a gear doll; steep power curve (`1.00` Common → `1.24` Uncommon → `1.48` Rare → `1.72` plain Epic → `1.96` full BiS with 3-piece set + Boss Weapon, plus up to `+14%` crit chance and `+48%` HP) so full BiS melts runs in roughly half the time; all four Barrow sets (*Barrowguard*, *Candlewake*, *Rimebone*, *Shadeveil*) with their per-piece perks, 2-piece bonuses, and **active 3-piece summon/ghost bonuses** (`S.thralls`); all four Gravekeeper Boss Weapons. Nothing goes on by itself | Sets drawn on the heroes themselves (the log's wardrobe shows them on stands) |
| Threat, Difficulty & Boss Mechanics | The tank earns threat (Slam taunts and drags mobs in, Charge grabs one); Bosses and Brutes deal `1.85×` **Crushing Blows** to non-tanks in melee; unblocked telegraphs bypass passive armor and pierce 60% of `Ward` shields; Boss `Exposed` windows (+35% damage taken on Perfect Block, dodged Shield Charge wall-crash, last rally guard kill, Soul Chain cut, and `< 2.0s` Bone Cage break); the Gravekeeper in two phases on Normal (lights out at half health: wisps, Soul Chain, Bone Cage) and three on Heroic, whose Phase 3 adds the **moving green lantern circle** (`S.ring.followBoss`) with `Grave Stride` repositioning and **Lantern Zeal** (`+15%` cooldown recovery, `+10%` crit) inside, and burrowing; Heroic's Room 4 **Crypt Seals** (10 3-seat rune patterns granting **Crypt Surge**: `+25%` speed, `+20%` damage for 18s); mid-run `MELTED!` and `New Personal Best!` banners |  |
| Loot | Every line rolls on its own, kill counts, duplicates counted in the collection log, the walkout and the chest reveal (a new log piece drops onto its stand) |  |
| Heroic | Heroic Barrow: open after 10 clears, made for full Epic (`hit: 2.8, trashHp: 1.95, bossHp: 1.63`), with the Crypt Seals and the Gravekeeper's full three-phase fight; the same drops gilded at the same rates and power, its own kill counts and log. A group run: at least two real players, a bot in any empty seat, never your Warband; opens only for practice until online play (or with "Everything open") | A heroic version of every new dungeon |
| Collection log rewards | Each dungeon's whole log (every drop, every role; the pet, mount and dye are bonus slots and never needed) gives a house look, a title and one big prize: the Barrow's are Barrow Hall, the Gravewarden and the Risen; its heroic log's Gilded Barrow Hall, the Undying and Gilded Bones. The prize stands on a plinth at the top of the log | One per new dungeon: a race, a race and class combo, or something else |
| Achievements | All 12, the meta and the 3 hidden ones, with titles, trophies, looks and the Lantern Ghost |  |
| Home | The Hearth, a tall house cut open, opening zoomed out on every room each time you come home; tap a room to go in, and one with one clear job opens it as you land (the cellar the Dungeons, the yard the garden, the brewing room brewing, the bunk room your heroes, the armory your gear, the paddock every mount); your hero's name tag over their head; zoomed in, tap things to use them (the Barrow door, the 3 garden planter beds in the yard, the armour stand, the big book of the collection log, the cauldron, the larder); about 30 spots for pets, trophies and banners; the paddock outside, with a place for every mount in the game; Decorate; looks for a room or the whole house (the tavern; Barrow Hall from the Barrow's collection log, Gilded Barrow Hall from its heroic one); one big Dungeons button | Rooms that come with new dungeons, inviting people over |
| Dungeon picker | Dungeons: Act 1 stepped 3-dungeon selector (`ilvl 26 → 34 → 42`), Normal or Heroic, its collection log line with the prize at the end (inside: what finishing it gives and the loot per role; tap a drop to hold it up against what that role wears), then your role, hero and brew, loot or practice; Normal shows your Warband companions & Group option, while Heroic says it needs at least two players (locked outside practice until online play) | Online Party Finder for Heroics and friends in seats, more dungeons |
| Logs | The collection log as a wardrobe: a page per dungeon's log (Normal, or Heroic in gold) with its prize on a plinth, the count and the kill counts; each set on an armour stand (found pieces on it, missing ones as dashed ghosts); a trophy shelf for the trophy and the bonus pet, mount and dye; a set's page with Try it on; rarity, drop rate and the kill count you got it at on every slot; the garden's and other rewards' pages; achievements; stats |  |
| The Garden | 3 planter beds (`bed.0`, `bed.1`, `bed.2`) in the Hearth's outdoor yard; seeds drop from dungeon bosses (Gravekeeper drops Glowcap seeds at 1/5 Normal, 1/3 Heroic) and grow over 3 dungeon clears (`GROW_CLEARS = 3`); harvesting uses the `snip`/`pluck` close-up toys and yields 8–10+ herbs plus Gathering XP; first harvest gives the Hill Goat; every harvest rolls `GARDEN_TABLE` for trophies, kettle, bunting, hare and pets | New seeds from future dungeons |
| Brews | The cauldron by your fire, 4 party-wide brews, 1 bottle poured at the dungeon door (`pourFor`) buffs all 3 seats for faster clears | More recipes as new dungeon seeds open |
| Onboarding | Create your first hero first, then run a 60-second role-tailored Crypt Trial against the Ossuary and Sir Rattlebones (teaching your class's 4 abilities, dodging red lanes, and punishing Exposed windows); its chest holds a real Uncommon weapon + shared Warband piece (given when the hero is made, so skipping loses nothing) and two example uniques for the gold lantern. A save's first run never drops a seed. Then a 3-step Hearth tour (`hall` your hero's gear → `bunks` the empty bed → `cellar` Dungeons), and a one-step Garden tip only when your first seed drops |  |

## Core Loop & Dungeon Rules

1. **Dungeons + Collection Logs are the core loop.** A run takes about 3 to 4 minutes in Common gear (Barrow Crypt about 3½) and melts down toward ~2 minutes in full BiS Epic gear, needs all three roles, and drops loot every time.
2. **Four buttons plus the swipe dodge, never more.** Sets, weapon traits, and boss weapons transform what buttons do; they never add one.
3. **Dramatic power creep, long collection chase.** Regular gear climbs Common → Rare in 8 clears, while Epic 3-piece sets (1/35 per piece) and Boss Weapons (1/50) push power up to `1.96×` (plus crit and summons) so grinding 100+ runs feels noticeably faster and more explosive as you gear up your Warband.
4. **Normal solo with your Warband, Heroic in a group.** Normal dungeons can be run with your 3-hero Warband (so gearing your alts directly speeds up your runs) or with a group if you want, and a Normal collection log can always be finished solo. Heroic is the optional group flex, at the same power as Normal with gilded looks and its own log: it needs at least two real players; with two, a bot takes the third seat, and your Warband heroes never sit in. There is no online play yet, so Heroic opens only for practice (the "Everything open" testing switch lets you in).
5. **No drinking for mana and no waiting around:** mana refills between pulls.

## Combat, Difficulty & Boss Mechanics

**Threat & Crushing Blows:** holding mobs is the tank's job, not a given. The tank's hits make a third more threat than anyone else's; the DPS out-damages him, and heals pull a little on everything in the fight. A mob switches once someone beats its target by a tenth.

- **Slam** taunts everything around you for 4 seconds and drags it in to arm's reach (big mobs half as far, bosses not at all). Its hits make double threat.
- **Charge** makes the mob you hit turn on you; Ringing Blow makes everything it hits turn.
- A mob that isn't on the tank for 3 seconds goes **wild**: it hits harder and faster.
- **Crushing Blows (`1.85×`):** Bosses and Brutes (`m.isBoss || m.M.big`) landing a melee hit on a non-tank (`role !== 'tank'`) deal **1.85× Crushing Blow** damage with an alarm callout (`"Crushing blow! Let the tank hold him!"`), so a Rogue or Mage cannot facetank bosses.
- In the Gravekeeper's last phase **only the tank is caged**. Inside, nothing can target him and every mob forgets half his threat, so the boss turns on someone else until he mashes out (or a mate breaks him out) and Slams it back. Breaking a cage in under `2.0s` exposes the boss and resets the Tank's `Charge` cooldown.
- **Curses (Healer role mechanic, every room but the Gravekeeper's):** Gravecallers (packs A, C and D, and one that rises with Sir Rattlebones' rally) curse a hero 1.8s into their fight and every 8.5s after: a purple skull with a 4-second ring over their head, their name purple in the frames. Only the **Healer** lifts it, by swiping across them (from anywhere on the screen, the walk stick's half too) or with `Sunburst`, for +5 mana. Left alone, it bursts and drops its hero to 10% of their health; on its own it never kills, so every miss is a chance for a save. Curses end with the fight or the hero, and never come in the Crypt Trial. Bot DPS kill Gravecallers first (after kickable casts), so a bot party sees about four curses a run.
- **Saves:** the healer's heal landing on a mate under 15% pops a gold `SAVED!` with a chime and a short stop. As the healer, a mate under 15% throbs red in the frames and a heartbeat plays.
- **Chains and Wisps (Healer role mechanic):** only the **Healer** can swipe across chains to sever them (exposing the boss for 3s) or swipe/smite Wisps to banish them (triggering a `Soul Spark` backlash bolt on the boss and restoring +5 mana).
- **Numbers:** you see only your own (your hits, your heals, what hits you). Your mates' spell effects still show.

**Difficulty & Avoidable Telegraphs:** Barrow Crypt's `tune` scales all hero damage taken by `1.5×` and trash HP by `1.3×` (`heroic`: `hit: 2.8, trashHp: 1.95, bossHp: 1.63`). Each dungeon's `tune` lives in its engine file: `hit` scales everything that hurts a hero, `trashHp` the health of everything but the bosses, `bossHp` the bosses', and `hp` gives a named mob its own multiplier instead (Barrow's Normal tune has `hp: { keeper: 0.65 }`: his two-phase fight has 65% of his written health; Heroic gives him all of it, times `bossHp`). Ground hazards and boss telegraphs (`hazard: true`) bypass passive armor unless actively blocked AND **pierce 60% of `Ward` shields**, so standing in `Shield Charge`, `Cleaving Sweep`, `Burrow Erupt`, `Grasping Hands`, or `Shockwave Ring` in beginner gear will nearly kill you even through a shield.

**Boss `Exposed` Windows (`+35%` damage taken):**
- Perfect-blocking a heavy boss attack stuns the boss, resets `Cleave`, and exposes the boss for `3.5s`.
- Dodging Sir Rattlebones's `Shield Charge` so he misses every hero makes him crash into the tomb wall (`Wall Crash! Exposed!` for `3.0s`).
- Killing Sir Rattlebones's Phase 2 rallied guards lashes him for 4% max HP each, and killing the last guard cracks his rally armour and exposes him for `3.0s`.
- Cutting the Gravekeeper's `Soul Chain` exposes him for `3.0s`, and breaking `Bone Cage` in `< 2.0s` exposes him for `2.5s` while resetting the Tank's `Charge`.

**The Gravekeeper on Normal: two phases, about 80 seconds** (`keeperTick` in `src/content/barrow/bosses.js`; 65% of his written health):
- **Phase 1** (down to half health): Shovel Smash (the tank blocks, everyone else stays out of the circle), the dirt toss, and Grasping Hands under everyone, after which he moves to a new spot.
- **Phase 2** (half health to the end): lights out. Wisps (the healer swipes them), Soul Chain (the healer cuts it), Bone Cage on the tank (he mashes out), Shovel Smash, the dirt toss, and the pale green `Grave cold` ring that sweeps the party every 9s (the healer heals through it).
- The leap, `Bury the Yard`, the moving green circle with Grave Stride and the burn outside it, and burrowing are Heroic only. The boss bar says `Phase 1 of 2` (the mob's `phases`; Heroic reads `heroicPhases`).

**Gravekeeper Phase 3 Moving Green Circle & Grave Strides (Heroic only: there he leaps in for the dark at two thirds, and buries the yard at a third):**
- At `< 35%` HP, the green lantern safe circle (`S.ring.followBoss = true`) anchors to the Gravekeeper instead of the room center.
- Every `8.5s`, the Gravekeeper performs **Grave Stride** (`stride`), marching to a new graveyard waypoint and carrying the green safe zone with him while firing overlapping telegraphs.
- Heroes standing inside the green circle gain **Lantern Zeal** (`+15%` cooldown recovery speed and `+10%` crit chance); standing outside in the dark burns with green fire (`34` damage/tick).

**Crypt Seals (Room 4 Speed Trials, Heroic only; Normal has the curses instead, so it doesn't get busier):**
- After clearing Pack D in the Catacombs, a randomized 3-seat rune formation (`SEAL_PATTERNS`, 10 patterns) lights up on the floor before the Coffin Ambush.
- Bots automatically step onto their role pads out of combat; lighting all 3 pads shatters the seal and grants **Crypt Surge** (`+25%` movement speed and `+20%` damage for 18s) to melt the Coffin Ambush. Auto-fades after 6.5s if ignored so it never slows or blocks a run.

| Role / Class | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| Tank (Warrior) | Cleave: fast front sweep, Crush bonus on heavy/stunned/clumped foes, 2.2s | Charge: dash, hit, taunt and stun nearby foes, readies Cleave, 6.5s | Slam: drag nearby foes in, taunt for 4s, spin a 360° whirlwind, 6s | Shield (hold): a perfect block stuns, counter-strikes, exposes the attacker and resets Cleave |
| Healer (Cleric) | Prayer circle, 5s | Ward, 3.8s | Sunburst: heals everyone in reach, clears roots and lifts curses, 13s | Smite: heals your most hurt ally for the damage dealt, pulses Prayer circles and gives mana back, 2.4s |
| DPS (Mage) | Blizzard, 7.8s | Rime burst, 11.5s | Comet: 0.9s cast, 5.6s | Icicle: instant, triple damage on frozen mobs, 2.6s |
| DPS (Rogue) | Viper Blades: single-target twin-dagger slash + 5.5s Viper Venom, 2.3s | Shadowstrike: single-target execution thrust, guaranteed crit + 35% bonus damage on poisoned targets, 3.4s | Fan of Blades: modest 360° throwing-knife spin + enemy cast interrupt + refreshes active venom, 6.0s | Shadowstep: blink through shadow behind target, interrupt casts, +35% attack speed for 3.8s, shaves 2s off Shadowstrike, 5.5s |

## Talents (retired in favor of Gear, Set & Boss Weapon Ability Buffs)

Skill trees and hero levels are omitted so that **Gear alone drives damage, healing, health, and ability fantasy**. Every class's 4 buttons are balanced out of the box, and Dungeon / Heroic Boss Weapons and 3-piece sets transform and buff how those 4 buttons work:
- **The Gravedigger** (Tank): Every fifth swing digs in with a stunning tremor, and `Charge` resets `Cleave`’s cooldown.
- **Lantern of the Long Night** (Healer): `Mend` wards its target for 60, and `Sunburst` sears nearby foes for 90 holy damage and wards the party for 75.
- **Gravefrost Staff** (Mage): `Comet` freezes everything it hits for 2 seconds, and `Rime burst` resets `Icicle` and leaves a 3s frost storm.
- **The Cryptfangs** (Rogue): Every fourth twin-dagger slash strikes twice and refreshes Viper Venom, and `Shadowstep` resets `Shadowstrike`.

## Heroes, Warband and Alts

A hero is one race and one class, picked when you make them and fixed after. You can have six, and the one you play stands by the fire on the Hearth.

- **The bunk room & Warband party seats:** every hero you aren't playing waits by their bed in the house. Tap one to play them, check their gear, rename them (once) or let one go (the last one stays); an empty bed makes a new hero. When you enter a **Normal** dungeon, your own heroes from your bunk room (`seats(p, false)` in `src/meta/party.ts`) automatically fill the other two role seats wearing their real equipped gear, sets, traits, unique weapons, and sprites (bots, Brannoc, Maren and Ivy, stand in only for roles you haven't created a hero for yet), or you can group with friends. **Heroic** needs at least two real players (`partyProblem` in `src/meta/party.ts`); with two, a bot takes the third seat, and your Warband heroes never sit in (`seatsFor`). With no online play yet, Heroic opens only for practice, or with the "Everything open" testing switch.
- **Each hero keeps:** their regular gear (the Common to Rare ladder), their equipped uniques, their title and their clears.
- **Every hero shares:** the collection (a unique fits any hero of its role), kill counts, achievements, titles and the Hearth.
- **Shared gear:** a floor per role, up to Rare. Spare pieces and your own ladder raise it, and every hero of that role can put it on, including heroes made later (a new hero starts wearing it). Epic is earned on the hero.
- **Nothing goes on by itself.** A new piece waits in the hero's bag and glows on the gear doll with "Up" (a better regular piece) or "New" (a unique). Your hero's tag at the top of the house counts what's waiting; tap the slot, compare, and Put it on: the slot bursts, the item level counts up. The chest reveal says "Put it on in Gear". A ladder piece (and the shared floor) waits in the hero's bag; a new unique waits in their `fresh` list. The armour stand counts what's waiting too, and the doll shows old and new side by side with exact item level, damage or healing, and health. A drop's sheet holds it up against what its role wears (`compareOn`): better is more item level or a new effect with nothing lost, worse is less or an effect lost for nothing, and both at once is a trade.
- **Races:** Dwarf, Elf and Human from the start. Gnome, Goblin, the Risen (undead) and Orc are earned, each in its own dungeon: the Risen from filling Barrow Crypt's whole collection log, the others with dungeons to come. The hero maker shows how close you are to each.
- **Classes:** Warrior (tank), Cleric (healer), Mage (ranged AoE/Shatter DPS) and Rogue (fast melee single-target venom/crit DPS with permanent +10% movement speed and twin daggers as a single pair item). That's all four.
- **Drawn today:** Dwarf Warrior (tank), Human Cleric (healer), Elf Mage (DPS), Human/Elf Rogue (DPS), and Gnome, Goblin and the Risen as all four classes, both sexes and all three armour tiers (`_rags`, `_iron` and full armour). The rest show in the hero maker as Soon.
- **Old saves:** became one hero, named for the role you last played, with a one-time rename.
- **Who can be made:** a race and class combo is playable once it has a ready class and art in `HERO_ART` (`HERO_ART_SEX` for male and female variants, keeping the same body and armour silhouette) and its race is open; the rest show as "Soon". An earned race (gnome, goblin, the Risen, orc) opens with the achievement that gives it (`reward.race`) and stays locked until a dungeon does (or the testing switch or the hero maker's `Unlock` preview button is used).
- **Also per hero:** their own male or female look (`sex`). **Also shared:** the garden and the cauldron (`p.vale`).

## Home: the house

Home is a tall house on the hill, cut open like a doll's house. Built 14 Oct after a play test where a new player tapped Ride out first because it looked like the main button.

- **Zoom:** pinch or scroll. The house opens zoomed out, the whole house in view with a sign on each room, every time you come home: on load, after a run, and when you close something you opened from there (something you opened from inside a room leaves you in that room). Zoomed out, tap a room to go in; a room with one clear job opens it too, as the camera lands: the cellar the Dungeons, the yard the garden (the bed you tapped, or a ready bed first, then an empty one you have a seed for, then the one nearest ready), the brewing room brewing, the bunk room your heroes, the armory your gear, the paddock every mount. The hall and the trophy loft, with several things each, just zoom in. Zoomed in, tap things to use them. Built 16 Oct, replacing "it opens on the hall, and zoomed out a tap only goes into a room".
- **Your hero's name tag:** your hero by the fire has a small name tag over their head, their name and title, the same size at any zoom so it reads from the whole house, bobbing gently. It hides where it would cover the top bar or the Dungeons button, and while the tour points at your hero. Your other heroes by their beds don't get one.
- **Your heroes and the mounts:** the bunk room opens a list of your heroes (the one you play first; tap one for their sheet, or make a new one), and the paddock a page of every mount in the game (yours lit up, the rest dark with where they come from; tap one for its card).
- **One big button: Dungeons.** Everything else is a thing in the house: the Barrow door in the cellar, the 3 garden planter beds in the yard, the armour stand (gear), the big book in the trophy loft (the collection log), the cauldron and the larder (the satchel). Your hero's tag at the top opens gear too.
- **Rooms:** the trophy loft, the bunk room (your other heroes), the armory, the hall (your hero, the fire, the mantel), the brewing room (the whole ground floor, with the door out to the garden), the cellar with the Barrow door and two bricked arches for dungeons to come. Outside: the yard on the left (with the 3 planter beds) and the paddock on the right.
- **The paddock:** a fenced field at ground level, right of the house, with a trough and hay. Every mount in the game has its own place in it. The ones you own stand there and wander a little; the ones you haven't got are a shadow with a "?", like the collection log. Tap a mount for its card: its name, where it drops, its rate, and the kill count you got it at. It replaced the indoor stable (16 Oct): a mount that was in the stall is in the paddock, nothing lost. As built: `MOUNTS` and `paddock(p)` in `src/meta/hearth.ts`, the places from `paddockSlots` in `house.ts`, in the order the game lists them; the wandering is CSS only, and a tap opens the mount's card (`itemSheet`). It reads the collection, so a mount that was in the old stall (or the garden's spot) is simply there; the save keeps its old spot keys and needs no migration.
- **Trophies everywhere:** about 30 spots: the mantel, the loft's shelves, banners on the walls and the roof's flagpoles, pets by the fire, on the rug, on the table and in the loft. Decorate shows the empty ones; the rest of the time they're hidden.
- **Dungeons** (the big button or the Barrow door): the dungeon's picture, with one small collection log line under it that opens to show what each role can get. Then you: pick a role and you play your hero of that role you played last (Change picks another or makes one), your brew, and loot or practice. Your own Warband heroes from your bunk room take the other seats in their own gear (or bots stand in until you make them).
- **Looks:** Decorate, then Looks: pick a look and put it on a room or the whole house. Looks only; everything you placed stays where it is.
  - **Tavern:** the default. Wood, plaster, lamplight and a crackling fire.
  - **Barrow Hall:** opens when you fill the Barrow's whole collection log, and shows how close you are until then. The Barrow's own brick and flagstones, burial niches with skulls, green lanterns, the Gravekeeper's green fire in the hall, a coffin in the armory, a gravestone in the brewing room, wisps in the cellar. Put it on the whole house and the beams and outer walls turn to stone and the roof to slate.
  - **Gilded Barrow Hall:** from the heroic Barrow's log. Gold bones, gold frames and lanterns, the green fire burning higher.
  - Every dungeon brings a look like this, and a gilded one from its heroic log.
- **Next:** rooms that come with new dungeons (the cellar's bricked arches become new dungeons' doors).
- **The plan is data** in `src/content/house.ts`: the rooms (each with an optional `main`, what it opens when tapped from far away), the things you tap, the display spots and the paddock's places. Zoomed out, a tap goes into a room and opens its `main` as the camera lands; zoomed in, a tap uses a thing. Which bed the garden opens is `bedToOpen` in `src/meta/vale.ts`. The house remembers whether what is open over it was opened from the whole house, and goes back out when it closes (`closed()` in `hearth.ts`, called by the sheets, the garden's card and the way back from the cauldron); a run, the hero maker and loading come home to the whole house (`home()`). The hearth's first eight spot ids never change (bar `mount.stall`, gone with the stable); a spot a save has never had takes what isn't on show when the save loads (`settleSpots`); a spot you emptied stays empty; something new goes to the first free spot of its kind (the hall first). Spots hold pets, trophies and banners; mounts have the paddock.
- **Looks, as built:** every room inside the house has a look (`p.hearth.looks`, room id to look id; a room not in it is the tavern). A look opens with the achievement that gives it (`reward.look`: finishing that dungeon's collection log); one you haven't earned is drawn as the tavern (the testing switch shows it). With every room in the same look, the frame (beams, outer walls, roof) follows it. What a look is lives in `src/content/house.ts` (`LOOKS`); how it's drawn, room by room, in `src/ui/houseart.ts`.

## The Garden & Brews

Instead of riding out to a separate map or waiting on real-time timers, the Hearth's outdoor yard holds **3 planter beds** (`bed.0`, `bed.1`, `bed.2`) that feed directly into the dungeon loop:

1. **Seeds from dungeon bosses:** Each dungeon drops its own seed from its final boss. In Barrow Crypt, The Gravekeeper drops **Glowcap** seeds (`1/5` on Normal, `1/3` on Heroic). Saves from before the garden were given one Glowcap seed to try it; a new player's first seed comes from the Gravekeeper (never on their first run), and a one-step Garden tip shows them the beds when it drops.
2. **Grow in 3 dungeon clears (`GROW_CLEARS = 3`):** Tap an empty bed in the yard to plant a seed. Each Normal or Heroic dungeon clear advances all planted beds by 1 stage (`growBeds`; `0/3` sprout → `1/3`, `2/3` growing → `3/3` ready). Practice runs and the Crypt Trial do not advance beds, and crops never wilt.
3. **Harvest in close-up:** Tap a ready bed to harvest in close-up (`snip` a stem on the dotted line or `pluck` a glowcap at its brightest). Three cuts per harvest: base yield is `8–10` herbs, each Perfect cut adds `+1` (up to `+3`), and Gathering ranks 4, 7 and 10 each add `+1` more. **Every cut pays Gathering XP as it lands**, with a bar at the foot of the close-up and a burst on a new rank.
4. **Rares & Starlight Dew:** Your very first harvest grants the **Hill Goat** (`mount.goat`). Every harvest also rolls `GARDEN_TABLE` independently (OSRS style), has a `1/4` chance to shimmer and drop `1–2` **Starlight Dew**, and converts any duplicate rare into `2` Starlight Dew.
5. **Brew at the cauldron:** Stirring at the cauldron by your fire turns herbs into bottles (every lap pays Brewing XP; a Perfect stir fills 1 extra bottle). The ingredients go in when the stir starts, so leaving mid-stir still bottles it.

| Reward | From | Rate |
| --- | --- | --- |
| Hill Goat (mount) | First garden harvest | Guaranteed on 1st harvest |
| Pressed Moonpetal (trophy) | Any garden harvest | 1/25 |
| Glowcap Jar (trophy) | Any garden harvest | 1/25 |
| Bramble Crown (trophy) | Any garden harvest | 1/25 |
| Wobbly Kettle (trophy) | Any garden harvest | 1/25 |
| Bramblewick Bunting (banner) | Any garden harvest | 1/25 |
| Thistledown Hare (mount) | Any garden harvest | 1/60 |
| Rootling (pet) | Any garden harvest | 1/200 |
| Puffcap (pet) | Any garden harvest | 1/200 |
| Thimble (pet) | Any garden harvest | 1/200 |

### Party-wide brews (one bottle per run)

Brews are strong **party-wide speed and power buffs** that make Normal, Heroic, and Raid runs noticeably faster (~20% faster clears) without ever being mandatory to clear.
- **One bottle poured at the door (`pourFor`):** Only **one** bottle is uncorked at the dungeon door for the whole 3-seat party (your hero's chosen brew first, then Tank → Healer → DPS). Even if multiple party members bring a brew selected, only the single poured bottle is spent (`spendBottle`), so teammates never waste duplicate potions. Practice runs use the brew buff but keep the bottle.

| Brew | Needs | Party-wide buff (all 3 heroes for the full run) | Learned at |
| --- | --- | --- | --- |
| Glowcap Draught (`glow`) | 10 Glowcap | `+25%` damage, `+15%` move speed, `+25%` AoE radius, `+50%` tank threat | Brewing 1 |
| Moonpetal Tonic (`tonic`) | 10 Moonpetal | `+15%` move speed, dodging heals `10%` of max health | Brewing 1 |
| Bramble Fizz (`fizz`) | 8 Brambleberry, 2 Moonpetal | `+25%` move speed, all ability and dodge cooldowns tick `25%` faster | Brewing 1 |
| Starlight Elixir (`elixir`) | 8 Glowcap, 2 Starlight Dew | All Glowcap Draught buffs (`+25%` dmg/AoE, `+15%` speed, `+50%` threat) + once per run a lethal hit leaves each hero at `50%` HP | Brewing 3 |

What each brew does lives in `BREW_FX` in `src/dungeon/entities.js` (`tonic`, `fizz`, `glow`, `elixir`).

Achievements here: Green Fingers, Steady Hands, Something Brewing, Green-Thumbed (gold) and a hidden one for the Rootling (Odd Jobs is retired and only shown if earned on an older save).

## Gear and sets

The weapon is the upgrade you feel; Helm, Shoulders and Chest are the set. Power climbs steeply from `1.00` at Common (score 10) to `1.72` at plain Epic (score 22) and `1.96` in full BiS (score 26: 3-piece set + Boss Weapon), plus up to `+14%` bonus crit chance and `+48%` health.

### The ladder

- 4 slots: Weapon, Helm, Shoulders, Chest.
- Rarity climbs Common → Uncommon → Rare (8 clears) → Epic (from dungeon 3-piece sets and Boss Weapons). Heroes start in Common rags with bronze or wood weapons; item icons go `_0` (Common), `_1`, `_2` to `_3` (Epic), and a hero is drawn in `_rags`, `_iron` or full armour.
- The weapon carries 40% of your power (`WEIGHT.weapon = 4` of `10`), so a Boss Weapon (`rar: 4`, `+38.4%` damage/healing and `+19.2%` health) is a massive power spike.
- Every clear drops a regular item better than the best you have in your weakest slot. No dead drops. It waits until you put it on. It also drops a shared piece for another role, up to Rare, so a new alt never starts cold.
- Tap any drop (in the collection log or the Dungeons sheet) to hold it up against what that role wears now: Upgrade, Downgrade, Same power or A trade, then what changes (item level, power, health, set count) and any effect it adds or takes away.
- **No currency:** a duplicate counts in the collection log ("Seen 3×") and your weapon's trait swaps for free. The save still counts each dungeon's `marks` (1 per clear, 3 per duplicate), never shown or spent.

**Weapon traits** (unlocked at Rare, free to swap, and stay active alongside Unique weapons)

| Role / Class | Trait | Trait | Trait |
| --- | --- | --- | --- |
| Tank (Warrior) | **Wide Swings**: swings hit everything in front at full damage | **Ringing Blow**: Charge hits twice and everything it hits turns on you | **Headsman**: hits on stunned mobs always crit |
| Healer (Cleric) | **Sunflare**: Mend splashes half to the next hurt ally | **Quick Hands**: Mend recasts faster | **Kindle**: a Ward that breaks heals for 80 |
| DPS (Mage) | **Shatterlance**: Comet on frozen mobs hits 3× | **Splinter**: frostbolts split to a second mob | **Quickfrost**: Comet casts twice as fast |
| DPS (Rogue) | **Twin Venom**: twin-dagger auto-attacks extend Viper Venom by 1.5s | **Venomrush**: Shadowstrike on a poisoned foe refunds 1.2s of its cooldown | **Nightstalker**: Shadowstep makes your next Shadowstrike deal +30% damage |

### How sets work

- Each dungeon drops sets per class/role in the Helm, Shoulders and Chest slots.
- Set pieces are uniques from the drop table below at Epic Item Level 26 (`+19.2%` damage/healing and `+9.6%` health per piece), and each piece has its own immediate When-Worn ability perk even at 1 of 3 pieces.
- **1 piece (per-piece perk)**: each Helm, Shoulders and Chest piece immediately buffs one of your core abilities when worn.
- **2 pieces**: a set bonus that leans into your role's signature mechanic.
- **3 pieces (`ready: true`)**: changes how one button works with spectral/skeletal summons (`S.thralls`) or ghost saves. All four Barrow 3-piece bonuses are on: `barrowguard3`, `candlewake3`, `rimebone3`, `shadeveil3`.

### Barrow Crypt sets: raise the dead

| Set | Look | 2 pieces | 3 pieces (Active) |
| --- | --- | --- | --- |
| **Barrowguard** (tank) | Bone-white plate, skull shoulders, coffin-lid shield | Perfect blocks give you a 150 bone shield | `Slam` raises 2 skeleton thralls for 8s that slash nearby foes for 28 damage and soak 25% of hits on the tank |
| **Candlewake** (healer) | Black robes, candle crown, a lantern | Mend leaves a candle that heals 40 more over 4s | Once per fight per ally, fatal damage turns them into a fighting ghost at 35% HP (+25% damage) for 6s; `Prayer circle` also sears enemies inside for 32 holy damage per tick |
| **Rimebone** (Mage DPS) | Frosted bone crown, icicle shoulders | Comet on a frozen mob refunds half its cooldown | `Blizzard` rains bone shards (+30% damage) and raises a frost skeleton (on boss casts or mob kills inside) that slashes for 32 frost damage and slows for 6s |
| **Shadeveil** (Rogue DPS) | Shadow-stitched mask, bone-bladed spaulders, silent leather jerkin | Critical hits with Shadowstrike or Viper Blades erupt in shadow for 55 damage | `Shadowstep` leaves a shadow twin for 6s that slashes your target with twin daggers (34 damage every 0.55s) and refreshes Viper Venom |

### Sets by dungeon

Dungeons 2 to 4 are placeholder themes; their names come with the races pass.

| Dungeon | Set family | Tank, 3 pieces | Healer, 3 pieces | DPS, 3 pieces |
| --- | --- | --- | --- | --- |
| 1. Barrow Crypt | Raise the dead | Slam raises thralls | Dying allies become ghosts | Blizzard raises frost skeletons / Shadowstep spawns shadow twin |
| 2. Goblin dungeon | Bombs and gold | Perfect blocks drop a lit bomb | Ward becomes a patch-up turret | Comet splits into 4 frost bombs |
| 3. Fungal hollow | Spores and spread | Taking hits puffs out healing spores | Mend plants a bloom that bursts to heal the group | Kills in Blizzard spread the frost to neighbours |
| 4. Storm peak | Chains and speed | Charge chains to 3 more mobs | Mend bounces to 3 allies | Frostbolts chain to 3 targets |

**Decided and built: 4 slots**, so the weapon chase stays separate from the set chase.

## Loot

Loot runs on OSRS rules: every unique has its own drop rate, rare means properly rare, and a 1-in-2,500 pet is the flex: a bonus slot in the log (like the mount and dye), never needed to finish it. Each player rolls their own table on every clear, so nobody fights over drops.

**As built:** loot rolls the moment a boss dies (`resolveKill`): every line of its table rolls on its own, per player, and kill counts are per boss. A dungeon's seed lines (`seeds` on its `DungeonInfo`, each a `SeedDrop` of `{ boss, seed, rate }`) roll there too. Finishing the run (`resolveClear`) adds the clear: a ladder piece (Common to Rare in eight clears), a spare piece for another role, and a step of growth for every planted bed (`growBeds`). Practice runs give nothing. The save still counts each dungeon's `marks` (1 a clear, 3 a duplicate; a heroic clear adds to its normal dungeon's), but nothing shows or spends them.

### Barrow Crypt drop table

| Drop | Rate | Average time (3½-minute clears) | Notes |
| --- | --- | --- | --- |
| Regular gear | Every clear | Every clear | The Common → Rare ladder (8 clears), plus a piece for one of your other roles |
| Set helm for your role | 1/35 | About 2 hours | Barrowguard, Candlewake, Rimebone or Shadeveil (Epic) |
| Set shoulders | 1/35 | About 2 hours |  |
| Set chest | 1/35 | About 2 hours |  |
| Sir Rattlebones' Plume | 1/50 | About 2 hours 55 | From the mini boss; a trophy for the mantel |
| Gravekeeper's weapon for your role | 1/50 | About 2 hours 55 | The Gravedigger, Lantern of the Long Night, Gravefrost Staff or The Cryptfangs, each with its own effect |
| Gravehound (mount) | 1/1,000 | About 58 hours | Waits in the Hearth's paddock |
| Ghostly Dye | 1/1,000 | About 58 hours | Your Barrow set goes pale and see-through. Looks only |
| Pint-sized Gravekeeper (pet) | 1/2,500 | About 145 hours | Sits by the fire at home |

- Rolls are independent, OSRS style: two uniques in one clear can happen, and so can a 200-clear dry streak (about 1 player in 60).
- An Epic piece (3 set pieces at 1/35 + 1 weapon at 1/50) drops about once every 10 clears (~10.6% per clear), and completing the full 4/4 Epic kit takes ~70 clears for a typical player (~4 hours) and ~145 for an unlucky one (simulated: the last piece is the dry streak).
- No pity on uniques. A duplicate counts in the collection log ("Seen 3×").
- Kill count shows on every loot screen and in the collection log ("Rimebone Chest, KC 42"), so spoons and dry streaks become stories.

### The walkout

The final chest has a tell before the loot shows, and the game never explains it: once you know, you know.

| What you see after the Gravekeeper falls | What it means |
| --- | --- |
| His lantern rolls away and gutters out | A normal chest |
| The lantern stays lit, the flame swells gold, and the chest lid knocks twice | A unique is coming |
| Every light goes out except the lantern, the music cuts, and the lantern lifts off the ground by itself | The pet: when the lights come back, the pint-sized Gravekeeper is holding it |

- Tells never lie and never fake out, so learning them always pays.
- Every dungeon gets its own tell, so each new dungeon is something new to learn.
- The final boss's drops decide the tell, and the first second is identical for all three on purpose.

## Heroic

Every dungeon has a harder version, its Heroic, for after the gear cap. It never gives more power.

- **Opens** after 10 clears of the dungeon, about when your gear tops out. The Dungeons sheet switches between Normal and Heroic on the dungeon's picture; until it opens, it shows how close you are.
- **Built as** its own `DungeonInfo` (`heroicOf` the normal one) that opens after `HEROIC_AFTER` (10) clears of the normal one (the testing switch opens it early): the same bosses and the same tables with gilded ids at the same rates, and gilded pieces wear exactly like the plain ones.
- **Players:** Normal can always be played solo with your Warband heroes, or with a group. Heroic needs at least two real players; with two, a bot takes the third seat, and your Warband heroes never sit in (`HEROIC_MIN_PLAYERS`, `partyProblem` and `seatsFor` in `src/meta/party.ts`); the players come through Group Finder or friends once online play is live. There is no online play yet, so Heroic opens only for practice (the "Everything open" testing switch lets you in); the Dungeons sheet says "Heroic needs at least two players. Bring a friend."
- **Harder:** the same dungeon and mechanics, plus the Crypt Seals and the Gravekeeper's full three-phase fight (Normal has two), made for full Epic (`hit: 2.8, trashHp: 1.95, bossHp: 1.63`). Bots in full Epic clear it in about four minutes without wiping; in Common they get buried.
- **Gilded drops:** every drop is the normal one gilded, at the same rate and the same power: a gilded set piece counts for the same set, a gilded weapon has the same effect. Heroic is a collection of its own, with its own kill counts and its own collection log.
- **Achievements:** a heroic clear counts for the dungeon's own achievements.

## Collection log rewards

Filling a dungeon's whole collection log (every drop for every role, so it takes a tank, a healer and a DPS of yours) is the long chase, and it pays out for keeps. Each log gives a look for the house, a title, and one big prize that stands on a plinth at the top of the log.

| Log | Big prize | House look | Title |
| --- | --- | --- | --- |
| Barrow Crypt | **The Risen**: a new race, skeletons who came back from the Barrow, as any class | Barrow Hall | the Gravewarden |
| Heroic Barrow Crypt | **Gilded Bones**: your Risen heroes' bones turn to gold | Gilded Barrow Hall | the Undying |

- When the last slot fills, the chest reveal gives it the whole screen: the prize walks out, then a panel with what the log gave and the way to it (make a hero, put up the look).
- The Dungeons sheet shows each log's bar with its prize at the end, and what finishing it gives; the collection log puts the prize on its plinth.
- Not every dungeon's prize is a race. With a lot of dungeons to come, a prize can be a race, a race and class combo (a Dwarf Mage, say), or something else.
- **As built** (`src/meta/logs.ts`): filling a dungeon's whole log (`logDone`; its `bonus` slots, the pet, mount and dye, don't count) earns its log achievement (tier `log`, checked whenever something new arrives). Its reward gives a title and can open a house look (`reward.look`), a race (`reward.race`) or a collectible (Gilded Bones). Earned stays earned, even if a slot is added to the log later.

## The collection log

The log is the trophy room of the chase: OSRS's log with WoW's wardrobe. Every slot shows its rarity (its colour and its word: Epic, Unique, Bonus, Trophy), its drop rate always, and once it's yours the kill count you got it at and how often you've seen it ("Seen 3×"). A slot you haven't got is faded or a dashed ghost, never blacked out: you always see what you're after.

- **A page per dungeon's log.** The log opens straight on a dungeon's page (the first whose log isn't finished); chips switch to the garden's harvests and the other rewards. On the page:
  - **The prize stage:** the log's big prize on a plinth (the Risen, dimmed until earned, with how many slots are left on its plaque), the count in big numbers, a bar with a notch per slot, what finishing gives, the kill counts and the best clear. A Heroic switch turns the page into the heroic log, in gold. A finished log lights the prize up and offers its way in: Make a Risen, Put up the look.
  - **The wardrobe:** each set on its own armour stand, its role's boss weapon leaning on it. The pieces you've found are on the stand; the rest are dashed ghosts. Under each stand, a tile per piece with a tick or its drop rate; a New ribbon when something arrived, a gold rim when the set is done. A stand opens its set's page.
  - **The trophy shelf:** the dungeon's trophy and its bonus pet, mount and dye, as their own pictures on a plank, with their rates or kill counts.
- **A set's page:** its stand big; Try it on shows the whole set in colour (with a Preview stamp); its 2- and 3-piece bonuses, lit when you have the pieces; and a row for every piece with its rarity, slot, rate and effect, and the kill count and date you got it. A piece still opens its compare sheet.
- **In the chest:** a piece the log didn't have gets a moment after its card turns: its stand comes up and the piece drops on, with its rarity, rate and kill count, the set's count (or "set done") and the log's strip ticking up. Tap to carry on; Skip skips it; duplicates don't get it, and a pet or a mount keeps its own big moment. The summary's log strip shows the count going up and opens the log on that set.
- **The art:** the stands are drawn in `tools/art_wardrobe.py` (`art/wardrobe.json`): one bare stand, and every set piece and boss weapon as its own layer with a silhouette (what a ghost keeps) and details. Each set is drawn from its written `look`, and the set icons are cut from the same pieces, so a tile and its stand agree. Heroic pieces are gilded.
- **As built:** the page is `src/ui/logbook.ts` (the Logs sheet in `logsheet.ts` hands it the collection tab); which pieces go on which stand and what goes on the shelf are `standsOf` and `shelfOf` in `src/meta/logs.ts` (a test checks every slot of a log shows exactly once); a stand is drawn by `standSvg` in `src/ui/art.ts`; the chest's moment and strip are in `src/ui/reveal.ts`. Nothing new in the save: the log reads `p.collection` (count, kill count and date per find) and `p.seen`.

## Achievements

Each dungeon has 12 achievements that pop mid-run and pay out in looks, titles, trophies and pets, never power. Earn all 12 in Barrow Crypt and you're Master of the Barrow.

- Three tiers: **Bronze** (just play), **Silver** (play well), **Gold** (master it), plus a few hidden ones.
- Each one pops with a badge, a sound and a little burst; progress bars tick on the end screen.
- Achievement points add up to one bragging number, and trophies go on the Hearth's mantel.

| Tier | Achievement | How | Reward |
| --- | --- | --- | --- |
| Bronze | Into the Barrow | Clear the Crypt | Trophy: Barrow Key |
| Bronze | Rattle Me Bones | Kill 500 skeletons | Title: Bonebreaker |
| Bronze | Wisp Swatter | Slice 50 wisps | Wisp-light swipe trail |
| Bronze | Chain Snapper | Cut 10 chains | Trophy: Broken Shackle |
| Silver | Nobody Left Behind | Clear with no deaths | Party banner |
| Silver | Wall of Bone | Tank: perfect-block every Gravekeeper smash in one fight | Shield glow |
| Silver | Not On My Watch | Healer: save 5 allies from under 15% in one run | Staff glow |
| Silver | Big Number | DPS: land a 1,500+ crit | Ice-burst crit effect |
| Silver | Armour On | Kill Sir Rattlebones while his rally armour is still up | Title: Knight-breaker |
| Silver | Jailbreak | Tank: mash out of a Gravekeeper cage in under 1.5s | Trophy: Bent Bars |
| Gold | Gravedigger's Sprint | Clear in under 3 minutes 20 | Title: the Quick |
| Gold | Flawless Barrow | Clear with no deaths and nobody hit by a hand or a ring | Trophy: Golden Skull |
| Meta | Master of the Barrow | All 12 above | Title: the Barrow-born + a lantern-ghost pet |

Hidden: **Bravely Stupid** (go in solo as DPS and die to the first pack), **Last One Standing** (win a boss fight as the only one alive), **Lucky Dig** (get the boss pet).

## Making it fair

Today's baseline (`tests/balance.test.ts`): bots clear Barrow Crypt in about 3:30 on Common gear with no wipes (the Gravekeeper about 80 seconds of it), full Epic in about 2:10, and a full BiS party (`power: 1.96` with 3-piece sets and Boss Weapons) melts the dungeon in well under half the time (`~1:30`). A healer who does nothing (no heals, no lifts) wipes the party by Sir Rattlebones, and the player as tank in Common gear with a bot healer clears with no wipes. Heroic in full Epic clears in about 3:45 with no wipes. The repo's `npm run sim` prints the full table.

- **The bands `tests/balance.test.ts` keeps:** a Common bot clear in about 3:30 with no wipes (3:05 to 3:55), with the Gravekeeper about 80 seconds of it (70 to 95); full Epic clearly faster; full BiS melting the dungeon in roughly half the time (under 62% of the Common clear time); and a DPS alone dies before Sir Rattlebones. Heroic: full Epic clears in about four minutes with no wipes, and Common gets buried.

## Onboarding

A fresh save opens on the hero maker.

- **The first hero** gets the Crypt Trial's chest at once (`grantTrialStarter`, once a save): an Uncommon weapon waiting in its bag and an Uncommon helm on another role's shared floor, so skipping or quitting the trial loses nothing.
- **The Crypt Trial** (`start: 'intro'`): 60 seconds as that hero in full Epic test gear, in the Ossuary and Sir Rattlebones's tomb. Brannoc tanks unless you are the tank, and your seat gets its role's Barrow weapon and 2-piece bonus. A Welcome card offers the trial or a skip.
- **Five teaching moments** drawn for your class (`TUT_BY_CLASS` in `src/ui/run.ts`): your opener, your pack or peel button, `Dodge` out of `Shield Charge`'s red lane, the heavy swing (a tank perfect-blocks it; a cleric Wards, a mage throws Icicle, a rogue Shadowsteps, and he staggers) and your big hit in the `Exposed` window. Each one pauses the game and spotlights the button to press. Heroes cannot drop below 20% health, and `Skip intro` is always there.
- **The chest:** killing Sir Rattlebones plays the gold `unique` walkout and opens the trial's chest (`reveal.showTrial`): the two starter pieces, plus a 1/35 set piece and a 1/50 trophy stamped `Example` (that is what the gold lantern was about), with the Barrow's collection log and its three prizes.
- **The Hearth tour:** then a 3-step guided tour of the Hearth (`hall` your hero's gear → `bunks` the empty bed → `cellar` Barrow door), which ends on the whole house (finished or skipped). The trial and the tour both replay from Settings; a replayed trial's chest is all examples.
- **The garden tip:** fresh saves start with no seed, and a save's very first run never drops one. The first seed that does brings a one-step Garden tip on the yard's beds (not for anyone who has planted before).

## Saves

A save never loses data: its shape changes only with a `PROFILE_VERSION` bump and a migration step.

- v2 to v3 turned one hero per role into the roster.
- v3 to v4 added the Vale (`p.vale`).
- v4 to v5 gave every hero an empty bag and fresh list (gear stopped going on by itself).
- v5 to v6 added house looks (`p.hearth.looks`, every room the tavern).
- v6 to v7 gave every hero a male or female look (`sex`).
- v7 to v8 added `seeds` and the 3 yard planter `beds` (`p.vale.seeds`, `p.vale.beds`) with 1 starter `glowcap` seed.

## Content Scope, Release Tiers & Stepped Unique Treadmill

See `docs/dungeons.md` for the full Dungeon Template guide (`src/dungeon/template.js` and `src/content/_template/`).

### Release Tiers & Pricing Targets

| Tier | Content Volume | Collection Log & Loot Scope | Player Playtime | Purpose |
| --- | --- | --- | --- | --- |
| **1. Free Trial (Act 1)** | **3 Normal Dungeons** (*Barrow Crypt* → *Thimblebriar Hollow* → *Moonmere Sanctum*) | **~50 Log Slots** (16–18 per dungeon). Starter `Common` → `Rare` (`ilvl 10–18`) warband floor, then a **3-tier OSRS-style Unique Treadmill**: Barrow Sets/Weapons (`ilvl 26`) → Thimblebriar Sets/Weapons (`ilvl 34`) → Moonmere Sets/Weapons (`ilvl 42`), plus **The Risen** & **Gnome** playable races unlocked from logs! Normal Mode only. | **3 – 6 hours** | Hook players with three radically different worlds and a real gear treadmill where you need Barrow uniques to survive Thimblebriar, and Thimblebriar uniques to survive Moonmere—then prompt upgrading when **Heroic Mode** and Act 2 open up. |
| **2. Full Base Game ($5.99–$6.99)** | **+5 Dungeons + 2 Capstone Raids + Heroic Mode** (8 Dungeons × Normal/Heroic = 16 Logs + 2 Capstone Raids) | **~130–160 Log Slots.** Unlocks **Heroic Mode** (`heroic.ts`) for all 8 dungeons (including Act 1), remaining earned races (**Goblin**, **Orc**), late-game **OSRS Upgrade Kits / Duplicate Synthesis** (to awaken earlier dungeon sets to endgame ilvl), and full Vale/Brewing tiers (`brew.ts`). | **20 – 45+ hours** | Instant-buy value for $6.99. Heroic Mode doubles the endgame chase of every dungeon built; late-game Upgrade Kits and Capstone Raids tie all 8 dungeons into one endgame loop. |
| **3. Expansion Pack ($3.99–$4.99)** | **3 to 4 Dungeons + 1 Multi-Boss Raid** (New Region, e.g., *Sunken Karst* or *Skyforge Peaks*) | **~45–60 Log Slots.** 1 new Class (`roles.ts`) or Race/Class mastery, 3–4 new Dungeon Set families, new dungeon seeds and brews, +1 Raid-exclusive attachment chase item. | **8 – 15 hours** | Scoped to ship in a couple of months off the Dungeon Template; meaty enough for players to instant-buy. |

### The Act 1 Free-Trial Trio ("Dungeon Uniques ARE the Treadmill")
All 3 Act 1 dungeons are open from Clear 0, tuned as a stepped treadmill (`1 → 2 → 3`) where your hero and Warband companions need the previous dungeon's `1/35` Sets and `1/50` Boss Weapons to survive the next:
1. **Barrow Crypt (`barrow`, Tier 1 — Entry `ilvl 10–18`, Drops `ilvl 26`):** Gothic undead crypt & graveyard (slate/purple stone, green necrotic lantern fire, coffin ambush, crypt seals on Heroic). Sets: *Barrowguard / Candlewake / Rimebone / Shadeveil*. Log prize: **The Risen** (Undead race), *Barrow Hall* look, *the Gravewarden* title.
2. **Thimblebriar Hollow (`thimblebriar`, Tier 2 — Entry `ilvl 22–26`, Drops `ilvl 34`):** Whimsical gnome fairytale mushroom & brass-clockwork burrow (warm amber roots, glowing giant toadstools, ticking brass gears, spore-bounce pads, bursting spore-pods). Sets: *Clockguard / Sporebloom / Arcspark / Gearshade*. Log prize: **Gnome** (playable race unlocked right in the Free Trial!), *Toadstool Workshop* look, *the Clockwork Knight* title.
3. **Moonmere Sanctum (`moonmere`, Tier 3 — Entry `ilvl 30–34`, Drops `ilvl 42`):** Woodland elf twilight glade & sunken moon-ruins (emerald moss flagstones, silver moon-pools, starlight conduits, living briar ambushes, eclipse rings). Sets: *Starlight & Living Wilds*. Log prize: *Starlight Form / Great Silverstag*, *Moonmere Glade* look, *the Starcaller* title.

### Zero Currency Bloat: Killing Marks, Free Weapon Traits & Dungeon Seeds
- **No Marks / No Currency Shops:** All cosmetics, mounts, pets, house looks, trophies, and gear come exclusively from dungeon/raid drops, collection logs, and achievements.
- **Weapon Traits Toggle for Free at Rare+ (`ilvl 18`):** Once your regular weapon reaches Rare (~Clear 8), all 3 Weapon Traits unlock for that hero and can be swapped freely in the Gear screen.
- **Dungeon Seeds Feed the Garden:** Each dungeon's final boss drops its own seed at a fixed rate (the Barrow's Gravekeeper: Glowcap, `1/5` Normal, `1/3` Heroic). Seeds grow in the Hearth yard's 3 planter beds over 3 clears and harvest into herbs for the cauldron (see The Garden & Brews).
- **Duplicate Uniques (`p.collection[id].n`) Saved for Late-Game Synthesis:** Duplicates stay tracked on every item in the Collection Log (`Seen 3 times`) for late-game synthesis recipes (combining duplicate weapons + boss-dropped Awakening Orbs from later dungeons/raids).

