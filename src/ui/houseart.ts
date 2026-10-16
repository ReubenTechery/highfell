/**
 * The house, drawn in code in the house style (one black line, flat colour, gradients only for light):
 * the dusk outside, the frame (beams, chimney, stairs, roof), and every room in its look. A look
 * reskins a room's walls, floor, furniture and light; what you put in the house and what you can tap
 * stay where they are. The tavern is wood, plaster and lamplight. Barrow Hall is the Barrow's own brick,
 * flagstones, bone niches and the Gravekeeper's green fire (gilded, from the heroic log: gold bones, gold
 * trim and lanterns, the green burning higher), and with every room in it the frame turns to stone and
 * slate too. Toadstool Workshop, Thimblebriar Hollow's, is drawn in houseworkshop.ts from the kit at the
 * end of this file. Outside: the garden's yard on the left, the paddock's field and fences on the right (a
 * look never goes outside). What you can tap, and what it does, lives in the scene (hearth.ts) and the
 * house's plan (content/house.ts). House units: x across, y down, the ground floor's floor at y = 0.
 * What moves (the fire, the smoke, the birds, the fireflies, the wisps) is drawn as bits (houseBits), so the
 * house never redraws for it. See-through shapes use fill-opacity, not opacity, which would make the browser
 * draw each one apart.
 */
import { FLOORS, HOUSE_W, LOOK_ROOMS, PADDOCK } from '../content/house';
import { placeSprite, spriteBit, type Bit } from './art';
import { WS_FRAME, WS_GILT, WS_PLAIN, workshop } from './houseworkshop';
import { L, P, SKY_STOPS, cloud, house as cottage, tree } from './valeart';

const K = '#1E1A1A';
const f = (n: number): string => (Math.round(n * 10) / 10).toString();
const R = (x: number, y: number, w: number, h: number, fill: string, sw = 4): string => P(`M${f(x)} ${f(y)} h${f(w)} v${f(h)} h${f(-w)} Z`, fill, sw);
const F = (d: string, fill: string): string => `<path d="${d}" style="fill: ${fill}"/>`;
const C = (x: number, y: number, r: number, fill: string, w = 4): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="fill: ${fill}${w ? `; stroke: ${K}; stroke-width: ${w}` : ''}"/>`;
const glow = (x: number, y: number, r: number, id: string, op = 1): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="fill: url(#${id}); fill-opacity: ${op}; pointer-events: none"/>`;
/** a line with an ink edge, like a beam or a mullion */
const beam = (d: string, col: string, w = 5): string => L(d, K, w + 5) + L(d, col, w);
function rnd(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** where the view may go, in house units: left, top, right, bottom */
export const HOUSE_BOUNDS: [number, number, number, number] = [-1100, -2900, 2500, 1060];
/** the whole house, for the zoomed-out view */
export const HOUSE_FIT: [number, number, number, number] = [-440, -2640, 1640, 560];
/** which look each room is drawn in, by room id */
export type LookAt = (room: string) => string;

const WALL = 28, BEAM = 36, STRIP = 56;
const W = HOUSE_W;
/** the tavern look: the colours of each room's walls and floors, and of the house's frame */
const T = {
  trim: '#8A5A34', timber: '#6B4528', beam: '#5E3B22', floor: '#A0703F', board: '#86592F',
  plaster: '#D9C29A', panel: '#E3CEA6', wains: '#8A5A34', wainsLine: '#6B4528',
  loft: '#C9A27A', loftLine: '#B38A62', bunks: '#D3BC93', armory: '#B3ADB8', armoryLine: '#9D97A6',
  brewery: '#CFC49A', cellar: '#7E7390', cellarLine: '#6A5F7E', cellarFloor: '#5E5470',
  stone: '#7A6E86', stoneLine: '#665A72', roof: '#B3553F', roofLine: '#8E3F2E', stairs: '#8A5A34',
};
/** Barrow Hall: the Barrow's brick and flagstones (its dungeon's colours), bone, and slate for the roof */
const B = {
  wall: '#5C5070', line: '#463C5A', panel: '#4F4468', band: '#4A4060', niche: '#2A2234',
  floor: '#4A4060', joint: '#3A3150', trim: '#D8CDB0', bone: '#F0E8D2', cushion: '#4F3780', cushionTop: '#6A4BA3',
  timber: '#4A4060', beam: '#3A3150', stone: '#6E6382', stoneLine: '#5C5070', roof: '#4F4A63', roofLine: '#3E3A50', stairs: '#6E6382',
};
/** the frame's colours: beams, outer walls, chimney, stairs and roof */
type Frame = Pick<typeof T, 'trim' | 'timber' | 'beam' | 'stone' | 'stoneLine' | 'roof' | 'roofLine' | 'stairs'>;
const FRAMES: Record<string, Frame> = { tavern: T, barrow: B, 'barrow-gilded': { ...B, trim: '#D9A520' }, workshop: WS_FRAME, 'workshop-gilded': { ...WS_FRAME, trim: WS_GILT.brass } };
/** the trim round a room's windows in each look */
const TRIM: Record<string, string> = { tavern: T.trim, barrow: B.trim, 'barrow-gilded': '#D9A520', workshop: WS_PLAIN.brass, 'workshop-gilded': WS_GILT.brass };
/** the frame follows the rooms when every one of them has the same look, and is the tavern's otherwise */
function frameOf(look: LookAt): Frame {
  const first = look(LOOK_ROOMS[0]);
  return LOOK_ROOMS.every((r) => look(r) === first) && FRAMES[first] ? FRAMES[first] : T;
}
/** the gable inside the loft, and the roof outside it */
const GABLE = { eave: -2090, peak: -2400 };
const ROOF = { x0: -120, y0: -2040, peak: -2480 };
/** each storey's back walls run from just under the beam above to the strip of floor at the bottom */
const at = (floor: number): number => floor - STRIP;
const LW = at(FLOORS.loft), UP = FLOORS.loft + BEAM, UW = at(FLOORS.upper), HC = FLOORS.upper + BEAM, HW = at(FLOORS.hall);
const GC = FLOORS.hall + BEAM, GW = at(FLOORS.ground), CC = FLOORS.ground + BEAM, CW = at(FLOORS.cellar);

const arch = (x: number, top: number, bot: number, w: number): string => `M${f(x - w / 2)} ${f(bot)} V${f(top + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w / 2)} ${f(top + w / 2)} V${f(bot)} Z`;
const disc = (x: number, y: number, r: number): string => `M${f(x - r)} ${f(y)} A${f(r)} ${f(r)} 0 1 1 ${f(x + r)} ${f(y)} A${f(r)} ${f(r)} 0 1 1 ${f(x - r)} ${f(y)} Z`;

/** The gradients, and the clip for the one window low enough to show the hill. Every layer of the house uses
 *  the same viewBox (HOUSE_BOUNDS), so h-sky, in user space, is the same sky in all of them. */
export function houseDefs(): string {
  return `<linearGradient id="h-sky" x1="0" y1="-3000" x2="0" y2="40" gradientUnits="userSpaceOnUse">${SKY_STOPS}</linearGradient>
    <radialGradient id="h-warm"><stop offset="0" stop-color="#FFC870" stop-opacity="0.42"/><stop offset="1" stop-color="#FFC870" stop-opacity="0"/></radialGradient>
    <radialGradient id="h-fire"><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.4"/><stop offset="0.55" stop-color="#FF8A4C" stop-opacity="0.12"/><stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/></radialGradient>
    <radialGradient id="h-green"><stop offset="0" stop-color="#9BE15D" stop-opacity="0.5"/><stop offset="1" stop-color="#9BE15D" stop-opacity="0"/></radialGradient>
    <radialGradient id="h-fly"><stop offset="0" stop-color="#F2FFB0" stop-opacity="0.8"/><stop offset="0.4" stop-color="#C8F27A" stop-opacity="0.3"/><stop offset="1" stop-color="#9BE15D" stop-opacity="0"/></radialGradient>
    <radialGradient id="h-gfire"><stop offset="0" stop-color="#9BE15D" stop-opacity="0.44"/><stop offset="0.55" stop-color="#9BE15D" stop-opacity="0.14"/><stop offset="1" stop-color="#9BE15D" stop-opacity="0"/></radialGradient>
    ${WINDOWS.filter((w) => w.low).map((w) => `<clipPath id="${w.id}"><path d="${w.d}"/></clipPath>`).join('')}`;
}

/** the stars over Highfell, in the sky and in any window they fall inside */
const STARS: { x: number; y: number; r: number; o: number }[] = (() => {
  const r = rnd(17);
  return Array.from({ length: 260 }, () => ({ x: -3200 + r() * 7600, y: -3500 + r() * 2000, r: 2 + r() * 3, o: 0.4 + r() * 0.6 }));
})();
const star = (s: { x: number; y: number; r: number; o: number }): string => `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.r)}" style="fill: #FFF3C4; fill-opacity: ${f(s.o)}"/>`;
/** the far hills, behind the house and through the brewing room's window */
const BACK_HILL = 'M-3400 -150 C-2600 -300 -2100 -120 -1700 -110 C-1300 -260 -900 -200 -560 -270 C-200 -340 160 -250 520 -300 C880 -350 1240 -260 1560 -320 C1900 -380 2300 -260 2900 -300 C3400 -340 3900 -200 4600 -260 V300 H-3400 Z';
/** the dusk sky, the far hills and Highfell's lights */
function outside(): string {
  const o: string[] = [`<rect x="-3400" y="-3600" width="8000" height="3900" style="fill: url(#h-sky)"/>`, ...STARS.map(star)];
  o.push(C(1760, -2560, 120, '#FFF3C4', 0).replace('fill: #FFF3C4', 'fill: #FFF3C4; fill-opacity: 0.16') + C(1760, -2560, 54, '#FFF3C4', 4.5) + C(1782, -2576, 44, '#4A3A6E', 0));
  for (const [x, y, k] of [[-760, -2050, 1.6], [1780, -1720, 1.9], [-560, -1180, 1.3], [1960, -940, 1.4], [-980, -620, 1.2], [1500, -2260, 1.1]] as [number, number, number][]) o.push(cloud(x, y, k, '#F6C9A8'));
  o.push(P(BACK_HILL, '#8E6290', 4));
  // Highfell on its hill, and the Last Lantern at the top
  o.push(P('M1500 -60 C1620 -360 2140 -380 2280 -60 Z', '#6E4E7E', 4));
  const roofs = ['#B3553F', '#4F6FA8', '#8A5A34'];
  [[1640, -200, 48], [1710, -262, 54], [1790, -300, 44], [1870, -308, 56], [1950, -290, 46], [2030, -250, 52], [2110, -190, 44]].forEach(([x, y, w], i) => o.push(cottage(x, y, w, roofs[i % 3])));
  o.push(R(1872, -470, 22, 160, '#E7CFA6', 3.5) + C(1883, -486, 40, '#FFD36A', 0).replace('fill: #FFD36A', 'fill: #FFD36A; fill-opacity: 0.35') + C(1883, -486, 12, '#FFD36A', 3.5));
  o.push(P('M-3400 -60 C-2700 -150 -2200 -40 -1700 -20 C-1200 -120 -760 -60 -400 -110 C40 -170 600 -70 1100 -120 C1600 -170 2200 -60 2900 -110 C3500 -160 4000 -50 4600 -100 V300 H-3400 Z', '#5E4A7A', 4));
  return o.join('');
}

/** a window: its opening, its frame, and the bars across it in the trim of its room's look. `has` says if a
 *  circle is wholly inside the opening; `low` windows reach down to the far hill. */
interface Win { id: string; room: string; d: string; frame: string; bars: (trim: string) => string; has: (x: number, y: number, r: number) => boolean; low: boolean }
function archWin(id: string, room: string, x: number, top: number, bot: number, w: number): Win {
  const cy = top + w / 2;
  return {
    id, room, d: arch(x, top, bot, w), frame: arch(x, top - 12, bot + 6, w + 26),
    bars: (trim) => beam(`M${x} ${f(top + 4)} V${bot} M${f(x - w / 2)} ${f((top + bot) / 2 + 14)} H${f(x + w / 2)}`, trim) + R(x - w / 2 - 18, bot, w + 36, 14, trim, 3.5),
    has: (sx, sy, sr) => sy + sr <= bot && (sy >= cy ? Math.abs(sx - x) <= w / 2 - sr : Math.hypot(sx - x, sy - cy) <= w / 2 - sr),
    low: bot > -400,
  };
}
function roundWin(id: string, room: string, x: number, y: number, r: number): Win {
  return {
    id, room, d: disc(x, y, r), frame: disc(x, y, r + 13), bars: (trim) => beam(`M${f(x - r)} ${y} H${f(x + r)} M${x} ${f(y - r)} V${f(y + r)}`, trim, 4),
    has: (sx, sy, sr) => Math.hypot(sx - x, sy - y) <= r - sr, low: false,
  };
}
/** what you see through a window: the sky at that height, its stars, and the hill if it's low enough */
const view = (w: Win): string => `<path d="${w.d}" style="fill: url(#h-sky)"/>` + STARS.filter((s) => w.has(s.x, s.y, s.r)).map(star).join('')
  + (w.low ? `<g clip-path="url(#${w.id})">${P(BACK_HILL, '#8E6290', 4)}</g>` : '');
const WINDOWS: Win[] = [
  roundWin('hw-l1', 'loft', 330, -2190, 34), roundWin('hw-l2', 'loft', 870, -2190, 34),
  archWin('hw-a1', 'armory', 1062, -1630, -1478, 104),
  archWin('hw-h1', 'hall', 130, -1062, -804, 150), archWin('hw-h2', 'hall', 1062, -1062, -804, 150),
  archWin('hw-b1', 'brewery', 1124, -424, -278, 96), archWin('hw-b2', 'brewery', 300, -424, -278, 96),
];

/** everything behind what you can tap: the outside, the ground, the rooms, the frame, the roof, the furniture */
export function houseBack(look: LookAt): string {
  const fr = frameOf(look);
  const o: string[] = [outside(), ground()];
  for (const id of LOOK_ROOMS) o.push(roomArt(look(id), id).wall());
  o.push(frame(fr));
  for (const w of WINDOWS) {
    const trim = TRIM[look(w.room)] || T.trim;
    o.push(P(w.frame, trim, 4.5) + view(w) + `<path d="${w.d}" style="fill: none; stroke: ${K}; stroke-width: 4"/>` + w.bars(trim));
  }
  o.push(roof(fr));
  for (const id of LOOK_ROOMS) o.push(roomArt(look(id), id).furnish());
  return o.join('');
}

/** in front of everything: the cut edges of the outer walls, and the light in each room */
export function houseFront(look: LookAt): string {
  const fr = frameOf(look);
  // outer walls: timber down to the ground (the doorway out to the garden in the left one), stone below
  const o = [R(-WALL, GABLE.eave, WALL, -336 - GABLE.eave, fr.timber, 4) + R(W, GABLE.eave, WALL, -GABLE.eave + BEAM, fr.timber, 4)];
  o.push(R(-WALL, FLOORS.ground + BEAM, WALL, FLOORS.cellar - FLOORS.ground - BEAM, fr.stone, 4) + R(W, FLOORS.ground + BEAM, WALL, FLOORS.cellar - FLOORS.ground - BEAM, fr.stone, 4));
  for (const id of LOOK_ROOMS) o.push(roomArt(look(id), id).light());
  return o.join('');
}

/** what moves: the smoke from the chimney, the birds and the fireflies outside, and each room's own (the
 *  fire, the wisps) */
export function houseBits(look: LookAt): Bit[] {
  const out = [...smoke(), ...birds(), ...fireflies()];
  for (const id of LOOK_ROOMS) out.push(...(roomArt(look(id), id).bits?.() || []));
  return out;
}

/** the yard, the paddock, the grass, and the earth the cellar is dug into */
function ground(): string {
  const o: string[] = [];
  o.push(R(-3400, 6, 8000, 1300, '#6B4A3A', 0));
  const r = rnd(5);
  for (let i = 0; i < 26; i++) {
    const x = -1500 + r() * 4200, y = 120 + r() * 900;
    if (x > -60 && x < W + 60) continue;
    o.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(18 + r() * 22)}" ry="${f(12 + r() * 12)}" style="fill: #7E5A48; stroke: ${K}; stroke-width: 3.5"/>`);
  }
  o.push(P('M-3400 -8 C-2600 -20 -2100 6 -1700 -4 C-1300 -18 -900 6 -500 -6 C-300 -12 -120 -2 0 0 H1200 C1500 4 1800 -16 2200 -6 C2500 2 2700 -10 2900 -2 C3500 6 4000 -12 4600 -4 V22 H-3400 Z', '#5E8A4E', 4));
  // the path from the garden door out to the Vale
  o.push(F('M0 -2 C-200 -4 -420 -2 -700 -10 C-900 -16 -1100 -8 -1700 -14 V6 C-1100 10 -800 6 -600 8 C-380 10 -180 8 0 10 Z', '#B08A5A'));
  for (const x of [-1340, -1180, -1060, 2400, 2460]) o.push(L(`M${x} -2 l-6 -14 M${x} -2 l0 -16 M${x} -2 l6 -14`, '#3E6A3A', 3));
  // a fence and a tree past the yard; a tree past the paddock
  for (const x of [-860, -800, -740]) o.push(R(x - 7, -78, 14, 78, T.timber, 3.5));
  o.push(R(-880, -64, 160, 12, T.trim, 3) + R(-880, -34, 160, 12, T.trim, 3));
  o.push(tree(-1020, 0, 3.2, '#4E7A4E') + tree(2420, -10, 2.4, '#3E6A4E'));
  o.push(paddockField());
  return o.join('');
}

/** The paddock, out on the right: a field of grass between a fence along the back and a fence down each
 *  side, a trough and hay. Every mount stands in it (hearth.ts); this is the field they stand in. */
function paddockField(): string {
  const x0 = PADDOCK.x0 - 50, x1 = PADDOCK.x1 + 70, b = PADDOCK.back;
  const o: string[] = [P(`M${x0 - 30} 2 L${x0} ${b} C${x0 + 200} ${b - 6} ${x1 - 260} ${b + 4} ${x1} ${b - 2} L${x1 + 30} 2 Z`, '#6E9A52', 4)];
  // tufts on the field
  const r = rnd(29);
  for (let i = 0; i < 14; i++) {
    const x = x0 + 40 + r() * (x1 - x0 - 80), y = b + 14 + r() * (-b - 22);
    o.push(L(`M${f(x)} ${f(y)} l-5 -10 M${f(x)} ${f(y)} l0 -12 M${f(x)} ${f(y)} l5 -10`, '#4E7A3E', 3));
  }
  // the back fence: posts and two rails
  const posts: number[] = [];
  for (let x = x0; x <= x1 + 1; x += (x1 - x0) / 8) posts.push(x);
  o.push(R(x0 - 6, b - 58, x1 - x0 + 12, 11, T.trim, 3) + R(x0 - 6, b - 30, x1 - x0 + 12, 11, T.trim, 3));
  for (const x of posts) o.push(R(x - 7, b - 72, 14, 74, T.timber, 3.5));
  // the trough and the hay against the back fence
  o.push(placeSprite('trough', PADDOCK.x0 + 70, b + 10, { k: 0.85 }) + placeSprite('hay_bale', x1 - 40, b + 12, { k: 0.8 }) + placeSprite('hay_bale', x1 - 100, b + 14, { k: 0.72 }));
  // the side fences, coming forward from the back corners
  for (const [xb, xf] of [[x0, x0 - 30], [x1, x1 + 30]]) {
    o.push(beam(`M${xb} ${b - 52} L${xf} -54`, T.trim, 7) + beam(`M${xb} ${b - 24} L${xf} -24`, T.trim, 7));
    o.push(R(xf - 8, -70, 16, 72, T.timber, 3.5) + R((xb + xf) / 2 - 7, b / 2 - 70, 14, 72, T.timber, 3.5));
  }
  return o.join('');
}

/** the frame: the stairwell and stairs down to the cellar, the beams between the floors, the
 *  foundation, the post holding up the hall over the brewing room, and the chimney */
function frame(fr: Frame): string {
  const o: string[] = [R(1060, -STRIP, W - 1060, STRIP + BEAM, '#3A2A2C', 0)];
  const steps: string[] = [`M${W} ${FLOORS.cellar} V${FLOORS.ground + BEAM}`];
  for (let i = 0; i < 10; i++) { const x = W - 25 * (i + 1), y = BEAM + 46.4 * (i + 1); steps.push(`H${x} V${f(y)}`); }
  o.push(P(steps.join(' ') + ' Z', fr.stairs, 4));
  o.push(beam(`M${W - 14} ${-110} L${W - 14} ${FLOORS.ground} M1066 -110 V-${STRIP - 4} M1066 -104 H${W}`, fr.timber, 7));
  o.push(beam(`M${W - 30} ${BEAM - 70} L${W - 260} ${FLOORS.cellar - 96}`, fr.timber, 6));
  // beams between the floors (the ground floor's has the stairwell in it), and the foundation
  for (const y of [FLOORS.loft, FLOORS.upper, FLOORS.hall]) o.push(R(-WALL, y, W + WALL * 2, BEAM, fr.beam, 4) + L(`M${-WALL} ${y + 12} H${W + WALL}`, fr.timber, 4));
  o.push(R(-WALL, FLOORS.ground, 1060 + WALL, BEAM, fr.beam, 4) + L(`M${-WALL} ${FLOORS.ground + 12} H1060`, fr.timber, 4));
  o.push(R(-WALL - 12, FLOORS.cellar, W + WALL * 2 + 24, 40, '#5E5470', 4));
  // the chimney upstairs; downstairs, a post under the hall's beam
  o.push(R(642, GC, 20, -GC, fr.timber, 4) + R(630, GC, 44, 22, fr.timber, 4));
  o.push(chimney(fr, FLOORS.hall - 620, GABLE.peak - 10));
  return o.join('');
}

/** the chimney: from the top of the hall's fireplace, up through every floor and out of the roof */
function chimney(fr: Frame, bottom: number, top: number): string {
  const o = [R(520, top, 160, bottom - top, fr.stone, 4)];
  for (let y = top + 40, i = 0; y < bottom; y += 40, i++) {
    o.push(L(`M520 ${y} H680`, fr.stoneLine, 3));
    o.push(L(`M${i % 2 ? 560 : 600} ${y} V${y + 40} M${i % 2 ? 640 : 600} ${y} V${y + 40}`, fr.stoneLine, 3));
  }
  return o.join('');
}

/** the roof over the loft, the chimney's top, smoke, and the flagpoles for your banners */
function roof(fr: Frame): string {
  const o: string[] = [];
  const ox1 = W - ROOF.x0;
  o.push(P(`M${ROOF.x0} ${ROOF.y0} L${W / 2} ${ROOF.peak} L${ox1} ${ROOF.y0} L${ox1 - 10} ${ROOF.y0 + 32} L${W} ${GABLE.eave} L${W / 2} ${GABLE.peak} L0 ${GABLE.eave} L${ROOF.x0 + 10} ${ROOF.y0 + 32} Z`, fr.roof, 5));
  for (const t of [0.3, 0.6]) {
    const ax = ROOF.x0 + (0 - ROOF.x0) * t, ay = ROOF.y0 + (GABLE.eave - ROOF.y0) * t;
    const py = ROOF.peak + (GABLE.peak - ROOF.peak) * t;
    o.push(L(`M${f(ax)} ${f(ay)} L${W / 2} ${f(py)} L${f(W - ax)} ${f(ay)}`, fr.roofLine, 4));
  }
  o.push(R(536, ROOF.peak - 120, 128, 150, fr.stone, 4) + R(520, ROOF.peak - 140, 160, 24, fr.stoneLine, 4));
  for (const x of [-70, W + 70]) {
    // where the roof is under the pole
    const y0 = ROOF.y0 + (ROOF.peak - ROOF.y0) * ((x < W / 2 ? x - ROOF.x0 : W - ROOF.x0 - x) / (W / 2 - ROOF.x0));
    o.push(beam(`M${x} ${f(y0)} V-2400`, fr.timber, 8) + C(x, -2410, 10, '#F2C230', 3.5) + R(x - 58, -2384, 116, 12, fr.trim, 3.5));
  }
  return o.join('');
}

/* ---------------------------------------------------------------- life outside: it moves, so it is bits.
 * The fire, the smoke, the birds' wings and the fireflies keep one slow beat, a new frame every 0.45s
 * (styles.css), and each frame is drawn once: the browser only shows, hides and slides them. */
type Puff = { x: number; y: number; r: number; o: number };
/** The smoke over the chimney: puffs climbing out of it, drifting right as they grow and fade. Four frames
 *  take turns, each with every puff a quarter of the way on to the next one's place, so the puffs climb. */
function smoke(): Bit[] {
  const n = 4, frames = 4, mouth = ROOF.peak - 140;
  // a puff s of the way up: still coming out of the chimney at 0, gone at 1
  const at = (s: number): Puff => ({ x: 600 + 56 * s + 8 * Math.sin(s * 2 * Math.PI), y: mouth + 4 - 290 * s, r: 16 + 24 * s, o: 0.9 * Math.pow(1 - s, 0.7) });
  const all = Array.from({ length: n * frames }, (_, i) => at(i / (n * frames)));
  const x0 = Math.min(...all.map((p) => p.x - p.r)) - 3, x1 = Math.max(...all.map((p) => p.x + p.r)) + 3;
  const y0 = Math.min(...all.map((p) => p.y - p.r)) - 3, y1 = mouth + 3;
  return Array.from({ length: frames }, (_, k) => ({
    box: [x0, y0, x1 - x0, y1 - y0],
    body: Array.from({ length: n }, (_, i) => puff(all[i * frames + k], mouth)).join(''),
    cls: `smoke s${k}`,
  }));
}
/** a puff of smoke, cut flat where it is still down the chimney */
function puff(p: Puff, cut: number): string {
  const style = `fill: #C9BCD6; stroke: ${K}; stroke-width: 3.5; opacity: ${f(p.o)}`;
  if (p.y + p.r <= cut) return `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" style="${style}"/>`;
  const dx = Math.sqrt(p.r * p.r - (cut - p.y) ** 2);
  return `<path d="M${f(p.x - dx)} ${cut} A${f(p.r)} ${f(p.r)} 0 ${p.y < cut ? 1 : 0} 1 ${f(p.x + dx)} ${cut} Z" style="${style}"/>`;
}

/** A few birds crossing the dusk sky now and then, in an arc over the roof and past the moon (styles.css:
 *  flight). The flock is two frames, its wings up and down by turns; it starts past the left edge. */
function birds(): Bit[] {
  // each bird: where it flies in the flock, its size, and whether its wings are up in the first frame
  const flock: [number, number, number, boolean][] = [[0, 0, 1.3, true], [-120, 38, 1.12, false], [-226, -14, 1, true]];
  const x = -3600, y = -1600;
  const x0 = Math.min(...flock.map(([dx, , k]) => dx - 36 * k)), x1 = Math.max(...flock.map(([dx, , k]) => dx + 36 * k));
  const y0 = Math.min(...flock.map(([, dy, k]) => dy - 20 * k)), y1 = Math.max(...flock.map(([, dy, k]) => dy + 17 * k));
  return [true, false].map((first) => ({
    box: [x + x0, y + y0, x1 - x0, y1 - y0],
    body: flock.map(([dx, dy, k, up]) => bird(x + dx, y + dy, k, up === first)).join(''),
    cls: first ? 'flock' : 'flock b',
  }));
}
/** a bird far off, its body at (x, y), lit by the sunset: two wings, up or down, and a body */
function bird(x: number, y: number, k: number, up: boolean): string {
  const wing = up ? 'M-3 -2 C-7 -12 -10 -16 -15 -16 C-22 -16 -28 -11 -33 -4 C-26 -6 -20 -7 -15 -5 C-10 -3 -6 1 -3 5 Z'
    : 'M-3 -3 C-8 -5 -12 -5 -16 -3 C-22 0 -27 6 -31 13 C-25 10 -20 8 -15 6 C-10 5 -6 5 -3 5 Z';
  const ink = `fill: #F6C9A8; stroke: ${K}; stroke-width: ${f(3 / k)}; stroke-linejoin: round`;
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${k})"><path d="${wing}" style="${ink}"/><path d="${wing}" transform="scale(-1 1)" style="${ink}"/><ellipse rx="7" ry="5" style="${ink}"/></g>`;
}

/** fireflies over the garden and the paddock, low against the hills, each blinking and drifting a little */
const FLIES: [number, number][] = [[-610, -190], [-420, -270], [-260, -180], [1520, -260], [1800, -330], [2050, -230]];
function fireflies(): Bit[] {
  return FLIES.map(([x, y], i) => ({ box: [x - 34, y - 34, 68, 68], body: glow(x, y, 34, 'h-fly') + C(x, y, 6, '#FFF3A0', 0), cls: `firefly f${i % 3}` }));
}

/* ---------------------------------------------------------------- pieces the looks share */
/** cut stone in rows with the joints staggered, from (x0, y0) down to (x1, y1) */
function blocks(x0: number, y0: number, x1: number, y1: number, line: string, rowH: number, bw: number): string {
  const o: string[] = [];
  for (let y = y0 + rowH, i = 0; y < y1; y += rowH, i++) {
    o.push(L(`M${x0} ${y} H${x1}`, line, 3));
    for (let x = x0 + (i % 2 ? bw / 2 : 0); x < x1; x += bw) o.push(L(`M${x} ${y} V${Math.min(y1, y + rowH)}`, line, 3));
  }
  return o.join('');
}
/** the loft's back wall up to the gable */
const gable = (fill: string): string => P(`M0 ${LW} V${GABLE.eave} L${W / 2} ${GABLE.peak} L${W} ${GABLE.eave} V${LW} Z`, fill, 4);
/** the loft's two long shelves each side of the chimney, on brackets */
function shelves(board: string, bracket: string): string {
  const o: string[] = [];
  for (const [a, b] of [[44, 484], [716, 1156]]) for (const y of [-1880, -2010]) {
    o.push(R(a, y, b - a, 14, board, 3.5));
    for (const bx of [a + 24, (a + b) / 2, b - 24]) o.push(P(`M${bx - 6} ${y + 14} H${bx + 6} V${y + 30} C${bx + 6} ${y + 40} ${bx - 6} ${y + 40} ${bx - 6} ${y + 30} Z`, bracket, 3));
  }
  return o.join('');
}
/** the cushion in the loft, for a pet */
const cushion = (base: string, top: string): string => `<ellipse cx="250" cy="${FLOORS.loft - 16}" rx="76" ry="16" style="fill: ${base}; stroke: ${K}; stroke-width: 3.5"/><ellipse cx="250" cy="${FLOORS.loft - 26}" rx="62" ry="13" style="fill: ${top}; stroke: ${K}; stroke-width: 3"/>`;
const bunks = (): string => placeSprite('bunk_a', 100, UW) + placeSprite('bunk_b', 260, UW) + placeSprite('bunk_c', 420, UW);
/** the hall's fireplace and logs; the flames are bits (fireBits) */
const FK = 0.92;
const hearthFire = (): string => placeSprite('fireplace', 600, HW, { k: FK }) + placeSprite('logs', 600, HW - 6 * FK, { k: FK });
/** the hall's fire, two frames taking turns: orange in the tavern, the Gravekeeper's green in Barrow Hall */
const fireBits = (fire: 'fire' | 'gfire'): Bit[] => [spriteBit(`${fire}_a`, 600, HW - 12 * FK, { k: FK, cls: 'fire-a' }), spriteBit(`${fire}_b`, 600, HW - 12 * FK, { k: FK, cls: 'fire-b' })].filter((b): b is Bit => !!b);
/** the rest of the hall: the rug, the table and its stools */
const hallFurniture = (): string => placeSprite('rug', 600, FLOORS.hall - 26, { k: 0.82 })
  + placeSprite('stool', 944, FLOORS.hall - 22) + placeSprite('table', 1052, FLOORS.hall - 26) + placeSprite('stool', 1160, FLOORS.hall - 22);
/** ...and torches each side of the fire, in the tavern and Barrow Hall */
const hallThings = (): string => hallFurniture() + [384, 816].map((x) => glow(x, -900, 90, 'h-warm') + placeSprite('torch', x, -860)).join('');
/** the brewing room's doorway out to the garden, with the barn door swung open */
const barnDoor = (): string => R(-WALL - 4, -336, WALL + 8, 336, '#3A2A2C', 0)
  + P('M-30 -334 L-176 -360 L-176 -16 L-30 0 Z', T.trim, 4) + L('M-62 -330 L-62 -6 M-98 -336 L-98 -10 M-134 -342 L-134 -12', T.timber, 3) + beam('M-40 -60 L-166 -300', T.timber, 6);
/** the brewing room's far end, where the stable was: the bench, herbs drying on a pole over it, and
 *  (in the tavern) two barrels by the garden door */
function brewLeft(trim: string, barrels: boolean): string {
  const o: string[] = [];
  if (barrels) o.push(placeSprite('barrel', 96, FLOORS.ground - 34, { k: 1.05 }) + placeSprite('barrel', 184, FLOORS.ground - 30));
  o.push(placeSprite('workbench', 488, FLOORS.ground - 30, { k: 1.2 }));
  // the pole hangs from the hall's beam on two cords
  o.push(L(`M410 ${GC} V-424 M570 ${GC} V-424`, K, 3) + beam('M396 -424 H584', trim, 6));
  const herbs: [number, string][] = [[420, '#7DBE5C'], [452, '#B98AD8'], [486, '#9BE15D'], [518, '#E9C46A'], [552, '#7DBE5C']];
  herbs.forEach(([x, col], i) => {
    const y = -420 + (i % 2) * 8;
    o.push(L(`M${x} ${y} V${y + 12}`, K, 3) + P(`M${x - 4} ${y + 10} H${x + 4} L${x + 14} ${y + 54} C${x + 6} ${y + 62} ${x - 6} ${y + 62} ${x - 14} ${y + 54} Z`, col, 3) + L(`M${x} ${y + 22} V${y + 50}`, K, 2.4));
  });
  return o.join('');
}

/* ---------------------------------------------------------------- the tavern */
/** a strip of floorboards in front of a back wall */
const boards = (x: number, w: number, floor: number, fill = T.floor, line = T.board): string => R(x, floor - STRIP, w, STRIP, fill, 0) + L(`M${x} ${floor - STRIP + 20} H${x + w} M${x} ${floor - STRIP + 40} H${x + w}`, line, 3) + L(`M${x} ${floor - STRIP} H${x + w}`, K, 3.5);
/** a lamp hanging from a beam at `top`, its body starting at `y` */
function lamp(x: number, top: number, y: number): string {
  return L(`M${x} ${top} V${y}`, K, 3) + glow(x, y + 24, 110, 'h-warm')
    + P(`M${x - 13} ${y + 6} H${x + 13} L${x + 9} ${y} H${x - 9} Z`, '#5A3A2A', 3)
    + P(`M${x - 11} ${y + 6} H${x + 11} L${x + 9} ${y + 38} H${x - 9} Z`, '#FFF3C4', 3)
    + P(`M${x} ${y + 12} C${x + 6} ${y + 20} ${x + 5} ${y + 28} ${x} ${y + 32} C${x - 5} ${y + 28} ${x - 6} ${y + 20} ${x} ${y + 12} Z`, '#FFE08A', 2)
    + P(`M${x - 14} ${y + 38} H${x + 14} L${x + 11} ${y + 44} H${x - 11} Z`, '#5A3A2A', 3);
}
/** a plaster wall with a wainscot of boards along its bottom */
function wainscot(x0: number, x1: number, bottom: number, h: number, step0: number): string {
  const o = [R(x0, bottom - h, x1 - x0, h, T.wains, 0)];
  for (let x = step0; x < x1; x += 46) o.push(L(`M${x} ${bottom - h + 8} V${bottom}`, T.wainsLine, 3));
  o.push(L(`M${x0} ${bottom - h} H${x1}`, K, 3.5));
  return o.join('');
}

/** one room in one look: its back wall and floor, its furniture, its light, and anything in it that moves */
export interface RoomArt { wall: () => string; furnish: () => string; light: () => string; bits?: () => Bit[] }

const TAVERN: Record<string, RoomArt> = {
  loft: {
    // wooden boards up to the gable
    wall: () => {
      const o = [gable(T.loft)];
      for (let x = 60; x < W; x += 80) {
        const top = x <= W / 2 ? GABLE.eave + (GABLE.peak - GABLE.eave) * (x / (W / 2)) : GABLE.eave + (GABLE.peak - GABLE.eave) * ((W - x) / (W / 2));
        o.push(L(`M${x} ${LW} V${f(top + 6)}`, T.loftLine, 3));
      }
      return o.join('') + boards(0, W, FLOORS.loft);
    },
    furnish: () => shelves(T.trim, T.timber) + cushion('#4F6FA8', '#6F8FC8'),
    light: () => glow(600, -1960, 640, 'h-warm', 0.5),
  },
  bunks: {
    wall: () => R(0, UP, 520, UW - UP, T.bunks, 0) + wainscot(0, 520, UW, 96, 24) + boards(0, 520, FLOORS.upper),
    furnish: () => bunks() + lamp(260, UP, -1612),
    light: () => glow(260, -1450, 360, 'h-warm', 0.6),
  },
  armory: {
    wall: () => R(680, UP, 520, UW - UP, T.armory, 0) + blocks(680, UP, W, UW, T.armoryLine, 60, 100) + boards(680, 520, FLOORS.upper),
    furnish: () => placeSprite('weapon_rack', 1062, UW),
    light: () => glow(920, -1430, 380, 'h-warm', 0.45),
  },
  hall: {
    // plaster, three panels, wainscot
    wall: () => R(0, HC, W, HW - HC, T.plaster, 0)
      + [[24, 396], [804, 1176]].map(([a, b]) => `<rect x="${a}" y="${HC + 28}" width="${b - a}" height="${HW - HC - 170}" rx="8" style="fill: ${T.panel}"/>`).join('')
      + wainscot(0, W, HW, 112, 22) + boards(0, W, FLOORS.hall),
    furnish: () => hearthFire() + placeSprite('woodpile', 140, FLOORS.hall - 30) + hallThings(),
    light: () => glow(600, -760, 760, 'h-fire'),
    bits: () => fireBits('fire'),
  },
  brewery: {
    wall: () => R(0, GC, W, GW - GC, T.brewery, 0) + wainscot(0, W, GW, 110, 22) + boards(0, 1060, FLOORS.ground),
    // the bench under the drying herbs, barrels by the garden door, the lamp over the cauldron
    furnish: () => brewLeft(T.trim, true) + lamp(930, GC, -420) + barnDoor(),
    light: () => glow(470, -240, 380, 'h-warm', 0.5) + glow(930, -240, 380, 'h-warm', 0.5) + glow(960, -60, 160, 'h-green', 0.6),
  },
  cellar: {
    wall: () => R(0, CC, W, CW - CC, T.cellar, 0) + blocks(0, CC, W, CW, T.cellarLine, 58, 120) + boards(0, W, FLOORS.cellar, T.cellarFloor, '#4E4660'),
    // candles and bones either side of the Hall of Doors (the doors, and the light round a lit one: halldoors.ts)
    furnish: () => placeSprite('candles', 82, FLOORS.cellar - 22) + placeSprite('skullpile', 924, FLOORS.cellar - 22),
    light: () => glow(82, 430, 120, 'h-warm', 0.8),
  },
};

/* ---------------------------------------------------------------- Barrow Hall */
/** the Barrow's brick on a back wall */
const brick = (x: number, y0: number, w: number, y1: number): string => R(x, y0, w, y1 - y0, B.wall, 0) + blocks(x, y0, x + w, y1, B.line, 58, 116);
/** flagstones in front of a back wall */
function flags(x: number, w: number, floor: number): string {
  const y = floor - STRIP, o = [R(x, y, w, STRIP, B.floor, 0), L(`M${x} ${y + 28} H${x + w}`, B.joint, 3)];
  for (let xx = x + 70; xx < x + w; xx += 140) o.push(L(`M${xx} ${y} V${y + 28}`, B.joint, 3));
  for (let xx = x + 140; xx < x + w; xx += 140) o.push(L(`M${xx} ${y + 28} V${floor}`, B.joint, 3));
  return o.join('') + L(`M${x} ${y} H${x + w}`, K, 3.5);
}
/** a small skull resting at (x, y) */
function skull(x: number, y: number, bone: string): string {
  const cy = y - 18;
  return P(`M${x - 7} ${y - 10} H${x + 7} V${y} H${x - 7} Z`, bone, 3) + C(x, cy, 12, bone, 3) + C(x - 4.5, cy + 1, 3.4, K, 0) + C(x + 4.5, cy + 1, 3.4, K, 0);
}
/** the crypt's wainscot: a band of burial niches along the bottom of a wall, most with a skull in */
function niches(x0: number, x1: number, bottom: number, h: number, seed: number, bone: string): string {
  const o = [R(x0, bottom - h, x1 - x0, h, B.band, 0), L(`M${x0} ${bottom - h} H${x1}`, K, 3.5)];
  const n = Math.max(1, Math.round((x1 - x0) / 96)), step = (x1 - x0) / n, r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const cx = x0 + step * (i + 0.5);
    o.push(P(arch(cx, bottom - h + 16, bottom - 10, 54), B.niche, 3.5));
    if (r() < 0.65) o.push(skull(cx, bottom - 10, bone));
  }
  return o.join('');
}
/** stone blocks up to the loft's gable, cut to its slope */
function gableBrick(): string {
  const o = [gable(B.wall)];
  const half = (y: number): number => (y >= GABLE.eave ? W / 2 : Math.max(0, ((y - GABLE.peak) / (GABLE.eave - GABLE.peak)) * (W / 2)));
  for (let y = LW - 58, i = 0; y > GABLE.peak + 30; y -= 58, i++) {
    o.push(L(`M${f(W / 2 - half(y))} ${y} H${f(W / 2 + half(y))}`, B.line, 3));
    const h = half(y - 58);
    for (let x = i % 2 ? 58 : 116; x < W; x += 116) if (x > W / 2 - h + 10 && x < W / 2 + h - 10) o.push(L(`M${x} ${y - 58} V${y}`, B.line, 3));
  }
  return o.join('');
}
/** candles on the floor, with their own small warm light */
const candles = (x: number, floor: number): string => glow(x, floor - 40, 90, 'h-warm', 0.8) + placeSprite('candles', x, floor - 22);

/** what changes between Barrow Hall and its gilded version (the heroic log's): the bone, the trim, the
 *  lanterns, and how bright the green burns */
interface Crypt { bone: string; trim: string; lantern: string; lamp: string; burn: number }
const PLAIN: Crypt = { bone: B.bone, trim: B.trim, lantern: 'lantern', lamp: 'h-green', burn: 1 };
const GILT: Crypt = { bone: '#F2C230', trim: '#D9A520', lantern: 'lantern_gold', lamp: 'h-warm', burn: 1.25 };

/** Barrow Hall's rooms, plain or gilded */
function crypt(c: Crypt): Record<string, RoomArt> {
  /** a lantern hanging from a beam at `top` on a chain down to `y`: Barrow Hall's lamp */
  const lantern = (x: number, top: number, y: number): string => L(`M${x} ${top} V${y}`, K, 3) + glow(x, y + 34, 110, c.lamp) + placeSprite(c.lantern, x, y + 64);
  const green = (x: number, y: number, r: number, op: number): string => glow(x, y, r, 'h-green', Math.min(1, op * c.burn));
  return {
    loft: {
      wall: () => gableBrick() + flags(0, W, FLOORS.loft),
      // bone shelves, a cushion in the Gravekeeper's purple, candles by the big book
      furnish: () => shelves(c.trim, B.stone) + cushion(B.cushion, B.cushionTop) + candles(452, FLOORS.loft) + candles(748, FLOORS.loft),
      light: () => green(600, -1960, 640, 0.42),
    },
    bunks: {
      wall: () => brick(0, UP, 520, UW) + niches(0, 520, UW, 96, 3, c.bone) + flags(0, 520, FLOORS.upper),
      furnish: () => bunks() + lantern(260, UP, -1612),
      light: () => green(260, -1450, 360, 0.5),
    },
    armory: {
      wall: () => brick(680, UP, W - 680, UW) + flags(680, 520, FLOORS.upper),
      // a coffin stood up between the armour and the rack
      furnish: () => placeSprite('weapon_rack', 1062, UW) + placeSprite('coffin', 921, UW),
      light: () => green(920, -1430, 380, 0.4),
    },
    hall: {
      // brick, two dark panels in bone frames where the tavern has its plaster ones, and a band of niches
      wall: () => brick(0, HC, W, HW)
        + [[24, 396], [804, 1176]].map(([a, b]) => `<rect x="${a}" y="${HC + 28}" width="${b - a}" height="${HW - HC - 170}" rx="10" style="fill: ${c.trim}; stroke: ${K}; stroke-width: 3.5"/><rect x="${a + 12}" y="${HC + 40}" width="${b - a - 24}" height="${HW - HC - 194}" rx="6" style="fill: ${B.panel}; stroke: ${K}; stroke-width: 3"/>`).join('')
        + niches(0, W, HW, 112, 7, c.bone) + flags(0, W, FLOORS.hall),
      // the fire burns green, and the woodpile is a pile of skulls
      furnish: () => hearthFire() + placeSprite('skullpile', 140, FLOORS.hall - 26, { k: 1.25 }) + hallThings(),
      light: () => glow(600, -760, 760 * c.burn, 'h-gfire'),
      bits: () => fireBits('gfire'),
    },
    brewery: {
      wall: () => brick(0, GC, W, GW) + niches(0, W, GW, 110, 11, c.bone) + flags(0, 1060, FLOORS.ground),
      // the bench and herbs, and an old gravestone and some bones where the barrels were
      furnish: () => brewLeft(c.trim, false) + placeSprite('tomb1', 110, FLOORS.ground - 30, { k: 1.2 }) + placeSprite('bones', 190, FLOORS.ground - 24) + lantern(930, GC, -420) + barnDoor(),
      light: () => green(470, -240, 380, 0.4) + green(930, -240, 380, 0.5) + green(960, -60, 160, 0.6),
    },
    cellar: {
      wall: () => brick(0, CC, W, CW) + flags(0, W, FLOORS.cellar),
      furnish: () => candles(82, FLOORS.cellar) + placeSprite('skullpile', 924, FLOORS.cellar - 22),
      light: () => green(430, 260, 520, 0.6),
      // wisps drift under the ceiling
      bits: () => [spriteBit('wisp', 560, 190, { cls: 'bob' }), spriteBit('wisp', 1000, 240, { k: 0.8, cls: 'bob' })].filter((b): b is Bit => !!b),
    },
  };
}

/** what a look drawn in its own file borrows from here: the furniture every look keeps in its place, and where
 *  each room's walls are (Toadstool Workshop: houseworkshop.ts) */
const KIT = { gable, shelves, cushion, bunks, hearthFire, fireBits, hallFurniture, brewLeft, barnDoor, GABLE, STRIP, LW, UP, UW, HC, HW, GC, GW, CC, CW };
export type Kit = typeof KIT;

const ROOM_ART: Record<string, Record<string, RoomArt>> = {
  tavern: TAVERN, barrow: crypt(PLAIN), 'barrow-gilded': crypt(GILT), workshop: workshop(WS_PLAIN, KIT), 'workshop-gilded': workshop(WS_GILT, KIT),
};
/** a room in a look, or in the tavern when that look has no art for it */
const roomArt = (look: string, room: string): RoomArt => ROOM_ART[look]?.[room] || TAVERN[room];
