# "TV epic": TV-cartoon line and colour with chunky heroic armour, plus the same pieces in the painted heroic style.
# Usage: tvworld.py out_fragment.html [names]
import math, re, sys, os, colorsys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artstyles import path, scaled, rect, circle, ellipse
from fighttiles import TILES

K = '#1E1A1A'


def _adj(h, dl, ds=1.0):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0, min(1, l + dl)); s = max(0, min(1, s * ds))
    r, g, b = colorsys.hls_to_rgb(hh, l, s)
    return '#%02X%02X%02X' % (round(r * 255), round(g * 255), round(b * 255))


def darker(h, k=0.15):
    return _adj(h, -k, 1.08)


def lighter(h, k=0.13):
    return _adj(h, k, 0.95)


TOK = re.compile(r'[MLCQHVAZ]|-?\d*\.?\d+')


def points(d):
    pts, cmd, nums, cur = [], None, [], [0, 0]
    toks = TOK.findall(d)
    i = 0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd == 'Z':
                continue
            continue
        if cmd in ('M', 'L'):
            cur = [float(toks[i]), float(toks[i + 1])]; pts.append(tuple(cur)); i += 2
        elif cmd == 'C':
            for j in range(3):
                pts.append((float(toks[i + 2 * j]), float(toks[i + 2 * j + 1])))
            cur = list(pts[-1]); i += 6
        elif cmd == 'Q':
            for j in range(2):
                pts.append((float(toks[i + 2 * j]), float(toks[i + 2 * j + 1])))
            cur = list(pts[-1]); i += 4
        elif cmd == 'H':
            cur[0] = float(t); pts.append(tuple(cur)); i += 1
        elif cmd == 'V':
            cur[1] = float(t); pts.append(tuple(cur)); i += 1
        elif cmd == 'A':
            cur = [float(toks[i + 5]), float(toks[i + 6])]; pts.append(tuple(cur)); i += 7
        else:
            i += 1
    return pts


def mirror(d, axis=150):
    out, cmd, k = [], None, 0
    for t in TOK.findall(d):
        if t.isalpha():
            cmd, k = t, 0
            out.append(t)
            continue
        v = float(t)
        if cmd == 'H':
            v = 2 * axis - v
        elif cmd in ('M', 'L', 'C', 'Q'):
            if k % 2 == 0:
                v = 2 * axis - v
        elif cmd == 'A':
            pos = k % 7
            if pos == 5:
                v = 2 * axis - v
            elif pos == 4:
                v = 1 - v
        k += 1
        out.append(f'{v:g}')
    s = ''
    for tok in out:
        s += tok if tok.isalpha() else (' ' + tok if s and not s[-1].isalpha() else tok)
    return s


class Pen:
    def __init__(self, tv=True, w=3):
        self.tv, self.w = tv, w

    def sh(self, d, fill, w=None):
        if self.tv:
            return path(d, fill, K, w or self.w)
        pts = points(d)
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        if (x1 - x0) * (y1 - y0) > 40000:
            return path(d, fill)
        px, py = round(x0 + 0.24 * (x1 - x0), 1), round(y0 + 0.2 * (y1 - y0), 1)
        return path(d, darker(fill)) + scaled(d, fill, px, py, 0.86) + scaled(d, lighter(fill), px, py, 0.46, 0.7)

    def flat(self, d, fill, op=None):
        return path(d, fill, op=op)

    def ln(self, d, w=2.5, col=None):
        if self.tv:
            return path(d, 'none', col or K, w)
        return path(d, 'none', darker(col or '#5A4A50', 0.08), w)

    def beam(self, d, col, w=6):
        if self.tv:
            return path(d, 'none', K, w + 3.5) + path(d, 'none', col, w)
        return path(d, 'none', darker(col), w + 1.5) + path(d, 'none', col, w)

    def glow(self, cx, cy, r, col, k=1.0):
        if self.tv:
            return circle(cx, cy, round(r * 0.7, 1), col, op=round(0.22 * k, 3))
        return ''.join(circle(cx, cy, round(r * f, 1), col, op=round(op * k, 3)) for f, op in [(1, 0.1), (0.66, 0.15), (0.36, 0.22)])


def svg(vb, body, label):
    return f'<svg viewBox="{vb}" role="img" aria-label="{label}" style="display: block; width: 100%; height: auto;">{body}</svg>'


def both(p, d, fill):
    return p.sh(d, fill) + p.sh(mirror(d), fill)


# ================================================================ characters (300 x 420)
def iron_warden(p):
    PL, GD, RD = '#7D8FA3', '#E7B53C', '#B8383A'
    o = []
    if not p.tv:
        o.append(rect(0, 0, 300, 420, '#2B2240'))
        for y, h, c in [(120, 90, '#35284B'), (210, 60, '#4A3258'), (270, 40, '#6E425D'), (310, 30, '#9E555C'), (340, 14, '#D9775A')]:
            o.append(rect(0, y, 300, h, c))
        o.append(rect(0, 354, 300, 66, '#211A2A'))
    else:
        o.append(rect(0, 0, 300, 420, '#CBE3F0') + path('M-10 330 C80 312 220 316 310 326 V430 H-10 Z', '#8CC56A', K, 3))
    o.append(ellipse(150, 394, 92, 10, '#000000', op=0.18))
    o.append(p.sh('M92 140 C76 230 66 320 60 392 H240 C234 320 224 230 208 140 Z', RD))
    o.append(p.sh('M118 300 H146 L144 380 H114 Z', PL) + p.sh('M154 300 H182 L186 380 H156 Z', PL))
    o.append(p.sh('M108 378 H146 V394 H96 C96 386 100 380 108 378 Z', PL) + p.sh('M154 378 H192 C200 380 204 386 204 394 H154 Z', PL))
    o.append(p.sh('M126 230 H174 L180 352 L150 340 L120 352 Z', RD))
    o.append(p.sh('M108 160 C106 204 112 242 120 262 H180 C188 242 194 204 192 160 Z', PL))
    o.append(p.sh('M150 176 L156 188 L170 190 L160 200 L163 214 L150 207 L137 214 L140 200 L130 190 L144 188 Z', GD))
    o.append(p.sh('M116 258 H184 V272 H116 Z', '#6B4528') + p.sh('M143 258 H157 V272 H143 Z', GD))
    # sword planted point-down, hands on the pommel
    o.append(p.sh('M141 240 H159 L156 376 L150 388 L144 376 Z', '#D7DEE6'))
    o.append(p.ln('M150 248 V368', 2, '#9AA3AD'))
    o.append(p.sh('M112 228 C112 222 188 222 188 228 V240 C188 246 112 246 112 240 Z', GD))
    o.append(p.sh('M144 200 H156 V228 H144 Z', '#6B4528') + p.sh('M150 186 C158 186 160 198 150 200 C140 198 142 186 150 186 Z', GD))
    o.append(p.sh('M84 182 C78 206 84 226 100 232 L136 226 L134 210 L104 212 C100 204 100 194 104 186 Z', PL))
    o.append(p.sh(mirror('M84 182 C78 206 84 226 100 232 L136 226 L134 210 L104 212 C100 204 100 194 104 186 Z'), PL))
    o.append(p.sh('M126 206 C120 206 120 228 128 230 H148 C152 228 152 208 148 206 Z', '#5F6F82') + p.sh('M152 206 C148 206 148 228 152 230 H172 C180 228 180 206 174 206 Z', '#5F6F82'))
    o.append(p.ln('M134 214 V224 M140 214 V224 M160 214 V224 M166 214 V224', 1.8))
    # pauldrons with trim and a spike
    for f in (False, True):
        m = mirror if f else (lambda d: d)
        o.append(p.sh(m('M80 140 L72 102 L98 134 Z'), GD))
        o.append(p.sh(m('M48 186 C40 146 82 122 128 140 C136 162 130 184 118 198 C94 206 66 202 48 186 Z'), PL))
        o.append(p.sh(m('M52 182 C72 196 104 198 122 190 L120 200 C100 208 70 206 50 194 Z'), GD))
    # helm
    o.append(p.sh('M126 144 H174 L178 162 H122 Z', PL))
    o.append(p.sh('M150 54 C140 30 156 12 178 16 C166 24 162 36 164 52 Z', RD))
    o.append(p.sh('M120 74 C120 50 180 50 180 74 L184 140 C170 150 130 150 116 140 Z', PL))
    o.append(p.sh('M119 74 H181 L182 84 H118 Z', GD))
    o.append(path('M128 98 H172 V108 H156 V130 H144 V108 H128 Z', '#141016', K if p.tv else None, 2.5 if p.tv else 0))
    o.append(p.glow(150, 104, 30, '#9BD068', 1.2))
    o.append(path('M134 103 H144 M156 103 H166', 'none', '#B6F07A', 3))
    o.append(circle(140, 138, 2, K) + circle(150, 140, 2, K) + circle(160, 138, 2, K))
    return svg('0 0 300 420', ''.join(o), ('TV cartoon' if p.tv else 'Chunky heroic') + ' plate knight: bucket helm with a red plume and green eye glow, huge gold-trimmed pauldrons, hands on a planted greatsword')


def rogue(p):
    HOOD, MASK, LEA, STR, SASH, SKIN, PANT = '#2F6B4F', '#2C3A3F', '#8A5A34', '#5A3A2A', '#7A4FA0', '#D9A57A', '#3A4A4F'
    o = [rect(0, 0, 300, 420, '#D8E8D2') + path('M-10 334 C90 318 210 322 310 330 V430 H-10 Z', '#7DBB5E', K, 3)]
    o.append(ellipse(150, 394, 84, 9, '#000000', op=0.18))
    o.append(p.sh('M106 150 C96 210 92 262 96 304 L204 304 C208 262 204 210 194 150 Z', HOOD))
    o.append(p.sh('M124 300 H146 L142 382 H118 Z', PANT) + p.sh('M154 300 H176 L182 382 H158 Z', PANT))
    o.append(p.sh('M114 350 H146 V394 H102 C102 384 106 376 114 372 Z', LEA) + p.sh('M154 350 H186 V372 C194 376 198 384 198 394 H154 Z', LEA))
    o.append(p.sh('M112 346 H148 V358 H112 Z', '#A0703F') + p.sh('M152 346 H188 V358 H152 Z', '#A0703F'))
    o.append(p.sh('M118 168 C114 210 116 262 122 304 H178 C184 262 186 210 182 168 Z', LEA))
    o.append(p.sh('M120 176 L182 282 L174 290 L114 186 Z', STR))
    for (x, y) in [(132, 202), (146, 226), (160, 250)]:
        o.append(p.sh(f'M{x - 5} {y - 5} H{x + 5} V{y + 7} H{x - 5} Z', '#C9CFD8', 2))
    o.append(p.sh('M118 272 H182 V288 H118 Z', SASH) + p.sh('M168 284 L176 312 L184 308 L178 284 Z', SASH))
    for f in (False, True):
        m = mirror if f else (lambda d: d)
        o.append(p.sh(m('M102 186 L92 252 L114 256 L120 192 Z'), LEA))
        o.append(p.sh(m('M82 308 L95 258 L106 262 L96 312 Z'), '#D7DEE6'))
        o.append(p.sh(m('M92 260 H110 V266 H92 Z'), '#C9963A'))
        o.append(p.sh(m('M92 248 C88 262 96 272 106 270 C114 268 116 256 112 248 Z'), MASK))
        o.append(p.sh(m('M96 178 C94 156 118 146 134 158 C136 170 132 182 124 190 C112 194 102 190 96 178 Z'), LEA))
    o.append(p.sh('M112 120 C108 72 192 72 188 120 C192 140 186 160 176 168 H124 C114 160 108 140 112 120 Z', HOOD))
    o.append(p.sh('M150 74 C170 62 192 70 202 92 C188 84 172 84 160 88 Z', HOOD))
    o.append(p.sh('M126 112 C126 92 174 92 174 112 V140 H126 Z', SKIN))
    o.append(p.sh('M122 122 H178 C180 140 170 156 150 158 C130 156 120 140 122 122 Z', MASK))
    for ex in (138, 162):
        o.append(ellipse(ex, 112, 6, 4, '#FFFFFF', K, 2) + circle(ex + (1 if ex < 150 else -1), 112, 2.4, K))
    o.append(p.ln('M130 104 L144 108 M170 104 L156 108', 3))
    return svg('0 0 300 420', ''.join(o), 'TV cartoon leather rogue: green hood, dark scarf mask, crossed bandolier of knives and a dagger in each hand')


def sorceress(p):
    RB, GD, CO, HR, SK = '#B8383A', '#E7B53C', '#2A1E33', '#2A2230', '#A86F4C'
    o = [rect(0, 0, 300, 420, '#F2DCC8') + path('M-10 336 C90 320 210 324 310 332 V430 H-10 Z', '#C9A97A', K, 3)]
    o.append(ellipse(150, 394, 92, 9, '#000000', op=0.18))
    o.append(p.sh('M116 96 C100 150 98 210 108 250 L132 230 C126 190 126 150 132 112 Z', HR) + p.sh(mirror('M116 96 C100 150 98 210 108 250 L132 230 C126 190 126 150 132 112 Z'), HR))
    o.append(p.sh('M110 170 C96 250 80 330 66 392 H234 C220 330 204 250 190 170 Z', RB))
    o.append(p.sh('M136 200 H164 L180 392 H120 Z', GD))
    o.append(p.sh('M70 378 C120 386 180 386 230 378 L234 394 C180 400 120 400 66 394 Z', GD))
    o.append(p.sh('M116 240 C134 248 166 248 184 240 L182 254 C166 262 134 262 118 254 Z', CO) + circle(150, 250, 5, '#FF8A4C', K, 2))
    # staff with a fire orb
    o.append(path('M90 392 L96 116', 'none', K, 9) + path('M90 392 L96 116', 'none', '#5A3A2A', 5))
    o.append(p.glow(98, 100, 40, '#FF8A4C', 1.3))
    o.append(p.sh('M86 112 C84 98 90 86 98 82 C106 86 112 98 110 112 Z', '#3A2A20'))
    o.append(circle(98, 98, 13, '#FF8A4C', K, 2.5) + circle(95, 95, 6, '#FFE08A'))
    # sleeves, hands, fireball
    o.append(p.sh('M110 172 C90 200 76 240 72 268 C86 280 108 278 120 268 C118 234 120 204 126 180 Z', RB))
    o.append(p.sh('M74 262 C86 272 106 272 118 264 L120 272 C106 282 86 282 72 272 Z', GD))
    o.append(circle(94, 270, 9, SK, K, 2.5))
    o.append(p.sh('M190 172 C210 186 228 200 238 214 C232 226 220 232 210 232 C204 214 196 196 182 184 Z', RB))
    o.append(circle(234, 212, 9, SK, K, 2.5))
    o.append(p.glow(240, 186, 34, '#FF8A4C', 1.4))
    o.append(p.sh('M240 200 C226 196 222 180 232 168 C234 178 240 180 242 170 C250 178 254 192 240 200 Z', '#FF8A4C'))
    o.append(path('M240 194 C234 192 232 184 237 178 C239 184 243 186 244 182 C246 188 246 194 240 194 Z', '#FFE08A'))
    # collar, shoulders, face, hair
    o.append(p.sh('M104 150 C98 120 108 92 122 80 L134 124 Z', CO) + p.sh(mirror('M104 150 C98 120 108 92 122 80 L134 124 Z'), CO))
    o.append(p.ln('M106 146 C102 120 110 96 120 86 M194 146 C198 120 190 96 180 86', 2.5, GD))
    o.append(p.sh('M108 150 C120 136 180 136 192 150 L190 176 H110 Z', RB))
    o.append(p.sh('M140 118 H160 V140 H140 Z', SK))
    o.append(p.sh('M124 92 C124 66 176 66 176 92 C176 116 164 130 150 132 C136 130 124 116 124 92 Z', SK))
    for ex in (138, 162):
        o.append(path(f'M{ex - 8} 94 C{ex - 4} 88 {ex + 4} 88 {ex + 8} 94 C{ex + 4} 98 {ex - 4} 98 {ex - 8} 94 Z', '#FFFFFF', K, 2) + circle(ex, 94, 2.6, K))
    o.append(path('M128 90 L124 86 M172 90 L176 86', 'none', K, 2.5) + path('M130 84 C134 80 142 80 146 83 M154 83 C158 80 166 80 170 84', 'none', K, 2.5))
    o.append(path('M150 98 L148 108 L152 109', 'none', K, 2) + path('M142 117 C147 120 154 119 158 115', 'none', '#7A1F2A', 3))
    o.append(p.sh('M120 96 C112 58 140 42 160 46 C186 50 192 74 182 96 C176 76 164 66 150 66 C136 66 124 76 120 96 Z', HR))
    o.append(path('M156 48 C168 54 176 66 178 84 C172 72 164 64 156 60 Z', '#C9CFD8', K, 2))
    return svg('0 0 300 420', ''.join(o), 'TV cartoon cloth sorceress: crimson and gold robes, a tall black collar, a fireball in one hand and a fire-orb staff in the other')


def orc_ranger(p):
    SK, SKD, MAIL, LEA, CLK = '#7FA35A', '#5E8240', '#A7B0BA', '#8A5A34', '#3F6E3A'
    o = [rect(0, 0, 300, 420, '#E3EEF5') + path('M-10 332 C90 316 210 320 310 328 V430 H-10 Z', '#8CC56A', K, 3)]
    o.append(ellipse(150, 394, 96, 10, '#000000', op=0.18))
    o.append(p.sh('M196 120 L214 112 L232 210 L214 216 Z', LEA))
    o.append(p.sh('M200 118 L196 100 L206 112 Z', '#D64545') + p.sh('M208 114 L206 96 L214 108 Z', '#F6E9D2'))
    o.append(p.sh('M96 150 C86 230 80 300 82 330 L218 330 C220 300 214 230 204 150 Z', CLK))
    o.append(p.sh('M114 300 H148 L146 372 H110 Z', '#4A3A2A') + p.sh('M152 300 H186 L190 372 H154 Z', '#4A3A2A'))
    o.append(p.sh('M104 366 H148 V394 H92 C92 382 96 372 104 366 Z', '#5A3A2A') + p.sh('M152 366 H196 C204 372 208 382 208 394 H152 Z', '#5A3A2A'))
    o.append(p.sh('M96 160 C88 214 94 268 108 304 H192 C206 268 212 214 204 160 Z', MAIL))
    for row in range(6):
        y = 176 + row * 18
        o.append(p.ln(' '.join(f'M{x} {y} q5 7 10 0' for x in range(108 + (row % 2) * 5, 192, 10)), 1.6, '#6E7886'))
    o.append(p.sh('M102 288 H198 V304 H102 Z', LEA) + p.sh('M142 288 H158 V304 H142 Z', '#E7B53C'))
    o.append(p.sh('M110 170 L192 280 L184 288 L104 178 Z', '#5A3A2A'))
    o.append(p.sh('M180 150 C210 146 230 166 228 192 C214 198 198 196 186 190 Z', SK))
    o.append(p.sh('M66 186 C60 150 96 132 128 146 C134 166 128 186 116 198 C96 204 76 200 66 186 Z', LEA))
    o.append(p.ln('M70 182 C86 192 104 194 118 190', 3, '#E7B53C'))
    # bow arm and bow
    o.append(p.sh('M74 196 L66 260 L96 266 L104 204 Z', SK) + p.sh('M66 240 L96 246 L96 262 L66 256 Z', LEA))
    o.append(path('M70 136 C38 200 38 320 70 388', 'none', K, 10) + path('M70 136 C38 200 38 320 70 388', 'none', '#9C6B3E', 5.5))
    o.append(path('M70 136 L70 388', 'none', '#E9E2D0', 1.6))
    o.append(p.sh('M60 262 C54 282 70 296 84 292 C98 288 100 272 94 262 Z', SK))
    o.append(p.sh('M206 186 L222 256 L196 264 L188 194 Z', SK) + p.sh('M196 240 L222 234 L224 250 L198 256 Z', LEA))
    o.append(p.sh('M194 260 C188 280 204 294 218 290 C232 286 234 270 226 260 Z', SK))
    # head
    o.append(p.sh('M112 108 L90 96 L112 124 Z', SK) + p.sh('M188 108 L210 96 L188 124 Z', SK))
    o.append(p.sh('M112 112 C110 74 190 74 188 112 C190 140 174 164 150 166 C126 164 110 140 112 112 Z', SK))
    o.append(p.sh('M118 100 C132 90 168 90 182 100 L180 110 C166 104 134 104 120 110 Z', SKD))
    for ex in (136, 164):
        o.append(ellipse(ex, 116, 6, 5, '#FFFFFF', K, 2) + circle(ex, 117, 2.4, K))
    o.append(p.sh('M144 120 C146 114 154 114 156 120 L160 130 C154 134 146 134 140 130 Z', SKD))
    o.append(path('M126 146 C140 154 160 154 174 146', 'none', K, 2.5))
    o.append(p.sh('M130 148 L126 126 L138 144 Z', '#F3E9D2') + p.sh('M170 148 L174 126 L162 144 Z', '#F3E9D2'))
    o.append(p.sh('M136 80 C136 62 164 62 164 80 Z', '#2A2230') + circle(150, 58, 10, '#2A2230', K, 3))
    return svg('0 0 300 420', ''.join(o), 'TV cartoon mail ranger: a big green orc with tusks, a chainmail shirt, a leather pauldron, a longbow and a quiver')


# ================================================================ places (520 x 320)
def tree(p, x, base, h, col='#3F7A4A'):
    w = h * 0.42
    o = p.sh(f'M{x - 5} {base} V{base - 18} H{x + 5} V{base} Z', '#6B4528', 2.2)
    for k, f in enumerate((0.0, 0.3, 0.55)):
        top = base - h + f * h * 0.9
        ww = w * (1 - f * 0.45)
        o += p.sh(f'M{x - ww:.1f} {base - 14 - f * h * 0.35:.1f} L{x} {top - 20:.1f} L{x + ww:.1f} {base - 14 - f * h * 0.35:.1f} Z', col, 2.2)
    return o


def cloud(p, x, y, s=1.0):
    d = (f'M{x} {y} C{x} {y - 16 * s} {x + 22 * s} {y - 20 * s} {x + 30 * s} {y - 10 * s} C{x + 36 * s} {y - 24 * s} {x + 60 * s} {y - 24 * s} '
         f'{x + 64 * s} {y - 8 * s} C{x + 78 * s} {y - 10 * s} {x + 84 * s} {y + 8 * s} {x + 72 * s} {y + 14 * s} L{x + 6 * s} {y + 14 * s} C{x - 6 * s} {y + 14 * s} {x - 8 * s} {y + 2 * s} {x} {y} Z')
    return p.sh(d, '#FFFFFF', 2.2) if p.tv else p.flat(d, '#FFE7D0', 0.8)


def house(p, x0, x1, top, base, roof, wall='#F1E6CF', beams='#6B4528', door=True, sign=False):
    o = p.sh(f'M{x0} {top} H{x1} V{base} H{x0} Z', wall, 2.5)
    mid = (x0 + x1) / 2
    o += p.beam(f'M{x0 + 4} {top} V{base} M{x1 - 4} {top} V{base} M{mid} {top} V{base} M{x0} {(top + base) / 2:.0f} H{x1}', beams, 6)
    o += p.beam(f'M{x0 + 4} {top} L{mid} {(top + base) / 2:.0f} M{x1 - 4} {top} L{mid} {(top + base) / 2:.0f}', beams, 5)
    o += p.sh(f'M{x0 - 12} {top + 6} L{mid} {top - (x1 - x0) * 0.5:.0f} L{x1 + 12} {top + 6} Z', roof, 2.5)
    for wx in (x0 + (x1 - x0) * 0.2, x0 + (x1 - x0) * 0.64):
        wy = top + 12
        o += p.sh(f'M{wx:.0f} {wy} H{wx + 26:.0f} V{wy + 24} H{wx:.0f} Z', '#BFE6F5', 2.2)
        o += p.ln(f'M{wx:.0f} {wy + 12} L{wx + 13:.0f} {wy} L{wx + 26:.0f} {wy + 12} L{wx + 13:.0f} {wy + 24} Z', 1.4)
    if door:
        o += p.sh(f'M{mid - 14:.0f} {base - 52} H{mid + 14:.0f} V{base} H{mid - 14:.0f} Z', '#8A5A34', 2.5) + circle(round(mid + 8), base - 26, 2.5, '#E7B53C')
    return o


def village(p):
    o = []
    if p.tv:
        o.append(rect(0, 0, 520, 320, '#9FD3EE'))
    else:
        for y, h, c in [(0, 70, '#5D4A7A'), (70, 50, '#8A5A7A'), (120, 40, '#C26E6E'), (160, 60, '#EE9A6A')]:
            o.append(rect(0, y, 520, h, c))
        o.append(circle(260, 196, 60, '#FFD58A', op=0.6))
    o.append(cloud(p, 50, 50) + cloud(p, 360, 36, 0.8))
    o.append(p.sh('M-10 200 L50 128 L96 166 L160 84 L232 162 L292 108 L362 170 L432 112 L530 174 V230 H-10 Z', '#8AA6C1', 2.5))
    o.append(p.sh('M146 100 L160 84 L176 102 L168 98 L160 106 L152 98 Z', '#FFFFFF', 2) + p.sh('M281 120 L292 108 L304 122 L297 118 L292 124 L287 118 Z', '#FFFFFF', 2) + p.sh('M421 124 L432 112 L444 126 L437 122 L432 128 L427 122 Z', '#FFFFFF', 2))
    o.append(p.sh('M-10 236 C80 206 160 220 240 226 C330 210 420 204 530 224 V270 H-10 Z', '#7DBB5E', 2.5))
    o.append(tree(p, 262, 250, 90) + tree(p, 288, 252, 70, '#4A8A50'))
    o.append(p.sh('M-10 250 H530 V330 H-10 Z', '#C9B18A', 2.5))
    o.append(p.ln('M20 272 C60 268 100 270 140 274 M184 288 C232 284 280 286 330 292 M380 274 C420 270 470 272 510 276 M60 304 C110 300 160 302 210 308 M300 310 C350 306 400 308 450 312', 2, '#9C8460'))
    o.append(house(p, 18, 150, 140, 262, '#B8483A'))
    o.append(p.sh('M116 92 H132 V124 H116 Z', '#9C9488', 2.5))
    o.append(house(p, 304, 440, 122, 262, '#4F6FA8', '#E9DCC0'))
    o.append(p.beam('M304 150 H270', '#3A2A20', 4) + p.sh('M256 156 H292 V184 H256 Z', '#8A5A34', 2.5))
    o.append(p.glow(274, 170, 22, '#F4B942', 1.2) + p.sh('M268 162 H280 L278 178 H270 Z', '#F4B942', 2))
    o.append(p.sh('M408 140 H430 V196 L419 188 L408 196 Z', '#B8483A', 2.2) + circle(419, 160, 5, '#F4B942', K if p.tv else None, 1.5 if p.tv else 0))
    o.append(house(p, 476, 560, 152, 262, '#6E8B4E', door=False))
    # well
    o.append(p.sh('M184 214 H192 V258 H184 Z', '#6B4528', 2.2) + p.sh('M232 214 H240 V258 H232 Z', '#6B4528', 2.2))
    o.append(p.sh('M170 216 L212 188 L254 216 Z', '#B8483A', 2.5))
    o.append(p.ln('M212 216 V238', 2) + p.sh('M205 238 H219 V250 H205 Z', '#8A5A34', 2))
    o.append(p.sh('M180 262 H244 V302 H180 Z', '#A9A39A', 2.5) + p.sh('M174 256 H250 V266 H174 Z', '#8F897F', 2.5))
    o.append(p.ln('M180 282 H244 M200 266 V282 M224 266 V282 M190 282 V302 M212 282 V302 M234 282 V302', 1.8, '#6E6860'))
    # chicken
    o.append(p.sh('M276 300 C266 300 262 288 270 282 C272 274 284 272 288 280 C296 280 300 290 294 298 C290 302 282 302 276 300 Z', '#FFFFFF', 2.2))
    o.append(p.sh('M270 276 C268 270 274 268 276 272 C278 268 284 270 280 276 Z', '#D64545', 1.8) + p.sh('M266 282 L258 285 L266 288 Z', '#F4B942', 1.6))
    o.append(p.ln('M280 302 V310 M288 302 V310', 2) + circle(271, 282, 1.6, K))
    label = ('TV cartoon' if p.tv else 'Chunky heroic') + ' village: timber-framed houses, a lantern inn sign, a well and a chicken, mountains behind'
    return svg('0 0 520 320', ''.join(o), label)


def throne(p):
    o = [p.sh('M-10 -10 H530 V232 H-10 Z', '#5C5070', 2.5)]
    for r_, (y0, y1) in enumerate([(-10, 30), (30, 70), (70, 110), (110, 150), (150, 190), (190, 232)]):
        o.append(p.ln(f'M-10 {y1} H530', 2, '#463C5A'))
        for x in range(-40 + (r_ % 2) * 40, 530, 80):
            o.append(p.ln(f'M{x} {y0} V{y1}', 2, '#463C5A'))
    for x0 in (56, 412):
        o.append(p.sh(f'M{x0} 176 V80 C{x0} 40 {x0 + 52} 40 {x0 + 52} 80 V176 Z', '#7A6E8E', 2.5))
        o.append(p.sh(f'M{x0 + 8} 168 V84 C{x0 + 8} 54 {x0 + 44} 54 {x0 + 44} 84 V168 Z', '#9FC3E8', 2))
        o.append(p.ln(f'M{x0 + 26} 60 V168 M{x0 + 8} 116 H{x0 + 44}', 2))
        o.append(path(f'M{x0 + 10} 168 L{x0 + 60} 232 H{x0 - 6} Z', '#9FC3E8', op=0.12))
    for x in (148, 350):
        o.append(p.sh(f'M{x} -4 H{x + 36} V120 L{x + 18} 106 L{x} 120 Z', '#2F5A44', 2.5))
        o.append(circle(x + 18, 54, 9, '#E9E2D0', K if p.tv else None, 2 if p.tv else 0) + p.sh(f'M{x + 8} 42 L{x + 12} 32 L{x + 18} 40 L{x + 24} 32 L{x + 28} 42 Z', '#E7B53C', 1.8))
    for tx in (28, 492):
        o.append(p.glow(tx, 108, 40, '#FF8A4C', 1.2) + p.sh(f'M{tx - 6} 118 H{tx + 6} L{tx + 4} 146 H{tx - 4} Z', '#6B4528', 2))
        o.append(p.sh(f'M{tx} 86 C{tx + 12} 100 {tx + 10} 112 {tx} 118 C{tx - 10} 112 {tx - 12} 100 {tx} 86 Z', '#FF8A4C', 2))
    o.append(p.sh('M-10 232 H530 V330 H-10 Z', '#3E3550', 2.5))
    o.append(p.ln('M-10 262 H530 M-10 298 H530 M120 232 L60 330 M400 232 L460 330', 2, '#312A40'))
    o.append(p.sh('M194 236 H326 V248 H194 Z', '#7A6E8E', 2.2) + p.sh('M204 224 H316 V236 H204 Z', '#86799A', 2.2) + p.sh('M214 212 H306 V224 H214 Z', '#928AA6', 2.2))
    o.append(p.sh('M196 330 L230 248 H290 L324 330 Z', '#9E2F3A', 2.5) + p.ln('M206 330 L236 248 M314 330 L284 248', 2, '#E7B53C'))
    for lx in (186, 334):
        o.append(p.ln(f'M{lx} 212 V132', 3) + p.glow(lx, 124, 40, '#9BD068', 1.4) + p.sh(f'M{lx - 9} 114 H{lx + 9} L{lx + 7} 136 H{lx - 7} Z', '#9BD068', 2))
    o.append(p.sh('M226 212 V130 C226 104 294 104 294 130 V212 Z', '#D8D0BC', 2.5))
    o.append(p.ln('M240 124 V206 M260 116 V206 M280 124 V206', 2, '#B9AF98'))
    o.append(p.sh('M212 172 H234 V212 H212 Z', '#C9C0A8', 2.5) + p.sh('M286 172 H308 V212 H286 Z', '#C9C0A8', 2.5))
    o.append(p.sh('M226 178 H294 V194 H226 Z', '#9E2F3A', 2.5))
    o.append(circle(260, 106, 20, '#E9E2D0', K if p.tv else None, 2.5 if p.tv else 0) + p.sh('M248 116 H272 V126 H248 Z', '#E9E2D0', 2))
    o.append(circle(252, 104, 5, '#141016') + circle(268, 104, 5, '#141016') + circle(252, 104, 1.8, '#9BD068') + circle(268, 104, 1.8, '#9BD068'))
    o.append(p.sh('M244 178 L248 164 L254 172 L260 160 L266 172 L272 164 L276 178 Z', '#E7B53C', 2.2))
    label = ('TV cartoon' if p.tv else 'Chunky heroic') + ' throne room: purple stone walls, moonlit windows, green lanterns and a bone throne with the crown left on the seat'
    return svg('0 0 520 320', ''.join(o), label)


def wolfwood(p):
    o = [rect(0, 0, 520, 320, '#A9DCF2'), cloud(p, 70, 60), cloud(p, 300, 44, 0.7)]
    o.append(p.sh('M-10 190 C70 150 170 158 250 172 C330 150 420 132 530 160 V240 H-10 Z', '#9CCB7A', 2.5))
    o.append(p.sh('M392 132 H404 V104 H392 Z', '#B9B2C4', 2) + p.sh('M412 132 H436 V96 H412 Z', '#B9B2C4', 2) + p.sh('M444 132 H456 V108 H444 Z', '#B9B2C4', 2))
    o.append(p.sh('M408 96 L424 78 L440 96 Z', '#4F6FA8', 2) + p.ln('M424 78 V64', 2) + p.sh('M424 64 L436 68 L424 72 Z', '#D64545', 1.6))
    o.append(p.sh('M386 132 H462 V148 H386 Z', '#A49CB2', 2))
    o.append(p.sh('M-10 236 C90 210 190 222 270 228 C360 214 440 210 530 226 V330 H-10 Z', '#7DBB5E', 2.5))
    o.append(p.sh('M210 330 C230 290 290 266 320 238 C338 220 352 200 370 186 L382 188 C368 202 356 222 342 244 C318 278 286 302 282 330 Z', '#D8BE8C', 2.5))
    for (x, b, h) in [(40, 300, 150), (98, 280, 112), (14, 250, 96), (470, 300, 140), (430, 262, 96), (150, 248, 70)]:
        o.append(tree(p, x, b, h))
    o.append(p.sh('M352 300 C352 286 372 282 380 292 C388 286 400 292 396 304 Z', '#A9A39A', 2.2) + p.sh('M120 316 C118 304 134 300 140 308 C146 302 158 308 154 318 Z', '#A9A39A', 2.2))
    o.append(p.sh('M186 300 H192 V236 H186 Z', '#6B4528', 2.2))
    o.append(p.sh('M160 240 H210 L218 248 L210 256 H160 Z', '#A0703F', 2.2) + p.sh('M218 262 H170 L162 270 L170 278 H218 Z', '#A0703F', 2.2))
    o.append(p.ln('M170 248 H200 M178 270 H208', 2, '#6B4528'))
    for (x, y, c) in [(60, 318, '#F4B942'), (250, 310, '#FFFFFF'), (440, 316, '#D64545'), (300, 300, '#F4B942'), (90, 300, '#FFFFFF')]:
        o.append(circle(x, y, 4, c, K if p.tv else None, 1.5 if p.tv else 0))
    label = ('TV cartoon' if p.tv else 'Chunky heroic') + ' Wolfwood road: a dirt road winding through pine trees past a signpost toward a castle on a far hill'
    return svg('0 0 520 320', ''.join(o), label)


def barrow_gate(p):
    o = [rect(0, 0, 520, 320, '#5A4A7A'), circle(420, 70, 34, '#F3EBD2', K if p.tv else None, 2.5 if p.tv else 0)]
    o.append(p.sh('M-10 200 C60 170 140 176 200 184 C300 166 420 160 530 186 V250 H-10 Z', '#3E4A5A', 2.5))
    o.append(p.sh('M-10 330 V252 C80 150 440 150 530 252 V330 Z', '#4E7A4A', 2.5))
    o.append(p.glow(260, 250, 70, '#9BD068', 1.5))
    o.append(p.sh('M236 300 V186 H284 V300 Z', '#16121D', 2.5))
    o.append(path('M240 300 C246 270 274 270 280 300 Z', '#9BD068', op=0.35))
    o.append(p.sh('M210 302 V180 H236 V302 Z', '#8C8698', 2.5) + p.sh('M284 302 V180 H310 V302 Z', '#8C8698', 2.5))
    o.append(p.ln('M210 220 H236 M210 260 H236 M284 220 H310 M284 260 H310', 2, '#6E687A'))
    o.append(p.sh('M194 158 H326 V186 H194 Z', '#9A94A6', 2.5))
    o.append(circle(260, 150, 16, '#E9E2D0', K if p.tv else None, 2.5 if p.tv else 0) + circle(254, 148, 4, '#141016') + circle(266, 148, 4, '#141016'))
    for tx in (186, 334):
        o.append(p.glow(tx, 200, 36, '#FF8A4C', 1.2) + p.sh(f'M{tx - 5} 206 H{tx + 5} L{tx + 3} 236 H{tx - 3} Z', '#6B4528', 2))
        o.append(p.sh(f'M{tx} 180 C{tx + 11} 192 {tx + 9} 202 {tx} 208 C{tx - 9} 202 {tx - 11} 192 {tx} 180 Z', '#FF8A4C', 2))
    for (x, y, h) in [(96, 232, 34), (140, 214, 28), (390, 220, 30), (436, 238, 36)]:
        o.append(p.sh(f'M{x - 12} {y + h} V{y + 10} C{x - 12} {y - 4} {x + 12} {y - 4} {x + 12} {y + 10} V{y + h} Z', '#A9A39A', 2.2))
        o.append(p.ln(f'M{x} {y + 6} V{y + 22} M{x - 6} {y + 12} H{x + 6}', 2))
    o.append(p.beam('M482 250 C478 210 486 180 476 150 M478 196 C492 186 500 176 504 160 M480 172 C466 164 458 150 456 136', '#3A2A20', 5))
    o.append(path('M-10 300 C60 288 120 296 180 292 C260 300 340 290 420 298 C460 302 500 296 530 300 V330 H-10 Z', '#B8A8D8', op=0.35))
    label = ('TV cartoon' if p.tv else 'Chunky heroic') + ' barrow gate: a stone doorway in a grassy mound with a skull keystone, torches, gravestones and a green glow inside'
    return svg('0 0 520 320', ''.join(o), label)


# ================================================================ a phone screen in the TV look
def phone_screen():
    p = Pen(True, 2.5)
    o = [rect(0, 0, 390, 844, '#A9DCF2'), cloud(p, 40, 150), cloud(p, 250, 120, 0.7)]
    o.append(p.sh('M-10 300 C70 270 150 276 210 284 C280 266 340 260 400 274 V360 H-10 Z', '#9CCB7A', 2.5))
    o.append(p.sh('M168 262 H180 V236 H168 Z', '#B9B2C4', 2) + p.sh('M186 262 H210 V226 H186 Z', '#B9B2C4', 2) + p.sh('M216 262 H228 V240 H216 Z', '#B9B2C4', 2))
    o.append(p.sh('M182 226 L198 208 L214 226 Z', '#4F6FA8', 2) + p.sh('M162 262 H234 V276 H162 Z', '#A49CB2', 2))
    o.append(p.sh('M-10 350 C90 320 300 324 400 340 V860 H-10 Z', '#7DBB5E', 2.5))
    o.append(p.sh('M120 860 C130 740 170 620 190 520 C196 470 200 420 204 380 L214 380 C214 420 214 470 216 520 C230 620 266 740 280 860 Z', '#D8BE8C', 2.5))
    for (x, b, h) in [(40, 520, 150), (350, 540, 160), (20, 700, 190), (372, 720, 180), (80, 420, 90), (318, 430, 96)]:
        o.append(tree(p, x, b, h))
    o.append(p.sh('M290 610 H296 V548 H290 Z', '#6B4528', 2.2) + p.sh('M266 552 H312 L320 560 L312 568 H266 Z', '#A0703F', 2.2))
    o.append(circle(300, 520, 14, '#F4B942', K, 2.5) + path('M300 512 V522 M300 527 V528', 'none', K, 3.5))
    # the party walking up the road
    def place(fn, x, y, w):
        s = fn(Pen(True)).replace('<svg viewBox="0 0 300 420" role="img"', f'<svg x="{x}" y="{y}" width="{w}" height="{w * 1.4:.0f}" viewBox="0 70 300 330" role="img"', 1)
        s = s.replace('style="display: block; width: 100%; height: auto;"', '', 1)
        s = re.sub(r'<rect x="0" y="0" width="300" height="420"[^>]*/>', '', s, count=1)
        return re.sub(r'<path d="M-10 3\d\d C[^"]*V430 H-10 Z"[^>]*/>', '', s, count=1)
    o.append(place(sorceress, 116, 520, 92))
    o.append(place(iron_warden, 196, 520, 96))
    o.append(place(orc_ranger, 140, 600, 120))
    # UI
    o.append(rect(14, 44, 190, 64, '#FFFFFF', rx=14) + path('M14 58 C14 50 20 44 28 44 H190 C198 44 204 50 204 58 V94 C204 102 198 108 190 108 H28 C20 108 14 102 14 94 Z', 'none', K, 2.5))
    head = orc_ranger(Pen(True)).replace('<svg viewBox="0 0 300 420" role="img"', '<svg x="22" y="50" width="52" height="52" viewBox="100 54 100 100" role="img"', 1).replace('style="display: block; width: 100%; height: auto;"', '', 1)
    o.append(rect(22, 50, 52, 52, '#E3EEF5', rx=8) + head + path('M22 58 C22 53 26 50 30 50 H66 C70 50 74 53 74 58 V94 C74 99 70 102 66 102 H30 C26 102 22 99 22 94 Z', 'none', K, 2.5))
    o.append('<text x="84" y="70" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 17px; fill: #1E1A1A">Grukk</text>')
    o.append(rect(84, 80, 108, 10, '#E3D9D6', rx=5) + rect(84, 80, 84, 10, '#6FBF4A', rx=5) + path('M89 80 H187 C190 80 192 82 192 85 C192 88 190 90 187 90 H89 C86 90 84 88 84 85 C84 82 86 80 89 80 Z', 'none', K, 2))
    o.append(circle(332, 84, 44, '#9CCB7A', K, 3) + path('M318 120 C324 100 338 84 344 52', 'none', '#D8BE8C', 6) + circle(330, 92, 5, '#D64545', K, 2))
    o.append(circle(346, 64, 4, '#3F7A4A') + circle(312, 76, 5, '#3F7A4A') + circle(352, 104, 4, '#3F7A4A'))
    o.append(circle(332, 36, 11, '#FFFFFF', K, 2.5) + '<text x="332" y="41" text-anchor="middle" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 13px; fill: #1E1A1A">N</text>')
    o.append(rect(212, 140, 164, 46, '#FFFFFF', rx=12, op=0.92) + path('M224 140 H364 C371 140 376 145 376 152 V174 C376 181 371 186 364 186 H224 C217 186 212 181 212 174 V152 C212 145 217 140 224 140 Z', 'none', K, 2))
    o.append('<text x="224" y="159" style="font-family: \'Lilita One\', \'Trebuchet MS\', sans-serif; font-size: 13px; fill: #1E1A1A">Clear the Wolfwood road</text>')
    o.append('<text x="224" y="177" style="font-family: \'DM Mono\', monospace; font-size: 11px; fill: #5A4A50">Wolves 2 of 5</text>')
    o.append(rect(0, 752, 390, 92, '#FFFFFF', op=0.94) + path('M0 752 H390', 'none', K, 3))
    for i, k in enumerate(['chop', 'overhead', 'shout', 'taunt', 'shatter', 'ult']):
        t = TILES[k].replace('<svg viewBox="0 0 64 64" aria-hidden="true">', f'<svg x="{14 + i * 62}" y="770" width="54" height="54" viewBox="0 0 64 64">')
        t = t.replace('<rect width="64" height="64" style=', '<rect width="64" height="64" rx="11" style=', 1)
        o.append(t + f'<rect x="{14 + i * 62}" y="770" width="54" height="54" rx="9" style="fill: none; stroke: {K}; stroke-width: 2.5"/>')
    return svg('0 0 390 844', ''.join(o), 'Phone mockup in the TV cartoon look: an orc ranger leads the party up the Wolfwood road, with a portrait, health bar, minimap, quest tracker and action bar')


TV, HERO = Pen(True), Pen(False)
PIECES = {
    'warden': lambda: iron_warden(TV), 'warden_h': lambda: iron_warden(HERO),
    'rogue': lambda: rogue(TV), 'sorceress': lambda: sorceress(TV), 'orc': lambda: orc_ranger(TV),
    'village': lambda: village(Pen(True, 2.5)), 'village_h': lambda: village(HERO),
    'throne': lambda: throne(Pen(True, 2.5)), 'throne_h': lambda: throne(HERO),
    'wolfwood': lambda: wolfwood(Pen(True, 2.5)), 'gate': lambda: barrow_gate(Pen(True, 2.5)),
    'phone': phone_screen,
}

if __name__ == '__main__':
    names = sys.argv[2].split(',') if len(sys.argv) > 2 else list(PIECES)
    cells = []
    for k in names:
        w = 260 if k in ('warden', 'warden_h', 'rogue', 'sorceress', 'orc', 'phone') else 520
        cells.append(f'<div style="width:{w}px;border-radius:10px;overflow:hidden">{PIECES[k]()}</div>')
    open(sys.argv[1], 'w').write('<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start">' + ''.join(cells) + '</div>')
    print('ok', {k: len(PIECES[k]()) for k in names})
