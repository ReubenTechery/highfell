/** Thimblebriar Hollow's pets, mount, trophies, dye and titles. */
import type { CollectibleDef, TitleDef } from '../types';

export const THIMBLEBRIAR_COLLECTIBLES: CollectibleDef[] = [
  { id: 'pet.pint_tinker', kind: 'pet', name: 'Pint-sized Tinker King', desc: 'A little gnome in a little clockwork suit. Wind him up and off he goes.', icon: 'c_pet_tinker', sprite: 'pet_tinker', source: 'The Tinker King, 1 in 2,500' },
  { id: 'pet.puffling', kind: 'pet', name: 'Puffling', desc: 'A baby Waddlecap. It puffs when it’s happy, so mind your nose.', icon: 'c_pet_puffling', sprite: 'pet_puffling', source: 'Achievement: Master of the Hollow' },
  { id: 'mount.clockwork_beetle', kind: 'mount', name: 'Clockwork Beetle', desc: 'Brass shell, wind-up key, never needs oats. Ticks when it’s pleased.', icon: 'c_mount_beetle', sprite: 'mount_beetle', source: 'The Tinker King, 1 in 1,000', saddle: { x: -2, y: -96, k: 0.9 } },
  { id: 'dye.sporeglow', kind: 'cosmetic', name: 'Sporeglow Dye', desc: 'Your Thimblebriar set glows softly, like mushrooms in the dark.', icon: 'c_dye_spore', sprite: 'tr_dye_spore', source: 'The Tinker King, 1 in 1,000' },
  { id: 'trophy.toadstool_cap', kind: 'trophy', name: 'Toadstool’s Cap', desc: 'Old Toadstool’s own hat. Still a bit spotty.', icon: 'c_cap', sprite: 'tr_cap', source: 'Old Toadstool, 1 in 50' },
  { id: 'trophy.brass_key', kind: 'trophy', name: 'Little Brass Key', desc: 'Fits the round green door. You still have to duck.', icon: 'c_brass_key', sprite: 'tr_brass_key', source: 'Achievement: Down the Burrow' },
  { id: 'trophy.golden_cog', kind: 'trophy', name: 'Golden Cog', desc: 'Not one cog out of place, and nobody left behind.', icon: 'c_cog', sprite: 'tr_cog', source: 'Achievement: Safe and Sound' },
  { id: 'trophy.cuckoo_clock', kind: 'trophy', name: 'Cuckoo Clock', desc: 'The Tinker King’s own. You’ve stopped jumping when it goes off.', icon: 'c_cuckoo', sprite: 'tr_cuckoo', source: 'Achievement: Not a Scratch' },
];

export const THIMBLEBRIAR_TITLES: TitleDef[] = [
  { id: 'title.bombproof', text: 'Bombproof' },
  { id: 'title.picker', text: 'the Mushroom-picker' },
  { id: 'title.unsticker', text: 'the Unsticker' },
  { id: 'title.clockstopper', text: 'the Clockstopper' },
  { id: 'title.tinkerer', text: 'the Tinkerer' },
  { id: 'title.sparkler', text: 'the Sparkler' },
  { id: 'title.slugger', text: 'the Slugger' },
  { id: 'title.batter', text: 'the Bomb-batter' },
  { id: 'title.springheel', text: 'Springheel' },
  { id: 'title.hollowborn', text: 'the Hollow-born' },
  { id: 'title.shortfuse', text: 'Short Fuse' },
  { id: 'title.lastcog', text: 'the Last Cog' },
  { id: 'title.clockwork_knight', text: 'the Clockwork Knight' },
];
