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
    RUST, PURP, PURP_D, FROST, FROST_L, RED, RED_D
import art_heads as H
from art_heads import tp, BEARD, BEARD_D, HSKIN, ESKIN, GSKIN, GBSKIN, HBLUE

Z = 0.8
HEROES = {}

# cloth, leather, rags, bronze and iron
BOOT, BLUE_DD = '#4A3428', '#2E4670'
ROBE, IROBE, IROBE_D = '#F6F1E4', '#3D7FC1', '#2F6699'
RIRON, RIRON_D, RIRON_L, RSHIELD = '#7A7484', '#5C5768', '#A39DB0', '#4A4060'
RCLOTH, RCLOTH_D, RROBE, RROBE_D, MOSS = '#3A3348', '#2A2434', '#35587F', '#2A4566', '#6E8A5A'
RHAIR, RHAIR_D, LANTERN = '#C9D2DC', '#9DA8B6', '#4A4458'
RAG, RAG_D, ROPE = '#9E876E', '#78644E', '#C8B08A'
MRAG, MRAG_D = '#6E6478', '#4E4658'
BRONZE, BRONZE_D = '#C88344', '#8E5826'


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


# ---------------------------------------------------------------- the human cleric
C_SKIRT = 'M-15 -66 C-22 -44 -30 -21 -35 -3 H35 C30 -21 22 -44 15 -66 Z'
C_HEM = 'M-35 -9 C-12 -5 12 -5 35 -9 L36 -2 C12 2 -12 2 -36 -2 Z'
C_BODICE = 'M-17 -98 C-21 -86 -20 -76 -16 -68 H16 C20 -76 21 -86 17 -98 Z'
C_SLEEVE_STAFF = 'M-22 -94 C-33 -86 -40 -72 -43 -58 C-37 -53 -29 -53 -24 -58 C-24 -70 -21 -80 -15 -86 Z'
C_CUFF_STAFF = 'M-43 -58 C-37 -53 -29 -53 -24 -58 L-25 -52 C-30 -48 -37 -48 -43 -53 Z'
C_SLEEVE_HEAL = 'M22 -94 C32 -88 38 -78 40 -66 C35 -61 28 -61 24 -64 C23 -74 21 -82 15 -86 Z'
C_CUFF_HEAL = 'M40 -66 C35 -61 28 -61 24 -64 L25 -58 C29 -55 36 -55 41 -60 Z'
C_VB = (-62, -176, 116, 182)


def sun(x, y, r=10, rays=8, spin=22.5, tier=2):
    if tier == 0:
        # humble wooden branch fork with a tiny warm ember
        return halo(x, y + 8, 10, '#F4B942', 0.22) + ln(f'M{x} {y + 18} L{x - 7} {y + 6} M{x} {y + 16} L{x + 6} {y + 7}', WOOD_D, 3.5) + c(x, y + 8, 4.5, '#FFE08A', 2.5)
    if tier == 1:
        return halo(x, y + 4, 14, '#F4B942', 0.25) + c(x, y + 4, 7.5, GOLD, 3) + c(x, y + 4, 3, '#FFF6D0', 0)
    o = halo(x, y, r * 2.1, '#F4B942', 0.3)
    for k in range(rays):
        a = math.radians(k * 360 / rays + spin)
        o += beam(f'M{f(x + (r + 1) * math.cos(a))} {f(y + (r + 1) * math.sin(a))} L{f(x + r * 1.75 * math.cos(a))} {f(y + r * 1.75 * math.sin(a))}', GOLD, 3.2, 3)
    return o + c(x, y, r, GOLD, 3.5) + c(x - r * 0.25, y - r * 0.25, r * 0.25, '#FFF6D0', 0)


def cleric_mantles(o, front=True, tier=2):
    if tier == 0:
        # simple patchwork burlap shawl
        o.append(both('M-9 -99 C-14 -109 -32 -110 -38 -94 L-36 -88 C-28 -92 -18 -94 -9 -93 Z', RAG_D))
        return
    if tier == 1:
        o.append(both('M-9 -100 C-15 -113 -37 -115 -43 -96 L-41 -88 C-32 -93 -19 -96 -9 -94 Z', ROBE))
        o.append(both('M-41 -88 C-32 -93 -19 -96 -9 -94 L-9 -90 C-20 -91 -31 -89 -40 -83 Z', HBLUE, 3))
        return
    o.append(both('M-9 -100 C-15 -115 -40 -118 -47 -97 L-45 -88 C-34 -94 -20 -97 -9 -95 Z', ROBE))
    o.append(both('M-45 -88 C-34 -94 -20 -97 -9 -95 L-9 -90 C-21 -92 -34 -89 -44 -82 Z', GOLD, 3.2))
    if front:
        for x in (-29, 29):
            o.append(c(x, -103, 5.5, GOLD, 3) + c(x, -103, 2.2, HBLUE, 0))


def cleric_front(fem=True, key='healer', tier=2):
    o = []
    robe_col = RAG if tier == 0 else '#EAE2D0' if tier == 1 else ROBE
    trim_col = RAG_D if tier == 0 else HBLUE if tier == 1 else GOLD
    o.append(both('M-15 -7 H-3 V0 H-18 C-19 -3 -18 -6 -15 -7 Z', WOOD_D, 3.5))
    o.append(s(C_SKIRT, robe_col))
    if tier == 0:
        # stitched rag patch on skirt
        o.append(s('M-22 -36 L-10 -34 L-12 -20 L-24 -22 Z', RAG_D, 2.4))
    else:
        o.append(s('M-7 -64 L-11 -5 H11 L7 -64 Z', HBLUE, 3))
        if tier >= 2:
            o.append(ln('M-9 -60 L-12 -6 M9 -60 L12 -6', GOLD, 2.2))
    o.append(s(C_HEM, trim_col, 3.5))
    o.append(s(C_BODICE, robe_col))
    if fem:
        o.append(s('M-8 -98 L0 -84 L8 -98 Z', RAG_D if tier == 0 else HBLUE, 2.8))
        if tier >= 2:
            o.append(c(0, -83, 3.5, GOLD, 2.2))
    else:
        o.append(s('M-12 -98 L-9 -72 H9 L12 -98 Z', RAG_D if tier == 0 else HBLUE, 2.8))
        if tier >= 1:
            o.append(ln('M0 -94 V-76 M-6.5 -86 H6.5', ROPE if tier == 1 else GOLD, 3.2))
    o.append(s('M-18 -72 H18 V-62 H-18 Z', ROPE if tier == 0 else WOOD_D if tier == 1 else GOLD, 3.5))
    if tier >= 2:
        o.append(c(0, -67, 3.4, HBLUE, 2.4))
    o.append(s(C_SLEEVE_STAFF, robe_col) + s(C_CUFF_STAFF, trim_col, 3))
    o.append(s(C_SLEEVE_HEAL, robe_col) + s(C_CUFF_HEAL, trim_col, 3))
    o.append(halo(33, -54, 13, '#F4B942', 0.38) + c(33, -54, 5.5, HSKIN, 3.5))
    o.append(s('M33 -70 Q33 -63 40 -63 Q33 -63 33 -56 Q33 -63 26 -63 Q33 -63 33 -70 Z', '#FFE08A', 1.8))
    cleric_mantles(o, tier=tier)
    o.append(beam('M-37 2 L-37 -142' if tier == 0 else 'M-37 2 L-37 -150', WOOD_D if tier == 0 else WOOD, 5.5) + sun(-37, -160, tier=tier) + c(-37, -48, 5.5, HSKIN, 3.5))
    o.append(s('M-5 -103 H5 V-96 H-5 Z', HSKIN, 3))
    o.append(head(0, -116, H.human_head(Z, bun=fem, circlet=(tier >= 2), fem=fem)))
    sprite(key + '_f', C_VB, o, 'Human cleric front')


def cleric_back(fem=True, key='healer', tier=2):
    o = []
    robe_col = RAG if tier == 0 else '#EAE2D0' if tier == 1 else ROBE
    trim_col = RAG_D if tier == 0 else HBLUE if tier == 1 else GOLD
    o.append(both('M-15 -7 H-3 V0 H-18 C-19 -3 -18 -6 -15 -7 Z', WOOD_D, 3.5))
    o.append(s(C_SKIRT, robe_col) + s(C_HEM, trim_col, 3.5))
    if tier >= 2:
        o.append(sun(0, -36, 7.5, spin=0))
    o.append(s(C_BODICE, robe_col) + s('M-18 -72 H18 V-62 H-18 Z', ROPE if tier == 0 else WOOD_D if tier == 1 else GOLD, 3.5))
    o.append(s(m(C_SLEEVE_HEAL), robe_col) + s(m(C_CUFF_HEAL), trim_col, 3))
    o.append(halo(-33, -54, 13, '#F4B942', 0.38) + c(-33, -54, 5.5, HSKIN, 3.5))
    o.append(s(m(C_SLEEVE_STAFF), robe_col) + s(m(C_CUFF_STAFF), trim_col, 3))
    cleric_mantles(o, front=False, tier=tier)
    o.append(beam('M37 2 L37 -142' if tier == 0 else 'M37 2 L37 -150', WOOD_D if tier == 0 else WOOD, 5.5) + sun(37, -160, tier=tier) + c(37, -48, 5.5, HSKIN, 3.5))
    o.append(s('M-5 -103 H5 V-96 H-5 Z', HSKIN, 3))
    o.append(head(0, -116, H.human_back(Z, bun=fem, circlet=(tier >= 2))))
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


def frost_staff(o, x=35, tier=2):
    if tier == 0:
        # splintered wooden wand/branch with a tiny frost spark
        o.append(beam(f'M{x + 1} 2 L{x} -128', WOOD_D, 4.5) + halo(x, -135, 11, FROST, 0.25))
        o.append(c(x, -135, 5, FROST_L, 2.5))
        return
    if tier == 1:
        o.append(beam(f'M{x + 1} 2 L{x} -136', WOOD, 5) + halo(x, -146, 16, FROST, 0.28))
        o.append(c(x, -146, 8, FROST, 3))
        return
    o.append(beam(f'M{x + 1} 2 L{x} -138', WOOD, 5) + halo(x, -152, 22, FROST, 0.32))
    o.append(s(tp(CRYSTAL, x - 35), FROST, 3.5) + ln(tp('M32 -162 L28 -153', x - 35), '#FFFFFF', 2.4) + s(tp('M28 -138 H42 V-133 H28 Z', x - 35), GOLD, 2.6))


def hat(o, dy=0, col=IROBE, star=True, back=False, tier=2):
    if tier == 0:
        # no wizard hat in starter rags!
        return
    cone, band = tp(HAT_CONE, 0, dy), tp(HAT_BAND, 0, dy)
    o.append(e(0, -141 + dy, 19, 5, col, 3.5))
    o.append(s(m(cone) if back else cone, col) + s(band, ROPE if tier == 1 else GOLD, 3))
    if star and not back and tier >= 2:
        o.append(ln(tp('M3 -163 V-155 M-0.5 -161 L6.5 -157 M-0.5 -157 L6.5 -161', 0, dy), '#FFFFFF', 1.8))


def elf_front(fem=True, key='dps', tier=2):
    o = []
    robe_col = MRAG if tier == 0 else IROBE_D if tier == 1 else IROBE
    dark_col = MRAG_D if tier == 0 else '#22496E' if tier == 1 else IROBE_D
    hair, face = H.elf_head(Z, back_len=46, fem=fem)
    o.append(head(0, -123, hair))
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', dark_col, 3))
    o.append(s(E_SKIRT, robe_col))
    if tier == 0:
        o.append(s('M-16 -36 L-6 -34 L-8 -22 L-18 -24 Z', MRAG_D, 2.2))
    else:
        o.append(s('M-5 -68 L-8 -4 H8 L5 -68 Z', ROPE if tier == 1 else GOLD, 3))
    o.append(s(E_HEM, dark_col, 3))
    o.append(s(E_BODICE, robe_col))
    if fem:
        o.append(s('M-8 -100 L0 -84 L8 -100 Z', dark_col, 2.6))
        if tier >= 2:
            o.append(c(0, -86, 3.2, FROST_L, 2))
    else:
        o.append(s('M-13 -101 L0 -77 L13 -101 Z', ROPE if tier <= 1 else GOLD, 2.8) + s('M-8.5 -101 L0 -84 L8.5 -101 Z', dark_col, 2.4))
    o.append(s('M-14 -74 H14 V-67 H-14 Z', ROPE if tier == 0 else dark_col, 3))
    if tier >= 2:
        o.append(s('M-3.5 -75.5 H3.5 V-65.5 H-3.5 Z', FROST_L, 2.2))
    o.append(s(E_SLEEVE_ORB, robe_col) + c(-26, -64, 4.6, ESKIN, 3))
    o.append(halo(-27, -76, 12, FROST, 0.42) + c(-27, -76, 6, FROST_L, 3))
    o.append(s(E_SLEEVE_STAFF, robe_col))
    if tier == 0:
        # simple frayed cloth shoulder wrap
        o.append(both('M-11 -100 C-18 -103 -27 -101 -31 -94 C-24 -93 -17 -94 -11 -96 Z', MRAG_D, 3))
    elif tier == 1:
        o.append(both('M-11 -101 C-19 -106 -30 -103 -34 -94 C-26 -93 -18 -94 -11 -96 Z', dark_col, 3.2))
    else:
        o.append(s('M-15 -100 C-15 -110 -10 -115 -6.5 -108 L0 -104 L6.5 -108 C10 -115 15 -110 15 -100 C8 -97 -8 -97 -15 -100 Z', '#FFFFFF' if fem else IROBE_D, 3.5))
        o.append(both(SHARDS, FROST, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), FROST_L, 2.2))
    if fem:
        o.append(both('M-10.5 -118 C-15.5 -104 -16 -86 -12.5 -76 C-8.5 -80 -8.5 -96 -9 -112 Z', H.EHAIR, 2.8))
    frost_staff(o, tier=tier)
    o.append(c(32, -72, 4.6, ESKIN, 3))
    o.append(head(0, -123, face))
    if tier == 0:
        # bare silver hair crown at the top of the head when hatless
        o.append(s('M-13 -133 C-12 -147 12 -147 13 -133 C6 -136 -6 -136 -13 -133 Z', H.EHAIR, 3))
    hat(o, col=robe_col, tier=tier)
    sprite(key + '_f', E_VB, o, 'Elf mage front')


def elf_back(fem=True, key='dps', tier=2):
    o = []
    robe_col = MRAG if tier == 0 else IROBE_D if tier == 1 else IROBE
    dark_col = MRAG_D if tier == 0 else '#22496E' if tier == 1 else IROBE_D
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', dark_col, 3))
    o.append(s(E_SKIRT, robe_col) + s(E_HEM, dark_col, 3))
    o.append(s(E_BODICE, robe_col) + s('M-14 -74 H14 V-67 H-14 Z', ROPE if tier == 0 else dark_col, 3))
    o.append(s(m(E_SLEEVE_STAFF), robe_col))
    o.append(s(m(E_SLEEVE_ORB), robe_col) + c(26, -64, 4.6, ESKIN, 3))
    o.append(halo(27, -76, 12, FROST, 0.42) + c(27, -76, 6, FROST_L, 3))
    if tier >= 2:
        o.append(s('M-15 -100 C-15 -111 15 -111 15 -100 C8 -97 -8 -97 -15 -100 Z', '#FFFFFF' if fem else IROBE_D, 3.5))
        o.append(both(SHARDS, FROST, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), FROST_L, 2.2))
    frost_staff(o, -35, tier=tier)
    o.append(c(-32, -72, 4.6, ESKIN, 3))
    o.append(head(0, -123, H.elf_back(Z, back_len=46, fem=fem)))
    if tier == 0:
        o.append(s('M-13 -133 C-12 -147 12 -147 13 -133 Z', H.EHAIR, 3))
    hat(o, col=robe_col, back=True, tier=tier)
    sprite(key + '_b', back_vb(E_VB), o, 'Elf mage back')


# ---------------------------------------------------------------- the Risen (legs, shared by the rogue)
def risen_legs(o, tier=2):
    """long thin legs in rags (0) or iron greaves and sabatons (1+)"""
    for sx in (-1, 1):
        o.append(bone_limb(f'M{sx * 7} -58 L{sx * 10} -34 L{sx * 11} -14', 5))
        if tier >= 1:
            o.append(s(f'M{sx * 16} -36 L{sx * 6} -36 L{sx * 7} -13 L{sx * 15} -13 Z', RIRON, 3.2))
    o.append(both('M-19 -13 H-6 V0 H-23 C-24 -5 -22 -11 -19 -13 Z', RAG_D if tier == 0 else RIRON_D))


# ---------------------------------------------------------------- the Risen cleric
RC_SKIRT = 'M-14 -72 C-18 -48 -22 -26 -25 -6 ' + A.ragged(-25, 25, -6, 7, 5) + ' C22 -26 18 -48 14 -72 Z'
RC_STOLE = 'M-14 -104 L-17 -10 L-13.5 -14 L-10 -10 L-9.5 -104 Z'
RC_SLEEVE_STAFF = 'M-20 -100 C-29 -94 -34 -84 -36 -74 L-29 -70 L-25 -76 L-20 -71 C-20 -80 -18 -88 -13 -92 Z'
RC_SLEEVE_HEAL = 'M20 -100 C28 -95 33 -88 35 -80 L28 -76 L25 -81 L21 -77 C20 -84 18 -90 13 -92 Z'
RC_HOOD = 'M-18 -112 C-22 -136 -12 -152 0 -155 C12 -152 22 -136 18 -112'
RC_VB = (-56, -176, 108, 182)


def lantern_staff(o, x, tier=2):
    """the Risen cleric's staff: branch in tier 0, simple lantern in tier 1, ornate in tier 2"""
    if tier == 0:
        o.append(beam(f'M{x} 2 L{x} -130', WOOD_D, 5) + halo(x, -138, 12, GRN, 0.25) + c(x, -138, 5, GRN_L, 2.5))
        return
    o.append(beam(f'M{x} 2 L{x} -134', WOOD_D, 5.5) + halo(x, -148, 24, GRN, 0.3))
    o.append(ln(f'M{x - 6} -162 C{x - 6} -171 {x + 6} -171 {x + 6} -162', K, 3.5))
    o.append(s(f'M{x - 10} -161 H{x + 10} L{x + 9} -136 H{x - 9} Z', LANTERN, 3.5) + s(f'M{x - 5.5} -156 H{x + 5.5} V-141 H{x - 5.5} Z', '#E9FFD9', 2.4))
    o.append(s(f'M{x} -154 C{x + 4.5} -149 {x + 4} -144 {x} -143 C{x - 4} -144 {x - 4.5} -149 {x} -154 Z', GRN, 1.8))
    o.append(s(f'M{x - 12} -137 H{x + 12} L{x + 10} -132 H{x - 10} Z', LANTERN, 3))


def risen_cleric_mantles(o, front=True, tier=2):
    if tier == 0:
        o.append(both('M-9 -101 C-14 -111 -32 -112 -38 -96 L-36 -90 C-28 -94 -18 -96 -9 -95 Z', RAG_D))
        return
    o.append(both('M-9 -103 C-15 -118 -40 -121 -47 -100 L-45 -91 C-34 -97 -20 -100 -9 -98 Z', RCLOTH_D))
    o.append(both('M-45 -91 C-34 -97 -20 -100 -9 -98 L-9 -93 C-21 -95 -34 -92 -44 -85 Z', MOSS if tier == 1 else GOLD, 3.2))
    if front and tier >= 2:
        for x in (-29, 29):
            o.append(c(x, -106, 5.5, GOLD, 3) + c(x, -106, 2.2, GRN, 0))


def risen_cleric_front(fem=True, key='risen_healer', tier=2):
    o = []
    cloth = RAG if tier == 0 else RCLOTH
    o.append(both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', BONE, 3))
    o.append(s(RC_SKIRT, cloth))
    o.append(beam('M0 -80 V-72', BONE, 4.5, 3))
    o.append(ribcage(0, -110, 26, 30))
    if tier >= 1:
        o.append(both(RC_STOLE, MOSS, 3))
    if not fem and tier >= 1:
        o.append(s('M-9 -102 L-7 -76 H7 L9 -102 Z', MOSS, 2.6) + ln('M0 -98 V-80 M-5.5 -90 H5.5', ROPE if tier == 1 else GOLD, 2.8))
    o.append(s('M-16 -76 H16 V-68 H-16 Z', ROPE if tier == 0 else GOLD, 3.5))
    o.append(bone_limb('M-30 -74 L-36 -56', 4.4) + s(RC_SLEEVE_STAFF, cloth))
    o.append(bone_limb('M28 -80 L33 -66', 4.4) + s(RC_SLEEVE_HEAL, cloth))
    o.append(halo(33, -60, 14, GRN, 0.4) + bone_hand(33, -60))
    o.append(s('M33 -76 Q33 -69 40 -69 Q33 -69 33 -62 Q33 -69 26 -69 Q33 -69 33 -76 Z', GRN_L, 1.8))
    if tier >= 1:
        o.append(s(RC_HOOD + ' C10 -108 -10 -108 -18 -112 Z', RCLOTH_D, 3.5))
        o.append(e(0, -128, 14.5, 18.5, '#141018', 0))
    risen_cleric_mantles(o, tier=tier)
    lantern_staff(o, -37, tier=tier)
    o.append(bone_hand(-37, -50))
    if fem:
        o.append(both('M-10.5 -124 C-16.5 -112 -16.5 -94 -12.5 -82 C-8.5 -86 -8 -102 -9 -118 Z', RHAIR, 2.8))
    o.append(head(0, -126, H.risen_head(Z, fem=fem)))
    if tier >= 2:
        if not fem:
            o.append(s('M-12 -134 L-8 -141 L0 -145 L8 -141 L12 -134 Z', GOLD, 2.8) + c(0, -138.5, 2.6, GRN, 1.8))
        else:
            o.append(c(0, -137, 2.8, GRN_L, 2))
    sprite(key + '_f', RC_VB, o, 'Risen cleric front')


def risen_cleric_back(fem=True, key='risen_healer', tier=2):
    o = []
    cloth = RAG if tier == 0 else RCLOTH
    o.append(both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', BONE, 3))
    o.append(s(RC_SKIRT, cloth))
    if tier >= 2:
        o.append(halo(0, -40, 15, GRN, 0.22) + sun(0, -40, 7, spin=0))
    o.append(beam('M0 -80 V-72', BONE, 4.5, 3))
    o.append(ribcage(0, -110, 26, 30))
    o.append(s('M-16 -76 H16 V-68 H-16 Z', ROPE if tier == 0 else GOLD, 3.5))
    o.append(bone_limb(m('M28 -80 L33 -66'), 4.4) + s(m(RC_SLEEVE_HEAL), cloth))
    o.append(halo(-33, -60, 14, GRN, 0.4) + bone_hand(-33, -60))
    o.append(bone_limb(m('M-30 -74 L-36 -56'), 4.4) + s(m(RC_SLEEVE_STAFF), cloth))
    risen_cleric_mantles(o, front=False, tier=tier)
    lantern_staff(o, 37, tier=tier)
    o.append(bone_hand(37, -50))
    if tier == 0:
        o.append(head(0, -126, H.risen_back(Z)))
    else:
        o.append(s(RC_HOOD + ' L10 -98 L0 -90 L-10 -98 Z', RCLOTH_D, 3.5) + ln('M0 -153 C-2 -132 -1 -110 0 -94', RCLOTH, 2.4))
    sprite(key + '_b', back_vb(RC_VB), o, 'Risen cleric back')


# ---------------------------------------------------------------- the Risen mage
RM_SKIRT = 'M-12 -70 C-17 -46 -22 -24 -25 -6 ' + A.ragged(-25, 25, -6, 6, 5) + ' C22 -24 17 -46 12 -70 Z'
RM_SLEEVE_ORB = 'M-18 -98 C-25 -91 -28 -84 -29 -78 L-23 -76 L-21 -80 L-17 -77 C-17 -84 -16 -88 -12 -92 Z'
RM_SLEEVE_STAFF = 'M18 -98 C25 -93 28 -88 29 -83 L23 -81 L21 -85 L17 -82 C17 -88 16 -91 12 -92 Z'
RM_VB = (-42, -190, 94, 196)


def risen_mage_front(fem=True, key='risen_dps', tier=2):
    o = []
    robe_col = MRAG if tier == 0 else RROBE
    dark_col = MRAG_D if tier == 0 else RROBE_D
    hair, _ = H.elf_head(Z, back_len=50, hair=RHAIR, hairD=RHAIR_D, fem=fem)
    o.append(head(0, -126, hair))
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', BONE, 3))
    o.append(s(RM_SKIRT, robe_col))
    if tier >= 1:
        o.append(s('M-5 -68 L-8 -8 L-3 -11 L0 -7 L3 -11 L8 -8 L5 -68 Z', ROPE if tier == 1 else GOLD, 3))
    o.append(s(E_BODICE, robe_col))
    if not fem and tier >= 2:
        o.append(s('M-13 -100 L0 -76 L13 -100 Z', GOLD, 2.8) + s('M-8 -100 L0 -84 L8 -100 Z', RROBE_D, 2.4))
        o.append(c(0, -88, 3.4, GRN, 2))
    o.append(s('M-14 -74 H14 V-67 H-14 Z', ROPE if tier == 0 else dark_col, 3))
    if tier >= 2:
        o.append(s('M-3.5 -75.5 H3.5 V-65.5 H-3.5 Z', FROST_L, 2.2))
    o.append(bone_limb('M-24 -80 L-27 -66', 4.2) + s(RM_SLEEVE_ORB, robe_col) + bone_hand(-27, -63, 4.8))
    o.append(halo(-27, -76, 12, FROST, 0.42) + c(-27, -76, 6, FROST_L, 3))
    o.append(bone_limb('M24 -84 L31 -74', 4.2) + s(RM_SLEEVE_STAFF, robe_col))
    if tier >= 2:
        o.append(s('M-15 -100 C-15 -110 -10 -115 -6.5 -108 L0 -104 L6.5 -108 C10 -115 15 -110 15 -100 C8 -97 -8 -97 -15 -100 Z', RHAIR if fem else RROBE_D, 3.5))
        o.append(both(SHARDS, BONE, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), BONE_D, 2.2))
    else:
        o.append(both('M-11 -100 C-18 -103 -27 -101 -31 -94 C-24 -93 -17 -94 -11 -96 Z', dark_col, 3))
    frost_staff(o, tier=tier)
    o.append(bone_hand(32, -72, 4.8))
    if fem:
        o.append(both('M-11 -124 C-16.5 -110 -16.5 -94 -12.5 -82 C-8.5 -86 -8.5 -102 -9.5 -118 Z', RHAIR, 2.8))
    o.append(head(0, -126, H.risen_head(Z, fem=fem)))
    hat(o, -4, robe_col, tier=tier)
    if not fem and tier >= 2:
        for x in (-7, 0, 7):
            o.append(s(f'M{x - 2.5} -149 L{x} -160 L{x + 2.5} -149 Z', BONE, 2.2))
    sprite(key + '_f', RM_VB, o, 'Risen mage front')


def risen_mage_back(fem=True, key='risen_dps', tier=2):
    o = []
    robe_col = MRAG if tier == 0 else RROBE
    dark_col = MRAG_D if tier == 0 else RROBE_D
    o.append(both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', BONE, 3))
    o.append(s(RM_SKIRT, robe_col) + s(E_BODICE, robe_col) + s('M-14 -74 H14 V-67 H-14 Z', ROPE if tier == 0 else dark_col, 3))
    o.append(bone_limb(m('M24 -84 L31 -74'), 4.2) + s(m(RM_SLEEVE_STAFF), robe_col))
    o.append(bone_limb(m('M-24 -80 L-27 -66'), 4.2) + s(m(RM_SLEEVE_ORB), robe_col) + bone_hand(27, -63, 4.8))
    o.append(halo(27, -76, 12, FROST, 0.42) + c(27, -76, 6, FROST_L, 3))
    if tier >= 2:
        o.append(s('M-15 -100 C-15 -111 15 -111 15 -100 C8 -97 -8 -97 -15 -100 Z', RHAIR, 3.5))
        o.append(both(SHARDS, BONE, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), BONE_D, 2.2))
    frost_staff(o, -35, tier=tier)
    o.append(bone_hand(-32, -72, 4.8))
    o.append(head(0, -126, H.elf_back(Z, back_len=50, hair=RHAIR, hairD=RHAIR_D, ears=False, fem=fem)))
    hat(o, -4, robe_col, back=True, tier=tier)
    sprite(key + '_b', back_vb(RM_VB), o, 'Risen mage back')


# ---------------------------------------------------------------- the rogue (human & elf shadowblade, dual daggers)
RG_LEATHER, RG_LEATHER_D, RG_CLOAK, RG_STEEL = '#4A385C', '#2E223B', '#241B30', '#D7DEE6'
RG_VENOM = '#7CF06A'
RG_VB = (-56, -162, 112, 168)


def twin_daggers(o, lx=-36, rx=36, y=-62, tier=2, risen=False):
    """dual daggers held ready in both hands — bronze shivs (0), iron daggers (1), venom-tipped shadow stilettos (2)"""
    col = BRONZE if tier == 0 else STEEL if tier == 1 else (BONE if risen else RG_STEEL)
    guard = WOOD_D if tier == 0 else RIRON_D if tier == 1 else GOLD
    for sx, hx in ((-1, lx), (1, rx)):
        # pommel & crossguard
        o.append(c(hx - sx * 2, y + 6, 3.2, guard, 2.4))
        o.append(s(f'M{hx - 8} {y - 3} H{hx + 8} V{y + 2} H{hx - 8} Z', guard, 2.8))
        if tier == 0:
            o.append(s(f'M{hx - 4} {y - 3} L{hx + sx * 10} {y - 34} L{hx + 4} {y - 3} Z', col, 3.2))
        elif tier == 1:
            o.append(s(f'M{hx - 4.5} {y - 3} L{hx + sx * 14} {y - 44} L{hx + 4.5} {y - 3} Z', col, 3.3))
        else:
            o.append(s(f'M{hx - 5} {y - 3} C{hx - 2} {y - 24} {hx + sx * 6} {y - 40} {hx + sx * 16} {y - 52} C{hx + sx * 12} {y - 34} {hx + 6} {y - 18} {hx + 5} {y - 3} Z', col, 3.4))
            o.append(ln(f'M{hx + sx * 3} {y - 20} L{hx + sx * 13} {y - 46}', RG_VENOM, 2.4))


def rogue_spaulders(o, tier=2, risen=False):
    if tier == 0:
        o.append(both('M-11 -102 C-16 -110 -31 -110 -36 -96 L-34 -90 C-26 -94 -18 -96 -11 -95 Z', RAG_D))
        return
    pad = RIRON if risen else ('#6B4528' if tier == 1 else RG_LEATHER)
    trim = RIRON_D if risen else ('#3B2818' if tier == 1 else RG_CLOAK)
    o.append(both('M-11 -104 C-16 -116 -37 -118 -43 -98 L-41 -90 C-31 -95 -20 -97 -11 -96 Z', pad))
    o.append(both('M-41 -90 C-31 -95 -20 -97 -11 -96 L-11 -91 C-21 -92 -31 -90 -40 -84 Z', trim, 3))
    if tier >= 2:
        o.append(both('M-28 -111 L-35 -126 L-21 -112 Z', BONE if risen else RG_STEEL, 2.8))
        for x in (-26, 26):
            o.append(c(x, -102, 2.6, RG_VENOM, 1.8))


def rogue_hood_mask(o, back=False, fem=True, tier=2, risen=False):
    if tier == 0:
        if not back:
            o.append(s('M-11 -115 H11 L9 -105 C3 -102 -3 -102 -9 -105 Z', RAG_D, 2.8))
        return
    hood_col = RCLOTH_D if risen else ('#4E3624' if tier == 1 else RG_CLOAK)
    mask_col = '#1E1826' if tier >= 2 else RAG_D
    if not back:
        o.append(s('M-12 -116 H12 L10 -104 C4 -100 -4 -100 -10 -104 Z', mask_col, 3))
        if tier >= 2:
            o.append(ln('M-8 -111 H8', RG_LEATHER, 2))
            o.append(s('M-16 -122 C-18 -142 -10 -154 0 -156 C10 -154 18 -142 16 -122 C11 -134 -11 -134 -16 -122 Z', hood_col, 3.4))
            o.append(c(0, -138, 2.6, RG_VENOM, 1.8))
    else:
        if tier >= 2:
            o.append(s('M-16 -116 C-19 -140 -10 -154 0 -156 C10 -154 19 -140 16 -116 L8 -102 L0 -96 L-8 -102 Z', hood_col, 3.4))


def rogue_front(fem=True, key='rogue', tier=2):
    o = []
    vest = RAG if tier == 0 else '#6B4528' if tier == 1 else RG_LEATHER
    dark = RAG_D if tier == 0 else '#3B2818' if tier == 1 else RG_LEATHER_D
    if tier >= 1:
        o.append(s('M-18 -102 C-24 -76 -26 -48 -24 -22 L-14 -28 L-6 -20 L0 -28 L6 -20 L14 -28 L24 -22 C26 -48 24 -76 18 -102 Z', RG_CLOAK))
    # agile boots & fitted trousers
    o.append(both('M-14 -16 H-4 V0 H-18 C-19 -5 -17 -12 -14 -16 Z', BOOT))
    o.append(both('M-13 -66 L-15 -16 H-4 L-3 -66 Z', dark))
    # fitted leather jerkin & twin cross-belts
    o.append(s('M-15 -102 C-18 -88 -17 -76 -14 -66 H14 C17 -76 18 -88 15 -102 Z', vest))
    o.append(ln('M-12 -96 L12 -70 M12 -96 L-12 -70', ROPE if tier == 0 else '#8C6239', 3.2))
    o.append(s('M-16 -70 H16 V-62 H-16 Z', ROPE if tier == 0 else BOOT, 3.2) + c(0, -66, 3.4, BRONZE if tier <= 1 else GOLD, 2.2))
    # sleeves & hands holding dual daggers
    o.append(both('M-18 -98 C-27 -90 -33 -78 -36 -64 L-28 -60 C-26 -72 -22 -82 -14 -90 Z', dark))
    rogue_spaulders(o, tier=tier, risen=False)
    twin_daggers(o, -36, 36, -62, tier=tier, risen=False)
    o.append(c(-36, -62, 5.2, HSKIN, 3.2) + c(36, -62, 5.2, HSKIN, 3.2))
    o.append(s('M-5 -106 H5 V-99 H-5 Z', HSKIN, 2.8))
    o.append(head(0, -118, H.human_head(Z, bun=fem, circlet=False, fem=fem)))
    rogue_hood_mask(o, back=False, fem=fem, tier=tier, risen=False)
    sprite(key + '_f', RG_VB, o, 'Rogue front')


def rogue_back(fem=True, key='rogue', tier=2):
    o = []
    vest = RAG if tier == 0 else '#6B4528' if tier == 1 else RG_LEATHER
    dark = RAG_D if tier == 0 else '#3B2818' if tier == 1 else RG_LEATHER_D
    o.append(both('M-14 -16 H-4 V0 H-18 C-19 -5 -17 -12 -14 -16 Z', BOOT))
    o.append(both('M-13 -66 L-15 -16 H-4 L-3 -66 Z', dark))
    o.append(s('M-15 -102 C-18 -88 -17 -76 -14 -66 H14 C17 -76 18 -88 15 -102 Z', vest))
    o.append(s('M-16 -70 H16 V-62 H-16 Z', ROPE if tier == 0 else BOOT, 3.2))
    if tier >= 1:
        o.append(s('M-18 -102 C-24 -76 -26 -48 -24 -22 L-14 -28 L-6 -20 L0 -28 L6 -20 L14 -28 L24 -22 C26 -48 24 -76 18 -102 Z', RG_CLOAK))
    o.append(both('M-18 -98 C-27 -90 -33 -78 -36 -64 L-28 -60 C-26 -72 -22 -82 -14 -90 Z', dark))
    rogue_spaulders(o, tier=tier, risen=False)
    twin_daggers(o, -36, 36, -62, tier=tier, risen=False)
    o.append(c(-36, -62, 5.2, HSKIN, 3.2) + c(36, -62, 5.2, HSKIN, 3.2))
    o.append(head(0, -118, H.human_back(Z, bun=fem, circlet=False)))
    rogue_hood_mask(o, back=True, fem=fem, tier=tier, risen=False)
    sprite(key + '_b', back_vb(RG_VB), o, 'Rogue back')


def risen_rogue_front(fem=True, key='risen_rogue', tier=2):
    o = []
    if tier >= 1:
        o.append(s('M-18 -106 C-24 -80 -26 -50 -24 -24 L-14 -30 L-6 -22 L0 -30 L6 -22 L14 -30 L24 -24 C26 -50 24 -80 18 -106 Z', RCLOTH_D))
    risen_legs(o, tier)
    o.append(s('M-11 -66 C-13 -57 -7 -54 0 -55 C7 -54 13 -57 11 -66 Z', BONE, 3))
    o.append(s('M-15 -70 H15 V-63 H-15 Z', ROPE if tier == 0 else RIRON_D, 3) + c(0, -66.5, 3.2, RG_VENOM if tier >= 2 else BONE, 2))
    o.append(beam('M0 -76 V-70', BONE, 4.2, 3))
    o.append(ribcage(0, -104, 24, 28))
    o.append(ln('M-11 -98 L11 -72 M11 -98 L-11 -72', ROPE if tier == 0 else RIRON_D, 3))
    o.append(bone_limb('M-26 -96 L-34 -78 L-36 -64', 4.2))
    o.append(bone_limb('M26 -96 L34 -78 L36 -64', 4.2))
    rogue_spaulders(o, tier=tier, risen=True)
    twin_daggers(o, -36, 36, -62, tier=tier, risen=True)
    o.append(bone_hand(-36, -62, 4.8) + bone_hand(36, -62, 4.8))
    o.append(head(0, -124, H.risen_head(Z, fem=fem)))
    rogue_hood_mask(o, back=False, fem=fem, tier=tier, risen=True)
    sprite(key + '_f', RG_VB, o, 'Risen rogue front')


def risen_rogue_back(fem=True, key='risen_rogue', tier=2):
    o = []
    risen_legs(o, tier)
    o.append(beam('M0 -76 V-70', BONE, 4.2, 3))
    o.append(ribcage(0, -104, 24, 28))
    if tier >= 1:
        o.append(s('M-18 -106 C-24 -80 -26 -50 -24 -24 L-14 -30 L-6 -22 L0 -30 L6 -22 L14 -30 L24 -24 C26 -50 24 -80 18 -106 Z', RCLOTH_D))
    o.append(bone_limb('M-26 -96 L-34 -78 L-36 -64', 4.2))
    o.append(bone_limb('M26 -96 L34 -78 L36 -64', 4.2))
    rogue_spaulders(o, tier=tier, risen=True)
    twin_daggers(o, -36, 36, -62, tier=tier, risen=True)
    o.append(bone_hand(-36, -62, 4.8) + bone_hand(36, -62, 4.8))
    o.append(head(0, -124, H.risen_back(Z)))
    rogue_hood_mask(o, back=True, fem=fem, tier=tier, risen=True)
    sprite(key + '_b', back_vb(RG_VB), o, 'Risen rogue back')


# ---------------------------------------------------------------- the pint-sized heroes (gnome & goblin)
SM_CLR_VB = (-58, -138, 112, 144)
SM_MAG_VB = (-48, -144, 102, 150)
SM_ROG_VB = (-56, -128, 112, 134)


def pint_face(race, fem=False, goggles=False):
    return H.gnome_head(Z, fem=fem, goggles=goggles) if race == 'gnome' else H.goblin_head(Z, fem=fem)


def pint_back_head(race, fem=False):
    return H.gnome_back(Z, fem=fem) if race == 'gnome' else H.goblin_back(Z, fem=fem)


def pint_skin(race):
    return GSKIN if race == 'gnome' else GBSKIN


def pint_cleric_front(race='gnome', fem=True, key='gnome_healer', tier=2):
    o = []
    skin = pint_skin(race)
    robe_col = RAG if tier == 0 else '#EAE2D0' if tier == 1 else ROBE
    trim_col = RAG_D if tier == 0 else HBLUE if tier == 1 else GOLD
    o.append(both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', WOOD_D, 3.2))
    o.append(s('M-13 -44 C-18 -30 -24 -15 -27 -2 H27 C24 -15 18 -30 13 -44 Z', robe_col))
    if tier == 0:
        o.append(s('M-17 -26 L-8 -24 L-9 -14 L-18 -16 Z', RAG_D, 2.2))
    else:
        o.append(s('M-6 -43 L-9 -4 H9 L6 -43 Z', HBLUE, 2.8))
    o.append(s('M-27 -7 C-9 -4 9 -4 27 -7 L28 -2 C9 1 -9 1 -28 -2 Z', trim_col, 3.2))
    o.append(s('M-14 -66 C-17 -58 -16 -50 -13 -44 H13 C16 -50 17 -58 14 -66 Z', robe_col))
    o.append(s('M-8 -65 L0 -53 L8 -65 Z', RAG_D if tier == 0 else HBLUE, 2.6))
    o.append(s('M-15 -47 H15 V-40 H-15 Z', ROPE if tier == 0 else WOOD_D if tier == 1 else GOLD, 3.2))
    if race == 'goblin':
        o.append(s('M9 -45 C8 -38 16 -38 15 -45 Z', '#8A5A34', 2.2) + c(12, -41, 1.5, GOLD, 0))
    o.append(s('M-17 -63 C-26 -57 -31 -48 -33 -38 C-28 -34 -22 -34 -18 -38 C-18 -46 -16 -53 -12 -58 Z', robe_col))
    o.append(s('M17 -63 C25 -58 30 -50 32 -42 C28 -38 22 -38 18 -41 C17 -48 15 -54 12 -58 Z', robe_col))
    o.append(halo(26, -35, 11, '#F4B942', 0.38) + c(26, -35, 4.8, skin, 3.2))
    o.append(s('M26 -48 Q26 -42 32 -42 Q26 -42 26 -36 Q26 -42 20 -42 Q26 -42 26 -48 Z', '#FFE08A', 1.6))
    if tier == 0:
        o.append(both('M-8 -66 C-12 -74 -26 -75 -31 -62 L-29 -57 C-22 -60 -15 -62 -8 -61 Z', RAG_D))
    elif tier == 1:
        o.append(both('M-8 -67 C-13 -77 -30 -79 -35 -64 L-33 -57 C-25 -61 -15 -63 -8 -62 Z', ROBE))
        o.append(both('M-33 -57 C-25 -61 -15 -63 -8 -62 L-8 -58 C-16 -59 -25 -57 -32 -52 Z', HBLUE, 2.8))
    else:
        o.append(both('M-8 -67 C-13 -79 -33 -81 -38 -65 L-36 -57 C-27 -62 -16 -64 -8 -63 Z', ROBE))
        o.append(both('M-36 -57 C-27 -62 -16 -64 -8 -63 L-8 -58 C-17 -60 -27 -57 -35 -52 Z', GOLD, 3.0))
        for x in (-23, 23):
            o.append(c(x, -69, 4.5, GOLD, 2.6) + c(x, -69, 1.8, HBLUE, 0))
    o.append(beam('M-31 2 L-31 -106' if tier == 0 else 'M-31 2 L-31 -114', WOOD_D if tier == 0 else WOOD, 5.0))
    o.append(sun(-31, -122, r=8.5, tier=tier))
    o.append(c(-31, -34, 4.8, skin, 3.2))
    o.append(head(0, -79, pint_face(race, fem=fem, goggles=(race == 'gnome' and tier <= 1))))
    if tier >= 2:
        o.append(s('M-12.5 -90.5 L-6 -94.5 L0 -100 L6 -94.5 L12.5 -90.5 L11.5 -87.5 C5 -90.5 -5 -90.5 -11.5 -87.5 Z', GOLD, 2.6))
        o.append(c(0, -92, 2.6, HBLUE, 1.8))
    sprite(key + '_f', SM_CLR_VB, o, f'{race.capitalize()} cleric front')


def pint_cleric_back(race='gnome', fem=True, key='gnome_healer', tier=2):
    o = []
    skin = pint_skin(race)
    robe_col = RAG if tier == 0 else '#EAE2D0' if tier == 1 else ROBE
    trim_col = RAG_D if tier == 0 else HBLUE if tier == 1 else GOLD
    o.append(both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', WOOD_D, 3.2))
    o.append(s('M-13 -44 C-18 -30 -24 -15 -27 -2 H27 C24 -15 18 -30 13 -44 Z', robe_col))
    o.append(s('M-27 -7 C-9 -4 9 -4 27 -7 L28 -2 C9 1 -9 1 -28 -2 Z', trim_col, 3.2))
    if tier >= 2:
        o.append(sun(0, -24, 6.0, spin=0))
    o.append(s('M-14 -66 C-17 -58 -16 -50 -13 -44 H13 C16 -50 17 -58 14 -66 Z', robe_col))
    o.append(s('M-15 -47 H15 V-40 H-15 Z', ROPE if tier == 0 else WOOD_D if tier == 1 else GOLD, 3.2))
    o.append(s(m('M17 -63 C25 -58 30 -50 32 -42 C28 -38 22 -38 18 -41 C17 -48 15 -54 12 -58 Z'), robe_col))
    o.append(halo(-26, -35, 11, '#F4B942', 0.38) + c(-26, -35, 4.8, skin, 3.2))
    o.append(s(m('M-17 -63 C-26 -57 -31 -48 -33 -38 C-28 -34 -22 -34 -18 -38 C-18 -46 -16 -53 -12 -58 Z'), robe_col))
    if tier == 0:
        o.append(both('M-8 -66 C-12 -74 -26 -75 -31 -62 L-29 -57 C-22 -60 -15 -62 -8 -61 Z', RAG_D))
    elif tier == 1:
        o.append(both('M-8 -67 C-13 -77 -30 -79 -35 -64 L-33 -57 C-25 -61 -15 -63 -8 -62 Z', ROBE))
    else:
        o.append(both('M-8 -67 C-13 -79 -33 -81 -38 -65 L-36 -57 C-27 -62 -16 -64 -8 -63 Z', ROBE))
        o.append(both('M-36 -57 C-27 -62 -16 -64 -8 -63 L-8 -58 C-17 -60 -27 -57 -35 -52 Z', GOLD, 3.0))
    o.append(beam('M31 2 L31 -106' if tier == 0 else 'M31 2 L31 -114', WOOD_D if tier == 0 else WOOD, 5.0))
    o.append(sun(31, -122, r=8.5, tier=tier))
    o.append(c(31, -34, 4.8, skin, 3.2))
    o.append(head(0, -79, pint_back_head(race, fem=fem)))
    if tier >= 2:
        o.append(ln('M-12 -87.5 C-5 -85.5 5 -85.5 12 -87.5', GOLD, 2.8))
    sprite(key + '_b', back_vb(SM_CLR_VB), o, f'{race.capitalize()} cleric back')


def pint_frost_staff(o, x=30, tier=2):
    if tier == 0:
        o.append(beam(f'M{x + 1} 2 L{x} -96', WOOD_D, 4.2) + halo(x, -103, 10, FROST, 0.25) + c(x, -103, 4.5, FROST_L, 2.4))
        return
    if tier == 1:
        o.append(beam(f'M{x + 1} 2 L{x} -104', WOOD, 4.6) + halo(x, -112, 14, FROST, 0.28) + c(x, -112, 7, FROST, 2.8))
        return
    o.append(beam(f'M{x + 1} 2 L{x} -106', WOOD, 4.8) + halo(x, -118, 19, FROST, 0.32))
    o.append(s(f'M{x} -134 L{x + 9} -118 L{x} -102 L{x - 9} -118 Z', FROST, 3.2) + ln(f'M{x - 2} -127 L{x - 5} -119', '#FFFFFF', 2.2) + s(f'M{x - 6} -106 H{x + 6} V-101 H{x - 6} Z', GOLD, 2.4))


def pint_hat(o, col=IROBE, back=False, tier=2, goggles=False):
    if tier == 0:
        return
    cone = 'M-12.5 -95 C-10.5 -109 -3 -123 9.5 -131 C6.5 -120 8.5 -107 12.5 -95 Z'
    band = 'M-13 -96 C-4 -93 4 -93 13 -96 L12 -101 C4 -98 -4 -98 -12 -101 Z'
    o.append(e(0, -93, 18.5, 4.8, col, 3.4))
    o.append(s(m(cone) if back else cone, col) + s(band, ROPE if tier == 1 else GOLD, 2.8))
    if not back and goggles:
        for sx in (-1, 1):
            gx = 5.6 * sx
            o.append(c(gx, -98.5, 4.8, GOLD, 2.4) + c(gx, -98.5, 2.9, FROST_L, 1.6))
    elif not back and tier >= 2:
        o.append(ln('M2.5 -115 V-107 M-1 -113 L6 -109 M-1 -109 L6 -113', '#FFFFFF', 1.8))


def pint_mage_front(race='gnome', fem=True, key='gnome_dps', tier=2):
    o = []
    skin = pint_skin(race)
    robe_col = MRAG if tier == 0 else IROBE_D if tier == 1 else IROBE
    dark_col = MRAG_D if tier == 0 else '#22496E' if tier == 1 else IROBE_D
    o.append(both('M-10 -5 H-3 V0 H-13 C-14 -3 -13 -5 -10 -5 Z', dark_col, 3))
    o.append(s('M-11 -45 C-15 -30 -20 -15 -22 -2 H22 C20 -15 15 -30 11 -45 Z', robe_col))
    if tier == 0:
        o.append(s('M-14 -26 L-5 -24 L-7 -14 L-16 -16 Z', MRAG_D, 2.2))
    else:
        o.append(s('M-4.5 -44 L-7 -3 H7 L4.5 -44 Z', ROPE if tier == 1 else GOLD, 2.8))
    o.append(s('M-22 -7 C-7 -4 7 -4 22 -7 L23 -2 C7 1 -7 1 -23 -2 Z', dark_col, 3))
    o.append(s('M-12 -66 C-15 -58 -14 -50 -11 -45 H11 C14 -50 15 -58 12 -66 Z', robe_col))
    o.append(s('M-7.5 -65 L0 -53 L7.5 -65 Z', dark_col, 2.4))
    o.append(s('M-13 -48 H13 V-42 H-13 Z', ROPE if tier == 0 else dark_col, 2.8))
    if tier >= 2:
        o.append(s('M-3.2 -49 H3.2 V-41 H-3.2 Z', FROST_L, 2.0))
    o.append(s('M-15 -63 C-22 -57 -26 -50 -27 -42 C-23 -39 -19 -40 -17 -43 C-17 -50 -15 -56 -11 -59 Z', robe_col) + c(-22, -39, 4.4, skin, 3))
    o.append(halo(-23, -50, 11, FROST, 0.42) + c(-23, -50, 5.5, FROST_L, 2.8))
    o.append(s('M15 -63 C22 -58 26 -52 28 -45 C25 -42 21 -42 18 -45 C17 -52 15 -56 11 -59 Z', robe_col))
    if tier == 0:
        o.append(both('M-10 -65 C-16 -68 -24 -66 -27 -60 C-21 -59 -15 -60 -10 -61 Z', MRAG_D, 2.8))
    elif tier == 1:
        o.append(both('M-10 -66 C-17 -70 -26 -68 -30 -60 C-23 -59 -16 -60 -10 -62 Z', dark_col, 3.0))
    else:
        o.append(s('M-13 -65 C-13 -73 -9 -77 -5.5 -71 L0 -68 L5.5 -71 C9 -77 13 -73 13 -65 C7 -62 -7 -62 -13 -65 Z', '#FFFFFF' if fem else IROBE_D, 3.2))
        o.append(both('M-10 -67 L-15 -82 L-21 -70 L-30 -77 L-33 -62 C-26 -60 -17 -60 -10 -62 Z', FROST, 3.2))
    pint_frost_staff(o, 30, tier=tier)
    o.append(c(27, -43, 4.4, skin, 3))
    o.append(head(0, -79, pint_face(race, fem=fem, goggles=(race == 'gnome' and tier == 0))))
    pint_hat(o, col=robe_col, tier=tier, goggles=(race == 'gnome' and tier >= 1))
    sprite(key + '_f', SM_MAG_VB, o, f'{race.capitalize()} mage front')


def pint_mage_back(race='gnome', fem=True, key='gnome_dps', tier=2):
    o = []
    skin = pint_skin(race)
    robe_col = MRAG if tier == 0 else IROBE_D if tier == 1 else IROBE
    dark_col = MRAG_D if tier == 0 else '#22496E' if tier == 1 else IROBE_D
    o.append(both('M-10 -5 H-3 V0 H-13 C-14 -3 -13 -5 -10 -5 Z', dark_col, 3))
    o.append(s('M-11 -45 C-15 -30 -20 -15 -22 -2 H22 C20 -15 15 -30 11 -45 Z', robe_col) + s('M-22 -7 C-7 -4 7 -4 22 -7 L23 -2 C7 1 -7 1 -23 -2 Z', dark_col, 3))
    o.append(s('M-12 -66 C-15 -58 -14 -50 -11 -45 H11 C14 -50 15 -58 12 -66 Z', robe_col) + s('M-13 -48 H13 V-42 H-13 Z', ROPE if tier == 0 else dark_col, 2.8))
    o.append(s(m('M15 -63 C22 -58 26 -52 28 -45 C25 -42 21 -42 18 -45 C17 -52 15 -56 11 -59 Z'), robe_col))
    o.append(s(m('M-15 -63 C-22 -57 -26 -50 -27 -42 C-23 -39 -19 -40 -17 -43 C-17 -50 -15 -56 -11 -59 Z'), robe_col) + c(22, -39, 4.4, skin, 3))
    o.append(halo(23, -50, 11, FROST, 0.42) + c(23, -50, 5.5, FROST_L, 2.8))
    if tier >= 2:
        o.append(s('M-13 -65 C-13 -73 13 -73 13 -65 C7 -62 -7 -62 -13 -65 Z', '#FFFFFF' if fem else IROBE_D, 3.2))
        o.append(both('M-10 -67 L-15 -82 L-21 -70 L-30 -77 L-33 -62 C-26 -60 -17 -60 -10 -62 Z', FROST, 3.2))
    pint_frost_staff(o, -30, tier=tier)
    o.append(c(-27, -43, 4.4, skin, 3))
    o.append(head(0, -79, pint_back_head(race, fem=fem)))
    pint_hat(o, col=robe_col, back=True, tier=tier)
    sprite(key + '_b', back_vb(SM_MAG_VB), o, f'{race.capitalize()} mage back')


def pint_rogue_hood_mask(o, race='gnome', back=False, fem=True, tier=2):
    if tier == 0:
        if not back:
            o.append(s('M-12.5 -71.5 Q0 -69.5 12.5 -71.5 L11 -63.5 C4 -60.5 -4 -60.5 -11 -63.5 Z', RAG_D, 2.6))
        return
    hood_col = '#4E3624' if tier == 1 else RG_CLOAK
    mask_col = '#1E1826' if tier >= 2 else RAG_D
    if not back:
        o.append(s('M-13.5 -72.0 Q0 -70.0 13.5 -72.0 L11.5 -63.0 C4 -60.0 -4 -60.0 -11.5 -63.0 Z', mask_col, 2.8))
        if tier >= 2:
            o.append(ln('M-8.5 -67.5 H8.5', RG_LEATHER, 1.8))
            o.append(s('M-16.5 -79 C-18.5 -99 -10.5 -108 0 -110 C10.5 -108 18.5 -99 16.5 -79 C12 -89.5 -12 -89.5 -16.5 -79 Z', hood_col, 3.2))
            if race == 'gnome':
                for sx in (-1, 1):
                    o.append(c(6.2 * sx, -93.5, 4.6, GOLD, 2.2) + c(6.2 * sx, -93.5, 2.6, RG_VENOM, 0))
            else:
                o.append(c(0, -95, 2.5, RG_VENOM, 1.8))
    else:
        if tier >= 2:
            o.append(s('M-16.5 -77 C-19 -97 -10.5 -108 0 -110 C10.5 -108 19 -97 16.5 -77 L8 -65 L0 -60 L-8 -65 Z', hood_col, 3.2))


def pint_rogue_front(race='gnome', fem=True, key='gnome_rogue', tier=2):
    o = []
    skin = pint_skin(race)
    vest = RAG if tier == 0 else '#6B4528' if tier == 1 else RG_LEATHER
    dark = RAG_D if tier == 0 else '#3B2818' if tier == 1 else RG_LEATHER_D
    if tier >= 1:
        o.append(s('M-15 -66 C-20 -48 -22 -30 -20 -14 L-12 -19 L-5 -12 L0 -19 L5 -12 L12 -19 L20 -14 C22 -30 20 -48 15 -66 Z', RG_CLOAK))
    o.append(both('M-13 -12 H-3.5 V0 H-17 C-18 -4 -16 -9 -13 -12 Z', BOOT))
    o.append(both('M-12 -42 L-14 -12 H-4 L-3 -42 Z', dark))
    o.append(s('M-14 -66 C-17 -56 -16 -48 -13 -42 H13 C16 -48 17 -56 14 -66 Z', vest))
    o.append(ln('M-10 -62 L10 -44 M10 -62 L-10 -44', ROPE if tier == 0 else '#8C6239', 2.8))
    o.append(s('M-15 -45 H15 V-39 H-15 Z', ROPE if tier == 0 else BOOT, 2.8) + c(0, -42, 3.0, BRONZE if tier <= 1 else GOLD, 2.0))
    if race == 'goblin':
        o.append(s('M9 -43 C8 -36 16 -36 15 -43 Z', '#8A5A34', 2.2) + c(12, -39, 1.5, GOLD, 0))
    o.append(both('M-15 -63 C-23 -57 -28 -49 -30 -40 L-23 -37 C-21 -45 -18 -52 -12 -58 Z', dark))
    if tier == 0:
        o.append(both('M-10 -65 C-15 -72 -27 -72 -31 -60 L-29 -55 C-23 -58 -16 -60 -10 -59 Z', RAG_D))
    else:
        pad = '#6B4528' if tier == 1 else RG_LEATHER
        trim = '#3B2818' if tier == 1 else RG_CLOAK
        o.append(both('M-10 -66 C-15 -76 -32 -77 -37 -61 L-35 -55 C-27 -59 -17 -61 -10 -60 Z', pad))
        o.append(both('M-35 -55 C-27 -59 -17 -61 -10 -60 L-10 -56 C-18 -57 -27 -55 -34 -50 Z', trim, 2.8))
        if tier >= 2:
            o.append(both('M-24 -72 L-30 -84 L-18 -73 Z', RG_STEEL, 2.6))
            for x in (-22, 22):
                o.append(c(x, -65, 2.2, RG_VENOM, 1.6))
    twin_daggers(o, -30, 30, -40, tier=tier, risen=False)
    o.append(c(-30, -40, 4.8, skin, 3.0) + c(30, -40, 4.8, skin, 3.0))
    o.append(head(0, -78, pint_face(race, fem=fem, goggles=(race == 'gnome' and tier <= 1))))
    pint_rogue_hood_mask(o, race=race, back=False, fem=fem, tier=tier)
    sprite(key + '_f', SM_ROG_VB, o, f'{race.capitalize()} rogue front')


def pint_rogue_back(race='gnome', fem=True, key='gnome_rogue', tier=2):
    o = []
    skin = pint_skin(race)
    vest = RAG if tier == 0 else '#6B4528' if tier == 1 else RG_LEATHER
    dark = RAG_D if tier == 0 else '#3B2818' if tier == 1 else RG_LEATHER_D
    o.append(both('M-13 -12 H-3.5 V0 H-17 C-18 -4 -16 -9 -13 -12 Z', BOOT))
    o.append(both('M-12 -42 L-14 -12 H-4 L-3 -42 Z', dark))
    o.append(s('M-14 -66 C-17 -56 -16 -48 -13 -42 H13 C16 -48 17 -56 14 -66 Z', vest))
    o.append(s('M-15 -45 H15 V-39 H-15 Z', ROPE if tier == 0 else BOOT, 2.8))
    if tier >= 1:
        o.append(s('M-15 -66 C-20 -48 -22 -30 -20 -14 L-12 -19 L-5 -12 L0 -19 L5 -12 L12 -19 L20 -14 C22 -30 20 -48 15 -66 Z', RG_CLOAK))
    o.append(both('M-15 -63 C-23 -57 -28 -49 -30 -40 L-23 -37 C-21 -45 -18 -52 -12 -58 Z', dark))
    if tier == 0:
        o.append(both('M-10 -65 C-15 -72 -27 -72 -31 -60 L-29 -55 C-23 -58 -16 -60 -10 -59 Z', RAG_D))
    else:
        pad = '#6B4528' if tier == 1 else RG_LEATHER
        trim = '#3B2818' if tier == 1 else RG_CLOAK
        o.append(both('M-10 -66 C-15 -76 -32 -77 -37 -61 L-35 -55 C-27 -59 -17 -61 -10 -60 Z', pad))
        o.append(both('M-35 -55 C-27 -59 -17 -61 -10 -60 L-10 -56 C-18 -57 -27 -55 -34 -50 Z', trim, 2.8))
        if tier >= 2:
            o.append(both('M-24 -72 L-30 -84 L-18 -73 Z', RG_STEEL, 2.6))
    twin_daggers(o, -30, 30, -40, tier=tier, risen=False)
    o.append(c(-30, -40, 4.8, skin, 3.0) + c(30, -40, 4.8, skin, 3.0))
    o.append(head(0, -78, pint_back_head(race, fem=fem)))
    pint_rogue_hood_mask(o, race=race, back=True, fem=fem, tier=tier)
    sprite(key + '_b', back_vb(SM_ROG_VB), o, f'{race.capitalize()} rogue back')


def build():
    for tier, suf in ((0, '_rags'), (1, '_iron'), (2, '')):
        cleric_front(True, 'healer' + suf, tier); cleric_back(True, 'healer' + suf, tier)
        cleric_front(False, 'healer_m' + suf, tier); cleric_back(False, 'healer_m' + suf, tier)
        elf_front(True, 'dps' + suf, tier); elf_back(True, 'dps' + suf, tier)
        elf_front(False, 'dps_m' + suf, tier); elf_back(False, 'dps_m' + suf, tier)
        rogue_front(True, 'rogue' + suf, tier); rogue_back(True, 'rogue' + suf, tier)
        rogue_front(False, 'rogue_m' + suf, tier); rogue_back(False, 'rogue_m' + suf, tier)
        risen_cleric_front(True, 'risen_healer' + suf, tier); risen_cleric_back(True, 'risen_healer' + suf, tier)
        risen_cleric_front(False, 'risen_healer_m' + suf, tier); risen_cleric_back(False, 'risen_healer_m' + suf, tier)
        risen_mage_front(True, 'risen_dps' + suf, tier); risen_mage_back(True, 'risen_dps' + suf, tier)
        risen_mage_front(False, 'risen_dps_m' + suf, tier); risen_mage_back(False, 'risen_dps_m' + suf, tier)
        risen_rogue_front(True, 'risen_rogue' + suf, tier); risen_rogue_back(True, 'risen_rogue' + suf, tier)
        risen_rogue_front(False, 'risen_rogue_m' + suf, tier); risen_rogue_back(False, 'risen_rogue_m' + suf, tier)
        for race in ('gnome', 'goblin'):
            pint_cleric_front(race, True, f'{race}_healer' + suf, tier); pint_cleric_back(race, True, f'{race}_healer' + suf, tier)
            pint_cleric_front(race, False, f'{race}_healer_m' + suf, tier); pint_cleric_back(race, False, f'{race}_healer_m' + suf, tier)
            pint_mage_front(race, True, f'{race}_dps' + suf, tier); pint_mage_back(race, True, f'{race}_dps' + suf, tier)
            pint_mage_front(race, False, f'{race}_dps_m' + suf, tier); pint_mage_back(race, False, f'{race}_dps_m' + suf, tier)
            pint_rogue_front(race, True, f'{race}_rogue' + suf, tier); pint_rogue_back(race, True, f'{race}_rogue' + suf, tier)
            pint_rogue_front(race, False, f'{race}_rogue_m' + suf, tier); pint_rogue_back(race, False, f'{race}_rogue_m' + suf, tier)
    # Gilded Bones: every Risen sprite again with its bones in gold
    for n in [k for k in HEROES if k.startswith('risen_')]:
        sp = HEROES[n]
        HEROES[n.rsplit('_', 1)[0] + '_gilded_' + n.rsplit('_', 1)[1]] = {
            'svg': sp['svg'].replace(BONE, GOLD).replace(BONE_D, GOLD_D), 'vb': sp['vb'], 'note': sp['note'] + ', gilded'}
    # Gilded Gnomes: every gnome again in its best gear, turned to a gold statue: skin, hair and metal (the game
    # draws only that tier gilded)
    for n in [k for k in HEROES if k.startswith('gnome_') and '_rags_' not in k and '_iron_' not in k]:
        sp = HEROES[n]
        HEROES[n.rsplit('_', 1)[0] + '_gilded_' + n.rsplit('_', 1)[1]] = {
            'svg': A.gild(sp['svg'], GNOME_GILD), 'vb': sp['vb'], 'note': sp['note'] + ', gilded'}
    return HEROES


# a gnome in gold: skin, cheeks and hair (A.gild turns the metal)
GNOME_GILD = {GSKIN: GOLD, H.GSKIN_D: GOLD_D, '#FFE4D0': '#FFE9A8', H.GBLUSH: '#E8A33A', H.GHAIR_M: '#FFE08A', H.GHAIR_MD: GOLD_D,
              H.GHAIR_F: '#FFE08A', H.GHAIR_FD: GOLD_D, H.GHAIR_FL: '#FFF3C4'}


