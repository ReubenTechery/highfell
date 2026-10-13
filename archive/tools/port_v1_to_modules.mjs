// One-off migration (13 Oct 2026): turns the v1 dungeon scripts, which shared one global
// scope when concatenated, into ES modules with explicit imports and exports.
// Run from the repo root: node archive/tools/port_v1_to_modules.mjs
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';

const SRC = 'archive/v1/build/dungeon/js';
const OUT = 'src/dungeon';
const NAMES = {
  '01_core.js': 'core.js', '02_art.js': 'art.js', '03_world.js': 'world.js', '04_entities.js': 'entities.js',
  '05_heroes.js': 'heroes.js', '06_mobs.js': 'mobs.js', '07_bots.js': 'bots.js', '08_game.js': 'game.js',
  '09_render.js': 'render.js', '10_input.js': 'input.js', '11_ui.js': 'ui.js', '12_audio.js': 'audio.js', '13_main.js': 'main.js',
};

function edit(name, src) {
  const swap = (a, b) => { if (!src.includes(a)) throw new Error(`${name}: missing ${a}`); src = src.replace(a, b); };
  if (name === '01_core.js') swap('let SEED = 1;\n', 'let SEED = 1;\nfunction setSeed(v) { SEED = v; }\n');
  if (name === '04_entities.js') swap('let S = null;\n', 'let S = null;\nfunction setS(v) { S = v; }\n');
  if (name === '08_game.js') {
    swap('  SEED = opts.seed || ((Date.now() & 0xfffffff) | 1);\n', '  setSeed(opts.seed || ((Date.now() & 0xfffffff) | 1));\n');
    swap('  S = {\n', '  setS({\n');
    swap('cp: 0, quiet: !!opts.quiet, auto: !!opts.auto, cleared: 0, total: PACKS.length, startedAt: 0,\n  };\n', 'cp: 0, quiet: !!opts.quiet, auto: !!opts.auto, cleared: 0, total: PACKS.length, startedAt: 0,\n  });\n');
  }
  return src;
}

// every identifier used as a value (not a property name or a label)
function references(ast) {
  const out = new Set();
  const visit = (node, parent, key) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'Identifier') {
      const isProp = parent && ((parent.type === 'MemberExpression' && key === 'property' && !parent.computed)
        || ((parent.type === 'Property' || parent.type === 'MethodDefinition' || parent.type === 'PropertyDefinition') && key === 'key' && !parent.computed && !parent.shorthand)
        || ((parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') && key === 'label'));
      if (!isProp) out.add(node.name);
      return;
    }
    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'start' || k === 'end' || k === 'loc') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => visit(c, node, k));
      else if (v && typeof v.type === 'string') visit(v, node, k);
    }
  };
  visit(ast, null, null);
  return out;
}
function assignedNames(ast) {
  const out = new Set();
  const visit = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier') out.add(node.left.name);
    if (node.type === 'UpdateExpression' && node.argument.type === 'Identifier') out.add(node.argument.name);
    for (const k of Object.keys(node)) { const v = node[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === 'string') visit(v); }
  };
  visit(ast);
  return out;
}

const files = Object.keys(NAMES).map((f) => {
  const text = edit(f, fs.readFileSync(path.join(SRC, f), 'utf8'));
  const ast = acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'script' });
  const decls = [];
  for (const st of ast.body) {
    if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') decls.push({ names: [st.id.name], start: st.start });
    else if (st.type === 'VariableDeclaration') decls.push({ names: st.declarations.map((d) => d.id.name), start: st.start });
  }
  return { f, out: NAMES[f], text, ast, decls, own: new Set(decls.flatMap((d) => d.names)) };
});
// the art, icons and portraits used to be injected into the page as constants
const assets = { out: 'assets.js', own: new Set(['ART', 'TILES', 'PORTRAITS']) };
const owner = new Map();
for (const file of [...files, assets]) for (const n of file.own) { if (owner.has(n)) throw new Error('declared twice: ' + n); owner.set(n, file.out); }

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets.js'), "// generated art, bundled from the art/ folder\nimport ART from '../../art/sprites.json';\nimport TILES from '../../art/icons.json';\nimport PORTRAITS from '../../art/portraits.json';\nexport { ART, TILES, PORTRAITS };\n");
const problems = [];
for (const file of files) {
  const refs = references(file.ast);
  const need = new Map();
  for (const n of refs) {
    if (file.own.has(n) || !owner.has(n)) continue;
    const from = owner.get(n);
    if (!need.has(from)) need.set(from, []);
    need.get(from).push(n);
  }
  for (const n of assignedNames(file.ast)) if (!file.own.has(n) && owner.has(n)) problems.push(`${file.out} assigns imported ${n}`);
  let body = file.text;
  for (const d of [...file.decls].sort((a, b) => b.start - a.start)) body = body.slice(0, d.start) + 'export ' + body.slice(d.start);
  const imports = [...need.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([from, ns]) => `import { ${ns.sort().join(', ')} } from './${from}';`).join('\n');
  fs.writeFileSync(path.join(OUT, file.out), (imports ? imports + '\n\n' : '') + body);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('ported', files.length, 'files to', OUT);
