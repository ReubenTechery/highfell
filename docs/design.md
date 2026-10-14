# Highfell Dungeon Systems

> A copy of the Dungeon Systems doc on claude.ai, made 14 Oct 2026, so every agent can read it. Keep it
> true: when a system changes, change it here in the same pull request. Where it and the code disagree about
> what's built, the code wins; for what's planned, this doc wins.

Dungeons stay junk food: four-minute runs, four buttons and a swipe, with the depth going sideways into talents, dungeon sets and achievements. Power climbs from Common to Epic in about ten runs, then stops. Loot follows OSRS rules: fixed drop rates, a 1-in-5,000 pet and a hidden walkout tell. Most of this is now in the live game; Ults, combos, talents and 3-piece set bonuses are still design.

## In the live game

What [Highfell](https://claude.ai/artifact/LYyryT29gsopt6UPoNceVd) has as of 14 Oct, and what is still only on this page.

| Part | Built | Still design |
| --- | --- | --- |
| Heroes | Race and class picked once, for keeps; up to 6 heroes; beds in the house to switch, rename once or let one go; your hero by the fire | Gnomes and the other race and class combos, the Rogue, Ranger and Bard kits, racial tricks |
| Abilities | Four buttons per role plus the dodge; a perfect block stuns and hits back | Ults, Openings, team combos |
| Talents | Epic weapon traits, swappable for 5 Barrow Marks | The three paths and four rows per role, hero levels |
| Gear and sets | 4 slots on a gear doll that shows rarity, set count and what each piece adds; Common to Epic in about ten clears, Barrow sets with their 2-piece bonuses, the three Gravekeeper weapons. Nothing goes on by itself: new pieces glow on the doll until you put them on | 3-piece bonuses (they need summons), the wardrobe, gear drawn on your hero |
| Threat and difficulty | The tank earns threat (Slam taunts and drags mobs in, Charge grabs one), loose mobs go wild on the squishies, a caged tank loses the boss; Barrow hits 1.5 times as hard and its packs have more health; you see only your own numbers | Ults, Openings |
| Loot | Every line rolls on its own, kill counts, duplicates to Marks, the walkout and the chest reveal |  |
| Achievements | All 12, the meta and the 3 hidden ones, with titles, trophies, looks and the Lantern Ghost |  |
| Home | The Hearth, a tall house cut open: zoom out to see every room, tap things to use them (the Barrow door, the signpost to ride out, the armour stand, the big book of the collection log, the cauldron, the larder); about 30 spots for pets, mounts, trophies and banners; Decorate; looks for a room or the whole house (the tavern, Barrow Hall at 100 Barrow clears); one big Dungeons button | Heroic versions of the looks, looks for Vale places, rooms that come with new dungeons and places, inviting people over |
| Dungeon picker | Dungeons: pick a dungeon, see your group's three seats (you in your hero's, bots at your gear level in the others), tap a seat to play it with one of your heroes or make one for it, loot or practice, a brew | Friends in the seats (needs online play), more dungeons |
| Logs | Collection log by boss and gathering spot, grouped by dungeon and place, OSRS style: drops, kill count, fastest kill, wipes; achievements; the Vale's story; stats |  |
| Riding out | The Vale map (Bramblewick is the one place open); walking out, or riding once you have a mount; Bramblewick Hollow with three gathering close-ups that pay XP every cut, Dottle's errands (goats, crows, sparks, the kettle, deliveries) and 8 story pages; Gathering and Brewing ranks; the Hill Goat from the goats errand; 3 pets, 4 trophies, bunting and a hare | Moonmere and Emberdeep, friends seen out riding, more close-ups |
| Brews | The cauldron by your fire, 4 brews, one bottle a run, picked on the dungeon sheet | More recipes as places open |

## At a glance

(A diagram on claude.ai: the gear ladder up to Epic, then the build loop.)

The first hour of runs climbs the gear ladder to Epic; from then on, each run's loot, build and achievements feed the next one.

## Junk-food rules

Anything that breaks one of these six rules belongs in a raid, not a dungeon.

- A run takes about 4 minutes, needs all three roles, and drops loot every time.
- Four buttons plus the swipe dodge, never more. Talents and sets change what buttons do; they never add one.
- Power climbs Common → Epic, then stops. After Epic, every upgrade is sideways: talents, sets, weapon traits, looks.
- Skill earns looks, titles and pets, never power. Someone with three hours on a Friday night is never behind.
- No drinking for mana and no waiting around: mana refills between pulls.
- If a mechanic needs a guide to understand, it's a raid mechanic.

## Abilities v2

Every role gets three core buttons, one Ult and the swipe dodge, and each role's buttons now set up a teammate's. The Ult fills from doing your job well: roughly one per pack, two or three per boss.

**Built so far:** four buttons per role plus the dodge, cooldowns about 20% shorter than v1. Taunt is folded into Slam, and the tank now does about a third of the party's damage (it was a quarter). Ults, Openings and the combos below are still to build.

**Threat (built 14 Oct):** holding mobs is the tank's job, not a given. The tank's hits make a third more threat than anyone else's (it was 3.6 times as much, so mobs just clung to him); the DPS out-damages him, and heals pull a little on everything in the fight. A mob switches once someone beats its target by a tenth.

- **Slam** taunts everything around you for 4 seconds and drags it in to arm's reach (big mobs half as far, bosses not at all).
- **Charge** makes the mob you hit turn on you; Ringing Blow makes everything it hits turn.
- A mob that isn't on the tank for 3 seconds goes **wild**: it hits harder and faster. A DPS or healer who pulls one gets told to let the tank hit first.
- In the Gravekeeper's last phase **only the tank is caged**. Inside, nothing can target him and every mob forgets half his threat, so the boss turns on someone else until he mashes out (or a mate breaks him out) and Slams it back. The bars pop and the game says so.
- **Chains** have no button any more: the game calls "Cut the chain!" and you swipe across it (drag the mouse on desktop). A touch on a chain, a wisp or a cage counts even in the move-stick corner.
- **Numbers:** you see only your own (your hits, your heals, what hits you). Your mates' spell effects still show.

**Difficulty (built 14 Oct):** a dungeon has a `tune`. Barrow Crypt's: everything that hurts a hero hits 1.5 times as hard as written, and every mob but the bosses has 1.3 times the health. With no healing at all a party now wipes; with a tank who never Slams or Charges, the DPS takes about six times the damage. Clears went from 3:57 to about 4:10.

| Role | 1 | 2 | 3 | 4 (new) |
| --- | --- | --- | --- | --- |
| Tank | Slam: hits everything around you, taunts it and drags it in, 6s | Shield (hold): a perfect block stuns and hits back for 150 | Charge: dash, hit for 80, it turns on you, stun around, 7s | Cleave: a big swing through everything in front, 3.5s |
| Healer | Prayer circle, 5s | Ward, 4s | Sunburst, 14s | Smite: heals your most hurt ally for the damage dealt and gives mana back, 2.5s |
| DPS | Blizzard, 7.5s | Rime burst, 11s | Comet: 0.9s cast, 5.5s | Icicle: instant, triple damage on frozen mobs, 2.5s |

**What's off now** (my read from the sims; tell me if something else felt off in play)

- Nobody's buttons talk to each other, so teamwork isn't rewarded.
- There's no big moment: nothing you save up and smash.
- The healer has nothing to do when everyone's topped up.
- Frost nova is a panic button, and Comet is the DPS's only payoff.

### Tank — Brannoc

- **Shield** (hold): blocks from the front. A perfect block on a big hit stuns it and starts an **Opening**.
- **Taunt**: every mob nearby turns on you. Unchanged.
- **Charge**: dash and stun. Charge into **frozen** mobs to **Shatter** them.
- **Ult: Earthbreaker**: leap and slam, stunning everything around you for 2s and taking all threat. Fills from blocks, perfect blocks and hits taken.

### Healer — Maren

- **Mend**: tap a friend, as now. It's a tap, not a button.
- **Ward**: shields the most hurt ally. A warded tank's perfect block heals the whole party.
- **Prayer circle**: aimed heal zone. Friends inside hit 15% harder.
- **Smite** (new): light thrown at the tank's target. It heals the most hurt ally for the damage dealt and gives mana back.
- **Ult: Dawn** (was Sunburst): big party heal, cleanse, and half damage taken for 3s. Fills from healing; clutch saves fill it faster.

### DPS — Ivy

- **Blizzard**: aimed ice storm. Unchanged.
- **Rime burst** (was Frost nova): freezes everything close to you. Frozen mobs set up the tank's Shatter and double your Comet.
- **Comet**: big cast, double damage on frozen mobs. During an **Opening** it's instant and always crits.
- **Ult: Avalanche**: a huge cone of ice that freezes everything it hits; kills burst into shards. Fills from damage; crits and kicks fill it faster.

### Team combos

| Starter | Finisher | Result |
| --- | --- | --- |
| Tank perfect block → **Opening** (3s, the mob takes 50% more) | DPS Comet | Instant cast, guaranteed crit |
| Tank perfect block → **Opening** | Healer Smite | Heals the whole party |
| DPS Rime burst → **Frozen** | Tank Charge | **Shatter**: a big blast across the pack |
| Healer Ward on the tank | Tank perfect block | The block heals the party |
| Healer Prayer circle | Anyone standing in it | 15% more damage |

Crits get bigger numbers, a screen shake and a sound. A better weapon means bigger crits, and every Epic weapon has its own crit effect.

**Open call:** when all three Ults land within 5 seconds, fire a screen-wide team finisher? My pick is yes: it's the one big shared moment a dungeon gets.

## Talents

Each role has three paths and four rows: you pick one talent per row, from any path, and respec free on the start screen. Rows open at hero level 2, 4, 6 and 8, about a level per run, so the whole tree is open within roughly eight runs. Row 4 is each path's keystone (★); hybrids are allowed, and some will be the best builds.

### Tank: Bulwark · Brawler · Warden

| Row | Bulwark: block god | Brawler: hit hard, heal off hits | Warden: protect the team |
| --- | --- | --- | --- |
| 1 | **Steady Hands**: perfect-block window 50% longer | **Bloodied Axe**: heal for 10% of damage dealt | **Rally**: Taunt also shields allies for 120 |
| 2 | **Spiked Rim**: blocked hits deal 60 back, perfect blocks 250 | **Reckless Charge**: Charge every 6s, reset on a kill | **Guardian's Charge**: Charge goes for whatever is hitting your mates |
| 3 | **Unmoved**: full speed while blocking | **Whirling Axe**: every 4th swing hits all around you | **Hold the Line**: allies near you take 10% less |
| 4 ★ | **Mirror Wall**: perfect blocks bounce projectiles back; Openings last 2s longer | **Red Mist**: the lower your health, the harder you hit and heal, up to 40% | **Martyr**: 20% of the damage your allies take comes to you instead |

### Healer: Dawn · Aegis · Zealot

| Row | Dawn: big heals | Aegis: shields first | Zealot: heal by fighting |
| --- | --- | --- | --- |
| 1 | **Bright Mend**: 20% chance Mend heals double | **Thick Ward**: Ward absorbs 40% more | **Sun-scorch**: Smite hits 30% harder |
| 2 | **Sunrise**: Dawn fills 30% faster | **Bouncing Ward**: a broken Ward jumps to the next hurt ally at half strength | **Burning Ground**: Prayer circle burns enemies inside it |
| 3 | **Rescue**: heals on allies under 30% are 50% stronger | **Sanctuary**: allies in Prayer circle take 15% less | **Zeal**: each Smite takes 1s off Ward |
| 4 ★ | **Second Sunrise**: once per fight, a killing blow on an ally is stopped and they're healed to half | **Overflow**: overhealing becomes a shield, up to 300 | **Sun Lance**: every 5th Smite is a beam through a whole line that heals everyone |

### DPS: Shatter · Comet · Whiteout

| Row | Shatter: freeze and crit | Comet: big hits | Whiteout: hit everything |
| --- | --- | --- | --- |
| 1 | **Brittle**: frozen or slowed mobs take 20% more from you | **Heavy Comet**: Comet hits 30% harder | **Wide Storm**: Blizzard is 35% bigger |
| 2 | **Hard Freeze**: Rime burst freezes 1.5s longer and slows bosses | **Twin Comets**: Comet holds 2 charges | **Drifting Storm**: Blizzard follows its target |
| 3 | **Ice Shards**: frozen mobs burst into shards when they die | **Crater**: Comet leaves ice that slows mobs and makes them take 15% more | **Deep Chill**: mobs in Blizzard for 3s freeze for 1s |
| 4 ★ | **Shatterstorm**: crits on frozen mobs explode for half damage around them | **Third Star**: every 3rd Comet is instant and three times the size | **Endless Winter**: two Blizzards at once |

Levels unlock choices and looks, never stats.

## Heroes and alts

A hero is one race and one class, picked when you make them and fixed after. You can have six, and the one you play stands by the fire on the Hearth.

- **The bunk room:** every hero you aren't playing waits by their bed in the house. Tap one to play them, check their gear, rename them (once) or let one go (the last one stays); an empty bed makes a new hero.
- **Each hero keeps:** their regular gear (the Common to Epic ladder), their title and their clears.
- **Every hero shares:** the collection (a unique fits any hero of its role), kill counts, Marks, achievements, titles and the Hearth.
- **Shared gear:** a floor per role, up to Rare. Spare pieces and your own ladder raise it, and every hero of that role can put it on, including heroes made later (a new hero starts wearing it). Epic is earned on the hero.
- **Nothing goes on by itself.** A new piece waits in the hero's bag and glows on the gear doll with "Up" (a better regular piece) or "New" (a unique). Your hero's tag at the top of the house counts what's waiting; tap the slot, compare, and Put it on: the slot bursts, the item level counts up. The chest reveal says "Put it on in Gear".
- **Drawn today:** Dwarf Warrior (tank), Human Cleric (healer), Elf Mage (DPS). The rest show in the hero maker as Soon.
- **Old saves:** became one hero, named for the role you last played, with a one-time rename.

## Home: the house

Home is a tall house on the hill, cut open like a doll's house. Built 14 Oct after a play test where a new player tapped Ride out first because it looked like the main button.

- **Zoom:** pinch or scroll. Zoomed out you see the whole house, each room with a sign; tap one to go in. Zoomed in, tap things to use them. It opens on the hall.
- **One big button: Dungeons.** Everything else is a thing in the house: the Barrow door in the cellar, the signpost in the yard (ride out), the armour stand (gear), the big book in the trophy loft (the collection log), the cauldron and the larder (the satchel). Your hero's tag at the top opens gear too.
- **Rooms:** the trophy loft, the bunk room (your other heroes), the armory, the hall (your hero, the fire, the mantel), the stable, the brewing room, the cellar with the Barrow door and two bricked arches for dungeons to come, and the yard.
- **Trophies everywhere:** about 30 spots: the mantel, the loft's shelves, banners on the walls and the roof's flagpoles, pets by the fire, on the rug, on the table and in the loft, the stall and the yard. Decorate shows the empty ones; the rest of the time they're hidden.
- **Dungeons** (the big button or the Barrow door): the dungeon's picture, with one small collection log line under it that opens to show what each role can get. Then you: pick a role and you play your hero of that role you played last (Change picks another or makes one), your brew, and loot or practice. Brannoc, Maren or Ivy take the other seats as bots at your gear level. Friends take seats once there is online play.
- **Looks:** Decorate, then Looks: pick a look and put it on a room or the whole house. Looks only; everything you placed stays where it is.
  - **Tavern:** the default. Wood, plaster, lamplight and a crackling fire.
  - **Barrow Hall:** opens at 100 Barrow clears, and shows how close you are until then. The Barrow's own brick and flagstones, burial niches with skulls, green lanterns, the Gravekeeper's green fire in the hall, a coffin in the armory, a gravestone in the stable, wisps in the cellar. Put it on the whole house and the beams and outer walls turn to stone and the roof to slate.
  - Every dungeon brings a look like this; a heroic version of each comes once heroic exists.
- **Next:** rooms that come with new dungeons and Vale places (the cellar's bricked arches become new dungeons' doors).

## Riding out (the Vale)

Between dungeons you ride out: the signpost in the house's yard, about five minutes a trip, built as a playable test slice on 14 Oct and reworked the same day after a play test. It stays small on purpose: no open world, no crafted gear, no inventory to manage, no streaks.

1. **Ride out** from the signpost in the yard to the Vale map. Bramblewick Hollow is the one place open: it glows, its road is lit and the card has the button. The other places are locked ("Later"); the Barrow is down in the cellar at home.
2. **Walk or ride there.** You start on foot (5 seconds). There's no skip: a mount is what makes it quicker (the Hill Goat 3 seconds, the hare and the hound 2).
3. **Dottle's first errand is the goats:** tap them back into the pen, and the last one out decides she likes you. She's your Hill Goat, your first mount.
4. **Gather** in close-up: snip a stem on the dotted line, pluck a glowcap at its brightest. Three goes a harvest; each Perfect adds one more. **Every cut pays Gathering XP as it lands**, with a bar that fills at the foot of the close-up and a burst on a new rank.
5. **Do Dottle's errands**: crows come in gangs, hop between cabbages and chain into combos; sparks drift from the chimney onto the roof while the heat bar rises (never a fail: Dottle throws a bucket); the kettle runs off the first time you find it; or hand over ingredients. She shouts as you go. Each one turns up a page of the hollow's story.
6. **Brew** at the cauldron by your fire (every lap of the stir pays Brewing XP), then pick the brew on the dungeon sheet.

- A place regrows 2 harvests a day and saves up to 6; errands come 1 a day and save up to 3. A missed day costs nothing.
- A harvest rolls when its close-up starts, like a boss kill. One in seven shimmers and gives Starlight Dew.
- Rares roll per line, OSRS style, and a duplicate becomes 2 Starlight Dew. A pet gives itself away in the close-up before it drops.
- Gathering ranks 4, 7 and 10 add one to every harvest; Brewing ranks 2 and 3 teach new recipes.

| Reward | From | Rate |
| --- | --- | --- |
| Pressed Moonpetal (trophy) | Moonpetal patch | 1/80 |
| Rootling (pet) | Moonpetal patch | 1/600 |
| Glowcap Jar (trophy) | Glowcap ring | 1/80 |
| Puffcap (pet) | Glowcap ring | 1/600 |
| Bramble Crown (trophy) | Bramble hedge | 1/80 |
| Thimble (pet) | Bramble hedge | 1/600 |
| Hill Goat (mount) | Dottle's first errand, the goats | Given |
| Bramblewick Bunting (banner) | Dottle's errands | 1/20 |
| Wobbly Kettle (trophy) | Dottle's errands | 1/25 |
| Thistledown Hare (mount) | Dottle's errands | 1/40 |

Brews are small twists for one run, never power a raid needs. One bottle a run, drunk at the door; practice uses the brew but keeps the bottle. A Perfect stir fills one extra bottle. The ingredients go in when the stir starts, so leaving mid-stir still bottles it.

| Brew | Needs | For one run | Learned at |
| --- | --- | --- | --- |
| Moonpetal Tonic | 4 Moonpetal | Dodging heals 5% of your health | Brewing 1 |
| Bramble Fizz | 4 Brambleberry, 1 Moonpetal | 12% faster; the dodge comes back a third sooner | Brewing 1 |
| Glowcap Draught | 4 Glowcap, 1 Brambleberry | Your first hit on every enemy crits | Brewing 2 |
| Starlight Elixir | 2 Starlight Dew, 2 Moonpetal, 2 Glowcap | Once a run, a knockout hit leaves you on half health | Brewing 3 |

Six achievements live here: Green Fingers, Steady Hands, Something Brewing, Odd Jobs, Green-Thumbed (gold) and a hidden one for the Rootling. Next: Moonmere (the elves' lake) and Emberdeep (the dwarves' forges) as places, and friends seen out riding.

## Gear and sets

The weapon is the upgrade you feel; Helm, Shoulders and Chest are the set. Power caps at Epic in about ten runs, and after that you choose builds, not bigger numbers.

### The ladder

- 4 slots: Weapon, Helm, Shoulders, Chest (up from 3).
- Rarity climbs Common → Uncommon → Rare → Epic, the cap. Target: Rare in about 3 runs, full Epic in about 10 (roughly an hour).
- The weapon carries about 40% of your power, so a new one means bigger hits, bigger crits and its own glow.
- Every clear drops a regular item better than the best you have in your weakest slot. No dead drops. It waits until you put it on. It also drops a shared piece for another role, up to Rare, so a new alt never starts cold.
- Everything shows on your hero. Every set you earn goes in your wardrobe, to wear over any gear.
- Tap any drop (in the collection log or the Dungeons sheet) to hold it up against what that role wears now: Upgrade, Downgrade, Same power or A trade, then what changes (item level, power, health, set count) and any effect it adds or takes away.
- **Barrow Marks**: 1 per clear, 3 per duplicate. Spend 5 to swap your Epic weapon's trait; never on uniques.

**Epic weapon traits** (each Epic weapon rolls 1 of 3)

| Role | Trait | Trait | Trait |
| --- | --- | --- | --- |
| Tank | **Wide Swings**: swings hit everything in front at full damage | **Ringing Blow**: Charge hits twice and everything it hits turns on you | **Headsman**: hits on stunned mobs always crit |
| Healer | **Sunflare**: Mend splashes half to the next hurt ally | **Quick Hands**: Mend recasts faster | **Kindle**: a Ward that breaks heals for 80 |
| DPS | **Shatterlance**: Comet on frozen mobs hits 3× | **Splinter**: frostbolts split to a second mob | **Quickfrost**: Comet casts twice as fast |

Most of today's other traits fold into talents. Four of them carry straight WoW spell names (Icy Veins, Cold Snap, Deep Freeze, Last Stand), so v2 drops those names, along with Frost nova.

### How sets work

- Each dungeon drops three sets, one per role, in the Helm, Shoulders and Chest slots.
- Set pieces are uniques from the drop table below, always at Epic power.
- **2 pieces**: a perk that leans into one talent path.
- **3 pieces**: changes how one button works, a new way to play. Switched on in a later update, once summons exist.
- One set at a time: swap sets to swap builds. Raid tier sets come later, with 4 pieces and 2 + 2 mixing.

### Barrow Crypt sets: raise the dead

| Set | Look | 2 pieces | 3 pieces |
| --- | --- | --- | --- |
| **Barrowguard** (tank) | Bone-white plate, skull shoulders, coffin-lid shield | Perfect blocks give you a 150 bone shield | Slam raises 2 skeleton thralls for 8s; they fight beside you and soak hits |
| **Candlewake** (healer) | Black robes, candle crown, a lantern | Mend leaves a candle that heals 40 more over 4s | An ally who would die becomes a ghost for 6s, still fighting, and you heal them back to life. Once per ally per fight |
| **Rimebone** (DPS) | Frosted bone crown, icicle shoulders | Comet on a frozen mob refunds half its cooldown | Blizzard rains bone shards; anything that dies in it rises as a frost skeleton that fights for you for 6s |

### Sets by dungeon

Dungeons 2 to 4 are placeholder themes; their names come with the races pass.

| Dungeon | Set family | Tank, 3 pieces | Healer, 3 pieces | DPS, 3 pieces |
| --- | --- | --- | --- | --- |
| 1. Barrow Crypt | Raise the dead | Slam raises thralls | Dying allies become ghosts | Blizzard raises frost skeletons |
| 2. Goblin dungeon | Bombs and gold | Perfect blocks drop a lit bomb | Ward becomes a patch-up turret | Comet splits into 4 frost bombs |
| 3. Fungal hollow | Spores and spread | Taking hits puffs out healing spores | Mend plants a bloom that bursts to heal the group | Kills in Blizzard spread the frost to neighbours |
| 4. Storm peak | Chains and speed | Charge chains to 3 more mobs | Mend bounces to 3 allies | Frostbolts chain to 3 targets |

By dungeon 4 that's 4 sets × 3 talent paths × 3 weapon traits: 36 core builds per role before hybrids, all sim-tested. A few it makes:

- **Necro-mage**: Rimebone + Whiteout. Blizzard everything and raise an army.
- **Bomb wall**: goblin tank set + Bulwark. Every perfect block explodes.
- **Nobody dies**: Candlewake + Dawn. Ghosts first, then Second Sunrise, then Dawn.
- **Thrall king**: Barrowguard + Warden. Skeletons hold the adds while you hold the boss.

**Decided and built: 4 slots**, so the weapon chase stays separate from the set chase.

## Loot

Loot runs on OSRS rules: every unique has its own drop rate, rare means properly rare, and a 1-in-5,000 pet is the flex. Each player rolls their own table on every clear, so nobody fights over drops.

### Barrow Crypt drop table

| Drop | Rate | Average time (4-minute clears) | Notes |
| --- | --- | --- | --- |
| Regular gear | Every clear | Every clear | The Common → Epic ladder, plus a piece for one of your other roles |
| Set helm for your role | 1/50 | About 3 hours 20 | Barrowguard, Candlewake or Rimebone |
| Set shoulders | 1/50 | About 3 hours 20 |  |
| Set chest | 1/50 | About 3 hours 20 |  |
| Sir Rattlebones' Plume | 1/50 | About 3 hours 20 | From the mini boss; a trophy for the mantel |
| Gravekeeper's weapon for your role | 1/100 | About 7 hours | The Gravedigger, Lantern of the Long Night or Gravefrost Staff, each with its own effect |
| Gravehound (mount) | 1/1,000 | About 67 hours | Waits in the Hearth's stall |
| Ghostly Dye | 1/1,000 | About 67 hours | Your Barrow set goes pale and see-through. Looks only |
| Pint-sized Gravekeeper (pet) | 1/5,000 | About 333 hours | Sits by the fire at home |

- Rolls are independent, OSRS style: two uniques in one clear can happen, and so can a 200-clear dry streak (about 1 player in 60).
- A full set for your role averages about 90 clears, roughly 6 hours.
- No pity on uniques. Duplicates give 3 Barrow Marks each.
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

**Open call:** add Boots and Gloves to the sets? More to chase, about 2 more hours per full set. My pick: save them for raid sets and keep dungeon one at 3 pieces.

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

### More dopamine, cheap to build

- **Collection log** per dungeon, OSRS style: every piece, look, title and pet is a slot that lights up.
- **Boss pet**: a pint-sized Gravekeeper, 1 in 5,000 from the final chest, with its own walkout. It sits by the fire in your Hearth; following you into dungeons comes later.
- **Run report**: built as the chest reveal. Cards come out face down and flip rarest last, then kill counts, time and best, Marks, the collection log and achievements. XP and levels come with talents.

## Making it fair

Every talent path, every set and the main hybrids get 20 seeded bot clears each, and no build may land more than 5% off the rest.

- Clear time within ±5% of the baseline, with the same number of deaths.
- Each role's own number within ±5%: damage for the DPS, healing for the healer, damage soaked and threat held for the tank.
- No trap picks: a talent that no strong build takes gets buffed or replaced.
- After each pass you get a one-page balance table.

Today's baseline, after the threat and difficulty pass (14 Oct): bots clear Barrow Crypt in about 4:10 on Common gear and 3:05 on Epic with no wipes, and the Gravekeeper takes about two minutes. The repo's npm run sim prints the full table.
