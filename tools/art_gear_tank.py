# The warrior's gear as layers (art_gear.py), drawn on the dwarf, the warrior's reference body: the regular gear
# in its three looks (Common rags, Uncommon iron, Rare plate; Epic test gear wears the Rare look) and the
# dungeons' set pieces and boss weapons, drawn from their stands in the log's wardrobe (art_wardrobe.py): the
# same shapes and colours, moved onto the hero, with the arms, legs and backs the stand doesn't have.
# The shield comes with the chest: the sets' looks carry one (Barrowguard's coffin lid, Clockguard's ticking
# bulwark), and the weapon slot is the axe.
import art_gear as G
import art_sprites as A
import art_wardrobe as W
from art_gear import frag
from art_heroes import s, ln, beam, c, both, m, round_shield, dwarf_shoulders, \
    STEEL, STEEL_D, STEEL_L, GOLD, BLUE, BLUE_D, WOOD, WOOD_D, FROST, BONE, BONE_D, GRN, \
    BOOT, BLUE_DD, RAG, RAG_D, ROPE, BRONZE, BRONZE_D, RCLOTH, RCLOTH_D, Z
from art_bodies import D_TORSO, D_ARM_AXE, D_ARM_SHIELD, D_LEG
from art_heads import tp

GREAVE = 'M-25 -15 H-5 V-11 H-26 Z'
BELT = 'M-28 -42 H28 V-32 H-28 Z'
TABARD = 'M-21 -82 C-25 -66 -25 -48 -22 -28 L-11 -32 L0 -27 L11 -32 L22 -28 C25 -48 25 -66 21 -82 Z'
CUFF = 'M-47 -54 L-36 -51 L-37 -44 L-48 -46 Z'
D_AXE = 'M-46 -104 C-64 -116 -76 -96 -72 -76 C-62 -84 -54 -84 -47 -80 Z'
D_AXE_SHINE = 'M-52 -100 C-62 -104 -68 -96 -68 -86'
D_HATCHET = 'M-46 -96 C-58 -102 -66 -92 -63 -80 C-56 -84 -51 -84 -46 -82 Z'
GLOW = (-48, -75)


def shield(tier, back=False):
    o = []
    round_shield(o, -40 if back else 40, -54, back=back, tier=tier)
    return ''.join(o)


def arms(col, cuff=None, back=False):
    """both sleeves; a gauntlet's cuff and fist on the axe hand (the fist goes over the haft, in the hands band)"""
    mm = m if back else (lambda d: d)
    out = [frag('arms', 'arm2', s(mm(D_ARM_SHIELD), col)), frag('arms', 'arm', s(mm(D_ARM_AXE), col))]
    if cuff:
        out += [frag('arms', 'arm', s(mm(CUFF), cuff, 3.5)), frag('hands', 'main', c(44 if back else -44, -42, 8.0, cuff))]
    return out


# ---------------------------------------------------------------- the regular ladder
def chest(tier):
    leg = (RAG_D, BOOT, BLUE_D)[tier]
    legs = frag('legs', 'spine', *([both(GREAVE, STEEL_D, 3)] if tier else []), both(D_LEG, leg))
    if tier == 0:
        F = [frag('torso', 'spine', s(D_TORSO, RAG), s('M-20 -68 L-9 -66 L-10 -54 L-21 -56 Z', RAG_D, 2.4),
                  s('M-27 -41 H27 V-34 H-27 Z', ROPE, 3), c(0, -37.5, 3.8, ROPE, 2.6))]
        B = [frag('torso', 'spine', s(D_TORSO, RAG), s(BELT, ROPE, 3.5))]
    elif tier == 1:
        F = [frag('torso', 'spine', s(D_TORSO, STEEL_D), s(BELT, BOOT, 3.5), s('M-7 -43 H7 V-31 H-7 Z', STEEL, 2.8))]
        B = [frag('torso', 'spine', s(D_TORSO, STEEL_D), s(BELT, BOOT, 3.5)), frag('cape', 'spine', s(TABARD, RAG_D))]
    else:
        F = [frag('torso', 'spine', s(D_TORSO, STEEL), ln('M-19 -76 C-22 -64 -21 -54 -18 -46', STEEL_L, 3.2),
                  s(BELT, BLUE, 3.5), s('M-8 -44 H8 V-30 H-8 Z', GOLD, 3), c(0, -37, 3, FROST, 2))]
        B = [frag('torso', 'spine', s(D_TORSO, STEEL), s(BELT, BLUE, 3.5)), frag('cape', 'spine', s(TABARD, BLUE))]
    sleeve, cuff = (RAG_D, BOOT, BLUE_DD)[tier], (None, STEEL_D, STEEL)[tier]
    F = [legs] + F + arms(sleeve, cuff) + [frag('off', 'off', shield(tier))]
    B = [legs] + B + arms(sleeve, cuff, back=True) + [frag('off', 'off', shield(tier, back=True))]
    L = {'slot': 'chest', 'f': F, 'b': B}
    if tier == 2:
        L['fw'] = F + [frag('trim', 'spine', ln('M-11 -80 L0 -68 L11 -80', GOLD, 3), c(0, -60, 5.5, GOLD, 2.6), c(0, -60, 2.4, FROST, 0))]
    return L


def shoulders(tier):
    o = []
    dwarf_shoulders(o, tier)
    part = frag('shoulders', 'sh', *o)
    return {'slot': 'shoulders', 'f': [part], 'b': [part]}


def helm(tier):
    if tier == 0:
        part = frag('helm', 'head', s('M-17.5 -101 H17.5 V-96 H-17.5 Z', RAG_D, 3))
        return {'slot': 'helm', 'f': [part], 'b': [part]}
    if tier == 1:
        man = frag('helm', 'head', s('M-17 -98 C-17 -120 17 -120 17 -98 Z', STEEL_D), s('M-18.5 -101.5 H18.5 V-95.5 H-18.5 Z', STEEL, 3.5))
        woman = frag('helm', 'head', s('M-18 -101 H18 V-95.5 H-18 Z', STEEL, 3.2))
        return {'slot': 'helm', 'f': [man], 'b': [man], 'fw': [woman], 'bw': [woman]}
    horns = both('M-15 -107 C-28 -109 -36 -121 -33 -133 C-27 -124 -21 -119 -12 -116 Z', BONE, 3.5)
    dome = s('M-17 -98 C-17 -121 17 -121 17 -98 Z', STEEL) + s('M-18.5 -101.5 H18.5 V-95.5 H-18.5 Z', STEEL_D, 3.5)
    man_f = frag('helm', 'head', dome, c(-9, -98.5, 1.4, '#1E1A1A', 0) + c(9, -98.5, 1.4, '#1E1A1A', 0) + c(0, -98.5, 1.4, '#1E1A1A', 0), horns, c(0, -111, 3.2, FROST, 2.2))
    man_b = frag('helm', 'head', dome, ln('M0 -118 V-102', STEEL_D, 3), horns)
    w_horns = both('M-15 -106 C-28 -108 -36 -120 -33 -132 C-27 -123 -21 -118 -12 -115 Z', BONE, 3.5)
    woman_f = frag('helm', 'head', w_horns, s('M-18 -96 L-18 -102 L-9 -100 L0 -111 L9 -100 L18 -102 L18 -96 Z', GOLD, 3.2), c(0, -102, 3.2, FROST, 2.2))
    woman_b = frag('helm', 'head', w_horns, s('M-18 -101 H18 V-95 H-18 Z', GOLD, 3.2))
    return {'slot': 'helm', 'f': [man_f], 'b': [man_b], 'fw': [woman_f], 'bw': [woman_b]}


def weapon(tier):
    """chipped bronze hatchet (Common), iron war axe (Uncommon), steel war-axe (Rare)"""
    def one(back):
        mm = m if back else (lambda d: d)
        sx = -1 if back else 1
        haft = beam(mm('M-44 -2 L-47 -100' if tier == 0 else 'M-44 -2 L-47 -108'), WOOD if tier <= 1 else BLUE_D, 5.5)
        if tier == 0:
            blade = s(mm(D_HATCHET), BRONZE) + ln(mm('M-58 -92 L-53 -88'), BRONZE_D, 2.2)
        else:
            blade = s(mm(D_AXE), STEEL if tier == 1 else STEEL_L) + ln(mm(D_AXE_SHINE), '#FFFFFF', 2.2)
        return [frag('weapon', 'main', haft, blade)]
    return {'slot': 'weapon', 'f': one(False), 'b': one(True), 'glow': GLOW}


# ---------------------------------------------------------------- dungeon sets, from their stands
# where a stand's pieces go on the dwarf, in game units: the helm over the whole head, the pauldrons from the
# shoulder line (a little flatter than on the stand, for the dwarf's short body), the plate squashed to his barrel
ON_HEAD = dict(k=0.536, ty=33.8)
ON_SHOULDERS = dict(k=0.5, ky=0.44, ty=6.3)
ON_CHEST = dict(k=0.59, ky=0.43, ty=10.94)


def stand_piece(piece, at):
    sil, det = piece
    return G.from_stand(sil + det, **at)


def boss_weapon(piece, shafts, col, grip, k=0.42):
    """a stand's weapon in the axe hand, mirrored so its blade faces out, the stand's grip point on the hero's;
    its shafts (indices into its silhouette) redrawn at the hero's weight. From behind, the other hand."""
    sil, det = piece
    gx, gy = grip
    hx, hy = -44 * Z, -42 * Z
    fn = lambda x, y: (hx + (gx - x) * k, hy + (y - gy) * k)
    front = ''.join(G.shaft(p, fn, col) if i in shafts else G.warp(p, fn) for i, p in enumerate(sil)) + G.warp(''.join(det), fn)
    return front, G.warp(front, lambda x, y: (-x, y))


def barrowguard():
    st = W.barrowguard()
    # helm: the stand's bone helm, closed, its eye holes over the eyes; from behind, the dome, horns and neck guard
    helm_f = frag('helm', 'head', stand_piece(st['helm'], ON_HEAD))
    helm_b = frag('helm', 'head', G.from_stand(st['helm'][0] + [A.ln('M0 -242 L0 -208', BONE_D, 3)], **ON_HEAD))
    # pauldrons: the skull on each; from behind, the dome and its lames, the shine on them
    sh_f = frag('shoulders', 'sh', stand_piece(st['shoulders'], ON_SHOULDERS))
    domes = [p for i, p in enumerate(st['shoulders'][0]) if i % 4 != 3]
    shine = [A.ln(d, '#FFFFFF', 3) for d in ('M-82 -181 C-77 -190 -69 -195 -61 -197', 'M82 -181 C77 -190 69 -195 61 -197')]
    sh_b = frag('shoulders', 'sh', G.from_stand(domes + shine, **ON_SHOULDERS))
    # chest: the bone plate and its ribs, a dark gambeson under it, bone vambraces, greaves and a fist, and the
    # coffin-lid shield
    plate_f = stand_piece(st['chest'], ON_CHEST)
    plate_b = G.from_stand(st['chest'][0], **ON_CHEST) + ln('M0 -80 V-42', BONE_D, 3)
    knobs = ''.join(c(0, y, 2.6, BONE_D, 2) for y in (-76, -68, -60, -52))
    legs = frag('legs', 'spine', both(GREAVE, BONE, 3), both(D_LEG, RCLOTH))
    cape = 'M-20 -80 C-24 -64 -24 -46 -22 -24 L-15 -30 L-10 -21 L-4 -29 L2 -20 L7 -28 L13 -21 L18 -29 L22 -24 C24 -46 24 -64 20 -80 Z'
    F = [legs, frag('torso', 'spine', plate_f)] + arms(RCLOTH, BONE) + [frag('off', 'off', coffin_lid())]
    B = ([legs, frag('torso', 'spine', plate_b, knobs), frag('cape', 'spine', s(cape, RCLOTH_D))]
         + arms(RCLOTH, BONE, back=True) + [frag('off', 'off', coffin_lid(back=True))])
    wf, wb = boss_weapon(st['weapon'], shafts=(1,), col='#A0703F', grip=(60, -80))
    return {
        'barrowguard.helm': {'slot': 'helm', 'f': [helm_f], 'b': [helm_b]},
        'barrowguard.shoulders': {'slot': 'shoulders', 'f': [sh_f], 'b': [sh_b]},
        'barrowguard.chest': {'slot': 'chest', 'f': F, 'b': B},
        'gravekeeper.tank': {'slot': 'weapon', 'f': [frag('weapon', 'main', wf)], 'b': [frag('weapon', 'main', wb)], 'glow': (-50, -84)},
    }


COFFIN = 'M31 -84 L49 -84 L60 -68 L53 -24 L27 -24 L20 -68 Z'
COFFIN_IN = 'M33.5 -79 L46.5 -79 L54.5 -67 L49 -29 L31 -29 L25.5 -67 Z'


def coffin_lid(back=False):
    """Barrowguard's shield: a coffin lid of dark wood, bone studs at its corners and a skull on its face"""
    if back:
        studs = ''.join(c(-x, y, 2.2, BONE, 1.8) for x, y in ((23.5, -68), (56.5, -68), (30, -27.5), (50, -27.5)))
        return (s(m(COFFIN), WOOD_D) + ln(m(COFFIN_IN), '#4A3424', 2.6)
                + ln(m('M27 -64 L51 -30 M53 -64 L29 -30'), '#4A3424', 5) + c(-40, -47, 3.4, BONE, 2.2) + studs)
    skull_ = s('M33 -48 C33 -60 47 -60 47 -48 C47 -44 44 -42 43 -41 H37 C36 -42 33 -44 33 -48 Z', BONE, 2.8)
    eyes = c(37.5, -49, 2.4, '#1E1A1A', 0) + c(42.5, -49, 2.4, '#1E1A1A', 0) + c(37.5, -48.7, 1, GRN, 0) + c(42.5, -48.7, 1, GRN, 0)
    teeth = ln('M38 -41.5 V-38.5 M40 -41.5 V-38 M42 -41.5 V-38.5', '#1E1A1A', 1.6)
    studs = ''.join(c(x, y, 2.2, BONE, 1.8) for x, y in ((31.5, -80.5), (48.5, -80.5), (23.5, -68), (56.5, -68), (30, -27.5), (50, -27.5)))
    return s(COFFIN, WOOD_D) + ln(COFFIN_IN, '#4A3424', 2.6) + studs + skull_ + eyes + teeth


def layers():
    """every warrior layer, by look id: the regular ladder (gear.tank.<slot>.<rarity>) and the uniques"""
    out = {}
    for tier in (0, 1, 2):
        out[f'gear.tank.chest.{tier}'] = chest(tier)
        out[f'gear.tank.shoulders.{tier}'] = shoulders(tier)
        out[f'gear.tank.helm.{tier}'] = helm(tier)
        out[f'gear.tank.weapon.{tier}'] = weapon(tier)
    out.update(barrowguard())
    return out


OUTFITS = {
    'common': ('gear.tank.chest.0', 'gear.tank.shoulders.0', 'gear.tank.helm.0', 'gear.tank.weapon.0'),
    'uncommon': ('gear.tank.chest.1', 'gear.tank.shoulders.1', 'gear.tank.helm.1', 'gear.tank.weapon.1'),
    'rare': ('gear.tank.chest.2', 'gear.tank.shoulders.2', 'gear.tank.helm.2', 'gear.tank.weapon.2'),
    'mixed': ('gear.tank.chest.1', 'barrowguard.shoulders', 'gear.tank.helm.0', 'gear.tank.weapon.2'),
    'barrowguard': ('barrowguard.chest', 'barrowguard.shoulders', 'barrowguard.helm', 'gravekeeper.tank'),
    'gilded': ('barrowguard.chest', 'barrowguard.shoulders', 'barrowguard.helm', 'gravekeeper.tank'),
}


if __name__ == '__main__':
    import json, os, art_bodies
    Ls = layers()
    out = {}
    for bid in art_bodies.BODIES:
        body = art_bodies.BODIES[bid]()
        for view in ('f', 'b'):
            vb = G.fit_box(body, view, list(Ls.values()))
            for name, ids in OUTFITS.items():
                worn = {Ls[i]['slot']: Ls[i] for i in ids}
                gl = set(worn) if name == 'gilded' else ()
                out[f'{bid.split(".")[0]}_{bid[-1]}_{name}_{view}'] = G.sprite(G.compose(body, view, worn, gl), vb)
    os.makedirs(G.HF_ROOT + '/shots', exist_ok=True)
    json.dump(out, open(G.HF_ROOT + '/shots/gear_tank.json', 'w'))
    print('wrote shots/gear_tank.json', len(out))
