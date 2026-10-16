/**
 * Balance sims: full dungeon runs with bots in every seat, spread over the machine's cores.
 *
 *   npm run sim                      12 seeds per role at Common gear, in Barrow Crypt
 *   npm run sim -- --dungeon template   another dungeon (by id; the template too)
 *   npm run sim -- --seeds 30        more seeds
 *   npm run sim -- --gear 3          everyone in full Epic (0 Common .. 3 Epic)
 *   npm run sim -- --solo            the solo DPS check (should die at the first pack)
 *   npm run sim -- --heroic --gear 3 heroic, in full Epic (what it's made for)
 *   npm run sim -- --brew glow       the whole party drinks a brew (glow, elixir, tonic, fizz)
 *   npm run sim -- --json out.json   also write every run to a file
 */
import * as esbuild from 'esbuild';
import os from 'node:os';
import fs from 'node:fs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = ROOT + '.cache/sim-bundle.mjs';

if (!isMainThread) {
  const { simRun } = await import(pathToFileURL(OUT).href);
  const { loadout } = await import(pathToFileURL(ROOT + '.cache/sim-gear.mjs').href);
  for (const job of workerData.jobs) {
    const loadouts = job.gear ? { tank: loadout('tank', job.gear), healer: loadout('healer', job.gear), dps: loadout('dps', job.gear) } : {};
    parentPort.postMessage(simRun({ ...job, loadouts }));
  }
  process.exit(0);
}

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]; };
const seeds = +opt('seeds', 12), gear = +opt('gear', 0), solo = !!opt('solo', false), heroic = !!opt('heroic', false), json = opt('json', null);
const brew = opt('brew', null);
const dungeon = opt('dungeon', 'barrow');
const roles = solo ? ['dps'] : (opt('roles', 'tank,healer,dps') + '').split(',');

fs.mkdirSync(ROOT + '.cache', { recursive: true });
await esbuild.build({ entryPoints: [ROOT + 'src/sim/run.ts'], bundle: true, format: 'esm', platform: 'node', outfile: OUT, logLevel: 'warning' });
fs.writeFileSync(ROOT + '.cache/sim-gear.ts', `import { plainLoadout } from '../src/meta/gear';\nexport const loadout = (role: any, rar: any) => { const l = plainLoadout(role, rar); return { ...l, traits: l.traits, bonuses: l.bonuses }; };\n`);
await esbuild.build({ entryPoints: [ROOT + '.cache/sim-gear.ts'], bundle: true, format: 'esm', platform: 'node', outfile: ROOT + '.cache/sim-gear.mjs', logLevel: 'warning' });

const jobs = [];
for (const role of roles) for (let s = 1; s <= seeds; s++) jobs.push({ role, seed: s * 7919 + (role === 'tank' ? 1 : role === 'healer' ? 2 : 3), solo, heroic, gear, ...(brew ? { brew } : {}), ...(dungeon !== 'barrow' ? { dungeon } : {}) });
const n = Math.max(1, Math.min(os.cpus().length, jobs.length));
const t0 = Date.now();
const results = await new Promise((done, fail) => {
  const out = []; let left = n;
  for (let i = 0; i < n; i++) {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: jobs.filter((_, j) => j % n === i) } });
    w.on('message', (r) => out.push(r));
    w.on('error', fail);
    w.on('exit', () => { if (--left === 0) done(out); });
  }
});

const mmss = (t) => { if (t == null) return '  -  '; const r = Math.round(t); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };

console.log(`\n${results.length} runs${dungeon !== 'barrow' ? ' of ' + dungeon : ''}${heroic ? ', heroic' : ''}${brew ? `, brew ${brew}` : ''}, gear ${['Common', 'Uncommon', 'Rare', 'Epic'][gear]}${solo ? ', solo DPS' : ''}, ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
if (solo) {
  for (const r of results) console.log(`  seed ${r.seed}: ${r.over} at ${r.t}s, packs cleared ${r.packs.filter((p) => p.cleared).length}`);
} else {
  for (const role of roles) {
    const rs = results.filter((r) => r.role === role);
    const clears = rs.filter((r) => r.clear).map((r) => r.clear);
    console.log(`${role.padEnd(7)} clear avg ${mmss(avg(clears))}  p10 ${mmss(pct(clears, 0.1))}  p90 ${mmss(pct(clears, 0.9))}  ` +
      `cleared ${clears.length}/${rs.length}  wipes ${rs.reduce((a, r) => a + r.wipes, 0)}  deaths ${rs.reduce((a, r) => a + r.stats.deaths, 0)}  combat ${Math.round(avg(rs.map((r) => r.combat)))}s`);
  }
  const ids = dungeon === 'barrow' ? ['A', 'B', 'C', 'K', 'D', 'E', 'G'] : [...new Set(results.flatMap((r) => r.packs.map((p) => p.id)))];
  console.log('\npack     avg    p90   (seconds from pull to last mob down)');
  for (const id of ids) {
    const d = results.flatMap((r) => r.packs.filter((p) => p.id === id && p.cleared != null).map((p) => p.cleared - p.pulled));
    console.log(`  ${id}     ${avg(d).toFixed(1).padStart(5)}  ${(pct(d, 0.9) ?? NaN).toFixed(1).padStart(5)}`);
  }
  const share = (role) => avg(results.map((r) => { const tot = r.heroes.reduce((a, h) => a + h.dmg, 0); const h = r.heroes.find((x) => x.role === role); return h ? h.dmg / tot : 0; }));
  console.log(`\ndamage share  tank ${(share('tank') * 100).toFixed(0)}%  healer ${(share('healer') * 100).toFixed(0)}%  dps ${(share('dps') * 100).toFixed(0)}%`);
  console.log(`perfect blocks per run ${avg(results.map((r) => r.stats.perfect)).toFixed(1)}   tank taken ${Math.round(avg(results.map((r) => r.heroes.find((h) => h.role === 'tank').taken)))}   healing ${Math.round(avg(results.map((r) => r.heroes.find((h) => h.role === 'healer').heal)))}`);
}
if (json) fs.writeFileSync(json, JSON.stringify(results, null, 1));
