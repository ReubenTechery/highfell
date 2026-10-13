import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Offline preview of a board: inlines Hero imports, uses local fonts, screenshots and reports natural height.
import re, json, subprocess, sys, os
from playwright.sync_api import sync_playwright

board, out_png = sys.argv[1], sys.argv[2]
width = int(sys.argv[3]) if len(sys.argv) > 3 else 1440
proj = os.path.dirname(os.path.abspath(board))
work = os.path.dirname(os.path.abspath(out_png))
F = HF_ROOT + '/build/fonts/node_modules/@fontsource'
fonts = f"""
@font-face{{font-family:'Lilita One';src:url('file://{F}/lilita-one/files/lilita-one-latin-400-normal.woff2')}}
@font-face{{font-family:'DM Mono';font-weight:400;src:url('file://{F}/dm-mono/files/dm-mono-latin-400-normal.woff2')}}
@font-face{{font-family:'DM Mono';font-weight:500;src:url('file://{F}/dm-mono/files/dm-mono-latin-500-normal.woff2')}}
@font-face{{font-family:'IM Fell English SC';src:url('file://{F}/im-fell-english-sc/files/im-fell-english-sc-latin-400-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;src:url('file://{F}/spectral/files/spectral-latin-400-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:500;src:url('file://{F}/spectral/files/spectral-latin-500-normal.woff2')}}
@font-face{{font-family:'Spectral';font-weight:400;font-style:italic;src:url('file://{F}/spectral/files/spectral-latin-400-italic.woff2')}}
"""

def load_component(name):
    src = open(os.path.join(proj, name + '.dc.html'), encoding='utf-8').read()
    tpl = src.split('<x-dc>')[1].split('</x-dc>')[0]
    tpl = re.sub(r'<helmet>.*?</helmet>', '', tpl, flags=re.S)
    js = re.search(r"data-props='[^']*'>(.*?)</script>", src, re.S).group(1)
    return tpl, js

def look(v, path):
    path = path.strip()
    if path in ('true', 'false'):
        return path == 'true'
    for part in path.split('.'):
        v = v[part]
    return v

def fill(tpl, v):
    out = re.sub(r'<sc-if value="\{\{(.*?)\}\}"[^>]*>(.*?)</sc-if>', lambda m: m.group(2) if look(v, m.group(1)) else '', tpl, flags=re.S)
    return re.sub(r'\{\{(.*?)\}\}', lambda m: str(look(v, m.group(1))), out)

src = open(board, encoding='utf-8').read()
helmet = re.search(r'<helmet>(.*?)</helmet>', src, re.S).group(1)
style = ''.join(re.findall(r'<style>(.*?)</style>', helmet, re.S))
body = src.split('<x-dc>')[1].split('</x-dc>')[0]
body = re.sub(r'<helmet>.*?</helmet>', '', body, flags=re.S)
# run the board's own logic (props from argv[4] as JSON) and fill its holes first
bjs = re.search(r"data-props='[^']*'>(.*?)</script>", src, re.S).group(1)
bprops = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
bjsfile = os.path.join(work, '_boardself.js')
open(bjsfile, 'w').write("class DCLogic{constructor(p){this.props=p;this.state={}}setState(){}}\n" + bjs + "\nconsole.log(JSON.stringify(new Component(" + json.dumps(bprops) + ").renderVals()));\n")
bvals = json.loads(subprocess.run(['node', bjsfile], capture_output=True, text=True, check=True).stdout)
if bvals:
    body = fill(body, bvals)
imports = re.findall(r'<dc-import\s+([^>]*)></dc-import>', body)
if imports:
    tpl, js = load_component('Hero')
    props = []
    for a in imports:
        d = dict(re.findall(r'([\w-]+)="([^"]*)"', a))
        d.pop('name', None); d.pop('hint-size', None)
        props.append(d)
    jsfile = os.path.join(work, '_board.js')
    open(jsfile, 'w').write("class DCLogic{constructor(p){this.props=p}}\n" + js + "\nconst P=" + json.dumps(props) + ";\nconsole.log(JSON.stringify(P.map(p=>new Component(p).renderVals())));\n")
    vals = json.loads(subprocess.run(['node', jsfile], capture_output=True, text=True, check=True).stdout)
    it = iter(vals)
    body = re.sub(r'<dc-import\s+[^>]*></dc-import>', lambda m: fill(tpl, next(it)), body)
html = '<!doctype html><html><head><meta charset="utf-8"><style>' + fonts + style + '</style></head><body>' + body + '</body></html>'
page = os.path.join(work, '_board.html')
open(page, 'w').write(html)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': width, 'height': 800})
    pg.goto('file://' + page)
    pg.wait_for_timeout(400)
    h = pg.evaluate('document.documentElement.scrollHeight')
    pg.screenshot(path=out_png, full_page=True)
    b.close()
print('natural height', h)
