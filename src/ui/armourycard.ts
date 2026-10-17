/**
 * The armoury's card: what putting the picked piece on would change. It is drawn from the same parts as the
 * collection log's closer look (the verdict over three numbers, each with its change), so the two always
 * match. Then what the piece adds, takes away or keeps, and where it drops and when you got it (for a piece
 * not found yet, where it drops comes first). The set it joins or breaks is the big set panel above the card
 * (setcard.ts), each bonus marked On, Turns on, Turns off or how many more it needs. A piece whose gilding kit
 * is yours has the Plain / Gilded switch by its kind. The weapon's trait has its own row under the card.
 */
import { ITEMS, KITS, SETS } from '../content';
import { ROLE_SLOTS, TRAITS, gearId, gearKey, traitDef } from '../content/gear';
import { fillerOf } from '../content/roles';
import { gilded } from '../content/kits';
import { roleOf, type Hero, type Profile } from '../meta/profile';
import { compareOn, gildedOn, itemShare, lookId, weaponTrait, worn, type Effect, type ShelfPiece } from '../meta/gear';
import { cap, esc, fmtN, fmtRate } from './dom';
import { nameOf, rarLook } from './art';
import { ROLE_STAT, VERDICT, tag } from './itemsheet';
import { dropSource } from './logpeek';

/** where a piece comes from: the boss and its rate, and the kill count you got it at (or your kill count
 *  so far); regular gear comes from every clear */
export function whereFrom(p: Profile, id: string): string {
  if (ITEMS[id]?.kind === 'gear') return 'Every clear upgrades your weakest piece, up to Rare.';
  const src = dropSource(p, id), e = p.collection[id];
  if (!src) return '';
  return `${src.dg.heroicOf ? 'Heroic: ' : ''}${src.boss} · ${fmtRate(src.rate)} · ${e ? `got at kill count ${fmtN(e.kc)}` : `your kill count ${fmtN(src.kc)}`}`;
}

/** the card for one piece in a slot's row */
export function pieceCard(p: Profile, h: Hero, x: ShelfPiece): string {
  const d = x.def, role = roleOf(h), gk = gearKey(h), look = rarLook(d.id);
  const now = worn(p, h), c = compareOn(now, gk, d), v = VERDICT[c.verdict], on = c.verdict === 'wearing';
  const share = itemShare(d), slot = ROLE_SLOTS[gk][d.slot].name.toLowerCase();
  const kind = d.kind === 'gear' ? `${look.name} ${slot}` : d.kind === 'set' && d.setId ? `Epic ${slot} · ${SETS[d.setId].name} set` : `Unique ${slot}`;
  const cell = (val: string, label: string, n: number, unit = ''): string => `<span class="pk-s"><b>${val}</b><small>${esc(label)}</small>${on ? '' : tag(n, unit)}</span>`;
  const nums = cell(String(share.ilvl), 'Power', c.ilvl[1] - c.ilvl[0]) + cell(`+${share.power}%`, cap(ROLE_STAT[role].short), c.power, '%') + cell(`+${share.health}%`, 'Health', c.health, '%');
  // your filler's hit now, and with this piece on: a new weapon shows on the next swing
  const [h0, h1] = c.hit, moved = !on && h1 !== h0;
  const fname = esc(fillerOf(gk).def.name);
  const hit = `<p class="ar-hit" aria-label="${fname} hits ${h0}${moved ? `, then ${h1}` : ''}"><span>${fname}</span><b>${h0}</b>${moved ? `<i>→</i><b class="${h1 > h0 ? 'up' : 'down'}">${h1}</b>` : ''}</p>`;
  // the effects: the set's bonuses have their own row, so they're left out here
  const li = (k: string, mark: string, label: string, desc: string): string => `<li class="${k}"><i aria-hidden="true">${mark}</i><span><b>${esc(label)}</b> ${esc(desc)}</span></li>`;
  const named = (e: Effect, mine: boolean): string => (e.kind === 'trait' ? `${e.name} trait` : mine ? 'When worn' : e.name);
  let fx = '';
  if (on) { if (d.effectDesc) fx = li('keep', '✓', 'When worn', d.effectDesc); }
  else {
    fx = c.gains.filter((e) => e.kind !== 'set').map((e) => li('gain', '+', named(e, true), e.desc)).join('')
      + c.loses.filter((e) => e.kind !== 'set').map((e) => li('loss', '−', named(e, false), e.desc)).join('');
    const t = d.slot === 'weapon' && d.kind !== 'gear' && now.weapon.trait ? traitDef(gk, now.weapon.trait) : undefined;
    if (t) fx += li('keep', '✓', `${t.name} trait`, 'stays on.');
  }
  const where = whereFrom(p, d.id), drop = !x.found && where ? `<p class="ar-drop">${esc(where)}</p>` : '';
  const src = d.flavor || (x.found && where) ? `<p class="ar-src">${d.flavor ? `<q>${esc(d.flavor)}</q>` : ''}${x.found ? esc(where) : ''}</p>` : '';
  return `<article class="pk-cmp v-${v.cls} ar-card" aria-live="polite">
    <p class="pk-v">${v.mark}<b>${esc(v.word)}</b><span>${esc(nameOf(x.found ? lookId(p, d.id) : d.id))}</span></p>
    <div class="ar-kind"><span>${esc(kind)}</span>${gildSwitch(p, d.id)}</div>${drop}
    <div class="pk-ss">${nums}</div>${hit}
    ${fx ? `<ul class="ar-fx">${fx}</ul>` : ''}${src}
  </article>`;
}

/** a piece you own whose gilding kit is yours (from Heroic): plain or gilded, the same power */
function gildSwitch(p: Profile, id: string): string {
  if (!KITS[gilded(id)] || !p.collection[gilded(id)] || !p.collection[id]) return '';
  const on = gildedOn(p, id);
  return `<span class="seg gild-sw" role="radiogroup" aria-label="Its look">${['Plain', 'Gilded'].map((w, i) => `<button type="button" class="sg" role="radio" data-act="gild" data-id="${esc(id)}" data-v="${i}" aria-checked="${on === !!i}">${w}</button>`).join('')}</span>`;
}

/** the weapon's trait under its card: pick one of three, free to swap; one picked on a weapon still in the
 *  bag works once that weapon is on */
export function traitRow(p: Profile, h: Hero): string {
  const gk = gearKey(h), wt = weaponTrait(p, h);
  if (!wt) return '<p class="fine ar-trait-x">At Rare your weapon unlocks three traits. Pick one and swap it for free.</p>';
  const picked = TRAITS[gk].find((t) => t.id === wt.trait);
  const off = wt.trait && !wt.on ? `<p class="ar-trait-w">Works once your ${esc(ITEMS[gearId(gk, 'weapon', wt.rar)].name)} is on.</p>` : '';
  return `<section class="ar-trait" aria-label="Weapon trait"><p class="ar-trait-h"><b>Weapon trait</b><small>${wt.trait ? 'free to swap' : 'pick one, free to swap'}</small></p>${off}
    <div class="ar-seg" role="radiogroup" aria-label="Weapon trait">${TRAITS[gk].map((t) => `<button type="button" role="radio" data-act="trait" data-trait="${t.id}" aria-checked="${t.id === wt.trait}">${esc(t.name)}</button>`).join('')}</div>
    ${picked ? `<p class="ar-trait-d">${esc(picked.desc)}</p>` : ''}</section>`;
}
