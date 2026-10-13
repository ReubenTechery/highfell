/**
 * Controls for a run. Phone: left thumb moves, swipe anywhere to dodge, buttons on the right, drag
 * an aimed button to place it, tap a name to heal, swipe through wisps and chains, tap cages.
 * Keyboard: WASD or arrows, Space dodges, 1 to 4 for the buttons (hold 2 to block as the tank),
 * Z X C heal the tank, you and the DPS, E cuts a chain, Esc pauses.
 */
import { dist, distXY } from '../core/math';
import { AB } from '../content/roles';
import { S, emit } from '../dungeon/state.js';
import { bits, fx, killMob, sfx } from '../dungeon/entities.js';
import { autoTarget, bestCluster, clampRange, doDodge, heroBy, isFoe, mend, useAbility } from '../dungeon/heroes.js';
import { breakCage, chainEnds, cutChain } from '../dungeon/mobs.js';
import { AIM, VIEW, toWorld } from '../dungeon/render.js';
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
};
export function resetInput(): void { IN.keys = {}; IN.stick = null; IN.gest.clear(); IN.aim = null; IN.block = false; }

/** what the screen layer does with input it does not own */
export interface InputUI {
  active(): boolean;
  stick(s: typeof IN.stick): void;
  hintDone(key: string): void;
  holdBtn(slot: string, on: boolean): void;
  pause(): void;
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
  if (h.queued && h.gcd <= 0) { const q = h.queued; h.queued = null; mend(h, q); }
}

/** where an aimed button lands: dragged, under the mouse, or picked for you on a quick tap */
export function aimPoint(a: Aim): { x: number; y: number } {
  const h = S.player, def = AB[h.role as 'tank'][a.slot as 'a1'];
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

export function bindInput(layer: HTMLElement, ui: InputUI): void {
  layer.addEventListener('pointerdown', (e) => {
    if (!S || S.over || S.paused) return;
    e.preventDefault();
    const p = localXY(e);
    if (e.pointerType !== 'mouse' && !IN.stick && inStickZone(p.x, p.y)) {
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
    if (IN.stick && IN.stick.id === e.pointerId) { IN.stick.x = p.x; IN.stick.y = p.y; ui.stick(IN.stick); return; }
    const g = IN.gest.get(e.pointerId);
    if (!g) return;
    const last = g.pts[g.pts.length - 1];
    g.pts.push({ x: p.x, y: p.y, t: performance.now() });
    if (trySlice(last, p, ui)) g.sliced = true;
  });
  const end = (e: PointerEvent) => {
    if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; ui.stick(null); return; }
    const g = IN.gest.get(e.pointerId);
    if (!g) return;
    IN.gest.delete(e.pointerId);
    if (!S || S.over) return;
    const a = g.pts[0], b = g.pts[g.pts.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), dur = b.t - a.t;
    if (g.sliced) return;
    if (len > 34 && dur < 340) { if (doDodge(S.player, dx, dy)) ui.hintDone('dodge'); return; }
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
    if (S.paused || S.over) return;
    if (e.repeat && c !== 'Digit2') return;
    IN.keys[c] = true;
    const h = S.player;
    if (h.st.caged && (c === 'Space' || c.startsWith('Digit') || c.startsWith('Key'))) { mashCage(h, ui); return; }
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { doDodge(h, h.intent.mx, h.intent.my); ui.hintDone('dodge'); return; }
    if (c === 'Digit1' || c === 'Digit2' || c === 'Digit3' || c === 'Digit4') {
      const slot = 'a' + c.slice(5);
      const def = AB[h.role as 'tank'][slot as 'a1'];
      if (def.hold) { IN.block = true; ui.holdBtn(slot, true); ui.hintDone('block'); return; }
      let aim: unknown = null;
      if (def.aim && IN.mouse) aim = toWorld(IN.mouse.x, IN.mouse.y);
      else if (!def.aim && h.picked && isFoe(h.picked)) aim = h.picked;
      useAbility(h, slot, aim);
      return;
    }
    if (h.role === 'healer' && (c === 'KeyZ' || c === 'KeyX' || c === 'KeyC')) { const r = ({ KeyZ: 'tank', KeyX: 'healer', KeyC: 'dps' } as Record<string, string>)[c]; const t = heroBy(r); if (t) mend(h, t); ui.hintDone('heal'); return; }
    if (c === 'KeyE') { const ch = S.chains[0]; if (ch) { cutChain(ch, h); ui.hintDone('chain'); } }
  });
  window.addEventListener('keyup', (e) => {
    IN.keys[e.code] = false;
    if (S && e.code === 'Digit2' && S.player && AB[S.player.role as 'tank'].a2.hold) { IN.block = false; ui.holdBtn('a2', false); }
  });
  window.addEventListener('blur', () => { IN.keys = {}; IN.block = false; IN.stick = null; ui.stick(null); });
}

/** a swipe that crosses a wisp or a chain cuts it */
export function trySlice(a: { x: number; y: number }, b: { x: number; y: number }, ui: InputUI): boolean {
  if (!S || !S.player.alive || S.player.st.caged) return false;
  const p = toWorld(a.x, a.y), q = toWorld(b.x, b.y);
  let hit = false;
  for (const m of S.mobs) {
    if (!m.alive || !m.M.wisp) continue;
    if (segPointDist(p.x, p.y, q.x, q.y, m.x, m.y - 40) < m.r + 26) { killMob(m, S.player); hit = true; S.stats.slices = (S.stats.slices || 0) + 1; emit({ type: 'wisp.sliced', player: true }); }
  }
  for (const ch of S.chains.slice()) {
    const e = chainEnds(ch);
    const mid = { x: (e.ax + e.bx) / 2, y: (e.ay + e.by) / 2 + 22 };
    if (segsCross(p, q, { x: e.ax, y: e.ay }, mid) || segsCross(p, q, mid, { x: e.bx, y: e.by })) { cutChain(ch, S.player); hit = true; }
  }
  if (hit) {
    const trail = S.looks && S.looks.has('cosmetic.trail_wisp');
    fx({ type: 'swipe', x: p.x, y: p.y, x2: q.x, y2: q.y, dur: trail ? 0.45 : 0.2, col: trail ? '#C8F5E8' : undefined });
    ui.hintDone('wisp'); ui.hintDone('chain');
  }
  return hit;
}
export function mashCage(h: any, ui: InputUI): void {
  const c = h.st.caged;
  if (!c) return;
  c.hp -= 1; c.flash = 0.1; sfx('cagehit');
  bits(c.x, c.y - 50, 'shard_bone', 1, 120);
  if (c.hp <= 0) breakCage(c, true, h);
  ui.hintDone('cageSelf');
}
export function tapWorld(w: { x: number; y: number }, ui: InputUI): void {
  const h = S.player;
  if (h.st.caged) { mashCage(h, ui); return; }
  for (const m of S.mobs) if (m.alive && m.cage && distXY(w.x, w.y, m.x, m.y - 50) < 70) { mashCage(m.hero, ui); ui.hintDone('cage'); return; }
  let best: any = null, bd = 1e9;
  for (const a of S.heroes) { if (!a.alive) continue; const d = distXY(w.x, w.y, a.x, a.y - 40); if (d < 52 && d < bd) { bd = d; best = a; } }
  if (best && h.role === 'healer') { mend(h, best); ui.hintDone('heal'); return; }
  let mb: any = null; bd = 1e9;
  for (const m of S.mobs) { if (!isFoe(m) || m.cage) continue; const d = distXY(w.x, w.y, m.x, m.y - (m.isBoss ? 120 : m.M.big ? 70 : 40)); const r = m.isBoss ? 120 : m.M.big ? 70 : 44; if (d < r && d < bd) { bd = d; mb = m; } }
  if (mb) { h.picked = mb; fx({ type: 'ring', x: mb.x, y: mb.y, r0: 10, r1: mb.r + 30, col: '#FF6B5E', dur: 0.25, w: 4, ground: true }); }
}
