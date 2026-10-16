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
export type GearKey = RoleId | 'rogue';

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

export interface RarityDef { key: string; name: string; score: number; color: string; ink: string }
export interface SlotDef { id: SlotId; weight: number }
export interface RoleSlotDef { name: string; icon: string }
export interface TraitDef { id: string; name: string; desc: string }

export type ItemKind = 'gear' | 'set' | 'unique';
export interface ItemDef {
  id: string;
  name: string;
  role: RoleId;
  cls?: 'warrior' | 'cleric' | 'mage' | 'rogue';
  slot: SlotId;
  kind: ItemKind;
  rar: Rar;
  /** Stepped Act 1 dungeon tier (1 = ilvl 26, 2 = ilvl 34, 3 = ilvl 42). Defaults to 1. */
  tier?: 1 | 2 | 3;
  icon: string;
  setId?: string;
  effect?: string;
  effectDesc?: string;
  dungeon?: string;
  flavor?: string;
}

export interface SetDef {
  id: string; name: string; role: RoleId; cls?: 'warrior' | 'cleric' | 'mage' | 'rogue'; dungeon: string; look: string;
  tier?: 1 | 2 | 3;
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
  /** doesn't drop any more: kept, and still works, for whoever has it; hidden from everyone else */
  retired?: boolean;
}

/** A gilding kit, Heroic's own drop: the gilded look of one unique (a set piece or a boss weapon), for good
 *  and for every hero. It isn't gear and never changes power. Its id is the piece's with `.gilded` on the end. */
export interface KitDef {
  id: string;
  /** the piece it gilds */
  item: string;
  name: string;
  icon: string;
}

/* ---------------------------------------------------------------- the garden: seeds, harvests, brewing */
export type ToyId = 'snip' | 'pluck';
/** Something you gather and keep in your satchel. */
export interface IngredientDef { id: string; name: string; icon: string; desc: string; rare?: boolean }
/** What a seed grows into in a garden bed: you play its close-up to harvest it. */
export interface NodeDef {
  id: string;
  name: string;
  /** the seed's name */
  seed: string;
  /** the button word: Snip, Pluck */
  verb: string;
  toy: ToyId;
  /** how the close-up draws it */
  look: 'flower' | 'sprig' | 'cap';
  gives: string;
  /** base yield per harvest, before Perfects */
  yield: [number, number];
}
export interface LorePage { id: string; title: string; text: string }
/** A seed line on a boss: rolled on its own for each player at every kill, like any drop. */
export interface SeedDrop { boss: string; seed: string; rate: number }
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
export interface DropDef { id: string; rate: number; role?: RoleId; cls?: 'warrior' | 'cleric' | 'mage' | 'rogue' }
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
  /** can't be earned any more: kept for whoever has it, hidden from everyone else */
  retired?: boolean;
}

export interface BossInfo { id: string; name: string; phases: number; enrage: number; room: number }

export interface DungeonInfo {
  id: string;
  name: string;
  blurb: string;
  /** Stepped progression tier (1 = Barrow, 2 = Thimblebriar, 3 = Moonmere). */
  tier?: 1 | 2 | 3;
  /** Recommended entry item level for this dungeon. */
  recIlvl?: number;
  /** Item level of this dungeon's Epic set pieces and boss weapons. */
  dropsIlvl?: number;
  bosses: BossInfo[];
  /** the last boss: its death ends the run */
  finalBoss: string;
  loot: BossLootDef[];
  /** the seeds its bosses drop for the garden (kept apart from the loot: seeds aren't collection log slots) */
  seeds?: SeedDrop[];
  marksName: string;
  /** every slot in this dungeon's collection log, in display order */
  collection: string[];
  /** bonus slots: shown in the log, never needed to finish it (the pet, the pure flex) */
  bonus?: string[];
  achievements: string[];
  /** a heroic dungeon: the normal one it is the harder version of. Its kills roll that one's tables first (and
   *  count on its kill counts), then its own: the gilding kits. It pays that one's Marks and counts for its achievements. */
  heroicOf?: string;
}
