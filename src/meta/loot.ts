/**
 * Loot, OSRS rules. Every line of a boss's table rolls on its own for each player, so two uniques in
 * one clear can happen and so can a long dry streak. Kill counts go up with every kill. Duplicates
 * turn into marks. On top of that, every full clear drops one regular piece that climbs the
 * Common to Epic ladder, so no run is ever empty.
 */
import type { BossLootDef, DropDef, DungeonInfo, Rar, RoleId, SlotId } from '../content/types';
import { COLLECTIBLES, ITEMS } from '../content';
import { EPIC, SLOT_IDS, TRAITS, gearId } from '../content/gear';
import { ORDER } from '../content/roles';
import type { Rng } from '../core/rng';
import { autoPlace } from './hearth';
import { bossRecord, dungeonRecord, type Profile } from './profile';

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
  equipped?: boolean;
  placed?: string | null;
}

export interface RunLoot {
  dungeon: string;
  role: RoleId;
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

/** Each line rolls on its own. Role-locked lines only roll for that role. */
export function rollTable(t: BossLootDef, role: RoleId, rng: Rng): DropDef[] {
  const hit: DropDef[] = [];
  for (const d of t.drops) { const r = rng(); if ((!d.role || d.role === role) && r < d.rate) hit.push(d); }
  return hit;
}

/** Add something to the collection, wearing or placing it if there is room. */
function grant(p: Profile, role: RoleId, id: string, meta: Pick<Drop, 'source' | 'boss' | 'rate' | 'kc'>, now: number): Drop {
  const ent = p.collection[id];
  if (ent) { ent.n++; return { id, ...meta, role, isNew: false, dupe: true, marks: DUPE_MARKS }; }
  p.collection[id] = { n: 1, kc: meta.kc || 0, at: now };
  const d: Drop = { id, ...meta, role, isNew: true, dupe: false, marks: 0 };
  const it = ITEMS[id];
  if (it) {
    const h = p.heroes[it.role];
    if (!h.equip[it.slot]) { h.equip[it.slot] = id; d.equipped = true; }
  } else if (COLLECTIBLES[id]) d.placed = autoPlace(p, id);
  return d;
}

const ladderStep = (rng: Rng): number => (rng() < 0.75 ? 1 : 2);

/** The regular piece for your role: your weakest slot moves up. At full Epic it offers a new weapon trait instead. */
export function regularDrop(p: Profile, role: RoleId, rng: Rng): Drop {
  const reg = p.heroes[role].regular;
  const minR = Math.min(...SLOT_IDS.map((s) => reg[s].rar)) as Rar;
  if (minR >= EPIC) {
    const cur = reg.weapon.trait;
    const others = TRAITS[role].filter((t) => t.id !== cur);
    const t = others[Math.floor(rng() * others.length)];
    return { id: gearId(role, 'weapon', EPIC), source: 'regular', role, slot: 'weapon', rar: EPIC, prevRar: EPIC, isNew: false, dupe: false, marks: 0, offerTrait: t.id, prevTrait: cur };
  }
  const slots = SLOT_IDS.filter((s) => reg[s].rar === minR);
  const slot = slots[Math.floor(rng() * slots.length)];
  const rar = Math.min(EPIC, minR + ladderStep(rng)) as Rar;
  const trait = rar === EPIC && slot === 'weapon' ? TRAITS[role][Math.floor(rng() * TRAITS[role].length)].id : undefined;
  reg[slot] = trait ? { rar, trait } : { rar };
  return { id: gearId(role, slot, rar), source: 'regular', role, slot, rar, prevRar: minR, trait, isNew: true, dupe: false, marks: 0, equipped: !p.heroes[role].equip[slot] };
}

/** One piece for a role you are not playing, so switching roles later is not a cold start. */
export function spareDrop(p: Profile, role: RoleId, rng: Rng): Drop | null {
  const others = ORDER.filter((r) => r !== role);
  const who = others[Math.floor(rng() * others.length)];
  const reg = p.heroes[who].regular;
  const minR = Math.min(...SLOT_IDS.map((s) => reg[s].rar)) as Rar;
  if (minR >= EPIC) return null;
  const slots = SLOT_IDS.filter((s) => reg[s].rar === minR);
  const slot = slots[Math.floor(rng() * slots.length)];
  const rar = (minR + 1) as Rar;
  const trait = rar === EPIC && slot === 'weapon' ? TRAITS[who][Math.floor(rng() * TRAITS[who].length)].id : undefined;
  reg[slot] = trait ? { rar, trait } : { rar };
  return { id: gearId(who, slot, rar), source: 'spare', role: who, slot, rar, prevRar: minR, trait, isNew: true, dupe: false, marks: 0 };
}

/** Accept or refuse a sideways trait offer. */
export function takeTrait(p: Profile, role: RoleId, trait: string): void {
  const reg = p.heroes[role].regular.weapon;
  if (reg.rar === EPIC && TRAITS[role].some((t) => t.id === trait)) reg.trait = trait;
}

export const tellOf = (drops: Drop[]): Tell =>
  drops.some((d) => d.source === 'table' && COLLECTIBLES[d.id]?.kind === 'pet') ? 'pet' : drops.some((d) => d.source === 'table') ? 'unique' : 'normal';

export interface RunEnd {
  role: RoleId;
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
export function resolveKill(p: Profile, dg: DungeonInfo, boss: string, role: RoleId, time: number | null, rng: Rng, now = Date.now()): KillLoot {
  const br = bossRecord(p, dg.id, boss);
  br.kc++;
  const newPb = typeof time === 'number' && (br.pb === null || time < br.pb);
  if (newPb) br.pb = time;
  const out: KillLoot = { boss, kc: br.kc, time: time ?? 0, newPb: newPb && br.kc > 1, drops: [], marks: 0 };
  const table = dg.loot.find((t) => t.boss === boss);
  if (table) for (const d of rollTable(table, role, rng)) out.drops.push(grant(p, role, d.id, { source: 'table', boss, rate: d.rate, kc: br.kc }, now));
  out.marks = out.drops.reduce((a, d) => a + d.marks, 0);
  dungeonRecord(p, dg.id).marks += out.marks;
  return out;
}

/** What finishing the dungeon gave: the clear, the ladder piece, the spare piece and a mark. */
export interface ClearLoot { clears: number; time: number; pb: number | null; newPb: boolean; firstClear: boolean; drops: Drop[]; marks: number }

export function resolveClear(p: Profile, dg: DungeonInfo, role: RoleId, time: number, rng: Rng): ClearLoot {
  const rec = dungeonRecord(p, dg.id);
  rec.clears++;
  const out: ClearLoot = { clears: rec.clears, time, pb: null, newPb: false, firstClear: rec.clears === 1, drops: [], marks: CLEAR_MARKS };
  if (rec.pb === null || time < rec.pb) { out.newPb = rec.pb !== null; rec.pb = time; }
  out.pb = rec.pb;
  out.drops.push(regularDrop(p, role, rng));
  const spare = spareDrop(p, role, rng);
  if (spare) out.drops.push(spare);
  rec.marks += out.marks;
  return out;
}

/** Everything a run gave, put together for the reveal. The final boss's drops decide the tell. */
export function runLoot(p: Profile, dg: DungeonInfo, role: RoleId, kills: KillLoot[], clear: ClearLoot | null): RunLoot {
  const rec = dungeonRecord(p, dg.id);
  const out: RunLoot = { dungeon: dg.id, role, drops: [], tell: 'normal', kc: {}, marks: 0, clears: rec.clears, time: clear ? clear.time : 0, pb: rec.pb, newPb: !!clear?.newPb, firstClear: !!clear?.firstClear };
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
  if (end.practice) return runLoot(p, dg, end.role, [], null);
  const kills = end.bosses.map((b) => resolveKill(p, dg, b, end.role, end.bossTimes[b] ?? null, rng, now));
  const clear = end.cleared ? resolveClear(p, dg, end.role, end.time, rng) : null;
  return runLoot(p, dg, end.role, kills, clear);
}
