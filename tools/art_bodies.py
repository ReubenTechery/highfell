# The heroes' bodies: a race, a sex and a class's stance, in plain underclothes, front and back, round the
# ground point. Gear goes on as layers (art_gear.py); each body has its fit, where its class's reference
# landmarks fall on it, so every layer sits right on it. A body is never seen bare in the game (every slot
# always holds something), but it reads as a hero in underclothes on its own.
# Drawn at 1.25 times game size and shrunk by Z as they're drawn, like the old whole heroes (art_heroes.py).
import art_gear as G
import art_heads as H
from art_heroes import Z, s, ln, c, both, head, m, beam, bone_limb, bone_hand, ribcage, pint_face, pint_back_head, pint_skin, \
    BOOT, BRONZE, BONE, GOLD, RHAIR
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
    fit = lambda view: G.fit('warrior', view, spine, head=[0, -61.6, 1.0], sh=[-51.2, 0.8], main=[-28.8, -27.2, 0.85],
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


BODIES = {
    'dwarf.warrior.m': lambda: dwarf_warrior(False),
    'dwarf.warrior.f': lambda: dwarf_warrior(True),
    'gnome.warrior.m': lambda: pint_warrior('gnome', False),
    'gnome.warrior.f': lambda: pint_warrior('gnome', True),
    'goblin.warrior.m': lambda: pint_warrior('goblin', False),
    'goblin.warrior.f': lambda: pint_warrior('goblin', True),
    'risen.warrior.m': lambda: risen_warrior(False),
    'risen.warrior.f': lambda: risen_warrior(True),
}
