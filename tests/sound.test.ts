// Sound: every name the game plays has a synthesised fallback, the embedded effects are MP3s, the music's loop
// points make sense, and the music follows a run (boss, dungeon, quiet after the last boss, out for the pet).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import CLIPS from '../audio/sfx.json';
import TRACKS from '../audio/music.json';
import { SOUNDS } from '../src/ui/sound';
import { runMusic, volumeGain } from '../src/ui/music';
import { SPLIT } from '../src/dungeon/walkout.js';

const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : /\.(ts|js)$/.test(e.name) ? [path.join(dir, e.name)] : []);

/** the sound names in each call to sfx(...) or SFX.play(...): the strings it can pass first, as in
 *  SFX.play(big ? 'thud' : 'hit') (a string compared inside, like kind === 'pet', isn't one) */
function soundsIn(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/\b(?:sfx|SFX\.play)\(/g)) {
    let i = m.index! + m[0].length, depth = 1;
    const from = i;
    while (i < src.length && depth > 0) { if (src[i] === '(') depth++; else if (src[i] === ')') depth--; i++; }
    const args = src.slice(from, i - 1).split(/,(?![^(]*\))/)[0];
    for (const n of args.matchAll(/(?:^\s*|\? |: )'([a-z]+)'/g)) out.push(n[1]);
  }
  // a toast names its sound last: this.push(html, 'ach')
  for (const m of src.matchAll(/this\.push\(`[^`]*`, '([a-z]+)'\)/g)) out.push(m[1]);
  return out;
}

test('every sound the game asks for has a synthesised fallback', () => {
  const asked = new Set<string>();
  for (const f of files('src')) for (const n of soundsIn(fs.readFileSync(f, 'utf8'))) asked.add(n);
  assert.ok(asked.size > 60, `found only ${asked.size} sound names`);
  const missing = [...asked].filter((n) => !SOUNDS[n]);
  assert.deepEqual(missing, []);
});

test('every embedded effect is an MP3 with a fallback', () => {
  const names = Object.keys(CLIPS);
  assert.ok(names.length >= 70);
  for (const [name, b64] of Object.entries(CLIPS as Record<string, string>)) {
    assert.ok(SOUNDS[name], `${name} has no synthesised fallback`);
    const b = Buffer.from(b64, 'base64');
    assert.ok(b[0] === 0xff && (b[1] & 0xe0) === 0xe0, `${name} doesn't start with an MP3 frame`);
    assert.ok(b.length < 20000, `${name} is ${b.length} bytes`);
  }
  const total = Object.values(CLIPS as Record<string, string>).reduce((n, s) => n + s.length, 0);
  assert.ok(total < 400 * 1024, `the effects add ${Math.round(total / 1024)} KB to the page`);
});

test('the music loops are next to the page and their loop points make sense', () => {
  for (const [name, t] of Object.entries(TRACKS)) {
    assert.equal(t.file, `music/${name}.mp3`);
    assert.ok(fs.existsSync(path.join('audio', t.file)), `${t.file} is missing`);
    assert.ok(t.loopStart > 0.2 && t.loopEnd - t.loopStart > 15, `${name}'s loop is too short`);
    assert.ok(t.lufs < -8 && t.lufs > -30, `${name} is measured at ${t.lufs} LUFS`);
  }
  assert.deepEqual(Object.keys(TRACKS).sort(), ['boss', 'dungeon', 'house']);
});

test('the music follows a run', () => {
  const up = [{ alive: true }, { alive: false }];
  assert.deepEqual(runMusic({ boss: null, chest: null, heroes: up }), { track: 'dungeon', duck: 1 });
  assert.equal(runMusic({ boss: {}, chest: null, heroes: up }).track, 'boss');
  // the last boss down: the sting has the moment, then the walkout
  assert.equal(runMusic({ boss: null, chest: {}, heroes: up }).track, null);
  assert.equal(runMusic({ boss: {}, chest: null, heroes: [{ alive: false }] }).track, null);
  // under the lantern's tells the music ducks, and the pet's walkout cuts it
  assert.equal(runMusic({ boss: null, chest: {}, heroes: up, walkout: { t: SPLIT - 0.2, done: false } }).duck, 1);
  assert.equal(runMusic({ boss: null, chest: {}, heroes: up, walkout: { t: SPLIT + 0.2, done: false } }).duck, 0.3);
  assert.equal(runMusic({ boss: null, chest: {}, heroes: up, walkout: { t: 9, done: true } }).duck, 1);
  assert.equal(runMusic({ boss: null, chest: {}, heroes: up, hush: true, walkout: { t: SPLIT + 0.2, done: false } }).duck, 0);
});

test('the music slider is gentle at the bottom', () => {
  assert.equal(volumeGain(0), 0);
  assert.equal(volumeGain(1), 1);
  assert.equal(volumeGain(0.5), 0.25);
  assert.equal(volumeGain(2), 1);
  assert.equal(volumeGain(-1), 0);
});
