/// <reference types="node" />
/**
 * The run's touch controls, driven without a browser: a stand-in layer takes the pointer events, and the view
 * is set up like a phone held upright (390 by 844) with the hero a little left of centre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S, setHooks } from '../src/dungeon/state.js';
import { curseHero, makeChain } from '../src/dungeon/mobs.js';
import { VIEW, toScreen } from '../src/dungeon/render.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { IN, bindFrameSwipes, bindInput, playerIntent, resetInput } from '../src/ui/input';
import { keyLabel, rebind, slotForKey } from '../src/content/keys';
import { ownKeys, resetKeys, setKey } from '../src/ui/keybinds';
import { BEAT } from '../src/content/roles';

type Handler = (e: unknown) => void;
const on: Record<string, Handler> = {};
const layer = { addEventListener: (type: string, fn: Handler) => { on[type] = fn; }, setPointerCapture: () => {} } as unknown as HTMLElement;
// the keyboard: the first bindInput's window listeners, so a test can press keys
const win: Record<string, Handler> = {};
(globalThis as unknown as { window: unknown }).window = { addEventListener: (type: string, fn: Handler) => { if (!win[type]) win[type] = fn; } };
const key = (type: 'keydown' | 'keyup', code: string, repeat = false, shiftKey = false) => win[type]({ code, repeat, shiftKey, target: null, preventDefault: () => {} });
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };
VIEW.cv = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 844 }) } as unknown as typeof VIEW.cv;
bindInput(layer, { active: () => true, stick: () => {}, hintDone: () => {}, holdBtn: () => {}, pause: () => {} });
const touch = (type: string, x: number, y: number) => on[type]({ pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, preventDefault: () => {} });

/** a run as `role` on the phone view; world (460, 5230) is in the walk stick's bottom-left part of the screen */
function phoneRun(role: string) {
  newGame(BARROW_ENGINE, { role, seed: 99, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: {} });
  resetInput();
  const s = S as any;
  s.player.x = 500; s.player.y = 5000;
  Object.assign(VIEW, { W: 390, H: 844, scale: 0.7, fx: 156, fy: 506, cam: { x: 500, y: 4960 } });
  return { s, dps: s.heroes.find((h: any) => h.role === 'dps'), mob: s.packs[0].mobs[0], at: toScreen(460, 5230) };
}
/** the same, with a chain hanging straight down through that spot */
function chainedRun(role: string) {
  const { s, dps, mob, at } = phoneRun(role);
  // the chain runs from just above the mob's shoulder down to the DPS's chest, at world x 460
  mob.x = 390; mob.y = 5160; dps.x = 460; dps.y = 5400;
  const ch: any = makeChain(mob, dps);
  return { s, ch, at };
}

test('a healer swipe that starts on the left, where the walk stick lives, still cuts the chain', () => {
  const { s, ch, at } = chainedRun('healer');
  assert.ok(at.x < 390 * 0.52 && at.y > 844 * 0.42, 'the chain crosses the walk stick half of the screen');
  // start about 115 world units left of the chain (not on it), so the touch becomes the walk stick
  const x0 = at.x - 80;
  touch('pointerdown', x0, at.y);
  assert.ok(IN.stick, 'the touch starts as the walk stick');
  for (let i = 1; i <= 6; i++) touch('pointermove', x0 + i * 28, at.y);
  assert.ok(ch.dead, 'the chain is cut');
  assert.equal(s.chains.length, 0);
  assert.equal(IN.stick, null, 'once it cuts, the touch is a swipe, not a walk');
  touch('pointerup', x0 + 168, at.y);
  assert.equal(s.player.dodgeT > 0, false, 'a swipe that cut something never dodges');
});

test('the same swipe by anyone else is just a walk: only the healer cuts chains', () => {
  const { s, ch, at } = chainedRun('dps');
  const x0 = at.x - 80;
  touch('pointerdown', x0, at.y);
  for (let i = 1; i <= 6; i++) touch('pointermove', x0 + i * 28, at.y);
  assert.ok(!ch.dead, 'the chain holds');
  assert.equal(s.chains.length, 1);
  assert.ok(IN.stick, 'still walking');
  touch('pointerup', x0 + 168, at.y);
  assert.equal(IN.stick, null);
});

test('a healer swipe across a cursed mate lifts the curse, even one that starts on the left', () => {
  const { dps, mob, at } = phoneRun('healer');
  dps.x = 460; dps.y = 5270;
  curseHero(mob, dps);
  const x0 = at.x - 80;
  touch('pointerdown', x0, at.y);
  assert.ok(IN.stick, 'it starts as the walk stick: the touch is not on the mate');
  for (let i = 1; i <= 6; i++) touch('pointermove', x0 + i * 28, at.y);
  assert.equal(dps.st.curse, null, 'the curse is lifted');
  touch('pointerup', x0 + 168, at.y);
});

test('a healer swipe across a cursed mate\'s party frame lifts it, even one that starts on another frame; a wobbly tap does not', () => {
  const { dps, mob } = phoneRun('healer');
  const fh: Record<string, (e: unknown) => void> = {};
  // the heal pad, bottom right on a phone: one frame per mate, stacked, each for its seat (the old three: tank 0,
  // healer 1, DPS 2)
  const frame = (role: string, seat: number, top: number) => ({ dataset: { role, seat: String(seat) }, getBoundingClientRect: () => ({ left: 240, right: 380, top, bottom: top + 50 }) });
  const frames = [frame('tank', 0, 530), frame('healer', 1, 586), frame('dps', 2, 642)];
  bindFrameSwipes({ addEventListener: (t: string, fn: (e: unknown) => void) => { fh[t] = fn; }, setPointerCapture: () => {}, querySelectorAll: () => frames } as unknown as HTMLElement);
  const at = (x: number, y: number) => ({ pointerId: 3, clientX: x, clientY: y });
  curseHero(mob, dps);
  fh.pointerdown(at(300, 660)); fh.pointermove(at(306, 664)); fh.pointerup(at(306, 664));
  assert.ok(dps.st.curse, 'a tap that wobbles a few pixels only heals');
  fh.pointerdown(at(300, 600));
  for (let y = 620; y <= 720; y += 20) fh.pointermove(at(300, y));
  fh.pointerup(at(300, 720));
  assert.equal(dps.st.curse, null, 'swiping from your own frame down across theirs lifts it');
});

test('while a Crypt Trial lesson waits on its button, a swipe or a tap on the dungeon does nothing', () => {
  const { s } = phoneRun('tank');
  // a second stand-in layer, for a screen with a lesson showing: it asks the lesson about every key it gets
  const tut: Record<string, Handler> = {};
  const asked: string[] = [];
  bindInput({ addEventListener: (type: string, fn: Handler) => { tut[type] = fn; }, setPointerCapture: () => {} } as unknown as HTMLElement,
    { active: () => true, stick: () => {}, hintDone: () => {}, holdBtn: () => {}, pause: () => {}, onTutInput: (slot) => { asked.push(slot); return false; } });
  const fire = (type: string, x: number, y: number) => tut[type]({ pointerId: 9, pointerType: 'touch', clientX: x, clientY: y, preventDefault: () => {} });
  s.paused = true;
  s.player.cd.dodge = 0;
  // a quick flick across the right half (a dodge in a run), then a tap
  fire('pointerdown', 260, 300); fire('pointermove', 300, 300); fire('pointermove', 340, 300); fire('pointerup', 340, 300);
  fire('pointerdown', 250, 400); fire('pointerup', 250, 400);
  assert.equal(s.player.dodgeT > 0, false, 'no dodge');
  assert.deepEqual(asked, [], 'the lesson is never told a touch on the dungeon was its button');
  assert.equal(IN.gest.size, 0, 'nothing is left half-read for when the run carries on');
  assert.equal(IN.stick, null);
});

/* ---------- the beat and the press queue (combat plan, stage 1) ---------- */

/** a run as `role` with the hooks the run screen sets: what buzzed, what pulsed, what fired */
function keyRun(role: string, cls?: string) {
  newGame(BARROW_ENGINE, { role, seed: 99, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: cls ? { [role]: { cls } } : {} });
  resetInput();
  const s = S as any;
  const log = { nope: [] as string[], early: [] as string[], fired: [] as string[] };
  setHooks({ nope: (x: string) => log.nope.push(x), early: (x: string) => log.early.push(x), fired: (x: string) => log.fired.push(x), playerIntent });
  return { s, me: s.player, mob: s.packs[0].mobs[0], log };
}

test('each class\'s buttons sit on E, Q, F and R, with the main button on E, and 1 to 4 still work', () => {
  assert.equal(slotForKey('tank', 'KeyE'), 'a1', 'Cleave');
  assert.equal(slotForKey('tank', 'KeyQ'), 'a4', 'the shield');
  assert.equal(slotForKey('tank', 'KeyF'), 'a2', 'Charge');
  assert.equal(slotForKey('healer', 'KeyE'), 'a4', 'Smite');
  assert.equal(slotForKey('dps', 'KeyE'), 'a4', 'Icicle');
  assert.equal(slotForKey('rogue', 'KeyE'), 'a1', 'Viper Blades');
  assert.equal(slotForKey('rogue', 'Digit3'), 'a3');
  assert.equal(slotForKey('tank', 'KeyW'), null, 'WASD still walks');
});

test('your keys: a rebound key fires its button, a key already in use swaps, Shift and a key is its own key, and Shift then stops dodging', () => {
  const { me, log } = keyRun('tank');
  setKey('tank', 'a1', 'KeyG');
  assert.equal(slotForKey('tank', 'KeyG', ownKeys('tank')), 'a1');
  assert.equal(keyLabel('tank', 'a1', ownKeys('tank')), 'G');
  key('keydown', 'KeyG'); key('keyup', 'KeyG');
  assert.deepEqual(log.fired, ['a1'], 'G is Cleave now');
  // putting Cleave on Q moves the shield to G, Cleave's old key: no two buttons share one
  assert.deepEqual(rebind('tank', ownKeys('tank'), 'a1', 'KeyQ'), { a1: 'KeyQ', a4: 'KeyG' });
  resetKeys('tank');
  assert.deepEqual(ownKeys('tank'), {});
  // Charge on Shift+E: Shift no longer dodges, Shift+E Charges and E alone still Cleaves
  setKey('tank', 'a2', 'Shift+KeyE');
  log.fired.length = 0; me.beat = 0;
  const dodgeCd = me.cd.dodge;
  key('keydown', 'ShiftLeft', false, true);
  assert.equal(me.cd.dodge, dodgeCd, 'Shift on its own did not roll');
  key('keydown', 'KeyE', false, true); key('keyup', 'KeyE', false, true); key('keyup', 'ShiftLeft');
  assert.deepEqual(log.fired, ['a2'], 'Shift+E is Charge');
  step(1.2);
  key('keydown', 'KeyE'); key('keyup', 'KeyE');
  assert.deepEqual(log.fired, ['a2', 'a1'], 'E alone is still Cleave');
  resetKeys('tank');
  // with nothing on Shift, it dodges as ever
  key('keydown', 'ShiftLeft', false, true); key('keyup', 'ShiftLeft');
  assert.ok(me.dodgeT > 0 || me.cd.dodge > 0, 'Shift rolls');
});

test('a press a little early waits and fires on time; one far too early is let go with a pulse, not a buzz', () => {
  const { me, log } = keyRun('tank');
  me.cd.a1 = 0.3;
  key('keydown', 'KeyE'); key('keyup', 'KeyE');
  assert.equal(me.next?.slot, 'a1', 'the press waits');
  step(0.2);
  assert.ok(me.next, 'still waiting');
  step(0.15);
  assert.equal(me.next, null);
  assert.deepEqual(log.fired, ['a1'], 'Cleave went off on time');
  me.cd.a1 = 0.6; me.beat = 0;
  key('keydown', 'KeyE'); key('keyup', 'KeyE');
  assert.equal(me.next, null, 'too early to keep');
  assert.deepEqual(log.early, ['a1'], 'the button pulses');
  assert.deepEqual(log.nope, [], 'nothing buzzed');
});

test('the four buttons share the beat; Charge never waits for it', () => {
  const { me, mob, log } = keyRun('tank');
  mob.x = me.x; mob.y = me.y - 300; me.picked = mob;
  key('keydown', 'KeyR'); key('keyup', 'KeyR');
  assert.deepEqual(log.fired, ['a3'], 'Slam');
  assert.ok(me.beat > 0, 'the beat runs');
  key('keydown', 'KeyF'); key('keyup', 'KeyF');
  assert.deepEqual(log.fired, ['a3', 'a2'], 'Charge goes at once, beat or no beat');
  // Cleave pressed during the Charge waits, then lands as the Charge does
  key('keydown', 'KeyE'); key('keyup', 'KeyE');
  assert.equal(log.fired.length, 2);
  for (let i = 0; i < 120 && log.fired.length < 3; i++) update(1 / 60);
  assert.deepEqual(log.fired, ['a3', 'a2', 'a1'], 'Cleave fired after the Charge, once the beat was up');
  assert.equal(me.dash, null, 'the Charge had landed');
  assert.ok(me.cd.a3 > 6 - BEAT.len - 0.6, 'and not before the beat was over');
});

test('a held key fires once, as in WoW; a held touch button presses again whenever it can', () => {
  const { me, log } = keyRun('tank');
  key('keydown', 'KeyE');
  for (let i = 0; i < 180; i++) { if (i % 3 === 0) key('keydown', 'KeyE', true); update(1 / 60); }
  key('keyup', 'KeyE');
  assert.deepEqual(log.fired, ['a1'], 'one Cleave for one press, however long the key is held');
  log.fired.length = 0; me.cd.a1 = 0; me.beat = 0;
  IN.held.add('a1');
  step(2.5);
  IN.held.delete('a1');
  assert.deepEqual(log.fired, ['a1', 'a1', 'a1'], 'held for 2.5 s, Cleave fires once a beat: three times');
  assert.deepEqual(log.nope, [], 'and nothing buzzed while it waited');
});

test('holding the shield and Cleave together never opens a free perfect block', () => {
  const { me, log } = keyRun('tank');
  key('keydown', 'KeyQ');
  step(0.1);
  assert.ok(me.blocking, 'the shield is up');
  for (let i = 0; i < 20; i++) { key('keydown', 'KeyE'); key('keyup', 'KeyE'); step(0.1); }
  assert.deepEqual(log.fired, [], 'Cleave waits while the shield is up');
  assert.ok(me.blocking && me.blockT > 1.5, 'the shield never dropped, so its perfect window never reopened');
  // a Crypt Trial lesson lets the shield down after a moment; the held key's repeats put it back up
  IN.block = false;
  key('keydown', 'KeyQ', true);
  assert.ok(IN.block, 'the held shield key raises the shield again');
  key('keyup', 'KeyQ');
  step(0.1);
  key('keydown', 'KeyE'); key('keyup', 'KeyE');
  step(0.05);
  assert.deepEqual(log.fired, ['a1'], 'shield down: Cleave goes');
});
