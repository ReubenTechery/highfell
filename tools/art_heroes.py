# The heroes' shared shapes and pieces, in the locked TV-cartoon style: "Big Shoulders", where the armour is the
# silhouette (big pauldrons and mantles, big hands and weapons) over the faces in art_heads.py. Every hero is drawn
# in layers: a body (art_bodies.py) wearing a layer for each gear slot (art_gear.py and art_gear_<class>.py), built
# into art/heroes.json. This file keeps the helpers they draw with and the shapes, colours and pieces they share.
# The shapes are written at 1.25 times game size (the scale they were designed at). The helpers below shrink
# each one by Z as it is drawn and keep the ink at full weight, so heroes stand as tall as the mobs expect.
import math
import art_sprites as A
from art_sprites import K, LW, f, BONE, BONE_D, GRN, GRN_L, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, BLUE, BLUE_D, WOOD, WOOD_D, \
    FROST, FROST_L
import art_heads as H
from art_heads import tp, GSKIN, GBSKIN, HBLUE

Z = 0.8

# cloth, leather, rags, bronze and iron
BOOT, BLUE_DD = '#4A3428', '#2E4670'
ROBE, IROBE, IROBE_D = '#F6F1E4', '#3D7FC1', '#2F6699'
RIRON, RIRON_D, RIRON_L = '#7A7484', '#5C5768', '#A39DB0'
RCLOTH, RCLOTH_D = '#3A3348', '#2A2434'
RHAIR, RHAIR_D = '#C9D2DC', '#9DA8B6'
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


# ---------------------------------------------------------------- the Risen cleric
RC_SKIRT = 'M-14 -72 C-18 -48 -22 -26 -25 -6 ' + A.ragged(-25, 25, -6, 7, 5) + ' C22 -26 18 -48 14 -72 Z'


# ---------------------------------------------------------------- the Risen mage
RM_SKIRT = 'M-12 -70 C-17 -46 -22 -24 -25 -6 ' + A.ragged(-25, 25, -6, 6, 5) + ' C22 -24 17 -46 12 -70 Z'
RM_SLEEVE_ORB = 'M-18 -98 C-25 -91 -28 -84 -29 -78 L-23 -76 L-21 -80 L-17 -77 C-17 -84 -16 -88 -12 -92 Z'
RM_SLEEVE_STAFF = 'M18 -98 C25 -93 28 -88 29 -83 L23 -81 L21 -85 L17 -82 C17 -88 16 -91 12 -92 Z'


# ---------------------------------------------------------------- the rogue's leathers
RG_LEATHER, RG_LEATHER_D, RG_CLOAK, RG_STEEL = '#4A385C', '#2E223B', '#241B30', '#D7DEE6'
RG_VENOM = '#7CF06A'


# ---------------------------------------------------------------- the pint-sized heroes' heads (gnome & goblin)


def pint_face(race, fem=False, goggles=False):
    return H.gnome_head(Z, fem=fem, goggles=goggles) if race == 'gnome' else H.goblin_head(Z, fem=fem)


def pint_back_head(race, fem=False):
    return H.gnome_back(Z, fem=fem) if race == 'gnome' else H.goblin_back(Z, fem=fem)


def pint_skin(race):
    return GSKIN if race == 'gnome' else GBSKIN


# a gnome in gold: skin, cheeks and hair (A.gild turns the metal)
GNOME_GILD = {GSKIN: GOLD, H.GSKIN_D: GOLD_D, '#FFE4D0': '#FFE9A8', H.GBLUSH: '#E8A33A', H.GHAIR_M: '#FFE08A', H.GHAIR_MD: GOLD_D,
              H.GHAIR_F: '#FFE08A', H.GHAIR_FD: GOLD_D, H.GHAIR_FL: '#FFF3C4'}


