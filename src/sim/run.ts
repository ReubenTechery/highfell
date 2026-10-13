/**
 * Headless runs: the real engine with bots in every seat, no screen, no sound. Same seed, same run,
 * every time. The balance numbers come from here.
 */
import { newGame, respawn, update } from '../dungeon/game.js';
import { S } from '../dungeon/state.js';
import { BARROW_ENGINE } from '../content/barrow/engine';
import type { RoleId } from '../content/types';

export const STEP = 1 / 60;
export interface SimOpts { role: RoleId; seed: number; start?: string; solo?: boolean; loadouts?: Record<string, unknown>; maxT?: number; maxWipes?: number; events?: boolean }
export interface SimResult {
  role: RoleId; seed: number; over: string; t: number; clear: number | null; wipes: number;
  stats: Record<string, number>;
  heroes: { role: RoleId; dmg: number; heal: number; taken: number; dodges: number; perfect: number; blocks: number; deaths: number }[];
}

export function simRun(o: SimOpts): SimResult {
  newGame(BARROW_ENGINE, { role: o.role, seed: o.seed, start: o.start || 'entrance', solo: !!o.solo, auto: true, quiet: true, noEvents: !o.events, loadouts: o.loadouts || {} });
  const s = S as any;
  s.startedAt = s.t;
  const maxT = o.maxT ?? 1500, maxWipes = o.maxWipes ?? 6;
  for (;;) {
    update(STEP);
    if (s.over === 'victory' || s.over === 'lost') break;
    if (s.over === 'wipe' && s.timers.length === 0) {
      if (s.stats.wipes + 1 >= maxWipes) { s.stats.wipes++; break; }
      respawn();
    }
    if (s.t > maxT) break;
  }
  return {
    role: o.role, seed: o.seed, over: s.over || '', t: +s.t.toFixed(2), clear: s.clearTime || null, wipes: s.stats.wipes, stats: { ...s.stats },
    heroes: s.heroes.map((h: any) => ({ role: h.role, dmg: Math.round(h.stats.dmg), heal: Math.round(h.stats.heal), taken: Math.round(h.stats.taken), dodges: h.stats.dodges, perfect: h.stats.perfect, blocks: h.stats.blocks, deaths: h.stats.deaths })),
  };
}
