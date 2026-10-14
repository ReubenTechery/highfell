/** The UI's view of the generated art: icon tiles, sprites as images or inline SVG, portraits. */
import ICONS from '../../art/icons.json';
import COLLECT_ICONS from '../../art/collect_icons.json';
import SPRITES from '../../art/sprites.json';
import HEARTH from '../../art/hearth.json';
import PORTRAITS from '../../art/portraits.json';
import VALE from '../../art/vale.json';
import VALE_ICONS from '../../art/vale_icons.json';
import { COLLECTIBLES, ITEMS } from '../content';
import { RARITY, ROLE_SLOTS } from '../content/gear';
import { heroArt } from '../content/folk';
import { ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import type { Profile } from '../meta/profile';

type Sprite = { svg: string; vb: number[] };
export const TILES: Record<string, string> = { ...(ICONS as Record<string, string>), ...(COLLECT_ICONS as Record<string, string>), ...(VALE_ICONS as Record<string, string>) };
export const ART: Record<string, Sprite> = { ...(SPRITES as Record<string, Sprite>), ...(HEARTH as Record<string, Sprite>), ...(VALE as Record<string, Sprite>) };
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
/** How an item's rarity reads: regular gear by its rarity, set pieces are Epic, dungeon weapons are Unique. */
export interface RarLook { key: string; name: string; color: string; ink: string; light: string }
const LIGHT = ['#D9D4CB', '#86D872', '#6FB0F2', '#BE98FF'];
export function rarLook(id: string): RarLook {
  const it = ITEMS[id];
  if (it && it.kind === 'unique') return { key: 'unique', name: 'Unique', color: '#E7B53C', ink: '#8A5A10', light: '#F7C948' };
  const r = it ? (it.kind === 'set' ? 3 : it.rar) : 0;
  return { key: RARITY[r].key, name: RARITY[r].name, color: RARITY[r].color, ink: RARITY[r].ink, light: LIGHT[r] };
}
/** The frame colour for an id: rarity for gear and set pieces, gold for uniques, pale for collectibles. */
export function colourOf(id: string): string {
  const it = ITEMS[id];
  if (it) return rarLook(id).color;
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

/** A hero riding a mount, side on, for a parent SVG with the mount's feet at (x, y). The hero sits
 *  behind the saddle, so the mount's back hides their legs. Flipped, the mount faces left. */
export function riderSvg(heroSprite: string, mountId: string, x: number, y: number, o: { k?: number; flip?: boolean; cls?: string } = {}): string {
  const c = COLLECTIBLES[mountId];
  const k = o.k ?? 1;
  const sd = c?.saddle || { x: -8, y: -88, k: 0.92 };
  const hx = x + (o.flip ? -sd.x : sd.x) * k, hy = y + sd.y * k;
  return `<g class="${o.cls || ''}">${placeSprite(heroSprite + '_f', hx, hy, { k: sd.k * k, cls: 'rider-h' })}${placeSprite(c?.sprite || 'mount_goat', x, y, { k, flip: o.flip, cls: 'rider-m' })}</g>`;
}

/** Gilded Bones (the heroic Barrow log's reward) is yours and switched on: the Risen are drawn in gold. */
export const gildedBones = (p: Profile): boolean => !!p.collection['cosmetic.gilded_bones'] && !p.settings.looksOff.includes('cosmetic.gilded_bones');
/** The sprite set a hero is drawn with: its race and class art (gilded for a Risen hero when Gilded
 *  Bones is on, given the save), or its seat's art if this build has none. */
export function heroSprite(h: { race: string; cls: string }, role: RoleId, p?: Profile): string {
  const art = heroArt(h.race, h.cls) || ROLES[role].sprite;
  return p && h.race === 'risen' && gildedBones(p) ? `${art}_gilded` : art;
}
/** A hero's front sprite as an <img>, sized by its own height so a dwarf stands shorter than an elf. */
export function heroImg(sprite: string, o: { cls?: string; alt?: string } = {}): string {
  const s = ART[sprite + '_f'];
  if (!s) return '';
  const [vx, , w, h] = s.vb;
  return `<img class="${o.cls || ''}" src="${spriteURL(sprite + '_f')}" alt="${o.alt || ''}" style="--sh: ${(h / 130).toFixed(3)}; --sx: ${((vx / w) * 100).toFixed(1)}%; aspect-ratio: ${w} / ${h}" draggable="false">`;
}
