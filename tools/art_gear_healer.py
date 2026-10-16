# The cleric's gear as layers (art_gear.py), drawn on the human, the cleric's reference body: the regular gear in
# its three looks (Common rags, Uncommon pilgrim's white, Rare white and gold; Epic test gear wears the Rare look)
# and the dungeons' set pieces and boss weapons, drawn from their stands in the log's wardrobe (art_wardrobe.py,
# art_wardrobe_tb.py) with the sleeves and backs the stands don't have. The hood (Common and Uncommon) is worn
# down, round the neck and down the back, so the face and hair stay seen; the Rare helm is the circlet (a man's
# is a crown of sun rays).
import art_gear as G
import art_sprites as A
import art_wardrobe as W
import art_wardrobe_tb as TB
from art_gear import frag
from art_heads import tp, HSKIN, HBLUE
from art_heroes import s, ln, beam, c, both, m, sun, cleric_mantles, Z, \
    GOLD, WOOD, WOOD_D, RAG, RAG_D, ROPE, C_SKIRT, C_HEM, C_BODICE, C_SLEEVE_STAFF, C_CUFF_STAFF, C_SLEEVE_HEAL, C_CUFF_HEAL, ROBE

GLOW = (-29.6, -128)
PILGRIM = '#EAE2D0'
HAND = (-37 * Z, -48 * Z)


def sleeves(robe, trim, back=False):
    """the staff arm's sleeve and cuff, and the healing arm's"""
    mm = m if back else (lambda d: d)
    return [frag('arms', 'arm', s(mm(C_SLEEVE_STAFF), robe), s(mm(C_CUFF_STAFF), trim, 3)),
            frag('arms', 'arm2', s(mm(C_SLEEVE_HEAL), robe), s(mm(C_CUFF_HEAL), trim, 3))]


# ---------------------------------------------------------------- the regular ladder
def chest(tier):
    robe, trim = (RAG, PILGRIM, ROBE)[tier], (RAG_D, HBLUE, GOLD)[tier]
    belt = s('M-18 -72 H18 V-62 H-18 Z', (ROPE, WOOD_D, GOLD)[tier], 3.5) + (c(0, -67, 3.4, HBLUE, 2.4) if tier == 2 else '')
    skirt = s(C_SKIRT, robe)
    if tier == 0:
        skirt += s('M-22 -36 L-10 -34 L-12 -20 L-24 -22 Z', RAG_D, 2.4)
    else:
        skirt += s('M-7 -64 L-11 -5 H11 L7 -64 Z', HBLUE, 3) + (ln('M-9 -60 L-12 -6 M9 -60 L12 -6', GOLD, 2.2) if tier == 2 else '')
    F = [frag('legs', 'spine', skirt, s(C_HEM, trim, 3.5)), frag('torso', 'spine', s(C_BODICE, robe), belt)] + sleeves(robe, trim)
    collar = RAG_D if tier == 0 else HBLUE
    man = [frag('trim', 'spine', s('M-12 -98 L-9 -72 H9 L12 -98 Z', collar, 2.8), ln('M0 -94 V-76 M-6.5 -86 H6.5', ROPE if tier == 1 else GOLD, 3.2) if tier else '')]
    woman = [frag('trim', 'spine', s('M-8 -98 L0 -84 L8 -98 Z', collar, 2.8), c(0, -83, 3.5, GOLD, 2.2) if tier == 2 else '')]
    B = [frag('legs', 'spine', s(C_SKIRT, robe), s(C_HEM, trim, 3.5), sun(0, -36, 7.5, spin=0) if tier == 2 else ''),
         frag('torso', 'spine', s(C_BODICE, robe), belt)] + sleeves(robe, trim, back=True)
    return {'slot': 'chest', 'f': F + man, 'b': B, 'fw': F + woman}


def shoulders(tier):
    f, b = [], []
    cleric_mantles(f, front=True, tier=tier)
    cleric_mantles(b, front=False, tier=tier)
    return {'slot': 'shoulders', 'f': [frag('shoulders', 'sh', *f)], 'b': [frag('shoulders', 'sh', *b)]}


# the hood worn down: a cowl round the neck under the chin, and from behind, the hood hanging down the back
COWL = 'M-19 -101 C-18 -92 -10 -87 0 -87 C10 -87 18 -92 19 -101 C14 -102 10 -101 6 -98 C3 -96 -3 -96 -6 -98 C-10 -101 -14 -102 -19 -101 Z'
HOOD_BACK = 'M-17 -104 C-19 -90 -13 -78 0 -72 C13 -78 19 -90 17 -104 C9 -100 -9 -100 -17 -104 Z'


def helm(tier):
    if tier < 2:
        cloth, line = (RAG_D, PILGRIM)[tier], (RAG, HBLUE)[tier]
        f = frag('hair', 'head', s(COWL, cloth, 3.2), ln('M-12 -95 C-6 -92 6 -92 12 -95', line, 2.4))
        b = frag('hair', 'head', s(HOOD_BACK, cloth, 3.4), ln('M0 -99 L0 -76', line, 2.4), ln('M-14 -99 C-6 -96 6 -96 14 -99', line, 2.4))
        return {'slot': 'helm', 'f': [f], 'b': [b]}
    # the circlet: a gold band and a blue stone; a man's has the sun's rays rising behind his head
    at = lambda d: tp(d, 0, -116)
    woman_f = frag('helm', 'head', ln(at('M-12.5 -8 C-6 -11 6 -11 12.5 -8'), GOLD, 3), c(0, -126.5, 2.6, HBLUE, 1.8))
    woman_b = frag('helm', 'head', ln(at('M-12.8 -6 C-6 -3 6 -3 12.8 -6'), GOLD, 3))
    rays = frag('hood', 'head', s(at('M-12 -11 L-13.5 -23 L-5.5 -16.5 L0 -26.5 L5.5 -16.5 L13.5 -23 L12 -11 Z'), GOLD, 2.8))
    man_f = frag('helm', 'head', s(at('M-13 -7.5 L-6 -10.2 L0 -13.5 L6 -10.2 L13 -7.5 L12.5 -5.2 C6 -8 -6 -8 -12.5 -5.2 Z'), GOLD, 2.4), c(0, -125.2, 2.7, HBLUE, 1.8))
    man_b = frag('helm', 'head', ln(at('M-12.8 -6 C-6 -3 6 -3 12.8 -6'), GOLD, 3))
    return {'slot': 'helm', 'f': [rays, man_f], 'b': [rays, man_b], 'fw': [woman_f], 'bw': [woman_b]}


def weapon(tier):
    """a forked branch with an ember (Common), a staff topped with a gold orb (Uncommon), the sun staff (Rare)"""
    def one(x):
        return [frag('weapon', 'main', beam(f'M{x} 2 L{x} -142' if tier == 0 else f'M{x} 2 L{x} -150', WOOD_D if tier == 0 else WOOD, 5.5), sun(x, -160, tier=tier))]
    return {'slot': 'weapon', 'f': one(-37), 'b': one(37), 'glow': GLOW}


# ---------------------------------------------------------------- dungeon sets, from their stands
# where a stand's pieces go on the human cleric, in game units: a crown on the brow, a mantle over the shoulders,
# a robe from the shoulders to the floor
ON_BROW = dict(k=0.48, ty=-4)
ON_MANTLE = dict(k=0.46, ty=-7)


def robe_on(top):
    """a stand's robe from its top (`top`, the stand's y) to the hero's floor: half as wide, squashed to fit"""
    ky = 76 / (top * -1 - 60) if top != -60 else 1
    return dict(k=0.5, ky=ky, ty=-78.4 - top * ky)


def candlewake():
    st = W.candlewake()
    crown_sil, crown_det = st['helm']
    helm_f = frag('helm', 'head', G.from_stand(crown_sil + crown_det, **ON_BROW))
    helm_b = frag('helm', 'head', G.from_stand(crown_sil + crown_det[:-2], **ON_BROW))
    sh_sil, sh_det = st['shoulders']
    sh_f = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det, **ON_MANTLE))
    sh_b = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det[:5], **ON_MANTLE))
    on = robe_on(-178)
    robe_sil, robe_det = st['chest']
    back = [A.ln('M0 -176 L0 -64', W.CLOTH_L, 3), A.ln('M-30 -112 C-10 -105 10 -105 30 -112', GOLD, 4)]
    # one shape from the shoulders to the floor: drawn with the torso, over the shift
    F = [frag('torso', 'spine', G.from_stand(robe_sil + robe_det, **on))] + sleeves(W.CLOTH, GOLD)
    B = [frag('torso', 'spine', G.from_stand(robe_sil + back, **on))] + sleeves(W.CLOTH, GOLD, back=True)
    wf, wb = G.held(st['weapon'], {0: WOOD}, (68, -80), HAND, 0.55)
    return {
        'candlewake.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'candlewake.shoulders': {'slot': 'shoulders', 'f': [sh_f], 'b': [sh_b]},
        'candlewake.chest': {'slot': 'chest', 'f': F, 'b': B},
        'gravekeeper.healer': {'slot': 'weapon', 'f': [frag('weapon', 'main', wf)], 'b': [frag('weapon', 'main', wb)], 'glow': (-42.8, -98.9)},
    }


# a toadstool cap, its gills at the brow; the root mantle over the shoulders
ON_CAP = dict(k=0.36, ty=-26.5)
ON_ROOTS = dict(k=0.43, ty=-10.55)


def sporebloom():
    st = TB.sporebloom()
    cap_sil, cap_det = st['helm']
    helm_f = frag('helm', 'head', G.from_stand(cap_sil + cap_det, **ON_CAP))
    helm_b = frag('helm', 'head', G.from_stand(cap_sil + cap_det[1:-1], **ON_CAP))
    sh_sil, sh_det = st['shoulders']
    sh = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det, **ON_ROOTS))
    on = robe_on(-186)
    robe_sil, robe_det = st['chest']
    F = [frag('torso', 'spine', G.from_stand(robe_sil + robe_det, **on))] + sleeves(TB.MOSS, TB.AMBER)
    B = [frag('torso', 'spine', G.from_stand(robe_sil[:1] + robe_det[1:2] + robe_det[-2:-1], **on))] + sleeves(TB.MOSS, TB.AMBER, back=True)
    wf, wb = G.held(st['weapon'], {0: WOOD, 1: TB.BRASS}, (67, -80), HAND, 0.55)
    return {
        'sporebloom.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'sporebloom.shoulders': {'slot': 'shoulders', 'f': [sh], 'b': [sh]},
        'sporebloom.chest': {'slot': 'chest', 'f': F, 'b': B},
        'tinker.healer': {'slot': 'weapon', 'f': [frag('weapon', 'main', wf)], 'b': [frag('weapon', 'main', wb)], 'glow': (-47.8, -94.5)},
    }


def layers():
    """every cleric layer, by look id: the regular ladder (gear.healer.<slot>.<rarity>) and the uniques"""
    out = {}
    for tier in (0, 1, 2):
        out[f'gear.healer.chest.{tier}'] = chest(tier)
        out[f'gear.healer.shoulders.{tier}'] = shoulders(tier)
        out[f'gear.healer.helm.{tier}'] = helm(tier)
        out[f'gear.healer.weapon.{tier}'] = weapon(tier)
    out.update(candlewake())
    out.update(sporebloom())
    return out


# the cleric's contact sheet (art_gear.py writes it): every body in these outfits, front and back
SHEET = {
    'common': ('gear.healer.chest.0', 'gear.healer.shoulders.0', 'gear.healer.helm.0', 'gear.healer.weapon.0'),
    'uncommon': ('gear.healer.chest.1', 'gear.healer.shoulders.1', 'gear.healer.helm.1', 'gear.healer.weapon.1'),
    'rare': ('gear.healer.chest.2', 'gear.healer.shoulders.2', 'gear.healer.helm.2', 'gear.healer.weapon.2'),
    'mixed': ('gear.healer.chest.1', 'candlewake.shoulders', 'gear.healer.helm.0', 'gear.healer.weapon.2'),
    'candlewake': ('candlewake.chest', 'candlewake.shoulders', 'candlewake.helm', 'gravekeeper.healer'),
    'sporebloom': ('sporebloom.chest', 'sporebloom.shoulders', 'sporebloom.helm', 'tinker.healer'),
}
