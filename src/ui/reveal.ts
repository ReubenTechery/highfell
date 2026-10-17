/**
 * The reveal: the chest after a clear. The lantern beside it repeats the walkout's tell, then the
 * chest opens and the cards come out face down and flip one by one, rarest last. A pet or a mount
 * gets the whole screen, and so does a collection log filled at last: its hero walks out, and what it
 * gave stays on the page with a way to it. A new piece for the log gets a moment of its own: its stand
 * comes up and the piece drops on. Then the numbers: kill counts, time, the log's strip, the garden.
 * Anything worth showing off (meta/brag.ts) has a Share button, in its moment and above the numbers,
 * which makes a picture of it to post (share.ts).
 */
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS, DUNGEON_ENGINES, ITEMS, KITS, heroicVersion } from '../content';
import { TELL_SPRITES } from '../dungeon/walkout.js';
import { KIT_RATE, gilded } from '../content/kits';
import { TOME, bonusText } from '../content/xp';
import { levelProgress } from '../meta/xp';
import { pointsAt, unspent } from '../meta/talents';
import type { RaceId } from '../content/folk';
import { BARROW } from '../content/barrow';
import { RARITY, ROLE_SLOTS, gearId, gearKey, traitDef } from '../content/gear';
import { ROLES } from '../content/roles';
import type { DungeonInfo, Rar, RoleId, SlotId } from '../content/types';
import { takeTrait, trialStarter, type Drop, type RunLoot, type Tell } from '../meta/loot';
import { bragsOf, type Brag, type BragKind } from '../meta/brag';
import { activeHero, heroById, roleOf, type Hero, type Profile } from '../meta/profile';
import { readyBeds, seedTotal } from '../meta/vale';
import { logAchievement, logProgress, standPieces, standsOf } from '../meta/logs';
import { wearTitle } from '../meta/achievements';
import { PLANTS } from '../content/vale';
import { itemShare, waiting, worn } from '../meta/gear';
import type { App } from './app';
import { actions, esc, fmtN, fmtRate, fmtT, GLYPH, reducedMotion, wait } from './dom';
import { colourOf, iconOf, nameOf, spriteURL, standSvg, tile } from './art';
import { ROLE_STAT } from './itemsheet';
import { mainReward, rewards } from './dungeonsheet';
import { dropOf, prizeArt, slotTag } from './logbook';
import { SFX } from './sound';
import { achRow } from './achcard';
import { cardWords } from './sharecard';
import type { RunOpts } from './run';

export interface RevealExtra { unlocked: string[]; hero: string | null; role: RoleId; deaths: number; again: RunOpts | null; preview?: boolean; intro?: boolean }

/** rarest last: regular gear, the pages, then table drops and tomes from most to least common */
const order = (d: Drop): number => (d.source === 'regular' ? 0 : d.source === 'xp' && !d.rate ? 1 : 2 + (1 - (d.rate || 0)) * 1000);

export class Reveal {
  private loot: RunLoot | null = null;
  private extra: RevealExtra | null = null;
  private cards: Drop[] = [];
  private flipped = 0;
  private skipping = false;
  private running = false;
  private trait: string | null = null;
  /** what this chest has to show off, best first (meta/brag.ts): the Share buttons open on one of them */
  private brags: Brag[] = [];

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      open: () => { void this.play(); },
      skip: () => { this.skipping = true; this.closeMoment(); },
      flip: (el) => this.flip(+el.dataset.i!),
      again: () => { SFX.play('ui'); if (this.extra?.again) this.app.startRun(this.extra.again); },
      home: () => { SFX.play('ui'); this.goHome(); },
      makeintro: () => { SFX.play('ui'); if (activeHero(this.app.p)) this.app.showHearth(); else this.app.showCreate(); },
      gear: () => { SFX.play('ui'); this.goHome(); const id = this.extra?.hero || activeHero(this.app.p)?.id; if (id) this.app.sheets.open({ kind: 'gear', hero: id }); },
      // your level brought talent points: straight to your hero's tree
      talents: () => { SFX.play('ui'); this.goHome(); const id = this.extra?.hero || activeHero(this.app.p)?.id; if (id) this.app.sheets.open({ kind: 'gear', hero: id, tab: 'talents' }); },
      keep: () => { this.trait = null; SFX.play('ui'); this.renderOffer(); },
      take: (el) => { const t = el.dataset.trait!; const h = heroById(this.app.p, this.extra?.hero); if (!this.extra?.preview && h) { takeTrait(h, t); this.app.store.save(); } this.trait = t; SFX.play('coin'); this.renderOffer(); },
      moment: () => this.closeMoment(),
      makerace: (el) => { SFX.play('ui'); this.goHome(); this.app.showCreate(undefined, el.dataset.race as RaceId); },
      putlook: () => { SFX.play('ui'); this.goHome(); this.app.sheets.open({ kind: 'looks' }); },
      tolog: (el) => { SFX.play('ui'); this.goHome(); this.app.sheets.open({ kind: 'logs', tab: 'collection', entry: el.dataset.id }); },
      // an achievement's card opens over the chest; a title goes on the hero you play, right here
      ach: (el) => { SFX.play('ui'); this.app.openAchievement(el.dataset.id || ''); },
      wear: (el) => {
        const h = activeHero(this.app.p);
        if (this.extra?.preview || !h || !wearTitle(this.app.p, h, el.dataset.id || null)) { SFX.play('nope'); return; }
        SFX.play('equip'); this.app.store.save(); this.renderAch();
      },
      share: (el) => this.app.share.open(this.brags, { hero: this.extra?.hero, preview: this.extra?.preview, at: +(el.dataset.brag || 0) }),
    });
  }

  show(loot: RunLoot, extra: RevealExtra): void {
    this.loot = loot; this.extra = extra;
    this.cards = [...loot.drops].sort((a, b) => order(a) - order(b));
    this.flipped = 0; this.skipping = false; this.running = false; this.trait = null;
    this.brags = extra.intro ? [] : bragsOf(this.app.p, loot, extra.unlocked);
    const tell: Tell = loot.tell;
    const dg = DUNGEONS[loot.dungeon] || BARROW;
    this.root.className = `scene reveal t-${tell}${loot.gild ? ' gild' : ''}`;
    // the Crypt Trial's chest: real starter gear the first time, examples on a replay
    const trialReal = !!extra.intro && !extra.preview;
    const head = extra.intro ? 'Crypt Trial complete' : extra.preview ? 'Preview: nothing is added' : `${dg.name} · clear ${fmtN(loot.clears)}`;
    const base = DUNGEONS[dg.heroicOf || dg.id] || dg;
    const title = extra.intro ? (trialReal ? 'Your first chest' : 'What a real clear can drop') : base.clearTitle || 'The Gravekeeper is buried';
    // the pet that came out of the chest stands in for the lantern (or the cuckoo clock), gilded from Heroic
    const pet = loot.drops.find((d) => d.source === 'table' && COLLECTIBLES[d.id]?.kind === 'pet');
    const style = ((DUNGEON_ENGINES[base.id] as { walkout?: string } | undefined)?.walkout || 'lantern') as keyof typeof TELL_SPRITES;
    const lantern = tell === 'pet' ? (pet && COLLECTIBLES[pet.id].sprite) || 'pet_keeper' : TELL_SPRITES[style][tell];
    const kcChips = extra.intro
      ? `<span class="chip dark">${trialReal ? 'Starter chest' : 'Example chest'} · <b>4 drop types</b></span>`
      : Object.entries(loot.kc).map(([b, n]) => `<span class="chip dark">${esc(dg.bosses.find((x) => x.id === b)?.name || b)} <b>KC ${fmtN(n)}</b></span>`).join('');
    this.root.innerHTML = `<div class="rv-inner">
      <div class="rv-head"><p class="eyebrow">${esc(head)}</p><h1>${esc(title)}</h1>
        <div class="chips"><span class="chip dark ${loot.newPb ? 'pb' : ''}">${extra.intro ? 'Trial · ' : loot.newPb ? 'New best · ' : ''}<b>${fmtT(loot.time)}</b></span>${kcChips}</div></div>
      <button type="button" class="chest-stage idle" data-act="open" aria-label="Open the chest">
        <span class="halo"></span>${loot.gild ? '<span class="dust" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' : ''}
        <img class="lant" src="${spriteURL(lantern)}" alt="">
        <img class="chest-img" src="${spriteURL('chest')}" alt="">
        <span class="tap">${extra.intro && !trialReal ? 'Tap to see example drops' : 'Tap the chest'}</span>
      </button>
      <div class="cards" id="rv-cards" hidden></div>
      <div class="rv-panel rv-brag" id="rv-brag" hidden></div>
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
    const clock = style === 'cuckoo';
    SFX.play(tell === 'pet' ? 'petchime' : tell === 'unique' ? (clock ? 'cuckoo' : 'flare') : tell === 'kit' ? 'gild' : clock ? 'clocktick' : 'gutter');
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
      // a Grand Tome (1 in 500) gets the screen too
      if (d.id === 'xp.grand' && !this.skipping) await this.tomeMoment(d);
      this.flip(i);
      if (!this.skipping) await this.pause(big ? 750 : 380);
      if (big && d.isNew && !this.skipping && !(c && (c.kind === 'pet' || c.kind === 'mount')) && this.logOf(d.id)) await this.slotMoment(d);
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
        ${prizeArt(id) ? `<img src="${spriteURL(prizeArt(id) as string)}" alt="">` : ''}<h2>${esc(a.name)}</h2>
        <p>${esc(a.reward.text)}.</p>${this.shareBtn(this.bragAt('log', id))}<p style="opacity: 0.7">Tap to carry on</p></div>`;
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
    const it = ITEMS[d.id], kit = KITS[d.id];
    const h = heroById(this.app.p, this.extra?.hero || null) || activeHero(this.app.p);
    const cls = c && c.kind === 'pet' ? 'r-pet' : kit ? 'r-kit' : table ? 'r-unique' : d.id === 'xp.grand' ? 'r-xpgrand' : '';
    let sub = '', note = '', gains = '';
    if (example) {
      if (d.source === 'regular') { sub = 'Every clear · Your hero'; note = 'Climbs Common → Rare in 8 clears'; }
      else if (c) { sub = `${fmtRate(d.rate)} fixed rate · Hearth trophy`; note = 'Display trophies, mounts & pets at home'; }
      else { sub = `${fmtRate(d.rate)} fixed rate · Set piece`; note = 'Every boss rolls its own table per kill'; }
    } else if (d.source === 'xp') {
      // the chest's XP: its lore pages (always), or a tome (at its rate)
      const tome = TOME[d.id];
      sub = tome ? `${fmtRate(d.rate)} · rolled on its own` : 'In every chest';
      gains = `<b class="lc-xp">+${fmtN(d.xp || 0)} XP</b>`;
      note = tome ? esc(tome.desc) : `${d.n || 1} page${(d.n || 1) === 1 ? '' : 's'} this time: 1 to 10 a chest`;
    } else if (d.source === 'regular') {
      const role = d.role as RoleId, slot = d.slot as SlotId, r = RARITY[d.rar as Rar];
      const gk = h ? gearKey(h) : role;
      const slotName = ROLE_SLOTS[gk][slot].name.toLowerCase();
      if (d.offerTrait) { const t = traitDef(gk, d.offerTrait)!; sub = `Trait offer · ${esc(t.name)}`; note = esc(t.desc); }
      else {
        const prev = ITEMS[gearId(gk, slot, (d.prevRar ?? 0) as Rar)];
        const nowS = prev ? itemShare(prev) : { power: 0, health: 0, ilvl: 10 }, newS = it ? itemShare(it) : nowS;
        const dp = Math.round((newS.power - nowS.power) * 10) / 10, dh = Math.round((newS.health - nowS.health) * 10) / 10;
        sub = `${r.name} ${slotName} · Power ${nowS.ilvl} → ${newS.ilvl}`;
        if (dp > 0) gains = `<span class="lc-gains"><b class="up">${GLYPH.rise}+${dp}% ${esc(ROLE_STAT[role].short)}</b><b class="up">${GLYPH.rise}+${dh}% hp</b></span>`;
        note = prev && d.prevRar !== d.rar ? `Replaces ${esc(prev.name)}` : '';
        if (d.trait) note += `${note ? ' · ' : ''}Trait: ${esc(traitDef(gk, d.trait)?.name || '')}`;
      }
    } else {
      const dg = DUNGEONS[this.loot?.dungeon || 'barrow'] || BARROW;
      const boss = dg.bosses.find((b) => b.id === d.boss)?.name || '';
      // Heroic's own drops count on its kill count; the normal ones on the dungeon's
      const own = !!dg.heroicOf && dg.collection.includes(d.id);
      sub = `${fmtRate(d.rate)} · ${own ? 'Heroic' : esc(boss)} KC ${fmtN(d.kc || 0)}`;
      if (it && !d.dupe) {
        const cur = h && roleOf(h) === it.role ? worn(this.app.p, h)[it.slot].def : ITEMS[gearId(gearKey(it), it.slot, 0)];
        const nowS = cur ? itemShare(cur) : { power: 0, health: 0, ilvl: 10 }, newS = itemShare(it);
        const dp = Math.round((newS.power - nowS.power) * 10) / 10, dh = Math.round((newS.health - nowS.health) * 10) / 10;
        if (dp > 0) gains = `<span class="lc-gains"><b class="up">${GLYPH.rise}+${dp}% ${esc(ROLE_STAT[it.role].short)}</b><b class="up">${GLYPH.rise}+${dh}% hp</b></span>`;
      }
      const piece = kit && ITEMS[kit.item];
      note = d.dupe ? `Duplicate · Seen ${fmtN(this.app.p.collection[d.id]?.n || 2)}× in log` : piece ? `Gilding kit · ${this.app.p.collection[piece.id] ? 'gilds your' : 'gilds the'} ${esc(piece.name)}` : c ? (c.kind === 'pet' ? 'Waiting by the fire' : c.kind === 'mount' ? 'In the paddock at home' : c.kind === 'cosmetic' ? 'A new look' : 'On the mantel') : it?.setId ? `${esc(it.name.split(' ')[0])} set piece · Power ${itemShare(it).ilvl}` : it?.effectDesc ? esc(it.effectDesc) : '';
    }
    const xp = d.source === 'xp';
    const stamp = example ? '<span class="stamp ex">Example</span>' : table ? (d.dupe ? '<span class="stamp dupe">Dupe</span>' : '<span class="stamp">New</span>') : xp ? '<span class="stamp xp">XP</span>' : d.offerTrait ? '' : '<span class="stamp" style="background: var(--green)">Up</span>';
    // XP has nothing more to see
    const tapHint = xp ? '' : `<span class="lc-tap">${it ? 'Tap to compare stats' : 'Tap to inspect'}</span>`;
    return `<button type="button" class="lc ${cls}" data-act="flip" data-i="${i}" aria-label="Card ${i + 1}">
      <span class="in"><span class="fc back"></span>
      <span class="fc front" style="--rc: ${colourOf(d.id)}">${stamp}<span class="tile" aria-hidden="true">${iconOf(d.id)}</span><b>${esc(nameOf(d.id))}</b><span class="sub">${sub}</span>${gains}${note ? `<em>${note}</em>` : ''}${tapHint}</span></span></button>`;
  }

  private flip(i: number): void {
    const el = $('rv-cards', this.root)?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const d = this.cards[i];
    if (el.classList.contains('up')) {
      if (d && (ITEMS[d.id] || KITS[d.id] || COLLECTIBLES[d.id])) {
        SFX.play('ui');
        this.app.sheets.open({ kind: 'item', id: d.id });
      }
      return;
    }
    el.classList.add('up');
    el.setAttribute('aria-label', d.source === 'xp' ? `${nameOf(d.id)}: ${fmtN(d.xp || 0)} XP` : `${nameOf(d.id)} — tap to compare stats`);
    this.flipped++;
    const c = COLLECTIBLES[d.id];
    if (this.skipping) return;
    if (d.source === 'table') SFX.play(c && (c.kind === 'pet' || c.kind === 'mount') ? 'petfound' : d.dupe ? 'coin' : 'rare');
    else if (d.source === 'xp') { SFX.play('flip'); SFX.play(d.rate ? 'rare' : 'xp', 0.8); }
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
        <p>${esc(fmtRate(d.rate))} · kill count ${fmtN(d.kc || 0)}</p><p>${c.kind === 'pet' ? 'He is waiting by the fire at home.' : 'Waiting in the paddock at home.'}</p>${this.shareBtn(this.bragAt(c.kind === 'pet' ? 'pet' : 'unique', d.id))}<p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('petfound');
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
      el.focus?.();
    });
  }
  /** a Grand Tome: the rarest XP there is, gold, with what it gave */
  private tomeMoment(d: Drop): Promise<void> {
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = 'big-moment gold';
      el.setAttribute('data-act', 'moment');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', 'Grand Tome');
      el.innerHTML = `<span class="rays"></span><div class="bm"><span class="tile bm-tile" aria-hidden="true">${tile('tome_grand')}</span><h2>Grand Tome!</h2>
        <p>${esc(fmtRate(d.rate))} · <b>+${fmtN(d.xp || 0)} XP</b></p><p>${esc(TOME['xp.grand']?.desc || '')}</p>${this.shareBtn(this.bragAt('tome', d.id))}<p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('petfound'); SFX.play('levelup', 0.8);
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
      el.focus?.();
    });
  }
  /** a piece the log didn't have: its stand comes up and the piece drops on (a trophy or a dye stands on its
   *  own), with what it is, the kill count it came at, whether it finished a set, and the log ticking up */
  private slotMoment(d: Drop): Promise<void> {
    const p = this.app.p, dg = this.logOf(d.id) || BARROW, t = slotTag(d.id), c = COLLECTIBLES[d.id];
    const stand = standsOf(dg.id).find((s) => standPieces(s).includes(d.id));
    const on = (id: string): boolean => id === d.id || !!p.collection[id];
    const art = stand ? standSvg(standPieces(stand), on, { drop: d.id }) : c?.sprite ? `<img src="${spriteURL(c.sprite)}" alt="">` : `<span class="tile">${iconOf(d.id)}</span>`;
    const done = !!stand && standPieces(stand).every(on);
    const { before, after, need } = this.logTick(d.id, dg);
    // a piece that finished its set shares the set (the weapon leans on the stand, but it isn't one of the three)
    const set = stand?.pieces.includes(d.id) ? this.brags.findIndex((b) => b.kind === 'set' && b.id === stand.set.id && !!b.gilded === !!dg.heroicOf) : -1;
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = 'big-moment gold slot-moment';
      el.setAttribute('data-act', 'moment');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', `New in your collection log: ${nameOf(d.id)}`);
      el.innerHTML = `<span class="rays"></span><div class="bm"><p class="eyebrow">New in your collection log</p>
        <div class="sm-art${stand ? '' : ' loose'}">${art}</div><h2>${esc(nameOf(d.id))}</h2>
        <p class="sm-meta"><i class="sm-rar${t.pale ? ' pale' : ''}" style="--rc: ${t.bg}">${esc(t.word)}</i>${esc(fmtRate(d.rate))} · kill count ${fmtN(d.kc || 0)}</p>
        ${done && stand ? `<p class="sm-done">${GLYPH.check}${esc(stand.set.name)} set done · ${standPieces(stand).length} of ${standPieces(stand).length}</p>` : stand ? `<p class="sm-set">${esc(stand.set.name)} · ${standPieces(stand).filter(on).length} of ${standPieces(stand).length}</p>` : ''}
        ${need ? this.stripHtml(dg.id, before, after, need, '') : ''}${this.shareBtn(set >= 0 ? set : this.bragAt('unique', d.id))}<p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('slot'); SFX.play('rare', 0.7);
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
      el.focus?.();
    });
  }
  /** the logs this chest can fill: the run's dungeon's, and on Heroic its normal dungeon's too (the normal
   *  pieces drop there; the kits fill Heroic's own) */
  private logs(): DungeonInfo[] {
    const dg = DUNGEONS[this.loot?.dungeon || ''] || BARROW, base = dg.heroicOf ? DUNGEONS[dg.heroicOf] : undefined;
    return base ? [dg, base] : [dg];
  }
  /** the log a drop is a slot of, if it's one of this chest's */
  private logOf(id: string): DungeonInfo | undefined { return this.logs().find((l) => l.collection.includes(id)); }
  /** a log's count before and after a new piece (a bonus slot doesn't count), allowing for the others that
   *  came in the same chest, and for a preview, which adds nothing to the save */
  private logTick(id: string, dg: DungeonInfo): { before: number; after: number; need: number; start: number; end: number } {
    const p = this.app.p, bonus = dg.bonus || [];
    const counted = this.cards.filter((x) => x.source === 'table' && x.isNew && dg.collection.includes(x.id) && !bonus.includes(x.id)).map((x) => x.id);
    const { have, need } = logProgress(p, dg.id);
    const all = have + (this.extra?.preview ? counted.filter((x) => !p.collection[x]).length : 0);
    const k = counted.indexOf(id);
    const start = all - counted.length, before = start + Math.max(0, k);
    return { before, after: k < 0 ? before : before + 1, need, start, end: all };
  }
  /** the log's strip: its name, the count (ticking up when something arrived), a notched bar and its prize */
  private stripHtml(dungeon: string, before: number, after: number, need: number, news: string): string {
    const ach = logAchievement(dungeon), main = ach ? mainReward(ach) : null, dg = DUNGEONS[dungeon];
    const left = need - after;
    const sub = left > 0 ? `${left} to go${main ? ` for ${main.name.replace(/^The /, 'the ')}` : ''}` : 'Log complete';
    return `<span class="rv-strip"><span class="rs-lbl">${esc(dg?.name || '')} log<small>${esc(sub)}</small></span>
      <span class="rs-num">${after > before ? `<s>${before} →</s> ` : ''}${after} / ${need}</span>
      <span class="lb-bar${after >= need ? ' done' : ''}" style="--n: ${Math.max(1, need)}"><i style="width: ${((after / Math.max(1, need)) * 100).toFixed(1)}%"></i></span>
      ${main ? `<span class="rs-pz" aria-hidden="true">${tile(main.icon)}</span>` : ''}${news ? `<span class="rs-new">${news}</span>` : ''}</span>`;
  }
  private momentDone: (() => void) | null = null;
  private closeMoment(): void { if (this.momentDone) this.momentDone(); }
  /** where a moment is in this chest's brags (-1: it isn't one) */
  private bragAt(kind: BragKind, id: string): number { return this.brags.findIndex((b) => b.kind === kind && b.id === id); }
  private shareBtn(i: number): string {
    return i < 0 ? '' : `<button type="button" class="btn gold small bm-share" data-act="share" data-brag="${i}">${GLYPH.share}Share</button>`;
  }

  /** the numbers, the trait offer, the achievements, the buttons */
  private after(): void {
    const loot = this.loot!, extra = this.extra!, p = this.app.p;
    const dg = DUNGEONS[loot.dungeon] || BARROW;
    const { have: got, need: all } = logProgress(p, dg.id);
    const kc = Object.entries(loot.kc);
    const h = heroById(p, extra.hero);
    // a strip for each log this chest added to: the run's own always, and on Heroic the normal one when it grew
    const strips = this.logs().map((l, i) => { const fresh = this.cards.filter((d) => d.source === 'table' && d.isNew && l.collection.includes(d.id)); return i === 0 || fresh.length ? this.logStrip(l, fresh) : ''; }).join('');
    const sum = $('rv-sum', this.root);
    sum.hidden = !!extra.intro;
    if (!extra.intro) {
      sum.innerHTML = `<h3>This run</h3><div class="rv-grid">
          <div class="kv"><span>Time</span><b>${fmtT(loot.time)}</b><small>${loot.newPb ? 'New best!' : loot.firstClear ? 'First clear!' : `Best ${fmtT(loot.pb)}`}</small></div>
          ${kc.map(([b, n]) => `<div class="kv"><span>${esc(dg.bosses.find((x) => x.id === b)?.name || b)}</span><b>KC ${fmtN(n)}</b></div>`).join('')}
          <div class="kv"><span>Party deaths</span><b>${extra.deaths}</b></div>
          ${gardenKv(p, loot)}
        </div>${xpStrip(p, loot, extra)}${strips}`;
    }
    const best = this.brags[0], brag = $('rv-brag', this.root);
    if (best) {
      brag.hidden = false;
      brag.innerHTML = `<div class="rb-tx"><small>Worth showing off</small><b>${esc(cardWords(best).title)}</b>${this.brags.length > 1 ? `<span>and ${this.brags.length - 1} more</span>` : ''}</div>
        <button type="button" class="btn gold" data-act="share" data-brag="0">${GLYPH.share}Share</button>`;
    }
    this.renderOffer();
    if (extra.intro) {
      const el = $('rv-log', this.root);
      const ach = ACHIEVEMENTS['barrow.log'];
      el.hidden = false;
      el.innerHTML = `<h3>Collection Log · ${got} / ${all}</h3>
        <p class="fine"><b>${extra.preview ? 'Cards above are examples.' : 'The gear is yours. The uniques are examples.'}</b> Fill all ${all} slots to unlock (the rarest are a bonus):</p>
        ${this.stripHtml(dg.id, got, got, all, '')}
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
    this.renderAch();
    // new gear waits for you: the Gear button says how much
    const up = h && !extra.preview ? waiting(p, h).length : 0;
    const gb = this.root.querySelector<HTMLElement>('#rv-actions [data-act="gear"]');
    if (gb && up) { gb.classList.add('gold', 'has-up'); gb.innerHTML = `Gear<i class="badge" aria-hidden="true">${up}</i>`; }
    $('rv-actions', this.root).hidden = false;
    (this.root.querySelector('#rv-actions .btn') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  /** a log's strip in the summary: the count ticking up by what this chest added, what it was, and a tap
   *  through to the log, on the set of the newest piece */
  private logStrip(l: DungeonInfo, fresh: Drop[]): string {
    const dungeon = l.id, last = fresh[fresh.length - 1], { start, end, need } = this.logTick('', l);
    const stand = last && standsOf(dungeon).find((s) => standPieces(s).includes(last.id));
    const done = !!stand && standPieces(stand).every((id) => id === last!.id || !!this.app.p.collection[id]);
    const news = fresh.length ? `+${fresh.length} new: <b>${fresh.map((d) => esc(nameOf(d.id))).join(', ')}</b>${done ? ' · set done' : ''}` : '';
    return `<button type="button" class="rv-logstrip" data-act="tolog" data-id="${esc(stand ? `${dungeon}.set.${stand.set.id}` : `${dungeon}.log`)}" aria-label="Open the collection log">${this.stripHtml(dungeon, start, end, need, news)}</button>`;
  }
  /** every achievement this run earned: what you did, what you got and where it went, Wear it for a title, and
   *  a tap for its card. The preview's are shown as earned, though nothing is added. */
  private renderAch(): void {
    const ids = (this.extra?.unlocked || []).filter((id) => ACHIEVEMENTS[id]), el = $('rv-ach', this.root);
    if (!ids.length || !el) return;
    el.hidden = false;
    // each row opens its card; one worth showing off has a Share button too (share.ts)
    const row = (id: string): string => {
      const html = achRow(this.app.p, ACHIEVEMENTS[id], true), i = this.bragAt(ACHIEVEMENTS[id].log ? 'log' : 'ach', id);
      return i < 0 ? html : html.replace(/<\/div><\/article>$/, `<button type="button" class="btn small ac-share" data-act="share" data-brag="${i}">${GLYPH.share}Share</button></div></article>`);
    };
    el.innerHTML = `<h3>Achievements<small>${ids.length} this run · tap one for more</small></h3><div class="ac-list">${ids.map(row).join('')}</div>`;
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
      { id: `${set}.helm`, source: 'table', boss: 'knight', rate: dropOf(BARROW, `${set}.helm`).rate, kc: 1, role, isNew: false, dupe: false, marks: 0 },
      { id: 'trophy.rattlebones_plume', source: 'table', boss: 'knight', rate: 1 / 50, kc: 1, role, isNew: false, dupe: false, marks: 0 },
    ];
    const t = Math.max(12, Math.round(time));
    const loot: RunLoot = { dungeon: 'barrow', role, hero: h?.id || '', drops, tell: 'unique', kc: {}, marks: 0, clears: 0, time: t, pb: t, newPb: false, firstClear: false };
    this.app.show('reveal');
    this.show(loot, { unlocked: [], hero: h?.id || null, role, deaths: 0, again: null, preview: !first || !h, intro: true });
  }

  /** the reveal with made-up loot, for testing the look. Touches nothing in the save. It's the chest of `dungeon`
   *  (the one picked on the Dungeons sheet): 'log' plays a run that fills its whole collection log; 'kit' is its
   *  Heroic chest with a gilding kit. */
  preview(kind: Tell | 'log', dungeon = 'barrow'): void {
    const asked = DUNGEONS[dungeon], base = asked && !asked.heroicOf && standsOf(asked.id).length ? asked : BARROW;
    const tell: Tell = kind === 'log' ? 'unique' : kind, dgId = (tell === 'kit' && heroicVersion(base.id)?.id) || base.id;
    const p = this.app.p, h = activeHero(p), role: RoleId = h ? roleOf(h) : 'tank', gk = h ? gearKey(h) : role;
    const fin = base.finalBoss, mini = base.bosses.find((b) => b.id !== fin)?.id || fin;
    const kcF = (p.bosses[`${dgId}.${fin}`]?.kc || 0) + 1, kcM = (p.bosses[`${dgId}.${mini}`]?.kc || 0) + 1;
    const drops: Drop[] = [
      { id: gearId(gk, 'helm', 2), source: 'regular', role, slot: 'helm', rar: 2, prevRar: 1, isNew: true, dupe: false, marks: 0, toEquip: true },
      { id: 'xp.pages', source: 'xp', role, isNew: true, dupe: false, marks: 0, xp: 300, n: 3 },
    ];
    // your seat's set, the mini boss's trophy and the pet, from the dungeon's own log
    const stands = standsOf(base.id), rogue = h?.cls === 'rogue';
    const set = (stands.find((s) => s.set.role === role && (s.set.cls === 'rogue') === rogue) || stands[0]).set.id;
    const slotOf = (k: string): string | undefined => base.collection.find((id) => COLLECTIBLES[id]?.kind === k);
    const trophy = slotOf('trophy'), pet = slotOf('pet');
    if (tell === 'unique' || tell === 'pet') drops.push({ id: `${set}.helm`, source: 'table', boss: fin, rate: dropOf(base, `${set}.helm`).rate, kc: kcF, role, isNew: true, dupe: false, marks: 0, toEquip: true });
    if (tell === 'kit') drops.push({ id: gilded(`${set}.chest`), source: 'table', boss: fin, rate: KIT_RATE, kc: kcF, role, isNew: true, dupe: false, marks: 0 });
    if (tell === 'unique' && trophy) drops.push({ id: trophy, source: 'table', boss: mini, rate: dropOf(base, trophy).rate, kc: kcM, role, isNew: false, dupe: true, marks: 3 });
    if (tell === 'pet' && pet) drops.push({ id: pet, source: 'table', rate: dropOf(base, pet).rate, boss: fin, kc: kcF, role, isNew: true, dupe: false, marks: 0 });
    // made-up XP too: a run's kills, the clear and three pages
    const xp = { start: p.xp, kills: 640, chest: { clear: 400, pages: 3, pagesXp: 300, tomes: [], total: 700 }, end: p.xp + 1340 };
    const loot: RunLoot = { dungeon: dgId, role, hero: h?.id || '', drops, tell, gild: tell === 'kit', kc: { [mini]: kcM, [fin]: kcF }, marks: 1 + drops.reduce((a, d) => a + d.marks, 0), clears: (p.dungeons[dgId]?.clears || 0) + 1, time: 247, pb: p.dungeons[dgId]?.pb ?? 247, newPb: false, firstClear: false, xp };
    const log = logAchievement(base.id)?.id;
    this.app.show('reveal');
    this.show(loot, { unlocked: kind === 'log' && log ? [log] : [], hero: h?.id || null, role, deaths: 0, again: null, preview: true });
  }
}

function $(id: string, root: HTMLElement): HTMLElement { return root.querySelector('#' + id) as HTMLElement; }
/** the run's XP: what the kills, the clear and the chest paid, your level's bar (a level gained says so, with its
 *  talent points and the way to spend them) */
function xpStrip(p: Profile, loot: RunLoot, extra: RevealExtra): string {
  const x = loot.xp;
  if (!x || x.end <= x.start) return '';
  const a = levelProgress(x.start), b = levelProgress(x.end), up = b.level - a.level;
  const c = x.chest, parts = [`Kills +${fmtN(x.kills)}`, ...(c ? [`Clear +${fmtN(c.clear)}`, `Pages +${fmtN(c.pagesXp)}`, ...c.tomes.map((t) => `${TOME[t.id]?.name || 'Tome'} +${fmtN(t.xp)}`)] : [])];
  const pts = pointsAt(b.level) - pointsAt(a.level);
  const h = heroById(p, extra.hero) || activeHero(p), left = h ? unspent(p, h) : 0;
  return `<div class="rv-xp${up ? ' up' : ''}"><span class="rx-top"><b class="rx-lv">${up ? `Level ${a.level} → ${b.level}!` : `Level ${b.level}`}</b><b class="rx-n">+${fmtN(x.end - x.start)} XP</b></span>
    <span class="rx-bar" aria-hidden="true"><i style="width: ${(b.k * 100).toFixed(1)}%"></i></span>
    <small class="rx-parts">${esc(parts.join(' · '))}</small>
    ${up && !extra.preview ? `<span class="rx-up"><span>${pts > 0 ? `+${pts} talent point${pts === 1 ? '' : 's'}${left ? ` · <b>${left} to spend</b>` : ''} · ` : ''}<span class="rx-bonus">Your party <b>${bonusText(b.level)}</b></span></span>${left ? '<button type="button" class="btn small gold" data-act="talents">Talents</button>' : ''}</span>` : ''}</div>`;
}
/** the garden after this run: seeds the bosses dropped, and beds this clear made ready */
function gardenKv(p: Profile, loot: RunLoot): string {
  const seeds = Object.entries(loot.seeds || {});
  const got = seeds.map(([id, n]) => `+${n} ${PLANTS[id]?.seed || id}`).join(', ');
  const ready = readyBeds(p);
  const note = loot.bedsReady ? `${loot.bedsReady} bed${loot.bedsReady > 1 ? 's' : ''} just got ready` : ready ? `${ready} bed${ready > 1 ? 's' : ''} ready` : `${seedTotal(p)} seed${seedTotal(p) === 1 ? '' : 's'} to plant`;
  return `<div class="kv"><span>Garden</span><b>${got ? esc(got) : 'No seed'}</b><small>${esc(note)}</small></div>`;
}
