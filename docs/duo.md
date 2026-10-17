# Duo Rework

A copy of the Duo Rework doc on claude.ai (https://claude.ai/artifact/1JHxqY3H9ikFqWZ216Qpew), for agents who can
only read the repo. 18 Oct 2026.

Highfell becomes a duo game: every run is two heroes, you and your mate (or a bot), every class deals damage, and
the teamwork lives in mechanics that take both of you. The owner made the big calls on 18 Oct; this is the plan to
build it, with the open calls marked for him. Until a stage lands, the pillars and decision rows in `AGENTS.md` that
it replaces still describe the live game.

## Decided on 18 Oct

- **Every run is two heroes: you and your mate.** With nobody to play with, a bot takes the other seat (or, once
  your Warband opens, one of your own heroes).
- **Groups of friends are for raids**, somewhere between 4 and 10 players, as a later plan. Whether Heroic takes a
  third or fourth is a call below.
- **Every class deals damage.** No tank, no healer, no supports. Four classes: the warrior, the mage, the rogue and a
  new ranger, who takes the cleric's place.
- **Teamwork lives in the mechanics:** chains, two-hands puzzles, combos, picking each other up. The game never
  tells you who does what.
- **One on the boss, one on the adds is the deep end.** A single-target hero on the boss while an AoE hero clears
  the adds is the best a pair can play, so bosses keep bringing adds that matter. It's never forced, never labelled
  and never part of matchmaking: it's what two friends discover.
- **Carrying is in:** a high-level mate lifts a low-level one.
- **Commit, classes included.** Every class gets reworked for the pair.

**What doesn't change:** four buttons and a dodge on the one-second beat; fillers, payoffs and interrupts that
Expose; 3 to 4 minute runs that melt as you level; honest loot, logs, kill counts and the walkout; levels, talents
and two specs a class; the house, garden and brews; Heroic opening on 3 log pieces; one HTML file; saves that never
lose data.

## The owner's calls

Fifteen calls, each with my pick. The owner agreed all fifteen on 18 Oct, changed the fourth class to a ranger, and
added the shape of raids: four players as two pairs, each pair with its own duo mechanics, plus some for all four.

| # | The call | My pick | Why | His call |
| --- | --- | --- | --- | --- |
| 1 | Heroic party size | Two, like Normal | Every Heroic mechanic is built and tuned for exactly two; bigger groups get raids | Yes |
| 2 | Raid size | Start at four, grow toward ten once the phone screen copes | Ten heroes on a portrait phone is a lot of noise | Yes: four, as two pairs with their own duo mechanics, plus some for all four |
| 3 | The meter | A duel card at the end of every run, plus a live meter you can switch on in Settings | Rivalry without staring at numbers mid-fight | Yes |
| 4 | Going down | At zero you go down, not out; your mate stands beside you about 1.5 s to pick you up; both down is a wipe | The best "I've got you" moment in co-op | Yes |
| 5 | Health with no healer | Full again within about 2 s once nothing's on you; every payoff heals you a little | Your rotation keeps you up, and no waiting between packs | Yes |
| 6 | Who the boss hits | No threat: he marks who his next big swing is for; block it or dodge it, and a perfect one opens him up | Every class gets the moment the tank had | Yes |
| 7 | Threat on packs | Gone: packs go for whoever's nearest, and the warrior's Slam turns them on him for 3 s | One less system, and the warrior still stands in front | Yes |
| 8 | Curses | Only your mate lifts your curse, with a swipe across you or your frame | The healer's one great job becomes a pair job | Yes |
| 9 | Combos | Any payoff on a foe your mate set up is a COMBO: half again as hard, a gold pop, counted on the duel card | The synergy of a rogue and a mage together, made visible | Yes |
| 10 | Boss spec and pack spec | Each class's two specs lean one way: Sword and Greataxe, Longbow and Trapper, Fire and Frost, Venom and Blades (boss first) | Any pair can split the boss and the adds, even two of the same class | Yes |
| 11 | Adds in boss fights | Every boss brings adds that matter if left alone: they shield him, heal him or curse you | Gives the pack hero a real job and makes the split worth it | Yes |
| 12 | The fourth class | Was: the cleric as a holy damage class (Wrath and Mace). Now: a ranger in its place, Longbow and Trapper | Two classes in close and two at range; the healer was the hardest class to turn into damage | Changed: a ranger (his pick) |
| 13 | Bots | Good at the mechanics, but a beat slower than a sharp mate | Playing with your mate should be the quickest way to clear | Yes |
| 14 | Points and set bonuses that change | Points in a reworked talent come back to spend, with a note; tank and healer sets get damage bonuses but keep their looks and log slots | Nobody loses what they've found or earned | Yes |
| 15 | Playing together online | First, a one-day test of the live page's room feature (people in the owner's claude.ai organisation); a game server later if that's too slow | Could be the quickest way to get two of you in a run | Yes |

## The four classes

Four classes: the warrior, the mage, the rogue, and a new ranger who takes the cleric's place (the owner's call, 18
Oct). Every one is a damage class with the shape the combat overhaul gave it: a filler to press every beat, a payoff
it sets up, two cooldowns, and one button that stops casts. Each has a boss spec and a pack spec, free to switch, so
any pair can split the work, even two of the same class. Names marked * are drafts.

| | Boss (one big foe) | Packs (many foes) |
| --- | --- | --- |
| In close | Sword* (warrior), Venom (rogue) | Greataxe* (warrior), Blades (rogue) |
| At range | Longbow* (ranger), Fire (mage) | Trapper* (ranger), Frost (mage) |

### Warrior: the anvil

- **In the pair:** up front. He gathers the pack and takes the big swings, so his mate can stand still and burn.
- **Cleave** (filler) every beat; **Crush** (payoff) after a Charge, a Slam, a perfect block or a crit.
- **Charge** rushes a foe, stuns what's round it and stops its cast. **Slam** drags the pack into a pile (made for
  your mate's Blizzard or Fan) and turns them on you for 3 s. **Shield** (hold) blocks anything in front, and a
  perfect block opens the boss up for you both; with the greataxe it's a parry on the same button.
- **Sword*** (boss): one-handed, sword and shield. Every hit speeds your swings up, stacking, and it's the hardest
  single-target hitter in close. **Greataxe*** (packs): the shield goes on your back and a two-handed axe sweeps,
  with wide Cleaves, whirlwinds and Crushes all round.
- **Stays up by** blocking, and every Crush heals him a little.

### Ranger: the new class

- **In the pair:** at range with a bow, marking foes for both of you and laying traps the warrior can drag a pack
  into.
- **Quick Shot*** (filler): an arrow every beat that marks its foe. **Longshot*** (payoff): on a foe with three
  marks, or an Exposed one, a drawn arrow that hits hard and goes through to the foes behind it.
- **Pin Shot*** stops a cast and Exposes the caster. **Snare*** throws a trap that roots whatever walks in; on
  Trapper it bursts into **Arrowfall***, a rain of arrows on the spot.
- **Longbow*** (boss): bigger Longshots and marks that stack higher. **Trapper*** (packs): more traps, a bigger
  Arrowfall, and Longshots that split.
- **Stays up by** keeping his distance: the dodge and the snare, and every Longshot heals a little.
- **New art and gear:** a bow, a hood and a quiver on every race. The cleric's sets (Candlewake, Sporebloom) and
  weapons become the ranger's sets and bows and keep their log slots. A cleric hero picks a new class once and keeps
  its race, name and level.

### Mage: the artillery

- **In the pair:** at the back, freezing or burning what the warrior gathered. Freeze and Burn are the setups
  every mate wants.
- The buttons stay: Icicle (filler) and Shatter, Blizzard, Rime burst (stops casts), Comet. Fire keeps Firebolt and
  Flare, Firestorm, Ember burst and Combust.
- **Fire** (boss): Burn builds over a long fight. **Frost** (packs): freeze the adds and shatter them.
- **Stays up by** knocking foes off with Rime burst or Ember burst; payoffs heal a little.

### Rogue: the knife

- **In the pair:** finishes what the mate set up, and poisons foes for the mate's payoffs.
- The buttons stay: Viper Blades (filler, poison, points), Shadowstrike (payoff), Fan of Blades (stops casts round
  you), Shadowstep (stops a cast, gets you out).
- **Venom** (boss): one foe at a time, huge Shadowstrikes. **Blades** (packs): every foe at once.
- **Stays up by** Shadowstepping out of trouble; Shadowstrike heals a little.

The warrior changes most of the old classes, and the ranger is new. The mage and rogue keep their buttons and gain
the lean, the combos and the duo mechanics. Every reworked talent keeps the rule: a pick of two from row 2, never a
new button.

## Combos: your setup, my payoff

Every class leaves something on a foe that its mate's payoff loves. Any payoff on a foe your mate set up is a
**COMBO**: half again as hard, a gold COMBO pop, and it counts for both of you on the duel card (one set it up, one
landed it). Your own setups still feed your own payoffs as now; a combo is when it crosses the pair.

| Setup | Left by | Your mate's payoff on it also |
| --- | --- | --- |
| Frozen (a boss is Chilled) | Frost mage: Rime burst, Blizzard, Comet | Shatters, bursting ice on the foes round it |
| Burning | Fire mage: 3 or more Burn | Spreads the Burn to the foes round it |
| Stunned (a boss is Staggered) | Warrior: Charge, Slam, Rim Strike | Knocks it down, so the stun lasts a beat longer |
| Poisoned | Rogue: Viper Blades | Cashes the venom in at once |
| Marked | Ranger: three Quick Shots | Lands as a crit |
| Exposed | Anyone: an interrupt, a perfect block or dodge | The burn window you hit together: every payoff half again, as now |

Two of the same class combo too (two rogues poison for each other), but a mixed pair has more to set up, so it
feels the synergy most. The split and the combos work together: the pack hero's Blizzard over the boss Chills him
for the boss hero's Shatter, and the boss hero's interrupt Exposes an add for the pack hero.

## Staying alive without a healer

Damage becomes something you avoid, not something someone heals. Beginner gear still struggles: in Common at level
1 the Barrow hits hard enough to put you down.

- **Between packs:** once nothing's on you, you're full again in about 2 seconds. No waiting.
- **In a fight:** every payoff heals you a little, so playing your rotation well keeps you standing. The warrior
  blocks; everyone else dodges.
- **Perfect dodge:** dodge just as a big hit lands and it misses you and opens the boss up, like a perfect block.
  Every class gets the skill moment the tank had.
- **Going down:** at zero you go down, not out. You lie in a ring of light, your frame goes grey, and your mate
  stands beside you for about 1.5 seconds to pick you up at 40%. Both down is a wipe: back to the last checkpoint,
  as now.
- **Curses:** only your mate lifts yours, with a swipe across you or your frame. A missed curse drops you to a
  tenth and never kills. A bot companion lifts yours a beat late, so a sharp mate is better.
- **Brews** stay: one bottle buffs you both.

## Duo mechanics

Each one is a shared part, like today's cones, lines, circles and adds (`src/dungeon/moves.js`), so every new
dungeon can use it. Each takes two of you, works with a bot, and reads on a phone. Every boss gets adds and at least
one more. None of them say who should do what.

| Mechanic | What happens | Why it takes two |
| --- | --- | --- |
| Adds that matter | Waves of adds all through a boss fight; left alone they shield him, heal him or curse you | One on the boss and one on the adds is the fastest way through |
| Lift | A curse or a Sticky Bomb on one of you | You can't lift your own |
| Break free | Chains or a Bone Cage hold one of you | You can't hit your own chains |
| Two keys | Two bells, valves or altars; both at once drops a shield | One hero can't be in two places |
| Split pair | Two linked foes: kill them within 3 s of each other or the other gets back up | Each of you takes one |
| Share the hit | A circle that splits its hit between whoever's in it | Alone it hurts; together it's half each |
| Spread | Marks that burst on anyone near you | You have to split up |
| Relay | A bomb knocked mate to mate grows each pass, then goes into the boss | You can't pass to yourself |
| Lantern | In the dark, one of you carries the light; pass it so the other can fight | Only one can hold it |
| Flank | The boss guards his front, so the other hits his back | He can only face one of you |
| Twin casts | Two casters cast at once | One interrupt can't stop both |
| Bait | The boss charges the marked hero: lead him into a wall and he's stunned for you both | One baits, one punishes |

**Who gets what**

| Where | Its duo mechanics |
| --- | --- |
| Barrow packs | Gravecallers' curses (Lift), Soul Chains on the path (Break free), coffins that open in pairs (Split pair), casters in pairs (Twin casts) |
| Sir Rattlebones | Adds from the bone piles, his shield wall (Flank), the Bone Cage on either of you (Break free) |
| The Gravekeeper | Adds every phase, his charge at the marked hero (Bait), lights out with one Lantern (Lantern), two grave-bells to ring together to stop Raise Dead (Two keys) |
| Thimblebriar packs | Bombs knocked between you (Relay), Bombwrights' Sticky Bombs (Lift) |
| Old Toadstool | Waddlecap adds, spore clouds to share (Share the hit), spores that burst near you (Spread) |
| The Tinker King | Gnome adds that patch his suit, Sticky Bombs (Lift), two steam valves at once to vent the suit (Two keys), the Bomb Barrage (Relay) |

## The duel card

At the chest, a card for each of you, side by side:

- Damage, and each of your shares of it
- Biggest crit
- Combos you set up and combos you landed
- Mechanics: curses lifted, chains broken, keys turned, mates picked up
- One MVP line each, from what you did most: Top damage, Combo maker, Lifesaver, Bomb thrower*
- Your best on this dungeon beside today's number

Doing the mechanics is how you top it: a relayed bomb, a combo and an Exposed window all count as your damage, so
the competitive one is the one doing the work. A win goes on the Share card. With a bot, it's you against the bot
and your own best. A live meter is a Settings switch, off by default (call 3). Nothing drops because of it: loot
stays honest and fixed-rate, rolled for each of you on your own.

## Carrying, bots and playing together

**Carrying.** The pair hits with the higher hero's level bonus. Your level already lifts your whole party, so a
level 99 mate lifts a level 10 one. Each of you earns your own XP and rolls your own loot, so the one being carried
never takes anything from you. The Dungeons sheet's warning weighs the pair, not just you.

**Your companion.** Alone, the other seat takes a bot of any class at your level, and you pick which. Once your
Warband opens (every dungeon cleared once) and the hero you're playing has a full set of Rare, one of your own heroes
can come instead, in its own gear, never taking loot (the owner's call, 18 Oct: your level is shared by all your
heroes, so what's fresh about a new one is its gear, and it climbs to Rare on its own, with a bot). Bots do every duo
mechanic, a beat slower than a sharp mate.

**Playing together online** isn't built yet, and it's the biggest piece after this plan. Two ways in:

1. The live page's room feature already passes messages between people in the owner's claude.ai organisation who
   have the page open. One browser would run the fight while the other sends its presses. A one-day test tells us
   if it's smooth enough for two.
2. A small game server later, for anyone, with invite links. Matchmaking comes after that; until then it's an
   invite or a bot.

## Build stages

Six stages, like the combat overhaul. From stage 3 on, each one is live and playable when it lands.

1. **The brief.** The pillars and decisions rewritten for the duo in their own commit, and this plan copied into the
   repo for the other agents.
2. **Plumbing.** Heroes known by seat and class instead of tank, healer and DPS, with nothing you can see changing
   yet. Everything else stands on it (What it touches, below).
3. **The first duo.** Two seats: your companion picked on the Dungeons sheet, two party frames, two heroes at the
   door. No healer needed: refills between packs, payoffs that heal, going down and being picked up, perfect dodges.
   Bosses swing at a marked hero, your mate lifts your curses and breaks your chains, threat is gone, and every boss
   is retuned for two. The warrior plays as a damage class; a cleric keeps its buttons until the ranger lands.
4. **The ranger and the warrior's specs.** The ranger's buttons, specs, talents, art and sounds; the cleric's sets
   and weapons redrawn as the ranger's; cleric heroes pick a new class once; the warrior's Sword and Greataxe specs
   and reworked talents, with their points back.
5. **Duo mechanics, adds and combos.** The shared parts, each boss's set from the table above, adds through every
   boss fight, and COMBO across the pair.
6. **The duel card and the balance pass.** The card and the live meter, the bots' timing, the coach and the Crypt
   Trial, achievements reworded, the balance tests rebuilt for pairs, and the docs.

Online play is its own plan, with carrying, which only matters once two real players with different levels share a
run. The one-day test in call 15 can run alongside stage 3.

## Who builds what

The owner's call (18 Oct): build it with several agents at once. Stage 2, the plumbing, comes first from the
integrator; then six workstreams run side by side, each on its own branch, and the integrator merges, rebalances,
audits and publishes. The rules, the contracts and each agent's brief are in `docs/duo-agents.md`.

| # | Agent | Builds | Starts |
| --- | --- | --- | --- |
| 0 | Integrator (the publishing Claude) | The plumbing, then merging, balance, the audit, the docs and the publish | Now |
| 1 | Art and sound | The ranger on every race, its sets and bows, the warrior's greataxe, icons, sounds | Now |
| 2 | Staying alive and the old classes | Going down and picking up, perfect dodges, payoffs that heal, COMBO; the warrior's Sword and Greataxe; the mage's and rogue's lean | After the plumbing |
| 3 | The ranger | Its buttons, talents, traits, sets, bows and bot | After the plumbing |
| 4 | Bosses and duo mechanics | No threat, marked swings, pair jobs, the shared duo mechanics, each boss's set, a first retune | After the plumbing |
| 5 | Two seats and the screens | Two frames, the door, the companion picker, the duel card and meter, the hero maker, the cleric's class pick | After the plumbing |
| 6 | Teaching and words | The Crypt Trial, the coach, tips, achievements reworded and new | After the plumbing |

## What it touches

The trinity is in the foundations, so the first build step is plumbing you won't see.

- **A hero is its role.** In the engine a hero is known as "the tank" or "the healer": its id is `'h_' + role`, which
  keys the mobs' threat maps; the party frames find heroes by `data-role`; `heroBy(role)` is called 23 times. Two
  heroes of the same class would collide, so heroes become seat one and seat two, each with a class.
- **The class key is the role.** `GearKey` (`RoleId | 'rogue'`) keys the buttons (`AB`), traits, gear names, key
  bindings (`highfell.keys`) and the art layers. Where those names are saved they stay inside the code; the game
  shows classes.
- **Saved item ids name the role** (`gravekeeper.tank` and its `.gilded` kit; regular gear like
  `gear.tank.helm.2`). They stay as they are, so nobody's collection moves.
- **The bosses lean on the healer and the tank:** curses, chains (`cutChain`), wisps and the Sticky Bomb only the
  healer could clear; a Bone Cage that only takes the tank; `tankBuster` cones and circles, crushing blows on anyone
  else (`meleeTick`), mobs going wild off the tank; only the tank blocks and bats bombs back. Each becomes a pair
  mechanic.
- **Size:** 104 role checks in 23 files (`bots.js` 24, `run.ts` 17, `mobs.js` 11), `roleOf` 46 times, about 55
  tests (balance, dungeon, coach, warband, input, meta and others), the three seats in the run's frames
  (`styles.css` lays them out as `repeat(3, …)`), the door (`DungeonStage.heroes.x` is three numbers) and the Who goes
  in page, and four docs.
- **Saves change little:** heroes store their class, not a role, and seats aren't saved. `Profile.warband` (the
  shared gear floor per role, `PROFILE_VERSION` 11) becomes one per class, and a cleric hero picks a new class once.
