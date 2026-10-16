/**
 * Dungeon Template: `DungeonInfo` progression metadata.
 * Notice `marksName: 'Warband Marks'` (unified currency across all dungeons) and
 * `collectionFromLoot(loot)` which automatically derives the 18 collection log slots from `loot.ts`!
 */
import type { BossLootDef, DungeonInfo } from '../types';
import { TEMPLATE_ACHIEVEMENTS } from './achievements';
import { TEMPLATE_LOOT } from './loot';

/** Automatically extracts the unique collection log item/collectible IDs from a dungeon's drop tables. */
export function collectionFromLoot(loot: BossLootDef[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of loot) {
    for (const d of t.drops) {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        out.push(d.id);
      }
    }
  }
  return out;
}

export const TEMPLATE_DUNGEON: DungeonInfo = {
  id: 'template',
  name: 'Template Sanctum',
  blurb: 'Four packs, a side room, the Warden, and the Sovereign in his round arena. About three and a quarter minutes, all three seats needed.',
  tier: 2,
  recIlvl: 22,
  dropsIlvl: 34,
  bosses: [
    { id: 'warden', name: 'Mini-Boss Warden', phases: 2, enrage: 120, room: 5 },
    { id: 'sovereign', name: 'The Sovereign', phases: 2, enrage: 210, room: 6 },
  ],
  finalBoss: 'sovereign',
  loot: TEMPLATE_LOOT,
  marksName: 'Warband Marks',
  collection: collectionFromLoot(TEMPLATE_LOOT),
  // the pet, mount and dye are bonus slots: shown in the log, never needed to finish it
  bonus: collectionFromLoot(TEMPLATE_LOOT).filter((id) => /^(pet|mount|dye)\./.test(id)),
  achievements: TEMPLATE_ACHIEVEMENTS.map((a) => a.id),
};
