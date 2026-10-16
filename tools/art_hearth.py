import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# The hearth (home), and everything you collect: pets, the mount, trophies, the banner, the lanterns, the paddock's props
# of the walkout. Same locked TV-cartoon style as art_sprites.py: one black line, flat colour,
# every sprite drawn around its ground point (0, 0).
# Usage: python3 tools/art_hearth.py -> art/hearth.json, art/collect_icons.json, art/_hearth_preview.html
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import art_sprites as A
from art_sprites import (K, s, ln, beam, c, e, halo, m, both, eyes, f,
                         BONE, BONE_D, GRN, GRN_L, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, RED, RED_D,
                         BLUE, BLUE_D, WOOD, WOOD_D, PURP, PURP_D, STONE, STONE_T, STONE_D, FROST, FROST_L, FIRE, FLAME)
from art_sprites import GK_COAT, GK_COAT_D, GK_SKIN, GK_SKIN_D
import art_heads as heads
from art_heroes import RIRON, RIRON_D, RIRON_L

OUT = HF_ROOT + '/art/'
SP = {}
ICONS = {}


def sprite(name, vb, body):
    x, y, w, h = vb
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
           + ''.join(body) + '</svg>')
    SP[name] = {'svg': svg, 'vb': [x, y, w, h]}


def icon(name, bg, body, k=1.0, dx=0, dy=0, ground=56):
    """A 64x64 tile with a sprite body drawn into it: ground point at (32 + dx, ground + dy), scaled by k."""
    inner = ''.join(body)
    ICONS[name] = (f'<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" style="fill: {bg}"/>'
                   f'<g transform="translate({f(32 + dx)} {f(ground + dy)}) scale({f(k)})">{inner}</g></svg>')


# ================================================================ lanterns (the walkout)
def lantern_parts(x, y, flame, glass, frame='#4A4458', lit=True, k=1.0):
    """The Gravekeeper's lantern; (x, y) is the top of the frame. Height about 60 * k."""
    o = []
    q = lambda v: f(v)
    X = lambda dx: x + dx * k
    Y = lambda dy: y + dy * k
    o.append(ln(f'M{q(X(-8))} {q(Y(2))} C{q(X(-8))} {q(Y(-12))} {q(X(8))} {q(Y(-12))} {q(X(8))} {q(Y(2))}', K, 3.4 * k))
    o.append(s(f'M{q(X(-15))} {q(Y(4))} H{q(X(15))} L{q(X(12))} {q(Y(44))} H{q(X(-12))} Z', frame, 4 * k))
    o.append(s(f'M{q(X(-8))} {q(Y(10))} H{q(X(8))} V{q(Y(38))} H{q(X(-8))} Z', glass, 2.5 * k))
    if lit:
        o.append(s(f'M{q(X(0))} {q(Y(14))} C{q(X(7))} {q(Y(22))} {q(X(6))} {q(Y(32))} {q(X(0))} {q(Y(36))} C{q(X(-6))} {q(Y(32))} {q(X(-7))} {q(Y(22))} {q(X(0))} {q(Y(14))} Z', flame, 2 * k))
        o.append(c(X(-1.5), Y(27), 1.8 * k, '#FFFFFF', 0))
    o.append(s(f'M{q(X(-18))} {q(Y(44))} H{q(X(18))} L{q(X(14))} {q(Y(52))} H{q(X(-14))} Z', frame, 3.5 * k))
    o.append(s(f'M{q(X(-12))} {q(Y(-2))} H{q(X(12))} L{q(X(15))} {q(Y(4))} H{q(X(-15))} Z', frame, 3.5 * k))
    return o


def lanterns():
    sprite('lantern', (-26, -76, 52, 80), [halo(0, -26, 30, GRN, 0.3)] + lantern_parts(0, -52, GRN, '#E9FFD9'))
    sprite('lantern_gold', (-30, -80, 60, 84), [halo(0, -26, 34, GOLD, 0.38)] + lantern_parts(0, -52, GOLD, '#FFF3C4', '#6A5A3A'))
    smoke = ln('M0 -64 C-6 -70 6 -76 0 -84 C-5 -90 4 -96 0 -102', '#8C8098', 3)
    sprite('lantern_out', (-26, -106, 52, 110), [smoke] + lantern_parts(0, -52, GRN, '#3A3348', lit=False))
    ICONS['c_lantern'] = None  # placeholder so the list below stays in order


# ================================================================ pets
def chibi_keeper(o, reach=False):
    # shovel, leaning on the viewer's left
    o.append(beam('M-27 -6 L-19 -62', A.WOOD, 4.5, 3.5) + s('M-22 -68 H-14 V-62 H-22 Z', WOOD_D, 2.5))
    o.append(s('M-34 -14 H-20 L-21 -2 C-23 2 -26 3 -28 3 C-30 3 -33 1 -34 -2 Z', '#8E96A3', 3))
    # boots
    o.append(s('M-13 -9 H-3 V0 H-16 C-17 -4 -16 -7 -13 -9 Z', '#3A2E2A', 3) + s(m('M-13 -9 H-3 V0 H-16 C-17 -4 -16 -7 -13 -9 Z'), '#3A2E2A', 3))
    # coat
    o.append(s('M-14 -42 C-19 -30 -21 -18 -21 -7 H21 C21 -18 19 -30 14 -42 Z', GK_COAT, 3.5))
    o.append(ln('M-2 -40 L-2 -9', GK_COAT_D, 2.4))
    o.append(s('M-20 -22 C-7 -19 7 -19 20 -22 V-17 C7 -14 -7 -14 -20 -17 Z', '#3A2E2A', 2.5) + s('M-4 -22 H4 V-15 H-4 Z', '#C9A040', 2))
    o.append(c(-6, -33, 1.6, '#C9A040', 1.4) + c(-6, -27, 1.6, '#C9A040', 1.4))
    # arm on the shovel
    o.append(s('M-13 -40 C-20 -36 -24 -30 -24 -24 L-18 -22 C-18 -28 -15 -32 -10 -35 Z', GK_COAT, 3) + c(-21, -24, 4.5, GK_SKIN, 2.5))
    if reach:
        pass  # the free arm goes up after the head is drawn
    else:
        o.append(s('M12 -40 C18 -38 22 -32 23 -26 L17 -24 C16 -29 13 -33 9 -35 Z', GK_COAT, 3) + c(21, -25, 4.5, GK_SKIN, 2.5))
        o.append(halo(22, -12, 13, GRN, 0.3))
        o += lantern_parts(22, -22, GRN, '#E9FFD9', k=0.42)
    # head: hood, face, big nose, the eyes
    cy = -60
    o.append(s(f'M-24 {cy + 14} C-29 {cy - 8} -17 {cy - 26} 0 {cy - 27} C17 {cy - 26} 29 {cy - 8} 24 {cy + 14} C14 {cy + 21} -14 {cy + 21} -24 {cy + 14} Z', GK_COAT_D, 3.5))
    o.append(s(f'M-17 {cy + 7} C-18 {cy - 9} -9 {cy - 18} 0 {cy - 18} C9 {cy - 18} 18 {cy - 9} 17 {cy + 7} C14 {cy + 16} 7 {cy + 19} 0 {cy + 19} C-7 {cy + 19} -14 {cy + 16} -17 {cy + 7} Z', GK_SKIN, 3))
    o.append(s(f'M-11 {cy + 12} C-6 {cy + 19} 6 {cy + 19} 11 {cy + 12} C9 {cy + 17} 4 {cy + 20} 0 {cy + 20} C-4 {cy + 20} -9 {cy + 17} -11 {cy + 12} Z', '#C9CFC2', 2))
    for sx in (-1, 1):
        o.append(halo(sx * 6.6, cy - 2, 6.5, GRN, 0.35))
        o.append(e(sx * 6.6, cy - 2, 4.6, 5.6, '#FFFFFF', 2.2) + c(sx * 6, cy - 1, 2.3, '#3E7A1E', 0) + c(sx * 6, cy - 1, 1, GRN_L, 0))
    o.append(ln(f'M-13 {cy - 10} L-3 {cy - 7} M13 {cy - 10} L3 {cy - 7}', K, 3.4))
    o.append(s(f'M-3 {cy + 1} C-2 {cy + 7} -7 {cy + 11} -3 {cy + 13} C1 {cy + 14} 6 {cy + 11} 4 {cy + 6} C3 {cy + 3} 2 {cy + 1} 2 {cy - 1} Z', GK_SKIN_D, 2.5))
    o.append(ln(f'M-6 {cy + 16} C-2 {cy + 14} 3 {cy + 14} 7 {cy + 16}', K, 2.2))
    if reach:
        # free arm up and out, hand open for the lantern
        o.append(s('M13 -42 C22 -44 28 -50 30 -58 L24 -61 C22 -54 17 -50 10 -48 Z', GK_COAT, 3) + c(28, -62, 4.8, GK_SKIN, 2.5))
        o.append(ln('M25 -66 L24 -71 M29 -67 L30 -72 M32 -64 L35 -67', K, 2))


def pets():
    o = []; chibi_keeper(o)
    sprite('pet_keeper', (-38, -92, 76, 96), o)
    icon('c_pet_keeper', '#4E6B45', o, k=0.62, dx=3, ground=60)
    o = []; chibi_keeper(o, reach=True)
    sprite('pet_keeper_reach', (-38, -92, 76, 96), o)
    # lantern ghost: a wisp that decided it liked you, with a lantern of its own
    g = [halo(0, -50, 30, GRN, 0.2)]
    body = 'M0 -78 C15 -78 22 -65 22 -54 C22 -44 18 -37 14 -31 C10 -35 7 -28 3 -32 C-1 -25 -5 -31 -9 -27 C-13 -33 -21 -42 -21 -54 C-21 -65 -15 -78 0 -78 Z'
    g.append(s('M14 -48 C22 -46 26 -40 25 -34 L20 -33 C20 -38 17 -42 12 -43 Z', '#C8F5E8', 3))
    g.append(s(body, '#C8F5E8', 3.5))
    g.append(ln('M-10 -40 C-6 -36 -2 -36 1 -39', '#9FD9C6', 2.2))
    g.append(e(-6, -58, 3.4, 4.6, K, 0) + e(6, -58, 3.4, 4.6, K, 0) + c(-5, -59.5, 1.3, '#FFFFFF', 0) + c(7, -59.5, 1.3, '#FFFFFF', 0))
    g.append(e(-12, -51, 3.2, 2, '#FFB3B3', 0) + e(12, -51, 3.2, 2, '#FFB3B3', 0))
    g.append(ln('M-3 -51 C-1 -48 1 -48 3 -51', K, 2.2))
    g.append(halo(24, -18, 11, GRN, 0.35))
    g += lantern_parts(24, -30, GRN, '#E9FFD9', k=0.4)
    sprite('pet_ghost', (-30, -96, 66, 100), g)
    icon('c_pet_ghost', '#2F6F5A', g, k=0.62, dx=-2, ground=62)


# ================================================================ mount
HOUND_FUR, HOUND_FUR_D, HOUND_GLOW = '#3D5E50', '#2C463B', '#9BE15D'


def hound():
    o = [halo(70, -96, 26, GRN, 0.25)]
    # far legs (darker), bone
    for x0, x1 in ((-44, -50), (40, 46)):
        o.append(beam(f'M{x0} -46 L{x1} -6', BONE_D, 6, 3.5) + s(f'M{x1 - 9} -8 H{x1 + 8} C{x1 + 9} -3 {x1 + 7} 0 {x1 + 4} 0 H{x1 - 9} Z', BONE_D, 3))
    # tail: bony, curled up
    o.append(beam('M-66 -72 C-86 -82 -92 -104 -80 -118', BONE, 5.5, 3.5))
    for (x, y) in ((-74, -78), (-84, -92), (-86, -106)):
        o.append(c(x, y, 3.6, BONE, 2.4))
    o.append(s('M-80 -118 C-90 -122 -92 -134 -84 -138 C-82 -130 -76 -126 -72 -124 Z', HOUND_FUR, 3))
    # body: ragged ghost fur
    body = ('M-70 -66 C-72 -86 -52 -98 -24 -98 C4 -98 30 -96 48 -88 C60 -82 64 -70 60 -58 C58 -50 52 -46 46 -44 '
            'L40 -36 L34 -44 L22 -38 L14 -46 L2 -38 L-8 -46 L-20 -38 L-30 -46 L-42 -38 L-50 -48 C-62 -50 -70 -56 -70 -66 Z')
    o.append(s(body, HOUND_FUR, 4))
    o.append(ln('M-56 -84 C-40 -92 -12 -94 14 -90', HOUND_FUR_D, 3))
    # ribs showing through
    for i, x in enumerate((-30, -16, -2, 12)):
        o.append(ln(f'M{x} -92 C{x - 8} -80 {x - 6} -64 {x + 2} -56', K, 6) + ln(f'M{x} -92 C{x - 8} -80 {x - 6} -64 {x + 2} -56', BONE, 3))
    o.append(beam('M-44 -95 C-20 -100 10 -99 34 -92', BONE, 3.5, 3))
    # near legs
    for x0, x1 in ((-36, -38), (32, 36)):
        o.append(beam(f'M{x0} -52 L{x1} -6', BONE, 6.5, 3.5) + c((x0 + x1) / 2, -30, 4.2, BONE, 2.6))
        o.append(s(f'M{x1 - 10} -9 H{x1 + 10} C{x1 + 12} -3 {x1 + 9} 0 {x1 + 5} 0 H{x1 - 10} Z', BONE, 3))
    # neck and head
    o.append(s('M38 -88 C48 -100 56 -106 66 -108 L72 -84 C62 -80 54 -76 48 -70 Z', HOUND_FUR, 3.5))
    o.append(s('M50 -96 C46 -116 54 -128 64 -132 C66 -122 64 -114 60 -106 Z', HOUND_FUR, 3))  # ear
    o.append(s('M54 -114 C58 -126 74 -128 84 -120 C96 -116 108 -108 112 -98 C114 -92 110 -88 104 -88 C96 -88 90 -86 84 -84 C74 -82 62 -88 56 -98 Z', BONE, 3.8))
    o.append(s('M84 -84 C92 -86 100 -86 106 -86 C104 -80 96 -76 88 -77 C84 -78 82 -80 84 -84 Z', BONE_D, 3))  # jaw
    o.append(ln('M90 -88 V-83 M96 -88 V-83 M102 -88 V-84', K, 2))
    o.append(c(110, -97, 3.2, K, 0))  # nose
    o.append(e(76, -110, 7.5, 6.5, '#1E2A24', 3) + c(77, -110, 3.4, HOUND_GLOW, 0) + c(78, -111, 1.3, '#FFFFFF', 0))
    o.append(s('M60 -122 C62 -134 70 -140 78 -140 C76 -132 72 -126 68 -120 Z', HOUND_FUR_D, 3))  # far ear
    # collar with a little lantern bell
    o.append(s('M50 -82 C58 -90 66 -92 72 -90 L74 -82 C66 -84 60 -80 54 -74 Z', PURP, 3))
    o.append(halo(66, -70, 10, GRN, 0.4))
    o += lantern_parts(66, -80, GRN, '#E9FFD9', k=0.3)
    # spectral wisps coming off the fur
    for (x, y) in ((-60, -100), (-30, -106), (6, -104)):
        o.append(s(f'M{x} {y} C{x - 4} {y - 6} {x} {y - 12} {x + 4} {y - 14} C{x + 2} {y - 8} {x + 6} {y - 4} {x + 4} {y + 2} Z', '#C8F5E8', 2))
    sprite('mount_hound', (-96, -146, 216, 152), o)
    icon('c_mount_hound', '#2C463B', o, k=0.36, dx=-6, ground=58)


# ================================================================ trophies
def plume(k=1.0):
    o = [s('M-16 -8 H16 V0 H-16 Z', WOOD_D, 3)]
    o.append(s('M-11 -8 C-11 -20 11 -20 11 -8 Z', STEEL, 3) + s('M-3 -22 H3 V-16 H-3 Z', GOLD_D, 2.2))
    # a tall crest of red feathers, curling back at the top
    crest = ('M-2 -22 C-14 -30 -18 -44 -12 -56 C-8 -64 2 -68 10 -64 C16 -61 18 -54 14 -50 '
             'C10 -54 4 -54 2 -50 C8 -48 10 -42 6 -38 C2 -42 -2 -42 -4 -38 C2 -36 4 -30 2 -22 Z')
    o.append(s(crest, RED, 3.5))
    o.append(ln('M-8 -30 C-12 -38 -11 -48 -6 -56 M-2 -26 C-6 -34 -5 -44 0 -52', RED_D, 2.4))
    o.append(ln('M-10 -50 C-8 -56 -2 -60 4 -60', '#E97A6E', 2.2))
    return o


def dye_bottle():
    """the Ghostly Dye, standing on a shelf: a round flask of pale ghost-light with a cork"""
    o = [halo(0, -24, 24, '#DCFFF0', 0.22)]
    o.append(s('M-8 -44 H8 V-36 C20 -32 24 -20 20 -10 C16 0 -16 0 -20 -10 C-24 -20 -20 -32 -8 -36 Z', '#DCFFF0', 3.5))
    o.append(ln('M-14 -16 C-6 -11 4 -11 14 -16', '#9FD9C6', 3) + ln('M-14 -26 L-17 -18', '#FFFFFF', 2.6))
    o.append(s('M-10 -54 H10 V-44 H-10 Z', A.RUST, 3) + ln('M-6 -50 H6', WOOD_D, 2))
    return o


def key():
    o = [s('M-18 -10 H18 L16 0 H-16 Z', STONE_D, 3)]
    o.append(beam('M0 -12 L0 -50', '#5E6A7A', 6, 3.5))
    o.append(s('M0 -18 H10 V-12 H0 Z M0 -26 H7 V-20 H0 Z', '#5E6A7A', 2.5))
    o.append(c(0, -60, 11, '#5E6A7A', 3.5) + c(0, -60, 5, STONE_D, 3))
    o.append(ln('M-6 -66 C-3 -69 2 -69 5 -67', STEEL_L, 2))
    return o


def shackle():
    o = [s('M-22 -8 H22 V0 H-22 Z', WOOD_D, 3)]
    link = lambda cx, cy, rx, ry: (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" style="fill: none; stroke: #1E1A1A; stroke-width: 6.5"/>'
                                   f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" style="fill: none; stroke: #9AA7B8; stroke-width: 3"/>')
    o.append(link(-12, -14, 4.5, 6.5) + link(-6, -24, 6.5, 4.2))
    # the cuff: a thick iron ring, snapped open at the top right
    o.append(ln('M10 -48 C4 -56 -10 -54 -12 -44 C-14 -34 -4 -26 6 -30 C14 -34 18 -42 16 -48', K, 11))
    o.append(ln('M10 -48 C4 -56 -10 -54 -12 -44 C-14 -34 -4 -26 6 -30 C14 -34 18 -42 16 -48', '#7D8FA3', 6))
    o.append(c(0, -29, 3, '#5E6A7A', 2.2))
    o.append(s('M12 -50 L18 -58 L21 -50 Z', '#7D8FA3', 2.2) + s('M18 -46 L26 -48 L22 -42 Z', '#7D8FA3', 2.2))
    o.append(ln('M-6 -50 C-10 -46 -11 -40 -9 -36', '#C9D2DC', 2))
    return o


def bars():
    o = [s('M-22 -12 H22 L20 0 H-20 Z', STONE, 3.5) + ln('M-6 -12 V0 M10 -12 V-2', STONE_D, 2)]
    o.append(s('M-24 -16 H24 V-11 H-24 Z', STONE_D, 3))
    o.append(beam('M-12 -16 L-12 -64', '#5E6A7A', 4.5, 3.5))
    o.append(beam('M12 -16 L12 -64', '#5E6A7A', 4.5, 3.5))
    o.append(beam('M0 -16 C0 -30 14 -36 16 -48 C18 -56 8 -60 4 -64', '#7D8FA3', 4.5, 3.5))
    o.append(s('M-16 -68 H16 V-62 H-16 Z', '#5E6A7A', 3))
    return o


def gskull():
    o = [s('M-20 -6 C-20 -14 20 -14 20 -6 C20 0 -20 0 -20 -6 Z', PURP, 3)]
    o.append(c(-20, -4, 2.6, GOLD, 1.6) + c(20, -4, 2.6, GOLD, 1.6))
    o.append(halo(0, -30, 26, GOLD, 0.25))
    o.append(s('M-15 -30 C-15 -46 15 -46 15 -30 C15 -24 12 -21 9 -19 V-12 H-9 V-19 C-12 -21 -15 -24 -15 -30 Z', GOLD, 3.5))
    o.append(e(-6, -30, 4, 4.6, '#6A4A10', 0) + e(6, -30, 4, 4.6, '#6A4A10', 0))
    o.append(s('M0 -25 L-2 -21 H2 Z', '#6A4A10', 1.2))
    o.append(ln('M-5 -15 V-12 M0 -15 V-12 M5 -15 V-12', '#6A4A10', 1.8))
    o.append(ln('M-9 -42 C-5 -45 1 -45 5 -43', '#FFF3C4', 2.2))
    return o


def party_banner():
    # hangs from (0, 0): rod on top, cloth below
    o = [beam('M-46 6 H46', WOOD, 5, 3.5) + c(-48, 6, 4.5, GOLD, 2.5) + c(48, 6, 4.5, GOLD, 2.5)]
    o.append(s('M-38 8 H38 V128 L19 114 L0 130 L-19 114 L-38 128 Z', PURP, 4))
    o.append(ln('M-31 12 V118 M31 12 V118', GOLD, 2.6))
    # three marks: shield (tank), sun (healer), snowflake (dps)
    o.append(c(0, 40, 13, GOLD, 3) + c(0, 40, 8.5, RED, 2.5))
    rays = ''
    for kk in range(8):
        a = math.radians(kk * 45)
        rays += ln(f'M{f(-16 + 9 * math.cos(a))} {f(78 + 9 * math.sin(a))} L{f(-16 + 13 * math.cos(a))} {f(78 + 13 * math.sin(a))}', GOLD, 2.6)
    o.append(rays + c(-16, 78, 6, GOLD, 2.5))
    o.append(ln('M16 70 V86 M9 74 L23 82 M9 82 L23 74', K, 5.5) + ln('M16 70 V86 M9 74 L23 82 M9 82 L23 74', FROST_L, 2.4))
    return o


def trophies():
    sprite('tr_plume', (-22, -68, 44, 72), plume()); icon('c_plume', '#7A2A2A', plume(), k=0.9, ground=60)
    sprite('tr_key', (-22, -76, 44, 80), key()); icon('c_key', '#3A3150', key(), k=0.78, ground=62)
    sprite('tr_shackle', (-24, -64, 48, 68), shackle()); icon('c_shackle', '#4A4458', shackle(), k=0.9, ground=60)
    sprite('tr_bars', (-28, -72, 56, 76), bars()); icon('c_bars', '#4F4466', bars(), k=0.8, ground=61)
    sprite('tr_skull', (-26, -56, 52, 60), gskull()); icon('c_skull', '#6A4BA3', gskull(), k=1.0, ground=56)
    sprite('tr_dye', (-26, -58, 52, 62), dye_bottle())
    sprite('tr_banner', (-56, -4, 112, 140), party_banner()); icon('c_banner', '#3A3150', party_banner(), k=0.42, ground=4)


# ================================================================ the room
def fireplace():
    o = []
    # chimney breast, all the way up
    o.append(s('M-150 -600 H150 V-280 H-150 Z', '#7A6E86', 4))
    for y in range(-560, -280, 40):
        off = 0 if (y // 40) % 2 else 30
        o.append(ln(f'M-150 {y} H150', '#665A72', 3))
        for x in range(-150 + off, 150, 60):
            o.append(ln(f'M{x} {y} V{y + 40}', '#665A72', 3))
    # mantel beam and corbels
    o.append(s('M-196 -282 H196 V-256 H-196 Z', WOOD, 4) + ln('M-190 -262 H190', WOOD_D, 3))
    o.append(s('M-176 -256 H-148 V-234 C-160 -234 -172 -240 -176 -248 Z', WOOD_D, 3.5) + s(m('M-176 -256 H-148 V-234 C-160 -234 -172 -240 -176 -248 Z'), WOOD_D, 3.5))
    # stone surround
    o.append(s('M-172 -256 H172 V-6 H-172 Z', STONE, 4))
    for (x, y, w, h) in ((-172, -256, 70, 44), (-102, -256, 64, 30), (38, -256, 64, 30), (102, -256, 70, 44),
                         (-172, -212, 52, 50), (120, -212, 52, 50), (-172, -162, 60, 52), (112, -162, 60, 52),
                         (-172, -110, 52, 54), (120, -110, 52, 54), (-172, -56, 60, 50), (112, -56, 60, 50)):
        o.append(s(f'M{x} {y} H{x + w} V{y + h} H{x} Z', STONE_T if (x + y) % 3 else STONE, 3))
    o.append(s('M-38 -256 H38 V-222 H-38 Z', STONE_T, 3))  # keystone
    # firebox: arched opening
    o.append(s('M-112 -6 V-150 C-112 -214 112 -214 112 -150 V-6 Z', '#2A1E22', 4.5))
    o.append(s('M-92 -6 V-140 C-92 -186 92 -186 92 -140 V-6 Z', '#3A2A2C', 0))
    for y in (-150, -120, -90, -60, -30):
        o.append(ln(f'M-90 {y} H90', '#2A1E22', 2.5))
    o.append(s('M-112 -150 C-112 -214 112 -214 112 -150', '#2A1E22', 0) if False else '')
    # hearth slab on the floor
    o.append(s('M-206 -10 H206 L212 6 H-212 Z', STONE_D, 4))
    sprite('fireplace', (-216, -604, 432, 614), o)


def fire():
    # the hearth's fire in two frames, and the same fire in the Gravekeeper's green for Barrow Hall
    for pre, hot, core in (('fire', FIRE, FLAME), ('gfire', GRN, GRN_L)):
        a = [halo(0, -50, 70, hot, 0.18)]
        a.append(s('M-56 0 C-62 -26 -46 -44 -36 -64 C-30 -44 -22 -40 -16 -50 C-12 -72 -2 -88 4 -100 C10 -80 18 -66 24 -56 C30 -64 34 -74 38 -78 C46 -58 60 -32 54 0 Z', hot, 4))
        a.append(s('M-38 0 C-42 -18 -32 -30 -26 -42 C-20 -30 -14 -28 -8 -36 C-4 -50 2 -62 6 -70 C10 -54 16 -44 20 -38 C26 -44 28 -50 30 -52 C36 -38 42 -20 38 0 Z', core, 3))
        a.append(s('M-16 0 C-18 -10 -12 -18 -6 -26 C-2 -18 2 -16 6 -22 C8 -14 12 -8 12 0 Z', '#FFFFFF', 2))
        sprite(pre + '_a', (-66, -106, 132, 110), a)
        b = [halo(0, -50, 70, hot, 0.18)]
        b.append(s('M-54 0 C-60 -22 -50 -50 -40 -70 C-34 -50 -28 -46 -20 -56 C-16 -74 -8 -84 -2 -96 C6 -78 14 -70 20 -62 C26 -70 32 -78 40 -84 C46 -60 58 -30 52 0 Z', hot, 4))
        b.append(s('M-36 0 C-40 -16 -34 -32 -28 -46 C-22 -34 -16 -32 -10 -40 C-6 -54 0 -60 4 -66 C8 -54 14 -46 18 -42 C24 -48 28 -54 32 -58 C38 -40 42 -20 38 0 Z', core, 3))
        b.append(s('M-14 0 C-16 -12 -10 -20 -4 -28 C0 -20 4 -18 8 -24 C10 -14 12 -8 12 0 Z', '#FFFFFF', 2))
        sprite(pre + '_b', (-66, -106, 132, 110), b)
    lg = [beam('M-60 -8 L52 -16', WOOD_D, 13, 4), beam('M-50 -16 L58 -6', WOOD, 13, 4), c(-58, -8, 6.5, '#C9A27A', 3), c(58, -6, 6.5, '#C9A27A', 3)]
    sprite('logs', (-72, -30, 144, 36), lg)


def rug():
    o = [e(0, 0, 176, 46, '#9E2F2E', 4.5), e(0, 0, 160, 38, 'none', 0)]
    o.append('<ellipse cx="0" cy="0" rx="156" ry="36" style="fill: none; stroke: #F2C230; stroke-width: 5"/>')
    o.append('<ellipse cx="0" cy="0" rx="138" ry="28" style="fill: #B8383A; stroke: #1E1A1A; stroke-width: 2.5"/>')
    for x in (-90, -30, 30, 90):
        o.append(s(f'M{x} -14 L{x + 14} 0 L{x} 14 L{x - 14} 0 Z', GOLD, 2.5))
    for k in range(-5, 6):
        o.append(ln(f'M{k * 28} 44 V54', GOLD_D, 3) if False else '')
    sprite('rug', (-184, -52, 368, 104), o)


HAY, HAY_D = '#D9B24C', '#B8902E'


def paddock_props():
    """Out in the paddock: a hay bale, and a water trough on legs."""
    o = [s('M-58 0 C-64 -18 -64 -50 -56 -66 H56 C64 -50 64 -18 58 0 Z', HAY, 4)]
    o.append(s('M-56 -66 C-40 -74 40 -74 56 -66 C40 -60 -40 -60 -56 -66 Z', '#E6C462', 3.5))
    for (x1, y1, x2, y2) in ((-44, -50, -30, -40), (-12, -54, 4, -46), (36, -48, 46, -36), (-40, -20, -26, -12), (8, -24, 22, -14), (40, -16, 48, -6)):
        o.append(ln(f'M{x1} {y1} L{x2} {y2}', HAY_D, 2.6))
    for x in (-24, 24):
        o.append(ln(f'M{x} -70 C{x - 3} -46 {x - 3} -22 {x} 0', WOOD_D, 4))
    for (x1, y1, x2, y2) in ((-34, -68, -40, -82), (-6, -70, -2, -86), (14, -68, 22, -80), (40, -66, 50, -76)):
        o.append(ln(f'M{x1} {y1} L{x2} {y2}', HAY, 3) )
    sprite('hay_bale', (-68, -90, 136, 94), o)
    t = []
    for x in (-58, 58):
        t.append(s(f'M{x - 7} -34 L{x - 10} 0 H{x + 4} L{x + 7} -34 Z', WOOD_D, 3.5))
    t.append(s('M-80 -76 H80 L68 -30 H-68 Z', WOOD, 4))
    t.append(s('M-76 -78 C-40 -84 40 -84 76 -78 C40 -72 -40 -72 -76 -78 Z', FROST, 3.5))
    t.append(ln('M-46 -79 C-30 -81 -12 -81 4 -80', FROST_L, 3))
    t.append(ln('M-74 -56 H74', WOOD_D, 3) + ln('M-50 -76 L-46 -30 M50 -76 L46 -30', '#4A4458', 5))
    sprite('trough', (-86, -90, 172, 94), t)


def workbench():
    """The brewing room's bench: a mortar and pestle, a bunch of herbs, bottles waiting to be filled."""
    o = [s('M-96 -70 H96 V-56 H-96 Z', WOOD, 4), s('M-86 -56 H-72 V0 H-86 Z', WOOD_D, 3.5), s('M72 -56 H86 V0 H72 Z', WOOD_D, 3.5)]
    o.append(s('M-86 -24 H86 V-14 H-86 Z', WOOD_D, 3.5))
    o.append(s('M-70 -14 C-76 -2 -60 2 -50 0 C-40 2 -26 -2 -32 -14 Z', '#C9A27A', 3) + s('M-28 -14 C-32 -4 -20 0 -12 0 C-4 0 4 -4 0 -14 Z', '#B89068', 3))
    o.append(s('M-74 -70 C-76 -96 -36 -96 -38 -70 Z', STONE, 3.5) + e(-56, -88, 18, 4, STONE_D, 3))
    o.append(beam('M-50 -90 L-30 -120', BONE, 5, 3.2))
    o.append(ln('M-14 -72 L10 -86 M-12 -72 L4 -96 M-8 -72 L18 -92', '#4E8A3E', 3.5))
    for (x, y, col) in ((10, -88, '#7DBE5C'), (2, -98, '#9BE15D'), (18, -94, '#7DBE5C')):
        o.append(e(x, y, 7, 4.5, col, 2.6))
    o.append(s('M-16 -76 H-4 V-70 H-16 Z', RED, 2.4))
    for (x, col, h) in ((40, '#C9D2DC', 30), (58, GRN, 38), (76, PURP, 26)):
        o.append(s(f'M{x - 7} -70 V{-70 - h + 10} C{x - 7} {-70 - h + 4} {x - 4} {-70 - h + 2} {x - 4} {-70 - h} H{x + 4} C{x + 4} {-70 - h + 2} {x + 7} {-70 - h + 4} {x + 7} {-70 - h + 10} V-70 Z', col, 3))
        o.append(s(f'M{x - 5} {-70 - h} H{x + 5} V{-70 - h - 6} H{x - 5} Z', WOOD, 2.4))
    sprite('workbench', (-100, -126, 200, 130), o)


def window():
    o = [s('M-74 0 V-150 C-74 -210 74 -210 74 -150 V0 Z', WOOD, 4.5)]
    o.append(s('M-60 -10 V-148 C-60 -196 60 -196 60 -148 V-10 Z', '#2A2650', 3))
    o.append(c(28, -140, 14, '#FFF3C4', 3) + c(34, -144, 11, '#2A2650', 0))
    o.append(s('M-60 -10 V-60 L-30 -96 L-10 -76 L14 -118 L40 -78 L60 -96 V-10 Z', '#4A4466', 3))
    o.append(s('M14 -118 L4 -100 L10 -102 L14 -96 L20 -104 Z', '#F0E8D2', 2))
    for (x, y) in ((-34, -150), (-14, -170), (44, -110), (-44, -120)):
        o.append(c(x, y, 2, '#FFF3C4', 0))
    o.append(ln('M0 -10 V-192 M-60 -96 H60', WOOD_D, 6) + ln('M0 -10 V-192 M-60 -96 H60', WOOD, 3))
    o.append(s('M-84 -6 H84 V8 H-84 Z', WOOD, 4))
    sprite('window', (-90, -214, 180, 226), o)


def door():
    o = [s('M-80 0 V-200 C-80 -270 80 -270 80 -200 V0 Z', STONE, 4.5)]
    o.append(s('M-62 0 V-196 C-62 -248 62 -248 62 -196 V0 Z', WOOD, 4))
    for x in (-31, 0, 31):
        o.append(ln(f'M{x} -236 V0', WOOD_D, 3))
    o.append(s('M-62 -170 H62 V-156 H-62 Z M-62 -60 H62 V-46 H-62 Z', '#4A4458', 3))
    o.append(c(40, -100, 6, GOLD, 3))
    sprite('door', (-86, -272, 172, 276), o)


def furniture():
    t = [s('M-90 -64 H90 V-50 H-90 Z', WOOD, 4), s('M-80 -50 H-66 V0 H-80 Z', WOOD_D, 3.5), s('M66 -50 H80 V0 H66 Z', WOOD_D, 3.5)]
    t.append(s('M-50 -88 H-30 V-64 H-50 Z', '#C9A27A', 3) + s('M-52 -92 H-28 V-86 H-52 Z', '#F6F1E4', 2.5) + ln('M-30 -82 C-22 -82 -22 -70 -30 -70', K, 3))
    t.append(s('M20 -84 H36 V-64 H20 Z', '#C9A27A', 3) + ln('M36 -80 C42 -80 42 -70 36 -70', K, 3))
    t.append(s('M56 -84 H64 V-64 H56 Z', '#F0E8D2', 2.5) + s('M60 -94 C64 -90 63 -86 60 -84 C57 -86 56 -90 60 -94 Z', FLAME, 2) + halo(60, -90, 16, FLAME, 0.3))
    sprite('table', (-96, -100, 192, 104), t)
    st = [s('M-26 -40 H26 V-30 H-26 Z', WOOD, 3.5), ln('M-18 -30 L-22 0 M18 -30 L22 0', WOOD_D, 5) ]
    sprite('stool', (-30, -44, 60, 48), st)
    b = [s('M-34 -86 C-40 -60 -40 -26 -34 0 H34 C40 -26 40 -60 34 -86 Z', WOOD, 4)]
    b.append(ln('M-38 -66 H38 M-38 -20 H38', '#4A4458', 5))
    b.append(e(0, -86, 34, 8, WOOD_D, 3.5))
    sprite('barrel', (-44, -98, 88, 102), b)
    sh = [s('M-80 -6 H80 V4 H-80 Z', WOOD, 3.5), ln('M-60 4 L-56 18 M60 4 L56 18', WOOD_D, 4)]
    sh.append(s('M-66 -6 V-40 C-66 -48 -50 -48 -50 -40 V-6 Z', '#4E9A4A', 3) + s('M-62 -48 H-54 V-56 H-62 Z', '#C9A27A', 2))
    sh.append(s('M-36 -6 V-30 C-36 -38 -16 -38 -16 -30 V-6 Z', '#6A4BA3', 3))
    sh.append(s('M4 -6 V-44 H22 V-6 Z', '#C8403F', 3) + s('M22 -6 V-38 H34 V-6 Z', '#3D7FC1', 3) + s('M34 -6 V-42 H44 V-6 Z', '#E7B53C', 3))
    sh.append(s('M54 -6 C50 -18 70 -18 66 -6 Z', '#9AA7B8', 2.5))
    sprite('shelf', (-86, -62, 172, 84), sh)
    w = [s('M-50 0 C-50 -14 50 -14 50 0 Z', WOOD_D, 3.5)]
    for x in (-34, -10, 14, 36):
        w.append(c(x, -14, 11, WOOD, 3) + c(x, -14, 5, '#C9A27A', 2))
    for x in (-22, 2, 26):
        w.append(c(x, -32, 11, WOOD, 3) + c(x, -32, 5, '#C9A27A', 2))
    sprite('woodpile', (-56, -48, 112, 52), w)
    hk = [beam('M-46 4 H46', WOOD, 4.5, 3.5), ln('M-30 4 V12 M30 4 V12', K, 3)]
    sprite('banner_rod', (-52, -4, 104, 20), hk)


# ================================================================ the house: the things you tap
def lectern():
    """The collection log: a big open book on a stand."""
    o = [s('M-46 0 L-38 -16 H38 L46 0 Z', WOOD_D, 4), s('M-11 -16 V-100 H11 V-16 Z', WOOD, 4)]
    o.append(s('M-72 -98 H72 L64 -114 H-64 Z', WOOD, 4))
    o.append(s('M-70 -112 C-42 -124 -12 -122 0 -114 C12 -122 42 -124 70 -112 L66 -124 C40 -134 10 -132 0 -124 C-10 -132 -40 -134 -66 -124 Z', RED, 3.5))
    page = 'M0 -122 C-12 -130 -40 -132 -62 -124 L-58 -172 C-38 -180 -12 -178 0 -170 Z'
    o.append(both(page, BONE, 3.5))
    for i, y in enumerate((-160, -150, -140, -130)):
        w = 38 if i % 2 else 30
        o.append(ln(f'M-{8 + w} {y - 2} C-{8 + w // 2} {y - 5} -14 {y - 4} -8 {y - 1} M8 {y - 1} C14 {y - 4} {8 + w // 2} {y - 5} {8 + w} {y - 2}', BONE_D, 2.4))
    o.append(ln('M0 -122 V-170', BONE_D, 2.6))
    o.append(s('M5 -124 L8 -92 L12 -98 L16 -92 L13 -124 Z', RED, 2.4))
    o.append(ln('M-54 -170 C-40 -175 -24 -175 -12 -172', '#FFFFFF', 2.2))
    sprite('lectern', (-78, -186, 156, 190), o)


def armor_stand():
    """Your gear on a stand: helm, pauldrons, a breastplate."""
    o = [s('M-46 0 L-38 -14 H38 L46 0 Z', WOOD_D, 4), s('M-7 -14 V-96 H7 V-14 Z', WOOD, 4)]
    chest = 'M-38 -176 C-44 -146 -40 -112 -26 -94 H26 C40 -112 44 -146 38 -176 C18 -184 -18 -184 -38 -176 Z'
    o.append(s(chest, STEEL, 4))
    o.append(ln('M0 -178 V-100', STEEL_D, 3) + ln('M-28 -150 C-20 -146 -10 -146 -4 -150', STEEL_L, 3))
    o.append(s('M-30 -106 H30 V-92 H-30 Z', WOOD_D, 3.5) + s('M-7 -106 H7 V-92 H-7 Z', GOLD, 2.5))
    o.append(both('M-36 -178 C-60 -184 -76 -166 -72 -144 C-60 -150 -48 -154 -34 -154 Z', STEEL_D, 4))
    o.append(ln('M-62 -168 C-56 -172 -48 -172 -42 -170', STEEL_L, 2.6))
    o.append(s('M-8 -188 V-176 H8 V-188 Z', WOOD, 3))
    o.append(s('M-26 -192 C-26 -226 26 -226 26 -192 L26 -184 H-26 Z', STEEL, 4) + ln('M-16 -200 H16', K, 4))
    o.append(s('M-2 -224 C4 -242 22 -240 28 -226 C16 -226 8 -222 2 -218 Z', RED, 3))
    sprite('armor_stand', (-80, -246, 160, 250), o)


def weapon_rack():
    o = [s('M-92 0 V-176 H-80 V0 Z', WOOD_D, 4), s('M80 0 V-176 H92 V0 Z', WOOD_D, 4), s('M-96 -186 H96 V-172 H-96 Z', WOOD, 4)]
    o.append(s('M-46 -54 V-196 L-40 -210 L-34 -196 V-54 Z', STEEL_L, 3.5) + ln('M-40 -62 V-190', STEEL, 2))
    o.append(s('M-58 -58 H-22 V-48 H-58 Z', GOLD, 3) + s('M-44 -48 V-24 H-36 V-48 Z', WOOD_D, 3) + c(-40, -20, 5, GOLD, 3))
    o.append(beam('M8 -14 V-186', WOOD, 6, 3.5) + c(8, -198, 12, FROST, 3.5) + c(4, -202, 4, '#FFFFFF', 0))
    o.append(beam('M52 -14 V-176', WOOD, 6, 3.5) + s('M55 -174 C80 -184 92 -156 82 -138 C72 -144 64 -146 55 -144 Z', STEEL_L, 3.5))
    o.append(s('M-96 -40 H96 V-28 H-96 Z', WOOD, 4))
    sprite('weapon_rack', (-100, -216, 200, 220), o)


def larder():
    """The satchel at home: shelves of jars, sacks on the floor."""
    o = [s('M-96 0 V-232 H96 V0 Z', WOOD_D, 4.5), s('M-84 -8 V-220 H84 V-8 Z', '#5A3A22', 0)]

    def jar(x, y, col, h=30):
        return (s(f'M{x - 14} {y} V{y - h} C{x - 14} {y - h - 6} {x - 9} {y - h - 8} {x - 9} {y - h - 12} H{x + 9} C{x + 9} {y - h - 8} {x + 14} {y - h - 6} {x + 14} {y - h} V{y} Z', col, 3)
                + s(f'M{x - 11} {y - h - 12} H{x + 11} V{y - h - 19} H{x - 11} Z', WOOD, 2.5) + ln(f'M{x - 7} {y - 8} V{y - h + 4}', '#FFFFFF', 2.4))
    for y in (-152, -84):
        o.append(s(f'M-90 {y} H90 V{y + 10} H-90 Z', WOOD, 3.5))
    o.append(jar(-56, -152, '#C9D2DC') + jar(-14, -152, GRN, 36) + jar(30, -152, '#9E2F2E') + jar(66, -152, '#C9D2DC', 24))
    o.append(jar(-50, -84, '#E9C46A', 26) + s('M-6 -84 V-120 L4 -130 V-142 H12 V-130 L22 -120 V-84 Z', PURP, 3) + jar(56, -84, GRN, 28))
    sack = 'M-72 -8 C-80 -40 -62 -62 -52 -66 L-46 -76 L-40 -66 C-28 -60 -14 -40 -22 -8 Z'
    o.append(s(sack, '#C9A27A', 3.5) + ln('M-52 -66 H-40', K, 3) + s('M10 -8 C4 -32 18 -48 30 -50 C46 -48 58 -32 50 -8 Z', '#B89068', 3.5))
    o.append(s('M-90 -232 H90 V-220 H-90 Z', WOOD, 3.5))
    sprite('larder', (-100, -238, 200, 242), o)


def barrow_door():
    """The way down to the Barrow: a stone arch, an old door, green light round its edges."""
    o = [halo(0, -170, 200, GRN, 0.2)]
    o.append(s('M-160 0 V-226 C-160 -330 160 -330 160 -226 V0 Z', STONE, 5))
    for y in (-50, -100, -150, -200):
        o.append(ln(f'M-160 {y} H-120 M120 {y} H160', STONE_D, 3))
    for k in range(1, 7):
        a = math.pi * k / 7
        o.append(ln(f'M{f(-120 * math.cos(a))} {f(-222 - 78 * math.sin(a))} L{f(-160 * math.cos(a))} {f(-226 - 104 * math.sin(a))}', STONE_D, 3))
    o.append(s('M-120 0 V-222 C-120 -300 120 -300 120 -222 V0 Z', '#22301F', 4))
    o.append(s('M-114 0 V-220 C-114 -292 114 -292 114 -220 V0 Z', GRN, 0))
    o.append(s('M-104 0 V-218 C-104 -282 104 -282 104 -218 V0 Z', '#5E4A3A', 4))
    for x in (-52, 0, 52):
        o.append(ln(f'M{x} -6 V{-262 if x == 0 else -252}', '#4A3A2E', 3))
    o.append(s('M-104 -74 H104 V-58 H-104 Z', '#4A4458', 3.5) + s('M-104 -200 H104 V-184 H-104 Z', '#4A4458', 3.5))
    for x in (-80, -28, 28, 80):
        o.append(c(x, -66, 3.4, STEEL, 2) + c(x, -192, 3.4, STEEL, 2))
    o.append(ln('M44 -124 C44 -142 68 -142 68 -124 C68 -106 44 -106 44 -124', K, 7) + ln('M44 -124 C44 -142 68 -142 68 -124 C68 -106 44 -106 44 -124', STEEL, 3.5))
    o.append(s('M-40 -334 H40 L32 -284 H-32 Z', STONE_T, 4))
    o.append(A.skull(0, -314, 1.5, GRN))
    for (x, y, sx) in ((-160, -180, 1), (160, -96, -1), (-160, -40, 1)):
        o.append(s(f'M{x} {y} C{x + sx * 12} {y - 10} {x + sx * 20} {y + 6} {x + sx * 30} {y - 2} C{x + sx * 30} {y + 12} {x + sx * 16} {y + 18} {x} {y + 16} Z', '#5E8A4E', 3))
    sprite('barrow_door', (-172, -346, 344, 350), o)


def bricked_arch():
    """A dungeon still to come: an arch bricked up, with a chalk mark."""
    o = [s('M-110 0 V-168 C-110 -240 110 -240 110 -168 V0 Z', STONE, 4.5)]
    o.append(s('M-80 0 V-166 C-80 -218 80 -218 80 -166 V0 Z', '#5E5470', 4))
    for i, y in enumerate(range(-26, -170, -26)):
        o.append(ln(f'M-80 {y} H80', '#4A4060', 3))
        for x in range(-60 if i % 2 else -40, 80, 40):
            o.append(ln(f'M{x} {y} V{y + 26}', '#4A4060', 3))
    o.append(ln('M-12 -124 C-12 -142 14 -142 14 -126 C14 -112 0 -112 0 -98 M0 -84 V-82', '#E9E4D8', 5))
    sprite('bricked_arch', (-116, -238, 232, 242), o)


def bunk(name, top, low):
    """A bunk bed: two beds, one above the other, for two of your heroes."""
    o = [s('M-84 0 V-278 H-70 V0 Z', WOOD_D, 4), s('M70 0 V-278 H84 V0 Z', WOOD_D, 4)]
    for (y, col) in ((-34, low), (-176, top)):
        o.append(s(f'M-70 {y} V{y - 30} C-70 {y - 40} -62 {y - 44} -54 {y - 44} H70 V{y} Z', col, 4))
        o.append(ln(f'M-14 {y - 42} V{y - 4}', K, 2.6) + ln(f'M-6 {y - 38} H62', '#FFFFFF', 2.4).replace('stroke: #FFFFFF', 'stroke: #FFFFFF; opacity: 0.35'))
        o.append(s(f'M-66 {y - 40} C-66 {y - 58} -24 {y - 58} -24 {y - 42} C-24 {y - 36} -66 {y - 34} -66 {y - 40} Z', BONE, 3.5))
        o.append(s(f'M-84 {y} H84 V{y + 14} H-84 Z', WOOD, 4))
    o.append(s('M-84 -278 H84 V-266 H-84 Z', WOOD, 3.5) + s('M-70 -240 H20 V-230 H-70 Z', WOOD, 3))
    sprite(name, (-90, -284, 180, 288), o)


def signpost():
    o = [s('M-8 0 V-204 H8 V0 Z', WOOD_D, 4)]
    o.append(s('M76 -196 H-46 L-70 -172 L-46 -148 H76 Z', '#C9A27A', 4))
    o.append(s('M-40 -134 H44 L60 -118 L44 -102 H-40 Z', '#B89068', 3.5))
    o.append(c(0, -172, 3, K, 0) + c(0, -118, 3, K, 0))
    sprite('signpost', (-76, -210, 156, 214), o)


# ================================================================ the heroic Barrow, and the log rewards
KEEPER_GILD = {GK_COAT: '#C9962A', GK_COAT_D: '#8A6418', '#C9CFC2': '#FFE08A', '#4A4458': '#8A6418'}
PLUME_GILD = {'#C8403F': GOLD, '#9E2F2E': GOLD_D, '#E97A6E': '#FFE08A', '#D9A520': '#B8862A'}


def risen_head(o, cy=5, k=1.15):
    """a Risen warrior's head: the long skull with green eyes under its iron crown (the hero at the end of the Barrow
    log's bar), drawn like the hero's own (art_heads.py) with the middle of its eyes at (0, cy)"""
    W = lambda w: w / k
    crown = [s('M-14.5 -11 C-14.5 -27 14.5 -27 14.5 -11 Z', RIRON, W(4)) + s('M-16 -14 H16 V-8 H-16 Z', RIRON_D, W(3.2))]
    crown += [s(f'M{x - 3} -23 L{x} -36 L{x + 3} -23 Z', RIRON_L, W(2.6)) for x in (-10, -3.5, 3.5, 10)]
    o.append(f'<g transform="translate(0 {f(cy)}) scale({k})">' + ''.join(heads.risen_head(k, glow=1.6) + crown) + '</g>')


def race_icons():
    """64x64 portrait tiles for the seven races in the hero maker."""
    W = lambda w: w / 1.15
    # dwarf: horned helm, copper beard, big nose
    beard = [s('M-16 2 C-20 14 -14 26 0 28 C14 26 20 14 16 2 Z', heads.BEARD, W(3.5)),
             ln('M-6 10 C-7 16 -5 22 -2 25 M6 10 C7 16 5 22 2 25', heads.BEARD_D, W(2.2))]
    helm = [s('M-14 -10 C-22 -12 -26 -20 -24 -28 C-20 -21 -15 -17 -10 -15 Z', BONE, W(3)),
            s('M14 -10 C22 -12 26 -20 24 -28 C20 -21 15 -17 10 -15 Z', BONE, W(3)),
            s('M-16 -4 C-16 -22 16 -22 16 -4 Z', STEEL, W(3.5)),
            s('M-17 -6 H17 V-1 H-17 Z', STEEL_D, W(3))]
    icon('c_dwarf', '#4A3324', [f'<g transform="translate(0 2) scale(1.15)">' + ''.join(beard + heads.dwarf_face(1.15) + helm) + '</g>'], k=0.82, ground=34)
    # elf: long ears, silver hair, frost brow star
    eb, ef = heads.elf_head(1.15, back_len=24)
    icon('c_elf', '#1F3D5E', [f'<g transform="translate(0 3) scale(1.15)">' + ''.join(eb + ef) + '</g>'], k=0.82, ground=34)
    # human: warm brown skin, bun and gold circlet
    icon('c_human', '#2D4568', [f'<g transform="translate(0 4) scale(1.15)">' + ''.join(heads.human_head(1.15, bun=True, circlet=True)) + '</g>'], k=0.84, ground=34)
    # gnome: rosy cheeks, copper-blond hair, big brass goggles on forehead
    icon('c_gnome', '#3E3258', [f'<g transform="translate(0 5) scale(1.02)">' + ''.join(heads.gnome_head(1.02, fem=False, goggles=True)) + '</g>'], k=0.88, ground=34)
    # goblin: wide notched ears, sharp green chin, gold eyes, grin with fang
    icon('c_goblin', '#2B4634', [f'<g transform="translate(0 4) scale(1.0)">' + ''.join(heads.goblin_head(1.0, fem=False)) + '</g>'], k=0.72, ground=34)
    # orc: broad olive-grey jaw, heavy brow, two lower tusks, fierce orange eyes
    orc = [both('M-13 -3 C-18 -6 -21 -2 -16 4 Z', '#6E8258', 2.8),
           s('M-14 -14 C-8 -20 8 -20 14 -14 C16 -2 14 13 0 16 C-14 13 -16 -2 -14 -14 Z', '#6E8258', 3.4),
           s('M-11 -15 C-6 -22 6 -22 11 -15 C6 -17 -6 -17 -11 -15 Z', '#2B2422', 2.8),
           e(-5.8, -2, 3.4, 3, '#E07A2E', 2.2) + c(-5.4, -2, 1.4, K, 0),
           e(5.8, -2, 3.4, 3, '#E07A2E', 2.2) + c(5.4, -2, 1.4, K, 0),
           ln('M-11 -7 L-2 -4.5 M11 -7 L2 -4.5', K, 3.4),
           s('M-3 1 C-4 5 4 5 3 1', '#546642', 2.4),
           ln('M-7 10 H7', K, 2.6),
           s('M-7 10 L-5 3.5 L-2.5 10 Z', BONE, 2.2),
           s('M7 10 L5 3.5 L2.5 10 Z', BONE, 2.2)]
    icon('c_orc', '#4E2626', orc, k=0.92, ground=34)


def heroic_drops():
    for n, extra in (('pet_keeper', KEEPER_GILD), ('mount_hound', {}), ('tr_plume', PLUME_GILD), ('tr_dye', {'#9FD9C6': GOLD, '#DCFFF0': '#FFE9A8'})):
        SP[n + '_gilded'] = {'svg': A.gild(SP[n]['svg'], extra), 'vb': SP[n]['vb']}
    for n, extra in (('c_pet_keeper', KEEPER_GILD), ('c_mount_hound', {}), ('c_plume', PLUME_GILD)):
        ICONS[n + '_gilded'] = A.gild(ICONS[n], extra, tile=True)
    o = []; risen_head(o)
    icon('c_risen', '#2E3A2A', o, k=0.8, ground=36)
    race_icons()
    o = [halo(0, 0, 28, GOLD, 0.3), A.bone_limb('M-22 -18 L22 18', 6) + A.bone_limb('M22 -18 L-22 18', 6)]
    for (x, y) in ((-22, -18), (22, -18), (-22, 18), (22, 18)):
        o.append(c(x - 3, y - 2, 4, BONE, 2.6) + c(x + 3, y + 2, 4, BONE, 2.6))
    o.append(A.skull(0, -4, 1.25))
    icon('c_gilded_bones', '#3A2C10', o, k=0.95, ground=34)
    ICONS['c_gilded_bones'] = A.gild(ICONS['c_gilded_bones'], tile=True)


def house_props():
    lectern(); armor_stand(); weapon_rack(); larder(); barrow_door(); bricked_arch(); signpost()
    bunk('bunk_a', BLUE, RED); bunk('bunk_b', '#4E9A4A', GOLD_D); bunk('bunk_c', PURP, '#2F8F8F')


def build():
    lanterns(); pets(); hound(); trophies(); fireplace(); fire(); rug(); paddock_props(); workbench(); window(); door(); furniture(); house_props(); heroic_drops()
    return SP


if __name__ == '__main__':
    build()
    ICONS.pop('c_lantern', None)
    os.makedirs(OUT, exist_ok=True)
    json.dump(SP, open(OUT + 'hearth.json', 'w'))
    json.dump(ICONS, open(OUT + 'collect_icons.json', 'w'))
    from urllib.parse import quote
    cells = []
    for k, v in SP.items():
        x, y, w, h = v['vb']
        sc = 1.6 if max(w, h) < 140 else (1.0 if max(w, h) < 260 else 0.5)
        cells.append(f'<figure style="margin:0;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="background:#5C5070;padding:8px;border-radius:8px">'
                     f'<img src="data:image/svg+xml;charset=utf-8,{quote(v["svg"])}" style="width:{w * sc:.0f}px;height:{h * sc:.0f}px;display:block"></div>'
                     f'<figcaption style="font:12px monospace;color:#ddd">{k}</figcaption></figure>')
    icons = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:72px;height:72px;border-radius:13px;overflow:hidden;border:3px solid #1E1A1A">{v.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div><span style="font:12px monospace;color:#ddd">{k}</span></div>' for k, v in ICONS.items())
    open(OUT + '_hearth_preview.html', 'w').write('<body style="margin:0;padding:16px;background:#2A2234"><div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;width:1500px">' + ''.join(cells) + '</div><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;width:1500px">' + icons + '</div></body>')
    print('hearth sprites', len(SP), 'icons', len(ICONS), 'bytes', sum(len(v['svg']) for v in SP.values()))
