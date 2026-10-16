/**
 * Everything in the game, by id. New dungeons register their items, sets, collectibles, titles,
 * achievements, Heroic kits and info here; nothing else needs to change.
 */
import type { AchievementDef, CollectibleDef, DungeonInfo, ItemDef, KitDef, SetDef, TitleDef } from './types';
import { regularItems } from './gear';
import { BARROW } from './barrow';
import { BARROW_ENGINE } from './barrow/engine';
import { BARROW_ITEMS, BARROW_SETS } from './barrow/items';
import { BARROW_COLLECTIBLES, BARROW_TITLES } from './barrow/collectibles';
import { BARROW_ACHIEVEMENTS } from './barrow/achievements';
import { BARROW_HEROIC, HEROIC_ACHIEVEMENTS, HEROIC_COLLECTIBLES, HEROIC_KITS, HEROIC_TITLES } from './barrow/heroic';
import { THIMBLEBRIAR } from './thimblebriar';
import { THIMBLEBRIAR_ENGINE } from './thimblebriar/engine';
import { THIMBLEBRIAR_ITEMS, THIMBLEBRIAR_SETS } from './thimblebriar/items';
import { THIMBLEBRIAR_COLLECTIBLES, THIMBLEBRIAR_TITLES } from './thimblebriar/collectibles';
import { THIMBLEBRIAR_ACHIEVEMENTS } from './thimblebriar/achievements';
import { THIMBLEBRIAR_HEROIC, THIMBLEBRIAR_HEROIC_ACHIEVEMENTS, THIMBLEBRIAR_HEROIC_COLLECTIBLES, THIMBLEBRIAR_HEROIC_TITLES, THIMBLEBRIAR_KITS } from './thimblebriar/heroic';
import { GARDEN_ACHIEVEMENTS, GARDEN_COLLECTIBLES, GARDEN_TITLES } from './vale/garden';
import { FIRST_HARVEST_GIFT, GARDEN_TABLE, INGREDIENTS, PLANTS, RECIPES } from './vale';
import { LOOKS } from './house';
import { RACES } from './folk';

/** The game's name, in one place so a rename is one line. */
export const GAME_NAME = 'Highfell';
/** Where anyone can play it: the link on a Share card. */
export const PLAY_URL = 'https://reubentechery.github.io/highfell/';

const byId = <T extends { id: string }>(list: T[]): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const x of list) { if (out[x.id]) throw new Error('duplicate content id ' + x.id); out[x.id] = x; }
  return out;
};

/** every dungeon, the heroic ones too (a heroic one names the dungeon it is the harder version of) */
export const DUNGEONS: Record<string, DungeonInfo> = byId([BARROW, BARROW_HEROIC, THIMBLEBRIAR, THIMBLEBRIAR_HEROIC]);
/** a playable dungeon as the engine sees it (map, mobs, packs, script) */
export type DungeonEngine = typeof BARROW_ENGINE | typeof THIMBLEBRIAR_ENGINE;
/** every base dungeon's playable engine definition */
export const DUNGEON_ENGINES: Record<string, DungeonEngine> = { barrow: BARROW_ENGINE, thimblebriar: THIMBLEBRIAR_ENGINE };
export const ITEMS: Record<string, ItemDef> = byId([...regularItems(), ...BARROW_ITEMS, ...THIMBLEBRIAR_ITEMS]);
/** every gilding kit (Heroic's own drops: the gilded look of a piece), by id */
export const KITS: Record<string, KitDef> = byId([...HEROIC_KITS, ...THIMBLEBRIAR_KITS]);
export const SETS: Record<string, SetDef> = byId([...BARROW_SETS, ...THIMBLEBRIAR_SETS]);
export const COLLECTIBLES: Record<string, CollectibleDef> = byId([...BARROW_COLLECTIBLES, ...HEROIC_COLLECTIBLES, ...THIMBLEBRIAR_COLLECTIBLES, ...THIMBLEBRIAR_HEROIC_COLLECTIBLES, ...GARDEN_COLLECTIBLES]);
export const TITLES: Record<string, TitleDef> = byId([...BARROW_TITLES, ...HEROIC_TITLES, ...THIMBLEBRIAR_TITLES, ...THIMBLEBRIAR_HEROIC_TITLES, ...GARDEN_TITLES]);
export const ACHIEVEMENT_LIST: AchievementDef[] = [...BARROW_ACHIEVEMENTS, ...HEROIC_ACHIEVEMENTS, ...THIMBLEBRIAR_ACHIEVEMENTS, ...THIMBLEBRIAR_HEROIC_ACHIEVEMENTS, ...GARDEN_ACHIEVEMENTS];
export const ACHIEVEMENTS: Record<string, AchievementDef> = byId(ACHIEVEMENT_LIST);
/** The heroic version of a dungeon, if it has one. */
export const heroicVersion = (id: string): DungeonInfo | undefined => Object.values(DUNGEONS).find((d) => d.heroicOf === id);

/** What a drop id points at. */
export type Thing = { kind: 'item'; def: ItemDef } | { kind: 'collectible'; def: CollectibleDef } | { kind: 'kit'; def: KitDef };
export function thing(id: string): Thing | null {
  if (ITEMS[id]) return { kind: 'item', def: ITEMS[id] };
  if (COLLECTIBLES[id]) return { kind: 'collectible', def: COLLECTIBLES[id] };
  if (KITS[id]) return { kind: 'kit', def: KITS[id] };
  return null;
}
/** The piece an id is, or the one its kit gilds. */
export const itemOf = (id: string): ItemDef | undefined => ITEMS[id] || (KITS[id] ? ITEMS[KITS[id].item] : undefined);

/** Catches typos in content: every id a table, log or reward points at must exist. */
export function checkContent(): string[] {
  const bad: string[] = [];
  for (const d of Object.values(DUNGEONS)) {
    for (const t of d.loot) for (const dr of t.drops) if (!thing(dr.id)) bad.push(`${d.id} loot ${dr.id}`);
    for (const id of d.collection) if (!thing(id)) bad.push(`${d.id} collection ${id}`);
    for (const id of d.bonus || []) if (!d.collection.includes(id)) bad.push(`${d.id} bonus ${id} is not in its log`);
    for (const id of d.achievements) if (!ACHIEVEMENTS[id]) bad.push(`${d.id} achievement ${id}`);
    if (d.heroicOf && !DUNGEONS[d.heroicOf]) bad.push(`${d.id} heroic of ${d.heroicOf}`);
  }
  for (const s of Object.values(SETS)) for (const id of s.pieces) if (!ITEMS[id] || ITEMS[id].setId !== s.id) bad.push(`set ${s.id} piece ${id}`);
  for (const k of Object.values(KITS)) {
    if (!ITEMS[k.item] || ITEMS[k.item].kind === 'gear') bad.push(`kit ${k.id} gilds ${k.item}`);
    if (COLLECTIBLES[k.id] || ITEMS[k.id]) bad.push(`kit ${k.id} is also an item or a collectible`);
  }
  for (const d of Object.values(DUNGEONS)) for (const sd of d.seeds || []) {
    if (!PLANTS[sd.seed]) bad.push(`${d.id} seed ${sd.seed}`);
    if (!d.bosses.some((b) => b.id === sd.boss)) bad.push(`${d.id} seed boss ${sd.boss}`);
  }
  for (const n of Object.values(PLANTS)) if (!INGREDIENTS[n.gives]) bad.push(`plant ${n.id} gives ${n.gives}`);
  for (const dr of GARDEN_TABLE) if (!thing(dr.id)) bad.push(`garden drop ${dr.id}`);
  if (!COLLECTIBLES[FIRST_HARVEST_GIFT]) bad.push(`garden gift ${FIRST_HARVEST_GIFT}`);
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
