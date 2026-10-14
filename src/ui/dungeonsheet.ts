/**
 * The Dungeons sheet, opened by the big Dungeons button or the Barrow door: pick a dungeon, see your
 * group (three seats: you in your hero's, bots in the others), tap a seat to play it with one of your
 * heroes, choose loot or practice and a brew, and go. Few words: the seats' colours carry the roles.
 * The sheets wire up its buttons; this draws it.
 */
import { DUNGEONS } from '../content';
import { MAX_HEROES } from '../content/folk';
import { ROLES } from '../content/roles';
import type { RoleId } from '../content/types';
import { RECIPES, RECIPE_ORDER } from '../content/vale';
import { STARTS } from '../content/barrow/script.js';
import { heroesFor, seats } from '../meta/party';
import { activeHero, type Profile } from '../meta/profile';
import { esc, fmtT, GLYPH } from './dom';
import { heroImg, heroSprite, spriteURL, tile } from './art';

/** what the sheet remembers while the page is open */
export interface DungeonPick { mode: 'loot' | 'practice'; start: string; gear: 'mine' | 2 | 3; seat: RoleId | null }

const seg = (act: string, cur: string, opts: [string, string][]): string =>
  `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;

export function dungeonSheet(p: Profile, pick: DungeonPick): { head: string; body: string; foot: string } {
  const dg = DUNGEONS.barrow, rec = p.dungeons.barrow, keeper = p.bosses['barrow.keeper'];
  const practice = pick.mode === 'practice';
  const body = `
    <div class="dg-list">
      <button type="button" class="dg-pick" aria-pressed="true">
        <span class="dg-art" aria-hidden="true"><img src="${spriteURL('keeper')}" alt=""></span>
        <span class="dg-name">${esc(dg.name)}</span>
        <span class="dg-stats"><span>Clears <b>${rec ? rec.clears : 0}</b></span><span>Best <b>${fmtT(rec?.pb)}</b></span><span>KC <b>${keeper ? keeper.kc : 0}</b></span></span>
      </button>
      <div class="dg-pick soon" aria-label="Another dungeon, coming soon"><span class="dg-art" aria-hidden="true"><img src="${spriteURL('bricked_arch')}" alt=""></span><span class="dg-name">Soon</span></div>
    </div>
    <h3 class="section-title">Your group</h3>
    <div class="seats">${seats(p).map((s) => seat(p, s.role, pick.seat === s.role)).join('')}</div>
    ${pick.seat ? chooser(p, pick.seat) : `<p class="fine">Bots join at your gear level.</p>`}
    ${seg('mode', pick.mode, [['loot', 'For loot'], ['practice', 'Practice']])}
    ${practice ? `<div class="box">
        <div class="seg-row"><b>Start at</b> ${seg('start', pick.start, STARTS.map((s: { id: string; name: string }) => [s.id, s.name] as [string, string]))}</div>
        <div class="seg-row"><b>Gear</b> ${seg('tgear', String(pick.gear), [['mine', 'Mine'], ['2', 'Try Rare'], ['3', 'Try Epic']])}</div>
        <p class="fine">No loot, kill counts or achievements.</p>
      </div>` : ''}
    ${brews(p, practice)}`;
  const go = activeHero(p) ? '' : 'disabled';
  return {
    head: '<h2>Dungeons</h2>',
    body,
    foot: `<button type="button" class="btn gold big" data-act="go" ${go}>${practice ? 'Start practice' : `Enter the ${esc(dg.name.split(' ')[0])}`}</button>`,
  };
}

/** one seat: the role's colour on top, who sits there, and whether that's you or a bot */
function seat(p: Profile, role: RoleId, open: boolean): string {
  const s = seats(p).find((x) => x.role === role)!;
  const mine = !!s.hero;
  const sprite = s.hero ? heroSprite(s.hero, role) : ROLES[role].sprite;
  const name = s.hero ? s.hero.name.split(' ')[0] : s.bot || '';
  return `<button type="button" class="seat r-${role}${mine ? ' me' : ''}${open ? ' open' : ''}" data-act="seat" data-role="${role}" aria-expanded="${open}" aria-label="${esc(ROLES[role].title)}: ${esc(name)}${mine ? ', you' : ', a bot'}. Choose who plays it">
    <span class="seat-role">${esc(ROLES[role].title)}</span>
    <span class="seat-fig" aria-hidden="true">${heroImg(sprite, { cls: 'seat-img' })}</span>
    <b>${esc(name)}</b><em>${mine ? 'You' : 'Bot'}</em>
  </button>`;
}

/** who could take a seat: your other heroes of that role, or a new one */
function chooser(p: Profile, role: RoleId): string {
  const word = role === 'dps' ? 'DPS' : ROLES[role].title.toLowerCase();
  const yours = heroesFor(p, role).filter((h) => h.id !== p.active);
  const mine = seats(p).some((s) => s.role === role && s.hero);
  const btns = yours.map((h) => `<button type="button" class="btn small" data-act="playseat" data-id="${esc(h.id)}">${GLYPH.play}Play as ${esc(h.name.split(' ')[0])}</button>`);
  if (p.roster.length < MAX_HEROES) btns.push(`<button type="button" class="btn small" data-act="newseat" data-role="${role}">${GLYPH.plus}New ${esc(word)}</button>`);
  const note = yours.length ? '' : `<span class="fine">${mine ? `Your only ${esc(word)}.` : `No ${esc(word)} yet.`}</span>`;
  return `<div class="seat-pick">${note}${btns.join('')}</div>`;
}

/** which brew you take in: one bottle a run */
function brews(p: Profile, practice: boolean): string {
  const have = RECIPE_ORDER.filter((id) => (p.vale.shelf[id] || 0) > 0);
  if (!have.length) return `<h3 class="section-title">Brew</h3><p class="fine">None yet. Brew some at the cauldron.</p>`;
  const drink = p.vale.drink && (p.vale.shelf[p.vale.drink] || 0) > 0 ? p.vale.drink : null;
  const chip = (id: string | null) => {
    const r = id ? RECIPES[id] : null;
    return `<button type="button" class="bc" role="radio" data-act="drink" data-id="${id || ''}" aria-checked="${drink === id}" ${r ? `style="--c: ${r.color}"` : ''}>
      ${r ? `<span class="tile" aria-hidden="true">${tile(r.icon)}</span>${esc(r.name)} <small>×${p.vale.shelf[r.id]}</small>` : 'None'}</button>`;
  };
  const what = drink ? RECIPES[drink].desc : 'Go in as you are.';
  return `<h3 class="section-title">Brew</h3>
    <div class="brewchips" role="radiogroup" aria-label="Brew">${chip(null)}${have.map(chip).join('')}</div>
    <p class="fine">${esc(what)}${drink && practice ? ' Practice keeps the bottle.' : ''}</p>`;
}
