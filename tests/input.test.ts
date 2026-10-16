/// <reference types="node" />
/**
 * The run's touch controls, driven without a browser: a stand-in layer takes the pointer events, and the view
 * is set up like a phone held upright (390 by 844) with the hero a little left of centre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { curseHero, makeChain } from '../src/dungeon/mobs.js';
import { VIEW, toScreen } from '../src/dungeon/render.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { IN, bindFrameSwipes, bindInput, resetInput } from '../src/ui/input';

type Handler = (e: unknown) => void;
const on: Record<string, Handler> = {};
const layer = { addEventListener: (type: string, fn: Handler) => { on[type] = fn; }, setPointerCapture: () => {} } as unknown as HTMLElement;
(globalThis as unknown as { window: unknown }).window = { addEventListener: () => {} };
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
  // the heal pad, bottom right on a phone: one frame per mate, stacked
  const frame = (role: string, top: number) => ({ dataset: { role }, getBoundingClientRect: () => ({ left: 240, right: 380, top, bottom: top + 50 }) });
  const frames = [frame('tank', 530), frame('healer', 586), frame('dps', 642)];
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
