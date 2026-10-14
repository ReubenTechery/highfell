/**
 * The house's looks, drawn in code in the house style (one black line, flat colour, gradients only for
 * light): the dusk outside, the shell of every room, the roof and its flags, and the furniture that
 * never changes. What you can tap, and what it does, lives in the scene (hearth.ts) and the house's
 * plan (content/house.ts). House units: x across, y down, the ground floor's floor at y = 0.
 */
import { FLOORS, HOUSE_W } from '../content/house';
import { placeSprite } from './art';
import { L, P, SKY_STOPS, cloud, house as cottage, tree } from './valeart';

const K = '#1E1A1A';
const f = (n: number): string => (Math.round(n * 10) / 10).toString();
const R = (x: number, y: number, w: number, h: number, fill: string, sw = 4): string => P(`M${f(x)} ${f(y)} h${f(w)} v${f(h)} h${f(-w)} Z`, fill, sw);
const F = (d: string, fill: string): string => `<path d="${d}" style="fill: ${fill}"/>`;
const C = (x: number, y: number, r: number, fill: string, w = 4): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="fill: ${fill}${w ? `; stroke: ${K}; stroke-width: ${w}` : ''}"/>`;
const glow = (x: number, y: number, r: number, id: string, op = 1): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="fill: url(#${id}); opacity: ${op}; pointer-events: none"/>`;
/** a line with an ink edge, like a beam or a mullion */
const beam = (d: string, col: string, w = 5): string => L(d, K, w + 5) + L(d, col, w);
function rnd(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** where the view may go, in house units: left, top, right, bottom */
export const HOUSE_BOUNDS: [number, number, number, number] = [-1100, -2900, 2300, 1060];
/** the whole house, for the zoomed-out view */
export const HOUSE_FIT: [number, number, number, number] = [-440, -2640, 1400, 560];

const WALL = 28, BEAM = 36, STRIP = 56;
const W = HOUSE_W;
/** the tavern look: the colours of each room's walls and floors */
const T = {
  trim: '#8A5A34', timber: '#6B4528', beam: '#5E3B22', floor: '#A0703F', board: '#86592F',
  plaster: '#D9C29A', panel: '#E3CEA6', wains: '#8A5A34', wainsLine: '#6B4528',
  loft: '#C9A27A', loftLine: '#B38A62', bunks: '#D3BC93', armory: '#B3ADB8', armoryLine: '#9D97A6',
  stable: '#A57A50', stableLine: '#8E6640', brewery: '#CFC49A', cellar: '#7E7390', cellarLine: '#6A5F7E', cellarFloor: '#5E5470',
  stone: '#7A6E86', stoneLine: '#665A72', roof: '#B3553F', roofLine: '#8E3F2E',
};
/** the gable inside the loft, and the roof outside it */
const GABLE = { eave: -2090, peak: -2400 };
const ROOF = { x0: -120, y0: -2040, peak: -2480 };

const arch = (x: number, top: number, bot: number, w: number): string => `M${f(x - w / 2)} ${f(bot)} V${f(top + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w / 2)} ${f(top + w / 2)} V${f(bot)} Z`;
const disc = (x: number, y: number, r: number): string => `M${f(x - r)} ${f(y)} A${f(r)} ${f(r)} 0 1 1 ${f(x + r)} ${f(y)} A${f(r)} ${f(r)} 0 1 1 ${f(x - r)} ${f(y)} Z`;

/** Gradients, the outside (drawn once, shown round the house and through every window) and the windows' clips. */
export function houseDefs(): string {
  return `<linearGradient id="h-sky" x1="0" y1="-3000" x2="0" y2="40" gradientUnits="userSpaceOnUse">${SKY_STOPS}</linearGradient>
    <radialGradient id="h-warm"><stop offset="0" stop-color="#FFC870" stop-opacity="0.42"/><stop offset="1" stop-color="#FFC870" stop-opacity="0"/></radialGradient>
    <radialGradient id="h-fire"><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.4"/><stop offset="0.55" stop-color="#FF8A4C" stop-opacity="0.12"/><stop offset="1" stop-color="#FF8A4C" stop-opacity="0"/></radialGradient>
    <radialGradient id="h-green"><stop offset="0" stop-color="#9BE15D" stop-opacity="0.5"/><stop offset="1" stop-color="#9BE15D" stop-opacity="0"/></radialGradient>
    <g id="h-out">${outside()}</g>
    ${WINDOWS.map((w) => `<clipPath id="${w.id}"><path d="${w.d}"/></clipPath>`).join('')}`;
}

/** the dusk sky, the far hills and Highfell's lights */
function outside(): string {
  const r = rnd(17);
  const o: string[] = [`<rect x="-3400" y="-3600" width="8000" height="3900" style="fill: url(#h-sky)"/>`];
  for (let i = 0; i < 260; i++) o.push(`<circle cx="${f(-3200 + r() * 7600)}" cy="${f(-3500 + r() * 2000)}" r="${f(2 + r() * 3)}" style="fill: #FFF3C4; opacity: ${f(0.4 + r() * 0.6)}"/>`);
  o.push(C(1760, -2560, 120, '#FFF3C4', 0).replace('fill: #FFF3C4', 'fill: #FFF3C4; opacity: 0.16') + C(1760, -2560, 54, '#FFF3C4', 4.5) + C(1782, -2576, 44, '#4A3A6E', 0));
  for (const [x, y, k] of [[-760, -2050, 1.6], [1780, -1720, 1.9], [-560, -1180, 1.3], [1960, -940, 1.4], [-980, -620, 1.2], [1500, -2260, 1.1]] as [number, number, number][]) o.push(cloud(x, y, k, '#F6C9A8'));
  o.push(P('M-3400 -150 C-2600 -300 -2100 -120 -1700 -110 C-1300 -260 -900 -200 -560 -270 C-200 -340 160 -250 520 -300 C880 -350 1240 -260 1560 -320 C1900 -380 2300 -260 2900 -300 C3400 -340 3900 -200 4600 -260 V300 H-3400 Z', '#8E6290', 4));
  // Highfell on its hill, and the Last Lantern at the top
  o.push(P('M1500 -60 C1620 -360 2140 -380 2280 -60 Z', '#6E4E7E', 4));
  const roofs = ['#B3553F', '#4F6FA8', '#8A5A34'];
  [[1640, -200, 48], [1710, -262, 54], [1790, -300, 44], [1870, -308, 56], [1950, -290, 46], [2030, -250, 52], [2110, -190, 44]].forEach(([x, y, w], i) => o.push(cottage(x, y, w, roofs[i % 3])));
  o.push(R(1872, -470, 22, 160, '#E7CFA6', 3.5) + C(1883, -486, 40, '#FFD36A', 0).replace('fill: #FFD36A', 'fill: #FFD36A; opacity: 0.35') + C(1883, -486, 12, '#FFD36A', 3.5));
  o.push(P('M-3400 -60 C-2700 -150 -2200 -40 -1700 -20 C-1200 -120 -760 -60 -400 -110 C40 -170 600 -70 1100 -120 C1600 -170 2200 -60 2900 -110 C3500 -160 4000 -50 4600 -100 V300 H-3400 Z', '#5E4A7A', 4));
  return o.join('');
}

interface Win { id: string; d: string; frame: string; bars: string }
function archWin(id: string, x: number, top: number, bot: number, w: number): Win {
  return {
    id, d: arch(x, top, bot, w), frame: arch(x, top - 12, bot + 6, w + 26),
    bars: beam(`M${x} ${f(top + 4)} V${bot} M${f(x - w / 2)} ${f((top + bot) / 2 + 14)} H${f(x + w / 2)}`, T.trim) + R(x - w / 2 - 18, bot, w + 36, 14, T.trim, 3.5),
  };
}
function roundWin(id: string, x: number, y: number, r: number): Win {
  return { id, d: disc(x, y, r), frame: disc(x, y, r + 13), bars: beam(`M${f(x - r)} ${y} H${f(x + r)} M${x} ${f(y - r)} V${f(y + r)}`, T.trim, 4) };
}
const WINDOWS: Win[] = [
  roundWin('hw-l1', 330, -2190, 34), roundWin('hw-l2', 870, -2190, 34),
  archWin('hw-a1', 1062, -1630, -1478, 104),
  archWin('hw-h1', 130, -1062, -804, 150), archWin('hw-h2', 1062, -1062, -804, 150),
  archWin('hw-b1', 1124, -424, -278, 96),
];

/** everything behind what you can tap: the outside, the ground, the rooms, the roof, the furniture */
export function houseBack(): string {
  const o: string[] = ['<use href="#h-out"/>'];
  o.push(ground());
  o.push(rooms());
  for (const w of WINDOWS) o.push(P(w.frame, T.trim, 4.5) + `<g clip-path="url(#${w.id})"><use href="#h-out"/></g><path d="${w.d}" style="fill: none; stroke: ${K}; stroke-width: 4"/>` + w.bars);
  o.push(roof());
  o.push(furniture());
  return o.join('');
}

/** the yard, the grass, and the earth the cellar is dug into */
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
  // the path from the stable door out to the Vale
  o.push(F('M0 -2 C-200 -4 -420 -2 -700 -10 C-900 -16 -1100 -8 -1700 -14 V6 C-1100 10 -800 6 -600 8 C-380 10 -180 8 0 10 Z', '#B08A5A'));
  for (const x of [-1340, -1180, -1060, 1380, 1560, 2060]) o.push(L(`M${x} -2 l-6 -14 M${x} -2 l0 -16 M${x} -2 l6 -14`, '#3E6A3A', 3));
  // a fence and a tree past the yard, a barrel and a bush by the house
  for (const x of [-860, -800, -740]) o.push(R(x - 7, -78, 14, 78, T.timber, 3.5));
  o.push(R(-880, -64, 160, 12, T.trim, 3) + R(-880, -34, 160, 12, T.trim, 3));
  o.push(tree(-1020, 0, 3.2, '#4E7A4E') + tree(1560, 0, 2.6, '#4E7A4E') + tree(1720, -10, 2.0, '#3E6A4E'));
  o.push(placeSprite('barrel', 1320, 0, { k: 0.9 }) + P('M1390 0 C1380 -40 1420 -64 1450 -50 C1480 -70 1520 -50 1514 -20 C1530 -10 1524 0 1510 0 Z', '#4E8A3E', 3.5));
  return o.join('');
}

/** every room's back wall and floor, the beams between the floors, the chimney and the stairs */
function rooms(): string {
  const o: string[] = [];
  const wallY = (floor: number): number => floor - STRIP;
  // the loft: wooden boards up to the gable
  const lw = wallY(FLOORS.loft);
  o.push(P(`M0 ${lw} V${GABLE.eave} L${W / 2} ${GABLE.peak} L${W} ${GABLE.eave} V${lw} Z`, T.loft, 4));
  for (let x = 60; x < W; x += 80) {
    const top = x <= W / 2 ? GABLE.eave + (GABLE.peak - GABLE.eave) * (x / (W / 2)) : GABLE.eave + (GABLE.peak - GABLE.eave) * ((W - x) / (W / 2));
    o.push(L(`M${x} ${lw} V${f(top + 6)}`, T.loftLine, 3));
  }
  // upstairs: the bunk room's plaster and the armory's stone
  const uw = wallY(FLOORS.upper), up = FLOORS.loft + BEAM;
  o.push(R(0, up, 520, uw - up, T.bunks, 0) + R(0, uw - 96, 520, 96, T.wains, 0));
  for (let x = 24; x < 520; x += 46) o.push(L(`M${x} ${uw - 88} V${uw}`, T.wainsLine, 3));
  o.push(L(`M0 ${uw - 96} H520`, K, 3.5));
  o.push(R(680, up, 520, uw - up, T.armory, 0));
  for (let y = up + 60, i = 0; y < uw; y += 60, i++) {
    o.push(L(`M680 ${y} H${W}`, T.armoryLine, 3));
    for (let x = 680 + (i % 2 ? 50 : 0); x < W; x += 100) o.push(L(`M${x} ${y} V${Math.min(uw, y + 60)}`, T.armoryLine, 3));
  }
  // the hall: plaster, three panels, wainscot
  const hw = wallY(FLOORS.hall), hc = FLOORS.upper + BEAM;
  o.push(R(0, hc, W, hw - hc, T.plaster, 0));
  for (const [a, b] of [[24, 396], [804, 1176]]) o.push(`<rect x="${a}" y="${hc + 28}" width="${b - a}" height="${hw - hc - 170}" rx="8" style="fill: ${T.panel}"/>`);
  o.push(R(0, hw - 112, W, 112, T.wains, 0));
  for (let x = 22; x < W; x += 46) o.push(L(`M${x} ${hw - 104} V${hw}`, T.wainsLine, 3));
  o.push(L(`M0 ${hw - 112} H${W}`, K, 3.5));
  // downstairs: the stable's boards and the brewing room's plaster
  const gw = wallY(FLOORS.ground), gc = FLOORS.hall + BEAM;
  o.push(R(0, gc, 640, gw - gc, T.stable, 0));
  for (let x = 40; x < 640; x += 46) o.push(L(`M${x} ${gc} V${gw}`, T.stableLine, 3));
  o.push(R(664, gc, W - 664, gw - gc, T.brewery, 0) + R(664, gw - 110, W - 664, 110, T.wains, 0));
  for (let x = 686; x < W; x += 46) o.push(L(`M${x} ${gw - 102} V${gw}`, T.wainsLine, 3));
  o.push(L(`M664 ${gw - 110} H${W}`, K, 3.5));
  // the cellar: stone blocks
  const cw = wallY(FLOORS.cellar), cc = FLOORS.ground + BEAM;
  o.push(R(0, cc, W, cw - cc, T.cellar, 0));
  for (let y = cc + 58, i = 0; y < cw; y += 58, i++) {
    o.push(L(`M0 ${y} H${W}`, T.cellarLine, 3));
    for (let x = i % 2 ? 60 : 0; x < W; x += 120) o.push(L(`M${x} ${y} V${Math.min(cw, y + 58)}`, T.cellarLine, 3));
  }
  // floors: a strip of boards in front of each back wall
  const strip = (x: number, w: number, floor: number, fill = T.floor, line = T.board) => R(x, floor - STRIP, w, STRIP, fill, 0) + L(`M${x} ${floor - STRIP + 20} H${x + w} M${x} ${floor - STRIP + 40} H${x + w}`, line, 3) + L(`M${x} ${floor - STRIP} H${x + w}`, K, 3.5);
  o.push(strip(0, W, FLOORS.loft) + strip(0, 520, FLOORS.upper) + strip(680, 520, FLOORS.upper) + strip(0, W, FLOORS.hall));
  o.push(strip(0, 640, FLOORS.ground) + strip(664, 1060 - 664, FLOORS.ground) + strip(0, W, FLOORS.cellar, T.cellarFloor, '#4E4660'));
  // the stairwell down to the cellar, and the stairs
  o.push(R(1060, -STRIP, W - 1060, STRIP + BEAM, '#3A2A2C', 0));
  const steps: string[] = [`M${W} ${FLOORS.cellar} V${FLOORS.ground + BEAM}`];
  for (let i = 0; i < 10; i++) { const x = W - 25 * (i + 1), y = BEAM + 46.4 * (i + 1); steps.push(`H${x} V${f(y)}`); }
  o.push(P(steps.join(' ') + ' Z', T.trim, 4));
  o.push(beam(`M${W - 14} ${-110} L${W - 14} ${FLOORS.ground} M1066 -110 V-${STRIP - 4} M1066 -104 H${W}`, T.timber, 7));
  o.push(beam(`M${W - 30} ${BEAM - 70} L${W - 260} ${FLOORS.cellar - 96}`, T.timber, 6));
  // beams between the floors (the ground floor's has the stairwell in it), and the foundation
  for (const y of [FLOORS.loft, FLOORS.upper, FLOORS.hall]) o.push(R(-WALL, y, W + WALL * 2, BEAM, T.beam, 4) + L(`M${-WALL} ${y + 12} H${W + WALL}`, T.timber, 4));
  o.push(R(-WALL, FLOORS.ground, 1060 + WALL, BEAM, T.beam, 4) + L(`M${-WALL} ${FLOORS.ground + 12} H1060`, T.timber, 4));
  o.push(R(-WALL - 12, FLOORS.cellar, W + WALL * 2 + 24, 40, '#5E5470', 4));
  // walls between rooms: the chimney upstairs, a timber wall downstairs
  o.push(R(640, gc, 24, -gc, T.timber, 4));
  o.push(chimney(FLOORS.hall - 620, GABLE.peak - 10));
  return o.join('');
}

/** the chimney: from the top of the hall's fireplace, up through every floor and out of the roof */
function chimney(bottom: number, top: number): string {
  const o = [R(520, top, 160, bottom - top, T.stone, 4)];
  for (let y = top + 40, i = 0; y < bottom; y += 40, i++) {
    o.push(L(`M520 ${y} H680`, T.stoneLine, 3));
    o.push(L(`M${i % 2 ? 560 : 600} ${y} V${y + 40} M${i % 2 ? 640 : 600} ${y} V${y + 40}`, T.stoneLine, 3));
  }
  return o.join('');
}

/** the roof over the loft, the chimney's top, smoke, and the flagpoles for your banners */
function roof(): string {
  const o: string[] = [];
  const ox1 = W - ROOF.x0;
  o.push(P(`M${ROOF.x0} ${ROOF.y0} L${W / 2} ${ROOF.peak} L${ox1} ${ROOF.y0} L${ox1 - 10} ${ROOF.y0 + 32} L${W} ${GABLE.eave} L${W / 2} ${GABLE.peak} L0 ${GABLE.eave} L${ROOF.x0 + 10} ${ROOF.y0 + 32} Z`, T.roof, 5));
  for (const t of [0.3, 0.6]) {
    const ax = ROOF.x0 + (0 - ROOF.x0) * t, ay = ROOF.y0 + (GABLE.eave - ROOF.y0) * t;
    const py = ROOF.peak + (GABLE.peak - ROOF.peak) * t;
    o.push(L(`M${f(ax)} ${f(ay)} L${W / 2} ${f(py)} L${f(W - ax)} ${f(ay)}`, T.roofLine, 4));
  }
  o.push(R(536, ROOF.peak - 120, 128, 150, T.stone, 4) + R(520, ROOF.peak - 140, 160, 24, T.stoneLine, 4));
  o.push(`<g class="smoke">${[0, 1, 2].map((i) => C(600 + (i % 2 ? 24 : -18), ROOF.peak - 200 - i * 70, 26 + i * 10, '#C9BCD6', 3.5).replace('fill: #C9BCD6', `fill: #C9BCD6; opacity: ${f(0.85 - i * 0.2)}`)).join('')}</g>`);
  for (const x of [-70, W + 70]) {
    // where the roof is under the pole
    const y0 = ROOF.y0 + (ROOF.peak - ROOF.y0) * ((x < W / 2 ? x - ROOF.x0 : W - ROOF.x0 - x) / (W / 2 - ROOF.x0));
    o.push(beam(`M${x} ${f(y0)} V-2400`, T.timber, 8) + C(x, -2410, 10, '#F2C230', 3.5) + R(x - 58, -2384, 116, 12, T.trim, 3.5));
  }
  return o.join('');
}

/** a lamp hanging from a beam at `top`, its body starting at `y` */
function lamp(x: number, top: number, y: number): string {
  return L(`M${x} ${top} V${y}`, K, 3) + glow(x, y + 24, 110, 'h-warm')
    + P(`M${x - 13} ${y + 6} H${x + 13} L${x + 9} ${y} H${x - 9} Z`, '#5A3A2A', 3)
    + P(`M${x - 11} ${y + 6} H${x + 11} L${x + 9} ${y + 38} H${x - 9} Z`, '#FFF3C4', 3)
    + P(`M${x} ${y + 12} C${x + 6} ${y + 20} ${x + 5} ${y + 28} ${x} ${y + 32} C${x - 5} ${y + 28} ${x - 6} ${y + 20} ${x} ${y + 12} Z`, '#FFE08A', 2)
    + P(`M${x - 14} ${y + 38} H${x + 14} L${x + 11} ${y + 44} H${x - 11} Z`, '#5A3A2A', 3);
}

/** the furniture that is always there */
function furniture(): string {
  const o: string[] = [];
  const at = (floor: number): number => floor - STRIP;
  // the loft: two long shelves each side of the chimney, a lamp
  for (const [a, b] of [[44, 484], [716, 1156]]) for (const y of [-1880, -2010]) {
    o.push(R(a, y, b - a, 14, T.trim, 3.5));
    for (const bx of [a + 24, (a + b) / 2, b - 24]) o.push(P(`M${bx - 6} ${y + 14} H${bx + 6} V${y + 30} C${bx + 6} ${y + 40} ${bx - 6} ${y + 40} ${bx - 6} ${y + 30} Z`, T.timber, 3));
  }
  o.push(`<ellipse cx="250" cy="${FLOORS.loft - 16}" rx="76" ry="16" style="fill: #4F6FA8; stroke: ${K}; stroke-width: 3.5"/><ellipse cx="250" cy="${FLOORS.loft - 26}" rx="62" ry="13" style="fill: #6F8FC8; stroke: ${K}; stroke-width: 3"/>`);
  // the bunk room
  o.push(placeSprite('bunk_a', 100, at(FLOORS.upper)) + placeSprite('bunk_b', 260, at(FLOORS.upper)) + placeSprite('bunk_c', 420, at(FLOORS.upper)));
  o.push(lamp(260, FLOORS.loft + BEAM, -1612));
  // the armory
  o.push(placeSprite('weapon_rack', 1062, at(FLOORS.upper)));
  // the hall: the fire, its glow on the floor, a rug, the woodpile, torches, the table
  const fk = 0.92;
  o.push(placeSprite('fireplace', 600, at(FLOORS.hall), { k: fk }) + placeSprite('logs', 600, at(FLOORS.hall) - 6 * fk, { k: fk }));
  o.push(placeSprite('fire_a', 600, at(FLOORS.hall) - 12 * fk, { k: fk, cls: 'fire-a' }) + placeSprite('fire_b', 600, at(FLOORS.hall) - 12 * fk, { k: fk, cls: 'fire-b' }));
  o.push(placeSprite('rug', 600, FLOORS.hall - 26, { k: 0.82 }));
  o.push(placeSprite('woodpile', 140, FLOORS.hall - 30));
  for (const x of [384, 816]) o.push(glow(x, -900, 90, 'h-warm') + placeSprite('torch', x, -860));
  o.push(placeSprite('stool', 944, FLOORS.hall - 22) + placeSprite('table', 1052, FLOORS.hall - 26) + placeSprite('stool', 1160, FLOORS.hall - 22));
  // the stable: its stall, and the doorway out to the yard with the barn door swung open
  o.push(placeSprite('stall', 420, at(FLOORS.ground)));
  o.push(R(-WALL - 4, -336, WALL + 8, 336, '#3A2A2C', 0));
  o.push(P('M-30 -334 L-176 -360 L-176 -16 L-30 0 Z', T.trim, 4) + L('M-62 -330 L-62 -6 M-98 -336 L-98 -10 M-134 -342 L-134 -12', T.timber, 3) + beam('M-40 -60 L-166 -300', T.timber, 6));
  // the brewing room: a lamp over the cauldron
  o.push(lamp(930, FLOORS.hall + BEAM, -420));
  // the cellar: two arches for dungeons still to come, candles and bones
  o.push(placeSprite('bricked_arch', 600, at(FLOORS.cellar), { k: 0.85 }) + placeSprite('bricked_arch', 806, at(FLOORS.cellar), { k: 0.85 }));
  o.push(placeSprite('candles', 82, FLOORS.cellar - 22) + placeSprite('skullpile', 924, FLOORS.cellar - 22));
  return o.join('');
}

/** in front of everything: the cut edges of the outer walls, and the light in each room */
export function houseFront(): string {
  const o: string[] = [];
  // outer walls: timber down to the ground (the stable's doorway in the left one), stone below
  o.push(R(-WALL, GABLE.eave, WALL, -336 - GABLE.eave, T.timber, 4) + R(W, GABLE.eave, WALL, -GABLE.eave + BEAM, T.timber, 4));
  o.push(R(-WALL, FLOORS.ground + BEAM, WALL, FLOORS.cellar - FLOORS.ground - BEAM, T.stone, 4) + R(W, FLOORS.ground + BEAM, WALL, FLOORS.cellar - FLOORS.ground - BEAM, T.stone, 4));
  // the light: the fire, the lamps, the Barrow's green glow
  o.push(glow(600, -760, 760, 'h-fire'));
  o.push(glow(600, -1960, 640, 'h-warm', 0.5) + glow(260, -1450, 360, 'h-warm', 0.6) + glow(920, -1430, 380, 'h-warm', 0.45));
  o.push(glow(470, -250, 360, 'h-warm', 0.5) + glow(930, -240, 380, 'h-warm', 0.5) + glow(960, -60, 160, 'h-green', 0.6));
  o.push(glow(300, 280, 460, 'h-green', 0.85) + glow(82, 430, 120, 'h-warm', 0.8));
  return o.join('');
}
