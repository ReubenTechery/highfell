/**
 * Toadstool Workshop, the house look for finishing Thimblebriar Hollow's collection log: the gnomes' burrow of
 * mushrooms and brass. Planks in the Hollow's warm wood with moss along the floors, brass round the windows,
 * cogs and pipes on the walls, toadstool lamps glowing orange, a brass hood over the fire, and the gnomes'
 * clutter (springs, jars, little clocks) between the trophies; the cellar is dug earth, roots and glowcaps.
 * Gilded (the heroic log's): the brass and the caps turn gold, and every toadstool is lit, the wild ones too.
 * With every room in it, the frame turns to dark timber under a turf roof (WS_FRAME, in houseart.ts's FRAMES).
 * Same rules as the other looks: one black line, flat colour, gradients only for light. houseart.ts passes in
 * the furniture every look keeps in its place (the kit), so nothing you tap moves.
 */
import { FLOORS, HOUSE_W as W } from '../content/house';
import { placeSprite, type Bit } from './art';
import type { Kit, RoomArt } from './houseart';
import { L, P } from './valeart';

const K = '#1E1A1A';
const f = (n: number): string => (Math.round(n * 10) / 10).toString();
/* the same small drawing helpers as houseart.ts */
const R = (x: number, y: number, w: number, h: number, fill: string, sw = 4): string => P(`M${f(x)} ${f(y)} h${f(w)} v${f(h)} h${f(-w)} Z`, fill, sw);
const C = (x: number, y: number, r: number, fill: string, w = 4): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="fill: ${fill}${w ? `; stroke: ${K}; stroke-width: ${w}` : ''}"/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, w = 3): string => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" style="fill: ${fill}${w ? `; stroke: ${K}; stroke-width: ${w}` : ''}"/>`;
const glow = (x: number, y: number, r: number, id: string, op = 1): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="fill: url(#${id}); fill-opacity: ${+Math.min(1, op).toFixed(2)}; pointer-events: none"/>`;
const beam = (d: string, col: string, w = 5): string => L(d, K, w + 5) + L(d, col, w);
const rad = (deg: number): number => (deg * Math.PI) / 180;

/** the Hollow's own colours (its dungeon's walls and floors): warm planks, a dark skirting, moss, dug earth */
const WS = {
  wall: '#7A5234', seam: '#593A22', skirt: '#593A22', floor: '#8A5A34', floorLine: '#6B4528', shelf: '#A0703F',
  earth: '#6E4A33', earthBand: '#64432E', earthLine: '#4B311E', earthFloor: '#4B311E', pebble: '#A08A72', root: '#A57E58',
  moss: '#68B85E', mossDark: '#4E8A3E', stem: '#F0E8D2', gills: '#D8CDB0', lit: '#FFE08A', bulb: '#FFF3C4',
  hole: '#3A2618', glass: '#C9D2DC', steel: '#9AA7B8', copper: '#D9823C', face: '#FFF8EC',
};
/** with every room in the Workshop, the frame: dark timber, a turf roof, a chimney of field stone */
export const WS_FRAME = { trim: '#D9A520', timber: '#5A3A22', beam: '#4B311E', stone: '#8E7A66', stoneLine: '#715F4E', roof: '#6E9A52', roofLine: '#4E7A3E', stairs: '#7A5234' };

/** what changes between the Workshop and its gilded version (the heroic log's): the brass, the caps, and
 *  which toadstools are lit and how bright */
export interface WorkshopLook {
  brass: string; shine: string; shade: string;
  cap: string; capShade: string; spot: string; fungus: string;
  /** a lamp's glow (a gradient in houseDefs) and how bright; allLit: the wild toadstools glow as well */
  lamp: string; burn: number; allLit: boolean;
}
export const WS_PLAIN: WorkshopLook = { brass: '#D9A520', shine: '#F2C230', shade: '#B0841A', cap: '#C8403F', capShade: '#9E2F2E', spot: '#FFF6D0', fungus: '#D98A3A', lamp: 'h-fire', burn: 1, allLit: false };
export const WS_GILT: WorkshopLook = { brass: '#F2C230', shine: '#FFF3C4', shade: '#D9A520', cap: '#F2C230', capShade: '#D9A520', spot: '#FFF6D0', fungus: '#F2C230', lamp: 'h-warm', burn: 1.35, allLit: true };

/* ---------------------------------------------------------------- walls and floors */
/** the planks' rows, and where each row's boards butt together: a pattern that never quite repeats */
const ROW = 52;
function joints(row: number, x0: number, x1: number): number[] {
  const out: number[] = [];
  for (let x = x0 + 50 + ((row * 137 + 61) % 190); x < x1 - 40; x += 210 + ((row * 89 + x) % 130)) out.push(x);
  return out;
}
/** warm planks on a back wall, from (x0, y0) down to (x1, y1) */
function planks(x0: number, y0: number, x1: number, y1: number, joins = true): string {
  const o = [R(x0, y0, x1 - x0, y1 - y0, WS.wall, 0)];
  for (let y = y0, i = 0; y < y1; y += ROW, i++) {
    if (i) o.push(L(`M${f(x0)} ${y} H${f(x1)}`, WS.seam, 3));
    if (joins) for (const x of joints(i, x0, x1)) o.push(L(`M${x} ${y} V${Math.min(y1, y + ROW)}`, WS.seam, 3));
  }
  return o.join('');
}
/** planks up the loft's gable, cut to its slope */
function gablePlanks(k: Kit): string {
  const { eave, peak } = k.GABLE;
  const half = (y: number): number => (y >= eave ? W / 2 : Math.max(0, ((y - peak) / (eave - peak)) * (W / 2)));
  const o = [k.gable(WS.wall)];
  for (let y = k.LW, i = 0; y > peak + 24; y -= ROW, i++) {
    const top = y - ROW, h = half(top);
    if (i) o.push(L(`M${f(W / 2 - half(y))} ${y} H${f(W / 2 + half(y))}`, WS.seam, 3));
    for (const x of joints(i, 0, W)) if (x > W / 2 - h + 16 && x < W / 2 + h - 16) o.push(L(`M${x} ${top} V${y}`, WS.seam, 3));
  }
  return o.join('');
}
/** a clump of moss sitting on the floor at (x, y) */
function mossClump(x: number, y: number, w: number, h: number): string {
  return P(`M${f(x - w / 2)} ${y} C${f(x - w / 2)} ${f(y - h * 0.8)} ${f(x - w * 0.32)} ${f(y - h * 1.05)} ${f(x - w * 0.14)} ${f(y - h * 0.78)} C${f(x - w * 0.04)} ${f(y - h * 1.3)} ${f(x + w * 0.28)} ${f(y - h * 1.28)} ${f(x + w * 0.3)} ${f(y - h * 0.72)} C${f(x + w * 0.42)} ${f(y - h * 0.92)} ${f(x + w / 2)} ${f(y - h * 0.62)} ${f(x + w / 2)} ${y} Z`, WS.moss, 3)
    + L(`M${f(x - w * 0.1)} ${f(y - h * 0.5)} C${f(x - w * 0.02)} ${f(y - h * 0.82)} ${f(x + w * 0.12)} ${f(y - h * 0.86)} ${f(x + w * 0.2)} ${f(y - h * 0.6)}`, WS.mossDark, 2.5);
}
/** the dark skirting along the bottom of a wall, and moss growing along it here and there */
function skirting(x0: number, x1: number, bottom: number, seed: number): string {
  const o = [R(x0, bottom - 30, x1 - x0, 30, WS.skirt, 0), L(`M${x0} ${bottom - 30} H${x1}`, K, 3.5)];
  for (let x = x0 + 40 + ((seed * 53) % 90), i = 0; x < x1 - 30; x += 150 + ((seed * 31 + i * 67) % 120), i++) {
    o.push(mossClump(x, bottom, 46 + ((seed + i * 29) % 44), 14 + ((seed + i * 7) % 9)));
  }
  return o.join('');
}
/** a curved timber brace in a room's top corner at (x, y), so the room reads round like a burrow: `dir` is 1
 *  for a left corner, -1 for a right one */
function brace(x: number, y: number, dir: 1 | -1, c: WorkshopLook, r = 62): string {
  return P(`M${x} ${y} H${x + dir * r} A${r} ${r} 0 0 ${dir > 0 ? 0 : 1} ${x} ${y + r} Z`, WS.floorLine, 4) + C(x + dir * r * 0.17, y + r * 0.17, 4.5, c.brass, 2.5);
}
/** floorboards in front of a back wall */
function floorboards(x: number, w: number, floor: number, strip: number): string {
  const y = floor - strip, o = [R(x, y, w, strip, WS.floor, 0), L(`M${x} ${y + 28} H${x + w}`, WS.floorLine, 3)];
  for (let xx = x + 96; xx < x + w; xx += 190) o.push(L(`M${xx} ${y} V${y + 28}`, WS.floorLine, 3));
  for (let xx = x + 190; xx < x + w; xx += 190) o.push(L(`M${xx} ${y + 28} V${floor}`, WS.floorLine, 3));
  return o.join('') + L(`M${x} ${y} H${x + w}`, K, 3.5);
}

/* ---------------------------------------------------------------- brass */
const at = (x: number, y: number, a: number, r: number): string => `${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`;
/** an arc of a circle round (x, y), from one angle to another in degrees: for shine */
const arc = (x: number, y: number, r: number, a0: number, a1: number): string => `M${at(x, y, rad(a0), r)} A${f(r)} ${f(r)} 0 0 1 ${at(x, y, rad(a1), r)}`;
/** a cog: n chunky teeth round a rim, holes in a big one's web, the hub, and a shine on the rim */
function cog(x: number, y: number, r: number, n: number, c: WorkshopLook, turn = 0): string {
  const p = (Math.PI * 2) / n, r0 = r - (r < 26 ? r * 0.28 : Math.max(7, r * 0.22)), t = rad(turn);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = t + i * p;
    d += `${i ? 'L' : 'M'}${at(x, y, a - p * 0.28, r0)} L${at(x, y, a - p * 0.15, r)} L${at(x, y, a + p * 0.15, r)} L${at(x, y, a + p * 0.28, r0)} A${f(r0)} ${f(r0)} 0 0 1 ${at(x, y, a + p * 0.72, r0)} `;
  }
  const o = [P(d + 'Z', c.brass, r > 30 ? 4 : 3.5)];
  if (r >= 30) for (let i = 0; i < 4; i++) { const a = t + Math.PI / 4 + (i * Math.PI) / 2; o.push(C(x + Math.cos(a) * r0 * 0.6, y + Math.sin(a) * r0 * 0.6, r0 * 0.17, WS.hole, 3)); }
  o.push(C(x, y, r0 * 0.32, c.shade, r < 26 ? 2.6 : 3.5) + C(x, y, r0 * 0.12, WS.hole, 0));
  if (r >= 22) o.push(L(arc(x, y, r0 - 5, 196, 248), c.shine, 3));
  return o.join('');
}
/** a pipe along a path, and a collar where two lengths join, across a pipe that runs `dir` */
const pipe = (d: string, c: WorkshopLook, w = 12): string => beam(d, c.brass, w);
const collar = (x: number, y: number, c: WorkshopLook, dir: 'h' | 'v'): string => (dir === 'h' ? R(x - 5, y - 12, 10, 24, c.shade, 3) : R(x - 12, y - 5, 24, 10, c.shade, 3));
/** a pressure gauge: a brass rim, a face, its marks and a red needle */
function gauge(x: number, y: number, r: number, c: WorkshopLook, needle = -40): string {
  const o = [C(x, y, r, c.brass, 3.5), C(x, y, r - 5, WS.face, 2.5)];
  for (const a of [-150, -90, -30]) o.push(L(`M${at(x, y, rad(a), r - 9)} L${at(x, y, rad(a), r - 5)}`, K, 2.2));
  o.push(L(`M${x} ${y} L${at(x, y, rad(needle), r - 8)}`, '#C8403F', 3) + C(x, y, 2.6, K, 0));
  return o.join('');
}
/** a valve's wheel, red, on a pipe */
function valve(x: number, y: number, r: number): string {
  const ring = `M${f(x - r)} ${y} A${r} ${r} 0 1 1 ${f(x + r)} ${y} A${r} ${r} 0 1 1 ${f(x - r)} ${y} Z`;
  return beam(`M${f(x - r)} ${y} H${f(x + r)} M${x} ${f(y - r)} V${f(y + r)}`, '#9E2F2E', 3) + beam(ring, '#C8403F', 5) + C(x, y, 4, '#9E2F2E', 2.5);
}
/** rivets in a ring round (x, y): round a window, so it reads as a porthole, or round a sconce's plate */
function rivets(x: number, y: number, r: number, n: number, c: WorkshopLook): string {
  let o = '';
  for (let i = 0; i < n; i++) { const a = (i * Math.PI * 2) / n + Math.PI / n; o += C(x + Math.cos(a) * r, y + Math.sin(a) * r, 3.4, c.shine, 2); }
  return o;
}
/** a glint on gold: four points of light (the gilded Workshop's) */
const glint = (x: number, y: number, s: number): string => `<path d="M${x} ${f(y - s)} L${f(x + s * 0.22)} ${f(y - s * 0.22)} L${f(x + s)} ${y} L${f(x + s * 0.22)} ${f(y + s * 0.22)} L${x} ${f(y + s)} L${f(x - s * 0.22)} ${f(y + s * 0.22)} L${f(x - s)} ${y} L${f(x - s * 0.22)} ${f(y - s * 0.22)} Z" style="fill: #FFFFFF"/>`;

/* ---------------------------------------------------------------- toadstools */
/** a toadstool's cap, its rim at y (curving up a little in the middle), w each side, h tall: spots and a shine */
function cap(x: number, y: number, w: number, h: number, c: WorkshopLook): string {
  const d = `M${f(x - w)} ${f(y)} C${f(x - w)} ${f(y - h * 0.78)} ${f(x - w * 0.56)} ${f(y - h)} ${f(x)} ${f(y - h)} C${f(x + w * 0.56)} ${f(y - h)} ${f(x + w)} ${f(y - h * 0.78)} ${f(x + w)} ${f(y)} C${f(x + w * 0.52)} ${f(y - h * 0.2)} ${f(x - w * 0.52)} ${f(y - h * 0.2)} ${f(x - w)} ${f(y)} Z`;
  const big = w > 24, o = [P(d, c.cap, big ? 4 : 3.5)];
  for (const [sx, sy, sr] of [[-0.5, 0.36, 0.16], [0.08, 0.6, 0.15], [0.56, 0.32, 0.12], [-0.12, 0.3, 0.09]]) o.push(C(x + sx * w, y - sy * h, sr * w, c.spot, big ? 2.2 : 0));
  o.push(L(`M${f(x - w * 0.66)} ${f(y - h * 0.62)} C${f(x - w * 0.55)} ${f(y - h * 0.84)} ${f(x - w * 0.36)} ${f(y - h * 0.94)} ${f(x - w * 0.16)} ${f(y - h * 0.97)}`, '#FFFFFF', big ? 3 : 2.4));
  return o.join('');
}
/** gills under a cap whose rim is at y: cream, or glowing when lit */
const gills = (x: number, y: number, w: number, lit: boolean): string => E(x, y - w * 0.06, w * 0.84, Math.max(4, w * 0.2), lit ? WS.lit : WS.gills, 3);
/** a toadstool growing at (x, y): a cream stem h tall, the gills and the cap, w each side */
function shroom(x: number, y: number, h: number, w: number, c: WorkshopLook, lit: boolean, lean = 0, sw = Math.max(5, w * 0.24)): string {
  const top = y - h, tx = x + lean;
  const stem = `M${f(x - sw)} ${y} C${f(x - sw * 1.2)} ${f(y - h * 0.5)} ${f(tx - sw * 0.75)} ${f(top + h * 0.3)} ${f(tx - sw * 0.75)} ${f(top)} H${f(tx + sw * 0.75)} C${f(tx + sw * 0.75)} ${f(top + h * 0.3)} ${f(x + sw * 1.2)} ${f(y - h * 0.5)} ${f(x + sw)} ${y} Z`;
  return P(stem, WS.stem, 3.5) + gills(tx, top + 4, w, lit) + cap(tx, top + 4, w, w * 0.78, c);
}
/** a toadstool lamp standing on the floor at (x, y): a brass foot, a cream stem, the cap over a lit bulb */
function floorLamp(x: number, y: number, h: number, w: number, c: WorkshopLook): string {
  return P(`M${x - 24} ${y} C${x - 22} ${y - 14} ${x + 22} ${y - 14} ${x + 24} ${y} Z`, c.brass, 3.5) + L(`M${x - 14} ${y - 7} C${x - 8} ${y - 10} ${x - 2} ${y - 11} ${x + 4} ${y - 11}`, c.shine, 2.4)
    + shroom(x, y - 9, h - 9, w, c, true, 0, w * 0.3) + R(x - w * 0.3 - 3, y - h + 6, w * 0.6 + 6, 9, c.brass, 3);
}
/** a toadstool lamp hanging from a beam at `top`, its cap's rim at y */
function hangLamp(x: number, top: number, y: number, c: WorkshopLook): string {
  const w = 30, h = 30;
  return L(`M${x} ${top} V${y - h + 2}`, K, 3) + C(x, y - h + 1, 5, c.brass, 3)
    + C(x, y + 12, 9, WS.bulb, 3) + C(x, y + 13, 4, WS.lit, 0) + gills(x, y, w, true) + cap(x, y, w, h, c);
}
/** a small toadstool lamp on a brass bracket on the wall, its cap's rim at y: the Workshop's sconce, a round
 *  brass plate behind it to throw the light */
function sconce(x: number, y: number, c: WorkshopLook): string {
  const ledge = y + 34;
  return C(x, y + 4, 35, c.shade, 3.5) + C(x, y + 4, 26, WS.seam, 2.5) + rivets(x, y + 4, 30.5, 8, c) + R(x - 26, ledge, 52, 10, c.brass, 3.5)
    + P(`M${x - 10} ${ledge + 10} H${x + 10} L${x} ${ledge + 26} Z`, c.brass, 3)
    + P(`M${x - 8} ${ledge} V${y + 2} H${x + 8} V${ledge} Z`, WS.stem, 3) + gills(x, y, 28, true) + cap(x, y, 28, 26, c);
}
/** a clump of wild toadstools on the floor at x: one tall, two smaller, on a mound of moss */
function shroomClump(x: number, y: number, c: WorkshopLook, k = 1): string {
  return shroom(x - 30 * k, y, 46 * k, 22 * k, c, c.allLit, -4 * k) + shroom(x + 34 * k, y, 34 * k, 17 * k, c, c.allLit, 3 * k)
    + shroom(x, y, 74 * k, 30 * k, c, c.allLit) + mossClump(x, y + 2, 120 * k, 16 * k);
}

/* ---------------------------------------------------------------- the gnomes' clutter */
/** a round clock with two bells on top, standing on a shelf at y (or hung on the wall with `wall`) */
function clock(x: number, y: number, r: number, c: WorkshopLook, wall = false): string {
  const cy = wall ? y : y - r - 4, o: string[] = [];
  if (!wall) o.push(beam(`M${f(x - r * 0.55)} ${y} L${f(x - r * 0.4)} ${f(cy + r * 0.6)} M${f(x + r * 0.55)} ${y} L${f(x + r * 0.4)} ${f(cy + r * 0.6)}`, c.shade, 2.5));
  for (const s of [-1, 1]) o.push(P(`M${f(x + s * r * 0.98)} ${f(cy - r * 0.5)} A${f(r * 0.38)} ${f(r * 0.38)} 0 0 ${s < 0 ? 1 : 0} ${f(x + s * r * 0.36)} ${f(cy - r * 1.02)} Z`, c.brass, 2.6));
  o.push(C(x, cy, r, c.brass, 3.5) + C(x, cy, r * 0.74, WS.face, 2.5));
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; o.push(L(`M${at(x, cy, a, r * 0.56)} L${at(x, cy, a, r * 0.68)}`, K, 2.2)); }
  o.push(L(`M${x} ${f(cy)} V${f(cy - r * 0.5)} M${x} ${f(cy)} L${f(x + r * 0.36)} ${f(cy + r * 0.12)}`, K, 2.6) + C(x, cy, 2.4, K, 0));
  return o.join('');
}
/** a glass jar on a shelf at y, half full of something bright, a brass lid */
function jar(x: number, y: number, w: number, h: number, fill: string, c: WorkshopLook): string {
  const body = `M${f(x - w / 2)} ${f(y - h + 8)} V${f(y - 6)} C${f(x - w / 2)} ${y} ${f(x + w / 2)} ${y} ${f(x + w / 2)} ${f(y - 6)} V${f(y - h + 8)} Z`;
  return P(body, WS.glass, 3) + P(`M${f(x - w / 2 + 4)} ${f(y - h * 0.5)} H${f(x + w / 2 - 4)} V${f(y - 7)} C${f(x + w / 2 - 4)} ${f(y - 3)} ${f(x - w / 2 + 4)} ${f(y - 3)} ${f(x - w / 2 + 4)} ${f(y - 7)} Z`, fill, 0)
    + L(`M${f(x - w / 2 + 6)} ${f(y - h + 14)} V${f(y - h * 0.55)}`, '#FFFFFF', 2.4) + R(x - w / 2 - 2, y - h, w + 4, 9, c.brass, 3);
}
/** a coiled spring standing on a shelf at y, `turns` coils tall */
function spring(x: number, y: number, turns: number): string {
  let d = `M${x - 9} ${y - 3} H${x + 9}`;
  for (let i = 0; i < turns * 2; i++) d += ` L${i % 2 ? x + 9 : x - 9} ${y - 12 - i * 9}`;
  return beam(d + ` H${(turns * 2) % 2 ? x - 9 : x + 9}`, WS.steel, 3);
}
/** a little oil can with a long spout, on a shelf at y */
function oilCan(x: number, y: number, c: WorkshopLook): string {
  return beam(`M${x + 6} ${y - 22} L${x + 30} ${y - 40}`, c.shade, 3) + P(`M${x - 14} ${y} L${x - 11} ${y - 22} H${x + 11} L${x + 14} ${y} Z`, '#C8403F', 3)
    + P(`M${x - 9} ${y - 22} C${x - 8} ${y - 32} ${x + 8} ${y - 32} ${x + 9} ${y - 22} Z`, c.brass, 3);
}
/** the brewing room's boiler where the tavern keeps its barrels: copper on short legs, brass bands, a gauge,
 *  a valve, and its pipe up into the ceiling */
function boiler(x: number, y: number, ceiling: number, c: WorkshopLook): string {
  const top = y - 190, o: string[] = [];
  o.push(pipe(`M${x + 18} ${top + 6} V${top - 44} C${x + 18} ${top - 70} ${x + 46} ${top - 66} ${x + 46} ${top - 92} V${ceiling}`, c));
  o.push(collar(x + 18, top - 22, c, 'v') + collar(x + 46, top - 150, c, 'v'));
  for (const s of [-1, 1]) o.push(R(x + s * 34 - 6, y - 26, 12, 26, WS.hole, 3));
  o.push(P(`M${x - 50} ${y - 22} V${top + 46} C${x - 50} ${top - 4} ${x + 50} ${top - 4} ${x + 50} ${top + 46} V${y - 22} C${x + 50} ${y - 14} ${x - 50} ${y - 14} ${x - 50} ${y - 22} Z`, WS.copper, 4.5));
  o.push(L(`M${x - 34} ${top + 30} C${x - 30} ${top + 18} ${x - 22} ${top + 12} ${x - 12} ${top + 9}`, '#F2A66A', 4));
  for (const yy of [top + 60, y - 48]) o.push(R(x - 52, yy - 7, 104, 14, c.brass, 3.5));
  o.push(gauge(x - 4, top + 106, 20, c, -60) + valve(x + 28, y - 76, 13));
  // the whistle the steam comes out of (steam)
  o.push(R(x - 25, top - 8, 14, 22, c.brass, 3) + R(x - 28, top - 14, 20, 8, c.shade, 3));
  return o.join('');
}
/** steam from the boiler's whistle at (x, y): puffs climbing and fading, four frames taking turns on the
 *  chimney smoke's beat (styles.css: smoke), each with every puff a quarter of the way on to the next */
function steam(x: number, y: number): Bit[] {
  const n = 3, frames = 4;
  // a puff s of the way up: just out of the whistle at 0, gone at 1
  const puff = (s: number): { x: number; y: number; r: number; o: number } => ({ x: x + 16 * s + 4 * Math.sin(s * 2 * Math.PI), y: y - 6 - 86 * s, r: 6 + 11 * s, o: 0.9 * Math.pow(1 - s, 0.8) });
  const all = Array.from({ length: n * frames }, (_, i) => puff(i / (n * frames)));
  const x0 = Math.min(...all.map((p) => p.x - p.r)) - 3, x1 = Math.max(...all.map((p) => p.x + p.r)) + 3;
  const y0 = Math.min(...all.map((p) => p.y - p.r)) - 3, y1 = Math.max(...all.map((p) => p.y + p.r)) + 3;
  return Array.from({ length: frames }, (_, k) => ({
    box: [x0, y0, x1 - x0, y1 - y0],
    body: Array.from({ length: n }, (_, i) => all[i * frames + k]).map((p) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" style="fill: #F3EEF6; stroke: ${K}; stroke-width: 3; opacity: ${f(p.o)}"/>`).join(''),
    cls: `smoke s${k}`,
  }));
}
/** the scrap heap in the cellar where the other looks keep bones, between the last arch and the stairs: a crate
 *  of old cogs, one on top, a spring */
function scrap(x: number, y: number, c: WorkshopLook): string {
  return R(x - 22, y - 40, 46, 40, WS.shelf, 3.5) + L(`M${x - 22} ${y - 20} H${x + 24}`, '#7A5234', 3)
    + cog(x - 2, y - 56, 19, 7, c, 5) + spring(x + 16, y - 40, 2) + cog(x - 20, y - 8, 12, 6, c, 20);
}

/* ---------------------------------------------------------------- the cellar: dug earth */
/** a wavy line across the earth, for the edges of its bands */
const wave = (x0: number, x1: number, y: number, a: number): string => `M${x0} ${y} C${x0 + 260} ${y - a} ${x0 + 520} ${y + a} ${x0 + 760} ${y} C${x0 + 960} ${y - a} ${x1 - 120} ${y + a} ${x1} ${y - a / 2}`;
/** a stone half sunk in the earth, with a lighter top */
function stone(x: number, y: number, w: number, h: number): string {
  const pt = (dx: number, dy: number): string => `${f(x + dx * w)} ${f(y + dy * h)}`;
  return P(`M${pt(-1, 0.3)} C${pt(-1, -0.7)} ${pt(-0.4, -1)} ${pt(0.1, -1)} C${pt(0.7, -1)} ${pt(1, -0.5)} ${pt(1, 0.2)} C${pt(0.6, 1)} ${pt(-0.6, 1)} ${pt(-1, 0.3)} Z`, WS.pebble, 3)
    + L(`M${pt(-0.6, -0.35)} C${pt(-0.5, -0.75)} ${pt(-0.1, -0.8)} ${pt(0.3, -0.72)}`, '#C2AE96', 3);
}
/** dug earth in bands, stones in it, roots hanging from above, and bracket fungi growing out of it */
function earth(x0: number, y0: number, x1: number, y1: number, c: WorkshopLook): string {
  const o = [R(x0, y0, x1 - x0, y1 - y0, WS.earth, 0)];
  for (const [y, a] of [[150, 10], [300, -8]]) o.push(P(`${wave(x0, x1, y, a)} V${y + 56} C${x1 - 200} ${y + 60 + a} ${x0 + 600} ${y + 48 - a} ${x0} ${y + 56} Z`, WS.earthBand, 0));
  for (const [y, a] of [[150, 10], [204, -6], [300, -8], [354, 6]]) o.push(L(wave(x0, x1, y, a), WS.earthLine, 3));
  for (const [x, y, w, h] of [[56, 120, 20, 13], [532, 104, 16, 10], [1010, 128, 18, 12], [36, 330, 16, 11], [700, 268, 22, 13], [1120, 300, 15, 10], [484, 400, 14, 9]]) o.push(stone(x, y, w, h));
  // roots from the ceiling, pale where the earth fell away from them
  for (const [x, len, s] of [[180, 74, 1], [560, 56, -1], [890, 84, 1], [1120, 50, -1]]) {
    o.push(beam(`M${x - 3} ${y0 + len * 0.45} C${x - s * 12} ${y0 + len * 0.55} ${x - s * 18} ${y0 + len * 0.68} ${x - s * 20} ${y0 + len * 0.82}`, WS.root, 3));
    o.push(P(`M${x - 11} ${y0} C${x - 10} ${y0 + len * 0.4} ${x + s * 14} ${y0 + len * 0.6} ${x + s * 4} ${y0 + len} C${x + s * 10} ${y0 + len * 0.6} ${x + 3} ${y0 + len * 0.4} ${x + 11} ${y0} Z`, WS.root, 3));
  }
  // (the middle one over the gap between the second door and the third: the Hall of Doors, halldoors.ts)
  for (const [x, y, k] of [[66, 236, 1], [536, 150, 0.85], [1000, 236, 0.9]]) o.push(bracket(x, y, k, c));
  return o.join('');
}
/** bracket fungi, a little stack of them, growing out of a wall at (x, y): caps with no stems */
function bracket(x: number, y: number, k: number, c: WorkshopLook): string {
  let o = '';
  for (const [dx, dy, w] of [[-4, 0, 24], [10, -24, 17], [-8, 24, 14]]) {
    const cx = x + dx * k, cy = y + dy * k, ww = w * k, hh = w * 0.62 * k;
    o += E(cx, cy, ww * 0.82, Math.max(3.5, ww * 0.2), WS.gills, 2.6)
      + P(`M${f(cx - ww)} ${f(cy)} C${f(cx - ww)} ${f(cy - hh)} ${f(cx + ww)} ${f(cy - hh)} ${f(cx + ww)} ${f(cy)} C${f(cx + ww * 0.5)} ${f(cy - hh * 0.2)} ${f(cx - ww * 0.5)} ${f(cy - hh * 0.2)} ${f(cx - ww)} ${f(cy)} Z`, c.fungus, 3)
      + L(`M${f(cx - ww * 0.55)} ${f(cy - hh * 0.3)} C${f(cx - ww * 0.3)} ${f(cy - hh * 0.55)} ${f(cx + ww * 0.3)} ${f(cy - hh * 0.55)} ${f(cx + ww * 0.55)} ${f(cy - hh * 0.3)}`, '#F2C48A', 2.4);
  }
  return o;
}
/** the cellar's floor: packed earth with a few flat stones in it */
function earthFloor(x: number, w: number, floor: number, strip: number): string {
  const y = floor - strip, o = [R(x, y, w, strip, WS.earthFloor, 0)];
  for (const [sx, sw] of [[200, 64], [560, 50], [760, 72]]) o.push(P(`M${x + sx} ${y + 34} C${x + sx + 6} ${y + 24} ${x + sx + sw - 6} ${y + 24} ${x + sx + sw} ${y + 34} Z`, '#6E5440', 2.5));
  return o.join('') + L(`M${x} ${y} H${x + w}`, K, 3.5);
}
/** spores drifting in the cellar's glowcap light, each blinking on its own beat (styles.css: firefly) */
function spores(): Bit[] {
  return ([[150, 330], [470, 210], [760, 150], [1000, 260]] as [number, number][]).map(([x, y], i) => ({ box: [x - 30, y - 30, 60, 60], body: glow(x, y, 30, 'h-fly') + C(x, y, 5, '#E9FFD9', 0), cls: `firefly f${i % 3}` }));
}

/* ---------------------------------------------------------------- the rooms */
/** the Workshop's rooms, plain or gilded */
export function workshop(c: WorkshopLook, k: Kit): Record<string, RoomArt> {
  const { LW, UP, UW, HC, HW, GC, GW, CC, CW, STRIP } = k;
  /** a lamp's glow: orange; gilded, gold, bigger and brighter */
  const lamp = (x: number, y: number, r: number, op: number): string => glow(x, y, r * (c.allLit ? 1.15 : 1), c.lamp, op * c.burn);
  /** the wild toadstools' glow, only when every one is lit */
  const wild = (x: number, y: number, r: number): string => (c.allLit ? glow(x, y, r, c.lamp, 0.9) : '');
  const sparkle = (pts: [number, number, number][]): string => (c.allLit ? pts.map(([x, y, s]) => glint(x, y, s)).join('') : '');
  return {
    loft: {
      wall: () => gablePlanks(k) + skirting(0, W, LW, 3) + floorboards(0, W, FLOORS.loft, STRIP),
      // the trophy shelves with the gnomes' clutter in the gaps between the trophies' spots (content/house.ts), rivets
      // round the round windows (houseart.ts: WINDOWS) to make portholes, a toadstool cushion, lamps by the big book
      furnish: () => k.shelves(WS.shelf, c.brass)
        + jar(150, -1880, 22, 34, '#9BE15D', c) + spring(350, -1880, 3) + oilCan(450, -1880, c)
        + clock(150, -2010, 15, c) + jar(252, -2010, 20, 30, '#F4B942', c) + spring(450, -2010, 2)
        + clock(746, -1880, 14, c) + jar(950, -1880, 22, 32, '#FF7AE6', c) + cog(1136, -1890, 13, 6, c, 15)
        + spring(852, -2010, 2) + jar(1050, -2010, 20, 30, '#8FD6FF', c)
        + rivets(330, -2190, 41, 10, c) + rivets(870, -2190, 41, 10, c)
        + k.cushion(c.capShade, c.cap) + E(222, -1730, 9, 4.5, c.spot, 0) + E(256, -1736, 7, 3.5, c.spot, 0) + E(286, -1728, 8, 4, c.spot, 0)
        + floorLamp(452, FLOORS.loft - 22, 84, 32, c) + floorLamp(748, FLOORS.loft - 22, 84, 32, c),
      light: () => lamp(600, -1960, 640, 0.3) + lamp(452, -1786, 150, 0.9) + lamp(748, -1786, 150, 0.9),
    },
    bunks: {
      wall: () => planks(0, UP, 520, UW) + skirting(0, 520, UW, 5) + floorboards(0, 520, FLOORS.upper, STRIP),
      // a toadstool lamp over the bunks, a clock on the wall, cogs in the corner
      furnish: () => brace(0, UP, 1, c) + brace(520, UP, -1, c) + k.bunks() + cog(52, -1606, 34, 9, c, 8) + cog(104, -1636, 20, 7, c, 0) + clock(470, -1598, 24, c, true) + hangLamp(260, UP, -1606, c),
      light: () => lamp(260, -1500, 380, 0.62),
    },
    armory: {
      wall: () => planks(680, UP, W, UW) + skirting(680, W, UW, 9) + floorboards(680, 520, FLOORS.upper, STRIP),
      // cogs over the armour, a toadstool lamp between it and the rack
      furnish: () => brace(680, UP, 1, c) + brace(W, UP, -1, c) + cog(746, -1580, 46, 10, c, 4) + cog(814, -1626, 26, 8, c, 10) + placeSprite('weapon_rack', 1062, UW) + floorLamp(921, UW, 126, 40, c)
        + sparkle([[722, -1610, 9]]),
      light: () => lamp(921, -1350, 300, 0.7) + lamp(920, -1430, 380, 0.3),
    },
    hall: {
      wall: () => planks(0, HC, W, HW) + skirting(0, W, HW, 7) + floorboards(0, W, FLOORS.hall, STRIP),
      // the fire under its brass hood, toadstool sconces where the torches are, wild toadstools where the logs are
      furnish: () => brace(0, HC, 1, c, 80) + brace(W, HC, -1, c, 80) + k.hearthFire() + hood(c, HC) + [384, 816].map((x) => sconce(x, -900, c)).join('') + k.hallFurniture()
        + shroomClump(140, FLOORS.hall - 26, c) + cog(894, -884, 40, 10, c, 6) + cog(942, -834, 22, 7, c, 14),
      light: () => glow(600, -760, 760 * (c.allLit ? 1.12 : 1), 'h-fire') + [384, 816].map((x) => lamp(x, -900, 120, 0.9)).join('') + wild(140, -620, 110),
      bits: () => k.fireBits('fire'),
    },
    brewery: {
      wall: () => planks(0, GC, W, GW) + skirting(0, W, GW, 11) + floorboards(0, 1060, FLOORS.ground, STRIP),
      // the bench under the drying herbs, the boiler where the barrels were, the lamp over the cauldron
      furnish: () => brace(0, GC, 1, c) + k.brewLeft(c.brass, false) + boiler(118, FLOORS.ground - 30, GC, c) + cog(742, -404, 36, 9, c, 3) + cog(800, -448, 22, 7, c, 9)
        + hangLamp(930, GC, -420, c) + k.barnDoor(),
      light: () => lamp(470, -240, 380, 0.42) + lamp(930, -330, 380, 0.6) + glow(960, -60, 160, 'h-green', 0.6),
      bits: () => steam(100, FLOORS.ground - 30 - 206),
    },
    cellar: {
      wall: () => earth(0, CC, W, CW, c) + earthFloor(0, W, FLOORS.cellar, STRIP),
      // pipes under the ceiling, glowcaps where the candles are, a scrap heap where the bones are, and a lamp hung
      // between the last door and the stairs (the doors are the Hall of Doors: halldoors.ts)
      furnish: () => pipe(`M0 ${CC + 40} H${W - 210} C${W - 180} ${CC + 40} ${W - 170} ${CC + 50} ${W - 170} ${CC + 80} V${CC + 110}`, c) + valve(W - 170, CC + 110, 16)
        + collar(320, CC + 40, c, 'h') + collar(760, CC + 40, c, 'h')
        + placeSprite('node_glowcap', 70, FLOORS.cellar - 28, { k: 0.82 }) + scrap(924, FLOORS.cellar - 22, c) + hangLamp(850, CC, 140, c),
      light: () => glow(70, 440, 130, 'h-fly', 0.9) + lamp(850, 190, 250, 0.7),
      bits: () => spores(),
    },
  };
}

/** the hall's brass hood over the fire, on the mantel: planks where the stone chimney breast was, a pipe
 *  along under the ceiling, the hood's lip, its funnel with a gauge, and the flue up into the ceiling. Drawn
 *  to the fireplace's own lines (houseart.ts: hearthFire, the sprite at 0.92): its breast runs 462 to 738
 *  across and up from the mantel, whose top is at -835 */
function hood(c: WorkshopLook, ceiling: number): string {
  const o = [planks(458, ceiling, 742, -836, false)];
  // a brass pipe under the ceiling, into the flue from each side
  o.push(pipe(`M0 ${ceiling + 26} H${W}`, c) + [150, 350, 850, 1050].map((x) => collar(x, ceiling + 26, c, 'h')).join(''));
  o.push(R(556, ceiling - 2, 88, -1040 - ceiling + 2, c.brass, 4) + L(`M572 ${ceiling + 6} V-1046`, c.shine, 4));
  for (const y of [-1100, -1066]) o.push(R(550, y - 6, 100, 12, c.shade, 3.5));
  o.push(P('M448 -856 C474 -926 532 -982 548 -1036 H652 C668 -982 726 -926 752 -856 Z', c.brass, 4.5));
  o.push(L('M478 -870 C500 -920 530 -960 552 -1000', c.shine, 4));
  o.push(R(540, -1050, 120, 16, c.shade, 4));
  o.push(R(434, -862, 332, 24, c.brass, 4));
  for (let x = 452; x <= 750; x += 37) o.push(C(x, -850, 3.6, c.shine, 2));
  o.push(gauge(600, -930, 26, c));
  if (c.allLit) o.push(glint(520, -900, 11) + glint(690, -1010, 8));
  return o.join('');
}
