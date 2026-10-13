/**
 * The shapes of everything the game is made of. Content files fill these in; the engine and the
 * meta systems read them. Adding a dungeon, an item, a pet or an achievement means adding data
 * of these shapes, not changing a system.
 */
import type { RoleId, GameEvent, RunSummary } from '../core/events';
export type { RoleId, GameEvent, RunSummary };

export type Rar = 0 | 1 | 2 | 3; // Common, Uncommon, Rare, Epic (the cap)
export type SlotId = 'weapon' | 'helm' | 'shoulders' | 'chest';
export type AbilitySlot = 'a1' | 'a2' | 'a3' | 'a4';

export interface RoleDef {
  id: RoleId; name: string; title: string;
  hp: number; armor: number; speed: number; r: number; threat: number;
  color: string; sprite: string; blurb: string;
}

export interface AbilityDef {
  key: string; name: string; desc: string;
  cd: number; mana?: number; hold?: boolean; aim?: boolean; range?: number; cast?: number;
}

export interface RarityDef { key: string; name: string; score: number; color: string; ink: string }
export interface SlotDef { id: SlotId; weight: number }
export interface RoleSlotDef { name: string; icon: string }
export interface TraitDef { id: string; name: string; desc: string }

export type ItemKind = 'gear' | 'set' | 'unique';
export interface ItemDef {
  id: string;
  name: string;
  role: RoleId;
  slot: SlotId;
  kind: ItemKind;
  rar: Rar;
  icon: string;
  setId?: string;
  effect?: string;
  effectDesc?: string;
  dungeon?: string;
  flavor?: string;
}

export interface SetDef {
  id: string; name: string; role: RoleId; dungeon: string; look: string;
  pieces: string[];
  bonus2: { id: string; desc: string };
  bonus3: { id: string; desc: string; ready: boolean };
}

export type CollectibleKind = 'pet' | 'mount' | 'trophy' | 'banner' | 'cosmetic';
export interface CollectibleDef {
  id: string; kind: CollectibleKind; name: string; desc: string;
  icon: string;
  sprite?: string;      // how it is drawn in the hearth
  source: string;       // where it comes from, in plain words
}

export interface TitleDef { id: string; text: string }

/** One line of a drop table. `id` names an item or a collectible. */
export interface DropDef { id: string; rate: number; role?: RoleId }
export interface BossLootDef { boss: string; drops: DropDef[] }

export type Tier = 'bronze' | 'silver' | 'gold' | 'meta' | 'hidden';
export interface RewardDef { title?: string; collectible?: string; text: string }
export interface AchievementDef {
  id: string;
  dungeon: string;
  tier: Tier;
  name: string;
  how: string;
  points: number;
  reward: RewardDef;
  role?: RoleId;
  /** lifetime counter that completes it */
  counter?: { key: string; target: number };
  /** checked on every event during a run */
  live?: (e: GameEvent, ctx: { role: RoleId; practice: boolean; testGear: boolean }) => boolean;
  /** checked when a run is cleared */
  run?: (r: RunSummary) => boolean;
  /** other achievements it needs */
  needs?: string[];
}

export interface BossInfo { id: string; name: string; phases: number; enrage: number; room: number }

export interface DungeonInfo {
  id: string;
  name: string;
  blurb: string;
  bosses: BossInfo[];
  /** the last boss: its death ends the run */
  finalBoss: string;
  loot: BossLootDef[];
  marksName: string;
  /** every slot in this dungeon's collection log, in display order */
  collection: string[];
  achievements: string[];
}
