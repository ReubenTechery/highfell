/** Small geometry helpers shared by the engine, the hearth and the tools. */
export const TAU = Math.PI * 2;
export interface Pt { x: number; y: number }

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);
export const distXY = (ax: number, ay: number, bx: number, by: number): number => Math.hypot(ax - bx, ay - by);
export const angTo = (a: Pt, b: Pt): number => Math.atan2(b.y - a.y, b.x - a.x);
export const angDiff = (a: number, b: number): number => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};
export const norm = (x: number, y: number): Pt => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
