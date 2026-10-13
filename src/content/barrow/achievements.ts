/** Barrow Crypt's twelve achievements, the meta one and the hidden ones. Rewards are looks, never power. */
import type { AchievementDef } from '../types';

const D = 'barrow';
const POINTS = { bronze: 10, silver: 25, gold: 50, meta: 100, hidden: 15 } as const;

export const BARROW_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'barrow.into', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Into the Barrow', how: 'Clear the Crypt.',
    reward: { collectible: 'trophy.barrow_key', text: 'Trophy: Barrow Key' }, run: () => true },
  { id: 'barrow.rattle', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Rattle Me Bones', how: 'Kill 500 skeletons.',
    reward: { title: 'title.bonebreaker', text: 'Title: Bonebreaker' }, counter: { key: 'barrow.skeletons', target: 500 } },
  { id: 'barrow.wisps', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Wisp Swatter', how: 'Slice 50 wisps.',
    reward: { collectible: 'cosmetic.trail_wisp', text: 'Wisp-light swipe trail' }, counter: { key: 'barrow.wisps', target: 50 } },
  { id: 'barrow.chains', dungeon: D, tier: 'bronze', points: POINTS.bronze, name: 'Chain Snapper', how: 'Cut 10 chains.',
    reward: { collectible: 'trophy.broken_shackle', text: 'Trophy: Broken Shackle' }, counter: { key: 'barrow.chains', target: 10 } },
  { id: 'barrow.nobody', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Nobody Left Behind', how: 'Clear with no deaths.',
    reward: { collectible: 'banner.party', text: 'Party banner' }, run: (r) => r.deaths === 0 },
  { id: 'barrow.wall', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'tank', name: 'Wall of Bone', how: 'As the tank, perfect-block every Gravekeeper smash in one fight.',
    reward: { collectible: 'cosmetic.glow_shield', text: 'Golden shield rim' },
    live: (e) => e.type === 'boss.killed' && e.boss === 'keeper' && e.playerIsTank && e.smashes >= 3 && e.smashPerfect >= e.smashes },
  { id: 'barrow.watch', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'healer', name: 'Not On My Watch', how: 'As the healer, save 5 allies from under 15% in one run.',
    reward: { collectible: 'cosmetic.glow_staff', text: 'Dawn staff glow' }, run: (r) => r.role === 'healer' && r.saves >= 5 },
  { id: 'barrow.bignumber', dungeon: D, tier: 'silver', points: POINTS.silver, role: 'dps', name: 'Big Number', how: 'As the DPS, land a 1,500+ crit.',
    reward: { collectible: 'cosmetic.crit_ice', text: 'Ice-burst crits' }, live: (e, c) => e.type === 'crit' && e.player && c.role === 'dps' && e.amount >= 1500 },
  { id: 'barrow.armour', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Armour On', how: 'Kill Sir Rattlebones while his rally armour is still up.',
    reward: { title: 'title.knightbreaker', text: 'Title: Knight-breaker' }, live: (e) => e.type === 'boss.killed' && e.boss === 'knight' && e.armorUp },
  { id: 'barrow.jailbreak', dungeon: D, tier: 'silver', points: POINTS.silver, name: 'Jailbreak', how: 'As the tank, mash your way out of a Gravekeeper cage in under 1.5 seconds.',
    reward: { collectible: 'trophy.bent_bars', text: 'Trophy: Bent Bars' }, live: (e) => e.type === 'cage.broken' && e.player && e.self && e.secs < 1.5 },
  { id: 'barrow.sprint', dungeon: D, tier: 'gold', points: POINTS.gold, name: 'Gravedigger’s Sprint', how: 'Clear in under 3 minutes 20.',
    reward: { title: 'title.quick', text: 'Title: the Quick' }, run: (r) => r.time < 200 },
  { id: 'barrow.flawless', dungeon: D, tier: 'gold', points: POINTS.gold, name: 'Flawless Barrow', how: 'Clear with no deaths, and nobody hit by a hand or a ring.',
    reward: { collectible: 'trophy.golden_skull', text: 'Trophy: Golden Skull' }, run: (r) => r.deaths === 0 && r.handHits === 0 && r.ringHits === 0 },
  { id: 'barrow.master', dungeon: D, tier: 'meta', points: POINTS.meta, name: 'Master of the Barrow', how: 'Earn all twelve above.',
    reward: { title: 'title.barrowborn', collectible: 'pet.lantern_ghost', text: 'Title: the Barrow-born, and the Lantern Ghost pet' },
    needs: ['barrow.into', 'barrow.rattle', 'barrow.wisps', 'barrow.chains', 'barrow.nobody', 'barrow.wall', 'barrow.watch', 'barrow.bignumber', 'barrow.armour', 'barrow.jailbreak', 'barrow.sprint', 'barrow.flawless'] },
  { id: 'barrow.brave', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Bravely Stupid', how: 'Go in alone as the DPS and fall at the first pack.',
    reward: { title: 'title.braveish', text: 'Title: the Brave(ish)' }, live: (e) => e.type === 'run.lost' && e.packsCleared === 0 },
  { id: 'barrow.standing', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Last One Standing', how: 'Finish a boss as the only one still up.',
    reward: { title: 'title.stubborn', text: 'Title: the Stubborn' }, live: (e) => e.type === 'boss.killed' && e.onlyPlayerAlive },
  { id: 'barrow.lucky', dungeon: D, tier: 'hidden', points: POINTS.hidden, name: 'Lucky Dig', how: 'Get the Pint-sized Gravekeeper.',
    reward: { text: 'Bragging rights' }, collect: 'pet.pint_gravekeeper' },
];
