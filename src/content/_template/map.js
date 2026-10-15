/* Dungeon Template: 6-room vertical spine using `buildDungeonMap`.
   Copy `src/content/_template/` to `src/content/<dungeonId>/` and customize room names, theme, and props. */
import { TAU } from '../../core/math';
import { buildDungeonMap } from '../../dungeon/template.js';

export const { MAP, GATES, PROPS, DECALS, WALLDECOR, CHECKPOINTS, floorArt } = buildDungeonMap({
  theme: 'thimblebriar', // 'barrow' | 'thimblebriar' | 'moonmere'
  width: 1000,
  height: 5800,
  cx: 500,
  overlap: 70,
  corridorX: [420, 580],
  rooms: [
    { id: 'r0', name: 'Entrance Threshold', x0: 330, y0: 5420, x1: 670, y1: 5760, floor: 'stone', wall: 100 },
    { id: 'r1', name: 'Warm-Up Hall', x0: 160, y0: 4560, x1: 840, y1: 5220, floor: 'stone', wall: 110 },
    { id: 'r2', name: 'Two-Pack Hall', x0: 100, y0: 3420, x1: 900, y1: 4320, floor: 'stone', wall: 110 },
    { id: 'r3', name: 'Mini-Boss Sanctum', x0: 160, y0: 2460, x1: 840, y1: 3180, floor: 'tomb', wall: 120 },
    { id: 'r4', name: 'Trial & Ambush Hall', x0: 120, y0: 1420, x1: 880, y1: 2220, floor: 'stone', wall: 110 },
    { id: 'r5', name: 'Final Boss Arena', x0: 60, y0: 120, x1: 940, y1: 1180, floor: 'yard', wall: 130 },
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
    // r0 entrance
    wall('torch', 390, 0); wall('torch', 610, 0);
    prop('candles', 362, 5452, null); prop('candles', 640, 5452, null);
    // r1 warm-up hall
    pillars('pillar', [[250, 4700], [750, 4700], [250, 5080], [750, 5080]]);
    wall('torch', 270, 1); wall('torch', 730, 1); wall('banner', 380, 1); wall('banner', 620, 1);
    // r2 two-pack hall
    pillars('pillar', [[220, 3560], [780, 3560], [220, 4180], [780, 4180]]);
    wall('torch', 230, 2); wall('torch', 770, 2); wall('banner', 360, 2); wall('banner', 640, 2);
    // r3 mini-boss sanctum
    prop('coffin', 500, 2600, ['r', 36, 52, -60], 1.35);
    for (const [x, y] of [[214, 2690], [214, 2990], [786, 2690], [786, 2990]]) prop('coffin', x, y, ['r', 26, 40, -48]);
    pillars('pillar', [[250, 3110], [750, 3110]]);
    wall('torch', 300, 3); wall('torch', 700, 3);
    // r4 trial & ambush hall (props with `coffin` flip to `coffin_open` when the ambush triggers)
    for (const [x, y] of [[170, 1600], [170, 1760], [170, 1920], [830, 1600], [830, 1760], [830, 1920]]) prop('coffin', x, y, ['r', 26, 40, -48]);
    pillars('pillar', [[300, 2120], [700, 2120]]);
    wall('torch', 260, 4); wall('torch', 740, 4);
    // r5 final boss arena ring
    ring(22, M.arena.r + 46, M.arena.r + 34, (k, x, y) => {
      if (x < 90 || x > 910 || y < 150 || y > 1150) return;
      if (Math.abs(x - 500) < 110 && y > 1000) return;
      prop('tomb' + (k % 3), x, y, ['r', 18, 8, -6]);
    });
    decal('grave', 500, 240, 1.2, 0);
    wall('torch', 250, 5); wall('torch', 750, 5);
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
      ctx.strokeStyle = 'rgba(30, 26, 26, 0.35)'; ctx.lineWidth = 4; ctx.setLineDash([18, 16]);
      ctx.beginPath(); ctx.arc(A.x, A.y, A.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  },
});
