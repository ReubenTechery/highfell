/**
 * The house: home, drawn as a tall house cut open so you can see into every room. This file is its
 * plan: the rooms, the things you tap to do something, and the spots where your collection goes.
 *
 * House units: x runs across (0 to 1200 between the outer walls), y runs down, and the ground floor's
 * floor is at y = 0, so the loft is far up (negative y) and the cellar is below ground. A thing or a
 * spot is placed by its ground point, like every sprite. A new room is a new entry here plus its art.
 * A look (the tavern, Barrow Hall) is drawn in ui/houseart.ts; what it is and what opens it is here.
 * Outside, the yard (the garden) is on the left of the house and the paddock (your mounts) on the right.
 */
import type { CollectibleKind } from './types';

/** What tapping a thing in the house does, or a room's main thing: your heroes (the bunk room's list) and
 *  every mount (the paddock's) belong to a room, not to one thing in it. */
export type HouseAction = 'dungeons' | 'garden' | 'gear' | 'logs' | 'brew' | 'satchel' | 'heroes' | 'mounts';

export interface RoomDef {
  id: string;
  /** the sign on the room when you are zoomed out */
  name: string;
  /** the room's back wall: left, top, width, height */
  x: number; y: number; w: number; h: number;
  /** where the camera looks when you go into the room */
  focus: [number, number];
  /** where its sign sits when you're zoomed out, if not at the focus */
  sign?: [number, number];
  /** a room with one clear job: tapped from far away, it zooms in and opens this in one go. A room with
   *  several things (the hall, the loft) has none and just zooms in. */
  main?: HouseAction;
}
/** bed: for the garden's planter beds, which bed (its sprite follows what grows in it) */
export interface ThingDef { id: string; room: string; label: string; action: HouseAction; sprite: string; x: number; y: number; k?: number; bed?: number }
export interface HouseSpot { id: string; kind: CollectibleKind; label: string; room: string; x: number; y: number; k?: number; flip?: boolean }

/** inside the outer walls */
export const HOUSE_W = 1200;
/** each floor's floor line, top to bottom */
export const FLOORS = { loft: -1700, upper: -1180, hall: -520, ground: 0, cellar: 500 } as const;

export const ROOMS: RoomDef[] = [
  { id: 'loft', name: 'Trophy loft', x: 0, y: -2400, w: 1200, h: 700, focus: [600, -1960] },
  { id: 'bunks', name: 'Heroes', x: 0, y: -1664, w: 520, h: 484, focus: [270, -1430], main: 'heroes' },
  { id: 'armory', name: 'Armoury', x: 680, y: -1664, w: 520, h: 484, focus: [930, -1430], main: 'gear' },
  // the hall's sign stands right of the fire, clear of your hero's name tag
  { id: 'hall', name: 'Hall', x: 0, y: -1144, w: 1200, h: 624, focus: [545, -830], sign: [990, -830] },
  { id: 'brewery', name: 'Brewing', x: 0, y: -484, w: 1200, h: 484, focus: [860, -230], sign: [600, -230], main: 'brew' },
  { id: 'cellar', name: 'The Barrow', x: 0, y: 36, w: 1200, h: 464, focus: [420, 300], main: 'dungeons' },
  { id: 'yard', name: 'Garden', x: -900, y: -520, w: 872, h: 520, focus: [-400, -210], sign: [-400, -250], main: 'garden' },
  { id: 'paddock', name: 'Paddock', x: 1228, y: -520, w: 1080, h: 520, focus: [1770, -210], sign: [1600, -250], main: 'mounts' },
];
/** the rooms out in the open, which a look never goes on */
export const OUTSIDE = ['yard', 'paddock'];

/** the things you tap: each one opens what used to be a button */
export const THINGS: ThingDef[] = [
  { id: 'barrow', room: 'cellar', label: 'The door to the Barrow: dungeons', action: 'dungeons', sprite: 'barrow_door', x: 300, y: 444 },
  { id: 'bed.0', room: 'yard', label: 'A garden bed', action: 'garden', sprite: 'bed', x: -600, y: 0, bed: 0 },
  { id: 'bed.1', room: 'yard', label: 'A garden bed', action: 'garden', sprite: 'bed', x: -400, y: 0, bed: 1 },
  { id: 'bed.2', room: 'yard', label: 'A garden bed', action: 'garden', sprite: 'bed', x: -200, y: 0, bed: 2 },
  { id: 'armour', room: 'armory', label: 'The armour stand: your gear', action: 'gear', sprite: 'armor_stand', x: 800, y: -1210 },
  { id: 'lectern', room: 'loft', label: 'The big book: your collection log', action: 'logs', sprite: 'lectern', x: 600, y: -1726 },
  { id: 'cauldron', room: 'brewery', label: 'The cauldron: brew', action: 'brew', sprite: 'cauldron', x: 960, y: -22, k: 0.9 },
  { id: 'larder', room: 'brewery', label: 'The larder: your satchel', action: 'satchel', sprite: 'larder', x: 790, y: -56 },
];

/** Every spot in the house. The order matters: something new goes to the first free spot of its kind.
 *  The first eight are the hearth's original spots, and their ids never change (saves point at them),
 *  bar the stall (`mount.stall`), gone with the stable: every mount stands in the paddock now. */
export const HOUSE_SPOTS: HouseSpot[] = [
  { id: 'pet.fire', kind: 'pet', label: 'By the fire', room: 'hall', x: 822, y: -556 },
  { id: 'pet.rug', kind: 'pet', label: 'On the rug', room: 'hall', x: 690, y: -538, flip: true },
  { id: 'mantel.1', kind: 'trophy', label: 'Mantel, far left', room: 'hall', x: 463, y: -835 },
  { id: 'mantel.2', kind: 'trophy', label: 'Mantel, left', room: 'hall', x: 536, y: -835 },
  { id: 'mantel.3', kind: 'trophy', label: 'Mantel, right', room: 'hall', x: 664, y: -835 },
  { id: 'mantel.4', kind: 'trophy', label: 'Mantel, far right', room: 'hall', x: 737, y: -835 },
  { id: 'banner.wall', kind: 'banner', label: 'Over the fire', room: 'hall', x: 600, y: -1110 },
  { id: 'pet.table', kind: 'pet', label: 'On the table', room: 'hall', x: 1068, y: -624 },
  { id: 'pet.loft', kind: 'pet', label: 'The loft cushion', room: 'loft', x: 250, y: -1722 },
  ...shelf([100, 200, 300, 400], 0),
  ...shelf([800, 900, 1000, 1100], 8),
  { id: 'banner.hall.l', kind: 'banner', label: 'Hall, left wall', room: 'hall', x: 282, y: -1124 },
  { id: 'banner.hall.r', kind: 'banner', label: 'Hall, right wall', room: 'hall', x: 900, y: -1124 },
  { id: 'banner.loft', kind: 'banner', label: 'The loft chimney', room: 'loft', x: 600, y: -2170 },
  { id: 'banner.armory', kind: 'banner', label: 'The armory wall', room: 'armory', x: 930, y: -1640 },
  { id: 'flag.l', kind: 'banner', label: 'Roof, left flag', room: 'loft', x: -70, y: -2372 },
  { id: 'flag.r', kind: 'banner', label: 'Roof, right flag', room: 'loft', x: 1270, y: -2372 },
];

/** The paddock's field, between its fences, and where each mount in the game stands in it: one place
 *  each, in the order the game lists them, zig-zagging between the front of the field and the back so
 *  they can stand close. A mount you own wanders a little either side of its place. */
export const PADDOCK = { x0: 1300, x1: 2240, back: -92, front: 0, wander: 34 };
export function paddockSlots(n: number): { x: number; y: number; k: number }[] {
  const step = (PADDOCK.x1 - PADDOCK.x0) / Math.max(1, n);
  return Array.from({ length: n }, (_, i) => ({ x: PADDOCK.x0 + step * (i + 0.5), y: i % 2 ? PADDOCK.front - 56 : PADDOCK.front, k: i % 2 ? 0.94 : 1.04 }));
}

/** two shelves of four trophies on one side of the loft, the lower shelf first */
function shelf(xs: number[], n0: number): HouseSpot[] {
  const out: HouseSpot[] = [];
  [-1880, -2010].forEach((y, row) => xs.forEach((x, i) => {
    const n = n0 + row * 4 + i + 1;
    out.push({ id: `loft.${n}`, kind: 'trophy', label: `Loft shelf ${n}`, room: 'loft', x, y });
  }));
  return out;
}

/** A look for a room or the whole house. Looks only: it never changes what anything does, or where
 *  anything you put in the house sits. Every dungeon has one, and its heroic version a gilded one; an
 *  achievement that gives a look (finishing that dungeon's collection log) opens it. */
export interface LookDef { id: string; name: string; blurb: string }
export const LOOKS: LookDef[] = [
  { id: 'tavern', name: 'Tavern', blurb: 'Warm wood, lamplight and a crackling fire.' },
  { id: 'barrow', name: 'Barrow Hall', blurb: 'Cold stone, old bones and the Gravekeeper’s green fire.' },
  { id: 'barrow-gilded', name: 'Gilded Barrow Hall', blurb: 'Barrow Hall for the Undying: gold on every bone, gold lanterns, the green fire burning high.' },
];
export const DEFAULT_LOOK = 'tavern';
/** the rooms a look can go on: every room inside the house */
export const LOOK_ROOMS: string[] = ROOMS.filter((r) => !OUTSIDE.includes(r.id)).map((r) => r.id);

/** where your other heroes stand in the bunk room, by their beds */
export const BUNK_SLOTS: [number, number][] = [[64, -1196], [164, -1192], [264, -1196], [364, -1192], [462, -1196]];

/** The room a point falls in, for going into whatever you tap from far away. */
export function roomAt(x: number, y: number): RoomDef | null {
  for (const r of ROOMS) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h + 60) return r;
  return null;
}
