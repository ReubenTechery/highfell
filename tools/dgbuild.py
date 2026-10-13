import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Assembles the Barrow Crypt page: template + art + icons + hero portraits + the game script.
import json, os, re, glob
B = HF_ROOT + '/'
D = B + 'build/dungeon/'
OUT = B + 'dungeon/barrow-crypt.html'
t = open(D + 'template.html', encoding='utf-8').read()
art = json.load(open(D + 'art.json'))
tiles = json.load(open(D + 'tiles.json'))
heroes = json.load(open(B + 'build/fight/heroes_tv.json'))
portraits = {'tank': heroes['brannoc'], 'healer': heroes['maren'], 'dps': heroes['ivy']}
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(D + 'js/*.js')))
safe = lambda o: json.dumps(o, separators=(',', ':')).replace('</', '<\\/')
t = t.replace('%%ART%%', safe(art)).replace('%%TILES%%', safe(tiles)).replace('%%PORTRAITS%%', safe(portraits)).replace('%%JS%%', js)
left = re.findall(r'%%[A-Z]+%%', t)
assert not left, left
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(t)
open(D + '_game.js', 'w').write(js)
vis = re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S))
strs = re.findall(r"'([^'\\\n]*)'", js)
print('bytes', len(t.encode()), '| stroke in visible text:', 'stroke' in vis.lower(), '| in JS strings:', [s for s in strs if 'stroke' in s.lower() and 'stroke-' not in s and 'stroke:' not in s][:3])
