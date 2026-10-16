/* Thimblebriar Hollow: a winding burrow of seven round chambers, joined by short tunnels that zig-zag east and
   west on the way up (north). Built by `buildDungeonMap` (src/dungeon/layout.js).

                ( 6 the Grand Workshop: the Tinker King, big and round )
                   |
      ( 5 the Gearworks ) - ( 4 Old Toadstool's Ring )          gates: miniIn (shuts behind you at Old
                                |                                Toadstool), miniOut (his way on, open when he
      ( 2 the Spore Cellar ) - ( 3 the Root Tunnel )             falls), finalIn (shuts behind you at the
           |                                                     Tinker King)
      ( 1 the Mushroom Hall ) - ( 0 the round front door )                                                   */
import { TAU } from '../../core/math';
import { buildDungeonMap } from '../../dungeon/template.js';

export const { MAP, GATES, PROPS, DECALS, WALLDECOR, CHECKPOINTS, floorArt } = buildDungeonMap({
  theme: 'thimblebriar',
  width: 2200,
  height: 5500,
  overlap: 70,
  rooms: [
    { id: 'r0', name: 'The Round Door', round: true, x: 1600, y: 5000, r: 230, floor: 'stone', wall: 100 },
    { id: 'r1', name: 'The Mushroom Hall', round: true, x: 860, y: 5000, r: 360, floor: 'yard', wall: 110 },
    { id: 'r2', name: 'The Spore Cellar', round: true, x: 860, y: 4150, r: 340, floor: 'yard', wall: 110 },
    { id: 'r3', name: 'The Root Tunnel', round: true, x: 1700, y: 4150, r: 330, floor: 'stone', wall: 110 },
    // a boss's checkpoint is outside his door: after a wipe you gather before you go back in
    { id: 'r4', name: 'Old Toadstool’s Ring', round: true, x: 1700, y: 3280, r: 400, floor: 'yard', wall: 120, cp: 'out' },
    { id: 'r5', name: 'The Gearworks', round: true, x: 860, y: 3280, r: 340, floor: 'tomb', wall: 110 },
    { id: 'r6', name: 'The Grand Workshop', round: true, x: 860, y: 2250, r: 480, floor: 'tomb', wall: 130, cp: 'out' },
  ],
  links: [
    { from: 'r0', to: 'r1', side: 'w', at: 5000 },
    { from: 'r1', to: 'r2', side: 'n', at: 860 },
    { from: 'r2', to: 'r3', side: 'e', at: 4150 },
    { from: 'r3', to: 'r4', side: 'n', at: 1700, gate: { id: 'miniIn', end: 'to' } },
    { from: 'r4', to: 'r5', side: 'w', at: 3280, gate: { id: 'miniOut', end: 'from', closed: true } },
    { from: 'r5', to: 'r6', side: 'n', at: 860, gate: { id: 'finalIn', end: 'to' } },
  ],
  dress({ prop, decal, wall }) {
    // r0 the round door: in from the hill, lamps either side
    wall('tb_wall_lamp', 1500, 0); wall('tb_wall_lamp', 1700, 0);
    prop('tb_shrooms', 1430, 5120, null); prop('tb_shrooms', 1770, 5110, null, 0.9);
    // r1 the Mushroom Hall: giant mushrooms round the edge
    wall('tb_wall_lamp', 700, 1); wall('tb_wall_lamp', 1020, 1); wall('tb_gearwall', 860, 1);
    for (const [x, y] of [[600, 4800], [1110, 4810], [580, 5200]]) prop('tb_shroom_tall', x, y, ['c', 22]);
    for (const [x, y, k] of [[700, 5290, 1], [1010, 5280, 0.9], [540, 4990, 0.8]]) prop('tb_shrooms', x, y, null, k);
    for (const [x, y, r] of [[760, 4900, 0.3], [960, 5120, -0.5], [880, 4760, 1.1]]) decal('tb_moss', x, y, 1, r);
    // r2 the Spore Cellar: low and mossy, puffs of spores in the corners
    wall('tb_wall_lamp', 720, 2); wall('tb_wall_lamp', 1000, 2);
    for (const [x, y] of [[600, 3980], [1110, 4000], [620, 4330]]) prop('tb_shroom_tall', x, y, ['c', 22]);
    prop('tb_crate', 1090, 4320, ['r', 26, 18, -14]);
    for (const [x, y, k] of [[760, 4430, 1], [980, 4420, 1.1]]) prop('tb_shrooms', x, y, null, k);
    for (const [x, y, r] of [[800, 4080, 0.2], [940, 4260, 2.1], [700, 4200, -0.9]]) decal('tb_spores', x, y, 1, r);
    // r3 the Root Tunnel: roots and a stack of cogs where the workshop starts
    wall('tb_wall_lamp', 1560, 3); wall('tb_wall_lamp', 1840, 3); wall('tb_gearwall', 1700, 3);
    prop('tb_cogs', 1470, 4000, ['c', 26]); prop('tb_cogs', 1940, 4280, ['c', 26]);
    prop('tb_shroom_tall', 1950, 4000, ['c', 22]); prop('tb_crate', 1460, 4310, ['r', 26, 18, -14]);
    for (const [x, y, r] of [[1640, 4100, 0.5], [1790, 4260, -0.3]]) decal('tb_bolts', x, y, 1, r);
    // r4 Old Toadstool's ring: a fairy ring of little mushrooms round the floor, lamps on the wall
    wall('tb_wall_lamp', 1520, 4); wall('tb_wall_lamp', 1880, 4); wall('tb_gearwall', 1700, 4);
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * TAU + 0.1, x = Math.round(1700 + Math.cos(a) * 300), y = Math.round(3280 + Math.sin(a) * 300);
      if (Math.abs(x - 1700) < 110 && y > 3400) continue; // the way in
      if (x < 1450 && Math.abs(y - 3280) < 110) continue;  // the way on
      decal('tb_ring_shroom', x, y, 1, 0);
    }
    prop('tb_shroom_tall', 1420, 3080, ['c', 22]); prop('tb_shroom_tall', 1985, 3110, ['c', 22]); prop('tb_shroom_tall', 1985, 3470, ['c', 22]);
    // r5 the Gearworks: brass and cogs and a crate of parts
    wall('tb_wall_lamp', 720, 5); wall('tb_wall_lamp', 1000, 5); wall('tb_gearwall', 860, 5);
    prop('tb_cogs', 600, 3120, ['c', 26]); prop('tb_cogs', 1110, 3430, ['c', 26]);
    prop('tb_crate', 610, 3450, ['r', 26, 18, -14]); prop('tb_lamp', 1090, 3110, ['c', 10]);
    for (const [x, y, r] of [[780, 3200, 0.7], [960, 3380, -1.2], [860, 3480, 0.1]]) decal('tb_bolts', x, y, 1, r);
    // r6 the Grand Workshop: cogs and lamps round the walls, his workbench behind him
    wall('tb_wall_lamp', 640, 6); wall('tb_wall_lamp', 1080, 6); wall('tb_gearwall', 760, 6); wall('tb_gearwall', 960, 6);
    for (const [x, y] of [[470, 2050], [1250, 2050], [460, 2460], [1260, 2460]]) prop('tb_cogs', x, y, ['c', 26]);
    for (const [x, y] of [[600, 1940], [1120, 1940]]) prop('tb_lamp', x, y, ['c', 10]);
    for (const [x, y, r] of [[700, 2200, 0.4], [1020, 2320, -0.6], [860, 2460, 1.3], [760, 2040, 2.4]]) decal('tb_bolts', x, y, 1, r);
  },
  floorArt(ctx, i, r) {
    // the big rooms get rings in the floor: a mossy one in the hall, brass plates in the workshop
    if (i === 1 || i === 6) {
      ctx.strokeStyle = i === 6 ? 'rgba(242, 194, 48, 0.28)' : 'rgba(30, 26, 26, 0.25)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r - 90, 0, TAU); ctx.stroke();
      ctx.lineWidth = 4; ctx.setLineDash([18, 16]);
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r - 170, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
    if (i === 6) {
      // a brass plate under the Tinker King, with the spokes of a cog
      ctx.fillStyle = 'rgba(217, 165, 32, 0.18)'; ctx.beginPath(); ctx.arc(r.x, r.y, 150, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(30, 26, 26, 0.3)'; ctx.lineWidth = 4;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; ctx.beginPath(); ctx.moveTo(r.x + Math.cos(a) * 40, r.y + Math.sin(a) * 40); ctx.lineTo(r.x + Math.cos(a) * 150, r.y + Math.sin(a) * 150); ctx.stroke(); }
    }
  },
});
