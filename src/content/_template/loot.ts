/**
 * Dungeon Template: OSRS-style independent drop tables.
 * Includes a reusable `buildStandardLoot` helper so any new dungeon can generate its
 * standard drop table (1/35 set pieces, 1/50 boss weapons & mini-boss trophy, 1/1,000 mount & dye, 1/5,000 pet)
 * without boilerplate errors.
 */
import type { BossLootDef, DropDef } from '../types';

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
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.tank}.${s}`, rate: 1 / 35, role: 'tank' })),
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.healer}.${s}`, rate: 1 / 35, role: 'healer' })),
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.dps}.${s}`, rate: 1 / 35, role: 'dps' })),
        ...slots.map((s): DropDef => ({ id: `${cfg.sets.rogue}.${s}`, rate: 1 / 35, role: 'dps', cls: 'rogue' })),
        { id: cfg.weapons.tank, rate: 1 / 50, role: 'tank' },
        { id: cfg.weapons.healer, rate: 1 / 50, role: 'healer' },
        { id: cfg.weapons.dps, rate: 1 / 50, role: 'dps' },
        { id: cfg.weapons.rogue, rate: 1 / 50, role: 'dps', cls: 'rogue' },
        ...(cfg.extraDrops || []),
        { id: cfg.dyeId, rate: 1 / 1000 },
        { id: cfg.mountId, rate: 1 / 1000 },
        { id: cfg.petId, rate: 1 / 5000 },
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
