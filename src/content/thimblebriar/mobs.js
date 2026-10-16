/* Thimblebriar Hollow: who lives here and where they stand. The shared kinds dressed as gnomes and clockwork
   (the Scrapper, the Slinger, the Brass Stomper), the two new enemies (the Bombwright lobs bombs; the Waddlecap
   bursts into a spore cloud when it dies), the bombs, and the two bosses. */
import { tinkerAi, toadstoolAi } from './bosses.js';
import { SIGNATURE } from './signature.js';

export const MOBS = {
  scrapper: { name: 'Gnome Scrapper', kind: 'melee', hp: 565, r: 15, speed: 152, dmg: 50, every: 1.4, wind: 0.3, reach: 22, aggro: 230, sp: 'scrapper', shard: 'shard_cog' },
  slinger: { name: 'Gnome Slinger', kind: 'ranged', hp: 395, r: 14, speed: 125, dmg: 30, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'gn_slinger', shard: 'shard_cog',
    ranged: { min: 220, max: 360, dmg: 62, every: 2.4, warn: 0.55, speed: 560, sp: 'cog_shot', spin: true } },
  stomper: { name: 'Brass Stomper', kind: 'brute', hp: 2460, r: 30, speed: 100, dmg: 140, every: 2.2, wind: 0.5, reach: 30, aggro: 240, sp: 'stomper', heavy: true, big: true, shard: 'shard_cog' },
  // the two new enemies
  bombwright: { name: 'Bombwright', kind: 'melee', hp: 770, r: 15, speed: 115, dmg: 32, every: 1.6, wind: 0.3, reach: 22, aggro: 300, sp: 'bombwright', shard: 'shard_cog', ai: SIGNATURE.bombwrightAi },
  waddlecap: { name: 'Waddlecap', kind: 'melee', hp: 700, r: 17, speed: 118, dmg: 55, every: 1.5, wind: 0.35, reach: 22, aggro: 230, sp: 'waddlecap', shard: 'shard_spore', tally: 'waddlecaps', onDeath: SIGNATURE.sporeCloud },
  ...SIGNATURE.mobs,
  toadstool: {
    name: 'Old Toadstool', kind: 'melee', hp: 29000, r: 44, speed: 84, dmg: 150, every: 2.0, wind: 0.45, reach: 34, aggro: 260, sp: 'toadstool', heavy: true, big: true, boss: true, shard: 'shard_spore',
    ai: toadstoolAi, phases: 2, enrage: 120, acts: { slam: 'Cap Slam', volley: 'Puffball Volley', burst: 'Spore Burst' },
  },
  tinker: {
    name: 'The Tinker King', kind: 'melee', hp: 55000, r: 50, speed: 92, dmg: 150, every: 0.56, wind: 0.45, reach: 40, aggro: 0, sp: 'tinker', phaseSprites: { 2: 'tinker_cracked' }, heavy: true, big: true, boss: true, shard: 'shard_cog',
    ai: tinkerAi, phases: 2, enrage: 210, light: { dx: 96, dy: -246, r: 160 }, acts: { smash: 'Wrench Smash', barrage: 'Bomb Barrage', sticky: 'Sticky Bomb' },
  },
};

/* packs: mobs and where they stand. Bots walk to the arena for the final boss (`approach: 'arena'`). */
export const PACKS = [
  { id: 'A', room: 1, label: 'Mushroom Hall', mobs: [['scrapper', 790, 4950], ['scrapper', 800, 5060], ['bombwright', 650, 4900], ['bombwright', 680, 5110]] },
  { id: 'B', room: 2, label: 'Spore Cellar', mobs: [['waddlecap', 800, 4180], ['waddlecap', 920, 4210], ['waddlecap', 860, 4090], ['slinger', 700, 4040]] },
  { id: 'C', room: 3, label: 'Root Tunnel', mobs: [['stomper', 1720, 4090], ['waddlecap', 1640, 4200], ['bombwright', 1830, 4040], ['scrapper', 1780, 4220]] },
  { id: 'K', room: 4, label: 'Old Toadstool', boss: 'toadstool', mobs: [['toadstool', 1700, 3230]] },
  { id: 'D', room: 5, label: 'Gearworks', mobs: [['stomper', 860, 3250], ['scrapper', 790, 3330], ['waddlecap', 930, 3330], ['bombwright', 860, 3110]] },
  { id: 'G', room: 6, label: 'The Tinker King', boss: 'tinker', approach: 'arena', mobs: [['tinker', 860, 2190]] },
];
