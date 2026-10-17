/// <reference types="node" />
/**
 * The duel card's rules (meta/duel.ts): a card each with your share of the damage, one MVP line each from what you
 * did most, who won, and your bests on the dungeon.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DUEL_KEYS } from '../src/dungeon/duo.js';
import { DUEL_COUNTS, DUEL_WINS, duelBests, duelOf, recordDuel, type DuelCounts, type DuelSide } from '../src/meta/duel';
import { freshProfile } from '../src/meta/profile';

const counts = (o: Partial<DuelCounts> = {}): DuelCounts => ({ dmg: 0, bigCrit: 0, combosSet: 0, combosLanded: 0, lifts: 0, breaks: 0, keys: 0, pickups: 0, bombs: 0, ...o });
const you = (o: Partial<DuelCounts> = {}): DuelSide => ({ name: 'Orvik Anvilsong', cls: 'warrior', you: true, bot: false, hero: 'h1', counts: counts(o) });
const bot = (o: Partial<DuelCounts> = {}): DuelSide => ({ name: 'Ivy', cls: 'mage', you: false, bot: true, hero: null, counts: counts(o) });

test('duel: the card counts what the run counts', () => {
  assert.deepEqual(DUEL_COUNTS, DUEL_KEYS, 'one list of counts, the engine’s');
});

test('duel: a card each in seat order, with each share of the damage; the most damage wins', () => {
  const r = duelOf('barrow', [you({ dmg: 6000, bigCrit: 900 }), bot({ dmg: 4000 })]);
  assert.deepEqual(r.cards.map((c) => c.name), ['Orvik Anvilsong', 'Ivy']);
  assert.deepEqual(r.cards.map((c) => c.share), [0.6, 0.4]);
  assert.equal(r.won, true);
  assert.equal(duelOf('barrow', [you({ dmg: 3000 }), bot({ dmg: 7000 })]).won, false, 'the bot did more');
  assert.equal(duelOf('barrow', [you({ dmg: 5000 }), bot({ dmg: 5000 })]).won, false, 'a tie is no win');
  assert.equal(duelOf('barrow', [you(), bot()]).won, false, 'nothing done, nothing won');
  assert.deepEqual(duelOf('barrow', [you(), bot()]).cards.map((c) => c.share), [0, 0]);
});

test('duel: one MVP line each, from what you did the biggest share of', () => {
  // the warrior did most of the damage, the mage most of the combos
  const r = duelOf('barrow', [you({ dmg: 7000, combosSet: 1 }), bot({ dmg: 3000, combosLanded: 4, combosSet: 1 })]);
  assert.deepEqual(r.cards.map((c) => [c.mvp.words, c.mvp.n]), [['Top damage', 70], ['Combo maker', 5]]);
  // lifting curses, breaking chains and picking your mate up are saves
  const s = duelOf('barrow', [you({ dmg: 4000, lifts: 2, pickups: 1, breaks: 1 }), bot({ dmg: 6000 })]);
  assert.deepEqual(s.cards.map((c) => c.mvp.words), ['Lifesaver', 'Top damage']);
  assert.equal(s.cards[0].mvp.n, 4);
  // bombs knocked into the boss
  assert.equal(duelOf('thimblebriar', [you({ dmg: 4000, bombs: 3 }), bot({ dmg: 6000, bombs: 1 })]).cards[0].mvp.words, 'Bomb thrower');
});

test('duel: when your mate did more of everything, your line is your best share in plain words', () => {
  const r = duelOf('barrow', [you({ dmg: 4000, combosSet: 1 }), bot({ dmg: 6000, combosSet: 1, combosLanded: 2 })]);
  assert.deepEqual(r.cards[0].mvp, { key: 'damage', lead: false, words: 'Damage', n: 40 });
  assert.equal(r.cards[1].mvp.lead, true);
  // a side that did nothing at all still has a line
  assert.deepEqual(duelOf('barrow', [you(), bot({ dmg: 100 })]).cards[0].mvp, { key: 'damage', lead: false, words: 'Damage', n: 0 });
});

test('duel: your bests on a dungeon go on the card, a beaten one is kept, and a win is counted', () => {
  const p = freshProfile(1);
  assert.deepEqual(duelBests(p, 'barrow'), { dmg: 0, bigCrit: 0, combos: 0 });
  const first = recordDuel(p, duelOf('barrow', [you({ dmg: 6000.4, bigCrit: 800, combosSet: 2 }), bot({ dmg: 4000 })]));
  assert.deepEqual(first.best, { dmg: 0, bigCrit: 0, combos: 0 });
  assert.deepEqual(first.newBest, [], 'a first duel sets your bests without calling them new');
  assert.deepEqual(duelBests(p, 'barrow'), { dmg: 6000, bigCrit: 800, combos: 2 });
  assert.equal(p.counters[DUEL_WINS], 1);
  const next = recordDuel(p, duelOf('barrow', [you({ dmg: 5000, bigCrit: 1200, combosLanded: 2 }), bot({ dmg: 6000 })]));
  assert.deepEqual(next.best, { dmg: 6000, bigCrit: 800, combos: 2 }, 'the card shows your bests from before the run');
  assert.deepEqual(next.newBest, ['bigCrit']);
  assert.deepEqual(duelBests(p, 'barrow'), { dmg: 6000, bigCrit: 1200, combos: 2 });
  assert.equal(p.counters[DUEL_WINS], 1, 'a lost duel isn’t a win');
  assert.deepEqual(duelBests(p, 'barrow.heroic'), { dmg: 0, bigCrit: 0, combos: 0 }, 'a Heroic keeps its own');
});
