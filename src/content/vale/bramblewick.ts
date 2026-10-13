/**
 * Bramblewick Hollow: the gnomes' hollow hills, and the first place you can ride out to. Three
 * gathering spots, Dottle the inventor with an errand a day, a page of the hollow's story per
 * errand, and the rares: three pets, three trophies, a kettle, bunting and a hare to ride.
 */
import type { AchievementDef, CollectibleDef, PlaceDef, TitleDef } from '../types';

export const BRAMBLEWICK: PlaceDef = {
  id: 'bramblewick',
  name: 'Bramblewick Hollow',
  race: 'gnome',
  blurb: 'Hollow hills, round doors, herb gardens and a windmill that only turns when nobody is looking. The gnomes are friendly and mostly on fire.',
  villager: { name: 'Dottle Gearpatch', title: 'Inventor' },
  nodes: [
    { id: 'moonpetal', name: 'Moonpetal patch', verb: 'Snip', toy: 'snip', look: 'flower', gives: 'moonpetal', yield: [1, 2],
      table: [{ id: 'trophy.pressed_moonpetal', rate: 1 / 80 }, { id: 'pet.rootling', rate: 1 / 600 }] },
    { id: 'glowcap', name: 'Glowcap ring', verb: 'Pluck', toy: 'pluck', look: 'cap', gives: 'glowcap', yield: [1, 2],
      table: [{ id: 'trophy.glowcap_jar', rate: 1 / 80 }, { id: 'pet.puffcap', rate: 1 / 600 }] },
    { id: 'bramble', name: 'Bramble hedge', verb: 'Snip', toy: 'snip', look: 'sprig', gives: 'brambleberry', yield: [1, 2],
      table: [{ id: 'trophy.bramble_crown', rate: 1 / 80 }, { id: 'pet.thimble', rate: 1 / 600 }] },
  ],
  errands: [
    { id: 'kettle', kind: 'find', thing: 'kettle', title: 'The kettle has walked off again',
      ask: 'It’s one of my better ones, which means it only walks when nobody is looking. Have a look around?',
      thanks: 'There it is! Thank you. I’ll tie it to the stove this time. Again.' },
    { id: 'crows', kind: 'shoo', thing: 'crow', target: 6, title: 'Crows on the cabbages',
      ask: 'Shoo them before they eat the lot! They’re not scared of me. They’ve seen my inventions.',
      thanks: 'Cabbages saved. I owe you a soup, and possibly an apology for the soup.' },
    { id: 'petals', kind: 'deliver', needs: { moonpetal: 4 }, title: 'Moonpetals for the lamp',
      ask: 'Four moonpetals and my reading lamp works again. Please don’t ask how.',
      thanks: 'Lovely. The lamp is reading again. I mean working. It’s been a long week.' },
    { id: 'sparks', kind: 'shoo', thing: 'spark', target: 6, title: 'The chimney is sparking',
      ask: 'Stamp out the sparks before they find the thatch. Quickly, but not too quickly, they bite.',
      thanks: 'Out, all of them. The fire brigade will be furious they missed it.' },
    { id: 'caps', kind: 'deliver', needs: { glowcap: 3 }, title: 'Glowcaps for the cellar',
      ask: 'Three glowcaps, please. The cellar is dark and something down there keeps asking for them.',
      thanks: 'It says thank you. I didn’t know it could talk. I’ll be sleeping upstairs.' },
    { id: 'goggles', kind: 'find', thing: 'goggles', title: 'Has anyone seen my goggles?',
      ask: 'I put them down somewhere. Possibly on my head. Have a look around?',
      thanks: 'Not on my head! You’re a marvel. I’d have looked there last.' },
    { id: 'berries', kind: 'deliver', needs: { brambleberry: 4 }, title: 'Berries for the jam',
      ask: 'Four brambleberries for the festival jam. Mind the thorns, they’re on our side.',
      thanks: 'Perfect. Jam by Tuesday, or a small explosion by Monday.' },
  ],
  errandTable: [
    { id: 'mount.thistle_hare', rate: 1 / 40 },
    { id: 'trophy.wobbly_kettle', rate: 1 / 25 },
    { id: 'banner.bunting', rate: 1 / 20 },
  ],
  lore: [
    { id: 'bw.under', title: 'Under the Hills',
      text: 'From the road, Bramblewick is gardens, a windmill and a lot of round doors. Under the grass the hills are hollow, and every gnome family has dug its own way down. Nobody has a map. Everybody has opinions.' },
    { id: 'bw.half', title: 'Half of Everything',
      text: 'Gnomes say half their inventions work. The other half are on fire, which they’ll tell you is also a kind of working. The fire brigade is the most popular club in the Vale.' },
    { id: 'bw.goats', title: 'The Goats',
      text: 'Every gnome rides a hill goat, because a goat can climb anything and eats the evidence. Goats are named after vegetables. Nobody remembers why. Turnip is the most popular name, then Turnip the Second.' },
    { id: 'bw.petals', title: 'Moonpetals',
      text: 'Moonpetals open after dark and shut the moment anyone sings. Gnome children are sent out at dusk to pick them, with strict orders to keep quiet, which is how gnomes learned to whisper.' },
    { id: 'bw.ring', title: 'The Glowcap Ring',
      text: 'The mushroom ring at the edge of the hollow has glowed for longer than the village has stood. Gnomes say it’s where the hills breathe. Elves say it’s just mushrooms. The elves are probably right and nobody minds.' },
    { id: 'bw.dottle', title: 'Dottle Gearpatch',
      text: 'Dottle has been banned from market twice: once for the walking kettle and once for the kettle that walked back. She is the best inventor in Bramblewick, and also the reason it has a fire brigade.' },
    { id: 'bw.bunting', title: 'The Bunting',
      text: 'On festival days the hollow is strung with bunting made from old trousers. It’s a great honour to have your trousers in the bunting. It’s less of an honour to be standing in them at the time.' },
    { id: 'bw.dew', title: 'Starlight Dew',
      text: 'Some nights a plant will shimmer, and by morning it’s covered in dew that hums. Gnomes collect it in thimbles. Brewers say it’s the Vale remembering something. Gnomes say it’s very good in tea.' },
  ],
};

export const BRAMBLEWICK_COLLECTIBLES: CollectibleDef[] = [
  { id: 'mount.goat', kind: 'mount', name: 'Hill Goat', desc: 'Stubborn, warm and very good at hills. Everyone in Bramblewick has one, and they’re all called Turnip.',
    icon: 'c_goat', sprite: 'mount_goat', source: 'Your first ride out', saddle: { x: -8, y: -88, k: 0.92 } },
  { id: 'mount.thistle_hare', kind: 'mount', name: 'Thistledown Hare', desc: 'A hare the size of a pony. Gnomes ride them to market, very fast and in no particular direction.',
    icon: 'c_hare', sprite: 'mount_hare', source: 'Bramblewick errands, 1 in 40', saddle: { x: -6, y: -84, k: 0.9 } },
  { id: 'pet.rootling', kind: 'pet', name: 'Rootling', desc: 'Pulled up with a moonpetal. It screamed, then decided to stay.',
    icon: 'c_rootling', sprite: 'pet_rootling', source: 'Moonpetal patch, 1 in 600' },
  { id: 'pet.puffcap', kind: 'pet', name: 'Puffcap', desc: 'A glowcap that walks. It leaves a little trail of light wherever it goes, mostly towards snacks.',
    icon: 'c_puffcap', sprite: 'pet_puffcap', source: 'Glowcap ring, 1 in 600' },
  { id: 'pet.thimble', kind: 'pet', name: 'Thimble', desc: 'A bramble hedgehog who sleeps in your satchel and pretends not to.',
    icon: 'c_thimble', sprite: 'pet_thimble', source: 'Bramble hedge, 1 in 600' },
  { id: 'trophy.pressed_moonpetal', kind: 'trophy', name: 'Pressed Moonpetal', desc: 'A silver moonpetal in a little frame. It still glows a bit at night.',
    icon: 'c_pressed', sprite: 'tr_pressed', source: 'Moonpetal patch, 1 in 80' },
  { id: 'trophy.glowcap_jar', kind: 'trophy', name: 'Glowcap Jar', desc: 'A jar of glowcaps. Better than a candle, worse than a lantern, cuter than both.',
    icon: 'c_glowjar', sprite: 'tr_glowjar', source: 'Glowcap ring, 1 in 80' },
  { id: 'trophy.bramble_crown', kind: 'trophy', name: 'Bramble Crown', desc: 'Woven from the hedge. Wear it at your own risk. Nobody has.',
    icon: 'c_crown', sprite: 'tr_crown', source: 'Bramble hedge, 1 in 80' },
  { id: 'trophy.wobbly_kettle', kind: 'trophy', name: 'Wobbly Kettle', desc: 'One of Dottle’s. It walks when nobody is looking, so keep looking.',
    icon: 'c_kettle', sprite: 'tr_kettle', source: 'Bramblewick errands, 1 in 25' },
  { id: 'banner.bunting', kind: 'banner', name: 'Bramblewick Bunting', desc: 'Patchwork bunting sewn from old gnome trousers. A great honour for the trousers.',
    icon: 'c_bunting', sprite: 'tr_bunting', source: 'Bramblewick errands, 1 in 20' },
];

export const BRAMBLEWICK_TITLES: TitleDef[] = [
  { id: 'title.steady', text: 'Steady-Handed' },
  { id: 'title.brewer', text: 'the Brewer' },
  { id: 'title.friend_bw', text: 'Friend of Bramblewick' },
  { id: 'title.greenthumb', text: 'the Green-Thumbed' },
  { id: 'title.rootwhisper', text: 'Root-Whisperer' },
];

const D = 'bramblewick';
export const BRAMBLEWICK_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'vale.first', dungeon: D, tier: 'bronze', points: 10, name: 'Green Fingers', how: 'Gather anything in Bramblewick.',
    reward: { text: 'A satchel that smells of moonpetal' }, counter: { key: 'vale.harvests', target: 1 } },
  { id: 'vale.steady', dungeon: D, tier: 'silver', points: 25, name: 'Steady Hands', how: 'Get 50 Perfects while gathering.',
    reward: { title: 'title.steady', text: 'Title: Steady-Handed' }, counter: { key: 'vale.perfects', target: 50 } },
  { id: 'vale.brewer', dungeon: D, tier: 'silver', points: 25, name: 'Something Brewing', how: 'Brew 10 times.',
    reward: { title: 'title.brewer', text: 'Title: the Brewer' }, counter: { key: 'vale.brews', target: 10 } },
  { id: 'vale.errands', dungeon: D, tier: 'silver', points: 25, name: 'Odd Jobs', how: 'Do 10 errands for Dottle.',
    reward: { title: 'title.friend_bw', text: 'Title: Friend of Bramblewick' }, counter: { key: 'vale.errands', target: 10 } },
  { id: 'vale.rank', dungeon: D, tier: 'gold', points: 50, name: 'Green-Thumbed', how: 'Reach Gathering rank 10.',
    reward: { title: 'title.greenthumb', text: 'Title: the Green-Thumbed' }, counter: { key: 'vale.rank.gather', target: 10 } },
  { id: 'vale.scream', dungeon: D, tier: 'hidden', points: 15, name: 'It Screamed', how: 'Pull up a Rootling.',
    reward: { title: 'title.rootwhisper', text: 'Title: Root-Whisperer' }, collect: 'pet.rootling' },
];
