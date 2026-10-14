/**
 * Looks, opened from Decorate: pick a look, then put it on a room or the whole house. A look you haven't
 * opened shows how close you are to it. Looks only: nothing you've put in the house moves. The sheets
 * wire up its buttons; the art of each look is in houseart.ts.
 */
import { DUNGEONS } from '../content';
import { LOOKS, LOOK_ROOMS, ROOMS } from '../content/house';
import { lookOf, lookOpen, lookProgress } from '../meta/hearth';
import type { Profile } from '../meta/profile';
import { esc, GLYPH } from './dom';

/** a little piece of a room in each look, for its card: the wall, a window, the floor and the light */
const SWATCH: Record<string, string> = {
  tavern: `<svg viewBox="0 0 90 60" aria-hidden="true"><rect width="90" height="60" style="fill: #D9C29A"/>
    <circle cx="45" cy="30" r="34" style="fill: #FFC870; opacity: 0.35"/>
    <path d="M33 38 V22 A12 12 0 0 1 57 22 V38 Z" style="fill: #F6C9A8; stroke: #8A5A34; stroke-width: 6"/><path d="M33 38 V22 A12 12 0 0 1 57 22 V38 Z" style="fill: none; stroke: #1E1A1A; stroke-width: 2.5"/>
    <path d="M0 42 H90 V50 H0 Z" style="fill: #8A5A34; stroke: #1E1A1A; stroke-width: 2.5"/><path d="M0 50 H90 V60 H0 Z" style="fill: #A0703F; stroke: #1E1A1A; stroke-width: 2.5"/></svg>`,
  barrow: `<svg viewBox="0 0 90 60" aria-hidden="true"><rect width="90" height="60" style="fill: #5C5070"/>
    <path d="M0 12 H90 M0 26 H90 M20 0 V12 M60 0 V12 M40 12 V26 M80 12 V26" style="fill: none; stroke: #463C5A; stroke-width: 2"/>
    <circle cx="45" cy="30" r="34" style="fill: #9BE15D; opacity: 0.3"/>
    <path d="M0 34 H90 V50 H0 Z" style="fill: #4A4060; stroke: #1E1A1A; stroke-width: 2.5"/>
    ${[15, 45, 75].map((x) => `<path d="M${x - 8} 49 V41 A8 8 0 0 1 ${x + 8} 41 V49 Z" style="fill: #2A2234; stroke: #1E1A1A; stroke-width: 2"/>`).join('')}
    <circle cx="45" cy="44" r="4.5" style="fill: #F0E8D2; stroke: #1E1A1A; stroke-width: 1.5"/><circle cx="15" cy="44" r="4.5" style="fill: #F0E8D2; stroke: #1E1A1A; stroke-width: 1.5"/>
    <path d="M0 50 H90 V60 H0 Z" style="fill: #4A4060; stroke: #1E1A1A; stroke-width: 2.5"/><path d="M30 50 V60 M70 50 V60" style="fill: none; stroke: #3A3150; stroke-width: 2"/></svg>`,
};
/** the dot on a room's button: its wall and its light, in the look it has now */
const DOT: Record<string, [string, string]> = { tavern: ['#D9C29A', '#FFC870'], barrow: ['#5C5070', '#9BE15D'] };

/** The look you're putting on: the one you picked, or the newest one before you pick. */
export const pickedLook = (picked: string | null): string => (LOOKS.find((l) => l.id === picked) || LOOKS[LOOKS.length - 1]).id;

export function looksSheet(p: Profile, picked: string | null, free: boolean): { head: string; body: string } {
  const sel = LOOKS.find((l) => l.id === pickedLook(picked))!;
  const open = free || lookOpen(p, sel.id);
  const cards = LOOKS.map((l) => {
    const has = free || lookOpen(p, l.id), pr = lookProgress(p, l.id);
    const on = LOOK_ROOMS.filter((r) => lookOf(p, r, free) === l.id).length;
    const where = on === LOOK_ROOMS.length ? 'The whole house' : on ? `${on} room${on > 1 ? 's' : ''}` : 'Not on yet';
    return `<button type="button" class="lk${has ? '' : ' locked'}" role="radio" aria-checked="${l.id === sel.id}" data-act="lookpick" data-id="${esc(l.id)}">
      <span class="lk-sw">${SWATCH[l.id] || SWATCH.tavern}</span><b>${esc(l.name)}</b>
      ${has ? `<small>${where}</small>` : `<small>${pr.have}/${pr.need} clears</small><i class="lk-bar" aria-hidden="true"><i style="width: ${((pr.have / pr.need) * 100).toFixed(1)}%"></i></i>`}</button>`;
  }).join('');
  const room = (id: string, name: string): string => {
    const [wall, light] = DOT[lookOf(p, id, free)] || DOT.tavern;
    return `<button type="button" class="lk-room" data-act="lookput" data-room="${id}" ${open ? '' : 'disabled'}><i aria-hidden="true" style="background: ${wall}; box-shadow: inset 0 0 0 3px ${light}"></i>${esc(name)}</button>`;
  };
  const u = sel.unlock;
  const why = !open && u ? `Clear ${esc(DUNGEONS[u.dungeon]?.name || u.dungeon)} ${u.clears} times to open it. ` : '';
  const body = `<div class="lk-cards" role="radiogroup" aria-label="Looks">${cards}</div>
    <p class="fine">${why}${esc(sel.blurb)}</p>
    <h3 class="section-title">Put ${esc(sel.name)} on</h3>
    <div class="lk-rooms"><button type="button" class="lk-room all" data-act="lookput" data-room="house" ${open ? '' : 'disabled'}>${GLYPH.home}Whole house</button>${ROOMS.filter((r) => LOOK_ROOMS.includes(r.id)).map((r) => room(r.id, r.name)).join('')}</div>
    <p class="fine">Looks only. Nothing you’ve put in the house moves.</p>`;
  return { head: '<h2>Looks</h2><p>For a room or the whole house</p>', body };
}
