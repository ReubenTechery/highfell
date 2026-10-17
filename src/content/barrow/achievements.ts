/** Barrow Crypt's twelve achievements, the meta one, the hidden ones, and the big one: its whole
 *  collection log. Rewards are looks, never power. */
import type { AchievementDef } from '../types';

const D = 'barrow';
const POINTS = { bronze: 10, silver: 25, gold: 50, meta: 100, hidden: 15, log: 250 } as const;

export const BARROW_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'barrow.into', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Into the Barrow', how: 'Clear Barrow Crypt.',
    reward: { collectible: 'trophy.barrow_key', text: 'Trophy: Barrow Key' }, run: () => true },
  { id: 'barrow.rattle', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Rattle Me Bones', how: 'Your party kills 500 skeletons in Barrow Crypt.',
    reward: { title: 'title.bonebreaker', text: 'Title: Bonebreaker' }, counter: { key: 'barrow.skeletons', target: 500 } },
  { id: 'barrow.wisps', dungeon: D, tier: 'bronze', points: POINTS.bronze, role: 'healer', name: 'Wisp Swatter', how: 'As the healer, swipe away 50 of the Gravekeeper’s wisps.',
    reward: { collectible: 'cosmetic.trail_wisp', text: 'Wisp-light swipe trail' }, counter: { key: 'barrow.wisps', target: 50 } },
  { id: 'barrow.chains', dungeon: D, tier: 'bronze', points: POINTS.bronze, role: 'healer', name: 'Chain Snapper', how: 'As the healer, cut 10 of the Gravekeeper’s Soul Chains with a swipe.',
    reward: { collectible: 'trophy.broken_shackle', text: 'Trophy: Broken Shackle' }, counter: { key: 'barrow.chains', target: 10 } },
  { id: 'barrow.nobody', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Nobody Left Behind', how: 'Clear Barrow Crypt with nobody in your party dying.',
    reward: { collectible: 'banner.party', text: 'Party banner' }, run: (r) => r.deaths === 0 },
  { id: 'barrow.wall', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'tank', name: 'Wall of Bone', how: 'As the tank, perfect-block every Shovel Smash in one Gravekeeper fight (3 or more).',
    reward: { collectible: 'cosmetic.glow_shield', text: 'Golden shield rim' },
    live: (e) => e.type === 'boss.killed' && e.boss === 'keeper' && e.playerIsTank && e.smashes >= 3 && e.smashPerfect >= e.smashes },
  { id: 'barrow.watch', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'healer', name: 'Not On My Watch', how: 'As the healer, save 5 mates in one Barrow Crypt run: heal each one while they’re under 15% health.',
    reward: { collectible: 'cosmetic.glow_staff', text: 'Dawn staff glow' }, run: (r) => r.role === 'healer' && r.saves >= 5 },
  { id: 'barrow.bignumber', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'dps', name: 'Big Number', how: 'As the DPS, land a crit of 1,500 or more in Barrow Crypt.',
    reward: { collectible: 'cosmetic.crit_ice', text: 'Ice-burst crits' }, live: (e, c) => e.type === 'crit' && e.player && c.role === 'dps' && e.amount >= 1500 },
  { id: 'barrow.armour', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Armour On', how: 'Kill Sir Rattlebones while the skeletons from his Rally the Dead still stand.',
    reward: { title: 'title.knightbreaker', text: 'Title: Knight-breaker' }, live: (e) => e.type === 'boss.killed' && e.boss === 'knight' && e.armorUp },
  { id: 'barrow.jailbreak', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'tank', name: 'Jailbreak', how: 'As the tank, tap your way out of a Gravekeeper cage in under 1.5 seconds.',
    reward: { collectible: 'trophy.bent_bars', text: 'Trophy: Bent Bars' }, live: (e) => e.type === 'cage.broken' && e.player && e.self && e.secs < 1.5 },
  { id: 'barrow.sprint', dungeon: D, tier: 'gold', points: POINTS.gold, name: 'Gravedigger’s Sprint', how: 'Clear Barrow Crypt in under 2 minutes 50 seconds.',
    reward: { title: 'title.quick', text: 'Title: the Quick' }, clearUnder: 170 },
  { id: 'barrow.flawless', dungeon: D, tier: 'gold', points: POINTS.gold, name: 'Flawless Barrow', how: 'Clear Barrow Crypt with nobody dying, and nobody hit by Grasping Hands or a ring from his Burrowing.',
    reward: { collectible: 'trophy.golden_skull', text: 'Trophy: Golden Skull' }, run: (r) => r.deaths === 0 && r.handHits === 0 && r.ringHits === 0 },
  { id: 'barrow.master', dungeon: D, tier: 'meta', points: POINTS.meta, name: 'Master of the Barrow', how: 'Earn all 12 Barrow Crypt achievements: the bronze, silver and gold ones.',
    reward: { title: 'title.barrowborn', collectible: 'pet.lantern_ghost', text: 'Title: the Barrow-born, and the Lantern Ghost pet' },
    needs: ['barrow.into', 'barrow.rattle', 'barrow.wisps', 'barrow.chains', 'barrow.nobody', 'barrow.wall', 'barrow.watch', 'barrow.bignumber', 'barrow.armour', 'barrow.jailbreak', 'barrow.sprint', 'barrow.flawless'] },
  { id: 'barrow.brave', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Bravely Stupid', how: 'Go into Barrow Crypt alone as the DPS and fall before the first pack is beaten.',
    reward: { title: 'title.braveish', text: 'Title: the Brave(ish)' }, live: (e) => e.type === 'run.lost' && e.packsCleared === 0 },
  { id: 'barrow.standing', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Last One Standing', how: 'Kill a Barrow Crypt boss while you’re the only one in your party still up.',
    reward: { title: 'title.stubborn', text: 'Title: the Stubborn' }, live: (e) => e.type === 'boss.killed' && e.onlyPlayerAlive },
  { id: 'barrow.lucky', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Lucky Dig', how: 'Get the Pint-sized Gravekeeper pet from the Gravekeeper.',
    reward: { text: 'Bragging rights' }, collect: 'pet.pint_gravekeeper' },
  // every drop for every role: you've played all three seats and seen it all
  { id: 'barrow.log', dungeon: D, tier: 'log', points: POINTS.log, name: 'Every Last Bone', how: 'Fill every slot of Barrow Crypt’s collection log (the pet, mount and dye are a bonus).',
    reward: { look: 'barrow', title: 'title.gravewarden', race: 'risen', text: 'Barrow Hall for your house, the title the Gravewarden, and a new kind of hero: the Risen' },
    log: 'barrow' },
];
