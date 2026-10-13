import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Renders static Hero markup from the Look Book kit. Usage: herostatic.py '<json {name: props}>' out.json
import re, json, subprocess, sys, os
proj = HF_ROOT + '/lookbook/project'
cfg = json.loads(sys.argv[1]); out = sys.argv[2]
src = open(os.path.join(proj, 'Hero.dc.html'), encoding='utf-8').read()
tpl = src.split('<x-dc>')[1].split('</x-dc>')[0]
tpl = re.sub(r'<helmet>.*?</helmet>', '', tpl, flags=re.S).strip()
js = re.search(r"data-props='[^']*'>(.*?)</script>", src, re.S).group(1)
def look(v, path):
    path = path.strip()
    if path in ('true', 'false'): return path == 'true'
    for part in path.split('.'): v = v[part]
    return v
def fill(t, v):
    t = re.sub(r'<sc-if value="\{\{(.*?)\}\}"[^>]*>(.*?)</sc-if>', lambda m: m.group(2) if look(v, m.group(1)) else '', t, flags=re.S)
    return re.sub(r'\{\{(.*?)\}\}', lambda m: str(look(v, m.group(1))), t)
names = list(cfg.keys())
jsfile = os.path.join(os.path.dirname(os.path.abspath(out)), '_hero.js')
open(jsfile, 'w').write("class DCLogic{constructor(p){this.props=p}}\n" + js + "\nconst P=" + json.dumps([cfg[n] for n in names]) + ";\nconsole.log(JSON.stringify(P.map(p=>new Component(p).renderVals())));\n")
vals = json.loads(subprocess.run(['node', jsfile], capture_output=True, text=True, check=True).stdout)
res = {}
for n, v in zip(names, vals):
    h = fill(tpl, v)
    h = re.sub(r'>\s+<', '><', h)
    h = re.sub(r'\n+', '', h)
    res[n] = h
json.dump(res, open(out, 'w'))
print({n: len(h) for n, h in res.items()})
