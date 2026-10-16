# Thimblebriar Hollow's bombs and bits, props, round door, floor decals and the Tinker King's cuckoo clock.
# The helpers and the colours are art_thimble.py's; art_thimble.build() calls build() here. Same rules: one ink,
# flat colour, every sprite round its ground point (0, 0).
import math
from art_sprites import K, LW, f, s, ln, beam, c, e, halo, STEEL, STEEL_D, STEEL_L, GOLD, GOLD_D, WOOD, WOOD_D, RUST, \
    FROST, FROST_L, FLAME, FIRE, GRN, GRN_L
from art_heads import tp
from art_thimble import BRASS, BRASS_L, BRASS_D, COPPER, COPPER_D, CAP, CREAM, GILL, STALK, STALK_D, MOSS, MOSS_D, \
    MOSS_L, IRON, BOMB, BOMB_L, GLOW, PINK, xf, cog, cog_d, rivets, spark

# ---------------------------------------------------------------- the cuckoo clock
# Drawn once round its ground point (the bottom middle of its case) at scale k, ink at full weight. Its face is
# centred at (0, FACE) and its little door at (0, DOOR); the game draws the hands and the pendulum itself.
FACE, DOOR = -58, -100
LIT = {'wood': WOOD, 'roof': WOOD_D, 'trim': RUST, 'face': CREAM, 'ring': WOOD_D, 'win': GLOW, 'door': '#7A4A2A', 'leaf': '#B98A50'}
STILL = {'wood': '#6E4A2E', 'roof': '#553821', 'trim': '#7E5A36', 'face': '#D6CDBA', 'ring': '#553821', 'win': '#3A2E2A',
         'door': '#5E3B24', 'leaf': '#8A6A40'}
LEAF = 'M0 0 C4 -3 9 -3 13 0 C9 3 4 3 0 0 Z'


def clock(x, y, k=1.0, tilt=0.0, pal=None, door='shut', gold=False):
    """the Tinker King's cuckoo clock: a little wooden house with a steep roof and carved leaves, a cream face
    with hour ticks (no hands), a little door above it and two lit windows below it"""
    P = pal or LIT
    T = lambda d: tp(d, x, y, k)
    X = lambda v: x + v * k
    Y = lambda v: y + v * k
    small = k < 0.6
    dw = 2.4 if small else 3
    trim = BRASS if gold else P['trim']
    o = []
    if P['win'] == GLOW and not small:
        o.append(halo(X(-16), Y(-19), 13 * k, FLAME, 0.3) + halo(X(16), Y(-19), 13 * k, FLAME, 0.3))
    # the case and its gable, the base and the eave
    o.append(s(T('M-30 0 V-92 L0 -134 L30 -92 V0 Z'), P['wood'], 3.4 if small else LW))
    o.append(s(T('M-34 -7 H34 V0 H-34 Z'), P['roof'], dw))
    o.append(s(T('M-34 -88 H34 V-82 H-34 Z'), trim, dw))
    # the face in its carved ring, twelve ticks and no hands
    o.append(c(X(0), Y(FACE), 25 * k, P['ring'], 3.4 if small else LW) + c(X(0), Y(FACE), 20 * k, P['face'], dw))
    ticks = []
    for i in range(0, 12, 3 if small else 1):
        a = i * math.pi / 6
        r0 = 12 if small else 13.5 if i % 3 == 0 else 15.5
        ticks.append(f'M{f(X(r0 * math.sin(a)))} {f(Y(FACE - r0 * math.cos(a)))} L{f(X(17.5 * math.sin(a)))} {f(Y(FACE - 17.5 * math.cos(a)))}')
    o.append(ln(' '.join(ticks), K, 1.6 if small else 2.2))
    if small:
        o.append(ln(T(f'M0 {FACE} L-7 {FACE - 8} M0 {FACE} L10 {FACE}'), K, 2))
    else:
        o.append(c(X(0), Y(FACE), 2.2, K, 0))
        # two little windows below the face, and a carved heart between them
        for sx in (-1, 1):
            o.append(s(T(f'M{sx * 10} -12 V-26 H{sx * 22} V-12 Z'), P['win'], 2.8) + ln(T(f'M{sx * 16} -26 V-12 M{sx * 10} -19 H{sx * 22}'), K, 1.8))
        o.append(s(T('M0 -12 C-6 -17 -5 -22 -2 -22 C-1 -22 0 -21 0 -20 C0 -21 1 -22 2 -22 C5 -22 6 -17 0 -12 Z'), trim, 2))
    # the little door above the face, on its perch
    o.append(s(T('M-13 -92 H13 V-88 H-13 Z'), trim, dw))
    if door == 'shut':
        o.append(s(T('M-9 -92 V-104 C-9 -110 9 -110 9 -104 V-92 Z'), P['door'], dw) + c(X(5), Y(-99), 1.6 * k + 0.4, BRASS, 0))
    else:
        o.append(s(T('M-9 -92 V-104 C-9 -110 9 -110 9 -104 V-92 Z'), '#1E1410', dw))
        o.append(s(T('M-9 -92 L-21 -96 V-106 C-21 -111 -14 -113 -9 -108 Z'), P['door'], dw) + c(X(-18), Y(-101), 1.6 * k + 0.4, BRASS, 0))
    # the steep roof, with carved leaves at the peak and the eaves
    o.append(s(T('M-45 -84 L0 -146 L45 -84 L37 -79 L0 -130 L-37 -79 Z'), gold and GOLD or P['roof'], 3.4 if small else LW))
    if not small:
        o.append(ln(T('M-28 -104 L-22 -100 M-17 -119 L-11 -115 M28 -104 L22 -100 M17 -119 L11 -115'), K, 2))
        for deg, lx, ly, kk in ((-90, 0, -146, 1.0), (-135, -1, -145, 0.9), (-45, 1, -145, 0.9), (100, -40, -80, 0.9), (80, 40, -80, 0.9)):
            o.append(s(xf(LEAF, X(lx), Y(ly), deg, k * kk), P['leaf'] if not gold else BRASS_L, 2.2))
        o.append(c(X(0), Y(-145), 3 * k, trim, 2.2))
    else:
        o.append(c(X(0), Y(-148), 3, trim, 2))
    body = ''.join(o)
    if tilt:
        body = f'<g transform="rotate({f(tilt)} {f(x)} {f(y)})">{body}</g>'
    return body


def bird():
    """the wooden cuckoo, flying with its wings up and its feet at the ground point (it carries the little king)"""
    o = [s('M-6 -30 C-12 -42 -22 -47 -28 -44 C-23 -41 -19 -36 -17 -29 Z', WOOD_D, 3.2)]
    o.append(ln('M-3 -16 L-4 -7 L-5 -1 M3 -16 L4 -7 L5 -1', K, 3) + ln('M-9 1 L-5 -1 L-3 2 M1 2 L5 -1 L9 1', K, 2.4))
    o.append(s('M-18 -22 L-31 -17 L-29 -25 L-35 -28 L-20 -30 Z', WOOD_D, 3))
    o.append(s('M-21 -25 C-17 -34 -1 -36 7 -31 C11 -35 18 -35 20 -31 C22 -27 19 -22 15 -21 C9 -14 -12 -14 -21 -25 Z', WOOD, 3.4))
    o.append(s('M-11 -19 C-5 -16 4 -17 9 -21 C5 -24 -5 -24 -11 -19 Z', '#C9A06A', 0))
    o.append(s('M19 -31 L27 -29.6 L19.6 -27 Z', '#F2A93C', 2.2) + s('M19.4 -26.4 L25.6 -24 L18.6 -23.6 Z', '#F2A93C', 2))
    o.append(e(13.4, -29.4, 2.4, 2.8, '#FFFFFF', 1.8) + c(14.2, -29, 1.3, K, 0))
    o.append(s('M-5 -31 C-8 -42 -5 -52 5 -58 C6 -53 7 -50 10 -48 C8 -45 9 -41 11 -39 C9 -36 7 -33 5 -31 Z', WOOD, 3.2) + ln('M0 -36 C0 -42 2 -48 5 -53', WOOD_D, 2))
    return o


def gold_bird():
    """the gold cuckoo popping out of its door, wings out, calling; its belly at the ground point"""
    o = [halo(0, -13, 17, GOLD, 0.35)]
    for sx in (-1, 1):
        o.append(s(tp('M5 -13 C11 -21 16 -24 20 -23 C18 -18 17 -13 13 -8 C10 -6 7 -8 5 -10 Z', 0, 0, 1, sx), GOLD_D, 2.8))
        o.append(ln(tp('M10 -16 L16 -19 M10 -11 L14 -13', 0, 0, 1, sx), K, 1.6))
    o.append(s('M-9.5 -6 C-11 -16 -6.5 -24 0 -24 C6.5 -24 11 -16 9.5 -6 C6.5 0 -6.5 0 -9.5 -6 Z', GOLD, 3.2))
    o.append(s('M-5.6 -6 C-5 -11 5 -11 5.6 -6 C3.2 -3 -3.2 -3 -5.6 -6 Z', '#FFE9A8', 0))
    o.append(s('M2 -19 L11 -18.4 L2.6 -16 Z', '#F2A93C', 2) + s('M2.6 -15 L10 -12.6 L1.6 -13.4 Z', '#F2A93C', 1.8))
    o.append(e(-2, -18.4, 2.2, 2.6, '#FFFFFF', 1.6) + c(-1.5, -18, 1.1, K, 0))
    o.append(spark(-12, -26, 4, '#FFF3C4', 1.6))
    return o


def hands(hour, minute):
    """two hands on the face, in degrees from twelve: for the clocks the reveal shows still (the game draws its own)"""
    d = ' '.join(f'M0 {FACE} L{f(r * math.sin(math.radians(a)))} {f(FACE - r * math.cos(math.radians(a)))}' for a, r in ((hour, 9), (minute, 14)))
    return ln(d, K, 3.2) + c(0, FACE, 2.4, K, 0)


def cuckoos(sprite):
    vb = (-52, -160, 104, 166)
    sprite('cuckoo', vb, [clock(0, 0)], 'Cuckoo clock')
    sprite('cuckoo_open', vb, [clock(0, 0, door='open')], 'Cuckoo clock, its door open')
    sprite('cuckoo_still', vb, [clock(0, 0, pal=STILL)], 'Cuckoo clock, stopped')
    # the reveal's three, beside the chest: ten past ten, or stopped at twenty past eight
    sprite('cuckoo_tell', vb, [clock(0, 0), hands(305, 60)], 'Cuckoo clock, ticking')
    sprite('cuckoo_tell_still', vb, [clock(0, 0, pal=STILL), hands(250, 120)], 'Cuckoo clock, stopped')
    gb = ''.join(gold_bird())
    sprite('cuckoo_gold', vb, [halo(0, -60, 50, GOLD, 0.22), clock(0, 0, door='open', gold=True), hands(305, 60),
                               f'<g transform="translate(0 -96)">{gb}</g>'], 'Cuckoo clock, the gold cuckoo out')
    sprite('cuckoo_bird', (-38, -62, 70, 68), bird(), 'Cuckoo')
    sprite('cuckoo_bird_gold', (-24, -34, 48, 40), gold_bird(), 'Gold cuckoo')


# ---------------------------------------------------------------- bombs and bits
def bomb_body(cx, cy, r, body, band, shine, fuse_col='#C8B08A', spark_col=GLOW, stamp=BRASS):
    fuse = f'M{f(cx + r * 0.3)} {f(cy - r * 1.05)} C{f(cx + r * 0.34)} {f(cy - r * 1.3)} {f(cx + r * 0.52)} {f(cy - r * 1.42)} {f(cx + r * 0.7)} {f(cy - r * 1.48)}'
    o = [ln(fuse, K, 6.2), ln(fuse, fuse_col, 2.8)]
    o.append(c(cx, cy, r, body, 3.6))
    o.append(s(f'M{f(cx - r)} {f(cy - r * 0.12)} C{f(cx - r * 0.5)} {f(cy + r * 0.24)} {f(cx + r * 0.5)} {f(cy + r * 0.24)} {f(cx + r)} {f(cy - r * 0.12)} '
               f'L{f(cx + r * 0.96)} {f(cy + r * 0.3)} C{f(cx + r * 0.5)} {f(cy + r * 0.66)} {f(cx - r * 0.5)} {f(cy + r * 0.66)} {f(cx - r * 0.96)} {f(cy + r * 0.3)} Z', band, 2.6))
    o.append(cog(cx - r * 0.02, cy + r * 0.24, r * 0.3, 6, stamp, 1.8, hub=band, shine=False))
    o.append(ln(f'M{f(cx - r * 0.66)} {f(cy - r * 0.36)} C{f(cx - r * 0.6)} {f(cy - r * 0.62)} {f(cx - r * 0.4)} {f(cy - r * 0.76)} {f(cx - r * 0.16)} {f(cy - r * 0.8)}', shine, 2.8))
    o.append(s(f'M{f(cx + r * 0.06)} {f(cy - r * 0.92)} L{f(cx + r * 0.42)} {f(cy - r * 1.08)} L{f(cx + r * 0.52)} {f(cy - r * 0.84)} L{f(cx + r * 0.16)} {f(cy - r * 0.7)} Z', band, 2.2))
    o.append(spark(cx + r * 0.74, cy - r * 1.52, r * 0.32, spark_col, 2))
    return o


def puff_body(cx, cy, body, dark, light, k=0.86):
    P = lambda d: tp(d, cx, cy, k)
    o = [s(P('M-18 14 C-23 2 -15 -14 0 -14 C15 -14 23 2 18 14 C10 18 -10 18 -18 14 Z'), body, 3.6)]
    o.append(s(P('M-14 -2 C-13 -8 -8 -11 -3 -11 C-8 -8 -10 -4 -11 0 Z'), light, 0))
    for dx, dy, r in ((-8, 6, 2.4), (6, 2, 3), (12, 10, 2.2), (-1, 12, 2), (-14, 9, 1.6), (2, -6, 1.8)):
        o.append(c(cx + dx * k, cy + dy * k, r * k, dark, 0))
    o.append(ln(P('M-2 -13 C-3 -19 3 -22 5 -18 C6 -15 2 -15 2 -17'), K, 3))
    return o


def bombs(sprite):
    sprite('bomb', (-20, -49, 40, 51), bomb_body(0, -18, 16, BOMB, BRASS, BOMB_L), 'Bomb')
    sprite('bomb_gold', (-24, -50, 48, 56), [halo(0, -18, 23, GOLD, 0.35)] + bomb_body(0, -18, 16, GOLD, GOLD_D, '#FFF3C4', '#FFE9A8', '#FFF3C4', BRASS_L), 'Bomb, knocked back')
    sprite('puffball', (-21, -38, 42, 40), puff_body(0, -14, '#E8D3A8', '#C4A574', '#F6EBD2'), 'Puffball')
    sprite('puffball_gold', (-24, -40, 48, 46), [halo(0, -14, 19, GOLD, 0.35)] + puff_body(0, -14, GOLD, GOLD_D, '#FFF3C4'), 'Puffball, knocked back')
    goo = ('M-15 -24 C-16 -31 -11 -36 -5 -36 C-1 -37 3 -34 4 -30 C6 -27 4 -24 2 -26 C0 -28 -1 -24 -1 -20 C-1 -15 -5 -15 -5 -20 '
           'C-5 -23 -7 -24 -9 -21 C-10 -18 -13 -18 -13 -21 C-13 -22 -14 -23 -15 -24 Z')
    st = [halo(0, -22, 27, GRN, 0.3)] + bomb_body(0, -21, 15, BOMB, BRASS, BOMB_L)
    st.append(s(goo, GRN, 3) + s('M-11 -29 C-10 -32 -7 -34 -4 -34 C-7 -32 -9 -30 -9 -27 Z', GRN_L, 0) + c(-9, -12, 2.4, GRN, 1.8) + c(12, -27, 1.8, GRN, 1.6))
    sprite('sticky_bomb', (-28, -54, 56, 60), st, 'Sticky Bomb')
    fr = [halo(0, -13, 15, FROST, 0.3)]
    fr += bomb_body(0, -12, 11.5, FROST, STEEL, '#FFFFFF', '#C8B08A', '#FFFFFF', STEEL_L)
    for deg, px, py in ((-34, -6, -19), (-4, -1, -22)):
        fr.append(s(xf('M-3.4 0 L0 -11 L3.4 0 Z', px, py, deg), FROST_L, 2))
    fr.append(s('M-11 -15 C-10 -20 -6 -23 -1 -23.4 C2 -23 3 -21 2 -19 L0 -16 L-3 -18.4 L-5.6 -14.6 L-8.4 -17.6 L-10 -13 Z', FROST_L, 2))
    sprite('frost_bomb', (-18, -36, 36, 40), fr, 'Frost bomb')
    sprite('cog_shot', (-11, -11, 22, 22), [cog(0, 0, 9, 8, BRASS, 2.6, shine=False) + c(0, 0, 1.6, BRASS_L, 0)], 'Cog')
    sprite('shard_cog', (-7, -7, 14, 14), [s(cog_d(0, 0, 5.4, 6), BRASS, 2) + c(0, 0, 1.6, K, 0)], 'Cog bit')
    sprite('shard_spore', (-7, -7, 14, 14), [s('M-1.6 1 V4.6 H1.6 V1 Z', STALK, 1.8) + s('M-5.4 1.8 C-5.4 -5.6 5.4 -5.6 5.4 1.8 Z', CAP, 2) + c(-1.4, -1.6, 1.3, CREAM, 0)], 'Spore bit')


# ---------------------------------------------------------------- props
SHROOM, SHROOM_L = '#D9823A', '#EFA25C'   # the giant mushrooms' amber caps (the Waddlecaps keep the red)


def mushroom(x, base, top, half, cap=CAP, spots=True, w=LW, stalk_w=None):
    """a mushroom standing at (x, base): its cap's top at `top`, `half` wide each side of x"""
    sw = stalk_w or half * 0.32
    rim = top + half * 0.72
    o = [s(f'M{f(x - sw)} {f(base)} C{f(x - sw * 1.1)} {f(base - (base - rim) * 0.5)} {f(x - sw * 0.85)} {f(rim)} {f(x - sw * 0.8)} {f(rim + 2)} '
           f'H{f(x + sw * 0.8)} C{f(x + sw * 0.85)} {f(rim)} {f(x + sw * 1.1)} {f(base - (base - rim) * 0.5)} {f(x + sw)} {f(base)} Z', STALK, w)]
    o.append(s(f'M{f(x - half)} {f(rim)} C{f(x - half * 1.04)} {f(top + half * 0.06)} {f(x - half * 0.5)} {f(top)} {f(x)} {f(top)} '
               f'C{f(x + half * 0.5)} {f(top)} {f(x + half * 1.04)} {f(top + half * 0.06)} {f(x + half)} {f(rim)} '
               f'C{f(x + half * 0.6)} {f(rim + half * 0.14)} {f(x - half * 0.6)} {f(rim + half * 0.14)} {f(x - half)} {f(rim)} Z', cap, w))
    if spots:
        for dx, dy, r in ((-0.45, 0.42, 0.17), (0.1, 0.22, 0.13), (0.5, 0.48, 0.16), (-0.1, 0.6, 0.09)):
            o.append(e(x + dx * half, top + dy * half, r * half, r * half * 0.85, CREAM, max(2, w * 0.66)))
    return o


def props(sprite):
    # a giant mushroom
    o = [s('M-24 0 C-26 -10 -18 -16 -10 -16 H12 C20 -16 26 -10 24 0 Z', STALK_D)]
    o.append(s('M-13 -12 C-15 -46 -11 -80 -8 -104 H10 C12 -80 16 -46 15 -12 Z', STALK))
    o.append(ln('M-6 -24 C-7 -48 -5 -72 -3 -92', '#FFFFFF', 2.6))
    o.append(s('M-17 -88 C-10 -94 10 -94 17 -88 L21 -78 L14 -82 L8 -77 L0 -82 L-8 -77 L-14 -82 L-21 -78 Z', CREAM, 3.4))
    o.append(s('M-52 -106 C-36 -94 36 -94 52 -106 Z', GILL, 3.4))
    o.append(s('M-58 -104 C-62 -136 -32 -154 0 -154 C32 -154 62 -136 58 -104 C40 -97 -40 -97 -58 -104 Z', SHROOM))
    o.append(s('M-44 -118 C-40 -134 -26 -144 -10 -147 C-24 -138 -34 -128 -38 -114 Z', SHROOM_L, 0))
    for x, y, rx, ry in ((-26, -128, 9, 8), (8, -140, 7, 5.5), (32, -124, 10, 8.5), (2, -114, 5.5, 4.5), (-46, -110, 4.5, 4.5), (48, -110, 4, 4.5)):
        o.append(e(x, y, rx, ry, CREAM, 3))
    sprite('tb_shroom_tall', (-64, -160, 128, 166), o, 'Giant mushroom')
    # three little mushrooms
    o = []
    o += mushroom(-8, 0, -46, 15, w=3.4, stalk_w=5.6)
    o += mushroom(14, 2, -28, 12, '#E08A3C', w=3.2, stalk_w=4.8)
    o += mushroom(-24, 2, -18, 8, '#E9D3A6', spots=False, w=3, stalk_w=3.8)
    sprite('tb_shrooms', (-36, -52, 66, 58), o, 'Mushrooms')
    # a stack of cogs leaning together
    o = [cog(-14, -54, 50, 12, BRASS, holes=5, turn=0.1), cog(38, -32, 31, 9, COPPER, hub=COPPER_D, holes=3, turn=0.2), cog(-46, -18, 18, 8, BRASS_L, 3.4, turn=0.3)]
    sprite('tb_cogs', (-70, -110, 144, 116), o, 'Cogs')
    # a gnome lamp post
    o = [halo(0, -104, 34, FLAME, 0.22), halo(0, -104, 18, FLAME, 0.3)]
    o.append(s('M-18 0 C-18 -9 -9 -13 0 -13 C9 -13 18 -9 18 0 Z', BRASS) + rivets([(-9, -5), (0, -7), (9, -5)], 1.8, BRASS_L))
    o.append(beam('M0 -12 V-94', BRASS_D, 6) + s('M-6 -60 H6 V-54 H-6 Z', COPPER, 2.6))
    o.append(c(0, -104, 11, GLOW, 3.4) + s('M0 -112 C5 -106 5 -100 0 -97 C-5 -100 -5 -106 0 -112 Z', FIRE, 2) + c(-3, -106, 2, '#FFFFFF', 0))
    o.append(s('M-9 -96 H9 L7 -91 H-7 Z', BRASS, 2.8))
    o.append(s('M-22 -112 C-22 -129 22 -129 22 -112 C13 -109 -13 -109 -22 -112 Z', CAP, 3.6) + e(-9, -120, 3.4, 3, CREAM, 2.2) + e(8, -122, 2.8, 2.4, CREAM, 2) + e(14, -115, 2, 2, CREAM, 1.8))
    sprite('tb_lamp', (-36, -140, 72, 146), o, 'Lamp post')
    # a crate of parts, a cog and a spring sticking out of it
    o = [cog(-12, -46, 17, 9, BRASS, 3.4, turn=0.15)]
    o.append(ln('M14 -40 L26 -46 L12 -50 L26 -56 L12 -60 L26 -66', K, 6.6) + ln('M14 -40 L26 -46 L12 -50 L26 -56 L12 -60 L26 -66', STEEL_L, 3) + c(26, -67, 3.4, STEEL, 2.4))
    o.append(s('M-34 -44 H34 V0 H-34 Z', WOOD))
    o.append(ln('M-34 -29 H34 M-34 -15 H34', WOOD_D, 3))
    o.append(s('M-34 -44 H-26 V0 H-34 Z', '#A0703F', 3.2) + s('M26 -44 H34 V0 H26 Z', '#A0703F', 3.2) + s('M-26 -6 L20 -40 L26 -40 L26 -36 L-20 -2 L-26 -2 Z', '#A0703F', 3))
    o.append(rivets([(-30, -40), (-30, -4), (30, -40), (30, -4)], 1.6, '#4A3428'))
    sprite('tb_crate', (-38, -74, 76, 78), o, 'Crate of parts')
    # a lamp on the wall: a brass lantern under a toadstool cap
    o = [halo(0, -38, 34, FIRE, 0.16), halo(0, -38, 20, FIRE, 0.22)]
    o.append(s('M-4 -22 H4 L3 -6 H-3 Z', WOOD_D, 3) + s('M-9 -8 H9 V-2 H-9 Z', IRON, 3))
    o.append(s('M-12 -50 H12 L10 -24 H-10 Z', BRASS, 3.4) + s('M-7 -46 H7 L6 -28 H-6 Z', GLOW, 2.4))
    o.append(s('M0 -45 C6 -39 6 -32 0 -29 C-6 -32 -6 -39 0 -45 Z', FIRE, 2.2) + s('M0 -40 C3 -36 3 -33 0 -31 C-3 -33 -3 -36 0 -40 Z', '#FFF6D0', 0))
    o.append(s('M-13 -26 H13 L10 -20 H-10 Z', BRASS_D, 3))
    o.append(s('M-19 -49 C-19 -66 19 -66 19 -49 C11 -46 -11 -46 -19 -49 Z', CAP, 3.4) + e(-7, -57, 3.4, 2.8, CREAM, 2.2) + e(8, -58, 2.6, 2.2, CREAM, 2) + e(13, -52, 1.8, 1.8, CREAM, 1.6))
    sprite('tb_wall_lamp', (-36, -78, 72, 80), o, 'Wall lamp')
    # a big brass gear hung on the wall from a bracket
    o = [s('M-34 -6 H34 V2 H-34 Z', WOOD_D, 3.4) + rivets([(-28, -2), (28, -2)], 1.8, '#4A3428')]
    o.append(cog(26, 70, 13, 8, COPPER, 3.2, hub=COPPER_D, turn=0.25))
    o.append(cog(0, 42, 37, 11, BRASS, holes=5, turn=0.05))
    o.append(s('M-5 0 H5 V40 H-5 Z', IRON, 3.2) + c(0, 42, 6, IRON, 3) + c(0, 42, 2.2, K, 0))
    sprite('tb_gearwall', (-42, -10, 84, 96), o, 'Gear on the wall')
    # the healer's patch-up turret: a brass tripod with a glowing green mushroom lamp
    o = [halo(0, -58, 30, GRN, 0.3)]
    o.append(beam('M0 -30 L-24 -2 M0 -30 L24 -2', BRASS_D, 4.6) + beam('M0 -30 L2 -6', BRASS_D, 4.2))
    o.append(e(-25, -2, 5, 2.6, BRASS, 2.4) + e(25, -2, 5, 2.6, BRASS, 2.4) + e(2, -5, 4, 2.2, BRASS, 2.2))
    o.append(s('M-13 -44 H13 C15 -44 16 -43 16 -41 V-30 C16 -28 15 -27 13 -27 H-13 C-15 -27 -16 -28 -16 -30 V-41 C-16 -43 -15 -44 -13 -44 Z', BRASS, 3.4))
    o.append(s('M16 -39 H24 V-33 H16 Z', COPPER, 2.6) + rivets([(-10, -36), (10, -36)], 1.6))
    o.append(s('M-3 -40 H3 V-38 H5 V-32 H3 V-30 H-3 V-32 H-5 V-38 H-3 Z', GRN, 0))
    o.append(s('M-4 -44 V-54 H4 V-44 Z', STALK, 2.6))
    o.append(s('M-18 -54 C-18 -72 18 -72 18 -54 C10 -51 -10 -51 -18 -54 Z', GRN, 3.4) + e(-7, -62, 3.4, 2.8, GRN_L, 0) + e(8, -63, 2.6, 2.2, GRN_L, 0) + e(1, -57, 2, 1.6, GRN_L, 0))
    sprite('tb_turret', (-34, -90, 68, 94), o, 'Patch-up turret')


# ---------------------------------------------------------------- the round door (the Dungeons sheet's picture)
def round_door(sprite):
    o = []
    # the hill: earth with roots in it, under a cap of moss
    o.append(s('M-120 0 C-123 -112 -94 -228 0 -236 C94 -228 123 -112 120 0 Z', '#7A5234'))
    o.append(s('M-112 -140 C-102 -198 -58 -232 0 -236 C58 -232 102 -198 112 -140 C106 -136 100 -144 98 -152 C94 -146 88 -152 88 -160 '
               'C70 -196 38 -212 0 -214 C-38 -212 -70 -196 -88 -160 C-88 -152 -94 -146 -98 -152 C-100 -144 -106 -136 -112 -140 Z', MOSS))
    o.append(s('M-98 -168 C-82 -204 -44 -226 -8 -230 C-40 -220 -68 -200 -86 -170 Z', MOSS_L, 0))
    o.append(ln('M-112 -110 C-114 -96 -110 -84 -114 -72 M112 -106 C114 -92 108 -82 113 -70 M-116 -46 C-118 -34 -114 -26 -117 -16 M116 -40 C117 -30 114 -22 116 -12', '#4B311E', 3.4))
    # the stones round the doorway, a cog on the keystone
    o.append(s('M-104 0 V-100 C-104 -164 -60 -218 0 -218 C60 -218 104 -164 104 -100 V0 Z', '#5E4E40'))
    for i in range(9):
        a0, a1 = math.pi * (1 + i / 9), math.pi * (1 + (i + 1) / 9)
        p = [(86 * math.cos(a0), -100 + 97 * math.sin(a0)), (86 * math.cos(a1), -100 + 97 * math.sin(a1)),
             (104 * math.cos(a1), -100 + 118 * math.sin(a1)), (104 * math.cos(a0), -100 + 118 * math.sin(a0))]
        o.append(s('M' + ' L'.join(f'{f(px)} {f(py)}' for px, py in p) + ' Z', '#9E8C78' if i % 2 else '#8C7A68', 3.6))
    for sx in (-1, 1):
        for y0, y1 in ((0, -34), (-34, -68), (-68, -100)):
            o.append(s(tp(f'M86 {y0} H104 V{y1} H86 Z', 0, 0, 1, sx), '#8C7A68' if (y0 // 34) % 2 else '#9E8C78', 3.6))
    o.append(s('M-14 -214 H14 L11 -190 H-11 Z', '#9E8C78', 3.6) + cog(0, -203, 8.5, 8, BRASS, 2.6, shine=False))
    # the dark doorway in its wooden frame
    o.append(s('M-86 0 V-100 C-86 -156 -48 -197 0 -197 C48 -197 86 -156 86 -100 V0 Z', '#3A2618', 3.6))
    o.append(s('M-80 0 V-100 C-80 -150 -44 -190 0 -190 C44 -190 80 -150 80 -100 V0 Z', '#120B07', 0))
    # the round green door swung open to the left: its edge, planks, brass knob and hinges
    o.append(s('M-124 2 V-98 C-124 -146 -116 -186 -104 -190 L-100 -188 C-111 -184 -120 -146 -120 -98 V2 Z', '#3E7238', 3.4))
    o.append(s('M-120 2 V-98 C-120 -148 -111 -190 -100 -190 C-89 -190 -80 -150 -80 -100 V2 Z', '#4E8F47'))
    o.append(ln('M-110 -4 V-160 M-100 -4 V-184 M-90 -4 V-166', '#3E7238', 2.6))
    o.append(s('M-80 -150 H-110 V-142 H-80 Z', BRASS, 2.8) + s('M-80 -56 H-110 V-48 H-80 Z', BRASS, 2.8))
    o.append(c(-100, -96, 6.4, BRASS, 3) + c(-101.6, -97.6, 1.8, BRASS_L, 0))
    # mushrooms at the foot of the hill
    for args in ((-112, 4, -40, 16), (-92, 4, -22, 10), (100, 4, -36, 15), (118, 4, -20, 8)):
        o += mushroom(*args, w=3.4, stalk_w=args[3] * 0.38)
    sprite('round_door', (-132, -240, 262, 246), o, 'The round door')


# ---------------------------------------------------------------- floor decals
def decals(sprite):
    o = [s('M-30 -4 C-33 -10 -25 -15 -17 -12 C-12 -19 -2 -19 2 -14 C8 -20 20 -18 22 -11 C30 -12 34 -6 30 -1 C26 3 14 3 0 3 C-14 3 -28 3 -30 -4 Z', MOSS, 3)]
    o.append(e(-14, -5, 7, 3, MOSS_D, 0) + e(12, -6, 8, 3, MOSS_D, 0) + e(4, -12, 4, 2, MOSS_L, 0))
    for fx, fy in ((-20, -8), (6, -10), (20, -3)):
        o.append(''.join(c(fx + 2.6 * math.cos(a * 1.2566), fy + 2.6 * math.sin(a * 1.2566) * 0.7, 1.8, '#FFFFFF', 1.2) for a in range(5)) + c(fx, fy, 1.2, GOLD, 0))
    sprite('tb_moss', (-35, -22, 70, 28), o, 'Moss')
    o = []
    for x, y, r, col in ((-16, -6, 4, '#D8FFB8'), (2, -12, 3, '#D8FFB8'), (14, -4, 4.6, '#D8FFB8'), (-4, -2, 2.4, '#FFD6F6'), (22, -14, 2.2, '#D8FFB8'), (-22, -14, 2, '#D8FFB8')):
        o.append(halo(x, y, r * 2.4, PINK if col == '#FFD6F6' else GRN, 0.24) + c(x, y, r, col, 1.8))
    sprite('tb_spores', (-30, -26, 60, 34), o, 'Spores')
    o = [s('M-23 -6 L-19 -12 H-11 L-7 -6 L-11 0 H-19 Z', STEEL, 2.6) + c(-15, -6, 2.4, '#4A4458', 1.8)]
    o.append(c(-2, -13, 4.4, BRASS, 2.4) + c(-2, -13, 1.8, '#4A4458', 0))
    o.append(beam('M0 -3 L14 -9', STEEL_D, 4.6, 2.6) + ln('M4 -7 L5 -3 M7.5 -8.4 L8.5 -4.4 M11 -9.8 L12 -5.8', K, 1.4))
    o.append(s('M-6 -1 L-5 -6 L-1 -7.4 L2 -4.6 L1 0.4 L-3 1.6 Z', STEEL_L, 2.4))
    o.append(ln('M10 -15 C12 -19 16 -19 16 -15 C16 -11 20 -11 20 -15 C20 -19 24 -19 24 -15', K, 4.6) + ln('M10 -15 C12 -19 16 -19 16 -15 C16 -11 20 -11 20 -15 C20 -19 24 -19 24 -15', COPPER, 2))
    sprite('tb_bolts', (-26, -22, 54, 28), o, 'Nuts and bolts')
    o = mushroom(0, 0, -22, 10, '#E9D3A6', spots=False, w=3, stalk_w=4.6)
    o.append(s('M-5 -19 C-3 -21 3 -21 5 -19 C3 -18 -3 -18 -5 -19 Z', '#F6EBD2', 0))
    sprite('tb_ring_shroom', (-14, -28, 28, 32), o, 'Fairy ring mushroom')


def build(sprite):
    cuckoos(sprite)
    bombs(sprite)
    props(sprite)
    round_door(sprite)
    decals(sprite)
