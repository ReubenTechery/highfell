/**
 * The reveal: the chest after a clear. The lantern beside it repeats the walkout's tell, then the
 * chest opens and the cards come out face down and flip one by one, rarest last. A pet or a mount
 * gets the whole screen. Then the numbers: kill counts, time, marks, the collection log.
 */
import { ACHIEVEMENTS, COLLECTIBLES, ITEMS, TITLES } from '../content';
import { BARROW } from '../content/barrow';
import { RARITY, ROLE_SLOTS, traitDef } from '../content/gear';
import { ROLES } from '../content/roles';
import type { Rar, RoleId, SlotId } from '../content/types';
import { gearId } from '../content/gear';
import { takeTrait, type Drop, type RunLoot, type Tell } from '../meta/loot';
import { activeHero, heroById, roleOf } from '../meta/profile';
import { waiting } from '../meta/gear';
import type { App } from './app';
import { actions, esc, fmtN, fmtRate, fmtT, reducedMotion, wait } from './dom';
import { colourOf, iconOf, nameOf, spriteURL } from './art';
import { SFX } from './sound';
import type { RunOpts } from './run';

export interface RevealExtra { unlocked: string[]; hero: string | null; role: RoleId; deaths: number; again: RunOpts | null; preview?: boolean }

/** rarest last: regular gear, then table drops from most to least common */
const order = (d: Drop): number => (d.source === 'regular' ? 0 : d.source === 'spare' ? 1 : 2 + (1 - (d.rate || 0)) * 1000);

export class Reveal {
  private loot: RunLoot | null = null;
  private extra: RevealExtra | null = null;
  private cards: Drop[] = [];
  private flipped = 0;
  private skipping = false;
  private running = false;
  private trait: string | null = null;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      open: () => { void this.play(); },
      skip: () => { this.skipping = true; this.closeMoment(); },
      flip: (el) => this.flip(+el.dataset.i!),
      again: () => { SFX.play('ui'); if (this.extra?.again) this.app.startRun(this.extra.again); },
      home: () => { SFX.play('ui'); this.goHome(); },
      gear: () => { SFX.play('ui'); this.goHome(); const id = this.extra?.hero || activeHero(this.app.p)?.id; if (id) this.app.sheets.open({ kind: 'gear', hero: id }); },
      keep: () => { this.trait = null; SFX.play('ui'); this.renderOffer(); },
      take: (el) => { const t = el.dataset.trait!; const h = heroById(this.app.p, this.extra?.hero); if (!this.extra?.preview && h) { takeTrait(h, t); this.app.store.save(); } this.trait = t; SFX.play('coin'); this.renderOffer(); },
      moment: () => this.closeMoment(),
    });
  }

  show(loot: RunLoot, extra: RevealExtra): void {
    this.loot = loot; this.extra = extra;
    this.cards = [...loot.drops].sort((a, b) => order(a) - order(b));
    this.flipped = 0; this.skipping = false; this.running = false; this.trait = null;
    const tell: Tell = loot.tell;
    this.root.className = `scene reveal t-${tell}`;
    const head = extra.preview ? 'Preview: nothing is added' : `${BARROW.name} · clear ${fmtN(loot.clears)}`;
    const lantern = tell === 'pet' ? 'pet_keeper' : tell === 'unique' ? 'lantern_gold' : 'lantern_out';
    const kcChips = Object.entries(loot.kc).map(([b, n]) => `<span class="chip dark">${esc(BARROW.bosses.find((x) => x.id === b)?.name || b)} <b>KC ${fmtN(n)}</b></span>`).join('');
    this.root.innerHTML = `<div class="rv-inner">
      <div class="rv-head"><p class="eyebrow">${esc(head)}</p><h1>The Gravekeeper is buried</h1>
        <div class="chips"><span class="chip dark ${loot.newPb ? 'pb' : ''}">${loot.newPb ? 'New best · ' : ''}<b>${fmtT(loot.time)}</b></span>${kcChips}</div></div>
      <button type="button" class="chest-stage idle" data-act="open" aria-label="Open the chest">
        <span class="halo"></span>
        <img class="lant" src="${spriteURL(lantern)}" alt="">
        <img class="chest-img" src="${spriteURL('chest')}" alt="">
        <span class="tap">Tap the chest</span>
      </button>
      <div class="cards" id="rv-cards" hidden></div>
      <div class="rv-panel" id="rv-offer" hidden></div>
      <div class="rv-panel" id="rv-sum" hidden></div>
      <div class="rv-panel" id="rv-ach" hidden></div>
      <div class="rv-actions" id="rv-actions" hidden>
        ${extra.again && !extra.preview ? '<button type="button" class="btn gold big" data-act="again">Run it again</button>' : ''}
        <button type="button" class="btn" data-act="home">Back to the hearth</button>
        ${extra.preview ? '' : '<button type="button" class="btn" data-act="gear">Gear</button>'}
      </div>
    </div>
    <button type="button" class="btn small skip" data-act="skip" id="rv-skip" hidden>Skip</button>`;
    this.root.scrollTop = 0;
    SFX.play(tell === 'pet' ? 'petchime' : tell === 'unique' ? 'flare' : 'gutter');
    (this.root.querySelector('.chest-stage') as HTMLElement).focus({ preventScroll: true });
  }

  /** the chest opens and the cards come out */
  private async play(): Promise<void> {
    if (this.running || !this.loot) return;
    this.running = true;
    const stage = this.root.querySelector<HTMLElement>('.chest-stage')!;
    stage.classList.remove('idle'); stage.classList.add('open');
    stage.removeAttribute('data-act');
    (stage.querySelector('.chest-img') as HTMLImageElement).src = spriteURL('chest_open');
    stage.querySelector('.tap')?.remove();
    SFX.play('chest');
    ($('rv-skip', this.root)).hidden = false;
    const wrap = $('rv-cards', this.root);
    wrap.hidden = false;
    wrap.innerHTML = this.cards.map((d, i) => this.cardHtml(d, i)).join('');
    const quick = reducedMotion();
    for (let i = 0; i < this.cards.length; i++) {
      const el = wrap.children[i] as HTMLElement;
      el.classList.add('deal'); el.style.animationDelay = `${i * 0.11}s`;
      if (!this.skipping && !quick) SFX.play('deal');
    }
    await this.pause(450 + this.cards.length * 110);
    for (let i = 0; i < this.cards.length; i++) {
      const d = this.cards[i];
      const big = d.source === 'table';
      if (big && !this.skipping) await this.pause(520);
      const c = d.source === 'table' ? COLLECTIBLES[d.id] : undefined;
      if (c && (c.kind === 'pet' || c.kind === 'mount') && !this.skipping) await this.moment(d);
      this.flip(i);
      if (!this.skipping) await this.pause(big ? 750 : 380);
    }
    ($('rv-skip', this.root)).hidden = true;
    this.after();
  }
  private async pause(ms: number): Promise<void> { if (!this.skipping) await wait(ms); }

  private cardHtml(d: Drop, i: number): string {
    const table = d.source === 'table';
    const c = COLLECTIBLES[d.id];
    const it = ITEMS[d.id];
    const cls = c && c.kind === 'pet' ? 'r-pet' : table ? 'r-unique' : '';
    let sub = '', note = '';
    if (d.source === 'regular' || d.source === 'spare') {
      const r = RARITY[d.rar as Rar];
      const slotName = ROLE_SLOTS[d.role as RoleId][d.slot as SlotId].name.toLowerCase();
      if (d.offerTrait) { const t = traitDef(d.role as RoleId, d.offerTrait)!; sub = `Trait offer · ${esc(t.name)}`; note = esc(t.desc); }
      else {
        sub = `${r.name} ${slotName}${d.source === 'spare' ? ` · shared` : ''}`;
        note = d.source === 'spare' ? `Every ${ROLES[d.role as RoleId].title.toLowerCase()} hero can put it on` : d.prevRar !== undefined && d.prevRar !== d.rar ? `Better than your ${RARITY[d.prevRar].name}` : '';
        if (d.trait) note += `${note ? '. ' : ''}Trait: ${esc(traitDef(d.role as RoleId, d.trait)?.name || '')}`;
        if (d.toEquip) note += `${note ? '. ' : ''}Put it on in Gear`;
      }
    } else {
      const boss = BARROW.bosses.find((b) => b.id === d.boss)?.name || '';
      sub = `${fmtRate(d.rate)} · ${esc(boss)} KC ${fmtN(d.kc || 0)}`;
      note = d.dupe ? `Duplicate: +${d.marks} ${esc(BARROW.marksName)}` : c ? (c.kind === 'pet' ? 'Waiting by the fire' : c.kind === 'mount' ? 'In the stall at home' : c.kind === 'cosmetic' ? 'A new look' : 'On the mantel') : it?.setId ? `${esc(it.name.split(' ')[0])} set piece` : it?.effectDesc ? esc(it.effectDesc) : '';
      if (d.toEquip && !d.dupe) note += `${note ? '. ' : ''}Put it on in Gear`;
    }
    const stamp = table ? (d.dupe ? '<span class="stamp dupe">Dupe</span>' : '<span class="stamp">New</span>') : d.offerTrait ? '' : '<span class="stamp" style="background: var(--green)">Up</span>';
    return `<button type="button" class="lc ${cls}" data-act="flip" data-i="${i}" aria-label="Card ${i + 1}">
      <span class="in"><span class="fc back"></span>
      <span class="fc front" style="--rc: ${colourOf(d.id)}">${stamp}<span class="tile" aria-hidden="true">${iconOf(d.id)}</span><b>${esc(nameOf(d.id))}</b><span class="sub">${sub}</span>${note ? `<em>${note}</em>` : ''}</span></span></button>`;
  }

  private flip(i: number): void {
    const el = $('rv-cards', this.root)?.children[i] as HTMLElement | undefined;
    if (!el || el.classList.contains('up')) return;
    el.classList.add('up');
    el.setAttribute('aria-label', nameOf(this.cards[i].id));
    this.flipped++;
    const d = this.cards[i];
    const c = COLLECTIBLES[d.id];
    if (this.skipping) return;
    if (d.source === 'table') SFX.play(c && (c.kind === 'pet' || c.kind === 'mount') ? 'petfound' : d.dupe ? 'coin' : 'rare');
    else SFX.play('flip');
  }

  /** a pet or a mount takes over the screen until you tap */
  private moment(d: Drop): Promise<void> {
    const c = COLLECTIBLES[d.id];
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = `big-moment ${c.kind === 'mount' ? 'gold' : ''}`;
      el.setAttribute('data-act', 'moment');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', c.name);
      el.innerHTML = `<span class="rays"></span><div class="bm"><img src="${spriteURL(c.sprite || '')}" alt=""><h2>${esc(c.name)}</h2>
        <p>${esc(fmtRate(d.rate))} · kill count ${fmtN(d.kc || 0)}</p><p>${c.kind === 'pet' ? 'He is waiting by the fire at home.' : 'Waiting in the stall at home.'}</p><p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('petfound');
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
      el.focus?.();
    });
  }
  private momentDone: (() => void) | null = null;
  private closeMoment(): void { if (this.momentDone) this.momentDone(); }

  /** the numbers, the trait offer, the achievements, the buttons */
  private after(): void {
    const loot = this.loot!, extra = this.extra!, p = this.app.p;
    const dg = BARROW;
    const got = dg.collection.filter((id) => p.collection[id]).length;
    const newSlots = loot.drops.filter((d) => d.source === 'table' && d.isNew).length;
    const rec = p.dungeons[dg.id];
    const kc = Object.entries(loot.kc);
    const sum = $('rv-sum', this.root);
    sum.hidden = false;
    sum.innerHTML = `<h3>This run</h3><div class="rv-grid">
      <div class="kv"><span>Time</span><b>${fmtT(loot.time)}</b><small>${loot.newPb ? 'New best!' : loot.firstClear ? 'First clear!' : `Best ${fmtT(loot.pb)}`}</small></div>
      ${kc.map(([b, n]) => `<div class="kv"><span>${esc(dg.bosses.find((x) => x.id === b)?.name || b)}</span><b>KC ${fmtN(n)}</b></div>`).join('')}
      <div class="kv"><span>${esc(dg.marksName)}</span><b>+${loot.marks}</b><small>${fmtN(rec ? rec.marks : 0)} total</small></div>
      <div class="kv"><span>Collection log</span><b>${got} / ${dg.collection.length}</b><small>${newSlots ? `+${newSlots} new` : ''}</small></div>
      <div class="kv"><span>Party deaths</span><b>${extra.deaths}</b></div>
    </div>`;
    this.renderOffer();
    if (extra.unlocked.length) {
      const ach = $('rv-ach', this.root);
      ach.hidden = false;
      ach.innerHTML = `<h3>Achievements</h3>${extra.unlocked.map((id) => { const a = ACHIEVEMENTS[id]; return `<div class="ach"><span class="medal ${a.tier}" aria-hidden="true">${a.points}</span><div><div class="n">${esc(a.name)}</div><div class="rw">${esc(a.reward.title ? 'Title: ' + (TITLES[a.reward.title]?.text || '') : a.reward.text)}</div></div><div class="pts">${a.points}<small>points</small></div></div>`; }).join('')}`;
    }
    // new gear waits for you: the Gear button says how much
    const h = heroById(p, extra.hero);
    const up = h && !extra.preview ? waiting(p, h).length : 0;
    const gb = this.root.querySelector<HTMLElement>('#rv-actions [data-act="gear"]');
    if (gb && up) { gb.classList.add('gold', 'has-up'); gb.innerHTML = `Put on new gear<i class="badge" aria-hidden="true">${up}</i>`; }
    $('rv-actions', this.root).hidden = false;
    (this.root.querySelector('#rv-actions .btn') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  private renderOffer(): void {
    const offer = this.loot?.drops.find((d) => d.offerTrait);
    const el = $('rv-offer', this.root);
    if (!offer || !el) return;
    const role = offer.role as RoleId;
    const cur = traitDef(role, offer.prevTrait), next = traitDef(role, offer.offerTrait)!;
    const took = this.trait === next.id;
    el.hidden = false;
    el.innerHTML = `<h3>Your Epic weapon could change</h3><p class="fine">Your gear is maxed, so the chest offers a different trait instead. Same power, a different way to play.</p>
      <div class="offer"><button type="button" class="opt" data-act="keep" aria-pressed="${!took}"><b>Keep ${esc(cur?.name || 'what you have')}</b>${esc(cur?.desc || '')}</button>
      <button type="button" class="opt" data-act="take" data-trait="${next.id}" aria-pressed="${took}"><b>Take ${esc(next.name)}</b>${esc(next.desc)}</button></div>`;
  }

  private goHome(): void {
    const loot = this.loot;
    if (loot && !this.extra?.preview) for (const d of loot.drops) if (d.isNew && COLLECTIBLES[d.id]) this.app.hearth.fresh.add(d.id);
    this.app.home();
  }

  /** the reveal with made-up loot, for testing the look. Touches nothing in the save. */
  preview(tell: Tell): void {
    const p = this.app.p, h = activeHero(p), role: RoleId = h ? roleOf(h) : 'tank';
    const kcK = (p.bosses['barrow.keeper']?.kc || 0) + 1, kcN = (p.bosses['barrow.knight']?.kc || 0) + 1;
    const drops: Drop[] = [
      { id: gearId(role, 'helm', 2), source: 'regular', role, slot: 'helm', rar: 2, prevRar: 1, isNew: true, dupe: false, marks: 0, toEquip: true },
      { id: gearId(role === 'tank' ? 'healer' : 'tank', 'chest', 1), source: 'spare', role: role === 'tank' ? 'healer' : 'tank', slot: 'chest', rar: 1, prevRar: 0, isNew: true, dupe: false, marks: 0 },
    ];
    const set = { tank: 'barrowguard', healer: 'candlewake', dps: 'rimebone' }[role];
    if (tell !== 'normal') drops.push({ id: `${set}.helm`, source: 'table', boss: 'keeper', rate: 1 / 50, kc: kcK, role, isNew: true, dupe: false, marks: 0, toEquip: true });
    if (tell === 'unique') drops.push({ id: 'trophy.rattlebones_plume', source: 'table', boss: 'knight', rate: 1 / 50, kc: kcN, role, isNew: false, dupe: true, marks: 3 });
    if (tell === 'pet') drops.push({ id: 'pet.pint_gravekeeper', source: 'table', boss: 'keeper', rate: 1 / 5000, kc: kcK, role, isNew: true, dupe: false, marks: 0 });
    const loot: RunLoot = { dungeon: 'barrow', role, hero: h?.id || '', drops, tell, kc: { knight: kcN, keeper: kcK }, marks: 1 + drops.reduce((a, d) => a + d.marks, 0), clears: (p.dungeons.barrow?.clears || 0) + 1, time: 247, pb: p.dungeons.barrow?.pb ?? 247, newPb: false, firstClear: false };
    this.app.show('reveal');
    this.show(loot, { unlocked: [], hero: h?.id || null, role, deaths: 0, again: null, preview: true });
  }
}

function $(id: string, root: HTMLElement): HTMLElement { return root.querySelector('#' + id) as HTMLElement; }
