# The Last Lantern stage for the Season 0 board. Scene colours are {{s.*}} holes driven by the board's "light" tweak.
import sys
INK = '#2A1A22'
out = []
def a(x):
    out.append(x)
def st(fill='none', col=INK, w=2.5, extra=''):
    return f'style="fill: {fill}; stroke: {col}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round{extra}"'
def fo(col, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'style="fill: {col}{o}"'

a('<svg viewBox="0 0 1152 560" aria-hidden="true" preserveAspectRatio="xMidYMid slice" style="position: absolute; inset: 0; width: 100%; height: 100%; display: block;">')
# wall and planks
a(f'<rect x="0" y="0" width="1152" height="430" {fo("{{s.wall}}")}/>')
for x in range(36, 1152, 72):
    a(f'<rect x="{x}" y="0" width="5" height="330" {fo("{{s.plank}}")}/>')
# round window with summer snow
a(f'<circle cx="576" cy="168" r="104" {fo("{{s.plank}}")}/>')
a(f'<circle cx="576" cy="168" r="92" {st("{{s.window}}", INK, 4)}/>')
for (x, y, r) in [(530, 120, 3), (600, 104, 2.5), (628, 150, 3), (552, 176, 2.5), (612, 206, 3), (520, 214, 2), (650, 196, 2), (574, 140, 2)]:
    a(f'<circle cx="{x}" cy="{y}" r="{r}" {fo("{{s.sky}}")}/>')
a(f'<path d="M638 112 a26 26 0 1 1 -22 -22 a20 20 0 1 0 22 22 Z" {fo("{{s.sky}}", 0.9)}/>')
a(f'<path d="M576 76 V260 M484 168 H668" {st("none", "#6B4A32", 9)}/>')
a(f'<path d="M576 76 V260 M484 168 H668" {st("none", INK, 1.5)}/>')
a(f'<circle cx="576" cy="168" r="92" {st("none", INK, 4)}/>')
# bunting
a(f'<path d="M0 34 Q288 92 576 40 Q864 -6 1152 46" {st("none", INK, 2)}/>')
cols = ['#F4B942', '#FF8A4C', '#9BD068', '#8FD6FF', '#B79CFF']
import math
def q(p0, p1, p2, t):
    return ((1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0], (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1])
i = 0
for seg in [((0, 34), (288, 92), (576, 40)), ((576, 40), (864, -6), (1152, 46))]:
    for k in range(1, 9):
        t0 = (k - 0.35) / 9; t1 = (k + 0.35) / 9
        x0, y0 = q(*seg, t0); x1, y1 = q(*seg, t1)
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2 + 26
        a(f'<path d="M{x0:.0f} {y0:.0f} L{x1:.0f} {y1:.0f} L{mx:.0f} {my:.0f} Z" {st(cols[i % 5], INK, 2)}/>')
        i += 1
# shelf with mugs (left) and the chalkboard (right)
a(f'<rect x="96" y="196" width="220" height="12" {st("#6B4A32", INK, 2.5)}/>')
for x in [116, 162, 208, 262]:
    a(f'<path d="M{x} 196 V170 H{x + 24} V196" {st("#D9C9AE", INK, 2.5)}/>')
    a(f'<path d="M{x + 24} 176 h6 a6 6 0 0 1 0 12 h-6" {st("none", INK, 2.5)}/>')
a(f'<rect x="884" y="132" width="176" height="96" rx="6" {st("#6B4A32", INK, 3)}/>')
a(f'<rect x="896" y="144" width="152" height="72" rx="3" {fo("#23302A")}/>')
a(f'<text x="972" y="174" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 20px; fill: #EDE3CC">No raiding</text>')
a(f'<text x="972" y="200" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 20px; fill: #EDE3CC">the bar</text>')
# lanterns
for x in [140, 360, 792, 1040]:
    a(f'<circle cx="{x}" cy="96" r="78" {fo("{{s.glow}}", 0.12)}/>')
    a(f'<circle cx="{x}" cy="96" r="46" {fo("{{s.glow}}", 0.22)}/>')
    a(f'<path d="M{x} 0 V72" {st("none", INK, 2.5)}/>')
    a(f'<path d="M{x - 9} 72 h18 M{x - 12} 78 h24 l-4 34 h-16 Z" {st("{{s.glow}}", INK, 2.5)}/>')
    a(f'<path d="M{x - 8} 112 h16 l-3 7 h-10 Z" {st(INK, INK, 1.5)}/>')
    a(f'<path d="M{x} 84 V104" {st("none", "#FFF3C4", 3)}/>')
# wainscot
a(f'<rect x="0" y="330" width="1152" height="100" {fo("{{s.plank}}")}/>')
a(f'<path d="M0 330 H1152" {st("none", INK, 3)}/>')
for x in range(0, 1152, 96):
    a(f'<rect x="{x + 14}" y="346" width="68" height="68" rx="4" {st("none", "{{s.wall}}", 3)}/>')
# floor
a(f'<rect x="0" y="430" width="1152" height="130" {fo("{{s.floor}}")}/>')
a(f'<path d="M0 430 H1152" {st("none", INK, 3)}/>')
for y in [468, 512]:
    a(f'<path d="M0 {y} H1152" {st("none", "{{s.board}}", 3)}/>')
for (x, y0, y1) in [(150, 430, 468), (470, 430, 468), (830, 430, 468), (300, 468, 512), (690, 468, 512), (1010, 468, 512), (90, 512, 560), (520, 512, 560), (940, 512, 560)]:
    a(f'<path d="M{x} {y0} V{y1}" {st("none", "{{s.board}}", 3)}/>')
a(f'<ellipse cx="576" cy="500" rx="520" ry="58" {fo("{{s.glow}}", 0.08)}/>')
a('</svg>')
open(sys.argv[1], 'w').write('\n'.join(out))
print('ok', len(out))
