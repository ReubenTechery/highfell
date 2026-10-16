/**
 * The door on the Dungeons sheet: a dungeon's stage (its `stage.ts`) drawn as one picture, the final boss in
 * the doorway and your party standing in front in their own gear, faces towards you. The sheet lays a name
 * plate over each hero's feet, at the spot `seatAt` gives, and the plates are what you tap.
 */
import type { DungeonStage, StagePiece } from '../content/types';
import { placeSprite } from './art';

const piece = (pc: StagePiece): string => placeSprite(pc.sprite, pc.x, pc.y, { k: pc.k, flip: pc.flip });
/** a flat shadow on the floor under someone standing (light, not shading: it isn't part of them) */
const shadow = (x: number, y: number, rx: number): string =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx.toFixed(1)}" ry="${(rx * 0.2).toFixed(1)}" style="fill: #0A060E; opacity: 0.45"/>`;

/** the stage without the heroes (it never changes, so it's drawn once per dungeon and version) */
const SCENES: Record<string, string> = {};
function scene(key: string, st: DungeonStage, light: string): string {
  if (SCENES[key]) return SCENES[key];
  const [x, y, w, h] = st.view;
  const glow = `dgst-${key}`;
  const o = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill: ${st.bg}"/>`,
    `<circle cx="${st.light.x}" cy="${st.light.y}" r="${st.light.r}" style="fill: url(#${glow})"/>`,
    ...st.back.map(piece),
    `<path d="M${x - 4} ${st.floor.y} H${x + w + 4} V${y + h + 4} H${x - 4} Z" style="fill: ${st.floor.color}; stroke: #1E1A1A; stroke-width: 4"/>`,
    shadow(st.boss.x, st.boss.y, 70 * (st.boss.k ?? 1)),
    piece(st.boss),
    ...st.front.map(piece),
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill: url(#dgst-vig)"/>`,
  ];
  return (SCENES[key] = `<defs><radialGradient id="${glow}"><stop offset="0" stop-color="${light}" stop-opacity="0.42"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <radialGradient id="dgst-vig" cx="50%" cy="38%" r="75%"><stop offset="0.6" stop-color="#140E18" stop-opacity="0"/><stop offset="1" stop-color="#140E18" stop-opacity="0.55"/></radialGradient></defs>${o.join('')}`);
}

/** The whole picture: the stage, then each hero on their spot, tank, healer and DPS from the left (a hero's
 *  sprite name, or null for a spot that stays empty: a friend's seat on Heroic). Heroic turns the light gold. */
export function stageSvg(id: string, st: DungeonStage, heroic: boolean, heroes: (string | null)[]): string {
  const [x, y, w, h] = st.view;
  const people = heroes.map((sp, i) => (sp ? shadow(st.heroes.x[i], st.heroes.y, 42) + placeSprite(`${sp}_f`, st.heroes.x[i], st.heroes.y, { k: st.heroes.k }) : '')).join('');
  return `<svg class="dgx-stage-svg" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${scene(`${id}-${heroic ? 'h' : 'n'}`, st, heroic ? '#F2C230' : st.light.color)}${people}</svg>`;
}

/** where a hero's spot is in the picture, as percentages: across from its left, and its feet down from its top */
export function seatAt(st: DungeonStage, i: number): { left: number; feet: number } {
  const [x, y, w, h] = st.view;
  return { left: ((st.heroes.x[i] - x) / w) * 100, feet: ((st.heroes.y - y) / h) * 100 };
}

/** the picture's shape, width over height, for the box that holds it */
export const stageShape = (st: DungeonStage): string => `${st.view[2]} / ${st.view[3]}`;
