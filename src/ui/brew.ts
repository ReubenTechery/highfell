/**
 * The cauldron at home. Pick a recipe, tip the ingredients in one at a time, then stir: steady
 * circles, not too fast, three times round. Every lap pays Brewing XP as you finish it. A Perfect
 * stir fills one more bottle. Once the stir starts the ingredients are in: leaving still bottles it.
 * Brews are small fun twists for one dungeon run each, never power a raid needs.
 */
import { INGREDIENTS, RECIPES, RECIPE_ORDER, SKILLS } from '../content/vale';
import type { RecipeDef } from '../content/types';
import { homeAchiever } from '../meta/achievements';
import { activeHero, roleOf } from '../meta/profile';
import { canBrew, finishBrew, ingredientName, lapXp, rankProgress, recipeUnlocked, skillRank, startBrew, type BrewDone, type BrewQuality, type BrewRun, type XpGain } from '../meta/vale';
import type { App } from './app';
import { actions, esc, fmtN, GLYPH, reducedMotion, wait } from './dom';
import { placeSprite, tile } from './art';
import { SFX } from './sound';
import { XpBar } from './xpbar';
import { achChips } from './achcard';

const K = '#1E1A1A';
const ink = (fill: string, w = 4) => `fill: ${fill}; stroke: ${K}; stroke-width: ${w}; stroke-linejoin: round; stroke-linecap: round`;
const S = (d: string, fill: string, w = 4, extra = '') => `<path d="${d}" style="${ink(fill, w)}"${extra}/>`;
const L = (d: string, col = K, w = 3, extra = '') => `<path d="${d}" style="fill: none; stroke: ${col}; stroke-width: ${w}; stroke-linecap: round; stroke-linejoin: round"${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, w = 4, extra = '') => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="${w ? ink(fill, w) : 'fill: ' + fill}"${extra}/>`;

/** the stir: how fast is right, in turns a second */
const BAND = [0.5, 1.4];
const MAX_TURNS = 2.2;
const LAPS = 3;
const POT = { x: 200, y: 318, rx: 132, ry: 26 };
const MURK = '#5E7A4A';

export class Brewing {
  private sel: string | null = null;
  private busy = false;
  private result: { done: BrewDone; unlocked: string[] } | null = null;

  constructor(private app: App, private root: HTMLElement) {
    actions(root, {
      back: () => { if (this.busy) return; SFX.play('ui'); app.showHearth(); },
      satchel: () => { SFX.play('ui'); app.sheets.open({ kind: 'satchel' }); },
      pick: (el) => { if (this.busy) return; this.sel = el.dataset.id!; SFX.play('ui'); this.render(); },
      brew: () => { void this.brewNow(); },
      again: () => { this.result = null; void this.brewNow(); },
      done: () => { SFX.play('ui'); this.result = null; this.render(); },
      drink: () => { const r = this.result; if (!r) return; this.app.p.vale.drink = r.done.recipe; SFX.play('clink'); this.app.save(); },
      garden: () => { SFX.play('ui'); app.showHearth('yard'); },
      ach: (el) => { SFX.play('ui'); app.openAchievement(el.dataset.id || ''); },
    });
  }

  open(): void {
    const p = this.app.p;
    this.result = null; this.busy = false;
    if (!this.sel || !RECIPES[this.sel]) this.sel = RECIPE_ORDER.find((id) => canBrew(p, id) > 0) || RECIPE_ORDER.find((id) => recipeUnlocked(p, id)) || RECIPE_ORDER[0];
    this.render();
  }
  update(): void { if (!this.busy) this.render(); }

  render(): void {
    const p = this.app.p;
    const r = RECIPES[this.sel || 'tonic'];
    const n = canBrew(p, r.id);
    const rank = skillRank(p, 'brew');
    const bottles = Object.values(p.vale.shelf).reduce((a, b) => a + b, 0);
    const any = Object.values(p.vale.satchel).some((v) => v > 0);
    const cards = RECIPE_ORDER.map((id) => this.card(RECIPES[id])).join('');
    const why = !recipeUnlocked(p, r.id) ? `Learn it at Brewing rank ${r.rank}.` : n < 1 ? 'Not enough in your satchel yet.' : `Enough for ${n} brew${n > 1 ? 's' : ''}.`;
    this.root.className = 'scene brew';
    this.root.innerHTML = `
      <div class="bw-top">
        <button type="button" class="btn small" data-act="back">${GLYPH.left}<span class="long">Hearth</span></button>
        <div class="vl-title"><h2>The cauldron</h2><p>Brewing ${rank} · ${bottles} bottle${bottles === 1 ? '' : 's'} on the shelf</p></div>
        <button type="button" class="btn small" data-act="satchel" aria-label="Satchel">${GLYPH.bag}<span class="long">Satchel</span></button>
      </div>
      <div class="bw-main">
        <div class="bw-art" aria-hidden="true"><span class="bw-glow" style="--c: ${r.color}"></span>${potArt(r.color)}</div>
        <div class="bw-list" role="radiogroup" aria-label="Recipes">${cards}</div>
      </div>
      <div class="bw-foot">
        <button type="button" class="btn gold big" data-act="brew" ${n > 0 ? '' : 'disabled'}>${GLYPH.pot}Brew ${esc(r.name)}</button>
        <p class="fine">${esc(why)}${!any ? ' Grow herbs in the garden: dungeons drop the seeds.' : ''}</p>
        ${!any ? `<button type="button" class="btn small" data-act="garden">${GLYPH.sign}Go to the garden</button>` : ''}
      </div>
      <div class="vl-cardwrap" id="bw-card" ${this.result ? '' : 'hidden'}>${this.result ? this.resultCard() : ''}</div>`;
    if (this.result) (this.root.querySelector('#bw-card .btn.gold') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private card(r: RecipeDef): string {
    const p = this.app.p;
    const open = recipeUnlocked(p, r.id), n = canBrew(p, r.id), on = r.id === this.sel;
    const needs = Object.entries(r.needs).map(([k, need]) => {
      const have = p.vale.satchel[k] || 0;
      return `<span class="need ${have >= need ? 'ok' : ''}"><span class="tile" aria-hidden="true">${tile(INGREDIENTS[k]?.icon || '')}</span>${need} <small>${esc(ingredientName(k))} (${have})</small></span>`;
    }).join('');
    return `<button type="button" class="rc ${open ? '' : 'locked'} ${n ? 'can' : ''}" role="radio" aria-checked="${on}" data-act="pick" data-id="${r.id}" style="--c: ${r.color}">
      <span class="tile" aria-hidden="true">${tile(r.icon)}</span>
      <span class="rc-tx"><b>${esc(r.name)}</b><span class="rc-desc">${esc(r.desc)}</span><span class="rc-needs">${needs}</span>
        <span class="rc-meta">Makes ${r.makes}${r.makes > 1 ? ' bottles' : ' bottle'} · ${p.vale.shelf[r.id] || 0} on the shelf</span></span>
      ${open ? '' : `<em class="rc-lock">Brewing ${r.rank}</em>`}</button>`;
  }

  /** the close-up, then the bottles */
  private async brewNow(): Promise<void> {
    const app = this.app, p = app.p;
    const r = this.sel ? RECIPES[this.sel] : null;
    if (!r || this.busy || canBrew(p, r.id) < 1) { SFX.play('nope'); return; }
    this.busy = true;
    const card = this.root.querySelector<HTMLElement>('#bw-card');
    if (card) { card.hidden = true; card.innerHTML = ''; }
    // the ingredients go in when the stir starts, and every lap pays as it ends
    let run: BrewRun | null = null, ranked = 0;
    const q = await new Pot(this.root, r, p.vale.xp.brew || 0, {
      start: () => { run = startBrew(p, r.id); if (run) app.store.save(); return !!run; },
      lap: (lq) => { if (!run) return null; const g = lapXp(p, run, lq); app.store.save(); if (g.rankUp) ranked = g.rankUp.rank; return g; },
    }).play();
    if (!run) { this.busy = false; this.render(); return; }
    // left mid-stir: it still bottles, just not well
    const done = finishBrew(p, run, q || 'rough');
    const h = activeHero(p);
    const ach = homeAchiever(p, h ? roleOf(h) : 'tank');
    const unlocked = ach.check();
    if (!p.vale.drink || !(p.vale.shelf[p.vale.drink] > 0)) p.vale.drink = r.id;
    app.store.save();
    this.busy = false;
    this.result = { done, unlocked };
    this.render();
    if (done.rankUp || ranked) this.rankToast(done.rankUp?.rank || ranked);
    for (const id of unlocked) app.toasts.achievement(p, id);
  }
  /** a new Brewing rank: the toast says what it unlocked */
  private rankToast(rank: number): void {
    const note = rank === 2 ? 'You can brew Glowcap Draught' : rank === 3 ? 'You can brew Starlight Elixir' : '';
    this.app.toasts.rank(SKILLS.brew.name, rank, 's_brew', note);
  }

  private resultCard(): string {
    const p = this.app.p, res = this.result!;
    const r = RECIPES[res.done.recipe];
    const pr = rankProgress(p.vale.xp.brew || 0);
    const qWord: Record<BrewQuality, string> = { perfect: 'A perfect stir: one extra bottle', good: 'A good, steady stir', rough: 'A bit lumpy, but it’ll do' };
    const drinking = p.vale.drink === r.id;
    const more = canBrew(p, r.id);
    return `<section class="vc brewed" role="dialog" aria-label="What you brewed">
      <div class="vc-gain"><span class="tile" aria-hidden="true">${tile(r.icon)}</span><div><b>+${res.done.bottles} ${esc(r.name)}</b><span>${esc(qWord[res.done.quality])}</span></div></div>
      <p class="vc-say">${esc(r.desc)} One bottle is one dungeon run.</p>
      <div class="vc-xp"><span class="tile" aria-hidden="true">${tile('s_brew')}</span><div><span>Brewing <b>${pr.rank}</b>${pr.need ? ` · ${fmtN(pr.into)}/${fmtN(pr.need)}` : ' · max'}</span><div class="bar"><i style="width: ${(pr.k * 100).toFixed(1)}%"></i></div></div><b class="plus">+${res.done.xp}</b></div>
      ${achChips(p, res.unlocked)}
      <div class="vc-act">
        ${drinking ? `<span class="chip">Taking it on your next run</span>` : `<button type="button" class="btn" data-act="drink">Take it on my next run</button>`}
        ${more ? `<button type="button" class="btn" data-act="again">Brew again</button>` : ''}
        <button type="button" class="btn gold" data-act="done">Done</button></div></section>`;
  }
}

/* ---------------------------------------------------------------- the close-up */
interface Token { id: string; x: number; done: boolean }
/** start: the stir begins (the ingredients leave the satchel); lap: one lap is done, pay its XP */
interface PotHooks { start: () => boolean; lap: (q: BrewQuality) => XpGain | null }
class Pot {
  private el: HTMLDivElement;
  private svg!: SVGSVGElement;
  private tokens: Token[] = [];
  private phase: 'add' | 'stir' | 'bottle' = 'add';
  private total = 0;
  private dir = 1;
  private inBand = 0;
  private outBand = 0;
  private lapIn: number[] = [0, 0, 0];
  private lapAll: number[] = [0, 0, 0];
  private hist: { t: number; a: number }[] = [];
  private turns = 0;
  private last: { x: number; y: number; a: number } | null = null;
  private auto = 0;
  private keyHeld = false;
  /** "Stir for me" tops out at Good: a Perfect is for stirring yourself */
  private usedAuto = false;
  private raf = 0;
  private done = false;
  private stirSnd = 0;
  private resolve!: (q: BrewQuality | null) => void;
  private readonly quick = reducedMotion();
  private keyDown = (e: KeyboardEvent) => this.onKey(e, true);
  private keyUp = (e: KeyboardEvent) => this.onKey(e, false);
  private bar: XpBar;

  constructor(private host: HTMLElement, private r: RecipeDef, xp: number, private hooks: PotHooks) {
    this.el = document.createElement('div');
    this.el.className = 'toy pot';
    this.bar = new XpBar(this.el, 'brew', 's_brew', xp);
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', `Brewing ${r.name}`);
    let i = 0;
    const n = Object.values(r.needs).reduce((a, b) => a + b, 0);
    for (const [id, need] of Object.entries(r.needs)) for (let k = 0; k < need; k++, i++) this.tokens.push({ id, x: 200 + (i - (n - 1) / 2) * Math.min(62, 330 / n), done: false });
  }

  play(): Promise<BrewQuality | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.el.innerHTML = `
        <div class="toy-head"><div><b>${esc(this.r.name)}</b><em style="background: ${this.r.color}">Brewing</em></div><span class="toy-step" id="pot-step">Tip them in</span>
          <button type="button" class="icon-btn toy-x" aria-label="Stop brewing">${GLYPH.close}</button></div>
        <svg class="toy-stage" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${this.scene()}</svg>
        <p class="toy-hint" id="pot-hint">Tap each ingredient to tip it in.</p>
        <div class="stir-meter" id="pot-meter" hidden><span class="band" style="left: ${(BAND[0] / MAX_TURNS) * 100}%; width: ${((BAND[1] - BAND[0]) / MAX_TURNS) * 100}%"></span><i class="needle"></i><small class="lo">Slow</small><small class="hi">Too fast</small></div>
        <div class="pot-foot"><div class="toy-pips" aria-hidden="true"><i></i><i></i><i></i></div><button type="button" class="btn small" id="pot-auto" hidden>Stir for me</button></div>${this.bar.html()}`;
      this.host.appendChild(this.el);
      this.bar.bind();
      this.svg = this.el.querySelector<SVGSVGElement>('svg.toy-stage')!;
      this.el.querySelector('.toy-x')!.addEventListener('click', () => this.finish(null));
      this.el.querySelector('#pot-auto')!.addEventListener('click', () => { if (this.phase === 'stir' && !this.auto) { this.auto = performance.now(); this.usedAuto = true; SFX.play('ui'); } });
      this.svg.querySelectorAll<SVGGElement>('.tok').forEach((g) => g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.tip(+g.dataset.i!); }));
      this.svg.addEventListener('pointerdown', (e) => { if (this.phase !== 'stir') return; e.preventDefault(); try { this.svg.setPointerCapture(e.pointerId); } catch { /* fine */ } const p = this.pt(e); this.last = { ...p, a: this.angle(p) }; });
      this.svg.addEventListener('pointermove', (e) => { if (this.phase !== 'stir' || !this.last) return; this.stirTo(this.pt(e)); });
      const up = () => { this.last = null; };
      this.svg.addEventListener('pointerup', up);
      this.svg.addEventListener('pointercancel', up);
      window.addEventListener('keydown', this.keyDown);
      window.addEventListener('keyup', this.keyUp);
      let lastT = performance.now();
      const loop = (now: number) => {
        if (this.done) return;
        const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
        this.tick(dt, now);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
      (this.el.querySelector('.toy-x') as HTMLElement).focus({ preventScroll: true });
    });
  }

  private scene(): string {
    let o = `<defs><radialGradient id="potbg" cx="50%" cy="62%" r="75%"><stop offset="0" stop-color="#6A3E2A"/><stop offset="1" stop-color="#160E14"/></radialGradient>
      <clipPath id="liq"><ellipse cx="${POT.x}" cy="${POT.y}" rx="${POT.rx}" ry="${POT.ry}"/></clipPath></defs>`;
    o += `<rect x="-200" y="-200" width="800" height="960" style="fill: url(#potbg)"/>`;
    for (let y = 40; y < 420; y += 46) for (let x = (y / 46) % 2 ? -40 : 0; x < 420; x += 80) o += `<rect x="${x}" y="${y}" width="76" height="42" rx="6" style="fill: rgba(255, 255, 255, 0.025); stroke: rgba(0, 0, 0, 0.18); stroke-width: 2"/>`;
    o += S('M-40 560 V530 H440 V560 Z', '#3A2A2A', 4);
    // the fire under the pot
    o += `<g class="pot-fire">${S('M140 522 C140 490 164 478 168 452 C182 474 192 478 200 440 C208 476 220 480 230 454 C238 478 260 490 260 522 Z', '#FF8A4C', 3.5)}${S('M172 522 C172 502 188 492 200 470 C212 492 228 502 228 522 Z', '#FFE08A', 3)}</g>`;
    o += S('M112 518 L288 518 L280 532 L120 532 Z', '#6B4528', 3.5) + S('M128 506 L272 526 L266 536 L122 516 Z', '#8A5A34', 3);
    // the cauldron
    o += S('M98 452 L80 530 L112 530 Z', '#2A2A36', 3.5) + S('M302 452 L320 530 L288 530 Z', '#2A2A36', 3.5);
    o += S(`M64 ${POT.y} C52 410 116 476 200 476 C284 476 348 410 336 ${POT.y} Z`, '#3A3A4A', 5);
    o += L('M92 350 C96 400 120 436 150 452', 'rgba(255, 255, 255, 0.16)', 9);
    o += `<ellipse cx="${POT.x}" cy="${POT.y}" rx="150" ry="36" style="${ink('#4A4A5A', 5)}"/>`;
    o += `<ellipse class="liquid" cx="${POT.x}" cy="${POT.y + 2}" rx="${POT.rx}" ry="${POT.ry}" style="${ink(MURK, 3)}"/>`;
    o += `<g clip-path="url(#liq)"><g class="swirl" transform="translate(${POT.x} ${POT.y + 2}) scale(1 0.2)">${[46, 86, 120].map((rr, i) => L(`M${rr} 0 A${rr} ${rr} 0 0 1 ${-rr * 0.7} ${rr * 0.7}`, 'rgba(255, 255, 255, 0.35)', 10 - i * 2)).join('')}</g><g class="pops"></g></g>`;
    o += `<g class="ladle" style="display: none">${L('M0 0 L70 -150', K, 14)}${L('M0 0 L70 -150', '#C9925A', 8)}${S('M-14 4 C-14 -10 14 -10 14 4 C14 14 -14 14 -14 4 Z', '#C9925A', 3.5)}</g>`;
    o += `<g class="steam">${[150, 200, 250].map((x, i) => `<path class="st" style="animation-delay: ${i * 0.7}s" d="M${x} 280 C${x - 14} 250 ${x + 14} 230 ${x} 200" />`).join('')}</g>`;
    o += `<g class="bottles"></g><g class="fxl"></g>`;
    // the ingredients, waiting on the shelf
    o += S('M14 146 H386 L380 158 H20 Z', '#6B4528', 3.5);
    this.tokens.forEach((t, i) => { o += `<g class="tok" data-i="${i}" transform="translate(${t.x.toFixed(1)} 118)" style="cursor: pointer">${tokenArt(t.id)}<rect x="-30" y="-34" width="60" height="64" style="fill: transparent"/></g>`; });
    return o;
  }

  private pt(e: PointerEvent): { x: number; y: number } {
    const m = this.svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }
  private angle(p: { x: number; y: number }): number { return Math.atan2((p.y - (POT.y + 30)) * 1.6, p.x - POT.x); }

  /** an ingredient arcs into the pot */
  private async tip(i: number): Promise<void> {
    const t = this.tokens[i];
    if (!t || t.done || this.phase !== 'add') return;
    t.done = true;
    const g = this.svg.querySelector(`.tok[data-i="${i}"]`) as SVGGElement;
    const steps = this.quick ? 1 : 22;
    const tx = POT.x + (Math.random() * 60 - 30);
    for (let s = 1; s <= steps; s++) {
      const k = s / steps;
      g.setAttribute('transform', `translate(${(t.x + (tx - t.x) * k).toFixed(1)} ${(118 + (POT.y - 118) * k - Math.sin(k * Math.PI) * 70).toFixed(1)}) rotate(${(k * 240).toFixed(0)}) scale(${(1 - 0.5 * k).toFixed(2)})`);
      await wait(16);
    }
    g.remove();
    SFX.play('plop');
    this.splash(tx, POT.y);
    const n = this.tokens.filter((x) => x.done).length;
    (this.svg.querySelector('.liquid') as SVGElement).style.fill = mix(MURK, this.r.color, n / this.tokens.length);
    if (this.tokens.every((x) => x.done)) this.toStir();
  }
  private splash(x: number, y: number): void {
    const fx = this.svg.querySelector('.fxl')!;
    for (let i = 0; i < 7; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const a = -Math.PI * (0.15 + Math.random() * 0.7), d = 26 + Math.random() * 30;
      c.setAttribute('cx', String(x)); c.setAttribute('cy', String(y)); c.setAttribute('r', String(3 + Math.random() * 4));
      c.setAttribute('class', 'toy-spark');
      c.setAttribute('style', `fill: ${this.r.color}; stroke: ${K}; stroke-width: 2; --dx: ${(Math.cos(a) * d).toFixed(1)}px; --dy: ${(Math.sin(a) * d).toFixed(1)}px`);
      fx.appendChild(c);
      setTimeout(() => c.remove(), 700);
    }
  }
  private toStir(): void {
    if (!this.hooks.start()) { this.finish(null); return; }
    this.phase = 'stir';
    (this.svg.querySelector('.ladle') as SVGElement).style.display = '';
    this.el.querySelector<HTMLElement>('#pot-meter')!.hidden = false;
    this.el.querySelector<HTMLElement>('#pot-auto')!.hidden = false;
    this.el.querySelector('#pot-hint')!.textContent = 'Stir in circles round the pot. Steady: keep the needle in the green.';
    this.el.querySelector('#pot-step')!.textContent = `Lap 1 of ${LAPS}`;
    SFX.play('bubble');
  }

  /** the ladle moves to where your finger is, and the pot counts how far round it went */
  private stirTo(p: { x: number; y: number }): void {
    const last = this.last!;
    if (Math.hypot(p.x - POT.x, (p.y - POT.y - 30) * 1.6) < 26) { this.last = { ...p, a: last.a }; return; }
    const a = this.angle(p);
    let d = a - last.a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.last = { ...p, a };
    this.advance(d, performance.now());
  }
  private advance(d: number, now: number): void {
    if (!d) return;
    if (Math.abs(this.total) < 0.5) this.dir = d >= 0 ? 1 : -1;
    const turnsNow = this.speed(now);
    const amt = Math.abs(d);
    const lap = Math.min(LAPS - 1, Math.floor(this.turns));
    const ok = turnsNow >= BAND[0] && turnsNow <= BAND[1];
    if (ok) { this.inBand += amt; this.lapIn[lap] += amt; } else this.outBand += amt;
    this.lapAll[lap] += amt;
    this.total += d;
    this.turns += amt / (Math.PI * 2);
    this.hist.push({ t: now, a: this.turns });
    if ((this.stirSnd += amt) > 0.9) { this.stirSnd = 0; SFX.play('stir'); if (Math.random() < 0.4) SFX.play('bubble'); }
    const newLap = Math.min(LAPS, Math.floor(this.turns));
    if (newLap > lap) {
      const k = this.lapIn[lap] / Math.max(0.001, this.lapAll[lap]);
      // "Stir for me" laps are never better than Good
      const lq: BrewQuality = k >= 0.7 && !this.usedAuto ? 'perfect' : k >= 0.4 ? 'good' : 'rough';
      const pip = this.el.querySelectorAll('.toy-pips i')[lap];
      if (pip) pip.className = lq;
      if (lq === 'perfect') SFX.play('twinkle', 0.6);
      if (newLap < LAPS) this.el.querySelector('#pot-step')!.textContent = `Lap ${newLap + 1} of ${LAPS}`;
      const g = this.hooks.lap(lq);
      if (g) { this.floatXp(g.xp); setTimeout(() => this.bar.gain(g), this.quick ? 0 : 240); }
    }
    if (this.turns >= LAPS) void this.bottle();
  }
  /** turns a second over the last fifth of a second */
  private speed(now: number): number {
    while (this.hist.length && now - this.hist[0].t > 200) this.hist.shift();
    if (this.hist.length < 2) return this.auto || this.keyHeld ? (BAND[0] + BAND[1]) / 2 : 0;
    const a = this.hist[0], b = this.hist[this.hist.length - 1];
    return (b.a - a.a) / Math.max(0.05, (now - a.t) / 1000);
  }

  private tick(dt: number, now: number): void {
    if (this.phase === 'stir') {
      if (this.auto || this.keyHeld) this.advance(this.dir * ((BAND[0] + BAND[1]) / 2) * Math.PI * 2 * dt, now);
      const sp = this.speed(now);
      const needle = this.el.querySelector<HTMLElement>('#pot-meter .needle');
      if (needle) { needle.style.left = `${Math.min(100, (sp / MAX_TURNS) * 100).toFixed(1)}%`; needle.classList.toggle('ok', sp >= BAND[0] && sp <= BAND[1]); needle.classList.toggle('fast', sp > BAND[1]); }
      const la = this.svg.querySelector('.ladle') as SVGGElement | null;
      const ang = this.total;
      if (la) la.setAttribute('transform', `translate(${(POT.x + Math.cos(ang) * 78).toFixed(1)} ${(POT.y + 4 + Math.sin(ang) * 14).toFixed(1)})`);
      const sw = this.svg.querySelector('.swirl') as SVGGElement | null;
      if (sw) sw.setAttribute('transform', `translate(${POT.x} ${POT.y + 2}) scale(1 0.2) rotate(${((ang * 180) / Math.PI).toFixed(1)})`);
    }
    // bubbles now and then
    if (Math.random() < dt * (this.phase === 'stir' ? 5 : 2)) {
      const pops = this.svg.querySelector('.pops');
      if (pops) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', String(POT.x - 100 + Math.random() * 200)); c.setAttribute('cy', String(POT.y - 6 + Math.random() * 16)); c.setAttribute('r', String(4 + Math.random() * 6));
        c.setAttribute('class', 'pop'); c.setAttribute('style', `fill: ${mix(this.r.color, '#FFFFFF', 0.35)}; stroke: ${K}; stroke-width: 2`);
        pops.appendChild(c); setTimeout(() => c.remove(), 900);
      }
    }
  }

  /** +XP rising off the pot */
  private floatXp(n: number): void {
    const fx = this.svg.querySelector('.fxl');
    if (!fx) return;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(POT.x + 110)); t.setAttribute('y', String(POT.y - 40));
    t.setAttribute('class', 'toy-word xp');
    t.setAttribute('style', 'fill: #9BE15D; font-size: 22px');
    t.textContent = `+${n} XP`;
    fx.appendChild(t);
    setTimeout(() => t.remove(), 1100);
  }

  private async bottle(): Promise<void> {
    if (this.phase === 'bottle') return;
    this.phase = 'bottle';
    this.auto = 0; this.keyHeld = false;
    const frac = this.inBand / Math.max(0.001, this.inBand + this.outBand);
    let q: BrewQuality = frac >= 0.7 ? 'perfect' : frac >= 0.4 ? 'good' : 'rough';
    if (this.usedAuto) q = 'good';
    this.el.querySelector<HTMLElement>('#pot-meter')!.hidden = true;
    this.el.querySelector<HTMLElement>('#pot-auto')!.hidden = true;
    (this.svg.querySelector('.ladle') as SVGElement).style.display = 'none';
    this.el.querySelector('#pot-step')!.textContent = q === 'perfect' ? 'Perfect!' : q === 'good' ? 'Good' : 'Rough';
    this.el.querySelector('#pot-hint')!.textContent = q === 'perfect' ? 'Perfect stir. One extra bottle.' : 'Bottling…';
    SFX.play(q === 'perfect' ? 'perfect' : 'bubble');
    const liq = this.svg.querySelector('.liquid') as SVGElement;
    liq.style.fill = this.r.color;
    this.el.classList.add('glowing');
    const n = this.r.makes + (q === 'perfect' ? 1 : 0);
    const shelf = this.svg.querySelector('.bottles')!;
    for (let i = 0; i < n; i++) {
      await wait(this.quick ? 60 : 380);
      const x = 200 + (i - (n - 1) / 2) * 70;
      shelf.insertAdjacentHTML('beforeend', `<g transform="translate(${x} 236)"><g class="bottle-in">${bottleArt(this.r.color)}</g></g>`);
      SFX.play('clink');
    }
    await wait(this.quick ? 150 : 900);
    this.finish(q);
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    if (e.key === 'Escape' && down) { e.preventDefault(); this.finish(null); return; }
    if (this.phase === 'add' && down && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); const i = this.tokens.findIndex((t) => !t.done); if (i >= 0) void this.tip(i); return; }
    if (this.phase === 'stir' && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); this.keyHeld = down; }
  }

  private finish(q: BrewQuality | null): void {
    if (this.done) return;
    this.done = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    this.el.classList.add('out');
    setTimeout(() => this.el.remove(), 220);
    this.resolve(q);
  }
}

/* ---------------------------------------------------------------- pieces */
/** the cauldron on the pick screen: the sprite, steaming in the recipe's colour */
function potArt(col: string): string {
  return `<svg viewBox="-110 -180 220 200" aria-hidden="true">${placeSprite('cauldron', 0, 0, { k: 1.2 })}
    <ellipse cx="0" cy="-89" rx="62" ry="10" style="fill: ${col}; opacity: 0.7"/>
    <g class="steam">${[-30, 0, 30].map((x, i) => `<path class="st" style="animation-delay: ${i * 0.6}s" d="M${x} -104 C${x - 12} -122 ${x + 12} -134 ${x} -156"/>`).join('')}</g></svg>`;
}
function bottleArt(col: string): string {
  return S('M-8 -54 H8 V-40 C22 -34 26 -22 26 -8 C26 10 14 18 0 18 C-14 18 -26 10 -26 -8 C-26 -22 -22 -34 -8 -40 Z', '#E8F4FF', 3.5)
    + S('M-21 -6 C-21 8 -12 13 0 13 C12 13 21 8 21 -6 Z', col, 0) + L('M-21 -6 C-10 -2 10 -2 21 -6', K, 2.5)
    + S('M-10 -64 H10 V-54 H-10 Z', '#B8865A', 3) + L('M-14 -26 C-17 -18 -17 -10 -14 -4', 'rgba(255, 255, 255, 0.7)', 3);
}
/** an ingredient on the shelf, drawn to tip in */
function tokenArt(id: string): string {
  switch (id) {
    case 'moonpetal': {
      let o = '';
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; o += `<ellipse cx="0" cy="0" rx="8" ry="15" transform="translate(${(Math.sin(a) * 13).toFixed(1)} ${(-Math.cos(a) * 13).toFixed(1)}) rotate(${(k * 60).toFixed(0)})" style="${ink('#EAF2FF', 3)}"/>`; }
      return o + C(0, 0, 8, '#F2C230', 3);
    }
    case 'glowcap': return S('M-6 18 C-7 8 -6 0 -4 -4 H4 C6 0 7 8 6 18 Z', '#F0E8D2', 3) + S('M-24 -4 C-24 -28 24 -28 24 -4 C14 0 -14 0 -24 -4 Z', '#9BE15D', 3.5) + C(-9, -15, 3.5, '#E9FFD9', 0) + C(7, -19, 4, '#E9FFD9', 0);
    case 'brambleberry': return C(-9, 2, 10, '#4A2A5A', 3) + C(9, 3, 10, '#4A2A5A', 3) + C(0, -11, 10, '#4A2A5A', 3) + C(-3, -14, 3, '#8A5AA8', 0) + S('M2 -20 C10 -30 20 -28 22 -22 C14 -18 8 -18 2 -20 Z', '#7DBE5C', 2.5);
    default: return S('M0 -24 C10 -10 16 -2 16 6 C16 16 8 22 0 22 C-8 22 -16 16 -16 6 C-16 -2 -10 -10 0 -24 Z', '#8FD6FF', 3.5) + L('M-7 4 C-7 10 -4 14 0 15', '#FFFFFF', 3);
  }
}
function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
