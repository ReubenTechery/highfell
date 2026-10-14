# The heroes, front (`_f`) and back (`_b`), in the locked TV-cartoon style: "Big Shoulders", where the armour
# is the silhouette (huge pauldrons and mantles, big hands and weapons) over the faces in art_heads.py. Every
# sprite is drawn around its ground point (0, 0); from behind, the weapon is in the other hand.
# The shapes are written at 1.25 times game size (the scale they were designed at). The helpers below shrink
# each one by Z as it is drawn and keep the ink at full weight, so heroes stand as tall as the mobs expect.
# The Risen are bones in their class's clothes; Gilded Bones is the same art with the bones in gold.
# Built into art/sprites.json by art_sprites.py.
import math
import art_sprites as A
from art_sprites import K, LW, f, BONE, BONE_D, GRN, GRN_L, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, BLUE, BLUE_D, WOOD, WOOD_D, \
    RUST, PURP, PURP_D, FROST, FROST_L
import art_heads as H
from art_heads import tp, BEARD, BEARD_D, HSKIN, ESKIN, HBLUE

Z = 0.8
HEROES = {}

# cloth, leather and iron
BOOT, BLUE_DD = '#4A3428', '#2E4670'
ROBE, IROBE, IROBE_D = '#F6F1E4', '#3D7FC1', '#2F6699'
RIRON, RIRON_D, RIRON_L, RSHIELD = '#7A7484', '#5C5768', '#A39DB0', '#4A4060'
RCLOTH, RCLOTH_D, RROBE, RROBE_D, MOSS = '#3A3348', '#2A2434', '#35587F', '#2A4566', '#6E8A5A'
RHAIR, RHAIR_D, LANTERN = '#C9D2DC', '#9DA8B6', '#4A4458'


# ---------------------------------------------------------------- the helpers, shrinking by Z
def s(d, fill, w=LW):
    return A.s(tp(d, k=Z), fill, w)


def ln(d, col=K, w=3):
    """ink keeps its weight; a coloured line is part of the shape and shrinks with it"""
    return A.ln(tp(d, k=Z), col, w if col == K else w * Z)


def beam(d, col, w=5, edge=LW):
    return A.beam(tp(d, k=Z), col, w * Z, edge)


def c(x, y, r, fill, w=LW):
    return A.c(x * Z, y * Z, r * Z, fill, w)


def e(x, y, rx, ry, fill, w=LW):
    return A.e(x * Z, y * Z, rx * Z, ry * Z, fill, w)


def halo(x, y, r, col, op=0.26):
    return A.halo(x * Z, y * Z, r * Z, col, op)


def m(d):
    return A.m(d)


def both(d, fill, w=LW):
    return s(d, fill, w) + s(m(d), fill, w)


def bone_limb(d, w=5.5):
    return beam(d, BONE, w, 3.6)


def bone_hand(x, y, r=5.5):
    return A.bone_hand(x * Z, y * Z, r * Z)


def ribcage(cx, top, wd, ht):
    return A.ribcage(cx * Z, top * Z, wd * Z, ht * Z)


def head(x, y, parts):
    """a head from art_heads.py (drawn with k = Z) with the middle of its eyes at (x, y)"""
    return f'<g transform="translate({f(x * Z)} {f(y * Z)}) scale({Z})">' + ''.join(parts) + '</g>'


def sprite(name, vb, body, note):
    """vb is in the design's units: shrunk, then grown by the ink's reach"""
    x, y, w, h = vb
    x0, y0, x1, y1 = math.floor(x * Z - 2), math.floor(y * Z - 2), math.ceil((x + w) * Z + 2), math.ceil((y + h) * Z + 2)
    HEROES[name] = {'svg': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" width="{x1 - x0}" height="{y1 - y0}">' + ''.join(body) + '</svg>',
                    'vb': [x0, y0, x1 - x0, y1 - y0], 'note': note}


def back_vb(vb):
    x, y, w, h = vb
    return (-(x + w), y, w, h)


# ---------------------------------------------------------------- the dwarf warrior
D_AXE = 'M-46 -104 C-64 -116 -76 -96 -72 -76 C-62 -84 -54 -84 -47 -80 Z'
D_AXE_SHINE = 'M-52 -100 C-62 -104 -68 -96 -68 -86'
D_ARM_AXE = 'M-30 -70 C-40 -64 -45 -56 -46 -50 L-37 -48 C-36 -54 -33 -60 -26 -64 Z'
D_ARM_SHIELD = 'M30 -70 C40 -66 45 -60 46 -54 L38 -51 C37 -57 34 -62 26 -64 Z'
D_VB = (-80, -138, 148, 144)


def dwarf_legs(o):
    o.append(both('M-25 -15 H-5 V0 H-30 C-32 -6 -30 -12 -25 -15 Z', BOOT))
    o.append(both('M-25 -15 H-5 V-11 H-26 Z', STEEL_D, 3))
    o.append(both('M-21 -34 H-5 V-15 H-23 Z', BLUE_D))


def dwarf_shoulders(o):
    """the big pauldrons: a lame under the dome, the dome, and its trimmed rim"""
    o.append(both('M-57 -66 C-46 -72 -32 -72 -22 -68 L-23 -61 C-32 -64 -45 -62 -55 -56 Z', STEEL_D))
    o.append(both('M-14 -84 C-18 -101 -52 -104 -60 -79 L-58 -69 C-46 -76 -27 -78 -14 -76 Z', STEEL))
    o.append(both('M-58 -69 C-46 -76 -27 -78 -14 -76 L-14 -71 C-28 -73 -45 -71 -57 -63 Z', BLUE, 3.5))
    o.append(ln('M-48 -90 C-40 -96 -28 -97 -21 -92 M48 -90 C40 -96 28 -97 21 -92', STEEL_L, 3))
    for x, y in ((50, -69), (38, -73.5), (26, -75)):
        o.append(c(-x, y, 1.8, K, 0) + c(x, y, 1.8, K, 0))


def dwarf_helm(o, back=False, fem=False):
    if fem:
        # lush copper hair crown on top of the head, with a winged Valkyrie war-coronet & bone horns
        o.append(s('M-16.5 -98 C-17.5 -121 17.5 -121 16.5 -98 Z', BEARD, 3.5))
        o.append(ln('M-8 -115 C-11 -109 -12 -103 -11 -98 M8 -115 C11 -109 12 -103 11 -98 M0 -117 V-104', BEARD_D, 2.2))
        o.append(both('M-15 -106 C-28 -108 -36 -120 -33 -132 C-27 -123 -21 -118 -12 -115 Z', BONE, 3.5))
        if back:
            o.append(s('M-18 -101 H18 V-95 H-18 Z', GOLD, 3.2))
        else:
            o.append(s('M-18 -96 L-18 -102 L-9 -100 L0 -111 L9 -100 L18 -102 L18 -96 Z', GOLD, 3.2))
            o.append(c(0, -102, 3.2, FROST, 2.2))
        return
    o.append(s('M-17 -98 C-17 -121 17 -121 17 -98 Z', STEEL) + s('M-18.5 -101.5 H18.5 V-95.5 H-18.5 Z', STEEL_D, 3.5))
    if back:
        o.append(ln('M0 -118 V-102', STEEL_D, 3))
    else:
        o.append(c(-9, -98.5, 1.4, K, 0) + c(9, -98.5, 1.4, K, 0) + c(0, -98.5, 1.4, K, 0))
    o.append(both('M-15 -107 C-28 -109 -36 -121 -33 -133 C-27 -124 -21 -119 -12 -116 Z', BONE, 3.5))
    if not back:
        o.append(c(0, -111, 3.2, FROST, 2.2))


def round_shield(o, x, y, back=False):
    o.append(c(x, y, 23, BLUE))
    if back:
        o.append(c(x, y, 16.5, WOOD, 3) + ln(f'M{x} {y - 16} V{y + 16} M{x - 16} {y} H{x + 16}', WOOD_D, 2.6) + s(f'M{x - 9} {y - 4} H{x + 9} V{y + 4} H{x - 9} Z', '#4A3A30', 3))
    else:
        o.append(c(x, y, 16.5, BLUE_D, 3) + c(x, y, 6, GOLD, 3))
    for a in range(0, 360, 45):
        o.append(c(x + 19.5 * math.cos(math.radians(a)), y + 19.5 * math.sin(math.radians(a)), 1.6, K, 0))


def dwarf_front(fem=False, key='tank'):
    o = []
    dwarf_legs(o)
    # the breastplate, the belt and its buckle
    o.append(s('M-27 -82 C-31 -66 -30 -50 -25 -38 H25 C30 -50 31 -66 27 -82 Z', STEEL))
    o.append(ln('M-19 -76 C-22 -64 -21 -54 -18 -46', STEEL_L, 3.2))
    o.append(s('M-28 -42 H28 V-32 H-28 Z', BLUE, 3.5) + s('M-8 -44 H8 V-30 H-8 Z', GOLD, 3) + c(0, -37, 3, FROST, 2))
    if fem:
        # sculpted Valkyrie neckline, neck, gold chestplate trim, and rune medallion
        o.append(s('M-6 -86 H6 V-76 H-6 Z', H.DSKIN, 2.8))
        o.append(s('M-9 -82 L0 -71 L9 -82 Z', H.DSKIN, 2.8))
        o.append(ln('M-11 -80 L0 -68 L11 -80', GOLD, 3))
        o.append(c(0, -60, 5.5, GOLD, 2.6) + c(0, -60, 2.4, FROST, 0))
    else:
        # the beard over the plate
        o.append(s('M-16 -80 C-22 -64 -15 -50 0 -44 C15 -50 22 -64 16 -80 Z', BEARD) + ln('M-7 -70 C-7 -60 -5 -54 -3 -50 M7 -70 C7 -60 5 -54 3 -50', BEARD_D, 2.5))
        o.append(c(-3.5, -47, 2.8, GOLD, 2) + c(3.5, -47, 2.8, GOLD, 2))
    # arms: mail upper arms, a plate forearm, big gauntlets
    o.append(s(D_ARM_AXE, BLUE_DD))
    o.append(s('M-47 -54 L-36 -51 L-37 -44 L-48 -46 Z', STEEL, 3.5))
    o.append(s(D_ARM_SHIELD, BLUE_DD))
    round_shield(o, 40, -54)
    dwarf_shoulders(o)
    if fem:
        # two thick, multi-segment copper braids sweeping from the head over the chestplate
        for sx in (-1, 1):
            bx = 14 * sx
            o.append(c(bx, -81, 5.6, BEARD, 2.8) + c(bx * 1.05, -72, 5.4, BEARD, 2.8) + c(bx, -63, 5.0, BEARD, 2.8))
            o.append(s(f'M{bx - 4.2} -58 H{bx + 4.2} V-53 H{bx - 4.2} Z', GOLD, 2.4))
            o.append(s(f'M{bx - 3.5} -53 L{bx - 5.5} -44 L{bx} -46 L{bx + 5.5} -44 L{bx + 3.5} -53 Z', BEARD, 2.6))
    # the axe in front of the pauldron, in its gauntlet
    o.append(beam('M-44 -2 L-47 -108', BLUE_D, 5.5))
    o.append(s(D_AXE, STEEL_L) + ln(D_AXE_SHINE, '#FFFFFF', 2.2))
    o.append(c(-44, -42, 8.5, STEEL) + ln('M-48 -45 H-40 M-48 -40 H-40', STEEL_D, 2))
    o.append(head(0, -91.5, H.dwarf_face(Z, fem=fem)))
    dwarf_helm(o, fem=fem)
    sprite(key + '_f', D_VB, o, 'Dwarf warrior front')


def dwarf_back(fem=False, key='tank'):
    o = []
    dwarf_legs(o)
    # the back plate, the belt, a short cape, and the braid(s) down the back
    o.append(s('M-27 -82 C-31 -66 -30 -50 -25 -38 H25 C30 -50 31 -66 27 -82 Z', STEEL))
    o.append(s('M-28 -42 H28 V-32 H-28 Z', BLUE, 3.5))
    o.append(s('M-21 -82 C-25 -66 -25 -48 -22 -28 L-11 -32 L0 -27 L11 -32 L22 -28 C25 -48 25 -66 21 -82 Z', BLUE))
    if fem:
        for sx in (-1, 1):
            bx = 9 * sx
            o.append(c(bx, -78, 5, BEARD, 2.8) + c(bx, -69, 4.8, BEARD, 2.8) + c(bx, -60, 4.5, BEARD, 2.8))
            o.append(c(bx, -53, 3.4, GOLD, 2.2) + c(bx, -47, 4, BEARD, 2.5))
    else:
        o.append(s('M-5 -84 C-7 -72 -5 -60 0 -52 C5 -60 7 -72 5 -84 Z', BEARD, 3.5) + ln('M-3 -76 L3 -72 M-3 -66 L3 -62', BEARD_D, 2.2) + c(0, -52, 3, GOLD, 2.2))
    # the shield's back on the viewer's left, then the arm through its straps
    round_shield(o, -40, -54, back=True)
    o.append(s(m(D_ARM_SHIELD), BLUE_DD))
    # the axe arm on the viewer's right
    o.append(s(m(D_ARM_AXE), BLUE_DD))
    o.append(s(m('M-47 -54 L-36 -51 L-37 -44 L-48 -46 Z'), STEEL, 3.5))
    dwarf_shoulders(o)
    # the axe in front of the pauldron, in its gauntlet
    o.append(beam('M44 -2 L47 -108', BLUE_D, 5.5))
    o.append(s(m(D_AXE), STEEL_L) + ln(m(D_AXE_SHINE), '#FFFFFF', 2.2))
    o.append(c(44, -42, 8.5, STEEL) + ln('M40 -45 H48 M40 -40 H48', STEEL_D, 2))
    o.append(head(0, -91.5, H.dwarf_back(Z)))
    dwarf_helm(o, back=True, fem=fem)
    sprite(key + '_b', back_vb(D_VB), o, 'Dwarf warrior back')


# ---------------------------------------------------------------- the human cleric
C_SKIRT = 'M-15 -66 C-22 -44 -30 -21 -35 -3 H35 C30 -21 22 -44 15 -66 Z'
C_HEM = 'M-35 -9 C-12 -5 12 -5 35 -9 L36 -2 C12 2 -12 2 -36 -2 Z'
C_BODICE = 'M-17 -98 C-21 -86 -20 -76 -16 -68 H16 C20 -76 21 -86 17 -98 Z'
C_SLEEVE_STAFF = 'M-22 -94 C-33 -86 -40 -72 -43 -58 C-37 -53 -29 -53 -24 -58 C-24 -70 -21 -80 -15 -86 Z'
C_CUFF_STAFF = 'M-43 -58 C-37 -53 -29 -53 -24 -58 L-25 -52 C-30 -48 -37 -48 -43 -53 Z'
C_SLEEVE_HEAL = 'M22 -94 C32 -88 38 -78 40 -66 C35 -61 28 -61 24 -64 C23 -74 21 -82 15 -86 Z'
C_CUFF_HEAL = 'M40 -66 C35 -61 28 -61 24 -64 L25 -58 C29 -55 36 -55 41 -60 Z'
C_VB = (-62, -176, 116, 182)


def sun(x, y, r=10, rays=8, spin=22.5):
    o = halo(x, y, r * 2.1, '#F4B942', 0.3)
    for k in range(rays):
        a = math.radians(k * 360 / rays + spin)
        o += beam(f'M{f(x + (r + 1) * math.cos(a))} {f(y + (r + 1) * math.sin(a))} L{f(x + r * 1.75 * math.cos(a))} {f(y + r * 1.75 * math.sin(a))}', GOLD, 3.2, 3)
    return o + c(x, y, r, GOLD, 3.5) + c(x - r * 0.25, y - r * 0.25, r * 0.25, '#FFF6D0', 0)


def cleric_mantles(o, front=True):
    o.append(both('M-9 -100 C-15 -115 -40 -118 -47 -97 L-45 -88 C-34 -94 -20 -97 -9 -95 Z', ROBE))
    o.append(both('M-45 -88 C-34 -94 -20 -97 -9 -95 L-9 -90 C-21 -92 -34 -89 -44 -82 Z', GOLD, 3.2))
    if front:
        for x in (-29, 29):
            o.append(c(x, -103, 5.5, GOLD, 3) + c(x, -103, 2.2, HBLUE, 0))


def cleric_front(fem=True, key='healer'):
    o = []
    o.append(both('M-15 -7 H-3 V0 H-18 C-19 -3 -18 -6 -15 -7 Z', WOOD_D, 3.5))
    # the robe, its blue panel and gold hem
    o.append(s(C_SKIRT, ROBE))
    o.append(s('M-7 -64 L-11 -5 H11 L7 -64 Z', HBLUE, 3) + ln('M-9 -60 L-12 -6 M9 -60 L12 -6', GOLD, 2.2))
    o.append(s(C_HEM, GOLD, 3.5))
    # the bodice and the sash
    o.append(s(C_BODICE, ROBE))
    if fem:
        o.append(s('M-8 -98 L0 -84 L8 -98 Z', HBLUE, 2.8) + c(0, -83, 3.5, GOLD, 2.2))
    else:
        # broad sun-tabard chestplate emblem for the male cleric
        o.append(s('M-12 -98 L-9 -72 H9 L12 -98 Z', HBLUE, 2.8))
        o.append(ln('M0 -94 V-76 M-6.5 -86 H6.5', GOLD, 3.2))
    o.append(s('M-18 -72 H18 V-62 H-18 Z', GOLD, 3.5) + c(0, -67, 3.4, HBLUE, 2.4))
    # bell sleeves and hands: the staff hand, the healing hand
    o.append(s(C_SLEEVE_STAFF, ROBE) + s(C_CUFF_STAFF, GOLD, 3))
    o.append(s(C_SLEEVE_HEAL, ROBE) + s(C_CUFF_HEAL, GOLD, 3))
    o.append(halo(33, -54, 13, '#F4B942', 0.38) + c(33, -54, 5.5, HSKIN, 3.5))
    o.append(s('M33 -70 Q33 -63 40 -63 Q33 -63 33 -56 Q33 -63 26 -63 Q33 -63 33 -70 Z', '#FFE08A', 1.8))
    cleric_mantles(o)
    # the staff in front of the mantle, and the hand round it
    o.append(beam('M-37 2 L-37 -150', WOOD, 5.5) + sun(-37, -160) + c(-37, -48, 5.5, HSKIN, 3.5))
    o.append(s('M-5 -103 H5 V-96 H-5 Z', HSKIN, 3))
    o.append(head(0, -116, H.human_head(Z, bun=fem, circlet=True, fem=fem)))
    sprite(key + '_f', C_VB, o, 'Human cleric front')


def cleric_back(fem=True, key='healer'):
    o = []
    o.append(both('M-15 -7 H-3 V0 H-18 C-19 -3 -18 -6 -15 -7 Z', WOOD_D, 3.5))
    o.append(s(C_SKIRT, ROBE) + s(C_HEM, GOLD, 3.5))
    # a sun on the back of the robe
    o.append(sun(0, -36, 7.5, spin=0))
    o.append(s(C_BODICE, ROBE) + s('M-18 -72 H18 V-62 H-18 Z', GOLD, 3.5))
    # the healing hand on the viewer's left now, the staff hand on the right
    o.append(s(m(C_SLEEVE_HEAL), ROBE) + s(m(C_CUFF_HEAL), GOLD, 3))
    o.append(halo(-33, -54, 13, '#F4B942', 0.38) + c(-33, -54, 5.5, HSKIN, 3.5))
    o.append(s(m(C_SLEEVE_STAFF), ROBE) + s(m(C_CUFF_STAFF), GOLD, 3))
    cleric_mantles(o, front=False)
    o.append(beam('M37 2 L37 -150', WOOD, 5.5) + sun(37, -160) + c(37, -48, 5.5, HSKIN, 3.5))
    o.append(s('M-5 -103 H5 V-96 H-5 Z', HSKIN, 3))
    o.append(head(0, -116, H.human_back(Z, bun=fem, circlet=True)))
    sprite(key + '_b', back_vb(C_VB), o, 'Human cleric back')


# ---------------------------------------------------------------- the elf mage
CRYSTAL = 'M35 -170 L45 -152 L35 -134 L25 -152 Z'
E_SKIRT = 'M-12 -70 C-17 -46 -22 -22 -25 -3 H25 C22 -22 17 -46 12 -70 Z'
E_HEM = 'M-25 -8 C-8 -5 8 -5 25 -8 L26 -2 C8 1 -8 1 -26 -2 Z'
E_BODICE = 'M-13 -102 C-16 -90 -15 -78 -12 -70 H12 C15 -78 16 -90 13 -102 Z'
E_SLEEVE_ORB = 'M-18 -98 C-26 -90 -30 -80 -31 -70 C-27 -66 -22 -67 -20 -70 C-20 -80 -18 -88 -12 -92 Z'
E_SLEEVE_STAFF = 'M18 -98 C26 -92 31 -84 33 -76 C30 -72 25 -72 22 -75 C21 -84 18 -90 12 -92 Z'
SHARDS = 'M-12 -103 L-17 -121 L-24 -106 L-35 -114 L-38 -97 C-30 -95 -20 -95 -12 -97 Z'
SHARD_LINES = 'M-17 -116 L-19 -104 M-33 -109 L-31 -100'
HAT_CONE = 'M-12.5 -143 C-10.5 -157 -3.5 -171 9 -180 C6 -168 8 -155 13 -143 Z'
HAT_BAND = 'M-13 -144 C-4 -141 4 -141 13 -144 L12 -150 C4 -147 -4 -147 -12 -150 Z'
E_VB = (-42, -186, 94, 192)


def frost_staff(o, x=35):
    o.append(beam(f'M{x + 1} 2 L{x} -138', WOOD, 5) + halo(x, -152, 22, FROST, 0.32))
    o.append(s(tp(CRYSTAL, x - 35), FROST, 3.5) + ln(tp('M32 -162 L28 -153', x - 35), '#FFFFFF', 2.4) + s(tp('M28 -138 H42 V-133 H28 Z', x - 35), GOLD, 2.6))


def hat(o, dy=0, col=IROBE, star=True, back=False):
    cone, band = tp(HAT_CONE, 0, dy), tp(HAT_BAND, 0, dy)
    o.append(e(0, -141 + dy, 19, 5, col, 3.5))
    o.append(s(m(cone) if back else cone, col) + s(band, GOLD, 3))
    if star and not back:
        o.append(ln(tp('M3 -163 V-155 M-0.5 -161 L6.5 -157 M-0.5 -157 L6.5 -161', 0, dy), '#FFFFFF', 1.8))


def elf_front(fem=True, key='dps'):
    o = []
    hair, face = H.elf_head(Z, back_len=46, fem=fem)
    o.append(head(0, -123, hair))
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', IROBE_D, 3))
    # the robe, its gold panel, the belt
    o.append(s(E_SKIRT, IROBE) + s('M-5 -68 L-8 -4 H8 L5 -68 Z', GOLD, 3) + s(E_HEM, IROBE_D, 3))
    o.append(s(E_BODICE, IROBE))
    if fem:
        o.append(s('M-8 -100 L0 -84 L8 -100 Z', IROBE_D, 2.6) + c(0, -86, 3.2, FROST_L, 2))
    else:
        # structured battlemage chest V-yoke and belt tabs on male elf
        o.append(s('M-13 -101 L0 -77 L13 -101 Z', GOLD, 2.8) + s('M-8.5 -101 L0 -84 L8.5 -101 Z', IROBE_D, 2.4))
        o.append(both('M-11 -67 L-13 -45 L-7 -48 L-6 -67 Z', IROBE_D, 2.6))
    o.append(s('M-14 -74 H14 V-67 H-14 Z', IROBE_D, 3) + s('M-3.5 -75.5 H3.5 V-65.5 H-3.5 Z', FROST_L, 2.2))
    # slim sleeves and hands: the frost orb, the staff hand
    o.append(s(E_SLEEVE_ORB, IROBE) + c(-26, -64, 4.6, ESKIN, 3))
    o.append(halo(-27, -76, 12, FROST, 0.42) + c(-27, -76, 6, FROST_L, 3))
    o.append(s(E_SLEEVE_STAFF, IROBE))
    # the high collar (white on female, dark sapphire with gold trim on male), and the crystal shoulders
    o.append(s('M-15 -100 C-15 -110 -10 -115 -6.5 -108 L0 -104 L6.5 -108 C10 -115 15 -110 15 -100 C8 -97 -8 -97 -15 -100 Z', '#FFFFFF' if fem else IROBE_D, 3.5))
    o.append(both(SHARDS, FROST, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), FROST_L, 2.2))
    if fem:
        # cascading silver locks in front of the collar
        o.append(both('M-10.5 -118 C-15.5 -104 -16 -86 -12.5 -76 C-8.5 -80 -8.5 -96 -9 -112 Z', H.EHAIR, 2.8))
    # the staff in front of the shoulder, and the hand round it
    frost_staff(o)
    o.append(c(32, -72, 4.6, ESKIN, 3))
    o.append(head(0, -123, face))
    hat(o)
    sprite(key + '_f', E_VB, o, 'Elf mage front')


def elf_back(fem=True, key='dps'):
    o = []
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', IROBE_D, 3))
    o.append(s(E_SKIRT, IROBE) + s(E_HEM, IROBE_D, 3))
    o.append(s(E_BODICE, IROBE) + s('M-14 -74 H14 V-67 H-14 Z', IROBE_D, 3))
    # the staff hand on the viewer's left now, the frost orb on the right
    o.append(s(m(E_SLEEVE_STAFF), IROBE))
    o.append(s(m(E_SLEEVE_ORB), IROBE) + c(26, -64, 4.6, ESKIN, 3))
    o.append(halo(27, -76, 12, FROST, 0.42) + c(27, -76, 6, FROST_L, 3))
    o.append(s('M-15 -100 C-15 -111 15 -111 15 -100 C8 -97 -8 -97 -15 -100 Z', '#FFFFFF' if fem else IROBE_D, 3.5))
    o.append(both(SHARDS, FROST, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), FROST_L, 2.2))
    frost_staff(o, -35)
    o.append(c(-32, -72, 4.6, ESKIN, 3))
    # the ears, and the long hair down the back
    o.append(head(0, -123, H.elf_back(Z, back_len=46, fem=fem)))
    hat(o, back=True)
    sprite(key + '_b', back_vb(E_VB), o, 'Elf mage back')


# ---------------------------------------------------------------- the Risen warrior
R_CAPE = 'M-22 -112 C-32 -86 -34 -60 -32 -34 L-26 -39 L-20 -31 L-13 -38 L-6 -30 L0 -37 L6 -30 L13 -38 L20 -31 L26 -39 L32 -34 C34 -60 32 -86 22 -112 Z'
R_BLADE = 'M-44 -66 L-46 -144 L-41 -154 L-36 -144 L-38 -66 Z'
R_KITE = 'M24 -102 H54 C56 -82 50 -62 39 -48 C28 -62 22 -82 24 -102 Z'
R_ARM_SWORD = 'M-30 -98 L-38 -78 L-41 -64'
R_ARM_SHIELD = 'M30 -98 L36 -84 L38 -74'
R_VB = (-58, -168, 118, 174)


def risen_legs(o):
    """long thin legs in iron greaves and sabatons"""
    for sx in (-1, 1):
        o.append(bone_limb(f'M{sx * 7} -58 L{sx * 10} -34 L{sx * 11} -14', 5))
        o.append(s(f'M{sx * 16} -36 L{sx * 6} -36 L{sx * 7} -13 L{sx * 15} -13 Z', RIRON, 3.2))
    o.append(both('M-19 -13 H-6 V0 H-23 C-24 -5 -22 -11 -19 -13 Z', RIRON_D))


def sword(o, mx=1):
    o.append(s(tp(R_BLADE, mx=mx), STEEL_L, 3.5) + ln(tp('M-41 -146 V-70', mx=mx), '#FFFFFF', 1.6))
    o.append(c(-43 * mx, -112, 1.8, RUST, 0) + c(-40 * mx, -96, 1.6, RUST, 0))
    o.append(s(tp('M-52 -66 H-30 V-60 H-52 Z', mx=mx), RIRON_D, 3))


def risen_pauldrons(o):
    o.append(both('M-12 -112 C-16 -127 -42 -131 -51 -107 L-49 -96 C-37 -104 -22 -106 -12 -104 Z', RIRON))
    o.append(both('M-49 -96 C-37 -104 -22 -106 -12 -104 L-12 -99 C-22 -101 -36 -98 -48 -90 Z', RIRON_D, 3.2))
    o.append(both('M-26 -123 L-29 -142 L-19 -124 Z', BONE, 3) + both('M-38 -118 L-47 -135 L-32 -116 Z', BONE, 3))
    o.append(ln('M-44 -114 C-36 -122 -26 -124 -18 -120 M44 -114 C36 -122 26 -124 18 -120', RIRON_L, 2.6))


def iron_crown(o, fem=False):
    if fem:
        # spectral hair crown + Valkyrie dark-iron tiara with glowing green soul-gem
        o.append(s('M-14.5 -137 C-15 -154 15 -154 14.5 -137 Z', RHAIR, 3.2))
        o.append(s('M-16 -134 L-15 -142 L-8 -139 L0 -152 L8 -139 L15 -142 L16 -134 Z', RIRON_D, 3))
        o.append(c(0, -139, 3.2, GRN, 2))
        return
    o.append(s('M-14.5 -137 C-14.5 -153 14.5 -153 14.5 -137 Z', RIRON) + s('M-16 -140 H16 V-134 H-16 Z', RIRON_D, 3.2))
    for x in (-10, -3.5, 3.5, 10):
        o.append(s(f'M{x - 3} -149 L{x} -162 L{x + 3} -149 Z', RIRON_L, 2.6))


def risen_warrior_front(fem=False, key='risen_tank'):
    o = []
    o.append(s(R_CAPE, PURP_D))
    risen_legs(o)
    # the hips, the tabard on its belt, the spine, the ribs
    o.append(s('M-12 -66 C-14 -57 -8 -54 0 -55 C8 -54 14 -57 12 -66 Z', BONE, 3.2))
    o.append(s('M-10 -68 L-11 -51 L-5.5 -54 L0 -49 L5.5 -54 L11 -51 L10 -68 Z', PURP, 3.2))
    o.append(s('M-16 -72 H16 V-65 H-16 Z', RIRON_D, 3) + c(0, -68.5, 3.6, BONE, 2.2))
    o.append(beam('M0 -76 V-72', BONE, 4.5, 3))
    o.append(ribcage(0, -106, 27, 32))
    # thin arms out of the shoulders
    o.append(bone_limb(R_ARM_SWORD, 4.6))
    o.append(bone_limb(R_ARM_SHIELD, 4.6))
    # the kite shield with its skull
    o.append(s(R_KITE, RSHIELD) + ln('M26 -99 H52 C53 -82 48 -65 39 -53 C30 -65 25 -82 26 -99', RIRON_L, 2.4))
    o.append(s('M32 -84 C32 -96 46 -96 46 -84 C46 -80 43 -78 42 -77 H36 C35 -78 32 -80 32 -84 Z', BONE, 2.8))
    o.append(e(36.5, -85, 2.2, 2.6, K, 0) + e(41.5, -85, 2.2, 2.6, K, 0) + c(36.5, -84.7, 0.9, GRN, 0) + c(41.5, -84.7, 0.9, GRN, 0))
    risen_pauldrons(o)
    # the sword held up in front of the pauldron, in an iron gauntlet
    sword(o)
    o.append(c(-41, -62, 6.6, RIRON) + ln('M-44 -64 H-38 M-44 -60 H-38', RIRON_D, 1.8))
    if fem:
        # two thick multi-segment spectral-white braids with gold clasps
        for sx in (-1, 1):
            bx = 14 * sx
            o.append(c(bx, -110, 5.2, RHAIR, 2.8) + c(bx * 1.05, -101, 5.0, RHAIR, 2.8) + c(bx, -92, 4.6, RHAIR, 2.8))
            o.append(s(f'M{bx - 4} -87 H{bx + 4} V-82 H{bx - 4} Z', GOLD, 2.4))
            o.append(s(f'M{bx - 3.2} -82 L{bx - 5} -73 L{bx} -75 L{bx + 5} -73 L{bx + 3.2} -82 Z', RHAIR, 2.5))
    o.append(head(0, -126, H.risen_head(Z, fem=fem)))
    iron_crown(o, fem=fem)
    sprite(key + '_f', R_VB, o, 'Risen warrior front')


def risen_warrior_back(fem=False, key='risen_tank'):
    o = []
    risen_legs(o)
    # the kite shield's back on the viewer's left, behind the arm that holds it
    o.append(s(m(R_KITE), '#5A4A3A') + ln('M-28 -92 H-50 M-30 -72 H-48', '#3E3228', 3))
    o.append(s(R_CAPE, PURP_D) + ln('M-9 -104 C-11 -82 -11 -62 -10 -42 M9 -104 C11 -82 11 -62 10 -42', '#3A2862', 2.4))
    if fem:
        for sx in (-1, 1):
            bx = 8.5 * sx
            o.append(c(bx, -108, 4.8, RHAIR, 2.6) + c(bx, -99, 4.5, RHAIR, 2.6) + c(bx, -90, 4.2, RHAIR, 2.6))
            o.append(c(bx, -83, 3.2, GOLD, 2.2))
    o.append(bone_limb(m(R_ARM_SHIELD), 4.6))
    # the sword arm on the viewer's right, the sword in front of the pauldron, in its gauntlet
    o.append(bone_limb(m(R_ARM_SWORD), 4.6))
    risen_pauldrons(o)
    sword(o, -1)
    o.append(c(41, -62, 6.6, RIRON) + ln('M38 -64 H44 M38 -60 H44', RIRON_D, 1.8))
    o.append(head(0, -126, H.risen_back(Z)))
    iron_crown(o, fem=fem)
    sprite(key + '_b', back_vb(R_VB), o, 'Risen warrior back')


# ---------------------------------------------------------------- the Risen cleric
RC_SKIRT = 'M-14 -72 C-18 -48 -22 -26 -25 -6 ' + A.ragged(-25, 25, -6, 7, 5) + ' C22 -26 18 -48 14 -72 Z'
RC_STOLE = 'M-14 -104 L-17 -10 L-13.5 -14 L-10 -10 L-9.5 -104 Z'
RC_SLEEVE_STAFF = 'M-20 -100 C-29 -94 -34 -84 -36 -74 L-29 -70 L-25 -76 L-20 -71 C-20 -80 -18 -88 -13 -92 Z'
RC_SLEEVE_HEAL = 'M20 -100 C28 -95 33 -88 35 -80 L28 -76 L25 -81 L21 -77 C20 -84 18 -90 13 -92 Z'
RC_HOOD = 'M-18 -112 C-22 -136 -12 -152 0 -155 C12 -152 22 -136 18 -112'
RC_VB = (-56, -176, 108, 182)


def lantern_staff(o, x):
    """the Risen cleric's staff: a green lantern where the sun would be"""
    o.append(beam(f'M{x} 2 L{x} -134', WOOD_D, 5.5) + halo(x, -148, 24, GRN, 0.3))
    o.append(ln(f'M{x - 6} -162 C{x - 6} -171 {x + 6} -171 {x + 6} -162', K, 3.5))
    o.append(s(f'M{x - 10} -161 H{x + 10} L{x + 9} -136 H{x - 9} Z', LANTERN, 3.5) + s(f'M{x - 5.5} -156 H{x + 5.5} V-141 H{x - 5.5} Z', '#E9FFD9', 2.4))
    o.append(s(f'M{x} -154 C{x + 4.5} -149 {x + 4} -144 {x} -143 C{x - 4} -144 {x - 4.5} -149 {x} -154 Z', GRN, 1.8))
    o.append(s(f'M{x - 12} -137 H{x + 12} L{x + 10} -132 H{x - 10} Z', LANTERN, 3))


def risen_cleric_mantles(o, front=True):
    o.append(both('M-9 -103 C-15 -118 -40 -121 -47 -100 L-45 -91 C-34 -97 -20 -100 -9 -98 Z', RCLOTH_D))
    o.append(both('M-45 -91 C-34 -97 -20 -100 -9 -98 L-9 -93 C-21 -95 -34 -92 -44 -85 Z', GOLD, 3.2))
    if front:
        for x in (-29, 29):
            o.append(c(x, -106, 5.5, GOLD, 3) + c(x, -106, 2.2, GRN, 0))


def risen_cleric_front(fem=True, key='risen_healer'):
    o = []
    o.append(both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', BONE, 3))
    # the robe from the waist, torn at the hem; the ribs above it; a green stole over both
    o.append(s(RC_SKIRT, RCLOTH))
    o.append(beam('M0 -80 V-72', BONE, 4.5, 3))
    o.append(ribcage(0, -110, 26, 30))
    o.append(both(RC_STOLE, MOSS, 3))
    if not fem:
        o.append(s('M-9 -102 L-7 -76 H7 L9 -102 Z', MOSS, 2.6) + ln('M0 -98 V-80 M-5.5 -90 H5.5', GOLD, 2.8))
    o.append(s('M-16 -76 H16 V-68 H-16 Z', GOLD, 3.5))
    # sleeves torn at the elbow, bone forearms: the staff hand, the healing hand
    o.append(bone_limb('M-30 -74 L-36 -56', 4.4) + s(RC_SLEEVE_STAFF, RCLOTH))
    o.append(bone_limb('M28 -80 L33 -66', 4.4) + s(RC_SLEEVE_HEAL, RCLOTH))
    o.append(halo(33, -60, 14, GRN, 0.4) + bone_hand(33, -60))
    o.append(s('M33 -76 Q33 -69 40 -69 Q33 -69 33 -62 Q33 -69 26 -69 Q33 -69 33 -76 Z', GRN_L, 1.8))
    # the hood, its dark inside, the mantles, and the skull looking out
    o.append(s(RC_HOOD + ' C10 -108 -10 -108 -18 -112 Z', RCLOTH_D, 3.5))
    o.append(e(0, -128, 14.5, 18.5, '#141018', 0))
    risen_cleric_mantles(o)
    # the lantern staff in front of the mantle, and the hand round it
    lantern_staff(o, -37)
    o.append(bone_hand(-37, -50))
    if fem:
        # flowing spectral-white locks framing the skull and resting on the stole
        o.append(both('M-10.5 -124 C-16.5 -112 -16.5 -94 -12.5 -82 C-8.5 -86 -8 -102 -9 -118 Z', RHAIR, 2.8))
    o.append(head(0, -126, H.risen_head(Z, fem=fem)))
    if not fem:
        o.append(s('M-12 -134 L-8 -141 L0 -145 L8 -141 L12 -134 Z', GOLD, 2.8) + c(0, -138.5, 2.6, GRN, 1.8))
    else:
        o.append(c(0, -137, 2.8, GRN_L, 2))
    sprite(key + '_f', RC_VB, o, 'Risen cleric front')


def risen_cleric_back(fem=True, key='risen_healer'):
    o = []
    o.append(both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', BONE, 3))
    o.append(s(RC_SKIRT, RCLOTH))
    o.append(halo(0, -40, 15, GRN, 0.22) + sun(0, -40, 7, spin=0))
    o.append(beam('M0 -80 V-72', BONE, 4.5, 3))
    o.append(ribcage(0, -110, 26, 30))
    o.append(s('M-16 -76 H16 V-68 H-16 Z', GOLD, 3.5))
    # the healing hand on the viewer's left now, the staff hand on the right
    o.append(bone_limb(m('M28 -80 L33 -66'), 4.4) + s(m(RC_SLEEVE_HEAL), RCLOTH))
    o.append(halo(-33, -60, 14, GRN, 0.4) + bone_hand(-33, -60))
    o.append(bone_limb(m('M-30 -74 L-36 -56'), 4.4) + s(m(RC_SLEEVE_STAFF), RCLOTH))
    risen_cleric_mantles(o, front=False)
    lantern_staff(o, 37)
    o.append(bone_hand(37, -50))
    # the hood from behind, falling to a point between the shoulders
    o.append(s(RC_HOOD + ' L10 -98 L0 -90 L-10 -98 Z', RCLOTH_D, 3.5) + ln('M0 -153 C-2 -132 -1 -110 0 -94', RCLOTH, 2.4))
    sprite(key + '_b', back_vb(RC_VB), o, 'Risen cleric back')


# ---------------------------------------------------------------- the Risen mage
RM_SKIRT = 'M-12 -70 C-17 -46 -22 -24 -25 -6 ' + A.ragged(-25, 25, -6, 6, 5) + ' C22 -24 17 -46 12 -70 Z'
RM_SLEEVE_ORB = 'M-18 -98 C-25 -91 -28 -84 -29 -78 L-23 -76 L-21 -80 L-17 -77 C-17 -84 -16 -88 -12 -92 Z'
RM_SLEEVE_STAFF = 'M18 -98 C25 -93 28 -88 29 -83 L23 -81 L21 -85 L17 -82 C17 -88 16 -91 12 -92 Z'
RM_VB = (-42, -190, 94, 196)


def risen_mage_front(fem=True, key='risen_dps'):
    o = []
    hair, _ = H.elf_head(Z, back_len=50, hair=RHAIR, hairD=RHAIR_D, fem=fem)
    o.append(head(0, -126, hair))
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', BONE, 3))
    # the robe, torn at the hem, its gold panel torn too, the belt
    o.append(s(RM_SKIRT, RROBE) + s('M-5 -68 L-8 -8 L-3 -11 L0 -7 L3 -11 L8 -8 L5 -68 Z', GOLD, 3))
    o.append(s(E_BODICE, RROBE))
    if not fem:
        # arch-lich golden chest yoke and phylactery gem
        o.append(s('M-13 -100 L0 -76 L13 -100 Z', GOLD, 2.8) + s('M-8 -100 L0 -84 L8 -100 Z', RROBE_D, 2.4))
        o.append(c(0, -88, 3.4, GRN, 2))
    o.append(s('M-14 -74 H14 V-67 H-14 Z', RROBE_D, 3) + s('M-3.5 -75.5 H3.5 V-65.5 H-3.5 Z', FROST_L, 2.2))
    # slim sleeves torn at the elbow, bone forearms: the frost orb, the staff hand
    o.append(bone_limb('M-24 -80 L-27 -66', 4.2) + s(RM_SLEEVE_ORB, RROBE) + bone_hand(-27, -63, 4.8))
    o.append(halo(-27, -76, 12, FROST, 0.42) + c(-27, -76, 6, FROST_L, 3))
    o.append(bone_limb('M24 -84 L31 -74', 4.2) + s(RM_SLEEVE_STAFF, RROBE))
    # a high collar, bone shards on the shoulders, the staff in front of them, the skull and the hat
    o.append(s('M-15 -100 C-15 -110 -10 -115 -6.5 -108 L0 -104 L6.5 -108 C10 -115 15 -110 15 -100 C8 -97 -8 -97 -15 -100 Z', RHAIR if fem else RROBE_D, 3.5))
    o.append(both(SHARDS, BONE, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), BONE_D, 2.2))
    frost_staff(o)
    o.append(bone_hand(32, -72, 4.8))
    if fem:
        o.append(both('M-11 -124 C-16.5 -110 -16.5 -94 -12.5 -82 C-8.5 -86 -8.5 -102 -9.5 -118 Z', RHAIR, 2.8))
    o.append(head(0, -126, H.risen_head(Z, fem=fem)))
    hat(o, -4, RROBE)
    if not fem:
        # spiked bone crown on the arch-lich's wizard hat
        for x in (-7, 0, 7):
            o.append(s(f'M{x - 2.5} -149 L{x} -160 L{x + 2.5} -149 Z', BONE, 2.2))
    sprite(key + '_f', RM_VB, o, 'Risen mage front')


def risen_mage_back(fem=True, key='risen_dps'):
    o = []
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', BONE, 3))
    o.append(s(RM_SKIRT, RROBE) + s(E_BODICE, RROBE) + s('M-14 -74 H14 V-67 H-14 Z', RROBE_D, 3))
    # the staff hand on the viewer's left now, the frost orb on the right
    o.append(bone_limb(m('M24 -84 L31 -74'), 4.2) + s(m(RM_SLEEVE_STAFF), RROBE))
    o.append(bone_limb(m('M-24 -80 L-27 -66'), 4.2) + s(m(RM_SLEEVE_ORB), RROBE) + bone_hand(27, -63, 4.8))
    o.append(halo(27, -76, 12, FROST, 0.42) + c(27, -76, 6, FROST_L, 3))
    o.append(s('M-15 -100 C-15 -111 15 -111 15 -100 C8 -97 -8 -97 -15 -100 Z', RHAIR, 3.5))
    o.append(both(SHARDS, BONE, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), BONE_D, 2.2))
    frost_staff(o, -35)
    o.append(bone_hand(-32, -72, 4.8))
    # the ghost-white hair down the back, and the hat
    o.append(head(0, -126, H.elf_back(Z, back_len=50, hair=RHAIR, hairD=RHAIR_D, ears=False, fem=fem)))
    hat(o, -4, RROBE, back=True)
    sprite(key + '_b', back_vb(RM_VB), o, 'Risen mage back')


def build():
    dwarf_front(); dwarf_back(); dwarf_front(True, 'tank_w'); dwarf_back(True, 'tank_w')
    cleric_front(); cleric_back(); cleric_front(False, 'healer_m'); cleric_back(False, 'healer_m')
    elf_front(); elf_back(); elf_front(False, 'dps_m'); elf_back(False, 'dps_m')
    risen_warrior_front(); risen_warrior_back(); risen_warrior_front(True, 'risen_tank_w'); risen_warrior_back(True, 'risen_tank_w')
    risen_cleric_front(); risen_cleric_back(); risen_cleric_front(False, 'risen_healer_m'); risen_cleric_back(False, 'risen_healer_m')
    risen_mage_front(); risen_mage_back(); risen_mage_front(False, 'risen_dps_m'); risen_mage_back(False, 'risen_dps_m')
    # Gilded Bones: every Risen sprite again with its bones in gold
    for n in [k for k in HEROES if k.startswith('risen_')]:
        sp = HEROES[n]
        HEROES[n.rsplit('_', 1)[0] + '_gilded_' + n.rsplit('_', 1)[1]] = {
            'svg': sp['svg'].replace(BONE, GOLD).replace(BONE_D, GOLD_D), 'vb': sp['vb'], 'note': sp['note'] + ', gilded'}
    return HEROES
