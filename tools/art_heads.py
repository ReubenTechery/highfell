# The heroes' heads: the four faces, and the back of each head. Each is drawn once around the middle of the
# eyes (0, 0) and placed by art_heroes.py with a scale; `k` is that scale, and every line width is divided by
# it so a scaled head keeps the one ink weight. The elf returns two parts: the long hair that falls behind
# the body, then the head itself.
import re
from art_sprites import K, s, ln, c, e, both, halo, f, BONE, BONE_D, GRN, GRN_L, GOLD

# skin, hair and eyes
DSKIN, DSKIN_D, BEARD, BEARD_D = '#F2B48C', '#E0956C', '#E2733A', '#B8552A'
HSKIN, HSKIN_D, HAIR, HAIR_L = '#A86F4C', '#8E5A3B', '#3A2A22', '#5A4436'
ESKIN, ESKIN_D, EHAIR, EHAIR_D, ELF_BROW = '#F3D7C4', '#E3B9A2', '#EEF2F6', '#C9D4E0', '#8D93B2'
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
    """a white eye with a black dot"""
    return e(x, y, rx, ry, '#FFFFFF', w) + c(x + look[0], y + look[1], min(rx, ry) * 0.48, K, 0)


def dwarf_face(k=1.0, fem=False):
    """the face only: the beard (or braids) and the helm belong to the body"""
    W = lambda w: w / k
    o = [e(0, 1.5, 15, 12.5, DSKIN, W(3.5))]
    if fem:
        o.append(both('M-13 -3 C-16 3 -16 10 -12.5 13.5 L-10.5 6 Z', BEARD, W(2.8)))
        for mx in (1, -1):
            o.append(eye(5.8 * mx, 0, 3.6, 4.2, (0.5 * mx, 0.4), w=W(2.2)))
            o.append(ln(tp('M8.2 -2.4 L10.6 -3.8', mx=mx), K, W(2.4)))
            o.append(ln(tp('M2.2 -5.8 C5.5 -7.6 9.5 -7.4 11.8 -5.4', mx=mx), K, W(3)))
        o.append(c(0, 4.4, 3.8, DSKIN_D, W(2.8)))
        o.append(ln('M-4 9.8 C-1.6 11.8 1.6 11.8 4 9.8', K, W(2.5)))
        return o
    for mx in (1, -1):
        o.append(eye(6 * mx, 0, 3.6, 4.2, (0.6 * mx, 0.5), w=W(2.4)))
    o.append(ln('M-12 -6.5 L-2.5 -4.7 M12 -6.5 L2.5 -4.7', K, W(3.4)))
    o.append(s('M-12.5 9.5 C-8 6 -3 7.5 0 9.5 C3 7.5 8 6 12.5 9.5 C9 13.5 3 13.5 0 12 C-3 13.5 -9 13.5 -12.5 9.5 Z', BEARD, W(3)))
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
        o = [s('M-12.5 0 C-12.5 -17 12.5 -17 12.5 0 C12.5 10.5 8 15.5 0 16 C-8 15.5 -12.5 10.5 -12.5 0 Z', HSKIN, W(3.2))]
        for mx in (1, -1):
            o.append(eye(5.2 * mx, 0, 3.2, 3.7, (0.5 * mx, 0.5), w=W(1.8)))
            o.append(ln(tp('M1.6 -5.8 L9.2 -6.6', mx=mx), K, W(3)))
        o.append(ln('M0.4 2.2 C-0.8 4.4 -1.8 6 -0.5 7 L1.5 6.8', HSKIN_D, W(1.8)))
        o.append(s('M-7.5 11.2 C-4 9.6 4 9.6 7.5 11.2 C6.5 15.2 3.5 16.8 0 16.8 C-3.5 16.8 -6.5 15.2 -7.5 11.2 Z', HAIR, W(2.6)))
        o.append(ln('M-3.5 10.6 H3.5', K, W(2.2)))
        o.append(s('M-13.2 -1 C-16.5 -20 16.5 -20 13.2 -1 C11 -8.5 5 -12.5 0 -12.5 C-5 -12.5 -11 -8.5 -13.2 -1 Z', HAIR, W(3.2)))
        o.append(both('M-13 -1 C-14.2 2.5 -14.2 6 -12 7.5 L-11.2 1.5 Z', HAIR, W(2.5)))
        if circlet:
            o.append(ln('M-12.5 -8 C-6 -11 6 -11 12.5 -8', GOLD, W(3)) + c(0, -10.5, 2.6, HBLUE, W(1.8)))
        return o
    o = [s('M-12 0 C-12 -17 12 -17 12 0 C12 11 6 16 0 16 C-6 16 -12 11 -12 0 Z', HSKIN, W(3.2))]
    for mx in (1, -1):
        o.append(eye(5.2 * mx, 0, 3.2, 3.8, (0.5 * mx, 0.6), w=W(1.6)))
        o.append(ln(tp('M1.6 -6.6 C3.5 -7.6 6.5 -7.6 8.5 -6', mx=mx), K, W(2.6)))
    o.append(ln('M0.4 2.4 C-0.8 4.6 -1.8 6.2 -0.6 7.2 L1.4 7', HSKIN_D, W(1.7)))
    o.append(ln('M-3.8 10.4 C-1.6 12.4 1.6 12.4 3.8 10.4', K, W(2.4)))
    o.append(s('M-13 0 C-17 -21 17 -21 13 0 C11 -9 5 -13 0 -13 C-5 -13 -11 -9 -13 0 Z', HAIR, W(3.2)))
    o.append(both('M-13 0 C-15 6 -15 12 -12 16 L-11 4 Z', HAIR, W(2.6)))
    if bun:
        o.append(c(0, -21, 7.5, HAIR, W(3.2)))
    if circlet:
        o.append(ln('M-12.5 -8 C-6 -11 6 -11 12.5 -8', GOLD, W(3)) + c(0, -10.5, 2.6, HBLUE, W(1.8)))
    return o


def human_back(k=1.0, bun=True, circlet=True):
    """the back of the head: the hair gathered up into the bun, the circlet's band round the back"""
    W = lambda w: w / k
    o = [s('M-13 1 C-17 -21 17 -21 13 1 C13 9 8 15 0 15 C-8 15 -13 9 -13 1 Z', HAIR, W(3.2))]
    o.append(ln('M-7 9 C-9 0 -7 -9 -2 -14 M7 9 C9 0 7 -9 2 -14', HAIR_L, W(1.8)))
    if bun:
        o.append(c(0, -21, 7.5, HAIR, W(3.2)) + ln('M-4.5 -21 C-2 -18 2 -18 4.5 -21', HAIR_L, W(1.8)))
    if circlet:
        o.append(ln('M-12.8 -6 C-6 -3 6 -3 12.8 -6', GOLD, W(3)))
    return o


ELF_EAR = 'M9.4 -3.2 C14 -5.2 20 -9.4 26.5 -14.5 C23.5 -7.5 17.5 -1.5 10.2 3.8 Z'


def elf_head(k=1.0, back_len=44, hair=EHAIR, hairD=EHAIR_D, fem=True):
    """returns (back, front): the long hair that falls behind the body, then the head itself"""
    W = lambda w: w / k
    back = [s(f'M-11.5 -9 C-17.5 6 -18.5 {f(back_len * 0.6)} -14.5 {f(back_len)} L-7.5 {f(back_len - 6)} L0 {f(back_len + 1)} L7.5 {f(back_len - 6)} L14.5 {f(back_len)} C18.5 {f(back_len * 0.6)} 17.5 6 11.5 -9 Z', hair, W(3.2))] if fem else []
    o = []
    # long ears, swept up and back
    o.append(both(ELF_EAR, ESKIN, W(2.6)))
    o.append(ln('M12.2 -0.8 C16 -3.6 20 -7 23.6 -11 M-12.2 -0.8 C-16 -3.6 -20 -7 -23.6 -11', ESKIN_D, W(1.6)))
    # a narrow face, high cheeks, a small pointed chin
    o.append(s('M0 -15.5 C7 -15.5 11.4 -11 11.4 -3.5 C11.4 4.5 5.5 13 0 16 C-5.5 13 -11.4 4.5 -11.4 -3.5 C-11.4 -11 -7 -15.5 0 -15.5 Z', ESKIN, W(3)))
    # almond eyes with the outer corners lifted, a heavy upper lid, a light
    for mx in (1, -1):
        ex, ey = 5.2 * mx, -0.6
        o.append(s(tp('M-3.6 0.8 C-2.2 -3.7 2.2 -4.4 4 -1.6 C2.6 2.5 -1.9 3.2 -3.6 0.8 Z', ex, ey, 1, mx), '#FFFFFF', W(1.2)))
        o.append(c(ex + 0.3 * mx, ey - 0.3, 1.75, K, 0) + c(ex - 0.25 * mx, ey - 1.05, 0.6, '#FFFFFF', 0))
        if fem:
            o.append(ln(tp('M0.2 -3.4 C1.8 -3.6 3.4 -2.9 4.2 -1.6 L5.4 -2.7', ex, ey, 1, mx), K, W(1.7)))
            o.append(ln(tp('M-2.8 -6.3 C-0.6 -7.5 2.4 -7.9 4.9 -7.1', ex, ey, 1, mx), ELF_BROW, W(1.8)))
        else:
            o.append(ln(tp('M-0.5 -3.2 C1.5 -3.5 3.2 -2.8 4.1 -1.6', ex, ey, 1, mx), K, W(1.9)))
            o.append(ln(tp('M-3.4 -5.0 L5.4 -7.8', ex, ey, 1, mx), K, W(2.7)))
    o.append(ln('M0.5 3 L-0.8 6.6 L0.9 7', ESKIN_D, W(1.4)))
    o.append(ln('M-2 9.6 C-0.6 10.5 1.2 10.3 2.6 9.1' if fem else 'M-3.2 9.6 H3.2', K, W(1.8)))
    if not fem:
        o.append(s('M-3.8 11.6 L0 18.2 L3.8 11.6 Z', hair, W(2.4)))
    # the hair: a cap with a centre part, and long locks over the roots of the ears (or swept back on male)
    o.append(s('M-12.2 -1 C-14 -14.5 -7.4 -20 0 -20 C7.4 -20 14 -14.5 12.2 -1 C10.8 -8 7 -12.8 1.3 -13.4 L0 -11.6 L-1.3 -13.4 C-7 -12.8 -10.8 -8 -12.2 -1 Z', hair, W(3)))
    if fem:
        o.append(both('M-12.2 -4 C-14.6 4 -14.8 13 -12.8 20.5 L-10.4 16 C-11.2 9 -11.2 2 -10.6 -5.5 Z', hair, W(2.4)))
    else:
        o.append(ln('M-11.2 -8.2 C-5 -10.8 5 -10.8 11.2 -8.2', GOLD, W(2.6)) + c(0, -10.2, 2.2, '#8FD6FF', W(1.6)))
    o.append(ln('M-6 -16.4 C-8.6 -13.4 -9.9 -9.4 -10.5 -5.4 M6 -16.4 C8.6 -13.4 9.9 -9.4 10.5 -5.4', hairD, W(1.6)))
    return back, o


def elf_back(k=1.0, back_len=44, hair=EHAIR, hairD=EHAIR_D, ears=True, fem=True):
    """the back of the head: the ears past the sides, and the long hair falling down the back"""
    W = lambda w: w / k
    L = back_len if fem else 20
    o = [both(ELF_EAR, ESKIN, W(2.6))] if ears else []
    o.append(s(f'M0 -20 C8.5 -20 14 -14 13.4 -4 C17.5 6 18.5 {f(L * 0.6)} 14.5 {f(L)} L7.5 {f(L - 6)} L0 {f(L + 1)} L-7.5 {f(L - 6)} L-14.5 {f(L)} '
               f'C-18.5 {f(L * 0.6)} -17.5 6 -13.4 -4 C-14 -14 -8.5 -20 0 -20 Z', hair, W(3.2)))
    o.append(ln(f'M-5 -13 C-8 0 -9.5 {f(L * 0.45)} -8.5 {f(L - 9)} M5 -13 C8 0 9.5 {f(L * 0.45)} 8.5 {f(L - 9)} M0 -6 V{f(L - 5)}', hairD, W(1.8)))
    if not fem:
        o.append(s('M-5.5 8 H5.5 V12.5 H-5.5 Z', GOLD, W(2.4)))
    return o


def risen_head(k=1.0, glow=1.0, fem=False):
    """a long skull: deep sockets with a green light, a heavy brow, a crack, a hanging jaw"""
    W = lambda w: w / k
    o = [halo(0, 0, 17 * glow, GRN, 0.28)] if glow else []
    o.append(s('M-8 10.5 H8 C8 15 5 18.5 0 18.5 C-5 18.5 -8 15 -8 10.5 Z', BONE, W(3)))
    o.append(ln('M-4 11 V15 M0 11 V16 M4 11 V15', K, W(1.6)))
    o.append(s('M0 -17 C9.5 -17 13.5 -11 13.5 -3 C13.5 2 11.5 5 9.8 7 L8.2 11.5 H-8.2 L-9.8 7 C-11.5 5 -13.5 2 -13.5 -3 C-13.5 -11 -9.5 -17 0 -17 Z', BONE, W(3.2)))
    o.append(ln('M-6 10.4 H6', K, W(1.6)))
    for mx in (1, -1):
        o.append(e(5.3 * mx, -0.8, 4.1, 4.9, K, 0) + c(5.3 * mx, -0.3, 1.8, GRN, 0) + c(5.3 * mx, -0.3, 0.8, GRN_L, 0))
        if fem:
            o.append(ln(tp('M1.5 -6.8 C4.2 -9.2 8.2 -9.2 10.8 -6.6', mx=mx), K, W(2.4)))
            o.append(ln(tp('M8.8 -3.8 L11.4 -5.4', mx=mx), K, W(2.2)))
        else:
            o.append(ln(tp('M1 -6.2 C3.4 -8.4 7.4 -8.6 10.4 -6.4', mx=mx), K, W(2.4)))
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
