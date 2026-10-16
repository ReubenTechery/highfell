/**
 * The reveal: the chest after a clear. The lantern beside it repeats the walkout's tell, then the
 * chest opens and the cards come out face down and flip one by one, rarest last. A pet or a mount
 * gets the whole screen, and so does a collection log filled at last: its hero walks out, and what it
 * gave stays on the page with a way to it. Then the numbers: kill counts, time, the log, the garden.
 */
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, ITEMS, TITLES } from '../content';
import type { RaceId } from '../content/folk';
import { BARROW } from '../content/barrow';
import { RARITY, ROLE_SLOTS, gearId, gearKey, traitDef } from '../content/gear';
import { ROLES } from '../content/roles';
import type { Rar, RoleId, SlotId } from '../content/types';
import { takeTrait, trialStarter, type Drop, type RunLoot, type Tell } from '../meta/loot';
import { activeHero, heroById, roleOf, type Hero, type Profile } from '../meta/profile';
import { readyBeds, seedTotal } from '../meta/vale';
import { logProgress } from '../meta/logs';
import { PLANTS } from '../content/vale';
import { itemShare, waiting, worn } from '../meta/gear';
import type { App } from './app';
import { actions, esc, fmtN, fmtRate, fmtT, GLYPH, reducedMotion, wait } from './dom';
import { colourOf, iconOf, nameOf, spriteURL, tile } from './art';
import { ROLE_STAT } from './itemsheet';
import { rewards } from './dungeonsheet';
import { SFX } from './sound';
import type { RunOpts } from './run';

export interface RevealExtra { unlocked: string[]; hero: string | null; role: RoleId; deaths: number; again: RunOpts | null; preview?: boolean; intro?: boolean }

/** who walks out when a dungeon's whole log is filled: the Barrow's gives the Risen, its heroic log gilds them */
const LOG_ART: Record<string, string> = { 'barrow.log': 'risen_tank_f', 'barrow-heroic.log': 'risen_tank_gilded_f' };

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
      makeintro: () => { SFX.play('ui'); if (activeHero(this.app.p)) this.app.showHearth(); else this.app.showCreate(); },
      gear: () => { SFX.play('ui'); this.goHome(); const id = this.extra?.hero || activeHero(this.app.p)?.id; if (id) this.app.sheets.open({ kind: 'gear', hero: id }); },
      keep: () => { this.trait = null; SFX.play('ui'); this.renderOffer(); },
      take: (el) => { const t = el.dataset.trait!; const h = heroById(this.app.p, this.extra?.hero); if (!this.extra?.preview && h) { takeTrait(h, t); this.app.store.save(); } this.trait = t; SFX.play('coin'); this.renderOffer(); },
      moment: () => this.closeMoment(),
      makerace: (el) => { SFX.play('ui'); this.goHome(); this.app.showCreate(undefined, el.dataset.race as RaceId); },
      putlook: () => { SFX.play('ui'); this.goHome(); this.app.sheets.open({ kind: 'looks' }); },
    });
  }

  show(loot: RunLoot, extra: RevealExtra): void {
    this.loot = loot; this.extra = extra;
    this.cards = [...loot.drops].sort((a, b) => order(a) - order(b));
    this.flipped = 0; this.skipping = false; this.running = false; this.trait = null;
    const tell: Tell = loot.tell;
    const dg = DUNGEONS[loot.dungeon] || BARROW;
    this.root.className = `scene reveal t-${tell}`;
    // the Crypt Trial's chest: real starter gear the first time, examples on a replay
    const trialReal = !!extra.intro && !extra.preview;
    const head = extra.intro ? 'Crypt Trial complete' : extra.preview ? 'Preview: nothing is added' : `${dg.name} · clear ${fmtN(loot.clears)}`;
    const title = extra.intro ? (trialReal ? 'Your first chest' : 'What a real clear can drop') : 'The Gravekeeper is buried';
    // the pet that came out of the chest stands in for the lantern (gilded from Heroic)
    const pet = loot.drops.find((d) => d.source === 'table' && COLLECTIBLES[d.id]?.kind === 'pet');
    const lantern = tell === 'pet' ? (pet && COLLECTIBLES[pet.id].sprite) || 'pet_keeper' : tell === 'unique' ? 'lantern_gold' : 'lantern_out';
    const kcChips = extra.intro
      ? `<span class="chip dark">${trialReal ? 'Starter chest' : 'Example chest'} · <b>4 drop types</b></span>`
      : Object.entries(loot.kc).map(([b, n]) => `<span class="chip dark">${esc(dg.bosses.find((x) => x.id === b)?.name || b)} <b>KC ${fmtN(n)}</b></span>`).join('');
    this.root.innerHTML = `<div class="rv-inner">
      <div class="rv-head"><p class="eyebrow">${esc(head)}</p><h1>${esc(title)}</h1>
        <div class="chips"><span class="chip dark ${loot.newPb ? 'pb' : ''}">${extra.intro ? 'Trial · ' : loot.newPb ? 'New best · ' : ''}<b>${fmtT(loot.time)}</b></span>${kcChips}</div></div>
      <button type="button" class="chest-stage idle" data-act="open" aria-label="Open the chest">
        <span class="halo"></span>
        <img class="lant" src="${spriteURL(lantern)}" alt="">
        <img class="chest-img" src="${spriteURL('chest')}" alt="">
        <span class="tap">${extra.intro && !trialReal ? 'Tap to see example drops' : 'Tap the chest'}</span>
      </button>
      <div class="cards" id="rv-cards" hidden></div>
      <div class="rv-panel" id="rv-offer" hidden></div>
      <div class="rv-panel" id="rv-sum" hidden></div>
      <div class="rv-panel rv-log" id="rv-log" hidden></div>
      <div class="rv-panel" id="rv-ach" hidden></div>
      <div class="rv-actions" id="rv-actions" hidden>
        ${extra.intro ? `<button type="button" class="btn gold big" id="rv-make" data-act="makeintro">${!activeHero(this.app.p) ? 'Make your hero' : trialReal ? 'To your hearth' : 'Back to the hearth'}</button>` : `${extra.again && !extra.preview ? '<button type="button" class="btn gold big" data-act="again">Run it again</button>' : ''}
        <button type="button" class="btn" data-act="home">Back to the hearth</button>
        ${extra.preview ? '' : '<button type="button" class="btn" data-act="gear">Gear</button>'}`}
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
    // a whole collection log filled: the biggest moment of all
    for (const id of this.extra?.unlocked || []) if (ACHIEVEMENTS[id]?.log && !this.skipping) await this.logMoment(id);
    ($('rv-skip', this.root)).hidden = true;
    this.after();
  }

  /** a log filled at last takes the screen: who it gives you walks out, and what else it gave */
  private logMoment(id: string): Promise<void> {
    const a = ACHIEVEMENTS[id], dg = DUNGEONS[a.log!];
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = 'big-moment gold log-moment';
      el.setAttribute('data-act', 'moment');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', a.name);
      el.innerHTML = `<span class="rays"></span><div class="bm"><p class="eyebrow">${esc(dg?.name || '')} · collection log complete</p>
        ${LOG_ART[id] ? `<img src="${spriteURL(LOG_ART[id])}" alt="">` : ''}<h2>${esc(a.name)}</h2>
        <p>${esc(a.reward.text)}.</p><p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('petfound');
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
      el.focus?.();
    });
  }
  private async pause(ms: number): Promise<void> { if (!this.skipping) await wait(ms); }

  private cardHtml(d: Drop, i: number): string {
    const table = d.source === 'table', ex = this.extra;
    // in the trial's chest the uniques are always examples; its starter gear is too, on a replay
    const example = !!ex?.intro && (table || !!ex.preview);
    const c = COLLECTIBLES[d.id];
    const it = ITEMS[d.id];
    const h = heroById(this.app.p, this.extra?.hero || null) || activeHero(this.app.p);
    const cls = c && c.kind === 'pet' ? 'r-pet' : table ? 'r-unique' : '';
    let sub = '', note = '', gains = '';
    if (example) {
      if (d.source === 'regular') { sub = 'Every clear · Your hero'; note = 'Climbs Common → Rare in 8 clears'; }
      else if (d.source === 'spare') { sub = 'Every clear · Shared warband'; note = 'Keeps your other heroes geared up'; }
      else if (c) { sub = `${fmtRate(d.rate)} fixed rate · Hearth trophy`; note = 'Display trophies, mounts & pets at home'; }
      else { sub = `${fmtRate(d.rate)} fixed rate · Set piece`; note = 'Every boss rolls its own table per kill'; }
    } else if (d.source === 'regular' || d.source === 'spare') {
      const role = d.role as RoleId, slot = d.slot as SlotId, r = RARITY[d.rar as Rar];
      const gk = d.source === 'regular' && h ? gearKey(h) : role;
      const slotName = ROLE_SLOTS[gk][slot].name.toLowerCase();
      if (d.offerTrait) { const t = traitDef(gk, d.offerTrait)!; sub = `Trait offer · ${esc(t.name)}`; note = esc(t.desc); }
      else {
        const prev = ITEMS[gearId(gk, slot, (d.prevRar ?? 0) as Rar)];
        const nowS = prev ? itemShare(prev) : { power: 0, health: 0, ilvl: 10 }, newS = it ? itemShare(it) : nowS;
        const dp = Math.round((newS.power - nowS.power) * 10) / 10, dh = Math.round((newS.health - nowS.health) * 10) / 10;
        sub = `${r.name} ${slotName}${d.source === 'spare' ? ` · shared` : ` · ilvl ${nowS.ilvl} → ${newS.ilvl}`}`;
        if (dp > 0) gains = `<span class="lc-gains"><b class="up">${GLYPH.rise}+${dp}% ${esc(ROLE_STAT[role].short)}</b><b class="up">${GLYPH.rise}+${dh}% hp</b></span>`;
        note = d.source === 'spare' ? `For your ${ROLES[role].title.toLowerCase()} heroes` : prev && d.prevRar !== d.rar ? `Replaces ${esc(prev.name)}` : '';
        if (d.trait) note += `${note ? ' · ' : ''}Trait: ${esc(traitDef(gk, d.trait)?.name || '')}`;
      }
    } else {
      const dg = DUNGEONS[this.loot?.dungeon || 'barrow'] || BARROW;
      const boss = dg.bosses.find((b) => b.id === d.boss)?.name || '';
      sub = `${fmtRate(d.rate)} · ${esc(boss)} KC ${fmtN(d.kc || 0)}`;
      if (it && !d.dupe) {
        const cur = h && roleOf(h) === it.role ? worn(this.app.p, h)[it.slot].def : ITEMS[gearId(gearKey(it), it.slot, 0)];
        const nowS = cur ? itemShare(cur) : { power: 0, health: 0, ilvl: 10 }, newS = itemShare(it);
        const dp = Math.round((newS.power - nowS.power) * 10) / 10, dh = Math.round((newS.health - nowS.health) * 10) / 10;
        if (dp > 0) gains = `<span class="lc-gains"><b class="up">${GLYPH.rise}+${dp}% ${esc(ROLE_STAT[it.role].short)}</b><b class="up">${GLYPH.rise}+${dh}% hp</b></span>`;
      }
      note = d.dupe ? `Duplicate · Seen ${fmtN(this.app.p.collection[d.id]?.n || 2)}× in log` : c ? (c.kind === 'pet' ? 'Waiting by the fire' : c.kind === 'mount' ? 'In the stall at home' : c.kind === 'cosmetic' ? 'A new look' : 'On the mantel') : it?.setId ? `${esc(it.name.split(' ')[0])} set piece · ilvl ${itemShare(it).ilvl}` : it?.effectDesc ? esc(it.effectDesc) : '';
    }
    const stamp = example ? '<span class="stamp ex">Example</span>' : table ? (d.dupe ? '<span class="stamp dupe">Dupe</span>' : '<span class="stamp">New</span>') : d.offerTrait ? '' : '<span class="stamp" style="background: var(--green)">Up</span>';
    const tapHint = `<span class="lc-tap">${it ? 'Tap to compare stats' : 'Tap to inspect'}</span>`;
    return `<button type="button" class="lc ${cls}" data-act="flip" data-i="${i}" aria-label="Card ${i + 1}">
      <span class="in"><span class="fc back"></span>
      <span class="fc front" style="--rc: ${colourOf(d.id)}">${stamp}<span class="tile" aria-hidden="true">${iconOf(d.id)}</span><b>${esc(nameOf(d.id))}</b><span class="sub">${sub}</span>${gains}${note ? `<em>${note}</em>` : ''}${tapHint}</span></span></button>`;
  }

  private flip(i: number): void {
    const el = $('rv-cards', this.root)?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const d = this.cards[i];
    if (el.classList.contains('up')) {
      if (d && (ITEMS[d.id] || COLLECTIBLES[d.id])) {
        SFX.play('ui');
        this.app.sheets.open({ kind: 'item', id: d.id });
      }
      return;
    }
    el.classList.add('up');
    el.setAttribute('aria-label', `${nameOf(d.id)} — tap to compare stats`);
    this.flipped++;
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
    const dg = DUNGEONS[loot.dungeon] || BARROW;
    const { have: got, need: all } = logProgress(p, dg.id);
    const newSlots = extra.intro ? 0 : loot.drops.filter((d) => d.source === 'table' && d.isNew).length;
    const kc = Object.entries(loot.kc);
    const h = heroById(p, extra.hero);
    const sum = $('rv-sum', this.root);
    sum.hidden = !!extra.intro;
    if (!extra.intro) {
      sum.innerHTML = `<h3>This run</h3><div class="rv-grid">
          <div class="kv"><span>Time</span><b>${fmtT(loot.time)}</b><small>${loot.newPb ? 'New best!' : loot.firstClear ? 'First clear!' : `Best ${fmtT(loot.pb)}`}</small></div>
          ${kc.map(([b, n]) => `<div class="kv"><span>${esc(dg.bosses.find((x) => x.id === b)?.name || b)}</span><b>KC ${fmtN(n)}</b></div>`).join('')}
          <div class="kv"><span>Collection log</span><b>${got} / ${all}</b><small>${newSlots ? `+${newSlots} new` : ''}</small></div>
          <div class="kv"><span>Party deaths</span><b>${extra.deaths}</b></div>
          ${gardenKv(p, loot)}
        </div>`;
    }
    this.renderOffer();
    if (extra.intro) {
      const el = $('rv-log', this.root);
      const ach = ACHIEVEMENTS['barrow.log'];
      const pct = (got / all * 100).toFixed(1);
      el.hidden = false;
      el.innerHTML = `<h3>Collection Log · ${got} / ${all}</h3>
        <p class="fine"><b>${extra.preview ? 'Cards above are examples.' : 'The gear is yours. The uniques are examples.'}</b> Fill all ${all} slots to unlock (the rarest are a bonus):</p>
        <div class="dgx-logbar" style="pointer-events: none"><span>Barrow Crypt log</span><b>${got}/${all}</b><i aria-hidden="true"><i style="width: ${pct}%"></i></i><span class="dgx-prize" aria-hidden="true">${tile('c_risen')}</span></div>
        ${ach ? rewards(ach, false) : ''}`;
    }
    // what a filled log gave, with the way to it: make one of the new heroes, put the look up
    const logs = extra.unlocked.map((id) => ACHIEVEMENTS[id]).filter((a) => a?.log);
    if (logs.length) {
      const el = $('rv-log', this.root);
      el.hidden = false;
      el.innerHTML = logs.map((a) => `<h3>${esc(a.name)}</h3>${rewards(a, true)}
        <div class="actions">${a.reward.race ? `<button type="button" class="btn gold" data-act="makerace" data-race="${esc(a.reward.race)}">Make a hero</button>` : ''}${a.reward.look ? '<button type="button" class="btn" data-act="putlook">Put up the look</button>' : ''}</div>`).join('');
    }
    if (extra.unlocked.length) {
      const ach = $('rv-ach', this.root);
      ach.hidden = false;
      ach.innerHTML = `<h3>Achievements</h3>${extra.unlocked.map((id) => { const a = ACHIEVEMENTS[id]; return `<div class="ach"><span class="medal ${a.tier}" aria-hidden="true">${a.points}</span><div><div class="n">${esc(a.name)}</div><div class="rw">${esc(a.reward.title ? 'Title: ' + (TITLES[a.reward.title]?.text || '') : a.reward.text)}</div></div><div class="pts">${a.points}<small>points</small></div></div>`; }).join('')}`;
    }
    // new gear waits for you: the Gear button says how much
    const up = h && !extra.preview ? waiting(p, h).length : 0;
    const gb = this.root.querySelector<HTMLElement>('#rv-actions [data-act="gear"]');
    if (gb && up) { gb.classList.add('gold', 'has-up'); gb.innerHTML = `Gear<i class="badge" aria-hidden="true">${up}</i>`; }
    $('rv-actions', this.root).hidden = false;
    (this.root.querySelector('#rv-actions .btn') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  private renderOffer(): void {
    const offer = this.loot?.drops.find((d) => d.offerTrait);
    const el = $('rv-offer', this.root);
    if (!offer || !el) return;
    const h = heroById(this.app.p, this.extra?.hero || null) || activeHero(this.app.p);
    const gk = h ? gearKey(h) : (offer.role as RoleId);
    const cur = traitDef(gk, offer.prevTrait), next = traitDef(gk, offer.offerTrait)!;
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

  /** the end of the Crypt Trial: the chest holds your first hero's starter pieces (given when you made them;
   *  a replayed trial shows them as examples), and a set piece and a trophy as examples of what a real
   *  clear can drop, which is what the gold lantern was about */
  showTrial(time: number, h: Hero | null, first: boolean): void {
    const role: RoleId = h ? roleOf(h) : 'tank';
    const set = h?.cls === 'rogue' ? 'shadeveil' : { tank: 'barrowguard', healer: 'candlewake', dps: 'rimebone' }[role];
    const drops: Drop[] = [
      ...(h ? trialStarter(h) : []),
      { id: `${set}.helm`, source: 'table', boss: 'knight', rate: 1 / 50, kc: 1, role, isNew: false, dupe: false, marks: 0 },
      { id: 'trophy.rattlebones_plume', source: 'table', boss: 'knight', rate: 1 / 50, kc: 1, role, isNew: false, dupe: false, marks: 0 },
    ];
    const t = Math.max(12, Math.round(time));
    const loot: RunLoot = { dungeon: 'barrow', role, hero: h?.id || '', drops, tell: 'unique', kc: {}, marks: 0, clears: 0, time: t, pb: t, newPb: false, firstClear: false };
    this.app.show('reveal');
    this.show(loot, { unlocked: [], hero: h?.id || null, role, deaths: 0, again: null, preview: !first || !h, intro: true });
  }

  /** the reveal with made-up loot, for testing the look. Touches nothing in the save. 'log' plays a run
   *  that fills the Barrow's whole collection log. */
  preview(kind: Tell | 'log'): void {
    const tell: Tell = kind === 'log' ? 'unique' : kind;
    const p = this.app.p, h = activeHero(p), role: RoleId = h ? roleOf(h) : 'tank', gk = h ? gearKey(h) : role;
    const kcK = (p.bosses['barrow.keeper']?.kc || 0) + 1, kcN = (p.bosses['barrow.knight']?.kc || 0) + 1;
    const drops: Drop[] = [
      { id: gearId(gk, 'helm', 2), source: 'regular', role, slot: 'helm', rar: 2, prevRar: 1, isNew: true, dupe: false, marks: 0, toEquip: true },
      { id: gearId(role === 'tank' ? 'healer' : 'tank', 'chest', 1), source: 'spare', role: role === 'tank' ? 'healer' : 'tank', slot: 'chest', rar: 1, prevRar: 0, isNew: true, dupe: false, marks: 0 },
    ];
    const set = h?.cls === 'rogue' ? 'shadeveil' : { tank: 'barrowguard', healer: 'candlewake', dps: 'rimebone' }[role];
    if (tell !== 'normal') drops.push({ id: `${set}.helm`, source: 'table', boss: 'keeper', rate: 1 / 50, kc: kcK, role, isNew: true, dupe: false, marks: 0, toEquip: true });
    if (tell === 'unique') drops.push({ id: 'trophy.rattlebones_plume', source: 'table', boss: 'knight', rate: 1 / 50, kc: kcN, role, isNew: false, dupe: true, marks: 3 });
    if (tell === 'pet') drops.push({ id: 'pet.pint_gravekeeper', source: 'table', rate: 1 / 2500, boss: 'keeper', kc: kcK, role, isNew: true, dupe: false, marks: 0 });
    const loot: RunLoot = { dungeon: 'barrow', role, hero: h?.id || '', drops, tell, kc: { knight: kcN, keeper: kcK }, marks: 1 + drops.reduce((a, d) => a + d.marks, 0), clears: (p.dungeons.barrow?.clears || 0) + 1, time: 247, pb: p.dungeons.barrow?.pb ?? 247, newPb: false, firstClear: false };
    this.app.show('reveal');
    this.show(loot, { unlocked: kind === 'log' ? ['barrow.log'] : [], hero: h?.id || null, role, deaths: 0, again: null, preview: true });
  }
}

function $(id: string, root: HTMLElement): HTMLElement { return root.querySelector('#' + id) as HTMLElement; }
/** the garden after this run: seeds the bosses dropped, and beds this clear made ready */
function gardenKv(p: Profile, loot: RunLoot): string {
  const seeds = Object.entries(loot.seeds || {});
  const got = seeds.map(([id, n]) => `+${n} ${PLANTS[id]?.seed || id}`).join(', ');
  const ready = readyBeds(p);
  const note = loot.bedsReady ? `${loot.bedsReady} bed${loot.bedsReady > 1 ? 's' : ''} just got ready` : ready ? `${ready} bed${ready > 1 ? 's' : ''} ready` : `${seedTotal(p)} seed${seedTotal(p) === 1 ? '' : 's'} to plant`;
  return `<div class="kv"><span>Garden</span><b>${got ? esc(got) : 'No seed'}</b><small>${esc(note)}</small></div>`;
}
