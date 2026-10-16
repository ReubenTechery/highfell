# Thimblebriar Hollow's pets, mount, trophies and dye, and their 64x64 collectible tiles. art_hearth.py's build()
# calls build(sprite, icon) with its own registering functions, so these land in art/hearth.json and
# art/collect_icons.json. Same locked TV-cartoon style: one black line, flat colour, every sprite drawn around its
# ground point (0, 0). The Hollow's own colour is brass; a heroic twin turns its brass to gold (gild()).
import math
import art_sprites as A
from art_sprites import K, s, ln, beam, c, e, halo, m, both, f, BONE, GRN, GRN_L, STEEL, STEEL_L, GOLD, GOLD_D, RED, \
    WOOD, WOOD_D, RUST, FLAME
import art_heads as heads

# brass (the dungeon's own), and what it turns into on a heroic twin
BRASS, BRASS_D, BRASS_DD, BRASS_L = '#D89B3C', '#A86F2A', '#7E5220', '#F4CF7E'
BRASS_GILD = {BRASS: GOLD, BRASS_D: GOLD_D, BRASS_DD: '#B8862A', BRASS_L: '#FFF3C4'}
# the king's white hair, the mushrooms, the ribbon
WHITE, WHITE_D = '#F7F3EA', '#C9C1B2'
CAP_L = '#E97A6E'
TOAD, TOAD_L, GILL = '#A9472F', '#D27A5C', '#B8A27A'
STEM, STEM_D = '#F1E2C2', '#D9C49A'
RIB, RIB_D = '#5BA048', '#3F7A34'
CHEEK = '#F29B9B'


def g(x, y, k, parts):
    """parts drawn around their own (0, 0), placed at (x, y) and scaled by k"""
    return f'<g transform="translate({f(x)} {f(y)}) scale({f(k)})">' + ''.join(parts) + '</g>'


def cog(cx, cy, r_in, r_out, n, fill, w=3.5, phase=-90.0, tip=0.34, root=0.52):
    """a cog's outline: n square teeth standing from the rim (r_in) to their tips (r_out)"""
    pts, step = [], 2 * math.pi / n
    for i in range(n):
        a = math.radians(phase) + i * step
        for (da, r) in ((-root, r_in), (-tip, r_out), (tip, r_out), (root, r_in)):
            pts.append((cx + r * math.cos(a + da * step / 2), cy + r * math.sin(a + da * step / 2)))
    return s('M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z', fill, w)


def windkey(x, y, ang, length=14, k=1.0, col=BRASS, dark=BRASS_D):
    """a wind-up key: its shaft from (x, y) out along `ang` degrees (0 is right, -90 up), its two-winged bow at the end"""
    W = lambda w: w / k
    L = length
    wing = f'M{f(L + 2)} -1 C{f(L - 1)} -7 {f(L + 1)} -14 {f(L + 6)} -14 C{f(L + 11)} -14 {f(L + 13)} -8 {f(L + 9)} -1 Z'
    o = [beam(f'M0 0 H{f(L + 3)}', col, W(4), W(3.5))]
    o.append(s(wing, col, W(3.2)) + s(mirror_y(wing), col, W(3.2)))
    o.append(e(L + 6, -8, 2, 2.6, dark, 0) + e(L + 6, 8, 2, 2.6, dark, 0))
    o.append(c(L + 5, 0, 3.4, dark, W(2.6)))
    return f'<g transform="translate({f(x)} {f(y)}) rotate({f(ang)}) scale({f(k)})">' + ''.join(o) + '</g>'


def mirror_y(d):
    """a path written in absolute commands, flipped top to bottom"""
    out, cmd, i = [], None, 0
    for t in heads.TOK.findall(d):
        if t.isalpha():
            cmd, i = t, 0
            out.append(t)
            continue
        v = float(t)
        if cmd == 'V' or (cmd != 'H' and i % 2 == 1):
            v = -v
        i += 1
        out.append(f(v))
    return ' '.join(out)


def gilded(sprite, icon, name, tile, vb, o, extra, k=1.0, dx=0, dy=0, ground=56):
    """a heroic twin: the same picture through gild(), and its tile on the dark gold ground with the sparkle"""
    body = A.gild(''.join(o), extra)
    sprite(name + '_gilded', vb, [body])
    spark = f'<g transform="scale({f(1 / k)}) translate({f(-(32 + dx))} {f(-(ground + dy))})">{A.SPARKLE}</g>'
    icon(tile + '_gilded', A.GILD_BG, [body, spark], k=k, dx=dx, dy=dy, ground=ground)


# ================================================================ pets
def ring(cx, cy, r, col, w=3):
    """a ring with the ink either side of it (a goggle's rim)"""
    circle = '<circle cx="{}" cy="{}" r="{}" style="fill: none; stroke: {}; stroke-width: {}"/>'
    return ''.join(circle.format(f(cx), f(cy), f(r), cc, f(ww)) for cc, ww in ((K, w + 3), (col, w)))


def king_head(o, cy):
    """a gnome's head, white with age: goggles down over his eyes, bushy brows, a big moustache, a cog for a crown"""
    face = ''.join(heads.gnome_head(1.0, fem=False, goggles=False)).replace(heads.GHAIR_M, WHITE).replace(heads.GHAIR_MD, WHITE_D)
    tufts = both('M-12 -10 C-17 -12 -23 -11 -24 -7 C-22 -6.5 -21 -5.5 -21 -4 C-19 -4.5 -17 -4 -15.5 -2.5 Z', WHITE, 2.8)
    goggles = [s('M-15.4 -1.6 H15.4 V2.4 H-15.4 Z', WOOD_D, 2.4)]
    for x in (-7, 7):
        look = (0.45 if x > 0 else -0.45, 0.35)
        goggles.append(c(x, 0.4, 6.8, '#D6F1FF', 0) + heads.eye(x, 0.4, 4.3, 4.8, look, w=2.2) + ring(x, 0.4, 7, BRASS, 2.6))
    brows = both('M-2.5 -8.5 C-5 -12.5 -11 -12.5 -14 -9 C-11.5 -9.5 -9 -8.5 -8 -7.5 C-6 -8.5 -4 -8.5 -2.5 -8.5 Z', WHITE, 2.4)
    tash = both('M0 6.5 C-4 4.5 -10 4.5 -14 7.5 C-17 9.5 -19.5 8 -20 4.5 C-22 9 -19 14.5 -13 14.5 C-8 14.5 -3 12.5 0 10.5 Z', WHITE, 2.8)
    nose = c(0, 4.0, 3.6, heads.GSKIN_D, 2.5) + c(-1.0, 3.0, 1.2, '#FFE4D0', 0)
    o.append(g(0, cy, 1.0, [tufts, face] + goggles + [brows, tash, nose]))
    # the crown: a band whose points are a cog's teeth
    band = (f'M-15.5 {f(cy - 10)} C-6 {f(cy - 7.5)} 6 {f(cy - 7.5)} 15.5 {f(cy - 10)} '
            f'L16.5 {f(cy - 17)} C6 {f(cy - 14.5)} -6 {f(cy - 14.5)} -16.5 {f(cy - 17)} Z')
    teeth = ''
    for xc in (-12, -4, 4, 12):
        yb = cy - 14.5 - 2.4 * (xc / 17) ** 2
        a = math.radians(xc * 0.9)
        pts = [(xc - 3.3, yb + 1.5), (xc - 2.3, yb - 5.6), (xc + 2.3, yb - 5.6), (xc + 3.3, yb + 1.5)]
        pts = [(xc + (px - xc) * math.cos(a) - (py - yb) * math.sin(a), yb + (px - xc) * math.sin(a) + (py - yb) * math.cos(a)) for px, py in pts]
        teeth += 'M' + ' L'.join(f'{f(px)} {f(py)}' for px, py in pts) + ' Z '
    o.append(s(teeth, BRASS, 3) + s(band, BRASS, 3.2))
    o.append(c(0, cy - 11.4, 2.4, RED, 1.8) + c(-10, cy - 12.6, 1.2, BRASS_L, 0) + c(10, cy - 12.6, 1.2, BRASS_L, 0))


def tinker_king():
    """the Pint-sized Tinker King: a little gnome with a cog for a crown, in a round brass clockwork suit"""
    o = []
    # the wind-up key in his back, sticking out on the viewer's left
    o.append(windkey(-15, -29, 192, length=12))
    # boots and little legs
    o.append(both('M-12 -13 H-5 V-6 H-12 Z', BRASS_DD, 3))
    o.append(both('M-15 -8 H-3 V0 H-17 C-18 -4 -17 -7 -15 -8 Z', BRASS_D, 3.2))
    # the right arm up behind the suit, holding a little wrench
    o.append(beam('M15 -38 L25 -33', BRASS_DD, 6, 3.5))
    o.append(beam('M26 -34 L31 -48', STEEL, 3.5, 3.2))
    o.append(s('M28 -51 C26 -58 32 -61 36 -58 L33.5 -54.5 L36.5 -52 C37 -47 30.5 -45.5 28 -51 Z', STEEL_L, 2.8))
    o.append(c(26, -34, 5, heads.GSKIN, 3))
    # the suit: a brass ball with a belt of rivets and a clock face
    o.append(e(0, -29, 22, 20, BRASS, 4))
    o.append(s('M-20.5 -18 C-8 -13 8 -13 20.5 -18 L18 -13 C7 -8.5 -7 -8.5 -18 -13 Z', BRASS_D, 2.8))
    for x in (-12, -4, 4, 12):
        o.append(c(x, -13.8 - abs(x) * 0.1, 1.5, BRASS_L, 1.2))
    o.append(ln('M-16 -40 C-12 -45 -6 -47.5 0 -48', BRASS_L, 2.6))
    o.append(c(0, -29, 7.5, STEM, 3) + ln('M0 -29 V-34.5 M0 -29 L4 -27', K, 2.2) + c(0, -29, 1.2, K, 0))
    # the left arm, a hand on his round tummy
    o.append(s('M-16 -38 C-22 -34 -24 -28 -22 -23 L-16 -24 C-17 -28 -16 -32 -12 -35 Z', BRASS_D, 3))
    o.append(c(-18, -22, 5, heads.GSKIN, 3))
    # collar, head, crown
    o.append(e(0, -46.5, 12, 3.6, BRASS_D, 3))
    king_head(o, -60)
    return o


def puffling():
    """a baby Waddlecap: a little walking toadstool, red cap, cream spots, very pleased with itself"""
    o = []
    # stubby legs, mid-waddle
    o.append(s('M-9 -9 L-9.5 -3.5 C-12.5 -3.5 -13.5 0 -10.5 0 H-3 L-3.5 -9 Z', STEM_D, 2.8))
    o.append(s('M3.5 -10 L4 -4.5 C2 -4.5 1.5 -1 4.5 -1 H12 C14.5 -1 14 -4.5 10.5 -4.5 L9.5 -10 Z', STEM_D, 2.8))
    # nub arms, out for joy
    arm = 'M-12 -16.5 C-15.5 -16.5 -19 -19 -20.5 -22.5 C-17 -23.5 -14 -21.5 -12 -20 Z'
    o.append(s(arm, STEM, 2.8) + s(m(arm), STEM, 2.8))
    # the stem, round as a little belly, with a happy face
    o.append(s('M-10.5 -29 C-14.5 -21 -14.5 -12.5 -10 -8 C-5 -4.5 5 -4.5 10 -8 C14.5 -12.5 14.5 -21 10.5 -29 Z', STEM, 3.5))
    o.append(e(-8.4, -13.8, 2.5, 1.5, CHEEK, 0) + e(8.4, -13.8, 2.5, 1.5, CHEEK, 0))
    o.append(heads.eye(-4.6, -19, 3, 3.6, (0.4, 0.5), w=2.2) + heads.eye(4.6, -19, 3, 3.6, (-0.2, 0.5), w=2.2))
    o.append(s('M-4.2 -13.2 C-3 -8.6 3 -8.6 4.2 -13.2 C1.5 -12.4 -1.5 -12.4 -4.2 -13.2 Z', '#7A2A2A', 2))
    o.append(s('M-1.9 -10.3 C-1 -11.5 1.3 -11.5 2.1 -10.4 C1 -9.6 -1 -9.6 -1.9 -10.3 Z', '#F08A8A', 0))
    # the cap, tipped a little with the waddle
    cap = [s('M-23 -27 C-25 -43 -13.5 -52 0 -52 C13.5 -52 25 -43 23 -27 C13.5 -23 -13.5 -23 -23 -27 Z', RED, 3.8)]
    for (x, y, r) in ((-12, -37, 4.2), (4, -45.5, 4.6), (14.5, -34, 3.4), (-1, -32.5, 2.6)):
        cap.append(c(x, y, r, BONE, 2.2))
    cap.append(ln('M-17.5 -41 C-13.5 -47 -8 -49.5 -2.5 -50', CAP_L, 2.4))
    o.append('<g transform="rotate(-7 0 -27)">' + ''.join(cap) + '</g>')
    # a happy little puff
    o.append(c(24, -46.5, 3, BONE, 2) + c(28.5, -50.5, 3.8, BONE, 2) + c(30.5, -45, 2.4, BONE, 2))
    return o


def pets(sprite, icon):
    o = tinker_king()
    sprite('pet_tinker', (-46, -86, 92, 90), o)
    icon('c_pet_tinker', '#2F5266', o, k=0.68, dx=2, ground=60)
    gilded(sprite, icon, 'pet_tinker', 'c_pet_tinker', (-46, -86, 92, 90), o, BRASS_GILD, k=0.68, dx=2, ground=60)
    o = puffling()
    sprite('pet_puffling', (-35, -60, 70, 64), o)
    icon('c_pet_puffling', '#3E6B3A', o, k=0.92, ground=56)


# ================================================================ mount
BLANKET, SEAT = '#3F7F6A', '#7A4A2A'


def beetle_leg(hip, knee, foot, col, joint, fwd=1):
    """a jointed brass leg: a thigh up to a round knee, a shin down, a foot pad pointing forward (fwd=1) or back"""
    (hx, hy), (kx, ky), (fx, fy) = hip, knee, foot
    o = beam(f'M{f(hx)} {f(hy)} L{f(kx)} {f(ky)} L{f(fx)} {f(fy - 5)}', col, 9, 4)
    pad = f'M{f(fx - 7 * fwd)} -6.5 H{f(fx + 6 * fwd)} C{f(fx + 10 * fwd)} -6 {f(fx + 10 * fwd)} 0 {f(fx + 5 * fwd)} 0 H{f(fx - 7 * fwd)} Z'
    return o + s(pad, col, 3.2) + c(kx, ky, 5, joint, 3)


def beetle():
    """the Clockwork Beetle: a brass shell full of rivets, six jointed legs, lamp eyes, a key in its back"""
    o = [halo(82, -63, 14, FLAME, 0.4)]
    # the far legs and the far antenna, darker
    for leg, fwd in ((((-28, -42), (-46, -58), (-60, -3)), -1), (((12, -40), (24, -58), (32, -3)), 1), (((52, -42), (76, -58), (98, -3)), 1)):
        o.append(beetle_leg(*leg, BRASS_DD, BRASS_D, fwd))
    o.append(beam('M74 -78 C74 -96 82 -110 92 -116', BRASS_DD, 3, 3.2) + c(93, -117, 3.8, BRASS_D, 2.6))
    # the key in its back
    o.append(windkey(-54, -94, -135, length=12, k=1.4))
    # its belly and head
    o.append(s('M-68 -44 C-54 -30 40 -30 58 -38 L52 -50 C14 -44 -36 -44 -64 -54 Z', BRASS_DD, 3.5))
    o.append(s('M58 -74 C70 -82 88 -78 94 -64 C98 -52 92 -42 80 -41 C70 -40 60 -45 56 -56 Z', BRASS, 4))
    o.append(s('M90 -47 C98 -48 104 -44 105 -38 C101 -40 96 -41 89 -42 Z', BRASS_D, 2.8))
    # the shell: brass plates, a riveted strip along its edge, a shine
    shell = 'M-76 -46 C-84 -78 -62 -110 -18 -112 C14 -113 38 -98 42 -76 C45 -60 42 -48 36 -42 C6 -35 -46 -35 -76 -46 Z'
    o.append(s(shell, BRASS, 4.5))
    o.append(s('M-70 -51 C-44 -43 4 -43 32 -48 L33 -55 C4 -49 -44 -49 -72 -58 Z', BRASS_D, 2.6))
    for x in (-56, -37.5, -19, -0.5, 18):
        o.append(c(x, -48 - 6.2 * ((x + 19) / 50) ** 2, 1.8, BRASS_L, 1.4))
    o.append(ln('M-58 -64 C-56 -84 -42 -98 -20 -103', BRASS_D, 2.6))
    for (x, y) in ((-56, -76), (-48, -90), (-34, -99)):
        o.append(c(x, y, 1.8, BRASS_L, 1.4))
    o.append(ln('M-68 -76 C-62 -90 -50 -100 -36 -104', BRASS_L, 3))
    # the thorax plate over its shoulders
    o.append(s('M26 -90 C42 -98 62 -90 66 -74 C70 -58 64 -46 56 -42 C44 -38 32 -40 24 -46 C18 -60 18 -80 26 -90 Z', BRASS, 4))
    o.append(ln('M32 -87 C42 -92 54 -89 60 -82', BRASS_L, 2.6) + c(34, -50, 1.8, BRASS_L, 1.4) + c(54, -48, 1.8, BRASS_L, 1.4))
    # a blanket and a saddle
    o.append(s('M-30 -108 C-22 -118 16 -118 24 -106 L26 -84 C8 -78 -24 -78 -36 -86 Z', BLANKET, 3.5))
    o.append(ln('M-34 -88 C-20 -82 8 -82 24 -87', GOLD, 3))
    o.append(s('M-22 -117 C-20 -128 14 -128 16 -117 L14 -108 H-20 Z', SEAT, 3.5))
    o.append(s('M9 -129 C9 -137 18 -137 18 -129 L16 -116 H10 Z', SEAT, 3))
    # the near legs
    for leg, fwd in ((((-40, -42), (-62, -60), (-80, -3)), -1), (((-2, -40), (-14, -58), (-24, -3)), -1), (((40, -42), (62, -60), (82, -3)), 1)):
        o.append(beetle_leg(*leg, BRASS_D, BRASS_L, fwd))
    # the near antenna and the lamp eye
    o.append(beam('M84 -76 C88 -92 98 -102 108 -104', BRASS_D, 3, 3.2) + c(109, -104, 4, BRASS_L, 2.6))
    o.append(c(90, -68, 6, BRASS_D, 3) + c(90, -68, 3.6, FLAME, 2))
    o.append(c(80, -61, 8.5, BRASS_D, 3.2) + c(80, -61, 5.4, FLAME, 2.2) + c(78, -63, 1.8, '#FFFFFF', 0))
    return o


def mounts(sprite, icon):
    o = beetle()
    vb = (-96, -142, 214, 148)
    sprite('mount_beetle', vb, o)
    icon('c_mount_beetle', '#2F4F5E', o, k=0.4, dx=-5, ground=59)
    gilded(sprite, icon, 'mount_beetle', 'c_mount_beetle', vb, o, BRASS_GILD, k=0.4, dx=-5, ground=59)


# ================================================================ trophies
def toad_cap():
    """Old Toadstool's own cap on a peg: big, spotty, red-brown, with a bite out of its rim"""
    o = [s('M-17 -8 H17 V0 H-17 Z', WOOD_D, 3), s('M-4 -24 H4 V-8 H-4 Z', WOOD, 3)]
    cap = [s('M-24 -28 C-14 -21 12 -21 24 -27 C16 -16 -16 -16 -24 -28 Z', STEM_D, 2.6)]
    cap.append(ln('M-12 -22 L-9 -19 M0 -21.5 V-18 M12 -22 L9 -19', GILL, 2))
    cap.append(s('M-26 -28 C-29 -47 -15 -61 1 -61 C17 -61 29 -49 27 -32 L22 -30.5 L19.5 -35.5 L15.5 -27.5 '
                 'C5 -24.5 -15 -24.5 -26 -28 Z', TOAD, 3.8))
    for (x, y, rx, ry) in ((-14, -41, 5.2, 4.6), (3, -52, 4.8, 3.8), (15, -43, 3.8, 4.2), (-2, -36, 3.2, 2.8), (-20, -31, 2.4, 2.2)):
        cap.append(e(x, y, rx, ry, BONE, 2.2))
    cap.append(ln('M-20 -46 C-16 -53 -9 -57 -2 -58', TOAD_L, 2.4))
    o.append('<g transform="rotate(-6 0 -24)">' + ''.join(cap) + '</g>')
    return o


def brass_key():
    """the Little Brass Key: a chunky key with a cog for a bow and a green ribbon, standing in a block"""
    o = [s('M-14 -8 H14 L12 0 H-12 Z', WOOD_D, 3)]
    o.append(beam('M0 -9 V-46', BRASS, 6.5, 3.5))
    o.append(s('M2.5 -12 H12 V-17 H8 V-21 H12 V-26 H2.5 Z', BRASS, 2.8))
    o.append(ln('M-1.4 -14 V-34', BRASS_L, 2))
    o.append(cog(0, -56, 10.5, 15, 8, BRASS, 3.2, phase=-90 + 22.5))
    o.append(c(0, -56, 4.6, '#3A2E2A', 2.6) + ln('M-8 -63 C-5 -66 0 -67 4 -66', BRASS_L, 2.2))
    # the ribbon, tied at its neck
    o.append(s('M-1 -40 L-8 -31 L-4.5 -31.5 L-3.5 -28 L1 -39 Z', RIB, 2.4) + s('M1 -40 L8 -32 L4.5 -32 L3.5 -28.5 L-1 -39 Z', RIB, 2.4))
    bow = 'M0 -40 C-4 -46 -11 -45.5 -10.5 -40.5 C-10 -36 -4.5 -36.5 0 -40 Z'
    o.append(s(bow, RIB, 2.6) + s(m(bow), RIB, 2.6) + c(0, -40, 2.6, RIB_D, 2.2))
    return o


def golden_cog():
    """the Golden Cog, standing in a little wooden cradle"""
    o = [s('M-21 -8 H21 V0 H-21 Z', WOOD_D, 3)]
    o.append(cog(0, -34, 17, 23, 10, GOLD, 3.5, phase=-90 + 18))
    o.append(c(0, -34, 11.5, GOLD_D, 2.6) + c(0, -34, 5.5, GOLD, 2.6) + c(0, -34, 2.2, WOOD_D, 0))
    o.append(ln('M-14 -44 C-11 -49 -6 -52 0 -53', '#FFF3C4', 2.6))
    cradle = 'M-21 -8 V-17 C-15 -17 -11 -14 -9 -8 Z'
    o.append(s(cradle, WOOD, 3) + s(m(cradle), WOOD, 3))
    return o


def cuckoo_clock():
    """the Tinker King's cuckoo clock on its little legs: steep roof, carved leaves, a door above its face"""
    o = [s('M-19 -6 H19 V0 H-19 Z', WOOD_D, 3)]
    leg = 'M-13.5 -20 H-8.5 V-6 H-13.5 Z'
    o.append(s(leg, WOOD_D, 3) + s(m(leg), WOOD_D, 3))
    o.append(beam('M0 -20 V-11', GOLD_D, 2, 3) + c(0, -10.5, 4.3, BRASS, 2.6))
    # the house and its face
    o.append(s('M-15 -18 V-44 L0 -59 L15 -44 V-18 Z', WOOD, 3.5))
    o.append(c(0, -31, 9, STEM, 3) + ln('M0 -31 V-37 M0 -31 L4.3 -28.6', K, 2.4) + c(0, -31, 1.3, K, 0))
    o.append(s('M-3.8 -43.5 V-48 C-3.8 -52.6 3.8 -52.6 3.8 -48 V-43.5 Z', WOOD_D, 2.4) + c(1.9, -47, 0.9, GOLD, 0))
    # the roof, and the carved leaves on its top
    leaf = 'M0 -67 C-5 -70 -9 -75 -8 -80 C-3 -79 0 -73 0 -67 Z'
    o.append(s(leaf, RUST, 2.4) + s(m(leaf), RUST, 2.4) + s('M0 -67 C-3 -72 -2.5 -79 0 -83 C2.5 -79 3 -72 0 -67 Z', RUST, 2.4))
    o.append(s('M-24 -41 L0 -68 L24 -41 L19 -38 L0 -59 L-19 -38 Z', WOOD_D, 3.2))
    o.append(s('M-15 -18 H15 V-14 H-15 Z', WOOD_D, 2.6))
    return o


def spore_dye():
    """the Sporeglow Dye on the log's shelf: a flask glowing mushroom green, a toadstool's cap on its cork"""
    flask = 'M-8 -44 H8 V-36 C20 -32 24 -20 20 -10 C16 0 -16 0 -20 -10 C-24 -20 -20 -32 -8 -36 Z'
    o = [halo(0, -22, 26, GRN, 0.3), s(flask, GRN_L, 0)]
    o.append(s('M-21.5 -19 C-12 -14 12 -14 21.5 -19 C22 -14 21.5 -12 20 -10 C16 0 -16 0 -20 -10 C-21.5 -12 -22 -14 -21.5 -19 Z', GRN, 0))
    o.append(ln('M-21.5 -19 C-12 -14 12 -14 21.5 -19', '#6FB83A', 2.4))
    o.append(c(-6, -9, 2.2, GRN_L, 0) + c(7, -12, 1.6, GRN_L, 0) + c(2, -26, 1.4, '#FFFFFF', 0))
    o.append(s(flask, 'none', 3.5) + ln('M-14 -28 L-17 -20', '#FFFFFF', 2.6))
    o.append(s('M-9 -52 H9 V-44 H-9 Z', RUST, 3) + ln('M-5 -48.5 H5', WOOD_D, 2))
    o.append(s('M-13 -51 C-13 -63 13 -63 13 -51 C6 -48.5 -6 -48.5 -13 -51 Z', RED, 3) + c(-5, -56, 2.2, BONE, 1.6) + c(5, -58, 1.8, BONE, 1.6))
    return o


CAP_GILD = {TOAD: '#E7B53C', TOAD_L: '#FFE08A', BONE: '#FFF3C4', STEM_D: '#F2D27A', GILL: '#B8862A'}


def trophies(sprite, icon):
    o = toad_cap()
    sprite('tr_cap', (-34, -68, 68, 72), o)
    icon('c_cap', '#4E6B3A', o, k=0.92, ground=60)
    gilded(sprite, icon, 'tr_cap', 'c_cap', (-34, -68, 68, 72), o, CAP_GILD, k=0.92, ground=60)
    o = brass_key()
    sprite('tr_brass_key', (-22, -76, 44, 80), o)
    icon('c_brass_key', '#3E3258', o, k=0.82, ground=62)
    o = golden_cog()
    sprite('tr_cog', (-28, -62, 56, 66), o)
    icon('c_cog', '#2D4568', o, k=0.9, ground=59)
    o = cuckoo_clock()
    sprite('tr_cuckoo', (-28, -88, 56, 92), o)
    icon('c_cuckoo', '#4E6B45', o, k=0.66, ground=60)
    o = spore_dye()
    sprite('tr_dye_spore', (-28, -68, 56, 72), o)
    icon('c_dye_spore', '#3A3150', o, k=0.84, ground=60)


def build(sprite, icon):
    pets(sprite, icon)
    mounts(sprite, icon)
    trophies(sprite, icon)
