# The ranger's gear as layers (art_gear.py), drawn on the human, the ranger's reference body (art_bodies_ranger.py):
# the regular gear in its three looks (Common homespun, Uncommon woodsman's leathers, Rare forest green; Epic test
# gear wears the Rare look) and the dungeons' set pieces and bows. The code calls the ranger's gear the healer's
# (gear.healer.*, candlewake.*, sporebloom.*, gravekeeper.healer, tinker.healer), so these layers are kept as
# <look id>@ranger while the cleric still wears the same ids (art_gear.classes()). The weapon is the bow, in the
# left hand (on the right of the picture), with an arrow in the other; the quiver comes with the chest, on the back,
# its arrows showing over the right shoulder.
import math
import art_gear as G
import art_sprites as A
from art_gear import frag
from art_heroes import s, ln, beam, c, both, m, Z, RAG, RAG_D, ROPE, BOOT, BRONZE, GOLD, STEEL, STEEL_L, WOOD, WOOD_D, BONE
from art_bodies import RG_TORSO, RG_LEG, RG_SLEEVE, RG_BELT

# forest greens: the ranger's own colour, flat and warm
GREEN, GREEN_D, GREEN_L = '#4E7A3A', '#3A5C2C', '#79A85A'
HIDE, HIDE_D = '#A0703F', '#7A5230'
PALE = '#C9A46E'                       # an unworked stave
FLETCH = ('#D8CDB0', '#F6F1E4', '#C8403F')
HAND = (36 * Z, -62 * Z)               # the bow hand, in game units
GLOW = (38 * Z, -94 * Z)               # where a bow glows: its upper limb


def turn(svg, deg, x, y):
    """shapes drawn upright round (0, 0), turned by deg and moved to (x, y), in game units"""
    a = math.radians(deg)
    co, si = math.cos(a), math.sin(a)
    return G.warp(svg, lambda px, py: (x * Z + px * co - py * si, y * Z + px * si + py * co))


def flip(svg):
    """a part mirrored left to right, in game units: from behind, the hands swap sides"""
    return G.warp(svg, lambda x, y: (-x, y))


# ---------------------------------------------------------------- the quiver
def quiver(tier, fletch):
    """a quiver standing upright round its foot (0, 0), in game units: its tube, the lid's rim, and three arrows' flights"""
    body, band = ((RAG_D, ROPE), (HIDE_D, BOOT), (GREEN_D, GOLD))[tier]
    o = ''
    for x, h in ((-3.2, 50), (0.4, 54), (3.6, 49)):
        o += A.beam(f'M{x} -40 L{x} -{h - 4}', WOOD, 1.8, 2.4)
        o += A.s(f'M{x} -{h + 6} C{x - 3.4} -{h + 2} {x - 3.4} -{h - 4} {x - 2.4} -{h - 7} L{x} -{h - 5} '
                 f'L{x + 2.4} -{h - 7} C{x + 3.4} -{h - 4} {x + 3.4} -{h + 2} {x} -{h + 6} Z', fletch, 2.2)
    o += A.s('M-5.6 0 L5.6 0 L6.4 -40 L-6.4 -40 Z', body, 3)
    o += A.s('M-7.2 -43 L7.2 -43 L7.2 -37.4 L-7.2 -37.4 Z', band, 2.6)
    if tier:
        o += A.s('M-6 -16 L6 -16 L6.1 -12 L-6.1 -12 Z', band, 2.2)
    return o


def strap(back=False):
    """the quiver's strap, from the right shoulder down across to the other hip"""
    d = 'M-13 -100 L15 -70' if not back else 'M13 -100 L-15 -70'
    return beam(d, BOOT, 3.6, 3)


# ---------------------------------------------------------------- the regular ladder
TUNICS = (RAG, GREEN, GREEN)
JERKINS = (None, WOOD, GREEN_D)
LEGS = (RAG_D, '#5A4632', GREEN_D)
SLEEVES = (RAG_D, GREEN_D, GREEN)


def sleeves(col, cuff=None, back=False):
    """both sleeves: the bow hand's is on the right seen from the front, on the left from behind; a bracer on the bow
    arm from Uncommon"""
    left, right = s(RG_SLEEVE, col), s(m(RG_SLEEVE), col)
    out = [frag('arms', 'arm2', right if back else left), frag('arms', 'arm', left if back else right)]
    if cuff:
        bracer = 'M28 -76 L36 -73 L33 -64 L26 -67 Z'
        out.append(frag('arms', 'arm', s(m(bracer) if back else bracer, cuff, 3)))
    return out


def chest(tier):
    tunic, leg, sleeve = TUNICS[tier], LEGS[tier], SLEEVES[tier]
    belt = s(RG_BELT, ROPE if tier == 0 else BOOT, 3.2)
    buckle = c(0, -66, 3.4, (BRONZE, BRONZE, GOLD)[tier], 2.2)
    torso_f = [s(RG_TORSO, tunic)]
    if JERKINS[tier]:
        torso_f.append(s('M-14 -100 C-17 -88 -16 -76 -13 -68 H13 C16 -76 17 -88 14 -100 L6 -100 L0 -86 L-6 -100 Z', JERKINS[tier], 3.2))
        if tier == 2:
            torso_f.append(ln('M-6 -98 L0 -86 L6 -98', GOLD, 2.4))
    else:
        torso_f.append(s('M-4 -100 L0 -92 L4 -100 Z', RAG_D, 2.4))
    q = quiver(tier, FLETCH[tier])
    legs = frag('legs', 'spine', both(RG_LEG, leg))
    F = [frag('cape', 'sh', turn(q, -24, 2, -66)), legs, frag('torso', 'spine', *torso_f, belt, buckle, strap())]
    B = [legs, frag('torso', 'spine', s(RG_TORSO, JERKINS[tier] or tunic), belt, strap(back=True)), frag('cape', 'sh', turn(q, 22, -6, -66))]
    cuff = (None, BOOT, '#2E4224')[tier]
    return {'slot': 'chest', 'f': F + sleeves(sleeve, cuff), 'b': B + sleeves(sleeve, cuff, back=True)}


def shoulders(tier):
    """a hide wrap (Common), leather pads (Uncommon), a capelet cut like leaves (Rare)"""
    if tier == 0:
        o = both('M-11 -102 C-16 -110 -31 -110 -36 -96 L-34 -90 C-26 -94 -18 -96 -11 -95 Z', HIDE_D)
    elif tier == 1:
        o = both('M-11 -104 C-16 -116 -37 -118 -43 -98 L-41 -90 C-31 -95 -20 -97 -11 -96 Z', WOOD) + \
            ln('M-38 -100 C-32 -108 -22 -110 -14 -106 M38 -100 C32 -108 22 -110 14 -106', HIDE, 2.2)
    else:
        leaf = 'M-10 -106 C-20 -110 -38 -108 -44 -94 L-41 -86 L-37 -91 L-33 -84 L-28 -90 L-23 -84 L-18 -90 L-13 -86 L-10 -92 Z'
        o = both(leaf, GREEN_D) + c(0, -100, 3.6, GOLD, 2.4)
    part = frag('shoulders', 'sh', o)
    return {'slot': 'shoulders', 'f': [part], 'b': [part]}


# a snug hood whose point flops over to one side
HOOD = 'M-17 -121 C-19 -139 -12 -150 0 -151 C9 -151 14 -147 17 -142 L27 -137 L18 -133 C18 -129 18 -125 17 -121 C11 -134 -11 -134 -17 -121 Z'
HOOD_BACK = 'M-17 -116 C-20 -138 -12 -150 0 -151 C9 -151 14 -147 17 -142 L27 -137 L19 -132 C20 -126 19 -121 17 -116 L9 -101 L0 -96 L-9 -101 Z'
BAND = 'M-16 -131 C-6 -134 6 -134 16 -131 L16 -125 C6 -128 -6 -128 -16 -125 Z'


def helm(tier):
    """a headband with its tails (Common), a green hood (Uncommon), a hood with a gold leaf at the brow (Rare)"""
    if tier == 0:
        tails = 'M15 -130 L24 -122 L21 -119 L14 -126 Z M15 -128 L20 -116 L17 -115 L13 -125 Z'
        f = frag('helm', 'head', s(tails, RAG_D, 2.4), s(BAND, RAG_D, 2.8))
        b = frag('helm', 'head', s(m(tails), RAG_D, 2.4), s(BAND, RAG_D, 2.8))
        return {'slot': 'helm', 'f': [f], 'b': [b]}
    hood = GREEN if tier == 1 else GREEN_D
    leaf = s('M0 -136 C-4 -132 -4 -127 0 -124 C4 -127 4 -132 0 -136 Z', GOLD, 2.2) if tier == 2 else ''
    f = frag('helm', 'head', s(HOOD, hood, 3.4), leaf)
    return {'slot': 'helm', 'f': [f], 'b': [frag('helm', 'head', s(HOOD_BACK, hood, 3.4))]}


# ---------------------------------------------------------------- bows and arrows
def bow(tier):
    """a bent stave and twine (Common), a recurve bow (Uncommon), a longbow of dark yew with horn tips (Rare), held at
    its grip in the bow hand (36, -62)"""
    if tier == 0:
        arc, string, col, w = 'M30 -120 Q44 -62 30 -4', 'M30 -120 L30 -4', PALE, 4.6
    elif tier == 1:
        arc = 'M39 -126 C34 -122 34 -118 35 -114 C43 -100 44 -80 37 -62 C44 -44 43 -24 35 -10 C34 -6 34 -2 39 2'
        string, col, w = 'M35 -114 L35 -10', WOOD, 5
    else:
        arc, string, col, w = 'M28 -130 Q44 -66 28 -2', 'M28 -130 L28 -2', WOOD_D, 5.4
    o = ln(string, '#F6F1E4', 1.6) + beam(arc, col, w, 3.6)
    grip = (ROPE, BOOT, GREEN)[tier]
    o += s('M33.5 -72 L39 -72 L39 -54 L33.5 -54 Z', grip, 2.6)
    if tier == 2:
        o += c(28, -130, 3, BONE, 2.2) + c(28, -2, 3, BONE, 2.2) + ln('M33.5 -74 H39 M33.5 -52 H39', GOLD, 2.4)
    return o


def arrow(tier):
    """an arrow held point down in the other hand (-36, -62)"""
    head = (BRONZE, STEEL, STEEL_L)[tier]
    o = beam('M-42 -18 L-33 -84', WOOD if tier else PALE, 2.2, 2.6)
    o += s('M-44.8 -24 L-42.6 -9 L-39.2 -23 Z', head, 2.4)
    vane = FLETCH[tier]
    o += s('M-33.6 -81 L-38 -87 L-36.4 -95 L-32.8 -87 Z', vane, 2) + s('M-32.8 -80 L-28.2 -86 L-29.2 -94 L-32.2 -87 Z', vane, 2)
    return o


def weapon(tier):
    b, a = bow(tier), arrow(tier)
    return {'slot': 'weapon', 'f': [frag('weapon', 'main', b), frag('weapon', 'off', a)],
            'b': [frag('weapon', 'main', flip(b)), frag('weapon', 'off', flip(a))], 'glow': GLOW}


def layers():
    """every ranger layer, by look id: the regular ladder (gear.healer.<slot>.<rarity>) and the uniques"""
    out = {}
    for tier in (0, 1, 2):
        out[f'gear.healer.chest.{tier}'] = chest(tier)
        out[f'gear.healer.shoulders.{tier}'] = shoulders(tier)
        out[f'gear.healer.helm.{tier}'] = helm(tier)
        out[f'gear.healer.weapon.{tier}'] = weapon(tier)
    import art_gear_ranger_sets as sets  # its sets and bows, drawn from their stands (it uses the helpers here)
    out.update(sets.candlewake())
    out.update(sets.sporebloom())
    return out


# the ranger's contact sheet (art_gear.py writes it): every body in these outfits, front and back
SHEET = {
    'common': ('gear.healer.chest.0', 'gear.healer.shoulders.0', 'gear.healer.helm.0', 'gear.healer.weapon.0'),
    'uncommon': ('gear.healer.chest.1', 'gear.healer.shoulders.1', 'gear.healer.helm.1', 'gear.healer.weapon.1'),
    'rare': ('gear.healer.chest.2', 'gear.healer.shoulders.2', 'gear.healer.helm.2', 'gear.healer.weapon.2'),
    'mixed': ('gear.healer.chest.1', 'candlewake.shoulders', 'gear.healer.helm.0', 'gear.healer.weapon.2'),
    'candlewake': ('candlewake.chest', 'candlewake.shoulders', 'candlewake.helm', 'gravekeeper.healer'),
    'sporebloom': ('sporebloom.chest', 'sporebloom.shoulders', 'sporebloom.helm', 'tinker.healer'),
}
