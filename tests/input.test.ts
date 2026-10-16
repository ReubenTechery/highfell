/// <reference types="node" />
/**
 * The run's touch controls, driven without a browser: a stand-in layer takes the pointer events, and the view
 * is set up like a phone held upright (390 by 844) with the hero a little left of centre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { makeChain } from '../src/dungeon/mobs.js';
import { VIEW, toScreen } from '../src/dungeon/render.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { IN, bindInput, resetInput } from '../src/ui/input';

type Handler = (e: unknown) => void;
const on: Record<string, Handler> = {};
const layer = { addEventListener: (type: string, fn: Handler) => { on[type] = fn; }, setPointerCapture: () => {} } as unknown as HTMLElement;
(globalThis as unknown as { window: unknown }).window = { addEventListener: () => {} };
VIEW.cv = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 844 }) } as unknown as typeof VIEW.cv;
bindInput(layer, { active: () => true, stick: () => {}, hintDone: () => {}, holdBtn: () => {}, pause: () => {} });
const touch = (type: string, x: number, y: number) => on[type]({ pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, preventDefault: () => {} });

/** a run as `role`, with a chain hanging straight down through the bottom-left of the screen */
function chainedRun(role: string) {
  newGame(BARROW_ENGINE, { role, seed: 99, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: {} });
  resetInput();
  const s = S as any;
  const me = s.player, dps = s.heroes.find((h: any) => h.role === 'dps'), boss = s.packs[0].mobs[0];
  me.x = 500; me.y = 5000;
  Object.assign(VIEW, { W: 390, H: 844, scale: 0.7, fx: 156, fy: 506, cam: { x: 500, y: 4960 } });
  // the chain runs from just above the boss's shoulder down to the DPS's chest, at world x 460
  boss.x = 390; boss.y = 5160; dps.x = 460; dps.y = 5400;
  const ch: any = makeChain(boss, dps);
  return { s, ch, at: toScreen(460, 5230) };
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
