/**
 * Talents: two specs for each class, a tree each. Your level (content/xp.ts) gives a talent point a level from
 * level 2, the same points to every hero of yours; each hero picks a spec and spends them in its tree, and
 * each spec keeps its own points, so switching back is free. A tree has five rows: the top one is open, and a
 * row opens once enough points are in the rows above it (ROW_NEED). Stat talents take several points; the rest
 * take one and change how a button works (four buttons, never more). Rows 2 to 5 each offer two that change a
 * button and you take one of them (row 5's two are the capstones), so a full tree is four picks: sixteen builds
 * a spec (the owner's call, 18 Oct). A full tree is TREE_POINTS points, at level 30. The rules are
 * src/meta/talents.ts; what each talent does in a run is src/dungeon/specs.js (and fire.js for Fire's buttons).
 */
import type { AbilityDef, AbilitySlot, SpecButton, SpecDef, TalentDef } from '../types';
import { AXE, SHIELD } from './warrior';
import { MERCY, WRATH } from './cleric';
import { FIRE, FROST } from './mage';
import { BLADES, VENOM } from './rogue';
import { LONGBOW, TRAPPER } from './ranger';

export { TALENT_STATS, statLine } from './make';
export { BURN } from './mage';

/** every spec, two a class, the class's first one first */
export const SPEC_LIST: SpecDef[] = [SHIELD, AXE, MERCY, WRATH, FROST, FIRE, VENOM, BLADES, LONGBOW, TRAPPER];
export const SPECS: Record<string, SpecDef> = Object.fromEntries(SPEC_LIST.map((s) => [s.id, s]));
/** a class's two specs */
export const specsFor = (cls: string): SpecDef[] => SPEC_LIST.filter((s) => s.cls === cls);
/** a spec's talent by id, and which spec it's in */
export const TALENTS: Record<string, { spec: SpecDef; def: TalentDef }> = Object.fromEntries(SPEC_LIST.flatMap((s) => s.talents.map((t) => [t.id, { spec: s, def: t }])));

/** the points that must be in the rows above before a row opens (by row, 1 to 5) */
export const ROW_NEED: Record<number, number> = { 1: 0, 2: 5, 3: 10, 4: 15, 5: 20 };
export const ROWS = [1, 2, 3, 4, 5];
/** the points a full tree takes: every rank of every talent, one of each pair */
export function treePoints(s: SpecDef): number {
  const seen = new Set<string>();
  let n = 0;
  for (const t of s.talents) { if (t.choice) { if (seen.has(t.choice)) continue; seen.add(t.choice); } n += t.ranks; }
  return n;
}
export const TREE_POINTS = 29;

/** A button as a spec shows it: Fire's four have new names, pictures and words. Same slot, cooldown and cost. */
export function buttonFor(def: AbilityDef, spec: string | null | undefined, slot: AbilitySlot): AbilityDef & { icon: string } {
  const b: SpecButton | undefined = spec ? SPECS[spec]?.buttons?.[slot] : undefined;
  return b ? { ...def, name: b.name, desc: b.desc, combo: b.combo ?? def.combo, icon: b.icon } : { ...def, icon: def.key };
}

/** Spec content that would break the tree: a talent with no row, a pair that isn't two, a row past what it can
 *  reach, words that aren't one short sentence. checkContent() runs it. */
export function checkTalents(): string[] {
  const bad: string[] = [];
  const ids = new Set<string>();
  for (const s of SPEC_LIST) {
    if (specsFor(s.cls).length !== 2) bad.push(`${s.cls} has ${specsFor(s.cls).length} specs`);
    if (treePoints(s) !== TREE_POINTS) bad.push(`${s.id} tree is ${treePoints(s)} points`);
    const pairs: Record<string, number> = {};
    for (const t of s.talents) {
      if (ids.has(t.id)) bad.push(`talent ${t.id} twice`);
      ids.add(t.id);
      if (!ROWS.includes(t.row)) bad.push(`${t.id} row ${t.row}`);
      if (t.ranks < 1 || (!t.stat && t.ranks !== 1)) bad.push(`${t.id} ranks ${t.ranks}`);
      if (t.choice) pairs[t.choice] = (pairs[t.choice] || 0) + 1;
      if (!/^[A-Z+0-9]/.test(t.desc) || !/[.]$/.test(t.desc) || /[.!?]\s/.test(t.desc) || t.desc.length > 110 || /stroke/i.test(t.desc + t.name)) bad.push(`${t.id} words`);
      // a row can only be reached if the rows above hold enough points
      const above = s.talents.filter((x) => x.row < t.row && !(x.choice && s.talents.find((y) => y.choice === x.choice) !== x)).reduce((a, x) => a + x.ranks, 0);
      if (above < ROW_NEED[t.row]) bad.push(`${t.id} row ${t.row} can't open`);
    }
    for (const [c, n] of Object.entries(pairs)) if (n !== 2) bad.push(`${s.id} pair ${c} has ${n}`);
    // rows 2 to 5 are each a pick of two talents that change a button, and row 5's pair are the capstones
    for (const row of [2, 3, 4, 5]) {
      const picks = s.talents.filter((t) => t.row === row && !t.stat);
      if (picks.length !== 2 || !picks[0].choice || picks[0].choice !== picks[1].choice) bad.push(`${s.id} row ${row} isn't a pick of two`);
      if (picks.some((t) => !!t.capstone !== (row === 5))) bad.push(`${s.id} row ${row} capstones`);
    }
    if (s.talents.filter((t) => t.capstone).length !== 2) bad.push(`${s.id} capstones`);
    if (/stroke/i.test(s.pitch + (s.base || ''))) bad.push(`${s.id} words`);
  }
  return bad;
}
