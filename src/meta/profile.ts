/**
 * The save. One profile per player holds everything that lasts between runs: gear, kill counts,
 * the collection log, achievements, titles, the hearth and settings.
 *
 * Changing its shape: bump PROFILE_VERSION and add a step to MIGRATIONS that turns the previous
 * version into the new one. Old saves are upgraded on load; nothing is ever thrown away silently.
 */
import type { Rar, RoleId, SlotId } from '../content/types';
import { ORDER } from '../content/roles';
import { SLOT_IDS } from '../content/gear';

export const PROFILE_VERSION = 2;

export interface RegularSlot { rar: Rar; trait?: string }
export interface HeroSave {
  /** the best regular piece per slot: the Common to Epic ladder */
  regular: Record<SlotId, RegularSlot>;
  /** a unique item id worn in the slot, or null to wear the regular piece */
  equip: Record<SlotId, string | null>;
}
export interface CollectionEntry { n: number; kc: number; at: number }
export interface BossRecord { kc: number; pb: number | null; wipes: number }
export interface DungeonRecord { runs: number; clears: number; pb: number | null; marks: number }

export interface Profile {
  v: number;
  rev: number;
  savedAt: number;
  createdAt: number;
  role: RoleId;
  heroes: Record<RoleId, HeroSave>;
  dungeons: Record<string, DungeonRecord>;
  /** keyed dungeon.boss, e.g. barrow.keeper */
  bosses: Record<string, BossRecord>;
  /** everything obtained: drops and achievement rewards */
  collection: Record<string, CollectionEntry>;
  achievements: Record<string, { at: number }>;
  counters: Record<string, number>;
  titles: string[];
  title: string | null;
  hearth: { spots: Record<string, string | null> };
  /** looksOff: cosmetics you own but have switched off */
  settings: { sound: boolean; looksOff: string[] };
  /** collection ids you have looked at in the log since they arrived */
  seen: Record<string, number>;
}

const freshHero = (): HeroSave => ({
  regular: Object.fromEntries(SLOT_IDS.map((s) => [s, { rar: 0 as Rar }])) as Record<SlotId, RegularSlot>,
  equip: Object.fromEntries(SLOT_IDS.map((s) => [s, null])) as Record<SlotId, string | null>,
});

export function freshProfile(now = Date.now()): Profile {
  return {
    v: PROFILE_VERSION, rev: 0, savedAt: now, createdAt: now,
    role: 'tank',
    heroes: { tank: freshHero(), healer: freshHero(), dps: freshHero() },
    dungeons: {}, bosses: {}, collection: {}, achievements: {}, counters: {},
    titles: [], title: null,
    hearth: { spots: {} },
    settings: { sound: true, looksOff: [] },
    seen: {},
  };
}

/** Steps from version n to n + 1. Version 1 was the Barrow Crypt test run's save, which lived on a different page and never reaches here. */
const MIGRATIONS: Record<number, (raw: any) => any> = {};

const num = (v: unknown, d: number): number => (typeof v === 'number' && isFinite(v) ? v : d);
const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});

/** Reads any stored value into a valid current profile. Unknown or broken data starts fresh. */
export function migrate(raw: unknown, now = Date.now()): Profile {
  let d: any = raw;
  if (!d || typeof d !== 'object' || typeof d.v !== 'number') return freshProfile(now);
  if (d.v > PROFILE_VERSION) return normalize(d, now); // saved by a newer build: keep everything this build understands
  while (d.v < PROFILE_VERSION) {
    const step = MIGRATIONS[d.v];
    if (!step) return freshProfile(now);
    d = { ...step(d), v: d.v + 1 };
  }
  return normalize(d, now);
}

/** Fills anything missing so the rest of the game can trust the shape. */
export function normalize(d: any, now = Date.now()): Profile {
  const p = freshProfile(now);
  p.rev = num(d.rev, 0); p.savedAt = num(d.savedAt, now); p.createdAt = num(d.createdAt, now);
  if (ORDER.includes(d.role)) p.role = d.role;
  for (const r of ORDER) {
    const h = obj(obj(d.heroes)[r]);
    for (const s of SLOT_IDS) {
      const reg = obj(obj(h.regular)[s]);
      const rar = num(reg.rar, 0);
      p.heroes[r].regular[s] = { rar: (rar >= 0 && rar <= 3 ? Math.floor(rar) : 0) as Rar, ...(typeof reg.trait === 'string' ? { trait: reg.trait } : {}) };
      const eq = obj(h.equip)[s];
      p.heroes[r].equip[s] = typeof eq === 'string' ? eq : null;
    }
  }
  for (const [k, v] of Object.entries(obj(d.dungeons))) { const x = obj(v); p.dungeons[k] = { runs: num(x.runs, 0), clears: num(x.clears, 0), pb: typeof x.pb === 'number' ? x.pb : null, marks: num(x.marks, 0) }; }
  for (const [k, v] of Object.entries(obj(d.bosses))) { const x = obj(v); p.bosses[k] = { kc: num(x.kc, 0), pb: typeof x.pb === 'number' ? x.pb : null, wipes: num(x.wipes, 0) }; }
  for (const [k, v] of Object.entries(obj(d.collection))) { const x = obj(v); p.collection[k] = { n: Math.max(1, num(x.n, 1)), kc: num(x.kc, 0), at: num(x.at, now) }; }
  for (const [k, v] of Object.entries(obj(d.achievements))) p.achievements[k] = { at: num(obj(v).at, now) };
  for (const [k, v] of Object.entries(obj(d.counters))) p.counters[k] = num(v, 0);
  p.titles = Array.isArray(d.titles) ? d.titles.filter((t: unknown) => typeof t === 'string') : [];
  p.title = typeof d.title === 'string' && p.titles.includes(d.title) ? d.title : null;
  for (const [k, v] of Object.entries(obj(obj(d.hearth).spots))) p.hearth.spots[k] = typeof v === 'string' ? v : null;
  p.settings.sound = obj(d.settings).sound !== false;
  const off = obj(d.settings).looksOff;
  p.settings.looksOff = Array.isArray(off) ? off.filter((x: unknown) => typeof x === 'string') : [];
  for (const [k, v] of Object.entries(obj(d.seen))) p.seen[k] = num(v, 0);
  return p;
}

export const bossKey = (dungeon: string, boss: string): string => `${dungeon}.${boss}`;
export const dungeonRecord = (p: Profile, id: string): DungeonRecord => (p.dungeons[id] ||= { runs: 0, clears: 0, pb: null, marks: 0 });
export const bossRecord = (p: Profile, dungeon: string, boss: string): BossRecord => (p.bosses[bossKey(dungeon, boss)] ||= { kc: 0, pb: null, wipes: 0 });
export const count = (p: Profile, key: string, by = 1): number => (p.counters[key] = (p.counters[key] || 0) + by);
export const owns = (p: Profile, id: string): boolean => !!p.collection[id];
