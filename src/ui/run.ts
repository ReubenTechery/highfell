/**
 * A run: the dungeon on the canvas, the HUD over it, and the glue to the meta layer. Kill counts and
 * drops are rolled the moment a boss dies; the last boss's drops decide what the lantern does; the
 * chest opening hands everything to the reveal.
 */
import { bus, type GameEvent } from '../core/events';
import { makeRng } from '../core/rng';
import { dist, clamp } from '../core/math';
import { COLLECTIBLES, DUNGEONS, DUNGEON_ENGINES, SETS, heroicVersion } from '../content';
import { BARROW } from '../content/barrow';
import type { DungeonInfo } from '../content/types';
import { BARROW_ENGINE } from '../content/barrow/engine';
import { AB, MEND, ROLES, abKey } from '../content/roles';
import type { Rar, RoleId } from '../content/types';
import { newGame, respawn, update } from '../dungeon/game.js';
import { S, setHooks } from '../dungeon/state.js';
import { banner, exposeMob } from '../dungeon/entities.js';
import { abCd, abMana, bestCluster, doDodge, heroBy, isFoe, mend, useAbility } from '../dungeon/heroes.js';
import { momentFor } from '../dungeon/coach.js';
import { CURSE_TIME } from '../dungeon/mobs.js';
import { inHaz } from '../dungeon/bots.js';
import { render, resizeView, updateCam, VIEW } from '../dungeon/render.js';
import { roomIndexOf } from '../dungeon/world.js';
import { lootGlint, startWalkout } from '../dungeon/walkout.js';
import { Achiever } from '../meta/achievements';
import { loadoutFor, partyRar, plainLoadout, worn } from '../meta/gear';
import { countBossWipe, countRunStart, resolveClear, resolveKill, runLoot, tellOf, type ClearLoot, type KillLoot } from '../meta/loot';
import { pourFor, seatsFor } from '../meta/party';
import { activeHero, countClassRun, countLift, finishCurseTip, finishIntroRun, heroById, learnGlow, markClassTrial, needsClassTrial, needsCurseTip, needsSwipeHint, roleOf, type Hero } from '../meta/profile';
import { CLASSES, heroArt, type ClassId } from '../content/folk';
import { RECIPES } from '../content/vale';
import { broughtBrew, spendBottle } from '../meta/vale';
import type { App } from './app';
import { $, esc, flash, fmtT } from './dom';
import { heroImg, heroSprite, nameOf, spriteURL, tile } from './art';
import { IN, aimPoint, bindFrameSwipes, bindInput, mashCage, playerIntent, resetInput, type InputUI } from './input';
import { SFX } from './sound';

/** A run plays the hero you are playing. `role` is for testing: it picks one of your heroes in that seat,
 *  and if you have none the run is practice in plain gear. `heroic` plays the heroic version: harder, its
 *  own kill counts and its gilded drops. */
export interface RunOpts { start: string; testRar: Rar | null; role?: RoleId; heroic?: boolean; dungeon?: string }
const STEP = 1 / 60;
const KEY: Record<string, string> = { a1: '1', a2: '2', a3: '3', a4: '4', dodge: 'Space' };
const ROLE_ICON: Record<string, string> = { tank: 'shield', healer: 'mend', dps: 'blizzard' };
const HINTS: Record<string, [string, string, string, number?]> = {
  introMove: ['Drag on the left to walk up into the skeletons.', 'Use WASD or the arrow keys to walk up into the skeletons.', 'Walk into the pack', 12],
  introChest: ['The lantern flared gold and the chest knocked twice: a unique is inside! Walk to the chest to open it.', 'The lantern flared gold and the chest knocked twice: a unique is inside! Walk to the chest to open it.', 'The walkout', 8],
};

interface TutStep { slot: string; icon: string; step: string; title: string; badge: string; text: string; btn: string }
const TUT_BY_CLASS: Record<ClassId, Record<string, TutStep>> = {
  warrior: {
    introAb: { slot: 'a1', icon: 'cleave', step: '1 / 5', title: '1 · Cleave', badge: 'Wide front sweep', text: 'Tap glowing Cleave to smash the pack!', btn: 'Use Cleave' },
    slam: { slot: 'a3', icon: 'slam', step: '2 / 5', title: '3 · Slam (Taunt)', badge: 'Ivy has aggro! ➔ Pull pack in', text: 'Tap Slam to yank mobs back onto you.', btn: 'Use Slam' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Tap Roll to dodge his charge!', btn: 'Dodge roll' },
    block: { slot: 'a4', icon: 'shield', step: '4 / 5', title: '4 · Block Gold Hits', badge: 'Gold cone ➔ Block right before hit', text: 'Tap Block to parry the heavy swing!', btn: 'Raise shield' },
    stagger: { slot: 'a2', icon: 'charge', step: '5 / 5', title: '2 · Boss Exposed!', badge: 'Perfect Block = Stun + +35% DMG!', text: 'Tap Charge to rush in and punish him!', btn: 'Use Charge' },
  },
  cleric: {
    introAb: { slot: 'a1', icon: 'circle', step: '1 / 5', title: '1 · Prayer Circle', badge: 'Ground healing zone', text: 'Drop a glowing Prayer Circle under your party!', btn: 'Drop Circle' },
    slam: { slot: 'a4', icon: 'smite', step: '2 / 5', title: '4 · Smite (Pulse & Mana)', badge: 'Hit foes + pulse your Circle', text: 'Cast Smite to blast foes, restore mana, and pulse your Circle!', btn: 'Cast Smite' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Tap Roll to dodge Sir Rattlebones’s charge!', btn: 'Dodge roll' },
    block: { slot: 'a2', icon: 'ward', step: '4 / 5', title: '2 · Ward the Tank', badge: 'Heavy boss swing incoming!', text: 'Shield your Tank before the heavy swing lands!', btn: 'Cast Ward' },
    stagger: { slot: 'a3', icon: 'sunburst', step: '5 / 5', title: '3 · Boss Exposed!', badge: 'Boss staggered (+35% DMG taken)!', text: 'Unleash Sunburst to top up the party and sear the boss!', btn: 'Cast Sunburst' },
  },
  mage: {
    introAb: { slot: 'a1', icon: 'blizzard', step: '1 / 5', title: '1 · Blizzard', badge: 'Chilling ice storm', text: 'Call down Blizzard to slow and melt the pack!', btn: 'Cast Blizzard' },
    slam: { slot: 'a2', icon: 'nova', step: '2 / 5', title: '2 · Rime Burst (Freeze)', badge: 'Freeze pack ➔ Shatter combo!', text: 'Freeze nearby foes solid so your ice spells Shatter!', btn: 'Cast Rime Burst' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Tap Roll to dodge Sir Rattlebones’s charge!', btn: 'Dodge roll' },
    block: { slot: 'a4', icon: 'icicle', step: '4 / 5', title: '4 · Instant Icicle', badge: 'Fast instant-cast shard', text: 'Fire Icicle while the Tank blocks the heavy swing!', btn: 'Fire Icicle' },
    stagger: { slot: 'a3', icon: 'comet', step: '5 / 5', title: '3 · Boss Exposed!', badge: 'Boss staggered (+35% DMG taken)!', text: 'Drop a massive Comet during the Exposed window!', btn: 'Cast Comet' },
  },
  rogue: {
    introAb: { slot: 'a1', icon: 'viper', step: '1 / 5', title: '1 · Viper Blades', badge: 'Apply Viper Venom', text: 'Slash with Viper Blades to poison your target!', btn: 'Use Viper Blades' },
    slam: { slot: 'a3', icon: 'flurry', step: '2 / 5', title: '3 · Fan of Blades', badge: 'AoE knives + refresh venom', text: 'Spin Fan of Blades to slice the pack and spread venom!', btn: 'Use Fan of Blades' },
    dodge: { slot: 'dodge', icon: 'dodge', step: '3 / 5', title: 'Roll Out of Red', badge: 'Red lane ➔ Dodge aside', text: 'Tap Roll to dodge Sir Rattlebones’s charge!', btn: 'Dodge roll' },
    block: { slot: 'a4', icon: 'shadowstep', step: '4 / 5', title: '4 · Shadowstep Behind', badge: 'Gold cone ➔ Blink behind boss', text: 'Shadowstep behind him while the Tank parries his swing!', btn: 'Use Shadowstep' },
    stagger: { slot: 'a2', icon: 'ambush', step: '5 / 5', title: '2 · Boss Exposed!', badge: 'Poisoned + Exposed (+35% DMG)!', text: 'Strike with Shadowstrike for a guaranteed massive crit!', btn: 'Use Shadowstrike' },
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
  /** seconds to the next heartbeat while a mate is nearly down (the healer's) */
  private beatT = 0;
  /** how strongly the coach glows the button whose moment has come: only a class's first runs (learnGlow) */
  private learn = 0;
  /** the run you asked for, waiting while its class's Crypt Trial is offered first */
  private after: RunOpts | null = null;
  /** the swipe arrow across a cursed mate, until you've lifted three curses */
  private swipeHint = false;
  private lastRoom = -1;
  private bound = false;

  constructor(private app: App, private root: HTMLElement) {
    $('pause-btn').addEventListener('click', (e) => { e.stopPropagation(); this.pause(); });
    $('intro-skip').addEventListener('click', (e) => { e.stopPropagation(); SFX.play('ui'); this.skipIntro(); });
    bindFrameSwipes($('pad')); bindFrameSwipes($('frames'));
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
    this.hintDone('introMove');
  }
  hintDone(key: string): void { this.hintsDone.add(key); if (this.hintKey === key) { $('hint').hidden = true; this.hintKey = null; } }
  holdBtn(slot: string, on: boolean): void { this.root.querySelector(`.ab[data-slot="${slot}"]`)?.classList.toggle('held', on); }

  private tutStep(key: string | null): TutStep | null {
    if (!key) return null;
    const cls: ClassId = (S?.player?.cls as ClassId) || this.hero()?.cls || 'warrior';
    return (TUT_BY_CLASS[cls] || TUT_BY_CLASS.warrior)[key] || null;
  }

  /** freeze the game in the Crypt Trial to explain a mechanic and highlight the button to press */
  showTut(key: string): void {
    const step = this.tutStep(key);
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
    if (key === 'slam' && p.role === 'tank') $('frames').classList.add('tut-spot');
    const h = $('hint');
    h.className = 'hint glass tut-card';
    h.innerHTML = `<div class="tut-row"><span class="tile tut-ic" aria-hidden="true">${tile(step.icon)}</span><div class="tut-tx">
      <div class="tut-top"><span class="tut-step">${esc(step.step)}</span><span class="tut-badge">${esc(step.badge)}</span></div>
      <b>${esc(step.title)}</b>
      <span>${esc(step.text)}</span></div></div>
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
    const step = this.tutStep(this.tutKey);
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
    } else if (key === 'block' && p.role === 'tank') {
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
      this.holdBtn('a4', true);
      if (z) z.t = Math.max(z.t, 1.28);
      if (S.boss && S.boss.act && S.boss.act.k === 'sweep') S.boss.act.t = Math.max(S.boss.act.t, 1.28);
      setTimeout(() => { IN.block = false; p.intent.block = false; this.holdBtn('a4', false); }, 550);
    } else {
      IN.block = false;
      p.intent.block = false;
      this.holdBtn('a4', false);
      p.cd[step.slot] = 0;
      p.gcd = 0;
      useAbility(p, step.slot, (key === 'stagger' || key === 'block') && S.boss ? S.boss : null);
      if (key === 'block' && p.role !== 'tank' && S.boss && S.boss.alive) {
        S.boss.st.stun = Math.max(S.boss.st.stun || 0, 3.2);
        exposeMob(S.boss, 3.8, 'Staggered!');
        setTimeout(() => { if (S && !S.hints.stagger) { S.hints.stagger = 1; this.hint('stagger'); } }, 320);
      }
    }
    return true;
  }

  private hint(key: string): void {
    if (!this.intro || !S || S.quiet || S.auto || this.hintsDone.has(key)) return;
    if (this.tutStep(key)) { this.showTut(key); return; }
    const t = HINTS[key];
    if (!t) return;
    const h = $('hint');
    h.className = 'hint glass';
    h.innerHTML = `<b>${esc(t[2])}</b><span>${esc(this.app.touch ? t[0] : t[1])}</span>`;
    h.hidden = false;
    this.hintKey = key; this.hintT = t[3] || 6;
  }

  /* ---------------------------------------------------------------- starting and stopping */
  /** the hero a run plays: yours, or for `role` (testing) one of yours in that seat */
  private heroFor(o: RunOpts): Hero | null {
    const p = this.app.p, h = activeHero(p);
    if (!o.role || (h && roleOf(h) === o.role)) return h;
    return p.roster.find((x) => roleOf(x) === o.role) || (o.start === 'intro' ? h : null);
  }
  start(o: RunOpts): void {
    const app = this.app, p = app.p;
    // the first run on a class that isn't your first hero's offers that class's Crypt Trial first, once
    if (o.start !== 'intro') {
      this.after = null;
      const first = this.heroFor(o);
      if (first && needsClassTrial(p, first)) {
        markClassTrial(p, first.cls);
        app.store.save();
        this.after = o;
        this.start({ start: 'intro', testRar: 3, role: roleOf(first) });
        return;
      }
    }
    this.stop();
    this.opts = o;
    const intro = this.intro = o.start === 'intro';
    const h = this.heroFor(o);
    const role: RoleId = h ? roleOf(h) : o.role || 'tank';
    this.heroId = h ? h.id : null;
    this.role = role;
    const test = o.testRar != null || !h;
    this.practice = o.start !== 'entrance' || test;
    const rar: Rar = intro ? 3 : o.testRar != null ? o.testRar : h ? partyRar(p, h) : 0;
    const tierSuffix = rar <= 0 ? '_rags' : rar === 1 ? '_iron' : '';
    const loadouts: Record<string, unknown> = {};
    // who sits with you is party.ts's rule (your Warband on Normal, bots on Heroic); try-gear runs and the trial bring bots
    const team = h && !test && !intro ? seatsFor(p, [h], !!o.heroic) : null;
    for (const r of ['tank', 'healer', 'dps'] as RoleId[]) {
      const mate = r === role ? null : team?.find((s) => s.role === r)?.hero || null;
      if (mate) {
        const base = loadoutFor(p, mate);
        loadouts[r] = { ...base, cls: mate.cls, name: mate.name, sprite: heroSprite(mate, r, p) };
      } else {
        const base = r === role ? (test || !h ? plainLoadout(r, rar, h?.cls) : loadoutFor(p, h)) : plainLoadout(r, rar);
        loadouts[r] = { ...base, sprite: `${ROLES[r].sprite}${tierSuffix}` };
      }
    }
    if (intro) {
      loadouts.tank = { ...(loadouts.tank as object), unique: 'gravedigger', bonuses: ['barrowguard2'], name: 'Brannoc', sprite: 'tank' };
      if (role === 'healer') loadouts.healer = { ...(loadouts.healer as object), unique: 'lantern', bonuses: ['candlewake2'] };
      else if (role === 'dps') loadouts.dps = { ...(loadouts.dps as object), unique: h?.cls === 'rogue' ? 'cryptfangs' : 'spire', bonuses: [h?.cls === 'rogue' ? 'shadeveil2' : 'rimebone2'] };
    }
    // one bottle poured at the door for the whole party: only the poured one is spent (practice keeps it)
    const poured = h && !intro ? pourFor([{ role, leader: true, brew: broughtBrew(p) }]) : null;
    const brew = poured?.brew || null;
    this.brew = brew;
    if (brew && !this.practice) spendBottle(p, brew);
    if (h) {
      const spr = test ? `${heroArt(h.race, h.cls, h.sex) || ROLES[role].sprite}${tierSuffix}` : heroSprite(h, role, p);
      loadouts[role] = { ...(loadouts[role] as object), cls: h.cls, name: h.name, sprite: spr };
    }
    const looks = Object.keys(p.collection).filter((id) => COLLECTIBLES[id] && (COLLECTIBLES[id].kind === 'cosmetic') && !p.settings.looksOff.includes(id));
    const wornSet = !!h && Object.values(worn(p, h)).some((w) => w.def.setId && SETS[w.def.setId]);
    const ghostly = intro || (looks.includes('dye.ghostly') && wornSet && !test);
    const baseId = o.dungeon || 'barrow';
    const baseDg = DUNGEONS[baseId] || BARROW;
    const dg = this.dg = o.heroic ? (heroicVersion(baseDg.id) || baseDg) : baseDg;
    const engine = DUNGEON_ENGINES[baseDg.id] || BARROW_ENGINE;
    const gilded = looks.includes('dye.ghostly.gilded') && wornSet && !test;
    if (!this.practice) countRunStart(p, dg);
    // a class's first runs glow the button whose moment has come (the trial teaches its own way)
    this.learn = h && !intro ? learnGlow(p, h.cls) : 0;
    if (h) { if (intro) markClassTrial(p, h.cls); else countClassRun(p, h.cls); }
    this.swipeHint = role === 'healer' && !intro && needsSwipeHint(p);
    app.store.save();
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
    newGame(engine, { role, loadouts, start: o.start, seed: (Math.random() * 0x7fffffff) | 1, looks, ghostly, gilded, testGear: test, heroic: !!o.heroic, swipeHint: this.swipeHint, ...(brew ? { brew, brewCol: RECIPES[brew].color } : {}) });
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
    this.root.style.setProperty('--learn', this.learn.toFixed(2));
    this.root.classList.toggle('swipe-hint', this.swipeHint);
    this.buildHud();
    resizeView();
    updateCam(0, true);
    this.lastRoom = -1;
    this.live = true; this.acc = 0;
    if (intro) this.showWelcome();
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
    const hero = this.hero(), me = this.role;
    // the trial offered on a class's first run (the run you asked for waits in `after`)
    const offer = this.after;
    const ov = $('ov-msg');
    ov.classList.add('welcome');
    $('msg-eyebrow').textContent = offer ? 'New class' : '3-Hero Co-Op Dungeons';
    $('msg-title').textContent = offer && hero ? `First time as a ${CLASSES[hero.cls as ClassId]?.name || 'new class'}?` : 'Welcome to Highfell';
    // you in the middle, in your own looks and full Epic, with the two party mates either side
    const fig = (r: RoleId): string => {
      const mine = r === me, spr = (mine && hero && heroArt(hero.race, hero.cls, hero.sex)) || ROLES[r].sprite;
      return `<div class="wk-fig ${mine ? 'lead' : 'side'}">${heroImg(spr, { cls: 'wk-img' })}<span class="wk-role"><i class="rdot ${r}"></i>${ROLES[r].title}${mine ? ' (You)' : ''}</span></div>`;
    };
    const [left, right] = (['tank', 'healer', 'dps'] as RoleId[]).filter((r) => r !== me);
    $('msg-text').innerHTML = `
      <div class="wk-stage" aria-hidden="true">
        <div class="wk-glow"></div>
        <span class="wk-stage-tag">Barrow Crypt · Trinity Party</span>
        <div class="wk-party">${fig(left)}${fig(me)}${fig(right)}</div>
      </div>
      ${offer ? '' : `<div class="wk-pills">
        <span class="wk-pill"><span class="tile">${tile('shield')}</span><b>4-Min Runs</b></span>
        <span class="wk-pill"><span class="tile">${tile('u_gravedigger')}</span><b>1/50 Uniques</b></span>
        <span class="wk-pill"><span class="tile">${tile('c_pet_keeper')}</span><b>Pets & Hearth</b></span>
      </div>`}`;
    const acts = $('msg-actions');
    acts.innerHTML = `
      <button type="button" class="btn gold big wk-btn" data-w="play">
        <span class="tile wk-ic" aria-hidden="true">${tile(offer && hero ? AB[abKey({ cls: hero.cls, role: me })].a1.key : 'cleave')}</span>
        <span class="wk-tx"><b>Play the Crypt Trial</b><small>1 minute, in full Epic gear</small></span>
      </button>
      <button type="button" class="btn big wk-btn" data-w="skip">
        <span class="tile wk-ic" aria-hidden="true">${tile('c_dwarf')}</span>
        <span class="wk-tx"><b>${offer ? 'Skip, go in' : hero ? 'Skip the trial' : 'Skip · Make My Hero'}</b><small>${offer ? 'Straight into the dungeon' : hero ? 'Straight to your Hearth' : 'Jump straight to hero creation'}</small></span>
      </button>`;
    acts.querySelector('[data-w="play"]')?.addEventListener('click', () => {
      SFX.play('ui');
      ov.classList.remove('welcome');
      ov.hidden = true;
      S.paused = false;
      this.hint('introMove');
    });
    acts.querySelector('[data-w="skip"]')?.addEventListener('click', () => {
      SFX.play('ui');
      ov.classList.remove('welcome');
      if (offer) { this.after = null; this.start(offer); return; }
      this.skipIntro();
    });
    ov.hidden = false;
    (acts.querySelector('button') as HTMLElement | null)?.focus({ preventScroll: true });
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
        const prevBest = p.bosses[`${this.dg.id}.${e.boss}`]?.pb ?? null;
        const kl = resolveKill(p, this.dg, e.boss, hero, e.time, this.lootRng);
        this.kills.push(kl);
        if (prevBest !== null && e.time < prevBest) {
          banner(`New Personal Best! ${fmtT(e.time)} (-${Math.max(1, Math.round(prevBest - e.time))}s)`, 'good', 2.8);
        }
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
    } else if (e.type === 'curse.cast' && S.player.role === 'healer' && needsCurseTip(p)) {
      finishCurseTip(p);
      banner(`Cursed! Swipe across ${e.player ? 'yourself' : e.name} to lift it.`, 'warn', 3.2);
      this.app.store.save();
    } else if (e.type === 'curse.lifted' && e.player) {
      countLift(p);
      if (this.swipeHint && !needsSwipeHint(p)) { this.swipeHint = false; S.opts.swipeHint = false; this.root.classList.remove('swipe-hint'); }
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
      const first = finishIntroRun(this.app.p);
      this.app.store.save();
      this.stop();
      this.app.reveal.showTrial(summary.time, this.hero(), first);
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
    $('ov-msg').classList.remove('welcome');
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
      this.msg({ eyebrow: 'Crypt Trial', title: 'Paused', text: `You are playing ${this.hero()?.name || 'your hero'} in full Epic gear to learn your four buttons, the dodge and teamwork.`, buttons: [
        ['Keep going', () => this.pause()],
        [SFX.on ? 'Sound off' : 'Sound on', () => { const p = this.app.p; p.settings.sound = !p.settings.sound; SFX.on = p.settings.sound; this.app.store.save(); S.paused = false; this.pause(); }],
        ['Restart the trial', () => { if (this.opts) this.start(this.opts); }],
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
    const p = S.player, A = AB[abKey(p)];
    $('frames').innerHTML = S.heroes.map((h: any) => `<li class="fr${h.isPlayer ? ' me' : ''}" data-heal="${h.role}" data-role="${h.role}">
      <span class="fr-top"><span class="fi">${tile(h.cls === 'rogue' ? 'viper' : ROLE_ICON[h.role])}</span><span class="fr-n">${h.isPlayer ? 'You' : h.name}</span><i class="ag" aria-hidden="true"></i></span>
      <span class="fb"><i class="hpf"></i><i class="abf"></i></span>${h.role === 'healer' ? '<span class="fb mp"><i class="mpf"></i></span>' : ''}${CURSE_MARK()}</li>`).join('');
    $('frames').querySelectorAll<HTMLElement>('.fr').forEach((li) => li.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (S.player.role === 'healer') mend(S.player, heroBy(li.dataset.role)); }));
    const btn = (slot: string) => {
      const def = slot === 'dodge' ? { key: 'dodge', name: 'Dodge', desc: 'Roll out of trouble.' } as { key: string; name: string; desc: string; mana?: number; hold?: boolean; combo?: string } : A[slot as 'a1'];
      const mana = slot === 'dodge' ? 0 : abMana(p, slot);
      const tip = def.combo ? `${def.name}: ${def.desc} (${def.combo})` : `${def.name}: ${def.desc}`;
      const tag = slot === 'dodge' ? 'Roll' : def.hold ? 'Block' : '';
      const kind = slot === 'dodge' ? ' roll' : def.hold ? ' hold' : slot === 'a1' && (p.role === 'tank' || p.cls === 'rogue') ? ' main' : '';
      return `<button type="button" class="ab${kind}" data-slot="${slot}" aria-label="${esc(def.name)}" title="${esc(tip)} (${KEY[slot]})">
        <span class="face">${tile(def.key)}</span><span class="sweep"></span><span class="cdn"></span><kbd>${KEY[slot]}</kbd>${mana ? `<span class="cost">${mana}</span>` : ''}${tag ? `<span class="ab-tag">${tag}</span>` : ''}<span class="c-tag" aria-hidden="true"></span><span class="glow"></span></button>`;
    };
    $('abar').innerHTML = ['a1', 'a2', 'a3', 'a4', 'dodge'].map(btn).join('');
    $('abar').querySelectorAll<HTMLElement>('.ab').forEach((b) => this.bindAbility(b, b.dataset.slot!));
    const pad = $('pad');
    if (p.role === 'healer') {
      pad.hidden = false;
      pad.innerHTML = S.heroes.map((h: any) => `<button type="button" class="pd" data-heal="${h.role}" data-role="${h.role}" aria-label="Heal ${h.isPlayer ? 'yourself' : h.name}"><span class="pd-n">${h.isPlayer ? 'You' : h.name}</span><span class="fb"><i class="hpf"></i><i class="abf"></i></span>${CURSE_MARK()}</button>`).join('');
      pad.querySelectorAll<HTMLElement>('.pd').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); mend(S.player, heroBy(b.dataset.role)); }));
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
      if (slot === 'dodge') { doDodge(p, p.intent.mx, p.intent.my); return; }
      const def = AB[abKey(p)][slot as 'a1'];
      if (def.hold) {
        IN.block = true; b.classList.add('held');
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
    const coach = this.learn > 0 && !this.tutKey ? momentFor(p) : null;
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
      el.classList.toggle('danger', h.alive && h.hp < h.maxHp * 0.15);
      const c = h.alive ? h.st.curse : null;
      el.classList.toggle('cursed', !!c);
      if (c) {
        const left = Math.max(0, CURSE_TIME - c.t), txt = String(Math.ceil(left));
        el.style.setProperty('--k', (left / CURSE_TIME).toFixed(3));
        const n = el.querySelector('.cu-t'); if (n && n.textContent !== txt) n.textContent = txt;
      }
      el.classList.toggle('teach', !!coach && coach.frame === el.dataset.role);
      el.classList.toggle('aggro', h.alive && h.role !== 'tank' && targeted.has(h.role));
      el.classList.toggle('far', p.role === 'healer' && h.alive && dist(h, p) > MEND.range);
    });
    // as the healer, a mate under 15% in a fight sets your heart going
    if (p.role === 'healer' && p.alive && S.inCombat && S.heroes.some((h: any) => h.alive && h.hp < h.maxHp * 0.15)) {
      this.beatT -= dt;
      if (this.beatT <= 0) { this.beatT = 0.85; SFX.play('heartbeat'); }
    } else this.beatT = 0;
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
      $('bb-phase').textContent = `Phase ${B.phase} of ${(S.opts.heroic && M.heroicPhases) || M.phases || 1}`;
      const enr = M.enrage || 0;
      const left = enr - ((B.ab && B.ab.t) || 0);
      const act = B.act && M.acts && M.acts[B.act.k];
      const exp = B.exposed > 0 ? 'EXPOSED! (+35% DMG)' : '';
      const head = exp || act || '';
      $('bb-sub').textContent = (head ? head + ' · ' : '') + (enr ? (left > 0 ? 'Enrage in ' + fmtT(left) : 'Enraged') : '');
      $('bb-sub').classList.toggle('hot', !!head || (enr > 0 && left <= 30));
    } else if (!bb.hidden) bb.hidden = true;
    const A = AB[abKey(p)];
    this.root.querySelectorAll<HTMLElement>('.ab').forEach((b) => {
      const slot = b.dataset.slot!;
      let cd = 0, max = 1, usable = p.alive && !p.st.stun && !p.st.caged;
      if (slot === 'dodge') { cd = p.cd.dodge; max = 1.6; }
      else { const def = A[slot as 'a1'], mana = abMana(p, slot); cd = p.cd[slot]; max = abCd(p, slot) || 1; if (def.key === 'comet' && p.cast) cd = 0; if (mana && p.mana < mana) usable = false; }
      const pr = cd > 0 ? cd / max : 0;
      const sw = b.querySelector<HTMLElement>('.sweep')!; const v = pr.toFixed(3); if (sw.dataset.p !== v) { sw.style.setProperty('--p', v); sw.dataset.p = v; }
      const cdn = b.querySelector('.cdn')!; const txt = cd > 0.95 ? String(Math.ceil(cd)) : ''; if (cdn.textContent !== txt) cdn.textContent = txt;
      // a class's first runs: only the coach's button glows; after that, every button's own combo prompt
      const teach = !!coach && coach.slot === slot;
      const ctag = teach ? coach.tag : usable && cd <= 0 && !this.learn ? comboFor(p, slot) : '';
      const tagEl = b.querySelector('.c-tag'); if (tagEl && tagEl.textContent !== ctag) tagEl.textContent = ctag;
      b.classList.toggle('dim', !usable);
      b.classList.toggle('teach', teach);
      b.classList.toggle('proc', !!ctag || (usable && cd <= 0 && !!this.tutKey && this.tutStep(this.tutKey)?.slot === slot));
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
    if (this.intro) {
      if (S.inCombat && !this.hintsDone.has('introAb') && S.mobs.some((m: any) => m.alive && m.state === 'fight' && dist(m, p) < 120)) { this.hintDone('introMove'); this.hint('introAb'); }
      if (this.hintsDone.has('introAb') && !this.hintsDone.has('slam')) {
        // a tank's lesson is peeling: one of pack C goes for a party mate so Slam can drag it back
        const loose = p.role === 'tank' && S.mobs.find((m: any) => m.alive && m.state === 'fight' && m.pack === 'C' && dist(m, p) < 160);
        const sq = heroBy('dps') || heroBy('healer');
        if (loose && sq && loose.target === p) { loose.target = sq; loose.threat[sq.id] = (loose.threat[p.id] || 0) + 500; }
        if (S.mobs.some((m: any) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && dist(m, p) < 190)) this.hint('slam');
      }
    }
    const ri = roomIndexOf(p.x, p.y);
    if (ri >= 0 && ri !== this.lastRoom) { if (this.lastRoom !== -1 && ri > this.lastRoom && !S.boss) banner(S.dg.map.rooms[ri].name, 'room', 1.8); this.lastRoom = ri; }
  }
}

/** a cursed mate's frame: the skull, its ring running down, and the seconds left (styles.css shows it) */
const CURSE_MARK = (): string => `<span class="cu" aria-hidden="true"><img src="${spriteURL('curse_skull')}" alt="" draggable="false"><b class="cu-t"></b></span>`;
function setW(el: Element | null, k: number): void { if (!el) return; const v = (clamp(k, 0, 1) * 100).toFixed(1) + '%'; const s = (el as HTMLElement).style; if (s.width !== v) s.width = v; }

/** a gold glow and combo prompt label on a button when a combo chain or reactive window is live */
function comboFor(p: any, slot: string): string {
  const def = slot === 'dodge' ? null : AB[abKey(p)][slot as 'a1'];
  if (!def) return S.hazards.some((z: any) => !z.noDmg && !(z.tankBuster && p.role === 'tank') && z.t > 0.2 && inHaz(z, p.x, p.y, p.r)) || S.rings.some((g: any) => !g.hit.has(p.id) && Math.abs(dist(p, g) - g.r) < 90) ? 'DODGE!' : '';
  const loose = () => S.mobs.some((m: any) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && !m.cage && m.forcedT <= 0 && dist(m, p) < 220);
  switch (def.key) {
    case 'slam': return loose() ? 'TAUNT!' : S.mobs.filter((m: any) => isFoe(m) && !m.cage && m.state === 'fight' && dist(m, p) < 200 + m.r).length >= 3 ? 'PULL!' : '';
    case 'shield': return S.hazards.some((z: any) => (z.tankBuster || (z.shape === 'rect' && z.src && z.src.type === 'knight')) && !z.fired && (z.followT === p || inHaz(z, p.x, p.y, p.r)) && z.warn - z.t < 0.9) ? 'BLOCK!' : '';
    case 'charge': return S.mobs.some((m: any) => isFoe(m) && m.cast && m.cast.kick && dist(m, p) < 420) ? 'KICK!' : S.mobs.some((m: any) => m.alive && m.state === 'fight' && m.target && m.target !== p && !m.M.wisp && !m.cage && dist(m, p) > 200 && dist(m, p) < 420) ? 'PEEL!' : '';
    case 'cleave': {
      const near = S.mobs.filter((m: any) => isFoe(m) && !m.cage && m.state === 'fight' && dist(m, p) < 115 + m.r);
      return near.some((m: any) => m.st && m.st.stun > 0) || near.length >= 3 ? 'CRUSH!' : near.length >= 2 ? 'CLEAVE!' : '';
    }
    case 'circle': return S.heroes.filter((a: any) => a.alive && a.hp < a.maxHp * 0.78).length >= 2 ? 'CIRCLE!' : '';
    case 'sunburst': return S.heroes.some((a: any) => a.alive && (a.st.root > 0 || a.st.haunt > 0)) ? 'CLEANSE!' : S.heroes.filter((a: any) => a.alive && a.hp < a.maxHp * 0.6).length >= 2 ? 'BURST!' : '';
    case 'ward': { const t = heroBy('tank'); return (t && t.alive && t.absorb <= 0 && S.hazards.some((z: any) => z.tankBuster && !z.fired && (z.followT === t || inHaz(z, t.x, t.y, t.r)))) ? 'SHIELD!' : ''; }
    case 'smite': return S.inCombat && !!(heroBy('tank')?.target) && S.zones.some((z: any) => z.kind === 'heal') ? 'PULSE!' : S.inCombat && S.heroes.every((a: any) => !a.alive || a.hp > a.maxHp * 0.8) && !!(heroBy('tank')?.target) ? 'SMITE!' : '';
    case 'blizzard': { const c = bestCluster(p, 120, 560); return (c && c.score >= 3) ? 'STORM!' : ''; }
    case 'nova': return S.mobs.some((m: any) => isFoe(m) && m.cast && m.cast.kick && dist(m, p) < 150 + m.r) ? 'KICK!' : S.mobs.filter((m: any) => isFoe(m) && !m.isBoss && !m.cage && m.state === 'fight' && dist(m, p) < 150 + m.r).length >= 2 ? 'FREEZE!' : '';
    case 'comet': { const t = p.picked || p.target; return (t && t.alive && t.st && t.st.freeze > 0.6) ? 'SHATTER 2×!' : ''; }
    case 'icicle': return S.mobs.some((m: any) => isFoe(m) && m.st && m.st.freeze > 0.3 && dist(m, p) < 500) ? 'SHATTER 3×!' : '';
    case 'viper': { const t = p.picked || p.target; return (t && t.alive && !t.cage && (!t.bleed || t.bleed.left < 1.8) && dist(t, p) < 110 + t.r) ? 'VENOM!' : ''; }
    case 'ambush': { const t = p.picked || p.target; return (t && t.alive && t.bleed && t.bleed.left > 0 && dist(t, p) < 110 + t.r) ? 'CRIT!' : ''; }
    case 'flurry': return S.mobs.some((m: any) => isFoe(m) && m.cast && m.cast.kick && dist(m, p) < 135 + m.r) ? 'KICK!' : S.mobs.filter((m: any) => isFoe(m) && !m.cage && m.state === 'fight' && dist(m, p) < 135 + m.r).length >= 2 ? 'FLURRY!' : '';
    case 'shadowstep': { const t = p.picked || p.target; return (t && t.alive && dist(t, p) > 105 + t.r && dist(t, p) <= 340 + t.r) ? 'BLINK!' : ''; }
  }
  return '';
}
