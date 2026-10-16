/** Thimblebriar Hollow's twelve achievements, the meta one, the hidden ones, and its whole collection log
 *  (the Gnome race). Rewards are looks, titles and trophies, never power. */
import type { AchievementDef } from '../types';

const D = 'thimblebriar';
const POINTS = { bronze: 10, silver: 25, gold: 50, meta: 100, hidden: 15, log: 250 } as const;

export const THIMBLEBRIAR_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'thimblebriar.into', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Down the Burrow', how: 'Clear Thimblebriar Hollow.',
    reward: { collectible: 'trophy.brass_key', text: 'Trophy: Little Brass Key' }, run: () => true },
  { id: 'thimblebriar.bombs', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Return to Sender', how: 'Knock back 100 bombs in Thimblebriar Hollow by hitting them.',
    reward: { title: 'title.bombproof', text: 'Title: Bombproof' }, counter: { key: 'thimblebriar.bombs', target: 100 } },
  { id: 'thimblebriar.caps', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Mushroom Picker', how: 'Your party pops 200 Waddlecaps in Thimblebriar Hollow.',
    reward: { title: 'title.picker', text: 'Title: the Mushroom-picker' }, counter: { key: 'thimblebriar.waddlecaps', target: 200 } },
  { id: 'thimblebriar.stickies', dungeon: D, tier: 'bronze', points: POINTS.bronze, role: 'healer', name: 'Unstuck', how: 'As the healer, swipe 25 Sticky Bombs off your mates.',
    reward: { title: 'title.unsticker', text: 'Title: the Unsticker' }, counter: { key: 'thimblebriar.stickies', target: 25 } },
  { id: 'thimblebriar.nobody', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Safe and Sound', how: 'Clear Thimblebriar Hollow with nobody in your party dying.',
    reward: { collectible: 'trophy.golden_cog', text: 'Trophy: Golden Cog' }, run: (r) => r.deaths === 0 },
  { id: 'thimblebriar.wall', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'tank', name: 'Clockstopper', how: 'As the tank, perfect-block every Wrench Smash in one Tinker King fight (3 or more).',
    reward: { title: 'title.clockstopper', text: 'Title: the Clockstopper' },
    live: (e) => e.type === 'boss.killed' && e.boss === 'tinker' && e.playerIsTank && e.smashes >= 3 && e.smashPerfect >= e.smashes },
  { id: 'thimblebriar.watch', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'healer', name: 'Patch-up Job', how: 'As the healer, clear Thimblebriar Hollow with every Sticky Bomb swiped off in time (4 or more).',
    reward: { title: 'title.tinkerer', text: 'Title: the Tinkerer' }, run: (r) => r.role === 'healer' && r.lifts >= 4 && r.bursts === 0 },
  { id: 'thimblebriar.bignumber', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'dps', name: 'Kaboom', how: 'As the DPS, land a crit of 2,500 or more in Thimblebriar Hollow.',
    reward: { title: 'title.sparkler', text: 'Title: the Sparkler' }, live: (e, c) => e.type === 'crit' && e.player && c.role === 'dps' && e.amount >= 2500 },
  { id: 'thimblebriar.pitcher', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Puffball Pitcher', how: 'In one Old Toadstool fight, knock 3 puffballs back so they blow up on him.',
    reward: { title: 'title.slugger', text: 'Title: the Slugger' }, live: (e) => e.type === 'boss.killed' && e.boss === 'toadstool' && (e.bombed || 0) >= 3 },
  { id: 'thimblebriar.batback', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'tank', name: 'Right Back at You', how: 'As the tank, bat 10 bombs back at their throwers with a perfect block.',
    reward: { title: 'title.batter', text: 'Title: the Bomb-batter' }, counter: { key: 'thimblebriar.batted', target: 10 } },
  { id: 'thimblebriar.sprint', dungeon: D, tier: 'gold', points: POINTS.gold, name: 'Wound Up Tight', how: 'Clear Thimblebriar Hollow in under 2 minutes 30 seconds.',
    reward: { title: 'title.springheel', text: 'Title: Springheel' }, clearUnder: 150 },
  { id: 'thimblebriar.flawless', dungeon: D, tier: 'gold', points: POINTS.gold, name: 'Not a Scratch', how: 'Clear Thimblebriar Hollow with nobody dying, and nobody caught in a bomb’s blast.',
    reward: { collectible: 'trophy.cuckoo_clock', text: 'Trophy: Cuckoo Clock' }, run: (r) => r.deaths === 0 && r.bombHits === 0 },
  { id: 'thimblebriar.master', dungeon: D, tier: 'meta', points: POINTS.meta, name: 'Master of the Hollow', how: 'Earn all 12 Thimblebriar Hollow achievements: the bronze, silver and gold ones.',
    reward: { title: 'title.hollowborn', collectible: 'pet.puffling', text: 'Title: the Hollow-born, and the Puffling pet' },
    needs: ['thimblebriar.into', 'thimblebriar.bombs', 'thimblebriar.caps', 'thimblebriar.stickies', 'thimblebriar.nobody', 'thimblebriar.wall', 'thimblebriar.watch', 'thimblebriar.bignumber', 'thimblebriar.pitcher', 'thimblebriar.batback', 'thimblebriar.sprint', 'thimblebriar.flawless'] },
  { id: 'thimblebriar.chain', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Chain Reaction', how: 'Knock a bomb into another bomb and set that one off too.',
    reward: { title: 'title.shortfuse', text: 'Title: Short Fuse' }, live: (e) => e.type === 'bomb.chain' && e.player },
  { id: 'thimblebriar.standing', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Last Cog Turning', how: 'Kill a Thimblebriar Hollow boss while you’re the only one in your party still up.',
    reward: { title: 'title.lastcog', text: 'Title: the Last Cog' }, live: (e) => e.type === 'boss.killed' && e.onlyPlayerAlive },
  { id: 'thimblebriar.lucky', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Pocket-sized', how: 'Get the Pint-sized Tinker King pet from the Tinker King.',
    reward: { text: 'Bragging rights' }, collect: 'pet.pint_tinker' },
  // every drop for every seat: the big one, and the Gnomes come home with you
  { id: 'thimblebriar.log', dungeon: D, tier: 'log', points: POINTS.log, name: 'Every Last Cog', how: 'Fill every slot of Thimblebriar Hollow’s collection log (the pet, mount and dye are a bonus).',
    reward: { look: 'workshop', title: 'title.clockwork_knight', race: 'gnome', text: 'Toadstool Workshop for your house, the title the Clockwork Knight, and a new kind of hero: the Gnome' },
    log: 'thimblebriar' },
];
