import { TAU, angTo, clamp, dist, lerp } from '../core/math';
import { vrand } from '../core/rng';
import { AB, ROLES } from '../content/roles';
import { RARITY } from '../content/gear';
import { S } from './state.js';
import { BAKE_S, PAT, bakeAll, drawSpr, mkCanvas } from './art.js';
import { PERFECT_WINDOW, dots } from './entities.js';
import { drawWalkout, walkoutFocus } from './walkout.js';
import { chainEnds } from './mobs.js';
import { roomIndexOf } from './world.js';

/* ---------- drawing: the crypt, everyone in it, and the effects ---------- */
/** @type {any} */
export const VIEW = { cv: null, ctx: null, W: 0, H: 0, dpr: 1, scale: 1, S: 1, fx: 0, fy: 0, cam: { x: 500, y: 5600 }, dark: null };
export const K = '#1E1A1A';
export const FONT = "'Lilita One', 'Trebuchet MS', sans-serif";
/* the screen layer tells the renderer what the player is aiming, if anything: () => { key, range, x, y, r } | null */
/** @type {{ get: null | (() => any) }} */
export const AIM = { get: null };

export function resizeView() {
  const cv = VIEW.cv, box = cv.parentElement.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  VIEW.W = box.width; VIEW.H = box.height; VIEW.dpr = dpr;
  cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
  const portrait = VIEW.H > VIEW.W;
  VIEW.scale = clamp(Math.min(VIEW.W / (portrait ? 560 : 900), VIEW.H / (portrait ? 980 : VIEW.H < 520 ? 640 : 860)), 0.42, 1.35);
  VIEW.S = VIEW.scale * dpr;
  VIEW.portrait = portrait;
  VIEW.fx = VIEW.W / 2; VIEW.fy = VIEW.H * (portrait ? 0.6 : 0.58);
  const want = Math.ceil(VIEW.S * 4) / 4;
  if (Math.abs(want - BAKE_S) > 0.01) bakeAll(want);
}
export function camTarget() {
  const p = S.player;
  let x = p.x, y = p.y - 40;
  const b = S.boss && S.boss.alive ? S.boss : null;
  if (b && !b.hidden) { x = lerp(x, b.x, 0.25); y = lerp(y, b.y, 0.3); }
  if (S.chest && !S.chest.open && dist(p, S.chest) < 500) { x = lerp(x, S.chest.x, 0.3); y = lerp(y, S.chest.y, 0.3); }
  const wf = walkoutFocus();
  if (wf) { x = lerp(x, wf.x, 0.75); y = lerp(y, wf.y, 0.75); }
  if (S.paused && S.opts && S.opts.start === 'intro' && VIEW.portrait) y += 155;
  VIEW.fx = VIEW.W * (VIEW.portrait && VIEW.W < 700 ? (p.role === 'healer' && S.player === p ? 0.4 : 0.47) : 0.5);
  const ri = Math.max(0, roomIndexOf(p.x, p.y));
  const room = S.dg.map.rooms[ri] || S.dg.map.rooms[0];
  const lo = room.x0 - 40 + VIEW.fx / VIEW.scale, hi = room.x1 + 40 - (VIEW.W - VIEW.fx) / VIEW.scale;
  x = lo > hi ? (room.x0 + room.x1) / 2 - (VIEW.fx - VIEW.W / 2) / VIEW.scale : clamp(x, lo, hi);
  return { x, y };
}
export function updateCam(dt, snap) {
  const t = camTarget(), c = VIEW.cam;
  const k = snap ? 1 : Math.min(1, dt * 5.5);
  c.x += (t.x - c.x) * k; c.y += (t.y - c.y) * k;
}
export function toWorld(sx, sy) { return { x: VIEW.cam.x + (sx - VIEW.fx) / VIEW.scale, y: VIEW.cam.y + (sy - VIEW.fy) / VIEW.scale }; }
export function toScreen(wx, wy) { return { x: VIEW.fx + (wx - VIEW.cam.x) * VIEW.scale, y: VIEW.fy + (wy - VIEW.cam.y) * VIEW.scale }; }

export function render() {
  const ctx = VIEW.ctx, cv = VIEW.cv;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#17121F';
  ctx.fillRect(0, 0, cv.width, cv.height);
  if (!S) return;
  const sh = S.shake > 0.2 ? S.shake : 0;
  const shx = sh ? vrand(-sh, sh) : 0, shy = sh ? vrand(-sh, sh) : 0;
  const Sd = VIEW.S;
  ctx.setTransform(Sd, 0, 0, Sd, (VIEW.fx - VIEW.cam.x * VIEW.scale + shx) * VIEW.dpr, (VIEW.fy - VIEW.cam.y * VIEW.scale + shy) * VIEW.dpr);
  const v = { x0: VIEW.cam.x - VIEW.fx / VIEW.scale - 60, x1: VIEW.cam.x + (VIEW.W - VIEW.fx) / VIEW.scale + 60, y0: VIEW.cam.y - VIEW.fy / VIEW.scale - 260, y1: VIEW.cam.y + (VIEW.H - VIEW.fy) / VIEW.scale + 120 };
  drawMap(ctx, v);
  drawGround(ctx, v);
  drawObjects(ctx, v);
  drawAir(ctx, v);
  if (S.walkout) drawWalkout(ctx, drawSpr);
  if (S.dark > 0.02) drawDark(ctx);
  drawTexts(ctx, v);
  drawAim(ctx);
}

/* ---------- the map ---------- */
export function drawMap(ctx, v) {
  const M = S.dg.map;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let i = 0; i < S.dg.map.rooms.length; i++) {
    const r = M.rooms[i];
    if (r.y1 + 40 < v.y0 || r.y0 - r.wall - 40 > v.y1) continue;
    ctx.fillStyle = PAT[r.floor === 'yard' ? 'yard' : r.floor === 'tomb' ? 'tomb' : 'stone'] || '#4A4060';
    ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    if (S.dg.floorArt) S.dg.floorArt(ctx, i, r, K);
  }
  for (const c of S.dg.map.corridors) {
    if (c.y1 < v.y0 || c.y0 > v.y1) continue;
    ctx.fillStyle = PAT.corr || '#453B5A';
    ctx.fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
  }
  for (const d of S.dg.decals) { if (d.y < v.y0 || d.y > v.y1 + 100) continue; drawSpr(ctx, d.sp, d.x, d.y, { sx: d.sc, sy: d.sc, rot: d.rot * 0.25 }); }
  const CAP = '#2E2638', T = 30;
  for (let i = 0; i < S.dg.map.rooms.length; i++) {
    const r = S.dg.map.rooms[i];
    if (r.y1 + 40 < v.y0 || r.y0 - r.wall - 60 > v.y1) continue;
    const up = S.dg.map.corridors[i], down = S.dg.map.corridors[i - 1];
    const top = r.y0 - r.wall;
    // contact shadow under the north wall
    ctx.fillStyle = 'rgba(16, 10, 24, 0.3)';
    ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, 16);
    // north wall face with the doorway gap
    ctx.fillStyle = PAT.brick || '#5C5070';
    const segs = up ? [[r.x0 - T, up.x0], [up.x1, r.x1 + T]] : [[r.x0 - T, r.x1 + T]];
    for (const [a, b] of segs) ctx.fillRect(a, top, b - a, r.wall);
    if (up) { ctx.fillStyle = PAT.corr || '#453B5A'; ctx.fillRect(up.x0, top, up.x1 - up.x0, r.wall); }
    // caps
    ctx.fillStyle = CAP;
    ctx.fillRect(r.x0 - T, top - T, r.x1 - r.x0 + 2 * T, T);
    ctx.fillRect(r.x0 - T, top - T, T, r.y1 - top + 2 * T);
    ctx.fillRect(r.x1, top - T, T, r.y1 - top + 2 * T);
    if (down) { ctx.fillRect(r.x0 - T, r.y1, down.x0 - r.x0 + T, T); ctx.fillRect(down.x1, r.y1, r.x1 + T - down.x1, T); }
    else ctx.fillRect(r.x0 - T, r.y1, r.x1 - r.x0 + 2 * T, T);
    if (up) { ctx.fillStyle = CAP; ctx.fillRect(up.x0 - 26, top - T, 26, r.wall + T); ctx.fillRect(up.x1, top - T, 26, r.wall + T); }
    // ink
    ctx.strokeStyle = K; ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (const [a, b] of segs) { ctx.moveTo(a, r.y0); ctx.lineTo(b, r.y0); ctx.moveTo(a, top); ctx.lineTo(b, top); }
    ctx.moveTo(r.x0, top); ctx.lineTo(r.x0, r.y1); ctx.moveTo(r.x1, top); ctx.lineTo(r.x1, r.y1);
    if (down) { ctx.moveTo(r.x0, r.y1); ctx.lineTo(down.x0, r.y1); ctx.moveTo(down.x1, r.y1); ctx.lineTo(r.x1, r.y1); }
    else { ctx.moveTo(r.x0, r.y1); ctx.lineTo(r.x1, r.y1); }
    if (up) { ctx.moveTo(up.x0, top); ctx.lineTo(up.x0, r.y0); ctx.moveTo(up.x1, top); ctx.lineTo(up.x1, r.y0); }
    ctx.stroke();
    for (const w of S.dg.walldecor) {
      if (w[2] !== i) continue;
      if (w[0] === 'torch') {
        const fl = 0.75 + Math.sin(S.t * 9 + w[1]) * 0.12 + Math.sin(S.t * 23 + w[1] * 2) * 0.06;
        ctx.globalAlpha = 0.16 * fl; ctx.fillStyle = '#FF8A4C';
        ctx.beginPath(); ctx.arc(w[1], top + r.wall * 0.45, 70, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        drawSpr(ctx, 'torch', w[1], top + r.wall * 0.72, { sy: 0.96 + fl * 0.05 });
      } else drawSpr(ctx, 'banner', w[1], top + 10, {});
    }
  }
  for (const c of S.dg.map.corridors) {
    if (c.y1 < v.y0 || c.y0 > v.y1) continue;
    ctx.fillStyle = CAP;
    ctx.fillRect(c.x0 - 26, c.y0, 26, c.y1 - c.y0); ctx.fillRect(c.x1, c.y0, 26, c.y1 - c.y0);
    ctx.strokeStyle = K; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(c.x0, c.y0); ctx.lineTo(c.x0, c.y1); ctx.moveTo(c.x1, c.y0); ctx.lineTo(c.x1, c.y1); ctx.stroke();
  }
}
/* ---------- ground layer: shadows, telegraphs, zones ---------- */
export function drawGround(ctx, v) {
  for (const z of S.zones) drawZone(ctx, z);
  for (const z of S.hazards) drawHazard(ctx, z);
  for (const g of S.rings) {
    ctx.lineWidth = g.w + 6; ctx.strokeStyle = K; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.stroke();
    ctx.lineWidth = g.w; ctx.strokeStyle = '#C9A27A'; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#F1E0C2';
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r - g.w * 0.25, 0, TAU); ctx.stroke();
  }
  if (S.ring) drawFireRing(ctx);
  ctx.globalAlpha = 1;
  for (const f of S.fx) if (f.ground) drawFx(ctx, f);
  const ents = [];
  for (const h of S.heroes) ents.push(h);
  for (const m of S.mobs) if (m.alive && !m.cage) ents.push(m);
  ctx.fillStyle = 'rgba(18, 12, 28, 0.36)';
  for (const e of ents) {
    if (e.y < v.y0 || e.y > v.y1) continue;
    if (e.hidden) continue;
    const air = (e.st && e.st.air > 0 ? 0.7 : 1) * (e.jumpZ ? 0.7 : 1);
    const rx = (e.isBoss ? e.r * 1.5 : e.M && e.M.wisp ? 10 : e.r * 1.35) * air;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, rx, rx * 0.36, 0, 0, TAU); ctx.fill();
  }
  const p = S.player;
  if (p.alive) {
    ctx.strokeStyle = '#F2C230'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, p.r + 12, (p.r + 12) * 0.38, 0, 0, TAU); ctx.stroke();
    const t = p.picked || p.target;
    if (t && t.alive && !t.hidden) {
      ctx.strokeStyle = '#FF6B5E'; ctx.lineWidth = 3.5; ctx.setLineDash([10, 8]);
      const rr = (t.isBoss ? t.r * 1.6 : t.r * 1.5) + 8;
      ctx.beginPath(); ctx.ellipse(t.x, t.y + 2, rr, rr * 0.38, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}
export function hazardPath(ctx, z, k) {
  ctx.beginPath();
  if (z.shape === 'circle') ctx.arc(z.x, z.y, z.r * k, 0, TAU);
  else if (z.shape === 'cone') { ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, z.r * k, z.a - z.arc / 2, z.a + z.arc / 2); ctx.closePath(); }
  else { const ca = Math.cos(z.a), sa = Math.sin(z.a), hw = z.w / 2, L = z.len * k; ctx.moveTo(z.x - sa * hw, z.y + ca * hw); ctx.lineTo(z.x - sa * hw + ca * L, z.y + ca * hw + sa * L); ctx.lineTo(z.x + sa * hw + ca * L, z.y - ca * hw + sa * L); ctx.lineTo(z.x + sa * hw, z.y - ca * hw); ctx.closePath(); }
}
export function drawHazard(ctx, z) {
  const p = clamp(z.t / z.warn, 0, 1);
  const pool = z.live && z.t >= z.warn;
  if (pool) {
    const k = 1 - clamp((z.t - z.warn - z.live + 0.4) / 0.4, 0, 1);
    ctx.globalAlpha = k;
    hazardPath(ctx, z, 1);
    ctx.fillStyle = 'rgba(155, 225, 93, 0.3)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#4E9A4A'; ctx.stroke();
    ctx.fillStyle = '#C8F5A8';
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + z.x, rr = ((S.t * 30 + i * 37) % z.r) * 0.8; ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr * 0.6, 3 + (i % 3), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    return;
  }
  if (z.arrow) {
    ctx.globalAlpha = 0.55 + p * 0.35;
    hazardPath(ctx, z, 1); ctx.fillStyle = 'rgba(224, 74, 63, 0.16)'; ctx.fill();
    hazardPath(ctx, z, p); ctx.fillStyle = 'rgba(224, 74, 63, 0.3)'; ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  const bust = z.smash || z.tankBuster;
  const col = bust ? [242, 175, 48] : [224, 74, 63];
  const rgba = (a) => `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${a})`;
  hazardPath(ctx, z, 1);
  ctx.fillStyle = rgba(bust ? 0.2 : 0.16); ctx.fill();
  ctx.lineWidth = bust ? 9 : 6.5; ctx.strokeStyle = 'rgba(30, 26, 26, 0.75)'; ctx.stroke();
  ctx.lineWidth = bust ? 5 : 3.5; ctx.strokeStyle = bust ? '#FFE08A' : rgba(1); ctx.stroke();
  hazardPath(ctx, z, Math.max(0.02, p));
  ctx.fillStyle = rgba(0.32 + p * 0.14); ctx.fill();
  if (z.shape === 'rect') {
    const ca = Math.cos(z.a), sa = Math.sin(z.a), hw = z.w * 0.28;
    ctx.strokeStyle = 'rgba(255, 232, 224, 0.7)'; ctx.lineWidth = 3.5;
    for (let d = 55; d < z.len - 25; d += 58) {
      const cx = z.x + ca * d, cy = z.y + sa * d;
      ctx.beginPath();
      ctx.moveTo(cx - ca * 14 - sa * hw, cy - sa * 14 + ca * hw);
      ctx.lineTo(cx + ca * 6, cy + sa * 6);
      ctx.lineTo(cx - ca * 14 + sa * hw, cy - sa * 14 - ca * hw);
      ctx.stroke();
    }
  }
  if (z.burrow) {
    ctx.fillStyle = '#6B4A3A'; ctx.strokeStyle = K; ctx.lineWidth = 3.5;
    const wob = Math.sin(S.t * 18) * 3;
    ctx.beginPath(); ctx.ellipse(z.x, z.y - 4 + wob * 0.3, 46, 18, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (S.frame % 4 === 0) dots(z.x + vrand(-30, 30), z.y, '#6B4A3A', 1, 60, { size: 6 });
  }
}
export function drawZone(ctx, z) {
  const fade = Math.min(1, z.t / 0.15) * (1 - clamp((z.t - z.dur + 0.4) / 0.4, 0, 1));
  ctx.globalAlpha = fade;
  if (z.kind === 'heal') {
    ctx.fillStyle = 'rgba(242, 194, 48, 0.2)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = K; ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#F2C230'; ctx.stroke();
    const pr = (S.t * 0.8) % 1;
    ctx.globalAlpha = fade * (1 - pr); ctx.lineWidth = 3; ctx.strokeStyle = '#FFE08A';
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r * pr, 0, TAU); ctx.stroke();
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#FFF6D0';
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + z.t, rr = z.r * (0.25 + ((i * 0.37) % 0.7)), up = ((S.t * 40 + i * 30) % 60); const x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr * 0.5 - up; ctx.fillRect(x - 1.5, y - 6, 3, 12); ctx.fillRect(x - 6, y - 1.5, 12, 3); }
  } else if (z.kind === 'blizzard') {
    ctx.fillStyle = 'rgba(143, 214, 255, 0.2)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = K; ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const a = i * 2.39996 + z.seed, rr = z.r * Math.sqrt(((i * 0.618) % 1));
      const fall = ((S.t * 1.6 + i * 0.13) % 1);
      const x = z.x + Math.cos(a) * rr + Math.sin(S.t * 3 + i) * 6, y = z.y + Math.sin(a) * rr * 0.55;
      drawSpr(ctx, 'flake', x, y - 90 * (1 - fall), { alpha: 0.4 + fall * 0.6, rot: S.t * 2 + i });
    }
  } else if (z.kind === 'ice') {
    ctx.fillStyle = 'rgba(221, 243, 255, 0.35)'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, TAU); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#8FD6FF'; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
export function drawFireRing(ctx) {
  const A = S.dg.map.arena, R = S.ring.r;
  ctx.fillStyle = 'rgba(80, 160, 60, 0.18)';
  ctx.beginPath(); ctx.arc(A.x, A.y, A.r + 200, 0, TAU); ctx.arc(A.x, A.y, R, 0, TAU, true); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = K; ctx.beginPath(); ctx.arc(A.x, A.y, R, 0, TAU); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#9BE15D'; ctx.stroke();
  const n = Math.round((TAU * R) / 34);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = A.x + Math.cos(a) * R, y = A.y + Math.sin(a) * R;
    const h = 16 + Math.sin(S.t * 10 + i * 1.7) * 6;
    ctx.fillStyle = i % 2 ? '#9BE15D' : '#D8FFB8'; ctx.strokeStyle = K; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 7, y - h * 0.6, x, y - h); ctx.quadraticCurveTo(x + 7, y - h * 0.6, x + 7, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

/* ---------- y-sorted objects ---------- */
export function drawObjects(ctx, v) {
  const list = [];
  for (const p of S.props) if (p.y > v.y0 - 40 && p.y < v.y1 + 220) list.push({ y: p.y, k: 0, o: p });
  const arches = [];
  for (let i = 0; i < S.dg.map.corridors.length; i++) { const lo = S.dg.map.rooms[i]; arches.push({ y: lo.y0 + 2, k: 1, o: { x: 500, y: lo.y0 + 2 } }); }
  for (const a of arches) if (a.y > v.y0 - 40 && a.y < v.y1 + 260) list.push(a);
  for (const [id, g] of Object.entries(S.gates)) if (g.closed && g.y > v.y0 && g.y < v.y1 + 200) list.push({ y: g.y + 10, k: 2, o: g });
  for (const h of S.heroes) list.push({ y: h.y, k: 3, o: h });
  for (const m of S.mobs) if (m.y > v.y0 - 60 && m.y < v.y1 + 340) list.push({ y: m.y + (m.cage ? 2 : 0), k: 4, o: m });
  for (const f of S.fx) if (f.type === 'hand') list.push({ y: f.y, k: 5, o: f });
  if (S.chest) list.push({ y: S.chest.y, k: 6, o: S.chest });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    const o = it.o;
    if (it.k === 0) drawSpr(ctx, o.sp, o.x, o.y, { sx: o.sc, sy: o.sc });
    else if (it.k === 1) drawSpr(ctx, 'arch', o.x, o.y, {});
    else if (it.k === 2) drawSpr(ctx, 'gate', 500, o.y + 8, { sy: o.north ? 1 : 0.55 });
    else if (it.k === 3) drawHero(ctx, o);
    else if (it.k === 4) drawMob(ctx, o);
    else if (it.k === 5) { const k = clamp(o.t / 0.15, 0, 1), out = 1 - clamp((o.t - o.dur + 0.3) / 0.3, 0, 1); drawSpr(ctx, 'hand', o.x, o.y, { sy: k * out, alpha: out }); }
    else if (it.k === 6) {
      const s = o.open ? 'chest_open' : 'chest';
      const ready = !S.walkout || S.walkout.done;
      if (!o.open && ready) { ctx.globalAlpha = 0.25 + Math.sin(S.t * 4) * 0.1; ctx.fillStyle = '#F2C230'; ctx.beginPath(); ctx.arc(o.x, o.y - 30, 70, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      const hop = o.knockT > 0 ? Math.sin((o.knockT / 0.22) * Math.PI) * 14 : 0;
      drawSpr(ctx, s, o.x, o.y - hop, { sx: 1.15 + hop * 0.004, sy: 1.15 - hop * 0.004 + (o.open || !ready ? 0 : Math.sin(S.t * 5) * 0.02) });
    }
  }
}
/** Each hero sprite set: where its weapon is, seen from the front (the glow goes behind it), and the top of its
 *  head or hat (what floats over a hero goes above it). heroFit() reads it for a gilded set too, and from
 *  behind puts the weapon in the other hand. */
export const HERO_FIT = {
  tank: { weapon: [-48, -75], top: -107 },
  tank_w: { weapon: [-48, -75], top: -107 },
  healer: { weapon: [-30, -128], top: -117 },
  healer_m: { weapon: [-30, -128], top: -117 },
  dps: { weapon: [28, -122], top: -145 },
  dps_m: { weapon: [28, -122], top: -145 },
  risen_tank: { weapon: [-33, -90], top: -130 },
  risen_tank_w: { weapon: [-33, -90], top: -130 },
  risen_healer: { weapon: [-30, -118], top: -125 },
  risen_healer_m: { weapon: [-30, -118], top: -125 },
  risen_dps: { weapon: [28, -122], top: -148 },
  risen_dps_m: { weapon: [28, -122], top: -148 },
};
export function heroFit(set, back) {
  const fit = HERO_FIT[set.replace(/_(gilded|rags|iron)$/g, '')] || { weapon: [0, -80], top: -112 };
  return { wx: back ? -fit.weapon[0] : fit.weapon[0], wy: fit.weapon[1], top: fit.top };
}
export function drawHero(ctx, h) {
  const set = h.sprite || ROLES[h.role].sprite, name = set + (h.back ? '_b' : '_f');
  const { wx, wy, top } = heroFit(set, h.back);
  if (!h.alive) {
    drawSpr(ctx, name, h.x, h.y - 6, { rot: -Math.PI / 2 * (h.flip ? -1 : 1) * Math.min(1, h.deadT * 5), alpha: 0.5, sx: 0.9, sy: 0.9 });
    return;
  }
  let x = h.x, y = h.y;
  let sx = 1, sy = 1, rot = 0;
  const moving = h.moving > 0;
  if (moving) { y -= Math.abs(Math.sin(h.walkT)) * 5; sy = 1 + Math.sin(h.walkT * 2) * 0.03; }
  else { sy = 1 + Math.sin(S.t * 2.3 + h.r) * 0.014; }
  sx = 2 - sy;
  if (h.lunge > 0) { const k = h.lunge / 0.16; x += Math.cos(h.lungeA) * 10 * k; y += Math.sin(h.lungeA) * 6 * k; }
  if (h.swingT > 0) {
    const sk = Math.sin((1 - h.swingT / 0.24) * Math.PI);
    rot += (h.flip ? -1 : 1) * sk * 0.28;
    sx *= 1 + sk * 0.1;
  }
  let spinFlip = h.flip;
  if (h.whirlT > 0) {
    const wk = 1 - h.whirlT / (h.whirlDur || 0.42);
    const c = Math.cos(wk * TAU * 2);
    spinFlip = c < 0 ? !h.flip : h.flip;
    sx *= 0.76 + 0.34 * Math.abs(c);
    sy *= 0.95;
    rot = (c >= 0 ? 1 : -1) * 0.16;
    y -= Math.sin(wk * Math.PI) * 7;
  }
  if (h.dodgeT > 0) { const k = 1 - h.dodgeT / 0.3; rot = (h.dodgeX >= 0 ? 1 : -1) * k * TAU; y -= 26; sy *= 0.9; }
  if (h.st.air > 0) y -= Math.sin((h.st.air / 0.6) * Math.PI) * 60;
  if (h.dash) {
    rot = (h.dash.mob ? Math.cos(angTo(h, h.dash.mob)) : (h.flip ? -1 : 1)) * 0.34;
    sx = 1.12; sy = 0.9;
    drawSpr(ctx, name, x - Math.cos(h.face) * 34, y - Math.sin(h.face) * 20, { flip: h.flip, sx, sy, rot, alpha: 0.22, tint: 'gold', tintA: 0.5 });
    drawSpr(ctx, name, x - Math.cos(h.face) * 17, y - Math.sin(h.face) * 10, { flip: h.flip, sx, sy, rot, alpha: 0.42, tint: 'gold', tintA: 0.35 });
  }
  if (h.st.stun > 0) rot += Math.sin(S.t * 12) * 0.06;
  // gear glow behind the weapon
  if (h.weaponRar >= 2) {
    const fx_ = h.flip ? -wx : wx;
    const col = RARITY[h.weaponRar].color;
    ctx.globalAlpha = 0.3 + Math.sin(S.t * 3) * 0.08; ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x + fx_, y + wy, h.weaponRar === 3 ? 24 : 17, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    if (h.weaponRar === 3 && S.frame % 7 === 0) S.parts.push({ x: h.x + fx_ + vrand(-14, 14), y: h.y, z: -wy + vrand(-14, 14), vx: 0, vy: 0, vz: 0, up: true, col: '#C9B2FF', size: vrand(2.5, 4.5), t: 0, dur: 0.7 });
  }
  // a brew from the Vale: little motes of its colour rising round your feet
  if (h.brewCol && !(h.brew === 'elixir' && h.brewUsed) && S.frame % 9 === 0) S.parts.push({ x: h.x + vrand(-20, 20), y: h.y, z: vrand(0, 26), vx: 0, vy: 0, vz: 0, up: true, col: h.brewCol, size: vrand(2.5, 4.2), t: 0, dur: 0.9 });
  if (h.isPlayer && h.role === 'healer' && S.looks.has('cosmetic.glow_staff')) {
    const fx_ = h.flip ? -wx : wx;
    ctx.globalAlpha = 0.28 + Math.sin(S.t * 4) * 0.08; ctx.fillStyle = '#FFE08A';
    ctx.beginPath(); ctx.arc(x + fx_, y + wy, 30, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    if (S.frame % 9 === 0) S.parts.push({ x: h.x + fx_ + vrand(-12, 12), y: h.y, z: -wy + vrand(-10, 10), vx: 0, vy: 0, vz: 0, up: true, col: '#FFF6D0', size: vrand(2.5, 4), t: 0, dur: 0.8 });
  }
  const yy = h.dodgeT > 0 ? y + 26 : y;
  // the Barrow dyes on your set: the Gravegold Dye (heroic) wins over the Ghostly one
  const gold = h.isPlayer && S.opts.gilded, ghost = !gold && h.isPlayer && S.opts.ghostly;
  drawSpr(ctx, name, x, yy, { flip: spinFlip, sx, sy, rot: rot, alpha: ghost ? 0.78 : 1, tint: h.flash > 0 ? 'flash' : gold ? 'gold' : ghost ? 'ghost' : null, tintA: h.flash > 0 ? Math.max(0, h.flash) / 0.12 : gold ? 0.4 : 0.45 });
  if (h.blocking) {
    const a = h.face, cx = h.x + Math.cos(a) * 24, cy = h.y - 34 + Math.sin(a) * 12;
    ctx.lineWidth = 11; ctx.strokeStyle = K; ctx.beginPath(); ctx.arc(cx - Math.cos(a) * 14, cy - Math.sin(a) * 8, 34, a - 1.05, a + 1.05); ctx.stroke();
    const rim = h.isPlayer && S.looks.has('cosmetic.glow_shield');
    if (rim) { ctx.globalAlpha = 0.35; ctx.lineWidth = 22; ctx.strokeStyle = '#F2C230'; ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.lineWidth = 6; ctx.strokeStyle = h.blockT < PERFECT_WINDOW || rim ? '#F2C230' : '#C9D2DC'; ctx.stroke();
  }
  if (h.absorb > 0) {
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#DDF3FF'; ctx.beginPath(); ctx.ellipse(h.x, h.y + (top + 2) / 2, 46, (22 - top) / 2, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.lineWidth = 3; ctx.strokeStyle = '#DDF3FF'; ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (h.st.stun > 0 || h.st.root > 0) stars(ctx, h.x, h.y + top - 8, h.st.root > 0 ? '#C9B79A' : '#F2C230');
  if (h.st.haunt > 0) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#C8F5E8'; ctx.beginPath(); ctx.arc(h.x, h.y - 40, 34 + Math.sin(S.t * 8) * 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (h.cast) { const k = h.cast.t / h.cast.dur; castBar(ctx, h.x, h.y + top - 14, 70, k, '#8FD6FF'); }
  if (h.say && h.sayT > 0) bubble(ctx, h.x, h.y + top - 14, h.say);
}
export function stars(ctx, x, y, col) {
  for (let i = 0; i < 3; i++) {
    const a = S.t * 5 + (i * TAU) / 3, sx = x + Math.cos(a) * 18, sy = y + Math.sin(a) * 6;
    ctx.fillStyle = col; ctx.strokeStyle = K; ctx.lineWidth = 2;
    ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.6 : 6.5, aa = (k * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(sx + Math.cos(aa) * r, sy + Math.sin(aa) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
export function castBar(ctx, x, y, w, k, col) {
  ctx.fillStyle = '#FFF8EC'; ctx.strokeStyle = K; ctx.lineWidth = 3;
  roundRect(ctx, x - w / 2, y - 6, w, 12, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; roundRect(ctx, x - w / 2 + 3, y - 3, Math.max(0, (w - 6) * clamp(k, 0, 1)), 6, 3); ctx.fill();
}
export function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export function bubble(ctx, x, y, str) {
  ctx.font = `20px ${FONT}`;
  const w = ctx.measureText(str).width + 22;
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = K; ctx.lineWidth = 3;
  roundRect(ctx, x - w / 2, y - 30, w, 30, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 7, y - 1); ctx.lineTo(x, y + 9); ctx.lineTo(x + 7, y - 1); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.fillStyle = K; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y - 14);
}
export function drawMob(ctx, m) {
  if (m.cage) { if (!m.alive) return; const k = m.hp / m.maxHp; drawSpr(ctx, 'cage', m.x, m.y + 2, { sy: 1 + Math.sin(S.t * 30) * (m.flash > 0 ? 0.04 : 0), tint: m.flash > 0 ? 'flash' : null, tintA: 0.6 }); castBar(ctx, m.x, m.y - 136, 60, k, '#F0E8D2'); return; }
  if (m.hidden) return;
  let name = m.M.sp;
  if (m.pose && m.M.poseSprites && m.M.poseSprites[m.pose]) name = m.M.poseSprites[m.pose];
  let x = m.x, y = m.y, sx = 1, sy = 1, rot = 0, alpha = 1;
  if (!m.alive) { const k = clamp(m.deadT / 0.25, 0, 1); alpha = 1 - k; sy = 1 - k * 0.5; if (alpha <= 0) return; }
  if (m.rise > 0) { const k = 1 - m.rise / (m.riseDur || 0.75); alpha = Math.min(1, k * 1.6); sy = 0.3 + k * 0.7; y += (1 - k) * 10; }
  const moving = m.moving > 0;
  if (m.M.wisp) { y -= Math.sin(S.t * 4 + (m.seed || 0)) * 6; }
  else if (moving) { y -= Math.abs(Math.sin(m.walkT)) * (m.M.big ? 6 : 4); sy *= 1 + Math.sin(m.walkT * 2) * 0.03; }
  else sy *= 1 + Math.sin(S.t * 2 + m.home.x) * 0.015;
  if (m.wind > 0 || m.pose === 'wind') { const a = m.target ? angTo(m, m.target) : m.face; x -= Math.cos(a) * 6; sy *= 1.04; rot = -Math.cos(a) * 0.08; }
  if (m.lunge > 0) { const k = m.lunge / 0.18; x += Math.cos(m.lungeA) * 12 * k; y += Math.sin(m.lungeA) * 8 * k; }
  if (m.jumpZ) y -= m.jumpZ;
  sx = (2 - sy) * 1;
  const frozen = m.st.freeze > 0;
  if (m.armorUp > 0) { ctx.globalAlpha = 0.12 + Math.sin(S.t * 6) * 0.05; ctx.fillStyle = '#F0E8D2'; ctx.beginPath(); ctx.ellipse(m.x, m.y - 90, 86, 110, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = '#F0E8D2'; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]); }
  drawSpr(ctx, name, x, y, { flip: m.flip, sx, sy, rot, alpha, tint: m.flash > 0 ? 'flash' : frozen ? 'frost' : null, tintA: m.flash > 0 ? (m.isBoss ? 0.4 : 0.7) : 1 });
  if (frozen) { ctx.lineWidth = 3; ctx.strokeStyle = '#DDF3FF'; ctx.globalAlpha = 0.9; const hh = m.M.big ? 150 : 90; roundRect(ctx, m.x - m.r - 12, m.y - hh, (m.r + 12) * 2, hh + 4, 10); ctx.stroke(); ctx.globalAlpha = 1; }
  if (m.st.stun > 0) stars(ctx, m.x, m.y - (m.isBoss ? 220 : m.M.big ? 160 : 108), '#F2C230');
  if (m.wild && m.alive && !m.isBoss) { const yy = m.y - (m.M.big ? 168 : 112) - Math.abs(Math.sin(S.t * 8)) * 4; ctx.font = `26px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = K; ctx.strokeText('!!', m.x, yy); ctx.fillStyle = '#FF6B5E'; ctx.fillText('!!', m.x, yy); }
  if (!m.alive) return;
  if (m.cast) castBar(ctx, m.x, m.y - (m.M.big ? 170 : 122), 80, m.cast.t / m.cast.dur, m.cast.kick ? '#9BE15D' : '#F2C230');
  if (!m.isBoss && !m.M.wisp && m.state === 'fight' && m.hp < m.maxHp) {
    const w = m.M.big ? 80 : 48, yy = m.y - (m.M.big ? 158 : 106);
    ctx.fillStyle = '#2A2234'; ctx.strokeStyle = K; ctx.lineWidth = 2.5; roundRect(ctx, x - w / 2, yy, w, 8, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#E04A3F'; roundRect(ctx, x - w / 2 + 1.5, yy + 1.5, Math.max(0, (w - 3) * (m.hp / m.maxHp)), 5, 2.5); ctx.fill();
  }
}

/* ---------- air layer: projectiles, chains, effects, bits ---------- */
export function drawAir(ctx, v) {
  for (const p of S.projs) {
    const a = p.team === 'hero' ? Math.atan2(p.vy || 0, p.vx || 1) : Math.atan2(p.vy, p.vx);
    drawSpr(ctx, p.sp, p.x, p.y - p.z, { rot: a, sx: p.big ? 1.6 : 1, sy: p.big ? 1.6 : 1 });
  }
  for (const ch of S.chains) drawChain(ctx, ch);
  for (const f of S.fx) if (!f.ground && f.type !== 'hand') drawFx(ctx, f);
  for (const p of S.parts) {
    const k = 1 - clamp((p.t - p.dur + 0.25) / 0.25, 0, 1);
    ctx.globalAlpha = k;
    if (p.sp) drawSpr(ctx, p.sp, p.x, p.y - p.z, { rot: p.rot });
    else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y - p.z, p.size, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
export function drawChain(ctx, ch) {
  const e = chainEnds(ch);
  const n = Math.max(4, Math.round(Math.hypot(e.bx - e.ax, e.by - e.ay) / 22));
  const sag = 26 + Math.sin(S.t * 4) * 6;
  const pt = (t) => ({ x: lerp(e.ax, e.bx, t), y: lerp(e.ay, e.by, t) + Math.sin(t * Math.PI) * sag });
  ctx.globalAlpha = 0.35; ctx.strokeStyle = '#9BE15D'; ctx.lineWidth = 16;
  ctx.beginPath(); for (let i = 0; i <= n; i++) { const p = pt(i / n); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); } ctx.stroke();
  ctx.globalAlpha = 1;
  for (let i = 0; i < n; i++) {
    const p = pt((i + 0.5) / n), q = pt((i + 0.6) / n);
    const a = Math.atan2(q.y - p.y, q.x - p.x) + (i % 2 ? Math.PI / 2 : 0);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    ctx.lineWidth = 6.5; ctx.strokeStyle = K; ctx.beginPath(); ctx.ellipse(0, 0, 10, 5.5, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#C9D2DC'; ctx.stroke();
    ctx.restore();
  }
}
export function drawFx(ctx, f) {
  const k = clamp(f.t / f.dur, 0, 1);
  if (f.type === 'ring') {
    ctx.globalAlpha = 1 - k;
    const r = lerp(f.r0, f.r1, 1 - Math.pow(1 - k, 2));
    ctx.lineWidth = (f.w || 5) + 4; ctx.strokeStyle = K; ctx.beginPath(); if (f.ground) ctx.ellipse(f.x, f.y, r, r * 0.55, 0, 0, TAU); else ctx.arc(f.x, f.y, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = f.w || 5; ctx.strokeStyle = f.col; ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.type === 'slash') {
    ctx.globalAlpha = 1 - k;
    const span = f.wide ? 2.2 : 1.6, a0 = f.a - span / 2 + k * 0.3, a1 = f.a + span / 2 * (0.4 + k * 0.6);
    ctx.lineWidth = f.wide ? 16 : 10; ctx.strokeStyle = K; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, a0, a1); ctx.stroke();
    ctx.lineWidth = f.wide ? 9 : 5.5; ctx.strokeStyle = f.col; ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.type === 'cleave') {
    const ease = 1 - Math.pow(1 - k, 2.2);
    const span = 2.45;
    const a0 = f.a - span * 0.52 + ease * 0.38;
    const a1 = f.a - span * 0.1 + span * 0.65 * Math.min(1, ease * 1.45);
    const rr = f.r * (0.82 + 0.22 * ease);
    ctx.save();
    ctx.lineCap = 'round';
    // Outer shockwave trail
    ctx.globalAlpha = (1 - k) * 0.35;
    ctx.lineWidth = f.crush ? 34 : 26;
    ctx.strokeStyle = f.crush ? '#FF8A4C' : '#F2C230';
    ctx.beginPath(); ctx.arc(f.x, f.y, rr * 0.94, a0, a1); ctx.stroke();
    // Main inked blade crescent
    ctx.globalAlpha = 1 - k * 0.85;
    ctx.lineWidth = f.crush ? 22 : 18;
    ctx.strokeStyle = K;
    ctx.beginPath(); ctx.arc(f.x, f.y, rr, a0, a1); ctx.stroke();
    ctx.lineWidth = f.crush ? 13 : 10;
    ctx.strokeStyle = f.col || '#F2C230';
    ctx.stroke();
    // Inner white-hot razor edge
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(f.x, f.y, rr + 2, a0 + 0.18, a1); ctx.stroke();
    ctx.restore();
  } else if (f.type === 'whirl') {
    const wx = f.h ? f.h.x : f.x, wy = (f.h ? f.h.y : f.y) - 28;
    const spin = k * TAU * 2.1;
    const fade = k < 0.8 ? 1 : (1 - k) / 0.2;
    ctx.save();
    ctx.translate(wx, wy);
    ctx.scale(1, 0.64);
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 2; arm++) {
      const a0 = spin + arm * Math.PI;
      const a1 = a0 + 2.05;
      const rr = f.r * (0.86 + 0.14 * Math.sin(k * Math.PI));
      ctx.globalAlpha = fade * 0.3;
      ctx.lineWidth = 28; ctx.strokeStyle = '#FF8A4C';
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.92, a0, a1); ctx.stroke();
      ctx.globalAlpha = fade * 0.92;
      ctx.lineWidth = 17; ctx.strokeStyle = K;
      ctx.beginPath(); ctx.arc(0, 0, rr, a0, a1); ctx.stroke();
      ctx.lineWidth = 9.5; ctx.strokeStyle = f.col || '#F2C230';
      ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(0, 0, rr + 2, a0 + 0.35, a1); ctx.stroke();
    }
    ctx.restore();
  } else if (f.type === 'beam') {
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 9; ctx.strokeStyle = K; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x2, f.y2); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = f.col; ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.type === 'nova') {
    ctx.globalAlpha = 1 - k;
    const r = f.r * (0.3 + 0.7 * Math.sqrt(k));
    ctx.fillStyle = 'rgba(143, 214, 255, 0.25)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 7; ctx.strokeStyle = K; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#DDF3FF'; ctx.stroke();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; drawSpr(ctx, 'shard_ice', f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.6 - 10, { sx: 1.6, sy: 1.6 }); }
    ctx.globalAlpha = 1;
  } else if (f.type === 'comet') {
    const z = (1 - k) * 420;
    drawSpr(ctx, 'comet', f.x - (1 - k) * 160, f.y - 30 - z, { rot: Math.atan2(420, 160) * 0.5 + 0.3, sx: 1.4, sy: 1.4 });
  } else if (f.type === 'swipe') {
    ctx.globalAlpha = 1 - k;
    ctx.lineWidth = 12; ctx.strokeStyle = K; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(lerp(f.x, f.x2, Math.min(1, k * 2)), lerp(f.y, f.y2, Math.min(1, k * 2))); ctx.stroke();
    if (f.col) { ctx.globalAlpha = (1 - k) * 0.4; ctx.lineWidth = 26; ctx.strokeStyle = f.col; ctx.stroke(); ctx.globalAlpha = 1 - k; }
    ctx.lineWidth = 6; ctx.strokeStyle = f.col || '#FFFFFF'; ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawDark(ctx) {
  const cv = VIEW.cv;
  if (!VIEW.dark || VIEW.dark.width !== cv.width || VIEW.dark.height !== cv.height) VIEW.dark = mkCanvas(cv.width, cv.height);
  const d = VIEW.dark, g = d.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = `rgba(14, 9, 24, ${0.86 * S.dark})`;
  g.fillRect(0, 0, d.width, d.height);
  g.setTransform(ctx.getTransform());
  g.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => { g.globalAlpha = 0.5; g.beginPath(); g.arc(x, y, r * 1.35, 0, TAU); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  g.fillStyle = '#000';
  const w = S.walkout && !S.walkout.done && S.walkout.tell === 'pet' ? S.walkout : null;
  for (const h of S.heroes) if (h.alive) hole(h.x, h.y - 40, w ? 46 : 120);
  if (w) { const ly = w.y - 50 - 60 * w.lift; hole(w.x, ly - 26, 96 + Math.sin(S.t * 7) * 4); if (w.pet) hole(w.pet.x, w.y - 40, 56); }
  for (const m of S.mobs) { if (!m.alive) continue; if (m.M.light && !m.hidden) hole(m.x + m.M.light.dx * (m.flip ? -1 : 1), m.y + m.M.light.dy, m.M.light.r); if (m.M.wisp) hole(m.x, m.y - 40, 60); }
  for (const z of S.hazards) if (!z.noDmg) hole(z.x, z.y, (z.r || 60) * 0.9 + 20);
  for (const z of S.zones) hole(z.x, z.y, z.r);
  for (const g2 of S.rings) { g.globalAlpha = 1; g.lineWidth = g2.w + 40; g.beginPath(); g.arc(g2.x, g2.y, g2.r, 0, TAU); g.stroke(); }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(d, 0, 0); ctx.restore();
}

export function drawTexts(ctx) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (const t of S.texts) {
    const k = t.t / t.dur;
    const pop = k < 0.12 ? 1 + (0.12 - k) * 3 : 1;
    ctx.globalAlpha = 1 - clamp((k - 0.7) / 0.3, 0, 1);
    ctx.font = `${Math.round(t.size * pop)}px ${FONT}`;
    ctx.lineWidth = Math.max(4, t.size * 0.26); ctx.strokeStyle = K;
    ctx.strokeText(t.str, t.x, t.y); ctx.fillStyle = t.col; ctx.fillText(t.str, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
export function drawAim(ctx) {
  const a = AIM.get && AIM.get();
  if (!a || !S.player.alive) return;
  const def = AB[S.player.role][a.slot];
  const p = { x: a.x, y: a.y };
  const r = def.key === 'circle' ? 110 : 120;
  const col = def.key === 'circle' ? '#F2C230' : '#DDF3FF';
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.setLineDash([12, 10]);
  ctx.beginPath(); ctx.arc(S.player.x, S.player.y, def.range, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = def.key === 'circle' ? 'rgba(242, 194, 48, 0.22)' : 'rgba(143, 214, 255, 0.22)';
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = K; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
  ctx.globalAlpha = 1;
}
