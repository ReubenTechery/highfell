/**
 * A hero's sheet, opened by tapping them by their bed in the house: who they are, play as them, look at
 * their gear, rename a hero the game named for you (once), or let one go. Race and class never change;
 * that is what more heroes are for. The sheets wire up its buttons; this draws it.
 */
import { TITLES } from '../content';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
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
      <span class="hc-fig" aria-hidden="true">${heroImg(heroSprite(h, role), { cls: 'hc-img' })}</span>
      <div class="hc-tx"><b>${esc(h.name)}</b>${title ? `<span class="hc-title">${esc(title)}</span>` : ''}
        <span>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · <i class="rdot ${role}"></i>${esc(cls?.roleName || ROLES[role].title)}</span>
        <span>Item level ${ilvl(loadoutFor(p, h).score)} · ${fmtN(h.clears)} clear${h.clears === 1 ? '' : 's'} · made ${fmtDate(h.createdAt)}</span></div>
    </div>
    ${name}
    <div class="cp-actions">
      ${playing ? '<span class="chip">Playing now</span>' : `<button type="button" class="btn gold big" data-act="heroplay">${GLYPH.play}Play as ${esc(first)}</button>`}
      <button type="button" class="btn${up ? ' has-up' : ''}" data-act="herogear">${GLYPH.shield}Gear${up ? `<i class="badge" aria-hidden="true">${up}</i>` : ''}</button>
      ${!h.named && !st.renaming ? `<button type="button" class="btn" data-act="herorename">${GLYPH.pen}Rename</button>` : ''}
      ${p.roster.length > 1 ? `<button type="button" class="btn ${st.delArmed ? 'danger' : 'icon-only'}" data-act="herodel" aria-label="${st.delArmed ? `Tap again to let ${esc(h.name)} go for good` : `Let ${esc(h.name)} go`}">${GLYPH.trash}${st.delArmed ? `Let ${esc(first)} go for good?` : ''}</button>` : ''}
    </div>
    <p class="fine">Your heroes share the collection, kill counts, Marks and the house. Each keeps their own gear, title and clears.</p>`;
  return { head: `<h2>${esc(h.name)}</h2><p>${playing ? 'By the fire' : 'In the bunk room'}</p>`, body };
}
