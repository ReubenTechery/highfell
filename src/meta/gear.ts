/** What a hero is wearing, what it adds up to, and changing it. Nothing goes on by itself: new pieces
 *  wait in the hero's bag (regular gear) or as fresh uniques until you put them on. */
import type { GearKey, ItemDef, Rar, RoleId, SlotId } from '../content/types';
import type { RegularSlot } from './profile';
import { ITEMS, KITS, SETS } from '../content';
import { gilded } from '../content/kits';
import { EPIC, RARITY, SLOTS, SLOT_IDS, TRAITS, gearId, gearKey, hpMultiplier, powerFromScore, traitDef, weightedScore } from '../content/gear';
import type { ClassId, RaceId } from '../content/folk';
import { fillerMul, fillerOf } from '../content/roles';
import { activeHero, createHero, roleOf, type Hero, type Profile } from './profile';

export interface Worn { slot: SlotId; def: ItemDef; trait?: string; unique: boolean }
export interface Loadout {
  power: number;
  traits: string[];
  bonuses: string[];
  weaponRar: Rar;
  unique: string | null;
  sets: Record<string, number>;
  score: number;
}

/** Whether an item belongs to this hero's class/role (Rogue uses cls: 'rogue'; Mage uses role: 'dps' without cls). */
export const fitsHero = (def: ItemDef, h: { role?: RoleId; cls?: string } | Hero): boolean => {
  const role = 'id' in h ? roleOf(h) : (h.role || 'dps');
  if (def.role !== role) return false;
  return h.cls === 'rogue' ? def.cls === 'rogue' : !def.cls;
};

/** The four things a hero has on right now. A weapon trait unlocked at Rare+ stays active even when wearing a unique weapon. */
export function worn(p: Profile, h: Hero): Record<SlotId, Worn> {
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const out = {} as Record<SlotId, Worn>;
  const regW = bestRegular(h, 'weapon');
  const wepTrait = regW.rar >= 2 ? regW.trait : undefined;
  for (const slot of SLOT_IDS) {
    const uid = h.equip[slot];
    const u = uid && ITEMS[uid] && p.collection[uid] && fitsHero(ITEMS[uid], h) && ITEMS[uid].slot === slot ? ITEMS[uid] : null;
    if (u) out[slot] = { slot, def: u, trait: slot === 'weapon' ? wepTrait : undefined, unique: true };
    else { const reg = h.regular[slot]; out[slot] = { slot, def: ITEMS[gearId(gKey, slot, reg.rar)], trait: slot === 'weapon' && reg.rar >= 2 ? reg.trait : undefined, unique: false }; }
  }
  return out;
}

/** True Epic drops sit above the regular ladder, one Power for the whole season (the owner's call, 18 Oct): a set
 *  piece is 26 and a boss weapon 4 more, 30, whichever dungeon drops it. A later dungeon's gear is different, never
 *  more: the climb after your first Epic set is your level (content/xp.ts levelBonus). */
export const BOSS_WEAPON_EDGE = 4;
export const itemScore = (def: ItemDef): number => RARITY[def.rar].score + (def.kind !== 'gear' ? 4 + (def.kind === 'unique' && def.slot === 'weapon' ? BOSS_WEAPON_EDGE : 0) : 0);

export function loadoutOf(items: Worn[]): Loadout {
  const scores = {} as Record<SlotId, number>;
  const traits: string[] = [];
  const bonuses: string[] = [];
  const sets: Record<string, number> = {};
  let unique: string | null = null, weaponRar: Rar = 0;
  for (const w of items) {
    scores[w.slot] = itemScore(w.def);
    if (w.trait) traits.push(w.trait);
    if (w.def.setId) sets[w.def.setId] = (sets[w.def.setId] || 0) + 1;
    if (w.def.effect) {
      if (w.slot === 'weapon') unique = w.def.effect;
      else if (!bonuses.includes(w.def.effect)) bonuses.push(w.def.effect);
    }
    if (w.slot === 'weapon') weaponRar = w.def.rar;
  }
  for (const [id, n] of Object.entries(sets)) { const s = SETS[id]; if (!s) continue; if (n >= 2) bonuses.push(s.bonus2.id); if (n >= 3) bonuses.push(s.bonus3.id); }
  const score = weightedScore(scores);
  return { power: powerFromScore(score), traits, bonuses, weaponRar, unique, sets, score };
}

export function loadoutFor(p: Profile, h: Hero): Loadout {
  return loadoutOf(Object.values(worn(p, h)));
}

/** A score's item level as the game shows it, where it is called Power: a whole number (Power 13, never 13.2). */
export const wholeIlvl = (score: number): number => Math.round(score);

/** Plain regular gear at one rarity: what the bots in your party wear, and test gear. */
export function plainLoadout(role: GearKey, rar: Rar, trait?: string): Loadout {
  return loadoutOf(SLOT_IDS.map((slot) => ({ slot, def: ITEMS[gearId(role, slot, rar)], trait: rar === EPIC && slot === 'weapon' ? trait || TRAITS[role][0].id : undefined, unique: false })));
}

/** The rarity the rest of your party should wear so the run feels like your gear. */
export function partyRar(p: Profile, h: Hero): Rar {
  const w = worn(p, h);
  return Math.round(SLOT_IDS.reduce((a, s) => a + w[s].def.rar, 0) / SLOT_IDS.length) as Rar;
}

/** what a loadout's filler hits for before a crit (Cleave, Smite, Icicle, Viper Blades): its Power, and the helms
 *  that make it hit harder. A new weapon shows here, and on the next swing. */
export function fillerHit(l: Loadout, role: GearKey): number {
  return Math.round((fillerOf(role).def.hit || 0) * l.power * fillerMul(l.bonuses));
}

/** Score as a percentage over all-Common, for the gear screen. */
export const powerPct = (l: Loadout): number => Math.round((l.power - 1) * 100);
export const healthPct = (l: Loadout): number => Math.round((hpMultiplier(l.power) - 1) * 100);
/** What one item adds on its own: its share of power and of health, in percent. */
export function itemShare(def: ItemDef): { power: number; health: number; ilvl: number } {
  const w = SLOTS.find((s) => s.id === def.slot)?.weight ?? 0;
  const sc = itemScore(def);
  const power = (w * 0.72 * (sc - 10)) / 12;
  return { power: Math.round(power * 1000) / 10, health: Math.round(power * 0.5 * 1000) / 10, ilvl: sc };
}

/** Something gear does beyond its numbers: a unique's effect, an Epic weapon's trait or a set bonus. */
export interface Effect { kind: 'unique' | 'trait' | 'set'; id: string; name: string; desc: string; later?: boolean }
/** Everything a loadout does beyond its numbers. A set bonus that isn't ready yet comes marked `later`. */
export function effectsOf(l: Loadout, role: GearKey): Effect[] {
  const out: Effect[] = [];
  const u = l.unique ? Object.values(ITEMS).find((d) => d.effect === l.unique) : undefined;
  if (u && l.unique) out.push({ kind: 'unique', id: l.unique, name: u.name, desc: u.effectDesc || '' });
  for (const b of l.bonuses) {
    const piece = Object.values(ITEMS).find((d) => d.kind === 'set' && d.effect === b);
    if (piece && piece.effectDesc) out.push({ kind: 'unique', id: b, name: piece.name, desc: piece.effectDesc });
  }
  for (const t of l.traits) { const d = traitDef(role, t); if (d) out.push({ kind: 'trait', id: d.id, name: d.name, desc: d.desc }); }
  for (const s of Object.values(SETS)) {
    if (l.bonuses.includes(s.bonus2.id)) out.push({ kind: 'set', id: s.bonus2.id, name: `${s.name}, 2 pieces`, desc: s.bonus2.desc });
    if (l.bonuses.includes(s.bonus3.id)) out.push({ kind: 'set', id: s.bonus3.id, name: `${s.name}, 3 pieces`, desc: s.bonus3.desc, ...(s.bonus3.ready ? {} : { later: true }) });
  }
  return out;
}

export type Verdict = 'wearing' | 'better' | 'worse' | 'same' | 'mixed';
/** A piece held up against what is worn in its slot: the slot's item level before and after, what the
 *  whole hero gains in power and health (in percent), its set count before and after, and the effects
 *  it adds and takes away. */
export interface Compare { slot: SlotId; now: Worn; ilvl: [number, number]; power: number; health: number; set: [number, number] | null; gains: Effect[]; loses: Effect[]; verdict: Verdict;
  /** the filler's hit before and after (fillerHit) */
  hit: [number, number] }
/** Hold a piece up against what a hero wears. Better: more item level or a new effect, nothing lost.
 *  Worse: less, or an effect lost for nothing. Both at once is a trade ('mixed'). A bonus that isn't
 *  ready yet is listed but doesn't make a piece better. */
export function compareOn(now: Record<SlotId, Worn>, role: GearKey, def: ItemDef): Compare {
  const slot = def.slot, cur = now[slot];
  const next: Record<SlotId, Worn> = { ...now, [slot]: { slot, def, trait: slot === 'weapon' ? cur.trait : undefined, unique: def.kind !== 'gear' } };
  const a = loadoutOf(Object.values(now)), b = loadoutOf(Object.values(next));
  const ea = effectsOf(a, role), eb = effectsOf(b, role);
  const has = (list: Effect[], e: Effect): boolean => list.some((x) => x.kind === e.kind && x.id === e.id);
  const gains = eb.filter((e) => !has(ea, e)), loses = ea.filter((e) => !has(eb, e));
  const ilvl: [number, number] = [itemScore(cur.def), itemScore(def)];
  const pct = (x: number): number => Math.round(x * 1000) / 10 + 0;
  const plus = ilvl[1] > ilvl[0] || gains.some((e) => !e.later), minus = ilvl[1] < ilvl[0] || loses.length > 0;
  return {
    slot, now: cur, ilvl,
    power: pct(b.power - a.power), health: pct(hpMultiplier(b.power) - hpMultiplier(a.power)),
    set: def.setId ? [a.sets[def.setId] || 0, b.sets[def.setId] || 0] : null,
    gains, loses,
    verdict: cur.def.id === def.id ? 'wearing' : plus && minus ? 'mixed' : plus ? 'better' : minus ? 'worse' : 'same',
    hit: [fillerHit(a, role), fillerHit(b, role)],
  };
}
/** The same for one of your heroes, against what they wear. Null when the piece isn't for their role/class. */
export function compareFor(p: Profile, h: Hero, id: string): Compare | null {
  const d = ITEMS[id];
  return d && fitsHero(d, h) ? compareOn(worn(p, h), gearKey({ role: roleOf(h), cls: h.cls }), d) : null;
}
/** What a new hero of a role starts in: the shared gear, nothing unique on. */
export function floorWorn(p: Profile, role: RoleId, cls?: string): Record<SlotId, Worn> {
  const gKey: GearKey = cls === 'rogue' ? 'rogue' : role;
  const out = {} as Record<SlotId, Worn>;
  for (const slot of SLOT_IDS) { const r = p.warband[role][slot]; out[slot] = { slot, def: ITEMS[gearId(gKey, slot, r.rar)], trait: r.rar >= 2 ? r.trait : undefined, unique: false }; }
  return out;
}
/** Who a piece would go on: your hero if it fits their role/class, or else your hero of its role/class you played last. */
export function wearerOf(p: Profile, def: ItemDef): Hero | null {
  const h = activeHero(p);
  if (h && fitsHero(def, h)) return h;
  return p.roster.filter((x) => fitsHero(def, x)).sort((a, b) => b.playedAt - a.playedAt)[0] || null;
}

/** Wear a unique you own in its slot, or pass null to go back to the regular piece. */
export function equip(p: Profile, h: Hero, slot: SlotId, uniqueId: string | null): boolean {
  if (uniqueId) {
    const d = ITEMS[uniqueId];
    if (!d || !p.collection[uniqueId] || !fitsHero(d, h) || d.slot !== slot) return false;
    h.fresh = h.fresh.filter((x) => x !== uniqueId);
  }
  h.equip[slot] = uniqueId;
  return true;
}

/** The best regular piece a hero has for a slot, worn or waiting in the bag. The ladder climbs from this. */
export const bestRegular = (h: Hero, slot: SlotId): RegularSlot => (h.bag[slot] && h.bag[slot]!.rar > h.regular[slot].rar ? h.bag[slot]! : h.regular[slot]);

/** Put a regular piece in the hero's bag if it beats everything they have for that slot. */
export function bagIt(h: Hero, slot: SlotId, piece: RegularSlot): boolean {
  if (piece.rar <= bestRegular(h, slot).rar) return false;
  h.bag[slot] = { ...piece };
  return true;
}

/** What is waiting to go on in a slot: a better regular piece (while the regular piece is worn there) or a fresh unique. */
export type Waiting = { kind: 'regular'; slot: SlotId; piece: RegularSlot; id: string } | { kind: 'unique'; slot: SlotId; id: string };
export function waitingFor(p: Profile, h: Hero, slot: SlotId): Waiting | null {
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const freshMatching = h.fresh
    .filter((id) => ITEMS[id] && ITEMS[id].slot === slot && fitsHero(ITEMS[id], h) && p.collection[id] && h.equip[slot] !== id)
    .sort((a, b) => itemScore(ITEMS[b]) - itemScore(ITEMS[a]));
  if (freshMatching.length) return { kind: 'unique', slot, id: freshMatching[0] };
  const b = h.bag[slot];
  if (b && !h.equip[slot] && b.rar > h.regular[slot].rar) return { kind: 'regular', slot, piece: b, id: gearId(gKey, slot, b.rar) };
  return null;
}
/** Every slot with something waiting: the dot on the Gear button. */
export const waiting = (p: Profile, h: Hero): Waiting[] => SLOT_IDS.map((s) => waitingFor(p, h, s)).filter((w): w is Waiting => !!w);

/** Put on what is waiting in a slot. Returns what went on, or null. */
export function putOn(p: Profile, h: Hero, slot: SlotId): Waiting | null {
  const w = waitingFor(p, h, slot);
  if (!w) return null;
  if (w.kind === 'unique') equip(p, h, slot, w.id);
  else { h.regular[slot] = { ...w.piece }; h.bag[slot] = null; h.equip[slot] = null; }
  return w;
}

/** You looked at a slot: its fresh uniques stop glowing (they stay yours to wear). */
export function seenSlot(h: Hero, slot: SlotId): boolean {
  const before = h.fresh.length;
  h.fresh = h.fresh.filter((id) => ITEMS[id]?.slot !== slot);
  return h.fresh.length !== before;
}

/** A unique arrived: every hero of its role/class can wear it, and it glows for them until they look. */
export function freshForRole(p: Profile, id: string): void {
  const it = ITEMS[id];
  if (!it || it.kind === 'gear') return;
  for (const h of p.roster) if (fitsHero(it, h) && h.equip[it.slot] !== id && !h.fresh.includes(id)) h.fresh.push(id);
}

/** A piece's gilded look is yours (its gilding kit dropped in Heroic) and switched on, for every hero who wears
 *  it. It starts on, like every look; it never changes power. */
export const gildedOn = (p: Profile, id: string): boolean => { const k = gilded(id); return !!KITS[k] && !!p.collection[k] && !p.settings.looksOff.includes(k); };
/** Switch a piece you own between plain and gilded, once you have its kit. */
export function setGilded(p: Profile, id: string, on: boolean): boolean {
  const k = gilded(id);
  if (!KITS[k] || !p.collection[k] || !p.collection[id]) return false;
  p.settings.looksOff = p.settings.looksOff.filter((x) => x !== k);
  if (!on) p.settings.looksOff.push(k);
  return true;
}
/** What a piece looks like: its kit's id (the gilded picture and name) while it's gilded, else its own. */
export const lookId = (p: Profile, id: string): string => (gildedOn(p, id) ? gilded(id) : id);

/** Uniques the roster owns that this hero could wear in a slot, sorted highest item level first. */
export function ownedFor(p: Profile, h: Hero, slot: SlotId): ItemDef[] {
  return Object.keys(p.collection)
    .map((id) => ITEMS[id])
    .filter((d): d is ItemDef => !!d && d.kind !== 'gear' && fitsHero(d, h) && d.slot === slot)
    .sort((a, b) => itemScore(b) - itemScore(a));
}

/** One piece in a slot's row in the armoury. `worn`: on the hero now. `isNew`: waiting to go on, a better
 *  regular piece in the bag or a unique that arrived since you last looked. `found`: yours; the uniques you
 *  haven't found yet are listed too, so you can see what's left to chase. */
export interface ShelfPiece { def: ItemDef; worn: boolean; isNew: boolean; found: boolean }

/** Everything a hero has for a slot, the way the armoury lines it up: what is worn, then what waits to go
 *  on, then the rest of what you have, best first, then the uniques you haven't found yet. Only the best
 *  regular piece you have counts (the ladder replaces the others), plus the one worn while a better one
 *  waits in the bag. */
export function shelfFor(p: Profile, h: Hero, slot: SlotId): ShelfPiece[] {
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const on = worn(p, h)[slot].def;
  const bag = h.bag[slot];
  const bagNew = bag && !h.equip[slot] && bag.rar > h.regular[slot].rar ? gearId(gKey, slot, bag.rar) : null;
  const isNew = (d: ItemDef): boolean => d.id !== on.id && (d.kind === 'gear' ? d.id === bagNew : h.fresh.includes(d.id));
  const have = [ITEMS[gearId(gKey, slot, bestRegular(h, slot).rar)], ...ownedFor(p, h, slot)];
  if (!have.some((d) => d.id === on.id)) have.unshift(on);
  const rank = (d: ItemDef): number => (d.id === on.id ? 2 : isNew(d) ? 1 : 0);
  const best = (a: ItemDef, b: ItemDef): number => itemScore(b) - itemScore(a) || a.id.localeCompare(b.id);
  const toFind = Object.values(ITEMS).filter((d) => d.kind !== 'gear' && d.slot === slot && fitsHero(d, h) && !p.collection[d.id]).sort(best);
  return [
    ...have.sort((a, b) => rank(b) - rank(a) || best(a, b)).map((def) => ({ def, worn: def.id === on.id, isNew: isNew(def), found: true })),
    ...toFind.map((def) => ({ def, worn: false, isNew: false, found: false })),
  ];
}

/** Put on any piece from a slot's row: a unique you own, the regular piece you wear, or the better one
 *  waiting in the bag. False for anything else: one the ladder replaced, one you haven't found, another
 *  class's. */
export function wear(p: Profile, h: Hero, def: ItemDef): boolean {
  const slot = def.slot;
  if (def.kind !== 'gear') return equip(p, h, slot, def.id);
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const bag = h.bag[slot];
  if (bag && bag.rar > h.regular[slot].rar && def.id === gearId(gKey, slot, bag.rar)) {
    h.regular[slot] = { ...bag }; h.bag[slot] = null; h.equip[slot] = null;
    return true;
  }
  if (def.id !== gearId(gKey, slot, h.regular[slot].rar)) return false;
  h.equip[slot] = null;
  return true;
}

/** How putting a piece on moves a set: the set it is in, or else the set of what it replaces, with how many
 *  of that set are worn before and after. Null when neither is a set piece. */
export function setChange(now: Record<SlotId, Worn>, def: ItemDef): { id: string; before: number; after: number } | null {
  const id = def.setId || now[def.slot].def.setId;
  if (!id) return null;
  const count = (w: Record<SlotId, Worn>): number => SLOT_IDS.filter((s) => w[s].def.setId === id).length;
  return { id, before: count(now), after: count({ ...now, [def.slot]: { slot: def.slot, def, unique: def.kind !== 'gear' } }) };
}

/** Whether something you have for a slot beats what is worn there: the quiet arrow a slot keeps once its
 *  New glow has gone. */
export function betterFor(p: Profile, h: Hero, slot: SlotId): boolean {
  const now = worn(p, h), gKey = gearKey({ role: roleOf(h), cls: h.cls });
  return shelfFor(p, h, slot).some((x) => x.found && !x.worn && compareOn(now, gKey, x.def).verdict === 'better');
}

/** Make a hero: it starts wearing the shared gear for its role, and the uniques the roster owns for
 *  that role wait for it to put them on. */
export function newHero(p: Profile, o: { name: string; race: RaceId; cls: ClassId; sex?: 'm' | 'f'; free?: boolean }, now = Date.now()): Hero | null {
  const h = createHero(p, o, now);
  if (h) for (const slot of SLOT_IDS) for (const u of ownedFor(p, h, slot)) h.fresh.push(u.id);
  return h;
}

export const REROLL_COST = 0;
/** Set the trait on a Rare+ regular weapon to the one you pick (the one in the bag, if that is the best one). Free once unlocked at Rare. */
export function buyTrait(p: Profile, h: Hero, dungeon: string, trait: string): boolean {
  const gKey = gearKey({ role: roleOf(h), cls: h.cls });
  const reg = bestRegular(h, 'weapon');
  const rec = p.dungeons[dungeon];
  if (reg.rar < 2 || reg.trait === trait || !TRAITS[gKey].some((t) => t.id === trait)) return false;
  if (rec && rec.marks >= REROLL_COST) rec.marks -= REROLL_COST;
  reg.trait = trait;
  return true;
}

/** The trait the trait buttons pick: the one on the best regular weapon you have (Rare or better, worn or
 *  still in the bag). It works while that weapon is on, or under a unique weapon; one still in the bag works
 *  once it goes on. Null below Rare. */
export function weaponTrait(p: Profile, h: Hero): { trait: string | undefined; rar: Rar; on: boolean } | null {
  const best = bestRegular(h, 'weapon');
  if (best.rar < 2) return null;
  return { trait: best.trait, rar: best.rar, on: !!best.trait && worn(p, h).weapon.trait === best.trait };
}

/** The boss weapon the Crypt Trial lends a class: the Barrow's own for its role (and class, for the rogue's
 *  daggers), so the trial always shows the real weapon's power. */
export function trialWeapon(role: RoleId, cls: ClassId | string | undefined): string | null {
  const all = Object.values(ITEMS).filter((i) => i.dungeon === 'barrow' && i.kind === 'unique' && i.slot === 'weapon' && i.role === role);
  return (all.find((i) => i.cls && i.cls === cls) || all.find((i) => !i.cls))?.effect || null;
}
