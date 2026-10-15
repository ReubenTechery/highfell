/** Barrow Crypt's drop tables. Each player rolls their own on every kill; every line rolls on its own. */
import type { BossLootDef } from '../types';

export const BARROW_LOOT: BossLootDef[] = [
  { boss: 'knight', drops: [
    { id: 'trophy.rattlebones_plume', rate: 1 / 50 },
  ] },
  { boss: 'keeper', drops: [
    { id: 'barrowguard.helm', rate: 1 / 35, role: 'tank' },
    { id: 'barrowguard.shoulders', rate: 1 / 35, role: 'tank' },
    { id: 'barrowguard.chest', rate: 1 / 35, role: 'tank' },
    { id: 'candlewake.helm', rate: 1 / 35, role: 'healer' },
    { id: 'candlewake.shoulders', rate: 1 / 35, role: 'healer' },
    { id: 'candlewake.chest', rate: 1 / 35, role: 'healer' },
    { id: 'rimebone.helm', rate: 1 / 35, role: 'dps' },
    { id: 'rimebone.shoulders', rate: 1 / 35, role: 'dps' },
    { id: 'rimebone.chest', rate: 1 / 35, role: 'dps' },
    { id: 'shadeveil.helm', rate: 1 / 35, role: 'dps', cls: 'rogue' },
    { id: 'shadeveil.shoulders', rate: 1 / 35, role: 'dps', cls: 'rogue' },
    { id: 'shadeveil.chest', rate: 1 / 35, role: 'dps', cls: 'rogue' },
    { id: 'gravekeeper.tank', rate: 1 / 50, role: 'tank' },
    { id: 'gravekeeper.healer', rate: 1 / 50, role: 'healer' },
    { id: 'gravekeeper.dps', rate: 1 / 50, role: 'dps' },
    { id: 'gravekeeper.rogue', rate: 1 / 50, role: 'dps', cls: 'rogue' },
    { id: 'dye.ghostly', rate: 1 / 1000 },
    { id: 'mount.gravehound', rate: 1 / 1000 },
    { id: 'pet.pint_gravekeeper', rate: 1 / 5000 },
  ] },
];
