/* ---------- input: thumb stick, swipes, taps, buttons, keyboard, mouse ---------- */
const IN = { keys: {}, stick: null, gest: new Map(), aim: null, block: false, mouse: null, touchSeen: false };

function playerIntent(h) {
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

function aimPoint(a) {
  const h = S.player, def = AB[h.role][a.slot];
  if (a.mouseAim) return clampRange(h, a.mx, a.my, def.range);
  const dx = a.cx - a.sx, dy = a.cy - a.sy, l = Math.hypot(dx, dy);
  if (l < 14) {
    if (def.key === 'blizzard') { const c = bestCluster(h, 120, 560); if (c) return clampRange(h, c.x, c.y, def.range); const t = autoTarget(h); if (t) return clampRange(h, t.x, t.y, def.range); return { x: h.x, y: h.y - 160 }; }
    const t = heroBy('tank'); if (t && t.alive && dist(t, h) < def.range) return { x: t.x, y: t.y }; return { x: h.x, y: h.y };
  }
  const m = Math.min(1, l / 92) * def.range;
  return { x: h.x + (dx / l) * m, y: h.y + (dy / l) * m };
}

function localXY(e) { const r = VIEW.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function inStickZone(x, y) { return x < VIEW.W * 0.52 && y > VIEW.H * 0.42; }

function bindInput() {
  const layer = document.getElementById('touch');
  layer.addEventListener('pointerdown', (e) => {
    if (!S || S.over || S.paused) return;
    e.preventDefault();
    UI.audioKick();
    const p = localXY(e);
    if (e.pointerType !== 'mouse') IN.touchSeen = true;
    if (e.pointerType !== 'mouse' && !IN.stick && inStickZone(p.x, p.y)) {
      IN.stick = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
      try { layer.setPointerCapture(e.pointerId); } catch (_) {}
      UI.stick(IN.stick);
      return;
    }
    IN.gest.set(e.pointerId, { pts: [{ x: p.x, y: p.y, t: performance.now() }], sliced: false });
    try { layer.setPointerCapture(e.pointerId); } catch (_) {}
  });
  layer.addEventListener('pointermove', (e) => {
    const p = localXY(e);
    if (e.pointerType === 'mouse') IN.mouse = p;
    if (IN.stick && IN.stick.id === e.pointerId) { IN.stick.x = p.x; IN.stick.y = p.y; UI.stick(IN.stick); return; }
    const g = IN.gest.get(e.pointerId);
    if (!g) return;
    const last = g.pts[g.pts.length - 1];
    g.pts.push({ x: p.x, y: p.y, t: performance.now() });
    if (trySlice(last, p)) g.sliced = true;
  });
  const end = (e) => {
    if (IN.stick && IN.stick.id === e.pointerId) { IN.stick = null; UI.stick(null); return; }
    const g = IN.gest.get(e.pointerId);
    if (!g) return;
    IN.gest.delete(e.pointerId);
    if (!S || S.over) return;
    const a = g.pts[0], b = g.pts[g.pts.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), dur = b.t - a.t;
    if (g.sliced) return;
    if (len > 34 && dur < 340) { if (doDodge(S.player, dx, dy)) UI.hintDone('dodge'); return; }
    if (len < 16 && dur < 420) tapWorld(toWorld(b.x, b.y));
  };
  layer.addEventListener('pointerup', end);
  layer.addEventListener('pointercancel', end);
  layer.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') IN.mouse = null; });
  layer.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    const c = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c) && S && !S.over && UI.inGame()) e.preventDefault();
    if (!S || !UI.inGame()) return;
    if (c === 'Escape' || c === 'KeyP') { UI.togglePause(); return; }
    if (S.paused || S.over) return;
    UI.audioKick();
    if (e.repeat && c !== 'Digit2') return;
    IN.keys[c] = true;
    const h = S.player;
    if (h.st.caged && (c === 'Space' || c.startsWith('Digit') || c.startsWith('Key'))) { mashCage(h); return; }
    if (c === 'Space' || c === 'ShiftLeft' || c === 'ShiftRight') { const v = { x: h.intent.mx, y: h.intent.my }; doDodge(h, v.x, v.y); UI.hintDone('dodge'); return; }
    if (c === 'Digit1' || c === 'Digit2' || c === 'Digit3') {
      const slot = 'a' + c.slice(5);
      if (AB[h.role][slot].hold) { IN.block = true; UI.holdBtn(slot, true); return; }
      const def = AB[h.role][slot];
      let aim = null;
      if (def.aim && IN.mouse) aim = toWorld(IN.mouse.x, IN.mouse.y);
      useAbility(h, slot, aim);
      return;
    }
    if (h.role === 'healer' && (c === 'KeyZ' || c === 'KeyX' || c === 'KeyC')) { const r = { KeyZ: 'tank', KeyX: 'healer', KeyC: 'dps' }[c]; const t = heroBy(r); if (t) mend(h, t); return; }
    if (c === 'KeyE') { const ch = S.chains[0]; if (ch) cutChain(ch, h); }
  });
  window.addEventListener('keyup', (e) => {
    IN.keys[e.code] = false;
    if (S && (e.code === 'Digit2') && S.player && AB[S.player.role].a2.hold) { IN.block = false; UI.holdBtn('a2', false); }
  });
  window.addEventListener('blur', () => { IN.keys = {}; IN.block = false; IN.stick = null; UI.stick(null); });
}

function trySlice(a, b) {
  if (!S || !S.player.alive || S.player.st.caged) return false;
  const p = toWorld(a.x, a.y), q = toWorld(b.x, b.y);
  let hit = false;
  for (const m of S.mobs) {
    if (!m.alive || !m.M.wisp) continue;
    if (segPointDist(p.x, p.y, q.x, q.y, m.x, m.y - 40) < m.r + 26) { killMob(m, S.player); hit = true; S.stats.slices = (S.stats.slices || 0) + 1; }
  }
  for (const ch of S.chains.slice()) {
    const e = chainEnds(ch);
    const mid = { x: (e.ax + e.bx) / 2, y: (e.ay + e.by) / 2 + 22 };
    if (segsCross(p, q, { x: e.ax, y: e.ay }, mid) || segsCross(p, q, mid, { x: e.bx, y: e.by })) { cutChain(ch, S.player); hit = true; }
  }
  if (hit) { fx({ type: 'swipe', x: p.x, y: p.y, x2: q.x, y2: q.y, dur: 0.2 }); UI.hintDone('wisp'); UI.hintDone('chain'); }
  return hit;
}
function mashCage(h) {
  const c = h.st.caged;
  if (!c) return;
  c.hp -= 1; c.flash = 0.1; sfx('cagehit');
  bits(c.x, c.y - 50, 'shard_bone', 1, 120);
  if (c.hp <= 0) breakCage(c, true);
}
function tapWorld(w) {
  const h = S.player;
  if (h.st.caged) { mashCage(h); return; }
  for (const m of S.mobs) if (m.alive && m.cage && distXY(w.x, w.y, m.x, m.y - 50) < 70) { mashCage(m.hero); UI.hintDone('cage'); return; }
  let best = null, bd = 1e9;
  for (const a of S.heroes) { if (!a.alive) continue; const d = distXY(w.x, w.y, a.x, a.y - 40); if (d < 52 && d < bd) { bd = d; best = a; } }
  if (best && h.role === 'healer') { mend(h, best); UI.hintDone('heal'); return; }
  let mb = null; bd = 1e9;
  for (const m of S.mobs) { if (!isFoe(m) || m.cage) continue; const d = distXY(w.x, w.y, m.x, m.y - (m.isBoss ? 120 : m.M.big ? 70 : 40)); const r = m.isBoss ? 120 : m.M.big ? 70 : 44; if (d < r && d < bd) { bd = d; mb = m; } }
  if (mb) { h.picked = mb; fx({ type: 'ring', x: mb.x, y: mb.y, r0: 10, r1: mb.r + 30, col: '#FF6B5E', dur: 0.25, w: 4, ground: true }); }
}
