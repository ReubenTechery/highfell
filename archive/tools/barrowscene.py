# Barrow interior backdrop for the fight (flat, warm ink, stepped glows). Usage: barrowscene.py out.svg.html
import sys
INK = '#2A1A22'
out = []
def a(x): out.append(x)
def st(fill='none', col=INK, w=3, extra=''):
    return f'style="fill: {fill}; stroke: {col}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round{extra}"'
def fo(col, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'style="fill: {col}{o}"'
def glow(x, y, r, col, k=1.0):
    a(f'<circle cx="{x}" cy="{y}" r="{r}" {fo(col, round(0.10*k, 3))}/>')
    a(f'<circle cx="{x}" cy="{y}" r="{round(r*0.62)}" {fo(col, round(0.16*k, 3))}/>')
    a(f'<circle cx="{x}" cy="{y}" r="{round(r*0.32)}" {fo(col, round(0.22*k, 3))}/>')

a('<svg class="scene-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">')
a(f'<rect x="0" y="0" width="1600" height="900" {fo("#1B2628")}/>')
# stone courses
rows = [(0, 120), (120, 250), (250, 380), (380, 520), (520, 660)]
import random
random.seed(4)
for (y0, y1) in rows:
    x = -random.randint(0, 120)
    while x < 1600:
        w = random.randint(150, 260)
        shade = random.choice(['#1E2A2C', '#1B2628', '#203032'])
        a(f'<rect x="{x + 4}" y="{y0 + 4}" width="{w - 8}" height="{y1 - y0 - 8}" rx="10" {st(shade, "#141D1F", 3)}/>')
        x += w
# moss on the stones
for (x, y, rx, ry) in [(180, 240, 70, 18), (1420, 380, 80, 20), (330, 520, 60, 14), (1260, 130, 70, 16), (90, 400, 50, 12), (1530, 560, 60, 14)]:
    a(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" {fo("#3E5A3A")}/>')
    a(f'<ellipse cx="{x - rx*0.3:.0f}" cy="{y - ry*0.3:.0f}" rx="{rx*0.45:.0f}" ry="{ry*0.5:.0f}" {fo("#4E6E44")}/>')
# hanging roots
for (x, l) in [(120, 150), (260, 90), (1360, 130), (1500, 170), (1010, 70), (590, 80)]:
    a(f'<path d="M{x} 0 C{x - 14} {l*0.35:.0f} {x + 16} {l*0.6:.0f} {x - 4} {l}" {st("none", "#4A3828", 6)}/>')
    a(f'<path d="M{x - 4} {l} c-8 6 -6 14 -12 18" {st("none", "#4A3828", 4)}/>')
# the great arch
a(f'<path d="M520 900 V430 C520 170 1080 170 1080 430 V900 Z" {st("#2C3D3A", INK, 6)}/>')
a(f'<path d="M590 900 V440 C590 250 1010 250 1010 440 V900 Z" {st("#0F1616", INK, 5)}/>')
glow(800, 470, 330, '#9BD068', 0.9)
# arch stones (voussoirs)
import math
for i in range(13):
    ang = math.pi - i * math.pi / 12
    cx, cy, r0, r1 = 800, 440, 212, 278
    x0, y0 = cx + r0 * math.cos(ang), cy - r0 * math.sin(ang)
    x1, y1 = cx + r1 * math.cos(ang), cy - r1 * math.sin(ang)
    a(f'<path d="M{x0:.0f} {y0:.0f} L{x1:.0f} {y1:.0f}" {st("none", INK, 4)}/>')
a(f'<path d="M778 156 L822 156 L830 196 L770 196 Z" {st("#3A4E48", INK, 4)}/>')
a(f'<circle cx="800" cy="178" r="7" {fo("#9BD068")}/>')
# ledges with candles
for (lx, ly, flip) in [(170, 560, 1), (1430, 560, -1)]:
    a(f'<rect x="{lx - 120}" y="{ly}" width="240" height="26" rx="6" {st("#33443F", INK, 4)}/>')
    for k, (dx, h) in enumerate([(-70, 70), (-20, 100), (40, 56), (84, 80)]):
        cx = lx + dx * flip
        glow(cx, ly - h - 22, 70, '#F4B942', 0.8)
        a(f'<rect x="{cx - 11}" y="{ly - h}" width="22" height="{h}" rx="4" {st("#EDE3CC", INK, 3.5)}/>')
        a(f'<path d="M{cx - 11} {ly - h + 10} c6 6 10 -2 14 6" {st("none", "#CBBFA4", 3)}/>')
        a(f'<path d="M{cx} {ly - h - 34} C{cx + 12} {ly - h - 18} {cx + 8} {ly - h - 6} {cx} {ly - h - 6} C{cx - 8} {ly - h - 6} {cx - 12} {ly - h - 18} {cx} {ly - h - 34} Z" {st("#F4B942", INK, 3)}/>')
        a(f'<path d="M{cx} {ly - h - 22} c4 6 3 11 0 12 c-3 -1 -4 -6 0 -12 Z" {fo("#FFF3C4")}/>')
# skull pile on the left ledge (one wears a tiny crown)
for (sx, sy, s) in [(70, 548, 1.0), (104, 552, 0.9)]:
    a(f'<path d="M{sx - 16*s:.0f} {sy:.0f} C{sx - 16*s:.0f} {sy - 30*s:.0f} {sx + 16*s:.0f} {sy - 30*s:.0f} {sx + 16*s:.0f} {sy:.0f} Z" {st("#E9E2D0", INK, 3)}/>')
    a(f'<circle cx="{sx - 6*s:.0f}" cy="{sy - 12*s:.0f}" r="{4*s:.1f}" {fo(INK)}/><circle cx="{sx + 6*s:.0f}" cy="{sy - 12*s:.0f}" r="{4*s:.1f}" {fo(INK)}/>')
a(f'<path d="M58 524 L62 512 L68 520 L72 510 L76 520 L82 512 L84 524 Z" {st("#F4B942", INK, 2.5)}/>')
# floor and dais
a(f'<rect x="0" y="720" width="1600" height="180" {fo("#141C1D")}/>')
a(f'<path d="M0 720 H1600" {st("none", INK, 5)}/>')
for (x0, x1, y) in [(0, 380, 790), (420, 980, 800), (1040, 1600, 786), (0, 520, 860), (600, 1200, 866), (1260, 1600, 856)]:
    a(f'<path d="M{x0} {y} H{x1}" {st("none", "#1E2829", 4)}/>')
a(f'<path d="M560 742 L600 700 H1000 L1040 742 Z" {st("#2A3936", INK, 5)}/>')
a(f'<path d="M600 700 H1000" {st("none", "#9BD068", 3, "; opacity: 0.5")}/>')
a(f'<ellipse cx="800" cy="800" rx="760" ry="70" {fo("#9BD068", 0.05)}/>')
a(f'<ellipse cx="400" cy="840" rx="420" ry="40" {fo("#9BD068", 0.04)}/>')
a(f'<ellipse cx="1240" cy="830" rx="420" ry="40" {fo("#9BD068", 0.04)}/>')
a('</svg>')
open(sys.argv[1], 'w').write('\n'.join(out))
print('ok', len(out))
