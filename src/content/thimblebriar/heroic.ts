/**
 * Heroic Thimblebriar Hollow, by the kit rule (`makeHeroicDungeon`): the same burrow, harder (its tune is in
 * engine.ts) and made for Thimblebriar's own epics. A Heroic kill rolls the Hollow's own tables first, then the
 * Tinker King rolls a gilding kit for each of the sixteen uniques (any seat, 1 in 20 each), and the gilded
 * twins of the cap, the beetle and the pet. Its log is the kits; the twins are a bonus. Filling it gives the
 * Gilded Toadstool Workshop, the Arch-Tinker and Gilded Gnomes (your Gnomes in gold). No Heroic-only puzzle.
 */
import type { CollectibleDef } from '../types';
import { gilded } from '../kits';
import { makeHeroicDungeon } from '../_template/heroic';
import { THIMBLEBRIAR } from './index';
import { THIMBLEBRIAR_ITEMS } from './items';
import { THIMBLEBRIAR_LOOT } from './loot';

const TWINS: CollectibleDef[] = [
  { id: gilded('pet.pint_tinker'), kind: 'pet', name: 'Pint-sized Gilded Tinker King', desc: 'A solid gold suit, and he knows it.', icon: 'c_pet_tinker_gilded', sprite: 'pet_tinker_gilded', source: 'Heroic: the Tinker King, 1 in 2,500' },
  { id: gilded('mount.clockwork_beetle'), kind: 'mount', name: 'Gilded Clockwork Beetle', desc: 'Gold shell, gold key, the same happy ticking.', icon: 'c_mount_beetle_gilded', sprite: 'mount_beetle_gilded', source: 'Heroic: the Tinker King, 1 in 1,000', saddle: { x: -2, y: -96, k: 0.9 } },
  { id: gilded('trophy.toadstool_cap'), kind: 'trophy', name: 'Toadstool’s Gilded Cap', desc: 'Gold spots on gold. Old Toadstool would be thrilled.', icon: 'c_cap_gilded', sprite: 'tr_cap_gilded', source: 'Heroic: Old Toadstool, 1 in 50' },
];

const BUNDLE = makeHeroicDungeon({
  base: THIMBLEBRIAR,
  items: THIMBLEBRIAR_ITEMS,
  loot: THIMBLEBRIAR_LOOT,
  collectibles: TWINS,
  logAchievement: {
    id: 'thimblebriar-heroic.log',
    name: 'Gilded Gears',
    how: 'Fill every slot of Heroic Thimblebriar Hollow’s collection log: a gilding kit for every piece (the pet, mount and cap are a bonus).',
    look: 'workshop-gilded',
    titleId: 'title.archtinker',
    titleText: 'the Arch-Tinker',
    // the big prize: the Hollow's own race in gold, as Gilded Bones is for the Barrow's Risen
    collectible: { id: 'cosmetic.gilded_gnomes', kind: 'cosmetic', name: 'Gilded Gnomes', desc: 'Your Gnome heroes turn to gold.', icon: 'c_gilded_gnomes', source: 'Achievement: Gilded Gears', gilds: 'gnome' },
    rewardText: 'Gilded Toadstool Workshop for your house, the title the Arch-Tinker, and gold for your Gnomes',
  },
});

export const THIMBLEBRIAR_HEROIC = {
  ...BUNDLE.dungeon,
  blurb: 'The same burrow with the gloves off: everything hits harder and lasts longer. Made for Thimblebriar’s own epics.',
  // the same seed as the normal burrow, more often
  seeds: [{ boss: 'tinker', seed: 'bramble', rate: 1 / 3 }],
  marksName: THIMBLEBRIAR.marksName,
};
export const THIMBLEBRIAR_KITS = BUNDLE.kits;
export const THIMBLEBRIAR_HEROIC_COLLECTIBLES = BUNDLE.collectibles;
export const THIMBLEBRIAR_HEROIC_TITLES = BUNDLE.titles;
export const THIMBLEBRIAR_HEROIC_ACHIEVEMENTS = BUNDLE.achievements;
