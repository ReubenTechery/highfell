/* Barrow Crypt: the layout, built on `buildDungeonMap` from `src/dungeon/template.js`.
   Rooms run bottom (the stairs in) to top (the Gravekeeper's yard), joined by corridors on x = 500. */
import { TAU } from '../../core/math';
import { buildDungeonMap } from '../../dungeon/template.js';

export const { MAP, GATES, PROPS, DECALS, WALLDECOR, CHECKPOINTS, floorArt } = buildDungeonMap({
  theme: 'barrow',
  width: 1000,
  height: 5800,
  cx: 500,
  overlap: 70,
  corridorX: [420, 580],
  rooms: [
    { id: 'r0', name: 'Barrow Stairs', x0: 330, y0: 5420, x1: 670, y1: 5760, floor: 'stone', wall: 100 },
    { id: 'r1', name: 'Hall of Bones', x0: 160, y0: 4560, x1: 840, y1: 5220, floor: 'stone', wall: 110 },
    { id: 'r2', name: 'The Ossuary', x0: 100, y0: 3420, x1: 900, y1: 4320, floor: 'stone', wall: 110 },
    { id: 'r3', name: 'The Knight’s Tomb', x0: 160, y0: 2460, x1: 840, y1: 3180, floor: 'tomb', wall: 120 },
    { id: 'r4', name: 'The Catacombs', x0: 120, y0: 1420, x1: 880, y1: 2220, floor: 'stone', wall: 110 },
    { id: 'r5', name: 'The Gravekeeper’s Yard', x0: 60, y0: 120, x1: 940, y1: 1180, floor: 'yard', wall: 130 },
  ],
  arena: { x: 500, y: 640, r: 430 },
  gates: {
    g3b: { x0: 420, x1: 580, y: 3180, closed: false },
    g3t: { x0: 420, x1: 580, y: 2460, closed: true, north: true },
    g5: { x0: 420, x1: 580, y: 1180, closed: false },
  },
  checkpoints: [
    { room: 0, x: 500, y: 5600 }, { room: 1, x: 500, y: 5150 }, { room: 2, x: 500, y: 4250 },
    { room: 3, x: 500, y: 3330 }, { room: 4, x: 500, y: 2150 }, { room: 5, x: 500, y: 1320 },
  ],
  dress({ prop, decal, wall, pillars, ring, MAP: M }) {
    // r0 stairs
    wall('torch', 390, 0); wall('torch', 610, 0);
    prop('candles', 362, 5452, null); prop('candles', 640, 5452, null); decal('bones', 600, 5700, 0.9, 0.3);
    // r1 hall of bones
    pillars('pillar', [[250, 4700], [750, 4700], [250, 5080], [750, 5080]]);
    wall('torch', 270, 1); wall('torch', 730, 1); wall('banner', 380, 1); wall('banner', 620, 1);
    prop('skullpile', 200, 4610, ['c', 22]); prop('skullpile', 800, 4610, ['c', 22]);
    prop('urn', 192, 4880, ['c', 13]); prop('urn', 808, 4880, ['c', 13]); prop('candles', 196, 5186, null); prop('candles', 804, 5186, null);
    decal('bones', 340, 4800, 1, 0.4); decal('bones', 660, 4990, 1, -0.6); decal('bones', 470, 5160, 0.9, 1.2);
    // r2 ossuary
    pillars('pillar', [[220, 3560], [780, 3560], [220, 4180], [780, 4180]]);
    wall('torch', 230, 2); wall('torch', 770, 2); wall('banner', 360, 2); wall('banner', 640, 2);
    prop('skullpile', 140, 3470, ['c', 22]); prop('skullpile', 860, 3470, ['c', 22]); prop('skullpile', 140, 3860, ['c', 22]); prop('skullpile', 860, 3860, ['c', 22]);
    prop('coffin', 140, 4060, ['r', 26, 40, -48]); prop('coffin', 860, 4060, ['r', 26, 40, -48]);
    for (const [x, y, r] of [[300, 3700, 0.3], [700, 3980, -0.8], [520, 4250, 1.4], [380, 3500, 2.2], [620, 3800, 0.9]]) decal('bones', x, y, 1, r);
    // r3 knight's tomb
    prop('coffin', 500, 2600, ['r', 36, 52, -60], 1.35);
    for (const [x, y] of [[214, 2690], [214, 2990], [786, 2690], [786, 2990]]) prop('coffin', x, y, ['r', 26, 40, -48]);
    pillars('pillar', [[250, 3110], [750, 3110]]);
    wall('torch', 300, 3); wall('torch', 700, 3); wall('banner', 410, 3); wall('banner', 590, 3);
    prop('candles', 430, 2540, null); prop('candles', 570, 2540, null);
    // r4 catacombs
    for (const [x, y] of [[170, 1600], [170, 1760], [170, 1920], [830, 1600], [830, 1760], [830, 1920]]) prop('coffin', x, y, ['r', 26, 40, -48]);
    prop('coffin', 500, 1540, ['r', 34, 50, -56], 1.3);
    pillars('pillar', [[300, 2120], [700, 2120]]);
    prop('urn', 160, 2180, ['c', 13]); prop('urn', 840, 2180, ['c', 13]);
    wall('torch', 260, 4); wall('torch', 740, 4); wall('banner', 400, 4); wall('banner', 600, 4);
    for (const [x, y, r] of [[360, 2060, 0.5], [640, 1900, -0.4], [420, 1700, 1.1]]) decal('bones', x, y, 1, r);
    // r5 the yard: tombstones around the ring, trees in the corners, his own grave behind him
    ring(22, M.arena.r + 46, M.arena.r + 34, (k, x, y) => {
      if (x < 90 || x > 910 || y < 150 || y > 1150) return;
      if (Math.abs(x - 500) < 110 && y > 1000) return;
      prop('tomb' + (k % 3), x, y, ['r', 18, 8, -6]);
    });
    prop('tree', 110, 210, ['c', 16]); prop('tree', 890, 210, ['c', 16]); prop('tree', 100, 1120, ['c', 16]); prop('tree', 900, 1120, ['c', 16]);
    decal('grave', 500, 240, 1.2, 0);
    for (const [x, y] of [[300, 420], [700, 430], [330, 880], [690, 870]]) decal('grave', x, y, 0.8, 0);
    wall('torch', 250, 5); wall('torch', 750, 5); wall('banner', 420, 5); wall('banner', 580, 5);
  },
  floorArt(ctx, i, r, ink) {
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
  },
});
