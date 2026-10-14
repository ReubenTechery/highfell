/**
 * The house: home, drawn as a tall house cut open so you can see into every room. This file is its
 * plan: the rooms, the things you tap to do something, and the spots where your collection goes.
 *
 * House units: x runs across (0 to 1200 between the outer walls), y runs down, and the ground floor's
 * floor is at y = 0, so the loft is far up (negative y) and the cellar is below ground. A thing or a
 * spot is placed by its ground point, like every sprite. A new room is a new entry here plus its art.
 */
import type { CollectibleKind } from './types';

/** What tapping a thing in the house does. */
export type HouseAction = 'dungeons' | 'ride' | 'gear' | 'logs' | 'brew' | 'satchel';

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
}
export interface ThingDef { id: string; room: string; label: string; action: HouseAction; sprite: string; x: number; y: number; k?: number }
export interface HouseSpot { id: string; kind: CollectibleKind; label: string; room: string; x: number; y: number; k?: number; flip?: boolean }

/** inside the outer walls */
export const HOUSE_W = 1200;
/** each floor's floor line, top to bottom */
export const FLOORS = { loft: -1700, upper: -1180, hall: -520, ground: 0, cellar: 500 } as const;

export const ROOMS: RoomDef[] = [
  { id: 'loft', name: 'Trophy loft', x: 0, y: -2400, w: 1200, h: 700, focus: [600, -1960] },
  { id: 'bunks', name: 'Heroes', x: 0, y: -1664, w: 520, h: 484, focus: [270, -1430] },
  { id: 'armory', name: 'Armory', x: 680, y: -1664, w: 520, h: 484, focus: [930, -1430] },
  { id: 'hall', name: 'Hall', x: 0, y: -1144, w: 1200, h: 624, focus: [545, -830] },
  { id: 'stable', name: 'Stable', x: 0, y: -484, w: 640, h: 484, focus: [250, -230] },
  { id: 'brewery', name: 'Brewing', x: 664, y: -484, w: 536, h: 484, focus: [930, -230] },
  { id: 'cellar', name: 'The Barrow', x: 0, y: 36, w: 1200, h: 464, focus: [420, 300] },
  { id: 'yard', name: 'Ride out', x: -900, y: -520, w: 872, h: 520, focus: [-320, -210], sign: [-210, -250] },
];

/** the things you tap: each one opens what used to be a button */
export const THINGS: ThingDef[] = [
  { id: 'barrow', room: 'cellar', label: 'The door to the Barrow: dungeons', action: 'dungeons', sprite: 'barrow_door', x: 300, y: 444 },
  { id: 'signpost', room: 'yard', label: 'Ride out to the Vale', action: 'ride', sprite: 'signpost', x: -270, y: 0, k: 1.3 },
  { id: 'armour', room: 'armory', label: 'The armour stand: your gear', action: 'gear', sprite: 'armor_stand', x: 800, y: -1210 },
  { id: 'lectern', room: 'loft', label: 'The big book: your collection log', action: 'logs', sprite: 'lectern', x: 600, y: -1726 },
  { id: 'cauldron', room: 'brewery', label: 'The cauldron: brew', action: 'brew', sprite: 'cauldron', x: 960, y: -22, k: 0.9 },
  { id: 'larder', room: 'brewery', label: 'The larder: your satchel', action: 'satchel', sprite: 'larder', x: 790, y: -56 },
];

/** Every spot in the house. The order matters: something new goes to the first free spot of its kind.
 *  The first eight are the hearth's original spots, and their ids never change (saves point at them). */
export const HOUSE_SPOTS: HouseSpot[] = [
  { id: 'pet.fire', kind: 'pet', label: 'By the fire', room: 'hall', x: 822, y: -556 },
  { id: 'pet.rug', kind: 'pet', label: 'On the rug', room: 'hall', x: 690, y: -538, flip: true },
  { id: 'mount.stall', kind: 'mount', label: 'The stall', room: 'stable', x: 420, y: -24 },
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
  { id: 'mount.yard', kind: 'mount', label: 'The yard', room: 'yard', x: -560, y: -4 },
];

/** two shelves of four trophies on one side of the loft, the lower shelf first */
function shelf(xs: number[], n0: number): HouseSpot[] {
  const out: HouseSpot[] = [];
  [-1880, -2010].forEach((y, row) => xs.forEach((x, i) => {
    const n = n0 + row * 4 + i + 1;
    out.push({ id: `loft.${n}`, kind: 'trophy', label: `Loft shelf ${n}`, room: 'loft', x, y });
  }));
  return out;
}

/** where your other heroes stand in the bunk room, by their beds */
export const BUNK_SLOTS: [number, number][] = [[64, -1196], [164, -1192], [264, -1196], [364, -1192], [462, -1196]];

/** The room a point falls in, for zooming in on whatever you tap from far away. */
export function roomAt(x: number, y: number): RoomDef | null {
  for (const r of ROOMS) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h + 60) return r;
  return null;
}
