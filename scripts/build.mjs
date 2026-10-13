// Builds the single-file game page: bundles src/main into one script and inlines it into src/index.html.
// Usage: node scripts/build.mjs [--entry src/dungeon/main.js] [--out dist/highfell.html]
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const entry = arg('--entry', fs.existsSync('src/main.ts') ? 'src/main.ts' : 'src/dungeon/main.js');
const out = arg('--out', 'dist/highfell.html');

const res = await esbuild.build({
  entryPoints: [entry], bundle: true, format: 'iife', target: 'es2020', platform: 'browser',
  write: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning',
  define: { 'globalThis.HF_BUILD': JSON.stringify({ at: new Date().toISOString() }) },
});
let js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const page = fs.readFileSync('src/index.html', 'utf8');
if (!page.includes('%%BUNDLE%%')) throw new Error('src/index.html has no %%BUNDLE%% slot');
const html = page.replace('%%BUNDLE%%', () => js);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
const vis = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
console.log(`built ${out} · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB${/stroke/i.test(vis) ? ' · WARNING: "stroke" in visible text' : ''}`);
