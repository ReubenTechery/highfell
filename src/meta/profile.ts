/**
 * The save. One profile per player holds everything that lasts between runs: your heroes and their
 * gear, kill counts, the collection log, achievements, titles, the hearth and settings.
 *
 * Heroes work like alts: each is one race and one class, fixed when made, with its own gear and
 * title. Everything else is shared by the whole roster: the collection (so a unique you own can be
 * worn by any hero of its role), kill counts, Marks, achievements and the hearth. Warband gear is a
 * floor per role: spare pieces from your clears raise it, and every hero of that role can put it on.
 *
 * Nothing is ever put on for you. A new piece waits in the hero's bag (regular gear) or in their list
 * of fresh uniques until you put it on yourself in Gear.
 *
 * Changing its shape: bump PROFILE_VERSION and add a step to MIGRATIONS that turns the previous
 * version into the new one. Old saves are upgraded on load; nothing is ever thrown away silently.
 */
import type { AbilitySlot, Rar, RoleId, SlotId } from '../content/types';
import { ORDER, SLOTS_AB } from '../content/roles';
import { SLOT_IDS } from '../content/gear';
import { CLASSES, FOUNDERS, MAX_HEROES, canMake, cleanName, defaultSex, type ClassId, type RaceId, type SexId } from '../content/folk';
import { settleSpots } from './hearth';
import { opened } from './logs';

export const PROFILE_VERSION = 7;
/** Shared gear climbs to Rare. Epic is earned on the hero. */
export const WARBAND_CAP: Rar = 2;
export const MAX_HERO_LEVEL = 9;
export const XP_PER_LEVEL = 100;
export const MAX_TALENT_RANK = 2;

export interface RegularSlot { rar: Rar; trait?: string }
export interface Hero {
  id: string;
  name: string;
  /** a RaceId; kept as a string so a hero from a newer build survives an older one */
  race: RaceId | string;
  cls: ClassId | string;
  sex: SexId;
  createdAt: number;
  playedAt: number;
  /** the regular piece worn in each slot: the Common to Rare ladder */
  regular: Record<SlotId, RegularSlot>;
  /** a better regular piece you have got but not put on yet, per slot (null when there is none) */
  bag: Record<SlotId, RegularSlot | null>;
  /** a unique item id worn in the slot, or null to wear the regular piece */
  equip: Record<SlotId, string | null>;
  /** uniques this hero could wear that arrived since they last looked at that slot */
  fresh: string[];
  /** a title id from the shared titles, or null */
  title: string | null;
  /** false for a hero the game named for you (the move from one hero per role): it can be renamed once */
  named: boolean;
  /** full clears this hero has done */
  clears: number;
  /** hero XP earned from bosses and clears (100 XP per level, up to Level 9) */
  xp: number;
  /** Skill Tree Lite: ability upgrade rank (0..2) for each of the 4 ability buttons */
  talents: Record<AbilitySlot, number>;
}
export interface CollectionEntry { n: number; kc: number; at: number }
/** A gathering spot's state: harvests ready, the day they were last topped up, whether the next one shimmers. */
export interface NodeState { n: number; day: number; shimmer: boolean }
export interface PlaceState { nodes: Record<string, NodeState>; errands: { n: number; day: number; next: number } }
/** Everything from riding out: what you carry, what is brewed, your skills and where you have been. */
export interface ValeState {
  satchel: Record<string, number>;
  shelf: Record<string, number>;
  /** XP by skill: gather, brew */
  xp: Record<string, number>;
  places: Record<string, PlaceState>;
  /** lore pages unlocked, in the order they came */
  lore: string[];
  /** the brew to drink at the start of your next run from the entrance, or null */
  drink: string | null;
  rides: number;
}
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
  /** spots: what is on show where; looks: the look on each room, by room id (a room not here is the tavern) */
  hearth: { spots: Record<string, string | null>; looks: Record<string, string> };
  /** looksOff: cosmetics you own but have switched off */
  settings: { sound: boolean; looksOff: string[] };
  /** collection ids you have looked at in the log since they arrived */
  seen: Record<string, number>;
  vale: ValeState;
}

const blankSlots = (): Record<SlotId, RegularSlot> => Object.fromEntries(SLOT_IDS.map((s) => [s, { rar: 0 as Rar }])) as Record<SlotId, RegularSlot>;
const blankEquip = (): Record<SlotId, string | null> => Object.fromEntries(SLOT_IDS.map((s) => [s, null])) as Record<SlotId, string | null>;
const blankBag = (): Record<SlotId, RegularSlot | null> => Object.fromEntries(SLOT_IDS.map((s) => [s, null])) as Record<SlotId, RegularSlot | null>;
const blankTalents = (): Record<AbilitySlot, number> => ({ a1: 0, a2: 0, a3: 0, a4: 0 });

export function freshProfile(now = Date.now()): Profile {
  return {
    v: PROFILE_VERSION, rev: 0, savedAt: now, createdAt: now,
    roster: [], active: null,
    warband: { tank: blankSlots(), healer: blankSlots(), dps: blankSlots() },
    dungeons: {}, bosses: {}, collection: {}, achievements: {}, counters: {},
    titles: [],
    hearth: { spots: {}, looks: {} },
    settings: { sound: true, looksOff: [] },
    seen: {},
    vale: freshVale(),
  };
}
export const freshVale = (): ValeState => ({ satchel: {}, shelf: {}, xp: {}, places: {}, lore: [], drink: null, rides: 0 });

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
  /* v3 had no Vale: riding out, gathering and brewing start empty. */
  3: (d) => ({ ...d, vale: freshVale() }),
  /* v4 put new gear straight on. From v5 it waits in a bag until you put it on, so every hero starts
     with an empty bag and nothing fresh; what they were wearing stays on. */
  4: (d) => ({ ...d, roster: (Array.isArray(d.roster) ? d.roster : []).map((h: any) => ({ ...obj(h), bag: {}, fresh: [] })) }),
  /* v5 had one look for the house, the tavern. From v6 each room can have its own, and every room starts
     as it was. */
  5: (d) => ({ ...d, hearth: { ...obj(d.hearth), looks: {} } }),
  /* v6 heroes had one look per combo. From v7 each hero has a male or female look (`sex`), XP from their
     clears, and an ability upgrade tree (`talents`). */
  6: (d) => ({
    ...d,
    roster: (Array.isArray(d.roster) ? d.roster : []).map((h: any) => {
      const x = obj(h);
      const clears = Math.max(0, Math.floor(num(x.clears, 0)));
      return {
        ...x,
        sex: x.sex === 'm' || x.sex === 'f' ? x.sex : defaultSex(String(x.race || ''), String(x.cls || '')),
        xp: Math.max(0, Math.floor(num(x.xp, clears * XP_PER_LEVEL))),
        talents: obj(x.talents),
      };
    }),
  }),
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
  const sex: SexId = h.sex === 'm' || h.sex === 'f' ? h.sex : defaultSex(race, cls);
  const clears = Math.max(0, Math.floor(num(h.clears, 0)));
  const xp = Math.max(0, Math.floor(num(h.xp, clears * XP_PER_LEVEL)));
  const out: Hero = { id, name, race, cls, sex, createdAt: num(h.createdAt, now), playedAt: num(h.playedAt, now), regular: blankSlots(), bag: blankBag(), equip: blankEquip(), fresh: [], title: str(h.title), named: h.named !== false, clears, xp, talents: blankTalents() };
  const rawTal = obj(h.talents);
  let budget = Math.min(MAX_HERO_LEVEL, 1 + Math.floor(xp / XP_PER_LEVEL)) - 1;
  for (const s of SLOTS_AB) {
    const rk = Math.max(0, Math.min(MAX_TALENT_RANK, Math.floor(num(rawTal[s], 0)), budget));
    out.talents[s] = rk;
    budget -= rk;
  }
  for (const s of SLOT_IDS) {
    out.regular[s] = normRegular(obj(h.regular)[s]);
    const b = obj(h.bag)[s];
    // a bag piece only counts while it is better than the one worn
    if (b && typeof b === 'object') { const r = normRegular(b); if (r.rar > out.regular[s].rar) out.bag[s] = r; }
    const eq = obj(h.equip)[s];
    out.equip[s] = typeof eq === 'string' ? eq : null;
  }
  out.fresh = Array.isArray(h.fresh) ? [...new Set(h.fresh.filter((x: unknown): x is string => typeof x === 'string'))] : [];
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
  settleSpots(p);
  for (const [k, v] of Object.entries(obj(obj(d.hearth).looks))) if (typeof v === 'string') p.hearth.looks[k] = v;
  p.settings.sound = obj(d.settings).sound !== false;
  const off = obj(d.settings).looksOff;
  p.settings.looksOff = Array.isArray(off) ? off.filter((x: unknown) => typeof x === 'string') : [];
  for (const [k, v] of Object.entries(obj(d.seen))) p.seen[k] = num(v, 0);
  p.vale = normVale(d.vale);
  return p;
}

const counts = (x: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj(x))) { const n = Math.floor(num(v, 0)); if (n > 0) out[k] = n; }
  return out;
};
function normVale(x: unknown): ValeState {
  const v = obj(x), out = freshVale();
  out.satchel = counts(v.satchel);
  out.shelf = counts(v.shelf);
  for (const [k, n] of Object.entries(obj(v.xp))) out.xp[k] = Math.max(0, num(n, 0));
  for (const [id, raw] of Object.entries(obj(v.places))) {
    const pl = obj(raw), er = obj(pl.errands);
    const st: PlaceState = { nodes: {}, errands: { n: Math.max(0, Math.floor(num(er.n, 0))), day: num(er.day, 0), next: Math.max(0, Math.floor(num(er.next, 0))) } };
    for (const [nid, nraw] of Object.entries(obj(pl.nodes))) { const ns = obj(nraw); st.nodes[nid] = { n: Math.max(0, Math.floor(num(ns.n, 0))), day: num(ns.day, 0), shimmer: ns.shimmer === true }; }
    out.places[id] = st;
  }
  out.lore = Array.isArray(v.lore) ? [...new Set(v.lore.filter((t: unknown): t is string => typeof t === 'string'))] : [];
  out.drink = str(v.drink);
  out.rides = Math.max(0, Math.floor(num(v.rides, 0)));
  return out;
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

/** Make a new hero. It starts wearing your shared gear for its role. Race and class can't change later.
 *  A race you earn (the Risen) can be made once you've earned it (`free` is the testing switch). */
export function createHero(p: Profile, o: { name: string; race: RaceId; cls: ClassId; sex?: SexId; free?: boolean }, now = Date.now(), id?: string): Hero | null {
  if (p.roster.length >= MAX_HEROES || !canMake(o.race, o.cls) || !(o.free || opened(p, 'race', o.race)) || nameProblem(p, o.name)) return null;
  o = { ...o, name: cleanName(o.name)! };
  const role = CLASSES[o.cls].role;
  const sex: SexId = o.sex === 'm' || o.sex === 'f' ? o.sex : defaultSex(o.race, o.cls);
  const h: Hero = {
    id: id || 'h_' + now.toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    name: o.name, race: o.race, cls: o.cls, sex, createdAt: now, playedAt: now,
    regular: blankSlots(), bag: blankBag(), equip: blankEquip(), fresh: [], title: null, named: true, clears: 0, xp: 0, talents: blankTalents(),
  };
  for (const s of SLOT_IDS) h.regular[s] = { ...p.warband[role][s] };
  p.roster.push(h);
  if (!p.active) p.active = h.id;
  return h;
}

/** Hero level (1 to MAX_HERO_LEVEL) from earned XP. Each level above 1 grants 1 Talent Point. */
export const heroLevel = (h: Pick<Hero, 'xp'>): number => Math.min(MAX_HERO_LEVEL, 1 + Math.floor(Math.max(0, h.xp || 0) / XP_PER_LEVEL));
export function heroXpProgress(h: Pick<Hero, 'xp'>): { level: number; max: boolean; into: number; need: number; pct: number } {
  const level = heroLevel(h), max = level >= MAX_HERO_LEVEL;
  const into = max ? XP_PER_LEVEL : Math.max(0, (h.xp || 0) - (level - 1) * XP_PER_LEVEL);
  return { level, max, into, need: XP_PER_LEVEL, pct: max ? 100 : Math.min(100, Math.round((into / XP_PER_LEVEL) * 100)) };
}
export const talentPointsSpent = (h: Pick<Hero, 'talents'>): number => SLOTS_AB.reduce((a, s) => a + (h.talents?.[s] || 0), 0);
export const talentPointsLeft = (h: Pick<Hero, 'xp' | 'talents'>): number => Math.max(0, (heroLevel(h) - 1) - talentPointsSpent(h));

/** Spend 1 Talent Point to upgrade an ability (up to Rank 2). */
export function spendTalent(h: Hero, slot: AbilitySlot): boolean {
  if (!SLOTS_AB.includes(slot) || talentPointsLeft(h) <= 0 || (h.talents[slot] || 0) >= MAX_TALENT_RANK) return false;
  h.talents[slot] = (h.talents[slot] || 0) + 1;
  return true;
}

/** Reset spent Talent Points so the player can re-pick their ability upgrade order. */
export function resetTalents(h: Hero): boolean {
  if (talentPointsSpent(h) <= 0) return false;
  h.talents = blankTalents();
  return true;
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
