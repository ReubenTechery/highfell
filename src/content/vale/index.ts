/**
 * The Vale: the places you ride out to between dungeons, what you gather there and what you brew
 * with it. Kept small on purpose: a place is one screen with three gathering spots and a villager;
 * a trip is about five minutes; brews are fun twists for a run, never power a raid needs.
 */
import type { IngredientDef, PlaceDef, RecipeDef } from '../types';
import { BRAMBLEWICK } from './bramblewick';

export const INGREDIENTS: Record<string, IngredientDef> = {
  moonpetal: { id: 'moonpetal', name: 'Moonpetal', icon: 'g_moonpetal', desc: 'A pale flower that opens at dusk. Smells like rain on warm stone.' },
  glowcap: { id: 'glowcap', name: 'Glowcap', icon: 'g_glowcap', desc: 'A mushroom with a lamp in it. Pick it at its brightest.' },
  brambleberry: { id: 'brambleberry', name: 'Brambleberry', icon: 'g_berry', desc: 'Dark, sweet and guarded by thorns that mean it.' },
  dew: { id: 'dew', name: 'Starlight Dew', icon: 'g_dew', desc: 'Collects on plants that shimmer. It hums if you hold it close.', rare: true },
};
export const INGREDIENT_ORDER = ['moonpetal', 'glowcap', 'brambleberry', 'dew'];

/** One bottle is one dungeon run. Effects live in the engine under the recipe id. */
export const RECIPES: Record<string, RecipeDef> = {
  tonic: { id: 'tonic', name: 'Moonpetal Tonic', icon: 'b_tonic', color: '#8FD6FF', needs: { moonpetal: 4 }, makes: 2, rank: 1,
    desc: 'Dodging heals you for 5% of your health.' },
  fizz: { id: 'fizz', name: 'Bramble Fizz', icon: 'b_fizz', color: '#D9465A', needs: { brambleberry: 4, moonpetal: 1 }, makes: 2, rank: 1,
    desc: 'You move 12% faster and your dodge comes back a third sooner.' },
  glow: { id: 'glow', name: 'Glowcap Draught', icon: 'b_glow', color: '#9BE15D', needs: { glowcap: 4, brambleberry: 1 }, makes: 2, rank: 2,
    desc: 'Your first hit on every enemy is a crit.' },
  elixir: { id: 'elixir', name: 'Starlight Elixir', icon: 'b_elixir', color: '#F2C230', needs: { dew: 2, moonpetal: 2, glowcap: 2 }, makes: 1, rank: 3,
    desc: 'Once a run, a hit that would knock you down leaves you standing on half health.' },
};
export const RECIPE_ORDER = ['tonic', 'fizz', 'glow', 'elixir'];

export const PLACES: Record<string, PlaceDef> = { bramblewick: BRAMBLEWICK };

/** The Vale map: home, the places you can ride to, the dungeons, and what is coming. Coordinates are
 *  on a 1000 by 1000 map; everything you can tap sits between 140 and 860 across, 200 and 820 down. */
export interface MapPlace { id: string; name: string; kind: 'home' | 'place' | 'dungeon' | 'soon'; x: number; y: number; blurb: string }
export const VALE_MAP: MapPlace[] = [
  { id: 'highfell', name: 'Highfell', kind: 'home', x: 500, y: 560, blurb: 'Home: your hearth, and the Last Lantern that never closes.' },
  { id: 'bramblewick', name: 'Bramblewick Hollow', kind: 'place', x: 255, y: 720, blurb: BRAMBLEWICK.blurb },
  { id: 'barrow', name: 'Barrow Crypt', kind: 'dungeon', x: 760, y: 735, blurb: 'Five packs, a knight who won’t stay down, and the Gravekeeper.' },
  { id: 'moonmere', name: 'Moonmere', kind: 'soon', x: 265, y: 330, blurb: 'The elves’ lake. Misty, moonlit, very calm about everything. Coming later.' },
  { id: 'emberdeep', name: 'Emberdeep', kind: 'soon', x: 740, y: 300, blurb: 'The dwarves’ forges, burning day and night just in case. Coming later.' },
];

/** Skill ranks: the XP each rank needs, rank 1 to 10. */
export const RANK_XP = [0, 60, 150, 280, 450, 670, 950, 1300, 1720, 2220];
export const SKILLS: Record<string, { name: string; blurb: string }> = {
  gather: { name: 'Gathering', blurb: 'Every Perfect counts. Ranks 4, 7 and 10 add one to every harvest.' },
  brew: { name: 'Brewing', blurb: 'Rank 2 learns Glowcap Draught, rank 3 Starlight Elixir.' },
};

/** Nodes regrow overnight and bank up to three days, so missing a day costs nothing. */
export const NODE_PER_DAY = 2;
export const NODE_BANK = 6;
export const ERRAND_BANK = 3;
/** The chance a node's next harvest shimmers (and drops Starlight Dew). You see it before you start. */
export const SHIMMER = 1 / 7;
