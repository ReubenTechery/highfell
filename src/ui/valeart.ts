/**
 * Outdoor scenery helpers, drawn in code in the house style (one black line, flat colour): the dusk
 * sky, trees, clouds and cottages the house is drawn among (see houseart.ts).
 */
const K = '#1E1A1A';
const ink = (fill: string, w = 4) => `fill: ${fill}; stroke: ${K}; stroke-width: ${w}; stroke-linejoin: round; stroke-linecap: round`;
export const P = (d: string, fill: string, w = 4, extra = ''): string => `<path d="${d}" style="${ink(fill, w)}"${extra}/>`;
export const L = (d: string, col = K, w = 3, extra = ''): string => `<path d="${d}" style="fill: none; stroke: ${col}; stroke-width: ${w}; stroke-linecap: round; stroke-linejoin: round"${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, w = 4, extra = ''): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" style="${w ? ink(fill, w) : 'fill: ' + fill}"${extra}/>`;
const f = (n: number): string => (Math.round(n * 10) / 10).toString();

/** the dusk sky every outdoor scene shares */
export const SKY_STOPS = `<stop offset="0" stop-color="#2E2A55"/><stop offset="0.42" stop-color="#7A4E86"/><stop offset="0.7" stop-color="#E98A6A"/><stop offset="1" stop-color="#FFD48A"/>`;

/** a round tree: trunk, canopy and a highlight */
export function tree(x: number, y: number, k: number, col = '#4E8A3E'): string {
  return P(`M${f(x - 5 * k)} ${f(y)} L${f(x - 4 * k)} ${f(y - 22 * k)} H${f(x + 4 * k)} L${f(x + 5 * k)} ${f(y)} Z`, '#7A5238', 3)
    + C(x, y - 40 * k, 24 * k, col, 3.5) + C(x - 8 * k, y - 48 * k, 7 * k, 'rgba(255, 255, 255, 0.18)', 0);
}
/** a soft cloud */
export function cloud(x: number, y: number, k: number, fill = '#FFF3E4'): string {
  return P(`M${f(x - 60 * k)} ${f(y)} C${f(x - 64 * k)} ${f(y - 22 * k)} ${f(x - 36 * k)} ${f(y - 30 * k)} ${f(x - 24 * k)} ${f(y - 22 * k)} C${f(x - 18 * k)} ${f(y - 44 * k)} ${f(x + 14 * k)} ${f(y - 46 * k)} ${f(x + 22 * k)} ${f(y - 26 * k)} C${f(x + 40 * k)} ${f(y - 34 * k)} ${f(x + 64 * k)} ${f(y - 20 * k)} ${f(x + 60 * k)} ${f(y)} Z`, fill, 3.5);
}
/** a cottage for Highfell: walls, a roof, a lit window */
export function house(x: number, y: number, w: number, roof: string): string {
  const h = w * 0.62;
  return P(`M${f(x - w / 2)} ${f(y)} V${f(y - h)} H${f(x + w / 2)} V${f(y)} Z`, '#F3E6CC', 3)
    + P(`M${f(x - w / 2 - 5)} ${f(y - h)} L${f(x)} ${f(y - h - w * 0.5)} L${f(x + w / 2 + 5)} ${f(y - h)} Z`, roof, 3)
    + `<rect x="${f(x - w * 0.16)}" y="${f(y - h * 0.68)}" width="${f(w * 0.32)}" height="${f(h * 0.36)}" style="${ink('#FFD36A', 2.5)}"/>`;
}
