# Offline preview of the Hero kit: evaluates renderVals with node, fills the template, screenshots a grid.
import re, json, subprocess, sys, os
from playwright.sync_api import sync_playwright

src_path, out_png = sys.argv[1], sys.argv[2]
configs = json.loads(sys.argv[3])
src = open(src_path, encoding='utf-8').read()
tpl = src.split('<x-dc>')[1].split('</x-dc>')[0]
tpl = re.sub(r'<helmet>.*?</helmet>', '', tpl, flags=re.S)
js = re.search(r"data-props='[^']*'>(.*?)</script>", src, re.S).group(1)
work = os.path.dirname(os.path.abspath(out_png))
jsfile = os.path.join(work, '_kit.js')
open(jsfile, 'w').write("class DCLogic{constructor(p){this.props=p}}\n" + js +
    "\nconst cfgs=" + json.dumps([c['props'] for c in configs]) +
    ";\nconsole.log(JSON.stringify(cfgs.map(p=>new Component(p).renderVals())));\n")
vals = json.loads(subprocess.run(['node', jsfile], capture_output=True, text=True, check=True).stdout)

def look(v, path):
    path = path.strip()
    if path in ('true', 'false'):
        return path == 'true'
    for part in path.split('.'):
        v = v[part]
    return v

def render(v):
    def sc(m):
        return m.group(2) if look(v, m.group(1)) else ''
    out = re.sub(r'<sc-if value="\{\{(.*?)\}\}"[^>]*>(.*?)</sc-if>', sc, tpl, flags=re.S)
    return re.sub(r'\{\{(.*?)\}\}', lambda m: str(look(v, m.group(1))), out)

cells = []
for cfg, v in zip(configs, vals):
    w = cfg.get('w', 220)
    cells.append(f'<div style="width:{w}px;display:flex;flex-direction:column;gap:6px;align-items:center">'
                 f'<div style="width:{w}px">{render(v)}</div>'
                 f'<div style="font:12px monospace;color:#ddd">{cfg.get("label","")}</div></div>')
html = ('<!doctype html><html><body style="margin:0;background:#3a3344;padding:16px">'
        '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;width:' + str(sys.argv[4] if len(sys.argv) > 4 else 1200) + 'px">'
        + ''.join(cells) + '</div></body></html>')
page_file = os.path.join(work, '_kit.html')
open(page_file, 'w').write(html)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': int(sys.argv[4]) + 40 if len(sys.argv) > 4 else 1240, 'height': 800})
    pg.goto('file://' + page_file)
    pg.screenshot(path=out_png, full_page=True)
    b.close()
print('ok', out_png)
