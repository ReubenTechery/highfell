# Action bar icon tiles for the Barrow King fight (64x64, flat colour, ink outlines, stepped glow).
# Run directly to write a preview fragment: fighttiles.py out_fragment.html
import math, sys

INK = '#2A1A22'


def P(d, col, w, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" style="fill: none; stroke: {col}; stroke-width: {w}; stroke-linecap: round; stroke-linejoin: round{o}"/>'


def F(d, fill, w=3.5):
    return f'<path d="{d}" style="fill: {fill}; stroke: {INK}; stroke-width: {w}; stroke-linejoin: round"/>'


def inked(d, col, w):
    return P(d, INK, w + 4.5) + P(d, col, w)


def glow(cx, cy, r, col):
    return ''.join(f'<circle cx="{cx}" cy="{cy}" r="{round(r * k, 1)}" style="fill: {col}; opacity: {op}"/>'
                   for k, op in [(1, 0.10), (0.66, 0.13), (0.36, 0.18)])


def tile(bg, rim, glowcol, inner, gx=32, gy=32, gr=30):
    return ('<svg viewBox="0 0 64 64" aria-hidden="true">'
            f'<rect width="64" height="64" style="fill: {bg}"/>'
            + glow(gx, gy, gr, glowcol) + inner +
            f'<rect x="2.5" y="2.5" width="59" height="59" rx="9" style="fill: none; stroke: {rim}; stroke-width: 2; opacity: 0.4"/>'
            '</svg>')


def f1(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


# ---- chop: one hand axe, diagonal, with speed lines
chop = tile('#4A2219', '#FF8A4C', '#FF8A4C',
            P('M8 26 L20 19', '#FFD9B8', 3, 0.75) + P('M7 37 L16 32', '#FFD9B8', 3, 0.5) +
            inked('M18 55 L43 17', '#A0703F', 5) +
            P('M18.6 47.6 L23.6 51 M21.2 43.8 L26.2 47.2', INK, 2) +
            '<circle cx="18" cy="55" r="3.4" style="fill: #6B4528; stroke: #2A1A22; stroke-width: 2"/>' +
            F('M33 13 C44 1 63 10 59 31 C48 28 39 23 33 13 Z', '#D7DEE6') +
            P('M41 7 C50 5 57 11 57.5 21', '#FFFFFF', 2.5, 0.9),
            gx=40, gy=24, gr=28)

# ---- overhead: two-bladed great axe held high, motion arcs falling either side
overhead = tile('#5A1F12', '#FFB27A', '#FF8A4C',
                P('M7 33 C8 42 12 49 19 54', '#FF8A4C', 4.5, 0.95) + P('M57 33 C56 42 52 49 45 54', '#FF8A4C', 4.5, 0.95) +
                P('M13 36 C14 41 16 45 20 48', '#FFD9B8', 2.5, 0.6) + P('M51 36 C50 41 48 45 44 48', '#FFD9B8', 2.5, 0.6) +
                inked('M32 60 L32 14', '#A0703F', 5) +
                P('M29.5 50 L34.5 52 M29.5 45 L34.5 47', INK, 2) +
                F('M29 9 C17 4 7 12 8 27 C15 23 23 22 29 23 Z', '#D7DEE6') +
                F('M35 9 C47 4 57 12 56 27 C49 23 41 22 35 23 Z', '#D7DEE6') +
                '<rect x="27.5" y="6" width="9" height="20" rx="2.5" style="fill: #8A8F99; stroke: #2A1A22; stroke-width: 3"/>' +
                P('M11 14 C13 10 18 8 24 8.5', '#FFFFFF', 2.2, 0.85) + P('M53 14 C51 10 46 8 40 8.5', '#FFFFFF', 2.2, 0.85),
                gx=32, gy=18, gr=30)

# ---- shout: war horn with sound rings (rings are green because the shout puts up green shields)
bx, by = 42, 33              # middle of the bell
ux, uy = 0.658, -0.752       # facing up and right
th0 = math.atan2(uy, ux)
waves = ''
for r, span in [(9.5, 34), (15, 30), (20.5, 26)]:
    a0, a1 = th0 - math.radians(span), th0 + math.radians(span)
    x0, y0 = bx + r * math.cos(a0), by + r * math.sin(a0)
    x1, y1 = bx + r * math.cos(a1), by + r * math.sin(a1)
    waves += inked(f'M{f1(x0)} {f1(y0)} A{r} {r} 0 0 1 {f1(x1)} {f1(y1)}', '#9BD068', 3.5)
shout = tile('#23381C', '#9BD068', '#9BD068',
             waves +
             F('M5 44 C18 44 28 38 34 26 L50 40 C38 52 20 56 5 54 Z', '#EDE3CC') +
             P('M14.5 43.8 L15.5 55 M24.5 40.6 L26.5 53.8', '#F4B942', 3.4) +
             f'<ellipse cx="{bx}" cy="{by}" rx="10.4" ry="4" transform="rotate(41.2 {bx} {by})" style="fill: #2A1A22; stroke: #F4B942; stroke-width: 2.6"/>' +
             '<circle cx="5" cy="49" r="3.4" style="fill: #F4B942; stroke: #2A1A22; stroke-width: 2.2"/>',
             gx=44, gy=28, gr=30)

# ---- taunt: gold shield with a bang, attention lines around it
taunt = tile('#4A3A10', '#F4B942', '#F4B942',
             P('M7 9 L12.5 14 M57 9 L51.5 14 M3.5 31 H9 M60.5 31 H55', '#FFE08A', 3, 0.9) +
             F('M32 8 L52 15 V31 C52 44 43 52 32 57 C21 52 12 44 12 31 V15 Z', '#F4B942') +
             P('M32 13.5 L47 18.8 V31 C47 41 40 47.6 32 51.6', '#FFE08A', 2.5, 0.85) +
             P('M32 19 V35', INK, 6.5) +
             '<circle cx="32" cy="44" r="3.8" style="fill: #2A1A22"/>',
             gx=32, gy=31, gr=30)

# ---- shatter: snowflake with a crack through it
cx, cy = 32, 32
arms = ''
tips = ''
for k in range(3):
    a = math.radians(90 + 60 * k)
    dx, dy = 24 * math.cos(a), 24 * math.sin(a)
    arms += f'M{f1(cx - dx)} {f1(cy - dy)} L{f1(cx + dx)} {f1(cy + dy)} '
for k in range(6):
    a = math.radians(90 + 60 * k)
    ux_, uy_ = math.cos(a), math.sin(a)
    px, py = cx + 15 * ux_, cy + 15 * uy_
    for s in (1, -1):
        b = a + s * math.radians(42)
        tips += f'M{f1(px)} {f1(py)} L{f1(px + 7 * math.cos(b))} {f1(py + 7 * math.sin(b))} '
shatter = tile('#16304A', '#8FD6FF', '#8FD6FF',
               P(arms + tips, INK, 8.5) + P(arms + tips, '#8FD6FF', 4) +
               '<circle cx="32" cy="32" r="5" style="fill: #DDF3FF; stroke: #2A1A22; stroke-width: 2.5"/>' +
               P('M41 3 L35 17 L42 25 L31 35 L37 45 L29 61', INK, 3.2) +
               P('M44 6 L39 16', '#F4FCFF', 2, 0.9),
               gx=32, gy=32, gr=30)

# ---- ult: violet burst with a crossed swing
pts = []
for k in range(16):
    a = math.radians(-90 + k * 22.5)
    r = 28 if k % 2 == 0 else 13
    pts.append(f'{f1(32 + r * math.cos(a))} {f1(32 + r * math.sin(a))}')
star = 'M' + ' L'.join(pts) + ' Z'
ult = tile('#2E1F57', '#B79CFF', '#B79CFF',
           F(star, '#B79CFF', 3.2) +
           inked('M21 21 L43 43 M43 21 L21 43', '#F6E9D2', 4.5) +
           '<circle cx="32" cy="32" r="6" style="fill: #F4B942; stroke: #2A1A22; stroke-width: 3"/>',
           gx=32, gy=32, gr=31)

TILES = {'chop': chop, 'overhead': overhead, 'shout': shout, 'taunt': taunt, 'shatter': shatter, 'ult': ult}

if __name__ == '__main__':
    out = sys.argv[1]
    rows = []
    for size in (96, 64, 52):
        cells = ''.join(f'<div style="width:{size}px;height:{size}px;border-radius:{size * 0.16:.0f}px;overflow:hidden;border:2px solid #2A1A22;box-shadow:0 3px 0 #0E0B12">{s.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div>' for s in TILES.values())
        rows.append(f'<div style="display:flex;gap:10px;margin-bottom:16px">{cells}</div>')
    open(out, 'w').write(''.join(rows))
    print('ok', sum(len(s) for s in TILES.values()))


# ---- TV cartoon versions (style lock): flat bright backgrounds, one black line, no glow rings, no inner rim
import re as _re
TV_INK = '#1E1A1A'
TV_BG = {'chop': '#C8403F', 'overhead': '#E07A2E', 'shout': '#4E9A4A', 'taunt': '#4F6FA8', 'shatter': '#1F4F7A', 'ult': '#6A4BA3'}


def _tv(name):
    s = TILES[name]
    s = _re.sub(r'<circle cx="[^"]+" cy="[^"]+" r="[^"]+" style="fill: #[0-9A-Fa-f]{6}; opacity: [0-9.]+"/>', '', s)
    s = _re.sub(r'<rect x="2\.5" y="2\.5"[^>]*/>', '', s)
    s, n = _re.subn(r'<rect width="64" height="64" style="fill: #[0-9A-Fa-f]{6}"/>', f'<rect width="64" height="64" style="fill: {TV_BG[name]}"/>', s, count=1)
    assert n == 1, name
    if name == 'overhead':
        # orange swing arcs vanish on an orange tile: make them cream with the black line
        for d in ('M7 33 C8 42 12 49 19 54', 'M57 33 C56 42 52 49 45 54'):
            old = P(d, '#FF8A4C', 4.5, 0.95)
            assert old in s
            s = s.replace(old, P(d, INK, 9) + P(d, '#FFF3C4', 4.5))
        for d in ('M13 36 C14 41 16 45 20 48', 'M51 36 C50 41 48 45 44 48'):
            old = P(d, '#FFD9B8', 2.5, 0.6)
            assert old in s
            s = s.replace(old, '')
    if name == 'chop':
        s = s.replace("stroke: #FFD9B8; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; opacity: 0.75", "stroke: #FFF3C4; stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; opacity: 0.95")
        s = s.replace("stroke: #FFD9B8; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; opacity: 0.5", "stroke: #FFF3C4; stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; opacity: 0.8")
    return s.replace(INK, TV_INK)


TV_TILES = {k: _tv(k) for k in TILES}
