/**
 * The garden: the planter beds in the house's yard. Tap a bed: an empty one takes a seed, a growing
 * one says how many dungeon clears it has to go, and a ready one opens its harvest close-up (toys.ts),
 * then a card with what it gave. The card and the close-up sit in a layer over the house. The rules
 * (planting, growing, what a harvest rolls) live in meta/vale.ts.
 */
import { ACHIEVEMENTS, COLLECTIBLES, DUNGEONS } from '../content';
import { GROW_CLEARS, INGREDIENTS, PLANTS, SEED_ICON, SEED_ORDER, SKILLS } from '../content/vale';
import { Achiever } from '../meta/achievements';
import { activeHero, roleOf, type Profile } from '../meta/profile';
import { bedPhase, beginHarvest, clearsLeft, cutXp, endHarvest, plant, rankProgress, type Harvest, type HarvestEnd, type ValeDrop } from '../meta/vale';
import type { App } from './app';
import { actions, esc, fmtN, fmtRate, GLYPH } from './dom';
import { iconOf, nameOf, spriteURL, tile } from './art';
import { SFX } from './sound';
import { playToy, type ToyResult } from './toys';

/** How a bed is drawn in the yard: the bed sprite, what grows on top, and the word under it. */
export interface BedLook { sprite: string; plant: string | null; label: string; ready: boolean }
const PLANT_SPRITE: Record<string, string> = { glowcap: 'node_glowcap', moonpetal: 'node_moonpetal', bramble: 'node_bramble' };
export function bedLook(p: Profile, i: number): BedLook {
  const b = p.vale.beds[i];
  if (!b || !b.seed) return { sprite: 'bed', plant: null, label: 'Plant a seed', ready: false };
  if (bedPhase(b) === 'ready') {
    const plantSprite = b.shimmer && b.seed === 'moonpetal' ? 'node_moonpetal_shim' : PLANT_SPRITE[b.seed] || null;
    return { sprite: 'bed', plant: plantSprite, label: b.shimmer ? 'Ready, shimmering!' : 'Ready!', ready: true };
  }
  const left = clearsLeft(b);
  return { sprite: b.grown >= GROW_CLEARS - 1 ? 'bed_grow' : 'bed_sprout', plant: null, label: `${left} clear${left === 1 ? '' : 's'} to go`, ready: false };
}

type Card =
  | { kind: 'bed'; bed: number }
  | { kind: 'harvest'; h: Harvest; end: HarvestEnd; res: ToyResult; unlocked: string[] };

export class Garden {
  private card: Card | null = null;
  private busy = false;
  private momentDone: (() => void) | null = null;
  private wrap: HTMLElement;

  constructor(private app: App, private root: HTMLElement) {
    this.wrap = document.createElement('div');
    this.wrap.className = 'vl-cardwrap';
    this.wrap.hidden = true;
    root.appendChild(this.wrap);
    actions(root, {
      gclose: () => { SFX.play('ui'); this.close(); },
      gplant: (el) => this.sow(Number(el.dataset.bed), el.dataset.seed || ''),
      gharvest: (el) => { void this.harvest(Number(el.dataset.bed)); },
      moment: () => this.momentDone?.(),
    });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.card && !this.busy) { e.preventDefault(); this.close(); } });
  }

  /** A bed was tapped in the yard: a ready one goes straight to its harvest, any other opens its card. */
  open(bed: number): void {
    const b = this.app.p.vale.beds[bed];
    if (this.busy || !b) return;
    if (bedPhase(b) === 'ready') { void this.harvest(bed); return; }
    this.card = { kind: 'bed', bed };
    this.render();
  }
  /** the save changed: redraw the open card */
  update(): void { if (this.card && !this.busy) this.render(); }

  private close(): void { this.card = null; this.render(); }

  private sow(bed: number, seed: string): void {
    const app = this.app;
    if (!plant(app.p, bed, seed, Math.random)) { SFX.play('nope'); return; }
    SFX.play('snip');
    app.toasts.text(`${PLANTS[seed].seed} planted`, `Ready after ${GROW_CLEARS} dungeon clears. It never wilts.`);
    this.card = null;
    app.save();
    this.render();
  }

  /* ---------------------------------------------------------------- harvesting */
  private async harvest(bed: number): Promise<void> {
    if (this.busy) return;
    const app = this.app, p = app.p, dev = app.dev;
    const h = beginHarvest(p, bed, Math.random, Date.now(), { free: dev.valeFree, luck: dev.valeLuck ? 50 : 1 });
    if (!h) { SFX.play('nope'); return; }
    app.store.save();
    this.busy = true; this.card = null; this.render();
    const pet = h.drops.find((d) => COLLECTIBLES[d.id]?.kind === 'pet')?.id || null;
    // every cut pays its XP the moment it lands
    let ranked = 0;
    const res = await playToy(this.root, { node: h.node, shimmer: h.shimmer, pet, xp: p.vale.xp.gather || 0, onGrade: (g) => { const x = cutXp(p, h, g); app.store.save(); if (x.rankUp) ranked = x.rankUp.rank; return x; } });
    const end = endHarvest(p, h, res.perfects);
    const ach = this.achiever();
    const fresh = [...h.drops.filter((d) => d.isNew).map((d) => d.id), ...(h.gift ? [h.gift] : [])];
    const unlocked = [...ach.check(), ...fresh.flatMap((id) => ach.collected(id))];
    for (const id of fresh) if (COLLECTIBLES[id]) app.hearth.fresh.add(id);
    app.save();
    if (h.gift) await this.moment(h.gift, 'Your first harvest', 'She wandered into the garden and ate a row of something. She’s staying.');
    for (const d of h.drops) if (d.isNew && ['pet', 'mount'].includes(COLLECTIBLES[d.id]?.kind)) await this.moment(d.id, `${fmtRate(d.rate)} · harvest ${fmtN(h.kc)}`, COLLECTIBLES[d.id].kind === 'pet' ? 'It followed you in. It’s by the fire.' : 'It’s waiting in the stall.');
    this.busy = false;
    this.card = { kind: 'harvest', h, end, res, unlocked };
    this.render();
    const rank = end.rankUp?.rank || ranked;
    if (rank) app.toasts.rank(SKILLS.gather.name, rank, 's_gather', [4, 7, 10].includes(rank) ? 'Every harvest gives one more' : '');
    for (const id of unlocked) app.toasts.achievement(id);
  }
  private achiever(): Achiever {
    const p = this.app.p, h = activeHero(p);
    return new Achiever(p, { dungeon: 'garden', role: h ? roleOf(h) : 'tank', practice: false, testGear: false });
  }

  /* ---------------------------------------------------------------- the card */
  private render(): void {
    const c = this.card;
    this.root.hidden = !c && !this.busy;
    this.wrap.hidden = !c;
    if (!c) { this.wrap.innerHTML = ''; return; }
    const body = c.kind === 'bed' ? this.bedCard(c.bed) : this.harvestCard(c);
    this.wrap.innerHTML = `<section class="vc ${c.kind}" role="dialog" aria-label="${c.kind === 'bed' ? 'A garden bed' : 'What you got'}"><button type="button" class="icon-btn vc-x" data-act="gclose" aria-label="Close">${GLYPH.close}</button>${body}</section>`;
    (this.wrap.querySelector('.vc-act .btn:not([disabled]), .picks .pick') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private bedCard(bed: number): string {
    const p = this.app.p, b = p.vale.beds[bed];
    if (!b) return '';
    if (!b.seed) {
      const have = SEED_ORDER.filter((id) => (p.vale.seeds[id] || 0) > 0);
      const picks = have.map((id) => `<button type="button" class="pick" data-act="gplant" data-bed="${bed}" data-seed="${id}"><span class="tile" aria-hidden="true">${tile(SEED_ICON[id])}</span><span><b>${esc(PLANTS[id].seed)} ×${p.vale.seeds[id]}</b><span>Grows ${esc(INGREDIENTS[PLANTS[id].gives]?.name || '')}</span></span></button>`).join('');
      return `<h3 class="vc-title">An empty bed</h3>
        <p class="vc-say">Plant a seed. It grows one step every dungeon clear and is ready after ${GROW_CLEARS}. It never wilts.</p>
        ${have.length ? `<div class="picks">${picks}</div>` : `<p class="vc-say">No seeds yet.</p><p class="fine">${seedSources()}</p>`}
        <div class="vc-act"><button type="button" class="btn" data-act="gclose">Later</button></div>`;
    }
    const node = PLANTS[b.seed], left = clearsLeft(b);
    const pips = Array.from({ length: GROW_CLEARS }, (_, i) => `<i class="${i < b.grown ? 'perfect' : 'rough'}"></i>`).join('');
    const now = this.app.dev.valeFree ? `<button type="button" class="btn gold" data-act="gharvest" data-bed="${bed}">${esc(node.verb)} now<small>testing</small></button>` : '';
    return `<div class="vc-gain"><span class="tile" aria-hidden="true">${tile(SEED_ICON[b.seed])}</span><div><b>${esc(node.name)}</b><span>${left} more dungeon clear${left === 1 ? '' : 's'} and it’s ready</span></div><span class="toy-pips" aria-hidden="true">${pips}</span></div>
      ${b.shimmer ? `<div class="vc-line"><span class="tile" aria-hidden="true">${tile('g_dew')}</span><span>It’s shimmering <em>Starlight Dew when you harvest it</em></span></div>` : ''}
      <p class="fine">Any dungeon clear counts, Normal or Heroic. Practice runs don’t.</p>
      <div class="vc-act">${now}<button type="button" class="btn ${now ? '' : 'gold'}" data-act="gclose">Done</button></div>`;
  }

  private harvestCard(c: Extract<Card, { kind: 'harvest' }>): string {
    const p = this.app.p, ing = INGREDIENTS[c.h.node.gives];
    const pr = rankProgress(p.vale.xp.gather || 0);
    const pips = [0, 1, 2].map((i) => `<i class="${i < c.res.perfects ? 'perfect' : i < c.res.perfects + c.res.goods ? 'good' : 'rough'}"></i>`).join('');
    const seed = c.h.node.id, again = (p.vale.seeds[seed] || 0) > 0 && !p.vale.beds[c.h.bed]?.seed;
    const gift = c.h.gift ? `<div class="vc-drop new"><span class="tile" aria-hidden="true">${iconOf(c.h.gift)}</span><div><b>${esc(nameOf(c.h.gift))} <i>New</i></b><span>Your first harvest</span><em>In the stall at home</em></div></div>` : '';
    return `<div class="vc-gain"><span class="tile" aria-hidden="true">${tile(ing?.icon || '')}</span><div><b>+${c.end.gained} ${esc(ing?.name || '')}</b><span>${c.end.perfects ? `${c.end.perfects} Perfect${c.end.perfects > 1 ? 's' : ''}, +${c.end.perfects} for steady hands` : 'No Perfects this time'}</span></div><span class="toy-pips" aria-hidden="true">${pips}</span></div>
      ${c.h.dew ? `<div class="vc-line"><span class="tile" aria-hidden="true">${tile('g_dew')}</span><span>+${c.h.dew} Starlight Dew <em>it was shimmering</em></span></div>` : ''}
      ${gift}
      ${dropsHtml(c.h.drops, `harvest ${fmtN(c.h.kc)}`)}
      ${xpRow(SKILLS.gather.name, 's_gather', pr, c.end.xp)}
      ${achHtml(c.unlocked)}
      <div class="vc-act">${again ? `<button type="button" class="btn gold" data-act="gplant" data-bed="${c.h.bed}" data-seed="${seed}">Plant another<small>${p.vale.seeds[seed]} left</small></button>` : ''}<button type="button" class="btn ${again ? '' : 'gold'}" data-act="gclose">Done</button></div>`;
  }

  /* ---------------------------------------------------------------- a big moment */
  /** a pet or a mount takes the whole screen until you tap */
  private moment(id: string, line: string, where: string): Promise<void> {
    const c = COLLECTIBLES[id];
    if (!c) return Promise.resolve();
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = `big-moment ${c.kind === 'mount' ? 'gold' : ''}`;
      el.setAttribute('data-act', 'moment');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', c.name);
      el.tabIndex = -1;
      el.innerHTML = `<span class="rays"></span><div class="bm"><img src="${spriteURL(c.sprite || '')}" alt="" class="${c.kind === 'mount' ? 'mount' : ''}"><h2>${esc(c.name)}</h2>
        <p>${esc(line)}</p><p>${esc(where)}</p><p style="opacity: 0.7">Tap to carry on</p></div>`;
      this.root.appendChild(el);
      SFX.play('petfound');
      el.focus({ preventScroll: true });
      this.momentDone = () => { el.remove(); this.momentDone = null; res(); };
    });
  }
}

/* ---------------------------------------------------------------- little pieces */
/** where seeds come from, in plain words, straight from the dungeons' seed lines */
function seedSources(): string {
  const lines = Object.values(DUNGEONS).flatMap((d) => (d.seeds || []).map((s) => `${d.name}: ${PLANTS[s.seed]?.seed || s.seed}, ${fmtRate(s.rate)} from ${d.bosses.find((b) => b.id === s.boss)?.name || s.boss}`));
  return esc(lines.join(' · '));
}
function dropsHtml(drops: ValeDrop[], kc: string): string {
  return drops.map((d) => {
    const c = COLLECTIBLES[d.id];
    const note = d.dupe ? 'Duplicate: +2 Starlight Dew' : c?.kind === 'pet' ? 'Waiting by the fire at home' : c?.kind === 'mount' ? 'In the stall at home' : c?.kind === 'banner' ? 'Hanging up at home' : 'On a shelf at home';
    return `<div class="vc-drop ${d.dupe ? 'dupe' : 'new'}"><span class="tile" aria-hidden="true">${iconOf(d.id)}</span><div><b>${esc(nameOf(d.id))}${d.dupe ? '' : ' <i>New</i>'}</b><span>${fmtRate(d.rate)} · ${esc(kc)}</span><em>${esc(note)}</em></div></div>`;
  }).join('');
}
function xpRow(name: string, icon: string, pr: { rank: number; into: number; need: number; k: number }, xp: number): string {
  return `<div class="vc-xp"><span class="tile" aria-hidden="true">${tile(icon)}</span><div><span>${esc(name)} <b>${pr.rank}</b>${pr.need ? ` · ${fmtN(pr.into)}/${fmtN(pr.need)}` : ' · max'}</span><div class="bar"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></div></div><b class="plus">+${xp}</b></div>`;
}
function achHtml(ids: string[]): string {
  return ids.length ? `<div class="vc-ach">${ids.map((id) => `<span class="chip">Achievement <b>${esc(ACHIEVEMENTS[id]?.name || id)}</b></span>`).join('')}</div>` : '';
}
