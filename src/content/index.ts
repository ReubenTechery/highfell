/**
 * Everything in the game, by id. New dungeons register their items, sets, collectibles, titles,
 * achievements and info here; nothing else needs to change.
 */
import type { AchievementDef, CollectibleDef, DungeonInfo, ItemDef, SetDef, TitleDef } from './types';
import { regularItems } from './gear';
import { BARROW } from './barrow';
import { BARROW_ENGINE } from './barrow/engine';
import { BARROW_ITEMS, BARROW_SETS } from './barrow/items';
import { BARROW_COLLECTIBLES, BARROW_TITLES } from './barrow/collectibles';
import { BARROW_ACHIEVEMENTS } from './barrow/achievements';
import { BARROW_HEROIC, HEROIC_ACHIEVEMENTS, HEROIC_COLLECTIBLES, HEROIC_ITEMS, HEROIC_TITLES } from './barrow/heroic';
import { BRAMBLEWICK_ACHIEVEMENTS, BRAMBLEWICK_COLLECTIBLES, BRAMBLEWICK_TITLES } from './vale/bramblewick';
import { INGREDIENTS, PLACES, RECIPES } from './vale';
import { LOOKS } from './house';
import { RACES } from './folk';

/** The game's name, in one place so a rename is one line. */
export const GAME_NAME = 'Highfell';

const byId = <T extends { id: string }>(list: T[]): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const x of list) { if (out[x.id]) throw new Error('duplicate content id ' + x.id); out[x.id] = x; }
  return out;
};

/** every dungeon, the heroic ones too (a heroic one names the dungeon it is the harder version of) */
export const DUNGEONS: Record<string, DungeonInfo> = byId([BARROW, BARROW_HEROIC]);
/** every base dungeon's playable engine definition */
export const DUNGEON_ENGINES: Record<string, typeof BARROW_ENGINE> = { barrow: BARROW_ENGINE };
export const ITEMS: Record<string, ItemDef> = byId([...regularItems(), ...BARROW_ITEMS, ...HEROIC_ITEMS]);
export const SETS: Record<string, SetDef> = byId([...BARROW_SETS]);
export const COLLECTIBLES: Record<string, CollectibleDef> = byId([...BARROW_COLLECTIBLES, ...HEROIC_COLLECTIBLES, ...BRAMBLEWICK_COLLECTIBLES]);
export const TITLES: Record<string, TitleDef> = byId([...BARROW_TITLES, ...HEROIC_TITLES, ...BRAMBLEWICK_TITLES]);
export const ACHIEVEMENTS: Record<string, AchievementDef> = byId([...BARROW_ACHIEVEMENTS, ...HEROIC_ACHIEVEMENTS, ...BRAMBLEWICK_ACHIEVEMENTS]);
export const ACHIEVEMENT_LIST: AchievementDef[] = [...BARROW_ACHIEVEMENTS, ...HEROIC_ACHIEVEMENTS, ...BRAMBLEWICK_ACHIEVEMENTS];
/** The heroic version of a dungeon, if it has one. */
export const heroicVersion = (id: string): DungeonInfo | undefined => Object.values(DUNGEONS).find((d) => d.heroicOf === id);

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
    if (d.heroicOf && !DUNGEONS[d.heroicOf]) bad.push(`${d.id} heroic of ${d.heroicOf}`);
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
    if (a.log && !DUNGEONS[a.log]) bad.push(`${a.id} log ${a.log}`);
    if (a.reward.look && !LOOKS.some((l) => l.id === a.reward.look)) bad.push(`${a.id} look ${a.reward.look}`);
    if (a.reward.race && !(a.reward.race in RACES)) bad.push(`${a.id} race ${a.reward.race}`);
  }
  return bad;
}
