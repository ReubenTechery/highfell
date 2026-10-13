// Bundles each tests/*.test.ts for Node and runs them with the built-in test runner.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const only = process.argv.slice(2);
const files = fs.readdirSync('tests').filter((f) => f.endsWith('.test.ts') && (!only.length || only.some((o) => f.includes(o))));
fs.rmSync('.cache/tests', { recursive: true, force: true });
await esbuild.build({ entryPoints: files.map((f) => path.join('tests', f)), bundle: true, format: 'esm', platform: 'node', outdir: '.cache/tests', outExtension: { '.js': '.mjs' }, logLevel: 'warning', external: ['node:*'] });
const r = spawnSync(process.execPath, ['--test', ...files.map((f) => path.join('.cache/tests', f.replace(/\.ts$/, '.mjs')))], { stdio: 'inherit' });
process.exit(r.status ?? 1);
