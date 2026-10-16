// A live preview: builds the game, serves it, and prints addresses for this computer and for a phone
// on the same Wi-Fi. Rebuilds when you reload after a change to src/ (no watcher, nothing to install).
// Usage: npm run preview [-- --port 5173]
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const i = process.argv.indexOf('--port');
const port = i > 0 ? Number(process.argv[i + 1]) : 5173;
const newest = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((t, e) => {
  const p = `${dir}/${e.name}`;
  return Math.max(t, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs);
}, 0);
let built = 0;
const build = () => {
  const changed = Math.max(newest('src'), newest('art'), newest('audio'));
  if (changed <= built && fs.existsSync('site/index.html')) return;
  execFileSync(process.execPath, ['scripts/site.mjs'], { stdio: 'inherit' });
  built = Date.now();
};
build();
http.createServer((req, res) => {
  // the music streams from next to the page, as it does from the live page's own files
  const track = /^\/music\/([a-z]+\.mp3)$/.exec(req.url || '');
  if (track && fs.existsSync(`audio/music/${track[1]}`)) {
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(`audio/music/${track[1]}`)); return;
  }
  if (req.url !== '/' && req.url !== '/index.html') { res.writeHead(404); res.end('Not found'); return; }
  try { build(); } catch (e) { res.writeHead(500, { 'content-type': 'text/plain' }); res.end(String(e)); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(fs.readFileSync('site/index.html'));
}).listen(port, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address);
  console.log(`\nHighfell preview\n  this computer:  http://localhost:${port}`);
  for (const a of lan) console.log(`  phone (same Wi-Fi):  http://${a}:${port}`);
  console.log('Edit, then reload the page: it rebuilds when src/, art/ or audio/ changed. Ctrl+C to stop.\n');
});
