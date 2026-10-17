# Ideas and proposals

Nothing here is decided. An idea moves into the game only when the owner says yes; then it goes into
`docs/design.md` and gets built. Agents: don't build anything from this page unasked.

## Direction: seasons, not expansions (the owner's call, 17 Oct)

The owner has chosen this direction. It isn't built, and it changes the brief, so when it's time it goes into
`AGENTS.md`, `docs/design.md` and `docs/dungeons.md` in its own pull request.

- **A season is about 3 months: one new dungeon and one raid with 3 wings.** The first wing opens at launch,
  the second a month later and the third a month after that, so there's something fresh each month. A missed
  wing waits for you; nothing is timed beyond the launch.
- **Every season restarts the treadmill.** Everyone starts the new season in fresh gear and climbs over the
  3 months, from struggling to melting it. A slow incline that a parent can keep up with. Newcomers and anyone
  who skipped a season start level with everyone on day one, so there's nothing to catch up on.
- **Old seasons are timewalked.** When a season ends, its dungeons and raid are scaled up to current power
  and stay playable forever, mostly for the collection log: its gear becomes looks and log slots (no longer
  power), and its pets, mounts, titles and house looks are still there to chase. A run there should still give
  a little current-season regular gear, so it's never wasted.
- **Lasting progress is the collection:** logs, looks, pets, mounts, titles, house looks. Power is per
  season: gear and levels both reset when a new season starts (levels the owner's call, 18 Oct: levels are the
  climb after the first Epic set, so a season that kept them would have to be tuned for level 99s and a newcomer
  would start far behind). Your heroes, the collection, achievements, the house and your lifetime XP last.
- **The three Act 1 dungeons (Barrow Crypt, Thimblebriar Hollow, Moonmere Sanctum) are Season 0** (the game
  shows it, 17 Oct), and are timewalked when Season 1 arrives.
- **The 6pm live raid night is off.** Raids follow the dungeon rules: Normal playable with your Warband and
  bots, Heroic the group flex.
- **Pricing idea:** about $2–6 a season, sell content and never power or catch-up. Older seasons later as a
  cheaper bundle for collectors.

What it replaces or changes: the brief's "later dungeons drop upgrade attachments that awaken older dungeon
gear" (old gear becomes collection instead), "raids are a later bonus activity" (each season has one), and
the Free Trial → Base Game → Expansions model in `docs/dungeons.md`. Still to settle (a `/grill-me`): how much
power a season adds, what timewalked runs give, the wing timing, the price, and whether Season 0 is free. And
levels and talents: settled 18 Oct, they reset with the season (above).

## Proposal: builds, levels and seasons (the two-hats pass, 18 Oct)

**The owner said yes to all four calls (18 Oct): one Power for a season's Epics, +2.5% a level for the whole
party, levels reset with the season, and no cap past 99 (+0.5% a level). Built 18 Oct; how it works now is in
`docs/design.md` (XP, Levels & Talents) and `docs/combat.md`. What follows is the proposal as written.**

The owner asked for a look at every tree, ability, weapon and set with two hats on: the gamer (is it impactful,
fun, real power creep, room for creative builds) and the balancer (no meta because the other choice is bad). And:
what happens at level 100, do levels reset each season, and should the Barrow melt to about 75 seconds once its
set is done, 60 after the next dungeon's? The owner's lean: every dungeon's gear in a season at the same Power
with different effects, and the creep coming from levels.

### What the sims found (the real engine, bots in every seat, 6 runs each)

**The creep runs out.** Barrow Crypt, you plus two bots (bots wear plain gear at your rarity):

| | Fresh, level 1 | Rare, level 8 | Barrow set and weapon, level 22 | Full tree, level 30 | Thimblebriar's set, level 35 |
| --- | --- | --- | --- | --- | --- |
| Tank (Axe / Shield) | 3:28 | 2:49 | 1:28 / 1:36 | 1:25 / 1:38 | 1:20 / 1:32 |
| Healer (Mercy / Wrath) | 3:28 | 2:50 | 1:55 / 1:56 | 1:55 / 1:56 | 1:57 / 1:55 |
| Mage (Frost / Fire) | 3:28 | 2:42 | 1:27 / 1:35 | 1:23 / 1:31 | 1:21 / 1:29 |
| Rogue (Venom / Blades) | 3:28 | 2:45 | 1:27 / 1:22 | 1:22 / 1:19 | 1:17 / 1:19 |

- Levels 31 to 99 add nothing, and the next dungeon's set takes 2 to 5 seconds off the Barrow.
- A healer main never melts anything: in full Barrow gear it still takes 1:55, because the bots set the pace and
  healing past "nobody dies" makes a run no faster.
- The Barrow can't go under about 42 seconds: that's the walk. With every seat at the same Power it takes
  3:28 at Power 1, 1:48 at 2, 1:16 at 4, 0:55 at 8, 0:45 at 20 (Thimblebriar: 3:42 at 1.75, 1:47 at 4, 1:00 at
  12). So 75 seconds is about four times a fresh party's damage, and 60 about seven times.

**Builds are thinner than they look.**
- A full tree (level 30) takes every talent but one, so every Axe warrior at 30 is the same Axe warrior. Row 3's
  pick is the only choice.
- Seven talents do nothing you can feel in a run (each left out alone, Common gear): Deep Freeze, Wildfire, Knife
  Storm (a capstone), Iron Wall, Brace and Spiked Shield, and Miracle never fires in Normal because nobody dies.
  Payback fires about three times a run. The big ones: Twin Fangs and Ruthless (about 15 seconds each), Axe Storm
  (13), Comet Shower (10), Hailstorm (7).
- Weapon traits are fair (every trait within a few seconds of the others) but none can be felt, and the
  healer's three only heal.
- At the same Power (Thimblebriar, every seat 2.3), the Barrow's sets beat Thimblebriar's for the tank (26
  seconds off against 15), the healer (8 against none: Sporebloom only heals) and the Blades rogue (33 against
  none); the mage's two are level, and Venom prefers Thimblebriar's. Clockguard's two bonuses need perfect blocks.
- Bugs: Rimebone's 3-piece only half works for Fire (a foe dying in Firestorm doesn't rise), and the Candlewake and
  Sporebloom 2-piece heals don't grow with Power.
- Six talent names are too close to WoW's: Deep Freeze, Frostbite, Kindling, Wildfire, Death Mark, Ruthless.

**Metas.** Axe is 13% faster than Shield (blocking doesn't make a run faster). Wrath is a little faster than
Mercy, but neither healer makes a run faster. Frost and Fire are level, except the Barrow set leans Frost.
Venom wins in plain gear and Blades in the Barrow set, so the rogue's pick depends on gear, which is healthy.

### The plan

**1. Gear in a season is the same Power; effects are the difference.** Every Epic in a season is Power 26 (set
piece) or 30 (boss weapon), whichever dungeon it's from. Barrow gear stays best-in-slot material all season, and a
build is which set (a 3-piece, or 2 and 1 of another), which weapon and which trait. The regular ladder (Common to
Rare) stays.

**2. Levels are the climb.** Every level makes your whole party's hits, heals and health 2.5% bigger: you, your
Warband and the bots (they're at your level already). Talent points stay as they are, one a level from 2 to 30.
With today's gear and talents that gives (sims, the level bonus as Power for every seat):

| | Rare, level 9 | Barrow set, level 22 | A second set, level 35 | Level 45 | Level 99 |
| --- | --- | --- | --- | --- | --- |
| Tank, mage, rogue | 2:16 to 2:22 | 1:10 to 1:19 | 1:01 to 1:15 | 0:58 to 1:05 | 0:49 to 0:55 |
| Healer | 2:17 to 2:19 | 1:27 | 1:17 | 1:14 | 1:00 |

That's the owner's 75 then 60, and it lifts healers too; the talent and set passes below close the healer gap.
Each later dungeon is tuned for the level you reach it at (Thimblebriar: about level 20 in the Barrow's set,
3 minutes at the door), so it says "Recommended level 20" where it now says "Recommended Power 22".

**3. No cap.** Past 99 the levels keep coming forever, about 30 runs each, +0.5% each. There's always a next
level. 99 keeps its title.

**4. Levels reset with the season.** If levels are the climb and never reset, every new season has to be tuned
for level 99s and a newcomer starts far behind. Reset with the gear and every season has the same shape (struggle,
then melt, a 1 to 99 climb of about 30 hours) and everyone starts equal. What lasts: your heroes, the collection,
looks, pets, mounts, titles, achievements, the house and your lifetime XP. The other way: levels never reset and
the level bonus stops growing at 50 (past that, levels are for show), so a newcomer catches up in a few weeks.

**5. Every talent row is a pick of two.** Rows 2 to 5 each offer two talents and you take one; row 5 holds two
capstones. A full tree is still 29 points: 16 builds a spec, 32 a class. Every spec gets its own way to go fast:
Shield hits back harder the more foes are on it and on perfect blocks, Mercy makes mates hit harder, Axe and Wrath
keep raw damage. Duds are reworked; WoW-like names get new ones (ids stay, so saves keep every point). A first
draft (numbers set by the sims; kept talents in plain, new ones marked new):

| Spec | Row 2 | Row 3 | Row 4 | Row 5 (capstones) |
| --- | --- | --- | --- | --- |
| Shield | Spiked Shield (reworked: foes that hit you take 40 back, 120 if blocked) or Rim Strike (new: every third Cleave stuns) | Brace (reworked: a perfect block Exposes the attacker) or Cover | Bulwark (new: Slam pulls from twice as far, and each foe pulled makes your next Cleave 6% harder) or Iron Wall | Payback or Unbowed (new: with three or more foes on you, Slam comes back twice as fast and hits 50% harder) |
| Axe | Hungry Axe or Savage Swing (new: Cleave hits 15% harder under half health) | Quick Charge or Spinning Axe | Rising Fury or Headlong (new: Charge primes a Crush that cuts through a line) | Axe Storm or Final Word (new: a Crush finishes a foe under a quarter health; a boss takes triple) |
| Mercy | Saving Grace or Heartening (new: a mate you Mend hits 10% harder for 5 seconds) | Walking Prayer or Twin Ward | Overflow or Rally (new: Ward makes its mate hit 15% harder while it holds) | Miracle or Dawn (new: Sunburst makes the party hit 25% harder for 8 seconds) |
| Wrath | Twin Light or Twice Struck (new: every third Smite strikes twice) | Burning Light or Sunlance | Holy Ground or Sunpillar (new: Sunburst calls a pillar of light on your target) | Sunstrike or Flashpoint (new: a Smite crit bursts on every foe near its target) |
| Frost | Hard Rime (was Deep Freeze, reworked: frozen foes take 15% more from Icicle) or Wide Winter (new: Blizzard a third wider) | Numbing Cold (was Frostbite) or Brittle | Shardburst or Long Winter (new: Blizzard lasts 2 seconds longer, and a Comet into it Shatters) | Hailstorm or Icefall (new: a Blizzard ends with a crash of ice on everything in it) |
| Fire | Stoked (was Kindling) or Flash Fire (new: a Firebolt crit spreads a Burn) | Brushfire (was Wildfire, reworked: Firestorm spreads its Burn wider and lasts longer) or Searing | Afterburn or Flashover (new: a Combust makes Ember burst ready again) | Comet Shower or Pyre (new: Firestorm follows your target and grows hotter) |
| Venom | Deadly Venom or Quick Venom (new: Viper Venom ticks twice as fast for half as long) | Toxic Burst or Grave Mark (was Death Mark) | Encore (was Ruthless) or Lingering Cut (new: Shadowstrike on a poisoned foe leaves it bleeding) | Twin Fangs or Last Breath (new: Shadowstrike finishes a foe under a fifth of its health) |
| Blades | Sweeping Blades or Twin Edge (new: Viper Blades hits twice) | Whirling Edges or Venom Spray | Scatter or Second Ring (new: Fan of Blades throws a second ring) | Knife Storm (reworked: 6 seconds of swings that hit every foe round you, points twice as fast) or Cutting Wind (new: foes Fan of Blades hits take 15% more from you) |

**6. Sets, weapons and traits.** Each set is the best for some build at the same Power: Clockguard's bonuses
also come from Slam, not only perfect blocks; Sporebloom's turret shoots the nearest foe too; Gearshade's bombs
stick to every foe Viper Blades hits (a Blades set); Rimebone's 3-piece works in Firestorm; the 2-piece heals grow
with Power. Each trait gets a number you can feel (about 5% in its best build), and one healer trait hits (Kindle:
a breaking Ward bursts on the foes round it).

**7. Tests that hold it.** Fresh Barrow 3:10 to 3:50 at level 1; with its set at level 22, every role 1:10 to
1:25; with a second set at level 35, 1:00 to 1:10; a class's two specs within 5% in their best builds; no
talent under 2% in its best build, except the safety picks (Cover, Iron Wall, Miracle), which get a test of their
own (deaths saved in Heroic-hard runs); the old ones stay (a lone DPS dies, an idle healer wipes, a tank in Common
gear with a bot healer clears), at level 1.

**What it changes in the brief:** pillar 1's "about 2 minutes when melted" (about 1:15 with the dungeon's set,
under a minute later), pillar 2 (gear gets you to Epic, then levels are the climb, and gear and talents decide
how), the ladder row ("8 more a dungeon tier" goes), the XP row (levels past 99), the talents row (a full tree
still clears about a fifth faster, but levels are bigger than gear), and the seasons direction (levels reset with
the gear). Nothing in the save changes shape: the level bonus comes from XP, items keep their ids, talents keep
theirs.

## Proposal: season capes, season trophies and a total level (the owner, 18 Oct)

The owner wants these on the list before they're forgotten; they get designed properly before Season 1.

- **A 99 cape for each season, only in that season.** Levels reset with the season (decided 18 Oct), so every
  season has its own climb from 1 to 99. Reach 99 while the season is on and you get its cape: a look your heroes
  wear, never power. When the season ends, nobody can get that one again.
- **A legacy version for logging the season later**, timewalk and transmog style: finish a past season's logs and
  you get its cape in a different cut, so a newcomer can still chase it and the in-season one stays the flex.
- **A trophy for each season, something epic.** Draft: tiers, the way OSRS Leagues trophies stand in your house
  for good. Bronze for clearing every dungeon and raid of the season, silver for every Normal log, gold for every
  Heroic log too, each bigger and more alive in the house than the last.
- **A total level that carries a little power into the next season**, "nothing crazy, but rewarding enough", so
  a ten-season veteran is someone people look at in awe. It sits beside the seasonal reset: the season's level is
  the climb, the total level is the prestige.
- **Gear across seasons.** Gear is now the same Power across a season, and the owner wants that to hold across
  seasons too: go back to the Barrow in Season 8 for its set effect, or upgrade old gear the way OSRS's primordial
  crystal upgrades old boots. That changes the seasons direction above ("its gear becomes looks"), so it has to be
  settled before Season 1.

Precedents: OSRS skill capes, the trimmed cape for two or more 99s, and Leagues trophies (bronze to dragon, kept
in your house); WoW's season-only Keystone Master mounts and Feats of Strength; Destiny's gilded season titles;
WoW timewalking (old content scaled to now, its looks to collect); Lost Ark's roster level (an account level that
lifts every character a little).

Still open: does gear Power stay put between seasons; what the total level counts and how much it carries (all
the XP you've ever earned, so nothing is missable, or each season's 99, so a missed season is missed for good);
one trophy or tiers; how a cape is drawn (a back layer on every race and class).

**From a play tester (18 Oct):**
- **Daily bonuses** ("do at least 3 a day for better rewards", short speed or attack buffs). A daily chore, which
  pillar 4 rules out. The pillar-safe version is rested XP, as in WoW: time away banks bonus XP for your next few
  runs, up to a cap, never lost. Short buffs exist already: brews.
- **Upgrading spells and weapons.** Talents already change what the buttons do; weapon upgrades are the
  primordial idea above.
- **A voice notes button for play testers.** An always-on mic isn't doable from the page (the mic needs a grant
  each time, it drains a phone, and the game pauses in the background). The quick version: a Note in the pause
  menu; you talk with your phone keyboard's mic, and it's saved with where you were (dungeon, run time, level) in
  the game's own database, where Claude can read them and sum up what you keep asking for.

## Proposal: the Hall of Doors when Season 1 comes

The cellar has a door for every dungeon (built 17 Oct, `docs/design.md`). Season 0's three fill it, between the
candles and the stairs. Two ways to fit the next season's doors (one dungeon and one raid each season):

- **A. Stairs down to a deeper cellar, one per season (recommended).** The stairs go on down from the cellar to a
  second one for Season 1, with its dungeon's and its raid's doors as big as these, dressed in that season's style.
  It fits in the house's picture as it is: the earth under the cellar is already drawn, down to the world's edge, so
  nothing gets heavier for a phone. From Season 2 on, each new cellar makes the house a bit taller, so the
  zoomed-out house gets a bit smaller on a laptop (a phone fits it by width and barely changes). When that's too
  much, fold the oldest season into small doors (B).
- **B. A second row.** When a season ends, its doors shrink into small arched niches high on the cellar wall, over
  the new season's big doors: still tappable, still lit, gold or gilded. The house never grows, but a small door is
  hard to read from the whole house, and the cellar gets busy after two seasons.

## Proposal: make every run pay (dungeon materials)

**The want:** a reason to run Barrow Crypt 50 more times after the gear is done, and to feel the difference
the new gear makes.

**Recommendation: no new material. Barrow Marks already are the material.** A second currency per dungeon is
bloat. The gap is that after about ten clears a run pays only 1 Mark, and Marks only buy trait swaps.

1. **Every run pays Marks:** +1 per boss killed as well as +1 per clear, so a wipe still pays something.
   Small change.
2. **A small Marks shop per dungeon** (five things at most) at the hearth: Barrow-themed looks, a hearth trophy
   or two, a title. Each one is a collection log slot, so it feeds the log chase. Never power.
3. **Deeper runs** (the "feel your gear" part): spend a Grave Key, bought with Marks, to make your next run
   harder in tiers (enemies hit harder and have more health per tier) for more Marks and a little better
   drop rate per tier, with the rates shown on the dungeon sheet so loot stays honest. Better gear is what
   lets you go deeper.
4. **No separate dungeon potions:** the Vale brews are the potions. If a dungeon flavour is wanted later,
   one brew can need an ingredient bought with that dungeon's Marks.

Suggested order: 1 and 2 first (cheap, big dopamine), then 3 once a second dungeon exists.

## Proposal: Highfell Square (a place to see other players)

**The want:** an online area like a grand exchange: see other people, show off mounts and pets, trade,
chat, find groups, sell herbs.

**Recommendation: yes to the square, no to the exchange.** Build it when real co-op lands, as the lobby
where parties form. Before that there is nobody to group with.

What it would be (one screen, like everything else):

1. **The square in Highfell**, reached from the hearth. Other players' heroes stand about with their mount
   and pet, name and title. Tap one to see their collection log count, kill counts and best clear. This is
   the best place to show off a pet or a mount: other people see it, which the hearth can't do.
2. **Broadcasts, OSRS style:** when anyone gets a pet or a 1 in 1,000, the lantern in the square flares and
   a line goes up ("Wren got Pint at Gravekeeper kill count 4,123"). Dopamine for everyone watching.
3. **A party board:** "Barrow Crypt, need a healer". Tap to join. This is what makes it worth opening.
4. **Emotes and set phrases only** (wave, cheer, bow, "Good run!", "One more?"). No free chat: nothing to
   moderate, nothing unpleasant for a dad playing at night, and it works on a phone.

What it should not have:

- **No trading or selling, herbs included.** The collection log is the heart of the game: if a pet can be
  bought, the log stops meaning "I did this". (This is the OSRS ironman rule, for everyone.) Trading also
  brings bots, scams and real-money selling, and prices that need watching. Gifting a brew to a friend
  could be the one exception later.

The catch: it needs a real online server. The claude.ai page can only reach people in the same
organisation (its "room" feature shows who has the page open right now), so a public square means hosting
our own small server, sign-in and a block or report button. That is the owner's call. A friends-only test
using the page's room feature could come first.

## Proposal: online play

**The want:** a dungeon with friends or strangers (a tank, a healer and a DPS on three phones), a save that follows
you into the iPhone and Android apps, and a collection log nobody can fake once others can see it.

**Where it stands:** none of it exists. Group Finder, Party Finder and Friends are words on screen with no network
code behind them. Saves live in the browser and the claude.ai page's database (`src/core/store.ts`), and the
phone rolls its own loot. Heroic can't be played for loot at all (part 5).

**Recommendation, in short:**

1. **Server:** Cloudflare (Workers and Durable Objects). Nothing to look after, free to try, about US$25–30 a
   month at a few thousand players.
2. **Fights:** lockstep. Every phone runs the same fight from the same seed and only button presses travel. The
   server keeps the clock and runs its own copy of the fight, which decides kills and loot.
3. **Saves:** the server keeps the real save and rolls all loot. The phone keeps a copy, so offline play still
   works; an offline run gives a sealed chest that opens when you're back online.
4. **Order:** engine work first, then a test on real phones before anything else is built.

### 1. The server

Four real options, checked in October 2026 (US dollars; the bigger numbers are estimates).

| | Nakama | Colyseus | Cloudflare (Durable Objects) | Supabase |
| --- | --- | --- | --- | --- |
| Apple and Google sign-in in the apps | Built in | We build it (its sign-in module is in beta) | We build it (checking their tokens is small) | Built in, native on both phones |
| Cloud saves | Built in | Add a database | Built in (a small database per player) | Built in |
| Friends | Built in | We build it | We build it | We build it (a table) |
| Party Finder by role | Matchmaker, but exactly one of each role needs custom code | We build it | We build it (three queues) | We build it |
| Live rooms for three | Yes, but its JavaScript is ES5 only: our engine can't run there as it is | Yes, in Node: our engine runs as it is | Yes: our engine runs as it is, in a room started near the first player | No: it only passes messages on, and bills each one |
| What the owner looks after | A server and its database, or pay for Heroic Cloud | A server, or pay for Colyseus Cloud | Nothing | Nothing |
| Testing (a few dozen players) | About $10–25 a month | From $15 a month (or a $5–10 server you look after) | $0–5 a month | $0 (pauses after a week idle) |
| A few thousand players | About $25–60 a month, plus your time (Heroic Cloud: priced on request) | About $30–60 a month with a database | About $25–30 a month | $25 a month plus fight messages: likely over $1,000 |

**Recommendation: Cloudflare.** No server to patch, back up or keep awake. Our engine runs in a room unchanged
(the same V8 JavaScript engine as Chrome, Android and the sims), so the server can run its own copy of every
fight. A room costs only while it's open, so it stays cheap at both sizes; only a server you run yourself is
cheaper. The price: we write sign-in, friends and the Party Finder (all small at our size), and rooms use
Cloudflare's own API, though a room is a plain class that could move to Colyseus later. (PartyKit is now part of
Cloudflare; its PartyServer is an optional thin layer over Durable Objects.) Supabase has the best sign-in but
can't hold a live fight, and two services is bloat. Nakama has the most built in, but our engine can't run in it
and it's a server to look after.

**The numbers behind it:** on the owner's PC the engine plays a whole Barrow Crypt clear (about 4¼ minutes of
fight) in 0.25 to 0.65 seconds of CPU, about 600 times real time, so the server's copy of a fight costs next to
nothing. The estimate assumes 3,000 players, 30 runs each a month, half in groups: about 60,000 rooms of 4½
minutes, which is about $20 of room time plus the $5 plan. A few dozen testers fit in the free plan.

### 2. How three phones share one fight

1. **Lockstep (recommended).** Each phone runs the whole fight from the same seed, and only presses travel
   ("healer: Mend the tank, tick 4,812"). The server stamps each press with the tick it lands on and sends every
   phone the same list. Messages are tiny, the drawing stays as it is, and a new dungeon works online with no
   network code of its own. A run is just its seed and presses, which also gives us replays for bug reports.
2. **One phone hosts.** No: it still needs a relay (phones usually can't take incoming connections), the run dies
   when the host takes a call, the others get double the delay, and the host could fake loot.
3. **The server runs the fight; phones only draw it.** Hardest to cheat, and your own movement can feel instant.
   But the drawing would have to work from the server's updates instead of the engine's state, every new mechanic
   would need network code forever, and offline and online would be two games to maintain. It's the fallback if
   lockstep feels bad, in the same room on the same server.

**Delay.** Your presses land one round trip later: about 0.05 to 0.15 seconds on a decent phone connection, with
the room near you (Cloudflare starts it near the first player). The perfect-block window is half a second, so
it's felt but fair. The server never waits for a slow phone; a late press lands a tick later. If it feels mushy,
the next step is rollback (your phone moves your own hero at once and corrects itself), then option 3.

**What the engine needs:**

- **Seats, not one player.** Today one hero is `S.player` and bots drive the rest. Each seat gets a driver: this
  phone, the network or a bot. "You" stays for the camera, the HUD and your numbers.
- **Presses as commands.** Buttons, dodges, heals, taps and swipes call the engine straight from the touch
  handlers (`src/ui/input.ts`, `src/ui/run.ts`). They become commands applied inside the step, on a tick.
- **Your effects stay on your screen.** Hitstop freezes the whole fight when your own crits and kills land
  (`game.js:165`): on three phones, three different fights. It must freeze only the drawing; the same goes for
  anything else that checks `isPlayer`.
- **The same maths on every phone.** iPhones, Safari and Firefox run different JavaScript engines from Chrome,
  Android and the server. Plain arithmetic matches everywhere; sin, cos, atan2, hypot and pow may not, and the
  fight uses them about a hundred times. They become our own versions in `src/core/math`, and a test fails if
  fight code calls the built-in ones.
- **A desync check.** Every second each phone sends a short hash of the fight; the server compares it with its own
  copy. A phone that drifted reloads the fight and the drift is logged. The server's copy decides kills and loot.
- **No dropped time.** The frame loop throws ticks away on a slow frame (`run.ts:517`); online it must catch up.
- **One fight per room.** The fight lives in module globals (`S`, the dice in `src/core/rng.ts`), and Cloudflare
  can run several rooms in one copy of the code. A room swaps its state in before each step.
- **Same build.** Everyone in a room runs the same fight code. The server keeps the last two builds' engines, so a
  slow store update doesn't split players.

**Someone drops out:** their hero stays and a bot plays it (the bots clear the Barrow in every seat in the sims).
The same hero keeps the party's gear; a Warband hero swapped in mid-fight would change it. The server writes
"healer: bot from tick N" into the list so every phone switches at once. Their loot is the owner's call; suggest
they keep their roll if they're back before the last boss falls.

**Reconnecting:** the room keeps going. The phone gets the seed and every press so far, fast-forwards (a few
seconds) and takes its seat back. It replays because the fight can't be sent: its timers are functions
(`S.timers`). Opening a closed app offers "Rejoin your run".

**Pausing:** an online run can't pause. The pause menu opens over the live fight ("The fight goes on"), and a phone
in the background counts as a drop until it's back. The prologue's teaching pauses stay offline only.

### 3. Saves and honest loot

**The server keeps the real save; the phone keeps a copy** and plays from it, so the game opens at once and works
without signal. Once others can see your log, an edited save is as bad as a bought pet (the no-trading rule). So:

- **What you earn** (drops, kill counts, clears, Marks, ladder pieces, seeds, fight achievements, garden rares):
  only the server writes it. It rolls loot when the boss dies in its own copy, with the same `resolveKill` as now
  (it already takes its dice as an argument) and dice the phone never sees. The answer arrives inside the
  walkout's first 1.1 seconds, which are the same for all three tells; if it's late, the opening holds longer.
- **What you choose** (gear worn, names, the house, settings, the brew): the phone sends it and the server checks
  it against what you own.

`src/meta` has no screen, so the server uses the game's own rules: one rulebook, two places.

**Solo and Warband runs** feel exactly as now: the phone plays with no delay and sends its presses as it goes, and
the server replays them alongside. **Offline,** the phone keeps the run's seed and presses (a few KB); after the
walkout's shared opening the chest is sealed, and it opens at the hearth once the server has replayed the run.
Nothing lost, nothing fakeable. The other way is to let the phone roll offline loot and mark it, but a marked log
can't be trusted. Owner's call; sealed chests are the suggestion.

**Moving testers' saves, once:** a last claude.ai update shows each tester a short move code, stored beside their
save. The owner exports the page's database once (Claude can read it), the server loads each save through
`migrate()`, and in the app "I played the test" plus the code claims it. Test loot was rolled on testers' own
devices; we take it on trust.

**The save's shape** (PROFILE_VERSION 9 with a migration and a test; not built): an `account` id (null until you
sign in; nobody has to sign in to play offline), a `sealed` list of offline runs waiting for the server, and a
server version number for what you earned beside `rev` for what you chose, since "the higher `rev` wins the whole
save" (`src/core/store.ts`) can't stay once the server owns the earned parts. Nothing is removed.

### 4. Rules in AGENTS.md that would change

- **"One self-contained HTML file, no runtime dependencies"** mostly stands with Cloudflare: the browser's own
  WebSocket is all online play needs (Nakama, Colyseus and Supabase would each add a library). New: the app wraps
  the file with Capacitor and a sign-in plugin, and a `server/` folder shares `src/core`, `src/content`, `src/meta`
  and `src/dungeon`, with its own small tools (Cloudflare's deploy tool, a token check).
- **Code rules:** fight maths goes through `src/core/math`; anything that depends on which hero is "you" is
  drawing only.
- **Systems:** loot rolls on the server; offline runs give sealed chests; "a save never loses data" covers the
  server's copy (migrations run there, and it's backed up).
- **Publishing:** the server deploys from `main` by CI (a Cloudflare token the owner adds once); app releases go
  through TestFlight and Google Play testing.
- **The claude.ai page:** suggest it stays as the quick test build: the same game, offline only (it can't reach a
  public server; see Highfell Square), marked "Test build: progress stays here" after the move. Desktop players
  get the same file at our own web address, with online play.

### 5. Heroic: the owner's choice

Heroic opens after 10 clears, but its loot runs are locked as "Friends & Party Finder only"
(`src/ui/dungeonsheet.ts:101`), and `seats()` gives no Warband on Heroic. Neither exists, so nobody can play
Heroic for loot. `docs/design.md:242` and AGENTS.md ("once online play is live", "playable with your Warband while
offline") say it stays open with your Warband until then; the code (commit `a105a7e`) blocks it now.

- **A. Open it with your Warband now** (what the docs say). People play and tune Heroic now; when online play
  lands, you decide whether Warband Heroic stays. With server loot those runs are checked like any solo run. Cost:
  closing it later takes something away, and some gilded logs will have been filled with bots.
- **B. Keep it locked until groups exist** (what the code does). Heroic is the group pinnacle from day one, every
  gilded drop from a real group. Cost: finished content sits unplayed for months, tested only by sims.

Either way, the docs and the code should agree afterwards.

### 6. Order of work

Small pull requests, each leaving the game working:

1. **Same maths everywhere:** our own sin, cos, atan2, hypot and pow; a fight hash; a test that plays one seeded
   bot run in Node, Chromium and WebKit (Playwright has all three) for the same hash, plus a check on a real
   iPhone. The balance sims stay in their bands.
2. **Seats and commands:** seat drivers, presses as commands, "you only" effects drawing only, no dropped ticks.
   Offline play unchanged.
3. **Run logs and replay:** every run keeps its seed, gear and presses; a tool replays one. Useful at once for bug
   reports.
4. **First server: two phones, one fight.** One Cloudflare room joined by a code (no accounts), lockstep, the hash
   check, drop to bot and rejoin. Play it on real phones over 4G and 5G. **Decision point:** does the delay feel
   fair? If not, rollback, then option 3, in the same room.
5. **Accounts and cloud saves:** sign in with Apple or Google (or stay signed out and play offline), the server
   keeps the save, and a delete-account button (Apple and Google both require one).
6. **Server loot:** kills, clears, garden rares and fight achievements on the server; sealed chests; the testers'
   save move; PROFILE_VERSION 9.
7. **Friends and Party Finder:** friend codes, invites, and three role queues per dungeon; when a tank, a healer
   and a DPS are waiting, the server opens a room. On Normal an empty seat can take your Warband hero; Heroic
   follows part 5. Names others see need a word filter, and Apple wants report and block buttons.
8. **The apps:** wrap the file with Capacitor; store pages, a privacy policy, TestFlight and Play testing.

Then, if wanted, Highfell Square on the same server.

**The owner decides:** the server (Cloudflare suggested); lockstep, after the phone test in step 4; sealed chests
or marked offline loot; a dropped player's loot; Heroic A or B; the AGENTS.md changes in part 4.

**The owner pays for:** Cloudflare (free to try, then $5 a month, about $25–30 at a few thousand players); the
Apple Developer Program (US$99 a year, from step 5, since Sign in with Apple is set up through it); Google Play
(US$25 once, at step 8; Google sign-in is free); a domain for the web build and sign-in pages (about $10–20 a
year). iPhone apps must be built on a Mac, but GitHub's Mac build machines are free for public repos.

## Looks for the house: what's still open

Built on 14 Oct: a look for a room or the whole house, the tavern, Barrow Hall and Gilded Barrow Hall (from the
Barrow's two collection logs). See the house in `docs/design.md`. Still open:
- Looks for Vale places, and a look changing the view outside the windows (only with the whole house in it).

## Collection log prizes still to come

- Gnomes, goblins and orcs, each earned in a dungeon of its own (the owner's call, 14 Oct). Their dungeons
  and their art are to come; the hero maker shows them as Soon.
- A race and class combo as a log's prize (a Dwarf Mage, say), so not every dungeon has to open a race.
- Racial tricks: each race has one written down, none is built.

## Open calls from the design

- When all three Ults land within 5 seconds, a screen-wide team finisher? (Leaning yes.)
- Boots and gloves in dungeon sets? (Leaning no: keep dungeon sets at 3 pieces, save more slots for raid sets.)

## Later

- Raids: the big group moments, harder mechanics, raid tier sets (4 pieces, 2 + 2 mixing).
- More dungeons, each with its own sets, pets, trophies, achievements and walkout tell (themes so far:
  goblin bombs and gold, a fungal hollow, a storm peak).
- More races (undead, goblin, a small race of our own) and the Rogue, Ranger and Bard kits.
- More places in the Vale: Moonmere (the elves' lake), Emberdeep (the dwarves' forges), one per hometown.
- Friends seen out riding in the Vale; inviting people over to your hearth (both come after the square).
- More for mounts to do: they already make rides out quicker. Later ones could reach places a goat can't
  (a lake for a strider, a cliff for a hound), never more power in a dungeon.
- Pets following you into dungeons.

## The collection log's wardrobe, next

Parked while building the log as a wardrobe (16 Oct). Nothing here is decided.

- **Sets drawn on the heroes themselves.** The log shows each set on an armour stand. Wearing a set's look on
  your hero, in the house and in a run, means fitting every set to every race, class and sex: a much bigger art
  job than the stands.
- **Open the log on the dungeon you last ran.** Today it opens on the first dungeon whose log isn't finished.
  Remembering the last one needs a field in the save (a version bump and a migration).
- **The other sets' written looks.** The stands follow each set's `look` text, and Barrowguard, Candlewake and
  Rimebone's icons were redrawn to match. Barrowguard's look also mentions a coffin-lid shield, which has no slot,
  so it isn't shown anywhere.

