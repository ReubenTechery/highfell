# The heroes' heads: the four faces, and the back of each head. Each is drawn once around the middle of the
# eyes (0, 0) and placed by art_heroes.py with a scale; `k` is that scale, and every line width is divided by
# it so a scaled head keeps the one ink weight. The elf returns two parts: the long hair that falls behind
# the body, then the head itself.
import re
from art_sprites import K, s, ln, c, e, both, halo, f, BONE, BONE_D, GRN, GRN_L, GOLD, FROST

# skin, hair and eyes
DSKIN, DSKIN_D, BEARD, BEARD_D = '#F2B48C', '#E0956C', '#E2733A', '#B8552A'
HSKIN, HSKIN_D, HAIR, HAIR_L = '#A86F4C', '#8E5A3B', '#3E2A1E', '#684936'
ESKIN, ESKIN_D, EHAIR, EHAIR_D, ELF_BROW = '#F3D7C4', '#E3B9A2', '#EEF2F6', '#C9D4E0', '#8D93B2'
GSKIN, GSKIN_D, GBLUSH = '#F5C4A2', '#E29874', '#F29B9B'
GHAIR_M, GHAIR_MD, GHAIR_F, GHAIR_FD, GHAIR_FL = '#F2A63B', '#BA7218', '#E66048', '#AC3B26', '#F89882'
GBSKIN, GBSKIN_D = '#78C242', '#4E8C24'
GBHAIR_M, GBHAIR_F, GBHAIR_FD = '#2D2438', '#A8284E', '#6B1630'
HBLUE = '#4F86C6'

TOK = re.compile(r'[A-Za-z]|-?\d*\.?\d+')


def tp(d, dx=0.0, dy=0.0, k=1.0, mx=1):
    """move, scale and (mx=-1) mirror a path written in absolute commands"""
    out, cmd, i = [], None, 0
    for t in TOK.findall(d):
        if t.isalpha():
            assert t.isupper() and t != 'A', 'tp() takes absolute commands, no arcs'
            cmd, i = t, 0
            out.append(cmd)
            continue
        v = float(t)
        if cmd == 'H' or (cmd != 'V' and i % 2 == 0):
            v = dx + v * k * mx
        else:
            v = dy + v * k
        i += 1
        out.append(f(v))
    return ' '.join(out)


def eye(x, y, rx, ry, look=(0.6, 0.5), w=2.4):
    """a white eye with a black pupil and a tiny white catchlight"""
    px, py = x + look[0], y + look[1]
    r = min(rx, ry)
    return e(x, y, rx, ry, '#FFFFFF', w) + c(px, py, r * 0.48, K, 0) + c(px - r * 0.18, py - r * 0.2, r * 0.16, '#FFFFFF', 0)


def dwarf_face(k=1.0, fem=False):
    """the face only: male has a big copper moustache and scowl; female has warm copper hair locks, rosy cheeks, lashes and a confident smile"""
    W = lambda w: w / k
    if fem:
        # side hair locks behind the cheeks so the head connects into the shoulder braids
        o = [both('M-11 -6 C-16.5 -2 -17.5 7 -14 14 L-9 10 Z', BEARD, W(3))]
        o.append(s('M-13.5 -2 C-14 -14 14 -14 13.5 -2 C13.5 7.5 8 13.5 0 14 C-8 13.5 -13.5 7.5 -13.5 -2 Z', DSKIN, W(3.3)))
        # soft rosy cheek blush
        o.append(e(-8.2, 4.2, 3.0, 1.8, DSKIN_D, 0) + e(8.2, 4.2, 3.0, 1.8, DSKIN_D, 0))
        for mx in (1, -1):
            o.append(eye(5.5 * mx, -0.2, 3.6, 4.2, (0.45 * mx, 0.3), w=W(2.2)))
            # clean outer eyelash wing
            o.append(ln(tp('M8.2 -2.0 L10.8 -3.8', mx=mx), K, W(2.3)))
            # warm copper-brown arched brow
            o.append(ln(tp('M2.0 -6.0 C5.2 -7.6 9.0 -7.5 11.2 -5.6', mx=mx), BEARD_D, W(2.6)))
        # cute button nose and warm smile
        o.append(c(0, 3.2, 2.7, DSKIN_D, W(2.3)))
        o.append(ln('M-4.2 8.4 C-1.8 10.8 1.8 10.8 4.2 8.4', K, W(2.4)))
        # parted copper bangs framing the top of the forehead
        o.append(s('M-14.5 -4.5 C-15.5 -14.5 -7 -16.5 0 -11.5 C7 -16.5 15.5 -14.5 14.5 -4.5 C11.5 -9.5 5.5 -11 0 -9.2 C-5.5 -11 -11.5 -9.5 -14.5 -4.5 Z', BEARD, W(3)))
        return o
    o = [e(0, 1.5, 15, 12.5, DSKIN, W(3.5))]
    for mx in (1, -1):
        o.append(eye(6 * mx, 0, 3.6, 4.2, (0.6 * mx, 0.5), w=W(2.4)))
    o.append(ln('M-12.5 -6.8 L-2.2 -4.5 M12.5 -6.8 L2.2 -4.5', K, W(3.6)))
    o.append(s('M-13 9.5 C-8 5.5 -3 7.2 0 9.5 C3 7.2 8 5.5 13 9.5 C9.5 13.8 3 13.8 0 12.2 C-3 13.8 -9.5 13.8 -13 9.5 Z', BEARD, W(3)))
    o.append(c(0, 5.5, 4.8, DSKIN_D, W(3)))
    return o


def dwarf_back(k=1.0):
    """the back of the head: all hair, the beard showing past the cheeks"""
    W = lambda w: w / k
    o = [both('M-12 6 C-18 8 -20 14 -17 20 C-14 18 -12 14 -10 11 Z', BEARD, W(3))]
    o.append(e(0, 1.5, 15, 12.5, BEARD, W(3.5)))
    o.append(ln('M-6 -6 C-8 0 -8 6 -6 11 M6 -6 C8 0 8 6 6 11', BEARD_D, W(2.2)))
    return o


def human_head(k=1.0, bun=True, circlet=True, fem=True):
    W = lambda w: w / k
    if not fem:
        # square jawed paladin/cleric head with groomed beard, moustache, high hair wave and tall 3-ray sun crown
        o = [both('M-12.5 -1 C-15 -1 -15 4.5 -12.2 5.2 Z', HSKIN, W(2.5))]
        if circlet:
            # tall 3-spired golden sun-crown rising above the hair
            o.append(s('M-12 -11 L-13.5 -23 L-5.5 -16.5 L0 -26.5 L5.5 -16.5 L13.5 -23 L12 -11 Z', GOLD, W(2.8)))
        o.append(s('M-12.8 -2 C-12.8 -17 12.8 -17 12.8 -2 C12.6 8.5 9.5 15.5 0 16.5 C-9.5 15.5 -12.6 8.5 -12.8 -2 Z', HSKIN, W(3.2)))
        # full groomed beard & moustache around the jaw with warm highlight
        o.append(s('M-12.2 3.5 C-10.5 9 -6.5 10.5 0 10.5 C6.5 10.5 10.5 9 12.2 3.5 C12 11.5 8.5 16.8 0 17.2 C-8.5 16.8 -12 11.5 -12.2 3.5 Z', HAIR, W(2.8)))
        o.append(s('M-8.5 9.2 C-5 6.8 -1.5 7.5 0 9 C1.5 7.5 5 6.8 8.5 9.2 C6 11.5 2.5 11.5 0 10.4 C-2.5 11.5 -6 11.5 -8.5 9.2 Z', HAIR_L, W(2.2)))
        o.append(ln('M-3.2 11.8 H3.2', HSKIN, W(1.8)))
        for mx in (1, -1):
            o.append(eye(5.3 * mx, -0.4, 3.2, 3.6, (0.45 * mx, 0.4), w=W(1.9)))
            o.append(ln(tp('M1.5 -5.8 L9.6 -6.8', mx=mx), K, W(3.2)))
        o.append(ln('M0.5 1.8 C-0.8 4.2 -1.8 5.8 -0.4 6.8 L1.8 6.5', HSKIN_D, W(2)))
        # cropped hair beneath the sun-crown
        o.append(s('M-13.4 -1.5 C-16 -19 16 -19 13.4 -1.5 C11 -8.5 5.5 -12 0 -11.5 C-5.5 -12 -11 -8.5 -13.4 -1.5 Z', HAIR, W(3.2)))
        o.append(ln('M-6 -14 C-1 -16.5 4 -16.5 7 -14', HAIR_L, W(2)))
        if circlet:
            o.append(s('M-13 -7.5 L-6 -10.2 L0 -13.5 L6 -10.2 L13 -7.5 L12.5 -5.2 C6 -8 -6 -8 -12.5 -5.2 Z', GOLD, W(2.4)))
            o.append(c(0, -9.2, 2.7, HBLUE, W(1.8)))
        return o
    # female human cleric: warm oval face, clean outer lashes, full bun + side locks framing the cheeks
    o = [s('M-12 0 C-12 -17 12 -17 12 0 C12 10.5 6.5 15.8 0 16.2 C-6.5 15.8 -12 10.5 -12 0 Z', HSKIN, W(3.2))]
    o.append(e(-7.5, 4.2, 2.8, 1.7, HSKIN_D, 0) + e(7.5, 4.2, 2.8, 1.7, HSKIN_D, 0))
    for mx in (1, -1):
        o.append(eye(5.2 * mx, -0.2, 3.3, 3.9, (0.45 * mx, 0.5), w=W(1.8)))
        o.append(ln(tp('M7.8 -2.2 L10.2 -3.8', mx=mx), K, W(2.1)))
        o.append(ln(tp('M1.6 -6.8 C3.8 -8.2 6.8 -8.2 9 -6.4', mx=mx), K, W(2.5)))
    o.append(ln('M0.4 2.4 C-0.8 4.6 -1.8 6.2 -0.6 7.2 L1.4 7', HSKIN_D, W(1.7)))
    o.append(ln('M-3.8 10.4 C-1.6 12.4 1.6 12.4 3.8 10.4', K, W(2.3)))
    o.append(s('M-13 0 C-17 -21 17 -21 13 0 C11 -8.5 5 -12.5 0 -11.5 C-5 -12.5 -11 -8.5 -13 0 Z', HAIR, W(3.2)))
    o.append(both('M-12.8 -1 C-15.8 6 -15.5 14 -11.8 18.5 C-9.8 15 -10.2 8 -10.8 2 Z', HAIR, W(2.6)))
    if bun:
        o.append(c(0, -21, 7.8, HAIR, W(3.2)) + ln('M-4 -22 C-1 -24 2 -24 4.5 -21.5', HAIR_L, W(1.8)))
    if circlet:
        o.append(ln('M-12.5 -8 C-6 -11 6 -11 12.5 -8', GOLD, W(3)) + c(0, -10.5, 2.6, HBLUE, W(1.8)))
    return o


def human_back(k=1.0, bun=True, circlet=True):
    """the back of the head: the hair gathered up into the bun (or under the sun-crown), the circlet's band round the back"""
    W = lambda w: w / k
    o = []
    if not bun and circlet:
        o.append(s('M-12 -11 L-13.5 -23 L-5.5 -16.5 L0 -26.5 L5.5 -16.5 L13.5 -23 L12 -11 Z', GOLD, W(2.8)))
    o.append(s('M-13 1 C-17 -21 17 -21 13 1 C13 9 8 15 0 15 C-8 15 -13 9 -13 1 Z', HAIR, W(3.2)))
    o.append(ln('M-7 9 C-9 0 -7 -9 -2 -14 M7 9 C9 0 7 -9 2 -14', HAIR_L, W(1.8)))
    if bun:
        o.append(c(0, -21, 7.5, HAIR, W(3.2)) + ln('M-4.5 -21 C-2 -18 2 -18 4.5 -21', HAIR_L, W(1.8)))
    if circlet:
        o.append(ln('M-12.8 -6 C-6 -3 6 -3 12.8 -6', GOLD, W(3)))
    return o


ELF_EAR = 'M9.4 -3.2 C14 -5.2 20 -9.4 26.5 -14.5 C23.5 -7.5 17.5 -1.5 10.2 3.8 Z'


def elf_head(k=1.0, back_len=44, hair=EHAIR, hairD=EHAIR_D, fem=True):
    """returns (back, front): female has long silver hair and lashes; male has chiseled jaw, fierce brows, and swept-back silver locks"""
    W = lambda w: w / k
    if fem:
        back = [s(f'M-11.5 -9 C-17.5 6 -18.5 {f(back_len * 0.6)} -14.5 {f(back_len)} L-7.5 {f(back_len - 6)} L0 {f(back_len + 1)} L7.5 {f(back_len - 6)} L14.5 {f(back_len)} C18.5 {f(back_len * 0.6)} 17.5 6 11.5 -9 Z', hair, W(3.2))]
    else:
        back = []
    o = []
    # long ears, swept up and back
    o.append(both(ELF_EAR, ESKIN, W(2.6)))
    o.append(ln('M12.2 -0.8 C16 -3.6 20 -7 23.6 -11 M-12.2 -0.8 C-16 -3.6 -20 -7 -23.6 -11', ESKIN_D, W(1.6)))
    if fem:
        # narrow heart-shaped elven face
        o.append(s('M0 -15.5 C7 -15.5 11.4 -11 11.4 -3.5 C11.4 4.5 5.5 13 0 16 C-5.5 13 -11.4 4.5 -11.4 -3.5 C-11.4 -11 -7 -15.5 0 -15.5 Z', ESKIN, W(3)))
        o.append(e(-6.8, 3.2, 2.5, 1.5, ESKIN_D, 0) + e(6.8, 3.2, 2.5, 1.5, ESKIN_D, 0))
    else:
        # chiseled, broader masculine elven jaw and square chin (clean-shaven high elf)
        o.append(s('M0 -15.5 C8 -15.5 12.4 -11 12.2 -2.5 C12 6 9.2 14.2 3.8 16.0 H-3.8 C-9.2 14.2 -12 6 -12.2 -2.5 C-12.4 -11 -8 -15.5 0 -15.5 Z', ESKIN, W(3.1)))
        # sharp cheekbone contour lines and chin shadow
        o.append(ln('M-9.5 4.5 L-6.8 9.2 M9.5 4.5 L6.8 9.2 M-1.6 13.0 H1.6', ESKIN_D, W(1.6)))
    # crisp white almond eyes with black pupil and catchlight
    for mx in (1, -1):
        ex, ey = 5.2 * mx, -0.6
        o.append(s(tp('M-3.6 0.8 C-2.2 -3.7 2.2 -4.4 4 -1.6 C2.6 2.5 -1.9 3.2 -3.6 0.8 Z', ex, ey, 1, mx), '#FFFFFF', W(1.3)))
        o.append(c(ex + 0.3 * mx, ey - 0.3, 1.75, K, 0) + c(ex - 0.25 * mx, ey - 1.05, 0.65, '#FFFFFF', 0))
        if fem:
            o.append(ln(tp('M0.2 -3.4 C1.8 -3.6 3.4 -2.9 4.2 -1.6 L5.8 -3.0', ex, ey, 1, mx), K, W(1.8)))
            o.append(ln(tp('M-2.8 -6.3 C-0.6 -7.5 2.4 -7.9 4.9 -7.1', ex, ey, 1, mx), ELF_BROW, W(1.9)))
        else:
            o.append(ln(tp('M-0.8 -3.1 C1.4 -3.4 3.2 -2.8 4.1 -1.6', ex, ey, 1, mx), K, W(2)))
            o.append(ln(tp('M-3.4 -4.6 L5.8 -7.8', ex, ey, 1, mx), K, W(3.0)))
    o.append(ln('M0.5 2.6 L-0.9 6.6 L1.1 7', ESKIN_D, W(1.5)))
    if fem:
        o.append(ln('M-2.4 9.8 C-0.6 11 1.2 10.8 2.6 9.4', K, W(1.9)))
        o.append(s('M-12.2 -1 C-14 -14.5 -7.4 -20 0 -20 C7.4 -20 14 -14.5 12.2 -1 C10.8 -8 7 -12.8 1.3 -13.4 L0 -11.6 L-1.3 -13.4 C-7 -12.8 -10.8 -8 -12.2 -1 Z', hair, W(3)))
        o.append(both('M-12.2 -4 C-14.8 4 -15.2 14 -12.8 22 L-10.2 16 C-11.2 9 -11.2 2 -10.6 -5.5 Z', hair, W(2.5)))
    else:
        # confident stern mouth and swept-back silver hair with sharp sideburns
        o.append(ln('M-3.2 10.2 L3.2 9.5', K, W(2.2)))
        o.append(s('M-12.6 -1.5 C-14 -14.5 -7.4 -20 0 -20 C7.4 -20 14 -14.5 12.6 -1.5 C10.5 -9 5.5 -12.5 -2 -12.2 L-7 -8.5 C-9.5 -6.5 -11.2 -4.5 -12.6 -1.5 Z', hair, W(3)))
        o.append(both('M-12.2 -3 L-10.5 6.5 L-8.8 3.5 L-10.2 -5 Z', hair, W(2.2)))
    o.append(ln('M-6 -16.4 C-8.6 -13.4 -9.9 -9.4 -10.5 -5.4 M6 -16.4 C8.6 -13.4 9.9 -9.4 10.5 -5.4', hairD, W(1.6)))
    return back, o


def elf_back(k=1.0, back_len=44, hair=EHAIR, hairD=EHAIR_D, ears=True, fem=True):
    """the back of the head: the ears past the sides, and the long hair falling down the back"""
    W = lambda w: w / k
    L = back_len if fem else 18
    o = [both(ELF_EAR, ESKIN, W(2.6))] if ears else []
    o.append(s(f'M0 -20 C8.5 -20 14 -14 13.4 -4 C17.5 6 18.5 {f(L * 0.6)} 14.5 {f(L)} L7.5 {f(L - 6)} L0 {f(L + 1)} L-7.5 {f(L - 6)} L-14.5 {f(L)} '
               f'C-18.5 {f(L * 0.6)} -17.5 6 -13.4 -4 C-14 -14 -8.5 -20 0 -20 Z', hair, W(3.2)))
    o.append(ln(f'M-5 -13 C-8 0 -9.5 {f(L * 0.45)} -8.5 {f(L - 9)} M5 -13 C8 0 9.5 {f(L * 0.45)} 8.5 {f(L - 9)} M0 -6 V{f(L - 5)}', hairD, W(1.8)))
    return o


def risen_head(k=1.0, glow=1.0, fem=False):
    """a long skull: deep sockets with a green light; male has a broad jaw & heavy brow; female has sculpted high cheekbones & arched spectral sockets"""
    W = lambda w: w / k
    o = [halo(0, 0, 17 * glow, GRN, 0.28)] if glow else []
    if fem:
        # narrower sculpted jaw and high cheekbones
        o.append(s('M-6.8 10 H6.8 C6.5 14.5 4 17.5 0 17.5 C-4 17.5 -6.5 14.5 -6.8 10 Z', BONE, W(2.9)))
        o.append(ln('M-3.2 10.5 V14.2 M0 10.5 V15 M3.2 10.5 V14.2', K, W(1.5)))
        o.append(s('M0 -17 C9 -17 13 -11 13 -3.5 C13 1.5 10.8 4.8 8.6 6.8 L7 11 H-7 L-8.6 6.8 C-10.8 4.8 -13 1.5 -13 -3.5 C-13 -11 -9 -17 0 -17 Z', BONE, W(3.1)))
        o.append(ln('M-5.5 9.8 H5.5', K, W(1.5)))
    else:
        # heavy square jawbone
        o.append(s('M-8.5 10.5 H8.5 C8.5 15.5 5.5 19 0 19 C-5.5 19 -8.5 15.5 -8.5 10.5 Z', BONE, W(3)))
        o.append(ln('M-4.2 11 V15.5 M0 11 V16.5 M4.2 11 V15.5', K, W(1.6)))
        o.append(s('M0 -17 C9.5 -17 13.5 -11 13.5 -3 C13.5 2 11.5 5 9.8 7 L8.2 11.5 H-8.2 L-9.8 7 C-11.5 5 -13.5 2 -13.5 -3 C-13.5 -11 -9.5 -17 0 -17 Z', BONE, W(3.2)))
        o.append(ln('M-6.5 10.4 H6.5', K, W(1.6)))
    for mx in (1, -1):
        o.append(e(5.3 * mx, -0.8, 4.1, 4.9, K, 0) + c(5.3 * mx, -0.3, 2.0, GRN, 0) + c(5.3 * mx, -0.3, 0.9, GRN_L, 0))
        if fem:
            # arched brow ridge + spectral green lash-wing
            o.append(ln(tp('M1.5 -6.8 C4.2 -9.4 8.4 -9.4 11 -6.6', mx=mx), K, W(2.5)))
            o.append(ln(tp('M8.5 -3.6 L11.8 -5.8', mx=mx), GRN_L, W(2)))
        else:
            # fierce scowling brow ridge
            o.append(ln(tp('M1.2 -5.2 L10.6 -7.8', mx=mx), K, W(3)))
        o.append(ln(tp('M10.8 3.8 C9.4 5.8 7.6 6.6 5.6 6.4', mx=mx), BONE_D, W(1.6)))
    o.append(s('M0 3 L-1.9 7.2 H1.9 Z', K, W(1.2)))
    o.append(ln('M4.4 -16.6 L2.6 -12 L4.6 -9.4', K, W(1.6)))
    return o


def risen_back(k=1.0):
    """the back of the skull, its crack, and the top of the spine"""
    W = lambda w: w / k
    o = [c(0, 17, 3.4, BONE, W(2.6))]
    o.append(s('M0 -17 C9.5 -17 13.5 -11 13.5 -3 C13.5 3 10.5 8 5.5 11.5 H-5.5 C-10.5 8 -13.5 3 -13.5 -3 C-13.5 -11 -9.5 -17 0 -17 Z', BONE, W(3.2)))
    o.append(ln('M-4 -16.4 L-2.2 -10 L-5 -6 L-3.4 -1 M5.5 -15.4 L7 -11 L5.2 -8', K, W(1.6)))
    return o


GNOME_EAR = 'M-13.5 -2 C-23 -8 -29 -2 -27 6 C-24 11 -17 11 -13 6 Z'
GOBLIN_EAR = 'M-12.5 -3 C-22 -10 -34 -14 -39 -8 C-35 -1 -30 3 -26 3 L-29 6.5 C-23 9.5 -16 8 -12 4.5 Z'


def gnome_goggles(W, y=-12.2):
    """chunky brass tinker goggles with bright cyan-frost lenses perched on the forehead"""
    o = [s(f'M-15.5 {f(y - 1.8)} H15.5 V{f(y + 2.2)} H-15.5 Z', '#6B4528', W(2.6))]
    for sx in (-1, 1):
        gx = 6.6 * sx
        o.append(c(gx, y, 5.6, GOLD, W(2.6)) + c(gx, y, 3.5, FROST, W(1.8)))
        o.append(c(gx - 1.2, y - 1.2, 1.2, '#FFFFFF', 0))
    return ''.join(o)


def gnome_head(k=1.0, fem=False, goggles=True):
    """Cute WoW-style pint-sized gnome head: big round sail ears, huge glossy eyes, button turnip nose,
    twin high space-buns (female) or perky tuft + handlebar moustache & goatee (male)."""
    W = lambda w: w / k
    o = []
    o.append(both(GNOME_EAR, GSKIN, W(3.0)))
    o.append(ln('M-16.5 -0.5 C-22 -3 -23.5 3.5 -17.5 5 M16.5 -0.5 C22 -3 23.5 3.5 17.5 5', GSKIN_D, W(2.0)))
    if fem:
        for sx in (-1, 1):
            bx = 15.5 * sx
            o.append(c(bx, -14.5, 7.8, GHAIR_F, W(3.2)))
            o.append(ln(f'M{f(bx - 3 * sx)} -18 C{f(bx + 2 * sx)} -19 {f(bx + 4.5 * sx)} -15 {f(bx + 2 * sx)} -11', GHAIR_FL, W(2.0)))
            o.append(s(f'M{f(bx - 4.8)} -10 H{f(bx + 4.8)} V-6.8 H{f(bx - 4.8)} Z', GOLD, W(2.2)))
    o.append(s('M-15.2 -1 C-15.8 -16 15.8 -16 15.2 -1 C15.6 9 10 15.2 0 15.5 C-10 15.2 -15.6 9 -15.2 -1 Z', GSKIN, W(3.3)))
    o.append(e(-9.5, 4.8, 3.5, 2.2, GBLUSH, 0) + e(9.5, 4.8, 3.5, 2.2, GBLUSH, 0))
    for mx in (1, -1):
        o.append(eye(6.0 * mx, 0.4, 4.5, 5.0, (0.45 * mx, 0.35), w=W(2.2)))
        if fem:
            o.append(ln(tp('M9.4 -2.0 L12.2 -4.0', mx=mx), K, W(2.4)))
            o.append(ln(tp('M2.2 -6.4 C5.4 -8.0 9.4 -7.8 11.8 -5.8', mx=mx), GHAIR_FD, W(2.5)))
        else:
            o.append(ln(tp('M1.8 -6.2 C5.2 -8.2 9.8 -7.8 12.2 -5.4', mx=mx), GHAIR_MD, W(3.2)))
    o.append(c(0, 4.0, 3.6, GSKIN_D, W(2.5)) + c(-1.0, 3.0, 1.2, '#FFE4D0', 0))
    if fem:
        o.append(ln('M-4.5 9.5 C-1.8 12.0 1.8 12.0 4.5 9.5', K, W(2.4)))
        o.append(s('M-15.5 -4.0 C-16.2 -15.5 -7.5 -17.8 0 -12.8 C7.5 -17.8 16.2 -15.5 15.5 -4.0 C12 -9.5 5.8 -11.2 0 -9.6 C-5.8 -11.2 -12 -9.5 -15.5 -4.0 Z', GHAIR_F, W(3.1)))
    else:
        o.append(s('M-13.8 8.8 C-9.4 5.2 -3.4 6.4 0 8.6 C3.4 6.4 9.4 5.2 13.8 8.8 C10.4 12.6 4.5 12.2 0 10.8 C-4.5 12.2 -10.4 12.6 -13.8 8.8 Z', GHAIR_M, W(2.7)))
        o.append(s('M-4.8 10.8 L0 17.5 L4.8 10.8 Z', GHAIR_M, W(2.6)))
        o.append(s('M-15.5 -4.0 C-16.5 -15.5 -8.5 -18.5 0 -17.2 L4.5 -20.5 L6.5 -16.2 C12.5 -15.5 16.2 -11.5 15.5 -4.0 C11.5 -9.5 5.2 -10.8 0 -10.0 C-5.2 -10.8 -11.5 -9.5 -15.5 -4.0 Z', GHAIR_M, W(3.1)))
    if goggles:
        o.append(gnome_goggles(W, -12.2))
    return o


def gnome_back(k=1.0, fem=False):
    W = lambda w: w / k
    col, dark = (GHAIR_F, GHAIR_FD) if fem else (GHAIR_M, GHAIR_MD)
    o = [both(GNOME_EAR, GSKIN, W(3.0))]
    if fem:
        for sx in (-1, 1):
            o.append(c(15.5 * sx, -14.5, 7.8, col, W(3.2)))
    o.append(s('M-15.2 0 C-15.8 -16 15.8 -16 15.2 0 C15.2 9.5 9.5 15 0 15 C-9.5 15 -15.2 9.5 -15.2 0 Z', col, W(3.3)))
    o.append(ln('M-6.5 -8 C-8.5 -1 -8.5 6 -5.5 11.5 M6.5 -8 C8.5 -1 8.5 6 5.5 11.5', dark, W(2.2)))
    o.append(ln('M-15.2 -8.5 H15.2', '#6B4528', W(3.0)))
    return o


def goblin_head(k=1.0, fem=False):
    """Cute & cool WoW-style goblin head: wide notched bat-wing ears with gold rings, big gleaming amber-gold eyes,
    perky pointed nose, cheeky grin with a cute little white fang, and spiky plum/crimson hair."""
    W = lambda w: w / k
    o = []
    o.append(both(GOBLIN_EAR, GBSKIN, W(3.1)))
    o.append(ln('M-14.5 -1 C-22 -4.5 -29 -6 -34 -4.5 M14.5 -1 C22 -4.5 29 -6 34 -4.5', GBSKIN_D, W(2.0)))
    o.append(c(-28.5, 5.2, 3.2, GOLD, W(2.2)))
    if fem:
        o.append(c(28.5, 5.2, 3.2, GOLD, W(2.2)))
        o.append(s('M-5.5 -13.5 C-10 -24.5 -4.5 -31 3.5 -28.5 L1.2 -22 L10 -26.5 C13 -21 10 -14.5 5.5 -12.5 Z', GBHAIR_F, W(3.0)))
    o.append(s('M-14.8 -2 C-15.4 -15.8 15.4 -15.8 14.8 -2 C15.2 7.2 9.5 14.8 0 16.0 C-9.5 14.8 -15.2 7.2 -14.8 -2 Z', GBSKIN, W(3.3)))
    if fem:
        o.append(e(-9.2, 4.6, 3.3, 2.0, '#E07A8A', 0) + e(9.2, 4.6, 3.3, 2.0, '#E07A8A', 0))
    for mx in (1, -1):
        ex, ey = 5.8 * mx, 0.2
        o.append(e(ex, ey, 4.5, 4.3, '#FFE066', W(2.2)))
        o.append(c(ex + 0.45 * mx, ey + 0.2, 2.1, K, 0) + c(ex - 0.35 * mx, ey - 0.85, 0.95, '#FFFFFF', 0))
        if fem:
            o.append(ln(tp('M9.4 -2.0 L12.4 -4.0', mx=mx), K, W(2.5)))
            o.append(ln(tp('M1.8 -6.0 C5.2 -7.8 9.2 -7.6 11.8 -5.4', mx=mx), K, W(2.6)))
        else:
            o.append(ln(tp('M1.5 -5.0 L11.4 -7.4', mx=mx), K, W(3.2)))
    o.append(s('M-2.5 2.5 L0 7.4 L3.0 4.6', GBSKIN_D, W(2.3)))
    o.append(ln('M-5.8 10.4 C-2.0 12.8 2.4 12.8 6.2 10.0', K, W(2.5)))
    o.append(s('M-4.6 11.0 L-2.8 7.2 L-1.0 11.3 Z', BONE, W(1.9)))
    if fem:
        o.append(s('M-15.0 -4.0 C-15.8 -15.5 -6.5 -17.8 0 -13.5 C6.5 -17.8 15.8 -15.5 15.0 -4.0 C11 -9.5 4.8 -11.2 -1 -9.6 C-6.5 -11.2 -11.5 -9.5 -15.0 -4.0 Z', GBHAIR_F, W(3.0)))
    else:
        o.append(s('M-15.0 -4.2 C-15.8 -15.8 -6.5 -18.2 0 -16.2 L-2 -20.5 L4.5 -17.2 L8.5 -20 L9.5 -15.2 C13.8 -13.5 15.5 -9.5 15.0 -4.2 C10.5 -9.5 4.2 -10.8 0 -10.2 C-5.2 -10.8 -11 -9.5 -15.0 -4.2 Z', GBHAIR_M, W(3.0)))
    return o


def goblin_back(k=1.0, fem=False):
    W = lambda w: w / k
    col, dark = (GBHAIR_F, GBHAIR_FD) if fem else (GBHAIR_M, K)
    o = [both(GOBLIN_EAR, GBSKIN, W(3.1))]
    o.append(c(-28.5, 5.2, 3.2, GOLD, W(2.2)))
    if fem:
        o.append(c(28.5, 5.2, 3.2, GOLD, W(2.2)))
    o.append(s('M-14.5 -1 C-15.2 -15.8 15.2 -15.8 14.5 -1 C14.5 8.5 9 14.8 0 14.8 C-9 14.8 -14.5 8.5 -14.5 -1 Z', col, W(3.3)))
    if fem:
        o.append(s('M-5.5 -10 C-9.5 -23 -3.5 -29 4.5 -26 C9.5 -21 8.5 -8 4.5 4.5 C0 6.5 -4.5 2 -5.5 -10 Z', GBHAIR_F, W(3.0)))
    else:
        o.append(ln('M-5.5 -8 L-3.5 6.5 M5.5 -8 L3.5 6.5', dark, W(2.2)))
    return o

