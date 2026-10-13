import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Assembles the Barrow King fight page from the template, scene, boss, heroes and icons.
# Usage: fightbuild.py [v2]   (default builds v3, the locked TV-cartoon look)
import json, re, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fighttiles import TILES, TV_TILES
from tvloot import LOOT_ICONS
B = HF_ROOT + '/build/fight/'
OUT = HF_ROOT + '/fight/barrow-king-fight.html'
V2 = len(sys.argv) > 1 and sys.argv[1] == 'v2'
if V2:
    OUT = B + 'v2-rebuilt.html'
t = open(B + ('template2.html' if V2 else 'template3.html'), encoding='utf-8').read()
scene = open(B + ('scene.svg.html' if V2 else 'scene_tv.svg.html')).read()
boss = open(B + ('boss.svg.html' if V2 else 'boss_tv.svg.html')).read()
ice = '''<svg class="ice" viewBox="0 0 400 470" aria-hidden="true">
<path d="M96 120 L150 70 L250 64 L312 118 L330 300 L300 452 L100 452 L72 300 Z" style="fill: #8FD6FF; opacity: 0.3"/>
<path d="M150 70 L176 128 L230 96 L250 64 M312 118 L268 168 L330 300 M72 300 L134 262 L96 120 M100 452 L150 380 L210 420 L300 452" style="fill: none; stroke: #DDF3FF; stroke-width: 2.5; stroke-linejoin: round; opacity: 0.85"/>
<path d="M96 120 L150 70 L250 64 L312 118 L330 300 L300 452 L100 452 L72 300 Z" style="fill: none; stroke: #2A1A22; stroke-width: 4; stroke-linejoin: round"/>
<path d="M118 146 L146 106 M116 176 L130 158 M284 384 L302 334 M262 424 L276 400" style="fill: none; stroke: #F4FCFF; stroke-width: 5; stroke-linecap: round"/>
</svg>'''
if not V2:
    ice = ice.replace('stroke: #DDF3FF; stroke-width: 2.5', 'stroke: #F4FCFF; stroke-width: 3').replace('stroke: #2A1A22; stroke-width: 4;', 'stroke: #1E1A1A; stroke-width: 5;')
icons = {
 'chop': '<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 28 L22 8" style="fill: none; stroke: #2A1A22; stroke-width: 6; stroke-linecap: round"/><path d="M8 28 L22 8" style="fill: none; stroke: #A0703F; stroke-width: 3; stroke-linecap: round"/><path d="M17 6 C23 2 30 7 29 14 C24 13 20 11 17 6 Z" style="fill: #D7DEE6; stroke: #2A1A22; stroke-width: 2.2; stroke-linejoin: round"/></svg>',
 'overhead': '<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 14 C6 7 12 3 19 3 M3 20 C4 15 7 11 11 9" style="fill: none; stroke: #FF8A4C; stroke-width: 2.5; stroke-linecap: round"/><path d="M12 29 L22 10" style="fill: none; stroke: #2A1A22; stroke-width: 6; stroke-linecap: round"/><path d="M12 29 L22 10" style="fill: none; stroke: #A0703F; stroke-width: 3; stroke-linecap: round"/><path d="M17 8 C21 2 30 4 30 11 C26 12 21 11 17 8 Z" style="fill: #D7DEE6; stroke: #2A1A22; stroke-width: 2.2; stroke-linejoin: round"/></svg>',
 'shout': '<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 13 H10 L18 7 V25 L10 19 H4 Z" style="fill: #9BD068; stroke: #2A1A22; stroke-width: 2.2; stroke-linejoin: round"/><path d="M22 12 C24.5 14.5 24.5 17.5 22 20 M25.5 9 C30 13.5 30 18.5 25.5 23" style="fill: none; stroke: #9BD068; stroke-width: 2.5; stroke-linecap: round"/></svg>',
 'taunt': '<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 L27 7 V15 C27 22 22 26.5 16 29 C10 26.5 5 22 5 15 V7 Z" style="fill: #F4B942; stroke: #2A1A22; stroke-width: 2.2; stroke-linejoin: round"/><path d="M16 9 V18" style="fill: none; stroke: #2A1A22; stroke-width: 3.2; stroke-linecap: round"/><circle cx="16" cy="23" r="1.9" style="fill: #2A1A22"/></svg>',
 'shatter': '<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 V29 M4.7 9.5 L27.3 22.5 M4.7 22.5 L27.3 9.5" style="fill: none; stroke: #2A1A22; stroke-width: 5; stroke-linecap: round"/><path d="M16 3 V29 M4.7 9.5 L27.3 22.5 M4.7 22.5 L27.3 9.5" style="fill: none; stroke: #8FD6FF; stroke-width: 2.6; stroke-linecap: round"/><path d="M12 4 L15 12 L11 17 L16 24 L13 29" style="fill: none; stroke: #2A1A22; stroke-width: 1.8; stroke-linejoin: round"/></svg>',
 'ult': '<svg class="ic" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 L19.5 11.5 L29.5 12.5 L22 19 L24.5 29 L16 23.5 L7.5 29 L10 19 L2.5 12.5 L12.5 11.5 Z" style="fill: #B79CFF; stroke: #2A1A22; stroke-width: 2.2; stroke-linejoin: round"/><path d="M13 18 L19 12" style="fill: none; stroke: #2A1A22; stroke-width: 2.6; stroke-linecap: round"/></svg>',
}
heroes = json.load(open(B + ('heroes.json' if V2 else 'heroes_tv.json')))
def thin(h, k=0.72):
    return re.sub(r'stroke-width: ([0-9.]+)', lambda m: 'stroke-width: ' + str(round(float(m.group(1)) * k, 2)), h)
blade = 'M183 300 L217 300 L214 432 L200 458 L186 432 Z'
glowg = ('<g class="bk-swordglow"><path d="' + blade + '" style="fill: #FF8A4C; stroke: #FF8A4C; stroke-width: 30; stroke-linejoin: round; opacity: 0.45"/>'
         '<path d="' + blade + '" style="fill: #FFD9B8; stroke: #FFB27A; stroke-width: 14; stroke-linejoin: round; opacity: 0.85"/></g>\n')
assert boss.count('<g class="bk-sword">') == 1
assert blade in boss, 'blade path must match the sword glow'
boss = boss.replace('<g class="bk-sword">', glowg + '<g class="bk-sword">')
t = t.replace('%%LOOT%%', json.dumps(LOOT_ICONS))
t = t.replace('%%SCENE%%', scene).replace('%%BOSS%%', boss).replace('%%ICE%%', ice)
for n, h in heroes.items():
    t = t.replace('%%H_' + n + '%%', thin(h) if V2 else h)
for n, s in icons.items():
    t = t.replace('%%I_' + n + '%%', s)
for n, s in (TILES if V2 else TV_TILES).items():
    t = t.replace('%%T_' + n + '%%', s)
left = re.findall(r'%%[A-Za-z_]+%%', t)
assert not left, left
if not V2:
    t = t.replace('#2A1A22', '#1E1A1A')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(t)
vis = re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S))
print('bytes', len(t.encode()), '| stroke in visible text:', 'stroke' in vis.lower(), '| out', OUT)
