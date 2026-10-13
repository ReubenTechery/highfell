# Five small story vignettes for the World board (flat, ink outlines, stepped glows).
# Usage: python3 storygen.py out_dir   -> writes s0.svg.html .. s4.svg.html
import sys, os
INK = '#2A1A22'
EMBER = '#FF8A4C'; FROST = '#8FD6FF'; LANTERN = '#F4B942'; MOON = '#B79CFF'; MOSS = '#9BD068'
PARCH = '#F1E3C6'; SNOW = '#FBF6EA'

def st(fill='none', col=INK, w=2.5, extra=''):
    return f'style="fill: {fill}; stroke: {col}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round{extra}"'

def fo(col, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'style="fill: {col}{o}"'

def glow(x, y, r, col):
    return [f'<circle cx="{x}" cy="{y}" r="{r}" {fo(col, 0.16)}/>', f'<circle cx="{x}" cy="{y}" r="{round(r*0.6)}" {fo(col, 0.3)}/>']

def wrap(label, sky, parts):
    head = f'<svg viewBox="0 0 240 150" role="img" aria-label="{label}" style="display: block; width: 100%; height: auto;">'
    return '\n'.join([head, f'<rect x="0" y="0" width="240" height="150" {fo(sky)}/>'] + parts + ['</svg>'])

out = os.path.abspath(sys.argv[1])

# 0 · Season 0: a pint at the Last Lantern, with snow landing on the foam
p = []
p += glow(64, 52, 46, LANTERN)
p.append(f'<path d="M30 0 V22 H64" {st("none", INK, 3)}/>')
p.append(f'<path d="M58 22 v8 M52 30 h12 l-2 22 h-8 Z" {st(LANTERN, INK, 2.5)}/>')
p.append(f'<path d="M54 52 h8" {st("none", INK, 2.5)}/>')
p.append(f'<rect x="0" y="112" width="240" height="38" {fo("#6B4A32")}/>')
p.append(f'<path d="M0 112 H240" {st("none", INK, 3)}/>')
p.append(f'<path d="M14 128 h40 M80 136 h56 M170 126 h50" {st("none", "#57392A", 2.5)}/>')
p.append(f'<path d="M150 66 h22 a14 14 0 0 1 0 28 h-22" {st("none", INK, 9)}/>')
p.append(f'<path d="M150 66 h22 a14 14 0 0 1 0 28 h-22" {st("none", "#E8D9B8", 4)}/>')
p.append(f'<path d="M104 58 H152 L148 114 H108 Z" {st(LANTERN, INK, 3)}/>')
p.append(f'<path d="M132 64 L130 108" {st("none", "#FFD27A", 4)}/>')
p.append(f'<path d="M100 60 C100 44 112 40 118 46 C122 36 138 36 142 46 C150 40 160 48 156 60 Z" {st(SNOW, INK, 3)}/>')
p.append(f'<path d="M112 94 l4 -4 M120 100 l4 -4" {st("none", "#C9963A", 2)}/>')
for (x, y, r) in [(124, 26, 6), (190, 30, 4), (210, 62, 3.5), (88, 22, 3)]:
    p.append(f'<path d="M{x - r} {y} H{x + r} M{x} {y - r} V{y + r} M{x - r*0.7:.1f} {y - r*0.7:.1f} L{x + r*0.7:.1f} {y + r*0.7:.1f} M{x - r*0.7:.1f} {y + r*0.7:.1f} L{x + r*0.7:.1f} {y - r*0.7:.1f}" {st("none", SNOW, 2)}/>')
s0 = wrap('A frothy pint at the Last Lantern under a hanging lantern, with snowflakes falling indoors and one landing on the foam.', '#2B2140', p)

# 1 · Raid I: the Singing Barrow
p = []
for (x, y) in [(24, 22), (70, 14), (206, 18), (226, 44), (160, 12)]:
    p.append(f'<circle cx="{x}" cy="{y}" r="1.8" {fo(SNOW)}/>')
p += glow(120, 104, 44, MOSS)
p.append(f'<path d="M30 132 C40 64 200 64 210 132 Z" {st("#4E7A45", INK, 3)}/>')
p.append(f'<path d="M120 78 C150 80 186 96 200 124" {st("none", "#3E6438", 4)}/>')
p.append(f'<path d="M104 132 V108 C104 92 136 92 136 108 V132" {st("#16201A", INK, 3)}/>')
p.append(f'<path d="M98 104 C98 84 142 84 142 104" {st("none", "#8E8A7E", 7)}/>')
p.append(f'<path d="M98 104 C98 84 142 84 142 104" {st("none", INK, 1.5)}/>')
p.append(f'<circle cx="114" cy="116" r="3" {fo(MOSS)}/><circle cx="126" cy="116" r="3" {fo(MOSS)}/>')
for (x, h) in [(22, 34), (222, 30)]:
    p.append(f'<path d="M{x - 8} 134 V{134 - h} C{x - 8} {128 - h} {x + 8} {128 - h} {x + 8} {134 - h} V134 Z" {st("#A39A8C", INK, 2.5)}/>')
p.append(f'<rect x="0" y="130" width="240" height="20" {fo("#2C3A28")}/>')
p.append(f'<path d="M0 132 H240" {st("none", INK, 3)}/>')
for (x, y, s) in [(150, 70, 1.1), (170, 46, 0.95), (140, 36, 0.8)]:
    p.append(f'<ellipse cx="{x}" cy="{y}" rx="{5.5*s:.1f}" ry="{4.2*s:.1f}" {fo(SNOW)}/>')
    p.append(f'<path d="M{x + 5*s:.1f} {y} V{y - 20*s:.1f} l{8*s:.1f} {5*s:.1f}" {st("none", SNOW, 2.2)}/>')
s1 = wrap('A grassy burial mound at night with a stone doorway. Two green eyes glow inside and music notes float out of the top.', '#1E2A2E', p)

# 2 · Raid II: the Broken Pass and the Ferryman
p = []
p.append(f'<path d="M0 0 H52 L60 58 L44 62 L0 70 Z" {st("#1B2230", INK, 3)}/>')
p.append(f'<path d="M240 0 H188 L182 54 L198 60 L240 64 Z" {st("#1B2230", INK, 3)}/>')
p.append(f'<path d="M58 40 L86 50 M182 38 L160 48" {st("none", "#7A5A3A", 6)}/>')
p.append(f'<path d="M58 40 L86 50 M182 38 L160 48" {st("none", INK, 1.5)}/>')
p.append(f'<path d="M80 48 l-2 12 M166 46 l2 14" {st("none", INK, 2)}/>')
p.append(f'<rect x="0" y="104" width="240" height="46" {fo("#3E5A73")}/>')
p.append(f'<path d="M0 104 H240" {st("none", INK, 3)}/>')
p.append(f'<path d="M20 124 q12 -5 24 0 M160 132 q12 -5 24 0 M196 116 q12 -5 24 0" {st("none", "#6E8FAA", 2.5)}/>')
p += glow(96, 70, 34, FROST)
p.append(f'<path d="M70 106 C76 122 150 122 162 106 Z" {st("#5A4332", INK, 3)}/>')
p.append(f'<path d="M112 106 L104 66 C106 56 122 56 126 66 L132 106 Z" {st("#3A3046", INK, 3)}/>')
p.append(f'<path d="M108 70 C112 64 120 64 124 70" {st("none", INK, 2)}/>')
p.append(f'<circle cx="112" cy="74" r="2" {fo(FROST)}/><circle cx="120" cy="74" r="2" {fo(FROST)}/>')
p.append(f'<path d="M140 116 L158 36" {st("none", INK, 3)}/>')
p.append(f'<path d="M96 58 V62 M90 62 h12 l-2 14 h-8 Z" {st(FROST, INK, 2)}/>')
p.append(f'<path d="M96 52 L108 60" {st("none", INK, 2)}/>')
p.append(f'<path d="M206 104 V74" {st("none", INK, 3)}/>')
p.append(f'<rect x="186" y="66" width="40" height="18" rx="2" {st("#E8D9B8", INK, 2.5)}/>')
p.append(f'<text x="206" y="80" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 12px; fill: {INK}">TOLL</text>')
s2 = wrap('A hooded ferryman poles a small boat under a broken bridge, holding up a pale blue lantern. A sign on the bank says Toll.', '#26303F', p)

# 3 · Raid III: the Frost Throne, with a "back soon" card on the seat
p = []
for (x, y) in [(20, 30), (46, 92), (210, 24), (196, 96), (226, 66), (32, 64), (172, 18), (64, 16)]:
    p.append(f'<circle cx="{x}" cy="{y}" r="2" {fo(SNOW)}/>')
p += glow(120, 70, 56, FROST)
p.append(f'<rect x="0" y="126" width="240" height="24" {fo("#2C3A55")}/>')
p.append(f'<path d="M0 126 H240" {st("none", INK, 3)}/>')
p.append(f'<path d="M84 126 V48 L94 62 L102 26 L114 50 L122 16 L132 48 L142 28 L148 62 L158 46 V126 Z" {st(FROST, INK, 3)}/>')
p.append(f'<path d="M96 126 V96 H146 V126" {st("#CFEFFC", INK, 2.5)}/>')
p.append(f'<path d="M86 96 H156" {st("none", INK, 3)}/>')
p.append(f'<path d="M110 40 L122 16 L128 34" {st("none", "#E8F8FF", 2.5)}/>')
p.append(f'<path d="M106 96 L108 82 L114 88 L120 78 L126 88 L132 82 L134 96 Z" {st(LANTERN, INK, 2.5)}/>')
p.append(f'<path d="M98 40 L92 56 M142 40 L148 56" {st("none", INK, 2)}/>')
p.append(f'<rect x="84" y="54" width="72" height="22" rx="3" {st("#E8D9B8", INK, 2.5)}/>')
p.append(f'<text x="120" y="70" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 13px; fill: {INK}">back soon</text>')
s3 = wrap('A jagged throne of blue ice with a gold crown resting on the seat. A little sign hangs from it that says back soon. Snow falls.', '#182338', p)

# 4 · After the Throne: a sealed letter with a pint ring on it
p = []
p += glow(140, 86, 40, MOON)
p.append(f'<path d="M58 30 H182 V122 H58 Z" {st(PARCH, INK, 3)}/>')
p.append(f'<path d="M58 30 L120 78 L182 30" {st("none", INK, 2.5)}/>')
p.append(f'<circle cx="94" cy="98" r="15" {st("none", "#C9A877", 3)}/>')
p.append(f'<path d="M80 106 a15 15 0 0 0 18 6" {st("none", "#C9A877", 2)}/>')
p.append(f'<circle cx="140" cy="86" r="14" {st(MOON, INK, 2.5)}/>')
p.append(f'<path d="M134 80 C134 74 146 74 146 80 C146 85 140 86 140 90 M140 95 V96" {st("none", INK, 2.5)}/>')
for (x, y) in [(28, 26), (210, 40), (200, 110), (36, 118), (222, 82)]:
    p.append(f'<circle cx="{x}" cy="{y}" r="1.8" {fo(SNOW)}/>')
s4 = wrap('A sealed letter with a purple wax seal stamped with a question mark. Someone has left a pint ring on it.', '#1C1626', p)

for i, s in enumerate([s0, s1, s2, s3, s4]):
    open(os.path.join(out, f's{i}.svg.html'), 'w').write(s)
open(os.path.join(out, 'stories.html'), 'w').write('<div style="display:grid;grid-template-columns:repeat(5,240px);gap:16px">' + ''.join(f'<div style="border-radius:14px;overflow:hidden;border:2px solid #3B3146">{s}</div>' for s in [s0, s1, s2, s3, s4]) + '</div>')
print('ok')
