/**
 * Dungeon Template: OSRS-style independent drop tables.
 * Includes a reusable `buildStandardLoot` helper so any new dungeon can generate its
 * standard drop table (1/25 set pieces, 1/40 boss weapons, 1/50 mini-boss trophy, 1/1,000 mount & dye, 1/2,500 pet)
 * without boilerplate errors.
 */
import type { BossLootDef, DropDef } from '../types';

/** Every dungeon's rates for its uniques: a set piece for your seat, and its final boss's weapon for your seat. At
 *  these, one hero's whole set takes about 45 clears (2½ hours), and the unlucky 1 in 10 about 83. */
export const SET_RATE = 1 / 25;
export const WEAPON_RATE = 1 / 40;

export interface StandardLootConfig {
  miniBossId: string;
  finalBossId: string;
  miniBossTrophyId: string;
  sets: { tank: string; healer: string; dps: string; rogue: string };
  weapons: { tank: string; healer: string; dps: string; rogue: string };
  dyeId: string;
  mountId: string;
  petId: string;
  extraDrops?: DropDef[];
}

export function buildStandardLoot(cfg: StandardLootConfig): BossLootDef[] {
  const slots = ['helm', 'shoulders', 'chest'] as const;
  return [
    {
      boss: cfg.miniBossId,
      drops: [{ id: cfg.miniBossTrophyId, rate: 1 / 50 }],
    },
    {
      boss: cfg.finalBossId,
      drops: [
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.tank}.${s}`, rate: SET_RATE, role: 'tank' })),
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.healer}.${s}`, rate: SET_RATE, role: 'healer' })),
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.dps}.${s}`, rate: SET_RATE, role: 'dps' })),
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.rogue}.${s}`, rate: SET_RATE, role: 'dps', cls: 'rogue' })),
        { id: cfg.weapons.tank, rate: WEAPON_RATE, role: 'tank' },
        { id: cfg.weapons.healer, rate: WEAPON_RATE, role: 'healer' },
        { id: cfg.weapons.dps, rate: WEAPON_RATE, role: 'dps' },
        { id: cfg.weapons.rogue, rate: WEAPON_RATE, role: 'dps', cls: 'rogue' },
        ...(cfg.extraDrops || []),
        { id: cfg.dyeId, rate: 1 / 1000 },
        { id: cfg.mountId, rate: 1 / 1000 },
        { id: cfg.petId, rate: 1 / 2500 },
      ],
    },
  ];
}

export const TEMPLATE_LOOT: BossLootDef[] = buildStandardLoot({
  miniBossId: 'warden',
  finalBossId: 'sovereign',
  miniBossTrophyId: 'trophy.warden_crest',
  sets: { tank: 'clockguard', healer: 'sporebloom', dps: 'arcspark', rogue: 'gearshade' },
  weapons: { tank: 'sovereign.tank', healer: 'sovereign.healer', dps: 'sovereign.dps', rogue: 'sovereign.rogue' },
  dyeId: 'dye.sporeglow',
  mountId: 'mount.clockwork_beetle',
  petId: 'pet.pint_sovereign',
});
