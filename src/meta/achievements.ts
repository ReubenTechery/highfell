/**
 * Achievements. Listens to what happens in a run, keeps the lifetime counters, unlocks achievements
 * the moment they are earned and hands out their rewards. Content decides what counts; this file
 * only applies the rules, and says plainly what each one gave and where it went, and where every
 * title comes from.
 */
import type { AchievementDef, CollectibleKind, GameEvent, RoleId, RunSummary } from '../content/types';
import { ACHIEVEMENTS, ACHIEVEMENT_LIST, COLLECTIBLES, DUNGEONS, TITLES, heroicVersion, titleSource } from '../content';
import { LOOKS } from '../content/house';
import { RACES, type RaceId } from '../content/folk';
import { GARDEN_PLACE } from '../content/vale/garden';
import { LEVEL_PLACE } from '../content/levels';
import { autoPlace, lookOpen, spotById, spotOf } from './hearth';
import { logDone, logProgress } from './logs';
import { count, type Hero, type Profile } from './profile';

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
      case 'mob.killed': count(p, 'kills'); if (e.undead) count(p, k(d, 'skeletons')); if (e.boss) count(p, k(d, 'bosses')); if (e.tally) count(p, k(d, e.tally)); break;
      case 'bomb.knocked': if (e.player) count(p, k(d, 'bombs')); break;
      case 'bomb.batted': if (e.player) count(p, k(d, 'batted')); break;
      case 'curse.lifted': if (e.player && e.kind === 'sticky') count(p, k(d, 'stickies')); break;
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
    if (!r.practice && !r.testGear) for (const a of ACHIEVEMENT_LIST) if (this.eligible(a) && ((a.run && a.run(r)) || (a.clearUnder !== undefined && r.time < a.clearUnder))) this.unlock(a.id);
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
    const at = this.now(), kc = killCount(this.p, a);
    this.p.achievements[id] = kc === null ? { at } : { at, kc };
    this.unlocked.push(id);
    if (a.reward.title && !this.p.titles.includes(a.reward.title)) this.p.titles.push(a.reward.title);
    if (a.reward.collectible && !this.p.collection[a.reward.collectible]) {
      this.p.collection[a.reward.collectible] = { n: 1, kc: 0, at };
      if (COLLECTIBLES[a.reward.collectible]) autoPlace(this.p, a.reward.collectible);
    }
    for (const m of ACHIEVEMENT_LIST) if (m.needs && !this.p.achievements[m.id] && m.needs.every((n) => this.p.achievements[n])) this.unlock(m.id);
  }
}

/** The achievements of home: the garden and the cauldron are one place, so brewing and harvesting both count for
 *  the garden's achievements the moment they're earned. */
export const homeAchiever = (p: Profile, role: RoleId): Achiever => new Achiever(p, { dungeon: GARDEN_PLACE.id, role, practice: false, testGear: false });
/** The achievements of your level: checked whenever XP comes in (meta/xp.ts keeps your best level in a counter). */
export const levelAchiever = (p: Profile, role: RoleId): Achiever => new Achiever(p, { dungeon: LEVEL_PLACE.id, role, practice: false, testGear: false });

/** Progress toward a counter achievement, a collection log or a meta achievement, for the log. */
export function progress(p: Profile, a: AchievementDef): { have: number; need: number } | null {
  if (a.counter) return { have: Math.min(p.counters[a.counter.key] || 0, a.counter.target), need: a.counter.target };
  if (a.log) return logProgress(p, a.log);
  if (a.needs) return { have: a.needs.filter((n) => p.achievements[n]).length, need: a.needs.length };
  return null;
}
export const points = (p: Profile): number => Object.keys(p.achievements).reduce((s, id) => s + (ACHIEVEMENTS[id]?.points || 0), 0);
export const maxPoints = (): number => ACHIEVEMENT_LIST.reduce((s, a) => s + a.points, 0);

/** The kill count of an achievement's dungeon right now (its last boss's), kept with it when it's earned. The
 *  garden's have none. */
export function killCount(p: Profile, a: AchievementDef): number | null {
  const dg = DUNGEONS[a.dungeon];
  return dg ? p.bosses[`${dg.id}.${dg.finalBoss}`]?.kc || 0 : null;
}

/** Your best clear against a clear-under-a-time achievement's mark: the dungeon's or its Heroic's, which counts
 *  too. Null for the others; `best` is null before your first clear. */
export function bestClear(p: Profile, a: AchievementDef): { best: number | null; need: number } | null {
  if (a.clearUnder === undefined) return null;
  const times = [a.dungeon, heroicVersion(a.dungeon)?.id].map((d) => (d ? p.dungeons[d]?.pb : null)).filter((t): t is number => typeof t === 'number');
  return { best: times.length ? Math.min(...times) : null, need: a.clearUnder };
}

/** One thing an achievement gives: what it is, its name, and where it went (or goes, before you have it). */
export type RewardKind = CollectibleKind | 'title' | 'look' | 'race' | 'points';
export interface RewardLine { kind: RewardKind; id: string; name: string; where: string }

/** Everything an achievement gives, each named with where it went: the big one first, then the house look, the
 *  title, a pet or a trophy, and the points last. */
export function rewardsOf(p: Profile, a: AchievementDef): RewardLine[] {
  const r = a.reward, out: RewardLine[] = [];
  const race = r.race ? RACES[r.race as RaceId] : undefined;
  if (race) out.push({ kind: 'race', id: race.id, name: `The ${race.plural}`, where: 'A new kind of hero: make one in the bunk room' });
  const look = r.look ? LOOKS.find((l) => l.id === r.look) : undefined;
  if (look) out.push({ kind: 'look', id: look.id, name: look.name, where: `A look for your house${lookOpen(p, look.id) ? ': put it up in Decorate' : ''}` });
  const title = r.title ? TITLES[r.title] : undefined;
  if (title) out.push({ kind: 'title', id: title.id, name: title.text, where: 'Any hero of yours can wear it' });
  const c = r.collectible ? COLLECTIBLES[r.collectible] : undefined;
  if (c) out.push({ kind: c.kind, id: c.id, name: c.name, where: whereIs(p, c.id) });
  out.push({ kind: 'points', id: a.id, name: `${a.points} points`, where: '' });
  return out;
}

/** where a pet, mount, trophy, banner or look is: on show in the house (which spot), in the paddock, on or off in
 *  Looks; before it's yours, where it will go */
function whereIs(p: Profile, id: string): string {
  const c = COLLECTIBLES[id], own = !!p.collection[id];
  if (c.kind === 'mount') return own ? 'In your paddock' : 'Goes in your paddock';
  if (c.kind === 'cosmetic') return own ? (p.settings.looksOff.includes(id) ? 'Off: switch it on in a hero’s Looks' : 'On: switch it in a hero’s Looks') : 'Goes in your heroes’ Looks';
  const spot = own ? spotOf(p, id) : null, label = spot ? spotById(spot)?.label.toLowerCase() : '';
  if (label) return c.kind === 'pet' ? `At home: ${label}` : `In your house: ${label}`;
  if (own) return 'Yours: put it out in Decorate';
  return c.kind === 'pet' ? 'Follows you home' : 'Goes on show in your house';
}

/** Where an achievement belongs on the page: its dungeon (a Heroic one's goes with its normal dungeon), or the garden. */
export const placeOf = (a: AchievementDef): string => DUNGEONS[a.dungeon]?.heroicOf || a.dungeon;

/** Puts a title you've earned on a hero, or takes theirs off (null). False for one you haven't earned. */
export function wearTitle(p: Profile, h: Hero, id: string | null): boolean {
  if (id !== null && !p.titles.includes(id)) return false;
  h.title = id;
  return true;
}

/** A title in the list of every title: where it comes from, whether it's yours, and whether how to earn it is
 *  still a secret (a hidden achievement you haven't earned). */
export interface TitleRow { id: string; text: string; from: AchievementDef; have: boolean; secret: boolean }

/** Every title, in the order their achievements come: the ones you have, then the rest. A title from a retired
 *  achievement shows only if it's yours. */
export function titleRows(p: Profile): TitleRow[] {
  const rows: TitleRow[] = [];
  for (const t of Object.values(TITLES)) {
    const from = titleSource(t.id), have = p.titles.includes(t.id);
    if (!from || (from.retired && !have)) continue;
    rows.push({ id: t.id, text: t.text, from, have, secret: from.tier === 'hidden' && !p.achievements[from.id] });
  }
  const at = (r: TitleRow): number => ACHIEVEMENT_LIST.indexOf(r.from);
  return rows.sort((a, b) => +b.have - +a.have || at(a) - at(b));
}
