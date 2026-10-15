import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# The Vale: Bramblewick Hollow and riding out. Mounts, pets, trophies, the bunting, Dottle the gnome,
# the cauldron, the hollow's buildings and plants, the errand bits, and icon tiles for ingredients,
# brews, skills and collectibles. Same locked TV-cartoon style: one black line, flat colour, every
# sprite drawn around its ground point (0, 0).
# Usage: python3 tools/art_vale.py -> art/vale.json, art/vale_icons.json, art/_vale_preview.html
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from art_sprites import (K, s, ln, beam, c, e, halo, m, both, f,
                         BONE, GRN, GRN_L, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, RED, RED_D,
                         BLUE, BLUE_D, WOOD, WOOD_D, PURP, PURP_D, STONE, STONE_T, STONE_D, FROST, FROST_L, FIRE, FLAME)
from art_hearth import lantern_parts

OUT = HF_ROOT + '/art/'
SP = {}
ICONS = {}

SKIN, SKIN_D = '#F2B48C', '#E0956C'
GOAT, GOAT_D, GOAT_L = '#EFE3C8', '#CDBB98', '#FFF8EC'
HORN, HORN_D = '#C9A27A', '#9E7A55'
HOOF = '#4A3A30'
HARE, HARE_D, HARE_L = '#B08A66', '#8A6A4A', '#EDE0C8'
PETAL, PETAL_D = '#EAF2FF', '#B8CCF5'
STEM, LEAF, LEAF_D = '#5E9A4A', '#7DBE5C', '#4E8A3E'
CAP, CAP_D, CAP_L = '#9BE15D', '#6FBF4A', '#E9FFD9'
BERRY, BERRY_L = '#4A2A5A', '#8A5AA8'
BRANCH = '#6B4528'
COPPER, COPPER_D = '#D9823C', '#B0612A'
HAIR, HAIR_D = '#D9572A', '#B0411E'
IRON, IRON_D = '#4A4458', '#36323F'
GRASS, GRASS_D, GRASS_L = '#6DAE4E', '#4E8A3E', '#8FCB66'


def sprite(name, vb, body):
    x, y, w, h = vb
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
           + ''.join(body) + '</svg>')
    SP[name] = {'svg': svg, 'vb': [x, y, w, h]}


def icon(name, bg, body, k=1.0, dx=0, dy=0, ground=56):
    inner = ''.join(body)
    ICONS[name] = (f'<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" style="fill: {bg}"/>'
                   f'<g transform="translate({f(32 + dx)} {f(ground + dy)}) scale({f(k)})">{inner}</g></svg>')


def eye(x, y, r=4.2, look=(0.6, 0.4), lid=None):
    o = c(x, y, r, '#FFFFFF', 2.4) + c(x + look[0] * r * 0.4, y + look[1] * r * 0.4, r * 0.48, K, 0) + c(x + look[0] * r * 0.4 - r * 0.18, y + look[1] * r * 0.4 - r * 0.2, r * 0.16, '#FFFFFF', 0)
    if lid:
        o += s(f'M{f(x - r - 0.6)} {f(y - 0.4)} C{f(x - r)} {f(y - r * 1.5)} {f(x + r)} {f(y - r * 1.5)} {f(x + r + 0.6)} {f(y - 0.4)} Z', lid, 2.2)
    return o


# ================================================================ mounts
def goat(saddle=True):
    o = []
    # far legs, darker
    for x in (-40, 30):
        o.append(beam(f'M{x} -52 L{x - 2} -10', GOAT_D, 9, 4) + s(f'M{x - 9} -12 H{x + 5} L{x + 4} 0 H{x - 9} Z', HOOF, 3))
    # tail tuft
    o.append(s('M-62 -84 C-74 -92 -76 -104 -70 -110 C-66 -100 -60 -96 -54 -94 Z', GOAT, 3.5))
    # shaggy barrel body
    body = ('M-62 -80 C-64 -98 -46 -108 -20 -108 C6 -108 32 -106 48 -98 C60 -92 64 -80 60 -66 C58 -58 54 -54 50 -50 '
            'L44 -42 L38 -50 L28 -42 L20 -50 L10 -42 L0 -50 L-10 -42 L-20 -50 L-30 -42 L-40 -50 L-48 -44 L-54 -54 C-62 -60 -62 -70 -62 -80 Z')
    o.append(s(body, GOAT, 4))
    for (x, y) in ((-44, -92), (-26, -96), (-6, -98), (14, -96), (34, -92), (-36, -72), (-14, -70), (8, -72), (30, -70), (46, -76)):
        o.append(ln(f'M{x} {y} C{x + 3} {y + 5} {x + 2} {y + 9} {x - 1} {y + 12}', GOAT_D, 2.6))
    # saddle blanket and saddle (Dottle's goats at home go without)
    if saddle:
        o.append(s('M-34 -104 C-30 -114 18 -114 22 -104 L26 -80 C10 -74 -26 -74 -38 -80 Z', RED, 3.5))
        o.append(ln('M-34 -82 C-20 -77 10 -77 24 -83', GOLD, 3))
        o.append(s('M-24 -112 C-22 -122 12 -122 14 -112 L12 -102 H-22 Z', '#7A4A2A', 3.5))
        o.append(s('M8 -124 C8 -132 16 -132 16 -124 L14 -112 H8 Z', '#7A4A2A', 3))
    # near legs
    for x in (-32, 38):
        o.append(beam(f'M{x} -52 L{x + 1} -10', GOAT, 9.5, 4) + s(f'M{x - 7} -12 H{x + 8} L{x + 8} 0 H{x - 8} Z', HOOF, 3))
        o.append(ln(f'M{x - 3} -40 C{x} -36 {x + 3} -36 {x + 5} -40', GOAT_D, 2.4))
    # neck and head, looking forward, a little smug
    o.append(s('M40 -96 C48 -108 56 -118 66 -124 L80 -104 C70 -98 62 -92 56 -84 Z', GOAT, 3.5))
    head = 'M60 -128 C62 -142 82 -146 92 -136 C100 -128 108 -116 108 -106 C108 -98 102 -94 94 -96 C84 -98 76 -102 70 -108 C62 -114 58 -120 60 -128 Z'
    o.append(s(head, GOAT, 4))
    o.append(s('M84 -98 C88 -88 86 -76 80 -70 C76 -78 74 -88 76 -98 Z', GOAT_L, 3))  # beard
    o.append(s('M100 -110 C104 -108 106 -104 104 -101 C101 -101 98 -104 98 -108 Z', '#E0B8A0', 2.2))  # nose
    o.append(eye(84, -124, 5.2, (0.7, 0.2), lid=GOAT))
    o.append(ln('M78 -134 L90 -130', K, 3))  # a stubborn brow
    o.append(s('M66 -128 C56 -132 48 -128 44 -122 C52 -122 58 -122 64 -120 Z', GOAT_D, 3))  # ear
    # curly horns
    o.append(beam('M70 -138 C60 -150 44 -150 40 -138 C38 -128 48 -122 54 -128 C58 -132 54 -138 50 -136', HORN, 7, 4))
    for (x, y) in ((62, -146), (50, -146), (42, -134)):
        o.append(ln(f'M{x - 3} {y - 3} L{x + 2} {y + 2}', HORN_D, 2.2))
    o.append(beam('M82 -140 C84 -152 94 -156 100 -150', HORN, 6, 4))
    # collar and bell
    o.append(s('M56 -94 C62 -102 72 -106 80 -104 L82 -96 C72 -98 64 -94 58 -88 Z', BLUE, 3))
    o.append(s('M66 -92 C66 -84 74 -84 74 -92 Z', GOLD, 3) + c(70, -83, 2, K, 0))
    if not saddle:
        sprite('goat', (-80, -160, 196, 166), o)
        return
    sprite('mount_goat', (-80, -160, 196, 166), o)
    icon('c_goat', '#4E9A4A', o, k=0.34, dx=-4, ground=58)


def hare():
    o = []
    # far legs
    o.append(s('M-46 -40 C-56 -30 -62 -14 -58 -2 H-30 C-30 -12 -36 -24 -30 -36 Z', HARE_D, 3.5))
    o.append(beam('M34 -50 L38 -8', HARE_D, 8, 4) + e(40, -4, 9, 5, HARE_D, 3))
    # tail
    o.append(c(-70, -70, 12, HARE_L, 3.5))
    # body
    o.append(s('M-66 -66 C-70 -96 -40 -112 -6 -110 C24 -108 48 -98 56 -80 C62 -66 58 -50 46 -44 C30 -36 -10 -36 -36 -40 C-54 -44 -64 -52 -66 -66 Z', HARE, 4))
    o.append(s('M-30 -44 C-10 -40 22 -40 40 -46 C40 -56 30 -62 16 -62 C-2 -62 -22 -56 -30 -44 Z', HARE_L, 3))  # belly
    # saddle, small, with a thistle tuft
    o.append(s('M-30 -106 C-26 -116 16 -116 20 -106 L22 -88 C8 -84 -22 -84 -34 -88 Z', PURP, 3.5))
    o.append(ln('M-30 -90 C-16 -86 6 -86 20 -90', GOLD, 3))
    o.append(s('M-22 -114 C-20 -122 8 -122 10 -114 L8 -106 H-20 Z', '#7A4A2A', 3.5))
    o.append(ln('M-30 -110 L-38 -124', '#5E9A4A', 3) + c(-39, -128, 5.5, '#B88AD8', 3))
    # near legs: a big back foot
    o.append(s('M-50 -60 C-30 -66 -16 -54 -18 -36 C-20 -24 -14 -10 -2 -6 L0 0 H-60 C-64 -12 -60 -22 -56 -30 C-62 -40 -60 -54 -50 -60 Z', HARE, 4))
    o.append(ln('M-48 -6 V0 M-38 -6 V0', HARE_D, 2.4))
    o.append(beam('M44 -52 L46 -8', HARE, 8.5, 4) + e(48, -4, 10, 5.5, HARE, 3))
    # head and ears
    o.append(s('M40 -96 C46 -116 64 -126 82 -122 C98 -118 108 -104 104 -90 C100 -78 86 -74 72 -76 C56 -78 42 -84 40 -96 Z', HARE, 4))
    o.append(s('M60 -118 C52 -142 54 -166 64 -170 C72 -166 74 -142 70 -120 Z', HARE, 3.5) + s('M62 -124 C58 -142 60 -158 64 -162 C68 -156 68 -140 66 -124 Z', '#F2B6A8', 2))
    o.append(s('M74 -118 C80 -138 94 -150 104 -148 C106 -140 96 -128 84 -116 Z', HARE, 3.5))  # the floppy one
    o.append(eye(86, -104, 5.5, (0.6, 0.3)))
    o.append(e(103, -92, 3.6, 3, '#E08A8A', 2.2))
    o.append(ln('M100 -86 C98 -82 94 -82 92 -84 M104 -90 L118 -92 M104 -88 L116 -84', K, 2))
    sprite('mount_hare', (-90, -176, 214, 182), o)
    icon('c_hare', '#6A4BA3', o, k=0.3, dx=-6, ground=58)


# ================================================================ pets
def rootling(scream=True):
    o = [e(0, -2, 22, 5, '#000000', 0).replace('fill: #000000', 'fill: #000000; opacity: 0.18')]
    # little root feet
    o.append(beam('M-8 -14 C-12 -6 -14 -2 -18 0', '#E8D5B8', 3.5, 3) + beam('M8 -14 C12 -6 14 -2 18 0', '#E8D5B8', 3.5, 3))
    # the root body: a turnip, purple shoulders, cream below
    body = 'M0 -10 C-18 -10 -26 -26 -26 -42 C-26 -60 -14 -70 0 -70 C14 -70 26 -60 26 -42 C26 -26 18 -10 0 -10 Z'
    o.append(s(body, '#F3E6CC', 4))
    o.append(s('M-26 -46 C-26 -62 -14 -70 0 -70 C14 -70 26 -62 26 -46 C16 -52 -16 -52 -26 -46 Z', '#9A6AC0', 3.5))
    o.append(ln('M-16 -24 C-14 -20 -10 -18 -6 -18 M14 -30 C14 -26 12 -24 10 -22', '#D8C6A4', 2.2))
    # leaves for hair
    o.append(s('M-2 -70 C-14 -84 -16 -96 -8 -100 C-2 -92 0 -82 0 -70 Z', LEAF, 3))
    o.append(s('M2 -70 C10 -88 22 -94 28 -90 C24 -80 14 -74 2 -70 Z', LEAF, 3))
    o.append(s('M0 -70 C-2 -84 2 -94 8 -98 C10 -88 6 -78 0 -70 Z', LEAF_D, 2.6))
    # arms up, mid-scream
    o.append(beam('M-24 -36 C-32 -42 -34 -50 -32 -56', '#F3E6CC', 3.5, 3) + beam('M24 -36 C32 -42 34 -50 32 -56', '#F3E6CC', 3.5, 3))
    o.append(eye(-9, -44, 4.6, (0, -0.2)) + eye(9, -44, 4.6, (0, -0.2)))
    if scream:
        o.append(e(0, -30, 6, 7.5, '#5A2A2A', 2.6) + e(0, -27, 3.5, 2.6, '#E07A7A', 0))
    else:
        o.append(ln('M-5 -31 C-2 -28 2 -28 5 -31', K, 2.4))
    o.append(e(-16, -34, 3.6, 2.2, '#F2A8A8', 0) + e(16, -34, 3.6, 2.2, '#F2A8A8', 0))
    return o


def puffcap():
    o = [halo(0, -60, 34, GRN, 0.25)]
    o.append(e(0, -2, 20, 5, 'none', 0))
    o.append(beam('M-8 -14 L-12 0', '#E8D5B8', 4, 3) + beam('M8 -14 L12 0', '#E8D5B8', 4, 3))
    o.append(e(-13, 0, 6, 3.5, '#E8D5B8', 2.6) + e(13, 0, 6, 3.5, '#E8D5B8', 2.6))
    o.append(s('M-14 -14 C-16 -30 -14 -44 -10 -52 H10 C14 -44 16 -30 14 -14 C8 -10 -8 -10 -14 -14 Z', '#F0E8D2', 4))
    o.append(eye(-6, -32, 3.8, (0, 0.3), lid='#F0E8D2') + eye(6, -32, 3.8, (0, 0.3), lid='#F0E8D2'))
    o.append(ln('M-3 -22 C-1 -20 1 -20 3 -22', K, 2.2))
    o.append(s('M-34 -52 C-34 -78 -18 -90 0 -90 C18 -90 34 -78 34 -52 C22 -46 -22 -46 -34 -52 Z', CAP, 4))
    for (x, y, r) in ((-18, -66, 5), (2, -78, 6), (18, -62, 4.5), (-4, -60, 3.5)):
        o.append(c(x, y, r, CAP_L, 2.2))
    o.append(ln('M-24 -74 C-18 -82 -10 -86 -2 -86', '#FFFFFF', 2.4))
    for (x, y) in ((-28, -96), (24, -100), (34, -84)):
        o.append(c(x, y, 2.4, CAP_L, 0))
    return o


def thimble():
    o = [e(0, -2, 30, 6, 'none', 0)]
    o.append(e(-14, -6, 6, 4, '#E8D5B8', 2.6) + e(14, -6, 6, 4, '#E8D5B8', 2.6))
    # spiky back
    spikes = 'M-34 -14 C-38 -22 -36 -30 -40 -34 L-30 -36 L-32 -46 L-20 -44 L-18 -56 L-8 -50 L0 -60 L6 -50 L16 -56 L18 -44 L28 -42 C30 -32 32 -22 30 -14 Z'
    o.append(s(spikes, '#7A5238', 4))
    for (x, y) in ((-24, -30), (-10, -40), (6, -42), (18, -30), (-14, -24)):
        o.append(ln(f'M{x} {y} L{x + 3} {y - 6}', '#5A3A28', 2.2))
    # berries stuck in the spines
    o.append(c(-20, -40, 4.5, BERRY, 2.4) + c(10, -48, 4, BERRY, 2.4) + c(-4, -48, 3.4, BERRY_L, 2.2))
    # face, sleepy smile
    o.append(s('M16 -12 C14 -24 22 -32 34 -30 C44 -28 48 -20 46 -14 C40 -10 26 -8 16 -12 Z', '#F0DFC2', 3.5))
    o.append(c(47, -18, 3.4, K, 0))
    o.append(ln('M28 -22 C30 -24 33 -24 35 -22', K, 2.4))
    o.append(ln('M34 -14 C36 -12 39 -12 41 -14', K, 2))
    o.append(e(30, -15, 3, 1.8, '#F2A8A8', 0))
    return o


def pets():
    r = rootling(); sprite('pet_rootling', (-36, -104, 72, 108), r); icon('c_rootling', '#6A4BA3', r, k=0.56, ground=60)
    sprite('pet_rootling_calm', (-36, -104, 72, 108), rootling(False))
    p = puffcap(); sprite('pet_puffcap', (-40, -104, 80, 108), p); icon('c_puffcap', '#2F5A3A', p, k=0.54, ground=60)
    t = thimble(); sprite('pet_thimble', (-44, -64, 96, 68), t); icon('c_thimble', '#7A4A5A', t, k=0.66, dx=-4, ground=50)


# ================================================================ trophies and the bunting
def pressed():
    o = [s('M-18 0 L-20 -8 H20 L18 0 Z', WOOD_D, 3)]
    o.append(halo(0, -34, 22, PETAL_D, 0.35))
    o.append(s('M-18 -60 H18 V-8 H-18 Z', WOOD, 3.5) + s('M-12 -54 H12 V-14 H-12 Z', '#F3E6CC', 2.5))
    o.append(ln('M0 -18 C-1 -26 1 -32 0 -38', STEM, 2.4) + s('M0 -26 C-6 -26 -8 -30 -7 -32 C-3 -32 -1 -30 0 -26 Z', LEAF, 1.8))
    for k in range(5):
        a = math.radians(k * 72 - 90)
        o.append(e(6 * math.cos(a), -42 + 6 * math.sin(a), 4.6, 4.6, '#DCE4F5', 1.8))
    o.append(c(0, -42, 3, GOLD, 1.6))
    return o


def glowjar():
    o = [halo(0, -30, 24, GRN, 0.35)]
    o.append(s('M-14 -46 C-18 -40 -18 -10 -14 -4 C-10 0 10 0 14 -4 C18 -10 18 -40 14 -46 Z', '#DFF5EE', 3.5))
    o.append(s('M-8 -18 C-10 -24 -4 -30 2 -28 C6 -26 8 -20 4 -16 Z', CAP, 2.2) + ln('M-2 -16 V-8', '#F0E8D2', 2.6))
    o.append(s('M0 -32 C-2 -38 6 -42 10 -38 C12 -34 10 -30 6 -30 Z', CAP, 2.2) + ln('M6 -30 V-22', '#F0E8D2', 2.2))
    o.append(ln('M-10 -40 C-11 -30 -11 -20 -10 -12', '#FFFFFF', 2.2))
    o.append(s('M-12 -54 H12 V-46 H-12 Z', '#B88A5A', 3) + s('M-15 -48 H15 V-44 H-15 Z', '#8A6A4A', 2.5))
    return o


def crown():
    o = [s('M-22 0 C-24 -8 -18 -12 0 -12 C18 -12 24 -8 22 0 Z', PURP, 3)]
    o.append(c(-22, -2, 2.4, GOLD, 1.4) + c(22, -2, 2.4, GOLD, 1.4))
    ring = 'M-18 -16 C-18 -24 18 -24 18 -16 C18 -10 -18 -10 -18 -16 Z'
    o.append(s(ring, BRANCH, 4))
    for (x, top) in ((-14, -40), (-4, -46), (6, -44), (15, -36)):
        o.append(beam(f'M{x} -18 C{x - 3} {top + 10} {x + 3} {top + 4} {x} {top}', BRANCH, 3.5, 3))
        o.append(s(f'M{x - 1} {top + 6} L{x - 6} {top + 4} L{x - 1} {top + 10} Z', '#4A3020', 1.6))
    o.append(c(-10, -28, 4, BERRY, 2.2) + c(8, -32, 4.4, BERRY, 2.2) + c(0, -22, 3.4, BERRY_L, 2) + c(15, -24, 3, BERRY, 2))
    o.append(s('M-6 -40 C-12 -44 -12 -50 -8 -52 C-6 -48 -4 -46 -4 -42 Z', LEAF, 2))
    return o


def kettle(walk=False):
    o = []
    leg = (lambda x, d: beam(f'M{x} -10 L{x + d} 0', '#B88A3A', 3, 3) + e(x + d, 0, 4, 2, '#B88A3A', 2)) if walk else (lambda x, d: '')
    o.append(leg(-10, -4) + leg(10, 4))
    o.append(s('M-22 -10 C-26 -30 -16 -44 0 -44 C16 -44 26 -30 22 -10 C16 -6 -16 -6 -22 -10 Z', COPPER, 4))
    o.append(ln('M-14 -32 C-10 -38 -4 -40 2 -40', '#F2B07A', 2.6))
    o.append(s('M20 -26 C30 -28 36 -36 38 -44 L42 -42 C40 -30 32 -20 22 -16 Z', COPPER, 3))  # spout
    o.append(ln('M-12 -44 C-14 -58 14 -58 12 -44', K, 7) + ln('M-12 -44 C-14 -58 14 -58 12 -44', '#3A3348', 3.5))  # handle
    o.append(s('M-6 -46 C-6 -50 6 -50 6 -46 Z', COPPER_D, 2.6) + c(0, -50, 2.8, COPPER_D, 2))
    # the wind-up key in its side
    o.append(beam('M-22 -24 L-30 -24', STEEL_D, 3, 3) + s('M-30 -32 C-38 -32 -38 -16 -30 -16 Z', STEEL_L, 2.6))
    o.append(eye(-6, -26, 3.2, (0.6, 0)) + eye(6, -26, 3.2, (0.6, 0))) if walk else None
    return [x for x in o if x]


def bunting():
    o = [beam('M-46 6 H46', WOOD, 5, 3.5) + c(-48, 6, 4.5, GOLD, 2.5) + c(48, 6, 4.5, GOLD, 2.5)]
    cols = ['#C8403F', '#E7B53C', '#4F86C6', '#6FBF4A', '#B88AD8', '#E07A2E']
    for row, (y0, sag, n) in enumerate(((10, 26, 5), (52, 22, 5), (92, 18, 4))):
        pts = []
        for i in range(n + 1):
            t = i / n
            x = -44 + 88 * t
            y = y0 + sag * 4 * t * (1 - t)
            pts.append((x, y))
        o.append(ln('M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts), K, 2.4))
        for i in range(n):
            (x1, y1), (x2, y2) = pts[i], pts[i + 1]
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            col = cols[(i + row * 2) % len(cols)]
            o.append(s(f'M{f(x1 + 2)} {f(y1 + 1)} L{f(x2 - 2)} {f(y2 + 1)} L{f(mx)} {f(my + 22)} Z', col, 2.6))
            if (i + row) % 2 == 0:
                o.append(ln(f'M{f(mx - 5)} {f(my + 6)} H{f(mx + 5)}', '#FFFFFF', 1.8))
    return o


def trophies():
    sprite('tr_pressed', (-24, -66, 48, 70), pressed()); icon('c_pressed', '#3A4A6A', pressed(), k=0.86, ground=60)
    sprite('tr_glowjar', (-26, -66, 52, 70), glowjar()); icon('c_glowjar', '#2F5A3A', glowjar(), k=0.9, ground=60)
    sprite('tr_crown', (-28, -56, 56, 60), crown()); icon('c_crown', '#5A3A5A', crown(), k=1.0, ground=54)
    sprite('tr_kettle', (-42, -62, 88, 66), kettle()); icon('c_kettle', '#4F86C6', kettle(), k=0.86, dx=-1, ground=56)
    sprite('kettle_walk', (-42, -62, 88, 66), kettle(True))
    sprite('tr_bunting', (-56, -4, 112, 140), bunting()); icon('c_bunting', '#3A3150', bunting(), k=0.42, ground=4)


# ================================================================ Dottle Gearpatch, inventor
def gnome():
    o = []
    # feet and little body
    o.append(e(-8, -3, 8, 4, '#5A3A2A', 3) + e(8, -3, 8, 4, '#5A3A2A', 3))
    o.append(s('M-18 -6 C-20 -20 -16 -38 -10 -44 H10 C16 -38 20 -20 18 -6 Z', '#4E9A4A', 4))  # dress
    o.append(s('M-10 -8 C-12 -20 -10 -32 -6 -40 H6 C10 -32 12 -20 10 -8 Z', '#E9DDCB', 3))  # apron
    o.append(s('M-6 -24 H6 V-16 H-6 Z', '#C9B79A', 2.2))  # pocket
    o.append(beam('M3 -22 L8 -34', STEEL_D, 2.4, 2.4))  # screwdriver in the pocket
    # arms: one holds a spanner
    o.append(beam('M-12 -40 C-20 -36 -24 -30 -24 -24', '#4E9A4A', 6, 3.5) + c(-24, -22, 4.5, SKIN, 3))
    o.append(beam('M12 -40 C20 -38 26 -44 28 -50', '#4E9A4A', 6, 3.5) + c(29, -52, 4.5, SKIN, 3))
    o.append(beam('M30 -56 L35 -74', STEEL, 4, 3) + c(36, -79, 6.5, STEEL, 2.8) + s('M34 -88 H39 V-80 H34 Z', '#3B2C3A', 0))
    # big head, sail ears, turnip nose
    o.append(s('M-22 -62 C-34 -66 -42 -76 -40 -86 C-32 -84 -26 -78 -22 -72 Z', SKIN, 3.5))
    o.append(s(m('M-22 -62 C-34 -66 -42 -76 -40 -86 C-32 -84 -26 -78 -22 -72 Z'), SKIN, 3.5))
    o.append(c(0, -70, 24, SKIN, 4))
    # hair in two buns
    o.append(c(-20, -92, 9, HAIR, 3.5) + c(20, -92, 9, HAIR, 3.5))
    o.append(s('M-22 -78 C-24 -96 -12 -100 0 -100 C12 -100 24 -96 22 -78 C14 -86 -14 -86 -22 -78 Z', HAIR, 3.5))
    # leather cap with a brass gear
    o.append(s('M-16 -90 C-14 -102 14 -102 16 -90 C8 -94 -8 -94 -16 -90 Z', '#8A5A34', 3))
    gear = 'M0 -104 L2 -102 L5 -102 L5 -99 L7 -97 L5 -95 L5 -92 L2 -92 L0 -90 L-2 -92 L-5 -92 L-5 -95 L-7 -97 L-5 -99 L-5 -102 L-2 -102 Z'
    o.append(s(gear, GOLD, 1.8) + c(0, -97, 1.6, '#8A5A34', 0))
    # round spectacles, eyes, nose, grin
    o.append(c(-9, -72, 7.5, '#FFFFFF', 3) + c(9, -72, 7.5, '#FFFFFF', 3) + ln('M-1.5 -72 H1.5', GOLD_D, 2.4))
    o.append(c(-8, -71, 2.6, K, 0) + c(10, -71, 2.6, K, 0))
    o.append(ln('M-9 -72 m-7.5 0 a7.5 7.5 0 1 0 15 0 a7.5 7.5 0 1 0 -15 0 M9 -72 m-7.5 0 a7.5 7.5 0 1 0 15 0 a7.5 7.5 0 1 0 -15 0', GOLD_D, 2))
    o.append(s('M-5 -64 C-8 -58 -4 -52 0 -52 C4 -52 8 -58 5 -64 C2 -66 -2 -66 -5 -64 Z', '#E8977A', 2.8))
    o.append(s('M-10 -54 C-6 -48 6 -48 10 -54 C6 -52 -6 -52 -10 -54 Z', '#7A2A2A', 2.2))
    o.append(e(-15, -60, 4, 2.6, '#F2A8A8', 0) + e(15, -60, 4, 2.6, '#F2A8A8', 0))
    sprite('npc_gnome', (-46, -110, 92, 116), o)


# ================================================================ the cauldron
def cauldron_parts(liquid='#9BE15D', k=1.0, fire=True):
    o = []
    if fire:
        o.append(beam('M-50 -6 L40 -12', WOOD_D, 9, 3.5) + beam('M-40 -12 L50 -4', WOOD, 9, 3.5))
        o.append(s('M-26 -10 C-28 -26 -16 -32 -10 -40 C-6 -30 0 -28 4 -36 C8 -28 18 -24 22 -10 Z', FIRE, 3) + s('M-14 -10 C-14 -18 -8 -22 -4 -28 C-2 -20 4 -18 8 -22 C10 -16 12 -12 10 -10 Z', FLAME, 2.4))
    o.append(beam('M-40 -30 L-48 -10', IRON, 5, 3.5) + beam('M40 -30 L48 -10', IRON, 5, 3.5))
    body = 'M-58 -88 C-62 -60 -52 -34 -30 -26 C-12 -20 12 -20 30 -26 C52 -34 62 -60 58 -88 Z'
    o.append(s(body, IRON, 4.5))
    o.append(ln('M-46 -74 C-46 -58 -38 -44 -26 -38', '#6A6478', 3))
    o.append(e(0, -88, 60, 14, IRON_D, 4.5))
    o.append(e(0, -88, 50, 9, liquid, 3))
    o.append(c(-18, -90, 5, '#FFFFFF', 0).replace('fill: #FFFFFF', 'fill: #FFFFFF; opacity: 0.5') + c(14, -86, 3.6, '#FFFFFF', 0).replace('fill: #FFFFFF', 'fill: #FFFFFF; opacity: 0.4'))
    o.append(c(-24, -96, 4, liquid, 2.4) + c(20, -98, 5, liquid, 2.4) + c(2, -104, 3, liquid, 2))
    o.append(ln('M-62 -86 C-70 -86 -72 -76 -64 -74 M62 -86 C70 -86 72 -76 64 -74', K, 3.5))
    return o


def cauldron():
    sprite('cauldron', (-74, -112, 148, 118), cauldron_parts())
    icon('s_brew', '#6A4BA3', cauldron_parts(fire=False), k=0.48, ground=56)


# ================================================================ Bramblewick: buildings, plants, errand bits
def burrow(door='#4F86C6'):
    o = []
    hill = 'M-150 0 C-150 -70 -110 -150 0 -158 C110 -150 150 -70 150 0 Z'
    o.append(s(hill, GRASS, 4.5))
    o.append(ln('M-112 -110 C-96 -128 -70 -142 -40 -148', GRASS_L, 4))
    for (x, y) in ((-120, -40), (-96, -96), (110, -60), (84, -116), (126, -24)):
        o.append(ln(f'M{x} {y} l-4 -8 M{x} {y} l0 -10 M{x} {y} l4 -8', GRASS_D, 2.4))
    # round door in a stone arch
    o.append(c(0, -54, 48, STONE_T, 4))
    for k in range(9):
        a = math.radians(180 + k * 22.5)
        o.append(ln(f'M{f(40 * math.cos(a))} {f(-54 + 40 * math.sin(a))} L{f(48 * math.cos(a))} {f(-54 + 48 * math.sin(a))}', STONE_D, 2.4))
    o.append(s('M-40 0 V-54 C-40 -110 40 -110 40 -54 V0 Z', door, 4))
    for x in (-24, -8, 8, 24):
        o.append(ln(f'M{x} -88 V-4', '#1E1A1A', 1.6))
    o.append(c(0, -48, 6, GOLD, 3) + c(0, -48, 2, GOLD_D, 0))
    o.append(s('M-58 0 H58 L52 -8 H-52 Z', STONE_D, 3))
    # little round window and a chimney pipe
    o.append(c(88, -88, 16, '#F4B942', 4) + ln('M72 -88 H104 M88 -104 V-72', WOOD_D, 3))
    o.append(s('M-86 -150 H-70 V-118 H-86 Z', COPPER, 3.5) + s('M-92 -158 H-64 V-148 H-92 Z', COPPER_D, 3))
    return o


def windmill():
    o = []
    o.append(s('M-46 0 L-34 -190 H34 L46 0 Z', '#E9DDCB', 4.5))
    for y in (-40, -80, -120, -160):
        o.append(ln(f'M{-46 + (y / -190) * 12 + 2} {y} H{46 - (y / -190) * 12 - 2}', '#C9B79A', 2.4))
    o.append(s('M-50 -186 C-50 -230 50 -230 50 -186 Z', RED, 4.5))
    o.append(s('M-14 0 V-40 C-14 -54 14 -54 14 -40 V0 Z', WOOD_D, 3.5))
    o.append(c(0, -120, 12, '#F4B942', 3.5) + ln('M-12 -120 H12 M0 -132 V-108', WOOD_D, 2.4))
    o.append(c(0, -200, 7, STONE_D, 3))
    sprite('windmill', (-54, -236, 108, 240), o)
    sails = []
    for k in range(4):
        a = k * 90
        sails.append(f'<g transform="rotate({a})">' + beam('M0 0 V-100', WOOD, 4, 3) + s('M4 -24 H26 V-98 H4 Z', '#F3E6CC', 3) + ln('M4 -48 H26 M4 -72 H26 M15 -24 V-98', '#C9B79A', 1.8) + '</g>')
    sails.append(c(0, 0, 8, WOOD_D, 3))
    sprite('windmill_sails', (-104, -104, 208, 208), sails)


def fence():
    o = []
    for x in (-52, -18, 18, 52):
        o.append(s(f'M{x - 6} 0 V-40 L{x} -48 L{x + 6} -40 V0 Z', WOOD, 3.5))
    o.append(s('M-60 -32 H60 V-24 H-60 Z', WOOD, 3) + s('M-60 -16 H60 V-8 H-60 Z', WOOD, 3))
    sprite('fence', (-62, -52, 124, 56), o)


def cabbages():
    o = [s('M-96 0 C-96 -18 96 -18 96 0 C96 8 -96 8 -96 0 Z', '#6B4A30', 3.5)]
    for (x, y, k) in ((-66, -10, 1), (-24, -12, 1.1), (20, -11, 1), (62, -9, 0.95)):
        o.append(c(x, y - 10 * k, 14 * k, '#8FCB66', 3.2) + s(f'M{x - 12 * k} {y - 8 * k} C{x - 8 * k} {y - 22 * k} {x + 8 * k} {y - 22 * k} {x + 12 * k} {y - 8 * k} C{x + 4 * k} {y - 14 * k} {x - 4 * k} {y - 14 * k} {x - 12 * k} {y - 8 * k} Z', '#B6E08A', 2.4))
    sprite('cabbages', (-100, -40, 200, 48), o)


def node_moonpetal(shim=False):
    o = [e(0, -4, 56, 12, '#6B4A30', 3.5)]
    for (x, h, lean) in ((-36, 46, -6), (-16, 60, -2), (4, 54, 4), (22, 64, 6), (40, 44, 8)):
        o.append(beam(f'M{x} -6 C{x} {-h / 2} {x + lean} {-h + 10} {x + lean} {-h}', STEM, 3.2, 3))
        o.append(s(f'M{x} -16 C{x - 12} -20 {x - 14} -28 {x - 10} -30 C{x - 6} -24 {x - 2} -22 {x} -16 Z', LEAF, 2.4))
        cx, cy = x + lean, -h
        for k in range(5):
            a = math.radians(k * 72 - 90)
            o.append(e(cx + 6 * math.cos(a), cy + 6 * math.sin(a), 5, 5, PETAL if not shim else '#F3F7FF', 2))
        o.append(c(cx, cy, 3.2, GOLD, 1.8))
    return o


def node_glowcap():
    o = ['<ellipse cx="0" cy="-22" rx="62" ry="26" style="fill: #9BE15D; opacity: 0.2"/>']
    o.append(s('M-66 0 C-62 -14 -40 -20 -10 -20 C26 -20 60 -16 66 0 Z', '#4E7A3A', 3.5))
    for (x, sz) in ((-40, 0.8), (-12, 1.15), (18, 0.95), (44, 0.7)):
        hh = 22 * sz
        o.append(s(f'M{x - 5 * sz} -10 V{-hh} H{x + 5 * sz} V-10 Z', '#F0E8D2', 2.6))
        o.append(s(f'M{x - 16 * sz} {-hh} C{x - 16 * sz} {-hh - 18 * sz} {x + 16 * sz} {-hh - 18 * sz} {x + 16 * sz} {-hh} Z', CAP, 3))
        o.append(c(x - 5 * sz, -hh - 7 * sz, 2.6 * sz, CAP_L, 0) + c(x + 6 * sz, -hh - 10 * sz, 2 * sz, CAP_L, 0))
    return o


def node_bramble():
    o = [s('M-70 0 C-74 -30 -60 -66 -30 -80 C-10 -96 20 -94 40 -80 C66 -64 76 -30 70 0 Z', '#3E6A34', 4)]
    for (x, y, r) in ((-46, -40, 16), (-20, -66, 18), (14, -70, 18), (42, -46, 16), (0, -36, 20), (-30, -14, 14), (34, -16, 14)):
        o.append(c(x, y, r, '#4E8A3E', 2.6))
    for (x1, y1, x2, y2) in ((-60, -20, -66, -28), (-40, -76, -44, -86), (30, -84, 34, -94), (62, -30, 70, -36)):
        o.append(s(f'M{x1} {y1} L{x2} {y2} L{x1 + 6} {y1 - 2} Z', '#4A3020', 1.6))
    for (x, y) in ((-34, -50), (-24, -56), (-30, -40), (10, -56), (20, -50), (14, -44), (40, -30), (-4, -24), (6, -20), (-50, -24)):
        o.append(c(x, y, 5.2, BERRY, 2.2))
        o.append(c(x - 1.6, y - 1.8, 1.4, BERRY_L, 0))
    return o


def errand_bits():
    g = [beam('M-24 -10 C-24 -20 -10 -22 -4 -14', '#7A4A2A', 3.5, 3), beam('M24 -10 C24 -20 10 -22 4 -14', '#7A4A2A', 3.5, 3)]
    g.append(c(-12, -10, 10, '#D9A520', 3.5) + c(12, -10, 10, '#D9A520', 3.5) + c(-12, -10, 6, '#BDE8FF', 2.4) + c(12, -10, 6, '#BDE8FF', 2.4))
    g.append(ln('M-2 -10 H2', K, 3) + ln('M-15 -13 L-11 -15 M9 -13 L13 -15', '#FFFFFF', 1.8))
    sprite('goggles', (-28, -24, 56, 28), g)
    cr = [beam('M-4 -6 L-6 0 M4 -6 L6 0', GOLD_D, 2.4, 2.4)]
    cr.append(s('M-22 -22 C-26 -34 -16 -44 -2 -44 C10 -44 20 -36 18 -24 C16 -14 6 -8 -6 -8 C-14 -8 -20 -14 -22 -22 Z', '#2A2632', 3.5))
    cr.append(s('M-22 -24 C-34 -26 -40 -18 -38 -12 C-30 -14 -24 -18 -20 -18 Z', '#2A2632', 3))
    cr.append(s('M14 -36 C22 -38 30 -34 32 -30 C26 -28 20 -28 16 -30 Z', GOLD, 2.6))
    cr.append(c(6, -34, 3.6, '#FFFFFF', 2) + c(7, -34, 1.6, K, 0))
    cr.append(s('M-14 -30 C-8 -36 4 -36 8 -28 C2 -26 -8 -24 -14 -30 Z', '#3A3648', 2))
    sprite('crow', (-42, -48, 78, 52), cr)
    sp = [halo(0, -14, 16, FIRE, 0.4), s('M0 -2 C-10 -2 -14 -10 -10 -18 C-8 -24 -4 -26 -2 -34 C4 -28 10 -22 10 -12 C10 -6 6 -2 0 -2 Z', FIRE, 3), s('M0 -6 C-4 -6 -6 -10 -4 -14 C-2 -18 0 -20 0 -24 C4 -20 6 -16 5 -12 C5 -8 3 -6 0 -6 Z', FLAME, 2)]
    sprite('spark', (-18, -38, 36, 40), sp)


def place_bits():
    sprite('burrow', (-154, -162, 308, 166), burrow())
    sprite('burrow_red', (-154, -162, 308, 166), burrow('#C8403F'))
    windmill(); fence(); cabbages()
    sprite('node_moonpetal', (-60, -76, 120, 82), node_moonpetal())
    sprite('node_moonpetal_shim', (-60, -76, 120, 82), node_moonpetal(True))
    sprite('node_glowcap', (-72, -54, 144, 60), node_glowcap())
    sprite('node_bramble', (-76, -100, 152, 104), node_bramble())
    errand_bits()


# ================================================================ icon tiles: ingredients, brews, skills
def tile(bg, inner):
    return f'<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" style="fill: {bg}"/>{inner}</svg>'


def bottle(liq, extra=''):
    o = s('M26 10 H38 V20 C48 24 52 32 52 42 C52 52 44 58 32 58 C20 58 12 52 12 42 C12 32 16 24 26 20 Z', '#E9F4FA', 3.4)
    o += s('M15 40 C15 34 22 32 32 34 C42 36 49 34 49 40 C50 50 44 55 32 55 C20 55 14 50 15 40 Z', liq, 2.6)
    o += s('M24 4 H40 V12 H24 Z', '#B88A5A', 3)
    o += ln('M18 30 C18 26 22 22 26 22', '#FFFFFF', 2.4)
    return o + extra


def icons():
    flower = ''
    for k in range(5):
        a = math.radians(k * 72 - 90)
        flower += e(32 + 10 * math.cos(a), 26 + 10 * math.sin(a), 8.5, 8.5, PETAL, 2.6)
    ICONS['g_moonpetal'] = tile('#3A4A6A', beam('M32 34 C32 44 30 52 28 60', STEM, 4, 3) + s('M30 48 C22 48 18 42 20 40 C26 40 30 44 30 48 Z', LEAF, 2.4) + flower + c(32, 26, 5.5, GOLD, 2.6))
    ICONS['g_glowcap'] = tile('#2F5A3A', halo(32, 30, 24, GRN, 0.35) + s('M27 56 V36 H37 V56 Z', '#F0E8D2', 3) + s('M10 38 C10 14 54 14 54 38 Z', CAP, 3.5) + c(24, 28, 4, CAP_L, 0) + c(38, 24, 3, CAP_L, 0) + c(42, 32, 2.4, CAP_L, 0))
    ICONS['g_berry'] = tile('#5A3A5A', beam('M32 8 C30 14 26 18 22 20', BRANCH, 3, 3) + s('M30 12 C36 6 46 8 48 12 C42 16 36 16 30 12 Z', LEAF, 2.4) + ''.join(c(x, y, 9, BERRY, 2.8) + c(x - 3, y - 3, 2.4, BERRY_L, 0) for (x, y) in ((22, 30), (38, 32), (28, 46), (44, 46))))
    ICONS['g_dew'] = tile('#2A2650', halo(32, 36, 24, '#BDE8FF', 0.4) + s('M32 10 C38 22 48 30 48 40 C48 50 40 56 32 56 C24 56 16 50 16 40 C16 30 26 22 32 10 Z', '#BDE8FF', 3.5) + ln('M24 40 C24 34 28 30 30 28', '#FFFFFF', 2.6) + ln('M50 12 V20 M46 16 H54 M12 46 V52 M9 49 H15', '#FFF3C4', 2.2))
    ICONS['b_tonic'] = tile('#2F4F7A', bottle('#8FD6FF', c(28, 46, 2.4, '#FFFFFF', 0)))
    ICONS['b_fizz'] = tile('#7A2A3A', bottle('#D9465A', c(26, 46, 2.2, '#FFE0E4', 0) + c(34, 42, 1.8, '#FFE0E4', 0) + c(38, 48, 2.6, '#FFE0E4', 0) + c(52, 14, 3, '#FFE0E4', 1.6) + c(56, 24, 2, '#FFE0E4', 1.4)))
    ICONS['b_glow'] = tile('#2F5A3A', halo(32, 44, 22, GRN, 0.4) + bottle('#9BE15D'))
    ICONS['b_elixir'] = tile('#5A4420', halo(32, 40, 26, GOLD, 0.4) + bottle('#F2C230', s('M32 38 L34 43 L39 43 L35 46 L36 51 L32 48 L28 51 L29 46 L25 43 L30 43 Z', '#FFF6D0', 1.6)))
    snips = (s('M30 36 L50 8 L54 12 L36 40 Z', STEEL_L, 3) + s('M34 36 L14 8 L10 12 L28 40 Z', STEEL_L, 3)
             + c(24, 48, 8, RED, 3.2) + c(42, 48, 8, RED, 3.2) + c(24, 48, 3.4, '#4E9A4A', 0) + c(42, 48, 3.4, '#4E9A4A', 0) + c(32, 37, 2.6, STEEL_D, 2))
    ICONS['s_gather'] = tile('#4E9A4A', s('M8 22 C6 12 14 6 20 8 C20 16 14 20 8 22 Z', LEAF, 2.4) + snips)


def build():
    goat(); goat(saddle=False); hare(); pets(); trophies(); gnome(); cauldron(); place_bits(); icons()
    os.makedirs(OUT, exist_ok=True)
    json.dump(SP, open(OUT + 'vale.json', 'w'))
    json.dump(ICONS, open(OUT + 'vale_icons.json', 'w'))
    cells = ''.join(f'<div style="text-align:center;color:#ccc;font:11px monospace"><div style="width:{v["vb"][2]}px;height:{v["vb"][3]}px">{v["svg"]}</div>{k}</div>' for k, v in SP.items())
    icons_html = ''.join(f'<div style="text-align:center;color:#ccc;font:11px monospace"><div style="width:64px;height:64px">{v}</div>{k}</div>' for k, v in ICONS.items())
    open(OUT + '_vale_preview.html', 'w').write('<body style="margin:0;padding:16px;background:#2A2234"><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;width:1500px">' + cells + '</div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;width:1500px">' + icons_html + '</div></body>')
    print('ok', len(SP), 'sprites', len(ICONS), 'icons')


if __name__ == '__main__':
    build()
