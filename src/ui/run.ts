/**
 * A run: the dungeon on the canvas, the HUD over it, and the glue to the meta layer. Kill counts and
 * drops are rolled the moment a boss dies; the last boss's drops decide what the lantern does; the
 * chest opening hands everything to the reveal.
 */
import { bus, type GameEvent } from '../core/events';
import { makeRng } from '../core/rng';
import { dist, clamp } from '../core/math';
import { COLLECTIBLES, SETS } from '../content';
import { BARROW } from '../content/barrow';
import { BARROW_HEROIC } from '../content/barrow/heroic';
import type { DungeonInfo } from '../content/types';
import { BARROW_ENGINE } from '../content/barrow/engine';
import { AB, MEND } from '../content/roles';
import type { Rar, RoleId } from '../content/types';
import { newGame, respawn, update } from '../dungeon/game.js';
import { S, setHooks } from '../dungeon/state.js';
import { banner } from '../dungeon/entities.js';
import { bestCluster, doDodge, heroBy, isFoe, mend, useAbility } from '../dungeon/heroes.js';
import { inHaz } from '../dungeon/bots.js';
import { render, resizeView, updateCam, VIEW } from '../dungeon/render.js';
import { roomIndexOf } from '../dungeon/world.js';
import { lootGlint, startWalkout } from '../dungeon/walkout.js';
import { Achiever } from '../meta/achievements';
import { loadoutFor, partyRar, plainLoadout, worn } from '../meta/gear';
import { countBossWipe, countRunStart, resolveClear, resolveKill, runLoot, tellOf, type ClearLoot, type KillLoot } from '../meta/loot';
import { activeHero, finishIntroRun, heroById, roleOf, type Hero } from '../meta/profile';
import { heroArt } from '../content/folk';
import { RECIPES } from '../content/vale';
import { drinkForRun } from '../meta/vale';
import type { App } from './app';
import { $, esc, flash, fmtT } from './dom';
import { nameOf, tile } from './art';
import { IN, aimPoint, bindInput, mashCage, playerIntent, resetInput, type InputUI } from './input';
import { SFX } from './sound';

/** A run plays the hero you are playing. `role` is for testing: it picks one of your heroes in that seat,
 *  and if you have none the run is practice in plain gear. `heroic` plays the heroic Barrow: harder, its
 *  own kill counts and its gilded drops. */
export interface RunOpts { start: string; testRar: Rar | null; role?: RoleId; heroic?: boolean }
const STEP = 1 / 60;
const KEY: Record<string, string> = { a1: '1', a2: '2', a3: '3', a4: '4', dodge: 'Space' };
const ROLE_ICON: Record<string, string> = { tank: 'shield', healer: 'mend', dps: 'blizzard' };
const HINTS: Record<string, [string, string, string, number?]> = {
  move: ['Drag on the left side of the screen to move.', 'WASD or the arrow keys to move.', 'Move', 8],
  introMove: ['Drag on the left to walk up into the skeletons.', 'Use WASD or the arrow keys to walk up into the skeletons.', 'Walk into the pack', 12],
  introChest: ['The lantern flared gold and the chest knocked twice: a unique is inside! Walk to the chest to open it.', 'The lantern flared gold and the chest knocked twice: a unique is inside! Walk to the chest to open it.', 'The walkout', 8],
  dodge: ['Swipe anywhere to dodge-roll out of the red.', 'Space to dodge-roll out of the red.', 'Dodge', 6],
  block: ['Hold the shield button. Block right before it lands to stun him and hit back.', 'Hold 2 to block. Block right before it lands to stun him and hit back.', 'Block it', 6],
  slam: ['Slam grabs everything near you. Use it when mobs run at your mates.', 'Slam (1) grabs everything near you. Use it when mobs run at your mates.', 'Slam', 6],
  heal: ['Tap a name, or tap a hero, to heal them. Smite when everyone is fine.', 'Click a name, or press Z, X or C, to heal. Smite (4) when everyone is fine.', 'Heal', 7],
  aim: ['Drag Blizzard to aim it. A quick tap aims it for you.', 'Blizzard (1) lands where your mouse is.', 'Aim', 6],
  shatter: ['Frozen? Icicle (4) and Comet hit frozen mobs much harder.', 'Frozen? Icicle (4) and Comet hit frozen mobs much harder.', 'Shatter', 6],
  kick: ['He is casting. Hit him hard, Charge him or Rime burst him to stop it.', 'He is casting. Hit him hard, Charge him or Rime burst him to stop it.', 'Interrupt', 6],
  wisp: ['Swipe through the wisps before they reach anyone.', 'Click and drag through the wisps before they reach anyone.', 'Wisps', 6],
  chain: ['Swipe across the chain to cut it.', 'Drag the mouse across the chain to cut it.', 'Chain', 6],
  cage: ['The tank is caged and the boss is loose. Tap the cage to break him out.', 'The tank is caged and the boss is loose. Click the cage to break him out.', 'Cage', 7],
  cageSelf: ['Tap fast to break out, then Slam him back!', 'Mash Space to break out, then Slam him back!', 'Caged', 5],
  wild: ['Mobs that aren’t on the tank go wild after a few seconds. Tanks, grab them.', 'Mobs that aren’t on the tank go wild after a few seconds. Tanks, grab them.', 'Wild', 7],
  pulled: ['You pulled one off the tank. Let the tank hit first, then go.', 'You pulled one off the tank. Let the tank hit first, then go.', 'Aggro', 6],
  rings: ['Dodge-roll through the rings as they reach you.', 'Space through the rings as they reach you.', 'Rings', 6],
};

interface TutStep { slot: string; eyebrow: string; title: string; touch: string; desk: string; btn: string }
const TUT_STEPS: Record<string, TutStep> = {
  introAb: {
    slot: 'a4',
    eyebrow: 'Step 1 of 5',
    title: 'Smash Cleave!',
    touch: 'You swing on your own in range. Tap the glowing Cleave button to hit the whole pack!',
    desk: 'You swing on your own in range. Press the glowing Cleave button (or 4) to hit the whole pack!',
    btn: 'Use Cleave',
  },
  slam: {
    slot: 'a1',
    eyebrow: 'Step 2 of 5',
    title: 'Pull monsters off your party!',
    touch: 'A skeleton is running at Ivy! Tap the glowing Slam button to grab everything back onto you.',
    desk: 'A skeleton is running at Ivy! Press the glowing Slam button (or 1) to grab everything back onto you.',
    btn: 'Use Slam',
  },
  dodge: {
    slot: 'dodge',
    eyebrow: 'Step 3 of 5',
    title: 'Roll out of the red line!',
    touch: 'Sir Rattlebones is charging down that red lane! Tap your round Roll button to dodge aside.',
    desk: 'Sir Rattlebones is charging down that red lane! Press your round Roll button (or Space) to dodge aside.',
    btn: 'Dodge roll',
  },
  block: {
    slot: 'a2',
    eyebrow: 'Step 4 of 5',
    title: 'Raise your shield to block!',
    touch: 'Gold cones are heavy tank hits—don’t roll away! Tap Raise Shield right before he swings.',
    desk: 'Gold cones are heavy tank hits—don’t roll away! Press Raise Shield (or 2) right before he swings.',
    btn: 'Raise shield',
  },
  stagger: {
    slot: 'a3',
    eyebrow: 'Step 5 of 5',
    title: 'Perfect Block stagger!',
    touch: 'Blocking right before impact takes zero damage, strikes back, and staggers the boss! Tap Charge to punish him.',
    desk: 'Blocking right before impact takes zero damage, strikes back, and staggers the boss! Press Charge (or 3) to punish him.',
    btn: 'Use Charge',
  },
};

export class RunScene implements InputUI {
  private acc = 0;
  private live = false;
  private opts: RunOpts | null = null;
  /** the hero this run is for, by id, so a save that changes underneath us is looked up fresh */
  private heroId: string | null = null;
  private role: RoleId = 'tank';
  private practice = false;
  private intro = false;
  /** the dungeon this run counts for: the Barrow, or its heroic version */
  private dg: DungeonInfo = BARROW;
  /** the brew drunk at the door, if any */
  brew: string | null = null;
  private ach: Achiever | null = null;
  private kills: KillLoot[] = [];
  private clear: ClearLoot | null = null;
  private unlocked: string[] = [];
  private off: (() => void) | null = null;
  private lootRng = makeRng();
  private hintKey: string | null = null;
  private hintT = 0;
  private tutKey: string | null = null;
  private hintsDone = new Set<string>();
  private trail = 1;
  private lastRoom = -1;
  private bound = false;

  constructor(private app: App, private root: HTMLElement) {
    $('pause-btn').addEventListener('click', (e) => { e.stopPropagation(); this.pause(); });
    $('intro-skip').addEventListener('click', (e) => { e.stopPropagation(); SFX.play('ui'); this.skipIntro(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.active() && S && !S.paused && !S.over) this.pause(); });
  }

  /* ---------------------------------------------------------------- InputUI */
  active(): boolean { return this.live && this.app.scene === 'run'; }
  stick(s: typeof IN.stick): void {
    const el = $('stick');
    if (!s) { el.hidden = true; return; }
    el.hidden = false;
    el.style.left = s.ox + 'px'; el.style.top = s.oy + 'px';
    const dx = s.x - s.ox, dy = s.y - s.oy, l = Math.hypot(dx, dy), m = Math.min(l, 56);
    (el.firstElementChild as HTMLElement).style.transform = `translate(${(dx / (l || 1)) * m}px, ${(dy / (l || 1)) * m}px)`;
    this.hintDone('move'); this.hintDone('introMove');
  }
  hintDone(key: string): void { this.hintsDone.add(key); if (this.hintKey === key) { $('hint').hidden = true; this.hintKey = null; } }
  holdBtn(slot: string, on: boolean): void { this.root.querySelector(`.ab[data-slot="${slot}"]`)?.classList.toggle('held', on); }

  /** freeze the game in the prologue to explain a mechanic and highlight the button to press */
  showTut(key: string): void {
    const step = TUT_STEPS[key];
    if (!step || !S || S.over) return;
    this.tutKey = key;
    this.hintKey = null;
    S.paused = true;
    const p = S.player;
    if (step.slot === 'dodge') p.cd.dodge = 0;
    else p.cd[step.slot] = 0;
    p.gcd = 0;
    this.root.classList.add('tut-pause');
    this.root.querySelectorAll('.tut-spot').forEach((el) => el.classList.remove('tut-spot'));
    this.root.querySelector(`.ab[data-slot="${step.slot}"]`)?.classList.add('tut-spot');
    if (key === 'slam') $('frames').classList.add('tut-spot');
    const h = $('hint');
    h.className = 'hint glass tut-card';
    h.innerHTML = `<span class="eyebrow">${esc(step.eyebrow)}</span>
      <b>${esc(step.title)}</b>
      <span>${esc(this.app.touch ? step.touch : step.desk)}</span>
      <div class="tut-acts"><button type="button" class="btn gold" id="tut-act">${esc(step.btn)}</button></div>`;
    h.hidden = false;
    $('tut-act').addEventListener('click', (e) => { e.stopPropagation(); SFX.play('ui'); this.onTutInput('any'); });
    updateCam(0, true);
    this.hudTick(0);
  }

  private clearTut(): void {
    this.tutKey = null;
    this.root.classList.remove('tut-pause');
    this.root.querySelectorAll('.tut-spot').forEach((el) => el.classList.remove('tut-spot'));
    const h = $('hint');
    h.className = 'hint glass';
    h.hidden = true;
  }

  onTutInput(slot: string): boolean {
    if (!this.tutKey || !S) return false;
    const step = TUT_STEPS[this.tutKey];
    if (!step || (slot !== 'any' && slot !== step.slot)) return false;
    const key = this.tutKey;
    this.clearTut();
    this.hintsDone.add(key);
    S.paused = false;
    const p = S.player;
    if (step.slot === 'dodge') {
      const z = S.hazards.find((x: any) => x.shape === 'rect');
      let a = z ? z.a + Math.PI / 2 : 0;
      if (z && p.x + Math.cos(a) * 110 < 360) a = z.a - Math.PI / 2;
      else if (z && p.x + Math.cos(a) * 110 > 640) a = z.a - Math.PI / 2;
      p.cd.dodge = 0;
      doDodge(p, Math.cos(a), Math.sin(a));
      if (z) z.t = Math.max(z.t, 1.38);
      if (S.boss && S.boss.act && S.boss.act.k === 'charge') S.boss.act.t = Math.max(S.boss.act.t, 1.38);
    } else if (step.slot === 'a2') {
      const z = S.hazards.find((x: any) => x.shape === 'cone');
      if (z && !inHaz(z, p.x, p.y, p.r)) {
        p.x = z.x + Math.cos(z.a) * 90;
        p.y = z.y + Math.sin(z.a) * 90;
      }
      if (S.boss) p.face = Math.atan2(S.boss.y - p.y, S.boss.x - p.x);
      IN.block = true;
      p.intent.block = true;
      p.blocking = true;
      p.blockT = 0;
      p.blockStart = S.t;
      this.holdBtn('a2', true);
      if (z) z.t = Math.max(z.t, 1.28);
      if (S.boss && S.boss.act && S.boss.act.k === 'sweep') S.boss.act.t = Math.max(S.boss.act.t, 1.28);
      setTimeout(() => { IN.block = false; p.intent.block = false; this.holdBtn('a2', false); }, 550);
    } else {
      IN.block = false;
      p.intent.block = false;
      this.holdBtn('a2', false);
      p.cd[step.slot] = 0;
      p.gcd = 0;
      useAbility(p, step.slot, key === 'stagger' && S.boss ? S.boss : null);
    }
    return true;
  }

  private hint(key: string): void {
    if (!S || S.quiet || S.auto || this.hintsDone.has(key)) return;
    if (this.intro && TUT_STEPS[key]) { this.showTut(key); return; }
    const t = HINTS[key];
    if (!t) return;
    const h = $('hint');
    h.className = 'hint glass';
    h.innerHTML = `<b>${esc(t[2])}</b><span>${esc(this.app.touch ? t[0] : t[1])}</span>`;
    h.hidden = false;
    this.hintKey = key; this.hintT = t[3] || 6;
  }

  /* ---------------------------------------------------------------- starting and stopping */
  start(o: RunOpts): void {
    const app = this.app, p = app.p;
    this.stop();
    this.opts = o;
    const intro = this.intro = o.start === 'intro';
    let h: Hero | null = intro ? null : activeHero(p);
    if (!intro && o.role && (!h || roleOf(h) !== o.role)) h = p.roster.find((x) => roleOf(x) === o.role) || null;
    const role: RoleId = intro ? 'tank' : h ? roleOf(h) : o.role || 'tank';
    this.heroId = h ? h.id : null;
    this.role = role;
    const test = o.testRar !== null || !h;
    this.practice = o.start !== 'entrance' || test;
    const rar: Rar = intro ? 3 : o.testRar !== null ? o.testRar : h ? partyRar(p, h) : 0;
    const loadouts: Record<string, unknown> = {};
    for (const r of ['tank', 'healer', 'dps'] as RoleId[]) loadouts[r] = r === role ? (test || !h ? plainLoadout(r, rar) : loadoutFor(p, h)) : plainLoadout(r, rar);
    if (intro) loadouts.tank = { ...(loadouts.tank as object), unique: 'gravedigger', bonuses: ['barrowguard2'], name: 'Brannoc', sprite: 'tank' };
    // a brew from the Vale, drunk at the door: practice uses it but keeps the bottle
    const brew = h ? drinkForRun(p, !this.practice) : null;
    this.brew = brew;
    if (h) loadouts[role] = { ...(loadouts[role] as object), name: h.name, sprite: heroArt(h.race, h.cls) || undefined, ...(brew ? { brew, brewCol: RECIPES[brew].color } : {}) };
    if (brew && this.practice) app.store.save();
    const looks = Object.keys(p.collection).filter((id) => COLLECTIBLES[id] && (COLLECTIBLES[id].kind === 'cosmetic') && !p.settings.looksOff.includes(id));
    const wornSet = !!h && Object.values(worn(p, h)).some((w) => w.def.setId && SETS[w.def.setId]);
    const ghostly = intro || (looks.includes('dye.ghostly') && wornSet && !test);
    const dg = this.dg = o.heroic ? BARROW_HEROIC : BARROW;
    const gilded = looks.includes('dye.ghostly.gilded') && wornSet && !test;
    if (!this.practice) { countRunStart(p, dg); app.store.save(); }
    if (!this.bound) { bindInput($('touch'), this); this.bound = true; }
    setHooks({
      nope: (slot: string) => { flash(this.root.querySelector(`.ab[data-slot="${slot}"]`), 'nope', 260); SFX.play('nope'); },
      fired: (slot: string) => { flash(this.root.querySelector(`.ab[data-slot="${slot}"]`), 'fired', 300); },
      hint: (key: string) => this.hint(key),
      pulseFrame: (role: string) => this.root.querySelectorAll(`[data-heal="${role}"]`).forEach((el) => flash(el, 'fired', 260)),
      onWipe: () => this.showWipe(),
      onLost: () => this.showWipe(),
      onChest: () => this.finish(),
      playerIntent,
    });
    newGame(BARROW_ENGINE, { role, loadouts, start: o.start, seed: (Math.random() * 0x7fffffff) | 1, looks, ghostly, gilded, testGear: test, heroic: !!o.heroic });
    S.startedAt = S.t;
    // a heroic run counts for the Barrow's own achievements
    this.ach = this.practice ? null : new Achiever(p, { dungeon: dg.heroicOf || dg.id, role, practice: false, testGear: false });
    this.kills = []; this.clear = null; this.unlocked = [];
    this.off = bus.on((e) => this.onEvent(e));
    resetInput();
    this.clearTut();
    this.hintsDone = new Set(); this.hintKey = null; $('hint').hidden = true;
    $('ov-msg').hidden = true;
    $('practice-tag').hidden = !this.practice || intro;
    $('intro-tag').hidden = !intro;
    $('intro-skip').hidden = !intro;
    $('heroic-tag').hidden = !o.heroic;
    const bt = $('brew-tag');
    bt.hidden = !brew;
    if (brew) bt.innerHTML = `<span class="ic">${tile(RECIPES[brew].icon)}</span>${esc(RECIPES[brew].name)}`;
    this.app.root.classList.add('in-run');
    this.buildHud();
    resizeView();
    updateCam(0, true);
    this.lastRoom = -1;
    this.live = true; this.acc = 0;
    if (intro) {
      this.showWelcome();
    } else {
      setTimeout(() => this.hint('move'), 500);
      if (role === 'healer') setTimeout(() => this.hint('heal'), 9000);
    }
  }
  stop(): void {
    this.live = false;
    this.clearTut();
    if (this.off) { this.off(); this.off = null; }
    this.app.root.classList.remove('in-run');
    $('ov-msg').hidden = true;
    $('intro-skip').hidden = true;
    $('intro-tag').hidden = true;
  }
  skipIntro(): void {
    finishIntroRun(this.app.p);
    this.stop();
    this.app.store.save();
    if (activeHero(this.app.p)) this.app.showHearth();
    else this.app.showCreate();
  }
  private showWelcome(): void {
    if (!S) return;
    S.paused = true;
    this.msg({
      eyebrow: 'First time here?',
      title: 'Welcome to Highfell',
      text: 'Play a quick one-minute tutorial, or jump straight to making your hero.',
      big: true,
      buttons: [
        ['Play tutorial (1 min)', () => { S.paused = false; $('ov-msg').hidden = true; this.hint('introMove'); }],
        [activeHero(this.app.p) ? 'Back to the hearth' : 'Make my hero', () => this.skipIntro()],
      ],
    });
  }

  /* ---------------------------------------------------------------- the meta glue */
  /** the hero this run is for, looked up in the save as it is now */
  private hero(): Hero | null { return heroById(this.app.p, this.heroId); }

  private onEvent(e: GameEvent): void {
    if (!S || !this.opts) return;
    const p = this.app.p, hero = this.hero();
    if (this.ach) for (const id of this.ach.event(e)) this.unlockedNow(id);
    if (e.type === 'boss.killed') {
      const x = e.x ?? S.player.x, y = e.y ?? S.player.y;
      const last = e.boss === this.dg.finalBoss;
      if (!this.practice && hero) {
        const kl = resolveKill(p, this.dg, e.boss, hero, e.time, this.lootRng);
        this.kills.push(kl);
        for (const d of kl.drops) if (d.isNew && this.ach) for (const id of this.ach.collected(d.id)) this.unlockedNow(id);
        if (last) {
          this.clear = resolveClear(p, this.dg, hero, S.t - S.startedAt, this.lootRng);
          startWalkout(tellOf(kl.drops), x, y);
        } else if (kl.drops.length) {
          lootGlint(x, y, nameOf(kl.drops[0].id));
          for (const d of kl.drops) if (d.isNew) this.app.toasts.collected(d.id, kl.kc);
        }
        this.app.store.save();
      } else if (last && this.app.dev.walkout !== 'off') startWalkout(this.app.dev.walkout, x, y);
    } else if (e.type === 'run.wipe') {
      if (!this.practice && S.boss) { countBossWipe(p, this.dg, S.boss.type); this.app.store.save(); }
    } else if (e.type === 'run.cleared') {
      if (this.ach) for (const id of this.ach.cleared(e.summary)) this.unlockedNow(id);
      this.app.store.save();
    } else if (e.type === 'boss.pulled' && !this.practice) {
      this.app.store.save();
    }
  }
  private unlockedNow(id: string): void {
    this.unlocked.push(id);
    this.app.toasts.achievement(id);
    this.app.store.save();
  }
  /** the chest opened */
  private finish(): void {
    if (!this.opts || !S) return;
    const summary = { time: S.clearTime || S.t - S.startedAt, deaths: S.stats.deaths, perfect: S.player.stats.perfect, dmg: S.player.stats.dmg, heal: S.player.stats.heal };
    this.live = false;
    if (this.intro) {
      finishIntroRun(this.app.p);
      this.app.store.save();
      this.stop();
      this.app.reveal.showIntro(summary.time);
      return;
    }
    const hero = this.hero();
    if (this.practice || !hero) { this.showPracticeDone(summary.time); return; }
    const loot = runLoot(this.app.p, this.dg, hero, this.kills, this.clear);
    this.stop();
    this.app.showReveal(loot, { unlocked: this.unlocked.slice(), hero: hero.id, role: this.role, deaths: summary.deaths, again: this.opts });
  }

  /* ---------------------------------------------------------------- menus */
  private msg(o: { eyebrow: string; title: string; text: string; big?: boolean; buttons: [string, () => void][] }): void {
    $('msg-eyebrow').textContent = o.eyebrow;
    $('msg-title').textContent = o.title;
    $('msg-text').textContent = o.text;
    $('msg-actions').innerHTML = o.buttons.map((b, i) => `<button type="button" class="btn ${o.big ? 'big ' : ''}${i ? '' : 'gold'}" data-i="${i}">${esc(b[0])}</button>`).join('');
    $('msg-actions').querySelectorAll<HTMLElement>('button').forEach((el) => el.addEventListener('click', () => { SFX.play('ui'); o.buttons[+el.dataset.i!][1](); }));
    $('ov-msg').hidden = false;
    ($('msg-actions').querySelector('button') as HTMLElement | null)?.focus({ preventScroll: true });
  }
  pause(): void {
    if (!S || !this.live || S.over) return;
    if (S.paused && !$('ov-msg').hidden) { S.paused = !!this.tutKey; $('ov-msg').hidden = true; return; }
    S.paused = true;
    if (this.intro) {
      this.msg({ eyebrow: 'Prologue', title: 'Paused', text: 'You are playing Brannoc in full Epic gear to get a feel for tanking, dodging, blocking and teamwork.', buttons: [
        ['Keep going', () => this.pause()],
        [SFX.on ? 'Sound off' : 'Sound on', () => { const p = this.app.p; p.settings.sound = !p.settings.sound; SFX.on = p.settings.sound; this.app.store.save(); S.paused = false; this.pause(); }],
        ['Restart intro', () => { if (this.opts) this.start(this.opts); }],
        [activeHero(this.app.p) ? 'Back to the hearth' : 'Skip to hero maker', () => this.skipIntro()],
      ] });
      return;
    }
    const leave = this.practice ? 'Leave practice' : 'Leave the run';
    this.msg({ eyebrow: this.practice ? 'Practice' : this.dg.name, title: 'Paused', text: `${fmtT(S.t - S.startedAt)} in.${this.practice ? '' : ' Kill counts and drops you already have are kept if you leave.'}`, buttons: [
      ['Keep going', () => this.pause()],
      [SFX.on ? 'Sound off' : 'Sound on', () => { const p = this.app.p; p.settings.sound = !p.settings.sound; SFX.on = p.settings.sound; this.app.store.save(); S.paused = false; this.pause(); }],
      ['Restart', () => { if (this.opts) this.start(this.opts); }],
      [leave, () => this.app.home()],
    ] });
  }
  private showWipe(): void {
    const room = S.dg.map.rooms[S.wipeRoom !== undefined ? S.wipeRoom : S.cp];
    this.msg({ eyebrow: 'Wipe', title: 'Everyone went down', text: `Back to the start of ${room ? room.name : 'the room'}. Anything you killed stays dead.`, buttons: [
      ['Go again', () => { $('ov-msg').hidden = true; respawn(); }],
      ['Back to the hearth', () => this.app.home()],
    ] });
  }
  private showPracticeDone(time: number): void {
    this.msg({ eyebrow: 'Practice', title: 'Down he goes', text: `${fmtT(time)}. Practice gives no loot. When you are ready, run it from the entrance.`, buttons: [
      ['Practice again', () => { if (this.opts) this.start(this.opts); }],
      ['Back to the hearth', () => this.app.home()],
    ] });
  }

  /* ---------------------------------------------------------------- testing hooks (used by tools/pw_check.py) */
  /** the live engine state */
  state(): any { return S; }
  /** let the bots play your seat and run the clock forward until `until` says stop */
  autoplay(seconds: number, until?: (s: any) => boolean): number {
    if (!S) return 0;
    if (this.intro && S.paused) { S.paused = false; $('ov-msg').hidden = true; this.clearTut(); }
    S.auto = true;
    let n = Math.round(seconds / STEP), i = 0;
    for (; i < n && this.live && S; i++) {
      if (this.intro && S.paused) { S.paused = false; this.clearTut(); }
      if (S.paused) break;
      update(STEP);
      if (S.over === 'wipe' && S.timers.length === 0) { $('ov-msg').hidden = true; respawn(); }
      if (until && until(S)) break;
    }
    return +(S ? S.t : 0).toFixed(1);
  }

  /* ---------------------------------------------------------------- the frame */
  frame(dt: number): void {
    if (!S) return;
    if (this.live && !S.paused) {
      this.acc += dt;
      let n = 0;
      while (this.acc >= STEP && n < 6) { update(STEP); this.acc -= STEP; n++; }
      if (n >= 6) this.acc = 0;
    } else this.acc = 0;
    updateCam(dt);
    this.hudTick(dt);
    render();
  }

  /* ---------------------------------------------------------------- HUD */
  private buildHud(): void {
    const p = S.player, A = AB[p.role as RoleId];
    $('frames').innerHTML = S.heroes.map((h: any) => `<li class="fr${h.isPlayer ? ' me' : ''}" data-heal="${h.role}" data-role="${h.role}">
      <span class="fr-top"><span class="fi">${tile(ROLE_ICON[h.role])}</span><span class="fr-n">${h.isPlayer ? 'You' : h.name}</span><i class="ag" aria-hidden="true"></i></span>
      <span class="fb"><i class="hpf"></i><i class="abf"></i></span>${h.role === 'healer' ? '<span class="fb mp"><i class="mpf"></i></span>' : ''}</li>`).join('');
    $('frames').querySelectorAll<HTMLElement>('.fr').forEach((li) => li.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (S.player.role === 'healer') { mend(S.player, heroBy(li.dataset.role)); this.hintDone('heal'); } }));
    const btn = (slot: string) => {
      const def = slot === 'dodge' ? { key: 'dodge', name: 'Dodge', desc: 'Roll out of trouble.' } as { key: string; name: string; desc: string; mana?: number; hold?: boolean } : A[slot as 'a1'];
      const tag = slot === 'dodge' ? 'Roll' : def.hold ? 'Block' : '';
      return `<button type="button" class="ab${def.hold ? ' hold' : ''}${slot === 'dodge' ? ' roll' : ''}" data-slot="${slot}" aria-label="${esc(def.name)}" title="${esc(def.name + ': ' + def.desc)} (${KEY[slot]})">
        <span class="face">${tile(def.key)}</span><span class="sweep"></span><span class="cdn"></span><kbd>${KEY[slot]}</kbd>${def.mana ? `<span class="cost">${def.mana}</span>` : ''}${tag ? `<span class="ab-tag">${tag}</span>` : ''}<span class="glow"></span></button>`;
    };
    $('abar').innerHTML = ['a1', 'a2', 'a3', 'a4', 'dodge'].map(btn).join('');
    $('abar').querySelectorAll<HTMLElement>('.ab').forEach((b) => this.bindAbility(b, b.dataset.slot!));
    const pad = $('pad');
    if (p.role === 'healer') {
      pad.hidden = false;
      pad.innerHTML = S.heroes.map((h: any) => `<button type="button" class="pd" data-heal="${h.role}" data-role="${h.role}" aria-label="Heal ${h.isPlayer ? 'yourself' : h.name}"><span class="pd-n">${h.isPlayer ? 'You' : h.name}</span><span class="fb"><i class="hpf"></i><i class="abf"></i></span></button>`).join('');
      pad.querySelectorAll<HTMLElement>('.pd').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); mend(S.player, heroBy(b.dataset.role)); this.hintDone('heal'); }));
    } else { pad.hidden = true; pad.innerHTML = ''; }
    this.root.dataset.role = p.role;
    $('bossbar').hidden = true;
  }
  private bindAbility(b: HTMLElement, slot: string): void {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!S || S.over) return;
      if (this.tutKey && this.onTutInput(slot)) return;
      if (S.paused) return;
      const p = S.player;
      if (p.st.caged) { mashCage(p, this); return; }
      if (slot === 'dodge') { doDodge(p, p.intent.mx, p.intent.my); this.hintDone('dodge'); return; }
      const def = AB[p.role as RoleId][slot as 'a1'];
      if (def.hold) {
        IN.block = true; b.classList.add('held'); this.hintDone('block');
        try { b.setPointerCapture(e.pointerId); } catch { /* fine */ }
        const up = () => { IN.block = false; b.classList.remove('held'); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up); };
        b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
        return;
      }
      if (def.aim) {
        const r = VIEW.cv.getBoundingClientRect();
        IN.aim = { slot, id: e.pointerId, sx: e.clientX - r.left, sy: e.clientY - r.top, cx: e.clientX - r.left, cy: e.clientY - r.top, live: true };
        try { b.setPointerCapture(e.pointerId); } catch { /* fine */ }
        const move = (ev: PointerEvent) => { if (!IN.aim || ev.pointerId !== IN.aim.id) return; IN.aim.cx = ev.clientX - r.left; IN.aim.cy = ev.clientY - r.top; };
        const up = (ev: PointerEvent) => {
          b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up);
          const a = IN.aim; IN.aim = null;
          if (!a || ev.type === 'pointercancel') return;
          const moved = Math.hypot(a.cx - a.sx, a.cy - a.sy) >= 14;
          useAbility(S.player, slot, moved ? aimPoint(a) : null);
          if (moved) this.hintDone('aim');
        };
        b.addEventListener('pointermove', move); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
        return;
      }
      useAbility(p, slot, p.picked && isFoe(p.picked) ? p.picked : null);
    });
  }
  private hudTick(dt: number): void {
    if (!S) return;
    const p = S.player;
    const targeted = new Set<string>();
    for (const m of S.mobs) if (m.alive && m.state === 'fight' && m.target && !m.cage && !m.M.wisp) targeted.add(m.target.role);
    this.root.querySelectorAll<HTMLElement>('[data-heal]').forEach((el) => {
      const h = heroBy(el.dataset.role);
      if (!h) return;
      setW(el.querySelector('.hpf'), h.hp / h.maxHp);
      const ab = el.querySelector<HTMLElement>('.abf'); if (ab) { ab.style.left = (clamp(h.hp / h.maxHp, 0, 1) * 100).toFixed(1) + '%'; setW(ab, Math.min(h.absorb / h.maxHp, 1 - h.hp / h.maxHp)); }
      const mp = el.querySelector('.mpf'); if (mp) setW(mp, h.mana / h.maxMana);
      el.classList.toggle('dead', !h.alive);
      el.classList.toggle('low', h.alive && h.hp < h.maxHp * 0.35);
      el.classList.toggle('aggro', h.alive && h.role !== 'tank' && targeted.has(h.role));
      el.classList.toggle('far', p.role === 'healer' && h.alive && dist(h, p) > MEND.range);
    });
    const bb = $('bossbar');
    const B = S.boss && S.boss.alive ? S.boss : null;
    if (B) {
      if (bb.hidden) { bb.hidden = false; $('bb-name').textContent = B.name; this.trail = 1; if (this.intro) $('intro-tag').hidden = true; }
      const k = B.hp / B.maxHp;
      setW($('bb-fill'), k);
      this.trail = Math.max(k, this.trail - dt * 0.25);
      setW($('bb-trail'), this.trail);
      $('bb-pct').textContent = Math.ceil(k * 100) + '%';
      const M = B.M;
      $('bb-phase').textContent = `Phase ${B.phase} of ${M.phases || 1}`;
      const enr = M.enrage || 0;
      const left = enr - ((B.ab && B.ab.t) || 0);
      const act = B.act && M.acts && M.acts[B.act.k];
      $('bb-sub').textContent = (act ? act + ' · ' : '') + (enr ? (left > 0 ? 'Enrage in ' + fmtT(left) : 'Enraged') : '');
      $('bb-sub').classList.toggle('hot', !!act || (enr > 0 && left <= 30));
    } else if (!bb.hidden) bb.hidden = true;
    const A = AB[p.role as RoleId];
    this.root.querySelectorAll<HTMLElement>('.ab').forEach((b) => {
      const slot = b.dataset.slot!;
      let cd = 0, max = 1, usable = p.alive && !p.st.stun && !p.st.caged;
      if (slot === 'dodge') { cd = p.cd.dodge; max = 1.6; }
      else { const def = A[slot as 'a1']; cd = p.cd[slot]; max = def.cd || 1; if (def.key === 'comet' && p.cast) cd = 0; if (def.mana && p.mana < def.mana) usable = false; }
      const pr = cd > 0 ? cd / max : 0;
      const sw = b.querySelector<HTMLElement>('.sweep')!; const v = pr.toFixed(3); if (sw.dataset.p !== v) { sw.style.setProperty('--p', v); sw.dataset.p = v; }
      const cdn = b.querySelector('.cdn')!; const txt = cd > 0.95 ? String(Math.ceil(cd)) : ''; if (cdn.textContent !== txt) cdn.textContent = txt;
      b.classList.toggle('dim', !usable);
      b.classList.toggle('proc', usable && cd <= 0 && (procFor(p, slot) || (!!this.tutKey && TUT_STEPS[this.tutKey]?.slot === slot)));
    });
    const bn = $('banner');
    const btxt = S.banner ? S.banner.str : '';
    if (bn.textContent !== btxt) { bn.textContent = btxt; bn.className = 'banner' + (S.banner ? ' show ' + S.banner.kind : ''); }
    const cl = $('call');
    const ctxt = S.call ? S.call.str : '';
    if (cl.textContent !== ctxt) { cl.textContent = ctxt; cl.className = 'call' + (S.call ? ' show ' + S.call.kind : ''); if (ctxt) flash(cl, 'pop', 260); }
    $('hurt').style.opacity = String(clamp(S.hurtFlash, 0, 0.9));
    if (this.hintKey && !this.tutKey) { this.hintT -= dt; if (this.hintT <= 0) { $('hint').hidden = true; this.hintsDone.add(this.hintKey); this.hintKey = null; } }
    if (!this.live || S.paused) return;
    if (this.intro && S.inCombat && !this.hintsDone.has('introAb') && S.mobs.some((m: any) => m.alive && m.state === 'fight' && dist(m, p) < 120)) { this.hintDone('introMove'); this.hint('introAb'); }
    if (this.intro && this.hintsDone.has('introAb') && !this.hintsDone.has('slam')) {
      const loose = S.mobs.find((m: any) => m.alive && m.state === 'fight' && m.pack === 'C' && dist(m, p) < 160);
      const sq = heroBy('dps') || heroBy('healer');
      if (loose && sq && loose.target === p) { loose.target = sq; loose.threat[sq.id] = (loose.threat[p.id] || 0) + 500; }
    }
    if (!this.intro && !this.hintsDone.has('dodge') && S.hazards.some((z: any) => !z.noDmg && inHaz(z, p.x, p.y, p.r))) this.hint('dodge');
    if (p.role === 'tank' && !this.hintsDone.has('slam') && S.mobs.some((m: any) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && dist(m, p) < 190)) this.hint('slam');
    if (p.role === 'dps' && !this.hintsDone.has('aim') && S.inCombat && S.mobs.filter((m: any) => m.alive && m.state === 'fight').length >= 3) this.hint('aim');
    if (p.role === 'dps' && this.hintsDone.has('aim') && !this.hintsDone.has('shatter') && S.mobs.some((m: any) => m.alive && m.st && m.st.freeze > 0.5)) this.hint('shatter');
    const ri = roomIndexOf(p.x, p.y);
    if (ri >= 0 && ri !== this.lastRoom) { if (this.lastRoom !== -1 && ri > this.lastRoom && !S.boss) banner(S.dg.map.rooms[ri].name, 'room', 1.8); this.lastRoom = ri; }
  }
}

function setW(el: Element | null, k: number): void { if (!el) return; const v = (clamp(k, 0, 1) * 100).toFixed(1) + '%'; const s = (el as HTMLElement).style; if (s.width !== v) s.width = v; }

/** a gold glow on a button when now is a good time to press it */
function procFor(p: any, slot: string): boolean {
  const def = slot === 'dodge' ? null : AB[p.role as RoleId][slot as 'a1'];
  if (!def) return S.hazards.some((z: any) => !z.noDmg && !(z.tankBuster && p.role === 'tank') && z.t > 0.2 && inHaz(z, p.x, p.y, p.r)) || S.rings.some((g: any) => !g.hit.has(p.id) && Math.abs(dist(p, g) - g.r) < 90);
  const loose = () => S.mobs.some((m: any) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && !m.cage && m.forcedT <= 0 && dist(m, p) < 220);
  switch (def.key) {
    case 'slam': return loose() || S.mobs.filter((m: any) => isFoe(m) && !m.cage && m.state === 'fight' && dist(m, p) < 200 + m.r).length >= 3;
    case 'shield': return S.hazards.some((z: any) => (z.tankBuster || (z.shape === 'rect' && z.src && z.src.type === 'knight')) && !z.fired && (z.followT === p || inHaz(z, p.x, p.y, p.r)) && z.warn - z.t < 0.9);
    case 'charge': return S.mobs.some((m: any) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && !m.cage && dist(m, p) > 200 && dist(m, p) < 420);
    case 'cleave': return S.mobs.filter((m: any) => isFoe(m) && !m.cage && m.state === 'fight' && dist(m, p) < 115 + m.r).length >= 2;
    case 'sunburst': return S.heroes.filter((a: any) => a.alive && a.hp < a.maxHp * 0.6).length >= 2;
    case 'ward': { const t = heroBy('tank'); return !!(t && t.alive && t.absorb <= 0 && S.hazards.some((z: any) => z.tankBuster && !z.fired && (z.followT === t || inHaz(z, t.x, t.y, t.r)))); }
    case 'smite': return S.inCombat && S.heroes.every((a: any) => !a.alive || a.hp > a.maxHp * 0.8) && !!(heroBy('tank')?.target);
    case 'blizzard': { const c = bestCluster(p, 120, 560); return !!(c && c.score >= 3); }
    case 'nova': return S.mobs.filter((m: any) => isFoe(m) && !m.isBoss && !m.cage && m.state === 'fight' && dist(m, p) < 150 + m.r).length >= 2 || S.mobs.some((m: any) => isFoe(m) && m.cast && m.cast.kick && dist(m, p) < 150 + m.r);
    case 'comet': { const t = p.picked || p.target; return !!(t && t.alive && t.st && t.st.freeze > 0.6); }
    case 'icicle': return S.mobs.some((m: any) => isFoe(m) && m.st && m.st.freeze > 0.3 && dist(m, p) < 500);
  }
  return false;
}

