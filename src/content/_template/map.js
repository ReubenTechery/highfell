/* The template's layout: rooms and the links between them, built by `buildDungeonMap` (src/dungeon/layout.js).
   Not a line: the way in runs east, the hall turns north, a side room hangs off the crossroads, and the
   final fight is in a round arena. Give each dungeon its own shape; number the rooms in the order the party
   meets them (a checkpoint only moves on to a higher number).

          ( 6 the arena, round )
                    |
          [ 5 mini boss hall ]         gates: miniIn (shuts behind you at the Warden), miniOut (opens
                    |                         when he falls), finalIn (shuts behind you at the Sovereign)
            [ 4 gallery ]
                    |
   [ 3 side room ] - [ 2 crossroads ]
                    |
   [ 0 way in ] - [ 1 long hall ]                                                                    */
import { TAU } from '../../core/math';
import { buildDungeonMap } from '../../dungeon/template.js';

export const { MAP, GATES, PROPS, DECALS, WALLDECOR, CHECKPOINTS, floorArt } = buildDungeonMap({
  theme: 'thimblebriar',
  width: 1460,
  height: 5100,
  overlap: 70,
  rooms: [
    { id: 'r0', name: 'The Way In', x0: 80, y0: 4600, x1: 420, y1: 4940, floor: 'stone', wall: 100 },
    { id: 'r1', name: 'Long Hall', x0: 640, y0: 4400, x1: 1240, y1: 5000, floor: 'stone', wall: 110 },
    { id: 'r2', name: 'Crossroads', x0: 640, y0: 3400, x1: 1240, y1: 4060, floor: 'stone', wall: 110 },
    { id: 'r3', name: 'Side Room', x0: 100, y0: 3520, x1: 440, y1: 3920, floor: 'tomb', wall: 100 },
    { id: 'r4', name: 'Gallery', x0: 700, y0: 2620, x1: 1180, y1: 3100, floor: 'stone', wall: 110 },
    // a boss's checkpoint is outside his door (`cp: 'out'`): after a wipe you gather before you go back in
    { id: 'r5', name: 'Mini Boss Hall', x0: 640, y0: 1900, x1: 1240, y1: 2460, floor: 'tomb', wall: 120, cp: 'out' },
    { id: 'r6', name: 'The Arena', round: true, x: 940, y: 1180, r: 420, floor: 'yard', wall: 130, cp: 'out' },
  ],
  // a link: the door is on `side` of `from` ('n', 's', 'e', 'w'), `at` its middle (x for n and s, y for e and w)
  links: [
    { from: 'r0', to: 'r1', side: 'e', at: 4770 },
    { from: 'r1', to: 'r2', side: 'n', at: 940 },
    { from: 'r2', to: 'r3', side: 'w', at: 3730 },
    { from: 'r2', to: 'r4', side: 'n', at: 940 },
    { from: 'r4', to: 'r5', side: 'n', at: 940, gate: { id: 'miniIn', end: 'to' } },
    { from: 'r5', to: 'r6', side: 'n', at: 940, gate: [{ id: 'miniOut', end: 'from', closed: true }, { id: 'finalIn', end: 'to' }] },
  ],
  // the dressing is Barrow's props standing in, until the dungeon's own are drawn
  dress({ prop, wall, pillars }) {
    wall('torch', 160, 0); wall('torch', 340, 0);
    prop('candles', 112, 4632, null); prop('candles', 388, 4632, null);
    pillars('pillar', [[760, 4520], [1120, 4520], [760, 4880], [1120, 4880]]);
    wall('torch', 760, 1); wall('torch', 1120, 1); wall('banner', 880, 1); wall('banner', 1000, 1);
    pillars('pillar', [[760, 3520], [1120, 3520], [760, 3940], [1120, 3940]]);
    wall('torch', 760, 2); wall('torch', 1120, 2); wall('banner', 860, 2); wall('banner', 1020, 2);
    prop('urn', 130, 3560, ['c', 13]); prop('urn', 130, 3880, ['c', 13]); prop('candles', 400, 3552, null);
    wall('torch', 180, 3); wall('torch', 360, 3);
    pillars('pillar', [[780, 2700], [1100, 2700]]);
    wall('torch', 800, 4); wall('torch', 1080, 4);
    pillars('pillar', [[720, 2390], [1160, 2390]]);
    wall('torch', 760, 5); wall('torch', 1120, 5); wall('banner', 880, 5); wall('banner', 1000, 5);
    wall('torch', 700, 6); wall('torch', 1180, 6); wall('banner', 860, 6); wall('banner', 1020, 6);
  },
  floorArt(ctx, i, r) {
    if (r.round) {
      ctx.strokeStyle = 'rgba(30, 26, 26, 0.3)'; ctx.lineWidth = 4; ctx.setLineDash([18, 16]);
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r - 70, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    }
  },
});
