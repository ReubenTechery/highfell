/**
 * XP and your level. Every kill in a run that counts pays XP the moment it dies (the engine pops it over the mob,
 * the run adds it here), finishing pays CLEAR_XP, and the chest holds lore pages (a roll of how many) and maybe a
 * tome, each line rolled on its own at a fixed rate. A harder dungeon pays more, Heroic more again. A wipe or
 * leaving keeps what you'd earned. The level is yours, not one hero's: every hero of yours gets its talent points.
 */
import type { DungeonInfo } from '../content/types';
import { DUNGEONS } from '../content';
import { CLEAR_XP, HEROIC_XP, MAX_LEVEL, PAGES, PAGE_ROLLS, PAGE_XP, TIER_XP, TOMES, levelNeed, levelOf, xpForLevel } from '../content/xp';
import type { Rng } from '../core/rng';
import type { Profile } from './profile';

/** your level now */
export const level = (p: Profile): number => levelOf(p.xp);
/** where you are in your level: the level, XP into it and what it needs, and how far along (0 to 1; 1 at the top) */
export function levelProgress(xp: number): { level: number; into: number; need: number; k: number } {
  const lv = levelOf(xp);
  if (lv >= MAX_LEVEL) return { level: lv, into: 0, need: 0, k: 1 };
  const into = xp - xpForLevel(lv), need = levelNeed(lv);
  return { level: lv, into, need, k: into / need };
}

/** what a dungeon's XP is multiplied by: its tier's, and Heroic's on top (a heroic dungeon is its normal one's tier) */
export function xpMul(dg: DungeonInfo): number {
  const base = dg.heroicOf ? DUNGEONS[dg.heroicOf] || dg : dg;
  return (TIER_XP[base.tier || dg.tier || 1] || 1) * (dg.heroicOf ? HEROIC_XP : 1);
}

/** XP just earned: how much, and the levels it took you through (from and to; equal when none) */
export interface XpGain { xp: number; from: number; to: number }
/** Add XP to your total, and say if it was a level (or several). Your best level is kept as a counter, for the
 *  level achievements. */
export function gainXp(p: Profile, amount: number): XpGain {
  const n = Math.max(0, Math.round(amount)), from = levelOf(p.xp);
  p.xp += n;
  const to = levelOf(p.xp);
  if (to > (p.counters.level || 0)) p.counters.level = to;
  return { xp: n, from, to };
}

/** how many lore pages a chest holds: one roll on PAGE_ROLLS */
export function rollPages(rng: Rng): number {
  let r = rng();
  for (const o of PAGE_ROLLS) { if (r < o.chance) return o.n; r -= o.chance; }
  return PAGE_ROLLS[0].n;
}
/** The chest's XP: its lore pages, then each tome that rolls (each on its own, at its rate), all times the
 *  dungeon's multiplier, plus the clear's own XP. Added to your total here. */
export interface ChestXp { clear: number; pages: number; pagesXp: number; tomes: { id: string; xp: number }[]; total: number }
export function chestXp(p: Profile, dg: DungeonInfo, rng: Rng): ChestXp {
  const mul = xpMul(dg);
  const pages = rollPages(rng);
  const tomes = TOMES.filter((t) => rng() < t.rate).map((t) => ({ id: t.id, xp: Math.round(t.xp * mul) }));
  const out: ChestXp = { clear: Math.round(CLEAR_XP * mul), pages, pagesXp: Math.round(pages * PAGE_XP * mul), tomes, total: 0 };
  out.total = out.clear + out.pagesXp + tomes.reduce((a, t) => a + t.xp, 0);
  gainXp(p, out.total);
  return out;
}

/** every chest has pages; the tomes' rates, for the Dungeons sheet's loot page (honest: what you see is the rate) */
export const chestXpLines = (): { id: string; name: string; icon: string; rate: number | null; xp: number }[] => [
  { id: PAGES.id, name: PAGES.name, icon: PAGES.icon, rate: null, xp: PAGE_XP },
  ...TOMES.map((t) => ({ id: t.id, name: t.name, icon: t.icon, rate: t.rate, xp: t.xp })),
];
