/** Barrow Crypt's drop tables. Each player rolls their own on every kill; every line rolls on its own. Its set
 *  pieces and weapons drop at every dungeon's rates (_template/loot.ts). */
import type { BossLootDef } from '../types';
import { SET_RATE, WEAPON_RATE } from '../_template/loot';

export const BARROW_LOOT: BossLootDef[] = [
  { boss: 'knight', drops: [
    { id: 'trophy.rattlebones_plume', rate: 1 / 50 },
  ] },
  { boss: 'keeper', drops: [
    { id: 'barrowguard.helm', rate: SET_RATE, role: 'tank' },
    { id: 'barrowguard.shoulders', rate: SET_RATE, role: 'tank' },
    { id: 'barrowguard.chest', rate: SET_RATE, role: 'tank' },
    { id: 'candlewake.helm', rate: SET_RATE, role: 'healer' },
    { id: 'candlewake.shoulders', rate: SET_RATE, role: 'healer' },
    { id: 'candlewake.chest', rate: SET_RATE, role: 'healer' },
    { id: 'rimebone.helm', rate: SET_RATE, role: 'dps' },
    { id: 'rimebone.shoulders', rate: SET_RATE, role: 'dps' },
    { id: 'rimebone.chest', rate: SET_RATE, role: 'dps' },
    { id: 'shadeveil.helm', rate: SET_RATE, role: 'dps', cls: 'rogue' },
    { id: 'shadeveil.shoulders', rate: SET_RATE, role: 'dps', cls: 'rogue' },
    { id: 'shadeveil.chest', rate: SET_RATE, role: 'dps', cls: 'rogue' },
    { id: 'gravekeeper.tank', rate: WEAPON_RATE, role: 'tank' },
    { id: 'gravekeeper.healer', rate: WEAPON_RATE, role: 'healer' },
    { id: 'gravekeeper.dps', rate: WEAPON_RATE, role: 'dps' },
    { id: 'gravekeeper.rogue', rate: WEAPON_RATE, role: 'dps', cls: 'rogue' },
    { id: 'dye.ghostly', rate: 1 / 1000 },
    { id: 'mount.gravehound', rate: 1 / 1000 },
    { id: 'pet.pint_gravekeeper', rate: 1 / 2500 },
  ] },
];
