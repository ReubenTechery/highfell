/* Thimblebriar Hollow's signature: bombs you knock back. The part itself is src/dungeon/bombs.js; this is who
   throws them and how.
     Bombwrights (the new gnome tinkers) lob one at whoever they're after every few seconds, and now and then
     stick one on a mate of the tank's instead. Old Toadstool lobs puffballs at the party; the Tinker King
     barrages his workshop and sticks bombs on the tank's mates.
   Whose job:
     tank    bat the ones thrown at you back with a perfect block, and drag the pack out of the spore clouds
     healer  swipe the Sticky Bombs off (only you can), and heal through the blasts nobody stopped
     DPS     knock bombs back into the pack, and into the bosses: a gold blast beside a boss opens him up
   No new button: any hit knocks a bomb, and the dodge is for the ones you can't reach. */
import { TAU, dist } from '../../core/math';
import { pick, rand } from '../../core/rng';
import { S } from '../../dungeon/state.js';
import { call, fxText, sfx } from '../../dungeon/entities.js';
import { bombMob, stickBomb, throwBomb } from '../../dungeon/bombs.js';
import { canStand, walkTo } from '../../dungeon/world.js';

/* counted, so a test can see the trash and both bosses use it */
const tally = (owner, n) => { const k = 'bombs.' + (owner.isBoss ? owner.type : 'trash'); S.stats[k] = (S.stats[k] || 0) + n; };
const up = () => S.heroes.filter((h) => h.alive && !h.st.caged);

/** a bomb at a hero's feet: it follows them through the air and lands on them (the tank can bat it back) */
function lobAt(owner, h, type) { tally(owner, 1); return throwBomb(owner, h.x, h.y, { type, at: h }); }

/** a bomb somewhere near a spot, `spread` out */
function lobNear(owner, x, y, spread, type) {
  for (let k = 0; k < 6; k++) {
    const a = rand(0, TAU), d = rand(spread * 0.4, spread), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.75;
    if (canStand(px, py, 20)) { tally(owner, 1); return throwBomb(owner, px, py, { type }); }
  }
  tally(owner, 1);
  return throwBomb(owner, x, y, { type });
}

/** Old Toadstool's Puffball Volley: a puffball at each of the party's feet (n in all) */
function volley(m, n) {
  const hs = up();
  if (!hs.length) return false;
  for (let i = 0; i < n; i++) { const h = hs[i % hs.length]; if (i < hs.length) lobAt(m, h, 'puffball'); else lobNear(m, h.x, h.y, 120, 'puffball'); }
  fxText(m.x, m.y - 300, 'Puffballs!', '#C8F5A8', 26, { dur: 1.2 });
  call('Knock the puffballs back into him!', 'alarm', 1.4);
  sfx('rise');
  return true;
}

/** the Tinker King's Bomb Barrage: n bombs round the workshop, half of them near the party */
function barrage(m, n) {
  const hs = up(), A = S.dg.map.arena;
  if (!hs.length) return false;
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) { const h = pick(hs); lobNear(m, h.x, h.y, 110, 'bomb'); }
    else { const a = rand(0, TAU), d = rand(170, A.r - 90); lobNear(m, A.x + Math.cos(a) * d, A.y + Math.sin(a) * d, 40, 'bomb'); }
  }
  fxText(m.x, m.y - 330, 'Bomb Barrage!', '#FFE08A', 28, { dur: 1.3 });
  call('Bombs! Hit them back at him', 'alarm', 1.4);
  sfx('rise');
  return true;
}

/** a Sticky Bomb on n of the tank's mates (never the tank): only the healer swipes it off */
function stick(m, n) {
  const pool = S.heroes.filter((h) => h.alive && !h.st.caged && !h.st.curse && h.role !== 'tank');
  let done = 0;
  for (let i = 0; i < n && pool.length; i++) {
    const h = pool.splice(Math.floor(rand(0, pool.length)), 1)[0];
    if (stickBomb(m, h)) done++;
  }
  if (done) S.stats['sticky.' + (m.isBoss ? m.type : 'trash')] = (S.stats['sticky.' + (m.isBoss ? m.type : 'trash')] || 0) + done;
  return done > 0;
}

/* the Bombwright: hangs back out of the tank's reach, lobs a bomb at whoever it's after every few seconds, and
   now and then sticks one on a mate of the tank's instead. It never swings. */
function bombwrightAi(m, dt) {
  const ab = m.ab, t = m.target;
  if (ab.lob === undefined) { ab.lob = rand(1.2, 2.2); ab.stick = rand(6.5, 9); }
  ab.lob -= dt; ab.stick -= dt;
  if (ab.busy > 0) { ab.busy -= dt; if (ab.busy <= 0) m.pose = null; return true; }
  if (ab.stick <= 0) {
    ab.stick = rand(11, 14);
    if (stick(m, 1)) { ab.busy = 0.5; m.pose = 'wind'; ab.lob = Math.max(ab.lob, 1.5); return true; }
  }
  if (ab.lob <= 0 && t && t.alive && dist(m, t) < 520) {
    ab.lob = rand(4.2, 5.4); ab.busy = 0.45; m.pose = 'wind';
    m.face = Math.atan2(t.y - m.y, t.x - m.x); m.flip = Math.cos(m.face) < 0;
    lobAt(m, t, 'bomb');
    return true;
  }
  if (!t) return true;
  const d = dist(m, t);
  if (d > 330) walkTo(m, t.x, t.y, m.speed, dt);
  else if (d < 190) { const a = Math.atan2(m.y - t.y, m.x - t.x); walkTo(m, m.x + Math.cos(a) * 80, m.y + Math.sin(a) * 80, m.speed * 0.85, dt); }
  else { m.face = Math.atan2(t.y - m.y, t.x - m.x); m.flip = Math.cos(m.face) < 0; }
  return true;
}

/* a Waddlecap bursts into a spore cloud when it dies: about 120 wide, for 5 seconds. Drag the pack out of it */
function sporeCloud(m) {
  S.hazards.push({ shape: 'circle', x: m.x, y: m.y, r: 62, warn: 0.35, live: 5, tick: 0.5, dmg: 34, magic: true, pool: 'spore', kind: 'spore', t: 0, src: null });
  sfx('rot', 0.6);
}

export const SIGNATURE = {
  id: 'bombs',
  name: 'Bombs you knock back',
  how: 'Bombs land and tick for three seconds, then blow on any hero near them. Hit one first and it flies back at whoever threw it, gold, and blows on them instead: beside a boss, it opens him up.',
  jobs: { tank: 'bat the bombs thrown at you back with a perfect block', healer: 'swipe the Sticky Bombs off', dps: 'knock the bombs back into the pack and the bosses' },
  /** the signature's own mobs, part of the dungeon's MOBS */
  mobs: {
    bomb: bombMob({ name: 'Bomb', sp: 'bomb', gold: 'bomb_gold', dmg: 150, hurt: 160 }),
    puffball: bombMob({ name: 'Puffball', sp: 'puffball', gold: 'puffball_gold', dmg: 130, hurt: 150 }),
  },
  volley,
  barrage,
  stick,
  bombwrightAi,
  sporeCloud,
};
