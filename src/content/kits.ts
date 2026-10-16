/**
 * Gilding kits: Heroic's own drops. A Heroic kill rolls its dungeon's normal tables first, so what drops is
 * the normal piece, for the normal log. On top of that, the boss that drops a unique (a set piece or a boss
 * weapon) rolls that piece's kit: its gilded look, for good and for every hero. Any seat can get any kit. A kit
 * is never gear and never power. A dungeon's Heroic is built from its own items, tables and log here, so every
 * new dungeon gets the same shape (see `_template/heroic.ts`).
 */
import type { BossLootDef, CollectibleDef, DropDef, ItemDef, KitDef } from './types';

/** each kit's drop rate, for any seat: about half of Heroic runs bring one, and a whole Heroic log takes
 *  about 65 runs (1 player in 10 needs about 100). The one you want can still be missing after 60. */
export const KIT_RATE = 1 / 20;

/** a piece's gilded look, or a drop's Heroic twin (the gilded pet, mount and trophy) */
export const gilded = (id: string): string => `${id}.gilded`;

/** a dungeon's uniques as kits, named and drawn as the piece gilded */
export function kitsOf(items: ItemDef[]): KitDef[] {
  return items.filter((d) => d.kind !== 'gear').map((d) => ({
    id: gilded(d.id), item: d.id, icon: `${d.icon}_gilded`,
    name: d.name.startsWith('The ') ? `The Gilded ${d.name.slice(4)}` : `Gilded ${d.name}`,
  }));
}

/** Heroic's own tables, rolled after its dungeon's: each boss rolls the kit of every unique on its normal
 *  table (any seat, at KIT_RATE), and the Heroic twin of a drop (the gilded pet, mount and trophy) at that
 *  drop's own rate. A drop with neither (a dye) has nothing here. */
export function kitTables(loot: BossLootDef[], kits: KitDef[], twins: CollectibleDef[]): BossLootDef[] {
  const kit = new Set(kits.map((k) => k.item)), twin = new Set(twins.map((c) => c.id));
  return loot.map((t) => ({
    boss: t.boss,
    drops: t.drops.flatMap((d): DropDef[] => (kit.has(d.id) ? [{ id: gilded(d.id), rate: KIT_RATE }] : twin.has(gilded(d.id)) ? [{ id: gilded(d.id), rate: d.rate }] : [])),
  })).filter((t) => t.drops.length > 0);
}

/** Heroic's log: the kits, in the order of its dungeon's log, then the twins, which are bonus slots */
export function kitLog(collection: string[], kits: KitDef[], twins: CollectibleDef[]): { collection: string[]; bonus: string[] } {
  const kit = new Set(kits.map((k) => k.item)), twin = new Set(twins.map((c) => c.id));
  const bonus = collection.filter((id) => !kit.has(id) && twin.has(gilded(id))).map(gilded);
  return { collection: [...collection.filter((id) => kit.has(id)).map(gilded), ...bonus], bonus };
}
