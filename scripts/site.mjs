// Builds the game and wraps it as a normal web page: site/index.html. The built dist/highfell.html is
// a fragment for claude.ai, which adds the page around it; anywhere else (a local preview, a preview
// host such as Netlify or Cloudflare Pages) needs this full page. Usage: node scripts/site.mjs
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
const game = fs.readFileSync('dist/highfell.html', 'utf8');
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Highfell (preview)</title>
<style>html, body { margin: 0; height: 100%; background: #17121F; }</style>
</head>
<body>
${game}
</body>
</html>
`;
fs.mkdirSync('site', { recursive: true });
fs.writeFileSync('site/index.html', page);
console.log('site/index.html ready: a full page for previews. Saves stay in this browser.');
