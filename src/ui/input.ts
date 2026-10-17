/**
 * Controls for a run. Phone: left thumb moves, swipe anywhere to dodge, buttons on the right, drag
 * an aimed button to place it, tap a name to heal, swipe through wisps and chains, tap cages. A touch
 * that lands on a cage, a chain or a wisp is never taken as the move stick, wherever it is, and a healer's
 * swipe that starts as the move stick still cuts what it crosses.
 * Keyboard: WASD or arrows, Space dodges, each class's buttons on E, Q, F and R (src/content/keys.ts; the
 * tank holds Q to block) and 1 to 4 as well, Z X C heal the tank, you and the DPS, Esc pauses. Chains and wisps
 * are cut with a mouse drag. Every press goes through press.js: an early one waits and fires on time instead
 * of being thrown away. A held touch button repeats; a held key fires once, as in WoW.
 * A Crypt Trial lesson pauses the run until you press its own button (or its key): a touch, a swipe or
 * a click on the dungeon does nothing while it waits.
 */
import { dist, distXY } from '../core/math';
import { AB, abKey } from '../content/roles';
import { S, emit } from '../dungeon/state.js';
import { fx, killMob } from '../dungeon/entities.js';
import { autoTarget, bestCluster, clampRange, doDodge, heroBy, isFoe } from '../dungeon/heroes.js';
import { heroAt } from '../dungeon/duo.js';
import { chainEnds, cutChain, liftCurse, mashCage as mashEngine } from '../dungeon/mobs.js';
import { AIM, VIEW, toWorld } from '../dungeon/render.js';
import { press } from '../dungeon/press.js';
import { MEND_KEYS, bindOf, slotForKey, usesShift, type BindSlot } from '../content/keys';
import { ownKeys } from './keybinds';
import { segPointDist, segsCross } from '../dungeon/world.js';

type Pt = { x: number; y: number; t: number };
export interface Aim { slot: string; id: number; sx: number; sy: number; cx: number; cy: number; live: boolean; mouse?: boolean; mx?: number; my?: number }
export const IN = {
  keys: {} as Record<string, boolean>,
  stick: null as null | { id: number; ox: number; oy: number; x: number; y: number },
  gest: new Map<number, { pts: Pt[]; sliced: boolean }>(),
  aim: null as Aim | null,
  block: false,
  mouse: null as null | { x: number; y: number },
  /** touch buttons held down: each presses again whenever it can (press.js) */
  held: new Set<string>(),
};
export function resetInput(): void { IN.keys = {}; IN.stick = null; IN.gest.clear(); IN.aim = null; IN.block = false; IN.held.clear(); }

/** what the screen layer does with input it does not own */
export interface InputUI {
  active(): boolean;
  stick(s: typeof IN.stick): void;
  hintDone(key: string): void;
  holdBtn(slot: string, on: boolean): void;
  /** a button's key is down: the button shrinks under it, as under a finger */
  downBtn?(slot: string, on: boolean): void;
  pause(): void;
  /** a Crypt Trial lesson is waiting on a button: this one's key was pressed; true when it was the right one */
  onTutInput?(slot: string): boolean;
}

/** read the controls into the player's hero, every frame (HOOKS.playerIntent) */
export function playerIntent(h: any): void {
  let mx = 0, my = 0;
  const k = IN.keys;
  if (k.KeyA || k.ArrowLeft) mx -= 1;
  if (k.KeyD || k.ArrowRight) mx += 1;
  if (k.KeyW || k.ArrowUp) my -= 1;
  if (k.KeyS || k.ArrowDown) my += 1;
  if (mx || my) { const l = Math.hypot(mx, my); mx /= l; my /= l; }
  if (IN.stick) {
    const s = IN.stick, dx = s.x - s.ox, dy = s.y - s.oy, l = Math.hypot(dx, dy), R = 56;
    if (l > 7) { const m = Math.min(1, l / R); mx = (dx / l) * m; my = (dy / l) * m; }
  }
  h.intent.mx = mx; h.intent.my = my;
  h.intent.block = IN.block;
  h.holdFire = false;
  for (const slot of IN.held) press(h, slot, h.picked && isFoe(h.picked) ? h.picked : null, true);
}

/** where an aimed button lands: dragged, under the mouse, or picked for you on a quick tap */
export function aimPoint(a: Aim): { x: number; y: number } {
  const h = S.player, def = AB[abKey(h)][a.slot as 'a1'];
  const range = def.range || 520;
  if (a.mouse && a.mx !== undefined) return clampRange(h, a.mx, a.my, range);
  const dx = a.cx - a.sx, dy = a.cy - a.sy, l = Math.hypot(dx, dy);
  if (l < 14) {
    if (def.key === 'blizzard') { const c = bestCluster(h, 120, 560); if (c) return clampRange(h, c.x, c.y, range); const t = autoTarget(h); if (t) return clampRange(h, t.x, t.y, range); return { x: h.x, y: h.y - 160 }; }
    const t = heroBy('tank'); if (t && t.alive && dist(t, h) < range) return { x: t.x, y: t.y }; return { x: h.x, y: h.y };
  }
  const m = (Math.min(1, l / 92) * range);
  return { x: h.x + (dx / l) * m, y: h.y + (dy / l) * m };
}
AIM.get = () => (IN.aim && IN.aim.live && S ? { slot: IN.aim.slot, ...aimPoint(IN.aim) } : null);

const localXY = (e: PointerEvent | MouseEvent) => { const r = VIEW.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
const inStickZone = (x: number, y: number) => x < VIEW.W * 0.52 && y > VIEW.H * 0.42;
/** the two straight halves of a chain as drawn (it sags in the middle) */
function chainHalves(ch: any): [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] {
  const e = chainEnds(ch);
  return [{ x: e.ax, y: e.ay }, { x: (e.ax + e.bx) / 2, y: (e.ay + e.by) / 2 + 22 }, { x: e.bx, y: e.by }];
}
/** a mate's cage under this world point */
const cageAt = (w: { x: number; y: number }) => S.mobs.find((m: any) => m.alive && m.cage && m.hero !== S.player && distXY(w.x, w.y, m.x, m.y - 50) < 80) || null;
/** is there a chain, a wisp or a cursed hero under this screen point? Only the healer can swipe them; for others it is the stick/dodge */
function onMechanic(x: number, y: number): boolean {
  if (!S || !S.player || S.player.role !== 'healer') return false;
  const w = toWorld(x, y);
  for (const m of S.mobs) if (m.alive && m.M.wisp && distXY(w.x, w.y, m.x, m.y - 40) < 70) return true;
  for (const h of S.heroes) if (h.alive && h.st.curse && distXY(w.x, w.y, h.x, h.y - 40) < 60) return true;
  for (const ch of S.chains) {
    const [a, mid, b] = chainHalves(ch);
    if (segPointDist(a.x, a.y, mid.x, mid.y, w.x, w.y) < 60 || segPointDist(mid.x, mid.y, b.x, b.y, w.x, w.y) < 60) return true;
  }
  return false;
}

/** a button pressed by its key or mouse button: the shield is held, a dodge rolls, the rest press through the beat */
function pressBound(h: any, slot: BindSlot, ui: InputUI): void {
  if (slot === 'dodge') { doDodge(h, h.intent.mx, h.intent.my); return; }
  const def = AB[abKey(h)][slot];
  if (def.hold) { IN.block = true; ui.holdBtn(slot, true); return; }
  ui.downBtn?.(slot, true);
  let aim: unknown = null;
  if (def.aim && IN.mouse) aim = toWorld(IN.mouse.x, IN.mouse.y);
  else if (!def.aim && h.picked && isFoe(h.picked)) aim = h.picked;
  press(h, slot, aim);
}
/** a bound button let go: the shield comes down, and the button comes back up */
function releaseBound(slot: BindSlot | null, ui: InputUI): void {
  if (!slot || slot === 'dodge' || !S || !S.player) return;
  if (AB[abKey(S.player)][slot]?.hold) { IN.block = false; ui.holdBtn(slot, false); } else ui.downBtn?.(slot, false);
}
/** the button a mouse button is bound to in a run, if any (the left button picks and Mends, never a button) */
const mouseSlot = (e: MouseEvent): BindSlot | null => (e.button > 0 && S && S.player ? slotForKey(abKey(S.player), `Mouse${e.button}`, ownKeys(abKey(S.player))) : null);

export function bindInput(layer: HTMLElement, ui: InputUI): void {
  // a side button bound to a button never sends the browser Back or Forward out of the run
  for (const ev of ['mouseup', 'auxclick'] as const) window.addEventListener(ev, (e) => { if (ui.active() && mouseSlot(e)) e.preventDefault(); });
  layer.addEventListener('pointerdown', (e) => {
    if (!S || S.over || S.paused) return;
    e.preventDefault();
    // a mouse button you bound presses its button (held, the shield blocks until it's let go)
    const ms = e.pointerType === 'mouse' ? mouseSlot(e) : null;
    if (ms) {
      if (S.player.alive && S.player.st.caged) { mashCage(S.player, ui); return; }
      pressBound(S.player, ms, ui);
      const up = (ev: PointerEvent) => { if (ev.pointerId !== e.pointerId) return; releaseBound(ms, ui); layer.removeEventListener('pointerup', up); layer.removeEventListener('pointercancel', up); };
      try { layer.setPointerCapture(e.pointerId); } catch { /* fine */ }
      layer.addEventListener('pointerup', up); layer.addEventListener('pointercancel', up);
      return;
    }
    const p = localXY(e);
    // caged: every touch anywhere is a tap on the bars. A touch on a mate's cage hits it, wherever it is.
    if (S.player.alive && S.player.st.caged) { mashCage(S.player, ui); return; }
    const cage = S.player.alive ? cageAt(toWorld(p.x, p.y)) : null;
    if (cage) { mashCage(cage.hero, ui); return; }
    if (e.pointerType !== 'mouse' && !IN.stick && inStickZone(p.x, p.y) && !onMechanic(p.x, p.y)) {
      IN.stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
      try { layer.setPointerCapture(e.pointerId); } catch { /* fine */ }
      ui.stick(IN.stick);
      return;
    }
    IN.gest.set(e.pointerId, { pts: [{ x: p.x, y: p.y, t: performance.now() }], sliced: false });
    try { layer.setPointerCapture(e.pointerId); } catch { /* fine */ }
  });
  layer.addEventListener('pointermove', (e) => {
    const p = localXY(e);
    if (e.pointerType === 'mouse') IN.mouse = p;
    if (IN.stick && IN.stick.id === e.pointerId) {
      // the healer's finger still cuts what it crosses, and from then on the touch is a swipe, not a walk
      if (!S?.paused && trySlice(IN.stick, p, ui)) {
        IN.stick = null; ui.stick(null);
        IN.gest.set(e.pointerId, { pts: [{ x: p.x, y: p.y, t: performance.now() }], sliced: true });
        return;
      }
      IN.stick.x = p.x; IN.stick.y = p.y; ui.stick(IN.stick); return;
    }
    const g = IN.gest.get(e.pointerId);
    if (!g) return;
    const last = g.pts[g.pts.length - 1];
    g.pts.push({ x: p.x, y: p.y, t: performance.now() });
    if (!S?.paused && trySlice(last, p, ui)) g.sliced = true;
  });
  const end = (e: PointerEvent) => {
    if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; ui.stick(null); return; }
    const g = IN.gest.get(e.pointerId);
    if (!g) return;
    IN.gest.delete(e.pointerId);
    if (!S || S.over || S.paused) return;
    const a = g.pts[0], b = g.pts[g.pts.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), dur = b.t - a.t;
    if (g.sliced) return;
    if (len > 34 && dur < 340) { doDodge(S.player, dx, dy); return; }
    if (len < 16 && dur < 420) tapWorld(toWorld(b.x, b.y), ui);
  };
  layer.addEventListener('pointerup', end);
  layer.addEventListener('pointercancel', end);
  layer.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') IN.mouse = null; });
  layer.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    const tg = e.target as HTMLElement | null;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'SELECT' || tg.tagName === 'TEXTAREA')) return;
    if (!S || !ui.active()) return;
    const c = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c) && !S.over) e.preventDefault();
    if (c === 'Escape' || c === 'KeyP') { ui.pause(); return; }
    const h = S.player, k = abKey(h), own = ownKeys(k);
    // your keys (Settings), with Shift held as part of the key; a browser shortcut (Ctrl+F, Cmd+R) is never a button
    const slot = e.ctrlKey || e.metaKey || e.altKey ? null : slotForKey(k, bindOf(c, e.shiftKey), own);
    // Shift on its own dodges too, unless one of your buttons uses it
    const dodge = slot === 'dodge' || ((c === 'ShiftLeft' || c === 'ShiftRight') && !usesShift(k, own));
    // a lesson's own key is its button on a keyboard; nothing else carries it on
    if (S.paused && ui.onTutInput) {
      if (dodge) { if (ui.onTutInput('dodge')) return; }
      if (slot && slot !== 'dodge' && ui.onTutInput(slot)) return;
    }
    if (S.paused || S.over) return;
    // a held key fires once, as in WoW: every press counts. The shield's key is the exception: held, it blocks,
    // so its repeats keep the shield up if something let it down (a Crypt Trial lesson does)
    if (e.repeat) {
      if (slot && slot !== 'dodge' && AB[k][slot].hold && !h.st.caged) { IN.block = true; ui.holdBtn(slot, true); }
      return;
    }
    IN.keys[c] = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) ui.hintDone('introMove');
    if (h.st.caged && (dodge || slot || c.startsWith('Digit') || c.startsWith('Key'))) { mashCage(h, ui); return; }
    if (dodge) { doDodge(h, h.intent.mx, h.intent.my); return; }
    if (slot) { pressBound(h, slot, ui); return; }
    if (h.role === 'healer' && MEND_KEYS[c]) { const t = heroBy(MEND_KEYS[c]); if (t) press(h, 'mend', t); return; }
  });
  window.addEventListener('keyup', (e) => {
    IN.keys[e.code] = false;
    if (!S || !S.player) return;
    const k = abKey(S.player), own = ownKeys(k);
    // let go of Shift first or the key first: either way the button it pressed comes back up
    for (const b of new Set([bindOf(e.code, e.shiftKey), e.code, `Shift+${e.code}`])) releaseBound(slotForKey(k, b, own), ui);
  });
  window.addEventListener('blur', () => { IN.keys = {}; IN.block = false; IN.stick = null; IN.held.clear(); ui.stick(null); });
}

/** does the segment a→b touch the box? (screen points; the box as getBoundingClientRect gives it) */
export function segHitsRect(a: { x: number; y: number }, b: { x: number; y: number }, r: { left: number; top: number; right: number; bottom: number }): boolean {
  const inside = (q: { x: number; y: number }) => q.x >= r.left && q.x <= r.right && q.y >= r.top && q.y <= r.bottom;
  if (inside(a) || inside(b)) return true;
  const c = [{ x: r.left, y: r.top }, { x: r.right, y: r.top }, { x: r.right, y: r.bottom }, { x: r.left, y: r.bottom }];
  return c.some((q, i) => segsCross(a, b, q, c[(i + 1) % 4]));
}
/** how far a touch on the party frames travels before it counts as a swipe (a tap that wobbles still only heals) */
const FRAME_SWIPE = 24;
/** A healer's swipe across party frames lifts the curse of each cursed mate whose frame it crosses. A tap on a
 *  frame heals (the frame's own pointerdown); this watches from the list, so a swipe can start on one frame and
 *  run on into the next. */
export function bindFrameSwipes(list: HTMLElement): void {
  let g: { id: number; x0: number; y0: number } | null = null;
  list.addEventListener('pointerdown', (e) => {
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
    try { list.setPointerCapture(e.pointerId); } catch { /* fine */ }
  }, true);
  list.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id || !S || S.over || S.paused) return;
    const me = S.player;
    if (!me.alive || me.st.caged || me.role !== 'healer') return;
    const a = { x: g.x0, y: g.y0 }, b = { x: e.clientX, y: e.clientY };
    if (Math.hypot(b.x - a.x, b.y - a.y) < FRAME_SWIPE) return;
    list.querySelectorAll<HTMLElement>('[data-seat]').forEach((el) => {
      const h = heroAt(Number(el.dataset.seat));
      if (h && h.alive && h.st.curse && segHitsRect(a, b, el.getBoundingClientRect())) liftCurse(h, me);
    });
  });
  const end = (e: PointerEvent) => { if (g && e.pointerId === g.id) g = null; };
  list.addEventListener('pointerup', end);
  list.addEventListener('pointercancel', end);
}

/** a swipe by the healer that crosses a wisp or a chain cuts it, and one across a cursed hero lifts the curse */
export function trySlice(a: { x: number; y: number }, b: { x: number; y: number }, _ui: InputUI): boolean {
  if (!S || !S.player.alive || S.player.st.caged || S.player.role !== 'healer') return false;
  const p = toWorld(a.x, a.y), q = toWorld(b.x, b.y);
  let hit = false;
  for (const m of S.mobs) {
    if (!m.alive || !m.M.wisp) continue;
    if (segPointDist(p.x, p.y, q.x, q.y, m.x, m.y - 40) < m.r + 26) { killMob(m, S.player); hit = true; S.stats.slices = (S.stats.slices || 0) + 1; emit({ type: 'wisp.sliced', player: true }); }
  }
  for (const ch of S.chains.slice()) {
    const [ca, mid, cb] = chainHalves(ch);
    if (segsCross(p, q, ca, mid) || segsCross(p, q, mid, cb)) { cutChain(ch, S.player); hit = true; }
  }
  for (const h of S.heroes) {
    if (h.alive && h.st.curse && segPointDist(p.x, p.y, q.x, q.y, h.x, h.y - 40) < h.r + 26) { liftCurse(h, S.player); hit = true; }
  }
  if (hit) {
    const trail = S.looks && S.looks.has('cosmetic.trail_wisp');
    fx({ type: 'swipe', x: p.x, y: p.y, x2: q.x, y2: q.y, dur: trail ? 0.45 : 0.2, col: trail ? '#C8F5E8' : undefined });
  }
  return hit;
}
/** a tap on a cage, by you inside it or by you breaking a mate out (h is whoever is in the cage) */
export function mashCage(h: any, _ui?: InputUI): void {
  if (!h || !h.st.caged) return;
  mashEngine(h);
}
export function tapWorld(w: { x: number; y: number }, ui: InputUI): void {
  const h = S.player;
  if (h.st.caged) { mashCage(h, ui); return; }
  const cage = cageAt(w);
  if (cage) { mashCage(cage.hero, ui); return; }
  let best: any = null, bd = 1e9;
  for (const a of S.heroes) { if (!a.alive) continue; const d = distXY(w.x, w.y, a.x, a.y - 40); if (d < 52 && d < bd) { bd = d; best = a; } }
  if (best && h.role === 'healer') { press(h, 'mend', best); return; }
  let mb: any = null; bd = 1e9;
  for (const m of S.mobs) { if (!isFoe(m) || m.cage) continue; const d = distXY(w.x, w.y, m.x, m.y - (m.isBoss ? 120 : m.M.big ? 70 : 40)); const r = m.isBoss ? 120 : m.M.big ? 70 : 44; if (d < r && d < bd) { bd = d; mb = m; } }
  if (mb) { h.picked = mb; fx({ type: 'ring', x: mb.x, y: mb.y, r0: 10, r1: mb.r + 30, col: '#FF6B5E', dur: 0.25, w: 4, ground: true }); }
}
