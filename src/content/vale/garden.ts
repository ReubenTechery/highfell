/**
 * The garden's rewards: the goat your first harvest brings, the rares any harvest can turn up (three
 * pets, four trophies, bunting and a hare), its titles and its achievements. They came from Bramblewick
 * when you rode out there; the ids stay the same so everything already found stays found.
 */
import type { AchievementDef, CollectibleDef, TitleDef } from '../types';

export const GARDEN_COLLECTIBLES: CollectibleDef[] = [
  { id: 'mount.goat', kind: 'mount', name: 'Hill Goat', desc: 'Stubborn, warm and very good at hills. She wandered into the garden at your first harvest and ate a row of something. Her name is Turnip.',
    icon: 'c_goat', sprite: 'mount_goat', source: 'Your first harvest', saddle: { x: -8, y: -88, k: 0.92 } },
  { id: 'mount.thistle_hare', kind: 'mount', name: 'Thistledown Hare', desc: 'A hare the size of a pony. Gnomes ride them to market, very fast and in no particular direction.',
    icon: 'c_hare', sprite: 'mount_hare', source: 'Any harvest, 1 in 60', saddle: { x: -6, y: -84, k: 0.9 } },
  { id: 'pet.rootling', kind: 'pet', name: 'Rootling', desc: 'Pulled up with a harvest. It screamed, then decided to stay.',
    icon: 'c_rootling', sprite: 'pet_rootling', source: 'Any harvest, 1 in 200' },
  { id: 'pet.puffcap', kind: 'pet', name: 'Puffcap', desc: 'A glowcap that walks. It leaves a little trail of light wherever it goes, mostly towards snacks.',
    icon: 'c_puffcap', sprite: 'pet_puffcap', source: 'Any harvest, 1 in 200' },
  { id: 'pet.thimble', kind: 'pet', name: 'Thimble', desc: 'A bramble hedgehog who sleeps in your satchel and pretends not to.',
    icon: 'c_thimble', sprite: 'pet_thimble', source: 'Any harvest, 1 in 200' },
  { id: 'trophy.pressed_moonpetal', kind: 'trophy', name: 'Pressed Moonpetal', desc: 'A silver moonpetal in a little frame. It still glows a bit at night.',
    icon: 'c_pressed', sprite: 'tr_pressed', source: 'Any harvest, 1 in 25' },
  { id: 'trophy.glowcap_jar', kind: 'trophy', name: 'Glowcap Jar', desc: 'A jar of glowcaps. Better than a candle, worse than a lantern, cuter than both.',
    icon: 'c_glowjar', sprite: 'tr_glowjar', source: 'Any harvest, 1 in 25' },
  { id: 'trophy.bramble_crown', kind: 'trophy', name: 'Bramble Crown', desc: 'Woven from the hedge. Wear it at your own risk. Nobody has.',
    icon: 'c_crown', sprite: 'tr_crown', source: 'Any harvest, 1 in 25' },
  { id: 'trophy.wobbly_kettle', kind: 'trophy', name: 'Wobbly Kettle', desc: 'Dug up in a bed, still warm. It walks when nobody is looking, so keep looking.',
    icon: 'c_kettle', sprite: 'tr_kettle', source: 'Any harvest, 1 in 25' },
  { id: 'banner.bunting', kind: 'banner', name: 'Bramblewick Bunting', desc: 'Patchwork bunting sewn from old gnome trousers. A great honour for the trousers.',
    icon: 'c_bunting', sprite: 'tr_bunting', source: 'Any harvest, 1 in 25' },
];

export const GARDEN_TITLES: TitleDef[] = [
  { id: 'title.steady', text: 'Steady-Handed' },
  { id: 'title.brewer', text: 'the Brewer' },
  { id: 'title.friend_bw', text: 'Friend of Bramblewick' },
  { id: 'title.greenthumb', text: 'the Green-Thumbed' },
  { id: 'title.rootwhisper', text: 'Root-Whisperer' },
];

const D = 'garden';
export const GARDEN_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'vale.first', dungeon: D, tier: 'bronze', points: 10, name: 'Green Fingers', how: 'Harvest a garden bed.',
    reward: { text: 'A satchel that smells of moonpetal' }, counter: { key: 'vale.harvests', target: 1 } },
  { id: 'vale.steady', dungeon: D, tier: 'silver', points: 25, name: 'Steady Hands', how: 'Get 50 Perfects while harvesting.',
    reward: { title: 'title.steady', text: 'Title: Steady-Handed' }, counter: { key: 'vale.perfects', target: 50 } },
  { id: 'vale.brewer', dungeon: D, tier: 'silver', points: 25, name: 'Something Brewing', how: 'Brew 10 times.',
    reward: { title: 'title.brewer', text: 'Title: the Brewer' }, counter: { key: 'vale.brews', target: 10 } },
  // Dottle's errands went with riding out: kept for whoever earned it, hidden from everyone else
  { id: 'vale.errands', dungeon: D, tier: 'silver', points: 25, name: 'Odd Jobs', how: 'Did 10 errands for Dottle, back when you rode out to Bramblewick.', retired: true,
    reward: { title: 'title.friend_bw', text: 'Title: Friend of Bramblewick' }, counter: { key: 'vale.errands', target: 10 } },
  { id: 'vale.rank', dungeon: D, tier: 'gold', points: 50, name: 'Green-Thumbed', how: 'Reach Gathering rank 10.',
    reward: { title: 'title.greenthumb', text: 'Title: the Green-Thumbed' }, counter: { key: 'vale.rank.gather', target: 10 } },
  { id: 'vale.scream', dungeon: D, tier: 'hidden', points: 15, name: 'It Screamed', how: 'Pull up a Rootling.',
    reward: { title: 'title.rootwhisper', text: 'Title: Root-Whisperer' }, collect: 'pet.rootling' },
];
