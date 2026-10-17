/**
 * The house's tips, as data: the welcome tour after your first hero (your gear, your Warband's beds, the
 * dungeons), and the one-step tips, each the first time its moment comes (meta/tips.ts says when): your first
 * talent points, your first seed, your first ready bed and your first herbs. Each step is a room, what it points at, where its
 * pin stands and its words; the hearth draws them.
 */
import { BUNK_SLOTS, HALL, HERO_AT, THINGS } from '../content/house';
import type { Profile } from '../meta/profile';
import type { HouseTip } from '../meta/tips';
import { bedPhase } from '../meta/vale';
import { warbandOpen } from '../meta/warband';

/** a step of a guided tour of the house: its room, what it points at (a thing's id, 'door.<dungeon>' for a door in the
 *  cellar, 'me' for your hero by the fire, 'newhero' for the empty bed), where its pin stands and, if not over the pin,
 *  where the camera looks */
export interface TourStep { room: string; thing?: string; at: [number, number]; cam?: number; callout: string; step: string; title: string; sub: string; next: string }

/** the 3-step guided tour shown after making your first hero: points directly at the object in each room */
export const TOUR_STEPS: TourStep[] = [
  {
    room: 'hall',
    thing: 'me',
    at: [HERO_AT.x, HERO_AT.y - 310],
    cam: HERO_AT.x + 70,
    callout: 'Tap Your Hero · Gear',
    step: '1 / 3',
    title: 'Your Hero',
    sub: 'New gear waits here. You put it on.',
    next: 'Next →',
  },
  {
    room: 'bunks',
    thing: 'newhero',
    at: [BUNK_SLOTS[0][0], BUNK_SLOTS[0][1] - 190],
    cam: 270,
    callout: 'Tap a Bed · New Hero',
    step: '2 / 3',
    title: 'Your Warband',
    sub: 'A hero for each role fills your party seats.',
    next: 'Next →',
  },
  {
    room: 'cellar',
    thing: 'door.barrow',
    at: [HALL.x0, 140],
    cam: 430,
    callout: 'Tap Door · Enter Dungeon',
    step: '3 / 3',
    title: 'Dungeons',
    sub: '4-minute runs for rare loot & pets.',
    next: 'Dungeons',
  },
];

/** the one-step tips: spend your first talent points, plant your first seed, pick your first crop, brew your
 *  first herbs */
const TIPS: Record<Exclude<HouseTip, 'tour'>, TourStep> = {
  talents: {
    room: 'hall',
    thing: 'me',
    at: [HERO_AT.x, HERO_AT.y - 310],
    cam: HERO_AT.x + 70,
    callout: 'Tap Your Hero · Talents',
    step: 'New',
    title: 'Talent Points',
    sub: 'Your level gave you talent points. Pick a spec and spend them.',
    next: 'Got it',
  },
  seed: {
    room: 'yard',
    thing: 'bed.1',
    at: [-400, -150],
    callout: 'Tap a Bed · Plant It',
    step: 'New',
    title: 'Your First Seed',
    sub: 'Plant it here. It grows over 3 dungeon clears.',
    next: 'Got it',
  },
  ready: {
    room: 'yard',
    thing: 'bed.1',
    at: [-400, -150],
    callout: 'Tap It · Pick It',
    step: 'New',
    title: 'Ready to Pick',
    sub: 'Your first crop is ready. Pick it for herbs to brew.',
    next: 'Got it',
  },
  herbs: {
    room: 'brewery',
    thing: 'cauldron',
    at: [960, -150],
    callout: 'Tap the Cauldron · Brew',
    step: 'New',
    title: 'Brew Time',
    sub: 'Herbs go in here. A bottle speeds up a run.',
    next: 'Got it',
  },
};

/** A tip's steps for this save: the ready tip points at the bed that is ready. */
export function tipSteps(tip: HouseTip, p: Profile): TourStep[] {
  // the welcome tour shows the bunk room's beds only once your Warband is open (warband.ts)
  if (tip === 'tour') {
    const steps = warbandOpen(p) ? TOUR_STEPS : TOUR_STEPS.filter((s) => s.thing !== 'newhero');
    return steps.map((s, i) => ({ ...s, step: `${i + 1} / ${steps.length}` }));
  }
  const step = TIPS[tip];
  if (tip !== 'ready') return [step];
  const bed = THINGS.find((t) => t.action === 'garden' && t.bed !== undefined && !!p.vale.beds[t.bed] && bedPhase(p.vale.beds[t.bed]) === 'ready');
  return [bed ? { ...step, thing: bed.id, at: [bed.x, -150] } : step];
}
