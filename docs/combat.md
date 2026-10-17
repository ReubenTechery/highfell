# Combat Overhaul

> A copy of the Combat Overhaul doc on claude.ai (17 Oct 2026), so every agent can read it: the plan for making combat feel like WoW's, built in six stages. Keep it true: when a stage ships or the owner changes a call, change it here in the same pull request. Where it and the code disagree about what's built, the code wins; for what's planned, this doc wins.

Combat gets WoW's core: a one-second beat that catches every press, and a button you can mash on every class. Procs light up the payoff, and every hit lands with a freeze, a flash and a crunch. Packs and bosses are rebuilt so every role has a real job on every pull, still four buttons and a dodge, shipped in stages you can play one at a time.

## What WoW gets right

WoW feels good because mashing is never wrong, a steady beat tells you when to press, and every press lands with a sound and a number. Highfell already has good bones (combos, threat, a healer with a real job), but it throws away early presses, has no beat and hides its payoffs.

| Ingredient | WoW | Highfell today | This plan |
| --- | --- | --- | --- |
| Mashing is never wrong | A press in the last 0.4 s before a button is ready is queued and fires the instant it is | A press on cooldown is thrown away with a buzz; one during a Charge, a dodge or a cast is dropped without a sound | Every button queues; on the phone, holding a button keeps firing it; no buzz |
| A steady beat | A global cooldown (1 s for rogues, 1.5 s for most) sets the rhythm | No shared beat: each button runs its own timer, 2.2 to 13 s, so presses bunch up, then nothing is ready | A 1-second beat shared by the four buttons |
| A button you can always press | Every class has a filler (Sinister Strike, Frostbolt) | Every button has a cooldown; auto-attacks fill the gaps without you | Each class's main button becomes its filler, free on every beat |
| Build, then spend | Combo points and rage: small hits bank up for one big one | Combos exist (Charge then Cleave, venom then Shadowstrike, freeze then Shatter), but they switch on and off, with nothing banking up | Combos stay; the rogue banks combo points, and a crit on any filler can prime the payoff |
| Procs you can see | A proc puts a glowing border round one button, rarely enough that it matters | After a class's first five runs, any button whose moment has come glows gold with a word (CRUSH!, SHATTER 3×!, KICK!, STORM!, VENOM!), so several often glow at once | Gold for the payoff alone; warnings (BLOCK!, KICK!) keep their words without the glow, and suggestions go |
| Every press lands | Instant swing, a sound per spell, a number; crits bigger and louder | A swing sound and a number, but most hits land in silence, the freeze on impact only comes with crits, Crush and kills, and bosses flash only on big hits | A spec for each kind of hit: normal, crit, payoff, kill |
| Gear you can feel | A new weapon lifts every hit; numbers climb tier by tier | Power multiplies damage and healing and adds up to 14% crit | Numbers that climb with Power so a new weapon shows on the next swing |
| Packs with jobs | Melee to gather, casters to interrupt, healers to kill first, swirlies to dodge | Some mobs give a role a job: Raise Dead to interrupt, curses to lift, bombs to bat back, spore clouds to drag the pack out of | Every pack built from a short list of mob jobs |
| The tank's job | Threat, taunts, gathering packs, facing the boss away | The tank earns threat, Slam taunts, and bosses crush anyone else they hit | Kept, with threat you can read at a glance |
| The healer's spam | Click a frame to heal; shields, heals over time, mana to manage | Tap a name to Mend; Ward, Prayer circle and Sunburst; Smite refills mana | Kept; Mend joins the beat, and every heal lands with a sound and a number |

## Where we are today

The game already clears inside its target times. But automatic swings and long boss fights carry the fighting, and some buttons hardly matter. These numbers come from 80 bot runs of the real engine, 8 seeds a setup, so they show how bots play, not people.

### Clear times

| Setup | Barrow, mage | Barrow, rogue | Thimblebriar, mage | Thimblebriar, rogue |
| --- | --- | --- | --- | --- |
| Beginner gear (Common; Epic for Thimblebriar, which it's tuned for) | 3:26 | 2:58 | 3:58 | 3:29 |
| Best gear | 1:27 | 1:18 | 2:22 | 1:53 |

About 28 s of every Barrow run is walking between fights, which is a third of a best-gear run.

### What the numbers say

1. **Automatic attacks do 24 to 32% of every class's damage in beginner gear.** With a filler on the beat, that moves into your presses.
2. **Bosses are 68% of the Barrow's fighting.** Packs die in 6 to 15 s with Common bots and in 1.4 to 6 s in best gear. Sir Rattlebones takes 44 s and the Gravekeeper 78 s.
3. **Dead air** (no button ready): tank 12%, healer 0%, mage 16%, rogue 31%.
4. **One button per class barely matters.** Bots leave Charge ready and unused 84% of the time, Sunburst 96%, Blizzard 72% and Fan of Blades 59%. Charge does 2% of the tank's damage.
5. **The rogue out-damages the mage** by 34% in beginner gear and 49% in Thimblebriar's best.
6. **Smite is the healer.** It's over half the healer's damage and a quarter to two thirds of its healing. In the Barrow's best gear the healer has almost nothing to do: 17 healing a second, 59% of it wasted on full health.
7. **Interrupts barely happen:** about 1.2 a run, against about 4 curses.
8. **Thimblebriar in Common gear wipes at the Tinker King every time.** That's by design: it asks for Power 22.

## Your calls

Sixteen calls, each with my pick, in the order the stages need them. Set each one in the last column, and I'll rework anything you change before building. Stage 1 needs only the first three.

| Stage | The call | My pick | Why | Your call |
| --- | --- | --- | --- | --- |
| 1 | A one-second beat for the four buttons. Dodge, block, Charge, Shadowstep and the healer's swipes stay off it | Yes | It's what makes mashing right and each press count | Agree |
| 1 | Presses queue up to 0.4 s early; on the phone, holding a button repeats it | Yes | Mashing is never wrong, and the thumb can rest | Agree |
| 1 | On a computer, the four buttons default to E, Q, F and R beside WASD, keyboard only, with 1 to 4 still working | Your pick | Your fingers never leave WASD | Agree |
| 2 | After a class's first five runs, gold is for payoffs only; warnings keep their words; suggestions go | Yes | One glow you can't miss beats five you learn to ignore | Agree |
| 3 | Each class's main button loses its cooldown and becomes its filler | Yes | Something worth pressing every beat | Agree |
| 3 | Casters lose their automatic attacks; melee keep smaller ones | Yes | Your presses do the damage | Agree |
| 3 | The rogue banks points: Viper Blades builds, Shadowstrike spends | Yes | The Sinister Strike loop | Agree |
| 3 | Crush has to be set up, and is no longer automatic on bosses and big mobs | Yes | A payoff needs a setup | Agree |
| 3 | Heals can crit | Yes | The healer gets big numbers too | Agree |
| 3 | Mage and rogue within 10% over a whole run, the rogue ahead on a lone boss and the mage on packs | Yes | Today the rogue is 34 to 49% ahead | Agree |
| 3 | No haste: the beat stays one second at every gear level | Yes | Gear shows as bigger hits and more procs, and tuning stays simple | Agree |
| 4 | Casts stop only to interrupts (not to damage), and three bosses' party-wide hits become casts to interrupt (the Tinker King keeps his bombs) | Yes | A job for the tank and the DPS, and burn windows | Agree |
| 4 | One new mob job: the mender, a recoloured Gravecaller and Bombwright | Yes | "Kill the healer first", for little art | Agree |
| 4 | Pulls carry more of the run: packs 12 to 20 s, the Gravekeeper 60 to 75 s, the clear bands unchanged | Yes | More pulls with jobs, same run length | Agree |
| 5 | Exposed counts as the setup for every class's payoff | Yes | The group's burst, earned by skill | Agree |
| 6 | Keys can be rebound, per device, kept in the browser, not the save | Yes | No save change; bindings belong to a keyboard | Agree |
| 3 | Mend joins the beat, with a bigger heal (about 230) | Yes | Each beat the healer chooses: heal, or Smite for mana | To ask before stage 3 |
| 3 | Rework the gear the fillers break (the gear audit under Numbers, Power and gear) | Yes | Otherwise a few traits and boss weapons stop working | To ask before stage 3 |

## The beat

A one-second beat shared by the four buttons, a queue that catches early presses, and holding a button to keep firing it. Together they make mashing the right thing to do, as it is with Sinister Strike.

A press is never thrown away:

- **Ready now:** it fires at once.
- **Ready within 0.4 s, or the hero is mid dodge, Charge or cast:** it waits and fires the moment it's ready.
- **Otherwise:** it's let go with no buzz, and its timer ring pulses once.
- **Held down on the phone:** it fires again whenever it can.

### The rules

1. **The beat.** Firing a button on the beat (all four, except the off-beat ones in rule 5) starts a 1-second beat, and nothing else on the beat fires until it ends. Mend joins the beat in stage 3 with its bigger heal; until then it keeps its own short pause. Brews and Lantern Zeal, which bring cooldowns back sooner, speed the beat up too. Gear never does. Buttons with their own cooldowns keep them; the beat stops presses bunching up.
2. **The queue.** A press up to 0.4 s before a button is ready is kept and fires the instant it is ready, whether it was waiting on its own cooldown or the beat. A press during a dodge, a Charge, a Shadowstep or a cast waits and fires the moment that ends. One press waits at a time and the newest replaces it. Dodging clears it.
3. **Hold to repeat.** On the phone, holding a button fires it every time it is ready, so the main button can sit under a thumb. Tapping another button while holding puts that one next, then the hold carries on. The shield is the exception (holding it blocks), and so are the two buttons you drag to aim. On a computer each key press counts, as in WoW, so holding a key fires it once.
4. **No buzz.** A press too early to queue is ignored quietly and the button's timer ring pulses once. The buzz stays only for a real "can't": not enough mana, or nothing in range.
5. **Off the beat.** Dodge, block, Charge, Shadowstep, the healer's swipes (curses, chains, wisps) and breaking cages never wait for the beat and never start it, so you can always get out of trouble. While the tank's shield is up, buttons on the beat wait until it comes down, so a held Cleave can't keep reopening the perfect-block window.

### Numbers

| What | Value | Why |
| --- | --- | --- |
| The beat | 1.0 s | WoW's rogue beat: busy on a phone, but every press still matters. Until stage 3 it's 0.8 s (see Stage 1, as built) |
| Queue window | 0.4 s | WoW's default: catches a mash, but not a press you made by accident |
| Queue during a dodge, Charge, Shadowstep or cast | Until it ends | Charge into Cleave, or a dodge into a strike, lands as one move |
| A filler's own cooldown | None, only the beat | Something worth pressing on every beat |
| Presses kept | 1 | The newest press wins, so you can change your mind |

### On screen

- A thin sweep runs round all four buttons during the beat, as WoW does.
- A queued button gets a small bright ring until it fires.
- A held button stays pressed in.
- Each button's own timer ring shows its cooldown, as now.

### In the code

- `src/dungeon/press.js` (new, because `heroes.js` is already past 600 lines): the beat (`h.beat`) and one waiting press (`h.next`, cleared by a dodge), checked every tick the way Mend's `h.queued` is today. `useAbility` starts the beat, and bots check it before they press.
- `src/content/keys.ts` (new): each class's default keys.
- `src/ui/input.ts`: presses go to the queue, held touch buttons repeat, a held key still fires once (the shield's key keeps blocking), and `HOOKS.nope` fires only for a real "can't".
- `src/ui/run.ts` and `styles.css`: the beat sweep, the queued ring and the held state.
- Tests in `tests/input.test.ts`: a press 0.3 s early fires on time; one 0.6 s early is ignored without the buzz; a press during a Charge fires on arrival; a held touch button fires once a beat; holding the shield and Cleave together never opens a free perfect block.

### Stage 1, as built

Live since 17 October 2026: the beat, the queue, holding on the phone, no buzz, E, Q, F and R on a computer, and bots pressing on the beat. Three things differ from the rules above until stage 3:

- **The beat is 0.8 s.** A full second with no filler to press slowed every clear by 4 to 9%, so it moves to 1.0 s with the fillers in stage 3.
- **The healer's four buttons stay off the beat.** With today's buttons on it, a bot healer fell behind and Thimblebriar wiped. They join the beat with Mend in stage 3.
- **A held key fires once, except the shield's,** which keeps blocking for as long as it's held. A browser shortcut (Ctrl, Cmd or Alt with a key) never fires a button.

Clear times barely moved (18 bot runs each; Barrow Crypt and the template dungeon in Common, Thimblebriar in Epic): Barrow Crypt 202 s (was 200), Thimblebriar 239 s (238) and the template dungeon 195 s (194). Heroic in full Epic wiped in 1 run in 60, down from 4.

## Tank

Cleave becomes the button you mash, Crush becomes the payoff you earn, and the shield stays the skill. Today a third of the tank's damage comes from automatic swings (45 every second), and Cleave, waiting 2.2 s between swings, does under half. Most of the swings' share moves into Cleave, so your presses do the damage.

### The buttons

| Button | Today | New | Beat | Glows gold when |
| --- | --- | --- | --- | --- |
| **Cleave** (filler) | 2.2 s cooldown, 70 (Crush 92), front arc; Crush on 2+ foes, a stunned or heavy foe, and always on bosses | No cooldown, once a beat, about 60 a hit. Crush (1.6×, a bigger knock-back, "Crush!") on a stunned or staggered foe, the first Cleave after a Charge, a Slam or a perfect block, and the Cleave after a Cleave crit (a Crush's own crit doesn't chain). Three or more foes is a normal Cleave. No longer automatic on big foes or bosses | On | The next Cleave will Crush |
| **Charge** | 6.5 s, rush a mob, stun the foes round it (a boss staggers for 1 s), takes 1.2 s off Cleave | 8 s. Same rush and stun, and it primes Crush instead of shortening Cleave | Off |  |
| **Slam** | 6 s, drag foes within 210 in, taunt for 4 s, 50 damage, then a two-spin whirlwind | 8 s. Same, and it primes Crush for the next Cleave | On |  |
| **Shield** | Hold to block the front; a perfect block stuns, strikes back and resets Cleave | Same, and a perfect block primes Crush and ends the beat, so Cleave fires the moment the shield comes down. While it's up, buttons on the beat wait | Off |  |
| Auto swing | 45 every 1.0 s, plus half to foes beside the target | 25 every 1.5 s, the target only: the axe keeps moving between presses |  |  |

### The rotation

1. Charge into the pack. It stuns, and Cleave glows.
2. Cleave: Crush.
3. Slam drags the pack in and taunts it, and Cleave glows again.
4. Cleave on every beat, Crush whenever it glows.
5. Hold the shield for the big hits. A perfect block makes Cleave glow, and it fires the moment the shield comes down.

On a boss: Charge whenever it's ready for its stagger, block the big swings, Cleave every beat, and Crush when it glows. With Crush no longer automatic on bosses, the boss fight has a rhythm: setup, crunch.

### Numbers to start from

Single target, Common gear: today Cleave's Crush on a boss (92 every 2.2 s) plus the auto swing comes to about 87 a second. New: Cleave 60 a beat, a Crush about every 4 s and the smaller swing come to about the same, so the boss fight's length holds. Final numbers are set against the sims in stage 3 (see Balance targets and tests).

### Sets and the boss weapon

Barrowguard (Cleave +25% and a heal on hit, Slam's chest bonus, the thralls) and the Gravedigger (every fifth swing digs in) need retuning, because Cleave now fires every second. See the gear audit under Numbers, Power and gear.

## Healer

Mend is the heal you spam, Smite is what you press when nobody needs healing, and mana is the game you play between the two. The automatic holy bolt goes. It did 18 every 1.4 s, a sliver of the healer's job, and Smite does that job better.

### The buttons

| Button | Today | New | Beat | Glows gold when |
| --- | --- | --- | --- | --- |
| **Mend** (tap a name) | 138 healing for 6 mana, then its own 0.56 s pause; a tap during the pause already waits | From stage 3: about 230 for 9 mana, once a beat (until then, today's 138 and its own pause). Heals can crit for 1.5×. A tap during the beat waits, and the latest tap wins | On | The party frames glow after a Smite crit: the next Mend is free and heals 50% more |
| **Smite** (filler) | 2.4 s cooldown; 74 to the tank's target, heals the most hurt mate by what it dealt, +3 mana, pulses Prayer circles | No cooldown, once a beat. About 60 damage; heals the most hurt mate for half of it; +4 mana. Hits a red bomb in reach first, as the holy bolt does today | On |  |
| **Prayer circle** | 5 s, 14 mana, aimed; mates standing in it heal fast | Same | On |  |
| **Ward** | 3.8 s, 10 mana, a shield on whoever needs it most | Same, 4 s | On | No glow: the word SHIELD! still warns of a tank buster, as now |
| **Sunburst** | 13 s, 22 mana, heals everyone and clears curses and roots | Same | On | No glow: the word CLEANSE! still warns of a root or a haunt, as now |
| Swipes | Lift curses, cut chains, pop wisps | Same | Off |  |
| Auto holy bolt | 18 every 1.4 s | Gone: Smite is the healer's damage |  |  |

### Mana, without drinking

The healer has 100 mana and gets back 1.6 a second in a fight (16 out of one). Mend's healing per point of mana stays about where it is (23 today, 25 new). Smite gives 4 back every beat it's pressed. The target to tune for: a healer who only Mends runs dry by the boss, and one who Smites on the quiet beats never does. That's WoW's mana game with no drinking.

### The rotation

1. Smite on every quiet beat. It hits the tank's target, tops up the most hurt mate and gives mana back.
2. Tap a name to Mend whoever is dropping. A tap during the beat lands the moment it ends.
3. Ward the tank when SHIELD! shows.
4. Drop a Prayer circle under the group on big pulls; your Smites pulse it.
5. Swipe curses off as they land, and Sunburst when the group is low or CLEANSE! shows.

### Numbers to start from

The most healing a second barely moves (about 246 today at the pause's limit, 230 new), but each heal is bigger and lands on the beat. The gold SAVED! for catching a mate under 15% stays, with the payoff hit feel. Both healer checks hold: an idle healer still wipes by Sir Rattlebones (more surely, with the holy bolt gone), and a bot healer still carries a Common-gear tank, tuned in stage 3.

## Mage

Icicle becomes the button you mash, freezing is the setup, and Shatter is the payoff. Today the automatic frost bolt (42 every 0.72 s, only while standing still) does about a quarter of the mage's damage. It goes, and Icicle takes its place on the beat.

### The buttons

| Button | Today | New | Beat | Glows gold when |
| --- | --- | --- | --- | --- |
| **Icicle** (filler) | 2.6 s cooldown; 72, a 25% crit chance; 3× on a frozen foe, 1.5× on a Chilled boss | No cooldown, once a beat, about 55 a hit. Shatter as now. A crit makes the next Icicle Shatter even if nothing is frozen (a Shattering Icicle's own crit doesn't chain). Can hit cages (see Bots), and hits a red bomb in reach first, as the frost bolt does today | On | Its target is frozen or Chilled, or the last Icicle crit |
| **Comet** | 5.6 s; a 0.9 s cast, then 315 plus 114 to foes nearby; 2× on frozen, 1.5× on a Chilled boss | Same | On (the cast is on the beat) | Its target is frozen or the boss is Chilled |
| **Blizzard** | 7.8 s; aimed; 20 every 0.5 s for 5 s, and slows | Same | On |  |
| **Rime burst** | 11.5 s; 50 round you; freezes foes for 3 s and stops casts; Chills a boss for 4 s | 10 s, and freezes for 4 s (from 3), so two Icicles fit in a freeze | On |  |
| Auto frost bolt | 42 every 0.72 s while standing still | Gone: Icicle is the mage's filler |  |  |

### The rotation

1. Blizzard on the pack the tank has gathered.
2. Rime burst when they're close, or to stop a cast. Everything freezes, and Icicle and Comet glow.
3. Comet into the frozen pack, then Icicle every beat: Shatter, Shatter.
4. Between freezes, Icicle every beat. A crit makes the next one Shatter anyway.

On a boss: Rime burst Chills him, and Comet and Icicle hit 1.5× while it lasts. Then Icicle every beat, waiting for crits.

### Numbers to start from

One target, Common gear, today: the frost bolt about 58 a second, Icicle about 28 and Comet about 48, so about 134. New: Icicle 55 a beat, Comet as now, and the extra Shatters from crits (about one beat in four) come to about the same. The mage can also move freely now; only Comet's cast needs standing still.

## Rogue

This is the Sinister Strike loop: Viper Blades builds points, Shadowstrike spends them, and venom ticks under it all. Today 28% of the rogue's damage is automatic swings (27 to 33 every 0.5 s), 20% is venom and only 10% is Viper Blades itself.

### Points

- Five pips over the rogue and on the Shadowstrike button. No name on screen is needed.
- Viper Blades adds 1 (2 on a crit). Fan of Blades adds 1 if it hits anything. Shadowstep adds 2.
- Shadowstrike spends them all. They stay on you, not the target, and fade 10 s after a fight.

### The buttons

| Button | Today | New | Beat | Glows gold when |
| --- | --- | --- | --- | --- |
| **Viper Blades** (filler, builder) | 2.3 s cooldown; 48, a 22% crit chance; venom: 30 every 0.5 s for 5.5 s | No cooldown, once a beat, about 40 a hit, +1 point (+2 on a crit). Venom as now | On |  |
| **Shadowstrike** (finisher) | 3.4 s; 76, and on a poisoned foe 1.35× and always a crit (about 205) | No cooldown. Spends every point, about 25 a point. On a poisoned foe 1.35× and always a crit, so about 340 at five | On | You have five points |
| **Fan of Blades** | 6 s; a spin round you that stops casts and refreshes venom | Same, +1 point if it hits | On |  |
| **Shadowstep** | 5.5 s; blink behind your target, strike, stop casts, 35% faster swings for 3.8 s, 2 s off Shadowstrike | 8 s. Same, but +2 points instead of the Shadowstrike cut | Off |  |
| Auto swing | 27 to 33 every 0.5 s | 22 every 0.7 s |  |  |

### The rotation

1. Shadowstep behind the target: 2 points and faster swings.
2. Viper Blades every beat: venom goes on and points climb.
3. At five, Shadowstrike glows. Hit it for the big crit.
4. Fan of Blades on packs and to stop casts, for a point.

### Numbers to start from

One target, Common gear, today: about 60 a second from swings, 60 from venom, 60 from Shadowstrike and 21 from Viper, so about 200. New: a cycle of about four Vipers and one Shadowstrike every 5 s (faster with crits), plus venom and the smaller swing, comes to about 185, a little under today. The rogue stays ahead on a lone boss and the mage ahead on packs (see Balance targets). The five-point Shadowstrike is the biggest number a rogue sees.

## Mobs and packs

Packs today are short and mostly simple. The bosses take two thirds of the fighting, and the whole game has one cast to interrupt. The plan gives every pack a job for each role, makes interrupts matter, makes mobs react when hit, and moves more of the run into pulls.

### Today

| Mob | Health (Normal) | What it does | The job it gives |
| --- | --- | --- | --- |
| Rattler, Scrapper | 735; 2,656 | 50 every 1.7 s | None: it dies to anything |
| Bone Archer, Slinger | 514; 1,857 | An arrow for 62 about every 3 s, half of them at a random hero | The tank has to go and get it |
| Bonebrute, Brass Stomper | 3,198; 11,562 | 140 every 2.7 s, and a 230 ground slam about every 9 s | Everyone dodges the slam |
| Gravecaller | 1,001 | Curses every 8.5 s, a rot pool every 7 s, and Raise Dead: the only cast in the game | The healer lifts curses |
| Bombwright | 3,619 | Lobs a bomb every 4 to 5 s, and a Sticky Bomb every 11 to 14 s | Bat bombs back; the healer lifts Sticky Bombs |
| Waddlecap | 3,290 | 55 every 1.85 s, and a spore cloud when it dies | The tank drags the pack out |
| Wisp | 1 | 145 on contact | Only the healer can pop it |

- **The Barrow:** 5 packs of 7 to 15 s each with Common bots, 23 trash mobs. A clear is 203 s, 179 s of it fighting, and Sir Rattlebones and the Gravekeeper are 68% of that.
- **Thimblebriar:** 4 packs of 17 to 24 s each, 16 trash mobs. A clear is 238 s, 224 s of it fighting.
- **Interrupts:** any 110 damage stops Raise Dead, so nobody needs to interrupt anything. Bots interrupt about 1.2 times a run.
- **Bodies:** mobs only flash for 0.08 s when hit. They never flinch, and they bunch round whoever they're hitting, which suits Cleave. There are no patrols.

### Mob jobs

Every mob does one job, and each dungeon dresses the jobs in its own look.

| Job | What it does | Who answers it | The Barrow | Thimblebriar |
| --- | --- | --- | --- | --- |
| Fodder | Melee, light health, in threes and fours | The tank gathers; everyone's area hits | Rattler | Scrapper |
| Shooter | Stands back and shoots whoever it likes | The tank Charges it, or a DPS kills it | Bone Archer | Slinger |
| Brute | Big, slow, heavy swings and a slam | The tank holds it, everyone dodges, DPS burst it | Bonebrute | Brass Stomper |
| Caster | A 2 s cast with an interrupt mark that hits hard if it lands | Tank or DPS interrupt | Gravecaller: Raise Dead and a new Grave Bolt (220 to a random hero) | The mender: its heal is a cast |
| Curser | Curses a hero | The healer | Gravecaller | Bombwright (the Sticky Bomb) |
| Mender (new) | Casts a 2 s heal on the most hurt mob every 6 s, which you can interrupt | Kill it first, or interrupt it | A Gravecaller in pale robes | A Bombwright in a medic's apron |
| Burster | Leaves a hazard when it dies | The tank drags the pack out | none | Waddlecap |

The mender is WoW's "kill the healer first" and the only new mob. It's drawn as a recolour of an existing sprite, so the art cost is small.

### Interrupts that matter

1. Casts are stopped only by an interrupt (Charge, Rime burst, Fan of Blades, Shadowstep), a stun, a freeze or a perfect block. Damage alone no longer does it. On a boss, Charge and Rime burst interrupt too, though they only Stagger or Chill him.
2. A cast you can stop keeps today's green bar (gold means you can't stop it).
3. "Interrupted!" gets the payoff hit feel, and the caster is Exposed (+35% damage taken) for 3 s.
4. The aim is 6 to 10 interrupts a run, up from 1.2, mostly from the tank and the DPS.

### Packs

Each pack is fodder plus one or two job mobs, never more. The tank's pull decides the order you deal with them. The Barrow's new pull list (Thimblebriar follows the same recipe):

| Pack | Room | Mobs | What it asks | Target, Common gear |
| --- | --- | --- | --- | --- |
| A | Hall of Bones | 3 Rattlers, a Gravecaller | Gather, interrupt the Grave Bolt, lift the curse | 12 to 15 s |
| B | Ossuary | A Bonebrute, 2 Rattlers | Hold the brute, dodge the slam | 15 to 18 s |
| C | Ossuary | 2 Archers, a Rattler, a Gravecaller (as today) | Fetch the archers, interrupt the Grave Bolt, lift the curse | 15 to 18 s |
| K | Knight's Tomb | Sir Rattlebones | See Bosses | 35 to 45 s |
| D | Catacombs | A Gravecaller, a mender, 2 Rattlers | Kill the mender first, and interrupt both casters | 15 to 20 s |
| E | Catacombs | The ambush: 6 Rattlers, a Bonebrute | The big area pull | 15 to 18 s |
| G | The Yard | The Gravekeeper | See Bosses | 60 to 75 s |

Trash goes from about a third of the fighting to a little under half. The clear stays inside today's 185 to 235 s band, because the bosses get shorter. This makes Normal busier on purpose, which the Crypt Seal decision avoided; the Crypt Seal itself stays Heroic only. The Crypt Trial plays packs B and C, which keep today's mobs.

### Mobs react

- Every hit flashes a small mob. A boss flashes on your filler, crits and payoffs, not on swings or venom ticks, so it doesn't strobe.
- Small mobs squash for two frames and are nudged back. This is only drawn, so the fight's timing doesn't change.
- A kill flings small mobs and collapses big ones. The last kill of a pack plays the pack-down chord.

### In the code

- `src/content/barrow/mobs.js` and `src/content/thimblebriar/mobs.js`: the menders, the casts and the pull lists.
- `src/dungeon/mobs.js`: casts stopped only by interrupts, Exposed on an interrupt, and the mender's heal.
- `src/dungeon/render.js`: the gold cast mark and the flinch.
- `tools/art_*.py`: the two recoloured menders.
- Tests: 110 damage no longer stops a cast but Charge does; a mender heals its pack; each pack's time lands in its band.

## Bosses

The bosses already have good mechanics: smashes to perfect-block, charges, adds, chains, cages and bombs. What they lack is WoW's rhythm. Each needs a tank buster to block, a cast to interrupt, and a burn window everyone feels.

### Today

| Boss | Fight (bots) | Big moves | Windows to hit back |
| --- | --- | --- | --- |
| Sir Rattlebones | 43 s, Common | Cleaving Sweep (295, perfect-blockable), Shield Charge (340 down a lane), Rally the Dead at half health (4 adds; he takes 60% less while they stand), Bone rattle (45 to everyone) | A Charge into a wall: Exposed 3.5 s. The last rally add: Exposed 3 s |
| The Gravekeeper | 80 s, Common | Shovel Smash (560, perfect-blockable), Dirt toss, Grasping Hands, then wisps, Soul Chain, Bone Cage and Grave cold (55 to everyone) | Chain cut: Exposed 3 s. Cage broken inside 2 s: Exposed 2.5 s |
| Old Toadstool | 48 s, Epic | Cap Slam (230, perfect-blockable), Puffball Volley, Spore Burst (75 to everyone) | A puffball knocked back beside him: Exposed 2.5 s |
| The Tinker King | 86 s, Epic | Wrench Smash (240, perfect-blockable), a swing about every second, Bomb Barrage, Sticky Bombs | Perfect blocks, and a gold bomb knocked back beside him |

A perfect block stuns any boss for 1.6 s and Exposes him for 3.5 s. No boss move can be interrupted. Exposed (+35%) already shows as a gold ring, the word and gold numbers, but nothing tells the rest of the party to cash in.

### The plan

1. **One cast to interrupt on three bosses, from moves they already have.** The party-wide hit becomes a 2 s cast with today's green bar: Sir Rattlebones' Bone rattle, the Gravekeeper's Grave cold and Old Toadstool's Spore Burst. The Tinker King keeps his bombs as they are, because knocking one back beside him is already his window. Interrupt a cast and the boss is Exposed for 3 s. Miss it and it lands as today, for the healer to fix. No new moves, just a job for the tank and the DPS.
2. **Burn windows you feel.** When a boss is Exposed he gets a gold outline and an "EXPOSED!" call, and it counts as the setup for every class's payoff. So Cleave Crushes, Icicle and Comet hit as if he were Chilled (1.5×, on top of Exposed's 35%), Shadowstrike hits as if you had five points, and Smite heals double. Everyone's gold buttons light up at once: that's the group's burst, earned by a block, an interrupt or a broken cage.
3. **Tank busters stay.** The perfect-blockable smashes are the tank busters. The tank blocks (BLOCK!), the healer Wards (SHIELD!), and a perfect block opens the window.
4. **The healer's test stays.** Missed interrupts, pulses, chains and curses.
5. **Shorter fights.** With bots: Sir Rattlebones 35 to 45 s and the Gravekeeper 60 to 75 s (from 80) in Common gear; Old Toadstool 40 to 50 s and the Tinker King 70 to 85 s in Epic gear. Full BiS still halves them. Boss health is set so the extra Exposed windows land in these bands.
6. **Enrage timers stay** as the backstop: 180 s, 300 s, 120 s and 210 s. Heroic follows the same rules: the Heroic Gravekeeper's Grave dust becomes a cast too, and Heroic's tuning is re-checked against its bands.

### In the code

- `src/content/barrow/bosses.js` and `src/content/thimblebriar/bosses.js`: the four casts and boss health.
- `src/dungeon/moves.js`: a cast that can be interrupted.
- `src/dungeon/entities.js`: Exposed counts as each payoff's setup.
- `src/dungeon/render.js` and `src/ui/run.ts`: the gold outline and the call.
- Tests in `tests/combos.test.ts` and `tests/balance.test.ts`: an interrupted cast Exposes the boss, a missed one hits the party, Exposed lights every payoff, and each fight lands in its band.

## Threat

Threat already works the way WoW's does, so this plan keeps the rules and makes them easy to read. Cleave becomes the tank's threat engine, and everyone can see at a glance which mob has slipped.

### How it works today

| Rule | Detail |
| --- | --- |
| Threat from damage | Damage × the role's threat (tank 1.3, others 1) × the hit's own multiplier (Slam 2), +1 |
| Charge | +260 on top |
| Taunt | Slam for 4 s and Charge for 2.5 s set threat to the top value ×1.3 + 40 and force the mob onto the tank |
| Healing | Half the healing done, split across every mob in the fight |
| Switching | A mob changes target only when someone beats its current target by 10% |
| Crushing blows | A boss or big mob hitting anyone but the tank does 1.85× |
| Wild | A small mob on a non-tank for over 3 s hits 1.4× harder, swings faster and moves faster |

### What changes

1. **Cleave is the tank's threat engine.** Cleave makes 1.5× threat and Crush 2×, so a tank pressing Cleave every beat holds a pack against a mage pressing Icicle every beat from the first second. A test checks exactly that.
2. **Taunts stay** as they are: Slam 4 s, Charge 2.5 s and +260.
3. **The tank sees slips.** A mob hitting someone else shows today's red "!!" straight away, alongside the TAUNT! and PEEL! warnings (words, no glow).
4. **Everyone else sees danger.** When a mob turns to you, your frame's aggro dot flashes (it exists) and an orange ring appears under you: get to the tank.
5. **No threat meter.** The red marks say enough and keep the screen clean.
6. **Slipping hurts, it doesn't fail you.** Crushing blows and wild mobs are the punishment, as now.

### In the code

- `src/dungeon/heroes.js`: Cleave's and Crush's threat.
- `src/dungeon/render.js`: the "!!" straight away, and the orange ring.
- `tests/dungeon.test.ts`: the tank holds against a mage on the beat.

## Hit feel

Every hit gets an impact sound and a flash. Crits and payoffs get a short freeze and a bigger number. The screen shakes only for the big moments. Today most hits land in silence, bosses barely react, and the shake fires on almost every Cleave, so the big moments don't stand out.

### What's there today

- **Sound:** most hits make no impact sound. You hear the swing or the launch, then nothing. Only Cleave and Charge thuds, your crits, Shatter and Comet sound on contact.
- **Bosses:** they flash only on a crit, a Shatter or a hit of 200 or more, so a normal hit on a boss shows nothing but a number.
- **The freeze:** it stops the whole game, timers included, and fires only on crits (0.035 s), Crush (0.038), Charge (0.045), kills (0.04, big 0.09), a Shattering Comet (0.08), perfect blocks (0.08, bots too) and SAVED! (0.12).
- **Shake:** 3.5 to 5.5 on every Cleave that hits, and bots' moves shake your screen too.
- **Numbers:** a crit looks like any big hit. The flag that marks a crit is set but never used.
- **Swings:** Cleave alternates left and right in the code, but the swing is never drawn.

### The spec (your own hits)

| Hit | Freeze | Target flash | Shake | Number | Sound | Body |
| --- | --- | --- | --- | --- | --- | --- |
| Auto swing, venom or Blizzard tick | none | 0.05 s | none | 17, white | soft tick, at most one every 0.1 s | none |
| Filler hit | 0.025 s | 0.08 s, bosses too | none | 21, white, pops | swing, then an impact for the class (axe, blades, ice, holy light) | a small mob flinches and is nudged back |
| Crit | 0.05 s | 0.1 s | 1.5 | 30, gold, "N!", tilts and bounces | a crunch over the impact | 4 sparks |
| Payoff (Crush, Shatter, a five-point Shadowstrike) | 0.07 s | 0.12 s, white then gold | 3.5 | 34 to 40, gold, with its word | a heavy payoff sound for the class | 8 shards; small mobs flung |
| Kill | 0.04 s (big 0.09) |  | big kills 3 |  | die or big die | shards; the last of a pack sounds a short low chord |
| Perfect block | 0.08 s |  | 6 | PERFECT! | perfect | your block only, not a bot's |
| Your heal | none | the healed mate glows green | none | +N in green, 18 (22 at 150+), crits bigger | heal, with a chime on a crit | none |

### The rules

1. **The freeze is drawn, not played.** The hitter and the target are drawn held still for a moment while everything else moves on. The engine never stops, so the beat stays steady and every phone's copy of a fight stays in step, which online play will need.
2. **Freezes don't add up.** Several at once take the longest, as now.
3. **Shake only for big moments:** crits (small), payoffs, big kills, boss slams and big hits on you. Your filler never shakes the screen, and bots never shake or freeze it.
4. **Layered sound.** The swing plays when you press, the impact on contact, and a crit or payoff layer on top. A sound still can't repeat within 45 ms, and an area hit plays one impact, louder for more targets.
5. **Numbers are yours only.** Crits get their own look. Overlapping numbers step upward instead of piling up. On a computer they scale with the view, so a crit reads as big as on a phone.
6. **Bodies react.** Small mobs squash for two frames on every hit. A boss flashes (a short 0.05 s) on your filler, crits and payoffs, not on swings or venom ticks. Cleave's alternating swing gets drawn.

### Buttons

- Shrink to 0.94 the instant you touch or press the key.
- Flash bright when they fire (as now).
- A ring while queued; pressed in while held.
- The beat's sweep over all four.
- A pulsing gold edge and the payoff's word when primed.

### New sounds

Impacts for blades, axes, ice and holy light, a payoff layer per class, a heal crit chime and the pack-down chord. They're made like the rest, with `tools/audio.py` and a synthesised fallback each, kept inside `sound.test.ts`'s size limits.

### In the code

- `src/dungeon/entities.js` (`hurtMob`, `healHero`): the tiers, and flashing bosses.
- `src/dungeon/game.js`: the freeze moves out of the game loop.
- `src/dungeon/render.js`: the local freeze, the crit look, the swing, the flinch and the number stepping.
- `tools/audio_list.py`: the new sounds.
- Check the cost on a slowed-down phone. Today `tools/pw_perf.py` measures only the house, so stage 2 teaches it to measure a run too.

## Numbers, Power and gear

Numbers keep today's scale and climb with Power, so a new weapon shows on the next swing. Better gear also means more crits, and with crits priming payoffs, more of the big moments.

### How gear works today

- Power is the gear score you see: Common 10, Uncommon 14, Rare 18, Epic 22, then set pieces and boss weapons 26 (Barrow) and 34 (Thimblebriar). The weapon counts for 40% of it, and the other three slots for 20% each.
- Every hit and heal is multiplied by 1 + 0.06 × (Power − 10): 1.48 in full Rare, 1.72 in full Epic, 1.96 in Barrow's best and 2.44 in Thimblebriar's best.
- Power also adds up to 14% crit chance, and half its multiplier again in health: 48% more at Barrow's best, 72% at Thimblebriar's.
- A crit doubles a hit. Heals never crit.
- A weapon has no damage of its own. It only counts through its share of Power, and its rarity sets its glow.

A payoff crit grows about 2.4 times from Common to the best gear (each class's biggest planned hit; starting numbers, tuned in stage 3):

| Biggest hit | Common (Power 10) | Full Rare (18) | Full Epic (22) | Barrow best (26) | Thimblebriar best (34) |
| --- | --- | --- | --- | --- | --- |
| Rogue, five-point Shadowstrike | 338 | 500 | 581 | 662 | 825 |
| Healer, Mend crit | 345 | 511 | 593 | 676 | 842 |
| Mage, Shattering Icicle crit | 330 | 488 | 568 | 647 | 805 |
| Tank, Crush crit | 192 | 284 | 330 | 376 | 468 |

600 and up is the biggest number size.

The rogue's finisher, the mage's Shatter and the healer's Mend crits all reach the biggest number size in Barrow's best gear. The tank's numbers stay smaller, as in WoW: a tank's big moments are perfect blocks and Crushes through a whole pack, many numbers at once.

### What changes

1. **Keep the scale.** No ×10 inflation. Today's three number sizes (21, 30, and 40 px from 600 up) already reward big hits, and payoff crits reach the biggest size as gear climbs.
2. **Crits prime payoffs**, so gear's extra crit chance turns into more glows and more big hits. That's power creep you feel in the rhythm, not only the numbers.
3. **Heals crit** for 1.5× on the same crit chance.
4. **A new weapon shows on the next swing.** The armoury card shows the filler's hit before and after ("Cleave 74 → 96"), and the weapon's rarity colours the filler's swing trail.
5. **Your class sounds like itself.** Each filler's impact matches the class: axe, blades, ice or holy light (see Hit feel).
6. **No haste.** The beat stays 1.0 s at every gear level. Gear makes hits bigger and crits more often instead. Brews and Lantern Zeal still speed the beat up, as they do cooldowns today. A set bonus that shortens the beat could come later; it goes in `docs/ideas.md`, not this plan.

### Gear that needs reworking (stage 3)

Fillers and the beat break a few traits and boss weapons, and make others fire two to three times as often. Each gets new text to match, and `balance.test.ts` checks that every effect still fires in a real clear.

| Gear | What breaks | Fix |
| --- | --- | --- |
| Quick Hands (healer trait) | Mend's 0.3 s pause means nothing once Mend is on the beat | Mend with Quick Hands doesn't start the beat |
| Splinter (mage trait) | The frost bolt it splits is gone | Icicle splinters instead: 30% of its hit to a second foe |
| Venomrush (rogue trait) | Shadowstrike has no cooldown to cut | A poisoned Shadowstrike gives back 1 point |
| Wide (tank trait) | Its half on the automatic swing goes with the side hits | Keeps its wider Cleave only |
| The Gravedigger | Charge resetting Cleave means nothing, and every fifth swing comes far more often | Charge primes two Crushes; the dig comes every eighth Cleave |
| The Gravefrost Staff | Rime burst resetting Icicle means nothing | Rime burst makes the next two Icicles Shatter anywhere |
| The Cryptfangs, Shadeveil shoulders | Their cuts to Shadowstrike's cooldown mean nothing | +1 point instead |
| Effects on every Cleave, Icicle or Viper hit (Barrowguard and Rimebone helms, Shadeveil, Gearshade, Arcwright's Coil) | They fire 2 to 2.6 times as often | Each is scaled so its value a second stays the same |

### In the code

- `src/meta/gear.ts` and `src/content/gear.ts`: unchanged.
- `src/dungeon/entities.js`: heal crits.
- `src/ui/armourycard.ts`: the filler's hit before and after.
- `src/dungeon/render.js` and `tools/audio_list.py`: the trails and the class impacts.

## Controls

WASD stays, the four buttons move to E, Q, F and R beside it, and any button can be rebound. On the phone the main button is held under the thumb. Click-to-move is out: it fights the dodge and the healer's clicks.

### Phone

1. Every button repeats while held (see The beat), so the filler can sit under the thumb.
2. The filler is the biggest button, where the thumb rests. The payoff button sits next to it and glows gold when primed. The two cooldown buttons sit further out.
3. Buttons fire on touch down, as now. A swipe anywhere still dodges.
4. Healer: tapping a name or a hero queues Mend on that hero (the latest tap wins). Swipes still lift curses, cut chains and pop wisps, off the beat.
5. Aimed buttons keep today's drag to place, and a quick tap still places them for you.

### Desktop defaults

|  | Tank | Healer | Mage | Rogue |
| --- | --- | --- | --- | --- |
| E, the filler | Cleave | Smite | Icicle | Viper Blades |
| Q | Shield (hold) | Ward | Comet | Shadowstrike |
| F | Charge | Prayer circle | Blizzard | Fan of Blades |
| R | Slam | Sunburst | Rime burst | Shadowstep |
| Space | Dodge | Dodge | Dodge | Dodge |
| Z, X, C |  | Mend the tank, you, the DPS |  |  |

- Keyboard only: nothing fires from the mouse buttons. A click on a mate or their frame still Mends them, and a click on a foe still picks it, as now.
- WASD or the arrows move, and 1 to 4 keep working.
- E is the key you mash, because every class's filler sits there. Q is the payoff or the shield; F and R are the cooldowns.
- Prayer circle and Blizzard land under the mouse if it's over the dungeon, or on the best spot if not, as now.
- Cleave and the shield face your target, as on the phone.
- Dodge goes the way you're moving, or the way you face if you're standing still.

### Rebinding

- A Keys list in Settings: each of your class's four buttons and the dodge. Tap one, then press a key or a mouse button.
- Single keys, mouse buttons, and Shift plus a key. No Ctrl or Alt, because browsers use them (Ctrl+W closes the tab). If any button uses Shift, Shift on its own stops dodging.
- Bindings are per class and per device, kept in the browser's storage, not the save, because they belong to a keyboard. So no save change is needed.
- Your tank layout is the default (Q for the shield, E for Cleave, F for Charge), with Slam on R. Shift+E works too if you rebind it.
- The button labels, the coach and the Crypt Trial's lessons show your keys.

### In the code

- `src/ui/input.ts`: a bindings map replaces the hard-coded `Digit1` to `Digit4`, plus held repeats and the Shift rule.
- `src/ui/run.ts`: button sizes on the phone, and the `KEY` labels read from the bindings.
- `src/ui/settingssheet.ts`: the Keys list, saved in browser storage under `highfell.keys` (every read and write wrapped in try/catch).
- Tests in `tests/input.test.ts`: E fires the filler, holding Q blocks as the tank, a click on a mate still Mends them, a rebound key fires its button, and Shift+E doesn't also dodge.

## Bots and the coach

Bots press through the same beat and queue as you, so they play the new rotations by the same rules; only their priority lists change. The coach still teaches a class's first five runs. After that, only payoffs glow.

### Bots today

A bot decides every 0.1 s and presses at most one button a tick, the moment its cooldown reaches zero. It misses 7% of telegraphs, reacts in 0.18 to 0.34 s, and about 58% of its planned blocks are perfect. Bots stand in for missing roles at your gear level, and your Warband plays in its own gear.

### What changes

1. **The beat.** Bots check the beat as well as cooldowns, so a bot is never faster than a player mashing.
2. **New priority lists:**
   - **Tank:** blocks as now, then Slam to taunt, peel or gather 3 fresh mobs, then Charge a loose mob 200 to 420 away or a caster mid-cast. Otherwise, Cleave every beat.
   - **Healer:** swipes as now, off the beat. Then Ward before a tank buster, Sunburst for a curse or two low mates, Mend below today's thresholds and the Prayer circle as now. Otherwise, Smite every beat, which is how a bot healer keeps its mana.
   - **Mage:** Rime burst to freeze, interrupt or Chill as now, Blizzard on clusters, and Comet on frozen or Chilled targets while standing still. Otherwise, Icicle every beat.
   - **Rogue:** Fan of Blades to stop a cast or hit 2 or more, Shadowstep to close in, and Shadowstrike at five points (or three, if it will finish the target). Otherwise, Viper Blades every beat.
3. **Cages.** A bot mage or healer can only break a mate's cage with auto-attacks today, because Icicle, Comet and Smite refuse cages. With their auto-attacks gone, Icicle and Smite must hit cages (1 damage each, like a swing), and the bots aim them there. They also take a red bomb in reach first, so Thimblebriar's bombs still get knocked back.
4. **No copied numbers.** The healer's mana gates keep reserves on purpose (the Circle keeps 20 spare), so they stay. Other bot constants copy button numbers, such as Rime burst's reach. They should read from `roles.ts` instead.

### The coach and the button words

- **First five runs:** the coach's single glowing button stays, fading 1, 0.85, 0.7, 0.55, 0.4, then off. Its rules change for the new buttons: the tank's CLEAVE! becomes CRUSH!, and the rogue's CRIT! becomes FINISH! at five points.
- **After that:** only payoffs glow gold. These are Crush, Shatter, the five-point Shadowstrike, and the empowered Mend on the party frames.
- **Warnings** keep their word without the glow: BLOCK!, KICK!, TAUNT!, PEEL!, SHIELD!, CLEANSE! and DODGE!.
- **Suggestions go:** CLEAVE!, PULL!, STORM!, FREEZE!, CHILL!, VENOM!, BLINK!, FLURRY!, SMITE!, PULSE!, CIRCLE!, BURST! and COMET! Today several of these glow at once, and that hides the one that matters.
- **The Crypt Trial** keeps its packs and its five lessons per class. On the phone, the filler's lesson says to hold the button. The rogue's last lesson starts with five points, and the Gravecaller's casts are taught in the moment by the KICK! word.

### In the code

- `src/dungeon/bots.js`: priority lists and the beat check.
- `src/dungeon/coach.js`: the tags.
- `src/ui/run.ts`: `comboFor` sorted into payoff, warning or nothing, and `TUT_BY_CLASS` for the trial.
- Tests: `tests/coach.test.ts` (the new tags) and `tests/dungeon.test.ts` (bot mages and healers break cages within 4 s).

## Balance targets and tests

The run-length targets stay as they are. The plan adds targets for the beat, the packs and fairness between classes, and each one gets a test, so no agent can drift from them.

### Targets

| Target | Today | Plan | Checked by |
| --- | --- | --- | --- |
| Barrow clear, Common bots | 185 to 235 s (3:26 with a mage, 2:58 with a rogue) | Same band | `balance.test.ts`, as now |
| Barrow best gear against Common | Under 0.62× (0.42× measured) | Same | As now |
| Thimblebriar clear, Epic | 200 to 250 s | Same | `thimblebriar.test.ts`, as now |
| Sir Rattlebones, Common bots | About 44 s | 35 to 45 s | New band |
| The Gravekeeper, Common bots | 70 to 95 s (78 measured) | 60 to 75 s | Band moves |
| A pack, beginner gear | 6 to 15 s | 12 to 20 s | New band per pack |
| A pack, best gear | 1.4 to 6 s | Under half its beginner time | New band |
| Trash share of the fighting | 32% | 40 to 50% | New |
| Damage from automatic attacks | 24 to 32% | Under 15% for melee, none for casters | New |
| Beats with nothing to press | Up to 31% dead air (rogue) | None: a filler is always ready | New |
| Mage against rogue | Rogue 34 to 49% ahead | Within 10% over a whole run; the rogue ahead on a lone boss, the mage ahead on packs | New; the test that the rogue kills the Gravekeeper faster stays |
| Interrupts a run | About 1.2 | 6 to 10 | New |
| Presses thrown away | Every early press | None | `input.test.ts` |
| A DPS alone | Dies before the mini boss | Same | As now |
| An idle healer | Wipes by Sir Rattlebones | Same | As now |
| A tank in Common gear with a bot healer | Clears clean | Same | As now |
| Heroic, Epic | 205 to 275 s, clean | Same | As now |

### Tests to add or change

- `tests/input.test.ts`: the queue, holding, no buzz on early presses, and rebound keys.
- `tests/dungeon.test.ts`: the beat (no two buttons on it within 1 s), fillers with no cooldown, Crush's setups, the rogue's points, heal crits, Icicle and Smite breaking cages, and a tank holding threat against a mage on the beat.
- `tests/combos.test.ts`: an interrupted boss cast Exposes him, a missed one hits the party, and Exposed lights every payoff.
- `tests/coach.test.ts`: the new tags.
- `tests/balance.test.ts` and `tests/thimblebriar.test.ts`: the new bands, the trash share, mage against rogue, and interrupts a run.
- `tests/sound.test.ts`: the new sounds' fallbacks and sizes.

Tests that pin today's numbers change in stage 3: `dungeon.test.ts` checks Cleave's 2.2 s cooldown and the Cryptfangs' reset, and `combos.test.ts` checks the Gravedigger's tremor on every fifth swing.

### Measuring it

The scratch scripts behind this plan's numbers (damage by source, dead air, pack times, hit sizes) become extra columns in `npm run sim`'s table, so every stage shows the same numbers. That extends an existing command, so it needs no new tool.

## Build stages

Six stages, each a playable build on the live game, with a gate you sign off before the next starts. Stage 1 barely touches balance, so it can ship first; its gate checks that the run times still hold. **Stage 1 is live**; what it changed from the plan is under [Stage 1, as built](#stage-1-as-built).

| Stage | What it builds | You'll feel | The gate before the next |
| --- | --- | --- | --- |
| 1. Every press counts (live) | The beat, the queue, holding on the phone, no buzz. E, Q, F and R on a computer. Bots on the beat | Mashing works and nothing buzzes | You play it on a phone and a computer, and the run times hold |
| 2. Every hit lands | Impact sounds, flashes, the two-body freeze, flinches. New crit and payoff looks; gold only for payoffs | Hits crunch; big ones stand out | Smooth on a slowed-down phone, and you play it |
| 3. Rotations | Fillers, smaller auto-attacks, Crush, the rogue's points. Mend on the beat, heal crits, the coach and the trial updated | Each class has a beat and a payoff | The sims land in the new bands, and you play all four classes |
| 4. Packs with jobs | Casts only interrupts stop, menders, new pull lists. Today's !! shows at once on mobs that slip | Every pull asks something of you | Packs land in their bands, with 6 to 10 interrupts a run |
| 5. Bosses | A cast to interrupt on each boss. Exposed lights everyone's payoff at once | Burn windows you all hit together | Boss fights land in their bands, and you play both dungeons |
| 6. Your keys | Rebinding in Settings, a bigger filler on the phone. The armoury card's before and after, weapon sounds | Your keys, your weapon's sound | |

- I build each stage here, run `npm run all`, check phone and desktop screenshots, then push to `main` and publish, as with any change you ask for. A stage can go to another agent as a pull request instead, with this doc as its brief.
- Stages 2 and 6 don't touch balance, so they can run alongside the others.
- After each stage, `docs/design.md`, the Dungeon Systems doc and Start Here get updated. AGENTS.md's decisions table gets the new rows (the beat, fillers, interrupts) once you've approved them.

## What stays the same

This plan changes how combat feels, not what the game is. Every pillar and decision in AGENTS.md holds:

- **Four buttons and a dodge, never more.** The beat, the queue, holding and the glow change how buttons are pressed, not how many there are.
- **All three roles are needed.** A DPS alone still dies before the mini boss, an idle healer still wipes by Sir Rattlebones, and a tank in Common gear with a bot healer still clears. The tests keep checking all three.
- **Run length.** About 3 to 4 minutes in beginner gear and about 2 in full BiS.
- **Beginner gear struggles.** Dungeons hit hard, telegraphs pierce shields, and skilled play opens windows to hit back harder.
- **The tank's job.** The tank earns threat, bosses crush anyone else they hit, and only the tank is caged.
- **The healer's job.** Only the healer lifts curses, and a missed curse drops its hero to a tenth but never kills.
- **Your own numbers only.** Mates' spell effects stay.
- **Gear is the only power.** No hero levels or skill trees. Sets and boss weapons change what buttons do.
- **No currency, one potion system, no drinking for mana.**
- **Normal stays fully solo.** Bots and your Warband play every seat by the same rules, through the same beat and queue.
- **Loot is untouched.** Drop rates, the walkout and the logs don't change.
- **Phone first, one HTML file, no new dependencies, seeded randomness for combat.**
