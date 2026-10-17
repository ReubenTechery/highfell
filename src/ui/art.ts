/** The UI's view of the generated art: icon tiles, sprites as images or inline SVG, portraits. */
import ICONS from '../../art/icons.json';
import COLLECT_ICONS from '../../art/collect_icons.json';
import SPRITES from '../../art/sprites.json';
import HEARTH from '../../art/hearth.json';
import PORTRAITS from '../../art/portraits.json';
import VALE from '../../art/vale.json';
import VALE_ICONS from '../../art/vale_icons.json';
import WARDROBE from '../../art/wardrobe.json';
import { COLLECTIBLES, ITEMS, KITS, itemOf } from '../content';
import { RARITY, ROLE_SLOTS, gearKey } from '../content/gear';
import { xpThing } from '../content/xp';
import { FOUNDERS, defaultSex } from '../content/folk';
import type { Rar, RoleId, SlotId } from '../content/types';
import { gildedOn, worn } from '../meta/gear';
import type { Hero, Profile } from '../meta/profile';
import { bodyId, composeLook, fitOfLook, layerOf, lookName, plainSlots, weaponByEffect, type HeroFitOut, type Look } from './heroart';

type Sprite = { svg: string; vb: number[] };
export const TILES: Record<string, string> = { ...(ICONS as Record<string, string>), ...(COLLECT_ICONS as Record<string, string>), ...(VALE_ICONS as Record<string, string>) };
export const ART: Record<string, Sprite> = { ...(SPRITES as Record<string, Sprite>), ...(HEARTH as Record<string, Sprite>), ...(VALE as Record<string, Sprite>) };
export const PORTRAIT: Record<string, string> = PORTRAITS as Record<string, string>;

/** An icon tile as markup. */
export const tile = (name: string): string => TILES[name] || TILES.mend || '';

/** The icon for anything with an id: regular gear, set pieces, uniques, gilding kits (the piece, gilded), collectibles. */
export function iconOf(id: string): string {
  const it = ITEMS[id];
  if (it) return tile(it.icon || ROLE_SLOTS[gearKey(it)][it.slot].icon);
  if (KITS[id]) return tile(KITS[id].icon);
  const c = COLLECTIBLES[id];
  if (c) return tile(c.icon);
  const x = xpThing(id);
  if (x) return tile(x.icon);
  return tile('mend');
}
/** How an item's rarity reads: regular gear by its rarity, set pieces are Epic, dungeon weapons are Unique,
 *  and a gilding kit is gold. */
export interface RarLook { key: string; name: string; color: string; ink: string; light: string }
const LIGHT = ['#D9D4CB', '#86D872', '#6FB0F2', '#BE98FF'];
const KIT_LOOK: RarLook = { key: 'kit', name: 'Kit', color: '#F2C230', ink: '#8A5A10', light: '#FFE08A' };
export function rarLook(id: string): RarLook {
  if (KITS[id]) return KIT_LOOK;
  const it = ITEMS[id];
  if (it && it.kind === 'unique') return { key: 'unique', name: 'Unique', color: '#E7B53C', ink: '#8A5A10', light: '#F7C948' };
  const r = it ? (it.kind === 'set' ? 3 : it.rar) : 0;
  return { key: RARITY[r].key, name: RARITY[r].name, color: RARITY[r].color, ink: RARITY[r].ink, light: LIGHT[r] };
}
/** The frame colour for an id: rarity for gear and set pieces, gold for uniques, pale for collectibles. */
export function colourOf(id: string): string {
  if (ITEMS[id] || KITS[id]) return rarLook(id).color;
  const c = COLLECTIBLES[id];
  if (c) return c.kind === 'pet' ? '#9BE15D' : c.kind === 'mount' ? '#8FD6FF' : '#C9A27A';
  // XP: violet, the Grand Tome gold
  if (xpThing(id)) return id === 'xp.grand' ? '#F2C230' : XP_VIOLET;
  return '#8E8A84';
}
/** the colour of XP everywhere: the numbers over a kill, the bar, the pages */
export const XP_VIOLET = '#B98CFF';
export const nameOf = (id: string): string => ITEMS[id]?.name || KITS[id]?.name || COLLECTIBLES[id]?.name || xpThing(id)?.name || id;

/** A set on its armour stand (art/wardrobe.json): the pieces `on` says you have are put on, the rest are
 *  ghosts, and `drop` is the piece that has just arrived. The weapon leans behind the stand; the chest,
 *  shoulders and helm go on top. A ghost is one dashed line round the piece's whole silhouette: the
 *  silhouette masks out its own line, so only the outer half shows and shapes that overlap don't, then the
 *  silhouette is filled faintly as one layer (styles.css: .gm, .go, .gf). */
const WD: { vb: number[]; stand: string; pieces: Record<string, string>; boxes: Record<string, number[]> } = WARDROBE;
const LAYERS = ['weapon', 'stand', 'chest', 'shoulders', 'helm'];
let ghosts = 0;
function ghostOf(g: string): string {
  const sil = g.slice(g.indexOf('<g class="sil">') + 15, g.indexOf('</g><g class="det">'));
  const [x, y, w, h] = WD.vb, box = `x="${x}" y="${y}" width="${w}" height="${h}"`, id = `wg${++ghosts}`;
  return `${g.slice(0, g.indexOf('>') + 1).replace('class="pc ', 'class="pc ghost ')}<mask id="${id}" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#fff"/><g class="gm">${sil}</g></mask>`
    + `<g class="go" mask="url(#${id})">${sil}</g><g class="gf">${sil}</g></g>`;
}
export function standSvg(pieces: string[], on: (id: string) => boolean, o: { drop?: string; cls?: string } = {}): string {
  const [x, y, w, h] = WD.vb;
  const layer = (slot: string): string => {
    if (slot === 'stand') return WD.stand;
    const id = pieces.find((pid) => itemOf(pid)?.slot === slot), g = id && WD.pieces[id];
    if (!id || !g) return '';
    if (!on(id)) return ghostOf(g);
    return id === o.drop ? g.replace('class="pc ', 'class="pc drop ') : g;
  };
  return `<svg class="stand ${o.cls || ''}" viewBox="${x} ${y} ${w} ${h}" aria-hidden="true">${LAYERS.map(layer).join('')}</svg>`;
}
/** One piece of a set (or a boss weapon) on its own, in full colour, framed by its box: what it looks like.
 *  A gilding kit is its piece gilded, in the plain one's box. */
export function pieceSvg(id: string, cls = ''): string {
  const g = WD.pieces[id], b = WD.boxes[id.replace(/\.gilded$/, '')];
  return g && b ? `<svg class="${cls}" viewBox="${b.join(' ')}" aria-hidden="true">${g}</svg>` : '';
}
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
/** A sprite as a shadow, for something you haven't got yet: every colour turned to one dark one, the ink
 *  kept, and its glows left out. Cached. */
const SHADE = '#2E2640';
const shaded: Record<string, string> = {};
function shadeOf(name: string): string {
  if (shaded[name] !== undefined) return shaded[name];
  const body = innerOf(name).replace(/<[a-z]+ [^>]*opacity:[^>]*\/>/g, '').replace(/(fill|stroke): #(?!1E1A1A)[0-9A-Fa-f]{3,6}\b/g, (_, k: string) => `${k}: ${SHADE}`);
  return (shaded[name] = body);
}
/** Place a sprite inside a parent SVG with its ground point at (x, y); `shade` draws it as a shadow. */
export function placeSprite(name: string, x: number, y: number, o: { k?: number; flip?: boolean; cls?: string; attrs?: string; shade?: boolean } = {}): string {
  const s = ART[name];
  if (!s) return '';
  const k = o.k ?? 1;
  const [vx, vy, w, h] = s.vb;
  const art = o.shade ? shadeOf(name) : innerOf(name);
  const body = `<svg x="${(x + vx * k).toFixed(1)}" y="${(y + vy * k).toFixed(1)}" width="${(w * k).toFixed(1)}" height="${(h * k).toFixed(1)}" viewBox="${vx} ${vy} ${w} ${h}" overflow="visible">${o.flip ? `<g transform="scale(-1 1) translate(${-(2 * vx + w)} 0)">${art}</g>` : art}</svg>`;
  return `<g class="${o.cls || ''}" ${o.attrs || ''}>${body}</g>`;
}
/** Something in the house that moves (your hero breathing, a pet bobbing, the fire): drawn as its own small
 *  picture, so the browser moves it without redrawing the whole house. Box and body are in world units. */
export interface Bit { box: [number, number, number, number]; body: string; cls: string }
/** A sprite as a bit, with its ground point at (x, y). */
export function spriteBit(name: string, x: number, y: number, o: { k?: number; flip?: boolean; cls: string }): Bit | null {
  const s = ART[name];
  if (!s) return null;
  const k = o.k ?? 1;
  const [vx, vy, w, h] = s.vb;
  return { box: [x + vx * k, y + vy * k, w * k, h * k], body: placeSprite(name, x, y, { k, flip: o.flip }), cls: o.cls };
}
/** Bits as markup, placed in a layer whose top left is the world point (x0, y0). */
export function bitsHtml(bits: Bit[], x0: number, y0: number): string {
  return bits.map(({ box: [x, y, w, h], body, cls }) => `<svg class="bit ${cls}" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" overflow="visible" style="left: ${(x - x0).toFixed(1)}px; top: ${(y - y0).toFixed(1)}px">${body}</svg>`).join('');
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

/** A race's gold look (a heroic log's prize: Gilded Bones for the Risen, Gilded Gnomes) is yours and switched on:
 *  that race is drawn in gold. */
export const gildedRace = (p: Profile, race: string): boolean =>
  Object.values(COLLECTIBLES).some((c) => c.gilds === race && !!p.collection[c.id] && !p.settings.looksOff.includes(c.id));

/** Layered heroes (src/ui/heroart.ts) as sprites: each look composed once, front and back, and kept in ART
 *  under its name while it is one of the last few used, so heroImg, placeSprite and the run take it like any
 *  other sprite. An older one is let go, with its cached pictures. */
const LOOKS: string[] = [];
const MAX_LOOKS = 40;
const FITS: Record<string, HeroFitOut> = {};
export function lookSprite(look: Look): string {
  const name = lookName(look), at = LOOKS.indexOf(name);
  if (at >= 0) { LOOKS.splice(at, 1); LOOKS.push(name); return name; }
  const f = composeLook(look, 'f'), b = composeLook(look, 'b'), fit = fitOfLook(look);
  if (!f || !b || !fit) return '';
  ART[`${name}_f`] = f; ART[`${name}_b`] = b; FITS[name] = fit;
  LOOKS.push(name);
  while (LOOKS.length > MAX_LOOKS) forget(LOOKS.shift() as string);
  return name;
}
function forget(name: string): void {
  for (const v of ['_f', '_b']) { delete ART[name + v]; delete urls[name + v]; delete inner[name + v]; delete shaded[name + v]; }
  delete FITS[name];
}
/** A hero sprite's weapon glow and head top, for the run (null for any other sprite). */
export const spriteFit = (name: string): HeroFitOut | null => FITS[name] || null;

type HeroLike = { race: string; cls: string; sex?: string; regular?: Record<string, { rar: number }>; equip?: Partial<Record<string, string | null>> };
const isHero = (h: HeroLike): h is Hero => 'bag' in h && 'id' in h;
const sexOf = (h: HeroLike): string => (h.sex === 'm' || h.sex === 'f' ? h.sex : defaultSex(h.race, h.cls));
/** What a hero wears, as layers: each slot's piece (gilded once its kit is yours and on), and their race's gold
 *  look. A hero being made (the hero maker) wears its regular pieces only. */
function heroLook(h: HeroLike, role: RoleId, p?: Profile): Look {
  const slots: Partial<Record<SlotId, string>> = {}, gold: SlotId[] = [];
  if (p && isHero(h)) {
    for (const [slot, w] of Object.entries(worn(p, h)) as [SlotId, ReturnType<typeof worn>[SlotId]][]) {
      slots[slot] = layerOf(w.def);
      if (w.unique && gildedOn(p, w.def.id)) gold.push(slot);
    }
  } else Object.assign(slots, plainSlots(role, h.cls, h.regular || 0));
  return { body: bodyId(h.race, h.cls, sexOf(h)), slots, gold, race: p && gildedRace(p, h.race) ? h.race : null };
}
/** The sprite a hero is drawn with: their body and what they wear in each slot, in layers. */
export const heroSprite = (h: HeroLike, role: RoleId, p?: Profile): string => lookSprite(heroLook(h, role, p));
/** A hero in plain gear at one rarity (test runs, the Crypt Trial), holding a boss weapon when the run hands
 *  one out (by its effect). */
export function plainSprite(h: { race: string; cls: string; sex?: string }, role: RoleId, rar: Rar, unique?: string | null): string {
  const slots = plainSlots(role, h.cls, rar), wid = weaponByEffect(unique);
  if (wid) slots.weapon = wid;
  return lookSprite({ body: bodyId(h.race, h.cls, sexOf(h)), slots, gold: [] });
}
/** A bot in plain gear: the founder of its role (Brannoc, Maren, Ivy). */
export const botSprite = (role: RoleId, rar: Rar, unique?: string | null): string => plainSprite(FOUNDERS[role], role, rar, unique);
/** A race shown off as a log's prize: a warrior of it in Rare gear, in gold for the heroic log's. */
export const prizeSprite = (race: string, gold: boolean): string =>
  lookSprite({ body: bodyId(race, 'warrior', 'm'), slots: plainSlots('tank', 'warrior', 2), gold: [], race: gold ? race : null });
/** A hero's front sprite as an <img>, sized by its own height (against HERO_H) so a dwarf stands shorter
 *  than an elf. */
const HERO_H = 150;
export function heroImg(sprite: string, o: { cls?: string; alt?: string } = {}): string {
  const s = ART[sprite + '_f'];
  if (!s) return '';
  const [vx, , w, h] = s.vb;
  return `<img class="${o.cls || ''}" src="${spriteURL(sprite + '_f')}" alt="${o.alt || ''}" style="--sh: ${(h / HERO_H).toFixed(3)}; --sx: ${((vx / w) * 100).toFixed(1)}%; aspect-ratio: ${w} / ${h}" draggable="false">`;
}
