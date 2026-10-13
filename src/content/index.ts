/**
 * Everything in the game, by id. New dungeons register their items, sets, collectibles, titles,
 * achievements and info here; nothing else needs to change.
 */
import type { AchievementDef, CollectibleDef, DungeonInfo, ItemDef, SetDef, TitleDef } from './types';
import { regularItems } from './gear';
import { BARROW } from './barrow';
import { BARROW_ITEMS, BARROW_SETS } from './barrow/items';
import { BARROW_COLLECTIBLES, BARROW_TITLES } from './barrow/collectibles';
import { BARROW_ACHIEVEMENTS } from './barrow/achievements';
import { BRAMBLEWICK_ACHIEVEMENTS, BRAMBLEWICK_COLLECTIBLES, BRAMBLEWICK_TITLES } from './vale/bramblewick';
import { INGREDIENTS, PLACES, RECIPES } from './vale';

/** The game's name, in one place so a rename is one line. */
export const GAME_NAME = 'Highfell';

const byId = <T extends { id: string }>(list: T[]): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const x of list) { if (out[x.id]) throw new Error('duplicate content id ' + x.id); out[x.id] = x; }
  return out;
};

export const DUNGEONS: Record<string, DungeonInfo> = byId([BARROW]);
export const ITEMS: Record<string, ItemDef> = byId([...regularItems(), ...BARROW_ITEMS]);
export const SETS: Record<string, SetDef> = byId([...BARROW_SETS]);
export const COLLECTIBLES: Record<string, CollectibleDef> = byId([...BARROW_COLLECTIBLES, ...BRAMBLEWICK_COLLECTIBLES]);
export const TITLES: Record<string, TitleDef> = byId([...BARROW_TITLES, ...BRAMBLEWICK_TITLES]);
export const ACHIEVEMENTS: Record<string, AchievementDef> = byId([...BARROW_ACHIEVEMENTS, ...BRAMBLEWICK_ACHIEVEMENTS]);
export const ACHIEVEMENT_LIST: AchievementDef[] = [...BARROW_ACHIEVEMENTS, ...BRAMBLEWICK_ACHIEVEMENTS];

/** What a drop id points at. */
export type Thing = { kind: 'item'; def: ItemDef } | { kind: 'collectible'; def: CollectibleDef };
export function thing(id: string): Thing | null {
  if (ITEMS[id]) return { kind: 'item', def: ITEMS[id] };
  if (COLLECTIBLES[id]) return { kind: 'collectible', def: COLLECTIBLES[id] };
  return null;
}

/** Catches typos in content: every id a table, log or reward points at must exist. */
export function checkContent(): string[] {
  const bad: string[] = [];
  for (const d of Object.values(DUNGEONS)) {
    for (const t of d.loot) for (const dr of t.drops) if (!thing(dr.id)) bad.push(`${d.id} loot ${dr.id}`);
    for (const id of d.collection) if (!thing(id)) bad.push(`${d.id} collection ${id}`);
    for (const id of d.achievements) if (!ACHIEVEMENTS[id]) bad.push(`${d.id} achievement ${id}`);
  }
  for (const s of Object.values(SETS)) for (const id of s.pieces) if (!ITEMS[id] || ITEMS[id].setId !== s.id) bad.push(`set ${s.id} piece ${id}`);
  for (const pl of Object.values(PLACES)) {
    for (const n of pl.nodes) {
      if (!INGREDIENTS[n.gives]) bad.push(`${pl.id} node ${n.id} gives ${n.gives}`);
      for (const dr of n.table) if (!thing(dr.id)) bad.push(`${pl.id} node ${n.id} drop ${dr.id}`);
    }
    for (const dr of pl.errandTable) if (!thing(dr.id)) bad.push(`${pl.id} errand drop ${dr.id}`);
    for (const er of pl.errands) for (const k of Object.keys(er.needs || {})) if (!INGREDIENTS[k]) bad.push(`${pl.id} errand ${er.id} needs ${k}`);
    for (const er of pl.errands) if (er.gives && !COLLECTIBLES[er.gives]) bad.push(`${pl.id} errand ${er.id} gives ${er.gives}`);
  }
  for (const r of Object.values(RECIPES)) for (const k of Object.keys(r.needs)) if (!INGREDIENTS[k]) bad.push(`recipe ${r.id} needs ${k}`);
  for (const a of ACHIEVEMENT_LIST) {
    if (a.reward.title && !TITLES[a.reward.title]) bad.push(`${a.id} title ${a.reward.title}`);
    if (a.reward.collectible && !COLLECTIBLES[a.reward.collectible]) bad.push(`${a.id} collectible ${a.reward.collectible}`);
    for (const n of a.needs || []) if (!ACHIEVEMENTS[n]) bad.push(`${a.id} needs ${n}`);
    if (a.collect && !thing(a.collect)) bad.push(`${a.id} collect ${a.collect}`);
  }
  return bad;
}
