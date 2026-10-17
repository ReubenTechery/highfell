/**
 * Dungeon Template: Reusable Heroic Generator (`makeHeroicDungeon`).
 * From a dungeon's own items, tables and log it builds its Heroic, so every new dungeon gets the same shape
 * for free: a Heroic kill rolls the dungeon's normal tables first (normal pieces, for the normal log), then
 * the Heroic's own tables built here: a gilding kit for each unique (any seat, `KIT_RATE`) and the gilded
 * twins of its trophy, mount and pet. Its log is the kits, with the twins as bonus slots, and finishing it
 * earns its log achievement. Register the kits in `src/content/index.ts` with the rest.
 */
import type { AchievementDef, BossLootDef, CollectibleDef, DungeonInfo, ItemDef, KitDef, TitleDef } from '../types';
import { gilded, kitLog, kitTables, kitsOf } from '../kits';
import { TEMPLATE_DUNGEON } from './index';
import { TEMPLATE_ITEMS } from './items';
import { TEMPLATE_LOOT } from './loot';

export interface HeroicBuilderConfig {
  base: DungeonInfo;
  items: ItemDef[];
  loot: BossLootDef[];
  /** the gilded twins of the dungeon's trophy, mount and pet (`gilded(id)` of each): Heroic's bonus slots */
  collectibles: CollectibleDef[];
  logAchievement: {
    id: string;
    name: string;
    how: string;
    look?: string;
    titleId: string;
    titleText: string;
    collectible?: CollectibleDef;
    rewardText: string;
  };
}

export function makeHeroicDungeon(cfg: HeroicBuilderConfig): {
  dungeon: DungeonInfo;
  kits: KitDef[];
  collectibles: CollectibleDef[];
  titles: TitleDef[];
  achievements: AchievementDef[];
} {
  const heroicId = `${cfg.base.id}-heroic`;
  const kits = kitsOf(cfg.items);
  const log = kitLog(cfg.base.collection, kits, cfg.collectibles);
  const collectibles: CollectibleDef[] = [
    ...cfg.collectibles,
    ...(cfg.logAchievement.collectible ? [cfg.logAchievement.collectible] : []),
  ];
  const titles: TitleDef[] = [{ id: cfg.logAchievement.titleId, text: cfg.logAchievement.titleText }];
  const achievements: AchievementDef[] = [
    {
      id: cfg.logAchievement.id,
      dungeon: heroicId,
      tier: 'log',
      points: 500,
      name: cfg.logAchievement.name,
      how: cfg.logAchievement.how,
      reward: {
        ...(cfg.logAchievement.look ? { look: cfg.logAchievement.look } : {}),
        title: cfg.logAchievement.titleId,
        ...(cfg.logAchievement.collectible ? { collectible: cfg.logAchievement.collectible.id } : {}),
        text: cfg.logAchievement.rewardText,
      },
      log: heroicId,
    },
  ];
  const dungeon: DungeonInfo = {
    id: heroicId,
    name: `Heroic ${cfg.base.name}`,
    blurb: `The same dungeon with the gloves off: everything hits harder and lasts longer. Made for full Epic.`,
    season: cfg.base.season,
    bosses: cfg.base.bosses,
    finalBoss: cfg.base.finalBoss,
    loot: kitTables(cfg.loot, kits, cfg.collectibles),
    marksName: 'Warband Marks',
    collection: log.collection,
    bonus: log.bonus,
    achievements: achievements.map((a) => a.id),
    heroicOf: cfg.base.id,
  };
  return { dungeon, kits, collectibles, titles, achievements };
}

export const TEMPLATE_HEROIC_BUNDLE = makeHeroicDungeon({
  base: TEMPLATE_DUNGEON,
  items: TEMPLATE_ITEMS,
  loot: TEMPLATE_LOOT,
  collectibles: [
    { id: gilded('pet.pint_sovereign'), kind: 'pet', name: 'Pint-sized Gilded Sovereign', desc: 'Solid gold brasswork and cap.', icon: 'c_pet_keeper_gilded', sprite: 'pet_keeper_gilded', source: 'Heroic: The Sovereign, 1 in 2,500' },
    { id: gilded('mount.clockwork_beetle'), kind: 'mount', name: 'Gilded Clockwork Beetle', desc: 'Polished gold plating and sapphire gears.', icon: 'c_mount_hound_gilded', sprite: 'mount_hound_gilded', source: 'Heroic: The Sovereign, 1 in 1,000', saddle: { x: -4, y: -94, k: 0.9 } },
    { id: gilded('trophy.warden_crest'), kind: 'trophy', name: 'Warden’s Gilded Crest', desc: 'Gleaming gold brasswork for the mantel.', icon: 'c_plume_gilded', sprite: 'tr_plume_gilded', source: 'Heroic: Mini-Boss Warden, 1 in 50' },
  ],
  logAchievement: {
    id: 'template-heroic.log',
    name: 'Gilded Clockwork',
    how: 'Fill every slot of Heroic Template Sanctum’s collection log: a gilding kit for every piece (the pet, mount and crest are a bonus).',
    look: 'barrow-gilded',
    titleId: 'title.archtinker',
    titleText: 'the Arch-Tinker',
    rewardText: 'Gilded look for your house and the title the Arch-Tinker',
  },
});

export const TEMPLATE_HEROIC = TEMPLATE_HEROIC_BUNDLE.dungeon;
