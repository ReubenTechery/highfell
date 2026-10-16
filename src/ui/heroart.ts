/**
 * Heroes in layers (art/heroes.json, drawn by tools/art_gear.py): a body for the race, sex and class, in plain
 * underclothes, and a layer for each gear slot drawn from the item worn there, so what a hero wears is what you
 * see. A class's gear is drawn once, on its reference body; each part of a layer names a region and moves onto a
 * body by that body's fit (where the reference's landmarks fall on it), as the tool does: only the coordinates
 * move, so the ink keeps its weight. Parts are drawn band by band, back to front, the body first in each band.
 * Nothing here touches the page: it makes SVG text, so the run can bake it and the tests can read it.
 */
import HEROES from '../../art/heroes.json';
import { ITEMS } from '../content';
import { gearKey } from '../content/gear';
import type { ItemDef, Rar, RoleId, SlotId } from '../content/types';

type Pt = [number, number];
type View = 'f' | 'b';
type Frag = [string, string, string];
interface Fit { spine: [number, number, number][]; head: number[]; sh: number[]; main: number[]; off: number[]; arm: number[]; arm2: number[] }
interface BodyView { vb: number[]; top: number; fit: Fit; z: Record<string, string> }
export interface Body { cls: string; fem: boolean; f: BodyView; b: BodyView }
export interface Layer { cls: string; slot: SlotId; f: Frag[]; b: Frag[]; fw?: Frag[]; bw?: Frag[]; glow?: Pt }
interface RefView { head: Pt; sh: number; main: Pt; off: Pt; arm: Pt; arm2: Pt }
interface HeroArt {
  bands: Record<View, string[]>; slots: SlotId[]; ref: Record<string, Record<View, RefView>>;
  bodies: Record<string, Body>; layers: Record<string, Layer>; gild: Record<string, string>;
  races: Record<string, { map: Record<string, string>; gear: boolean }>;
}
export const HERO_ART_DATA = HEROES as unknown as HeroArt;
const H = HERO_ART_DATA;

/** What a hero looks like: their body, the layer worn in each slot, the slots drawn gilded, and whether their
 *  race's gold look (Gilded Bones, Gilded Gnomes) is on. */
export interface Look { body: string; slots: Partial<Record<SlotId, string>>; gold: SlotId[]; race?: string | null }
/** A composed picture: SVG text in game units round the ground point, and its box. */
export interface Pic { svg: string; vb: number[] }
/** Where a picture's weapon glows (seen from the front) and the top of its head: what floats over a hero goes above it. */
export interface HeroFitOut { weapon: Pt; top: number }

export const bodyId = (race: string, cls: string, sex: string): string => `${race}.${cls}.${sex}`;
/** Whether a race, class and sex is drawn in layers yet (classes move over one at a time). */
export const layered = (race: string, cls: string, sex: string): boolean => !!H.bodies[bodyId(race, cls, sex)];

/** The layer that draws an item: regular gear by its role, slot and rarity (Epic test gear wears the Rare look),
 *  a set piece or boss weapon by its own id. */
export function layerOf(def: ItemDef): string {
  return def.kind === 'gear' ? `gear.${gearKey(def)}.${def.slot}.${Math.min(def.rar, 2)}` : def.id;
}
/** Regular gear in every slot (bots, test runs, a hero being made), at one rarity or one per slot: its layers. */
export function plainSlots(role: RoleId, cls: string | undefined, rar: Rar | Partial<Record<string, { rar: number }>>): Partial<Record<SlotId, string>> {
  const key = gearKey({ role, cls }), at = (s: SlotId): number => (typeof rar === 'number' ? rar : rar[s]?.rar ?? 0);
  return Object.fromEntries(H.slots.map((s) => [s, `gear.${key}.${s}.${Math.min(at(s), 2)}`]));
}
/** The boss weapon whose effect a loadout carries (the Crypt Trial hands one out by its effect). */
export const weaponByEffect = (effect: string | null | undefined): string | null =>
  (effect && Object.values(ITEMS).find((d) => d.slot === 'weapon' && d.effect === effect)?.id) || null;

// ---------------------------------------------------------------- moving shapes
type Fn = (x: number, y: number) => Pt;
const ARGS: Record<string, number> = { M: 2, L: 2, C: 6, Q: 4, S: 4, T: 2, H: 1, V: 1, Z: 0 };
/** a number as the tool writes it: one decimal, no trailing zero */
const num = (v: number): string => { const s = v.toFixed(1); return s.endsWith('.0') ? s.slice(0, -2) : s; };

/** a path with every point moved by fn; H and V become L, since a stretch can tilt them */
function warpPath(d: string, fn: Fn): string {
  const toks = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)/g) || [];
  const out: string[] = [];
  let cmd = '', cx = 0, cy = 0, sx = 0, sy = 0, i = 0;
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) {
      cmd = toks[i++];
      if (cmd === 'Z') { out.push('Z'); cx = sx; cy = sy; continue; }
    }
    const n = ARGS[cmd];
    if (!n) { i++; continue; }
    const v = toks.slice(i, i + n).map(Number);
    i += n;
    const pts: Pt[] = [];
    if (cmd === 'H') pts.push([v[0], cy]);
    else if (cmd === 'V') pts.push([cx, v[0]]);
    else for (let k = 0; k < v.length; k += 2) pts.push([v[k], v[k + 1]]);
    out.push((cmd === 'H' || cmd === 'V' ? 'L' : cmd) + pts.map(([x, y]) => { const [a, b] = fn(x, y); return `${num(a)} ${num(b)}`; }).join(' '));
    [cx, cy] = pts[pts.length - 1];
    if (cmd === 'M') { sx = cx; sy = cy; cmd = 'L'; }
  }
  return out.join(' ');
}
/** how much fn stretches across and down at a point */
function scaleAt(fn: Fn, x: number, y: number): Pt {
  return [Math.abs(fn(x + 0.5, y)[0] - fn(x - 0.5, y)[0]), Math.abs(fn(x, y + 0.5)[1] - fn(x, y - 0.5)[1])];
}
/** shapes (paths, circles, ellipses) with their coordinates moved by fn; the ink keeps its weight */
export function warp(svg: string, fn: Fn): string {
  return svg
    .replace(/ d="([^"]+)"/g, (_, d: string) => ` d="${warpPath(d, fn)}"`)
    .replace(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/g, (_, a: string, b: string, r: string) => {
      const x = +a, y = +b, [jx, jy] = scaleAt(fn, x, y), [nx, ny] = fn(x, y);
      return `<circle cx="${num(nx)}" cy="${num(ny)}" r="${num(+r * Math.sqrt(jx * jy))}"`;
    })
    .replace(/<ellipse cx="([-\d.]+)" cy="([-\d.]+)" rx="([-\d.]+)" ry="([-\d.]+)"/g, (_, a: string, b: string, rx: string, ry: string) => {
      const x = +a, y = +b, [jx, jy] = scaleAt(fn, x, y), [nx, ny] = fn(x, y);
      return `<ellipse cx="${num(nx)}" cy="${num(ny)}" rx="${num(+rx * jx)}" ry="${num(+ry * jy)}"`;
    });
}
/** (y on the body, how wide) at reference height y, through the spine's knots, straight on past the ends */
function spineAt(knots: [number, number, number][], y: number): Pt {
  const ks = [...knots].sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (y >= b[0] || i === ks.length - 2) {
      const t = (y - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * Math.min(1, Math.max(0, t))];
    }
  }
  return [y, 1];
}
/** how a point of the class's reference body moves onto a body, for one region (see tools/art_gear.py) */
export function regionFn(cls: string, view: View, fit: Fit, region: string): Fn {
  const r = H.ref[cls][view];
  if (region === 'spine') return (x, y) => { const [yy, k] = spineAt(fit.spine, y); return [x * k, yy]; };
  if (region === 'sh') { const [ty, k] = fit.sh; return (x, y) => [x * k, ty + (y - r.sh) * k]; }
  if (region === 'arm' || region === 'arm2') {
    // the reference arm, shoulder to grip, laid along the body's: turned and scaled about the shoulder
    const grip = region === 'arm' ? 'main' : 'off';
    const [ax, ay] = r[region], [bx, by] = r[grip], [cx, cy] = fit[region], [dx, dy] = fit[grip];
    const k = Math.hypot(dx - cx, dy - cy) / Math.hypot(bx - ax, by - ay);
    const a = Math.atan2(dy - cy, dx - cx) - Math.atan2(by - ay, bx - ax), co = Math.cos(a) * k, si = Math.sin(a) * k;
    return (x, y) => [cx + (x - ax) * co - (y - ay) * si, cy + (x - ax) * si + (y - ay) * co];
  }
  // a fourth number slides what the hand holds up or down through it (a short body's staff stays on the ground)
  const [rx, ry] = r[region as 'head' | 'main' | 'off'], [tx, ty, k, dy = 0] = fit[region as 'head' | 'main' | 'off'];
  return (x, y) => [tx + (x - rx) * k, ty + (y - ry) * k + dy];
}
/** colours swapped by a map (gild(): bone and steel to gold) */
export const recolour = (svg: string, map: Record<string, string>): string => svg.replace(/#[0-9A-Fa-f]{6}/g, (c) => map[c.toUpperCase()] || c);

// ---------------------------------------------------------------- composing
/** A body wearing its look, one view, as SVG shapes in game units, with the body's box. */
export function composeLook(look: Look, view: View): Pic | null {
  const body = H.bodies[look.body];
  if (!body) return null;
  const bv = body[view], fns: Record<string, Fn> = {};
  const fn = (region: string): Fn => fns[region] || (fns[region] = regionFn(body.cls, view, bv.fit, region));
  const race = look.race ? H.races[look.race] : null;
  const out: string[] = [];
  for (const band of H.bands[view]) {
    const z = bv.z[band];
    if (z) out.push(race ? recolour(z, race.map) : z);
    for (const slot of H.slots) {
      const id = look.slots[slot], L = id ? H.layers[id] : null;
      if (!L) continue;
      for (const [b, region, svg] of (body.fem && L[`${view}w`]) || L[view]) {
        if (b !== band) continue;
        let part = warp(svg, fn(region));
        if (look.gold.includes(slot)) part = recolour(part, H.gild);
        if (race?.gear) part = recolour(part, race.map);
        out.push(part);
      }
    }
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bv.vb.join(' ')}" width="${bv.vb[2]}" height="${bv.vb[3]}">${out.join('')}</svg>`, vb: bv.vb };
}
/** Where a look's weapon glows (its weapon's own glow point, moved onto the body's grip) and its head's top. */
export function fitOfLook(look: Look): HeroFitOut | null {
  const body = H.bodies[look.body];
  if (!body) return null;
  const w = look.slots.weapon ? H.layers[look.slots.weapon] : null;
  const glow = w?.glow || H.ref[body.cls].f.main;
  const [x, y] = regionFn(body.cls, 'f', body.f.fit, 'main')(glow[0], glow[1]);
  return { weapon: [Math.round(x), Math.round(y)], top: body.f.top };
}
/** A short stable name for a look, so the same look is composed once. */
export function lookName(look: Look): string {
  const key = [look.body, ...H.slots.map((s) => look.slots[s] || ''), look.gold.slice().sort().join('+'), look.race || ''].join('|');
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0;
  return `hero.${h.toString(36)}`;
}
