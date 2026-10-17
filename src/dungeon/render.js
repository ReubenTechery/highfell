import { TAU, angTo, clamp, dist, lerp } from '../core/math';
import { vrand } from '../core/rng';
import { AB, abKey } from '../content/roles';
import { RARITY } from '../content/gear';
import { S } from './state.js';
import { BAKE_S, FONT, K, PAT, bakeAll, drawSpr, makePatterns, mkCanvas } from './art.js';
import { PERFECT_WINDOW, dots } from './entities.js';
import { drawWalkout, walkoutFocus } from './walkout.js';
import { CURSE_COL, CURSE_TIME } from './mobs.js';
import { drawAir, drawFx, drawTexts } from './drawfx.js';
import { drawMap } from './mapdraw.js';
import { areaOf } from './world.js';

/* ---------- drawing: the crypt, everyone in it, and the effects ---------- */
/** @type {any} */
export const VIEW = { cv: null, ctx: null, W: 0, H: 0, dpr: 1, scale: 1, S: 1, fx: 0, fy: 0, cam: { x: 500, y: 5600 }, dark: null };
export { K, FONT };
/* the screen layer tells the renderer what the player is aiming, if anything: () => { key, range, x, y, r } | null */
/** @type {{ get: null | (() => any) }} */
export const AIM = { get: null };

/** the zoom a view of this size draws the dungeon at, in screen pixels per world unit */
const viewScale = (W, H) => { const portrait = H > W; return clamp(Math.min(W / (portrait ? 560 : 900), H / (portrait ? 980 : H < 520 ? 640 : 860)), 0.42, 1.35); };
const bakeScale = (S) => Math.ceil(S * 4) / 4;
/** bake the sprites once at start, at the size a run on this screen will want, so their SVGs can be let go */
export function prebake() {
  bakeAll(bakeScale(viewScale(window.innerWidth, window.innerHeight) * Math.min(2, window.devicePixelRatio || 1)));
}
export function resizeView() {
  const cv = VIEW.cv, box = cv.parentElement.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  VIEW.W = box.width; VIEW.H = box.height; VIEW.dpr = dpr;
  cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
  const portrait = VIEW.H > VIEW.W;
  VIEW.scale = viewScale(VIEW.W, VIEW.H);
  VIEW.S = VIEW.scale * dpr;
  VIEW.portrait = portrait;
  VIEW.fx = VIEW.W / 2; VIEW.fy = VIEW.H * (portrait ? 0.6 : 0.58);
  const want = bakeScale(VIEW.S);
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
  // keep to the room (or corridor) you're in
  const room = S.dg.map.chain[areaOf(p.x, p.y)];
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
  if (S && S.dg && S.dg.theme && PAT.themeId !== S.dg.theme.id && BAKE_S > 0) makePatterns(BAKE_S, S.dg.theme);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAT.voidCol || '#17121F';
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
  drawCurses(ctx, v);
  drawTexts(ctx, v);
  drawAim(ctx);
}

/* ---------- ground layer: shadows, telegraphs, zones ---------- */
export function drawGround(ctx, v) {
  if (S.seal && S.seal.active && !S.seal.done) drawSeal(ctx);
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
  for (const m of S.mobs) if (m.alive && !m.cage && !m.M.draw) ents.push(m);
  for (const tr of S.thralls || []) if (tr.alive) ents.push(tr);
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
    ctx.strokeStyle = p.st && p.st.surge > 0 ? '#FFE08A' : p.st && p.st.zeal > 0 ? '#9BE15D' : '#F2C230';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, p.r + 12, (p.r + 12) * 0.38, 0, 0, TAU); ctx.stroke();
    const t = p.picked || p.target;
    if (t && t.alive && !t.hidden) {
      ctx.strokeStyle = t.exposed > 0 ? '#F2C230' : '#FF6B5E'; ctx.lineWidth = 3.5; ctx.setLineDash([10, 8]);
      const rr = (t.isBoss ? t.r * 1.6 : t.r * 1.5) + 8;
      ctx.beginPath(); ctx.ellipse(t.x, t.y + 2, rr, rr * 0.38, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}
export function drawSeal(ctx) {
  const seal = S.seal;
  if (!seal || !seal.pads) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(242, 194, 48, 0.38)';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  for (let i = 0; i < seal.pads.length; i++) {
    const a = seal.pads[i], b = seal.pads[(i + 1) % seal.pads.length];
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  const roleCol = { tank: '#F2C230', healer: '#9BE15D', dps: '#8FD6FF' };
  for (const pad of seal.pads) {
    const col = roleCol[pad.role] || '#F2C230';
    const pulse = 1 + Math.sin(S.t * 6) * 0.06;
    ctx.fillStyle = pad.lit ? 'rgba(242, 194, 48, 0.34)' : 'rgba(30, 22, 44, 0.55)';
    ctx.beginPath(); ctx.arc(pad.x, pad.y, pad.r * pulse, 0, TAU); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = K; ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = pad.lit ? '#FFE08A' : col; ctx.stroke();
    ctx.beginPath(); ctx.arc(pad.x, pad.y, pad.r * 0.45, 0, TAU); ctx.stroke();
  }
  ctx.font = `18px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.strokeStyle = K;
  ctx.strokeText(`Crypt Seal: ${seal.name}`, seal.x, seal.y - 88);
  ctx.fillStyle = '#FFE08A';
  ctx.fillText(`Crypt Seal: ${seal.name}`, seal.x, seal.y - 88);
  ctx.restore();
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
  // a zone that draws itself (a gadget's turret)
  if (z.draw) { z.draw(ctx, z, drawSpr, fade); ctx.globalAlpha = 1; return; }
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
  const rx = S.ring.x !== undefined ? S.ring.x : A.x;
  const ry = S.ring.y !== undefined ? S.ring.y : A.y;
  ctx.fillStyle = 'rgba(80, 160, 60, 0.22)';
  ctx.beginPath(); ctx.arc(A.x, A.y, A.r + 300, 0, TAU); ctx.arc(rx, ry, R, 0, TAU, true); ctx.fill();
  ctx.fillStyle = 'rgba(155, 225, 93, 0.09)';
  ctx.beginPath(); ctx.arc(rx, ry, R, 0, TAU); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = K; ctx.beginPath(); ctx.arc(rx, ry, R, 0, TAU); ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = '#9BE15D'; ctx.stroke();
  const n = Math.round((TAU * R) / 34);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, x = rx + Math.cos(a) * R, y = ry + Math.sin(a) * R;
    const h = 16 + Math.sin(S.t * 10 + i * 1.7) * 6;
    ctx.fillStyle = i % 2 ? '#9BE15D' : '#D8FFB8'; ctx.strokeStyle = K; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 7, y - h * 0.6, x, y - h); ctx.quadraticCurveTo(x + 7, y - h * 0.6, x + 7, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

/* ---------- y-sorted objects ---------- */
export function drawObjects(ctx, v) {
  const list = [];
  for (const p of S.props) if (p.y > v.y0 - 40 && p.y < v.y1 + 220) list.push({ y: p.y, k: 0, o: p });
  for (const a of S.dg.map.arches) if (a.y > v.y0 - 40 && a.y < v.y1 + 260) list.push({ y: a.y, k: 1, o: a });
  for (const g of Object.values(S.gates)) { const gy = g.x !== undefined ? g.y1 : g.y; if (g.closed && gy > v.y0 && gy < v.y1 + 200) list.push({ y: gy + 10, k: 2, o: g }); }
  for (const h of S.heroes) list.push({ y: h.y, k: 3, o: h });
  for (const m of S.mobs) if (m.y > v.y0 - 60 && m.y < v.y1 + 340) list.push({ y: m.y + (m.cage ? 2 : 0), k: 4, o: m });
  for (const f of S.fx) if (f.type === 'hand') list.push({ y: f.y, k: 5, o: f });
  if (S.chest) list.push({ y: S.chest.y, k: 6, o: S.chest });
  for (const tr of S.thralls || []) if (tr.alive && tr.y > v.y0 - 40 && tr.y < v.y1 + 200) list.push({ y: tr.y, k: 7, o: tr });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) {
    const o = it.o;
    if (it.k === 0) drawSpr(ctx, o.sp, o.x, o.y, { sx: o.sc, sy: o.sc });
    else if (it.k === 1) drawSpr(ctx, 'arch', o.x, o.y, {});
    else if (it.k === 2) { if (o.x !== undefined) drawSideGate(ctx, o); else drawSpr(ctx, 'gate', (o.x0 + o.x1) / 2, o.y + 8, { sy: o.north ? 1 : 0.55 }); }
    else if (it.k === 3) drawHero(ctx, o);
    else if (it.k === 4) drawMob(ctx, o);
    else if (it.k === 5) { const k = clamp(o.t / 0.15, 0, 1), out = 1 - clamp((o.t - o.dur + 0.3) / 0.3, 0, 1); drawSpr(ctx, 'hand', o.x, o.y, { sy: k * out, alpha: out }); }
    else if (it.k === 6) {
      const s = o.open ? 'chest_open' : 'chest';
      const ready = !S.walkout || S.walkout.done;
      if (!o.open && ready) { ctx.globalAlpha = 0.25 + Math.sin(S.t * 4) * 0.1; ctx.fillStyle = '#F2C230'; ctx.beginPath(); ctx.arc(o.x, o.y - 30, 70, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      const hop = o.knockT > 0 ? Math.sin((o.knockT / 0.22) * Math.PI) * 14 : 0;
      drawSpr(ctx, s, o.x, o.y - hop, { sx: 1.15 + hop * 0.004, sy: 1.15 - hop * 0.004 + (o.open || !ready ? 0 : Math.sin(S.t * 5) * 0.02) });
    } else if (it.k === 7) drawThrall(ctx, o);
  }
}
/* a gate across an east or west door, seen from above: iron bars on a beam */
function drawSideGate(ctx, g) {
  ctx.fillStyle = '#4A4A52'; ctx.strokeStyle = K; ctx.lineWidth = 3.5;
  roundRect(ctx, g.x - 9, g.y0 - 6, 18, g.y1 - g.y0 + 12, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8C8C96';
  for (let y = g.y0 + 14; y < g.y1 - 6; y += 22) { ctx.beginPath(); ctx.arc(g.x, y, 4.5, 0, TAU); ctx.fill(); ctx.stroke(); }
}
export function drawThrall(ctx, tr) {
  const sp = tr.sp === 'rattler' ? 'rattler' : tr.sp + '_f';
  const fade = clamp(tr.life / 0.5, 0, 1);
  let x = tr.x, y = tr.y, sy = 0.78;
  if (tr.moving > 0) y -= Math.abs(Math.sin(tr.walkT)) * 4;
  if (tr.lunge > 0) { const k = tr.lunge / 0.14; x += Math.cos(tr.lungeA) * 9 * k; y += Math.sin(tr.lungeA) * 5 * k; }
  const tint = tr.kind === 'shade' ? 'ghost' : tr.kind === 'frost' ? 'frost' : 'gold';
  drawSpr(ctx, sp, x, y, { flip: tr.flip, sx: 0.78, sy, alpha: fade * (tr.kind === 'shade' ? 0.72 : 0.92), tint, tintA: 0.48 });
}
/** Where a hero's weapon is, seen from the front (the glow goes behind it), and the top of its head or hat (what
 *  floats over a hero goes above it): its fit, worked out with its picture (src/ui/heroart.ts). From behind, the
 *  weapon is in the other hand. */
export function heroFit(back, own) {
  const fit = own || { weapon: [0, -80], top: -112 };
  return { wx: back ? -fit.weapon[0] : fit.weapon[0], wy: fit.weapon[1], top: fit.top };
}
export function drawHero(ctx, h) {
  const name = h.sprite + (h.back ? '_b' : '_f');
  const { wx, wy, top } = heroFit(h.back, h.fit);
  if (!h.alive) {
    drawSpr(ctx, name, h.x, h.y - 6, { rot: -Math.PI / 2 * (h.flip ? -1 : 1) * Math.min(1, h.deadT * 5), alpha: 0.5, sx: 0.9, sy: 0.9 });
    return;
  }
  const held = h.holdT > 0 && h.holdX !== undefined;
  let x = held ? h.holdX : h.x, y = held ? h.holdY : h.y;
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
  // gear glow behind the weapon (both hands for twin-dagger rogues)
  if (h.weaponRar >= 2) {
    const fx_ = h.flip ? -wx : wx;
    const col = RARITY[h.weaponRar].color;
    ctx.globalAlpha = 0.3 + Math.sin(S.t * 3) * 0.08; ctx.fillStyle = col;
    const rGlow = h.weaponRar === 3 ? (h.cls === 'rogue' ? 18 : 24) : (h.cls === 'rogue' ? 13 : 17);
    ctx.beginPath(); ctx.arc(x + fx_, y + wy, rGlow, 0, TAU); ctx.fill();
    if (h.cls === 'rogue') { ctx.beginPath(); ctx.arc(x - fx_, y + wy, rGlow, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
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
  // something has turned on you (and you're not the tank): an orange ring under you says get to the tank
  if (h.isPlayer && h.role !== 'tank' && S.mobs.some((m) => m.alive && m.state === 'fight' && m.target === h && !m.cage && !m.M.wisp)) {
    ctx.globalAlpha = 0.6 + Math.sin(S.t * 9) * 0.2; ctx.lineWidth = 6; ctx.strokeStyle = '#FF8A3D';
    ctx.beginPath(); ctx.ellipse(h.x, h.y + 2, 46, 21, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // your set's look: gold (the old Gravegold Dye), ghostly (the Ghostly Dye; run.ts lets it win), or
  // glowing like mushrooms in the dark (the Sporeglow Dye, on a Thimblebriar set)
  const gold = h.isPlayer && S.opts.gilded, ghost = (h.st && h.st.ghost > 0) || (!gold && h.isPlayer && S.opts.ghostly);
  const spore = !gold && !ghost && h.isPlayer && S.opts.sporeglow;
  if (spore && S.frame % 8 === 0) S.parts.push({ x: h.x + vrand(-22, 22), y: h.y, z: vrand(10, 70), vx: 0, vy: 0, vz: 0, up: true, col: '#C8F5A8', size: vrand(2, 3.5), t: 0, dur: 1.0 });
  // your heal lands: the mate glows green a moment (the spore tint is the green)
  const glow = !(h.flash > 0) && h.healGlow > 0;
  drawSpr(ctx, name, x, yy, { flip: spinFlip, sx, sy, rot: rot, alpha: ghost ? 0.76 : 1, tint: h.flash > 0 ? 'flash' : glow ? 'spore' : gold ? 'gold' : ghost ? 'ghost' : spore ? 'spore' : null, tintA: h.flash > 0 ? Math.max(0, h.flash) / 0.12 : glow ? 0.5 * Math.min(1, h.healGlow / 0.12) : gold ? 0.4 : spore ? 0.3 : 0.45 });
  if (h.st && h.st.ghost > 0) {
    ctx.globalAlpha = 0.3 + Math.sin(S.t * 8) * 0.1; ctx.strokeStyle = '#FFE08A'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.ellipse(h.x, h.y + (top + 2) / 2, 48, (24 - top) / 2, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
  }
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
/* curses go over everything, the dark too: the healer has to see them. Until you've lifted three, the swipe
   that lifts one is drawn across the cursed hero (opts.swipeHint, set by the run screen). */
function drawCurses(ctx, v) {
  const teach = S.opts.swipeHint && S.player.role === 'healer' && S.player.alive;
  for (const h of S.heroes) {
    if (!h.alive || !h.st.curse || h.y < v.y0 || h.y > v.y1) continue;
    const { top } = heroFit(h.back, h.fit);
    curseMark(ctx, h.x, h.y + top - 12, h.st.curse.t / CURSE_TIME, h.st.curse);
    if (teach) swipeArrow(ctx, h.x, h.y - 40);
  }
}
/* a gold arrow sweeping left to right across the hero, about once a second */
function swipeArrow(ctx, x, y) {
  const k = (S.t * 1.1) % 1, x0 = x - 90, hx = lerp(x0, x + 90, k);
  ctx.save();
  ctx.globalAlpha = clamp(k * 4, 0, 1) * clamp((1 - k) * 4, 0, 1);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(hx, y);
  ctx.lineWidth = 13; ctx.strokeStyle = K; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = '#FFE08A'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 20, y); ctx.lineTo(hx - 4, y - 17); ctx.lineTo(hx - 4, y + 17); ctx.closePath();
  ctx.fillStyle = '#FFE08A'; ctx.lineWidth = 4; ctx.strokeStyle = K; ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* a curse over a hero's head: the skull (or its own mark, a Sticky Bomb's bomb), and its ring running down over
   the 4 seconds (red at the end) */
function curseMark(ctx, x, y, k, c) {
  const left = clamp(1 - k, 0, 1), cy = y - 24;
  const beat = 1 + Math.sin(S.t * (8 + 16 * k)) * 0.05 * (0.5 + k);
  ctx.globalAlpha = 0.45; ctx.lineWidth = 7; ctx.strokeStyle = K;
  ctx.beginPath(); ctx.arc(x, cy, 36, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(x, cy, 36, -Math.PI / 2, -Math.PI / 2 + TAU * left);
  ctx.lineWidth = 10; ctx.strokeStyle = K; ctx.stroke();
  ctx.lineWidth = 5; ctx.strokeStyle = left < 0.3 ? '#FF6B5E' : c.col || CURSE_COL; ctx.stroke();
  drawSpr(ctx, c.sp || 'curse_skull', x, y, { sx: beat, sy: beat });
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
  // something that isn't a fighter (a bomb) draws itself
  if (m.M.draw) { m.M.draw(ctx, m, drawSpr); return; }
  if (m.cage) { if (!m.alive) return; const k = m.hp / m.maxHp; drawSpr(ctx, 'cage', m.x, m.y + 2, { sy: 1 + Math.sin(S.t * 30) * (m.flash > 0 ? 0.04 : 0), tint: m.flash > 0 ? 'flash' : null, tintA: 0.6 }); castBar(ctx, m.x, m.y - 136, 60, k, '#F0E8D2'); return; }
  if (m.hidden) return;
  let name = (m.M.phaseSprites && m.M.phaseSprites[m.phase]) || m.M.sp;
  if (m.pose && m.M.poseSprites && m.M.poseSprites[m.pose]) name = m.M.poseSprites[m.pose];
  // held still on impact a moment (drawn only: the fight goes on)
  const held = m.holdT > 0 && m.holdX !== undefined;
  let x = held ? m.holdX : m.x, y = held ? m.holdY : m.y, sx = 1, sy = 1, rot = 0, alpha = 1;
  if (!m.alive) {
    // a kill flings a small mob away from whoever landed it, and a big one (a boss too) collapses where it stands
    if (m.M.wisp) { const k = clamp(m.deadT / 0.25, 0, 1); alpha = 1 - k; sy = 1 - k * 0.5; }
    else if (m.M.big || m.isBoss) { const k = clamp(m.deadT / 0.6, 0, 1), e = 1 - Math.pow(1 - k, 2); sy = 1 - e * 0.55; sx = 1 + e * 0.18; rot = (m.flip ? -1 : 1) * e * 0.12; alpha = 1 - clamp((k - 0.55) / 0.45, 0, 1); }
    else {
      const k = clamp(m.deadT / 0.45, 0, 1), e = 1 - Math.pow(1 - k, 2), a = m.dieA ?? -Math.PI / 2;
      x += Math.cos(a) * 64 * e; y += Math.sin(a) * 30 * e - Math.sin(k * Math.PI) * 26;
      rot = (Math.cos(a) >= 0 ? 1 : -1) * e * 1.5; alpha = 1 - clamp((k - 0.5) / 0.5, 0, 1);
    }
    if (alpha <= 0) return;
  }
  if (m.rise > 0) { const k = 1 - m.rise / (m.riseDur || 0.75); alpha = Math.min(1, k * 1.6); sy = 0.3 + k * 0.7; y += (1 - k) * 10; }
  const moving = m.moving > 0;
  if (m.M.wisp) { y -= Math.sin(S.t * 4 + (m.seed || 0)) * 6; }
  else if (moving) { y -= Math.abs(Math.sin(m.walkT)) * (m.M.big ? 6 : 4); sy *= 1 + Math.sin(m.walkT * 2) * 0.03; }
  else sy *= 1 + Math.sin(S.t * 2 + m.home.x) * 0.015;
  if (m.wind > 0 || m.pose === 'wind') { const a = m.target ? angTo(m, m.target) : m.face; x -= Math.cos(a) * 6; sy *= 1.04; rot = -Math.cos(a) * 0.08; }
  if (m.lunge > 0) { const k = m.lunge / 0.18; x += Math.cos(m.lungeA) * 12 * k; y += Math.sin(m.lungeA) * 8 * k; }
  if (m.jumpZ) y -= m.jumpZ;
  if (m.alive) sx = (2 - sy) * 1;
  // a small mob squashes for two frames when hit, nudged back from the hit
  if (m.squash > 0) { const k = m.squash / 0.035, a = m.nudgeA || 0; sx *= 1 + 0.14 * k; sy *= 1 - 0.14 * k; x += Math.cos(a) * 6 * k; y += Math.sin(a) * 3 * k; }
  const frozen = m.st.freeze > 0, chilled = !frozen && m.st.chill > 0;
  if (m.armorUp > 0) { ctx.globalAlpha = 0.12 + Math.sin(S.t * 6) * 0.05; ctx.fillStyle = '#F0E8D2'; ctx.beginPath(); ctx.ellipse(m.x, m.y - 90, 86, 110, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = '#F0E8D2'; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]); }
  if (m.exposed > 0 && m.alive) {
    ctx.globalAlpha = 0.22 + Math.sin(S.t * 10) * 0.08; ctx.fillStyle = '#F2C230';
    ctx.beginPath(); ctx.ellipse(m.x, m.y + 2, m.r * 1.65, m.r * 0.65, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.95; ctx.lineWidth = 4; ctx.strokeStyle = '#F2C230'; ctx.stroke(); ctx.globalAlpha = 1;
  }
  // Exposed: a gold edge round the whole body, so everyone sees the window
  if (m.exposed > 0 && m.alive) drawSpr(ctx, name, x, y + 2, { flip: m.flip, sx: sx * 1.07, sy: sy * 1.04, rot, alpha: 0.75 + Math.sin(S.t * 10) * 0.2, tint: 'gold', tintA: 1, only: true });
  // a hit flashes white; a payoff flashes white, then gold. A Chilled boss wears a lighter frost than a frozen mob,
  // and no ice block round him
  const fk = m.flash > 0 ? m.flash / (m.flashMax || 0.1) : 0, gold = m.flash > 0 && m.flashGold && fk < 0.55;
  drawSpr(ctx, name, x, y, { flip: m.flip, sx, sy, rot, alpha, tint: gold ? 'gold' : m.flash > 0 ? 'flash' : frozen || chilled ? 'frost' : null, tintA: gold ? 0.7 : m.flash > 0 ? (m.isBoss ? 0.4 : 0.7) : chilled ? 0.55 : 1 });
  if (frozen) { ctx.lineWidth = 3; ctx.strokeStyle = '#DDF3FF'; ctx.globalAlpha = 0.9; const hh = m.M.big ? 150 : 90; roundRect(ctx, m.x - m.r - 12, m.y - hh, (m.r + 12) * 2, hh + 4, 10); ctx.stroke(); ctx.globalAlpha = 1; }
  if (m.st.stun > 0) stars(ctx, m.x, m.y - (m.isBoss ? 220 : m.M.big ? 160 : 108), '#F2C230');
  else if (m.st.stagger > 0) stars(ctx, m.x, m.y - 220, '#FFF8EC');
  // a mob on anyone but the tank shows a red "!!" straight away (the tank's cue to grab it back); gone wild, it bobs faster
  const slipped = m.alive && !m.isBoss && !m.M.wisp && m.state === 'fight' && m.target && m.target.role !== 'tank' && !(m.forcedT > 0);
  if (slipped || (m.wild && m.alive && !m.isBoss)) { const yy = m.y - (m.M.big ? 168 : 112) - Math.abs(Math.sin(S.t * (m.wild ? 12 : 7))) * 4; ctx.font = `26px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = K; ctx.strokeText('!!', m.x, yy); ctx.fillStyle = '#FF6B5E'; ctx.fillText('!!', m.x, yy); }
  if (!m.alive) return;
  if (m.cast) castBar(ctx, m.x, m.y - (m.M.big ? 170 : 122), 80, m.cast.t / m.cast.dur, m.cast.kick ? '#9BE15D' : '#F2C230');
  if (!m.isBoss && !m.M.wisp && m.state === 'fight' && m.hp < m.maxHp) {
    const w = m.M.big ? 80 : 48, yy = m.y - (m.M.big ? 158 : 106);
    ctx.fillStyle = '#2A2234'; ctx.strokeStyle = K; ctx.lineWidth = 2.5; roundRect(ctx, x - w / 2, yy, w, 8, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#E04A3F'; roundRect(ctx, x - w / 2 + 1.5, yy + 1.5, Math.max(0, (w - 3) * (m.hp / m.maxHp)), 5, 2.5); ctx.fill();
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
  if (w) {
    const ly = w.y - 50 - 60 * w.lift; hole(w.x, ly - 26, 96 + Math.sin(S.t * 7) * 4);
    // the cuckoo carrying the little king down: light the pair of them, not just his feet
    if (w.pet) { if (w.style === 'cuckoo' && !w.caught) hole(w.pet.x, w.pet.y - 80, 84); else hole(w.pet.x, (w.pet.y ?? w.y) - 40, 56); }
  }
  for (const m of S.mobs) { if (!m.alive) continue; if (m.M.light && !m.hidden) hole(m.x + m.M.light.dx * (m.flip ? -1 : 1), m.y + m.M.light.dy, m.M.light.r); if (m.M.wisp) hole(m.x, m.y - 40, 60); }
  for (const z of S.hazards) if (!z.noDmg) hole(z.x, z.y, (z.r || 60) * 0.9 + 20);
  for (const z of S.zones) hole(z.x, z.y, z.r);
  for (const g2 of S.rings) { g.globalAlpha = 1; g.lineWidth = g2.w + 40; g.beginPath(); g.arc(g2.x, g2.y, g2.r, 0, TAU); g.stroke(); }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(d, 0, 0); ctx.restore();
}

export function drawAim(ctx) {
  const a = AIM.get && AIM.get();
  if (!a || !S.player.alive) return;
  const def = AB[abKey(S.player)][a.slot];
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
