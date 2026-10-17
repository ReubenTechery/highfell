/// <reference types="node" />
/**
 * Heroes in layers (src/ui/heroart.ts, art/heroes.json from tools/art_gear.py): every body that is drawn has its
 * views and its anchors, every piece a hero can wear has a layer that sits on every body that can wear it, what a
 * hero wears in each slot is what you see, and the run lets a hero's picture go when it ends.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/content';
import { CLASSES, HERO_ART_SEX, type ClassId } from '../src/content/folk';
import { gilded } from '../src/content/kits';
import type { SlotId } from '../src/content/types';
import { equip, fitsHero, newHero } from '../src/meta/gear';
import { freshProfile } from '../src/meta/profile';
import { HERO_ART_DATA as H, bodyId, composeLook, fitOfLook, layerOf, plainSlots, regionFn, warp, type Look } from '../src/ui/heroart';
import { ART, heroSprite } from '../src/ui/art';
import { ART as RUN_ART } from '../src/dungeon/assets.js';
import { SPR, addHeroes, dropHeroes } from '../src/dungeon/art.js';

const REGIONS = ['spine', 'head', 'sh', 'arm', 'arm2', 'main', 'off'];
/** the bodies drawn in layers: a hero art name with dots is a body in art/heroes.json */
const BODIES = Object.entries(HERO_ART_SEX).filter(([, art]) => art && art.includes('.')).map(([combo, art]) => ({ combo, art: art as string }));
/** a rough box round some shapes: path points (control points too), circles and ellipses */
function boxOf(svg: string): number[] {
  const xs: number[] = [], ys: number[] = [];
  for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
    const v = (d.match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map(Number);
    for (let i = 0; i + 1 < v.length; i += 2) { xs.push(v[i]); ys.push(v[i + 1]); }
  }
  for (const [, x, y, r] of svg.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/g)) { xs.push(+x - +r, +x + +r); ys.push(+y - +r, +y + +r); }
  for (const [, x, y, rx, ry] of svg.matchAll(/<ellipse cx="([-\d.]+)" cy="([-\d.]+)" rx="([-\d.]+)" ry="([-\d.]+)"/g)) { xs.push(+x - +rx, +x + +rx); ys.push(+y - +ry, +y + +ry); }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const inside = (b: number[], vb: number[]): boolean => b[0] >= vb[0] - 0.5 && b[1] >= vb[1] - 0.5 && b[2] <= vb[0] + vb[2] + 0.5 && b[3] <= vb[1] + vb[3] + 0.5;

test('heroes in layers: every body that is drawn has its front and back, its box, its head and every anchor its class needs', () => {
  assert.equal(BODIES.length, Object.keys(HERO_ART_SEX).length, 'every hero is drawn in layers');
  for (const { combo, art } of BODIES) {
    const [race, cls, sex] = combo.split('.');
    assert.equal(art, bodyId(race, cls, sex), `${combo} wears its own body`);
    const body = H.bodies[art];
    assert.ok(body, `no body ${art}`);
    assert.equal(body.cls, cls);
    assert.equal(body.fem, sex === 'f');
    assert.ok(H.ref[cls], `no reference landmarks for ${cls}`);
    for (const v of ['f', 'b'] as const) {
      const bv = body[v];
      assert.equal(bv.vb.length, 4);
      assert.ok(bv.top > bv.vb[1] && bv.top < -60, `${art} ${v}: the head's top is on the picture`);
      assert.ok(bv.z.head, `${art} ${v}: a head`);
      for (const band of Object.keys(bv.z)) assert.ok(H.bands[v].includes(band), `${art} ${v}: band ${band}`);
      const fit = bv.fit;
      assert.ok(fit.spine.length >= 2 && fit.spine.every((k) => k.length === 3), `${art} ${v}: spine knots`);
      assert.equal(fit.head.length, 3, `${art} ${v}: head`);
      for (const r of ['main', 'off']) assert.ok([3, 4].includes((fit as unknown as Record<string, number[]>)[r].length), `${art} ${v}: ${r}`);
      assert.equal(fit.sh.length, 2);
      for (const r of ['arm', 'arm2']) assert.equal((fit as unknown as Record<string, number[]>)[r].length, 2, `${art} ${v}: ${r}`);
    }
  }
});

test('heroes in layers: every item a hero can wear has a layer, front and back, on every race, class and sex that can wear it, inside its picture', () => {
  for (const { art } of BODIES) {
    const body = H.bodies[art], cls = body.cls as ClassId, role = CLASSES[cls].role;
    const wearable = Object.values(ITEMS).filter((d) => fitsHero(d, { role, cls }));
    assert.ok(wearable.length >= 16, `${art}: its class's gear`);
    for (const d of wearable) {
      const L = H.layers[layerOf(d)];
      assert.ok(L, `${art}: no layer ${layerOf(d)} for ${d.id}`);
      assert.equal(L.slot, d.slot, `${d.id}: its layer is for its slot`);
      assert.equal(L.cls, cls, `${d.id}: drawn for its class`);
      for (const v of ['f', 'b'] as const) {
        const parts = (body.fem && L[`${v}w`]) || L[v];
        assert.ok(parts.length, `${d.id} ${v}: drawn`);
        for (const [band, region] of parts) assert.ok(H.bands[v].includes(band) && REGIONS.includes(region), `${d.id} ${v}: ${band}/${region}`);
        const pic = composeLook({ body: art, slots: { [d.slot]: layerOf(d) }, gold: [] }, v)!;
        assert.ok(!/NaN|Infinity/.test(pic.svg), `${d.id} on ${art} ${v}: numbers`);
        const shapes = parts.map(([, region, svg]) => warp(svg, regionFn(cls, v, body[v].fit, region))).join('');
        assert.ok(inside(boxOf(shapes), pic.vb), `${d.id} on ${art} ${v}: inside the picture`);
      }
    }
  }
});

test('heroes in layers: what you wear in each slot is what you see, and a gilded piece is gold on its own', () => {
  const p = freshProfile();
  const h = newHero(p, { name: 'Brask Ironhew', race: 'dwarf', cls: 'warrior', sex: 'm' })!;
  h.regular.helm = { rar: 0 }; h.regular.chest = { rar: 1 }; h.regular.weapon = { rar: 2 };
  p.collection['barrowguard.shoulders'] = { n: 1, kc: 40, at: 1 };
  assert.ok(equip(p, h, 'shoulders', 'barrowguard.shoulders'));
  const want: Look = { body: 'dwarf.warrior.m', gold: [], slots: { helm: 'gear.tank.helm.0', chest: 'gear.tank.chest.1', shoulders: 'barrowguard.shoulders', weapon: 'gear.tank.weapon.2' } };
  const mixed = heroSprite(h, 'tank', p);
  for (const v of ['f', 'b'] as const) assert.equal(ART[`${mixed}_${v}`].svg, composeLook(want, v)!.svg, `a rag cap, an iron chest, Barrowguard shoulders and a Rare axe, ${v}`);
  // one Uncommon piece changes that piece only: the rag cap stays a rag cap
  h.regular.weapon = { rar: 1 };
  const next = ART[`${heroSprite(h, 'tank', p)}_f`].svg;
  assert.equal(next, composeLook({ ...want, slots: { ...want.slots, weapon: 'gear.tank.weapon.1' } }, 'f')!.svg);
  // the kit for the shoulders gilds the shoulders, and nothing else
  p.collection[gilded('barrowguard.shoulders')] = { n: 1, kc: 3, at: 2 };
  assert.equal(ART[`${heroSprite(h, 'tank', p)}_f`].svg, composeLook({ ...want, slots: { ...want.slots, weapon: 'gear.tank.weapon.1' }, gold: ['shoulders'] }, 'f')!.svg);
  // a hero being made wears the warband's regular pieces
  const maker = heroSprite({ race: 'dwarf', cls: 'warrior', sex: 'f', regular: p.warband.tank }, 'tank', p);
  assert.equal(ART[`${maker}_f`].svg, composeLook({ body: 'dwarf.warrior.f', gold: [], slots: plainSlots('tank', 'warrior', p.warband.tank) }, 'f')!.svg);
});

test('heroes in layers: the ink keeps its weight on every body, and a layered hero knows where its weapon is and how tall it stands', () => {
  const widths = (svg: string): string[] => [...new Set([...svg.matchAll(/stroke-width: ([\d.]+)/g)].map((m) => m[1]))].sort();
  for (const { art } of BODIES) {
    const body = H.bodies[art];
    for (const [id, L] of Object.entries(H.layers)) {
      if (L.cls !== body.cls) continue;
      const src = L.f.map((f) => f[2]).join('');
      assert.deepEqual(widths(warp(src, (x, y) => [x * 0.7 + 3, y * 1.2 - 5])), widths(src), `${id}: ink`);
      if (L.slot !== 'weapon') continue;
      const look: Look = { body: art, slots: { weapon: id }, gold: [] }, fit = fitOfLook(look)!, vb = body.f.vb;
      assert.ok(fit.weapon[0] > vb[0] && fit.weapon[0] < vb[0] + vb[2] && fit.weapon[1] > vb[1] && fit.weapon[1] < 0, `${id} on ${art}: the weapon is on the picture`);
      assert.equal(fit.top, body.f.top);
    }
  }
});

test('the run bakes only its own heroes and lets them go when it ends', async () => {
  const look: Look = { body: 'gnome.warrior.f', slots: plainSlots('tank', 'warrior', 2), gold: [] };
  const pics = { 'hero.test_f': composeLook(look, 'f')!, 'hero.test_b': composeLook(look, 'b')! };
  const before = Object.keys(SPR).length;
  await addHeroes(pics);
  const spr = SPR as Record<string, unknown>, art = RUN_ART as Record<string, unknown>;
  assert.ok(spr['hero.test_f'] && art['hero.test_b'], 'in for the run');
  dropHeroes();
  assert.ok(!spr['hero.test_f'] && !art['hero.test_b'], 'gone when it ends');
  assert.equal(Object.keys(SPR).length, before);
  // the old whole-body heroes are gone from the sprites the run bakes at start
  for (const name of Object.keys(RUN_ART)) assert.ok(!/^(gnome_|goblin_|risen_)?(tank|healer|dps|rogue)(_m)?(_rags|_iron|_gilded)?_[fb]$/.test(name), `${name} is still baked`);
  // and every slot each class wears has a layer, at every rarity, for the bots and test gear (Epic wears the Rare look)
  for (const cls of Object.keys(CLASSES) as ClassId[]) for (const rar of [0, 1, 2, 3] as const) {
    for (const [slot, id] of Object.entries(plainSlots(CLASSES[cls].role, cls, rar))) assert.ok(H.layers[id!], `${cls}: ${slot} at ${rar}`);
  }
  const s: SlotId = 'helm';
  assert.equal(plainSlots('tank', 'warrior', 3)[s], 'gear.tank.helm.2');
});
