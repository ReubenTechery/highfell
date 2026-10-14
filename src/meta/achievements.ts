/**
 * Achievements. Listens to what happens in a run, keeps the lifetime counters, unlocks achievements
 * the moment they are earned and hands out their rewards. Content decides what counts; this file
 * only applies the rules.
 */
import type { AchievementDef, GameEvent, RoleId, RunSummary } from '../content/types';
import { ACHIEVEMENTS, ACHIEVEMENT_LIST, COLLECTIBLES } from '../content';
import { autoPlace } from './hearth';
import { logDone, logProgress } from './logs';
import { count, type Profile } from './profile';

export interface AchContext { dungeon: string; role: RoleId; practice: boolean; testGear: boolean }

/** what a dungeon-prefixed counter key looks like, e.g. barrow.skeletons */
const k = (d: string, name: string): string => `${d}.${name}`;

export class Achiever {
  /** unlocked during this session, in order */
  readonly unlocked: string[] = [];
  constructor(private p: Profile, private ctx: AchContext, private now: () => number = () => Date.now()) {}

  private eligible(a: AchievementDef): boolean {
    return !this.p.achievements[a.id] && a.dungeon === this.ctx.dungeon && (!a.role || a.role === this.ctx.role);
  }

  /** Feed every engine event through here. Returns achievements this event unlocked. */
  event(e: GameEvent): string[] {
    const d = this.ctx.dungeon, p = this.p;
    const before = this.unlocked.length;
    switch (e.type) {
      case 'mob.killed': count(p, 'kills'); if (e.undead) count(p, k(d, 'skeletons')); if (e.boss) count(p, k(d, 'bosses')); break;
      case 'wisp.sliced': if (e.player) count(p, k(d, 'wisps')); break;
      case 'chain.cut': if (e.player) count(p, k(d, 'chains')); break;
      case 'cage.broken': if (e.player) count(p, 'cages'); break;
      case 'block': if (e.player) count(p, e.perfect ? 'perfect_blocks' : 'blocks'); break;
      case 'dodge': if (e.player) count(p, 'dodges'); break;
      case 'crit': if (e.player) { count(p, 'crits'); if (e.amount > (p.counters.biggest_crit || 0)) p.counters.biggest_crit = e.amount; } break;
      case 'hero.died': if (e.player) count(p, 'deaths'); break;
      case 'heal.save': if (e.player) count(p, 'saves'); break;
      case 'run.wipe': count(p, 'wipes'); break;
    }
    for (const a of ACHIEVEMENT_LIST) {
      if (!this.eligible(a)) continue;
      if (a.counter && (p.counters[a.counter.key] || 0) >= a.counter.target) this.unlock(a.id);
      else if (a.live && a.live(e, this.ctx)) this.unlock(a.id);
    }
    return this.unlocked.slice(before);
  }

  /** A run was cleared from the entrance. Practice runs and test gear do not count for these. */
  cleared(r: RunSummary): string[] {
    const before = this.unlocked.length;
    if (!r.practice && !r.testGear) for (const a of ACHIEVEMENT_LIST) if (this.eligible(a) && a.run && a.run(r)) this.unlock(a.id);
    return this.unlocked.slice(before);
  }

  /** Check the counter achievements now: for things outside a run, like gathering and brewing. Any
   *  collection log already full counts too, wherever it was filled. */
  check(): string[] {
    const before = this.unlocked.length;
    for (const a of ACHIEVEMENT_LIST) if (this.eligible(a) && a.counter && (this.p.counters[a.counter.key] || 0) >= a.counter.target) this.unlock(a.id);
    this.logs();
    return this.unlocked.slice(before);
  }

  /** Something new arrived in the collection: it may finish a collection log. */
  collected(id: string): string[] {
    const before = this.unlocked.length;
    for (const a of ACHIEVEMENT_LIST) if (!this.p.achievements[a.id] && a.collect === id) this.unlock(a.id);
    this.logs();
    return this.unlocked.slice(before);
  }

  /** every collection log that's full earns its achievement */
  private logs(): void {
    for (const a of ACHIEVEMENT_LIST) if (a.log && !this.p.achievements[a.id] && logDone(this.p, a.log)) this.unlock(a.id);
  }

  private unlock(id: string): void {
    const a = ACHIEVEMENTS[id];
    if (!a || this.p.achievements[id]) return;
    const at = this.now();
    this.p.achievements[id] = { at };
    this.unlocked.push(id);
    if (a.reward.title && !this.p.titles.includes(a.reward.title)) this.p.titles.push(a.reward.title);
    if (a.reward.collectible && !this.p.collection[a.reward.collectible]) {
      this.p.collection[a.reward.collectible] = { n: 1, kc: 0, at };
      if (COLLECTIBLES[a.reward.collectible]) autoPlace(this.p, a.reward.collectible);
    }
    for (const m of ACHIEVEMENT_LIST) if (m.needs && !this.p.achievements[m.id] && m.needs.every((n) => this.p.achievements[n])) this.unlock(m.id);
  }
}

/** Progress toward a counter achievement, a collection log or a meta achievement, for the log. */
export function progress(p: Profile, a: AchievementDef): { have: number; need: number } | null {
  if (a.counter) return { have: Math.min(p.counters[a.counter.key] || 0, a.counter.target), need: a.counter.target };
  if (a.log) return logProgress(p, a.log);
  if (a.needs) return { have: a.needs.filter((n) => p.achievements[n]).length, need: a.needs.length };
  return null;
}
export const points = (p: Profile): number => Object.keys(p.achievements).reduce((s, id) => s + (ACHIEVEMENTS[id]?.points || 0), 0);
export const maxPoints = (): number => ACHIEVEMENT_LIST.reduce((s, a) => s + a.points, 0);
