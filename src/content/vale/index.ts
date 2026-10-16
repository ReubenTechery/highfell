/**
 * The garden: the planter beds in the yard by the house, the seeds dungeons drop for them, what grows
 * and what you brew with it. A seed grows over a few dungeon clears (never on a clock, and it never
 * wilts), you harvest it in a close-up, and the herbs go in the cauldron. One bottle is poured at the
 * door for the whole party and makes that run quicker. Nothing needs a brew: every Heroic and raid can
 * be cleared without one.
 */
import type { DropDef, IngredientDef, LorePage, NodeDef, RecipeDef } from '../types';

export const INGREDIENTS: Record<string, IngredientDef> = {
  moonpetal: { id: 'moonpetal', name: 'Moonpetal', icon: 'g_moonpetal', desc: 'A pale flower that opens at dusk. Smells like rain on warm stone.' },
  glowcap: { id: 'glowcap', name: 'Glowcap', icon: 'g_glowcap', desc: 'A mushroom with a lamp in it. Pick it at its brightest.' },
  brambleberry: { id: 'brambleberry', name: 'Brambleberry', icon: 'g_berry', desc: 'Dark, sweet and guarded by thorns that mean it.' },
  dew: { id: 'dew', name: 'Starlight Dew', icon: 'g_dew', desc: 'Collects on a bed that shimmers. It hums if you hold it close.', rare: true },
};
export const INGREDIENT_ORDER = ['moonpetal', 'glowcap', 'brambleberry', 'dew'];

/** One bottle is one dungeon run for the whole party. Effects live in the engine under the recipe id (BREW_FX). */
export const RECIPES: Record<string, RecipeDef> = {
  glow: { id: 'glow', name: 'Glowcap Draught', icon: 'b_glow', color: '#9BE15D', needs: { glowcap: 10 }, makes: 1, rank: 1,
    desc: 'The whole party hits 25% harder and moves 15% faster, area hits reach 25% wider, and the tank holds 50% more threat.',
    short: '+25% damage, +15% speed' },
  elixir: { id: 'elixir', name: 'Starlight Elixir', icon: 'b_elixir', color: '#F2C230', needs: { glowcap: 8, dew: 2 }, makes: 1, rank: 3,
    desc: 'Everything the Glowcap Draught does, and once a run each hero gets back up on half health from a hit that would knock them down.',
    short: "Glowcap's boost, and get up once" },
  tonic: { id: 'tonic', name: 'Moonpetal Tonic', icon: 'b_tonic', color: '#8FD6FF', needs: { moonpetal: 10 }, makes: 1, rank: 1,
    desc: 'The whole party moves 15% faster, and every dodge heals 10% of your health.',
    short: '+15% speed, dodges heal 10%' },
  fizz: { id: 'fizz', name: 'Bramble Fizz', icon: 'b_fizz', color: '#D9465A', needs: { brambleberry: 8, moonpetal: 2 }, makes: 1, rank: 1,
    desc: 'The whole party moves 25% faster, and every cooldown, the dodge too, comes back 20% sooner.',
    short: '+25% speed, cooldowns 20% sooner' },
};
export const RECIPE_ORDER = ['glow', 'elixir', 'tonic', 'fizz'];

/** What a seed grows into, by seed id: its close-up, and the herbs it gives. */
export const PLANTS: Record<string, NodeDef> = {
  glowcap: { id: 'glowcap', name: 'Glowcap ring', seed: 'Glowcap seed', verb: 'Pluck', toy: 'pluck', look: 'cap', gives: 'glowcap', yield: [8, 10] },
  moonpetal: { id: 'moonpetal', name: 'Moonpetal patch', seed: 'Moonpetal seed', verb: 'Snip', toy: 'snip', look: 'flower', gives: 'moonpetal', yield: [8, 10] },
  bramble: { id: 'bramble', name: 'Bramble hedge', seed: 'Bramble seed', verb: 'Snip', toy: 'snip', look: 'sprig', gives: 'brambleberry', yield: [8, 10] },
};
export const SEED_ORDER = ['glowcap', 'moonpetal', 'bramble'];
/** The seed icon for each plant. */
export const SEED_ICON: Record<string, string> = { glowcap: 'g_seed_glowcap', moonpetal: 'g_seed_moonpetal', bramble: 'g_seed_bramble' };

/** Planter beds in the yard. */
export const BEDS = 3;
/** Dungeon clears a planted seed takes to be ready (any dungeon, Normal or Heroic; the Crypt Trial doesn't count). */
export const GROW_CLEARS = 3;
/** The chance a bed shimmers when it's planted (its harvest drops Starlight Dew). You see it while it grows. */
export const SHIMMER = 1 / 7;
/** Your first harvest ever brings a goat into the garden: she stays. */
export const FIRST_HARVEST_GIFT = 'mount.goat';
/** Rare drops, every line rolled on its own every harvest. */
export const GARDEN_TABLE: DropDef[] = [
  { id: 'trophy.pressed_moonpetal', rate: 1 / 25 },
  { id: 'trophy.glowcap_jar', rate: 1 / 25 },
  { id: 'trophy.bramble_crown', rate: 1 / 25 },
  { id: 'trophy.wobbly_kettle', rate: 1 / 25 },
  { id: 'banner.bunting', rate: 1 / 25 },
  { id: 'mount.thistle_hare', rate: 1 / 60 },
  { id: 'pet.rootling', rate: 1 / 200 },
  { id: 'pet.puffcap', rate: 1 / 200 },
  { id: 'pet.thimble', rate: 1 / 200 },
];

/** Skill ranks: the XP each rank needs, rank 1 to 10. */
export const RANK_XP = [0, 60, 150, 280, 450, 670, 950, 1300, 1720, 2220];
export const SKILLS: Record<string, { name: string; blurb: string }> = {
  gather: { name: 'Gathering', blurb: 'Every cut gives XP, a Perfect most. Ranks 4, 7 and 10 add one to every harvest.' },
  brew: { name: 'Brewing', blurb: 'Every lap of the stir gives XP. Rank 3 learns Starlight Elixir.' },
};

/** Bramblewick's story, from the days you rode out there. No new pages come; the ones you found stay in the log. */
export const LORE: LorePage[] = [
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
];
