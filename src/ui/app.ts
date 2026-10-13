/**
 * The app: one save, seven scenes (the hearth, the camp where your heroes wait, the hero maker, the
 * Vale you ride out to, the cauldron, a run and the reveal) and sheets that slide over them (the
 * dungeon picker, gear, logs, the satchel, settings). Every change to the profile goes through
 * `save()`, which writes it and redraws whatever is on screen. With no heroes yet, the game opens on
 * the hero maker.
 */
import { GAME_NAME } from '../content';
import { Store } from '../core/store';
import { loadArt } from '../dungeon/art.js';
import { setHooks } from '../dungeon/state.js';
import { VIEW, resizeView } from '../dungeon/render.js';
import type { RunLoot } from '../meta/loot';
import { activeHero } from '../meta/profile';
import { $, GLYPH } from './dom';
import { SFX } from './sound';
import { Toasts } from './toasts';
import { Hearth } from './hearth';
import { Sheets, normSpec } from './sheets';
import { RunScene, type RunOpts } from './run';
import { Reveal, type RevealExtra } from './reveal';
import { Camp } from './camp';
import { Creator } from './creator';
import { Vale } from './vale';
import { Brewing } from './brew';

export type SceneId = 'hearth' | 'camp' | 'create' | 'vale' | 'brew' | 'run' | 'reveal';
const SCENES: SceneId[] = ['hearth', 'camp', 'create', 'vale', 'brew', 'run', 'reveal'];
/** what an update of the page carries over */
export interface Carry { sheet?: unknown; scene?: SceneId }

/** Testing switches that live on this device only, never in the save. */
export interface Dev { walkout: 'off' | 'normal' | 'unique' | 'pet'; valeFree: boolean; valeLuck: boolean }
const DEV_KEY = 'highfell.dev';

export class App {
  readonly store = new Store();
  readonly toasts: Toasts;
  readonly hearth: Hearth;
  readonly sheets: Sheets;
  readonly run: RunScene;
  readonly reveal: Reveal;
  readonly camp: Camp;
  readonly creator: Creator;
  readonly vale: Vale;
  readonly brew: Brewing;
  scene: SceneId = 'hearth';
  touch = false;
  dev: Dev = { walkout: 'off', valeFree: false, valeLuck: false };
  private last = 0;

  constructor(readonly root: HTMLElement) {
    root.innerHTML = SHELL;
    this.toasts = new Toasts($('toasts'));
    this.hearth = new Hearth(this, $('sc-hearth'));
    this.sheets = new Sheets(this, $('sheets'));
    this.run = new RunScene(this, $('sc-run'));
    this.reveal = new Reveal(this, $('sc-reveal'));
    this.camp = new Camp(this, $('sc-camp'));
    this.creator = new Creator(this, $('sc-create'));
    this.vale = new Vale(this, $('sc-vale'));
    this.brew = new Brewing(this, $('sc-brew'));
    try { this.dev = { ...this.dev, ...JSON.parse(localStorage.getItem(DEV_KEY) || '{}') }; } catch { /* defaults */ }
  }

  get p() { return this.store.profile; }

  /** what an update of the page should carry over: the open panel and the camp. A run in progress cannot be carried. */
  snapshot(): Carry {
    const keep: SceneId[] = ['camp', 'vale', 'brew'];
    return { sheet: this.scene === 'hearth' || this.scene === 'camp' ? this.sheets.spec : null, scene: keep.includes(this.scene) ? this.scene : 'hearth' };
  }

  async boot(carry: Carry = {}): Promise<void> {
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
    if (carry.scene === 'camp') this.showCamp();
    else if (carry.scene === 'vale' && activeHero(this.p)) void this.showVale();
    else if (carry.scene === 'brew' && activeHero(this.p)) this.showBrew();
    else this.showHearth();
    const sheet = normSpec(carry.sheet);
    if (sheet && this.p.roster.length) this.sheets.open(sheet);
    $('loading').hidden = true;
    void this.store.connect();
    requestAnimationFrame((t) => this.frame(t));
  }

  private onResize(): void {
    if (this.scene === 'run') resizeView();
    if (this.scene === 'hearth') this.hearth.layout();
    if (this.scene === 'camp') this.camp.render();
    if (this.scene === 'vale') this.vale.layout();
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
    for (const s of SCENES) $('sc-' + s).hidden = s !== id;
    if (id === 'hearth') { this.hearth.render(); }
    if (id === 'run') resizeView();
  }
  /** home: your hero by the fire. With no heroes yet, the hero maker instead. */
  showHearth(): void {
    if (!activeHero(this.p)) { this.showCreate(); return; }
    this.sheets.close();
    this.show('hearth');
  }
  /** the camp, with every hero you have made */
  showCamp(sel?: string): void {
    if (!activeHero(this.p)) { this.showCreate(); return; }
    this.sheets.close();
    this.show('camp');
    this.camp.show(sel);
  }
  /** ride out: the map of the Vale */
  async showVale(): Promise<void> {
    if (!activeHero(this.p)) { this.showCreate(); return; }
    this.sheets.close();
    this.show('vale');
    await this.vale.enter();
  }
  /** the cauldron at home */
  showBrew(): void {
    if (!activeHero(this.p)) { this.showCreate(); return; }
    this.sheets.close();
    this.show('brew');
    this.brew.open();
  }
  /** the hero maker */
  showCreate(): void {
    this.sheets.close();
    this.show('create');
    this.creator.open(this.p.roster.length === 0);
  }

  /** Write the save and redraw what is showing. */
  save(): void {
    this.store.save();
    this.refresh();
  }
  refresh(): void {
    // the last hero went (a reset here or on another device): back to the maker
    if (!activeHero(this.p) && this.scene !== 'run' && this.scene !== 'create') { this.showCreate(); return; }
    if (this.scene === 'hearth') this.hearth.render();
    if (this.scene === 'camp') this.camp.render();
    if (this.scene === 'vale') this.vale.update();
    if (this.scene === 'brew') this.brew.update();
    // a hero made on another device while the maker was open on its first screen: offer the way back
    if (this.scene === 'create' && this.p.roster.length) this.creator.open(false);
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
    this.showHearth();
  }
}

const SHELL = `
<div class="scene hearth" id="sc-hearth"></div>
<div class="scene camp" id="sc-camp" hidden></div>
<div class="scene create" id="sc-create" hidden></div>
<div class="scene vale" id="sc-vale" hidden></div>
<div class="scene brew" id="sc-brew" hidden></div>
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
    <div class="run-tags"><span class="chip dark practice-tag" id="practice-tag" hidden>Practice: no loot</span><span class="chip dark brew-tag" id="brew-tag" hidden></span></div>
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
