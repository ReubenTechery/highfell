/* Barrow Crypt: the layout. Rooms run bottom (the stairs in) to top (the Gravekeeper's yard),
   joined by corridors on x = 500. 1 world unit = 1 art unit. */
import { TAU } from '../../core/math';

export const MAP = { W: 1000, H: 5800, CX: 500, OV: 70 };
MAP.rooms = [
  { id: 'r0', name: 'Barrow Stairs', x0: 330, y0: 5420, x1: 670, y1: 5760, floor: 'stone', wall: 100 },
  { id: 'r1', name: 'Hall of Bones', x0: 160, y0: 4560, x1: 840, y1: 5220, floor: 'stone', wall: 110 },
  { id: 'r2', name: 'The Ossuary', x0: 100, y0: 3420, x1: 900, y1: 4320, floor: 'stone', wall: 110 },
  { id: 'r3', name: 'The Knight’s Tomb', x0: 160, y0: 2460, x1: 840, y1: 3180, floor: 'tomb', wall: 120 },
  { id: 'r4', name: 'The Catacombs', x0: 120, y0: 1420, x1: 880, y1: 2220, floor: 'stone', wall: 110 },
  { id: 'r5', name: 'The Gravekeeper’s Yard', x0: 60, y0: 120, x1: 940, y1: 1180, floor: 'yard', wall: 130 },
];
MAP.corridors = [];
for (let i = 0; i < MAP.rooms.length - 1; i++) {
  const lo = MAP.rooms[i], hi = MAP.rooms[i + 1];
  MAP.corridors.push({ id: 'c' + i, x0: 420, x1: 580, y0: hi.y1, y1: lo.y0 });
}
/* walk chain bottom (entrance) to top (boss): r0 c0 r1 c1 ... r5 */
MAP.chain = [];
MAP.rooms.forEach((r, i) => { MAP.chain.push({ ...r, kind: 'room', idx: i }); if (MAP.corridors[i]) MAP.chain.push({ ...MAP.corridors[i], kind: 'corridor', idx: i }); });
MAP.chain.forEach((a, i) => { a.ci = i; });
MAP.walk = MAP.chain.map((a) => (a.kind === 'room' ? { x0: a.x0, y0: a.y0, x1: a.x1, y1: a.y1, ci: a.ci } : { x0: a.x0, y0: a.y0 - MAP.OV, x1: a.x1, y1: a.y1 + MAP.OV, ci: a.ci }));
MAP.arena = { x: 500, y: 640, r: 430 };

/* gates sit on corridor ends */
export const GATES = {
  g3b: { x0: 420, x1: 580, y: 3180, closed: false },
  g3t: { x0: 420, x1: 580, y: 2460, closed: true, north: true },
  g5: { x0: 420, x1: 580, y: 1180, closed: false },
};

/* props: [sprite, x, y, collider] collider: ['c', r] circle or ['r', hw, hh, dy] box around (x, y + dy) */
export const PROPS = [];
export const DECALS = [];
export const WALLDECOR = []; // [sprite, x, roomIndex]
function prop(sp, x, y, col, sc) { PROPS.push({ sp, x, y, col, sc: sc || 1, id: 'p' + PROPS.length }); }
function decal(sp, x, y, sc, rot) { DECALS.push({ sp, x, y, sc: sc || 1, rot: rot || 0 }); }
(function dress() {
  // r0 stairs
  WALLDECOR.push(['torch', 390, 0], ['torch', 610, 0]);
  prop('candles', 362, 5452, null); prop('candles', 640, 5452, null); decal('bones', 600, 5700, 0.9, 0.3);
  // r1 hall of bones
  for (const [x, y] of [[250, 4700], [750, 4700], [250, 5080], [750, 5080]]) prop('pillar', x, y, ['c', 26]);
  WALLDECOR.push(['torch', 270, 1], ['torch', 730, 1], ['banner', 380, 1], ['banner', 620, 1]);
  prop('skullpile', 200, 4610, ['c', 22]); prop('skullpile', 800, 4610, ['c', 22]);
  prop('urn', 192, 4880, ['c', 13]); prop('urn', 808, 4880, ['c', 13]); prop('candles', 196, 5186, null); prop('candles', 804, 5186, null);
  decal('bones', 340, 4800, 1, 0.4); decal('bones', 660, 4990, 1, -0.6); decal('bones', 470, 5160, 0.9, 1.2);
  // r2 ossuary
  for (const [x, y] of [[220, 3560], [780, 3560], [220, 4180], [780, 4180]]) prop('pillar', x, y, ['c', 26]);
  WALLDECOR.push(['torch', 230, 2], ['torch', 770, 2], ['banner', 360, 2], ['banner', 640, 2]);
  prop('skullpile', 140, 3470, ['c', 22]); prop('skullpile', 860, 3470, ['c', 22]); prop('skullpile', 140, 3860, ['c', 22]); prop('skullpile', 860, 3860, ['c', 22]);
  prop('coffin', 140, 4060, ['r', 26, 40, -48]); prop('coffin', 860, 4060, ['r', 26, 40, -48]);
  for (const [x, y, r] of [[300, 3700, 0.3], [700, 3980, -0.8], [520, 4250, 1.4], [380, 3500, 2.2], [620, 3800, 0.9]]) decal('bones', x, y, 1, r);
  // r3 knight's tomb
  prop('coffin', 500, 2600, ['r', 36, 52, -60], 1.35);
  for (const [x, y] of [[214, 2690], [214, 2990], [786, 2690], [786, 2990]]) prop('coffin', x, y, ['r', 26, 40, -48]);
  prop('pillar', 250, 3110, ['c', 26]); prop('pillar', 750, 3110, ['c', 26]);
  WALLDECOR.push(['torch', 300, 3], ['torch', 700, 3], ['banner', 410, 3], ['banner', 590, 3]);
  prop('candles', 430, 2540, null); prop('candles', 570, 2540, null);
  // r4 catacombs
  for (const [x, y] of [[170, 1600], [170, 1760], [170, 1920], [830, 1600], [830, 1760], [830, 1920]]) prop('coffin', x, y, ['r', 26, 40, -48]);
  prop('coffin', 500, 1540, ['r', 34, 50, -56], 1.3);
  prop('pillar', 300, 2120, ['c', 26]); prop('pillar', 700, 2120, ['c', 26]);
  prop('urn', 160, 2180, ['c', 13]); prop('urn', 840, 2180, ['c', 13]);
  WALLDECOR.push(['torch', 260, 4], ['torch', 740, 4], ['banner', 400, 4], ['banner', 600, 4]);
  for (const [x, y, r] of [[360, 2060, 0.5], [640, 1900, -0.4], [420, 1700, 1.1]]) decal('bones', x, y, 1, r);
  // r5 the yard: tombstones around the ring, trees in the corners, his own grave behind him
  const A = MAP.arena;
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * TAU + 0.12;
    const x = A.x + Math.cos(a) * (A.r + 46), y = A.y + Math.sin(a) * (A.r + 34);
    if (x < 90 || x > 910 || y < 150 || y > 1150) continue;
    if (Math.abs(x - 500) < 110 && y > 1000) continue; // keep the way in clear
    prop('tomb' + (k % 3), Math.round(x), Math.round(y), ['r', 18, 8, -6]);
  }
  prop('tree', 110, 210, ['c', 16]); prop('tree', 890, 210, ['c', 16]); prop('tree', 100, 1120, ['c', 16]); prop('tree', 900, 1120, ['c', 16]);
  decal('grave', 500, 240, 1.2, 0);
  for (const [x, y] of [[300, 420], [700, 430], [330, 880], [690, 870]]) decal('grave', x, y, 0.8, 0);
  WALLDECOR.push(['torch', 250, 5], ['torch', 750, 5], ['banner', 420, 5], ['banner', 580, 5]);
})();

/* checkpoints: where you come back after a wipe, by room */
export const CHECKPOINTS = [
  { room: 0, x: 500, y: 5600 }, { room: 1, x: 500, y: 5150 }, { room: 2, x: 500, y: 4250 },
  { room: 3, x: 500, y: 3330 }, { room: 4, x: 500, y: 2150 }, { room: 5, x: 500, y: 1320 },
];

/* room-specific floor art, drawn over the floor pattern */
export function floorArt(ctx, i, r, ink) {
  if (i === 0) {
    for (let k = 0; k < 3; k++) {
      const y = r.y1 - 66 + k * 22;
      ctx.fillStyle = ['#5C5070', '#4F4466', '#433A58'][k];
      ctx.fillRect(r.x0 + 40 + k * 10, y, r.x1 - r.x0 - 80 - k * 20, 22);
      ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(r.x0 + 40 + k * 10, y, r.x1 - r.x0 - 80 - k * 20, 22);
    }
  } else if (i === 3) {
    ctx.fillStyle = '#6A4BA3'; ctx.fillRect(452, 2660, 96, 520);
    ctx.strokeStyle = '#E7B53C'; ctx.lineWidth = 3; ctx.strokeRect(458, 2666, 84, 514);
    ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(452, 2660, 96, 520);
  } else if (i === 5) {
    const A = MAP.arena;
    ctx.fillStyle = 'rgba(159, 195, 232, 0.08)'; ctx.beginPath(); ctx.arc(A.x, A.y, 300, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(159, 195, 232, 0.07)'; ctx.beginPath(); ctx.arc(A.x, A.y, 180, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(30, 26, 26, 0.35)'; ctx.lineWidth = 4; ctx.setLineDash([18, 16]);
    ctx.beginPath(); ctx.arc(A.x, A.y, A.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
}
