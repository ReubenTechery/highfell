import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Ability icons for the Barrow Crypt (64x64 TV tiles: flat bright ground, one black line, one idea each).
# Usage: python3 tools/art_icons.py -> art/icons.json + art/_icons_preview.html
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fighttiles import TV_TILES

OUT = HF_ROOT + '/art/'
K = '#1E1A1A'


def f1(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def P(d, col, w, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" style="fill: none; stroke: {col}; stroke-width: {w}; stroke-linecap: round; stroke-linejoin: round{o}"/>'


def F(d, fill, w=3.5):
    return f'<path d="{d}" style="fill: {fill}; stroke: {K}; stroke-width: {w}; stroke-linejoin: round"/>'


def inked(d, col, w):
    return P(d, K, w + 4.5) + P(d, col, w)


def C(cx, cy, r, fill, w=3.2):
    st = f'; stroke: {K}; stroke-width: {w}' if w else ''
    return f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{f1(r)}" style="fill: {fill}{st}"/>'


def tile(bg, inner):
    return f'<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" style="fill: {bg}"/>{inner}</svg>'


T = {}
T['taunt'] = TV_TILES['taunt']

T['shield'] = tile('#C8403F',
                   P('M6 18 L14 24 M4 32 H13 M6 46 L14 40', '#FFF3C4', 3.4) +
                   C(38, 32, 21, '#F2C230', 3.5) + C(38, 32, 15, '#9AA7B8', 3) + C(38, 32, 6, '#F2C230', 3) +
                   P('M28 22 C32 19 37 18 42 19', '#FFFFFF', 2.6, 0.9))

T['charge'] = tile('#E07A2E',
                   P('M4 22 H18 M2 34 H16 M6 46 H20', '#FFF3C4', 3.6) +
                   F('M24 40 C24 22 54 22 54 40 Z', '#9AA7B8') + F('M22 38 H56 V45 H22 Z', '#7D8FA3', 3) +
                   F('M26 30 C18 28 14 20 16 10 C20 18 26 22 32 24 Z', '#F0E8D2', 3) +
                   F('M52 30 C60 28 64 20 62 10 C58 18 52 22 46 24 Z', '#F0E8D2', 3) +
                   F('M26 46 C30 58 48 58 52 46 Z', '#E2733A', 3))

# healer
pts = []
for k in range(8):
    a = math.radians(k * 45)
    pts.append(inked(f'M{f1(32 + 13 * math.cos(a))} {f1(30 + 13 * math.sin(a))} L{f1(32 + 19 * math.cos(a))} {f1(30 + 19 * math.sin(a))}', '#F2C230', 3.2))
T['sunburst'] = tile('#E07A2E', ''.join(pts) + C(32, 30, 10, '#F2C230', 3.5) + C(29, 27, 3, '#FFF6D0', 0) +
                     P('M10 54 C18 50 24 50 32 54 C40 50 46 50 54 54', '#FFF3C4', 3, 0.9))

T['circle'] = tile('#6A4BA3',
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: #F2C230; opacity: 0.4"/>' +
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/>' +
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: none; stroke: #F2C230; stroke-width: 3.4"/>' +
                   inked('M32 12 V28 M24 20 H40', '#FFFFFF', 4) +
                   P('M14 24 L16 28 M50 22 L48 27', '#FFF3C4', 2.6))

T['ward'] = tile('#2F6FA8',
                 '<circle cx="32" cy="33" r="21" style="fill: #DDF3FF; opacity: 0.55; stroke: #1E1A1A; stroke-width: 3.5"/>' +
                 P('M20 22 C24 16 30 14 36 15', '#FFFFFF', 3.2) +
                 F('M32 23 L41 27 V34 C41 40 37 44 32 46 C27 44 23 40 23 34 V27 Z', '#F2C230', 3))

T['mend'] = tile('#4E9A4A', inked('M32 14 V50 M14 32 H50', '#FFFFFF', 7) + P('M48 14 L52 10 M54 20 H58', '#FFF3C4', 2.6))

# dps
flakes = ''
for (x, y) in [(18, 46), (32, 52), (46, 45), (24, 57), (42, 58)]:
    flakes += P(f'M{x} {y - 4} V{y + 4} M{x - 3.5} {y - 2} L{x + 3.5} {y + 2} M{x - 3.5} {y + 2} L{x + 3.5} {y - 2}', K, 4.5) + P(f'M{x} {y - 4} V{y + 4} M{x - 3.5} {y - 2} L{x + 3.5} {y + 2} M{x - 3.5} {y + 2} L{x + 3.5} {y - 2}', '#FFFFFF', 2)
T['blizzard'] = tile('#1F4F7A', F('M12 34 C6 34 6 24 13 23 C13 14 25 12 28 19 C32 10 46 12 46 21 C54 20 58 30 51 34 Z', '#DDE6EE') + P('M18 30 H44', '#9FB3C6', 2.4) + flakes)

spikes = ''
for k in range(8):
    a = math.radians(k * 45 + 22.5)
    cx, cy = 32 + 17 * math.cos(a), 32 + 17 * math.sin(a)
    tx, ty = 32 + 28 * math.cos(a), 32 + 28 * math.sin(a)
    lx, ly = cx + 5 * math.cos(a + math.pi / 2), cy + 5 * math.sin(a + math.pi / 2)
    rx, ry = cx - 5 * math.cos(a + math.pi / 2), cy - 5 * math.sin(a + math.pi / 2)
    spikes += F(f'M{f1(lx)} {f1(ly)} L{f1(tx)} {f1(ty)} L{f1(rx)} {f1(ry)} Z', '#8FD6FF', 2.6)
T['nova'] = tile('#4F6FA8', spikes + '<circle cx="32" cy="32" r="16" style="fill: none; stroke: #1E1A1A; stroke-width: 8"/>' +
                 '<circle cx="32" cy="32" r="16" style="fill: none; stroke: #DDF3FF; stroke-width: 4"/>' + C(32, 32, 6, '#FFFFFF', 3))

T['comet'] = tile('#6A4BA3',
                  F('M6 14 C18 22 26 30 32 36 L26 44 C20 36 12 26 6 14 Z', '#DDF3FF', 0) +
                  P('M8 10 L28 34 M14 8 L32 30', '#DDF3FF', 3, 0.85) +
                  C(38, 42, 14, '#8FD6FF', 3.5) + F('M42 34 L48 40 L40 42 Z', '#FFFFFF', 1.8) +
                  P('M32 40 L37 46 L32 52', '#5BAAD8', 2.6))

T['dodge'] = tile('#4E9A4A',
                  inked('M12 46 C16 24 34 14 50 18', '#FFF3C4', 5) + F('M44 9 L56 19 L42 25 Z', '#FFF3C4', 3) +
                  C(14, 52, 5, '#C9B79A', 2.6) + C(24, 54, 4, '#C9B79A', 2.4) + C(7, 44, 3.5, '#C9B79A', 2.2))

link = lambda x, y, a: f'<ellipse cx="{x}" cy="{y}" rx="8" ry="5" transform="rotate({a} {x} {y})" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/><ellipse cx="{x}" cy="{y}" rx="8" ry="5" transform="rotate({a} {x} {y})" style="fill: none; stroke: #C9D2DC; stroke-width: 3"/>'
T['cut'] = tile('#C8403F', link(14, 50, -40) + link(24, 40, 50) + link(42, 22, 50) + link(52, 12, -40) +
                P('M14 22 L50 46', '#1E1A1A', 9) + P('M14 22 L50 46', '#FFFFFF', 4.5))


# ---- loot item icons (neutral ground; rarity shows as the frame colour)
IB = '#3A3150'
T['i_axe'] = tile(IB, inked('M20 54 L42 14', '#A0703F', 5) + F('M36 10 C48 2 62 12 58 30 C48 28 40 22 36 10 Z', '#D7DEE6') + P('M43 9 C51 8 56 14 57 22', '#FFFFFF', 2.2, 0.9) + C(20, 54, 3.4, '#6B4528', 2))
T['i_shield'] = tile(IB, C(32, 32, 22, '#F2C230', 3.5) + C(32, 32, 16, '#C8403F', 3) + P('M32 17 V47 M17 32 H47', '#9E2F2E', 2.6) + C(32, 32, 6, '#C9D2DC', 3))
T['i_plate'] = tile(IB, F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#9AA7B8') + P('M32 18 V50', '#7D8FA3', 3) + F('M12 18 C16 12 24 12 26 18 C22 22 16 24 12 18 Z', '#C9D2DC', 2.6) + F('M52 18 C48 12 40 12 38 18 C42 22 48 24 52 18 Z', '#C9D2DC', 2.6))
rays = ''
for k in range(8):
    a = math.radians(k * 45 + 22.5)
    rays += inked(f'M{f1(40 + 9 * math.cos(a))} {f1(20 + 9 * math.sin(a))} L{f1(40 + 14 * math.cos(a))} {f1(20 + 14 * math.sin(a))}', '#F2C230', 2.6)
T['i_sunstaff'] = tile(IB, inked('M18 58 L38 24', '#A0703F', 4.5) + rays + C(40, 20, 7, '#F2C230', 3))
T['i_icestaff'] = tile(IB, inked('M18 58 L36 26', '#A0703F', 4.5) + '<circle cx="40" cy="18" r="13" style="fill: #8FD6FF; opacity: 0.35"/>' + F('M40 4 L48 18 L40 32 L32 18 Z', '#8FD6FF', 3) + P('M38 10 L35 17', '#FFFFFF', 2))
T['i_robe'] = tile(IB, F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#4F86C6') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#F2C230', 2.6) + F('M22 12 C28 20 36 20 42 12 C38 9 26 9 22 12 Z', '#F6F1E4', 2.6))
T['i_charm'] = tile(IB, P('M20 10 C24 26 40 26 44 10', '#C9D2DC', 3) + '<circle cx="32" cy="38" r="15" style="fill: #B79CFF; opacity: 0.3"/>' + F('M32 24 L44 38 L32 54 L20 38 Z', '#B79CFF', 3.2) + P('M30 32 L26 38', '#FFFFFF', 2.2))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    json.dump(T, open(OUT + 'icons.json', 'w'))
    cells = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:72px;height:72px;border-radius:13px;overflow:hidden;border:3px solid #1E1A1A;box-shadow:0 4px 0 #1E1A1A">{v.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div><span style="font:12px monospace">{k}</span></div>' for k, v in T.items())
    open(OUT + '_icons_preview.html', 'w').write(f'<body style="margin:0;padding:20px;background:#FFF8EC"><div style="display:flex;gap:14px;flex-wrap:wrap;width:900px">{cells}</div></body>')
    print('tiles', len(T))
