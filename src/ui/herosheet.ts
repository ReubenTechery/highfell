/**
 * A hero's sheet, opened by tapping them by their bed in the house: who they are, play as them, look at
 * their gear, rename a hero the game named for you (once), or let one go. Race and class never change;
 * that is what more heroes are for. And your heroes, all of them, which the bunk room opens when you tap
 * it from far away. The sheets wire up their buttons; this draws them.
 */
import { TITLES } from '../content';
import { CLASSES, MAX_HEROES, RACES, type ClassId, type RaceId } from '../content/folk';
import { ROLES } from '../content/roles';
import { loadoutFor, waiting } from '../meta/gear';
import { roleOf, type Hero, type Profile } from '../meta/profile';
import { esc, fmtDate, fmtN, GLYPH } from './dom';
import { heroImg, heroSprite } from './art';
import { ilvl } from './hearth';

/** what the sheet remembers while it is open */
export interface HeroSheetState { delArmed: boolean; renaming: boolean; err: string }

export function heroSheet(p: Profile, h: Hero, st: HeroSheetState): { head: string; body: string } {
  const role = roleOf(h);
  const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
  const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
  const first = h.name.split(' ')[0];
  const up = waiting(p, h).length;
  const playing = h.id === p.active;
  const name = st.renaming
    ? `<form class="cp-rename" autocomplete="off"><label class="sr" for="cp-name">New name</label><input id="cp-name" maxlength="24" value="${esc(h.name)}" spellcheck="false"><button type="submit" class="btn small gold">${GLYPH.check}Save</button><button type="button" class="btn small" data-act="herocancel">Cancel</button>${st.err ? `<p class="err">${esc(st.err)}</p>` : '<p class="fine">You can rename this hero once.</p>'}</form>`
    : '';
  const body = `<div class="hero-card" style="--light: ${race?.light || '#F4B942'}">
      <span class="hc-fig" aria-hidden="true">${heroImg(heroSprite(h, role, p), { cls: 'hc-img' })}</span>
      <div class="hc-tx"><b>${esc(h.name)}</b>${title ? `<span class="hc-title">${esc(title)}</span>` : ''}
        <span>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · <i class="rdot ${role}"></i>${esc(cls?.roleName || ROLES[role].title)}</span>
        <span>Power ${ilvl(loadoutFor(p, h).score)} · ${fmtN(h.clears)} clear${h.clears === 1 ? '' : 's'} · made ${fmtDate(h.createdAt)}</span></div>
    </div>
    ${name}
    <div class="cp-actions">
      ${playing ? '<span class="chip">Playing now</span>' : `<button type="button" class="btn gold big" data-act="heroplay">${GLYPH.play}Play as ${esc(first)}</button>`}
      <button type="button" class="btn${up ? ' has-up' : ''}" data-act="herogear">${GLYPH.shield}Gear${up ? `<i class="badge" aria-hidden="true">${up}</i>` : ''}</button>
      ${!h.named && !st.renaming ? `<button type="button" class="btn" data-act="herorename">${GLYPH.pen}Rename</button>` : ''}
      ${p.roster.length > 1 ? `<button type="button" class="btn ${st.delArmed ? 'danger' : 'icon-only'}" data-act="herodel" aria-label="${st.delArmed ? `Tap again to let ${esc(h.name)} go for good` : `Let ${esc(h.name)} go`}">${GLYPH.trash}${st.delArmed ? `Let ${esc(first)} go for good?` : ''}</button>` : ''}
    </div>
    <p class="fine">Your heroes share the collection, kill counts and the house. Each keeps their own gear, title and clears.</p>`;
  return { head: `<h2>${esc(h.name)}</h2><p>${playing ? 'By the fire' : 'In the bunk room'}</p>`, body };
}

/** Your heroes: a row each, the one you play first, with what waits to be put on. Tap one for their sheet. */
export function heroesSheet(p: Profile): { head: string; body: string; foot: string } {
  const list = [...p.roster].sort((a, b) => +(b.id === p.active) - +(a.id === p.active));
  const rows = list.map((h) => {
    const role = roleOf(h), race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
    const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
    const up = waiting(p, h).length, me = h.id === p.active;
    return `<button type="button" class="wb-row${me ? ' me' : ''}" data-act="heroat" data-id="${esc(h.id)}" style="--light: ${race?.light || '#F4B942'}" aria-label="${esc(h.name)}, ${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)}${me ? ', playing now' : ''}${up ? `, ${up} new to put on` : ''}">
      <span class="hc-fig" aria-hidden="true">${heroImg(heroSprite(h, role, p), { cls: 'hc-img' })}</span>
      <span class="hc-tx"><b>${esc(h.name)}</b>${title ? `<span class="hc-title">${esc(title)}</span>` : ''}
        <span><i class="rdot ${role}"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)}${me ? ' · playing now' : ''}</span>
        <span>Power ${ilvl(loadoutFor(p, h).score)} · ${fmtN(h.clears)} clear${h.clears === 1 ? '' : 's'}</span></span>
      ${up ? `<i class="badge" aria-hidden="true">${up}</i>` : ''}</button>`;
  }).join('');
  return {
    head: `<h2>Your heroes</h2><p>${p.roster.length} of ${MAX_HEROES}</p>`,
    body: `<div class="wb-list">${rows}</div>`,
    foot: p.roster.length < MAX_HEROES ? `<button type="button" class="btn" data-act="newhero">${GLYPH.plus}New hero</button>` : '',
  };
}
