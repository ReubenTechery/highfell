# Generates the Highfell Vale map as inline SVG markup (flat, cut-paper, ink outlines).
# Usage: python3 mapgen.py out_fragment.svg.html
import random, sys
random.seed(11)

INK = '#2A1A22'
P = '#F1E3C6'      # parchment
P2 = '#E7D5B0'     # parchment shade (fields, lowland patches)
EDGE = '#CDB58C'   # inner frame line
MT = '#D2BC94'; MTS = '#B9A077'; SNOW = '#FBF6EA'
GR = '#B4CF86'; GRS = '#97B86A'
TREE = '#7FA35A'; TREES = '#63874A'
WATER = '#A9D9E6'; WATERL = '#7DB8CB'
ROAD = '#8A6F55'
EMBER = '#FF8A4C'; FROST = '#8FD6FF'; LANTERN = '#F4B942'; MOON = '#B79CFF'; MOSS = '#9BD068'
STONE = '#A39A8C'; STONES = '#857C70'

out = []
def a(s):
    out.append(s)

def f(v):
    return f'{v:.0f}' if abs(v - round(v)) < 0.05 else f'{v:.1f}'

def st(fill='none', col=INK, w=2.5, extra=''):
    return f'style="fill: {fill}; stroke: {col}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round{extra}"'

def fillonly(col, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'style="fill: {col}{o}"'

def glow(x, y, r, col):
    a(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" {fillonly(col, 0.16)}/>')
    a(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r*0.6)}" {fillonly(col, 0.28)}/>')

def label(x, y, text, size=22, anchor='middle', col=INK, ls=0.03, font="'IM Fell English SC', Georgia, serif"):
    a(f'<text x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" style="font-family: {font}; font-size: {size}px; letter-spacing: {ls}em; fill: {col}; stroke: {P}; stroke-width: 6; paint-order: stroke; stroke-linejoin: round">{text}</text>')

def note(x, y, text, size=15, anchor='middle', rot=0):
    tr = f' transform="rotate({rot} {f(x)} {f(y)})"' if rot else ''
    a(f'<text x="{f(x)}" y="{f(y)}" text-anchor="{anchor}"{tr} style="font-family: \'Spectral\', Georgia, serif; font-style: italic; font-size: {size}px; fill: #6B5442; stroke: {P}; stroke-width: 5; paint-order: stroke; stroke-linejoin: round">{text}</text>')

def mountain(cx, by, hw, h, snow=True, lean=None):
    lean = random.uniform(-0.12, 0.12) if lean is None else lean
    px = cx + hw * lean; py = by - h
    lx, rx = cx - hw, cx + hw
    a(f'<path d="M{f(lx)} {f(by)} L{f(px)} {f(py)} L{f(rx)} {f(by)} Z" {fillonly(MT)}/>')
    a(f'<path d="M{f(px)} {f(py)} L{f(rx)} {f(by)} L{f(px + hw*0.28)} {f(by)} Z" {fillonly(MTS)}/>')
    if snow:
        k = 0.36
        L1 = (px + (lx - px) * k, py + (by - py) * k)
        R1 = (px + (rx - px) * k, py + (by - py) * k)
        m1 = (px + (lx - px) * k * 0.5, py + (by - py) * k * 1.22)
        m2 = (px + (rx - px) * 0.04, py + (by - py) * k * 0.8)
        m3 = (px + (rx - px) * k * 0.55, py + (by - py) * k * 1.18)
        a(f'<path d="M{f(px)} {f(py)} L{f(R1[0])} {f(R1[1])} L{f(m3[0])} {f(m3[1])} L{f(m2[0])} {f(m2[1])} L{f(m1[0])} {f(m1[1])} L{f(L1[0])} {f(L1[1])} Z" {st(SNOW, INK, 1.5)}/>')
    a(f'<path d="M{f(lx)} {f(by)} L{f(px)} {f(py)} L{f(rx)} {f(by)}" {st("none", INK, 3)}/>')

def pine(x, y, s=1.0, col=TREE, shade=TREES):
    w = 13 * s; h = 40 * s
    a(f'<path d="M{f(x)} {f(y)} V{f(y - 9*s)}" {st("none", INK, 3)}/>')
    a(f'<path d="M{f(x - w)} {f(y - 8*s)} L{f(x)} {f(y - h)} L{f(x + w)} {f(y - 8*s)} Z" {fillonly(col)}/>')
    a(f'<path d="M{f(x)} {f(y - h)} L{f(x + w)} {f(y - 8*s)} L{f(x + w*0.25)} {f(y - 8*s)} Z" {fillonly(shade)}/>')
    a(f'<path d="M{f(x - w)} {f(y - 8*s)} L{f(x)} {f(y - h)} L{f(x + w)} {f(y - 8*s)} Z" {st("none", INK, 2.5)}/>')

def roundtree(x, y, s=1.0):
    r = 12 * s
    a(f'<path d="M{f(x)} {f(y)} V{f(y - 12*s)}" {st("none", INK, 3)}/>')
    a(f'<circle cx="{f(x)}" cy="{f(y - 12*s - r*0.8)}" r="{f(r)}" {st(GR, INK, 2.5)}/>')
    a(f'<path d="M{f(x + r*0.15)} {f(y - 12*s - r*0.8 + r*0.98)} A{f(r)} {f(r)} 0 0 0 {f(x + r*0.98)} {f(y - 12*s - r*0.8 + r*0.15)}" {st("none", GRS, 3)}/>')

def hill(cx, base, rx, ry, col=GR, w=3):
    a(f'<path d="M{f(cx - rx)} {f(base)} A{f(rx)} {f(ry)} 0 0 1 {f(cx + rx)} {f(base)} Z" {fillonly(col)}/>')
    a(f'<path d="M{f(cx - rx)} {f(base)} A{f(rx)} {f(ry)} 0 0 1 {f(cx + rx)} {f(base)}" {st("none", INK, w)}/>')

def badge_raid(x, y, num):
    a(f'<circle cx="{f(x)}" cy="{f(y)}" r="15" {st(EMBER, INK, 2.5)}/>')
    a(f'<text x="{f(x)}" y="{f(y + 6)}" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 16px; fill: {INK}">{num}</text>')

def badge_dungeon(x, y):
    a(f'<path d="M{f(x)} {f(y - 11)} L{f(x + 11)} {f(y)} L{f(x)} {f(y + 11)} L{f(x - 11)} {f(y)} Z" {st(FROST, INK, 2.5)}/>')

W, H = 1152, 720
a(f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Map of the Highfell Vale. The Rimewall mountains run along the north with the Frost Throne at the top. The Broken Pass cuts through them on the west side. Emberdeep sits in the western mountains beside the Ember Mines. Highfell and the Last Lantern sit in the middle of the valley, with the Singing Barrow in the hills to the south-west. The river Wend runs from the pass, past the Ferryman\'s Crossing and Highfell, to the Drowned Chapel marsh in the south-east. Wolfwood and Wolfden are in the middle, Moonmere lake is in the north-east and Bramblewick\'s hills are in the east." style="display: block; width: 100%; height: auto;">')
a(f'<defs><clipPath id="vale-paper"><rect x="6" y="6" width="{W-12}" height="{H-12}" rx="22"/></clipPath></defs>')
a(f'<rect x="6" y="6" width="{W-12}" height="{H-12}" rx="22" {fillonly(P)}/>')
a('<g clip-path="url(#vale-paper)">')

# lowland patches and fields around Highfell
a(f'<path d="M330 610 C360 560 470 520 560 520 C660 520 720 560 730 610 C740 660 640 700 520 700 C420 700 310 670 330 610 Z" {fillonly(P2)}/>')
for i, (x0, y0) in enumerate([(380, 600), (430, 640), (600, 640), (650, 600)]):
    a(f'<path d="M{x0} {y0} l60 -8 M{x0 + 4} {y0 + 10} l60 -8 M{x0 + 8} {y0 + 20} l60 -8" {st("none", "#CBB48E", 2)}/>')

# west hills behind the barrow
for (cx, base, rx, ry) in [(150, 586, 120, 52), (360, 590, 96, 40), (60, 600, 80, 34)]:
    hill(cx, base, rx, ry)

# --- RIVER WEND: from below the pass, past the crossing and Highfell, into the marsh
river = 'M452 212 C470 250 430 290 452 330 C470 362 470 392 500 420 C540 452 610 448 670 466 C730 484 760 530 820 566 C870 596 930 600 985 612'
a(f'<path d="{river}" {st("none", INK, 19)}/>')
a(f'<path d="{river}" {st("none", WATER, 13)}/>')
a(f'<path d="M560 444 q14 -5 28 0 M700 486 q14 -5 28 0 M850 586 q14 -5 28 0" {st("none", WATERL, 2.5)}/>')

# --- MARSH and the DROWNED CHAPEL (south-east)
a(f'<path d="M960 610 C960 572 1020 552 1070 562 C1130 576 1160 610 1150 640 C1140 668 1080 676 1030 670 C985 664 960 640 960 610 Z" {st(WATER, INK, 3)}/>')
for (x, y) in [(985, 600), (1110, 600), (970, 652), (1128, 664)]:
    a(f'<path d="M{x} {y} v-16 M{x + 6} {y} v-22 M{x + 12} {y} v-14" {st("none", "#5E7A45", 2.5)}/>')
glow(1062, 600, 40, MOON)
a(f'<path d="M1044 636 V600 L1062 578 L1080 600 V636" {st(STONE, INK, 2.5)}/>')
a(f'<path d="M1062 578 L1062 556" {st("none", INK, 2.5)}/>')
a(f'<path d="M1056 562 H1068" {st("none", INK, 2.5)}/>')
a(f'<path d="M1054 612 a8 8 0 0 1 16 0 v10 h-16 Z" {st(LANTERN, INK, 2)}/>')
a(f'<path d="M1030 636 C1050 630 1074 642 1094 636" {st("none", WATERL, 2.5)}/>')
a(f'<path d="M1036 646 C1056 640 1080 652 1100 646" {st("none", WATERL, 2.5)}/>')
badge_dungeon(1100, 568)
label(1040, 697, 'The Drowned Chapel', 17)

# --- NORTH RANGE: THE RIMEWALL
peaks = [
    (70, 196, 52, 92), (138, 212, 62, 120), (208, 202, 56, 108), (272, 214, 52, 98), (330, 200, 42, 80),
    (488, 206, 50, 108), (546, 214, 56, 126),
    (722, 212, 56, 124), (786, 204, 50, 100), (850, 214, 56, 116), (918, 204, 52, 100),
    (984, 212, 56, 118), (1050, 204, 52, 98), (1112, 212, 52, 90),
]
for (cx, by, hw, h) in sorted(peaks, key=lambda p: p[1]):
    mountain(cx, by, hw, h)

# Frost Throne massif and throne (centre top)
glow(632, 104, 74, FROST)
a(f'<path d="M532 240 L600 122 H664 L736 240 Z" {fillonly(MT)}/>')
a(f'<path d="M664 122 L736 240 H676 Z" {fillonly(MTS)}/>')
a(f'<path d="M600 122 H664 L676 150 L652 140 L632 158 L612 140 L590 150 Z" {st(SNOW, INK, 1.5)}/>')
a(f'<path d="M532 240 L600 122 H664 L736 240" {st("none", INK, 3)}/>')
# the throne: jagged ice
a(f'<path d="M606 124 L606 84 L616 98 L622 66 L632 86 L642 62 L650 96 L658 82 L658 124 Z" {st(FROST, INK, 2.5)}/>')
a(f'<path d="M616 124 V108 H648 V124" {st("#CFEFFC", INK, 2)}/>')
a(f'<path d="M624 70 L632 86 L640 66" {st("none", "#E8F8FF", 2)}/>')
badge_raid(682, 86, 'III')
label(632, 50, 'The Frost Throne', 22)

# The Broken Pass: gap in the range with a broken bridge
a(f'<path d="M352 214 L372 150 L384 214 Z" {st(MTS, INK, 3)}/>')
a(f'<path d="M412 214 L424 146 L446 214 Z" {st(MT, INK, 3)}/>')
a(f'<path d="M372 150 L389 160 M424 146 L407 158" {st("none", "#7A5A3A", 5)}/>')
a(f'<path d="M372 150 L389 160 M424 146 L407 158" {st("none", INK, 1.5)}/>')
a(f'<path d="M392 164 l-2 10 M405 162 l2 12" {st("none", INK, 2)}/>')
badge_raid(398, 118, 'II')
label(398, 96, 'The Broken Pass', 20)

# --- EMBERDEEP (west mountain, glowing door)
glow(150, 346, 58, EMBER)
a(f'<path d="M50 392 L150 224 L250 392 Z" {fillonly(MT)}/>')
a(f'<path d="M150 224 L250 392 L176 392 Z" {fillonly(MTS)}/>')
a(f'<path d="M150 224 L186 284 L170 278 L156 294 L142 280 L126 290 L118 278 Z" {st(SNOW, INK, 1.5)}/>')
a(f'<path d="M50 392 L150 224 L250 392" {st("none", INK, 3)}/>')
a(f'<path d="M126 392 V346 L150 330 L174 346 V392" {st("#3A2630", INK, 3)}/>')
a(f'<path d="M134 392 V352 L150 341 L166 352 V392 Z" {fillonly(EMBER)}/>')
a(f'<path d="M140 392 V362 H160 V392" {fillonly("#FFD27A")}/>')
a(f'<path d="M118 344 L150 322 L182 344" {st("none", INK, 4)}/>')
a(f'<path d="M196 240 C188 226 204 218 196 204 M212 250 C204 236 220 228 212 214" {st("none", "#8E8273", 3)}/>')
label(150, 424, 'Emberdeep', 24)

# --- EMBER MINES (dungeon)
a(f'<path d="M244 400 C252 352 330 352 338 400 Z" {st(MT, INK, 3)}/>')
glow(291, 392, 26, EMBER)
a(f'<path d="M276 400 V378 H306 V400" {st("#3A2630", INK, 2.5)}/>')
a(f'<path d="M272 378 H310" {st("none", "#7A5A3A", 5)}/>')
a(f'<path d="M272 378 H310" {st("none", INK, 1.5)}/>')
a(f'<path d="M282 400 V384 H300 V400" {fillonly(EMBER)}/>')
a(f'<path d="M318 404 h16 l-2 -8 h-12 Z" {st("#857C70", INK, 2)}/>')
badge_dungeon(334, 370)
label(291, 432, 'Ember Mines', 18)

# --- WOLFWOOD (centre) and WOLFDEN
trees = [(690, 308, 1.0), (726, 298, 1.1), (764, 304, 0.95), (800, 294, 1.05), (838, 308, 0.9),
         (668, 336, 0.95), (706, 330, 1.05), (840, 340, 1.0), (876, 326, 0.9),
         (690, 372, 1.0), (728, 380, 0.9), (856, 378, 1.05), (818, 388, 0.9)]
for (x, y, s) in sorted(trees, key=lambda t: t[1]):
    pine(x, y, s)
a(f'<path d="M752 372 C752 336 806 336 806 372 Z" {st(STONE, INK, 3)}/>')
a(f'<path d="M766 372 C766 352 792 352 792 372 Z" {fillonly("#2A1A22")}/>')
a(f'<circle cx="774" cy="362" r="2.6" {fillonly(LANTERN)}/><circle cx="784" cy="362" r="2.6" {fillonly(LANTERN)}/>')
badge_dungeon(812, 344)
label(779, 410, 'Wolfden', 18)
label(770, 252, 'Wolfwood', 15, col='#5E4A38', ls=0.12)

# --- MOONMERE (north-east lake with a tower on an island)
a(f'<path d="M906 300 C900 262 950 240 1010 244 C1070 248 1112 270 1106 308 C1100 346 1040 362 980 356 C930 350 910 330 906 300 Z" {st(WATER, INK, 3)}/>')
a(f'<path d="M930 318 q14 -5 28 0 M1050 330 q14 -5 28 0" {st("none", WATERL, 2.5)}/>')
glow(1006, 276, 46, MOON)
a(f'<ellipse cx="1006" cy="306" rx="30" ry="9" {st(GR, INK, 2.5)}/>')
a(f'<path d="M996 306 V262 L1006 236 L1016 262 V306" {st("#E9E2F5", INK, 2.5)}/>')
a(f'<path d="M1002 278 h8 v10 h-8 Z" {fillonly(MOON)}/>')
a(f'<path d="M1006 236 V224" {st("none", INK, 2)}/>')
a(f'<circle cx="1006" cy="221" r="3" {fillonly(MOON)}/>')
# Probably a log
a(f'<path d="M1052 300 c4 -10 12 -10 16 0 M1074 300 c4 -10 12 -10 16 0" {st("#6E8C5A", INK, 2.5)}/>')
note(1072, 322, 'probably a log', 13)
label(1006, 386, 'Moonmere', 24)

# --- BRAMBLEWICK (east hills, windmill, round doors)
for (cx, base, rx, ry) in [(1060, 516, 96, 50), (900, 518, 96, 52), (980, 528, 100, 44)]:
    hill(cx, base, rx, ry)
for (x, y) in [(900, 500), (980, 510), (1048, 496)]:
    a(f'<path d="M{x - 9} {y + 10} V{y + 2} A9 9 0 0 1 {x + 9} {y + 2} V{y + 10} Z" {st(LANTERN, INK, 2)}/>')
    a(f'<circle cx="{x}" cy="{y + 4}" r="1.6" {fillonly(INK)}/>')
a(f'<path d="M934 488 L938 446 H950 L954 488 Z" {st(STONE, INK, 2.5)}/>')
a(f'<g transform="translate(944 446) rotate(22)" {st("#E7D5B0", INK, 2)}><rect x="-4" y="-34" width="8" height="28"/><rect x="-4" y="6" width="8" height="28"/><rect x="-34" y="-4" width="28" height="8"/><rect x="6" y="-4" width="28" height="8"/></g>')
a(f'<circle cx="944" cy="446" r="4" {st(LANTERN, INK, 2)}/>')
a(f'<path d="M1010 470 v-12 M1016 470 v-8" {st("none", INK, 2.5)}/>')
a(f'<path d="M1010 452 c-6 -6 4 -10 -2 -16 M1016 456 c-6 -6 4 -10 -2 -16" {st("none", "#8E8273", 2.5)}/>')
label(970, 556, 'Bramblewick', 24)

# --- THE SINGING BARROW (south-west hills)
glow(262, 552, 40, MOSS)
a(f'<path d="M198 574 C206 520 318 520 326 574 Z" {st(GR, INK, 3)}/>')
a(f'<path d="M248 574 V552 C248 540 276 540 276 552 V574" {st("#2A1A22", INK, 2.5)}/>')
a(f'<path d="M244 548 C244 532 280 532 280 548" {st("none", STONES, 5)}/>')
for (x, h) in [(190, 30), (338, 26), (214, 22)]:
    a(f'<path d="M{x - 6} 576 V{576 - h} C{x - 6} {572 - h} {x + 6} {572 - h} {x + 6} {576 - h} V576 Z" {st(STONE, INK, 2.5)}/>')
# music notes floating up (the joke)
for (x, y, s) in [(288, 516, 1.0), (306, 494, 0.85), (276, 482, 0.75)]:
    a(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(5*s)}" ry="{f(4*s)}" {fillonly(INK)}/>')
    a(f'<path d="M{f(x + 4.5*s)} {f(y)} V{f(y - 18*s)} l{f(7*s)} {f(4*s)}" {st("none", INK, 2)}/>')
badge_raid(330, 526, 'I')
label(262, 608, 'The Singing Barrow', 20)

# --- THE FERRYMAN'S CROSSING (dungeon) on the river below the pass
glow(462, 352, 30, FROST)
a(f'<path d="M444 356 C448 368 476 368 482 356 Z" {st("#5A4332", INK, 2.5)}/>')
a(f'<path d="M464 356 L456 334 L468 330 L472 356 Z" {st("#3A3046", INK, 2)}/>')
a(f'<path d="M476 358 L486 326" {st("none", INK, 2.5)}/>')
a(f'<circle cx="452" cy="338" r="4" {st(FROST, INK, 1.5)}/>')
badge_dungeon(500, 330)
label(498, 370, "The Ferryman's", 17, anchor='start')
label(498, 390, 'Crossing', 17, anchor='start')

# --- ROADS (dotted)
roads = [
    'M520 548 C500 500 470 450 486 400 C470 380 452 380 440 360 C420 320 420 270 404 222',
    'M404 186 C430 150 500 160 560 150 C580 146 594 138 604 128',
    'M498 570 C440 548 380 500 340 470 C300 444 240 444 204 436',
    'M600 566 C680 572 760 560 830 540 C870 528 900 520 930 514',
]
for d in roads:
    a(f'<path d="{d}" {st("none", ROAD, 3.5, "; stroke-dasharray: 1 9")}/>')

# --- HIGHFELL and THE LAST LANTERN (centre south)
glow(548, 548, 52, LANTERN)
houses = [(512, 566, 26, 22, '#C96F4A'), (544, 552, 30, 30, '#B24A3A'), (580, 568, 26, 22, '#C96F4A'), (528, 584, 24, 18, '#9C5A3E'), (566, 588, 26, 18, '#B24A3A')]
for (x, y, w, h, roof) in houses:
    a(f'<path d="M{x - w/2:.0f} {y} V{y - h*0.55:.0f} H{x + w/2:.0f} V{y} Z" {st("#E9D8B4", INK, 2.5)}/>')
    a(f'<path d="M{x - w/2 - 4:.0f} {y - h*0.55:.0f} L{x} {y - h:.0f} L{x + w/2 + 4:.0f} {y - h*0.55:.0f} Z" {st(roof, INK, 2.5)}/>')
    a(f'<rect x="{x - 3:.0f}" y="{y - h*0.42:.0f}" width="6" height="6" {fillonly(LANTERN)}/>')
# the Last Lantern sign: a lantern on a post beside the inn
a(f'<path d="M604 586 V530 H620" {st("none", INK, 3)}/>')
a(f'<path d="M614 530 v6 M610 536 h10 l-2 14 h-6 Z" {st(LANTERN, INK, 2)}/>')
label(548, 622, 'Highfell', 28)
note(548, 644, 'and the Last Lantern', 15)

# sheep (a joke) and the scale bar (another one)
for (x, y) in [(402, 650), (426, 660), (446, 646)]:
    a(f'<ellipse cx="{x}" cy="{y}" rx="9" ry="6.5" {st("#FBF6EA", INK, 2)}/>')
    a(f'<circle cx="{x + 8}" cy="{y - 3}" r="3.4" {fillonly(INK)}/>')
note(426, 686, 'here be sheep', 14)

# compass rose (bottom-left)
cx, cy = 84, 640
a(f'<circle cx="{cx}" cy="{cy}" r="34" {st(P, EDGE, 2)}/>')
a(f'<path d="M{cx} {cy - 30} L{cx + 8} {cy} L{cx} {cy + 30} L{cx - 8} {cy} Z" {st(SNOW, INK, 2)}/>')
a(f'<path d="M{cx} {cy - 30} L{cx + 8} {cy} L{cx} {cy} Z" {fillonly(EMBER)}/>')
a(f'<path d="M{cx - 30} {cy} L{cx} {cy - 7} L{cx + 30} {cy} L{cx} {cy + 7} Z" {st(SNOW, INK, 2)}/>')
a(f'<path d="M{cx} {cy - 30} L{cx + 8} {cy} L{cx} {cy + 30} L{cx - 8} {cy} Z" {st("none", INK, 2)}/>')
a(f'<text x="{cx}" y="{cy - 40}" text-anchor="middle" style="font-family: \'IM Fell English SC\', Georgia, serif; font-size: 16px; fill: {INK}">N</text>')

# scale bar
a(f'<path d="M150 660 H270" {st("none", INK, 3)}/>')
a(f'<path d="M150 652 V668 M210 654 V666 M270 652 V668" {st("none", INK, 2.5)}/>')
a(f'<rect x="150" y="657" width="60" height="6" {fillonly(INK)}/>')
note(210, 686, "one pint's walk", 14)

# region and river names
label(330, 248, 'The Rimewall', 15, col='#5E4A38', ls=0.16)
note(612, 474, 'the Wend', 15, rot=8)

# title cartouche (top-left)
a(f'<path d="M30 42 H300 L288 60 L300 78 H30 L42 60 Z" {st("#F7EED9", INK, 2.5)}/>')
a(f'<text x="165" y="68" text-anchor="middle" style="font-family: \'IM Fell English SC\', Georgia, serif; font-size: 22px; letter-spacing: 0.04em; fill: {INK}">The Highfell Vale</text>')

a('</g>')
a(f'<rect x="6" y="6" width="{W-12}" height="{H-12}" rx="22" {st("none", INK, 3)}/>')
a(f'<rect x="18" y="18" width="{W-36}" height="{H-36}" rx="14" {st("none", EDGE, 2)}/>')
a('</svg>')

open(sys.argv[1], 'w').write('\n'.join(out))
print('elements', len(out))
