# The heroes, front (`_f`) and back (`_b`), in the locked TV-cartoon style: "Big Shoulders", where the armour
# is the silhouette (huge pauldrons and mantles, big hands and weapons) over the faces in art_heads.py. Every
# sprite is drawn around its ground point (0, 0); from behind, the weapon is in the other hand.
# The shapes are written at 1.25 times game size (the scale they were designed at). The helpers below shrink
# each one by Z as it is drawn and keep the ink at full weight, so heroes stand as tall as the mobs expect.
# The Risen are bones in their class's clothes; Gilded Bones is the same art with the bones in gold.
# Built into art/sprites.json by art_sprites.py. The warrior, cleric and mage are drawn in layers now (their
# bodies in art_bodies.py, their gear in art_gear_<class>.py) from the shapes and pieces kept here.
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


# ---------------------------------------------------------------- the elf mage's shapes and pieces
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
        # Common wears the rag cap instead (art_gear_mage.py)
        return
    cone, band = tp(HAT_CONE, 0, dy), tp(HAT_BAND, 0, dy)
    o.append(e(0, -141 + dy, 19, 5, col, 3.5))
    o.append(s(m(cone) if back else cone, col) + s(band, ROPE if tier == 1 else GOLD, 3))
    if star and not back and tier >= 2:
        o.append(ln(tp('M3 -163 V-155 M-0.5 -161 L6.5 -157 M-0.5 -157 L6.5 -161', 0, dy), '#FFFFFF', 1.8))


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


# ---------------------------------------------------------------- the Risen mage
RM_SKIRT = 'M-12 -70 C-17 -46 -22 -24 -25 -6 ' + A.ragged(-25, 25, -6, 6, 5) + ' C22 -24 17 -46 12 -70 Z'
RM_SLEEVE_ORB = 'M-18 -98 C-25 -91 -28 -84 -29 -78 L-23 -76 L-21 -80 L-17 -77 C-17 -84 -16 -88 -12 -92 Z'
RM_SLEEVE_STAFF = 'M18 -98 C25 -93 28 -88 29 -83 L23 -81 L21 -85 L17 -82 C17 -88 16 -91 12 -92 Z'


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
SM_ROG_VB = (-56, -128, 112, 134)


def pint_face(race, fem=False, goggles=False):
    return H.gnome_head(Z, fem=fem, goggles=goggles) if race == 'gnome' else H.goblin_head(Z, fem=fem)


def pint_back_head(race, fem=False):
    return H.gnome_back(Z, fem=fem) if race == 'gnome' else H.goblin_back(Z, fem=fem)


def pint_skin(race):
    return GSKIN if race == 'gnome' else GBSKIN


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
        rogue_front(True, 'rogue' + suf, tier); rogue_back(True, 'rogue' + suf, tier)
        rogue_front(False, 'rogue_m' + suf, tier); rogue_back(False, 'rogue_m' + suf, tier)
        risen_rogue_front(True, 'risen_rogue' + suf, tier); risen_rogue_back(True, 'risen_rogue' + suf, tier)
        risen_rogue_front(False, 'risen_rogue_m' + suf, tier); risen_rogue_back(False, 'risen_rogue_m' + suf, tier)
        for race in ('gnome', 'goblin'):
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


