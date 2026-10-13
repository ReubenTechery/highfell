// Builds the single-file game page: bundles src/main.ts into one script, inlines it and the styles
// into src/index.html. Usage: node scripts/build.mjs [--entry src/main.ts] [--out dist/highfell.html]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const entry = arg('--entry', 'src/main.ts');
const out = arg('--out', 'dist/highfell.html');
let rev = 'local';
try { rev = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a checkout */ }
const stamp = `${rev} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

const res = await esbuild.build({
  entryPoints: [entry], bundle: true, format: 'iife', target: 'es2020', platform: 'browser',
  write: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning', minifySyntax: true,
  define: { __BUILD__: JSON.stringify(stamp) },
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync('src/ui/styles.css', 'utf8');
const page = fs.readFileSync('src/index.html', 'utf8');
for (const slot of ['%%BUNDLE%%', '/*%%STYLE%%*/']) if (!page.includes(slot)) throw new Error(`src/index.html has no ${slot} slot`);
const html = page.replace('/*%%STYLE%%*/', () => css).replace('%%BUNDLE%%', () => js);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
const vis = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
console.log(`built ${out} · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · ${stamp}${/stroke/i.test(vis) ? ' · WARNING: "stroke" in visible text' : ''}`);
