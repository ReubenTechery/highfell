/** The UI's view of the generated art: icon tiles, sprites as images or inline SVG, portraits. */
import ICONS from '../../art/icons.json';
import COLLECT_ICONS from '../../art/collect_icons.json';
import SPRITES from '../../art/sprites.json';
import HEARTH from '../../art/hearth.json';
import PORTRAITS from '../../art/portraits.json';
import { COLLECTIBLES, ITEMS } from '../content';
import { RARITY, ROLE_SLOTS } from '../content/gear';
import type { RoleId } from '../content/types';

type Sprite = { svg: string; vb: number[] };
export const TILES: Record<string, string> = { ...(ICONS as Record<string, string>), ...(COLLECT_ICONS as Record<string, string>) };
export const ART: Record<string, Sprite> = { ...(SPRITES as Record<string, Sprite>), ...(HEARTH as Record<string, Sprite>) };
export const PORTRAIT: Record<string, string> = PORTRAITS as Record<string, string>;

/** An icon tile as markup. */
export const tile = (name: string): string => TILES[name] || TILES.mend || '';

/** The icon for anything with an id: regular gear, set pieces, uniques, collectibles. */
export function iconOf(id: string): string {
  const it = ITEMS[id];
  if (it) return tile(it.kind === 'gear' ? ROLE_SLOTS[it.role][it.slot].icon : it.icon);
  const c = COLLECTIBLES[id];
  if (c) return tile(c.icon);
  return tile('mend');
}
/** The frame colour for an id: rarity for gear, gold for uniques, pale for collectibles. */
export function colourOf(id: string): string {
  const it = ITEMS[id];
  if (it) return it.kind === 'gear' ? RARITY[it.rar].color : '#E7B53C';
  const c = COLLECTIBLES[id];
  if (c) return c.kind === 'pet' ? '#9BE15D' : c.kind === 'mount' ? '#8FD6FF' : '#C9A27A';
  return '#8E8A84';
}
export const nameOf = (id: string): string => ITEMS[id]?.name || COLLECTIBLES[id]?.name || id;

/** A sprite as an <img> source. Cached. */
const urls: Record<string, string> = {};
export function spriteURL(name: string): string {
  if (urls[name]) return urls[name];
  const s = ART[name];
  return (urls[name] = s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg) : '');
}
/** A sprite's inner markup, for nesting inside a bigger SVG. */
const inner: Record<string, string> = {};
function innerOf(name: string): string {
  if (inner[name] !== undefined) return inner[name];
  const s = ART[name]?.svg || '';
  return (inner[name] = s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>')));
}
/** Place a sprite inside a parent SVG with its ground point at (x, y). */
export function placeSprite(name: string, x: number, y: number, o: { k?: number; flip?: boolean; cls?: string; attrs?: string } = {}): string {
  const s = ART[name];
  if (!s) return '';
  const k = o.k ?? 1;
  const [vx, vy, w, h] = s.vb;
  const body = `<svg x="${(x + vx * k).toFixed(1)}" y="${(y + vy * k).toFixed(1)}" width="${(w * k).toFixed(1)}" height="${(h * k).toFixed(1)}" viewBox="${vx} ${vy} ${w} ${h}" overflow="visible">${o.flip ? `<g transform="scale(-1 1) translate(${-(2 * vx + w)} 0)">${innerOf(name)}</g>` : innerOf(name)}</svg>`;
  return `<g class="${o.cls || ''}" ${o.attrs || ''}>${body}</g>`;
}
export const portrait = (role: RoleId): string => PORTRAIT[role] || '';
