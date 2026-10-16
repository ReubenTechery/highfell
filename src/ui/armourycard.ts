/**
 * The armoury's card: what putting the picked piece on would change. It is drawn from the same parts as the
 * collection log's closer look (the verdict over three numbers, each with its change), so the two always
 * match. Then the set it joins or breaks, each bonus marked On, Turns on, Turns off or how many more it
 * needs; what the piece adds, takes away or keeps; and where it drops and when you got it (for a piece not
 * found yet, where it drops comes first). The weapon's trait has its own row under the card.
 */
import { ITEMS, SETS } from '../content';
import { ROLE_SLOTS, TRAITS, gearId, gearKey, traitDef } from '../content/gear';
import { roleOf, type Hero, type Profile } from '../meta/profile';
import { compareOn, itemShare, setChange, weaponTrait, worn, type Effect, type ShelfPiece } from '../meta/gear';
import { cap, esc, fmtN, fmtRate } from './dom';
import { iconOf, nameOf, rarLook } from './art';
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
  const nums = cell(String(share.ilvl), 'Item level', c.ilvl[1] - c.ilvl[0]) + cell(`+${share.power}%`, cap(ROLE_STAT[role].short), c.power, '%') + cell(`+${share.health}%`, 'Health', c.health, '%');
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
  // the right side of the kind line is kept for the piece's Plain / Gilded switch (the Heroic kits' gold look)
  return `<article class="pk-cmp v-${v.cls} ar-card" aria-live="polite">
    <p class="pk-v">${v.mark}<b>${esc(v.word)}</b><span>${esc(d.name)}</span></p>
    <p class="ar-kind"><span>${esc(kind)}</span></p>${drop}
    <div class="pk-ss">${nums}</div>
    ${setRow(now, d, on)}${fx ? `<ul class="ar-fx">${fx}</ul>` : ''}${src}
  </article>`;
}

/** the set a piece joins or breaks: its three pieces as they would be worn (the one coming on ringed gold,
 *  the one coming off ringed red), how many before and after, and each bonus's state */
function setRow(now: ReturnType<typeof worn>, d: ShelfPiece['def'], on: boolean): string {
  const sc = setChange(now, d), st = sc ? SETS[sc.id] : undefined;
  if (!sc || !st) return '';
  const after = on ? sc.before : sc.after;
  const pcs = st.pieces.map((pid) => {
    const slot = ITEMS[pid].slot, there = slot === d.slot ? d : now[slot].def, lit = there.setId === sc.id;
    const ring = slot === d.slot && !on ? (sc.after > sc.before ? ' in' : sc.after < sc.before ? ' out' : '') : '';
    return `<span class="tile${lit ? '' : ' off'}${ring}" style="--rc: ${rarLook(pid).color}" title="${esc(nameOf(pid))}">${iconOf(lit ? there.id : pid)}</span>`;
  }).join('');
  const line = (n: number, desc: string, ready: boolean): string => {
    const was = sc.before >= n, will = after >= n;
    const k = !ready ? 'later' : on ? (was ? 'on' : 'off') : was && will ? 'on' : will ? 'turnon' : was ? 'turnoff' : 'off';
    const word = { on: 'On', turnon: 'Turns on', turnoff: 'Turns off', off: `${n - after} more`, later: 'Later' }[k];
    return `<p class="ar-b ${k}"><i>${n}</i><span><em>${word}</em>${esc(desc)}</span></p>`;
  };
  const count = on || sc.before === sc.after ? `${sc.before} of 3` : `${sc.before} → ${sc.after} of 3`;
  return `<div class="ar-set"><p class="ar-set-h"><b>${esc(st.name)} set</b><span class="ar-set-pcs" aria-hidden="true">${pcs}</span><small>${count}</small></p>
    ${line(2, st.bonus2.desc, true)}${line(3, st.bonus3.desc, st.bonus3.ready)}</div>`;
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
