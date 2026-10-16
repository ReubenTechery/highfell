/**
 * First-time tips: each shows once a save, the first time its moment comes. The house shows one at a time: the
 * welcome tour after your first hero, then the garden's, each as its first comes: your first seed (plant it),
 * your first ready bed (pick it) and your first herbs that make a brew (to the cauldron). The Dungeons door has
 * two: your Warband, the first time you open it, and your first bottle (it's poured at the door). A tip is done
 * once it has shown and you've tapped on, or once you've done what it was about. It all lives in `p.counters`,
 * so the save's shape never changes.
 */
import { RECIPE_ORDER } from '../content/vale';
import { finishHearthTour, finishSeedTour, needsHearthTour, needsSeedTour, type Profile } from './profile';
import { canBrew, readyBeds } from './vale';

/** the house's tips: the welcome tour, then the garden's in the order they come */
export type HouseTip = 'tour' | 'seed' | 'ready' | 'herbs';
/** the Dungeons door's tips: your Warband, then your first bottle */
export type DoorTip = 'warband' | 'brew';

const seen = (p: Profile, tip: string): boolean => !!p.counters['tip.' + tip];

/** The tip the house shows now, if any. */
export function houseTip(p: Profile): HouseTip | null {
  if (!p.roster.length) return null;
  if (needsHearthTour(p)) return 'tour';
  if (needsSeedTour(p)) return 'seed';
  // your first crop to pick, if you've never picked one
  if (!seen(p, 'ready') && !p.counters['vale.harvests'] && readyBeds(p) > 0) return 'ready';
  // the first time your herbs make a brew, if you've never brewed
  if (!seen(p, 'herbs') && !p.counters['vale.brews'] && RECIPE_ORDER.some((id) => canBrew(p, id) > 0)) return 'herbs';
  return null;
}

/** The tip the Dungeons door shows now, if any: your Warband on the Normal door (on Heroic friends take the
 *  seats, never your heroes), then your first bottle once you have one. */
export function doorTip(p: Profile, heroic: boolean): DoorTip | null {
  if (!p.roster.length) return null;
  if (!heroic && !seen(p, 'warband')) return 'warband';
  if (!seen(p, 'brew') && RECIPE_ORDER.some((id) => (p.vale.shelf[id] || 0) > 0)) return 'brew';
  return null;
}

/** A tip has shown and you've tapped on (or tapped what it points at): it doesn't come back. */
export function finishTip(p: Profile, tip: HouseTip | DoorTip): void {
  if (tip === 'tour') finishHearthTour(p);
  else if (tip === 'seed') finishSeedTour(p);
  else p.counters['tip.' + tip] = 1;
}
