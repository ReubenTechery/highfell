/**
 * The Hall of Doors along the cellar's back wall: a door for every dungeon, in the order you meet them, each in its own
 * dungeon's style (its `houseDoor`, drawn in tools/art_doors.py) and showing how far you've got with it (cellarDoors in
 * meta/hearth.ts): plain until you've cleared it, then lit, a gold trim once its log is finished, gilded once its Heroic
 * log is. One still to come is an arch bricked up, with a chalk "?". A lit door glows in its dungeon's light (gold once
 * gilded): a bit of its own that pulses (styles.css: doorglow), so the house never redraws for it. A tap on a door opens
 * the Dungeons on that dungeon (hearth.ts).
 */
import { DUNGEONS } from '../content';
import { ACT1_DUNGEONS } from '../content/act1';
import { SOON_DOOR, hallSlots } from '../content/house';
import { cellarDoors, type DoorState } from '../meta/hearth';
import type { Profile } from '../meta/profile';
import { ART, placeSprite, type Bit } from './art';
import { esc } from './dom';

/** a door's sprite in each state, on the end of its dungeon's `houseDoor`, and what the door says to a screen reader */
const SPRITE: Record<Exclude<DoorState, 'soon'>, string> = { plain: '', lit: '_lit', gold: '_gold', gilded: '_gilded' };
const WORDS: Record<Exclude<DoorState, 'soon'>, string> = { plain: 'not cleared yet', lit: 'cleared', gold: 'its log finished', gilded: 'its Heroic log finished' };

/** Every door in the cellar, for the layer you tap (each by where it stands, like the rest of the house), and the glows
 *  round the lit ones. `pointAt` is what the house's tour points at: 'door.<dungeon>' lights that door up. */
export function hallDoors(p: Profile, pointAt?: string): { layer: { y: number; svg: string }[]; bits: { y: number; bit: Bit }[] } {
  const ds = cellarDoors(p), at = hallSlots(ds.length), layer: { y: number; svg: string }[] = [], bits: { y: number; bit: Bit }[] = [];
  ds.forEach((d, i) => {
    const { x, y } = at[i], dg = DUNGEONS[d.id], name = dg?.name || ACT1_DUNGEONS.find((m) => m.id === d.id)?.name || d.id;
    const sprite = d.state === 'soon' || !dg?.houseDoor ? SOON_DOOR : dg.houseDoor + SPRITE[d.state];
    const a = ART[sprite];
    if (!a) return;
    const [vx, vy, w, h] = a.vb;
    if (d.state !== 'soon' && d.state !== 'plain') bits.push({ y, bit: glow(d.id, x, y, d.state === 'gilded' ? '#F2C230' : dg?.stage?.light.color || '#FFC870') });
    const hl = pointAt === `door.${d.id}` ? ' tour-hl' : '';
    const label = d.state === 'soon' ? `${name}, still to come` : `The door to ${name}, ${WORDS[d.state]}: dungeons`;
    layer.push({ y, svg: `<g class="thing door${hl}" data-door="${esc(d.id)}" data-x="${x}" data-y="${y}" tabindex="0" role="button" aria-label="${esc(label)}">
      ${placeSprite(sprite, x, y)}<text class="lbl small" x="${x}" y="${y + 28}">${esc(d.state === 'soon' ? 'Soon' : name)}</text>
      <rect class="hl" x="${x + vx}" y="${y + vy}" width="${w}" height="${h}" rx="16"/></g>` });
  });
  return { layer, bits };
}

/** the glow round a lit door, about the middle of the door */
function glow(id: string, x: number, y: number, light: string): Bit {
  const r = 170, cy = y - 140;
  return {
    box: [x - r, cy - r, r * 2, r * 2],
    body: `<defs><radialGradient id="dglow-${id}"><stop offset="0" stop-color="${light}" stop-opacity="0.5"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient></defs><circle cx="${x}" cy="${cy}" r="${r}" style="fill: url(#dglow-${id})"/>`,
    cls: 'doorglow',
  };
}
