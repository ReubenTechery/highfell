/** Thimblebriar Hollow's drop tables, at the Barrow's rates. Each player rolls their own on every kill; every
 *  line rolls on its own. */
import type { BossLootDef } from '../types';
import { buildStandardLoot } from '../_template/loot';

export const THIMBLEBRIAR_LOOT: BossLootDef[] = buildStandardLoot({
  miniBossId: 'toadstool',
  finalBossId: 'tinker',
  miniBossTrophyId: 'trophy.toadstool_cap',
  sets: { tank: 'clockguard', healer: 'sporebloom', dps: 'arcspark', rogue: 'gearshade' },
  weapons: { tank: 'tinker.tank', healer: 'tinker.healer', dps: 'tinker.dps', rogue: 'tinker.rogue' },
  dyeId: 'dye.sporeglow',
  mountId: 'mount.clockwork_beetle',
  petId: 'pet.pint_tinker',
});
