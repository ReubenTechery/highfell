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
/** whose four buttons: a class's (the gear key, and the ranger's own; the duo rework, docs/duo-agents.md) */
export type AbKey = GearKey | 'ranger';

export interface RoleDef {
  id: RoleId; name: string; title: string;
  hp: number; armor: number; speed: number; r: number; threat: number;
  color: string; blurb: string;
}

export interface AbilityDef {
  key: string; name: string; desc: string;
  cd: number; mana?: number; hold?: boolean; aim?: boolean; range?: number; cast?: number;
  /** never waits for the beat and never starts it: Charge and Shadowstep (they move you) */
  offBeat?: boolean;
  /** the class's filler: no cooldown, pressed every beat (Cleave, Smite, Icicle, Viper Blades) */
  filler?: boolean;
  /** a filler's hit before Power and gear (the armoury card shows it before and after a piece), or Comet's */
  hit?: number;
  combo?: string;
}

/* ---------------------------------------------------------------- talents: two specs a class, a tree each */
/** a stat a talent point adds to (TALENT_STATS in talents/ says how much a point) */
export type TalentStat = 'dmg' | 'heal' | 'hp' | 'crit' | 'haste' | 'armor' | 'threat';
/** A talent in a spec's tree. A stat talent takes several points, each adding to its stat; the rest take one and
 *  change how a button works. A row opens once enough points are in the rows above it (ROW_NEED). */
export interface TalentDef {
  id: string;
  name: string;
  /** what it does, in one plain sentence (a stat talent's is written from its stat) */
  desc: string;
  icon: string;
  /** 1 (the top) to 5 (the capstone's row) */
  row: number;
  ranks: number;
  stat?: TalentStat;
  /** one of a pair in its row: you can have only one of the two (they share this) */
  choice?: string;
  /** the button it changes, for the Abilities tab */
  slot?: AbilitySlot | 'mend';
  /** the spec's biggest talent, at the bottom */
  capstone?: boolean;
}
/** A button a spec changes: its new name, picture and what it does (Fire's four). The engine still knows it by
 *  its slot, so gear that makes a button better makes this one better. */
export interface SpecButton { name: string; icon: string; desc: string; combo?: string }
/** One of a class's two specs: its own tree, and what picking it changes before any points are in. */
export interface SpecDef {
  id: string;
  cls: 'warrior' | 'cleric' | 'mage' | 'rogue';
  name: string;
  /** one line: what it plays like */
  pitch: string;
  icon: string;
  color: string;
  /** what picking it changes on its own, if anything (Fire turns the four buttons to fire) */
  base?: string;
  buttons?: Partial<Record<AbilitySlot, SpecButton>>;
  talents: TalentDef[];
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
  /** a heroic log's prize that draws a whole race in gold, switched on or off like any look (Gilded Bones: 'risen') */
  gilds?: string;
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
  /** the same, short enough for the Dungeons sheet's brew button on a phone */
  short: string;
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
  /** where it's earned: a dungeon id (its Heroic counts too), or 'garden' */
  dungeon: string;
  tier: Tier;
  name: string;
  /** what to do, in one plain, exact sentence: the page, the toast and the titles list all show it */
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
  /** a clear faster than this many seconds earns it (the page shows your best clear against it) */
  clearUnder?: number;
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

/** A season: about three months, with its own dungeons (docs/ideas.md). `name` is what the game shows. */
export interface SeasonDef { id: number; name: string }

export interface DungeonInfo {
  id: string;
  name: string;
  blurb: string;
  /** the season it came in (its name is in SEASONS): the first three dungeons are Season 0 */
  season: number;
  /** Which of its season's dungeons it is (1 = Barrow, 2 = Thimblebriar, 3 = Moonmere): a later one is harder and
   *  pays more XP. Its gear has the same Power as the season's others. */
  tier?: 1 | 2 | 3;
  /** The Power it recommends coming in with (party.ts underPowered: Power and level together). */
  recIlvl?: number;
  /** The level it recommends coming in at (1 when left out). */
  recLevel?: number;
  /** The most Power this dungeon's drops have: its boss weapons' (its set pieces are 4 less). */
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
  /** its door, as the Dungeons sheet draws it with your party in front (a heroic dungeon uses its normal one's) */
  stage?: DungeonStage;
  /** its door in the house's cellar, the Hall of Doors: a sprite drawn in four states, this name for plain and with
   *  `_lit`, `_gold` and `_gilded` on the end (tools/art_doors.py; a heroic dungeon uses its normal one's) */
  houseDoor?: string;
  /** the chest's headline after a clear (the Barrow's: "The Gravekeeper is buried") */
  clearTitle?: string;
}

/** A sprite on a dungeon's stage, placed by its ground point; k scales it and flip mirrors it. */
export interface StagePiece { sprite: string; x: number; y: number; k?: number; flip?: boolean }

/** A dungeon's door, as the Dungeons sheet draws it: its final boss in the doorway and your three heroes
 *  standing in front, ready to go in. The world is the dungeon banner's (640 wide, y going down, the floor
 *  near 256); `view` is the part of it the picture shows. Heroic turns the light gold. */
export interface DungeonStage {
  /** the part of the world the picture shows: x, y, width and height */
  view: [number, number, number, number];
  /** the dark behind everything */
  bg: string;
  /** the glow in the doorway: its colour, its middle and how far it reaches */
  light: { color: string; x: number; y: number; r: number };
  /** where the floor starts, and its colour */
  floor: { y: number; color: string };
  /** the door and what stands behind the boss, back to front */
  back: StagePiece[];
  /** the final boss, in the doorway: use the sprite its mob is drawn with (`sp` in mobs.js) */
  boss: StagePiece;
  /** what stands in front of the boss but behind the heroes */
  front: StagePiece[];
  /** where your three heroes stand (tank, healer, DPS, left to right), on one ground line, and how big */
  heroes: { x: [number, number, number]; y: number; k: number };
}
