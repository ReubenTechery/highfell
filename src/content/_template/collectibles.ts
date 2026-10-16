/** Dungeon Template: pets, mounts, trophies, banners, cosmetics and titles. */
import type { CollectibleDef, TitleDef } from '../types';

export const TEMPLATE_COLLECTIBLES: CollectibleDef[] = [
  { id: 'pet.pint_sovereign', kind: 'pet', name: 'Pint-sized Sovereign', desc: 'A tiny brass-and-mushroom monarch who follows you home.', icon: 'c_pet_keeper', sprite: 'pet_keeper', source: 'The Sovereign, 1 in 5,000' },
  { id: 'pet.spore_sprite', kind: 'pet', name: 'Spore Sprite', desc: 'A glowing hollow sprite that decided it liked you.', icon: 'c_pet_ghost', sprite: 'pet_ghost', source: 'Achievement: Master of the Sanctum' },
  { id: 'mount.clockwork_beetle', kind: 'mount', name: 'Clockwork Beetle', desc: 'Wound tight with a brass key. Never needs oats.', icon: 'c_mount_hound', sprite: 'mount_hound', source: 'The Sovereign, 1 in 1,000', saddle: { x: -4, y: -94, k: 0.9 } },
  { id: 'dye.sporeglow', kind: 'cosmetic', name: 'Sporeglow Dye', desc: 'Gives your dungeon set a bioluminescent shimmer.', icon: 'c_dye', source: 'The Sovereign, 1 in 1,000' },
  { id: 'trophy.warden_crest', kind: 'trophy', name: 'Warden’s Crest', desc: 'Still ticking faintly on the mantel.', icon: 'c_plume', sprite: 'tr_plume', source: 'Mini-Boss Warden, 1 in 50' },
  { id: 'trophy.sanctum_key', kind: 'trophy', name: 'Sanctum Key', desc: 'Opens the inner burrow.', icon: 'c_key', sprite: 'tr_key', source: 'Achievement: First Clear' },
];

export const TEMPLATE_TITLES: TitleDef[] = [
  { id: 'title.tinker', text: 'the Clockwork Knight' },
  { id: 'title.sporewarden', text: 'the Sporewarden' },
];
