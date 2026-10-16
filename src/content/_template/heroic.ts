/**
 * Dungeon Template: Reusable Heroic Generator (`makeHeroicDungeon`).
 * Automatically creates the gilded items, gilded loot tables, gilded log achievement,
 * and Heroic `DungeonInfo` for any dungeon so we never duplicate heroic boilerplate.
 */
import type { AchievementDef, BossLootDef, CollectibleDef, DungeonInfo, ItemDef, TitleDef } from '../types';
import { TEMPLATE_DUNGEON } from './index';
import { TEMPLATE_ITEMS } from './items';
import { TEMPLATE_LOOT } from './loot';

export const gildedId = (id: string): string => `${id}.gilded`;

export interface HeroicBuilderConfig {
  base: DungeonInfo;
  items: ItemDef[];
  loot: BossLootDef[];
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
  items: ItemDef[];
  collectibles: CollectibleDef[];
  titles: TitleDef[];
  achievements: AchievementDef[];
} {
  const heroicId = `${cfg.base.id}-heroic`;
  const items: ItemDef[] = cfg.items.map((d) => ({
    ...d,
    id: gildedId(d.id),
    icon: `${d.icon}_gilded`,
    name: d.name.startsWith('The ') ? `The Gilded ${d.name.slice(4)}` : `Gilded ${d.name}`,
  }));
  const loot: BossLootDef[] = cfg.loot.map((t) => ({
    boss: t.boss,
    drops: t.drops.map((d) => ({ ...d, id: gildedId(d.id) })),
  }));
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
    bosses: cfg.base.bosses,
    finalBoss: cfg.base.finalBoss,
    loot,
    marksName: 'Warband Marks',
    collection: cfg.base.collection.map(gildedId),
    achievements: achievements.map((a) => a.id),
    heroicOf: cfg.base.id,
  };
  return { dungeon, items, collectibles, titles, achievements };
}

export const TEMPLATE_HEROIC_BUNDLE = makeHeroicDungeon({
  base: TEMPLATE_DUNGEON,
  items: TEMPLATE_ITEMS,
  loot: TEMPLATE_LOOT,
  collectibles: [
    { id: gildedId('pet.pint_sovereign'), kind: 'pet', name: 'Pint-sized Gilded Sovereign', desc: 'Solid gold brasswork and cap.', icon: 'c_pet_keeper_gilded', sprite: 'pet_keeper_gilded', source: 'Heroic: The Sovereign, 1 in 5,000' },
    { id: gildedId('mount.clockwork_beetle'), kind: 'mount', name: 'Gilded Clockwork Beetle', desc: 'Polished gold plating and sapphire gears.', icon: 'c_mount_hound_gilded', sprite: 'mount_hound_gilded', source: 'Heroic: The Sovereign, 1 in 1,000', saddle: { x: -4, y: -94, k: 0.9 } },
    { id: gildedId('dye.sporeglow'), kind: 'cosmetic', name: 'Gilded Sporeglow Dye', desc: 'Turns your dungeon set to gleaming gold.', icon: 'c_dye_gilded', source: 'Heroic: The Sovereign, 1 in 1,000' },
    { id: gildedId('trophy.warden_crest'), kind: 'trophy', name: 'Warden’s Gilded Crest', desc: 'Gleaming gold brasswork for the mantel.', icon: 'c_plume_gilded', sprite: 'tr_plume_gilded', source: 'Heroic: Mini-Boss Warden, 1 in 50' },
  ],
  logAchievement: {
    id: 'template-heroic.log',
    name: 'Gilded Clockwork',
    how: 'Fill every slot of Heroic Template Sanctum’s collection log.',
    look: 'barrow-gilded',
    titleId: 'title.archtinker',
    titleText: 'the Arch-Tinker',
    rewardText: 'Gilded look for your house and the title the Arch-Tinker',
  },
});

export const TEMPLATE_HEROIC = TEMPLATE_HEROIC_BUNDLE.dungeon;

