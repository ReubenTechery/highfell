import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# The fight's five heroes in the locked TV-cartoon style, with lines thick enough to read small.
# Usage: tvheroes.py -> build/fight/heroes_tv.json (+ a preview fragment)
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artstyles import path, rect, circle, ellipse, tv as tv_dwarf
from tvworld import Pen, rogue, sorceress, orc_ranger, K

B = HF_ROOT + '/build/fight/'
FAT = 1.75  # line weight multiplier for small on-screen size


def strip_bg(svg):
    svg = re.sub(r'<rect x="0" y="0" width="300" height="420"[^>]*/>', '', svg, count=1)
    svg = re.sub(r'<path d="M-10 3\d\d C[^"]*V430 H-10 Z"[^>]*/>', '', svg)
    svg = re.sub(r'<path d="M40 90 C40 74[^"]*"[^>]*/>', '', svg)
    svg = re.sub(r'<path d="M-10 300 C60 250[^"]*"[^>]*/>', '', svg)
    svg = re.sub(r'<path d="M-10 352 C80 340[^"]*"[^>]*/>', '', svg)
    return svg


def fatten(svg):
    return re.sub(r'stroke-width: ([0-9.]+)', lambda m: f'stroke-width: {float(m.group(1)) * FAT:.2f}', svg)


def body_of(svg):
    return svg[svg.index('>') + 1:svg.rindex('</svg>')]


def wrap(inner, label, dy=0):
    g = f'<g transform="translate(0 {dy})">{inner}</g>' if dy else inner
    return f'<svg viewBox="0 20 300 400" role="img" aria-label="{label}" style="display: block; width: 100%; height: auto; overflow: visible;">{g}</svg>'


def recolor(svg, pairs):
    for a, b in pairs:
        svg = svg.replace(a, b)
    return svg


def maren(p):
    RB, GD, BL, SK, HR = '#F6F1E4', '#E7B53C', '#4F86C6', '#A86F4C', '#3A2A22'
    o = [ellipse(150, 394, 84, 9, '#000000', op=0.18)]
    o.append(circle(150, 44, 18, HR, K, 3))
    o.append(p.sh('M108 168 C96 250 84 330 72 392 H228 C216 330 204 250 192 168 Z', RB))
    o.append(p.sh('M132 172 L126 360 L144 360 L146 172 Z', BL) + p.sh('M168 172 L174 360 L156 360 L154 172 Z', BL))
    o.append(circle(135, 340, 6, GD, K, 2) + circle(165, 340, 6, GD, K, 2))
    o.append(p.sh('M76 378 C120 386 180 386 224 378 L228 394 C180 400 120 400 72 394 Z', GD))
    o.append(p.sh('M112 250 C134 258 166 258 188 250 L186 262 C166 270 134 270 114 262 Z', GD))
    # staff with a sun
    o.append(path('M88 392 L94 116', 'none', K, 9) + path('M88 392 L94 116', 'none', '#8A5A34', 5))
    o.append(circle(96, 98, 34, '#F4B942', op=0.25))
    for k in range(8):
        import math
        a = math.radians(k * 45)
        x1, y1 = 96 + 17 * math.cos(a), 98 + 17 * math.sin(a)
        x2, y2 = 96 + 28 * math.cos(a), 98 + 28 * math.sin(a)
        o.append(path(f'M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}', 'none', K, 7) + path(f'M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}', 'none', GD, 3.5))
    o.append(circle(96, 98, 15, GD, K, 3))
    # sleeves and hands
    o.append(p.sh('M110 172 C90 200 78 238 74 264 C88 276 108 274 120 264 C118 232 120 204 126 180 Z', RB))
    o.append(p.sh('M76 258 C88 268 106 268 118 260 L120 270 C106 278 88 278 74 268 Z', GD))
    o.append(circle(94, 268, 9, SK, K, 2.5))
    o.append(p.sh('M190 172 C210 200 222 238 226 264 C212 276 192 274 180 264 C182 232 180 204 174 180 Z', RB))
    o.append(p.sh('M224 258 C212 268 194 268 182 260 L180 270 C194 278 212 278 226 268 Z', GD))
    o.append(circle(206, 268, 9, SK, K, 2.5))
    o.append(circle(214, 244, 22, '#F4B942', op=0.25))
    o.append(path('M214 228 Q214 244 230 244 Q214 244 214 260 Q214 244 198 244 Q214 244 214 228 Z', '#FFE08A', K, 2))
    # hood collar, face, hair
    o.append(p.sh('M106 156 C124 136 176 136 194 156 L188 182 C170 172 130 172 112 182 Z', RB))
    o.append(path('M110 160 C128 144 172 144 190 160', 'none', GD, 3))
    o.append(p.sh('M140 116 H160 V140 H140 Z', SK))
    o.append(p.sh('M124 92 C124 66 176 66 176 92 C176 116 164 130 150 132 C136 130 124 116 124 92 Z', SK))
    for ex in (138, 162):
        o.append(path(f'M{ex - 7} 95 C{ex - 4} 89 {ex + 4} 89 {ex + 7} 95 C{ex + 4} 99 {ex - 4} 99 {ex - 7} 95 Z', '#FFFFFF', K, 2) + circle(ex, 95, 2.6, K))
    o.append(path('M131 86 C135 83 141 83 145 85 M155 85 C159 83 165 83 169 86', 'none', K, 2.5))
    o.append(path('M150 99 L148 108 L152 109', 'none', K, 2) + path('M141 116 C146 121 154 121 159 116', 'none', K, 2.5))
    o.append(p.sh('M122 96 C116 64 140 52 150 52 C160 52 184 64 178 96 C172 80 162 72 150 72 C138 72 128 80 122 96 Z', HR))
    o.append(path('M128 78 C140 72 160 72 172 78', 'none', GD, 3) + circle(150, 74, 4, BL, K, 2))
    return ''.join(o)


def make():
    tv = Pen(True)
    heroes = {}
    dw = strip_bg(tv_dwarf())
    heroes['brannoc'] = wrap('<g transform="translate(150 394) scale(0.86) translate(-150 -380)">' + fatten(body_of(dw)) + '</g>', 'Brannoc, the dwarf warrior')
    heroes['maren'] = wrap(fatten(maren(tv)), 'Maren, the priestess')
    heroes['wren'] = wrap(fatten(body_of(strip_bg(rogue(tv)))), 'Wren, the rogue')
    ivy = body_of(strip_bg(sorceress(tv)))
    ivy = recolor(ivy, [('#B8383A', '#3D7FC1'), ('#2A1E33', '#1F2A4A'), ('#2A2230', '#EEF2F6'), ('#A86F4C', '#F3D7C4'), ('#FF8A4C', '#8FD6FF'),
                        ('#FFE08A', '#F4FCFF'), ('#C9CFD8', '#8FD6FF'), ('#7A1F2A', '#B04A5A')])
    ivy += path('M126 92 L100 74 L127 106 Z', '#F3D7C4', K, 3) + path('M174 92 L200 74 L173 106 Z', '#F3D7C4', K, 3)
    heroes['ivy'] = wrap(fatten(ivy), 'Ivy, the frost mage')
    tomas = body_of(strip_bg(orc_ranger(tv)))
    tomas = re.sub(r'<path d="M130 148 L126 126 L138 144 Z"[^>]*/>', '', tomas)
    tomas = re.sub(r'<path d="M170 148 L174 126 L162 144 Z"[^>]*/>', '', tomas)
    tomas = tomas.replace('M112 108 L90 96 L112 124 Z', 'M114 104 C102 102 102 124 114 124 Z').replace('M188 108 L210 96 L188 124 Z', 'M186 104 C198 102 198 124 186 124 Z')
    tomas = recolor(tomas, [('#7FA35A', '#E8B48A'), ('#5E8240', '#C98F66'), ('#2A2230', '#6B4528')])
    tomas += path('M124 140 C132 160 168 160 176 140 C172 156 162 166 150 166 C138 166 128 156 124 140 Z', '#8A5A34', K, 3)
    heroes['tomas'] = wrap(fatten(tomas), 'Tomas, the ranger')
    return heroes


if __name__ == '__main__':
    h = make()
    json.dump(h, open(B + 'heroes_tv.json', 'w'))
    order = ['maren', 'wren', 'brannoc', 'ivy', 'tomas']
    cells = ''.join(f'<div style="width:{150 if k != "brannoc" else 186}px">{h[k]}</div>' for k in order)
    open(B + 'heroes_tv_frag.html', 'w').write(f'<div style="display:flex;gap:18px;align-items:flex-end;background:#3E3550;padding:20px">{cells}</div>'
                                               f'<div style="display:flex;gap:6px;align-items:flex-end;background:#3E3550;padding:10px;margin-top:10px">' + ''.join(f'<div style="width:{64 if k != "brannoc" else 80}px">{h[k]}</div>' for k in order) + '</div>')
    print('ok', {k: len(v) for k, v in h.items()})
