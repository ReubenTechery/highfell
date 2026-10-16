# Highfell Dungeon Systems

> A copy of the Dungeon Systems doc on claude.ai, made 14 Oct 2026, so every agent can read it. Keep it
> true: when a system changes, change it here in the same pull request. Where it and the code disagree about
> what's built, the code wins; for what's planned, this doc wins.

Dungeons and their collection logs are the core loop of the whole game: OSRS endgame PvE style grind-loot-RNG runs (~3 to 4 minutes in starter gear, ~2 minutes when melted in full BiS) with four buttons and a swipe, where you grind a dungeon 100+ times to fill its collection log, feel steep power creep as your Warband gears up, unlock Heroic mode, and move on to the next dungeon (where future dungeons also drop OSRS-style upgrade attachments that awaken older dungeon gear). Raids are a later bonus activity, not the core loop.

## In the live game

What [Highfell](https://claude.ai/artifact/LYyryT29gsopt6UPoNceVd) has as of 16 Oct, and what is still only on this page.

| Part | Built | Still design |
| --- | --- | --- |
| Heroes & Warband | Race, class and male or female look picked once, for keeps; up to 6 heroes in the bunk room; on Normal, your own Warband heroes automatically fill the other two party seats wearing their real gear, sets, traits, and Boss Weapons (bots stand in only for empty roles) or you can group with friends; Heroic needs at least two real players, a bot in any empty seat, never your Warband. Dwarf, Elf and Human from the start; the Risen (undead) earned from the Barrow's collection log, the Gnomes from Thimblebriar Hollow's; Gnomes and Goblins drawn as pint-sized heroes across all 4 classes (`Warrior`, `Cleric`, `Mage`, `Rogue`), both sexes, and all 3 visual gear tiers (`_rags`, `_iron`, and full armour) | Goblins' and orcs' own dungeons; the remaining starter race/class combos; racial tricks |
| Abilities | Four buttons per role plus the dodge; a perfect block stuns, counter-strikes, resets Cleave and opens a Boss `Exposed` window (+35% damage taken) | Ults |
| Gear, Power Creep & Sets | 4 slots, all in a hero's armoury; steep power curve (`1.00` Common → `1.24` Uncommon → `1.48` Rare → `1.72` plain Epic → `1.96` full BiS with 3-piece set + Boss Weapon, plus up to `+14%` crit chance and `+48%` HP) so full BiS melts runs in roughly half the time; all four Barrow sets (*Barrowguard*, *Candlewake*, *Rimebone*, *Shadeveil*) with their per-piece perks, 2-piece bonuses, and **active 3-piece summon/ghost bonuses** (`S.thralls`); all four Gravekeeper Boss Weapons. Nothing goes on by itself | Sets drawn on the heroes themselves (the log's wardrobe shows them on stands) |
| Threat, Difficulty & Boss Mechanics | The tank earns threat (Slam taunts and drags mobs in, Charge grabs one); Bosses and Brutes deal `1.85×` **Crushing Blows** to non-tanks in melee; unblocked telegraphs bypass passive armor and pierce 60% of `Ward` shields; Boss `Exposed` windows (+35% damage taken on Perfect Block, dodged Shield Charge wall-crash, last rally guard kill, Soul Chain cut, and `< 2.0s` Bone Cage break); the Gravekeeper in two phases on Normal (lights out at half health: wisps, Soul Chain, Bone Cage) and three on Heroic, whose Phase 3 adds the **moving green lantern circle** (`S.ring.followBoss`) with `Grave Stride` repositioning and **Lantern Zeal** (`+15%` cooldown recovery, `+10%` crit) inside, and burrowing; Heroic's Room 4 **Crypt Seals** (10 3-seat rune patterns granting **Crypt Surge**: `+25%` speed, `+20%` damage for 18s); mid-run `MELTED!` and `New Personal Best!` banners |  |
| Loot | Every line rolls on its own, kill counts, duplicates counted in the collection log, the walkout and the chest reveal (a new log piece drops onto its stand) |  |
| Heroic | Heroic Barrow: open after 10 clears, made for full Epic (`hit: 2.8, trashHp: 1.95, bossHp: 1.63`), with the Crypt Seals and the Gravekeeper's full three-phase fight; it drops the Barrow's own loot (for the Barrow's log and kill counts) plus a gilding kit for each of the 16 uniques (any seat, 1/20 each: that piece's gilded look, same power), with its own kill counts and a log of the kits. A group run: at least two real players, a bot in any empty seat, never your Warband; locked until online play (or with "Everything open"). Heroic Thimblebriar the same way, by the kit rule, made for its own epics | A heroic version of every new dungeon |
| Collection log rewards | Each dungeon's whole log (every drop, every role; the pet, mount and dye are bonus slots and never needed) gives a house look, a title and one big prize: the Barrow's are Barrow Hall, the Gravewarden and the Risen; its heroic log's Gilded Barrow Hall, the Undying and Gilded Bones; Thimblebriar Hollow's the Toadstool Workshop, the Clockwork Knight and the Gnomes; its heroic log's the Gilded Toadstool Workshop, the Arch-Tinker and Gilded Gnomes. The prize stands on a plinth at the top of the log | One per new dungeon: a race, a race and class combo, or something else |
| Achievements | The Barrow's 12, the meta and the 3 hidden ones, with titles, trophies, looks and the Lantern Ghost; Thimblebriar Hollow's 12 (drafts), its meta (the Puffling) and 3 hidden ones. Each says what you did in one plain sentence and what you got with where it went, the same on the toast (tap it for its card), the chest, the page (by place, with your progress, and the day and kill count you earned it at) and the list of every title in the Armoury's Looks, where a title goes on with one tap |  |
| Home | The Hearth, a tall house cut open, opening zoomed out on every room each time you come home; tap a room to go in, and one with one clear job opens it as you land (the cellar the Dungeons, the yard the garden, the brewing room brewing, the bunk room your heroes, the armoury your gear, the paddock every mount); your hero's name tag over their head; zoomed in, tap things to use them (the Barrow door, the 3 garden planter beds in the yard, the armour stand, the big book of the collection log, the cauldron, the larder); about 30 spots for pets, trophies and banners; the paddock outside, with a place for every mount in the game; Decorate; looks for a room or the whole house (the tavern; Barrow Hall from the Barrow's collection log, Gilded Barrow Hall from its heroic one); one big Dungeons button | Rooms that come with new dungeons, inviting people over |
| Dungeon picker | Dungeons: the door, your party standing in front of the dungeon's door with its final boss behind them (Normal or Heroic on it; tap a hero for Who goes in), its collection log line with the prize at the end (the Loot page: what finishing it gives and the loot per role, yours first; tap a drop to hold it up against what that role wears; beside the door on desktop), one brew button and one gold button. Two dungeons: Barrow Crypt and Thimblebriar Hollow. The dungeon's name opens All dungeons, grouped by season under each season's name (Season 0: the Barrow, Thimblebriar Hollow and Moonmere Sanctum, its Power 26 → 34 → 42 ladder, with what the coming ones ask), and a small Season 0 tag sits under the dungeon's name. A hero short of the dungeon's recommended Power gets one warning in the gold button's place, with Back and Go anyway. On Heroic the other seats wait for friends and the gold button stays locked until online play | Online Party Finder for Heroics and friends in seats, more dungeons |
| Logs | The collection log as a wardrobe: a page per dungeon's log (Normal, or Heroic in gold, its stands holding the gilding kits) with its prize on a plinth, the count and the kill counts; each set on an armour stand with its role's badge (found pieces on it, missing ones as dashed outlines); a trophy shelf for the trophy and the bonus pet, mount and dye; a set's page with Try it on; rarity, drop rate and the kill count you got it at on every slot; tap any slot for a closer look over the page (its picture, its stats against what its role wears, its set's bonuses); the garden's and other rewards' pages; achievements, one place at a time, each opening its card; stats |  |
| The Garden | 3 planter beds (`bed.0`, `bed.1`, `bed.2`) in the Hearth's outdoor yard; seeds drop from dungeon bosses (Gravekeeper drops Glowcap seeds at 1/5 Normal, 1/3 Heroic) and grow over 3 dungeon clears (`GROW_CLEARS = 3`); harvesting uses the `snip`/`pluck` close-up toys and yields 8–10+ herbs plus Gathering XP; first harvest gives the Hill Goat; every harvest rolls `GARDEN_TABLE` for trophies, kettle, bunting, hare and pets | New seeds from future dungeons |
| Brews | The cauldron by your fire, 4 party-wide brews, 1 bottle poured at the dungeon door (`pourFor`) buffs all 3 seats for faster clears | More recipes as new dungeon seeds open |
| Sound & music | 78 real effects made with ElevenLabs (every fight sound, the walkout, the chest and the cards, putting gear on, the buttons), embedded, each with its old synthesised sound as the fallback; your own crits get a sound; three music loops (the house, the dungeon, a boss) streamed from the live page's own files, the victory sting when the last boss falls, and a Music slider in Settings | Real garden and brewing sounds (still synthesised) |
| Onboarding | Create your first hero first, then run a 60-second role-tailored Crypt Trial against the Ossuary and Sir Rattlebones (teaching your class's 4 abilities, dodging red lanes, and punishing Exposed windows; each lesson waits for you to press its real button); its chest holds a real Uncommon weapon + shared Warband piece (given when the hero is made, so skipping loses nothing) and two example uniques for the gold lantern. A save's first run never drops a seed. Then a 3-step Hearth tour (`hall` your hero's gear → `bunks` the empty bed → `cellar` Dungeons), a Your Warband tip on the Dungeons door the first time you open it, and one-step tips as each first comes in the garden: your first seed (plant it), your first ready bed (pick it), your first herbs that make a brew (the cauldron) and your first bottle (poured at the door). After that, a class's first five runs glow the one button whose moment has come (fading out), and the first run on a class that isn't your first hero's offers that class's Crypt Trial |  |

## Core Loop & Dungeon Rules

1. **Dungeons + Collection Logs are the core loop.** A run takes about 3 to 4 minutes in Common gear (Barrow Crypt about 3½) and melts down toward ~2 minutes in full BiS Epic gear, needs all three roles, and drops loot every time.
2. **Four buttons plus the swipe dodge, never more.** Sets, weapon traits, and boss weapons transform what buttons do; they never add one.
3. **Dramatic power creep, long collection chase.** Regular gear climbs Common → Rare in 8 clears, while Epic 3-piece sets (1/35 per piece) and Boss Weapons (1/50) push power up to `1.96×` (plus crit and summons) so grinding 100+ runs feels noticeably faster and more explosive as you gear up your Warband.
4. **Normal solo with your Warband, Heroic in a group.** Normal dungeons can be run with your 3-hero Warband (so gearing your alts directly speeds up your runs) or with a group if you want, and a Normal collection log can always be finished solo. Heroic is the optional group flex: it drops the Normal loot, so grouping up is never a worse evening than playing solo, plus gilding kits (gilded looks at the same power) in a log of their own. It needs at least two real players; with two, a bot takes the third seat, and your Warband heroes never sit in. There is no online play yet, so Heroic stays locked (the "Everything open" testing switch lets you in).
5. **No drinking for mana and no waiting around:** mana refills between pulls.

## Combat, Difficulty & Boss Mechanics

**Threat & Crushing Blows:** holding mobs is the tank's job, not a given. The tank's hits make a third more threat than anyone else's; the DPS out-damages him, and heals pull a little on everything in the fight. A mob switches once someone beats its target by a tenth.

- **Slam** taunts everything around you for 4 seconds and drags it in to arm's reach (big mobs half as far, bosses not at all). Its hits make double threat.
- **Charge** makes the mob you hit turn on you; Ringing Blow makes everything it hits turn.
- A mob that isn't on the tank for 3 seconds goes **wild**: it hits harder and faster.
- **Crushing Blows (`1.85×`):** Bosses and Brutes (`m.isBoss || m.M.big`) landing a melee hit on a non-tank (`role !== 'tank'`) deal **1.85× Crushing Blow** damage with an alarm callout (`"Crushing blow! Let the tank hold him!"`), so a Rogue or Mage cannot facetank bosses.
- In the Gravekeeper's last phase **only the tank is caged**. Inside, nothing can target him and every mob forgets half his threat, so the boss turns on someone else until he mashes out (or a mate breaks him out) and Slams it back. Breaking a cage in under `2.0s` exposes the boss and resets the Tank's `Charge` cooldown.
- **Curses (Healer role mechanic, every room but the Gravekeeper's):** Gravecallers (packs A, C and D, and one that rises with Sir Rattlebones' rally) curse a hero 1.8s into their fight and every 8.5s after: a purple skull with a 4-second ring over their head, their name purple in the frames. Only the **Healer** lifts it, by swiping across them (from anywhere on the screen, the walk stick's half too) or with `Sunburst`, for +5 mana. Left alone, it bursts and drops its hero to 10% of their health; on its own it never kills, so every miss is a chance for a save. Curses end with the fight or the hero, and never come in the Crypt Trial. Bot DPS kill Gravecallers first (after kickable casts), so a bot party sees about four curses a run. A curse can't be missed: it lands with a low toll and a falling wail (louder for the healer and the cursed hero), and the cursed mate's party frame (the heal pad, bottom right, and the frames at the top) turns purple with the skull, its ring and the seconds left. Until you've lifted three curses (`curse.lifts` in `p.counters`, `needsSwipeHint`), a gold arrow sweeps across the cursed mate and a dark one across their frame. A swipe across a cursed mate's frame lifts it too (`bindFrameSwipes` in `src/ui/input.ts`); a tap on a frame still only heals.
- **Saves:** the healer's heal landing on a mate under 15% pops a gold `SAVED!` with a chime and a short stop. As the healer, a mate under 15% throbs red in the frames and a heartbeat plays.
- **Chains and Wisps (Healer role mechanic):** only the **Healer** can swipe across chains to sever them (exposing the boss for 3s) or swipe/smite Wisps to banish them (triggering a `Soul Spark` backlash bolt on the boss and restoring +5 mana).
- **Numbers:** you see only your own (your hits, your heals, what hits you). Your mates' spell effects still show.

**Difficulty & Avoidable Telegraphs:** Barrow Crypt's `tune` scales all hero damage taken by `1.5×` and trash HP by `1.3×` (`heroic`: `hit: 2.8, trashHp: 1.95, bossHp: 1.63`). Each dungeon's `tune` lives in its engine file: `hit` scales everything that hurts a hero, `trashHp` the health of everything but the bosses, `bossHp` the bosses', and `hp` gives a named mob its own multiplier instead (Barrow's Normal tune has `hp: { keeper: 0.65 }`: his two-phase fight has 65% of his written health; Heroic gives him all of it, times `bossHp`). Ground hazards and boss telegraphs (`hazard: true`) bypass passive armor unless actively blocked AND **pierce 60% of `Ward` shields**, so standing in `Shield Charge`, `Cleaving Sweep`, `Burrow Erupt`, `Grasping Hands`, or `Shockwave Ring` in beginner gear will nearly kill you even through a shield.

**Boss `Exposed` Windows (`+35%` damage taken):**
- Perfect-blocking a heavy boss attack stuns the boss, resets `Cleave`, and exposes the boss for `3.5s`.
- Dodging Sir Rattlebones's `Shield Charge` so he misses every hero makes him crash into the tomb wall (`Wall Crash! Exposed!` for `3.0s`).
- Killing Sir Rattlebones's Phase 2 rallied guards lashes him for 4% max HP each, and killing the last guard cracks his rally armour and exposes him for `3.0s`.
- Cutting the Gravekeeper's `Soul Chain` exposes him for `3.0s`, and breaking `Bone Cage` in `< 2.0s` exposes him for `2.5s` while resetting the Tank's `Charge`.

**Combos on bosses** (`chillBoss`, `staggerBoss`, `stunned` and `shatterable` in `src/dungeon/entities.js`): a boss never freezes, never gets stunned by a knock and never gets dragged, but the combos still land on him.
- `Rime burst` leaves a boss **Chilled** for `4s` (a light frost tint and a `Chilled` callout) and slows him a little. `Icicle` and `Comet` shatter a Chilled boss for `1.5×` (frozen trash takes `3×` and `2×`), with the same `Shatter` text, flash and sound. With **Shatterlance**, Comet hits a Chilled boss `2×`; **Rimebone 2pc** gives back half of Comet's cooldown on a Chilled boss too; the **Gravefrost Staff**'s Comet Chills a boss for `2s`.
- `Charge` and the **Gravedigger**'s tremor leave a boss **Staggered** for `1s` (stars over his head and a `Staggered` callout). It is not a stun: he keeps swinging and his telegraphs stay. It counts as a stun for `Cleave`'s Crush (bosses are heavy, so Cleave crushes them anyway) and for **Headsman** (every hit crits).
- `Slam` taunts a boss and spins its whirlwind through him, with no drag. A perfect block still stuns a boss for `1.6s`. Blizzard and frostbolts hit a boss but never slow him.
- A bot mage steps into Rime burst's reach at a calm moment (the boss is on the tank, between moves, and nobody is caged), Chills him, then steps back out (`chillTarget` in `src/dungeon/bots.js`).

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

**Thimblebriar Hollow (dungeon 2, Tier II): bombs you knock back.** A gnome family's burrow, half mushroom cellar, half brass workshop: seven round chambers joined by short tunnels that zig-zag up the map (`src/content/thimblebriar/`). Tuned for the Barrow's epics (power 1.72), where Rare gear wipes.
- **Bombs** (`src/dungeon/bombs.js`, a shared part; who throws them is `signature.js`): a bomb is lobbed at a spot, lands and ticks for 3s (a ring runs down round it, and its blast fills in red on the floor), then blows: a circle about 110 wide that hurts any hero in it. **Any hero's hit knocks it** (a swing, a spell, any button; your own swings and shots go for a red bomb in reach first): it turns gold and flies back at whoever threw it (about 260 away from you if they're gone), blows where it lands on the mobs, never the heroes (`threat: 0.3`, so it doesn't turn a boss on you), and a gold blast beside a boss opens him up (`Exposed` 2.5s). A gold blast knocks any red bomb in it on too (Chain Reaction). **Bat it back:** a bomb thrown at the tank shows a gold circle under him; shield up just as it lands (a perfect block) and it flies straight back and blows on its thrower before it ever ticks, staggering him. Bombs are mobs that never fight (`thing`), so every button's hit lands on them unchanged.
- **The Sticky Bomb** (a curse in orange, `stickBomb`): stuck on a mate of the tank's for 4s. Only the healer swipes it off (or Sunburst), and it flies back and blows on whoever stuck it (`Exposed` if a boss). Missed, its hero drops to a tenth of their health and mates within 120 take 130 (the tune scales it); it never kills on its own. The frames and the swipe hint work as they do for curses.
- **The new enemies:** the **Bombwright** (a gnome tinker) hangs back, lobs a bomb at whoever it's after every 4 to 5 seconds and sticks a bomb on a mate of the tank's every 11 to 14; the **Waddlecap** (a walking toadstool) bursts into a spore cloud when it dies (about 120 wide, 5 seconds): the tank drags the pack out of it. The rest are the shared kinds as gnomes and brass (the Scrapper, the Slinger with its cogs, the Brass Stomper).
- **Old Toadstool**, the mini boss (about 40 seconds; faster from half health): **Cap Slam** (a heavy circle on the tank: block it, a perfect block knocks him dizzy), **Puffball Volley** (a puffball at everyone's feet: knock them back into him, each one opens him up) and **Spore Burst** (the whole party, nobody dodges: the healer heals through).
- **The Tinker King**, the final boss (about 80 seconds, two phases, in the round Grand Workshop; he wakes when someone is well inside it, `wakeIn`): **Wrench Smash** (a heavy circle that follows the tank: block it), **Bomb Barrage** (four bombs round the workshop, half near the party: knock them back at him) and the **Sticky Bomb** (the healer's). At half health his suit cracks open (`phaseSprites`): the Barrage every 11 seconds instead of 16, and two Sticky Bombs at once. His clockwork arms swing fast, so the healer's mana is the race: in the Barrow's epics it lasts, in Rare it runs dry.
- **Tune:** `hit: 3.0, trashHp: 4.7, bossHp: 1` (the bosses' health is written for power 1.72); Heroic `hit: 4.6, trashHp: 6.5, bossHp: 2.6`, made for Thimblebriar's own epics (bots in its full kit clear it in about four minutes without wiping).

| Role / Class | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| Tank (Warrior) | Cleave: fast front sweep, Crush bonus on heavy/stunned/clumped foes, 2.2s | Charge: dash, hit, taunt and stun nearby foes (a boss Staggers), readies Cleave, 6.5s | Slam: drag nearby foes in (never a boss), taunt for 4s, spin a 360° whirlwind, 6s | Shield (hold): a perfect block stuns, counter-strikes, exposes the attacker and resets Cleave |
| Healer (Cleric) | Prayer circle, 5s | Ward, 3.8s | Sunburst: heals everyone in reach, clears roots and lifts curses, 13s | Smite: heals your most hurt ally for the damage dealt, pulses Prayer circles and gives mana back, 2.4s |
| DPS (Mage) | Blizzard, 7.8s | Rime burst: freezes nearby mobs (a boss is Chilled), 11.5s | Comet: 0.9s cast, double damage on frozen mobs, 1.5× on a Chilled boss, 5.6s | Icicle: instant, triple damage on frozen mobs, 1.5× on a Chilled boss, 2.6s |
| DPS (Rogue) | Viper Blades: single-target twin-dagger slash + 5.5s Viper Venom, 2.3s | Shadowstrike: single-target execution thrust, guaranteed crit + 35% bonus damage on poisoned targets, 3.4s | Fan of Blades: modest 360° throwing-knife spin + enemy cast interrupt + refreshes active venom, 6.0s | Shadowstep: blink through shadow behind target, interrupt casts, +35% attack speed for 3.8s, shaves 2s off Shadowstrike, 5.5s |

## Talents (retired in favor of Gear, Set & Boss Weapon Ability Buffs)

Skill trees and hero levels are omitted so that **Gear alone drives damage, healing, health, and ability fantasy**. Every class's 4 buttons are balanced out of the box, and Dungeon / Heroic Boss Weapons and 3-piece sets transform and buff how those 4 buttons work:
- **The Gravedigger** (Tank): Every fifth swing digs in with a stunning tremor (a boss Staggers), and `Charge` resets `Cleave`’s cooldown.
- **Lantern of the Long Night** (Healer): `Mend` wards its target for 60, and `Sunburst` sears nearby foes for 90 holy damage and wards the party for 75.
- **Gravefrost Staff** (Mage): `Comet` freezes everything it hits for 2 seconds (a boss is Chilled), and `Rime burst` resets `Icicle` and leaves a 3s frost storm.
- **The Cryptfangs** (Rogue): Every fourth twin-dagger slash strikes twice and refreshes Viper Venom, and `Shadowstep` resets `Shadowstrike`.

## Heroes, Warband and Alts

A hero is one race and one class, picked when you make them and fixed after. You can have six, and the one you play stands by the fire on the Hearth.

- **The Warband opens later:** a new player has one hero. Until every dungeon has been cleared once (each one's Normal: the Barrow and Thimblebriar today), bots in plain gear at your hero's level take the other two seats, the bunk room's empty bed is locked (a padlock and "Warband"; tapping it says which dungeons are left), Your heroes and Who goes in say the same, and the welcome tour skips the bunk room (two steps, not three). The clear that opens it says so ("Your Warband is open"), and the next visit to the door shows the Your Warband tip. Once open it stays open (counter `warband.open`), so a dungeon added later never shuts it. Saves that already have more than one hero, and anyone who has earned a new race from a log, have it open. Why: you fall for one main first; alts come because you want more, not as homework. As built: `src/meta/warband.ts` (`warbandOpen`, `warbandLeft`, `openWarband`, `warbandWhy`), used by `createHero`, `seatsFor` and `doorTip`; `tests/warband.test.ts`. Built 17 Oct.

- **The bunk room & Warband party seats:** every hero you aren't playing waits by their bed in the house. Tap one to play them, check their gear, rename them (once) or let one go (the last one stays); an empty bed makes a new hero. When you enter a **Normal** dungeon, your own heroes from your bunk room (`seats(p, false)` in `src/meta/party.ts`) automatically fill the other two role seats wearing their real equipped gear, sets, traits, unique weapons, and sprites (bots, Brannoc, Maren and Ivy, stand in only for roles you haven't created a hero for yet), or you can group with friends. **Heroic** needs at least two real players (`partyProblem` in `src/meta/party.ts`); with two, a bot takes the third seat, and your Warband heroes never sit in (`seatsFor`). With no online play yet, Heroic stays locked, except with the "Everything open" testing switch.
- **Each hero keeps:** their regular gear (the Common to Rare ladder), their equipped uniques, their title and their clears.
- **Every hero shares:** the collection (a unique fits any hero of its role), kill counts, achievements, titles and the Hearth.
- **Shared gear:** a floor per role, up to Rare. Spare pieces and your own ladder raise it, and every hero of that role can put it on, including heroes made later (a new hero starts wearing it). Epic is earned on the hero.
- **Nothing goes on by itself.** A new piece waits for you, and its slot in the armoury says New. Your hero's tag at the top of the house counts what's waiting, and so do the chest reveal's Gear button and the armour stand. A ladder piece (and the shared floor) waits in the hero's bag; a new unique waits in their `fresh` list and glows until you've looked: once you move on from its slot in the armoury it stops glowing and simply stays yours to wear (`seenSlot`). A drop's sheet holds it up against what its role wears (`compareOn`): better is more Power or a new effect with nothing lost, worse is less or an effect lost for nothing, and both at once is a trade.
- **The armoury** is a hero's gear on one page, in three tabs (`src/ui/armoury.ts`, its card in `armourycard.ts`). It opens from the armour stand, your hero's tag, a hero's sheet, the chest's Gear button, or a drop's Put it on (on that piece). Gear: the hero in their race's light with their Power and what it adds up to (and Play as them, if you play someone else); their four slots in a row, each with its Power, a set's count or the unique star, New while something waits, and a green arrow while something you have still beats what's worn (`betterFor`); the picked slot's row of everything the hero has for it (`shelfFor`), the uniques still to find dimmed at the end with their drop rate; and the picked piece's card: the verdict and three numbers of the collection log's closer look, the set it joins or breaks with each bonus On, Turns on, Turns off or how many more it needs (`setChange`), what it adds, takes away or keeps, and where it drops (first, for a piece not found yet) and when you got it. Pieces show as they look (gilded, once their kit is yours), and a card has the Plain / Gilded switch when it can. The weapon's trait sits under its card: pick one of three, free to swap (`weaponTrait`). One button at the bottom, Put it on (gold unless it's a downgrade; one rule for anything in the row, `wear`), and a second tap on the picked piece does the same: the page scrolls up, the slot bursts and the Power counts up, and then Next new goes to the next slot with something waiting. Only your next tap moves: New bobs on a slot or a piece you're not on yet, and when the piece you're on is new (and not a downgrade) Put it on glows and every New holds still (since 16 Oct, replacing a New that bobbed on the very piece you were looking at while the button that put it on sat still). Your other heroes' faces sit in the corner with how many slots have something new (three fit, then a +N for all your heroes). Abilities: the four buttons and what your gear does to each, then what's always on. Looks: every title (yours first, each saying where it came from, with Wear it; the rest with exactly how to earn them) and the looks. Built 16 Oct, replacing the gear doll and its pop-up compare.
- **Races:** Dwarf, Elf and Human from the start. Gnome, Goblin, the Risen (undead) and Orc are earned, each in its own dungeon: the Risen from filling Barrow Crypt's whole collection log, the others with dungeons to come. The hero maker shows how close you are to each.
- **Classes:** Warrior (tank), Cleric (healer), Mage (ranged AoE/Shatter DPS) and Rogue (fast melee single-target venom/crit DPS with permanent +10% movement speed and twin daggers as a single pair item). That's all four.
- **Drawn today:** Dwarf Warrior (tank), Human Cleric (healer), Elf Mage (DPS), Human/Elf Rogue (DPS), and Gnome, Goblin and the Risen as all four classes, both sexes and all three armour tiers (`_rags`, `_iron` and full armour). The rest show in the hero maker as Soon.
- **Old saves:** became one hero, named for the role you last played, with a one-time rename.
- **Who can be made:** a race and class combo is playable once it has a ready class and art in `HERO_ART` (`HERO_ART_SEX` for male and female variants, keeping the same body and armour silhouette) and its race is open; the rest show as "Soon". An earned race (gnome, goblin, the Risen, orc) opens with the achievement that gives it (`reward.race`) and stays locked until a dungeon does (or the testing switch or the hero maker's `Unlock` preview button is used).
- **Also per hero:** their own male or female look (`sex`). **Also shared:** the garden and the cauldron (`p.vale`).

## Home: the house

Home is a tall house on the hill, cut open like a doll's house. Built 14 Oct after a play test where a new player tapped Ride out first because it looked like the main button.

- **Zoom:** pinch or scroll. The house opens zoomed out, the whole house in view with a sign on each room, every time you come home: on load, after a run, and when you close something you opened from there (something you opened from inside a room leaves you in that room). Zoomed out, tap a room to go in; a room with one clear job opens it too, as the camera lands: the cellar the Dungeons, the yard the garden (the bed you tapped, or a ready bed first, then an empty one you have a seed for, then the one nearest ready), the brewing room brewing, the bunk room your heroes, the armoury your gear, the paddock every mount. The hall and the trophy loft, with several things each, just zoom in. Zoomed in, tap things to use them. Built 16 Oct, replacing "it opens on the hall, and zoomed out a tap only goes into a room".
- **Your hero's name tag:** your hero by the fire has a small name tag over their head, their name and title, the same size at any zoom so it reads from the whole house, bobbing gently. It hides where it would cover the top bar or the Dungeons button, and while the tour points at your hero. Your other heroes by their beds don't get one.
- **Your heroes and the mounts:** the bunk room opens a list of your heroes (the one you play first; tap one for their sheet, or make a new one), and the paddock a page of every mount in the game (yours lit up, the rest dark with where they come from; tap one for its card).
- **One big button: Dungeons.** Everything else is a thing in the house: the Barrow door in the cellar, the 3 garden planter beds in the yard, the armour stand (gear), the big book in the trophy loft (the collection log), the cauldron and the larder (the satchel). Your hero's tag at the top opens gear too.
- **Rooms:** the trophy loft, the bunk room (your other heroes), the armoury, the hall (your hero, the fire, the mantel), the brewing room (the whole ground floor, with the door out to the garden), the cellar with the Barrow door and two bricked arches for dungeons to come. Outside: the yard on the left (with the 3 planter beds) and the paddock on the right.
- **The paddock:** a fenced field at ground level, right of the house, with a trough and hay. Every mount in the game has its own place in it. The ones you own stand there and wander a little; the ones you haven't got are a shadow with a "?", like the collection log. Tap a mount for its card: its name, where it drops, its rate, and the kill count you got it at. It replaced the indoor stable (16 Oct): a mount that was in the stall is in the paddock, nothing lost. As built: `MOUNTS` and `paddock(p)` in `src/meta/hearth.ts`, the places from `paddockSlots` in `house.ts`, in the order the game lists them; the wandering is CSS only, and a tap opens the mount's card (`itemSheet`). It reads the collection, so a mount that was in the old stall (or the garden's spot) is simply there; the save keeps its old spot keys and needs no migration.
- **Kept light enough for a phone:** the house is a big picture, and an iPhone (inside the Claude app most of all) leaves parts of it blank when it runs out of room. So on a tall screen the world is clipped to its own box (the wide sky, hills and ground are only for wide screens), the world is never drawn sharper than zoom 0.8 (`SHARP_MAX` in `camera.ts`: past it, it's scaled up as a picture) and never at more than 2x pixels (a 3x phone gets 2x scaled up, like the dungeon). The dungeon's sprites keep their SVG only until they're baked (`art.js`), and the tinted copies (flash, frost, gold) are let go when a run ends. Fixed 17 Oct after the house went blank in patches on an iPhone. The back layer (sky, hill, walls, frame and furniture: over a thousand shapes, plus the outer walls' cut edges) is no longer a live drawing: it's drawn once into a picture of the whole house, kept as plain pixels, and the camera only slides and scales that, so the house never paints itself in patches as the camera moves or stops. Each room's light, which warms your heroes and the things in the room, is a second, soft picture of just the house, over them. Zoomed into a room, a sharper picture of just what's on screen is drawn and faded in over the whole one: as a flight to a room sets off (so it's ready as the camera lands), or when a pinch or drag stops (a short pause, about 50 to 100 ms on a slow phone). It stays when you zoom back out and is only ever swapped for a new one. Each picture holds at most 4 million pixels; the sharp ones are let go when you leave the house, and the whole ones stay so coming home is instant. Its gradients stay live in a tiny SVG (`.h-defs`), since the rooms' things and the fireflies use them too. As built: `src/ui/housepaint.ts` (`houseWalls` and `houseLights` in `houseart.ts`), fed by `paintWhole()` and `aimed()` in `hearth.ts` (the camera's `onAim` and `onRest`). Fixed 17 Oct after the house glitched its way onto the screen on Android.
- **Life around the house:** smoke climbs out of the chimney, a few birds cross the dusk sky about once a minute (in an arc over the roof and past the moon), and fireflies blink over the garden and the paddock. Built 16 Oct. As built: `smoke()`, `birds()` and `fireflies()` in `src/ui/houseart.ts`, moved by CSS only (`styles.css`). Like the fire, each is a few frames drawn once, taking turns on one slow beat (a new frame every 0.45s), and each is its own small picture the browser shows, hides and slides on its own, so the house never redraws for them (standing still, they add no work on the page's main thread and no repaints; measured 16 Oct). With reduced motion each holds one frame and the birds stay away.
- **Trophies everywhere:** about 30 spots: the mantel, the loft's shelves, banners on the walls and the roof's flagpoles, pets by the fire, on the rug, on the table and in the loft. Decorate shows the empty ones; the rest of the time they're hidden.
- **Dungeons** (the big button or the Barrow door): the door. Your three heroes stand in front of the dungeon's door in their own gear, faces towards you, with its final boss in the doorway (each dungeon's `stage.ts`). You are ringed in gold; your own Warband heroes from your bunk room take the other seats (or bots, marked Bot, until you make them). Tap a hero's name plate for Who goes in: every hero by role, who you're playing and who comes along; tap one to play them, or an empty bed to make one. Under the door, the collection log line (it opens the Loot page; on desktop the loot sits beside the door) and one brew button (it opens Your brew: every bottle with all it does). Then one gold button, Enter the Barrow, with a line over it: the dungeon's recommended Power and yours ("Recommended Power 22 · Orvik 10"), your number red when you're short and a green tick when you have it (`powerLine` in `dungeonsheet.ts`; a Heroic has none yet). All dungeons shows the same line on every card. The dungeon's name at the top opens All dungeons, a card per dungeon under its season's name (Season 0 for the first three), and under the name a small Season 0 tag sits before the tier. The first time you open it (on Normal), a Your Warband tip sits under the door and the other seats glow: your other heroes fill them in their own gear, a bot stands in until you make one (its button makes one for that seat and comes back here), and better gear on them makes runs faster. Your first bottle gets a Your Brew tip by the brew button. The door gives up the tip's room, so it still fits a phone. The sheet keeps to five type sizes and nothing under 12px, a black line with a shadow only on what you can tap, and 44px targets, and the door fits a phone without scrolling.
- **Under-powered, warned once:** tap the gold button with the hero you play below the dungeon's recommended Power (`recIlvl` on its `DungeonInfo`: the Barrow 10, so a fresh hero is never warned there; Thimblebriar Hollow 22, the Barrow's epics it was tuned for) and a warning takes the button's place: "You're Power 14. Thimblebriar wants Power 22. You'll very likely be wiped." (a whole rarity short or more, where the bots wipe in most runs; "You might be wiped." when less), with Back and Go anyway. It's a warning, never a lock (all three Season 0 dungeons are open from the start). It shows once per tap; Back, Escape or going anywhere else on the sheet puts it away; and after Go anyway that dungeon lets you straight in until the page is reloaded (`braved` in the sheet's `DungeonPick`, never the save). A Heroic has no recommended Power yet, so it never warns. As built: the rule is `underPowered` in `src/meta/party.ts` (your Power, the dungeon's, how far short, and whether a wipe is likely), drawn by `warning()` in `src/ui/dungeonsheet.ts`; `tests/power.test.ts` checks both. Built 17 Oct.
- **Looks:** Decorate, then Looks: pick a look and put it on a room or the whole house. Looks only; everything you placed stays where it is.
  - **Tavern:** the default. Wood, plaster, lamplight and a crackling fire.
  - **Barrow Hall:** opens when you fill the Barrow's whole collection log, and shows how close you are until then. The Barrow's own brick and flagstones, burial niches with skulls, green lanterns, the Gravekeeper's green fire in the hall, a coffin in the armoury, a gravestone in the brewing room, wisps in the cellar. Put it on the whole house and the beams and outer walls turn to stone and the roof to slate.
  - **Gilded Barrow Hall:** from the heroic Barrow's log. Gold bones, gold frames and lanterns, the green fire burning higher.
  - **Toadstool Workshop:** from Thimblebriar Hollow's log. Wood planks and moss, brass pipes and cogs, toadstool lamps, a brass hood over the hall's fire, a copper boiler puffing steam in the brewing room, dug earth, roots and glowing spores in the cellar. On the whole house, the frame turns to dark timber with a turf roof and a stone chimney (`src/ui/houseworkshop.ts`).
  - **Gilded Toadstool Workshop:** from the heroic Hollow's log. Brass and toadstool caps turn gold, every toadstool lit, the lamps and fire warmer.
  - Every dungeon brings a look like this, and a gilded one from its heroic log.
- **Next:** rooms that come with new dungeons (the cellar's bricked arches become new dungeons' doors).
- **The plan is data** in `src/content/house.ts`: the rooms (each with an optional `main`, what it opens when tapped from far away), the things you tap, the display spots and the paddock's places. Zoomed out, a tap goes into a room and opens its `main` as the camera lands; zoomed in, a tap uses a thing. Which bed the garden opens is `bedToOpen` in `src/meta/vale.ts`. The house remembers whether what is open over it was opened from the whole house, and goes back out when it closes (`closed()` in `hearth.ts`, called by the sheets, the garden's card and the way back from the cauldron); a run, the hero maker and loading come home to the whole house (`home()`). The hearth's first eight spot ids never change (bar `mount.stall`, gone with the stable); a spot a save has never had takes what isn't on show when the save loads (`settleSpots`); a spot you emptied stays empty; something new goes to the first free spot of its kind (the hall first). Spots hold pets, trophies and banners; mounts have the paddock.
- **Looks, as built:** every room inside the house has a look (`p.hearth.looks`, room id to look id; a room not in it is the tavern). A look opens with the achievement that gives it (`reward.look`: finishing that dungeon's collection log); one you haven't earned is drawn as the tavern (the testing switch shows it). With every room in the same look, the frame (beams, outer walls, roof) follows it. What a look is lives in `src/content/house.ts` (`LOOKS`); how it's drawn, room by room, in `src/ui/houseart.ts` (the Toadstool Workshop's rooms in `src/ui/houseworkshop.ts`).

## The Garden & Brews

Instead of riding out to a separate map or waiting on real-time timers, the Hearth's outdoor yard holds **3 planter beds** (`bed.0`, `bed.1`, `bed.2`) that feed directly into the dungeon loop:

1. **Seeds from dungeon bosses:** Each dungeon drops its own seed from its final boss. In Barrow Crypt, The Gravekeeper drops **Glowcap** seeds (`1/5` on Normal, `1/3` on Heroic). Saves from before the garden were given one Glowcap seed to try it; a new player's first seed comes from the Gravekeeper (never on their first run). One-step tips show the way the first time (see Onboarding): the beds when the seed drops, the bed when it's ready, the cauldron when the herbs make a brew, and the brew button on the door with the first bottle.
2. **Grow in 3 dungeon clears (`GROW_CLEARS = 3`):** Tap an empty bed in the yard to plant a seed. Each Normal or Heroic dungeon clear advances all planted beds by 1 stage (`growBeds`; `0/3` sprout → `1/3`, `2/3` growing → `3/3` ready). The Crypt Trial does not advance beds, and crops never wilt.
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
- **One bottle poured at the door (`pourFor`):** Only **one** bottle is uncorked at the dungeon door for the whole 3-seat party (your hero's chosen brew first, then Tank → Healer → DPS). Even if multiple party members bring a brew selected, only the single poured bottle is spent (`spendBottle`), so teammates never waste duplicate potions.

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

**Power, on screen** (17 Oct): every screen calls a hero's or a piece's number **Power**, never item level or ilvl, and shows it as a whole number: Power 10 in Common, 22 in plain Epic, 26 for a Barrow set piece or boss weapon, 34 for Thimblebriar's. It is the weighted score (`score`, `itemScore`), rounded (`wholeIlvl` in `src/meta/gear.ts`; the UI's `ilvl()` in `hearth.ts`). The code and the save keep their own names (`score`, `ilvl`, `recIlvl`, `dropsIlvl`), and the damage multiplier the engine uses (`power`, `1.00` to `1.96` above) comes from it.

### The ladder

- 4 slots: Weapon, Helm, Shoulders, Chest.
- Rarity climbs Common → Uncommon → Rare (8 clears) → Epic (from dungeon 3-piece sets and Boss Weapons). Heroes start in Common rags with bronze or wood weapons; item icons go `_0` (Common), `_1`, `_2` to `_3` (Epic), and a hero is drawn in `_rags`, `_iron` or full armour.
- The weapon carries 40% of your power (`WEIGHT.weapon = 4` of `10`), so a Boss Weapon (`rar: 4`, `+38.4%` damage/healing and `+19.2%` health) is a massive power spike.
- Every clear drops a regular item better than the best you have in your weakest slot. No dead drops. It waits until you put it on. It also drops a shared piece for another role, up to Rare, so a new alt never starts cold.
- Tap any drop (in the collection log or the Dungeons sheet) to hold it up against what that role wears now: Upgrade, Downgrade, Same power or A trade, then what changes (Power, damage or healing, health, set count) and any effect it adds or takes away.
- The armoury lines up each slot the same way everywhere (`shelfFor` in `src/meta/gear.ts`): what is worn, then what waits to go on, then the rest of what you have, best first, then the uniques you haven't found yet. A slot keeps a quiet "something better" mark once its New glow has gone, while anything you have beats what is worn (`betterFor`).
- **No currency:** a duplicate counts in the collection log ("Seen 3×") and your weapon's trait swaps for free. The save still counts each dungeon's `marks` (1 per clear, 3 per duplicate), never shown or spent.

**Weapon traits** (unlocked at Rare, free to swap, and stay active alongside Unique weapons; one picked on a weapon still in the bag works once that weapon is on, `weaponTrait`)

| Role / Class | Trait | Trait | Trait |
| --- | --- | --- | --- |
| Tank (Warrior) | **Wide Swings**: swings hit everything in front at full damage | **Ringing Blow**: Charge hits twice and everything it hits turns on you | **Headsman**: hits on stunned mobs, or a Staggered boss, always crit |
| Healer (Cleric) | **Sunflare**: Mend splashes half to the next hurt ally | **Quick Hands**: Mend recasts faster | **Kindle**: a Ward that breaks heals for 80 |
| DPS (Mage) | **Shatterlance**: Comet on frozen mobs hits 3×, on a Chilled boss 2× | **Splinter**: frostbolts split to a second mob | **Quickfrost**: Comet casts twice as fast |
| DPS (Rogue) | **Twin Venom**: twin-dagger auto-attacks extend Viper Venom by 1.5s | **Venomrush**: Shadowstrike on a poisoned foe refunds 1.2s of its cooldown | **Nightstalker**: Shadowstep makes your next Shadowstrike deal +30% damage |

### How sets work

- Each dungeon drops sets per class/role in the Helm, Shoulders and Chest slots.
- Set pieces are uniques from the drop table below at Epic, Power 26 (`+19.2%` damage/healing and `+9.6%` health per piece), and each piece has its own immediate When-Worn ability perk even at 1 of 3 pieces.
- **1 piece (per-piece perk)**: each Helm, Shoulders and Chest piece immediately buffs one of your core abilities when worn.
- **2 pieces**: a set bonus that leans into your role's signature mechanic.
- **3 pieces (`ready: true`)**: changes how one button works with spectral/skeletal summons (`S.thralls`) or ghost saves. All four Barrow 3-piece bonuses are on: `barrowguard3`, `candlewake3`, `rimebone3`, `shadeveil3`.

### Barrow Crypt sets: raise the dead

| Set | Look | 2 pieces | 3 pieces (Active) |
| --- | --- | --- | --- |
| **Barrowguard** (tank) | Bone-white plate, skull shoulders, coffin-lid shield | Perfect blocks give you a 150 bone shield | `Slam` raises 2 skeleton thralls for 8s that slash nearby foes for 28 damage and soak 25% of hits on the tank |
| **Candlewake** (healer) | Black robes, candle crown, a lantern | Mend leaves a candle that heals 40 more over 4s | Once per fight per ally, fatal damage turns them into a fighting ghost at 35% HP (+25% damage) for 6s; `Prayer circle` also sears enemies inside for 32 holy damage per tick |
| **Rimebone** (Mage DPS) | Frosted bone crown, icicle shoulders | Comet on a frozen mob or a Chilled boss refunds half its cooldown | `Blizzard` rains bone shards (+30% damage) and raises a frost skeleton (on boss casts or mob kills inside) that slashes for 32 frost damage and slows for 6s |
| **Shadeveil** (Rogue DPS) | Shadow-stitched mask, bone-bladed spaulders, silent leather jerkin | Critical hits with Shadowstrike or Viper Blades erupt in shadow for 55 damage | `Shadowstep` leaves a shadow twin for 6s that slashes your target with twin daggers (34 damage every 0.55s) and refreshes Viper Venom |

### Thimblebriar Hollow sets: bombs and gadgets

Tier II, Power 34 (`tier: 2`, so a piece is worth 8 more Power than a Barrow one): a full kit is power `2.44`. Each piece makes one button better (`gearMul` in `src/dungeon/gadgets.js`); two and three pieces are gnome gadgets built round the bombs. A gadget's bomb is yours from the start and hurts mobs, never heroes; only a bomb knocked back or batted opens a boss up.

| Set | Look | Per piece | 2 pieces | 3 pieces |
| --- | --- | --- | --- | --- |
| **Clockguard** (tank) | Riveted brass plate, spring-coiled pauldrons, a ticking bulwark | Cleave +25% and a bomb you knock blows 50% harder; Charge +35% and a 90 brass shield; Slam +35% and 20 health per foe pulled | A perfect block winds a 150 brass shield | A perfect block drops a lit bomb of yours at the attacker's feet |
| **Sporebloom** (healer) | A glowing toadstool cap, an amber root mantle, a fairy-lantern censer | Mend +15% and 2 less mana; Ward +30% and 2s longer; Prayer circle +25% and 1s longer | Mend plants a spore that heals 45 more over 4s | Ward leaves a patch-up turret for 6s that heals the most hurt mate near it for 40 a second |
| **Arcspark** (Mage DPS) | A copper filament crown, coil shoulders, star-threaded robes | Icicle +25% and slows; Rime burst +40% and its freeze 1s longer; Comet +20% | Comet on a frozen foe or a Chilled boss arcs to 2 more (back into a boss on his own) for 140 | Comet splits into four small frost bombs that blow a moment later and slow |
| **Gearshade** (Rogue DPS) | A clockwork lens visor, spring-blade spaulders, a velvet burrower's coat | Shadowstrike +25%; Fan of Blades 25% wider and harder; Viper Venom +30% | A crit with Shadowstrike or Viper Blades throws a 55 spark | Viper Blades stick a little bomb on the target; Shadowstrike sets it off |

The Tinker King's weapons: **the Mainspring Maul** (Charge winds the spring: the next Cleave hits twice), **the Sporelight Censer** (Mend's spore bursts to heal everyone near it for 55; Sunburst sends every red bomb near you flying), **the Arcwright's Coil** (Icicle chains to 2 more foes, twice each into a frozen foe) and **the Fusecutters** (Shadowstep leaves a lit bomb of yours where you were).

### Sets by dungeon

Dungeons 2 to 4 are placeholder themes; their names come with the races pass. (Thimblebriar Hollow, built, is above; this older list still gives bombs to the goblins, which waits on its own pull request.)

| Dungeon | Set family | Tank, 3 pieces | Healer, 3 pieces | DPS, 3 pieces |
| --- | --- | --- | --- | --- |
| 1. Barrow Crypt | Raise the dead | Slam raises thralls | Dying allies become ghosts | Blizzard raises frost skeletons / Shadowstep spawns shadow twin |
| 2. Goblin dungeon | Bombs and gold | Perfect blocks drop a lit bomb | Ward becomes a patch-up turret | Comet splits into 4 frost bombs |
| 3. Fungal hollow | Spores and spread | Taking hits puffs out healing spores | Mend plants a bloom that bursts to heal the group | Kills in Blizzard spread the frost to neighbours |
| 4. Storm peak | Chains and speed | Charge chains to 3 more mobs | Mend bounces to 3 allies | Frostbolts chain to 3 targets |

**Decided and built: 4 slots**, so the weapon chase stays separate from the set chase.

## Loot

Loot runs on OSRS rules: every unique has its own drop rate, rare means properly rare, and a 1-in-2,500 pet is the flex: a bonus slot in the log (like the mount and dye), never needed to finish it. Each player rolls their own table on every clear, so nobody fights over drops.

**As built:** loot rolls the moment a boss dies (`resolveKill`): every line of its table rolls on its own, per player, and kill counts are per boss. A Heroic kill rolls its normal dungeon's table first, on that boss's normal kill count (what drops is the normal piece, for the normal log), then its own table, the gilding kits and gilded twins, on its own kill count (`kitTables` in `src/content/kits.ts`). A dungeon's seed lines (`seeds` on its `DungeonInfo`, each a `SeedDrop` of `{ boss, seed, rate }`) roll there too. Finishing the run (`resolveClear`) adds the clear: a ladder piece (Common to Rare in eight clears), a spare piece for another role, and a step of growth for every planted bed (`growBeds`). A run that doesn't count (the Crypt Trial, or one started for testing past the entrance or in test gear) gives nothing. The save still counts each dungeon's `marks` (1 a clear, 3 a duplicate; a heroic clear adds to its normal dungeon's), but nothing shows or spends them.

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

### Heroic Barrow Crypt drop table

A Heroic kill rolls the whole Barrow table above, line for line (the same pieces, for the Barrow's log, its kill count and your heroes), then this one:

| Drop | Rate | Notes |
| --- | --- | --- |
| A gilding kit for each of the 16 uniques (12 set pieces, 4 boss weapons) | 1/20 each, any seat | That piece's gilded look, for good and for every hero. Never power. The Heroic log is these 16 |
| Sir Rattlebones' Gilded Plume | 1/50 | From Heroic Sir Rattlebones; a bonus slot |
| Gilded Gravehound (mount) | 1/1,000 | A bonus slot |
| Pint-sized Gilded Gravekeeper (pet) | 1/2,500 | A bonus slot |

- About half of Heroic runs bring a kit (1 − (19/20)¹⁶ ≈ 56%). The whole Heroic log takes about 65 runs on average (about 4 hours), and 1 player in 10 needs about 100. The kit you want can still be missing after 60 runs (1 in 20): that's the dry streak story. `tests/heroic.test.ts` simulates it.
- Any seat can get any kit, so nobody has to change class for the Heroic log: you can't bring your Warband to Heroic.
- The Gravegold Dye (Heroic, 1/1,000) is retired: kits gild the set now. Whoever has one keeps it, and it still works.

### Thimblebriar Hollow drop table

The Barrow's rates, at Tier II (Power 34): its four sets (Clockguard, Sporebloom, Arcspark, Gearshade) at 1/35 a piece for your seat, the Tinker King's four weapons at 1/50 (the Mainspring Maul, the Sporelight Censer, the Arcwright's Coil, the Fusecutters), Old Toadstool's **Toadstool's Cap** trophy at 1/50, the **Sporeglow Dye** (your Thimblebriar set glows like mushrooms in the dark, looks only) and the **Clockwork Beetle** mount at 1/1,000, and the **Pint-sized Tinker King** pet at 1/2,500 (the pet, mount and dye are bonus slots). The Tinker King drops **Bramble** seeds for the garden at 1/5 (Heroic 1/3). Heroic Thimblebriar follows the kit rule: the Normal table above, then a gilding kit for each of the 16 uniques (any seat, 1/20 each) and the gilded cap, beetle and little king.

### The walkout

The final chest has a tell before the loot shows, and the game never explains it: once you know, you know.

| What you see after the Gravekeeper falls | What it means |
| --- | --- |
| His lantern rolls away and gutters out | A normal chest |
| The lantern stays lit and green, gold dust sifts down from it onto the chest, and the lid rings once like a little bell (Heroic) | A gilding kit is coming |
| The lantern stays lit, the flame swells gold, and the chest lid knocks twice | A unique is coming (on Heroic, gold dust and the bell after the knocks: a kit too) |
| Every light goes out except the lantern, the music cuts, and the lantern lifts off the ground by itself | The pet: when the lights come back, the pint-sized Gravekeeper is holding it |

- Tells never lie and never fake out, so learning them always pays.
- Every dungeon gets its own tell, so each new dungeon is something new to learn, and Heroic adds the kit's.
- The final boss's drops decide the tell (the pet beats a unique, a unique beats a kit), and the first second is identical for all of them on purpose. As built: `tellOf` and `gildOf` in `src/meta/loot.ts`, drawn by `src/dungeon/walkout.js`; the chest repeats it (a lit green lantern and falling gold dust).

**Thimblebriar Hollow's tell: the Tinker King's cuckoo clock** (`src/dungeon/cuckoo.js`, named by `walkout: 'cuckoo'` in its engine def; on the same clock and moments as the lantern):

| What you see after the Tinker King falls | What it means |
| --- | --- |
| His cuckoo clock drops, ticks a few times, slower and slower, and stops | A normal chest |
| It keeps ticking, lit, and gold dust sifts down onto the chest, and the lid rings (Heroic) | A gilding kit is coming |
| Its light turns gold and the cuckoo pops out twice, in gold, as the chest lid jumps | A unique is coming |
| It strikes midnight, every light goes out, and the cuckoo flies down carrying the little Tinker King | The pet |

The chest's picture repeats it (`TELL_SPRITES` in walkout.js: the stopped clock, the lit one, the gold cuckoo), with the clock's own sounds.

## Heroic

Every dungeon has a harder version, its Heroic, for after the gear cap. Heroic = Normal loot + gilding kits. It never gives more power, and it never gates the next dungeon.

- **Opens** after 10 clears of the dungeon, about when your gear tops out. The Dungeons sheet switches between Normal and Heroic on the door; until it opens, it shows how close you are.
- **Built as** its own `DungeonInfo` (`heroicOf` the normal one) that opens after `HEROIC_AFTER` (10) clears of the normal one (the testing switch opens it early): the same bosses, and its own tables of kits and gilded twins, built from the normal dungeon's by `kitTables` and `kitLog` in `src/content/kits.ts` (the template's `makeHeroicDungeon` uses the same, so every new dungeon gets this shape).
- **Players:** Normal can always be played solo with your Warband heroes, or with a group. Heroic needs at least two real players; with two, a bot takes the third seat, and your Warband heroes never sit in (`HEROIC_MIN_PLAYERS`, `partyProblem` and `seatsFor` in `src/meta/party.ts`); the players come through Group Finder or friends once online play is live. There is no online play yet, so Heroic stays locked (the "Everything open" testing switch lets you in): on the Dungeons sheet the other two spots at the door are dashed and marked Friend, one line says "Heroic needs 2 players. A bot fills the last seat.", and the gold button stays locked.
- **Harder:** the same dungeon and mechanics, plus the Crypt Seals and the Gravekeeper's full three-phase fight (Normal has two), made for full Epic (`hit: 2.8, trashHp: 1.95, bossHp: 1.63`). Bots in full Epic clear it in about four minutes without wiping; in Common they get buried.
- **Normal loot:** a Heroic kill rolls the normal dungeon's tables line for line, at the same rates and role locks. Those drops are the normal pieces: they fill the Normal log and go on your heroes like any Normal drop, so grouping up is never a worse evening than playing solo. The kill counts on the normal boss's kill count too (its table rolled); Heroic keeps its own kill count, clears and best time.
- **Gilding kits:** then the boss that drops a unique rolls its kit, one per set piece and boss weapon, for any seat at 1/20 (`KIT_RATE`). A kit isn't gear and never goes in a bag: when it drops, that piece's gilded look is yours for good, for every hero (`KITS`, its id the piece's with `.gilded` on the end).
- **The gilded look:** a new kit starts gilded, like every look. On the item sheet and on its card in the armoury, a piece you own whose kit you have switches between Plain and Gilded (`setGilded`; plain is the kit's id in `looksOff`). Same power either way. Gold shows on the gear doll and the armoury (`lookId`), the chest, the log's stands and close-ups, and in the dungeon: wear a gilded piece and your hero shines gold (the Ghostly Dye wins if it's on).
- **Heroic's log:** the kits. The gilded pet, mount and plume are bonus slots. Finishing it gives Gilded Barrow Hall, the Undying and Gilded Bones.
- **The Gravegold Dye** is retired: kits gild the set now. It no longer drops; whoever has one keeps it, and it still turns a Barrow set gold in the dungeon.
- **Achievements:** a heroic clear counts for the dungeon's own achievements.

## Collection log rewards

Filling a dungeon's whole collection log (every drop for every role, so it takes a tank, a healer and a DPS of yours) is the long chase, and it pays out for keeps. Each log gives a look for the house, a title, and one big prize that stands on a plinth at the top of the log.

| Log | Big prize | House look | Title |
| --- | --- | --- | --- |
| Barrow Crypt | **The Risen**: a new race, skeletons who came back from the Barrow, as any class | Barrow Hall | the Gravewarden |
| Heroic Barrow Crypt | **Gilded Bones**: your Risen heroes' bones turn to gold | Gilded Barrow Hall | the Undying |
| Thimblebriar Hollow | **The Gnomes**: a new race, as any class | Toadstool Workshop | the Clockwork Knight |
| Heroic Thimblebriar Hollow | **Gilded Gnomes**: your Gnome heroes turn to gold, skin, hair and metal | Gilded Toadstool Workshop | the Arch-Tinker |

- When the last slot fills, the chest reveal gives it the whole screen: the prize walks out, then a panel with what the log gave and the way to it (make a hero, put up the look).
- The Dungeons sheet shows each log's bar with its prize at the end, and what finishing it gives; the collection log puts the prize on its plinth.
- Not every dungeon's prize is a race. With a lot of dungeons to come, a prize can be a race, a race and class combo (a Dwarf Mage, say), or something else.
- **As built** (`src/meta/logs.ts`): filling a dungeon's whole log (`logDone`; its `bonus` slots, the pet, mount and dye, don't count) earns its log achievement (tier `log`, checked whenever something new arrives). Its reward gives a title and can open a house look (`reward.look`), a race (`reward.race`) or a collectible (Gilded Bones, Gilded Gnomes: a collectible with `gilds` draws that whole race in gold, its `_gilded` sprites, while it's yours and switched on; `heroSprite` in `src/ui/art.ts`). Earned stays earned, even if a slot is added to the log later.

## The collection log

The log is the trophy room of the chase: OSRS's log with WoW's wardrobe. Every slot shows its rarity (its colour and its word: Epic, Unique, Bonus, Trophy), its drop rate always, and once it's yours the kill count you got it at and how often you've seen it ("Seen 3×"). A slot you haven't got is faded or a dashed ghost, never blacked out: you always see what you're after.

- **A page per dungeon's log.** The log opens straight on a dungeon's page (the first whose log isn't finished); chips switch to the garden's harvests and the other rewards. On the page:
  - **The prize stage:** the log's big prize on a plinth (the Risen, dimmed until earned, with how many slots are left on its plaque), the count in big numbers, a bar with a notch per slot, what finishing gives, the kill counts and the best clear. A Normal / Heroic toggle across the top of the stage (its thumb slides to your side, gold for Heroic) turns the page into the heroic log, in gold with gold outlines, and says what Heroic is: the Normal loot plus gilding kits, each turning one piece gold for good, at the same power. Its stands hold the kits (the pieces gilded), and its shelf the gilded plume, mount and pet, all bonus slots. A finished log lights the prize up and offers its way in: Make a Risen, Put up the look.
  - **The wardrobe:** each set on its own armour stand, its role's boss weapon leaning on it, and its class's badge in the corner (ringed in the role's colour). The pieces you've found are on the stand; the rest are dashed outlines. Under each stand, a tile per piece with a tick or its drop rate; a New ribbon when something arrived, a gold rim when the set is done. A stand opens its set's page; a tile opens a closer look.
  - **The trophy shelf:** the dungeon's trophy and its bonus pet, mount and dye, as their own pictures on a plank, with their rates or kill counts.
- **A set's page:** its stand big with its badge; Try it on shows the whole set in colour (with a Preview stamp); its 2- and 3-piece bonuses, lit when you have the pieces; and a row for every piece with its rarity, slot, rate and effect, and the kill count and date you got it.
- **A closer look:** tapping any slot (a tile under a stand, the shelf, a set's row, the garden's and other pages) opens a card at the bottom of the sheet, over the page and never the whole screen: the thing's own picture big in its rarity's light (a piece you haven't got in full colour, with Not yet), its rarity word, what it is, and when you got it or where it drops (its rate, the boss, your kill count). Gear then has its stats (Power, damage or healing, health), each with how it changes what its role wears now under the verdict (Upgrade, A trade, Wearing it), what it does when worn, and its set's two bonuses lit by how many you have. A gilding kit instead says what it gilds, never power, and whether your piece is gilded. Buttons: Put it on (a piece you own and aren't wearing), The set, and Details (the compare sheet, where a piece with its kit switches between plain and gilded). Tap outside, the close button or Escape closes it, and you're back where you were.
- **In the chest:** a piece the log didn't have gets a moment after its card turns: its stand comes up and the piece drops on, with its rarity, rate and kill count, the set's count (or "set done") and the log's strip ticking up. Tap to carry on; Skip skips it; duplicates don't get it, and a pet or a mount keeps its own big moment. The summary's log strip shows the count going up and opens the log on that set.
- **The art:** the stands are drawn in `tools/art_wardrobe.py` (`art/wardrobe.json`): one bare stand, and every set piece and boss weapon as its own layer with a silhouette and details, and its box for showing it on its own. A missing piece is one dashed line round its whole silhouette (the silhouette masks out its own line, so overlapping shapes don't show) with a faint fill. Each set is drawn from its written `look`, and the set icons are cut from the same pieces, so a tile and its stand agree. A gilding kit is drawn as its piece through `gild()`.
- **As built:** the page is `src/ui/logbook.ts` (the Logs sheet in `logsheet.ts` hands it the collection tab and has its buttons, `logActions`); the closer look is `src/ui/logpeek.ts`; which pieces go on which stand and what goes on the shelf are `standsOf` and `shelfOf` in `src/meta/logs.ts` (a test checks every slot of a log shows exactly once), and `markSeen` there takes the New flags off once the log has shown them; a stand is drawn by `standSvg` and a piece on its own by `pieceSvg`, both in `src/ui/art.ts`; the chest's moment and strip are in `src/ui/reveal.ts`. Nothing new in the save: the log reads `p.collection` (count, kill count and date per find) and `p.seen`.

## Achievements

Each dungeon has 12 achievements that pop mid-run and pay out in looks, titles, trophies and pets, never power. Earn all 12 in Barrow Crypt and you're Master of the Barrow.

- Three tiers: **Bronze** (just play), **Silver** (play well), **Gold** (master it), plus a few hidden ones.
- Each one pops with a badge, a sound and a little burst; the chest lists every one the run earned.
- Achievement points add up to one bragging number, and trophies go on the Hearth's mantel.
- **Every one says why, the same way everywhere:** what you did, in one plain sentence; what you got, each thing named with where it went; and where to use it (a title has Wear it right there, anything else a tap to see it).

| Tier | Achievement | How (as the game says it) | Reward |
| --- | --- | --- | --- |
| Bronze | Into the Barrow | Clear Barrow Crypt. | Trophy: Barrow Key |
| Bronze | Rattle Me Bones | Your party kills 500 skeletons in Barrow Crypt. | Title: Bonebreaker |
| Bronze | Wisp Swatter | As the healer, swipe away 50 of the Gravekeeper's wisps. | Look: Wisp-light Trail |
| Bronze | Chain Snapper | As the healer, cut 10 of the Gravekeeper's Soul Chains with a swipe. | Trophy: Broken Shackle |
| Silver | Nobody Left Behind | Clear Barrow Crypt with nobody in your party dying. | Banner: Party Banner |
| Silver | Wall of Bone | As the tank, perfect-block every Shovel Smash in one Gravekeeper fight (3 or more). | Look: Golden Shield Rim |
| Silver | Not On My Watch | As the healer, save 5 mates in one Barrow Crypt run: heal each one while they're under 15% health. | Look: Dawn Staff Glow |
| Silver | Big Number | As the DPS, land a crit of 1,500 or more in Barrow Crypt. | Look: Ice-burst Crits |
| Silver | Armour On | Kill Sir Rattlebones while the skeletons from his Rally the Dead still stand. | Title: Knight-breaker |
| Silver | Jailbreak | As the tank, tap your way out of a Gravekeeper cage in under 1.5 seconds. | Trophy: Bent Bars |
| Gold | Gravedigger's Sprint | Clear Barrow Crypt in under 2 minutes 50 seconds. | Title: the Quick |
| Gold | Flawless Barrow | Clear Barrow Crypt with nobody dying, and nobody hit by Grasping Hands or a ring from his Burrowing. | Trophy: Golden Skull |
| Meta | Master of the Barrow | Earn all 12 Barrow Crypt achievements: the bronze, silver and gold ones. | Title: the Barrow-born, and the Lantern Ghost pet |

Hidden: **Bravely Stupid** (go in alone as the DPS and fall before the first pack is beaten), **Last One Standing** (kill a boss while you're the only one in your party still up), **Lucky Dig** (get the boss pet). Thimblebriar Hollow's twelve and the garden's are in their `achievements.ts` and `garden.ts`, written the same way.

- **As built** (`src/meta/achievements.ts`, the screens in `src/ui/achcard.ts`):
  - **What you did:** every achievement's `how` is one plain, exact sentence: the dungeon, a move by its name in the game, and the seat when only one seat can do it (only the healer swipes, so Wisp Swatter and Chain Snapper are the healer's, marked `role`). A count that adds up over every run just says the number; the page adds "so far". `checkContent()` fails any how that isn't one sentence short enough for a toast (`HOW_MAX`), and any achievement without a place (a dungeon or the garden, `placeName`).
  - **What you got, and where it went:** `rewardsOf` names each reward with where it went: a title any of your heroes can wear, a trophy or a banner on its spot in the house (which spot), a pet at home, a look on or off in a hero's Looks, a house look in Decorate, a new kind of hero in the bunk room, and the points last.
  - **The toast** says the name, what you did and what you got, and stays about five seconds. Tapping it opens the achievement's card over whatever is showing. Mid-fight the tap goes to the game instead, so a stray tap never opens a panel; the chest lists them all a moment later.
  - **The chest** lists every achievement the run earned: what you did, what you got and where it went, Wear it for a title (on the hero you play), and a tap for its card.
  - **The card** (over the Logs sheet, like the collection log's closer look, ringed in its tier's colour): tier, points and place; what to do (or what you did); your progress, or your best clear against a sprint's mark (`clearUnder`, `bestClear`); the day you earned it and the kill count it came at; and everything it gives, each with where it went and its button: Wear it, See it, Put it up, Make one. The toast, a row, the garden's and the cauldron's chips, and a reward's own sheet and closer look all open it.
  - **The page** (Logs → Achievements): one place at a time (Barrow, Thimblebriar, the garden; a Heroic's go with its dungeon), with chips to move between them and the points, the count and the titles (a tap to wear one) at the top. Each row: what to do, your progress with numbers (370 / 500 so far, 4 / 12, 0 / 17 slots; a sprint shows your best clear), what it gives and where, and once earned the day and the kill count. A hidden one stays ??? until it's yours, then explains itself.
  - **Titles:** every title comes from exactly one achievement (`titleSource`; `checkContent()` checks), which says where it came from and how to earn it. The Armoury's Looks tab lists every title (`titleRows`): yours first, each with where it came from and Wear it (Take it off on the one worn); the rest with exactly how to earn them and your progress; a hidden achievement's stays ???; a retired one's shows only for whoever has it. The title worn shows on your hero's name tag over their head in the house, in the armoury and on their sheet (`wearTitle`: only a title you've earned).
  - **The kill count it came at:** from save v10 an achievement keeps its dungeon's last boss's kill count when it's earned (`kc`); none for the garden's, or before your first kill. Older ones keep their day.
  - **Brewing** counts for the garden's achievements at the cauldron (`homeAchiever`), so Something Brewing pops when you brew your tenth, not at your next harvest.
- **Not right yet:** Bravely Stupid can't be earned: it needs going in alone as the DPS, and only the sims can do that (`solo`); the game always fills the other seats.

## Sound and music

Short, dry and punchy, a TV cartoon's fantasy rather than stock fantasy, so every sound sits well on a phone's speaker.

- **Effects:** 78 real effects made with ElevenLabs: every combat sound, the walkout, the chest and the cards, a log slot filling, putting gear on and the buttons. They are embedded in the page (`audio/sfx.json`, about 320 KB, 40 kbps mono MP3) and each keeps its old synthesised sound (`SOUNDS` in `src/ui/sound.ts`) as its fallback, so a sound that can't be decoded still plays. The garden and brewing sounds, and the gilding kit's little bell (`gild`), are still synthesised only.
- **Your own crits** get their own sound (`crit`), the way only your own numbers show.
- **Music:** three loops made with Eleven Music: the house (a cosy tavern, 46 s), the dungeon (low and tense, 42 s) and a boss (driving, 26 s). They are too big to embed (about 1 MB together), so each one streams from the live page's own files (`music/*.mp3`, published next to the page from `audio/music`) the first time it's wanted, and loops without a gap (`src/ui/music.ts`; `runMusic` picks the loop from a run's state). The boss's loop loads during the dungeon. The reveal is quiet, so every drop's sound lands.
- **The victory sting** (`fanfare`) plays as the last boss falls, at the music's volume (with the music off, the victory jingle plays instead). Under the lantern's tells the music ducks, and for the pet it cuts out with every other sound.
- **Settings:** Sound on or off (off silences the music too), and a Music slider kept on this device (`highfell.music` in local storage), never in the save.
- **Making sounds:** `tools/audio.py` asks ElevenLabs for takes, trims each to its first sound and natural end, takes out rumble, levels its loudness against the others and compresses it; `tools/audio_list.py` holds every prompt and which take went in.

## Making it fair

Today's baseline (`tests/balance.test.ts`): bots clear Barrow Crypt in about 3:25 on Common gear with no wipes (the Gravekeeper about 80 seconds of it), full Epic in about 2:05, and a full BiS party (`power: 1.96` with 3-piece sets and Boss Weapons) melts the dungeon in well under half the time (`~1:30`). A healer who does nothing (no heals, no lifts) wipes the party by Sir Rattlebones, and the player as tank in Common gear with a bot healer clears with no wipes. Heroic in full Epic clears in about 3:35 with no wipes. The repo's `npm run sim` prints the full table.

- **The bands `tests/balance.test.ts` keeps:** a Common bot clear in about 3:30 with no wipes (3:05 to 3:55), with the Gravekeeper about 80 seconds of it (70 to 95); full Epic clearly faster; full BiS melting the dungeon in roughly half the time (under 62% of the Common clear time); and a DPS alone dies before Sir Rattlebones. A healer who does nothing (no heals, no lifts) wipes the party by Sir Rattlebones, and you as tank in Common gear with a bot healer clear with no wipes. Heroic: full Epic clears in about four minutes with no wipes, and Common gets buried.

## Onboarding

A fresh save opens on the hero maker.

- **The first hero** gets the Crypt Trial's chest at once (`grantTrialStarter`, once a save): an Uncommon weapon waiting in its bag and an Uncommon helm on another role's shared floor, so skipping or quitting the trial loses nothing.
- **The Crypt Trial** (`start: 'intro'`): 60 seconds as that hero in full Epic test gear, in the Ossuary and Sir Rattlebones's tomb. Brannoc tanks unless you are the tank, and your seat gets its role's Barrow weapon and 2-piece bonus. A Welcome card offers the trial or a skip.
- **Five teaching moments** drawn for your class (`TUT_BY_CLASS` in `src/ui/run.ts`): your opener, your pack or peel button, `Dodge` out of `Shield Charge`'s red lane, the heavy swing (a tank perfect-blocks it; a cleric Wards, a mage throws Icicle, a rogue Shadowsteps, and he staggers) and your big hit in the `Exposed` window. Each one pauses the game, spotlights the button to press (TAP! on it, or CLICK! with a mouse; the other buttons dim and go quiet) and waits for that button, or its key on a keyboard. The card has no button of its own, and a touch, swipe or click on the dungeon does nothing while it waits, so the button you learn is the one you'll press in a run (17 Oct, after a play test where a tap on the screen, not the Roll button, finished the dodge lesson; a wrong button shakes). Heroes cannot drop below 20% health, and `Skip intro` is always there.
- **The chest:** killing Sir Rattlebones plays the gold `unique` walkout and opens the trial's chest (`reveal.showTrial`): the two starter pieces, plus a 1/35 set piece and a 1/50 trophy stamped `Example` (that is what the gold lantern was about), with the Barrow's collection log and its three prizes.
- **The Hearth tour:** then a 3-step guided tour of the Hearth (`hall` your hero's gear → `bunks` the empty bed → `cellar` Barrow door), which ends on the whole house (finished or skipped). The trial and the tour both replay from Settings; a replayed trial's chest is all examples.
- **Your Warband, at the door:** the first time you open the Dungeons once your Warband is open (on Normal; Heroic seats friends, never your heroes), a Your Warband tip under the door: your other heroes fill the other seats in their own gear, better gear on them makes runs faster, and a bot stands in until you make one. A gold Make button for each seat a bot fills (Make a healer, Make a DPS) side by side, and Later as the quiet way out by the title. It stays until the last bot seat gets a hero or you tap Later; tapping a seat or going in also counts as seen.
- **The garden's tips:** fresh saves start with no seed, and a save's very first run never drops one. Then a one-step tip as each first comes, pinned on what to tap (the pin does it too): your first seed (the yard's beds: plant it), your first ready bed (pick it), your first herbs that make a brew (the cauldron) and your first bottle (Your Brew, by the brew button on the door: one bottle is poured as you go in, for the whole party). A tip waits while something is open over the house (a harvest's card, a sheet) and shows once it closes. A save that has already planted, picked or brewed never gets that one; the door's two tips show once to every save.
- **As built:** which tip is due is `houseTip` and `doorTip` in `src/meta/tips.ts`, and `finishTip` marks one seen; the house's steps are data in `src/ui/tours.ts` (the ready tip pins the bed that is ready). It all lives in `p.counters` (`intro.tour`, `intro.seed`, `tip.ready`, `tip.herbs`, `tip.warband`, `tip.brew`), so the save's shape never changes.
- **Learning a class, in the moment:** a class's first five runs glow the one button whose moment has come (`momentFor` in `src/dungeon/coach.js`), with a short word on it. A roll out of a hit about to land comes first, then each class's own reads, most urgent first. The healer Wards before a big hit lands on the tank, Sunbursts when two mates are under half or anyone is cursed ("Lift!"), taps a hurt mate's frame ("Tap", the frame glows instead of a button), drops a Prayer circle when the party is bunched and Smites when everyone is topped up. The tank blocks a big hit, taunts what's on a mate or pulls a pack, charges what got away, and cleaves what's in reach. The mage freezes what's on top of it, shatters what's frozen, storms a pack and comets a big one. The rogue fans a pack or a cast, blinks to a far target, crits a poisoned one and poisons a fresh one. While it lasts, the other buttons' combo prompts stay quiet so the one glow reads. Runs on a class are counted as each starts (`runs.<class>` in `p.counters`; an older save counts its heroes' clears, `classRuns`), and the glow fades run by run (`learnGlow`: 1, 0.85, 0.7, 0.55, 0.4), then it's gone. The Crypt Trial teaches its own way and doesn't count.
- **A new class's trial:** the first run on a class that isn't your first hero's offers that class's Crypt Trial first, once (`needsClassTrial`, `trial.<class>` in `p.counters`): the Welcome card asks "First time as a Mage?" with the trial or "Skip, go in" to the run you picked. None of this changes the save's shape: it all lives in `p.counters`.

## Saves

A save never loses data: its shape changes only with a `PROFILE_VERSION` bump and a migration step.

- v2 to v3 turned one hero per role into the roster.
- v3 to v4 added the Vale (`p.vale`).
- v4 to v5 gave every hero an empty bag and fresh list (gear stopped going on by itself).
- v5 to v6 added house looks (`p.hearth.looks`, every room the tavern).
- v6 to v7 gave every hero a male or female look (`sex`).
- v7 to v8 added `seeds` and the 3 yard planter `beds` (`p.vale.seeds`, `p.vale.beds`) with 1 starter `glowcap` seed.
- v8 to v9 turned each gilded Heroic piece into the plain piece plus its gilding kit (the kit keeps the old `.gilded` id, so the Heroic log keeps its progress, and the plain piece counts both drops from the first). A hero wearing a gilded piece wears the plain one, gilded; a piece only ever worn plain stays plain (its kit in `looksOff`). Heroic kills were added once to the normal boss's kill count.
- v9 to v10: an achievement earned from now on keeps the kill count it came at (`kc` in `p.achievements`, its dungeon's last boss; none for the garden's). The ones you had keep their day; their count wasn't kept.

## Content Scope, Release Tiers & Stepped Unique Treadmill

### Making a new dungeon

A new dungeon starts as a copy of the template, `src/content/_template/`: a small working dungeon (bots clear
it in about 3:10 in Common gear) that isn't in the game. Its `README.md` is the guide. The rules for every
new dungeon:

- **One signature idea:** the one mechanic the dungeon is about, used by its trash and both its bosses (the
  `signature` slot in its engine def). The template's example is beacons, which pulse the party until a DPS
  breaks them and shield the boss who planted them.
- **One or two new enemy types;** the rest are the shared kinds (melee, ranged, brute) in the dungeon's dress.
- **Two bosses of two or three moves:** the mini boss about 40 seconds, the final boss two phases and about 80
  seconds, every move built from the shared parts (`src/dungeon/moves.js`: cone, line and circle telegraphs,
  Exposed windows, adds, a party pulse), and one clear job for each role in each fight.
- **A different layout shape:** layouts are data (`src/dungeon/layout.js`): any number of rooms, doors on any
  side, branches, side rooms, round rooms. Barrow Crypt is the line of rooms; the next ones are not.
- **No puzzle on Normal:** the three-seat seal is a Heroic-only hook.
- **The art is the main cost:** the 3-piece sets, the boss weapons and their armour stands in the collection
  log, then the bosses and the new enemies. The rest is reused.
- **Its door and its Heroic come with the template:** `stage.ts` is its door on the Dungeons sheet, and
  `heroic.ts` builds its Heroic (`makeHeroicDungeon`: the Normal loot plus gilding kits).

`tests/template.test.ts` keeps the template to these rules, and `npm run sim -- --dungeon <id>` times any
dungeon's packs and bosses.

### Seasons

The owner's direction is seasons, not expansions (`docs/ideas.md`). Built so far (17 Oct): each dungeon says which season it came in (`season` on its `DungeonInfo`, a number; the name the game shows is in `SEASONS` in `src/content/index.ts`, and a Heroic is in its dungeon's season). Barrow Crypt, Thimblebriar Hollow and Moonmere Sanctum are **Season 0** (Moonmere, not built yet, has it on its card in the Dungeons sheet's list). The Dungeons sheet groups All dungeons under each season's name and tags the door. Nothing else about seasons is built: no new season, no timewalking, no reset. The tiers and the Act 1 trio below are the older plan, kept until the season direction gets its own pull request.

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

