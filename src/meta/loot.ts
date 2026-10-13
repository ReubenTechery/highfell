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

/** Rolls everything a finished run earned and writes it into the profile. Returns what happened, for the reveal. */
export function resolveRun(p: Profile, dg: DungeonInfo, end: RunEnd, rng: Rng, now = Date.now()): RunLoot {
  const out: RunLoot = { dungeon: dg.id, role: end.role, drops: [], tell: 'normal', kc: {}, marks: 0, clears: 0, time: end.time, pb: null, newPb: false, firstClear: false };
  const rec = dungeonRecord(p, dg.id);
  if (end.practice) { out.clears = rec.clears; out.pb = rec.pb; return out; }
  for (const boss of end.bosses) {
    const br = bossRecord(p, dg.id, boss);
    br.kc++;
    out.kc[boss] = br.kc;
    const bt = end.bossTimes[boss];
    if (typeof bt === 'number' && (br.pb === null || bt < br.pb)) br.pb = bt;
    const table = dg.loot.find((t) => t.boss === boss);
    if (table) for (const d of rollTable(table, end.role, rng)) out.drops.push(grant(p, end.role, d.id, { source: 'table', boss, rate: d.rate, kc: br.kc }, now));
  }
  if (end.cleared) {
    rec.clears++;
    out.clears = rec.clears;
    out.firstClear = rec.clears === 1;
    if (rec.pb === null || end.time < rec.pb) { out.newPb = rec.pb !== null; rec.pb = end.time; }
    out.pb = rec.pb;
    out.marks += CLEAR_MARKS;
    out.drops.push(regularDrop(p, end.role, rng));
    const spare = spareDrop(p, end.role, rng);
    if (spare) out.drops.push(spare);
  }
  for (const d of out.drops) out.marks += d.marks;
  rec.marks += out.marks;
  out.tell = tellOf(out.drops);
  return out;
}
