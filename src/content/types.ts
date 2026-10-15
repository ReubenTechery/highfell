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
  combo?: string;
}

export interface TalentRankDef { name: string; desc: string }

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
  /** mounts: where the rider sits on the sprite, and how big the rider is drawn */
  saddle?: { x: number; y: number; k: number };
  /** mounts: seconds a ride out takes on it (walking takes FOOT_SECS) */
  ride?: number;
}

/* ---------------------------------------------------------------- the Vale: riding out, gathering, brewing */
export type ToyId = 'snip' | 'pluck';
/** Something you gather and keep in your satchel. */
export interface IngredientDef { id: string; name: string; icon: string; desc: string; rare?: boolean }
/** A gathering spot inside a place: you play its close-up to harvest it. */
export interface NodeDef {
  id: string;
  name: string;
  /** the button word: Snip, Pluck */
  verb: string;
  toy: ToyId;
  /** how the close-up draws it */
  look: 'flower' | 'sprig' | 'cap';
  gives: string;
  /** base yield per harvest, before Perfects */
  yield: [number, number];
  /** rare drops, each line rolled on its own every harvest */
  table: DropDef[];
}
/** A small job from a villager. find: spot something hidden; shoo: tap them all; deliver: hand over ingredients. */
export interface ErrandDef {
  id: string;
  /** find something hidden, shoo things away, herd things into a pen, or hand over ingredients */
  kind: 'find' | 'shoo' | 'herd' | 'deliver';
  title: string;
  ask: string;
  thanks: string;
  /** find: what is hidden; shoo and herd: what to tap */
  thing?: 'kettle' | 'goggles' | 'crow' | 'spark' | 'goat';
  target?: number;
  needs?: Record<string, number>;
  /** given the first time this errand is done (a mount, a pet): a thank-you, not a roll */
  gives?: string;
}
export interface LorePage { id: string; title: string; text: string }
/** A place you can ride out to. */
export interface PlaceDef {
  id: string;
  name: string;
  /** the folk who live there */
  race: string;
  blurb: string;
  villager: { name: string; title: string };
  nodes: NodeDef[];
  errands: ErrandDef[];
  /** rolled once per errand done */
  errandTable: DropDef[];
  lore: LorePage[];
}
/** A brew: made at the cauldron, drunk before a dungeon run. One bottle is one run. */
export interface RecipeDef {
  id: string;
  name: string;
  icon: string;
  /** the colour it turns in the cauldron */
  color: string;
  needs: Record<string, number>;
  makes: number;
  /** the Brewing rank it unlocks at */
  rank: number;
  /** what it does on a run */
  desc: string;
}

export interface TitleDef { id: string; text: string }

/** One line of a drop table. `id` names an item or a collectible. */
export interface DropDef { id: string; rate: number; role?: RoleId }
export interface BossLootDef { boss: string; drops: DropDef[] }

export type Tier = 'bronze' | 'silver' | 'gold' | 'meta' | 'hidden' | 'log';
/** What an achievement gives. A look (a house look id) or a race (a folk id) it gives is locked until it's earned. */
export interface RewardDef { title?: string; collectible?: string; look?: string; race?: string; text: string }
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
  /** completes when this collectible is obtained */
  collect?: string;
  /** completes when every slot of this dungeon's collection log is filled */
  log?: string;
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
  /** a heroic dungeon: the normal one it is the harder version of. It pays that one's Marks and counts for its achievements. */
  heroicOf?: string;
}
