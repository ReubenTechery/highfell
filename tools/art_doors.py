# The Hall of Doors: the house's cellar has a door for every dungeon, each in its own dungeon's style, and an arch
# bricked up with a chalk "?" for each one still to come. A dungeon's door is drawn in four states, so the house
# shows how far you've got: plain (shut and dark) until you've cleared it, lit once you have, a gold trim once its
# collection log is finished, and gilded once its Heroic log is. The glow round a lit door is the house's own
# (src/ui/halldoors.ts draws it, so it can pulse). Same locked style: one ink, flat colour, gradients only for
# light, every sprite round its ground point (0, 0), the bottom middle of the door on the cellar's floor. The frames
# are all about 190 wide and 250 to 300 tall, so the doors stand in a row. art_hearth.py's build() calls build(sprite).
import math
import art_sprites as A
from art_sprites import K, s, ln, c, f, STONE, STONE_T, STONE_D, STEEL, GRN, GOLD, GOLD_D
from art_thimble import BRASS, BRASS_L, BRASS_D, CAP, MOSS, MOSS_L, GLOW, cog
from art_thimble2 import mushroom

# a door's four states: the sprite's name ends in one of these
STATES = ('', '_lit', '_gold', '_gilded')
# gold, from its shadow to its shine
G_DEEP, G_LIGHT, G_PALE = '#B8862A', '#FFE08A', '#FFF3C4'


def flags(state):
    """lit (cleared), gold (its log finished), gilt (its Heroic log finished): each state has the ones before it"""
    return state != '', state in ('_gold', '_gilded'), state == '_gilded'


# ---------------------------------------------------------------- shapes
def bez(p, t):
    """the point t of the way along a cubic given by its four points"""
    u = 1 - t
    return tuple(u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * cc + t * t * t * d for a, b, cc, d in zip(*p))


def sub(p, t0, t1):
    """the part of a cubic from t0 to t1, as its four points (de Casteljau, twice)"""
    def split(q, t):
        ab, bc, cd = [tuple(a + (b - a) * t for a, b in zip(q[i], q[i + 1])) for i in range(3)]
        abc, bcd = [tuple(a + (b - a) * t for a, b in zip(u, v)) for u, v in ((ab, bc), (bc, cd))]
        mid = tuple(a + (b - a) * t for a, b in zip(abc, bcd))
        return (q[0], ab, abc, mid), (mid, bcd, cd, q[3])
    right = split(p, t0)[1]
    return split(right, (t1 - t0) / (1 - t0))[0]


def pts(q):
    return ' '.join(f'{f(x)} {f(y)}' for x, y in q)


def arch(hw, spring, ctrl):
    """a round-topped opening standing on the floor: straight sides hw each side of the middle up to `spring`,
    then a curve over the top pulled up towards `ctrl` (its top is three quarters of the way from spring to ctrl)"""
    return f'M{f(-hw)} 0 V{f(spring)} C{f(-hw)} {f(ctrl)} {f(hw)} {f(ctrl)} {f(hw)} {f(spring)} V0 Z'


def curve(a):
    """an arch's curve over the top, as a cubic's four points, left to right"""
    hw, spring, ctrl = a
    return (-hw, spring), (-hw, ctrl), (hw, ctrl), (hw, spring)


def y_at(p, x):
    """how high a cubic that runs left to right is over x"""
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if bez(p, mid)[0] < x else (lo, mid)
    return bez(p, lo)[1]


def arch_y(a, x):
    """how high an arch's curve is over x, between its sides"""
    return y_at(curve(a), x)


def arch_x(a, y):
    """how far either side of the middle an arch is at height y"""
    if y >= a[1]:
        return a[0]
    lo, hi = 0.0, a[0]
    for _ in range(30):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if arch_y(a, mid) > y else (mid, hi)
    return lo


def stonework(inner, outer, joint):
    """the joints of a stone arch: across the jambs, and out from the opening through the curve"""
    d = [f'M{f(2 - outer[0])} {y} H{f(-inner[0])} M{f(inner[0])} {y} H{f(outer[0] - 2)}' for y in (-42, -86, -130, -172)]
    for k in range(1, 7):
        d.append('M' + pts([bez(curve(inner), k / 7)]) + ' L' + pts([bez(curve(outer), k / 7)]))
    return ln(' '.join(d), joint, 3)


def glint(x, y, r):
    """a four-pointed sparkle on gold"""
    q = r * 0.26
    return s(f'M{f(x)} {f(y - r)} L{f(x + q)} {f(y - q)} L{f(x + r)} {f(y)} L{f(x + q)} {f(y + q)} L{f(x)} {f(y + r)} '
             f'L{f(x - q)} {f(y + q)} L{f(x - r)} {f(y)} L{f(x - q)} {f(y - q)} Z', G_PALE, 2)


def leaf(x, y, sx):
    """an ivy leaf growing out from the edge of a frame at (x, y), towards the middle (sx is 1 from the left)"""
    return s(f'M{f(x)} {f(y)} C{f(x + sx * 8)} {f(y - 7)} {f(x + sx * 13)} {f(y + 4)} {f(x + sx * 20)} {f(y - 1)} '
             f'C{f(x + sx * 20)} {f(y + 8)} {f(x + sx * 11)} {f(y + 12)} {f(x)} {f(y + 11)} Z', '#5E8A4E', 3)


# ================================================================ Barrow Crypt: the green crypt door
# its stone arch, the gold moulding of the trim, the dark round the door, the gap the light shows in, the door itself
B_OUT, B_TRIM, B_RIM, B_GAP, B_DOOR = (94, -196, -296), (76, -192, -280), (66, -190, -270), (61, -189, -266), (51, -186, -256)


def barrow(state):
    """the way down to the Barrow: a stone arch with a skull on its keystone, an old door with iron bands, and the
    Gravekeeper's green light round its edges once you've been in"""
    lit, gold, gilt = flags(state)
    stone, joint = (GOLD, GOLD_D) if gilt else (STONE, STONE_D)
    wood, plank = ('#E7B53C', G_DEEP) if gilt else ('#5E4A3A', '#4A3A2E')
    band = G_DEEP if gilt else GOLD if gold else '#4A4458'
    stud = G_PALE if gold else STEEL
    o = [s(arch(*B_OUT), stone, 5), stonework(B_RIM, B_OUT, joint)]
    if gilt:
        o.append(ln('M-84 -24 V-172 C-84 -220 -62 -252 -30 -264', '#FFE9A8', 3.4))
    if gold:
        o.append(s(arch(*B_TRIM), GOLD, 4) + ln('M-71 -12 V-188 C-71 -228 -50 -258 -16 -268', G_PALE, 3))
    # the dark round the door, the light in the gap (dark until you've been in), the door and its planks
    o.append(s(arch(*B_RIM), '#22301F', 4))
    o.append(s(arch(*B_GAP), GRN if lit else '#3B4636', 0))
    o.append(s(arch(*B_DOOR), wood, 4))
    o.append(ln(' '.join(f'M{x} -5 V{f(arch_y(B_DOOR, x) + 6)}' for x in (-26, 0, 26)), plank, 3))
    # two bands across it with their studs, and the ring
    for y in (-66, -176):
        o.append(s(f'M-51 {y} H51 V{y + 13} H-51 Z', band, 3.5) + ''.join(c(x, y + 6.5, 3.2, stud, 2) for x in (-38, -13, 13, 38)))
    ring = 'M22 -120 C22 -136 42 -136 42 -120 C42 -104 22 -104 22 -120'
    o.append(ln(ring, K, 7) + ln(ring, band if gold else STEEL, 3.5))
    # the keystone and its skull, whose eyes are the door's light
    o.append(s('M-23 -298 H23 L18 -260 H-18 Z', GOLD if gold else STONE_T, 4))
    skull = A.skull(0, -282, 0.95, GRN if lit else '#4A4458')
    o.append(A.gild(skull) if gilt else skull)
    o.append(leaf(-94, -150, 1) + leaf(-94, -34, 1) + leaf(94, -92, -1))
    if gilt:
        o.append(glint(-60, -236, 9) + glint(72, -150, 7) + glint(-30, -40, 6))
    return o


# ================================================================ Thimblebriar Hollow: the round burrow door
# the hill's left side as a cubic (the right is its mirror), and the doorway: an oval round (0, T_MID), the opening
# (T_IN radii) inside its ring of stones (T_OUT)
T_HILL = ((-96, 0), (-99, -120), (-76, -244), (0, -252))
T_MID, T_IN, T_OUT = -82, (62, 70), (80, 90)


def oval(r, deg):
    """a point on the doorway's oval with radii r, at deg degrees (0 to the right, -90 straight up)"""
    return r[0] * math.cos(math.radians(deg)), T_MID + r[1] * math.sin(math.radians(deg))


def door_curve(hw, top):
    """the left half of a round-topped doorway's curve, hw either side of the middle, its top at `top`"""
    return (-hw, T_MID), (-hw, T_MID - (T_MID - top) * 0.8), (-hw * 0.55, top), (0, top)


def doorway(hw, top):
    """a round-topped opening standing on the floor: its sides straight up to T_MID, then round over to `top`"""
    q = door_curve(hw, top)
    r = tuple((-x, y) for x, y in reversed(q))
    return f'M{f(-hw)} 0 V{T_MID} C{pts(q[1:])} C{pts(r[1:])} V0 Z'


def thimble(state):
    """Thimblebriar's way in: the gnomes' round green door in its mossy hill, a ring of stones round it with a cog on
    the keystone, more cogs sunk in the earth, a porthole that glows once you've been in, toadstools at the foot"""
    lit, gold, gilt = flags(state)
    brass, shine, hub = (GOLD, G_PALE, GOLD_D) if gilt else (BRASS, BRASS_L, BRASS_D)
    left, right = T_HILL, tuple((-x, y) for x, y in reversed(T_HILL))
    o = [s(f'M{pts(left[:1])} C{pts(left[1:])} C{pts(right[1:])} Z', '#7A5234')]
    # a cap of moss that follows the hill's top exactly, and roots in its sides
    l2, r2 = sub(left, 0.44, 1), sub(right, 0, 0.56)
    o.append(s(f'M{pts(l2[:1])} C{pts(l2[1:])} C{pts(r2[1:])} C82 -148 76 -158 75 -166 C71 -160 66 -166 66 -174 '
               f'C52 -206 28 -224 0 -226 C-28 -224 -52 -206 -66 -174 C-66 -166 -71 -160 -75 -166 C-76 -158 -82 -148 {pts(l2[:1])} Z', MOSS))
    o.append(s('M-74 -184 C-62 -216 -36 -238 -8 -244 C-32 -232 -52 -212 -64 -186 Z', MOSS_L, 0))
    o.append(ln('M-90 -112 C-92 -98 -88 -86 -92 -74 M90 -60 C92 -48 88 -38 91 -26 M-93 -40 C-95 -28 -91 -20 -94 -10', '#4B311E', 3.4))
    # cogs sunk in the earth: a big one high on the right, a small one on the left
    o.append(cog(58, -172, 21, 9, brass, 3.6, hub=hub, holes=3, turn=0.15) + cog(-70, -124, 13, 8, shine, 3.2, turn=0.3))
    # the ring of stones round the doorway (gold with the trim), and the keystone with its cog
    for i in range(9):
        q = [oval(T_IN, 180 + 20 * i), oval(T_IN, 200 + 20 * i), oval(T_OUT, 200 + 20 * i), oval(T_OUT, 180 + 20 * i)]
        col = (GOLD if i % 2 else G_LIGHT) if gold else ('#9E8C78' if i % 2 else '#8C7A68')
        o.append(s('M' + ' L'.join(pts([p]) for p in q) + ' Z', col, 3.6))
    for sx in (-1, 1):
        for j, (y0, y1) in enumerate(((0, -28), (-28, -56), (-56, T_MID))):
            col = (G_LIGHT if j % 2 else GOLD) if gold else ('#8C7A68' if j % 2 else '#9E8C78')
            o.append(s(f'M{sx * 62} {y0} H{sx * 80} V{y1} H{sx * 62} Z', col, 3.6))
    o.append(s('M-13 -176 H13 L10 -152 H-10 Z', G_LIGHT if gold else '#9E8C78', 3.6) + cog(0, -164, 8, 8, brass, 2.6, shine=False))
    # the doorway, the lamplight round the door once you've been in, and the round green door, shut: its planks,
    # brass hinges and knob, and the porthole
    o.append(s(doorway(64, -154), '#3A2618', 3.6))
    if lit:
        o.append(s(doorway(59, -149), '#FFB347', 0))
    wood, plank = ('#E7B53C', G_DEEP) if gilt else ('#4E8F47', '#3E7238')
    o.append(s(doorway(50, -140), wood, 3.4))
    o.append(ln(' '.join(f'M{x} -4 V{f(y_at(door_curve(50, -140), -abs(x)) + 6)}' for x in (-26, 0, 26)), plank, 2.8))
    for y in (-34, -112):
        o.append(s(f'M-50 {y} H-20 C-16 {y} -14 {y + 3} -14 {y + 5} C-14 {y + 7} -16 {y + 10} -20 {y + 10} H-50 Z', brass, 2.8) + c(-41, y + 5, 2, shine, 0))
    o.append(c(32, -58, 6.4, brass, 3) + c(30.6, -59.6, 1.8, shine, 0))
    o.append(c(0, -100, 17, brass, 3.4) + c(0, -100, 11.5, GLOW if lit else '#2A2234', 2.6))
    if lit:
        o.append(c(0, -100, 6, '#FF9F43', 0) + c(-3.4, -103.4, 2.2, '#FFFFFF', 0))
    o.append(ln('M-11.5 -100 H11.5 M0 -111.5 V-88.5', K, 2.2))
    # toadstools at the foot of the hill, gold when gilded
    for x, base, top, half in ((-86, 3, -36, 14), (-68, 3, -20, 9), (84, 3, -32, 13), (100, 3, -18, 8)):
        o += mushroom(x, base, top, half, cap=GOLD if gilt else CAP, spots=half > 10, w=3.4, stalk_w=half * 0.38)
    if gilt:
        o.append(glint(-30, -132, 8) + glint(44, -40, 6) + glint(-44, -204, 7))
    return o


# ================================================================ a dungeon still to come
S_OUT, S_IN = (92, -192, -288), (62, -186, -262)


def bricked():
    """a dungeon still to come: a stone arch bricked up, with a chalk question mark"""
    o = [s(arch(*S_OUT), STONE, 5), stonework(S_IN, S_OUT, STONE_D), s(arch(*S_IN), '#5E5470', 4)]
    # rows of bricks, their joints staggered, each row only as wide as the arch is there
    d = []
    for i, y in enumerate(range(-26, -260, -26)):
        w, top = arch_x(S_IN, y), arch_x(S_IN, y - 26)
        if w < 14:
            break
        d.append(f'M{f(-w)} {y} H{f(w)}')
        d += [f'M{x} {y} V{y - 26}' for x in range(-50 if i % 2 else -30, 62, 40) if abs(x) < top - 6]
    o.append(ln(' '.join(d), '#4A4060', 3))
    o.append(ln('M-16 -152 C-16 -176 18 -176 18 -154 C18 -136 0 -136 0 -116 M0 -98 V-96', '#E9E4D8', 6))
    return o


def build(sprite):
    for st in STATES:
        sprite('door_barrow' + st, (-100, -304, 200, 308), barrow(st))
        sprite('door_thimble' + st, (-106, -258, 216, 262), thimble(st))
    sprite('door_soon', (-98, -270, 196, 274), bricked())
