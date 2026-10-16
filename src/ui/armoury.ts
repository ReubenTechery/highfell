/**
 * The armoury: a hero's gear. The doll (the four slots around the hero, the item level and what it all adds
 * up to), a slot's drawer (what waits to go on, everything you own for it and what is worn), the abilities and
 * what the gear does to them, the set, the weapon trait, the title and the looks. Its buttons (armouryActions)
 * and the moment a piece goes on (the burst, the item level counting up) live here too; the sheets open and
 * close it.
 */
import { COLLECTIBLES, DUNGEONS, ITEMS, SETS, TITLES } from '../content';
import { AB, ROLES, SLOTS_AB, abKey } from '../content/roles';
import { ROLE_SLOTS, SLOT_IDS, TRAITS, gearId, gearKey, traitDef } from '../content/gear';
import { CLASSES, RACES, type ClassId, type RaceId } from '../content/folk';
import type { AbilitySlot, GearKey, ItemDef, RoleId, SlotId } from '../content/types';
import { heroById, roleOf, setActive, type Hero, type Profile } from '../meta/profile';
import { bestRegular, buyTrait, effectsOf, equip, healthPct, itemShare, loadoutFor, ownedFor, powerPct, putOn, seenSlot, waitingFor, weaponTrait, worn, type Waiting, type Worn } from '../meta/gear';
import type { App } from './app';
import { cap, esc, fmtN, fmtRate, GLYPH } from './dom';
import { heroImg, heroSprite, iconOf, nameOf, rarLook, tile } from './art';
import { SFX } from './sound';
import { ilvl } from './hearth';
import { ROLE_STAT } from './itemsheet';
import type { SheetSpec } from './sheets';

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 L14.9 8.7 L21.6 9.4 L16.6 13.9 L18 20.6 L12 17.2 L6 20.6 L7.4 13.9 L2.4 9.4 L9.1 8.7 Z" style="fill: #F2C230; stroke: #1E1A1A; stroke-width: 2; stroke-linejoin: round"/></svg>';
const LEFT_SLOTS: SlotId[] = ['helm', 'shoulders', 'chest'];

/** what the armoury remembers while the page is open: the piece just put on, for the moment it takes (which
 *  slot, and the item level before and after) */
export interface ArmouryView { justOn: { hero: string; slot: SlotId; from: number; to: number; at: number } | null }

/** what the armoury's buttons need from the sheets: what is open, a way to stay on a slot without redrawing
 *  (a save redraws), and a way to open another sheet */
export interface ArmouryHost { app: App; view: ArmouryView; spec(): SheetSpec | null; stay(spec: SheetSpec): void; open(spec: SheetSpec): void }

/** the armoury's buttons: a slot opens and closes its drawer, Equip and Put it on (with their moment), the
 *  weapon trait, playing as this hero, a title, a look on or off, and the way in from a drop's sheet */
export function armouryActions(x: ArmouryHost): Record<string, (el: HTMLElement) => void> {
  const gearHero = (): Hero | null => { const s = x.spec(); return s && s.kind === 'gear' ? heroById(x.app.p, s.hero) : null; };
  const settle = (h: Hero, slot: SlotId, from: number): void => {
    const p = x.app.p, v = x.view;
    v.justOn = { hero: h.id, slot, from, to: +ilvl(loadoutFor(p, h).score), at: performance.now() };
    SFX.play('equip');
    const s = x.spec();
    if (s && s.kind === 'gear') x.stay({ ...s, slot });
    x.app.save();
    setTimeout(() => { if (v.justOn && performance.now() - v.justOn.at > 1500) v.justOn = null; }, 1600);
  };
  /** put on what waits in a slot, with the moment it deserves */
  const putOnNow = (h: Hero, slot: SlotId): void => {
    const p = x.app.p, from = +ilvl(loadoutFor(p, h).score);
    if (!putOn(p, h, slot)) { SFX.play('nope'); return; }
    settle(h, slot, from);
  };
  return {
    slot: (el) => {
      const s = x.spec();
      if (!s || s.kind !== 'gear') return;
      const clicked = el.dataset.slot as SlotId | undefined;
      SFX.play('ui');
      x.open({ kind: 'gear', hero: s.hero, slot: clicked && s.slot !== clicked ? clicked : undefined });
    },
    equip: (el) => {
      const h = gearHero(); if (!h) return;
      const slot = el.dataset.slot as SlotId, id = el.dataset.id || null;
      if (id && h.fresh.includes(id)) { putOnNow(h, slot); return; }
      const p = x.app.p, from = +ilvl(loadoutFor(p, h).score);
      equip(p, h, slot, id);
      if (!id) seenSlot(h, slot);
      settle(h, slot, from);
    },
    puton: (el) => { const h = gearHero(); if (h) putOnNow(h, el.dataset.slot as SlotId); },
    notnow: (el) => { const h = gearHero(); if (!h) return; seenSlot(h, el.dataset.slot as SlotId); SFX.play('ui'); x.app.save(); },
    trait: (el) => { const h = gearHero(); if (!h) return; if (buyTrait(x.app.p, h, 'barrow', el.dataset.trait!)) { SFX.play('coin'); x.app.save(); } else SFX.play('nope'); },
    playas: () => { const h = gearHero(); if (!h) return; setActive(x.app.p, h.id); SFX.play('ui'); x.app.save(); },
    look: (el) => { const p = x.app.p, id = el.dataset.id!; const off = new Set(p.settings.looksOff); if (off.has(id)) off.delete(id); else off.add(id); p.settings.looksOff = [...off]; SFX.play('ui'); x.app.save(); },
    gearat: (el) => {
      const h = heroById(x.app.p, el.dataset.hero || null);
      if (!h) return;
      const slot = el.dataset.slot as SlotId;
      SFX.play('ui');
      if (x.app.scene === 'reveal') x.app.showHearth();
      x.open({ kind: 'gear', hero: h.id, slot });
    },
    title: (el) => { const h = gearHero(); if (!h) return; h.title = el.dataset.id || null; SFX.play('ui'); x.app.save(); },
  };
}

/** Moving on from a gear slot you had open: you've looked, so its new uniques stop glowing (they stay yours
 *  to wear). True when that changed anything. */
export function leftSlot(p: Profile, from: SheetSpec | null, next: SheetSpec | null): boolean {
  if (!from || from.kind !== 'gear' || !from.slot) return false;
  if (next && next.kind === 'gear' && next.hero === from.hero && next.slot === from.slot) return false;
  const h = heroById(p, from.hero);
  return !!h && seenSlot(h, from.slot);
}

/** the item level climbing after you put something on */
export function countUp(root: HTMLElement, view: ArmouryView): void {
  const j = view.justOn, el = root.querySelector<HTMLElement>('.doll-ilvl b');
  if (!j || !el || el.dataset.done) return;
  el.dataset.done = '1';
  if (j.to === j.from) return;
  const t0 = performance.now(), dur = 700;
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = ilvl(j.from + (j.to - j.from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = ilvl(j.from);
  requestAnimationFrame(tick);
}

/* ---------------------------------------------------------------- gear: the doll, slot-first armoury & weapon buffs */
export function armourySheet(p: Profile, h: Hero, sel: SlotId | null, view: ArmouryView): { head: string; body: string } {
  const role = roleOf(h), gk = gearKey(h), ak = abKey(h);
  const race = RACES[h.race as RaceId], cls = CLASSES[h.cls as ClassId];
  const L = loadoutFor(p, h);
  const w = worn(p, h);
  const word = ROLE_STAT[role];
  const title = h.title && TITLES[h.title] ? TITLES[h.title].text : '';
  const head = `<h2>${esc(h.name)}${title ? ` <em class="h-title">${esc(title)}</em>` : ''}</h2><p><i class="rdot ${role}" aria-hidden="true"></i>${esc(race?.name || h.race)} ${esc(cls?.name || h.cls)} · ${esc(cls?.roleName || ROLES[role].title)}${p.active === h.id ? ' · playing' : ''}</p>`;

  const j = view.justOn && view.justOn.hero === h.id && performance.now() - view.justOn.at < 1400 ? view.justOn : null;
  const card = (slot: SlotId) => slotCard(w[slot], role, gk, L.sets, slot === sel, waitingFor(p, h, slot), j?.slot === slot);
  const doll = `<div class="doll${j ? ' just-on' : ''}" style="--light: ${race?.light || '#F4B942'}">
    <div class="doll-col l">${LEFT_SLOTS.map(card).join('')}</div>
    <div class="doll-fig"><span class="doll-glow" aria-hidden="true"></span>${heroImg(heroSprite(h, role, p), { cls: 'doll-img', alt: `${h.name}` })}<span class="doll-floor" aria-hidden="true"></span></div>
    <div class="doll-col r">
      <div class="doll-ilvl"><b>${ilvl(L.score)}</b><span>Item level</span></div>
      ${card('weapon')}
      <div class="doll-pw"><span>${esc(cap(word.short))}</span><b>+${powerPct(L)}%</b><span>Health</span><b>+${healthPct(L)}%</b></div>
    </div>
  </div>`;
  const extras = Object.entries(L.sets).map(([id, n]) => SETS[id] ? `<span class="chip set">${esc(SETS[id].name)} set <b>${n}/3</b>${n >= 2 ? ' · bonus on' : ''}</span>` : '').join('')
    + L.traits.map((t) => `<span class="chip">Trait <b>${esc(traitDef(gk, t)?.name || t)}</b></span>`).join('');
  const stats = extras ? `<div class="power">${extras}</div>` : '';

  // Slot-first Armoury: only open a slot's upgrade & equipment drawer when the player clicks a slot on the doll!
  const waitingSlots = SLOT_IDS.map((sl) => ({ slot: sl, wt: waitingFor(p, h, sl) })).filter((x): x is { slot: SlotId; wt: Waiting } => !!x.wt);
  let slotPanel = '';
  if (sel) {
    slotPanel = tooltip(p, h, w[sel], L.sets, waitingFor(p, h, sel));
  } else if (waitingSlots.length) {
    const pills = waitingSlots.map(({ slot, wt }) => {
      const sName = ROLE_SLOTS[gk][slot].name;
      const d = ITEMS[wt.id];
      const dp = Math.round((itemShare(d).power - itemShare(w[slot].def).power) * 10) / 10;
      return `<button type="button" class="btn small gold" data-act="slot" data-slot="${slot}">${GLYPH.rise}${esc(sName)}: ${esc(d.name)}${dp > 0 ? ` (+${dp}%)` : ''}</button>`;
    }).join('');
    slotPanel = `<div class="armoury-bar has-up">
      <div class="ab-txt"><b>${GLYPH.rise}${waitingSlots.length} slot${waitingSlots.length > 1 ? 's have' : ' has'} an upgrade waiting</b><span>Tap a glowing slot on your hero above (or below) to compare stats &amp; equip:</span></div>
      <div class="ab-pills">${pills}</div>
    </div>`;
  } else {
    slotPanel = `<div class="armoury-bar">
      <div class="ab-txt"><b>Armoury</b><span>Tap any equipment slot on your hero above to inspect stats or swap owned gear.</span></div>
    </div>`;
  }

  // Abilities & active Gear/Weapon buffs
  const keyNum: Record<AbilitySlot, string> = { a1: '1', a2: '2', a3: '3', a4: '4' };
  const activeEffects = effectsOf(L, gk).filter((e) => !e.later);
  const abBox = `<div class="box"><h3 class="section-title">Abilities &amp; Gear Buffs<small>${activeEffects.length ? `${activeEffects.length} active` : 'buffed by sets &amp; boss weapons'}</small></h3>
    <div class="at-list">${SLOTS_AB.map((s) => {
      const ab = AB[ak][s];
      const cdTxt = ab.hold ? 'Hold · Block' : `${ab.cd}s CD`;
      const manaTxt = ab.mana ? ` · ${ab.mana} Mana` : '';
      const buffs = activeEffects.filter((e) => e.desc.toLowerCase().includes(ab.name.toLowerCase()));
      return `<article class="at-card${buffs.length ? ' on' : ''}">
        <div class="at-top">
          <span class="at-ic"><span class="tile">${tile(ab.key)}</span><kbd>${keyNum[s]}</kbd></span>
          <div class="at-info">
            <div class="at-title-row"><b>${esc(ab.name)}</b><span class="at-meta">${cdTxt}${manaTxt}</span></div>
            <p>${esc(ab.desc)}</p>
          </div>
        </div>
        ${buffs.map((b) => `<div class="at-combo"><b>+ ${esc(b.name)}:</b> ${esc(b.desc)}</div>`).join('')}
      </article>`;
    }).join('')}</div></div>`;

  // the set for this role and class
  const setBoxes = Object.values(SETS).filter((s) => s.role === role && (!s.cls || s.cls === h.cls) && (h.cls !== 'rogue' || s.cls === 'rogue')).map((set) => {
    const n = L.sets[set.id] || 0;
    const have = set.pieces.filter((id) => p.collection[id]).length;
    return `<div class="box setbox">
      <h3 class="section-title">${esc(set.name)} set<small>wearing ${n} of 3 · own ${have} of 3</small></h3>
      <div class="setpieces">${set.pieces.map((id) => { const own = !!p.collection[id], on = Object.values(w).some((x) => x.def.id === id); return `<button type="button" class="sp ${on ? 'on' : own ? 'own' : ''}" data-act="item" data-id="${id}"><span class="tile" aria-hidden="true">${iconOf(id)}</span><span>${esc(nameOf(id))}<small>${on ? 'Wearing' : own ? 'Owned' : fmtRate(1 / 35)}</small></span></button>`; }).join('')}</div>
      <div class="setline ${n >= 2 ? 'on' : ''}"><i>2</i><span>${esc(set.bonus2.desc)}</span></div>
      <div class="setline ${n >= 3 ? 'on' : ''} ${set.bonus3.ready ? '' : 'later'}"><i>3</i><span>${esc(set.bonus3.desc)}${set.bonus3.ready ? '' : ' <em>(coming in a later update)</em>'}</span></div>
      <p class="fine">Epic set pieces drop from the Gravekeeper, 1 in 35 each. ${esc(set.look)}.</p></div>`;
  }).join('');
  // weapon trait (unlocked at Rare, free to toggle); one picked on a weapon still in the bag works once it's on
  const wt = weaponTrait(p, h);
  const pickedNote = wt && !wt.on ? `Works once your ${esc(ITEMS[gearId(gk, 'weapon', wt.rar)].name)} is on` : 'Active on your hero';
  const traitBox = wt ? `<div class="box"><h3 class="section-title">Weapon trait<small>Unlocked at Rare · free to swap</small></h3>
    <div class="offer">${TRAITS[gk].map((t) => `<button type="button" class="opt" data-act="trait" data-trait="${t.id}" aria-pressed="${wt.trait === t.id}" ${wt.trait === t.id ? 'disabled' : ''}><b>${esc(t.name)}</b>${esc(t.desc)}${wt.trait === t.id ? `<span class="m">${pickedNote}</span>` : `<span class="m">Tap to activate</span>`}</button>`).join('')}</div>
    ${w.weapon.unique ? '<p class="fine">Your unlocked weapon trait stays active alongside your unique weapon.</p>' : ''}</div>`
    : `<p class="fine">At Rare your weapon unlocks all three traits so you can swap how an ability works freely.</p>`;
  // title
  const titles = p.titles.filter((t) => TITLES[t]);
  const titleBox = `<div class="box"><h3 class="section-title">Title<small>shown with ${esc(h.name.split(' ')[0])}’s name</small></h3>${titles.length ? `<div class="titles" role="radiogroup">
    <button type="button" class="sg" role="radio" data-act="title" data-id="" aria-checked="${!h.title}">None</button>
    ${titles.map((t) => `<button type="button" class="sg" role="radio" data-act="title" data-id="${t}" aria-checked="${h.title === t}">${esc(TITLES[t].text)}</button>`).join('')}</div>` : '<p class="fine">Some achievements give a title. Every hero can wear the ones you earn.</p>'}</div>`;
  // looks
  const looks = ['cosmetic.glow_shield', 'cosmetic.glow_staff', 'cosmetic.crit_ice', 'cosmetic.trail_wisp', 'dye.ghostly', 'dye.ghostly.gilded', 'cosmetic.gilded_bones']
    .filter((id) => (id === 'cosmetic.glow_shield' ? role === 'tank' : id === 'cosmetic.glow_staff' ? role === 'healer' : id === 'cosmetic.crit_ice' ? role === 'dps' : id === 'cosmetic.gilded_bones' ? h.race === 'risen' : true));
  const looksBox = `<div class="box"><h3 class="section-title">Looks<small>never power</small></h3><div class="picks">${looks.map((id) => {
    const c = COLLECTIBLES[id], own = !!p.collection[id], on = own && !p.settings.looksOff.includes(id);
    return `<button type="button" class="pick" data-act="${own ? 'look' : 'item'}" data-id="${id}" aria-pressed="${on}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.5)"'}>${tile(c.icon)}</span><span><b>${esc(c.name)}</b><span>${own ? (on ? 'On' : 'Off') : esc(c.source)}</span></span></button>`;
  }).join('')}</div></div>`;
  const play = p.active === h.id ? '' : `<div class="actions"><button type="button" class="btn small gold" data-act="playas">${GLYPH.play}Play as ${esc(h.name.split(' ')[0])}</button></div>`;
  const body = `${doll}${slotPanel}${stats}${play}${abBox}${setBoxes}${traitBox}${titleBox}${looksBox}`;
  return { head, body };
}

/** one slot on the doll: rarity frame, set count, unique star and what it adds. It glows while something better waits to go on. */
function slotCard(it: Worn, role: RoleId, gk: GearKey, sets: Record<string, number>, on: boolean, wait: Waiting | null, just: boolean): string {
  const d = it.def, look = rarLook(d.id);
  const share = itemShare(d);
  const set = d.setId ? SETS[d.setId] : null;
  const slotName = ROLE_SLOTS[gk][it.slot].name;
  const wShare = wait ? itemShare(ITEMS[wait.id]) : null;
  const dp = wShare ? Math.round((wShare.power - share.power) * 10) / 10 : 0;
  const badge = wait ? `<i class="sl-up" aria-hidden="true">${dp > 0 ? `+${dp}%` : wait.kind === 'unique' ? 'New' : 'Up'}</i>` : '';
  return `<button type="button" class="slot r-${look.key}${wait ? ' up' : ''}${just ? ' just-on' : ''}" data-act="slot" data-slot="${it.slot}" aria-pressed="${on}" style="--rc: ${look.color}; --rl: ${look.light}" aria-label="${esc(slotName)}: ${esc(d.name)}, ${esc(look.name)}${set ? `, ${esc(set.name)} set` : ''}${wait ? '. Upgrade ready — tap to view and equip' : '. Tap to view slot armoury'}">
    ${badge}${just ? '<span class="sl-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' : ''}<span class="sl-tile"><span class="tile">${iconOf(d.id)}</span>${set ? `<i class="sl-set" title="${esc(set.name)} set">${sets[set.id] || 0}/3</i>` : ''}${d.kind === 'unique' ? `<i class="sl-star" title="Unique">${STAR}</i>` : ''}</span>
    <span class="sl-tx"><span class="sl-kind">${esc(slotName)}</span><b class="sl-name" style="color: ${look.ink}">${esc(d.name)}</b>
      <span class="sl-meta"><b style="color: ${look.ink}">${esc(look.name)}</b><span class="sl-il"> · ${share.ilvl}</span></span>
      <span class="sl-stat">${share.power > 0 ? `+${share.power}% ${ROLE_STAT[role].short}` : 'Starter rags'}</span>${wait ? `<span class="sl-up-line">${GLYPH.rise}${dp > 0 ? `Tap for +${dp}% ${ROLE_STAT[role].short}` : `Tap for ${esc(ITEMS[wait.id].name)}`}</span>` : set ? `<span class="sl-setname">${esc(set.name)} ${sets[set.id] || 0}/3</span>` : ''}</span>
  </button>`;
}

/** something waiting to go on: side-by-side Old -> New comparison, exact stat gains, and the button */
function waitCard(h: Hero, wt: Waiting, wornDef: ItemDef, sets: Record<string, number>): string {
  const role = roleOf(h), gk = gearKey(h), d = ITEMS[wt.id], look = rarLook(d.id), oldLook = rarLook(wornDef.id);
  const share = itemShare(d), now = itemShare(wornDef);
  const slotName = ROLE_SLOTS[gk][wt.slot].name;
  const dp = Math.round((share.power - now.power) * 10) / 10, dh = Math.round((share.health - now.health) * 10) / 10, dil = share.ilvl - now.ilvl;
  const delta = (v: number, u = '') => v > 0 ? `<b class="cmp-d up">${GLYPH.rise}+${v}${u}</b>` : v < 0 ? `<b class="cmp-d down">${GLYPH.fall}−${Math.abs(v)}${u}</b>` : `<b class="cmp-d">Same</b>`;
  let extra = '';
  if (d.effectDesc) extra += `<p class="tip-eq"><b>+ ${d.kind === 'set' ? 'Piece perk' : 'Unique effect'}:</b> ${esc(d.effectDesc)}</p>`;
  const trait = wt.kind === 'regular' ? wt.piece.trait : undefined;
  const tr = trait ? traitDef(gk, trait) : undefined;
  if (tr) extra += `<p class="tip-tr"><b>+ Weapon trait (${esc(tr.name)}):</b> ${esc(tr.desc)}</p>`;
  if (d.setId && SETS[d.setId]) { const st = SETS[d.setId], n = (sets[st.id] || 0) + 1; extra += `<p class="tip-tr"><b>+ ${esc(st.name)} set (${sets[st.id] || 0}/3 → ${n}/3):</b> ${n >= 2 ? esc(st.bonus2.desc) : `1 more piece activates: ${esc(st.bonus2.desc)}`}</p>`; }
  return `<div class="tip tip-wait" style="--rc: ${look.color}; --rl: ${look.light}">
    <span class="tw-eye">${wt.kind === 'unique' ? 'New unique upgrade' : 'Upgrade ready for this slot'} · compare &amp; equip</span>
    <div class="tw-vs">
      <div class="tw-side old"><span class="tile" style="--c: ${oldLook.color}">${iconOf(wornDef.id)}</span><div><small>Wearing now</small><b style="color: ${oldLook.ink}">${esc(wornDef.name)}</b><span>${esc(oldLook.name)} · ilvl ${now.ilvl}</span></div></div>
      <i class="tw-arrow" aria-hidden="true">${GLYPH.right}</i>
      <div class="tw-side new"><span class="tile" style="--c: ${look.color}">${iconOf(d.id)}</span><div><small>New ${esc(slotName.toLowerCase())}</small><b style="color: ${look.ink}">${esc(d.name)}</b><span>${esc(look.name)} · ilvl ${share.ilvl}</span></div></div>
    </div>
    <div class="cmp-rows tw-rows">
      <div class="cmp-row"><span>Item level <small>${now.ilvl} → ${share.ilvl}</small></span>${delta(dil)}</div>
      <div class="cmp-row"><span>${esc(cap(ROLE_STAT[role].main))} <small>+${now.power}% → +${share.power}%</small></span>${delta(dp, '%')}</div>
      <div class="cmp-row"><span>Health <small>+${now.health}% → +${share.health}%</small></span>${delta(dh, '%')}</div>
    </div>
    ${extra}
    <div class="tw-acts"><button type="button" class="btn gold big puton" data-act="puton" data-slot="${wt.slot}">${GLYPH.shield}Equip ${esc(d.name)}</button>${wt.kind === 'unique' ? `<button type="button" class="btn small ghost" data-act="notnow" data-slot="${wt.slot}">Dismiss badge</button>` : ''}</div>
  </div>`;
}

/** the Slot Armoury Drawer for the clicked slot: shows upgrades waiting, all owned options to equip, and what is currently worn */
function tooltip(p: Profile, h: Hero, it: Worn, sets: Record<string, number>, wt: Waiting | null): string {
  const role = roleOf(h), gk = gearKey(h), d = it.def, look = rarLook(d.id);
  const share = itemShare(d);
  const slotName = ROLE_SLOTS[gk][it.slot].name;
  const lines: string[] = [];
  if (share.power > 0) lines.push(`<li>+${share.power}% ${esc(ROLE_STAT[role].main)}</li><li>+${share.health}% health</li>`);
  else lines.push(`<li class="dim">Starter gear: no bonus yet</li>`);
  let extra = '';
  if (d.effectDesc) extra += `<p class="tip-eq"><b>When worn:</b> ${esc(d.effectDesc)}</p>`;
  const tr = it.trait ? traitDef(gk, it.trait) : undefined;
  if (tr) extra += `<p class="tip-tr"><b>Trait: ${esc(tr.name)}.</b> ${esc(tr.desc)}</p>`;
  if (d.setId && SETS[d.setId]) {
    const s = SETS[d.setId], n = sets[s.id] || 0;
    const wornIds = new Set(Object.values(worn(p, h)).map((x) => x.def.id));
    extra += `<div class="tip-set"><b>${esc(s.name)} (${n}/3)</b><ul>${s.pieces.map((id) => `<li class="${wornIds.has(id) ? 'on' : p.collection[id] ? 'own' : ''}">${esc(nameOf(id))}${wornIds.has(id) ? '' : p.collection[id] ? ' · owned' : ''}</li>`).join('')}</ul>
      <p class="${n >= 2 ? 'on' : ''}">(2) ${esc(s.bonus2.desc)}</p><p class="${n >= 3 && s.bonus3.ready ? 'on' : ''}">(3) ${esc(s.bonus3.desc)}${s.bonus3.ready ? '' : ' Coming in a later update.'}</p></div>`;
  }
  if (d.flavor) extra += `<p class="tip-fl">“${esc(d.flavor)}”</p>`;
  let src = '';
  if (d.kind === 'gear') src = d.rar < 2 ? 'Regular gear. Every clear upgrades your weakest piece up to Rare.' : 'Regular Rare gear (ladder cap). Epic gear drops from the dungeon set (1/35) and boss weapons (1/50).';
  else {
    for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const x of tb.drops) if (x.id === d.id) src = `Drops from ${dg.bosses.find((b) => b.id === tb.boss)?.name || tb.boss}, ${fmtRate(x.rate)}.`;
    const e = p.collection[d.id];
    if (e) src += ` You got it at kill count ${fmtN(e.kc)}.`;
  }

  // Build full list of owned options in this slot's Armoury (regular piece + owned uniques/set pieces)
  const owned = ownedFor(p, h, it.slot);
  const bestReg = bestRegular(h, it.slot);
  const regDef = ITEMS[gearId(gk, it.slot, bestReg.rar)];
  const renderOpt = (optDef: ItemDef, isReg: boolean) => {
    const isWorn = isReg ? !it.unique && d.id === optDef.id : it.unique && d.id === optDef.id;
    const oLook = rarLook(optDef.id);
    const oShare = itemShare(optDef);
    const dp = Math.round((oShare.power - share.power) * 10) / 10;
    const dil = oShare.ilvl - share.ilvl;
    const diffTxt = isWorn
      ? 'Currently equipped'
      : `${dil >= 0 ? `+${dil}` : dil} ilvl · ${dp >= 0 ? `+${dp}%` : `${dp}%`} ${ROLE_STAT[role].short}`;
    const actBtn = isWorn
      ? `<span class="armoury-on">${GLYPH.check}Equipped</span>`
      : isReg && h.bag[it.slot]
        ? `<button type="button" class="btn small gold" data-act="puton" data-slot="${it.slot}">Equip</button>`
        : `<button type="button" class="btn small${dp > 0 || dil > 0 ? ' gold' : ''}" data-act="equip" data-slot="${it.slot}" data-id="${isReg ? '' : esc(optDef.id)}">Equip</button>`;
    return `<div class="armoury-opt${isWorn ? ' on' : ''}" style="--rc: ${oLook.color}">
      <button type="button" class="ao-main" data-act="item" data-id="${esc(optDef.id)}" title="Tap to inspect full stats">
        <span class="tile" aria-hidden="true">${iconOf(optDef.id)}</span>
        <span class="ao-tx">
          <b style="color: ${oLook.ink}">${esc(optDef.name)}</b>
          <small>${esc(oLook.name)} · ilvl ${oShare.ilvl} · ${esc(diffTxt)}</small>
        </span>
      </button>
      ${actBtn}
    </div>`;
  };
  const allOpts = [
    ...(owned.map((u) => renderOpt(u, false))),
    ...(regDef ? [renderOpt(regDef, true)] : []),
  ];
  const armouryList = allOpts.length > 1 || (owned.length > 0)
    ? `<div class="armoury-list"><span class="al-head">Owned ${esc(slotName.toLowerCase())}s in your Armoury <small>tap an item to inspect or Equip</small></span>${allOpts.join('')}</div>`
    : '';

  return `<div class="slot-drawer">
    <div class="sd-head">
      <b>${esc(slotName)} Slot Armoury</b>
      <button type="button" class="btn small ghost" data-act="slot" data-slot="${it.slot}">Close slot</button>
    </div>
    ${wt ? waitCard(h, wt, d, sets) : ''}
    ${armouryList}
    <div class="tip" style="--rc: ${look.color}; --rl: ${look.light}" aria-live="polite">
      <span class="tw-eye now">Equipped in ${esc(slotName.toLowerCase())} slot</span>
      <div class="tip-head"><span class="tile" aria-hidden="true">${iconOf(d.id)}</span><div><b class="tip-n">${esc(d.name)}</b><span class="tip-k">${esc(look.name)} ${esc(slotName.toLowerCase())} · Item level ${share.ilvl}</span></div></div>
      <ul class="tip-stats">${lines.join('')}</ul>${extra}<p class="tip-src">${esc(src)}</p>
    </div>
  </div>`;
}
