# The rogue's gear as layers (art_gear.py), drawn on the human, the rogue's reference body: the regular gear in its
# three looks (Common rags, Uncommon brown leather, Rare shadow leather; Epic test gear wears the Rare look) and the
# dungeons' set pieces and boss weapons, drawn from their stands in the log's wardrobe (art_wardrobe.py,
# art_wardrobe_tb.py) with the legs, sleeves and backs the stands don't have. The weapon is the pair of daggers, one
# in each hand; the cloak comes with the chest. Uncommon's helm is a brown leather hood, so every slot shows its
# rarity (the old whole-body Uncommon wore the mask alone).
import math
import art_gear as G
import art_sprites as A
import art_wardrobe as W
import art_wardrobe_tb as TB
from art_gear import frag
from art_heroes import s, ln, c, both, m, Z, RAG, RAG_D, ROPE, BOOT, BRONZE, GOLD, STEEL, WOOD_D, RIRON_D, \
    RG_LEATHER, RG_LEATHER_D, RG_CLOAK, RG_STEEL, RG_VENOM
from art_bodies import RG_TORSO, RG_LEG, RG_SLEEVE, RG_BELT

VESTS = (RAG, '#6B4528', RG_LEATHER)
DARKS = (RAG_D, '#3B2818', RG_LEATHER_D)
CLOAK = 'M-18 -102 C-24 -76 -26 -48 -24 -22 L-14 -28 L-6 -20 L0 -28 L6 -20 L14 -28 L24 -22 C26 -48 24 -76 18 -102 Z'
HAND = (-36 * Z, -62 * Z)


def sleeves(col, back=False):
    """both sleeves: the weapon hand's is on the left seen from the front, on the right from behind"""
    left, right = s(RG_SLEEVE, col), s(m(RG_SLEEVE), col)
    return [frag('arms', 'arm', right if back else left), frag('arms', 'arm2', left if back else right)]


def legs(col):
    return frag('legs', 'spine', both(RG_LEG, col))


def pair(main, off):
    """a dagger in each hand (from behind, the weapon hand is on the right)"""
    return {'slot': 'weapon', 'f': [frag('weapon', 'main', main), frag('weapon', 'off', off)],
            'b': [frag('weapon', 'main', off), frag('weapon', 'off', main)], 'glow': HAND}


# ---------------------------------------------------------------- the regular ladder
def chest(tier):
    vest, dark = VESTS[tier], DARKS[tier]
    belt = s(RG_BELT, ROPE if tier == 0 else BOOT, 3.2)
    F = [legs(dark), frag('torso', 'spine', s(RG_TORSO, vest), ln('M-12 -96 L12 -70 M12 -96 L-12 -70', ROPE if tier == 0 else '#8C6239', 3.2),
                          belt, c(0, -66, 3.4, GOLD if tier == 2 else BRONZE, 2.2))] + sleeves(dark)
    B = [legs(dark), frag('torso', 'spine', s(RG_TORSO, vest), belt)] + sleeves(dark, back=True)
    if tier:
        cloak = frag('cape', 'spine', s(CLOAK, RG_CLOAK))
        F, B = [cloak] + F, B + [cloak]
    return {'slot': 'chest', 'f': F, 'b': B}


def shoulders(tier):
    """a rag wrap (Common), leather pads (Uncommon), shadow leather with a steel spike and a drop of venom (Rare)"""
    if tier == 0:
        o = both('M-11 -102 C-16 -110 -31 -110 -36 -96 L-34 -90 C-26 -94 -18 -96 -11 -95 Z', RAG_D)
    else:
        o = both('M-11 -104 C-16 -116 -37 -118 -43 -98 L-41 -90 C-31 -95 -20 -97 -11 -96 Z', VESTS[tier]) \
            + both('M-41 -90 C-31 -95 -20 -97 -11 -96 L-11 -91 C-21 -92 -31 -90 -40 -84 Z', DARKS[1] if tier == 1 else RG_CLOAK, 3)
        if tier == 2:
            o += both('M-28 -111 L-35 -126 L-21 -112 Z', RG_STEEL, 2.8) + c(-26, -102, 2.6, RG_VENOM, 1.8) + c(26, -102, 2.6, RG_VENOM, 1.8)
    return {'slot': 'shoulders', 'f': [frag('shoulders', 'sh', o)], 'b': [frag('shoulders', 'sh', o)]}


MASKS = ('M-11 -115 H11 L9 -105 C3 -102 -3 -102 -9 -105 Z', 'M-12 -116 H12 L10 -104 C4 -100 -4 -100 -10 -104 Z')
HOOD = 'M-16 -122 C-18 -142 -10 -154 0 -156 C10 -154 18 -142 16 -122 C11 -134 -11 -134 -16 -122 Z'
HOOD_BACK = 'M-16 -116 C-19 -140 -10 -154 0 -156 C10 -154 19 -140 16 -116 L8 -102 L0 -96 L-8 -102 Z'
# the Common mask from behind: its band round the head, knotted, the ends hanging
TIE = 'M-13 -111 C-5 -109 5 -109 13 -111 L12.5 -105.5 C5 -103.5 -5 -103.5 -12.5 -105.5 Z'
TAILS = 'M-1 -106 L-6 -95 L-2 -95.5 L0.5 -104 Z M1 -106 L6 -96 L2.5 -95 L-0.5 -104 Z'


def helm(tier):
    """a rag over the face (Common), a brown leather hood and the rag (Uncommon), the shadow hood and a black mask (Rare)"""
    if tier == 0:
        f = frag('helm', 'head', s(MASKS[0], RAG_D, 2.8))
        b = frag('helm', 'head', s(TIE, RAG_D, 2.6), s(TAILS, RAG_D, 2.4), c(0, -108, 3, RAG_D, 2.4))
        return {'slot': 'helm', 'f': [f], 'b': [b]}
    hood = '#4E3624' if tier == 1 else RG_CLOAK
    f = frag('helm', 'head', s(MASKS[1], RAG_D if tier == 1 else '#1E1826', 3), ln('M-8 -111 H8', RG_LEATHER, 2) if tier == 2 else '',
             s(HOOD, hood, 3.4), c(0, -138, 2.6, RG_VENOM, 1.8) if tier == 2 else '')
    return {'slot': 'helm', 'f': [f], 'b': [frag('helm', 'head', s(HOOD_BACK, hood, 3.4))]}


def dagger(hx, y, sx, tier):
    """one of the pair, held at (hx, y), its blade leaning out to the side sx: a bronze shiv (Common), an iron dagger
    (Uncommon), a venom-tipped stiletto (Rare)"""
    col, guard = (BRONZE, STEEL, RG_STEEL)[tier], (WOOD_D, RIRON_D, GOLD)[tier]
    o = c(hx - sx * 2, y + 6, 3.2, guard, 2.4) + s(f'M{hx - 8} {y - 3} H{hx + 8} V{y + 2} H{hx - 8} Z', guard, 2.8)
    if tier == 0:
        return o + s(f'M{hx - 4} {y - 3} L{hx + sx * 10} {y - 34} L{hx + 4} {y - 3} Z', col, 3.2)
    if tier == 1:
        return o + s(f'M{hx - 4.5} {y - 3} L{hx + sx * 14} {y - 44} L{hx + 4.5} {y - 3} Z', col, 3.3)
    return o + s(f'M{hx - 5} {y - 3} C{hx - 2} {y - 24} {hx + sx * 6} {y - 40} {hx + sx * 16} {y - 52} C{hx + sx * 12} {y - 34} {hx + 6} {y - 18} {hx + 5} {y - 3} Z', col, 3.4) \
        + ln(f'M{hx + sx * 3} {y - 20} L{hx + sx * 13} {y - 46}', RG_VENOM, 2.4)


def weapon(tier):
    return pair(dagger(-36, -62, -1, tier), dagger(36, -62, 1, tier))


# ---------------------------------------------------------------- dungeon sets, from their stands
# where a stand's pieces go on the human rogue, in game units: a hood over the head (narrower than it stands, so it
# hugs the head), spaulders on the shoulders, a jerkin on the chest, a coat to the knee
ON_HOOD = dict(k=0.42, ky=0.55, ty=16.3)
ON_SPAULDERS = dict(k=0.38, ty=-13.2)
ON_JERKIN = dict(k=0.36, ky=0.367, ty=-16.3)
ON_COAT = dict(k=0.38, ky=0.478, ty=4.4)


def in_hand(parts, frame, grip, k, turn, flip=False):
    """a stand's dagger, drawn round its own (0, 0) and put on the stand by frame (x, y, degrees: the wardrobe's
    place()), in the weapon hand: its grip point on the hand, scaled by k, turned by `turn` degrees, mirrored
    first when flip. The other hand's is its mirror image."""
    (fx, fy, fd), (gx, gy), (hx, hy) = frame, grip, HAND
    ca, sa, cb, sb = math.cos(math.radians(fd)), math.sin(math.radians(fd)), math.cos(math.radians(turn)), math.sin(math.radians(turn))

    def fn(x, y):
        dx, dy = x - fx, y - fy
        lx, ly = dx * ca + dy * sa, -dx * sa + dy * ca
        lx, ly = ((gx - lx) if flip else (lx - gx)) * k, (ly - gy) * k
        return hx + lx * cb - ly * sb, hy + lx * sb + ly * cb
    one = G.warp(''.join(parts), fn)
    return pair(one, G.warp(one, lambda x, y: (-x, y)))


def jerkin_straps(fn):
    """Shadeveil's crossed straps and their buckle, at the hero's weight (the stand's would be all ink)"""
    path = lambda d: G.warp_path(d, fn)
    return (A.beam(path('M-28 -172 L24 -108'), A.WOOD, 2.6, 2) + A.beam(path('M28 -172 L-24 -108'), A.WOOD, 2.6, 2),
            A.c(*fn(0, -140), 2.6, GOLD, 2))


def shadeveil():
    st = W.shadeveil()
    hood_sil, hood_det = st['helm']
    helm_f = frag('helm', 'head', G.from_stand(hood_sil + hood_det, **ON_HOOD))
    helm_b = frag('helm', 'head', G.from_stand(hood_sil + hood_det[-1:], **ON_HOOD))
    sh_sil, sh_det = st['shoulders']
    sh = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det, **ON_SPAULDERS))
    (jerkin,), det = st['chest']
    straps, buckle = jerkin_straps(lambda x, y: (x * ON_JERKIN['k'], y * ON_JERKIN['ky'] + ON_JERKIN['ty']))
    F = [legs(W.LEATHER_D), frag('torso', 'spine', G.from_stand([jerkin, det[3], det[4], det[5]], **ON_JERKIN), straps, buckle)] + sleeves(W.LEATHER_D)
    B = [legs(W.LEATHER_D), frag('torso', 'spine', G.from_stand([jerkin, det[3]], **ON_JERKIN), straps)] + sleeves(W.LEATHER_D, back=True)
    sil, wdet = W.cryptfangs()
    # the stand's second dagger is the one drawn first, then mirrored: its own pieces, less the grip's wraps
    weapon = in_hand(sil[4:] + wdet[4:], (66, -6, 18), (0, -20), 0.38, -12, flip=True)
    return {
        'shadeveil.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'shadeveil.shoulders': {'slot': 'shoulders', 'f': [sh], 'b': [sh]},
        'shadeveil.chest': {'slot': 'chest', 'f': F, 'b': B},
        'gravekeeper.rogue': weapon,
    }


def gearshade():
    st = TB.gearshade()
    hood_sil, hood_det = st['helm']
    helm_f = frag('helm', 'head', G.from_stand(hood_sil + hood_det, **ON_HOOD))
    # from behind: the hood, its tip flopped the other way, the lens on its arm and the goggles' strap
    helm_b = frag('helm', 'head', G.from_stand(hood_sil + [hood_det[1], hood_det[-1]], **ON_HOOD, flip=True))
    sh_sil, sh_det = st['shoulders']
    sh = frag('shoulders', 'sh', G.from_stand(sh_sil + sh_det, **ON_SPAULDERS))
    (coat,), det = st['chest']
    # the lapels and the line between them, the two lower pockets, the belt and its buckle (the rest is too small to read)
    F = [legs(TB.PLUM_D), frag('torso', 'spine', G.from_stand([coat] + det[:3] + [det[7], det[9], det[13], det[14], det[-1]], **ON_COAT))] + sleeves(TB.PLUM)
    B = [legs(TB.PLUM_D), frag('torso', 'spine', G.from_stand([coat, det[13], det[-1]], **ON_COAT))] + sleeves(TB.PLUM, back=True)
    sil, wdet = TB.fusecutters()
    # the first dagger on the stand, less the fuse's wraps on its grip: it hangs point down, so it turns over
    weapon = in_hand(sil[:5] + [wdet[0], wdet[2], wdet[3]], (64, -110, 158), (0, -73.5), 0.5, 168)
    return {
        'gearshade.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'gearshade.shoulders': {'slot': 'shoulders', 'f': [sh], 'b': [sh]},
        'gearshade.chest': {'slot': 'chest', 'f': F, 'b': B},
        'tinker.rogue': weapon,
    }


def layers():
    """every rogue layer, by look id: the regular ladder (gear.rogue.<slot>.<rarity>) and the uniques"""
    out = {}
    for tier in (0, 1, 2):
        out[f'gear.rogue.chest.{tier}'] = chest(tier)
        out[f'gear.rogue.shoulders.{tier}'] = shoulders(tier)
        out[f'gear.rogue.helm.{tier}'] = helm(tier)
        out[f'gear.rogue.weapon.{tier}'] = weapon(tier)
    out.update(shadeveil())
    out.update(gearshade())
    return out


# the rogue's contact sheet (art_gear.py writes it): every body in these outfits, front and back
SHEET = {
    'common': ('gear.rogue.chest.0', 'gear.rogue.shoulders.0', 'gear.rogue.helm.0', 'gear.rogue.weapon.0'),
    'uncommon': ('gear.rogue.chest.1', 'gear.rogue.shoulders.1', 'gear.rogue.helm.1', 'gear.rogue.weapon.1'),
    'rare': ('gear.rogue.chest.2', 'gear.rogue.shoulders.2', 'gear.rogue.helm.2', 'gear.rogue.weapon.2'),
    'mixed': ('gear.rogue.chest.1', 'shadeveil.shoulders', 'gear.rogue.helm.0', 'gear.rogue.weapon.2'),
    'shadeveil': ('shadeveil.chest', 'shadeveil.shoulders', 'shadeveil.helm', 'gravekeeper.rogue'),
    'gearshade': ('gearshade.chest', 'gearshade.shoulders', 'gearshade.helm', 'tinker.rogue'),
}
