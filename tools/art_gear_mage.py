# The mage's gear as layers (art_gear.py), drawn on the elf, the mage's reference body: the regular gear in its
# three looks (Common rags, Uncommon blue, Rare blue and gold; Epic test gear wears the Rare look) and the
# dungeons' set pieces and boss weapons, drawn from their stands in the log's wardrobe (art_wardrobe.py,
# art_wardrobe_tb.py) with the sleeves and backs the stands don't have. The staff is in the right hand; the frost
# orb over the left hand is the mage's own, not gear. Common's hat is a floppy rag cap: every slot shows.
import art_gear as G
import art_sprites as A
import art_wardrobe as W
import art_wardrobe_tb as TB
from art_gear import frag
from art_sprites import K
from art_heroes import s, ln, c, both, m, hat, frost_staff, Z, GOLD, FROST, FROST_L, ROPE, MRAG, MRAG_D, IROBE, IROBE_D, WOOD_D, \
    E_SKIRT, E_HEM, E_BODICE, E_SLEEVE_ORB, E_SLEEVE_STAFF, SHARDS, SHARD_LINES

GLOW = (28, -121.6)
HAND = (32 * Z, -72 * Z)
ROBES = (MRAG, IROBE_D, IROBE)
DARKS = (MRAG_D, '#22496E', IROBE_D)
# a band at each sleeve's wrist (the sets' sleeves have them)
CUFF_STAFF = 'M33 -76 C30 -72 25 -72 22 -75 L21.5 -80 C24.5 -77.5 29.5 -77.5 32.5 -81 Z'
CUFF_ORB = 'M-31 -70 C-27 -66 -22 -67 -20 -70 L-20 -75 C-23 -72.5 -27 -72.5 -30.7 -75.5 Z'


def sleeves(robe, cuff=None, back=False):
    """the staff arm's sleeve and the orb arm's, with a cuff at each wrist if the robe has one"""
    mm = m if back else (lambda d: d)
    out = [frag('arms', 'arm', s(mm(E_SLEEVE_STAFF), robe)), frag('arms', 'arm2', s(mm(E_SLEEVE_ORB), robe))]
    if cuff:
        out += [frag('arms', 'arm', s(mm(CUFF_STAFF), cuff, 3)), frag('arms', 'arm2', s(mm(CUFF_ORB), cuff, 3))]
    return out


# ---------------------------------------------------------------- the regular ladder
def chest(tier):
    robe, dark = ROBES[tier], DARKS[tier]
    panel = s('M-16 -36 L-6 -34 L-8 -22 L-18 -24 Z', MRAG_D, 2.2) if tier == 0 else s('M-5 -68 L-8 -4 H8 L5 -68 Z', ROPE if tier == 1 else GOLD, 3)
    belt = s('M-14 -74 H14 V-67 H-14 Z', ROPE if tier == 0 else dark, 3)
    buckle = s('M-3.5 -75.5 H3.5 V-65.5 H-3.5 Z', FROST_L, 2.2) if tier == 2 else ''
    F = [frag('legs', 'spine', s(E_SKIRT, robe), panel, s(E_HEM, dark, 3)), frag('torso', 'spine', s(E_BODICE, robe), belt, buckle)] + sleeves(robe)
    man = [frag('trim', 'spine', s('M-13 -101 L0 -77 L13 -101 Z', GOLD if tier == 2 else ROPE, 2.8), s('M-8.5 -101 L0 -84 L8.5 -101 Z', dark, 2.4))]
    woman = [frag('trim', 'spine', s('M-8 -100 L0 -84 L8 -100 Z', dark, 2.6), c(0, -86, 3.2, FROST_L, 2) if tier == 2 else '')]
    B = [frag('legs', 'spine', s(E_SKIRT, robe), s(E_HEM, dark, 3)), frag('torso', 'spine', s(E_BODICE, robe), belt)] + sleeves(robe, back=True)
    return {'slot': 'chest', 'f': F + man, 'b': B, 'fw': F + woman}


def shoulders(tier):
    """a frayed wrap (Common), a blue one (Uncommon), a high collar and frost shards (Rare: white on a woman)"""
    if tier < 2:
        wrap = both(('M-11 -100 C-18 -103 -27 -101 -31 -94 C-24 -93 -17 -94 -11 -96 Z',
                     'M-11 -101 C-19 -106 -30 -103 -34 -94 C-26 -93 -18 -94 -11 -96 Z')[tier], DARKS[tier], (3, 3.2)[tier])
        return {'slot': 'shoulders', 'f': [frag('shoulders', 'sh', wrap)], 'b': [frag('shoulders', 'sh', wrap)]}
    shards = both(SHARDS, FROST, 3.5) + ln(SHARD_LINES + ' ' + m(SHARD_LINES), FROST_L, 2.2)
    front = 'M-15 -100 C-15 -110 -10 -115 -6.5 -108 L0 -104 L6.5 -108 C10 -115 15 -110 15 -100 C8 -97 -8 -97 -15 -100 Z'
    back = 'M-15 -100 C-15 -111 15 -111 15 -100 C8 -97 -8 -97 -15 -100 Z'
    one = lambda d, col: [frag('shoulders', 'sh', s(d, col, 3.5), shards)]
    return {'slot': 'shoulders', 'f': one(front, IROBE_D), 'b': one(back, IROBE_D), 'fw': one(front, '#FFFFFF'), 'bw': one(back, '#FFFFFF')}


# the Common cap: a floppy cone of the robe's rags, its tip slumped over, a patch on it and the moths at it
CAP = 'M-12.5 -141 C-11 -153 -5 -162 4 -165 C11 -167 19 -163 23 -155 C18 -156.5 13 -156 10 -153 C11 -149 12 -145 12.5 -141 Z'
CAP_BAND = 'M-14.5 -135 C-5 -138.5 5 -138.5 14.5 -135 L13.5 -142 C5 -145 -5 -145 -13.5 -142 Z'


def helm(tier):
    if tier == 0:
        f = frag('helm', 'head', s(CAP, MRAG, 3.2), s('M-7 -152 L0 -153.5 L0.5 -146.5 L-6.5 -145.5 Z', MRAG_D, 2.2),
                 c(6, -158, 1.5, K, 0), c(9, -155.5, 1.1, K, 0), s(CAP_BAND, MRAG_D, 3))
        b = frag('helm', 'head', s(m(CAP), MRAG, 3.2), c(-5, -156, 1.4, K, 0), s(CAP_BAND, MRAG_D, 3))
        return {'slot': 'helm', 'f': [f], 'b': [b]}
    f, b = [], []
    hat(f, col=ROBES[tier], tier=tier)
    hat(b, col=ROBES[tier], back=True, tier=tier)
    return {'slot': 'helm', 'f': [frag('helm', 'head', *f)], 'b': [frag('helm', 'head', *b)]}


def weapon(tier):
    """a splintered branch with a frost spark (Common), a staff with a frost orb (Uncommon), the crystal staff (Rare)"""
    def one(x):
        o = []
        frost_staff(o, x, tier=tier)
        return [frag('weapon', 'main', *o)]
    return {'slot': 'weapon', 'f': one(35), 'b': one(-35), 'glow': GLOW}


# ---------------------------------------------------------------- dungeon sets, from their stands
# where a stand's pieces go on the elf, in game units: a crown on the brow, a mantle over the shoulders, a robe
# from the shoulders to the floor (squashed to fit, its fur collar not)
ON_CROWN = dict(k=0.46, ty=-18.8)
ON_MANTLE = dict(k=0.4, ty=-13)
ON_FUR = dict(k=0.4, ty=-8.4)


def robe_on(top, floor):
    """a stand's robe from its top to its lowest hem (each the stand's y) onto the elf, shoulder line to floor"""
    ky = 80 / (floor - top)
    return dict(k=0.38, ky=ky, ty=-81.6 - top * ky)


def rimebone():
    st = W.rimebone()
    cr_sil, cr_det = st['helm']
    helm_f = frag('helm', 'head', G.from_stand(cr_sil + cr_det, **ON_CROWN))
    helm_b = frag('helm', 'head', G.from_stand(cr_sil + cr_det[:4], **ON_CROWN))
    sh_sil, sh_det = st['shoulders']
    sh_f = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det, **ON_MANTLE))
    sh_b = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det[:8], **ON_MANTLE))
    (robe, fur), det = st['chest']
    on = robe_on(-178, -70)
    fur_f = frag('torso', 'spine', G.from_stand([fur, det[0]], **ON_FUR))
    F = [frag('torso', 'spine', G.from_stand([robe] + det[1:], **on)), fur_f] + sleeves(W.BLUE_D, W.FUR)
    B = [frag('torso', 'spine', G.from_stand([robe, det[3], A.ln('M0 -176 L0 -86', '#7D98C8', 3)], **on)), fur_f] + sleeves(W.BLUE_D, W.FUR, back=True)
    wf, wb = G.held(st['weapon'], {0: W.SHAFT}, (70, -100), HAND, 0.59, flip=False)
    return {
        'rimebone.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'rimebone.shoulders': {'slot': 'shoulders', 'f': [sh_f], 'b': [sh_b]},
        'rimebone.chest': {'slot': 'chest', 'f': F, 'b': B},
        'gravekeeper.dps': {'slot': 'weapon', 'f': [frag('weapon', 'main', wf)], 'b': [frag('weapon', 'main', wb)], 'glow': (29.7, -124.9)},
    }


ON_CROWN_TB = dict(k=0.46, ty=-16)
ON_COILS = dict(k=0.38, ty=-14)


def arcspark():
    st = TB.arcspark()
    cr_sil, cr_det = st['helm']
    helm_f = frag('helm', 'head', G.from_stand(cr_sil + cr_det, **ON_CROWN_TB))
    helm_b = frag('helm', 'head', G.from_stand(cr_sil + cr_det[:2] + cr_det[3:5], **ON_CROWN_TB))
    sh_sil, sh_det = st['shoulders']
    sh = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det, **ON_COILS))
    (robe,), det = st['chest']
    on = robe_on(-178, -58)
    F = [frag('torso', 'spine', G.from_stand([robe] + det, **on))] + sleeves(TB.TEAL, TB.COPPER)
    # from behind: the dagged hem's copper and the stars, no collar
    B = [frag('torso', 'spine', G.from_stand([robe, det[0]] + det[3:-1], **on))] + sleeves(TB.TEAL, TB.COPPER, back=True)
    wf, wb = G.held(st['weapon'], {0: WOOD_D, **{i: (TB.COPPER, 2.2, 2) for i in range(1, 8)}, 8: (A.STEEL, 2.6, 2.5), 9: (A.STEEL, 2.6, 2.5)},
                    (69, -100), HAND, 0.59, flip=False)
    return {
        'arcspark.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'arcspark.shoulders': {'slot': 'shoulders', 'f': [sh], 'b': [sh]},
        'arcspark.chest': {'slot': 'chest', 'f': F, 'b': B},
        'tinker.dps': {'slot': 'weapon', 'f': [frag('weapon', 'main', wf)], 'b': [frag('weapon', 'main', wb)], 'glow': (30.9, -135.5)},
    }


def layers():
    """every mage layer, by look id: the regular ladder (gear.dps.<slot>.<rarity>) and the uniques"""
    out = {}
    for tier in (0, 1, 2):
        out[f'gear.dps.chest.{tier}'] = chest(tier)
        out[f'gear.dps.shoulders.{tier}'] = shoulders(tier)
        out[f'gear.dps.helm.{tier}'] = helm(tier)
        out[f'gear.dps.weapon.{tier}'] = weapon(tier)
    out.update(rimebone())
    out.update(arcspark())
    return out


# the mage's contact sheet (art_gear.py writes it): every body in these outfits, front and back
SHEET = {
    'common': ('gear.dps.chest.0', 'gear.dps.shoulders.0', 'gear.dps.helm.0', 'gear.dps.weapon.0'),
    'uncommon': ('gear.dps.chest.1', 'gear.dps.shoulders.1', 'gear.dps.helm.1', 'gear.dps.weapon.1'),
    'rare': ('gear.dps.chest.2', 'gear.dps.shoulders.2', 'gear.dps.helm.2', 'gear.dps.weapon.2'),
    'mixed': ('gear.dps.chest.1', 'rimebone.shoulders', 'gear.dps.helm.0', 'gear.dps.weapon.2'),
    'rimebone': ('rimebone.chest', 'rimebone.shoulders', 'rimebone.helm', 'gravekeeper.dps'),
    'arcspark': ('arcspark.chest', 'arcspark.shoulders', 'arcspark.helm', 'tinker.dps'),
}
