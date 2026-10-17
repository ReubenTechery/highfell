# The heroes' bodies: a race, a sex and a class's stance, in plain underclothes, front and back, round the
# ground point. Gear goes on as layers (art_gear.py); each body has its fit, where its class's reference
# landmarks fall on it, so every layer sits right on it. A body is never seen bare in the game (every slot
# always holds something), but it reads as a hero in underclothes on its own.
# Drawn at 1.25 times game size and shrunk by Z as they're drawn, like the old whole heroes (art_heroes.py).
import art_gear as G
import art_heads as H
from art_heroes import Z, s, ln, c, both, head, halo, m, beam, bone_limb, bone_hand, ribcage, pint_face, pint_back_head, pint_skin, \
    BOOT, BRONZE, BONE, GOLD, RHAIR, RHAIR_D, WOOD_D, GRN, GRN_L, FROST, FROST_L, MRAG_D, C_SKIRT, C_BODICE, C_SLEEVE_STAFF, C_SLEEVE_HEAL, \
    RC_SKIRT, E_SKIRT, E_BODICE, E_SLEEVE_ORB, E_SLEEVE_STAFF, RM_SKIRT, RM_SLEEVE_ORB, RM_SLEEVE_STAFF
from art_heads import BEARD, BEARD_D

LINEN, LINEN_D = '#D8C8A4', '#B09C78'

# ---------------------------------------------------------------- the warrior's stance (the dwarf is its reference)
D_TORSO = 'M-27 -82 C-31 -66 -30 -50 -25 -38 H25 C30 -50 31 -66 27 -82 Z'
D_ARM_AXE = 'M-30 -70 C-40 -64 -45 -56 -46 -50 L-37 -48 C-36 -54 -33 -60 -26 -64 Z'
D_ARM_SHIELD = 'M30 -70 C40 -66 45 -60 46 -54 L38 -51 C37 -57 34 -62 26 -64 Z'
D_BOOT = 'M-25 -15 H-5 V0 H-30 C-32 -6 -30 -12 -25 -15 Z'
D_LEG = 'M-21 -34 H-5 V-15 H-23 Z'
D_HAIR = 'M-16.5 -98 C-17.5 -120 17.5 -120 16.5 -98 Z'
D_HAIR_LINES = 'M-8 -115 C-11 -109 -12 -103 -11 -98 M8 -115 C11 -109 12 -103 11 -98 M0 -117 V-104'
G.ref('warrior', head=(0, -73.2), sh=-65.6, main=(-35.2, -33.6), off=(32, -43.2), arm=(-22.4, -53.6), arm2=(22.4, -53.6))


def dwarf_hair():
    return s(D_HAIR, BEARD, 3.5) + ln(D_HAIR_LINES, BEARD_D, 2.2)


def dwarf_braids(o, sx_list=(-1, 1), x=14, front=True):
    for sx in sx_list:
        bx = x * sx
        if front:
            o.append(c(bx, -81, 5.6, BEARD, 2.8) + c(bx * 1.05, -72, 5.4, BEARD, 2.8) + c(bx, -63, 5.0, BEARD, 2.8))
            o.append(s(f'M{bx - 4.2} -58 H{bx + 4.2} V-53 H{bx - 4.2} Z', BRONZE, 2.4))
            o.append(s(f'M{bx - 3.5} -53 L{bx - 5.5} -44 L{bx} -46 L{bx + 5.5} -44 L{bx + 3.5} -53 Z', BEARD, 2.6))
        else:
            o.append(c(bx, -78, 5, BEARD, 2.8) + c(bx, -69, 4.8, BEARD, 2.8) + c(bx, -60, 4.5, BEARD, 2.8))
            o.append(c(bx, -53, 3.4, BRONZE, 2.2) + c(bx, -47, 4, BEARD, 2.5))


def dwarf_warrior(fem):
    """the dwarf in a linen shirt and breeches, boots on, hands bare: the warrior's reference body"""
    f, b = {}, {}
    f['legs'] = both(D_BOOT, BOOT) + both(D_LEG, LINEN_D)
    f['torso'] = s(D_TORSO, LINEN) + s('M-27 -41 H27 V-35 H-27 Z', LINEN_D, 3)
    if fem:
        f['trim'] = s('M-6 -86 H6 V-76 H-6 Z', H.DSKIN, 2.8) + s('M-9 -82 L0 -71 L9 -82 Z', H.DSKIN, 2.8)
        hair = []
        dwarf_braids(hair)
        f['hair'] = ''.join(hair)
    else:
        f['trim'] = s('M-16 -80 C-22 -64 -15 -50 0 -44 C15 -50 22 -64 16 -80 Z', BEARD) + ln('M-7 -70 C-7 -60 -5 -54 -3 -50 M7 -70 C7 -60 5 -54 3 -50', BEARD_D, 2.5)
    f['arms'] = s(D_ARM_AXE, LINEN) + s(D_ARM_SHIELD, LINEN) + c(40, -54, 7.0, H.DSKIN)
    f['hands'] = c(-44, -42, 8.0, H.DSKIN)
    f['head'] = head(0, -91.5, H.dwarf_face(Z, fem=fem)) + dwarf_hair()

    b['legs'] = f['legs']
    b['torso'] = s(D_TORSO, LINEN) + s('M-27 -41 H27 V-35 H-27 Z', LINEN_D, 3)
    if fem:
        hair = []
        dwarf_braids(hair, x=9, front=False)
        b['trim'] = ''.join(hair)
    else:
        b['trim'] = s('M-5 -84 C-7 -72 -5 -60 0 -52 C5 -60 7 -72 5 -84 Z', BEARD, 3.5) + ln('M-3 -76 L3 -72 M-3 -66 L3 -62', BEARD_D, 2.2) + c(0, -52, 3, BRONZE, 2.2)
    b['arms'] = s(m(D_ARM_SHIELD), LINEN) + s(m(D_ARM_AXE), LINEN)
    b['hands'] = c(44, -42, 8.0, H.DSKIN)
    b['head'] = head(0, -91.5, H.dwarf_back(Z)) + dwarf_hair()
    return {'race': 'dwarf', 'cls': 'warrior', 'fem': fem,
            'f': {'z': f, 'fit': G.identity_fit('warrior', 'f')}, 'b': {'z': b, 'fit': G.identity_fit('warrior', 'b')}}


def pint_warrior(race, fem):
    """a gnome or goblin warrior: the dwarf's stance on a pint-sized body with a big head"""
    skin = pint_skin(race)
    f, b = {}, {}
    f['legs'] = both('M-20 -12 H-4 V0 H-24 C-25 -5 -24 -10 -20 -12 Z', BOOT) + both('M-17 -26 H-4 V-12 H-19 Z', LINEN_D)
    torso = s('M-21 -64 C-24 -52 -23 -38 -19 -28 H19 C23 -38 24 -52 21 -64 Z', LINEN) + s('M-21 -32 H21 V-27 H-21 Z', LINEN_D, 2.8)
    f['torso'] = b['torso'] = torso
    if race == 'goblin':
        f['trim'] = s('M11 -31 C10 -24 18 -24 17 -31 Z', '#8A5A34', 2.4) + c(14, -27, 1.6, GOLD, 0)
    arm, arm2 = 'M-23 -56 C-31 -51 -35 -45 -36 -39 L-28 -37 C-27 -42 -25 -47 -19 -50 Z', 'M23 -56 C31 -52 35 -47 36 -42 L29 -39 C28 -44 25 -48 19 -50 Z'
    f['arms'] = s(arm, LINEN) + s(arm2, LINEN) + c(34, -43, 6, skin, 3.2)
    f['hands'] = c(-36, -34, 6.6, skin)
    f['head'] = head(0, -77, pint_face(race, fem=fem))
    b['legs'] = f['legs']
    b['arms'] = s(m(arm2), LINEN) + s(m(arm), LINEN)
    b['hands'] = c(36, -34, 6.6, skin)
    b['head'] = head(0, -77, pint_back_head(race, fem=fem))
    spine = ([0, 0, 0.8], [-30.4, -22.4, 0.76], [-65.6, -51.2, 0.78])
    fit = lambda view: G.fit('warrior', view, spine, head=[0, -61.6, 1.0], sh=[-49, 0.66], main=[-28.8, -27.2, 0.85],
                             off=[27.2, -34.4, 0.9], arm=[-16.8, -42.4], arm2=[16.8, -42.4])
    return {'race': race, 'cls': 'warrior', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


R_ARM, R_ARM2 = 'M-30 -98 L-38 -78 L-41 -64', 'M30 -98 L36 -84 L38 -74'


def risen_warrior(fem):
    """a Risen warrior: bones in a linen loincloth, tall and narrow, a green light in the skull"""
    f, b = {}, {}
    legs = ''.join(bone_limb(f'M{sx * 7} -58 L{sx * 10} -34 L{sx * 11} -14', 5) for sx in (-1, 1))
    f['legs'] = b['legs'] = legs + both('M-19 -13 H-6 V0 H-23 C-24 -5 -22 -11 -19 -13 Z', BONE)
    pelvis = s('M-12 -66 C-14 -57 -8 -54 0 -55 C8 -54 14 -57 12 -66 Z', BONE, 3.2)
    cloth = s('M-10 -68 L-11 -51 L-5.5 -54 L0 -49 L5.5 -54 L11 -51 L10 -68 Z', LINEN, 3.2) + s('M-16 -72 H16 V-65 H-16 Z', LINEN_D, 3)
    f['torso'] = pelvis + cloth + beam('M0 -76 V-72', BONE, 4.5, 3) + ribcage(0, -106, 27, 32)
    b['torso'] = pelvis + s('M-16 -72 H16 V-65 H-16 Z', LINEN_D, 3) + beam('M0 -76 V-72', BONE, 4.5, 3) + ribcage(0, -106, 27, 32)
    f['arms'] = bone_limb(R_ARM, 4.6) + bone_limb(R_ARM2, 4.6) + bone_hand(38, -74)
    f['hands'] = bone_hand(-41, -62)
    b['arms'] = bone_limb(m(R_ARM2), 4.6) + bone_limb(m(R_ARM), 4.6)
    b['hands'] = bone_hand(41, -62)
    if fem:
        hair = []
        for sx in (-1, 1):
            bx = 14 * sx
            hair.append(c(bx, -110, 5.2, RHAIR, 2.8) + c(bx * 1.05, -101, 5.0, RHAIR, 2.8) + c(bx, -92, 4.6, RHAIR, 2.8))
            hair.append(s(f'M{bx - 4} -87 H{bx + 4} V-82 H{bx - 4} Z', BRONZE, 2.4))
            hair.append(s(f'M{bx - 3.2} -82 L{bx - 5} -73 L{bx} -75 L{bx + 5} -73 L{bx + 3.2} -82 Z', RHAIR, 2.5))
        f['hair'] = ''.join(hair)
        b['trim'] = ''.join(c(bx, -108, 4.8, RHAIR, 2.6) + c(bx, -99, 4.5, RHAIR, 2.6) + c(bx, -90, 4.2, RHAIR, 2.6) + c(bx, -83, 3.2, BRONZE, 2.2)
                            for bx in (-8.5, 8.5))
    f['head'] = head(0, -126, H.risen_head(Z, fem=fem))
    b['head'] = head(0, -126, H.risen_back(Z))
    spine = ([0, 0, 0.72], [-30.4, -55.6, 0.62], [-65.6, -84.8, 0.62])
    fit = lambda view: G.fit('warrior', view, spine, head=[0, -100.8, 0.9], sh=[-84.8, 0.85], main=[-32.8, -49.6, 1.0],
                             off=[30.4, -59.2, 0.95], arm=[-24, -78.4], arm2=[24, -78.4])
    return {'race': 'risen', 'cls': 'warrior', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


# ---------------------------------------------------------------- the cleric's stance (the human is its reference)
G.ref('cleric', head=(0, -92.8), sh=-78.4, main=(-29.6, -38.4), off=(26.4, -43.2), arm=(-15.2, -72.8), arm2=(15.2, -72.8))
SPARKLE = 'M0 -8 Q0 -1 7 -1 Q0 -1 0 6 Q0 -1 -7 -1 Q0 -1 0 -8 Z'


def heal_hand(x, y, hand, glow='#F4B942', spark='#FFE08A', r=13, k=1.0):
    """the cleric's healing hand, held up glowing, a little star of light over it"""
    from art_heads import tp
    return halo(x, y, r, glow, 0.38) + hand + s(tp(SPARKLE, x, y - 8 * k, k), spark, 1.8)


def human_cleric(fem):
    """a human in a linen shift and shoes, a hand of light held up: the cleric's reference body"""
    f, b = {}, {}
    shoes = both('M-15 -7 H-3 V0 H-18 C-19 -3 -18 -6 -15 -7 Z', WOOD_D, 3.5)
    f['legs'] = b['legs'] = shoes + s(C_SKIRT, LINEN)
    f['torso'] = b['torso'] = s(C_BODICE, LINEN) + s('M-18 -71 H18 V-64 H-18 Z', LINEN_D, 3)
    f['arms'] = s(C_SLEEVE_STAFF, LINEN) + s(C_SLEEVE_HEAL, LINEN)
    f['off'] = heal_hand(33, -54, c(33, -54, 5.5, H.HSKIN, 3.5))
    f['hands'] = c(-37, -48, 5.5, H.HSKIN, 3.5)
    neck = s('M-5 -103 H5 V-96 H-5 Z', H.HSKIN, 3)
    f['head'] = neck + head(0, -116, H.human_head(Z, bun=fem, circlet=False, fem=fem))
    b['arms'] = s(m(C_SLEEVE_HEAL), LINEN) + s(m(C_SLEEVE_STAFF), LINEN)
    b['off'] = heal_hand(-33, -54, c(-33, -54, 5.5, H.HSKIN, 3.5))
    b['hands'] = c(37, -48, 5.5, H.HSKIN, 3.5)
    b['head'] = neck + head(0, -116, H.human_back(Z, bun=fem, circlet=False))
    return {'race': 'human', 'cls': 'cleric', 'fem': fem, 'f': {'z': f, 'fit': G.identity_fit('cleric', 'f')}, 'b': {'z': b, 'fit': G.identity_fit('cleric', 'b')}}


def pint_cleric(race, fem):
    """a gnome or goblin cleric: the human's stance on a pint-sized body with a big head"""
    skin = pint_skin(race)
    f, b = {}, {}
    shoes = both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', WOOD_D, 3.2)
    f['legs'] = b['legs'] = shoes + s('M-13 -44 C-18 -30 -24 -15 -27 -2 H27 C24 -15 18 -30 13 -44 Z', LINEN)
    f['torso'] = b['torso'] = s('M-14 -66 C-17 -58 -16 -50 -13 -44 H13 C16 -50 17 -58 14 -66 Z', LINEN)
    if race == 'goblin':
        f['trim'] = s('M9 -45 C8 -38 16 -38 15 -45 Z', '#8A5A34', 2.2) + c(12, -41, 1.5, GOLD, 0)
    arm, arm2 = 'M-17 -63 C-26 -57 -31 -48 -33 -38 C-28 -34 -22 -34 -18 -38 C-18 -46 -16 -53 -12 -58 Z', 'M17 -63 C25 -58 30 -50 32 -42 C28 -38 22 -38 18 -41 C17 -48 15 -54 12 -58 Z'
    f['arms'] = s(arm, LINEN) + s(arm2, LINEN)
    f['off'] = heal_hand(26, -35, c(26, -35, 4.8, skin, 3.2), r=11, k=0.86)
    f['hands'] = c(-31, -34, 4.8, skin, 3.2)
    f['head'] = head(0, -79, pint_face(race, fem=fem))
    b['arms'] = s(m(arm2), LINEN) + s(m(arm), LINEN)
    b['off'] = heal_hand(-26, -35, c(-26, -35, 4.8, skin, 3.2), r=11, k=0.86)
    b['hands'] = c(31, -34, 4.8, skin, 3.2)
    b['head'] = head(0, -79, pint_back_head(race, fem=fem))
    spine = ([0, 0, 0.77], [-52.8, -35.2, 0.87], [-78.4, -52.8, 0.82])
    fit = lambda view: G.fit('cleric', view, spine, head=[0, -63.2, 1.25], sh=[-52.8, 0.79], main=[-24.8, -27.2, 0.76],
                             off=[20.8, -28, 0.8], arm=[-12, -48], arm2=[12, -48])
    return {'race': race, 'cls': 'cleric', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


def risen_cleric(fem):
    """a Risen cleric: bones in a ragged linen shift, a green light in the hand and the skull"""
    f, b = {}, {}
    feet = both('M-13 -6 H-3 V0 H-16 C-17 -3 -16 -5 -13 -6 Z', BONE, 3)
    f['legs'] = b['legs'] = feet + s(RC_SKIRT, LINEN)
    f['torso'] = b['torso'] = beam('M0 -80 V-72', BONE, 4.5, 3) + ribcage(0, -110, 26, 30) + s('M-16 -76 H16 V-68 H-16 Z', LINEN_D, 3)
    arm, arm2 = 'M-30 -96 L-34 -78 L-37 -52', 'M28 -96 L31 -80 L33 -62'
    f['arms'] = bone_limb(arm, 4.4) + bone_limb(arm2, 4.4)
    f['off'] = heal_hand(33, -60, bone_hand(33, -60), glow=GRN, spark=GRN_L, r=14)
    f['hands'] = bone_hand(-37, -50)
    b['arms'] = bone_limb(m(arm2), 4.4) + bone_limb(m(arm), 4.4)
    b['off'] = heal_hand(-33, -60, bone_hand(-33, -60), glow=GRN, spark=GRN_L, r=14)
    b['hands'] = bone_hand(37, -50)
    if fem:
        f['hair'] = both('M-10.5 -124 C-16.5 -112 -16.5 -94 -12.5 -82 C-8.5 -86 -8 -102 -9 -118 Z', RHAIR, 2.8)
    f['head'] = head(0, -126, H.risen_head(Z, fem=fem))
    b['head'] = head(0, -126, H.risen_back(Z))
    spine = ([0, 0, 0.71], [-52.8, -57.6, 0.93], [-78.4, -83.2, 0.94])
    fit = lambda view: G.fit('cleric', view, spine, head=[0, -100.8, 1.1], sh=[-80.8, 1.0], main=[-29.6, -40, 1.0],
                             off=[26.4, -48, 1.0], arm=[-13.6, -76.8], arm2=[13.6, -76.8])
    return {'race': 'risen', 'cls': 'cleric', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


# ---------------------------------------------------------------- the mage's stance (the elf is its reference); the staff is in
# the right hand, a frost orb over the left
G.ref('mage', head=(0, -98.4), sh=-81.6, main=(25.6, -57.6), off=(-20.8, -51.2), arm=(12, -76), arm2=(-12, -76))
ELF_CROWN = 'M-13 -133 C-12 -147 12 -147 13 -133 C6 -136 -6 -136 -13 -133 Z'


def frost_orb(x, y, hand, r=12, orb=6):
    return hand + halo(x, y, r, FROST, 0.42) + c(x, y, orb, FROST_L, 3)


def elf_mage(fem):
    """an elf in a linen shift, a frost orb over one hand: the mage's reference body"""
    hair, face = H.elf_head(Z, back_len=46, fem=fem)
    f, b = {}, {}
    if fem:
        f['mane'] = head(0, -123, hair)
    shoes = both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', MRAG_D, 3)
    f['legs'] = b['legs'] = shoes + s(E_SKIRT, LINEN)
    f['torso'] = b['torso'] = s(E_BODICE, LINEN) + s('M-14 -74 H14 V-67 H-14 Z', LINEN_D, 3)
    f['arms'] = s(E_SLEEVE_ORB, LINEN) + s(E_SLEEVE_STAFF, LINEN)
    f['off'] = frost_orb(-27, -76, c(-26, -64, 4.6, H.ESKIN, 3))
    f['hands'] = c(32, -72, 4.6, H.ESKIN, 3)
    if fem:
        f['hair'] = both('M-10.5 -118 C-15.5 -104 -16 -86 -12.5 -76 C-8.5 -80 -8.5 -96 -9 -112 Z', H.EHAIR, 2.8)
    f['head'] = head(0, -123, face) + s(ELF_CROWN, H.EHAIR, 3)
    b['arms'] = s(m(E_SLEEVE_STAFF), LINEN) + s(m(E_SLEEVE_ORB), LINEN)
    # from behind the orb is held up in front of its sleeve: over the arms
    b['hands'] = c(-32, -72, 4.6, H.ESKIN, 3) + frost_orb(27, -76, c(26, -64, 4.6, H.ESKIN, 3))
    b['head'] = head(0, -123, H.elf_back(Z, back_len=46, fem=fem)) + s('M-13 -133 C-12 -147 12 -147 13 -133 Z', H.EHAIR, 3)
    return {'race': 'elf', 'cls': 'mage', 'fem': fem, 'f': {'z': f, 'fit': G.identity_fit('mage', 'f')}, 'b': {'z': b, 'fit': G.identity_fit('mage', 'b')}}


def pint_mage(race, fem):
    """a gnome or goblin mage: the elf's stance on a pint-sized body with a big head"""
    skin = pint_skin(race)
    f, b = {}, {}
    shoes = both('M-10 -5 H-3 V0 H-13 C-14 -3 -13 -5 -10 -5 Z', MRAG_D, 3)
    f['legs'] = b['legs'] = shoes + s('M-11 -45 C-15 -30 -20 -15 -22 -2 H22 C20 -15 15 -30 11 -45 Z', LINEN)
    f['torso'] = b['torso'] = s('M-12 -66 C-15 -58 -14 -50 -11 -45 H11 C14 -50 15 -58 12 -66 Z', LINEN) + s('M-13 -48 H13 V-42 H-13 Z', LINEN_D, 2.8)
    orb, staff = 'M-15 -63 C-22 -57 -26 -50 -27 -42 C-23 -39 -19 -40 -17 -43 C-17 -50 -15 -56 -11 -59 Z', 'M15 -63 C22 -58 26 -52 28 -45 C25 -42 21 -42 18 -45 C17 -52 15 -56 11 -59 Z'
    f['arms'] = s(orb, LINEN) + s(staff, LINEN)
    f['off'] = frost_orb(-23, -50, c(-22, -39, 4.4, skin, 3), r=11, orb=5.5)
    f['hands'] = c(27, -43, 4.4, skin, 3)
    f['head'] = head(0, -79, pint_face(race, fem=fem))
    b['arms'] = s(m(staff), LINEN) + s(m(orb), LINEN)
    b['hands'] = c(-27, -43, 4.4, skin, 3) + frost_orb(23, -50, c(22, -39, 4.4, skin, 3), r=11, orb=5.5)
    b['head'] = head(0, -79, pint_back_head(race, fem=fem))
    spine = ([0, 0, 0.88], [-56, -36, 0.92], [-81.6, -52.8, 0.92])
    fit = lambda view: G.fit('mage', view, spine, head=[0, -61.6, 1.0], sh=[-52.8, 0.87], main=[21.6, -34.4, 0.78, -10.4],
                             off=[-17.6, -31.2, 0.8], arm=[10.4, -48.8], arm2=[-10.4, -48.8])
    return {'race': race, 'cls': 'mage', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


def risen_mage(fem):
    """a Risen mage: bones in a ragged linen shift, long pale hair, a frost orb over a bony hand"""
    hair, _ = H.elf_head(Z, back_len=50, hair=RHAIR, hairD=RHAIR_D, fem=fem)
    f, b = {}, {}
    if fem:
        f['mane'] = head(0, -126, hair)
    feet = both('M-11 -6 H-3 V0 H-14 C-15 -3 -14 -5 -11 -6 Z', BONE, 3)
    f['legs'] = b['legs'] = feet + s(RM_SKIRT, LINEN)
    f['torso'] = b['torso'] = s(E_BODICE, LINEN) + s('M-14 -74 H14 V-67 H-14 Z', LINEN_D, 3)
    f['arms'] = bone_limb('M-24 -80 L-27 -66', 4.2) + s(RM_SLEEVE_ORB, LINEN) + bone_limb('M24 -84 L31 -74', 4.2) + s(RM_SLEEVE_STAFF, LINEN)
    f['off'] = frost_orb(-27, -76, bone_hand(-27, -63, 4.8))
    f['hands'] = bone_hand(32, -72, 4.8)
    if fem:
        f['hair'] = both('M-11 -124 C-16.5 -110 -16.5 -94 -12.5 -82 C-8.5 -86 -8.5 -102 -9.5 -118 Z', RHAIR, 2.8)
    f['head'] = head(0, -126, H.risen_head(Z, fem=fem))
    b['arms'] = bone_limb(m('M24 -84 L31 -74'), 4.2) + s(m(RM_SLEEVE_STAFF), LINEN) + bone_limb(m('M-24 -80 L-27 -66'), 4.2) + s(m(RM_SLEEVE_ORB), LINEN)
    b['hands'] = bone_hand(-32, -72, 4.8) + frost_orb(27, -76, bone_hand(27, -63, 4.8))
    b['head'] = head(0, -126, H.elf_back(Z, back_len=50, hair=RHAIR, hairD=RHAIR_D, ears=False, fem=fem))
    spine = ([0, 0, 1.0], [-56, -56, 1.0], [-81.6, -81.6, 1.0])
    fit = lambda view: G.fit('mage', view, spine, head=[0, -100.8, 1.05], sh=[-81.6, 1.0], main=[25.6, -57.6, 1.0],
                             off=[-21.6, -50.4, 1.0], arm=[12, -76], arm2=[-12, -76])
    return {'race': 'risen', 'cls': 'mage', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


# ---------------------------------------------------------------- the rogue's stance (the human is its reference); a dagger in each hand
G.ref('rogue', head=(0, -94.4), sh=-81.6, main=(-28.8, -49.6), off=(28.8, -49.6), arm=(-12.8, -75.2), arm2=(12.8, -75.2))
RG_TORSO = 'M-15 -102 C-18 -88 -17 -76 -14 -66 H14 C17 -76 18 -88 15 -102 Z'
RG_LEG = 'M-13 -66 L-15 -16 H-4 L-3 -66 Z'
RG_SLEEVE = 'M-18 -98 C-27 -90 -33 -78 -36 -64 L-28 -60 C-26 -72 -22 -82 -14 -90 Z'
RG_BELT = 'M-16 -70 H16 V-62 H-16 Z'


def rogue(race, fem):
    """a human (the rogue's reference body) or an elf, standing the same, in a linen shirt and breeches, boots on,
    a hand ready either side"""
    skin = H.HSKIN if race == 'human' else H.ESKIN
    f, b = {}, {}
    f['legs'] = b['legs'] = both('M-14 -16 H-4 V0 H-18 C-19 -5 -17 -12 -14 -16 Z', BOOT) + both(RG_LEG, LINEN_D)
    f['torso'] = b['torso'] = s(RG_TORSO, LINEN) + s(RG_BELT, LINEN_D, 3.2)
    f['arms'] = b['arms'] = both(RG_SLEEVE, LINEN)
    f['hands'] = b['hands'] = c(-36, -62, 5.2, skin, 3.2) + c(36, -62, 5.2, skin, 3.2)
    neck = s('M-5 -106 H5 V-99 H-5 Z', skin, 2.8)
    if race == 'human':
        f['head'] = neck + head(0, -118, H.human_head(Z, bun=fem, circlet=False, fem=fem))
        b['head'] = neck + head(0, -118, H.human_back(Z, bun=fem, circlet=False))
    else:
        hair, face = H.elf_head(Z, back_len=30, fem=fem)
        if fem:
            f['mane'] = head(0, -118, hair)
        f['head'] = neck + head(0, -118, face)
        b['head'] = neck + head(0, -118, H.elf_back(Z, back_len=30, fem=fem))
    return {'race': race, 'cls': 'rogue', 'fem': fem, 'f': {'z': f, 'fit': G.identity_fit('rogue', 'f')}, 'b': {'z': b, 'fit': G.identity_fit('rogue', 'b')}}


def pint_rogue(race, fem):
    """a gnome or goblin rogue: the human's stance on a pint-sized body with a big head (a goblin keeps its coin pouch)"""
    skin = pint_skin(race)
    f, b = {}, {}
    f['legs'] = b['legs'] = both('M-13 -12 H-3.5 V0 H-17 C-18 -4 -16 -9 -13 -12 Z', BOOT) + both('M-12 -42 L-14 -12 H-4 L-3 -42 Z', LINEN_D)
    f['torso'] = b['torso'] = s('M-14 -66 C-17 -56 -16 -48 -13 -42 H13 C16 -48 17 -56 14 -66 Z', LINEN) + s('M-15 -45 H15 V-39 H-15 Z', LINEN_D, 2.8)
    if race == 'goblin':
        f['trim'] = s('M9 -43 C8 -36 16 -36 15 -43 Z', '#8A5A34', 2.2) + c(12, -39, 1.5, GOLD, 0)
    f['arms'] = b['arms'] = both('M-15 -63 C-23 -57 -28 -49 -30 -40 L-23 -37 C-21 -45 -18 -52 -12 -58 Z', LINEN)
    f['hands'] = b['hands'] = c(-30, -40, 4.8, skin, 3.0) + c(30, -40, 4.8, skin, 3.0)
    f['head'] = head(0, -78, pint_face(race, fem=fem))
    b['head'] = head(0, -78, pint_back_head(race, fem=fem))
    spine = ([0, 0, 0.93], [-52.8, -33.6, 0.93], [-81.6, -52.8, 0.93])
    fit = lambda view: G.fit('rogue', view, spine, head=[0, -62.4, 1.1], sh=[-51.6, 0.86], main=[-24, -32, 0.95],
                             off=[24, -32, 0.95], arm=[-10.8, -48.4], arm2=[10.8, -48.4])
    return {'race': race, 'cls': 'rogue', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


def risen_rogue(fem):
    """a Risen rogue: bones in linen breeches, a little taller, a green light in the skull"""
    f, b = {}, {}
    shins = ''.join(bone_limb(f'M{sx * 9.5} -22 L{sx * 10} -6', 4.6) for sx in (-1, 1))
    f['legs'] = b['legs'] = shins + both('M-13 -7 H-4 V0 H-16 C-17 -3 -16 -6 -13 -7 Z', BONE, 3) + both(RG_LEG, LINEN_D)
    f['torso'] = b['torso'] = beam('M0 -76 V-68', BONE, 4.2, 3) + ribcage(0, -104, 24, 28) + s(RG_BELT, LINEN_D, 3.2)
    f['arms'] = b['arms'] = bone_limb('M-26 -96 L-34 -78 L-36 -64', 4.2) + bone_limb('M26 -96 L34 -78 L36 -64', 4.2)
    f['hands'] = b['hands'] = bone_hand(-36, -62, 4.8) + bone_hand(36, -62, 4.8)
    f['head'] = head(0, -124, H.risen_head(Z, fem=fem))
    b['head'] = head(0, -124, H.risen_back(Z))
    spine = ([0, 0, 1.0], [-52.8, -52.8, 1.0], [-81.6, -83.2, 1.0])
    fit = lambda view: G.fit('rogue', view, spine, head=[0, -99.2, 1.05], sh=[-83.2, 1.0], main=[-28.8, -49.6, 1.0],
                             off=[28.8, -49.6, 1.0], arm=[-12.8, -75.2], arm2=[12.8, -75.2])
    return {'race': 'risen', 'cls': 'rogue', 'fem': fem, 'f': {'z': f, 'fit': fit('f')}, 'b': {'z': b, 'fit': fit('b')}}


BODIES = {
    'dwarf.warrior.m': lambda: dwarf_warrior(False),
    'dwarf.warrior.f': lambda: dwarf_warrior(True),
    'gnome.warrior.m': lambda: pint_warrior('gnome', False),
    'gnome.warrior.f': lambda: pint_warrior('gnome', True),
    'goblin.warrior.m': lambda: pint_warrior('goblin', False),
    'goblin.warrior.f': lambda: pint_warrior('goblin', True),
    'risen.warrior.m': lambda: risen_warrior(False),
    'risen.warrior.f': lambda: risen_warrior(True),
    'human.cleric.f': lambda: human_cleric(True),
    'human.cleric.m': lambda: human_cleric(False),
    'gnome.cleric.f': lambda: pint_cleric('gnome', True),
    'gnome.cleric.m': lambda: pint_cleric('gnome', False),
    'goblin.cleric.f': lambda: pint_cleric('goblin', True),
    'goblin.cleric.m': lambda: pint_cleric('goblin', False),
    'risen.cleric.f': lambda: risen_cleric(True),
    'risen.cleric.m': lambda: risen_cleric(False),
    'elf.mage.f': lambda: elf_mage(True),
    'elf.mage.m': lambda: elf_mage(False),
    'gnome.mage.f': lambda: pint_mage('gnome', True),
    'gnome.mage.m': lambda: pint_mage('gnome', False),
    'goblin.mage.f': lambda: pint_mage('goblin', True),
    'goblin.mage.m': lambda: pint_mage('goblin', False),
    'risen.mage.f': lambda: risen_mage(True),
    'risen.mage.m': lambda: risen_mage(False),
    'human.rogue.f': lambda: rogue('human', True),
    'human.rogue.m': lambda: rogue('human', False),
    'elf.rogue.f': lambda: rogue('elf', True),
    'elf.rogue.m': lambda: rogue('elf', False),
    'gnome.rogue.f': lambda: pint_rogue('gnome', True),
    'gnome.rogue.m': lambda: pint_rogue('gnome', False),
    'goblin.rogue.f': lambda: pint_rogue('goblin', True),
    'goblin.rogue.m': lambda: pint_rogue('goblin', False),
    'risen.rogue.f': lambda: risen_rogue(True),
    'risen.rogue.m': lambda: risen_rogue(False),
}
