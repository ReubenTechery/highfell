/// <reference types="node" />
/**
 * Every talent that changes a button does what its words say, in the engine: one hero, its talent, a foe or two,
 * the button pressed. (How much each is worth in a whole run is tests/balance.test.ts.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, update } from '../src/dungeon/game.js';
import { S } from '../src/dungeon/state.js';
import { hurtHero } from '../src/dungeon/entities.js';
import { abCd, useAbility } from '../src/dungeon/heroes.js';
import { finishCast, mend, projHit } from '../src/dungeon/buttons.js';
import { spawnMob } from '../src/dungeon/mobs.js';
import { bitterMul, hardRime, savageMul, talentHitMul } from '../src/dungeon/specs.js';
import { burnOf } from '../src/dungeon/fire.js';
import { BARROW_ENGINE } from '../src/content/barrow/engine';
import { SPEC_LIST } from '../src/content/talents';

/** a quiet fight: you in one seat with these talents (and spec), your mates sent far off, no foes but the ones you
 *  make */
function fight(role: string, spec: string | null, tal: string[], cls?: string) {
  newGame(BARROW_ENGINE, { role, seed: 11, start: 'entrance', auto: false, quiet: true, noEvents: true, loadouts: { [role]: { spec, tal, ...(cls ? { cls } : {}) } } });
  const s = S as any;
  s.mobs = [];
  const h = s.heroes.find((x: any) => x.role === role);
  for (const o of s.heroes) if (o !== h) { o.x += 4000; o.y += 4000; }
  return { s, h };
}
/** a foe that fights, with plenty of health, at (x, y) */
function foe(x: number, y: number, hp = 20000, type = 'rattler'): any {
  const m = spawnMob(type, x, y, null) as any;
  m.state = 'fight'; m.rise = 0; m.fightT = 5; m.hp = m.maxHp = hp;
  return m;
}
/** press a button now: the beat and its cooldown out of the way */
function press(h: any, slot: string, aim?: unknown): boolean {
  h.beat = 0; h.gcd = 0; h.cd[slot] = 0; h.mana = 100;
  return useAbility(h, slot, aim ?? null);
}
const step = (secs: number) => { for (let i = 0; i < Math.round(secs * 60); i++) update(1 / 60); };
/** let a shot land: every hero projectile in flight hits now */
function land(s: any) { for (const p of s.projs.splice(0)) if (p.team === 'hero') projHit(p); }
const spec = (id: string) => SPEC_LIST.find((x) => x.id === id)!;

test('specs: every talent that changes a button has its words and its picture, and every pick of two is two of them', () => {
  for (const s of SPEC_LIST) {
    const picks = s.talents.filter((t) => !t.stat);
    assert.equal(picks.length, 8, `${s.id}: four pairs`);
    for (const t of picks) assert.ok(t.slot && t.icon && t.desc, t.id);
  }
});

test('specs, Shield: Spiked Shield hurts what hits you, more if you blocked; Rim Strike stuns on every third Cleave; Breach Exposes what Charge hits', () => {
  const { h } = fight('tank', 'shield', ['sh.spikes']);
  const m = foe(h.x, h.y - 60);
  const hp0 = m.hp;
  hurtHero(h, 10, m, {});
  assert.ok(hp0 - m.hp >= 40, `a swing that lands: ${hp0 - m.hp}`);
  h.blocking = true; h.blockT = 2; h.face = Math.atan2(m.y - h.y, m.x - h.x);
  const hp1 = m.hp;
  hurtHero(h, 10, m, {});
  assert.ok(hp1 - m.hp >= 120, `a blocked one: ${hp1 - m.hp}`);
  h.blocking = false;
  // a telegraph's hit isn't a swing
  const hp2 = m.hp;
  hurtHero(h, 10, m, { hazard: true });
  assert.equal(m.hp, hp2);

  const r = fight('tank', 'shield', ['sh.rim']);
  const a = foe(r.h.x, r.h.y - 70);
  r.h.face = -Math.PI / 2;
  press(r.h, 'a1', a); assert.ok(!(a.st.stun > 0));
  press(r.h, 'a1', a); assert.ok(!(a.st.stun > 0));
  press(r.h, 'a1', a); assert.ok(a.st.stun > 0.5, 'the third Cleave stuns');

  const b = fight('tank', 'shield', ['sh.brace']);
  const c = foe(b.h.x, b.h.y - 150);
  press(b.h, 'a2', c);
  step(0.6);
  assert.ok(c.exposed > 0, 'Charge Exposed it');
});

test('specs, Shield: Bulwark reaches further and feeds the next Cleave; Unbowed brings Slam back twice as fast with three on you', () => {
  const { h } = fight('tank', 'shield', ['sh.bulwark']);
  const far = foe(h.x + 290, h.y);
  const near = foe(h.x - 120, h.y);
  press(h, 'a3');
  assert.ok(far.target === h || far.forced === h, 'Slam reached the far one');
  assert.equal(h.bulwark, 2);
  far.x = h.x; far.y = h.y - 60; near.x = h.x + 20; near.y = h.y - 60; h.face = -Math.PI / 2;
  press(h, 'a1', far);
  assert.equal(h.bulwark, 0, 'the Cleave used it up');

  const u = fight('tank', 'shield', ['sh.unbowed']);
  const foes = [0, 1, 2].map((i) => foe(u.h.x - 60 + i * 60, u.h.y - 80));
  press(u.h, 'a3');
  for (const f of foes) assert.equal(f.target, u.h);
  assert.equal(abCd(u.h, 'a3'), 4, 'Slam in 4, not 8');
  foes[0].alive = false; foes[1].alive = false;
  assert.equal(abCd(u.h, 'a3'), 8, 'one foe on you: 8');
});

test('specs, Axe: Savage Swing on a hurt foe, Headlong primes two Crushes, Final Word finishes a low foe', () => {
  const { h } = fight('tank', 'axe', ['ax.savage', 'ax.headlong', 'ax.final']);
  const m = foe(h.x, h.y - 150);
  assert.equal(savageMul(h, m), 1);
  m.hp = m.maxHp * 0.4;
  assert.equal(savageMul(h, m), 1.15);
  press(h, 'a2', m);
  step(0.6);
  assert.equal(h.crush, 2, 'Charge primed two');
  const low = foe(h.x, h.y - 60, 20000);
  low.hp = low.maxHp * 0.15;
  h.face = Math.atan2(low.y - h.y, low.x - h.x);
  press(h, 'a1', low);
  assert.equal(low.alive, false, 'a Crush finished it');
});

test('specs, Mercy: Heartening after a Mend, Rally under a Ward, Dawn after Sunburst: each makes the mate hit harder', () => {
  const { s, h } = fight('healer', 'mercy', ['me.heart', 'me.rally', 'me.dawn']);
  const dps = s.heroes.find((x: any) => x.role === 'dps');
  dps.x = h.x + 80; dps.y = h.y; dps.hp = dps.maxHp - 200;
  const m = foe(h.x, h.y - 300);
  assert.equal(talentHitMul(dps, m), 1);
  h.beat = 0; h.gcd = 0; h.mana = 100;
  assert.ok(mend(h, dps));
  assert.ok(dps.heartT > 5);
  assert.ok(Math.abs(talentHitMul(dps, m) - 1.1) < 1e-9);
  dps.hp = dps.maxHp;
  press(h, 'a2');
  assert.equal(dps.wardBy, h, 'with nobody hurt, Rally Wards the DPS');
  assert.ok(Math.abs(talentHitMul(dps, m) - 1.1 * 1.15) < 1e-9);
  press(h, 'a3');
  assert.ok(dps.dawnT > 7);
  assert.ok(Math.abs(talentHitMul(dps, m) - 1.1 * 1.15 * 1.25) < 1e-9);
});

test('specs, Wrath: Twice Struck hits again every third Smite; Sunpillar brings light down; Flashpoint bursts on a crit', () => {
  const { s, h } = fight('healer', 'wrath', ['wr.twice', 'wr.pillar', 'wr.flash']);
  const m = foe(h.x, h.y - 300);
  const other = foe(m.x + 60, m.y);
  for (let i = 0; i < 3; i++) { press(h, 'a4', m); land(s); }
  const before = m.hp;
  step(0.3);
  assert.ok(m.hp < before, 'the third Smite struck again');
  const p0 = m.hp, o0 = other.hp;
  press(h, 'a3');
  assert.ok(m.hp < p0 && other.hp < o0, 'the pillar hit it and the foe beside it');
  assert.ok(s.heroes.every((a: any) => a.alive));
});

test('specs, Frost: Hard Rime on a frozen foe, Wide Winter, Long Winter Shatters a Comet in your Blizzard, Icefall ends it', () => {
  const { s, h } = fight('dps', 'frost', ['fr.deep', 'fr.wide', 'fr.long', 'fr.icefall'], 'mage');
  const m = foe(h.x, h.y - 300);
  assert.equal(hardRime(h, m), 1);
  m.st.freeze = 2;
  assert.equal(hardRime(h, m), 1.15);
  m.st.freeze = 0;
  press(h, 'a1', { x: m.x, y: m.y });
  const z = s.zones.find((q: any) => q.kind === 'blizzard');
  assert.ok(z && z.r > 160 && z.dur > 5.5, 'wider and longer');
  // a Comet into it Shatters (twice as hard)
  press(h, 'a3', m);
  finishCast(h);
  const before = m.hp;
  step(0.4);
  assert.ok(before - m.hp > 0);
  // and when it ends, ice falls on what's in it, and it freezes
  z.t = z.dur - 0.01;
  step(0.1);
  assert.ok(m.st.freeze > 1, 'frozen by the Icefall');
});

test('specs, Fire: Flash Fire spreads a Burn on a crit, Brushfire burns every tick, Flashover readies Ember burst, Pyre follows its target', () => {
  const { s, h } = fight('dps', 'fire', ['fi.flash', 'fi.wildfire', 'fi.flashover', 'fi.pyre'], 'mage');
  const m = foe(h.x, h.y - 300);
  const near = foe(m.x + 50, m.y);
  // Pyre: the Firestorm goes on the target and follows it
  press(h, 'a1', { x: h.x + 400, y: h.y });
  const z = s.zones.find((q: any) => q.kind === 'firestorm');
  assert.ok(z && z.follow === m || z.follow === near, 'it follows a foe');
  // Brushfire: a Burn every tick
  const b0 = burnOf(z.follow);
  step(1.1);
  assert.ok(burnOf(z.follow) >= b0 + 2, `burn ${burnOf(z.follow)}`);
  // Flashover: a Combust makes Ember burst ready
  m.burn = { src: h, n: 4, left: 6, next: 0.5 };
  h.cd.a2 = 9;
  press(h, 'a3', m);
  finishCast(h);
  step(0.4);
  assert.equal(h.cd.a2, 0);
  assert.ok(near.alive);
});

test('specs, Venom: Bitter Edge on a poisoned foe, Lingering Cut bleeds it, Last Breath finishes a low foe and keeps your points', () => {
  const { s, h } = fight('dps', 'venom', ['ve.bitter', 've.cut', 've.last'], 'rogue');
  const m = foe(h.x, h.y - 70);
  assert.equal(bitterMul(h, m), 1);
  press(h, 'a1', m);
  assert.equal(bitterMul(h, m), 1.25);
  h.points = 5;
  press(h, 'a2', m);
  assert.ok(m.cut && m.cut.left > 3, 'it bleeds');
  const low = foe(h.x + 30, h.y - 70);
  low.hp = low.maxHp * 0.2;
  h.points = 3;
  press(h, 'a2', low);
  assert.equal(low.alive, false);
  assert.equal(h.points, 3, 'the points stay');
  assert.ok(s.heroes.some((x: any) => x === h));
});

test('specs, Blades: Twin Edge strikes twice, Second Ring throws again, Knife Storm turns Viper Blades on every foe round you, Cutting Wind marks', () => {
  const { s, h } = fight('dps', 'blades', ['bl.twin', 'bl.ring', 'bl.storm', 'bl.wind'], 'rogue');
  const m = foe(h.x, h.y - 70);
  const behind = foe(h.x, h.y + 70);
  const hp0 = m.hp;
  press(h, 'a1', m);
  assert.ok(m.hp < hp0);
  assert.equal(behind.hp, behind.maxHp, 'no storm yet: the one behind is untouched');
  press(h, 'a4', m);
  assert.ok(h.stormT > 5);
  // Shadowstep blinked you behind it: put the other one at your back
  behind.x = h.x - (m.x - h.x); behind.y = h.y - (m.y - h.y);
  const b0 = behind.hp;
  press(h, 'a1', m);
  assert.ok(behind.hp < b0, 'in the storm, Viper Blades cut the one behind too');
  press(h, 'a3');
  assert.equal(m.windBy, h);
  assert.ok(talentHitMul(h, m) >= 1.15);
  const r0 = behind.hp;
  step(0.4);
  assert.ok(behind.hp < r0, 'the second ring');
  assert.ok(s.mobs.length >= 2);
});

test('specs: every capstone is a pick of two at the bottom of its tree', () => {
  for (const s of SPEC_LIST) {
    const caps = s.talents.filter((t) => t.capstone);
    assert.equal(caps.length, 2, s.id);
    assert.ok(caps.every((t) => t.row === 5 && t.choice === caps[0].choice), s.id);
  }
  assert.ok(spec('shield').talents.some((t) => t.id === 'sh.unbowed'));
});
