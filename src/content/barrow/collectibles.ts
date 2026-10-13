/** Barrow Crypt's pets, mounts, trophies, banners, cosmetics and titles. */
import type { CollectibleDef, TitleDef } from '../types';

export const BARROW_COLLECTIBLES: CollectibleDef[] = [
  { id: 'pet.pint_gravekeeper', kind: 'pet', name: 'Pint-sized Gravekeeper', desc: 'Shovel, lantern, attitude. Follows you everywhere.', icon: 'c_pet_keeper', sprite: 'pet_keeper', source: 'The Gravekeeper, 1 in 5,000' },
  { id: 'pet.lantern_ghost', kind: 'pet', name: 'Lantern Ghost', desc: 'A wisp that decided it liked you.', icon: 'c_pet_ghost', sprite: 'pet_ghost', source: 'Achievement: Master of the Barrow' },
  { id: 'mount.gravehound', kind: 'mount', name: 'Gravehound', desc: 'A bone dog the size of a pony. Good boy.', icon: 'c_mount_hound', sprite: 'mount_hound', source: 'The Gravekeeper, 1 in 1,000', saddle: { x: -4, y: -94, k: 0.9 } },
  { id: 'dye.ghostly', kind: 'cosmetic', name: 'Ghostly Dye', desc: 'Turns your Barrow set pale and see-through.', icon: 'c_dye', source: 'The Gravekeeper, 1 in 1,000' },
  { id: 'trophy.rattlebones_plume', kind: 'trophy', name: 'Sir Rattlebones’ Plume', desc: 'He was very proud of it. He doesn’t need it now.', icon: 'c_plume', sprite: 'tr_plume', source: 'Sir Rattlebones, 1 in 50' },
  { id: 'trophy.barrow_key', kind: 'trophy', name: 'Barrow Key', desc: 'Opens one door, and you already went through it.', icon: 'c_key', sprite: 'tr_key', source: 'Achievement: Into the Barrow' },
  { id: 'trophy.broken_shackle', kind: 'trophy', name: 'Broken Shackle', desc: 'Ten chains, ten cuts.', icon: 'c_shackle', sprite: 'tr_shackle', source: 'Achievement: Chain Snapper' },
  { id: 'trophy.bent_bars', kind: 'trophy', name: 'Bent Bars', desc: 'From a cage that did not hold you for long.', icon: 'c_bars', sprite: 'tr_bars', source: 'Achievement: Jailbreak' },
  { id: 'trophy.golden_skull', kind: 'trophy', name: 'Golden Skull', desc: 'Flawless. Not a scratch from the hands or the rings.', icon: 'c_skull', sprite: 'tr_skull', source: 'Achievement: Flawless Barrow' },
  { id: 'banner.party', kind: 'banner', name: 'Party Banner', desc: 'Three heroes, nobody left behind.', icon: 'c_banner', sprite: 'tr_banner', source: 'Achievement: Nobody Left Behind' },
  { id: 'cosmetic.trail_wisp', kind: 'cosmetic', name: 'Wisp-light Trail', desc: 'Your swipes leave a trail of ghost light.', icon: 'c_trail', source: 'Achievement: Wisp Swatter' },
  { id: 'cosmetic.glow_shield', kind: 'cosmetic', name: 'Golden Shield Rim', desc: 'Your shield rim glows gold.', icon: 'c_glow_shield', source: 'Achievement: Wall of Bone' },
  { id: 'cosmetic.glow_staff', kind: 'cosmetic', name: 'Dawn Staff Glow', desc: 'Your staff glows like first light.', icon: 'c_glow_staff', source: 'Achievement: Not On My Watch' },
  { id: 'cosmetic.crit_ice', kind: 'cosmetic', name: 'Ice-burst Crits', desc: 'Your crits burst into ice.', icon: 'c_crit_ice', source: 'Achievement: Big Number' },
];

export const BARROW_TITLES: TitleDef[] = [
  { id: 'title.bonebreaker', text: 'Bonebreaker' },
  { id: 'title.knightbreaker', text: 'Knight-breaker' },
  { id: 'title.quick', text: 'the Quick' },
  { id: 'title.barrowborn', text: 'the Barrow-born' },
  { id: 'title.braveish', text: 'the Brave(ish)' },
  { id: 'title.stubborn', text: 'the Stubborn' },
];
