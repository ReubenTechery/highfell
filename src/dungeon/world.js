/* ---------- world: where you can stand, how to get somewhere ---------- */
import { clamp, distXY } from '../core/math';
import { rng } from '../core/rng';
import { S } from './state.js';

export function inWalk(x, y, r) {
  const W = S.dg.map.walk;
  for (let i = 0; i < W.length; i++) {
    const a = W[i];
    if (x >= a.x0 + r && x <= a.x1 - r && y >= a.y0 + r && y <= a.y1 - r) return true;
  }
  return false;
}
export function gateBlocks(x, y, r) {
  for (const g of Object.values(S.gates)) {
    if (!g.closed) continue;
    if (x > g.x0 - r && x < g.x1 + r && Math.abs(y - g.y) < 16 + r) return true;
  }
  return false;
}
export function canStand(x, y, r) { return inWalk(x, y, r) && !gateBlocks(x, y, r); }

export function pushOutProps(e) {
  for (const p of S.props) {
    const c = p.col;
    if (!c || p.gone) continue;
    if (c[0] === 'c') {
      const dx = e.x - p.x, dy = e.y - p.y, rr = c[1] + e.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr) { const d = Math.sqrt(d2) || 0.01; const nx = p.x + (dx / d) * rr, ny = p.y + (dy / d) * rr; if (canStand(nx, ny, e.r)) { e.x = nx; e.y = ny; } }
    } else {
      const cx = p.x, cy = p.y + (c[3] || 0), hw = c[1], hh = c[2];
      const qx = clamp(e.x, cx - hw, cx + hw), qy = clamp(e.y, cy - hh, cy + hh);
      const dx = e.x - qx, dy = e.y - qy, d2 = dx * dx + dy * dy;
      if (d2 < e.r * e.r) {
        let nx, ny;
        if (d2 > 0.0001) { const d = Math.sqrt(d2); nx = qx + (dx / d) * e.r; ny = qy + (dy / d) * e.r; }
        else { // centre inside the box: leave by the nearest side
          const l = e.x - (cx - hw), rgt = cx + hw - e.x, t = e.y - (cy - hh), b = cy + hh - e.y, m = Math.min(l, rgt, t, b);
          nx = e.x; ny = e.y;
          if (m === l) nx = cx - hw - e.r; else if (m === rgt) nx = cx + hw + e.r; else if (m === t) ny = cy - hh - e.r; else ny = cy + hh + e.r;
        }
        if (canStand(nx, ny, e.r)) { e.x = nx; e.y = ny; }
      }
    }
  }
}
export function freeSpot(x, y, r) {
  if (!canStand(x, y, r)) return false;
  for (const p of S.props) {
    const c = p.col;
    if (!c) continue;
    if (c[0] === 'c') { if (distXY(x, y, p.x, p.y) < c[1] + r + 4) return false; }
    else if (Math.abs(x - p.x) < c[1] + r + 4 && Math.abs(y - (p.y + (c[3] || 0))) < c[2] + r + 4) return false;
  }
  return true;
}
export function moveEnt(e, dx, dy) {
  const nx = e.x + dx, ny = e.y + dy;
  if (!canStand(e.x, e.y, e.r)) { e.x = nx; e.y = ny; return true; }
  let moved = true;
  if (canStand(nx, ny, e.r)) { e.x = nx; e.y = ny; }
  else if (canStand(nx, e.y, e.r)) e.x = nx;
  else if (canStand(e.x, ny, e.r)) e.y = ny;
  else moved = false;
  if (!e.ghostProps) pushOutProps(e);
  return moved;
}

/* chain index of the area a point is in (rooms first) */
export function areaOf(x, y) {
  const C = S.dg.map.chain;
  for (let i = 0; i < C.length; i += 2) { const a = C[i]; if (x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1) return i; }
  for (let i = 1; i < C.length; i += 2) { const a = C[i]; if (x >= a.x0 - 10 && x <= a.x1 + 10 && y >= a.y0 && y <= a.y1) return i; }
  let best = 0, bd = 1e9;
  C.forEach((a, i) => { const cx = (a.x0 + a.x1) / 2, cy = (a.y0 + a.y1) / 2; const d = Math.abs(cy - y) + Math.abs(cx - x) * 0.2; if (d < bd) { bd = d; best = i; } });
  return best;
}
export function roomIndexOf(x, y) { const i = areaOf(x, y); const a = S.dg.map.chain[i]; return a.kind === 'room' ? a.idx : -1; }

/* next point to walk to on the way to (tx, ty) */
export function navPoint(e, tx, ty) {
  const M = S.dg.map;
  const a = areaOf(e.x, e.y), b = areaOf(tx, ty);
  if (a === b) return { x: tx, y: ty };
  // straight there only from inside a box you fit in: beside a corridor's mouth you are in its box but too
  // wide for it, and a straight line walks you into the corner
  const r = e.r || 0;
  for (const w of M.walk) {
    if (e.x >= w.x0 + r && e.x <= w.x1 - r && e.y >= w.y0 + r && e.y <= w.y1 - r && tx >= w.x0 && tx <= w.x1 && ty >= w.y0 && ty <= w.y1) return { x: tx, y: ty };
  }
  const cur = M.chain[a];
  if (b > a) return { x: M.CX, y: cur.y0 - 24 };
  return { x: M.CX, y: cur.y1 + 24 };
}

/* walk e toward (tx, ty) at speed; returns remaining distance. Unsticks itself around pillars. */
export function walkTo(e, tx, ty, speed, dt, stopAt) {
  const p = navPoint(e, tx, ty);
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  const full = Math.hypot(tx - e.x, ty - e.y);
  if (full <= (stopAt || 4)) return full;
  let ux = dx / (d || 1), uy = dy / (d || 1);
  if (e.unstickT > 0) { e.unstickT -= dt; const s = e.unstickSide || 1; const px = -uy * s, py = ux * s; ux = ux * 0.35 + px; uy = uy * 0.35 + py; const l = Math.hypot(ux, uy) || 1; ux /= l; uy /= l; }
  const step = Math.min(speed * dt, d);
  const ox = e.x, oy = e.y;
  moveEnt(e, ux * step, uy * step);
  const prog = Math.hypot(e.x - ox, e.y - oy);
  if (prog < step * 0.3 && step > 0.5) { e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 0.25) { e.unstickT = 0.45; e.unstickSide = rng() < 0.5 ? -1 : 1; e.stuckT = 0; } }
  else e.stuckT = 0;
  if (Math.abs(ux) > 0.15) e.flip = ux < 0;
  e.face = Math.atan2(uy, ux);
  e.walkT = (e.walkT || 0) + dt * 9;
  e.moving = 0.15;
  return full;
}

export function segPointDist(ax, ay, bx, by, px, py) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1);
  return Math.hypot(ax + vx * t - px, ay + vy * t - py);
}
export function segsCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}
