/**
 * Loot, OSRS rules. Every line of a boss's table rolls on its own for each player, so two uniques in
 * one clear can happen and so can a long dry streak. Kill counts go up with every kill. Duplicates
 * turn into marks. On top of that, every full clear drops one regular piece that climbs the
 * Common to Rare ladder for the hero you played, and its chest holds XP: lore pages and maybe a tome
 * (meta/xp.ts). Your other heroes never get loot from your runs, even when they come along (the owner's call,
 * 17 Oct): the run is your hero's. Uniques go into the collection, which the whole roster shares. A Heroic
 * kill rolls its normal dungeon's tables first, then its own: the gilding kits (content/kits.ts).
 */
import type { BossLootDef, DropDef, DungeonInfo, Rar, RoleId, SlotId } from '../content/types';
import { COLLECTIBLES, DUNGEONS, ITEMS, KITS } from '../content';
import { EPIC, SLOT_IDS, TRAITS, gearId, gearKey, itemKey } from '../content/gear';
import type { Rng } from '../core/rng';
import { autoPlace } from './hearth';
import { bagIt, bestRegular, fitsHero, freshForRole } from './gear';
import { WARBAND_CAP, bossRecord, dungeonRecord, roleOf, type Hero, type Profile } from './profile';
import { growBeds, rollSeeds } from './vale';
import { chestXp, type ChestXp } from './xp';
import { TOMES } from '../content/xp';

/** What the lantern tells about the last boss's drops: nothing rare, a gilding kit, a unique, or the pet. */
export type Tell = 'normal' | 'kit' | 'unique' | 'pet';

export interface Drop {
  id: string;
  /** a boss's table, the ladder piece, or the chest's XP (its pages and tomes: `xp` says how much, `n` how many pages) */
  source: 'table' | 'regular' | 'xp';
  boss?: string;
  rate?: number;
  kc?: number;
  isNew: boolean;
  dupe: boolean;
  marks: number;
  role?: RoleId;
  slot?: SlotId;
  rar?: Rar;
  prevRar?: Rar;
  /** a sideways trait offer for an Epic weapon you already have: the player chooses */
  offerTrait?: string;
  prevTrait?: string;
  trait?: string;
  /** new gear the hero who got it can put on (it is never put on for you) */
  toEquip?: boolean;
  placed?: string | null;
  /** an XP drop's XP, and how many pages */
  xp?: number;
  n?: number;
}

export interface RunLoot {
  dungeon: string;
  role: RoleId;
  hero: string;
  drops: Drop[];
  tell: Tell;
  kc: Record<string, number>;
  marks: number;
  clears: number;
  time: number;
  pb: number | null;
  newPb: boolean;
  firstClear: boolean;
  /** seeds the bosses dropped, by plant id */
  seeds?: Record<string, number>;
  /** garden beds this clear made ready */
  bedsReady?: number;
  /** a gilding kit came from the last boss: the lantern sifts gold dust onto the chest, whatever its tell */
  gild?: boolean;
  /** XP: what you had when the run started, what the kills paid, the chest's, and where it ended */
  xp?: { start: number; kills: number; chest: ChestXp | null; end: number };
}

export const DUPE_MARKS = 3;
export const CLEAR_MARKS = 1;
/** A heroic dungeon opens once you've cleared its normal one this many times: about when gear tops out. */
/** Heroic opens once you've found this many pieces of its normal dungeon's collection log (duplicates count once,
 *  the pet, mount and dye count too). A drop, not a number of clears: the chase to it is the fun. */
export const HEROIC_PIECES = 3;
/** How close you are to a dungeon's heroic version: pieces of the normal one's log found, out of HEROIC_PIECES. */
export function heroicProgress(p: Profile, dungeon: string): { have: number; need: number } {
  const found = (DUNGEONS[dungeon]?.collection || []).filter((id) => p.collection[id]).length;
  return { have: Math.min(HEROIC_PIECES, found), need: HEROIC_PIECES };
}
export const heroicOpen = (p: Profile, dungeon: string): boolean => heroicProgress(p, dungeon).have >= HEROIC_PIECES;
/** whose Marks a dungeon pays: a heroic one pays its normal one's */
const marksOf = (dg: DungeonInfo): string => dg.heroicOf || dg.id;

/** Each line rolls on its own. Role/class-locked lines only roll for the heroes who wear that gear (the ranger
 *  wears what the code calls healer gear). */
export function rollTable(t: BossLootDef, role: RoleId, rng: Rng, cls?: string): DropDef[] {
  const hit: DropDef[] = [];
  const key = gearKey({ role, cls });
  for (const d of t.drops) {
    const r = rng();
    const match = !d.role || itemKey({ role: d.role, cls: d.cls }) === key;
    if (match && r < d.rate) hit.push(d);
  }
  return hit;
}

/** Add something to the collection. Gear waits for every hero of its role/class to put it on; a pet, mount or trophy finds its spot in the hearth. */
function grant(p: Profile, h: Hero, id: string, meta: Pick<Drop, 'source' | 'boss' | 'rate' | 'kc'>, now: number): Drop {
  const role = roleOf(h);
  const ent = p.collection[id];
  if (ent) { ent.n++; return { id, ...meta, role, isNew: false, dupe: true, marks: DUPE_MARKS }; }
  p.collection[id] = { n: 1, kc: meta.kc || 0, at: now };
  const d: Drop = { id, ...meta, role, isNew: true, dupe: false, marks: 0 };
  const it = ITEMS[id];
  if (it) { freshForRole(p, id); d.toEquip = fitsHero(it, h); }
  else if (COLLECTIBLES[id]) d.placed = autoPlace(p, id);
  return d;
}

export const REG_CAP: Rar = 2;

/** The regular piece for the hero you played: their weakest slot (counting what waits in the bag) moves up
 *  one step up to Rare (Epic comes from the dungeon's set and boss weapon). At full Rare it offers weapon traits. */
export function regularDrop(p: Profile, h: Hero, rng: Rng): Drop {
  const role = roleOf(h);
  const gKey = gearKey({ role, cls: h.cls });
  const best = (s: SlotId) => bestRegular(h, s);
  const minR = Math.min(...SLOT_IDS.map((s) => best(s).rar)) as Rar;
  if (minR >= REG_CAP) {
    const wep = best('weapon');
    const cur = wep.trait;
    const others = TRAITS[gKey].filter((t) => t.id !== cur);
    const t = others[Math.floor(rng() * others.length)];
    return { id: gearId(gKey, 'weapon', wep.rar), source: 'regular', role, slot: 'weapon', rar: wep.rar, prevRar: wep.rar, isNew: false, dupe: false, marks: 0, offerTrait: t.id, prevTrait: cur };
  }
  const slots = SLOT_IDS.filter((s) => best(s).rar === minR);
  const slot = slots[Math.floor(rng() * slots.length)];
  const rar = Math.min(REG_CAP, minR + 1) as Rar;
  const trait = rar >= REG_CAP && slot === 'weapon' ? TRAITS[gKey][Math.floor(rng() * TRAITS[gKey].length)].id : undefined;
  bagIt(h, slot, trait ? { rar, trait } : { rar });
  raiseFloor(p, role, slot, rar);
  return { id: gearId(gKey, slot, rar), source: 'regular', role, slot, rar, prevRar: h.regular[slot].rar, trait, isNew: true, dupe: false, marks: 0, toEquip: true };
}

/** Raise the shared floor for a role (never past the cap): every hero of that role below it gets the piece in their bag. */
function raiseFloor(p: Profile, role: RoleId, slot: SlotId, rar: Rar): void {
  const r = Math.min(rar, WARBAND_CAP) as Rar;
  if (p.warband[role][slot].rar < r) p.warband[role][slot] = { rar: r };
  for (const h of p.roster) if (roleOf(h) === role) bagIt(h, slot, { rar: r });
}

/** Accept or refuse a sideways trait offer. It goes on your regular weapon, worn or in the bag. */
export function takeTrait(h: Hero, trait: string): void {
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const reg = bestRegular(h, 'weapon');
  if (reg.rar >= REG_CAP && TRAITS[gKey].some((t) => t.id === trait)) reg.trait = trait;
}

/** The lantern's tell: the pet beats a unique, and a unique beats a gilding kit. */
export function tellOf(drops: Drop[]): Tell {
  const table = drops.filter((d) => d.source === 'table');
  return table.some((d) => COLLECTIBLES[d.id]?.kind === 'pet') ? 'pet' : table.some((d) => !KITS[d.id]) ? 'unique' : table.length ? 'kit' : 'normal';
}
/** A gilding kit is in the chest: the lantern sifts gold dust onto it, even when its tell is a unique. */
export const gildOf = (drops: Drop[]): boolean => drops.some((d) => d.source === 'table' && !!KITS[d.id]);

export interface RunEnd {
  hero: Hero;
  /** bosses killed this run, in order */
  bosses: string[];
  /** seconds from pull to kill, by boss */
  bossTimes: Record<string, number>;
  cleared: boolean;
  practice: boolean;
  time: number;
}

/** What one boss kill gave: rolled the moment it dies, like loot hitting the floor. */
export interface KillLoot { boss: string; kc: number; time: number; newPb: boolean; drops: Drop[]; marks: number; seeds?: Record<string, number> }

/** The Crypt Trial's chest: an Uncommon weapon and an Uncommon helm for your first hero, so the first real run
 *  starts a step up. As drops, for the chest to show. */
export function trialStarter(h: Hero): Drop[] {
  const role = roleOf(h), gk = gearKey({ role, cls: h.cls });
  return [
    { id: gearId(gk, 'weapon', 1), source: 'regular', role, slot: 'weapon', rar: 1, prevRar: 0, isNew: true, dupe: false, marks: 0, toEquip: true },
    { id: gearId(gk, 'helm', 1), source: 'regular', role, slot: 'helm', rar: 1, prevRar: 0, isNew: true, dupe: false, marks: 0, toEquip: true },
  ];
}

/** Give the trial's chest, once a save, to the first hero you make (played or skipped, the trial gives the
 *  same). Like ladder pieces, they raise their role's shared floor; nothing goes on by itself. */
export function grantTrialStarter(p: Profile, h: Hero): boolean {
  if (p.counters['intro.starter']) return false;
  p.counters['intro.starter'] = 1;
  const role = roleOf(h);
  raiseFloor(p, role, 'weapon', 1);
  raiseFloor(p, role, 'helm', 1);
  return true;
}

/** One dungeon's table for a boss, rolled for one player, its drops granted at that table's kill count. */
function rollKill(p: Profile, dg: DungeonInfo, boss: string, h: Hero, kc: number, rng: Rng, now: number): Drop[] {
  const table = dg.loot.find((t) => t.boss === boss);
  return table ? rollTable(table, roleOf(h), rng, h.cls).map((d) => grant(p, h, d.id, { source: 'table', boss, rate: d.rate, kc }, now)) : [];
}

/** A kill counts and rolls its table (and its seed lines after your first clear). A Heroic kill rolls its normal
 *  dungeon's table first, and counts on that boss's kill count too: what drops there is the normal piece, for
 *  the normal log. Then its own table, the gilding kits, on its own kill count. A run that doesn't count never calls this. */
export function resolveKill(p: Profile, dg: DungeonInfo, boss: string, h: Hero, time: number | null, rng: Rng, now = Date.now()): KillLoot {
  const br = bossRecord(p, dg.id, boss);
  br.kc++;
  const newPb = typeof time === 'number' && (br.pb === null || time < br.pb);
  if (newPb) br.pb = time;
  const out: KillLoot = { boss, kc: br.kc, time: time ?? 0, newPb: newPb && br.kc > 1, drops: [], marks: 0 };
  const base = dg.heroicOf ? DUNGEONS[dg.heroicOf] : undefined;
  if (base) { const nb = bossRecord(p, base.id, boss); nb.kc++; out.drops.push(...rollKill(p, base, boss, h, nb.kc, rng, now)); }
  out.drops.push(...rollKill(p, dg, boss, h, br.kc, rng, now));
  out.marks = out.drops.reduce((a, d) => a + d.marks, 0);
  dungeonRecord(p, marksOf(dg)).marks += out.marks;
  // a save's very first run never drops a seed: the garden comes in later, with its own tip, when one drops
  const firstRun = Object.values(p.dungeons).every((d) => !d.clears) && br.kc <= 1;
  out.seeds = firstRun ? {} : rollSeeds(p, dg, boss, rng);
  return out;
}

/** What finishing the dungeon gave: the clear, the ladder piece, the chest's XP and a mark. The garden grows a step. */
export interface ClearLoot { clears: number; time: number; pb: number | null; newPb: boolean; firstClear: boolean; drops: Drop[]; marks: number; bedsReady?: number; xp: ChestXp }

export function resolveClear(p: Profile, dg: DungeonInfo, h: Hero, time: number, rng: Rng): ClearLoot {
  const rec = dungeonRecord(p, dg.id);
  rec.clears++;
  h.clears++;
  const xp = chestXp(p, dg, rng);
  const out: ClearLoot = { clears: rec.clears, time, pb: null, newPb: false, firstClear: rec.clears === 1, drops: [], marks: CLEAR_MARKS, xp };
  if (rec.pb === null || time < rec.pb) { out.newPb = rec.pb !== null; rec.pb = time; }
  out.pb = rec.pb;
  out.drops.push(regularDrop(p, h, rng));
  out.drops.push(...xpDrops(xp, h));
  dungeonRecord(p, marksOf(dg)).marks += out.marks;
  out.bedsReady = growBeds(p);
  return out;
}

/** the chest's XP as cards: the pages, then each tome */
export function xpDrops(xp: ChestXp, h: Hero): Drop[] {
  const role = roleOf(h);
  return [
    { id: 'xp.pages', source: 'xp', role, isNew: true, dupe: false, marks: 0, xp: xp.pagesXp, n: xp.pages },
    ...xp.tomes.map((t): Drop => ({ id: t.id, source: 'xp', role, isNew: true, dupe: false, marks: 0, xp: t.xp, rate: TOME_RATE[t.id] })),
  ];
}
const TOME_RATE: Record<string, number> = Object.fromEntries(TOMES.map((t) => [t.id, t.rate]));

/** Everything a run gave, put together for the reveal. The final boss's drops decide the tell. */
export function runLoot(p: Profile, dg: DungeonInfo, h: Hero, kills: KillLoot[], clear: ClearLoot | null): RunLoot {
  const rec = dungeonRecord(p, dg.id);
  const seeds: Record<string, number> = {};
  const out: RunLoot = { dungeon: dg.id, role: roleOf(h), hero: h.id, drops: [], tell: 'normal', kc: {}, marks: 0, clears: rec.clears, time: clear ? clear.time : 0, pb: rec.pb, newPb: !!clear?.newPb, firstClear: !!clear?.firstClear, seeds, bedsReady: clear?.bedsReady || 0 };
  for (const k of kills) {
    out.kc[k.boss] = k.kc; out.drops.push(...k.drops); out.marks += k.marks;
    for (const [s, n] of Object.entries(k.seeds || {})) seeds[s] = (seeds[s] || 0) + n;
  }
  if (clear) { out.drops.push(...clear.drops); out.marks += clear.marks; }
  const last = kills.find((k) => k.boss === dg.finalBoss);
  out.tell = last ? tellOf(last.drops) : 'normal';
  out.gild = !!last && gildOf(last.drops);
  return out;
}

/** A run from the entrance starts: count it. */
export function countRunStart(p: Profile, dg: DungeonInfo): void { dungeonRecord(p, dg.id).runs++; }
/** The party wiped on a boss: count it against that boss. */
export function countBossWipe(p: Profile, dg: DungeonInfo, boss: string): void { bossRecord(p, dg.id, boss).wipes++; }

/** A whole run in one go (tests and sims). The game itself resolves each kill as it happens. */
export function resolveRun(p: Profile, dg: DungeonInfo, end: RunEnd, rng: Rng, now = Date.now()): RunLoot {
  if (end.practice) return runLoot(p, dg, end.hero, [], null);
  const kills = end.bosses.map((b) => resolveKill(p, dg, b, end.hero, end.bossTimes[b] ?? null, rng, now));
  const clear = end.cleared ? resolveClear(p, dg, end.hero, end.time, rng) : null;
  return runLoot(p, dg, end.hero, kills, clear);
}

/** What a dungeon can drop for one role: that role's own pieces (its set and its weapon), then what
 *  anyone can get, the likeliest first. Each line keeps its drop rate, so the showcase never lies. A
 *  gilding kit drops for any seat, but it's listed with the role whose piece it gilds. */
export function lootFor(dg: DungeonInfo, role: RoleId, cls?: string): { mine: DropDef[]; shared: DropDef[] } {
  const all = dg.loot.flatMap((t) => t.drops);
  const who = (d: DropDef): { role?: RoleId; cls?: string } => { const it = KITS[d.id] && ITEMS[KITS[d.id].item]; return it ? { role: it.role, cls: it.cls } : d; };
  return {
    mine: all.filter((d) => { const w = who(d); return !!w.role && (cls ? itemKey({ role: w.role, cls: w.cls }) === gearKey({ role, cls }) : w.role === role); }),
    shared: all.filter((d) => !who(d).role).sort((a, b) => b.rate - a.rate),
  };
}
