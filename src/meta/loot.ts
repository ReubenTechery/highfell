/**
 * Loot, OSRS rules. Every line of a boss's table rolls on its own for each player, so two uniques in
 * one clear can happen and so can a long dry streak. Kill counts go up with every kill. Duplicates
 * turn into marks. On top of that, every full clear drops one regular piece that climbs the
 * Common to Epic ladder for the hero you played, and one shared piece for another role, so no run
 * is ever empty. Uniques go into the collection, which the whole roster shares.
 */
import type { BossLootDef, DropDef, DungeonInfo, Rar, RoleId, SlotId } from '../content/types';
import { COLLECTIBLES, ITEMS } from '../content';
import { EPIC, SLOT_IDS, TRAITS, gearId, gearKey } from '../content/gear';
import { ORDER } from '../content/roles';
import type { Rng } from '../core/rng';
import { autoPlace } from './hearth';
import { bagIt, bestRegular, fitsHero, freshForRole } from './gear';
import { WARBAND_CAP, bossRecord, dungeonRecord, roleOf, type Hero, type Profile } from './profile';

export type Tell = 'normal' | 'unique' | 'pet';

export interface Drop {
  id: string;
  source: 'table' | 'regular' | 'spare';
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
}

export const DUPE_MARKS = 3;
export const CLEAR_MARKS = 1;
/** A heroic dungeon opens once you've cleared its normal one this many times: about when gear tops out. */
export const HEROIC_AFTER = 10;

/** How close you are to a dungeon's heroic version: clears of the normal one, out of HEROIC_AFTER. */
export function heroicProgress(p: Profile, dungeon: string): { have: number; need: number } {
  return { have: Math.min(HEROIC_AFTER, p.dungeons[dungeon]?.clears || 0), need: HEROIC_AFTER };
}
export const heroicOpen = (p: Profile, dungeon: string): boolean => heroicProgress(p, dungeon).have >= HEROIC_AFTER;
/** whose Marks a dungeon pays: a heroic one pays its normal one's */
const marksOf = (dg: DungeonInfo): string => dg.heroicOf || dg.id;

/** Each line rolls on its own. Role/class-locked lines only roll for that role/class. */
export function rollTable(t: BossLootDef, role: RoleId, rng: Rng, cls?: string): DropDef[] {
  const hit: DropDef[] = [];
  for (const d of t.drops) {
    const r = rng();
    const match = !d.role || (d.role === role && (cls === 'rogue' ? d.cls === 'rogue' : !d.cls));
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

/** One shared piece for a role you are not playing, so a hero of that role is never a cold start.
 *  It raises the floor every hero of that role wears, including heroes made later. */
export function spareDrop(p: Profile, played: RoleId, rng: Rng): Drop | null {
  const others = ORDER.filter((r) => r !== played && Math.min(...SLOT_IDS.map((s) => p.warband[r][s].rar)) < WARBAND_CAP);
  if (!others.length) return null;
  const who = others[Math.floor(rng() * others.length)];
  const floor = p.warband[who];
  const minR = Math.min(...SLOT_IDS.map((s) => floor[s].rar)) as Rar;
  const slots = SLOT_IDS.filter((s) => floor[s].rar === minR);
  const slot = slots[Math.floor(rng() * slots.length)];
  const rar = (minR + 1) as Rar;
  raiseFloor(p, who, slot, rar);
  return { id: gearId(who, slot, rar), source: 'spare', role: who, slot, rar, prevRar: minR, isNew: true, dupe: false, marks: 0 };
}

/** Accept or refuse a sideways trait offer. It goes on your regular weapon, worn or in the bag. */
export function takeTrait(h: Hero, trait: string): void {
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const reg = bestRegular(h, 'weapon');
  if (reg.rar >= REG_CAP && TRAITS[gKey].some((t) => t.id === trait)) reg.trait = trait;
}

export const tellOf = (drops: Drop[]): Tell =>
  drops.some((d) => d.source === 'table' && COLLECTIBLES[d.id]?.kind === 'pet') ? 'pet' : drops.some((d) => d.source === 'table') ? 'unique' : 'normal';

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
export interface KillLoot { boss: string; kc: number; time: number; newPb: boolean; drops: Drop[]; marks: number }

/** A kill counts and rolls its table. Practice runs never call this. */
export function resolveKill(p: Profile, dg: DungeonInfo, boss: string, h: Hero, time: number | null, rng: Rng, now = Date.now()): KillLoot {
  const role = roleOf(h);
  const br = bossRecord(p, dg.id, boss);
  br.kc++;
  const newPb = typeof time === 'number' && (br.pb === null || time < br.pb);
  if (newPb) br.pb = time;
  const out: KillLoot = { boss, kc: br.kc, time: time ?? 0, newPb: newPb && br.kc > 1, drops: [], marks: 0 };
  const table = dg.loot.find((t) => t.boss === boss);
  if (table) for (const d of rollTable(table, role, rng, h.cls)) out.drops.push(grant(p, h, d.id, { source: 'table', boss, rate: d.rate, kc: br.kc }, now));
  out.marks = out.drops.reduce((a, d) => a + d.marks, 0);
  dungeonRecord(p, marksOf(dg)).marks += out.marks;
  return out;
}

/** What finishing the dungeon gave: the clear, the ladder piece, the spare piece and a mark. */
export interface ClearLoot { clears: number; time: number; pb: number | null; newPb: boolean; firstClear: boolean; drops: Drop[]; marks: number }

export function resolveClear(p: Profile, dg: DungeonInfo, h: Hero, time: number, rng: Rng): ClearLoot {
  const rec = dungeonRecord(p, dg.id);
  rec.clears++;
  h.clears++;
  const out: ClearLoot = { clears: rec.clears, time, pb: null, newPb: false, firstClear: rec.clears === 1, drops: [], marks: CLEAR_MARKS };
  if (rec.pb === null || time < rec.pb) { out.newPb = rec.pb !== null; rec.pb = time; }
  out.pb = rec.pb;
  out.drops.push(regularDrop(p, h, rng));
  const spare = spareDrop(p, roleOf(h), rng);
  if (spare) out.drops.push(spare);
  dungeonRecord(p, marksOf(dg)).marks += out.marks;
  if (p.vale?.satchel) p.vale.satchel.glowcap = (p.vale.satchel.glowcap || 0) + (rec.clears % 2 === 1 ? 1 : 2);
  return out;
}

/** Everything a run gave, put together for the reveal. The final boss's drops decide the tell. */
export function runLoot(p: Profile, dg: DungeonInfo, h: Hero, kills: KillLoot[], clear: ClearLoot | null): RunLoot {
  const rec = dungeonRecord(p, dg.id);
  const out: RunLoot = { dungeon: dg.id, role: roleOf(h), hero: h.id, drops: [], tell: 'normal', kc: {}, marks: 0, clears: rec.clears, time: clear ? clear.time : 0, pb: rec.pb, newPb: !!clear?.newPb, firstClear: !!clear?.firstClear };
  for (const k of kills) { out.kc[k.boss] = k.kc; out.drops.push(...k.drops); out.marks += k.marks; }
  if (clear) { out.drops.push(...clear.drops); out.marks += clear.marks; }
  const last = kills.find((k) => k.boss === dg.finalBoss);
  out.tell = last ? tellOf(last.drops) : 'normal';
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
 *  anyone can get, the likeliest first. Each line keeps its drop rate, so the showcase never lies. */
export function lootFor(dg: DungeonInfo, role: RoleId, cls?: string): { mine: DropDef[]; shared: DropDef[] } {
  const all = dg.loot.flatMap((t) => t.drops);
  return {
    mine: all.filter((d) => d.role === role && (!cls || (cls === 'rogue' ? d.cls === 'rogue' : !d.cls))),
    shared: all.filter((d) => !d.role).sort((a, b) => b.rate - a.rate),
  };
}
