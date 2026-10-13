import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Barrow Crypt sprites in the locked TV-cartoon style: chunky in-game sizes, one black line, flat colour.
# Every sprite is drawn around its ground point (0, 0): x right, y down, so the art sits at negative y.
# 1 art unit = 1 world unit. Usage: python3 tools/art_sprites.py -> art/sprites.json + art/_sprites_preview.html
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tvworld import mirror

OUT = HF_ROOT + '/art/'
K = '#1E1A1A'
LW = 4  # character line weight

# palette (from the style lock)
BONE, BONE_D = '#F0E8D2', '#D8CDB0'
GRN, GRN_L = '#9BE15D', '#D8FFB8'
STEEL, STEEL_D, STEEL_L = '#9AA7B8', '#7D8FA3', '#C9D2DC'
GOLD, GOLD_D = '#F2C230', '#D9A520'
RED, RED_D = '#C8403F', '#9E2F2E'
BLUE, BLUE_D = '#4F6FA8', '#3D5A8C'
WOOD, WOOD_D = '#8A5A34', '#6B4528'
RUST = '#A0703F'
PURP, PURP_D = '#6A4BA3', '#4F3780'
STONE, STONE_T, STONE_D = '#8C8098', '#A69BB2', '#6E6382'
FROST, FROST_L = '#8FD6FF', '#DDF3FF'
FIRE, FLAME = '#FF8A4C', '#FFE08A'


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def s(d, fill, w=LW):
    return f'<path d="{d}" style="fill: {fill}; stroke: {K}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round"/>'


def ln(d, col=K, w=3):
    return f'<path d="{d}" style="fill: none; stroke: {col}; stroke-width: {w}; stroke-linejoin: round; stroke-linecap: round"/>'


def beam(d, col, w=5, edge=LW):
    return ln(d, K, w + edge * 1.6) + ln(d, col, w)


def c(cx, cy, r, fill, w=LW):
    if w:
        return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" style="fill: {fill}; stroke: {K}; stroke-width: {w}"/>'
    return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" style="fill: {fill}"/>'


def e(cx, cy, rx, ry, fill, w=LW):
    if w:
        return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" style="fill: {fill}; stroke: {K}; stroke-width: {w}"/>'
    return f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" style="fill: {fill}"/>'


def halo(cx, cy, r, col, op=0.26):
    return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" style="fill: {col}; opacity: {op}"/>'


def m(d):
    return mirror(d, 0)


def both(d, fill, w=LW):
    return s(d, fill, w) + s(m(d), fill, w)


def eyes(x, y, rx=3.8, ry=4.6, gap=5.6, look=(0.4, 0.4), w=2.4):
    o = ''
    for sx in (-1, 1):
        cx = x + sx * gap
        o += e(cx, y, rx, ry, '#FFFFFF', w) + c(cx + look[0], y + look[1], 1.7, K, 0)
    return o


SPRITES = {}


def sprite(name, vb, body, note=''):
    x, y, w, h = vb
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
           + ''.join(body) + '</svg>')
    SPRITES[name] = {'svg': svg, 'vb': [x, y, w, h], 'note': note}


# ====================================================================== heroes
SKIN, SKIN_D = '#F2B48C', '#E0956C'
BEARD, BEARD_D = '#E2733A', '#B8552A'


def tank_axe(x, top, flip=1):
    # long handle with a crescent blade pointing away from the body
    o = beam(f'M{x} -4 L{x - 2 * flip} {top}', WOOD, 5)
    bx, by = x - 2 * flip, top + 10
    blade = f'M{bx} {by - 12} C{bx - 16 * flip} {by - 20} {bx - 24 * flip} {by - 6} {bx - 22 * flip} {by + 8} C{bx - 14 * flip} {by + 4} {bx - 6 * flip} {by + 6} {bx} {by + 10} Z'
    o += s(blade, STEEL_L) + ln(f'M{bx - 6 * flip} {by - 10} C{bx - 16 * flip} {by - 12} {bx - 20 * flip} {by - 4} {bx - 20 * flip} {by + 4}', '#FFFFFF', 2)
    o += c(bx, by, 4, STEEL_D, 3)
    return o


def tank_front():
    o = []
    o.append(tank_axe(-34, -70))
    o.append(s('M-18 -12 H-4 V0 H-21 C-22 -5 -21 -9 -18 -12 Z', '#5A3A2A') + s(m('M-18 -12 H-4 V0 H-21 C-22 -5 -21 -9 -18 -12 Z'), '#5A3A2A'))
    o.append(s('M-24 -50 C-29 -36 -28 -22 -23 -11 H23 C28 -22 29 -36 24 -50 Z', BLUE))
    o.append(s('M-26 -25 H26 V-17 H-25 Z', WOOD_D, 3.5) + s('M-6 -27 H6 V-15 H-6 Z', GOLD, 3))
    o.append(s('M-24 -48 C-34 -42 -37 -30 -35 -21 L-27 -21 C-27 -29 -25 -37 -20 -42 Z', BLUE))
    o.append(c(-31, -21, 6, SKIN, 3.5))
    # shield on the left arm (viewer's right)
    o.append(c(23, -30, 19, GOLD) + c(23, -30, 13.5, RED, 3) + ln('M23 -43 V-17 M10 -30 H36', RED_D, 2.5) + c(23, -30, 5, STEEL_L, 3))
    o.append(both('M-31 -47 C-33 -58 -16 -63 -11 -52 C-15 -45 -24 -43 -31 -47 Z', STEEL))
    o.append(s('M-16 -57 C-21 -43 -14 -29 0 -23 C14 -29 21 -43 16 -57 Z', BEARD) + ln('M-7 -48 C-7 -40 -5 -34 -3 -30 M7 -48 C7 -40 5 -34 3 -30', BEARD_D, 2.5))
    o.append(c(-3, -28, 2.6, GOLD, 2) + c(3, -28, 2.6, GOLD, 2))
    o.append(e(0, -66, 15, 12, SKIN))
    o.append(eyes(0, -69, 3.6, 4.4, 5.8))
    o.append(ln('M-11.5 -76 L-2.5 -74.2 M11.5 -76 L2.5 -74.2', K, 3.4))
    o.append(s('M-12 -59.5 C-8 -63 -3 -61.5 0 -59.5 C3 -61.5 8 -63 12 -59.5 C9 -55.5 3 -55.5 0 -57 C-3 -55.5 -9 -55.5 -12 -59.5 Z', BEARD, 3))
    o.append(c(0, -63, 4.6, SKIN_D, 3))
    o.append(s('M-17 -73 C-17 -95 17 -95 17 -73 Z', STEEL) + s('M-18.5 -75.5 H18.5 V-69.5 H-18.5 Z', STEEL_D, 3.5))
    o.append(both('M-15 -82 C-26 -84 -33 -94 -31 -105 C-26 -97 -20 -93 -12 -91 Z', BONE, 3.5))
    o.append(c(-9, -72.5, 1.4, K, 0) + c(9, -72.5, 1.4, K, 0) + c(0, -72.5, 1.4, K, 0))
    sprite('tank_f', (-62, -112, 104, 118), o, 'Brannoc front')


def tank_back():
    o = []
    o.append(s('M-18 -12 H-4 V0 H-21 C-22 -5 -21 -9 -18 -12 Z', '#5A3A2A') + s(m('M-18 -12 H-4 V0 H-21 C-22 -5 -21 -9 -18 -12 Z'), '#5A3A2A'))
    o.append(s('M-24 -50 C-29 -36 -28 -22 -23 -11 H23 C28 -22 29 -36 24 -50 Z', BLUE))
    o.append(s('M-26 -25 H26 V-17 H-25 Z', WOOD_D, 3.5))
    o.append(s('M-20 -53 C-25 -38 -25 -24 -22 -13 L-12 -18 L0 -13 L12 -18 L22 -13 C25 -24 25 -38 20 -53 Z', '#B8383A'))
    o.append(tank_axe(34, -70, -1))
    o.append(s(m('M-24 -48 C-34 -42 -37 -30 -35 -21 L-27 -21 C-27 -29 -25 -37 -20 -42 Z'), BLUE))
    o.append(c(31, -21, 6, SKIN, 3.5))
    # back of the shield on the left arm, now on the viewer's left
    o.append(c(-23, -30, 19, WOOD) + ln('M-23 -48 V-12 M-41 -30 H-5', WOOD_D, 3) + s('M-30 -34 H-16 V-26 H-30 Z', '#4A3A30', 3))
    o.append(both('M-31 -47 C-33 -58 -16 -63 -11 -52 C-15 -45 -24 -43 -31 -47 Z', STEEL))
    o.append(both('M-19 -66 C-24 -62 -23 -54 -17 -52 C-14 -56 -14 -62 -15 -66 Z', BEARD, 3))
    o.append(s('M-5 -70 C-7 -60 -5 -50 0 -42 C5 -50 7 -60 5 -70 Z', BEARD, 3.5) + ln('M-3 -62 L3 -58 M-3 -54 L3 -50', BEARD_D, 2.2))
    o.append(c(0, -42, 3, GOLD, 2.2))
    o.append(s('M-17 -71 C-17 -95 17 -95 17 -71 Z', STEEL) + s('M-18.5 -75.5 H18.5 V-69.5 H-18.5 Z', STEEL_D, 3.5))
    o.append(both('M-15 -82 C-26 -84 -33 -94 -31 -105 C-26 -97 -20 -93 -12 -91 Z', BONE, 3.5))
    o.append(ln('M0 -93 V-77', STEEL_D, 3))
    sprite('tank_b', (-44, -112, 104, 118), o, 'Brannoc back')


HSKIN, HSKIN_D, HAIR = '#A86F4C', '#8E5A3B', '#3A2A22'
ROBE, ROBE_D, HBLUE = '#F6F1E4', '#E2D9C2', '#4F86C6'


def sun_staff(x):
    o = beam(f'M{x} 2 L{x} -96', WOOD, 4.5)
    o += halo(x, -104, 20, '#F4B942', 0.3)
    for k in range(8):
        a = math.radians(k * 45 + 22.5)
        x1, y1 = x + 10 * math.cos(a), -104 + 10 * math.sin(a)
        x2, y2 = x + 16 * math.cos(a), -104 + 16 * math.sin(a)
        o += beam(f'M{f(x1)} {f(y1)} L{f(x2)} {f(y2)}', GOLD, 3, 3)
    o += c(x, -104, 8, GOLD, 3.5) + c(x - 2, -106, 2, '#FFF6D0', 0)
    return o


def healer_front():
    o = []
    o.append(sun_staff(-31))
    o.append(s('M-15 -56 C-20 -36 -24 -16 -28 -2 H28 C24 -16 20 -36 15 -56 Z', ROBE))
    o.append(s('M-7 -54 L-10 -4 H-4 L-3 -54 Z', HBLUE, 3) + s(m('M-7 -54 L-10 -4 H-4 L-3 -54 Z'), HBLUE, 3))
    o.append(s('M-28 -7 C-12 -4 12 -4 28 -7 L29 -1 C12 2 -12 2 -29 -1 Z', GOLD, 3.5))
    o.append(s('M-18 -38 C-6 -34 6 -34 18 -38 L18 -31 C6 -27 -6 -27 -18 -31 Z', GOLD, 3.5))
    o.append(s('M-15 -54 C-27 -48 -33 -38 -35 -29 C-30 -25 -24 -25 -20 -30 C-20 -38 -16 -44 -12 -48 Z', ROBE))
    o.append(c(-31, -30, 5, HSKIN, 3))
    o.append(s('M15 -54 C25 -48 29 -38 29 -27 C25 -23 19 -23 16 -27 C16 -36 14 -44 12 -48 Z', ROBE))
    o.append(c(22, -25, 5, HSKIN, 3))
    o.append(halo(22, -25, 11, '#F4B942', 0.35))
    o.append(s('M-14 -58 C-8 -51 8 -51 14 -58 L12 -63 C6 -58 -6 -58 -12 -63 Z', ROBE, 3.5) + ln('M-12 -59 C-6 -54 6 -54 12 -59', GOLD, 2.2))
    o.append(s('M-12 -73 C-12 -88 12 -88 12 -73 C12 -63 6 -59 0 -59 C-6 -59 -12 -63 -12 -73 Z', HSKIN))
    o.append(eyes(0, -73, 3.4, 4.2, 5.2))
    o.append(ln('M-9 -79.5 C-7 -81 -4 -81 -2 -80 M9 -79.5 C7 -81 4 -81 2 -80', K, 3))
    o.append(c(0, -68.5, 2.6, HSKIN_D, 2.2) + ln('M-3.5 -64 C-1.5 -62.5 1.5 -62.5 3.5 -64', K, 2.2))
    o.append(s('M-13 -74 C-16 -93 16 -93 13 -74 C11 -82 5 -86 0 -86 C-5 -86 -11 -82 -13 -74 Z', HAIR, 3.5))
    o.append(c(0, -93, 7, HAIR, 3.5))
    o.append(ln('M-12 -80.5 C-6 -83 6 -83 12 -80.5', GOLD, 2.8) + c(0, -82.5, 2.4, HBLUE, 1.8))
    sprite('healer_f', (-56, -130, 94, 136), o, 'Maren front')


def healer_back():
    o = []
    o.append(sun_staff(31))
    o.append(s('M-15 -56 C-20 -36 -24 -16 -28 -2 H28 C24 -16 20 -36 15 -56 Z', ROBE))
    o.append(s('M-28 -7 C-12 -4 12 -4 28 -7 L29 -1 C12 2 -12 2 -29 -1 Z', GOLD, 3.5))
    o.append(halo(0, -34, 13, '#F4B942', 0.25))
    for k in range(8):
        a = math.radians(k * 45)
        o.append(beam(f'M{f(9 * math.cos(a))} {f(-34 + 9 * math.sin(a))} L{f(14 * math.cos(a))} {f(-34 + 14 * math.sin(a))}', GOLD, 2.6, 2.4))
    o.append(c(0, -34, 6.5, GOLD, 3))
    o.append(s(m('M-15 -54 C-27 -48 -33 -38 -35 -29 C-30 -25 -24 -25 -20 -30 C-20 -38 -16 -44 -12 -48 Z'), ROBE))
    o.append(c(31, -30, 5, HSKIN, 3))
    o.append(s(m('M15 -54 C25 -48 29 -38 29 -27 C25 -23 19 -23 16 -27 C16 -36 14 -44 12 -48 Z'), ROBE))
    o.append(c(-22, -25, 5, HSKIN, 3))
    o.append(s('M-14 -58 C-8 -53 8 -53 14 -58 L12 -63 C6 -60 -6 -60 -12 -63 Z', ROBE, 3.5))
    o.append(s('M-13 -64 C-16 -92 16 -92 13 -64 C8 -60 -8 -60 -13 -64 Z', HAIR, 3.5))
    o.append(c(0, -91, 7.5, HAIR, 3.5) + ln('M-5 -91 C-2 -88 2 -88 5 -91', '#5A4436', 2))
    o.append(ln('M-13 -79 C-6 -76 6 -76 13 -79', GOLD, 2.8))
    sprite('healer_b', (-38, -130, 94, 136), o, 'Maren back')


ISKIN, ISKIN_D, IHAIR, IROBE, IROBE_D = '#F3D7C4', '#E3B9A2', '#EEF2F6', '#3D7FC1', '#2F6699'


def ice_staff(x):
    o = beam(f'M{x} 2 L{x - 1} -86', WOOD, 4.5)
    o += halo(x - 1, -96, 19, FROST, 0.32)
    o += s(f'M{x - 1} -110 L{x + 7} -96 L{x - 1} -83 L{x - 9} -96 Z', FROST, 3.5) + ln(f'M{x - 3} -104 L{x - 6} -97', '#FFFFFF', 2.2)
    o += s(f'M{x - 7} -86 H{x + 5} V-82 H{x - 7} Z', GOLD, 2.5)
    return o


def wizard_hat(back=False):
    o = e(0, -77, 21, 5.5, IROBE, 3.5)
    o += s('M-12 -79 C-10 -93 -3 -106 8 -114 C5 -103 7 -91 12 -79 Z', IROBE)
    o += s('M-12.5 -80 C-4 -77 4 -77 12.5 -80 L11.5 -86 C4 -83 -4 -83 -11.5 -86 Z', GOLD, 3)
    if not back:
        o += ln('M2 -98 V-90 M-1.5 -96 L5.5 -92 M-1.5 -92 L5.5 -96', '#FFFFFF', 1.8)
    return o


def dps_front():
    o = []
    o.append(ice_staff(29))
    o.append(s('M-14 -74 C-19 -60 -19 -46 -13 -40 H13 C19 -46 19 -60 14 -74 Z', IHAIR, 3.5))
    o.append(s('M-14 -50 C-18 -32 -22 -14 -24 -2 H24 C22 -14 18 -32 14 -50 Z', IROBE))
    o.append(s('M-6 -48 L-9 -2 H9 L6 -48 Z', GOLD, 3))
    o.append(s('M-15 -32 C-5 -29 5 -29 15 -32 V-27 C5 -24 -5 -24 -15 -27 Z', IROBE_D, 3))
    o.append(s('M-14 -48 C-24 -42 -28 -32 -28 -24 C-24 -21 -19 -22 -16 -26 C-16 -34 -13 -40 -10 -44 Z', IROBE))
    o.append(c(-24, -24, 4.5, ISKIN, 3))
    o.append(halo(-25, -33, 11, FROST, 0.4) + c(-25, -33, 5.5, FROST_L, 3))
    o.append(s('M14 -48 C22 -46 27 -42 28 -36 C26 -32 22 -32 19 -35 C17 -40 14 -42 10 -44 Z', IROBE))
    o.append(c(27, -38, 4.5, ISKIN, 3))
    o.append(s('M-15 -52 C-8 -44 8 -44 15 -52 C10 -57 -10 -57 -15 -52 Z', '#FFFFFF', 3.5))
    o.append(s('M-11 -66 L-23 -75 L-13 -59 Z', ISKIN, 3) + s(m('M-11 -66 L-23 -75 L-13 -59 Z'), ISKIN, 3))
    o.append(s('M-11 -67 C-11 -80 11 -80 11 -67 C11 -58 6 -54 0 -54 C-6 -54 -11 -58 -11 -67 Z', ISKIN))
    o.append(eyes(0, -66, 3.3, 4.2, 4.9))
    o.append(ln('M-8 -72.5 L-2.5 -71.5 M8 -72.5 L2.5 -71.5', '#5E6E86', 2.8))
    o.append(c(0, -62, 2.3, ISKIN_D, 2) + ln('M-2.5 -58.5 C-1 -57.5 1 -57.5 2.5 -58.5', K, 2))
    o.append(s('M-12 -70 C-8 -75 -2 -73 0 -71 C2 -73 8 -75 12 -70 C12 -79 -12 -79 -12 -70 Z', IHAIR, 3))
    o.append(wizard_hat())
    sprite('dps_f', (-40, -122, 82, 128), o, 'Ivy front')


def dps_back():
    o = []
    o.append(ice_staff(-29))
    o.append(s('M-14 -50 C-18 -32 -22 -14 -24 -2 H24 C22 -14 18 -32 14 -50 Z', IROBE))
    o.append(s('M-15 -32 C-5 -29 5 -29 15 -32 V-27 C5 -24 -5 -24 -15 -27 Z', IROBE_D, 3))
    o.append(s(m('M-14 -48 C-24 -42 -28 -32 -28 -24 C-24 -21 -19 -22 -16 -26 C-16 -34 -13 -40 -10 -44 Z'), IROBE))
    o.append(c(24, -24, 4.5, ISKIN, 3))
    o.append(halo(25, -33, 11, FROST, 0.4) + c(25, -33, 5.5, FROST_L, 3))
    o.append(s(m('M14 -48 C22 -46 27 -42 28 -36 C26 -32 22 -32 19 -35 C17 -40 14 -42 10 -44 Z'), IROBE))
    o.append(c(-27, -38, 4.5, ISKIN, 3))
    o.append(s('M-11 -66 L-23 -75 L-13 -59 Z', ISKIN, 3) + s(m('M-11 -66 L-23 -75 L-13 -59 Z'), ISKIN, 3))
    o.append(s('M-14 -76 C-19 -60 -18 -40 -10 -30 L0 -34 L10 -30 C18 -40 19 -60 14 -76 Z', IHAIR, 3.5))
    o.append(ln('M-6 -66 C-7 -54 -6 -44 -4 -36 M6 -66 C7 -54 6 -44 4 -36', '#C9D4E0', 2.2))
    o.append(wizard_hat(True))
    sprite('dps_b', (-42, -122, 82, 128), o, 'Ivy back')


# ====================================================================== mobs
def skull(cx, cy, k=1.0, eye=GRN, jaw=True):
    o = s(f'M{f(cx - 14 * k)} {f(cy)} C{f(cx - 14 * k)} {f(cy - 17 * k)} {f(cx + 14 * k)} {f(cy - 17 * k)} {f(cx + 14 * k)} {f(cy)} C{f(cx + 14 * k)} {f(cy + 6 * k)} {f(cx + 10 * k)} {f(cy + 10 * k)} {f(cx + 6 * k)} {f(cy + 12 * k)} H{f(cx - 6 * k)} C{f(cx - 10 * k)} {f(cy + 10 * k)} {f(cx - 14 * k)} {f(cy + 6 * k)} {f(cx - 14 * k)} {f(cy)} Z', BONE)
    for sx in (-1, 1):
        o += e(cx + sx * 6 * k, cy - 1 * k, 4.6 * k, 5.2 * k, K, 0)
        o += c(cx + sx * 6 * k, cy - 0.5 * k, 1.9 * k, eye, 0)
    o += s(f'M{f(cx)} {f(cy + 4 * k)} L{f(cx - 2.2 * k)} {f(cy + 8 * k)} H{f(cx + 2.2 * k)} Z', K, 1.5)
    if jaw:
        o += s(f'M{f(cx - 8 * k)} {f(cy + 10 * k)} H{f(cx + 8 * k)} C{f(cx + 8 * k)} {f(cy + 15 * k)} {f(cx + 4 * k)} {f(cy + 17 * k)} {f(cx)} {f(cy + 17 * k)} C{f(cx - 4 * k)} {f(cy + 17 * k)} {f(cx - 8 * k)} {f(cy + 15 * k)} {f(cx - 8 * k)} {f(cy + 10 * k)} Z', BONE, 3.2)
        o += ln(f'M{f(cx - 4 * k)} {f(cy + 10.5 * k)} V{f(cy + 14 * k)} M{f(cx)} {f(cy + 10.5 * k)} V{f(cy + 15 * k)} M{f(cx + 4 * k)} {f(cy + 10.5 * k)} V{f(cy + 14 * k)}', K, 1.8)
    return o


def ribcage(cx, top, wd, ht):
    hw = wd / 2
    o = s(f'M{f(cx - hw)} {f(top + 4)} C{f(cx - hw - 2)} {f(top + ht * 0.55)} {f(cx - hw * 0.7)} {f(top + ht)} {f(cx)} {f(top + ht)} C{f(cx + hw * 0.7)} {f(top + ht)} {f(cx + hw + 2)} {f(top + ht * 0.55)} {f(cx + hw)} {f(top + 4)} C{f(cx + hw * 0.5)} {f(top - 2)} {f(cx - hw * 0.5)} {f(top - 2)} {f(cx - hw)} {f(top + 4)} Z', BONE)
    for i, yy in enumerate((0.3, 0.52, 0.74)):
        y = top + ht * yy
        sp = hw * (0.82 - i * 0.12)
        o += ln(f'M{f(cx - sp)} {f(y - 2)} C{f(cx - sp * 0.6)} {f(y + 2)} {f(cx - 4)} {f(y + 1)} {f(cx - 2)} {f(y - 1)} M{f(cx + sp)} {f(y - 2)} C{f(cx + sp * 0.6)} {f(y + 2)} {f(cx + 4)} {f(y + 1)} {f(cx + 2)} {f(y - 1)}', K, 2.4)
    o += ln(f'M{f(cx)} {f(top + 3)} V{f(top + ht - 3)}', K, 2.4)
    return o


def bone_limb(d, w=5.5):
    return beam(d, BONE, w, 3.6)


def rattler(helm=False):
    o = []
    o.append(bone_limb('M-6 -30 L-9 -16 L-8 -4') + bone_limb('M6 -30 L9 -16 L8 -4'))
    o.append(e(-10, -2, 6, 3.4, BONE, 3) + e(10, -2, 6, 3.4, BONE, 3))
    o.append(s('M-11 -35 C-13 -28 -8 -25 0 -26 C8 -25 13 -28 11 -35 Z', BONE, 3.5))
    o.append(bone_limb('M0 -36 V-46', 5))
    # sword arm (viewer's left)
    o.append(bone_limb('M-13 -57 L-20 -45 L-18 -33'))
    o.append(s('M-15 -36 L-19 -40 L-36 -78 L-33 -80 L-15 -42 Z', '#C2BBB0', 3.5) + c(-29, -66, 2, RUST, 0) + c(-24, -54, 1.6, RUST, 0))
    o.append(s('M-24 -36 L-10 -42 L-9 -38 L-23 -32 Z', '#6B5A48', 3) + c(-17, -33, 4, BONE, 3))
    o.append(ribcage(0, -62, 28, 24))
    # buckler arm (viewer's right)
    o.append(bone_limb('M13 -57 L19 -47'))
    o.append(c(19, -44, 11, WOOD, 3.5) + c(19, -44, 11, 'none', 0) + ln('M19 -55 V-33', WOOD_D, 2.2) + c(19, -44, 3.6, RUST, 2.6))
    o.append(skull(0, -77, 1.0))
    if helm:
        o.append(s('M-15.5 -83 C-15 -98 15 -98 15.5 -83 L18 -81 H-18 Z', '#8E8A84', 3.5) + ln('M-6 -94 L-3 -88', K, 2) + c(-9, -86, 1.6, RUST, 0) + c(7, -90, 1.8, RUST, 0))
    sprite('rattler2' if helm else 'rattler', (-42, -104, 76, 110), o, 'Rattler')


def archer():
    o = []
    o.append(s('M-16 -66 L-6 -88 L-1 -86 L-9 -64 Z', '#7A5534', 3) + ln('M-6 -88 L-10 -95 M-4 -87 L-4 -95 M-2 -86 L2 -93', '#F7F3EA', 2.4))
    o.append(bone_limb('M-6 -30 L-9 -16 L-8 -4') + bone_limb('M6 -30 L9 -16 L8 -4'))
    o.append(e(-10, -2, 6, 3.4, BONE, 3) + e(10, -2, 6, 3.4, BONE, 3))
    o.append(s('M-11 -35 C-13 -28 -8 -25 0 -26 C8 -25 13 -28 11 -35 Z', BONE, 3.5))
    o.append(bone_limb('M0 -36 V-46', 5))
    o.append(bone_limb('M-13 -57 L-18 -46 L-14 -38'))
    o.append(ribcage(0, -62, 28, 24))
    o.append(bone_limb('M13 -57 L20 -52 L26 -50'))
    # bow held out on the viewer's right
    o.append(ln('M27 -86 C40 -70 40 -36 27 -18', K, 7.5) + ln('M27 -86 C40 -70 40 -36 27 -18', WOOD, 4))
    o.append(ln('M27 -86 L27 -18', '#E8E0CC', 1.6))
    o.append(c(28, -50, 4, BONE, 3))
    o.append(skull(0, -77, 1.0))
    # tattered purple hood over the skull
    o.append(s('M-17 -76 C-20 -96 -6 -104 0 -104 C6 -104 20 -96 17 -76 L13 -80 C12 -91 -12 -91 -13 -80 Z', PURP, 3.5))
    o.append(s('M-17 -76 L-21 -64 L-15 -68 L-14 -60 L-10 -70 Z', PURP, 3) + s(m('M-17 -76 L-21 -64 L-15 -68 L-14 -60 L-10 -70 Z'), PURP, 3))
    sprite('archer', (-30, -110, 76, 116), o, 'Bone archer')


def brute():
    o = []
    # club behind the arm
    o.append(beam('M-58 -40 L-66 -128', BONE, 13, 3.6) + c(-66, -132, 11, BONE) + c(-58, -138, 9, BONE) + c(-57, -38, 8, BONE))
    o.append(ln('M-63 -100 L-60 -96 M-64 -84 L-61 -80', K, 2.4))
    o.append(bone_limb('M-16 -52 L-24 -28 L-20 -6', 11) + bone_limb('M16 -52 L24 -28 L20 -6', 11))
    o.append(c(-24, -28, 6.5, BONE, 3.5) + c(24, -28, 6.5, BONE, 3.5))
    o.append(e(-23, -3, 13, 5.5, BONE, 3.5) + e(23, -3, 13, 5.5, BONE, 3.5))
    o.append(s('M-24 -60 C-28 -48 -16 -44 0 -45 C16 -44 28 -48 24 -60 Z', BONE))
    o.append(bone_limb('M0 -62 V-78', 9))
    o.append(ribcage(0, -112, 76, 50))
    # arms
    o.append(bone_limb('M-38 -104 L-54 -78 L-56 -50', 10) + c(-54, -78, 6, BONE, 3.5))
    o.append(c(-57, -44, 11, BONE) + ln('M-63 -47 L-51 -47 M-63 -41 L-51 -41', K, 2.2))
    o.append(bone_limb('M38 -104 L54 -78 L52 -52', 10) + c(54, -78, 6, BONE, 3.5))
    o.append(c(52, -44, 12, BONE) + ln('M46 -50 L58 -50 M46 -44 L58 -44 M47 -38 L57 -38', K, 2.2))
    o.append(s('M44 -60 H60 V-55 H44 Z', '#6E6A7A', 3) + s('M-48 -60 H-64 V-55 H-48 Z', '#6E6A7A', 3))
    # shoulder blades with spikes
    for sx in (-1, 1):
        o.append(s(f'M{sx * 30} -116 L{sx * 36} -138 L{sx * 42} -116 Z', BONE, 3.5) + s(f'M{sx * 44} -110 L{sx * 58} -128 L{sx * 54} -106 Z', BONE, 3.5))
        o.append(c(sx * 42, -106, 15, BONE))
    o.append(skull(0, -112, 1.15))
    o.append(s('M-17 -120 C-17 -138 17 -138 17 -120 L19 -117 H-19 Z', '#6E6A7A', 3.5) + c(-7, -125, 1.6, K, 0) + c(7, -125, 1.6, K, 0))
    o.append(s('M-16 -128 C-28 -132 -34 -142 -32 -152 C-27 -144 -21 -140 -12 -137 Z', BONE, 3.5))
    o.append(s('M13 -134 L22 -138 L23 -131 L15 -129 Z', BONE, 3))
    sprite('brute', (-84, -160, 160, 168), o, 'Bonebrute')


def caller():
    o = []
    # staff with hanging lantern (viewer's right)
    o.append(beam('M24 2 L22 -100', '#6B5A48', 4.5) + ln('M22 -100 C22 -108 34 -108 34 -98', K, 3))
    o.append(halo(34, -82, 24, GRN, 0.3))
    o.append(ln('M34 -98 V-94', K, 2.5) + s('M27 -94 H41 L39 -70 H29 Z', '#4A4458', 3) + s('M34 -90 C38 -84 38 -78 34 -74 C30 -78 30 -84 34 -90 Z', GRN, 2) + s('M27 -70 H41 L38 -66 H30 Z', '#4A4458', 2.5))
    # robe with ragged hem
    o.append(s('M-16 -64 C-20 -40 -24 -18 -26 -4 L-20 1 L-14 -5 L-8 1 L-2 -5 L4 1 L10 -5 L16 1 L22 -4 L26 -2 C24 -18 20 -40 16 -64 Z', '#3F6B4A'))
    o.append(ln('M-20 -30 C-8 -26 8 -26 20 -30', '#2F5238', 2.5))
    o.append(s('M-16 -42 C-6 -38 6 -38 16 -42 L16 -37 C6 -33 -6 -33 -16 -37 Z', '#7A6248', 3) + c(0, -38, 3.5, BONE, 2.4))
    # sleeves and bony hands
    o.append(s('M-16 -62 C-26 -54 -30 -42 -30 -32 L-20 -30 C-20 -40 -16 -48 -12 -54 Z', '#3F6B4A', 3.5) + c(-25, -28, 4.5, BONE, 3))
    o.append(s('M16 -62 C22 -58 24 -52 24 -46 L18 -42 C16 -48 14 -52 12 -54 Z', '#3F6B4A', 3.5) + c(22, -44, 4.5, BONE, 3))
    # hood with a dark opening and glowing eyes
    o.append(s('M-18 -64 C-21 -88 -10 -102 0 -104 C10 -102 21 -88 18 -64 C12 -58 -12 -58 -18 -64 Z', '#3F6B4A'))
    o.append(s('M-11 -68 C-12 -86 12 -86 11 -68 C6 -64 -6 -64 -11 -68 Z', K, 2))
    o.append(halo(-5, -78, 6, GRN, 0.45) + halo(5, -78, 6, GRN, 0.45) + c(-5, -78, 2.3, GRN, 0) + c(5, -78, 2.3, GRN, 0))
    o.append(s('M-6 -70 H6 C6 -67 3 -66 0 -66 C-3 -66 -6 -67 -6 -70 Z', BONE, 2) + ln('M-2 -70 V-67 M2 -70 V-67', K, 1.4))
    o.append(ln('M-14 -66 C-8 -61 8 -61 14 -66', '#6FA05A', 2.4))
    sprite('caller', (-36, -112, 84, 118), o, 'Gravecaller')


def wisp():
    o = [halo(0, -40, 26, GRN, 0.22)]
    o.append(s('M0 -64 C14 -64 20 -52 20 -42 C20 -32 16 -26 12 -20 C8 -24 6 -18 2 -22 C-2 -16 -6 -22 -10 -18 C-14 -24 -20 -32 -20 -42 C-20 -52 -14 -64 0 -64 Z', '#C8F5E8', 3.5))
    o.append(eyes(0, -46, 3.6, 4.4, 6, (0.3, 0.8), 2.2))
    o.append(ln('M-10 -53 L-3 -50.5 M10 -53 L3 -50.5', K, 2.6))
    o.append(e(0, -36, 3.4, 4.2, '#2A3A36', 2))
    sprite('wisp', (-28, -70, 56, 76), o, 'Wisp')


def knight():
    o = []
    AR, ARD = '#8796A8', '#67768A'
    # sword raised (viewer's left), behind the body
    o.append(s('M-52 -84 L-46 -86 L-36 -168 L-44 -174 L-50 -166 Z', STEEL_L) + ln('M-46 -96 L-42 -160', '#FFFFFF', 2.2))
    o.append(s('M-62 -86 L-34 -92 L-33 -84 L-61 -78 Z', GOLD_D) + beam('M-50 -82 L-53 -64', '#5A3A2A', 5, 3.5) + c(-54, -60, 5, GOLD_D, 3.5))
    # legs: greaves with bony knees
    o.append(s('M-24 -44 L-26 -10 L-30 0 H-8 L-9 -10 L-8 -44 Z', AR) + s(m('M-24 -44 L-26 -10 L-30 0 H-8 L-9 -10 L-8 -44 Z'), AR))
    o.append(c(-17, -26, 5, BONE, 3) + c(17, -26, 5, BONE, 3))
    # body: breastplate and tabard
    o.append(s('M-32 -122 C-38 -96 -34 -66 -28 -48 H28 C34 -66 38 -96 32 -122 C14 -132 -14 -132 -32 -122 Z', AR))
    o.append(ln('M0 -126 V-52', ARD, 3) + c(-18, -90, 2.6, RUST, 0) + c(14, -104, 3, RUST, 0))
    o.append(s('M-16 -76 H16 L18 -30 L0 -38 L-18 -30 Z', PURP, 3.5) + skull(0, -60, 0.45, GRN, False))
    o.append(s('M-30 -58 H30 V-50 H-30 Z', '#4A3428', 3.5) + s('M-5 -59 H5 V-49 H-5 Z', GOLD_D, 3))
    # sword arm
    o.append(s('M-30 -118 C-46 -110 -54 -94 -54 -80 L-44 -76 C-42 -88 -36 -100 -26 -106 Z', AR) + c(-50, -78, 7, BONE, 3.5))
    # pauldrons
    o.append(s('M-46 -112 C-50 -132 -24 -140 -16 -124 C-22 -112 -36 -106 -46 -112 Z', AR) + s(m('M-46 -112 C-50 -132 -24 -140 -16 -124 C-22 -112 -36 -106 -46 -112 Z'), AR))
    o.append(c(-34, -123, 2.4, GOLD_D, 0) + c(34, -123, 2.4, GOLD_D, 0))
    # helm with the skull showing through the face opening, red plume
    o.append(s('M0 -186 C-6 -200 10 -210 20 -200 C12 -198 8 -192 6 -184 Z', RED, 3.5) + s('M2 -184 C-8 -196 -4 -206 6 -206 C2 -200 2 -194 6 -186 Z', RED_D, 3))
    o.append(s('M-22 -128 C-26 -150 -20 -180 0 -184 C20 -180 26 -150 22 -128 Z', AR))
    o.append(s('M-13 -132 C-15 -146 -12 -162 0 -164 C12 -162 15 -146 13 -132 Z', BONE, 3.5))
    for sx in (-1, 1):
        o.append(e(sx * 5.5, -151, 4.2, 5, K, 0) + c(sx * 5.5, -150.5, 1.9, GRN, 0))
    o.append(s('M0 -146 L-2 -141 H2 Z', K, 1.5) + ln('M-6 -136 H6 M-3 -138 V-133 M0 -138 V-133 M3 -138 V-133', K, 1.8))
    o.append(ln('M-22 -150 C-14 -146 14 -146 22 -150', ARD, 3))
    # tower shield on the viewer's right
    o.append(s('M14 -126 H64 V-56 C64 -36 50 -24 39 -20 C28 -24 14 -36 14 -56 Z', '#5E6A7A'))
    o.append(ln('M20 -120 H58 V-58 C58 -42 48 -32 39 -28 C30 -32 20 -42 20 -58 Z', GOLD_D, 3))
    o.append(skull(39, -84, 0.85, '#F0E8D2', False))
    o.append(ln('M30 -64 L48 -52 M48 -64 L30 -52', BONE, 4.5) + ln('M30 -64 L48 -52 M48 -64 L30 -52', K, 1.2))
    sprite('knight', (-70, -214, 140, 220), o, 'Sir Rattlebones')


# ---------------------------------------------------------------- the Gravekeeper
GK_COAT, GK_COAT_D, GK_SKIN, GK_SKIN_D = '#4E6B45', '#3F5A3A', '#A3B494', '#869A78'


def keeper_body(o):
    # boots
    o.append(s('M-58 -24 H-18 V0 H-66 C-68 -10 -64 -20 -58 -24 Z', '#3A2E2A') + s(m('M-58 -24 H-18 V0 H-66 C-68 -10 -64 -20 -58 -24 Z'), '#3A2E2A'))
    # coat
    o.append(s('M-66 -206 C-84 -150 -92 -80 -94 -22 L-8 -22 L0 -60 L8 -22 L94 -22 C92 -80 84 -150 66 -206 C30 -226 -30 -226 -66 -206 Z', GK_COAT))
    o.append(s('M-74 -86 L-52 -90 L-48 -66 L-72 -62 Z', '#7A6248', 3.5) + ln('M-70 -84 L-68 -66 M-58 -88 L-55 -66', K, 1.8))
    o.append(s('M50 -150 L72 -146 L70 -124 L48 -128 Z', PURP, 3.5) + ln('M54 -146 L52 -128 M66 -146 L64 -126', K, 1.8))
    o.append(ln('M-6 -206 L-8 -64 M6 -206 L8 -64', GK_COAT_D, 3.5))
    for y in (-180, -150, -120, -92):
        o.append(c(-14, y, 4, '#C9A040', 3))
    # belt with keys
    o.append(s('M-84 -104 C-30 -94 30 -94 84 -104 L84 -92 C30 -82 -30 -82 -84 -92 Z', '#3A2E2A'))
    o.append(s('M-10 -100 H10 V-84 H-10 Z', '#C9A040', 3.5))
    o.append(c(36, -80, 7, 'none', 3) + ln('M36 -73 L33 -58 M33 -62 L29 -62 M38 -74 L42 -60 M42 -64 L46 -64', '#C9A040', 3.2))


def keeper_head(o, cy=-236):
    # hood, face, big nose, white eyes with green pupils, thick brows, grey stubble
    o.append(s(f'M-50 {cy + 20} C-58 {cy - 26} -30 {cy - 62} 0 {cy - 64} C30 {cy - 62} 58 {cy - 26} 50 {cy + 20} C30 {cy + 34} -30 {cy + 34} -50 {cy + 20} Z', GK_COAT_D))
    o.append(s(f'M-34 {cy + 6} C-36 {cy - 30} -18 {cy - 46} 0 {cy - 46} C18 {cy - 46} 36 {cy - 30} 34 {cy + 6} C30 {cy + 26} 16 {cy + 34} 0 {cy + 34} C-16 {cy + 34} -30 {cy + 26} -34 {cy + 6} Z', GK_SKIN))
    o.append(s(f'M-22 {cy + 18} C-14 {cy + 32} 14 {cy + 32} 22 {cy + 18} C18 {cy + 30} 8 {cy + 36} 0 {cy + 36} C-8 {cy + 36} -18 {cy + 30} -22 {cy + 18} Z', '#C9CFC2', 3))
    for sx in (-1, 1):
        o.append(halo(sx * 13, cy - 8, 10, GRN, 0.35))
        o.append(e(sx * 13, cy - 8, 7.5, 9, '#FFFFFF', 3) + c(sx * 12, cy - 6, 3.3, '#3E7A1E', 0) + c(sx * 12, cy - 6, 1.5, GRN_L, 0))
    o.append(ln(f'M-25 {cy - 22} L-5 {cy - 15} M25 {cy - 22} L5 {cy - 15}', K, 5.5))
    o.append(s(f'M-6 {cy - 6} C-4 {cy + 8} -12 {cy + 16} -6 {cy + 20} C0 {cy + 23} 10 {cy + 18} 8 {cy + 10} C6 {cy + 4} 4 {cy - 2} 3 {cy - 6} Z', GK_SKIN_D, 3.5))
    o.append(ln(f'M-12 {cy + 26} C-4 {cy + 22} 6 {cy + 22} 14 {cy + 27}', K, 3.2) + s(f'M2 {cy + 23} L5 {cy + 30} L8 {cy + 24} Z', BONE, 2))


def keeper_lantern(o, x, y):
    o.append(halo(x, y + 26, 54, GRN, 0.22))
    o.append(ln(f'M{x} {y - 8} V{y + 4}', K, 3.5))
    o.append(s(f'M{x - 15} {y + 4} H{x + 15} L{x + 12} {y + 44} H{x - 12} Z', '#4A4458'))
    o.append(s(f'M{x - 8} {y + 10} H{x + 8} V{y + 38} H{x - 8} Z', '#E9FFD9', 2.5))
    o.append(s(f'M{x} {y + 14} C{x + 7} {y + 22} {x + 6} {y + 32} {x} {y + 36} C{x - 6} {y + 32} {x - 7} {y + 22} {x} {y + 14} Z', GRN, 2))
    o.append(s(f'M{x - 18} {y + 44} H{x + 18} L{x + 14} {y + 52} H{x - 14} Z', '#4A4458', 3.5) + s(f'M{x - 12} {y - 2} H{x + 12} L{x + 15} {y + 4} H{x - 15} Z', '#4A4458', 3.5))


def keeper():
    o = []
    # shovel planted on the viewer's left
    o.append(beam('M-106 -232 L-98 -44', WOOD, 9) + s('M-114 -244 H-96 V-232 H-114 Z', WOOD_D, 3.5))
    o.append(s('M-118 -50 H-78 L-80 -14 C-84 -2 -92 4 -98 6 C-104 4 -112 -2 -116 -14 Z', '#8E96A3') + s('M-116 -18 C-112 -6 -104 2 -98 4 C-92 2 -84 -6 -80 -18 Z', '#6B4A3A', 3))
    keeper_body(o)
    # right arm (viewer's left) down to the shovel
    o.append(s('M-64 -200 C-96 -186 -112 -160 -110 -128 L-86 -122 C-86 -148 -76 -166 -56 -176 Z', GK_COAT))
    o.append(c(-100, -128, 15, GK_SKIN) + ln('M-110 -132 L-90 -134 M-110 -124 L-90 -126', K, 2.2))
    # left arm (viewer's right) holding the lantern out
    o.append(s('M64 -200 C96 -190 112 -164 114 -136 L92 -128 C88 -152 78 -168 56 -176 Z', GK_COAT))
    o.append(c(104, -128, 14, GK_SKIN))
    keeper_lantern(o, 104, -112)
    keeper_head(o)
    sprite('keeper', (-140, -312, 280, 322), o, 'The Gravekeeper')


def keeper_smash():
    o = []
    keeper_body(o)
    # both arms up, shovel raised high over the head, blade back
    o.append(s('M-60 -204 C-74 -230 -60 -270 -30 -290 L-14 -274 C-36 -258 -44 -232 -38 -210 Z', GK_COAT))
    o.append(s('M60 -204 C74 -230 60 -270 30 -290 L14 -274 C36 -258 44 -232 38 -210 Z', GK_COAT))
    o.append(beam('M-70 -300 L76 -262', WOOD, 9))
    o.append(s('M66 -284 L104 -274 L100 -238 C96 -226 88 -220 82 -220 C76 -224 70 -232 68 -244 Z', '#8E96A3') + s('M70 -246 C74 -232 80 -224 84 -222 C90 -224 96 -230 99 -240 Z', '#6B4A3A', 3))
    o.append(c(-24, -284, 14, GK_SKIN) + c(26, -276, 14, GK_SKIN))
    keeper_head(o, -228)
    keeper_lantern(o, 64, -108)
    o.append(ln('M44 -128 L64 -116', K, 3.5))
    sprite('keeper_smash', (-140, -330, 280, 340), o, 'The Gravekeeper, shovel raised')


# ====================================================================== props
def pillar():
    o = []
    o.append(s('M-34 -26 H34 V0 H-34 Z', STONE) + s('M-34 -36 H34 V-26 H-34 Z', STONE_T, 3.5))
    o.append(s('M-23 -186 H23 V-36 H-23 Z', STONE) + ln('M-9 -182 V-40 M9 -182 V-40', STONE_D, 3))
    o.append(s('M-31 -196 H31 V-182 H-31 Z', STONE) + s('M-31 -206 H31 V-196 H-31 Z', STONE_T, 3.5))
    o.append(s('M-23 -120 C-12 -116 -2 -126 6 -118 C12 -112 20 -116 23 -112 V-100 C14 -104 6 -98 -2 -104 C-10 -110 -18 -104 -23 -106 Z', '#6E8A5A', 2.6))
    sprite('pillar', (-40, -212, 80, 216), o)


def coffin(opened=False):
    o = []
    lid = 'M-20 -98 H20 L30 -74 L20 -16 H-20 L-30 -74 Z'
    o.append(s('M-30 -74 L-20 -16 V0 L-30 -56 Z', STONE_D, 3.5) + s('M30 -74 L20 -16 V0 L30 -56 Z', STONE_D, 3.5) + s('M-20 -16 H20 V0 H-20 Z', STONE, 3.5))
    if opened:
        o.append(s('M-16 -92 H16 L24 -72 L16 -20 H-16 L-24 -72 Z', '#2A2234', 3.5))
        o.append(s('M-8 -40 L6 -54 L9 -51 L-5 -37 Z', BONE, 2.5) + skull(-2, -70, 0.5, GRN, False))
        o.append(s(f'M2 -108 H42 L52 -84 L42 -26 H2 L-8 -84 Z', STONE_T))
        o.append(ln('M22 -96 V-44 M10 -80 H34', STONE_D, 3.5))
    else:
        o.append(s(lid, STONE_T))
        o.append(ln('M0 -88 V-30 M-12 -72 H12', STONE_D, 3.5))
        o.append(c(0, -72, 6, STONE_T, 3))
    sprite('coffin_open' if opened else 'coffin', (-36, -114 if opened else -104, 94 if opened else 72, 120 if opened else 110), o)


def torch():
    o = [halo(0, -40, 34, FIRE, 0.16), halo(0, -40, 20, FIRE, 0.22)]
    o.append(s('M-4 -24 H4 L3 -6 H-3 Z', WOOD_D, 3) + s('M-8 -8 H8 V-2 H-8 Z', '#4A4458', 3))
    o.append(s('M0 -54 C10 -44 10 -32 0 -24 C-10 -32 -10 -44 0 -54 Z', FIRE, 3.2) + s('M0 -44 C5 -38 5 -31 0 -27 C-5 -31 -5 -38 0 -44 Z', FLAME, 0))
    sprite('torch', (-36, -78, 72, 80), o)


def candles():
    o = []
    for (x, h) in [(-14, 18), (0, 28), (13, 14)]:
        o.append(halo(x, -h - 8, 12, '#F4B942', 0.22))
        o.append(s(f'M{x - 5} 0 V{-h} H{x + 5} V0 Z', '#F1E6CF', 3))
        o.append(s(f'M{x} {-h - 13} C{x + 5} {-h - 7} {x + 4} {-h - 2} {x} {-h - 1} C{x - 4} {-h - 2} {x - 5} {-h - 7} {x} {-h - 13} Z', '#F4B942', 2.4))
    sprite('candles', (-26, -52, 52, 56), o)


def bones():
    o = []
    o.append(beam('M-18 -4 L10 -14', BONE, 4, 3) + c(-19, -3, 3, BONE, 2.5) + c(-17, -7, 3, BONE, 2.5) + c(10, -15, 3, BONE, 2.5) + c(12, -12, 3, BONE, 2.5))
    o.append(beam('M-6 -16 L14 -2', BONE, 4, 3) + c(-7, -17, 3, BONE, 2.5) + c(15, -1, 3, BONE, 2.5))
    o.append(skull(-16, -14, 0.42, '#1E1A1A', False))
    sprite('bones', (-26, -28, 46, 32), o)


def skullpile():
    o = []
    for (x, y) in [(-18, -6), (0, -4), (18, -6), (-9, -20), (9, -20), (0, -34)]:
        o.append(skull(x, y - 6, 0.62, '#1E1A1A', False))
    sprite('skullpile', (-30, -54, 60, 58), o)


def urn():
    o = [s('M-10 -40 H10 L8 -34 C18 -28 18 -8 10 0 H-10 C-18 -8 -18 -28 -8 -34 Z', '#B87A4B'), ln('M-15 -18 C-6 -14 6 -14 15 -18', '#8A5A34', 3), s('M-11 -44 H11 V-38 H-11 Z', '#8A5A34', 3)]
    sprite('urn', (-20, -48, 40, 52), o)


def banner():
    o = [s('M-22 -4 H22 V84 L14 76 L6 88 L-2 78 L-10 90 L-16 80 L-22 86 Z', PURP)]
    o.append(ln('M-16 -4 V76 M16 -4 V74', GOLD, 2.6))
    o.append(skull(0, 30, 0.7, PURP, False))
    o.append(s('M-26 -8 H26 V0 H-26 Z', WOOD_D, 3))
    sprite('banner', (-30, -12, 60, 106), o)


def tombstone(kind=0):
    o = []
    if kind == 0:
        o.append(s('M-18 -6 V-44 C-18 -62 18 -62 18 -44 V-6 Z', '#9A92A8') + s('M18 -44 C22 -42 24 -40 24 -36 V-2 L18 -6 Z', '#7D7590', 3))
        o.append(ln('M-6 -42 H6 M0 -48 V-24', '#6E6382', 3.2) + ln('M-10 -18 L-4 -26 L2 -20', '#6E6382', 2.4))
    elif kind == 1:
        o.append(s('M-5 -64 H5 V-48 H18 V-38 H5 V-6 H-5 V-38 H-18 V-48 H-5 Z', '#9A92A8'))
    else:
        o.append(s('M-20 -6 V-34 L-12 -40 L-4 -32 L6 -44 L20 -36 V-6 Z', '#9A92A8') + ln('M-8 -24 H8', '#6E6382', 3))
    o.append(s('M-26 -8 C-14 -12 14 -12 26 -8 C24 0 -24 0 -26 -8 Z', '#6B4A3A', 3))
    sprite(f'tomb{kind}', (-30, -70, 60, 74), o)


def grave():
    o = [s('M-32 -78 C-30 -92 30 -92 32 -78 C30 -70 -30 -70 -32 -78 Z', '#6B4A3A', 3.5)]
    o.append(s('M-26 -70 H26 L30 -6 H-30 Z', '#2A2234', 3.5) + ln('M-30 -6 H30', '#6B4A3A', 6))
    sprite('grave', (-36, -96, 72, 100), o)


def tree():
    o = []
    o.append(s('M-14 0 C-10 -40 -16 -80 -8 -120 L-30 -150 L-26 -154 L-4 -128 C-2 -140 0 -150 -6 -168 L-1 -170 C6 -152 6 -136 6 -124 L28 -150 L32 -146 L10 -116 C14 -80 8 -40 14 0 Z', '#6B5A70'))
    o.append(ln('M-2 -40 C0 -60 -2 -80 0 -96', '#4F4255', 3))
    o.append(s('M-24 -2 C-14 -8 14 -8 24 -2 C18 4 -18 4 -24 -2 Z', '#5A4A60', 3))
    sprite('tree', (-38, -176, 76, 182), o)


def chest(opened=False):
    o = []
    if opened:
        o.append(halo(0, -46, 44, GOLD, 0.3))
        o.append(s('M-34 -74 H34 L30 -40 H-30 Z', WOOD_D) + ln('M-30 -60 H30', '#4A4458', 4))
        o.append(s('M-30 -40 H30 L32 -32 H-32 Z', '#F2C230', 3.5) + c(-12, -40, 5, GOLD, 2.5) + c(4, -42, 5, GOLD, 2.5) + c(16, -38, 5, GOLD, 2.5))
    else:
        o.append(s('M-34 -46 C-34 -64 34 -64 34 -46 Z', WOOD) + ln('M-20 -60 V-46 M20 -60 V-46', '#4A4458', 4))
    o.append(s('M-36 -40 H36 V0 H-36 Z', WOOD) + ln('M-22 -40 V0 M22 -40 V0', '#4A4458', 4.5))
    o.append(s('M-38 -46 H38 V-38 H-38 Z', '#4A4458', 3.5))
    o.append(s('M-7 -38 H7 V-24 H-7 Z', GOLD, 3) + c(0, -31, 2, K, 0))
    sprite('chest_open' if opened else 'chest', (-44, -96 if opened else -70, 88, 100 if opened else 74), o)


def gate():
    o = [s('M-78 -150 H78 V-138 H-78 Z', '#4A4458', 3.5)]
    for x in range(-64, 70, 18):
        o.append(ln(f'M{x} -138 V0', K, 8) + ln(f'M{x} -138 V0', '#6E6A7A', 4.5))
        o.append(s(f'M{x - 5} -4 L{x} 6 L{x + 5} -4 Z', '#6E6A7A', 2.5))
    for y in (-100, -50):
        o.append(ln(f'M-74 {y} H74', K, 8) + ln(f'M-74 {y} H74', '#6E6A7A', 4.5))
    sprite('gate', (-82, -154, 164, 162), o)


def hand():
    o = [s('M-20 -4 C-12 -10 12 -10 20 -4 C16 2 -16 2 -20 -4 Z', '#6B4A3A', 3)]
    o.append(bone_limb('M0 -6 L-2 -26', 6))
    for (x1, y1, x2, y2) in [(-2, -26, -14, -44), (-2, -28, -6, -50), (0, -28, 4, -52), (2, -26, 12, -46)]:
        o.append(bone_limb(f'M{x1} {y1} L{x2} {y2}', 3.6))
    o.append(c(-2, -28, 6, BONE, 3) + c(-10, -8, 4, '#6B4A3A', 2.4) + c(12, -7, 3.5, '#6B4A3A', 2.4))
    sprite('hand', (-24, -58, 48, 62), o)


def cage():
    o = []
    for x in (-30, -15, 0, 15, 30):
        top = -98 + abs(x) * 0.9
        o.append(bone_limb(f'M{x} 0 C{x * 1.15} -40 {x * 0.9} {top + 20} {x * 0.4} {top}', 5))
    o.append(e(0, -2, 34, 6, 'none', 0))
    o.append(bone_limb('M-34 -2 C-20 4 20 4 34 -2', 5))
    o.append(skull(0, -104, 0.55, GRN, False))
    sprite('cage', (-42, -122, 84, 130), o)


def arch():
    o = [s('M-96 0 V-120 C-96 -186 96 -186 96 -120 V0 H72 V-118 C72 -160 -72 -160 -72 -118 V0 Z', STONE)]
    for a in range(1, 8):
        t = math.pi - a * math.pi / 8
        o.append(ln(f'M{f(72 * math.cos(t))} {f(-120 - 40 * math.sin(t))} L{f(96 * math.cos(t))} {f(-120 - 66 * math.sin(t))}', STONE_D, 3))
    o.append(s('M-12 -186 H12 L10 -160 H-10 Z', STONE_T, 3.5) + skull(0, -176, 0.42, GRN, False))
    sprite('arch', (-100, -194, 200, 198), o)


# ---------------------------------------------------------------- projectiles and bits
def projectiles():
    sprite('bolt_frost', (-18, -10, 36, 20), [halo(-2, 0, 10, FROST, 0.35), s('M16 0 L2 -6 L-14 0 L2 6 Z', FROST, 2.6), ln('M8 -1.5 L-2 -1.5', '#FFFFFF', 2)])
    sprite('arrow', (-22, -8, 44, 16), [ln('M-18 0 H12', K, 5) + ln('M-18 0 H12', WOOD, 2.4), s('M20 0 L10 -5 L12 0 L10 5 Z', STEEL_L, 2.2), s('M-20 -5 L-12 0 L-20 5 L-16 0 Z', '#F7F3EA', 2)])
    sprite('orb_holy', (-14, -14, 28, 28), [halo(0, 0, 13, '#F4B942', 0.35), c(0, 0, 6.5, GOLD, 2.6), c(-2, -2, 2, '#FFF6D0', 0)])
    sprite('orb_green', (-14, -14, 28, 28), [halo(0, 0, 13, GRN, 0.35), c(0, 0, 6.5, GRN, 2.6), c(-2, -2, 2, GRN_L, 0)])
    sprite('comet', (-46, -28, 80, 56), [halo(8, 0, 26, FROST, 0.3), s('M-42 -6 C-20 -12 -4 -16 6 -18 L4 18 C-6 14 -22 8 -42 6 Z', FROST_L, 0) , s('M28 0 C28 14 18 20 8 20 C-4 20 -10 12 -10 0 C-10 -12 -2 -20 10 -20 C20 -20 28 -12 28 0 Z', FROST, 3.5), s('M14 -10 L22 -2 L12 0 Z', '#FFFFFF', 1.6), ln('M-2 -6 L6 2 L-2 10', '#5BAAD8', 2.4)])
    sprite('shard_bone', (-12, -6, 24, 12), [beam('M-7 0 L7 0', BONE, 3.4, 2.6), c(-8, -1.5, 2.6, BONE, 2), c(-8, 1.5, 2.6, BONE, 2), c(8, -1.5, 2.6, BONE, 2), c(8, 1.5, 2.6, BONE, 2)])
    sprite('shard_skull', (-12, -12, 24, 24), [skull(0, -2, 0.5, K, False)])
    sprite('shard_ice', (-8, -8, 16, 16), [s('M0 -6 L5 0 L0 6 L-5 0 Z', FROST_L, 2)])
    sprite('shard_dirt', (-7, -7, 14, 14), [c(0, 0, 4.5, '#6B4A3A', 2.2)])
    sprite('flake', (-7, -7, 14, 14), [ln('M0 -5 V5 M-4.3 -2.5 L4.3 2.5 M-4.3 2.5 L4.3 -2.5', '#1E1A1A', 3.6) + ln('M0 -5 V5 M-4.3 -2.5 L4.3 2.5 M-4.3 2.5 L4.3 -2.5', '#FFFFFF', 1.8)])


def build():
    tank_front(); tank_back(); healer_front(); healer_back(); dps_front(); dps_back()
    rattler(); rattler(True); archer(); brute(); caller(); wisp(); knight(); keeper(); keeper_smash()
    pillar(); coffin(); coffin(True); torch(); candles(); bones(); skullpile(); urn(); banner()
    tombstone(0); tombstone(1); tombstone(2); grave(); tree(); chest(); chest(True); gate(); hand(); cage(); arch()
    projectiles()
    return SPRITES


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    sp = build()
    json.dump({k: {'svg': v['svg'], 'vb': v['vb']} for k, v in sp.items()}, open(OUT + 'sprites.json', 'w'))
    cells = []
    for k, v in sp.items():
        x, y, w, h = v['vb']
        sc = 1.6 if max(w, h) < 140 else (1.0 if max(w, h) < 240 else 0.75)
        cells.append(f'<figure style="margin:0;display:flex;flex-direction:column;align-items:center;gap:4px">'
                     f'<div style="background:#5C5070;padding:8px;border-radius:8px"><img src="data:image/svg+xml;charset=utf-8,{__import__("urllib.parse").parse.quote(v["svg"])}" style="width:{w * sc:.0f}px;height:{h * sc:.0f}px;display:block"></div>'
                     f'<figcaption style="font:12px monospace;color:#ddd">{k}</figcaption></figure>')
    open(OUT + '_sprites_preview.html', 'w').write('<body style="margin:0;padding:16px;background:#2A2234"><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;width:1500px">' + ''.join(cells) + '</div></body>')
    print('sprites', len(sp), 'bytes', sum(len(v['svg']) for v in sp.values()))
