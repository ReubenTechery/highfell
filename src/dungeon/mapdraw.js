/* ---------- drawing the map: floors, walls and doors, for any layout ----------
   A box room has its north wall face (with torches and banners), caps round its edges, and a gap wherever a
   door is, on any side. A round room is a drum: its far half rises as a wall face. A north-south corridor
   has caps down both sides; an east-west one has a wall face along its north side. Layouts: layout.js. */
import { TAU } from '../core/math';
import { S } from './state.js';
import { PAT, drawSpr } from './art.js';

const K = '#1E1A1A'; // the one black line
const T = 30; // how thick a wall's cap is
const CW = 70; // how tall an east-west corridor's wall face is

/* [lo, hi] with the doors' spans cut out of it */
function spans(lo, hi, cuts) {
  const out = [];
  let a = lo;
  for (const [c0, c1] of cuts.slice().sort((p, q) => p[0] - q[0])) { if (c0 > a) out.push([a, c0]); a = Math.max(a, c1); }
  if (hi > a) out.push([a, hi]);
  return out;
}
const doorsOn = (r, side) => r.doors.filter((d) => d.side === side);
const floorPat = (r) => PAT[r.floor === 'yard' ? 'yard' : r.floor === 'tomb' ? 'tomb' : 'stone'] || '#4A4060';
/* the top of a round room's floor at x (where its far wall stands) */
const roundTop = (r, x) => r.y - Math.sqrt(Math.max(0, r.r * r.r - (x - r.x) * (x - r.x)));

export function drawMap(ctx, v) {
  const M = S.dg.map;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let i = 0; i < M.rooms.length; i++) {
    const r = M.rooms[i];
    if (r.y1 + 40 < v.y0 || r.y0 - r.wall - 40 > v.y1) continue;
    ctx.fillStyle = floorPat(r);
    if (r.round) { ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.fill(); }
    else ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    if (S.dg.floorArt) S.dg.floorArt(ctx, i, r, K);
  }
  for (const c of M.corridors) {
    if (c.y1 < v.y0 || c.y0 > v.y1) continue;
    ctx.fillStyle = PAT.corr || '#453B5A';
    const f = corridorFloor(M, c);
    ctx.fillRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0);
  }
  for (const d of S.dg.decals) { if (d.y < v.y0 || d.y > v.y1 + 100) continue; drawSpr(ctx, d.sp, d.x, d.y, { sx: d.sc, sy: d.sc, rot: d.rot * 0.25 }); }
  const CAP = PAT.wallCapCol || '#2E2638';
  for (let i = 0; i < M.rooms.length; i++) {
    const r = M.rooms[i];
    if (r.y1 + 40 < v.y0 || r.y0 - r.wall - 60 > v.y1) continue;
    if (r.round) roundWalls(ctx, r, CAP); else boxWalls(ctx, r, CAP);
    for (const w of S.dg.walldecor) {
      if (w[2] !== i) continue;
      const top = (r.round ? roundTop(r, w[1]) : r.y0) - r.wall;
      if (w[0] === 'torch') {
        const fl = 0.75 + Math.sin(S.t * 9 + w[1]) * 0.12 + Math.sin(S.t * 23 + w[1] * 2) * 0.06;
        ctx.globalAlpha = 0.16 * fl; ctx.fillStyle = '#FF8A4C';
        ctx.beginPath(); ctx.arc(w[1], top + r.wall * 0.45, 70, 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
        drawSpr(ctx, 'torch', w[1], top + r.wall * 0.72, { sy: 0.96 + fl * 0.05 });
      } else drawSpr(ctx, 'banner', w[1], top + 10, {});
    }
  }
  for (const c of M.corridors) {
    if (c.y1 < v.y0 || c.y0 - CW - T > v.y1) continue;
    if (c.dir === 'h') { sideCorridorWalls(ctx, c, CAP); continue; }
    ctx.fillStyle = CAP;
    ctx.fillRect(c.x0 - 26, c.y0, 26, c.y1 - c.y0); ctx.fillRect(c.x1, c.y0, 26, c.y1 - c.y0);
    ctx.strokeStyle = K; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(c.x0, c.y0); ctx.lineTo(c.x0, c.y1); ctx.moveTo(c.x1, c.y0); ctx.lineTo(c.x1, c.y1); ctx.stroke();
  }
}

/* a corridor's floor runs on under a round room's curved edge, so no gap shows where they meet */
function corridorFloor(M, c) {
  const f = { x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1 };
  for (const r of [M.rooms[c.a], M.rooms[c.b]]) {
    if (!r.round) continue;
    const sag = r.r - Math.sqrt(Math.max(0, r.r * r.r - (c.w / 2) * (c.w / 2))) + 4;
    if (c.dir === 'v') { if (r.y < c.y0) f.y0 -= sag; else f.y1 += sag; }
    else if (r.x < c.x0) f.x0 -= sag; else f.x1 += sag;
  }
  return f;
}

/* a box room: the north wall's face with a gap for each north door, caps all round with a gap for each
   door, and the ink */
function boxWalls(ctx, r, CAP) {
  const north = doorsOn(r, 'n'), south = doorsOn(r, 's'), west = doorsOn(r, 'w'), east = doorsOn(r, 'e');
  const top = r.y0 - r.wall;
  // contact shadow under the north wall
  ctx.fillStyle = 'rgba(16, 10, 24, 0.3)';
  ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, 16);
  // north wall face with the doorway gaps
  ctx.fillStyle = PAT.brick || '#5C5070';
  const segs = spans(r.x0 - T, r.x1 + T, north.map((d) => [d.x0, d.x1]));
  for (const [a, b] of segs) ctx.fillRect(a, top, b - a, r.wall);
  for (const d of north) { ctx.fillStyle = PAT.corr || '#453B5A'; ctx.fillRect(d.x0, top, d.x1 - d.x0, r.wall); }
  // caps
  ctx.fillStyle = CAP;
  ctx.fillRect(r.x0 - T, top - T, r.x1 - r.x0 + 2 * T, T);
  for (const [a, b] of spans(top - T, r.y1 + T, west.map((d) => [d.y0, d.y1]))) ctx.fillRect(r.x0 - T, a, T, b - a);
  for (const [a, b] of spans(top - T, r.y1 + T, east.map((d) => [d.y0, d.y1]))) ctx.fillRect(r.x1, a, T, b - a);
  for (const [a, b] of spans(r.x0 - T, r.x1 + T, south.map((d) => [d.x0, d.x1]))) ctx.fillRect(a, r.y1, b - a, T);
  for (const d of north) { ctx.fillStyle = CAP; ctx.fillRect(d.x0 - 26, top - T, 26, r.wall + T); ctx.fillRect(d.x1, top - T, 26, r.wall + T); }
  // ink
  ctx.strokeStyle = K; ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (const [a, b] of segs) { ctx.moveTo(a, r.y0); ctx.lineTo(b, r.y0); ctx.moveTo(a, top); ctx.lineTo(b, top); }
  for (const [a, b] of spans(top, r.y1, west.map((d) => [d.y0, d.y1]))) { ctx.moveTo(r.x0, a); ctx.lineTo(r.x0, b); }
  for (const [a, b] of spans(top, r.y1, east.map((d) => [d.y0, d.y1]))) { ctx.moveTo(r.x1, a); ctx.lineTo(r.x1, b); }
  for (const [a, b] of spans(r.x0, r.x1, south.map((d) => [d.x0, d.x1]))) { ctx.moveTo(a, r.y1); ctx.lineTo(b, r.y1); }
  for (const d of north) { ctx.moveTo(d.x0, top); ctx.lineTo(d.x0, r.y0); ctx.moveTo(d.x1, top); ctx.lineTo(d.x1, r.y0); }
  ctx.stroke();
}

/* a round room: the far half of its rim rises as a wall face, a cap runs all the way round, and every door
   cuts a gap through both */
function roundWalls(ctx, r, CAP) {
  const { x, y, wall } = r, R = r.r;
  // a door's gap, as angles on the rim (a north door's at 3/2 pi: canvas angles turn clockwise)
  const at = { n: Math.PI * 1.5, s: Math.PI * 0.5, e: 0, w: Math.PI };
  const cuts = r.doors.map((d) => {
    const half = Math.asin(Math.min(1, ((d.side === 'n' || d.side === 's' ? d.x1 - d.x0 : d.y1 - d.y0) / 2) / R));
    const mid = at[d.side] + (d.side === 'n' ? (d.x0 + d.x1) / 2 - x : d.side === 's' ? x - (d.x0 + d.x1) / 2 : d.side === 'e' ? (d.y0 + d.y1) / 2 - y : y - (d.y0 + d.y1) / 2) / R;
    return [mid - half, mid + half];
  });
  // arcs of [a0, a1] (angles, any turn) with the door gaps cut out
  const arcs = (a0, a1) => {
    const cs = [];
    for (const [c0, c1] of cuts) for (const k of [-TAU, 0, TAU]) if (c1 + k > a0 && c0 + k < a1) cs.push([c0 + k, c1 + k]);
    return spans(a0, a1, cs);
  };
  const face = arcs(Math.PI, TAU);
  // the far wall's face: between the floor's top half and the same arc lifted by the wall's height
  ctx.fillStyle = PAT.brick || '#5C5070';
  for (const [a, b] of face) {
    ctx.beginPath(); ctx.arc(x, y, R, a, b); ctx.arc(x, y - wall, R, b, a, true); ctx.closePath(); ctx.fill();
  }
  // the gaps in it show the corridor going away
  ctx.fillStyle = PAT.corr || '#453B5A';
  for (const d of doorsOn(r, 'n')) { const e = roundTop(r, (d.x0 + d.x1) / 2); ctx.fillRect(d.x0, e - wall, d.x1 - d.x0, wall + 2); }
  // a contact shadow under the far wall
  ctx.strokeStyle = 'rgba(16, 10, 24, 0.3)'; ctx.lineWidth = 16; ctx.lineCap = 'butt';
  for (const [a, b] of face) { ctx.beginPath(); ctx.arc(x, y, R - 8, a, b); ctx.stroke(); }
  // the cap: over the top of the far wall, down its ends, and round the near half of the rim
  ctx.strokeStyle = CAP; ctx.lineWidth = T;
  for (const [a, b] of face) { ctx.beginPath(); ctx.arc(x, y - wall, R + T / 2, a, b); ctx.stroke(); }
  for (const [a, b] of arcs(0, Math.PI)) { ctx.beginPath(); ctx.arc(x, y, R + T / 2, a, b); ctx.stroke(); }
  ctx.fillStyle = CAP;
  if (!cuts.some(([c0, c1]) => c0 <= 0 && c1 >= 0)) ctx.fillRect(x + R, y - wall, T, wall);
  if (!cuts.some(([c0, c1]) => c0 <= Math.PI && c1 >= Math.PI)) ctx.fillRect(x - R - T, y - wall, T, wall);
  ctx.lineCap = 'round';
  // ink: the floor's edge all round, the top of the far wall, its two ends, and the door jambs
  ctx.strokeStyle = K; ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (const [a, b] of arcs(0, TAU)) { ctx.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.arc(x, y, R, a, b); }
  for (const [a, b] of face) { ctx.moveTo(x + Math.cos(a) * R, y - wall + Math.sin(a) * R); ctx.arc(x, y - wall, R, a, b); }
  for (const s of [-1, 1]) if (!cuts.some(([c0, c1]) => (s > 0 ? c0 <= 0 && c1 >= 0 : c0 <= Math.PI && c1 >= Math.PI))) { ctx.moveTo(x + s * R, y - wall); ctx.lineTo(x + s * R, y); }
  for (const d of doorsOn(r, 'n')) {
    for (const xx of [d.x0, d.x1]) { const e = roundTop(r, xx); ctx.moveTo(xx, e - wall); ctx.lineTo(xx, e); }
  }
  ctx.stroke();
}

/* an east-west corridor: a wall face along its north side under a cap, a cap along its south side */
function sideCorridorWalls(ctx, c, CAP) {
  const top = c.y0 - CW;
  ctx.fillStyle = PAT.brick || '#5C5070';
  ctx.fillRect(c.x0, top, c.x1 - c.x0, CW);
  ctx.fillStyle = 'rgba(16, 10, 24, 0.3)';
  ctx.fillRect(c.x0, c.y0, c.x1 - c.x0, 12);
  ctx.fillStyle = CAP;
  ctx.fillRect(c.x0, top - T, c.x1 - c.x0, T);
  ctx.fillRect(c.x0, c.y1, c.x1 - c.x0, 26);
  ctx.strokeStyle = K; ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(c.x0, c.y0); ctx.lineTo(c.x1, c.y0); ctx.moveTo(c.x0, top); ctx.lineTo(c.x1, top); ctx.moveTo(c.x0, c.y1); ctx.lineTo(c.x1, c.y1);
  ctx.stroke();
}
