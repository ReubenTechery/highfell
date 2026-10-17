/**
 * The event bus. The dungeon engine reports what happens; achievements, logs, toasts and sound
 * listen. The engine never knows who is listening, so new systems hook in without touching combat.
 */
export type RoleId = 'tank' | 'healer' | 'dps';

export interface RunSummary {
  dungeon: string;
  role: RoleId;
  practice: boolean;        // started at a boss instead of the entrance
  testGear: boolean;        // played in borrowed test gear
  time: number;             // seconds, entrance to the last boss's death
  deaths: number;           // party deaths over the whole run
  wipes: number;
  handHits: number;         // party hits from the Gravekeeper's hands
  ringHits: number;         // party hits from burrow rings
  saves: number;            // allies the player healed from under 15%
  bombHits: number;         // party hits from bombs going off (Thimblebriar)
  lifts: number;            // curses and Sticky Bombs the healer lifted
  bursts: number;           // curses and Sticky Bombs that went off
  playerDeaths: number;
  kicks: number;
  perfectBlocks: number;    // by the player
}

export type GameEvent =
  | { type: 'run.start'; dungeon: string; role: RoleId; practice: boolean; solo: boolean }
  | { type: 'mob.killed'; mob: string; boss: boolean; undead: boolean; byPlayer: boolean; tally?: string; x?: number; y?: number; xp?: number }
  | { type: 'boss.pulled'; boss: string }
  | { type: 'boss.killed'; boss: string; time: number; armorUp: boolean; onlyPlayerAlive: boolean; smashes: number; smashPerfect: number; playerIsTank: boolean; x?: number; y?: number; bombed?: number }
  | { type: 'hero.died'; role: RoleId; player: boolean }
  | { type: 'hero.raised'; role: RoleId; player: boolean }
  | { type: 'block'; perfect: boolean; player: boolean; smash: boolean }
  | { type: 'dodge'; player: boolean }
  | { type: 'crit'; amount: number; player: boolean }
  | { type: 'combo'; kind: string; player: boolean }
  | { type: 'wisp.sliced'; player: boolean }
  | { type: 'chain.cut'; player: boolean }
  | { type: 'cage.broken'; player: boolean; self: boolean; secs: number }
  | { type: 'heal.save'; player: boolean }
  | { type: 'curse.cast'; player: boolean; name: string; kind?: string }
  | { type: 'curse.lifted'; player: boolean; kind?: string }
  | { type: 'curse.burst'; player: boolean; kind?: string }
  | { type: 'bomb.knocked'; player: boolean }
  | { type: 'bomb.batted'; player: boolean }
  | { type: 'bomb.chain'; player: boolean }
  | { type: 'hazard.hit'; kind: string; player: boolean }
  | { type: 'run.wipe'; dungeon: string }
  | { type: 'run.lost'; dungeon: string; packsCleared: number }
  | { type: 'run.cleared'; summary: RunSummary };

export type EventType = GameEvent['type'];
export type EventOf<T extends EventType> = Extract<GameEvent, { type: T }>;
type Listener = (e: GameEvent) => void;

const listeners = new Set<Listener>();

export const bus = {
  on(fn: Listener): () => void { listeners.add(fn); return () => listeners.delete(fn); },
  emit(e: GameEvent): void { for (const fn of [...listeners]) { try { fn(e); } catch (err) { console.error('event listener failed', e.type, err); } } },
  clear(): void { listeners.clear(); },
};
