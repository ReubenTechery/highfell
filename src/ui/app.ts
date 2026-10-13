/**
 * The app: one save, three scenes (the hearth, a run, the reveal) and sheets that slide over them
 * (the dungeon picker, gear, logs, settings). Every change to the profile goes through `save()`, which
 * writes it and redraws whatever is on screen.
 */
import { GAME_NAME } from '../content';
import { Store } from '../core/store';
import { loadArt } from '../dungeon/art.js';
import { setHooks } from '../dungeon/state.js';
import { VIEW, resizeView } from '../dungeon/render.js';
import type { RunLoot } from '../meta/loot';
import { $, GLYPH } from './dom';
import { SFX } from './sound';
import { Toasts } from './toasts';
import { Hearth } from './hearth';
import { Sheets, type SheetSpec } from './sheets';
import { RunScene, type RunOpts } from './run';
import { Reveal, type RevealExtra } from './reveal';

export type SceneId = 'hearth' | 'run' | 'reveal';

/** Testing switches that live on this device only, never in the save. */
export interface Dev { walkout: 'off' | 'normal' | 'unique' | 'pet' }
const DEV_KEY = 'highfell.dev';

export class App {
  readonly store = new Store();
  readonly toasts: Toasts;
  readonly hearth: Hearth;
  readonly sheets: Sheets;
  readonly run: RunScene;
  readonly reveal: Reveal;
  scene: SceneId = 'hearth';
  touch = false;
  dev: Dev = { walkout: 'off' };
  private last = 0;

  constructor(readonly root: HTMLElement) {
    root.innerHTML = SHELL;
    this.toasts = new Toasts($('toasts'));
    this.hearth = new Hearth(this, $('sc-hearth'));
    this.sheets = new Sheets(this, $('sheets'));
    this.run = new RunScene(this, $('sc-run'));
    this.reveal = new Reveal(this, $('sc-reveal'));
    try { this.dev = { ...this.dev, ...JSON.parse(localStorage.getItem(DEV_KEY) || '{}') }; } catch { /* defaults */ }
  }

  get p() { return this.store.profile; }

  /** what an update of the page should carry over: the open panel. A run in progress cannot be carried. */
  snapshot(): { sheet: SheetSpec | null } { return { sheet: this.scene === 'hearth' ? this.sheets.spec : null }; }

  async boot(carry: { sheet?: SheetSpec | null } = {}): Promise<void> {
    this.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    this.root.classList.toggle('touchy', this.touch);
    SFX.on = this.p.settings.sound;
    setHooks({ sound: (n: string, v?: number) => SFX.play(n, v) });
    VIEW.cv = $<HTMLCanvasElement>('cv'); VIEW.ctx = VIEW.cv.getContext('2d');
    await loadArt();
    if (document.fonts && document.fonts.load) document.fonts.load('24px "Lilita One"').catch(() => {});
    let rz = 0;
    window.addEventListener('resize', () => { clearTimeout(rz); rz = window.setTimeout(() => this.onResize(), 80); });
    const kick = () => SFX.unlock();
    window.addEventListener('pointerdown', kick, { capture: true });
    window.addEventListener('keydown', kick, { capture: true });
    this.store.onChange((why) => {
      if (why === 'remote') { SFX.on = this.p.settings.sound; this.refresh(); }
      else this.hearth.syncState();
    });
    this.show('hearth');
    if (carry.sheet) this.sheets.open(carry.sheet);
    $('loading').hidden = true;
    void this.store.connect();
    requestAnimationFrame((t) => this.frame(t));
  }

  private onResize(): void {
    if (this.scene === 'run') resizeView();
    this.hearth.layout();
  }

  private frame(ts: number): void {
    requestAnimationFrame((t) => this.frame(t));
    const now = ts / 1000;
    let dt = this.last ? now - this.last : 1 / 60;
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    if (this.scene === 'run') this.run.frame(dt);
  }

  show(id: SceneId): void {
    this.scene = id;
    for (const s of ['hearth', 'run', 'reveal'] as SceneId[]) $('sc-' + s).hidden = s !== id;
    if (id === 'hearth') { this.hearth.render(); }
    if (id === 'run') resizeView();
  }

  /** Write the save and redraw what is showing. */
  save(): void {
    this.store.save();
    this.refresh();
  }
  refresh(): void {
    if (this.scene === 'hearth') this.hearth.render();
    this.sheets.refresh();
  }

  setDev(d: Partial<Dev>): void {
    this.dev = { ...this.dev, ...d };
    try { localStorage.setItem(DEV_KEY, JSON.stringify(this.dev)); } catch { /* fine */ }
  }

  startRun(o: RunOpts): void {
    this.sheets.close();
    this.show('run');
    this.run.start(o);
  }
  /** A run ended at the chest: show what it gave. */
  showReveal(loot: RunLoot, extra: RevealExtra): void {
    this.show('reveal');
    this.reveal.show(loot, extra);
  }
  home(): void {
    this.run.stop();
    this.sheets.close();
    this.show('hearth');
  }
}

const SHELL = `
<div class="scene hearth" id="sc-hearth"></div>
<div class="scene run" id="sc-run" hidden>
  <canvas id="cv" aria-label="The dungeon"></canvas>
  <div class="touch" id="touch"></div>
  <div class="hud" id="hud">
    <div class="hud-top">
      <ol class="frames" id="frames" aria-label="Your party"></ol>
      <div class="menu"><button type="button" class="icon-btn" id="pause-btn" aria-label="Pause">${GLYPH.pause}</button></div>
      <div class="bossbar glass" id="bossbar" hidden>
        <div class="bb-row"><span class="bb-name" id="bb-name">Boss</span><span class="bb-phase" id="bb-phase"></span></div>
        <div class="bar"><i class="trail" id="bb-trail"></i><i id="bb-fill"></i><span id="bb-pct">100%</span></div>
        <div class="bb-sub" id="bb-sub"></div>
      </div>
    </div>
    <span class="chip dark practice-tag" id="practice-tag" hidden>Practice: no loot</span>
    <div class="banner" id="banner"></div>
    <div class="call" id="call"></div>
    <div class="hint glass" id="hint" hidden></div>
    <div class="stick" id="stick" hidden><i></i></div>
    <div class="stick-zone">Move here</div>
    <div class="controls" id="controls">
      <div class="pad" id="pad" hidden></div>
      <div class="abar" id="abar"></div>
    </div>
    <button type="button" class="cutbtn" id="cutbtn" hidden>Cut the chain</button>
  </div>
  <div class="hurt" id="hurt"></div>
  <section class="overlay" id="ov-msg" hidden>
    <div class="card">
      <p class="eyebrow" id="msg-eyebrow"></p>
      <h2 id="msg-title"></h2>
      <p class="lede" id="msg-text"></p>
      <div class="actions" id="msg-actions"></div>
    </div>
  </section>
</div>
<div class="scene reveal" id="sc-reveal" hidden></div>
<div id="sheets"></div>
<div class="toasts" id="toasts" aria-live="polite"></div>
<div class="loading" id="loading">Lighting the fire…</div>
<h1 class="sr">${GAME_NAME}</h1>`;
