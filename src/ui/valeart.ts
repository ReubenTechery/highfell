/**
 * The Vale's scenery, drawn in code in the house style (one black line, flat colour): the overland
 * map, the backdrop of a place, and the strips that scroll past on a ride. Only looks live here; what
 * you can tap, and what it does, lives in vale.ts.
 */
import { VALE_MAP } from '../content/vale';
import { placeSprite } from './art';

const K = '#1E1A1A';
const ink = (fill: string, w = 4) => `fill: ${fill}; stroke: ${K}; stroke-width: ${w}; stroke-linejoin: round; stroke-linecap: round`;
export const P = (d: string, fill: string, w = 4, extra = ''): string => `<path d="${d}" style="${ink(fill, w)}"${extra}/>`;
export const L = (d: string, col = K, w = 3, extra = ''): string => `<path d="${d}" style="fill: none; stroke: ${col}; stroke-width: ${w}; stroke-linecap: round; stroke-linejoin: round"${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, w = 4, extra = ''): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="${w ? ink(fill, w) : 'fill: ' + fill}"${extra}/>`;
const E = (x: number, y: number, rx: number, ry: number, fill: string, w = 4, extra = ''): string => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" style="${w ? ink(fill, w) : 'fill: ' + fill}"${extra}/>`;
const f = (n: number): string => (Math.round(n * 10) / 10).toString();

/** a small seeded random, so the scenery is the same every time */
function rnd(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** the dusk sky every outdoor scene shares */
export const SKY_STOPS = `<stop offset="0" stop-color="#2E2A55"/><stop offset="0.42" stop-color="#7A4E86"/><stop offset="0.7" stop-color="#E98A6A"/><stop offset="1" stop-color="#FFD48A"/>`;

/** a round tree: trunk, canopy and a highlight */
function tree(x: number, y: number, k: number, col = '#4E8A3E'): string {
  return P(`M${f(x - 5 * k)} ${f(y)} L${f(x - 4 * k)} ${f(y - 22 * k)} H${f(x + 4 * k)} L${f(x + 5 * k)} ${f(y)} Z`, '#7A5238', 3)
    + C(x, y - 40 * k, 24 * k, col, 3.5) + C(x - 8 * k, y - 48 * k, 7 * k, 'rgba(255, 255, 255, 0.18)', 0);
}
/** a pine for the mountain slopes */
function pine(x: number, y: number, k: number): string {
  return P(`M${f(x)} ${f(y - 54 * k)} L${f(x + 18 * k)} ${f(y - 8 * k)} H${f(x - 18 * k)} Z`, '#3E7A46', 3) + P(`M${f(x - 3 * k)} ${f(y - 8 * k)} V${f(y)} H${f(x + 3 * k)} V${f(y - 8 * k)}`, '#6B4528', 2.5);
}
/** a soft cloud */
function cloud(x: number, y: number, k: number, fill = '#FFF3E4'): string {
  return P(`M${f(x - 60 * k)} ${f(y)} C${f(x - 64 * k)} ${f(y - 22 * k)} ${f(x - 36 * k)} ${f(y - 30 * k)} ${f(x - 24 * k)} ${f(y - 22 * k)} C${f(x - 18 * k)} ${f(y - 44 * k)} ${f(x + 14 * k)} ${f(y - 46 * k)} ${f(x + 22 * k)} ${f(y - 26 * k)} C${f(x + 40 * k)} ${f(y - 34 * k)} ${f(x + 64 * k)} ${f(y - 20 * k)} ${f(x + 60 * k)} ${f(y)} Z`, fill, 3.5);
}
/** a cottage for Highfell: walls, a roof, a lit window */
function house(x: number, y: number, w: number, roof: string): string {
  const h = w * 0.62;
  return P(`M${f(x - w / 2)} ${f(y)} V${f(y - h)} H${f(x + w / 2)} V${f(y)} Z`, '#F3E6CC', 3)
    + P(`M${f(x - w / 2 - 5)} ${f(y - h)} L${f(x)} ${f(y - h - w * 0.5)} L${f(x + w / 2 + 5)} ${f(y - h)} Z`, roof, 3)
    + `<rect x="${f(x - w * 0.16)}" y="${f(y - h * 0.68)}" width="${f(w * 0.32)}" height="${f(h * 0.36)}" style="${ink('#FFD36A', 2.5)}"/>`;
}

/* ================================================================== the map */
/** The overland map: meadow, forests, the river, the roads and every place, on a 1000 by 1000 world.
 *  The meadow runs far past the edges so any screen shape can show more of it. */
export function mapScenery(): string {
  const r = rnd(11);
  const o: string[] = [];
  o.push(`<defs>
    <radialGradient id="mapsun" cx="500" cy="480" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFE9A8" stop-opacity="0.32"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
    <radialGradient id="mapvig" cx="500" cy="520" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#1A1426" stop-opacity="0"/><stop offset="1" stop-color="#1A1426" stop-opacity="0.55"/></radialGradient>
    <radialGradient id="forge" ><stop offset="0" stop-color="#FF9A4C" stop-opacity="0.7"/><stop offset="1" stop-color="#FF9A4C" stop-opacity="0"/></radialGradient>
    <radialGradient id="lantglow"><stop offset="0" stop-color="#FFD36A" stop-opacity="0.8"/><stop offset="1" stop-color="#FFD36A" stop-opacity="0"/></radialGradient>
    <radialGradient id="gloom"><stop offset="0" stop-color="#6A4BA3" stop-opacity="0.55"/><stop offset="1" stop-color="#6A4BA3" stop-opacity="0"/></radialGradient>
  </defs>`);
  o.push(`<rect x="-900" y="-900" width="2800" height="2800" style="fill: #86BE57"/>`);
  // meadow patches and grass
  for (let i = 0; i < 70; i++) { const x = -500 + r() * 2000, y = -400 + r() * 1900; o.push(E(x, y, 60 + r() * 110, 26 + r() * 40, r() < 0.5 ? '#93C963' : '#7DB451', 0)); }
  for (let i = 0; i < 160; i++) { const x = -500 + r() * 2000, y = -400 + r() * 1900; o.push(L(`M${f(x - 6)} ${f(y - 8)} L${f(x)} ${f(y)} L${f(x + 6)} ${f(y - 9)}`, '#5E9A45', 3)); }
  // far rolling hills at the top of the world
  o.push(P('M-900 160 C-600 60 -300 120 -60 70 C200 20 360 90 520 60 C700 30 900 80 1100 40 C1400 -10 1700 60 1900 30 V-900 H-900 Z', '#6EA74C', 4));
  o.push(P('M-900 40 C-500 -60 -200 -10 100 -60 C400 -110 700 -40 1000 -90 C1300 -140 1600 -60 1900 -100 V-900 H-900 Z', '#5E9445', 4));
  // the river: out of Moonmere, west of Highfell, off the bottom of the world
  const river = 'M350 372 C400 420 430 470 410 530 C392 586 350 610 356 670 C362 740 430 780 450 850 C470 920 440 1010 470 1140 C490 1240 470 1400 500 1700';
  o.push(L(river, K, 46) + L(river, '#7FC9EE', 38) + L(river, '#B8E6FA', 6, ' stroke-dasharray="18 40"'));
  // forests round the edge, and the odd tree in the middle
  const woods: [number, number, number, number][] = [[-60, 520, 170, 260], [-120, 860, 220, 180], [80, 920, 200, 120], [860, 470, 200, 260], [900, 860, 220, 200], [560, 930, 180, 110], [-140, 140, 240, 200], [1040, 120, 180, 220], [420, 210, 120, 80]];
  for (const [x0, y0, w, h] of woods) {
    const n = Math.round((w * h) / 2600);
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) pts.push([x0 + r() * w, y0 + r() * h]);
    pts.sort((a, b) => a[1] - b[1]);
    for (const [x, y] of pts) o.push(tree(x, y, 0.9 + r() * 0.5, r() < 0.5 ? '#4E8A3E' : '#5E9E48'));
  }
  // roads: Highfell in the middle, one road out to every place
  const roads: [string, string, boolean][] = [
    ['bramblewick', 'M490 600 C440 650 380 660 330 690 C300 706 280 712 262 716', false],
    ['barrow', 'M520 600 C580 640 650 660 700 690 C724 704 742 716 756 726', false],
    ['moonmere', 'M478 520 C440 470 390 420 340 380', true],
    ['emberdeep', 'M522 520 C570 460 640 400 712 338', true],
  ];
  for (const [, d, soon] of roads) {
    if (soon) o.push(L(d, 'rgba(30, 26, 26, 0.45)', 20) + L(d, '#D9C394', 13, ' stroke-dasharray="16 14"'));
    else o.push(L(d, K, 24) + L(d, '#E8CF98', 17) + L(d, '#D2B47A', 3, ' stroke-dasharray="4 18"'));
  }
  // a bridge where the Bramblewick road crosses the river
  o.push(P('M356 668 L392 650 L404 674 L368 692 Z', '#B8865A', 3.5) + L('M360 674 L396 656 M364 686 L400 668', '#8A5A34', 2.5));

  // Moonmere: the elves' lake, misty and very calm
  o.push(`<g class="mp-soon">`);
  o.push(E(265, 330, 150, 78, '#8ED3F0', 4.5) + E(250, 322, 120, 56, '#A9E0F6', 0));
  o.push(L('M170 320 H230 M280 344 H350 M200 352 H250', '#E8F7FF', 4));
  for (const [x, y] of [[132, 340], [140, 360], [392, 318], [400, 340]]) o.push(L(`M${x} ${y} V${y - 22} M${x + 6} ${y} V${y - 16}`, '#3E7A46', 3));
  o.push(P('M300 286 L306 210 L318 210 L324 286 Z', '#EEF4FF', 3.5) + P('M296 214 L312 168 L328 214 Z', '#5B8BD9', 3.5) + `<rect x="306" y="236" width="12" height="16" rx="6" style="${ink('#BDE8FF', 2.5)}"/>`);
  o.push(P('M232 296 L236 250 L246 250 L250 296 Z', '#EEF4FF', 3) + P('M229 254 L241 222 L253 254 Z', '#5B8BD9', 3));
  for (const [x, y, w] of [[180, 300, 90], [330, 360, 110], [230, 390, 80]]) o.push(`<path class="mist" d="M${x} ${y} h${w}" style="fill: none; stroke: #FFFFFF; stroke-width: 12; stroke-linecap: round; opacity: 0.4"/>`);
  o.push(`</g>`);

  // Emberdeep: the dwarves' mountains, forges burning in the rock
  o.push(`<g class="mp-soon">`);
  const peaks: [number, number, number, string][] = [[640, 330, 110, '#8A7E96'], [850, 320, 120, '#7A6E86'], [740, 320, 170, '#9A8EA6'], [690, 350, 90, '#7A6E86'], [810, 352, 80, '#8A7E96']];
  for (const [x, y, h, col] of peaks) {
    o.push(P(`M${x - h * 0.75} ${y} L${x} ${y - h} L${x + h * 0.75} ${y} Z`, col, 4));
    o.push(P(`M${f(x - h * 0.22)} ${f(y - h * 0.7)} L${x} ${y - h} L${f(x + h * 0.22)} ${f(y - h * 0.7)} L${f(x + h * 0.08)} ${f(y - h * 0.62)} L${x} ${f(y - h * 0.7)} L${f(x - h * 0.1)} ${f(y - h * 0.62)} Z`, '#F3F6FF', 3));
  }
  o.push(`<circle cx="742" cy="296" r="70" style="fill: url(#forge)"/>`);
  o.push(P('M724 320 V296 C724 282 760 282 760 296 V320 Z', '#FF8A4C', 3.5) + P('M732 320 V300 C732 292 752 292 752 300 V320 Z', '#FFD36A', 0));
  for (const [x, y, k] of [[742, 200, 1], [756, 170, 0.8], [736, 146, 0.6]] as [number, number, number][]) o.push(`<circle class="smoke" cx="${x}" cy="${y}" r="${14 * k}" style="fill: #B9AFC6; stroke: ${K}; stroke-width: 3; opacity: 0.85"/>`);
  for (let i = 0; i < 7; i++) o.push(pine(600 + i * 40 + r() * 16, 350 + r() * 16, 0.8 + r() * 0.3));
  o.push(`</g>`);

  // Highfell: the market town on its hill, and the Last Lantern on top
  o.push(P('M370 600 C390 520 450 470 500 466 C552 470 612 520 630 600 Z', '#74A64C', 4));
  const houses: [number, number, number, string][] = [[432, 560, 34, '#C8403F'], [474, 524, 30, '#8A5A34'], [530, 522, 34, '#C8403F'], [572, 556, 30, '#4F86C6'], [452, 600, 34, '#8A5A34'], [500, 590, 38, '#4F86C6'], [552, 600, 34, '#C8403F']];
  for (const [x, y, w, roof] of houses) o.push(house(x, y, w, roof));
  o.push(`<circle class="lantglow" cx="502" cy="438" r="46" style="fill: url(#lantglow)"/>`);
  o.push(L('M502 500 V446', K, 5) + P('M492 430 H512 V448 H492 Z', '#FFE08A', 3) + P('M488 430 L502 420 L516 430 Z', '#3A3150', 3));

  // Bramblewick Hollow: round doors in green hills, and the windmill
  o.push(placeSprite('windmill', 182, 694, { k: 0.4 }) + `<g class="mp-sails">${placeSprite('windmill_sails', 182, 618, { k: 0.4 })}</g>`);
  o.push(placeSprite('burrow', 210, 724, { k: 0.36 }) + placeSprite('burrow_red', 290, 712, { k: 0.4 }) + placeSprite('burrow', 330, 748, { k: 0.3 }));
  o.push(placeSprite('cabbages', 228, 770, { k: 0.4 }) + placeSprite('fence', 300, 776, { k: 0.4 }));

  // Barrow Crypt: a dark hill, the gate, the graves
  o.push(`<circle cx="760" cy="700" r="120" style="fill: url(#gloom)"/>`);
  o.push(P('M650 760 C670 690 720 650 770 650 C830 652 870 700 880 760 Z', '#5A5470', 4));
  o.push(placeSprite('tree', 836, 716, { k: 0.42 }) + placeSprite('arch', 762, 744, { k: 0.42 }) + placeSprite('tomb0', 700, 760, { k: 0.42 }) + placeSprite('tomb2', 820, 770, { k: 0.4 }));

  // clouds drift over the top of the world, and soft light over the middle
  for (const [x, y, k] of [[120, 120, 1.1], [620, 70, 0.9], [940, 180, 1.2], [340, -40, 0.8]] as [number, number, number][]) o.push(`<g class="cloud">${cloud(x, y, k)}</g>`);
  o.push(`<rect x="-900" y="-900" width="2800" height="2800" style="fill: url(#mapsun); pointer-events: none"/>`);
  o.push(`<rect x="-900" y="-900" width="2800" height="2800" style="fill: url(#mapvig); pointer-events: none"/>`);
  return o.join('');
}
export const MAP_PLACES = VALE_MAP;

/* ================================================================== a place's backdrop */
export type Lay = 'wide' | 'tall';
/** world sizes: wide places are 1440 by 900, tall ones 800 by 1200 */
export const PLACE_W: Record<Lay, number> = { wide: 1440, tall: 800 };
export const PLACE_H: Record<Lay, number> = { wide: 900, tall: 1200 };

interface At { x: number; y: number; k?: number }
/** where everything in Bramblewick Hollow stands, for each screen shape */
export const BW_AT: Record<Lay, Record<string, At>> = {
  wide: {
    sun: { x: 1050, y: 448 }, windmill: { x: 1250, y: 540, k: 1.05 },
    burrow1: { x: 250, y: 570, k: 0.95 }, burrowRed: { x: 640, y: 552, k: 1.05 }, burrow2: { x: 1000, y: 574, k: 0.8 },
    fence: { x: 930, y: 640 }, cabbages: { x: 930, y: 676, k: 1 },
    moonpetal: { x: 380, y: 716, k: 1.15 }, glowcap: { x: 640, y: 790, k: 1.1 }, bramble: { x: 1160, y: 752, k: 1.05 },
    dottle: { x: 770, y: 640, k: 1 }, rider: { x: 120, y: 836, k: 0.85 },
  },
  tall: {
    sun: { x: 190, y: 380 }, windmill: { x: 660, y: 470, k: 0.85 },
    burrow1: { x: 120, y: 500, k: 0.75 }, burrowRed: { x: 410, y: 488, k: 0.9 }, burrow2: { x: 820, y: 506, k: 0.65 },
    fence: { x: 570, y: 592 }, cabbages: { x: 570, y: 624, k: 0.85 },
    moonpetal: { x: 235, y: 836, k: 1.05 }, glowcap: { x: 330, y: 992, k: 1 }, bramble: { x: 585, y: 772, k: 0.95 },
    dottle: { x: 235, y: 640, k: 0.95 }, rider: { x: 590, y: 1012, k: 0.7 },
  },
};

/** Bramblewick Hollow at dusk: the sky, the hills with their round doors, the windmill, the path. */
export function bramblewickScenery(lay: Lay): string {
  const W = PLACE_W[lay], H = PLACE_H[lay];
  const A = BW_AT[lay];
  const r = rnd(lay === 'wide' ? 5 : 9);
  const o: string[] = [];
  const horizon = lay === 'wide' ? 520 : 452;
  o.push(`<defs>
    <linearGradient id="bwsky" x1="0" y1="${-300}" x2="0" y2="${horizon}" gradientUnits="userSpaceOnUse">${SKY_STOPS}</linearGradient>
    <radialGradient id="bwsun"><stop offset="0" stop-color="#FFF1C4" stop-opacity="0.9"/><stop offset="0.4" stop-color="#FFD48A" stop-opacity="0.35"/><stop offset="1" stop-color="#FFD48A" stop-opacity="0"/></radialGradient>
    <linearGradient id="bwgrass" x1="0" y1="${horizon}" x2="0" y2="${H + 300}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#86BE57"/><stop offset="1" stop-color="#4F8A3A"/></linearGradient>
    <radialGradient id="lampglow"><stop offset="0" stop-color="#FFD36A" stop-opacity="0.55"/><stop offset="1" stop-color="#FFD36A" stop-opacity="0"/></radialGradient>
  </defs>`);
  o.push(`<rect x="-400" y="-400" width="${W + 800}" height="${horizon + 460}" style="fill: url(#bwsky)"/>`);
  for (let i = 0; i < 26; i++) o.push(`<circle cx="${f(-200 + r() * (W + 400))}" cy="${f(-300 + r() * (horizon * 0.45 + 200))}" r="${f(1.2 + r() * 2)}" style="fill: #FFF8EC; opacity: ${f(0.3 + r() * 0.5)}"/>`);
  o.push(`<circle cx="${A.sun.x}" cy="${A.sun.y}" r="220" style="fill: url(#bwsun)"/>` + C(A.sun.x, A.sun.y, 66, '#FFE7A8', 4));
  const cl = lay === 'wide' ? [[260, 250, 1.3], [760, 180, 1], [1240, 300, 1.1]] : [[560, 250, 1.1], [180, 150, 0.9], [470, 60, 0.8]];
  for (const [x, y, k] of cl) o.push(`<g class="cloud">${cloud(x, y, k, '#F6C2A6')}</g>`);
  // far hills, purple in the dusk
  const fy = horizon - 50;
  o.push(P(`M-400 ${fy + 40} C${f(W * 0.1)} ${fy - 40} ${f(W * 0.25)} ${fy - 10} ${f(W * 0.4)} ${fy + 10} C${f(W * 0.58)} ${fy + 30} ${f(W * 0.7)} ${fy - 50} ${f(W * 0.85)} ${fy - 20} C${f(W * 0.95)} ${fy} ${W + 200} ${fy - 30} ${W + 400} ${fy + 10} V${H + 400} H-400 Z`, '#6E5E9A', 4));
  // the windmill on its hill, behind the near hills
  o.push(placeSprite('windmill', A.windmill.x, A.windmill.y, { k: A.windmill.k }));
  o.push(`<g class="sails" style="transform-origin: ${A.windmill.x}px ${f(A.windmill.y - 186 * A.windmill.k!)}px">${placeSprite('windmill_sails', A.windmill.x, A.windmill.y - 186 * A.windmill.k!, { k: A.windmill.k })}</g>`);
  // the near hills and the meadow
  const my = horizon;
  o.push(P(`M-400 ${my + 30} C${f(W * 0.12)} ${my - 30} ${f(W * 0.3)} ${my - 20} ${f(W * 0.46)} ${my} C${f(W * 0.62)} ${my + 20} ${f(W * 0.78)} ${my - 26} ${W + 400} ${my + 10} V${H + 400} H-400 Z`, 'url(#bwgrass)', 4));
  for (let i = 0; i < 60; i++) { const x = -200 + r() * (W + 400), y = my + 40 + r() * (H - my + 200); o.push(L(`M${f(x - 7)} ${f(y - 9)} L${f(x)} ${f(y)} L${f(x + 7)} ${f(y - 10)}`, '#5E9A45', 3)); }
  for (let i = 0; i < 26; i++) { const x = -200 + r() * (W + 400), y = my + 60 + r() * (H - my + 160); const c = ['#FFF3C4', '#F7A6C8', '#BDE8FF', '#FFFFFF'][i % 4]; o.push(C(x, y, 5, c, 2.5) + C(x, y, 1.8, '#F2C230', 0)); }
  // the path up to Dottle's door
  const door = A.burrowRed;
  const path = lay === 'wide'
    ? `M60 ${H + 80} C120 840 260 800 420 760 C560 726 600 640 ${door.x} ${door.y + 6}`
    : `M700 ${H + 80} C660 1100 520 1040 470 960 C420 880 420 640 ${door.x} ${door.y + 6}`;
  o.push(L(path, K, 64) + L(path, '#D9B57A', 56) + L(path, '#C9A26A', 4, ' stroke-dasharray="6 26"'));
  // burrows: round doors in the hills, Dottle's is the red one
  o.push(placeSprite('burrow', A.burrow1.x, A.burrow1.y, { k: A.burrow1.k }));
  o.push(placeSprite('burrow', A.burrow2.x, A.burrow2.y, { k: A.burrow2.k }));
  o.push(placeSprite('burrow_red', door.x, door.y, { k: door.k }));
  // bunting strung from Dottle's hill to the next
  const b0 = { x: A.burrow1.x + 60 * A.burrow1.k!, y: A.burrow1.y - 140 * A.burrow1.k! }, b1 = { x: door.x - 70 * door.k!, y: door.y - 150 * door.k! };
  const mx = (b0.x + b1.x) / 2, sag = (b0.y + b1.y) / 2 + 40;
  o.push(L(`M${f(b0.x)} ${f(b0.y)} Q${f(mx)} ${f(sag + 30)} ${f(b1.x)} ${f(b1.y)}`, K, 3));
  const flags = ['#C8403F', '#F2C230', '#4F86C6', '#6FBF4A', '#B79CFF', '#FF8A4C'];
  for (let i = 1; i < 9; i++) {
    const t = i / 9, x = (1 - t) * (1 - t) * b0.x + 2 * (1 - t) * t * mx + t * t * b1.x, y = (1 - t) * (1 - t) * b0.y + 2 * (1 - t) * t * (sag + 30) + t * t * b1.y;
    o.push(P(`M${f(x - 10)} ${f(y)} L${f(x)} ${f(y + 22)} L${f(x + 10)} ${f(y)} Z`, flags[i % flags.length], 2.5));
  }
  // lamp posts along the path
  const lamps = lay === 'wide' ? [[480, 752], [190, 640]] : [[462, 724], [330, 560]];
  for (const [x, y] of lamps) o.push(`<circle class="lamp" cx="${x}" cy="${y - 92}" r="46" style="fill: url(#lampglow)"/>` + L(`M${x} ${y} V${y - 80}`, K, 6) + L(`M${x} ${y} V${y - 80}`, '#6B4528', 3) + P(`M${x - 10} ${y - 104} H${x + 10} V${y - 82} H${x - 10} Z`, '#FFE08A', 3) + P(`M${x - 14} ${y - 104} L${x} ${y - 114} L${x + 14} ${y - 104} Z`, '#3A3150', 3));
  // the cabbage patch behind its fence
  o.push(placeSprite('fence', A.fence.x - 120, A.fence.y) + placeSprite('fence', A.fence.x, A.fence.y) + placeSprite('fence', A.fence.x + 120, A.fence.y));
  o.push(placeSprite('cabbages', A.cabbages.x, A.cabbages.y, { k: A.cabbages.k }));
  return o.join('');
}

/** spots where a lost thing can be hiding, for the find errands */
export const BW_HIDE: Record<Lay, At[]> = {
  wide: [{ x: 1020, y: 682 }, { x: 196, y: 566 }, { x: 1300, y: 552 }, { x: 760, y: 548 }, { x: 470, y: 838 }, { x: 1052, y: 572 }],
  tall: [{ x: 650, y: 634 }, { x: 150, y: 526 }, { x: 640, y: 482 }, { x: 520, y: 500 }, { x: 170, y: 1000 }, { x: 470, y: 905 }],
};
/** where the crows land and where the sparks jump, for the shoo errands */
export function shooSpots(lay: Lay, thing: string): At[] {
  const A = BW_AT[lay];
  if (thing === 'crow') {
    const c = A.cabbages, s = lay === 'wide' ? 1 : 0.85;
    return [[-46, -12], [-6, -24], [40, -14], [86, -4], [-24, 14], [62, 18]].map(([dx, dy]) => ({ x: c.x + dx * s, y: c.y + dy * s }));
  }
  const d = A.burrowRed, k = d.k || 1;
  return [[-120, -150], [-60, -176], [0, -168], [60, -150], [-150, -110], [110, -116]].map(([dx, dy]) => ({ x: d.x + dx * k, y: d.y + dy * k }));
}

/* ================================================================== the ride */
/** one tile of a strip that scrolls past on a ride: `w` wide, starting and ending at the same height */
export function rideStrips(): { far: string; mid: string; near: string; w: number } {
  const r = rnd(3);
  const w = 1600;
  // far: purple hills and a distant windmill
  let far = P(`M0 430 C200 360 400 380 600 410 C800 440 1000 350 1200 380 C1400 410 1500 420 1600 430 V720 H0 Z`, '#6E5E9A', 4);
  far += placeSprite('windmill', 1000, 382, { k: 0.34 }) + placeSprite('windmill_sails', 1000, 318, { k: 0.34 });
  // mid: green hills, round doors, trees
  let mid = P(`M0 500 C160 440 360 450 520 480 C700 512 860 440 1040 450 C1220 460 1420 500 1600 500 V720 H0 Z`, '#6DA24A', 4);
  mid += placeSprite('burrow', 300, 500, { k: 0.42 }) + placeSprite('burrow_red', 1180, 492, { k: 0.4 });
  for (let i = 0; i < 9; i++) { const x = 60 + i * 170 + r() * 60; if (Math.abs(x - 300) < 90 || Math.abs(x - 1180) < 90) continue; mid += tree(x, 496 + r() * 16, 0.9 + r() * 0.3, i % 2 ? '#4E8A3E' : '#5E9E48'); }
  // near: the road, the verge, fence posts and flowers rushing past
  let near = `<rect x="-2" y="560" width="${w + 4}" height="200" style="fill: #79B04F"/>` + `<rect x="-2" y="596" width="${w + 4}" height="56" style="fill: #D9B57A"/>` + L(`M-2 596 H${w + 2} M-2 652 H${w + 2}`, K, 4);
  for (let x = 40; x < w; x += 200) near += L(`M${x} 624 H${x + 40}`, '#C9A26A', 5);
  for (let x = 80; x < w; x += 260) near += P(`M${x - 6} 590 V548 H${x + 6} V590 Z`, '#8A5A34', 3) + L(`M${x - 6} 562 H${x + 254}`, '#6B4528', 4);
  for (let i = 0; i < 22; i++) { const x = r() * w, y = 672 + r() * 40; near += C(x, y, 5, ['#FFF3C4', '#F7A6C8', '#BDE8FF'][i % 3], 2.5); }
  return { far, mid, near, w };
}
