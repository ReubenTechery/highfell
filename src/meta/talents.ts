/**
 * Talent points: your level gives every hero of yours the same points (one a level from level 2, up to a full
 * tree), and each hero spends them in its own class's tree. A hero picks one of its class's two specs, free to
 * change; each spec keeps its own points, so switching back costs nothing, and taking points back is free too.
 * A row opens once enough points are in the rows above it, and of row 3's pair you can have only one. What a
 * run gets from a hero's points: talentLoadout (the spec, the talents taken, and the stats added up).
 */
import type { SpecDef, TalentDef, TalentStat } from '../content/types';
import { ROW_NEED, SPECS, TALENT_STATS, TREE_POINTS, specsFor } from '../content/talents';
import { levelOf } from '../content/xp';
import type { Hero, Profile } from './profile';

/** the talent points your level gives each hero: one a level from level 2, up to a full tree */
export const pointsAt = (level: number): number => Math.max(0, Math.min(TREE_POINTS, level - 1));
export const pointsOf = (p: Profile): number => pointsAt(levelOf(p.xp));

/** a hero's spec, if it's one of its class's (an unknown or another class's counts as none) */
export function specOf(h: Pick<Hero, 'spec' | 'cls'>): SpecDef | null {
  const s = h.spec ? SPECS[h.spec] : undefined;
  return s && s.cls === h.cls ? s : null;
}
/** the points in a spec's tree, every talent's (only that spec's own talents count) */
const ranksIn = (h: Hero, spec: SpecDef): Record<string, number> => h.talents[spec.id] || {};
export const rankOf = (h: Hero, spec: SpecDef, id: string): number => {
  const t = spec.talents.find((x) => x.id === id);
  return t ? Math.min(t.ranks, ranksIn(h, spec)[id] || 0) : 0;
};
export const spentIn = (h: Hero, spec: SpecDef): number => spec.talents.reduce((a, t) => a + rankOf(h, spec, t.id), 0);
/** points in the rows above a row */
const above = (h: Hero, spec: SpecDef, row: number): number => spec.talents.filter((t) => t.row < row).reduce((a, t) => a + rankOf(h, spec, t.id), 0);
/** is a row open in this hero's tree? */
export const rowOpen = (h: Hero, spec: SpecDef, row: number): boolean => above(h, spec, row) >= (ROW_NEED[row] ?? 99);
/** points a hero has left to spend in its spec (all of them before it picks one) */
export function unspent(p: Profile, h: Hero): number {
  const s = specOf(h), pts = pointsOf(p);
  return s ? Math.max(0, pts - spentIn(h, s)) : pts;
}

/** why a point can't go in a talent now, or null when it can */
export function addProblem(p: Profile, h: Hero, spec: SpecDef, t: TalentDef): string | null {
  if (spec.cls !== h.cls || !spec.talents.includes(t)) return 'Not this hero’s';
  if (rankOf(h, spec, t.id) >= t.ranks) return 'Full';
  if (!rowOpen(h, spec, t.row)) return `Needs ${ROW_NEED[t.row]} points above`;
  if (t.choice && spec.talents.some((x) => x !== t && x.choice === t.choice && rankOf(h, spec, x.id) > 0)) return 'You took the other one';
  if (pointsOf(p) - spentIn(h, spec) <= 0) return 'No points left';
  return null;
}
/** Put a point in a talent of a spec (the hero's own or its other one). False if it can't go in. */
export function addPoint(p: Profile, h: Hero, specId: string, id: string): boolean {
  const spec = SPECS[specId], t = spec?.talents.find((x) => x.id === id);
  if (!spec || !t || addProblem(p, h, spec, t)) return false;
  const r = (h.talents[spec.id] ||= {});
  r[id] = rankOf(h, spec, id) + 1;
  return true;
}
/** Can a point come back out of a talent? Not if a row below would close with it gone. */
export function canTakeBack(h: Hero, spec: SpecDef, id: string): boolean {
  const t = spec.talents.find((x) => x.id === id);
  if (!t || rankOf(h, spec, id) <= 0) return false;
  for (const row of [2, 3, 4, 5]) {
    if (row <= t.row || !spec.talents.some((x) => x.row === row && rankOf(h, spec, x.id) > 0)) continue;
    if (above(h, spec, row) - 1 < ROW_NEED[row]) return false;
  }
  return true;
}
/** Take a point back out of a talent: free. */
export function takeBack(h: Hero, specId: string, id: string): boolean {
  const spec = SPECS[specId];
  if (!spec || !canTakeBack(h, spec, id)) return false;
  const r = h.talents[spec.id];
  r[id] = rankOf(h, spec, id) - 1;
  if (r[id] <= 0) delete r[id];
  return true;
}
/** Every point back out of a spec's tree: free. */
export function resetSpec(h: Hero, specId: string): boolean {
  if (!h.talents[specId] || !Object.keys(h.talents[specId]).length) return false;
  h.talents[specId] = {};
  return true;
}
/** Pick one of the hero's class's specs. Its points are as you left them. */
export function pickSpec(h: Hero, specId: string): boolean {
  const s = SPECS[specId];
  if (!s || s.cls !== h.cls || h.spec === specId) return false;
  h.spec = specId;
  return true;
}
/** the specs a hero can pick */
export const specsOf = (h: Hero): SpecDef[] => specsFor(h.cls);

/** What a hero's points bring to a run: its spec (Fire changes the buttons with none in), the talents it has
 *  that change a button, and each stat added up (0.1 is a tenth more). A hero with points past what your level
 *  gives (only a save from a newer build could have that) keeps its first ones, in tree order. */
export interface TalentLoadout { spec: string | null; tal: string[]; ts: Partial<Record<TalentStat, number>> }
export function talentLoadout(p: Profile, h: Hero): TalentLoadout {
  const s = specOf(h);
  if (!s) return { spec: null, tal: [], ts: {} };
  let left = pointsOf(p);
  const tal: string[] = [], ts: Partial<Record<TalentStat, number>> = {};
  const taken = new Set<string>();
  for (const t of [...s.talents].sort((a, b) => a.row - b.row)) {
    if (t.choice && taken.has(t.choice)) continue;
    const n = Math.min(rankOf(h, s, t.id), left);
    if (n <= 0) continue;
    left -= n;
    if (t.choice) taken.add(t.choice);
    if (t.stat) ts[t.stat] = (ts[t.stat] || 0) + n * TALENT_STATS[t.stat].per;
    else tal.push(t.id);
  }
  return { spec: s.id, tal, ts };
}
