/**
 * The Share card: a moment worth showing off (meta/brag.ts) as a 1080 by 1350 picture for a group chat or a
 * Discord. The game's own look: the night sky over the dungeon's floor, the moment's light, the moment in big
 * gold type with the ink line, your hero in their gear beside what you got (riding it, for a mount), your name
 * and title, and at the bottom the game's name and where to play it. The art is the game's own SVG, put
 * together as one picture and drawn on a canvas; the words go on top in the game's fonts. The canvas is let
 * go as soon as the picture is made: phones are short of memory.
 */
import WARDROBE from '../../art/wardrobe.json';
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, GAME_NAME, ITEMS, KITS, PLAY_URL, SETS, TITLES, heroicVersion } from '../content';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
import type { DungeonStage, StagePiece } from '../content/types';
import type { Brag } from '../meta/brag';
import { loadoutFor } from '../meta/gear';
import { logSlots, standsOf } from '../meta/logs';
import { roleOf, type Hero, type Profile } from '../meta/profile';
import { ART, heroSprite, iconOf, nameOf, pieceSvg, placeSprite, rarLook, riderSvg, standSvg } from './art';
import { mainReward } from './dungeonsheet';
import { fmtN, fmtT, wait } from './dom';
import { ilvl } from './hearth';
import { prizeArt } from './logbook';

export const CARD_W = 1080, CARD_H = 1350;
const INK = '#1E1A1A', CREAM = '#FFF8EC', GOLD = '#F2C230';
const DISPLAY = '"Lilita One", "Trebuchet MS", sans-serif', MONO = '"DM Mono", ui-monospace, Menlo, monospace';
/** where the floor starts, where everyone stands on it, and how big a hero is drawn */
const FLOOR = 968, FEET = 1046, HERO_K = 4.3;

/** the hero on a card, as the game draws them */
export interface CardHero { name: string; title: string; line: string; sprite: string; light: string }
export function cardHero(p: Profile, h: Hero): CardHero {
  const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
  return {
    name: h.name, title: h.title && TITLES[h.title] ? TITLES[h.title].text : '',
    line: `${race?.name || h.race} ${cls?.name || h.cls} · Power ${ilvl(loadoutFor(p, h).score)}`,
    sprite: heroSprite(h, roleOf(h), p), light: race?.light || '#F4B942',
  };
}

/* ---------------------------------------------------------------- the words */
/** where and what (the eyebrow), the moment in big type, and its detail */
export interface CardWords { eyebrow: string; title: string; sub: string }
const oneIn = (r?: number): string => (r ? `1 in ${fmtN(1 / r)}` : '');
const placeName = (id: string): string => DUNGEONS[id]?.name || (id === 'garden' ? 'The garden' : '');
/** what a drop is, in a word or two */
function whatOf(id: string): string {
  if (KITS[id]) return 'Gilding kit';
  if (ITEMS[id]) return ITEMS[id].kind === 'set' ? 'Set piece' : 'Boss weapon';
  const k = COLLECTIBLES[id]?.kind;
  return k === 'mount' ? 'New mount' : k === 'pet' ? 'New pet' : k === 'trophy' ? 'Trophy' : 'New look';
}
export function cardWords(b: Brag): CardWords {
  const dg = DUNGEONS[b.dungeon], at = placeName(b.dungeon);
  const eyebrow = (what: string): string => (at ? `${at} · ${what}` : what);
  const kc = `KC ${fmtN(b.kc || 0)}`;
  switch (b.kind) {
    case 'pet': return { eyebrow: eyebrow('New pet'), title: `Pet at ${kc}!`, sub: `${nameOf(b.id)} · ${oneIn(b.rate)}` };
    // Heroic's own drops count on Heroic's kill count
    case 'unique': return { eyebrow: eyebrow(whatOf(b.id)), title: nameOf(b.id), sub: `${oneIn(b.rate)} · ${dg?.heroicOf && dg.collection.includes(b.id) ? 'Heroic ' : ''}${kc}` };
    case 'set': return { eyebrow: eyebrow('Set complete'), title: `${b.gilded ? 'Gilded ' : ''}${SETS[b.id]?.name || b.id} set complete`, sub: `All ${SETS[b.id]?.pieces.length || 3} pieces · ${kc}` };
    case 'pb': return { eyebrow: eyebrow('Personal best'), title: `New best: ${fmtT(b.time)}`, sub: `Clear ${fmtN(b.clears || 0)}` };
    case 'log': {
      const a = ACHIEVEMENTS[b.id], log = a?.log || b.dungeon, main = a && mainReward(a);
      return { eyebrow: `${placeName(log)} · Collection log`, title: 'Collection log complete', sub: `All ${logSlots(log).length} slots${main ? ` · unlocked ${main.name.replace(/^The /, 'the ')}` : ''}` };
    }
    case 'ach': { const a = ACHIEVEMENTS[b.id]; return { eyebrow: eyebrow('Achievement'), title: a?.name || b.id, sub: (a?.how || '').replace(/\.$/, '') }; }
  }
}

/* ---------------------------------------------------------------- the art, as one SVG */
const shadow = (x: number, rx: number): string => `<ellipse cx="${x}" cy="${FEET}" rx="${rx}" ry="${(rx * 0.2).toFixed(1)}" style="fill: #0A060E; opacity: 0.45"/>`;
/** your hero in their race's light, standing on the floor at x */
const heroAt = (who: CardHero, x: number): string => `<circle cx="${x}" cy="${FEET - 230}" r="300" style="fill: url(#race)"/>` + shadow(x, 80) + placeSprite(`${who.sprite}_f`, x, FEET, { k: HERO_K });
/** one of the game's <svg>s (a piece, a stand, an icon) fitted into a box of the card */
const boxed = (svg: string, x: number, y: number, w: number, h: number): string => svg.replace(/^<svg /, `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
/** a sprite fitted into a square around (x, y) instead of standing on its ground point */
const spriteBox = (name: string, x: number, y: number, s: number): string => {
  const vb = ART[name]?.vb;
  return vb ? `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="${vb.join(' ')}" overflow="visible">${placeSprite(name, 0, 0)}</svg>` : '';
};
/** what dropped, floating in the light: a set piece or a boss weapon as the log's wardrobe draws it, a trophy
 *  or a dye as the house does, anything else its icon */
function floating(id: string, x: number, y: number): string {
  const piece = pieceSvg(id), sprite = COLLECTIBLES[id]?.sprite;
  const art = piece ? boxed(piece, x - 250, y - 250, 500, 500) : sprite && ART[sprite] ? spriteBox(sprite, x, y, 420) : boxed(iconOf(id), x - 160, y - 160, 320, 320);
  return shadow(x, 120) + art;
}
const MEDAL: Record<string, string> = { log: '#E7B53C', bronze: '#D08A4E', silver: '#C9D2DC', gold: GOLD, meta: '#B79CFF', hidden: '#5C5070' };
const MEDAL_AT: [number, number] = [770, 620];
/** the moment's light: what it is, in its own colour */
function lightOf(b: Brag, who: CardHero): string {
  const c = COLLECTIBLES[b.id];
  if (b.kind === 'pet') return '#9BE15D';
  if (b.kind === 'unique') return c ? (c.kind === 'mount' ? '#8FD6FF' : GOLD) : rarLook(b.id).light;
  if (b.kind === 'set') return b.gilded ? GOLD : '#BE98FF';
  if (b.kind === 'pb') return who.light;
  if (b.kind === 'ach') return MEDAL[ACHIEVEMENTS[b.id]?.tier || ''] || GOLD;
  return GOLD;
}
/** the light's rays, for the rarest moments */
function rays(x: number, y: number, colour: string): string {
  let d = '';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, b = a + Math.PI / 30, r = 1000;
    d += `M${x} ${y} L${(x + Math.cos(a) * r).toFixed(0)} ${(y + Math.sin(a) * r).toFixed(0)} L${(x + Math.cos(b) * r).toFixed(0)} ${(y + Math.sin(b) * r).toFixed(0)} Z`;
  }
  return `<path d="${d}" style="fill: ${colour}; opacity: 0.08"/>`;
}
/** the same few stars on every card */
const STARS = ((): string => {
  let s = 11, out = '';
  const r = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 46; i++) out += `<circle cx="${(r() * CARD_W).toFixed(0)}" cy="${(16 + r() * 880).toFixed(0)}" r="${(1.6 + r() * 3).toFixed(1)}" style="fill: ${CREAM}; opacity: ${(0.25 + r() * 0.6).toFixed(2)}"/>`;
  return out;
})();
const stageOf = (id: string): DungeonStage | undefined => DUNGEONS[id]?.stage || DUNGEONS[DUNGEONS[id]?.heroicOf || '']?.stage;
/** the dungeon's door behind everyone, from its picture on the Dungeons sheet, in the night's haze; for a best
 *  time, the boss you beat stands in it */
function door(st: DungeonStage | undefined, boss: boolean): string {
  if (!st) return '';
  const s = CARD_W / st.view[2];
  const at = (pc: StagePiece): string => placeSprite(pc.sprite, (pc.x - st.view[0]) * s, FLOOR + (pc.y - st.floor.y) * s, { k: (pc.k ?? 1) * s, flip: pc.flip });
  return st.back.map(at).join('') + (boss ? at(st.boss) : '') + `<rect width="${CARD_W}" height="${FLOOR}" style="fill: #17121F; opacity: 0.55"/>`;
}

/** what stands on the floor, and where its light is */
function scene(b: Brag, who: CardHero): { body: string; at: [number, number] } {
  const c = COLLECTIBLES[b.id];
  switch (b.kind) {
    case 'pet': return { body: heroAt(who, 320) + shadow(780, 80) + placeSprite(c?.sprite || 'pet_keeper', 780, FEET, { k: 3.3 }), at: [700, 680] };
    case 'unique':
      // a mount: you, riding it
      if (c?.kind === 'mount') return { body: `<circle cx="540" cy="${FEET - 300}" r="360" style="fill: url(#race)"/>` + shadow(540, 250) + riderSvg(who.sprite, b.id, 560, FEET, { k: 3.4 }), at: [540, 640] };
      return { body: heroAt(who, 310) + floating(b.id, 760, 640), at: [760, 640] };
    case 'set': {
      // the set on its armour stand, as the log shows it (a gilded one from the heroic log's, in gold)
      const base = SETS[b.id]?.dungeon || '', log = b.gilded ? heroicVersion(base)?.id || base : base;
      const st = standsOf(log).find((s) => s.set.id === b.id), k = 2.4, [vx, vy, vw, vh] = WARDROBE.vb;
      return { body: heroAt(who, 290) + shadow(770, 130) + (st ? boxed(standSvg(st.pieces, () => true), 770 + vx * k, FEET + vy * k, vw * k, vh * k) : ''), at: [770, 640] };
    }
    case 'log': {
      const art = prizeArt(b.id);
      return { body: heroAt(who, 310) + (art ? shadow(780, 80) + placeSprite(art, 780, FEET, { k: HERO_K }) : floating(b.id, 770, 640)), at: [600, 620] };
    }
    case 'pb': return { body: heroAt(who, 540), at: [540, 600] };
    case 'ach': {
      const [x, y] = MEDAL_AT, tier = ACHIEVEMENTS[b.id]?.tier || 'gold';
      return { body: heroAt(who, 310) + shadow(x, 100) + `<circle cx="${x}" cy="${y}" r="160" style="fill: ${MEDAL[tier] || GOLD}; stroke: ${INK}; stroke-width: 11"/><circle cx="${x}" cy="${y}" r="126" style="fill: none; stroke: ${CREAM}; stroke-width: 8; opacity: 0.5"/><path d="M${x - 98} ${y - 92} C${x - 64} ${y - 128} ${x - 10} ${y - 140} ${x + 32} ${y - 132}" style="fill: none; stroke: ${CREAM}; stroke-width: 12; stroke-linecap: round; opacity: 0.55"/>`, at: [x, y] };
    }
  }
}

/** The card's art: the sky and its stars, the dungeon's door, the moment's light, the floor, and who and what
 *  stand on it. */
export function cardArt(b: Brag, who: CardHero): string {
  const st = stageOf(b.dungeon), light = lightOf(b, who), { body, at } = scene(b, who);
  const big = b.kind === 'pet' || b.kind === 'log' || b.kind === 'set' || (b.kind === 'unique' && (b.rate || 1) <= 1 / 35);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}"><defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2A55"/><stop offset="0.72" stop-color="${st?.bg || '#241C33'}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${light}" stop-opacity="0.55"/><stop offset="0.45" stop-color="${light}" stop-opacity="0.2"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <radialGradient id="race"><stop offset="0" stop-color="${who.light}" stop-opacity="0.4"/><stop offset="1" stop-color="${who.light}" stop-opacity="0"/></radialGradient>
    <radialGradient id="vig" cx="50%" cy="44%" r="72%"><stop offset="0.6" stop-color="#140E18" stop-opacity="0"/><stop offset="1" stop-color="#140E18" stop-opacity="0.6"/></radialGradient></defs>
    <rect width="${CARD_W}" height="${CARD_H}" style="fill: url(#sky)"/>${STARS}${door(st, b.kind === 'pb')}
    ${big ? rays(at[0], at[1], light) : ''}<circle cx="${at[0]}" cy="${at[1]}" r="560" style="fill: url(#glow)"/>
    <path d="M-10 ${FLOOR} H${CARD_W + 10} V${CARD_H + 10} H-10 Z" style="fill: ${st?.floor.color || '#3A3150'}; stroke: ${INK}; stroke-width: 8"/>
    <rect y="${CARD_H - 92}" width="${CARD_W}" height="92" style="fill: #140E18; opacity: 0.5"/>
    ${body}<rect width="${CARD_W}" height="${CARD_H}" style="fill: url(#vig)"/></svg>`;
}

/* ---------------------------------------------------------------- the words, on the canvas */
/** words in the display font with the ink line round them, and a drop of ink under, like the game's titles */
function inked(cx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, drop = size * 0.08): void {
  cx.font = `${size}px ${DISPLAY}`;
  cx.lineJoin = 'round'; cx.lineWidth = Math.max(6, size * 0.24); cx.strokeStyle = INK;
  if (drop) { cx.fillStyle = INK; cx.strokeText(text, x, y + drop); cx.fillText(text, x, y + drop); }
  cx.strokeText(text, x, y);
  cx.fillStyle = fill; cx.fillText(text, x, y);
}
/** the biggest size, `max` down to `min`, at which the words fit `w` */
function fitSize(cx: CanvasRenderingContext2D, text: string, w: number, max: number, min: number): number {
  let s = max;
  for (; s > min; s -= 2) { cx.font = `${s}px ${DISPLAY}`; if (cx.measureText(text).width <= w) break; }
  return s;
}
/** words that won't fit on one line, split in two where the longer half is shortest */
function halves(cx: CanvasRenderingContext2D, text: string): [string, string] {
  const words = text.split(' ');
  let best: [string, string] = [text, ''], bw = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), w = Math.max(cx.measureText(a).width, cx.measureText(b).width);
    if (w < bw) { bw = w; best = [a, b]; }
  }
  return best;
}
/** big words on one line if they fit, else two, centred on x from the baseline y; says where they end */
function block(cx: CanvasRenderingContext2D, text: string, x: number, y: number, o: { w: number; max: number; min: number; fill: string; gap: number }): number {
  const one = fitSize(cx, text, o.w, o.max, o.min);
  cx.font = `${one}px ${DISPLAY}`;
  if (cx.measureText(text).width <= o.w || !text.includes(' ')) { inked(cx, text, x, y, one, o.fill); return y; }
  const [a, b] = halves(cx, text), s = Math.min(fitSize(cx, a, o.w, o.max * 0.86, o.min * 0.7), fitSize(cx, b, o.w, o.max * 0.86, o.min * 0.7));
  inked(cx, a, x, y - s * 0.12, s, o.fill);
  inked(cx, b, x, y - s * 0.12 + s * o.gap, s, o.fill);
  return y - s * 0.12 + s * o.gap;
}
function mono(cx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, spacing = 0): void {
  cx.font = `500 ${size}px ${MONO}`;
  if ('letterSpacing' in cx) cx.letterSpacing = `${spacing}px`;
  cx.fillStyle = fill; cx.fillText(text, x, y);
  if ('letterSpacing' in cx) cx.letterSpacing = '0px';
}

function words(cx: CanvasRenderingContext2D, b: Brag, who: CardHero, preview: boolean): void {
  const w = cardWords(b), mid = CARD_W / 2;
  cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
  mono(cx, w.eyebrow.toUpperCase(), mid, 92, 30, 'rgba(255, 248, 236, 0.82)', 4);
  const end = block(cx, w.title, mid, 220, { w: 980, max: 132, min: 96, fill: GOLD, gap: 1.02 });
  if (w.sub) block(cx, w.sub, mid, end + 84, { w: 960, max: 56, min: 40, fill: CREAM, gap: 1.12 });
  if (b.kind === 'ach') {
    const a = ACHIEVEMENTS[b.id], [x, y] = MEDAL_AT;
    if (a) {
      cx.font = `${a.points >= 100 ? 110 : 136}px ${DISPLAY}`;
      cx.fillStyle = a.tier === 'hidden' ? CREAM : INK;
      cx.fillText(String(a.points), x, y + 48);
      block(cx, a.reward.text, x, y + 252, { w: 440, max: 40, min: 30, fill: CREAM, gap: 1.1 });
    }
  }
  // who: your name and title, and what you are
  inked(cx, who.name, mid, 1138, fitSize(cx, who.name, 960, 70, 44), CREAM);
  if (who.title) inked(cx, who.title, mid, 1192, 42, GOLD, 4);
  mono(cx, who.line, mid, who.title ? 1236 : 1196, 28, 'rgba(255, 248, 236, 0.8)');
  // the game, and where to play it
  cx.textAlign = 'left';
  inked(cx, GAME_NAME, 48, 1318, 52, GOLD, 4);
  cx.textAlign = 'right';
  mono(cx, PLAY_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''), CARD_W - 48, 1312, 28, CREAM);
  if (preview) {
    cx.save(); cx.translate(CARD_W - 132, 64); cx.rotate(0.1); cx.textAlign = 'center';
    inked(cx, 'Preview', 0, 0, 46, '#FF8A4C', 3);
    cx.restore();
  }
}

/* ---------------------------------------------------------------- the picture */
/** the game's fonts, which the page loads from the web: wait for them, but never long */
function fonts(): Promise<unknown> {
  const f = document.fonts;
  if (!f || !f.load) return Promise.resolve();
  return Promise.race([Promise.all([f.load(`100px ${DISPLAY}`), f.load(`500 30px ${MONO}`)]).catch(() => null), wait(2500)]);
}
function svgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('the card’s art did not load'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
/** Draw a card and make it a PNG. The canvas and the art are let go straight after. */
export async function makeCard(b: Brag, who: CardHero, o: { preview?: boolean } = {}): Promise<Blob> {
  await fonts();
  const art = await svgImage(cardArt(b, who));
  const cv = document.createElement('canvas');
  cv.width = CARD_W; cv.height = CARD_H;
  try {
    const cx = cv.getContext('2d');
    if (!cx) throw new Error('no canvas');
    cx.drawImage(art, 0, 0, CARD_W, CARD_H);
    art.src = '';
    words(cx, b, who, !!o.preview);
    return await new Promise<Blob>((res, rej) => cv.toBlob((bl) => (bl ? res(bl) : rej(new Error('no picture'))), 'image/png'));
  } finally {
    cv.width = 0; cv.height = 0;
  }
}
