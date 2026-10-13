/**
 * Sheets: panels that slide up over the hearth. The dungeon picker, gear, the logs (collection,
 * bosses, achievements), settings, the hearth spot picker and an item's details. Each one is drawn
 * from the profile every time, so whatever changed is always shown.
 */
import { ACHIEVEMENT_LIST, COLLECTIBLES, DUNGEONS, ITEMS, SETS, TITLES, thing } from '../content';
import { AB, ORDER, ROLES, SLOTS_AB } from '../content/roles';
import { RARITY, ROLE_SLOTS, SLOT_IDS, TRAITS, traitDef } from '../content/gear';
import type { CollectibleKind, Rar, RoleId, SlotId, Tier } from '../content/types';
import { freshProfile } from '../meta/profile';
import { REROLL_COST, buyTrait, equip, healthPct, loadoutFor, ownedFor, powerPct, worn } from '../meta/gear';
import { HEARTH_SPOTS, place, spotById, spotOf } from '../meta/hearth';
import { maxPoints, points, progress } from '../meta/achievements';
import type { App } from './app';
import { actions, esc, fmtDate, fmtN, fmtRate, fmtT, GLYPH } from './dom';
import { colourOf, iconOf, nameOf, portrait, spriteURL, tile } from './art';
import { SFX } from './sound';
import { STARTS } from '../content/barrow/script.js';

export type LogTab = 'collection' | 'bosses' | 'achievements';
export type SheetSpec =
  | { kind: 'dungeon' }
  | { kind: 'gear'; role: RoleId }
  | { kind: 'logs'; tab: LogTab }
  | { kind: 'settings' }
  | { kind: 'picker'; spot: string }
  | { kind: 'item'; id: string; back?: SheetSpec };

type GearChoice = 'mine' | 2 | 3;
const KIND_WORD: Record<CollectibleKind, string> = { pet: 'Pets', mount: 'Mounts', trophy: 'Trophies', banner: 'Banners', cosmetic: 'Looks' };
const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'meta', 'hidden'];
const TIER_WORD: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', meta: 'Mastery', hidden: 'Hidden' };

export class Sheets {
  spec: SheetSpec | null = null;
  /** the dungeon picker remembers its choices while the page is open */
  private pick = { mode: 'loot' as 'loot' | 'practice', start: 'keeper', gear: 'mine' as GearChoice };
  private resetArmed = false;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      close: () => this.close(),
      back: () => { const s = this.spec; if (s && s.kind === 'item' && s.back) this.open(s.back); else this.close(); },
      role: (el) => { this.app.p.role = el.dataset.role as RoleId; SFX.play('ui'); this.app.save(); },
      mode: (el) => { this.pick.mode = el.dataset.v as 'loot' | 'practice'; SFX.play('ui'); this.refresh(); },
      start: (el) => { this.pick.start = el.dataset.v!; SFX.play('ui'); this.refresh(); },
      tgear: (el) => { const v = el.dataset.v!; this.pick.gear = v === 'mine' ? 'mine' : (+v as 2 | 3); SFX.play('ui'); this.refresh(); },
      go: () => this.go(),
      gearrole: (el) => this.open({ kind: 'gear', role: el.dataset.role as RoleId }),
      equip: (el) => { const s = this.spec; if (!s || s.kind !== 'gear') return; equip(this.app.p, s.role, el.dataset.slot as SlotId, el.dataset.id || null); SFX.play('place'); this.app.save(); },
      trait: (el) => { const s = this.spec; if (!s || s.kind !== 'gear') return; if (buyTrait(this.app.p, s.role, 'barrow', el.dataset.trait!)) { SFX.play('coin'); this.app.save(); } else SFX.play('nope'); },
      look: (el) => { const p = this.app.p, id = el.dataset.id!; const off = new Set(p.settings.looksOff); if (off.has(id)) off.delete(id); else off.add(id); p.settings.looksOff = [...off]; SFX.play('ui'); this.app.save(); },
      tab: (el) => { SFX.play('ui'); this.open({ kind: 'logs', tab: el.dataset.tab as LogTab }); },
      item: (el) => { SFX.play('ui'); this.open({ kind: 'item', id: el.dataset.id!, back: this.spec || undefined }); },
      title: (el) => { const p = this.app.p; p.title = el.dataset.id || null; SFX.play('ui'); this.app.save(); },
      place: (el) => { const s = this.spec; if (!s || s.kind !== 'picker') return; if (place(this.app.p, s.spot, el.dataset.id || null)) { SFX.play('place'); this.app.save(); this.close(); } },
      sound: () => { const p = this.app.p; p.settings.sound = !p.settings.sound; SFX.on = p.settings.sound; if (SFX.on) SFX.play('ui'); this.app.save(); },
      reset: () => {
        if (!this.resetArmed) { this.resetArmed = true; this.refresh(); setTimeout(() => { this.resetArmed = false; this.refresh(); }, 4000); return; }
        this.resetArmed = false;
        this.app.store.replace(freshProfile());
        this.app.toasts.text('Fresh start', 'Everything is back to zero.');
        this.close();
      },
      preview: (el) => { this.close(); this.app.reveal.preview(el.dataset.v as 'normal' | 'unique' | 'pet'); },
      walkout: (el) => { this.app.setDev({ walkout: el.dataset.v as 'off' }); SFX.play('ui'); this.refresh(); },
    });
    root.addEventListener('click', (e) => { if (e.target === root.firstElementChild) this.close(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.spec) this.close(); });
  }

  open(spec: SheetSpec): void {
    const was = !!this.spec;
    this.spec = spec;
    this.render(!was);
  }
  close(): void {
    if (!this.spec) return;
    this.spec = null;
    this.root.innerHTML = '';
  }
  refresh(): void { if (this.spec) this.render(false); }

  private render(fresh: boolean): void {
    const s = this.spec!;
    const scroll = this.root.querySelector('.sheet-body')?.scrollTop || 0;
    let head = '', tabs = '', body = '', foot = '';
    switch (s.kind) {
      case 'dungeon': ({ head, body, foot } = this.dungeon()); break;
      case 'gear': ({ head, tabs, body } = this.gear(s.role)); break;
      case 'logs': ({ head, tabs, body } = this.logs(s.tab)); break;
      case 'settings': ({ head, body } = this.settings()); break;
      case 'picker': ({ head, body } = this.picker(s.spot)); break;
      case 'item': ({ head, body } = this.item(s.id, !!s.back)); break;
    }
    this.root.innerHTML = `<div class="sheet-wrap"><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(head.replace(/<[^>]+>/g, ' ').trim().split('  ')[0] || 'Panel')}">
      <header class="sheet-head"><div>${head}</div><button type="button" class="icon-btn" data-act="close" aria-label="Close">${GLYPH.close}</button></header>
      ${tabs}<div class="sheet-body">${body}</div>${foot ? `<footer class="sheet-foot">${foot}</footer>` : ''}</section></div>`;
    const b = this.root.querySelector('.sheet-body');
    if (b && !fresh) b.scrollTop = scroll;
    if (fresh) (this.root.querySelector('.sheet-head .icon-btn') as HTMLElement | null)?.focus({ preventScroll: true });
    if (s.kind === 'logs' && s.tab === 'collection') this.markSeen();
  }

  /* ---------------------------------------------------------------- the dungeon picker */
  private dungeon() {
    const p = this.app.p, dg = DUNGEONS.barrow;
    const rec = p.dungeons.barrow, keeper = p.bosses['barrow.keeper'];
    const role = p.role;
    const roles = ORDER.map((r) => {
      const R = ROLES[r], L = loadoutFor(p, r);
      return `<button type="button" class="role" role="radio" data-act="role" data-role="${r}" aria-checked="${r === role}">
        <span class="portrait" aria-hidden="true">${portrait(r)}</span>
        <span class="rt"><b>${R.title}</b><span>${R.name}</span><span>Power +${powerPct(L)}%</span>
        <span class="kit">${SLOTS_AB.map((a) => `<span class="tile" title="${esc(AB[r][a].name)}">${tile(AB[r][a].key)}</span>`).join('')}</span></span></button>`;
    }).join('');
    const pr = this.pick;
    const practice = pr.mode === 'practice';
    const seg = (act: string, cur: string, opts: [string, string][]) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;
    const starts = STARTS.map((s: { id: string; name: string }) => [s.id, s.name] as [string, string]);
    const body = `
      <div class="dg-card">
        <span class="art" aria-hidden="true"><img src="${spriteURL('keeper')}" alt="" style="width: 92%; margin-bottom: -6px"></span>
        <div><h3>${esc(dg.name)}</h3><p>${esc(dg.blurb)}</p>
          <div class="chips"><span class="chip">Clears <b>${rec ? rec.clears : 0}</b></span><span class="chip">Best <b>${fmtT(rec?.pb)}</b></span><span class="chip">Gravekeeper KC <b>${keeper ? keeper.kc : 0}</b></span></div></div>
      </div>
      <h3 class="section-title">Your seat<small>two bots take the others</small></h3>
      <div class="roles" role="radiogroup" aria-label="Your role">${roles}</div>
      <h3 class="section-title">Run</h3>
      ${seg('mode', pr.mode, [['loot', 'For loot'], ['practice', 'Practice']])}
      ${practice ? `
        <div class="box">
          <div class="seg-row"><b style="font-family: var(--f-display); font-weight: 400">Start at</b> ${seg('start', pr.start, starts)}</div>
          <div class="seg-row"><b style="font-family: var(--f-display); font-weight: 400">Gear</b> ${seg('tgear', String(pr.gear), [['mine', 'Mine'], ['2', 'Try Rare'], ['3', 'Try Epic']])}</div>
          <p class="fine">Practice gives no loot, no kill count and no achievements. Good for learning a boss.</p>
        </div>` : `<p class="fine">From the entrance. Kill counts, drops, the walkout and achievements all count. Every clear upgrades a piece of your gear.</p>`}
      <div class="dg-card locked"><div><h3>More dungeons</h3><p style="color: inherit">Being mapped. Each one brings its own sets, pets, trophies and achievements.</p></div></div>`;
    const foot = `<button type="button" class="btn gold big" data-act="go">${practice ? 'Start practice' : 'Enter the crypt'}</button>`;
    return { head: `<h2>Into the Barrow</h2><p>Dungeon 1 of many</p>`, body, foot };
  }
  private go(): void {
    const p = this.app.p, pr = this.pick;
    SFX.play('ui');
    if (pr.mode === 'practice') this.app.startRun({ role: p.role, start: pr.start, testRar: pr.gear === 'mine' ? null : (pr.gear as Rar) });
    else this.app.startRun({ role: p.role, start: 'entrance', testRar: null });
  }

  /* ---------------------------------------------------------------- gear */
  private gear(role: RoleId) {
    const p = this.app.p, R = ROLES[role];
    const L = loadoutFor(p, role);
    const w = worn(p, role);
    const rec = p.dungeons.barrow;
    const marks = rec ? rec.marks : 0;
    const tabs = `<div class="tabs" role="tablist">${ORDER.map((r) => `<button type="button" class="tab" role="tab" data-act="gearrole" data-role="${r}" aria-selected="${r === role}">${ROLES[r].title}</button>`).join('')}</div>`;
    const rows = SLOT_IDS.map((slot) => {
      const it = w[slot], d = it.def;
      const rar = RARITY[d.rar];
      const set = d.setId ? SETS[d.setId] : null;
      const kindTxt = d.kind === 'unique' ? 'Unique weapon' : set ? `${set.name} set` : `${rar.name} ${ROLE_SLOTS[role][slot].name.toLowerCase()}`;
      const tr = it.trait ? traitDef(role, it.trait) : undefined;
      let desc = '';
      if (d.effectDesc) desc = `<span class="d">${esc(d.effectDesc)}</span>`;
      else if (tr) desc = `<span class="d"><b>${esc(tr.name)}.</b> ${esc(tr.desc)}</span>`;
      const owned = ownedFor(p, role, slot);
      const reg = p.heroes[role].regular[slot];
      const regName = ITEMS[`gear.${role}.${slot}.${reg.rar}`]?.name || 'Regular';
      const swap = owned.length ? `<div class="swap" role="radiogroup" aria-label="${slot}">
          <button type="button" class="sg" role="radio" data-act="equip" data-slot="${slot}" data-id="" aria-checked="${!it.unique}">${esc(regName)}</button>
          ${owned.map((u) => `<button type="button" class="sg" role="radio" data-act="equip" data-slot="${slot}" data-id="${u.id}" aria-checked="${it.unique && d.id === u.id}">${esc(u.name)}</button>`).join('')}</div>` : '';
      return `<div class="it" style="--rc: ${d.kind === 'gear' ? rar.color : '#E7B53C'}"><span class="tile" aria-hidden="true">${iconOf(d.id)}</span>
        <span class="tx"><span class="n" style="color: ${d.kind === 'gear' ? rar.ink : '#8A5A10'}">${esc(d.name)}</span><span class="m">${esc(kindTxt)}</span>${desc}</span><span></span>${swap}</div>`;
    }).join('');
    // the set for this role
    const set = Object.values(SETS).find((s) => s.role === role)!;
    const n = L.sets[set.id] || 0;
    const have = set.pieces.filter((id) => p.collection[id]).length;
    const setBox = `<div class="box setbox">
      <h3 class="section-title">${esc(set.name)}<small>wearing ${n} of 3 · own ${have} of 3</small></h3>
      <div class="setline ${n >= 2 ? 'on' : ''}"><i>2</i><span>${esc(set.bonus2.desc)}</span></div>
      <div class="setline ${n >= 3 ? 'on' : ''} ${set.bonus3.ready ? '' : 'later'}"><i>3</i><span>${esc(set.bonus3.desc)}${set.bonus3.ready ? '' : ' <em>(coming in a later update)</em>'}</span></div>
      <p class="fine">Pieces drop from the Gravekeeper, 1 in 50 each. ${esc(set.look)}.</p></div>`;
    // epic weapon trait
    const regW = p.heroes[role].regular.weapon;
    const traitBox = regW.rar === 3 ? `<div class="box"><h3 class="section-title">Weapon trait<small>${marks} Barrow Marks</small></h3>
      <div class="offer">${TRAITS[role].map((t) => `<button type="button" class="opt" data-act="trait" data-trait="${t.id}" aria-pressed="${regW.trait === t.id}" ${regW.trait === t.id || marks < REROLL_COST ? 'disabled' : ''}><b>${esc(t.name)}</b>${esc(t.desc)}${regW.trait === t.id ? '<span class="m">On your weapon</span>' : `<span class="m">Swap for ${REROLL_COST} marks</span>`}</button>`).join('')}</div>
      ${w.weapon.unique ? '<p class="fine">You are wearing a unique weapon; the trait is on your regular one.</p>' : ''}</div>`
      : `<p class="fine">At Epic your weapon rolls a trait that changes how a button works. Every clear moves your weakest piece up.</p>`;
    // looks
    const looks = ['cosmetic.glow_shield', 'cosmetic.glow_staff', 'cosmetic.crit_ice', 'cosmetic.trail_wisp', 'dye.ghostly']
      .filter((id) => (id === 'cosmetic.glow_shield' ? role === 'tank' : id === 'cosmetic.glow_staff' ? role === 'healer' : id === 'cosmetic.crit_ice' ? role === 'dps' : true));
    const looksBox = `<div class="box"><h3 class="section-title">Looks<small>never power</small></h3><div class="picks">${looks.map((id) => {
      const c = COLLECTIBLES[id], own = !!p.collection[id], on = own && !p.settings.looksOff.includes(id);
      return `<button type="button" class="pick" data-act="${own ? 'look' : 'item'}" data-id="${id}" aria-pressed="${on}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.5)"'}>${tile(c.icon)}</span><span><b>${esc(c.name)}</b><span>${own ? (on ? 'On' : 'Off') : esc(c.source)}</span></span></button>`;
    }).join('')}</div></div>`;
    const play = p.role === role ? `<span class="chip">You play ${esc(R.name)}</span>` : `<button type="button" class="btn small" data-act="role" data-role="${role}">Play as ${esc(R.name)}</button>`;
    const body = `<div class="power"><span class="chip">Power <b>+${powerPct(L)}%</b></span><span class="chip">Health <b>+${healthPct(L)}%</b></span><span class="chip">Gear score <b>${L.score.toFixed(1)}</b> / 22</span>${play}</div>
      <div class="items">${rows}</div>${setBox}${traitBox}${looksBox}`;
    return { head: `<h2>${esc(R.name)}'s gear</h2><p>${esc(R.title)} · ${esc(R.blurb)}</p>`, tabs, body };
  }

  /* ---------------------------------------------------------------- logs */
  private logs(tab: LogTab) {
    const tabs = `<div class="tabs" role="tablist">${(['collection', 'bosses', 'achievements'] as LogTab[]).map((t) => `<button type="button" class="tab" role="tab" data-act="tab" data-tab="${t}" aria-selected="${t === tab}">${t === 'collection' ? 'Collection' : t === 'bosses' ? 'Bosses' : 'Achievements'}</button>`).join('')}</div>`;
    const body = tab === 'collection' ? this.collection() : tab === 'bosses' ? this.bosses() : this.achievements();
    return { head: `<h2>Logs</h2><p>Everything you have found, killed and earned</p>`, tabs, body };
  }
  private collection(): string {
    const p = this.app.p;
    let out = '';
    for (const dg of Object.values(DUNGEONS)) {
      const got = dg.collection.filter((id) => p.collection[id]).length;
      const rateOf = (id: string) => { for (const t of dg.loot) for (const d of t.drops) if (d.id === id) return d.rate; return undefined; };
      out += `<h3 class="section-title">${esc(dg.name)}<small>${got} / ${dg.collection.length}</small></h3>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${dg.collection.length}" aria-valuenow="${got}"><i style="width: ${(got / dg.collection.length) * 100}%"></i></div>
        <div class="cgrid">${dg.collection.map((id) => {
          const e = p.collection[id];
          const isNew = e && !p.seen[id];
          return `<button type="button" class="cl ${e ? '' : 'miss'} ${isNew ? 'new' : ''}" data-act="item" data-id="${id}" aria-label="${esc(nameOf(id))}${e ? '' : ', not found yet'}">
            <span class="tile" aria-hidden="true">${iconOf(id)}</span><span class="n">${e ? esc(nameOf(id)) : '?'}</span><span class="m">${e ? (e.kc ? 'KC ' + fmtN(e.kc) : 'Owned') : fmtRate(rateOf(id))}</span></button>`;
        }).join('')}</div>`;
    }
    // rewards that are not drops
    const extra = Object.values(COLLECTIBLES).filter((c) => !Object.values(DUNGEONS).some((d) => d.collection.includes(c.id)));
    const gotX = extra.filter((c) => p.collection[c.id]).length;
    out += `<h3 class="section-title">Achievement rewards<small>${gotX} / ${extra.length}</small></h3><div class="cgrid">${extra.map((c) => {
      const e = p.collection[c.id];
      return `<button type="button" class="cl ${e ? '' : 'miss'} ${e && !p.seen[c.id] ? 'new' : ''}" data-act="item" data-id="${c.id}"><span class="tile" aria-hidden="true">${tile(c.icon)}</span><span class="n">${e ? esc(c.name) : '?'}</span><span class="m">${esc(KIND_WORD[c.kind])}</span></button>`;
    }).join('')}</div>`;
    return out;
  }
  private markSeen(): void {
    const p = this.app.p;
    let changed = false;
    for (const id of Object.keys(p.collection)) if (!p.seen[id]) { p.seen[id] = Date.now(); changed = true; }
    if (changed) this.app.store.save();
  }
  private bosses(): string {
    const p = this.app.p;
    let out = '';
    for (const dg of Object.values(DUNGEONS)) {
      const rec = p.dungeons[dg.id];
      out += `<h3 class="section-title">${esc(dg.name)}</h3>
        <div class="stats"><span class="chip">Runs <b>${rec ? rec.runs : 0}</b></span><span class="chip">Clears <b>${rec ? rec.clears : 0}</b></span><span class="chip">Best <b>${fmtT(rec?.pb)}</b></span><span class="chip">${esc(dg.marksName)} <b>${rec ? rec.marks : 0}</b></span></div>`;
      for (const b of dg.bosses) {
        const r = p.bosses[`${dg.id}.${b.id}`];
        out += `<div class="boss"><span class="art" aria-hidden="true"><img src="${spriteURL(b.id)}" alt="" style="width: ${b.id === 'keeper' ? 96 : 80}%"></span><div><h3>${esc(b.name)}</h3>
          <div class="stats"><span class="chip">Kill count <b>${r ? fmtN(r.kc) : 0}</b></span><span class="chip">Fastest <b>${fmtT(r?.pb)}</b></span><span class="chip">Wipes <b>${r ? r.wipes : 0}</b></span></div></div></div>`;
      }
    }
    const c = p.counters;
    const row = (k: string, label: string) => `<span class="chip">${label} <b>${fmtN(c[k] || 0)}</b></span>`;
    out += `<h3 class="section-title">Lifetime</h3><div class="stats">${row('kills', 'Kills')}${row('barrow.skeletons', 'Skeletons')}${row('barrow.wisps', 'Wisps sliced')}${row('barrow.chains', 'Chains cut')}${row('perfect_blocks', 'Perfect blocks')}${row('dodges', 'Dodges')}${row('saves', 'Saves')}${row('crits', 'Crits')}${row('biggest_crit', 'Biggest crit')}${row('deaths', 'Deaths')}${row('wipes', 'Wipes')}</div>`;
    return out;
  }
  private achievements(): string {
    const p = this.app.p;
    const titles = p.titles.filter((t) => TITLES[t]);
    let out = `<div class="stats"><span class="chip">Points <b>${points(p)}</b> / ${maxPoints()}</span><span class="chip">Earned <b>${Object.keys(p.achievements).length}</b> / ${ACHIEVEMENT_LIST.length}</span></div>`;
    out += `<div class="box"><h3 class="section-title">Title<small>shown on your hero</small></h3>${titles.length ? `<div class="titles" role="radiogroup">
      <button type="button" class="sg" role="radio" data-act="title" data-id="" aria-checked="${!p.title}">None</button>
      ${titles.map((t) => `<button type="button" class="sg" role="radio" data-act="title" data-id="${t}" aria-checked="${p.title === t}">${esc(TITLES[t].text)}</button>`).join('')}</div>` : '<p class="fine">Some achievements give a title. None yet.</p>'}</div>`;
    for (const tier of TIER_ORDER) {
      const list = ACHIEVEMENT_LIST.filter((a) => a.tier === tier);
      if (!list.length) continue;
      out += `<h3 class="section-title">${TIER_WORD[tier]}</h3>`;
      for (const a of list) {
        const done = p.achievements[a.id];
        const secret = tier === 'hidden' && !done;
        const pr = progress(p, a);
        const role = a.role ? ` · ${ROLES[a.role].title} only` : '';
        out += `<div class="ach ${done ? '' : 'locked'}"><span class="medal ${a.tier}" aria-hidden="true">${done ? '✓' : a.points}</span>
          <div><div class="n">${secret ? '???' : esc(a.name)}</div><div class="h">${secret ? 'Hidden. You will know it when it happens.' : esc(a.how) + esc(role)}</div>${secret ? '' : `<div class="rw">${esc(a.reward.text)}</div>`}</div>
          <div class="pts">${a.points}<small>${done ? fmtDate(done.at) : 'points'}</small></div>
          ${pr && !done ? `<div class="bar" role="progressbar" aria-valuenow="${pr.have}" aria-valuemax="${pr.need}" title="${pr.have} / ${pr.need}"><i style="width: ${(pr.have / pr.need) * 100}%"></i></div>` : ''}</div>`;
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------- one item */
  private item(id: string, hasBack: boolean) {
    const p = this.app.p;
    const t = thing(id);
    const e = p.collection[id];
    let kind = '', desc = '', more = '';
    if (t?.kind === 'item') {
      const d = t.def;
      kind = d.kind === 'unique' ? `Unique ${ROLE_SLOTS[d.role][d.slot].name.toLowerCase()} · ${ROLES[d.role].title}` : d.kind === 'set' ? `${SETS[d.setId!].name} set · ${ROLES[d.role].title} ${d.slot}` : `${RARITY[d.rar].name} ${d.slot}`;
      desc = d.flavor || '';
      if (d.effectDesc) more += `<div class="box"><b style="font-family: var(--f-display); font-weight: 400">Effect</b><span class="fine">${esc(d.effectDesc)}</span></div>`;
      if (d.setId) { const s = SETS[d.setId]; more += `<div class="box setbox"><b style="font-family: var(--f-display); font-weight: 400">${esc(s.name)}</b><div class="setline"><i>2</i><span>${esc(s.bonus2.desc)}</span></div><div class="setline later"><i>3</i><span>${esc(s.bonus3.desc)}</span></div></div>`; }
    } else if (t?.kind === 'collectible') {
      kind = KIND_WORD[t.def.kind];
      desc = t.def.desc;
    }
    let source = '';
    for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) for (const d of tb.drops) if (d.id === id) source = `${dg.bosses.find((b) => b.id === tb.boss)?.name}, ${fmtRate(d.rate)}${d.role ? ` (${ROLES[d.role].title})` : ''}`;
    if (!source && t?.kind === 'collectible') source = t.def.source;
    const kc = (() => { for (const dg of Object.values(DUNGEONS)) for (const tb of dg.loot) if (tb.drops.some((d) => d.id === id)) return p.bosses[`${dg.id}.${tb.boss}`]?.kc || 0; return null; })();
    const got = e ? `Got it${e.kc ? ` at kill count ${fmtN(e.kc)}` : ''} on ${fmtDate(e.at)}${e.n > 1 ? `. Seen ${e.n} times.` : '.'}` : kc !== null ? `Not yet. Your kill count is ${fmtN(kc)}.` : 'Not yet.';
    const spot = e ? spotOf(p, id) : null;
    const body = `<div class="detail"><span class="tile" aria-hidden="true" style="box-shadow: 0 3px 0 var(--ink), inset 0 0 0 4px ${colourOf(id)}">${iconOf(id)}</span>
      <div><h3>${esc(nameOf(id))}</h3><p class="fine">${esc(kind)}</p></div></div>
      ${desc ? `<p class="lede">${esc(desc)}</p>` : ''}${more}
      <div class="stats"><span class="chip">From <b>${esc(source || 'Unknown')}</b></span></div>
      <p class="fine">${esc(got)}${spot ? ` It is in your hearth: ${esc(spotById(spot)?.label.toLowerCase() || '')}.` : ''}</p>
      ${hasBack ? `<div class="actions"><button type="button" class="btn small" data-act="back">${GLYPH.left}Back</button></div>` : ''}`;
    return { head: `<h2>${esc(nameOf(id))}</h2><p>${esc(kind)}</p>`, body };
  }

  /* ---------------------------------------------------------------- hearth spot picker */
  private picker(spotId: string) {
    const p = this.app.p, spot = spotById(spotId)!;
    const all = Object.values(COLLECTIBLES).filter((c) => c.kind === spot.kind);
    const cur = p.hearth.spots[spotId] || null;
    const picks = all.map((c) => {
      const own = !!p.collection[c.id];
      const where = own ? spotOf(p, c.id) : null;
      const note = !own ? c.source : where && where !== spotId ? `Moves from ${spotById(where)?.label.toLowerCase()}` : where === spotId ? 'Here now' : 'Put it here';
      return `<button type="button" class="pick" data-act="${own ? 'place' : 'item'}" data-id="${c.id}" aria-pressed="${cur === c.id}"><span class="tile" aria-hidden="true" ${own ? '' : 'style="filter: grayscale(1) opacity(0.45)"'}>${tile(c.icon)}</span><span><b>${own ? esc(c.name) : '?'}</b><span>${esc(note)}</span></span></button>`;
    }).join('');
    const body = `<div class="picks">${picks}</div>
      ${cur ? `<div class="actions"><button type="button" class="btn small" data-act="place" data-id="">Leave it empty</button></div>` : ''}
      <p class="fine">${spot.kind === 'pet' ? 'Pets are rare drops. Once you have one it follows you home.' : spot.kind === 'mount' ? 'Mounts are very rare drops.' : spot.kind === 'trophy' ? 'Trophies come from achievements and bosses.' : 'Banners come from achievements.'} Later you will be able to invite people over to see it.</p>`;
    return { head: `<h2>${esc(spot.label)}</h2><p>${esc(KIND_WORD[spot.kind])} · ${HEARTH_SPOTS.filter((s) => s.kind === spot.kind).length} spot${HEARTH_SPOTS.filter((s) => s.kind === spot.kind).length > 1 ? 's' : ''} in the hearth</p>`, body };
  }

  /* ---------------------------------------------------------------- settings */
  private settings() {
    const p = this.app.p, st = this.app.store.state, dev = this.app.dev;
    const where = st === 'account' ? 'Saved to your account. It follows you between your phone and your computer.' : st === 'connecting' ? 'Connecting to your account…' : st === 'offline' ? 'Your account save could not be reached, so this device is keeping your progress until it can.' : 'Saved on this device. Open the game on claude.ai to keep it in your account too.';
    const seg = (act: string, cur: string, opts: [string, string][]) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button type="button" class="sg" role="radio" data-act="${act}" data-v="${v}" aria-checked="${cur === v}">${esc(t)}</button>`).join('')}</div>`;
    const body = `
      <div class="box"><h3 class="section-title">Sound</h3><div class="actions"><button type="button" class="btn small" data-act="sound">${p.settings.sound ? GLYPH.sound + 'Sound on' : GLYPH.mute + 'Sound off'}</button></div></div>
      <div class="box"><h3 class="section-title">Your save</h3><p class="fine">${esc(where)}</p><p class="fine">Save ${fmtN(p.rev)} · started ${fmtDate(p.createdAt)}</p></div>
      <div class="box"><h3 class="section-title">For testing</h3>
        <p class="fine">See the end-of-run reveal without earning it. Nothing is added to your save.</p>
        <div class="actions"><button type="button" class="btn small" data-act="preview" data-v="normal">Normal</button><button type="button" class="btn small" data-act="preview" data-v="unique">Unique</button><button type="button" class="btn small" data-act="preview" data-v="pet">Pet</button></div>
        <p class="fine">Play the lantern's walkout at the end of practice runs, so you can learn the tells.</p>
        ${seg('walkout', dev.walkout, [['off', 'Off'], ['normal', 'Normal'], ['unique', 'Unique'], ['pet', 'Pet']])}</div>
      <div class="box"><h3 class="section-title">Start over</h3><p class="fine">Wipes gear, kill counts, the collection log, achievements and the hearth.</p>
        <div class="actions"><button type="button" class="btn small" data-act="reset" style="${this.resetArmed ? 'background: var(--red); color: #FFFFFF' : ''}">${this.resetArmed ? 'Tap again to wipe everything' : 'Start over'}</button></div></div>
      <p class="fine">Build ${esc(BUILD)}</p>`;
    return { head: `<h2>Settings</h2>`, body };
  }
}

declare const __BUILD__: string;
const BUILD = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';
