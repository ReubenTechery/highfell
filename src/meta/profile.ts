/**
 * The save. One profile per player holds everything that lasts between runs: your heroes and their
 * gear, kill counts, the collection log, achievements, titles, the hearth and settings.
 *
 * Heroes work like alts: each is one race and one class, fixed when made, with its own gear and
 * title. Everything else is shared by the whole roster: the collection (so a unique you own can be
 * worn by any hero of its role), kill counts, Marks, achievements and the hearth. Warband gear is a
 * floor per role: spare pieces from your clears raise it, and every hero of that role wears at least it.
 *
 * Changing its shape: bump PROFILE_VERSION and add a step to MIGRATIONS that turns the previous
 * version into the new one. Old saves are upgraded on load; nothing is ever thrown away silently.
 */
import type { Rar, RoleId, SlotId } from '../content/types';
import { ORDER } from '../content/roles';
import { SLOT_IDS } from '../content/gear';
import { CLASSES, FOUNDERS, MAX_HEROES, canMake, cleanName, type ClassId, type RaceId } from '../content/folk';

export const PROFILE_VERSION = 3;
/** Shared gear climbs to Rare. Epic is earned on the hero. */
export const WARBAND_CAP: Rar = 2;

export interface RegularSlot { rar: Rar; trait?: string }
export interface Hero {
  id: string;
  name: string;
  /** a RaceId; kept as a string so a hero from a newer build survives an older one */
  race: RaceId | string;
  cls: ClassId | string;
  createdAt: number;
  playedAt: number;
  /** the best regular piece per slot: the Common to Epic ladder */
  regular: Record<SlotId, RegularSlot>;
  /** a unique item id worn in the slot, or null to wear the regular piece */
  equip: Record<SlotId, string | null>;
  /** a title id from the shared titles, or null */
  title: string | null;
  /** false for a hero the game named for you (the move from one hero per role): it can be renamed once */
  named: boolean;
  /** full clears this hero has done */
  clears: number;
}
export interface CollectionEntry { n: number; kc: number; at: number }
export interface BossRecord { kc: number; pb: number | null; wipes: number }
export interface DungeonRecord { runs: number; clears: number; pb: number | null; marks: number }

export interface Profile {
  v: number;
  rev: number;
  savedAt: number;
  createdAt: number;
  /** every hero you have made, oldest first */
  roster: Hero[];
  /** the hero you are playing */
  active: string | null;
  /** warband gear: the floor every hero of a role wears */
  warband: Record<RoleId, Record<SlotId, RegularSlot>>;
  dungeons: Record<string, DungeonRecord>;
  /** keyed dungeon.boss, e.g. barrow.keeper */
  bosses: Record<string, BossRecord>;
  /** everything obtained: drops and achievement rewards */
  collection: Record<string, CollectionEntry>;
  achievements: Record<string, { at: number }>;
  counters: Record<string, number>;
  /** titles earned by the whole roster; each hero picks one to wear */
  titles: string[];
  hearth: { spots: Record<string, string | null> };
  /** looksOff: cosmetics you own but have switched off */
  settings: { sound: boolean; looksOff: string[] };
  /** collection ids you have looked at in the log since they arrived */
  seen: Record<string, number>;
}

const blankSlots = (): Record<SlotId, RegularSlot> => Object.fromEntries(SLOT_IDS.map((s) => [s, { rar: 0 as Rar }])) as Record<SlotId, RegularSlot>;
const blankEquip = (): Record<SlotId, string | null> => Object.fromEntries(SLOT_IDS.map((s) => [s, null])) as Record<SlotId, string | null>;

export function freshProfile(now = Date.now()): Profile {
  return {
    v: PROFILE_VERSION, rev: 0, savedAt: now, createdAt: now,
    roster: [], active: null,
    warband: { tank: blankSlots(), healer: blankSlots(), dps: blankSlots() },
    dungeons: {}, bosses: {}, collection: {}, achievements: {}, counters: {},
    titles: [],
    hearth: { spots: {} },
    settings: { sound: true, looksOff: [] },
    seen: {},
  };
}

const num = (v: unknown, d: number): number => (typeof v === 'number' && isFinite(v) ? v : d);
const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

/** Steps from version n to n + 1. Version 1 was the Barrow Crypt test run's save, which lived on a different page and never reaches here. */
const MIGRATIONS: Record<number, (raw: any) => any> = {
  /* v2 had one hero per role and no races or classes. The role you last played becomes your first
     hero, named after the founding hero of that class; the other roles' gear becomes warband gear,
     so a hero you make for them later starts where you left off. */
  2: (d) => {
    const heroes = obj(d.heroes);
    const role: RoleId = ORDER.includes(d.role) ? d.role : 'tank';
    const anyGear = ORDER.some((r) => SLOT_IDS.some((s) => num(obj(obj(obj(heroes[r]).regular)[s]).rar, 0) > 0));
    const played = anyGear || Object.keys(obj(d.dungeons)).length > 0 || Object.keys(obj(d.collection)).length > 0;
    const out: any = { ...d, roster: [], active: null, warband: {} };
    for (const r of ORDER) {
      const h = obj(heroes[r]);
      if (played && r === role) {
        const f = FOUNDERS[r];
        out.roster.push({ id: 'h_' + r, name: f.name, race: f.race, cls: f.cls, createdAt: num(d.createdAt, Date.now()), playedAt: num(d.savedAt, Date.now()),
          regular: h.regular, equip: h.equip, title: typeof d.title === 'string' ? d.title : null, named: false, clears: num(obj(obj(d.dungeons).barrow).clears, 0) });
        out.active = 'h_' + r;
        // the shared floor for this role starts where the hero is, up to the shared cap
        out.warband[r] = Object.fromEntries(SLOT_IDS.map((s) => [s, { rar: Math.min(num(obj(obj(h.regular)[s]).rar, 0), WARBAND_CAP) }]));
      } else out.warband[r] = h.regular;
    }
    delete out.heroes; delete out.role; delete out.title;
    return out;
  },
};

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

function normRegular(x: unknown): RegularSlot {
  const reg = obj(x);
  const rar = num(reg.rar, 0);
  return { rar: (rar >= 0 && rar <= 3 ? Math.floor(rar) : 0) as Rar, ...(typeof reg.trait === 'string' ? { trait: reg.trait } : {}) };
}
function normHero(x: unknown, now: number): Hero | null {
  const h = obj(x);
  const id = str(h.id), name = str(h.name), race = str(h.race), cls = str(h.cls);
  if (!id || !name || !race || !cls) return null;
  const out: Hero = { id, name, race, cls, createdAt: num(h.createdAt, now), playedAt: num(h.playedAt, now), regular: blankSlots(), equip: blankEquip(), title: str(h.title), named: h.named !== false, clears: num(h.clears, 0) };
  for (const s of SLOT_IDS) {
    out.regular[s] = normRegular(obj(h.regular)[s]);
    const eq = obj(h.equip)[s];
    out.equip[s] = typeof eq === 'string' ? eq : null;
  }
  return out;
}

/** Fills anything missing so the rest of the game can trust the shape. */
export function normalize(d: any, now = Date.now()): Profile {
  const p = freshProfile(now);
  p.rev = num(d.rev, 0); p.savedAt = num(d.savedAt, now); p.createdAt = num(d.createdAt, now);
  const seen = new Set<string>();
  for (const x of Array.isArray(d.roster) ? d.roster : []) {
    const h = normHero(x, now);
    if (h && !seen.has(h.id) && p.roster.length < MAX_HEROES) { seen.add(h.id); p.roster.push(h); }
  }
  p.active = typeof d.active === 'string' && seen.has(d.active) ? d.active : p.roster[0]?.id ?? null;
  for (const r of ORDER) for (const s of SLOT_IDS) p.warband[r][s] = normRegular(obj(obj(d.warband)[r])[s]);
  for (const [k, v] of Object.entries(obj(d.dungeons))) { const x = obj(v); p.dungeons[k] = { runs: num(x.runs, 0), clears: num(x.clears, 0), pb: typeof x.pb === 'number' ? x.pb : null, marks: num(x.marks, 0) }; }
  for (const [k, v] of Object.entries(obj(d.bosses))) { const x = obj(v); p.bosses[k] = { kc: num(x.kc, 0), pb: typeof x.pb === 'number' ? x.pb : null, wipes: num(x.wipes, 0) }; }
  for (const [k, v] of Object.entries(obj(d.collection))) { const x = obj(v); p.collection[k] = { n: Math.max(1, num(x.n, 1)), kc: num(x.kc, 0), at: num(x.at, now) }; }
  for (const [k, v] of Object.entries(obj(d.achievements))) p.achievements[k] = { at: num(obj(v).at, now) };
  for (const [k, v] of Object.entries(obj(d.counters))) p.counters[k] = num(v, 0);
  p.titles = Array.isArray(d.titles) ? d.titles.filter((t: unknown) => typeof t === 'string') : [];
  for (const h of p.roster) if (h.title && !p.titles.includes(h.title)) h.title = null;
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

/* ---------------------------------------------------------------- heroes */
/** The seat a hero takes in a party. A class this build does not know plays as DPS. */
export const roleOf = (h: Pick<Hero, 'cls'>): RoleId => CLASSES[h.cls as ClassId]?.role ?? 'dps';
export const heroById = (p: Profile, id: string | null | undefined): Hero | null => (id ? p.roster.find((h) => h.id === id) || null : null);
export const activeHero = (p: Profile): Hero | null => heroById(p, p.active) || p.roster[0] || null;

/** Why a name can't be used, or null when it can. */
export function nameProblem(p: Profile, raw: string, except?: string): string | null {
  const name = cleanName(raw);
  if (!name) return raw.trim().length < 2 ? 'At least two letters' : raw.trim().length > 24 ? 'At most 24 letters' : 'Letters, spaces, hyphens and apostrophes only';
  if (p.roster.some((h) => h.id !== except && h.name.toLowerCase() === name.toLowerCase())) return 'You already have a hero called that';
  return null;
}

/** Make a new hero. It starts in your shared gear for its role. Race and class can't change later. */
export function createHero(p: Profile, o: { name: string; race: RaceId; cls: ClassId }, now = Date.now(), id?: string): Hero | null {
  if (p.roster.length >= MAX_HEROES || !canMake(o.race, o.cls) || nameProblem(p, o.name)) return null;
  o = { ...o, name: cleanName(o.name)! };
  const role = CLASSES[o.cls].role;
  const h: Hero = {
    id: id || 'h_' + now.toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    name: o.name, race: o.race, cls: o.cls, createdAt: now, playedAt: now,
    regular: blankSlots(), equip: blankEquip(), title: null, named: true, clears: 0,
  };
  for (const s of SLOT_IDS) h.regular[s] = { ...p.warband[role][s] };
  p.roster.push(h);
  if (!p.active) p.active = h.id;
  return h;
}

/** Remove a hero. The last one can't go; if it was active, the oldest left takes over. */
export function removeHero(p: Profile, id: string): boolean {
  if (p.roster.length <= 1) return false;
  const i = p.roster.findIndex((h) => h.id === id);
  if (i < 0) return false;
  p.roster.splice(i, 1);
  if (p.active === id) p.active = p.roster[0].id;
  return true;
}

/** A hero the game named can take a name of your choosing, once. */
export function renameHero(p: Profile, id: string, raw: string): boolean {
  const h = heroById(p, id);
  if (!h || h.named || nameProblem(p, raw, id)) return false;
  h.name = cleanName(raw)!;
  h.named = true;
  return true;
}

export function setActive(p: Profile, id: string, now = Date.now()): boolean {
  const h = heroById(p, id);
  if (!h) return false;
  p.active = id; h.playedAt = now;
  return true;
}
