import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Ability icons for the Barrow Crypt (64x64 TV tiles: flat bright ground, one black line, one idea each).
# Usage: python3 tools/art_icons.py -> art/icons.json + art/_icons_preview.html
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fighttiles import TV_TILES
from art_sprites import gild

OUT = HF_ROOT + '/art/'
K = '#1E1A1A'


def f1(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def P(d, col, w, op=None):
    o = f'; opacity: {op}' if op is not None else ''
    return f'<path d="{d}" style="fill: none; stroke: {col}; stroke-width: {w}; stroke-linecap: round; stroke-linejoin: round{o}"/>'


def F(d, fill, w=3.5):
    return f'<path d="{d}" style="fill: {fill}; stroke: {K}; stroke-width: {w}; stroke-linejoin: round"/>'


def inked(d, col, w):
    return P(d, K, w + 4.5) + P(d, col, w)


def C(cx, cy, r, fill, w=3.2):
    st = f'; stroke: {K}; stroke-width: {w}' if w else ''
    return f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{f1(r)}" style="fill: {fill}{st}"/>'


def tile(bg, inner):
    return f'<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" style="fill: {bg}"/>{inner}</svg>'


T = {}
T['taunt'] = TV_TILES['taunt']

T['shield'] = tile('#C8403F',
                   P('M6 18 L14 24 M4 32 H13 M6 46 L14 40', '#FFF3C4', 3.4) +
                   C(38, 32, 21, '#F2C230', 3.5) + C(38, 32, 15, '#9AA7B8', 3) + C(38, 32, 6, '#F2C230', 3) +
                   P('M28 22 C32 19 37 18 42 19', '#FFFFFF', 2.6, 0.9))

T['charge'] = tile('#E07A2E',
                   P('M4 22 H18 M2 34 H16 M6 46 H20', '#FFF3C4', 3.6) +
                   F('M24 40 C24 22 54 22 54 40 Z', '#9AA7B8') + F('M22 38 H56 V45 H22 Z', '#7D8FA3', 3) +
                   F('M26 30 C18 28 14 20 16 10 C20 18 26 22 32 24 Z', '#F0E8D2', 3) +
                   F('M52 30 C60 28 64 20 62 10 C58 18 52 22 46 24 Z', '#F0E8D2', 3) +
                   F('M26 46 C30 58 48 58 52 46 Z', '#E2733A', 3))

# healer
pts = []
for k in range(8):
    a = math.radians(k * 45)
    pts.append(inked(f'M{f1(32 + 13 * math.cos(a))} {f1(30 + 13 * math.sin(a))} L{f1(32 + 19 * math.cos(a))} {f1(30 + 19 * math.sin(a))}', '#F2C230', 3.2))
T['sunburst'] = tile('#E07A2E', ''.join(pts) + C(32, 30, 10, '#F2C230', 3.5) + C(29, 27, 3, '#FFF6D0', 0) +
                     P('M10 54 C18 50 24 50 32 54 C40 50 46 50 54 54', '#FFF3C4', 3, 0.9))

T['circle'] = tile('#6A4BA3',
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: #F2C230; opacity: 0.4"/>' +
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/>' +
                   '<ellipse cx="32" cy="40" rx="25" ry="11" style="fill: none; stroke: #F2C230; stroke-width: 3.4"/>' +
                   inked('M32 12 V28 M24 20 H40', '#FFFFFF', 4) +
                   P('M14 24 L16 28 M50 22 L48 27', '#FFF3C4', 2.6))

T['ward'] = tile('#2F6FA8',
                 '<circle cx="32" cy="33" r="21" style="fill: #DDF3FF; opacity: 0.55; stroke: #1E1A1A; stroke-width: 3.5"/>' +
                 P('M20 22 C24 16 30 14 36 15', '#FFFFFF', 3.2) +
                 F('M32 23 L41 27 V34 C41 40 37 44 32 46 C27 44 23 40 23 34 V27 Z', '#F2C230', 3))

T['mend'] = tile('#4E9A4A', inked('M32 14 V50 M14 32 H50', '#FFFFFF', 7) + P('M48 14 L52 10 M54 20 H58', '#FFF3C4', 2.6))

# dps
flakes = ''
for (x, y) in [(18, 46), (32, 52), (46, 45), (24, 57), (42, 58)]:
    flakes += P(f'M{x} {y - 4} V{y + 4} M{x - 3.5} {y - 2} L{x + 3.5} {y + 2} M{x - 3.5} {y + 2} L{x + 3.5} {y - 2}', K, 4.5) + P(f'M{x} {y - 4} V{y + 4} M{x - 3.5} {y - 2} L{x + 3.5} {y + 2} M{x - 3.5} {y + 2} L{x + 3.5} {y - 2}', '#FFFFFF', 2)
T['blizzard'] = tile('#1F4F7A', F('M12 34 C6 34 6 24 13 23 C13 14 25 12 28 19 C32 10 46 12 46 21 C54 20 58 30 51 34 Z', '#DDE6EE') + P('M18 30 H44', '#9FB3C6', 2.4) + flakes)

spikes = ''
for k in range(8):
    a = math.radians(k * 45 + 22.5)
    cx, cy = 32 + 17 * math.cos(a), 32 + 17 * math.sin(a)
    tx, ty = 32 + 28 * math.cos(a), 32 + 28 * math.sin(a)
    lx, ly = cx + 5 * math.cos(a + math.pi / 2), cy + 5 * math.sin(a + math.pi / 2)
    rx, ry = cx - 5 * math.cos(a + math.pi / 2), cy - 5 * math.sin(a + math.pi / 2)
    spikes += F(f'M{f1(lx)} {f1(ly)} L{f1(tx)} {f1(ty)} L{f1(rx)} {f1(ry)} Z', '#8FD6FF', 2.6)
T['nova'] = tile('#4F6FA8', spikes + '<circle cx="32" cy="32" r="16" style="fill: none; stroke: #1E1A1A; stroke-width: 8"/>' +
                 '<circle cx="32" cy="32" r="16" style="fill: none; stroke: #DDF3FF; stroke-width: 4"/>' + C(32, 32, 6, '#FFFFFF', 3))

T['comet'] = tile('#6A4BA3',
                  F('M6 14 C18 22 26 30 32 36 L26 44 C20 36 12 26 6 14 Z', '#DDF3FF', 0) +
                  P('M8 10 L28 34 M14 8 L32 30', '#DDF3FF', 3, 0.85) +
                  C(38, 42, 14, '#8FD6FF', 3.5) + F('M42 34 L48 40 L40 42 Z', '#FFFFFF', 1.8) +
                  P('M32 40 L37 46 L32 52', '#5BAAD8', 2.6))

T['dodge'] = tile('#4E9A4A',
                  inked('M12 46 C16 24 34 14 50 18', '#FFF3C4', 5) + F('M44 9 L56 19 L42 25 Z', '#FFF3C4', 3) +
                  C(14, 52, 5, '#C9B79A', 2.6) + C(24, 54, 4, '#C9B79A', 2.4) + C(7, 44, 3.5, '#C9B79A', 2.2))

link = lambda x, y, a: f'<ellipse cx="{x}" cy="{y}" rx="8" ry="5" transform="rotate({a} {x} {y})" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/><ellipse cx="{x}" cy="{y}" rx="8" ry="5" transform="rotate({a} {x} {y})" style="fill: none; stroke: #C9D2DC; stroke-width: 3"/>'
T['cut'] = tile('#C8403F', link(14, 50, -40) + link(24, 40, 50) + link(42, 22, 50) + link(52, 12, -40) +
                P('M14 22 L50 46', '#1E1A1A', 9) + P('M14 22 L50 46', '#FFFFFF', 4.5))


# ---- loot item icons (neutral ground; rarity shows as the frame colour)
IB = '#3A3150'
T['i_axe'] = tile(IB, inked('M20 54 L42 14', '#A0703F', 5) + F('M36 10 C48 2 62 12 58 30 C48 28 40 22 36 10 Z', '#D7DEE6') + P('M43 9 C51 8 56 14 57 22', '#FFFFFF', 2.2, 0.9) + C(20, 54, 3.4, '#6B4528', 2))
T['i_shield'] = tile(IB, C(32, 32, 22, '#F2C230', 3.5) + C(32, 32, 16, '#C8403F', 3) + P('M32 17 V47 M17 32 H47', '#9E2F2E', 2.6) + C(32, 32, 6, '#C9D2DC', 3))
T['i_plate'] = tile(IB, F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#9AA7B8') + P('M32 18 V50', '#7D8FA3', 3) + F('M12 18 C16 12 24 12 26 18 C22 22 16 24 12 18 Z', '#C9D2DC', 2.6) + F('M52 18 C48 12 40 12 38 18 C42 22 48 24 52 18 Z', '#C9D2DC', 2.6))
rays = ''
for k in range(8):
    a = math.radians(k * 45 + 22.5)
    rays += inked(f'M{f1(40 + 9 * math.cos(a))} {f1(20 + 9 * math.sin(a))} L{f1(40 + 14 * math.cos(a))} {f1(20 + 14 * math.sin(a))}', '#F2C230', 2.6)
T['i_sunstaff'] = tile(IB, inked('M18 58 L38 24', '#A0703F', 4.5) + rays + C(40, 20, 7, '#F2C230', 3))
T['i_icestaff'] = tile(IB, inked('M18 58 L36 26', '#A0703F', 4.5) + '<circle cx="40" cy="18" r="13" style="fill: #8FD6FF; opacity: 0.35"/>' + F('M40 4 L48 18 L40 32 L32 18 Z', '#8FD6FF', 3) + P('M38 10 L35 17', '#FFFFFF', 2))
T['i_dagger'] = tile(IB,
                     inked('M12 46 L22 34', '#6B4528', 4.5) + F('M17 29 L27 39 L24 42 L14 32 Z', '#F2C230', 2.8) +
                     F('M20 32 C28 20 38 10 46 8 C44 17 36 29 26 37 Z', '#C9D2DC', 3.2) +
                     inked('M24 54 L36 40', '#6B4528', 4.8) + F('M30 34 L42 46 L39 49 L27 37 Z', '#F2C230', 3) +
                     F('M34 38 C44 24 52 14 58 12 C56 22 48 36 39 43 Z', '#D7DEE6', 3.4) +
                     P('M39 36 C46 26 51 20 55 16', '#FFFFFF', 2, 0.9))
T['i_robe'] = tile(IB, F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#4F86C6') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#F2C230', 2.6) + F('M22 12 C28 20 36 20 42 12 C38 9 26 9 22 12 Z', '#F6F1E4', 2.6))
T['i_charm'] = tile(IB, P('M20 10 C24 26 40 26 44 10', '#C9D2DC', 3) + '<circle cx="32" cy="38" r="15" style="fill: #B79CFF; opacity: 0.3"/>' + F('M32 24 L44 38 L32 54 L20 38 Z', '#B79CFF', 3.2) + P('M30 32 L26 38', '#FFFFFF', 2.2))

# ---- v2 abilities: every role has a fourth button
rings = ('<ellipse cx="32" cy="50" rx="27" ry="8" style="fill: none; stroke: #1E1A1A; stroke-width: 7"/>'
         '<ellipse cx="32" cy="50" rx="27" ry="8" style="fill: none; stroke: #FFF3C4; stroke-width: 3"/>')
star = ''.join(f"{'M' if k == 0 else 'L'}{f1(32 + (22 if k % 2 == 0 else 9) * math.cos(math.radians(k * 36 - 90)))} {f1(48 + (12 if k % 2 == 0 else 5) * math.sin(math.radians(k * 36 - 90)))} " for k in range(10)) + 'Z'
T['slam'] = tile('#E07A2E',
                 F(star, '#FFE08A', 3) +
                 P('M14 58 L22 52 M50 58 L42 52 M32 62 V56', '#1E1A1A', 3) +
                 inked('M46 6 L34 38', '#A0703F', 5) +
                 F('M30 34 C22 30 18 40 22 50 C28 46 34 46 40 46 C40 40 36 36 30 34 Z', '#D7DEE6') +
                 P('M8 22 L14 28 M56 22 L50 28 M10 36 H16', '#FFF3C4', 3) +
                 C(12, 50, 3, '#C9B79A', 2) + C(54, 48, 2.6, '#C9B79A', 2))
T['cleave'] = tile('#C8403F',
                   '<path d="M8 44 C14 20 38 8 58 14" style="fill: none; stroke: #1E1A1A; stroke-width: 13; stroke-linecap: round"/>'
                   '<path d="M8 44 C14 20 38 8 58 14" style="fill: none; stroke: #FFE08A; stroke-width: 7; stroke-linecap: round"/>'
                   '<path d="M14 40 C20 24 38 15 52 18" style="fill: none; stroke: #FFFFFF; stroke-width: 2.6; stroke-linecap: round"/>' +
                   inked('M22 58 L40 30', '#A0703F', 4.5) + F('M36 24 C46 16 58 24 54 38 C46 36 40 32 36 24 Z', '#D7DEE6'))
T['smite'] = tile('#E7B53C',
                  '<circle cx="34" cy="30" r="20" style="fill: #FFF3C4; opacity: 0.5"/>' +
                  C(34, 30, 12, '#FFFFFF', 3.5) + inked('M34 22 V38 M26 30 H42', '#F2C230', 3.4) +
                  inked('M10 56 L24 40', '#FFF3C4', 4) + F('M10 50 L4 58 L14 56 Z', '#FFF3C4', 2.4) +
                  P('M50 10 L54 6 M56 18 H61 M46 6 V2', '#FFFFFF', 2.6))
T['icicle'] = tile('#1F4F7A',
                   '<circle cx="40" cy="22" r="16" style="fill: #8FD6FF; opacity: 0.3"/>' +
                   F('M8 58 L44 10 L54 18 Z', '#DDF3FF', 3.5) + P('M16 50 L44 16', '#FFFFFF', 2.4) + P('M30 42 L48 22', '#8FD6FF', 2.4) +
                   P('M52 44 V54 M47 49 H57', '#FFFFFF', 2.8) + P('M14 14 V20 M11 17 H17', '#FFFFFF', 2.4))

# ---- rogue abilities: fast twin-dagger strikes, bleed, fan of blades, shadowstep
T['viper'] = tile('#245838',
                  '<path d="M10 46 C22 24 40 14 56 16" style="fill: none; stroke: #1E1A1A; stroke-width: 11; stroke-linecap: round"/>'
                  '<path d="M10 46 C22 24 40 14 56 16" style="fill: none; stroke: #7CF06A; stroke-width: 5.5; stroke-linecap: round"/>' +
                  inked('M12 52 L24 38', '#5C4028', 4.5) + F('M18 33 L29 44 L26 47 L15 36 Z', '#C9A040', 2.8) +
                  F('M22 36 C32 22 44 12 54 10 C51 22 41 34 29 42 Z', '#D7DEE6', 3.4) +
                  F('M48 34 C52 40 52 46 48 49 C44 46 44 40 48 34 Z', '#7CF06A', 2.6) +
                  C(38, 52, 4, '#7CF06A', 2.4))
T['ambush'] = tile('#9E2432',
                   '<circle cx="32" cy="34" r="19" style="fill: #FF6B6B; opacity: 0.35"/>' +
                   F('M32 50 C20 42 14 32 16 23 C18 16 26 16 32 23 C38 16 46 16 48 23 C50 32 44 42 32 50 Z', '#E63E4D', 3.4) +
                   F('M10 8 L28 32 L22 36 Z', '#D7DEE6', 3) + F('M54 8 L36 32 L42 36 Z', '#D7DEE6', 3) +
                   P('M26 32 L38 44 M38 32 L26 44', '#FFE08A', 3.2))
fan_knives = ''
for _k in range(6):
    _a = math.radians(_k * 60 + 15)
    _x1, _y1 = 32 + 10 * math.cos(_a), 32 + 10 * math.sin(_a)
    _x2, _y2 = 32 + 27 * math.cos(_a), 32 + 27 * math.sin(_a)
    _lx, _ly = 32 + 16 * math.cos(_a + 0.22), 32 + 16 * math.sin(_a + 0.22)
    _rx, _ry = 32 + 16 * math.cos(_a - 0.22), 32 + 16 * math.sin(_a - 0.22)
    fan_knives += F(f'M{f1(_lx)} {f1(_ly)} L{f1(_x2)} {f1(_y2)} L{f1(_rx)} {f1(_ry)} Z', '#D7DEE6', 2.6)
T['flurry'] = tile('#5A387E',
                   '<circle cx="32" cy="32" r="20" style="fill: none; stroke: #B79CFF; stroke-width: 4; opacity: 0.55"/>' +
                   fan_knives + C(32, 32, 7, '#F2C230', 3))
T['shadowstep'] = tile('#34224E',
                       '<ellipse cx="32" cy="48" rx="22" ry="8" style="fill: #8E5CE6; opacity: 0.45"/>' +
                       P('M12 46 C18 22 34 14 50 18', '#B79CFF', 5) +
                       F('M22 44 C20 26 28 14 38 14 C46 14 52 26 50 44 C42 40 30 40 22 44 Z', '#241838', 3.2) +
                       C(33, 28, 2.4, '#7CF06A', 0) + C(41, 28, 2.4, '#7CF06A', 0) +
                       F('M44 46 L58 28 L52 48 Z', '#D7DEE6', 2.6))

# ---- the four gear slots for every role
HELM = (F('M18 40 C18 18 46 18 46 40 Z', '#9AA7B8') + F('M16 38 H48 V46 H16 Z', '#7D8FA3', 3) +
        F('M18 28 C8 26 4 16 6 6 C10 14 16 18 22 20 Z', '#F0E8D2', 3) + F('M46 28 C56 26 60 16 58 6 C54 14 48 18 42 20 Z', '#F0E8D2', 3) +
        C(26, 42, 1.6, '#1E1A1A', 0) + C(32, 42, 1.6, '#1E1A1A', 0) + C(38, 42, 1.6, '#1E1A1A', 0))
PAUL = (F('M6 40 C4 22 22 14 30 26 C24 36 14 42 6 40 Z', '#9AA7B8') + F('M58 40 C60 22 42 14 34 26 C40 36 50 42 58 40 Z', '#9AA7B8') +
        P('M10 34 C14 28 20 26 26 28 M54 34 C50 28 44 26 38 28', '#C9D2DC', 2.4) + C(16, 30, 2.4, '#F2C230', 1.6) + C(48, 30, 2.4, '#F2C230', 1.6))
HOOD = (F('M14 52 C10 30 18 10 32 10 C46 10 54 30 50 52 C42 46 22 46 14 52 Z', '#F6F1E4') +
        F('M22 44 C20 30 24 22 32 22 C40 22 44 30 42 44 C38 40 26 40 22 44 Z', '#3A2E40', 3) + P('M32 10 V20', '#E7B53C', 3))
MANT = (F('M6 42 C8 26 20 18 32 18 C44 18 56 26 58 42 C48 38 40 40 32 46 C24 40 16 38 6 42 Z', '#F6F1E4') +
        P('M14 34 C20 28 26 26 32 26 C38 26 44 28 50 34', '#E7B53C', 3) + C(32, 30, 4, '#F2C230', 2.4))
HAT = (F('M8 50 C20 44 44 44 56 50 C46 56 18 56 8 50 Z', '#4F86C6') + F('M20 48 C22 34 30 22 44 8 C42 22 42 36 44 48 Z', '#4F86C6') +
       F('M20 46 C30 42 38 42 44 46 L44 50 C36 47 28 47 20 50 Z', '#F2C230', 2.6) + P('M40 14 L44 8', '#FFFFFF', 2) + C(36, 30, 2.4, '#DDF3FF', 1.6))
MASK = (F('M14 50 C11 28 19 10 32 10 C45 10 53 28 50 50 C42 45 22 45 14 50 Z', '#3B2D4A') +
        F('M20 32 H44 L41 48 C35 51 29 51 23 48 Z', '#241B30', 3) +
        C(26, 28, 2.6, '#7CF06A', 0) + C(38, 28, 2.6, '#7CF06A', 0) + P('M22 36 H42', '#5A4670', 2.2))
SPAULD = (F('M6 40 C5 22 21 15 30 26 C24 35 14 41 6 40 Z', '#4A385C') + F('M58 40 C59 22 43 15 34 26 C40 35 50 41 58 40 Z', '#4A385C') +
          F('M12 22 L8 10 L20 18 Z', '#C9D2DC', 2.6) + F('M52 22 L56 10 L44 18 Z', '#C9D2DC', 2.6) +
          C(18, 30, 2.4, '#7CF06A', 1.6) + C(46, 30, 2.4, '#7CF06A', 1.6))
JERKIN = (F('M18 14 C26 11 38 11 46 14 L50 26 L44 30 L45 52 H19 L20 30 L14 26 Z', '#4A385C') +
          P('M21 20 L43 44 M43 20 L21 44', '#8C6239', 3.4) + F('M20 42 H44 V48 H20 Z', '#5C4028', 2.8) + C(32, 45, 3.2, '#F2C230', 2))
T['i_helm'] = tile(IB, HELM)
T['i_pauldrons'] = tile(IB, PAUL)
T['i_hood'] = tile(IB, HOOD)
T['i_mantle'] = tile(IB, MANT)
T['i_hat'] = tile(IB, HAT)
T['i_mask'] = tile(IB, MASK)
T['i_spaulders'] = tile(IB, SPAULD)
T['i_jerkin'] = tile(IB, JERKIN)

# ---- 4-tier visual progression for regular gear (0: Rags/Wood/Bronze, 1: Iron/Leather, 2: Runed Steel/Silk, 3: Masterwork Epic)
B0, B1, B2, B3 = '#3B322C', '#2B3B32', '#263850', '#3B2B54'
RAG, RAG_D, ROPE, BRONZE = '#A68E74', '#7D6852', '#C9B08A', '#C88344'
# Tier 0: Humble Rags, Rope & Bronze/Wood
T['i_axe_0'] = tile(B0, inked('M18 54 L40 18', '#7D5532', 5) + F('M33 15 C43 10 54 17 50 30 L45 27 L47 23 L42 24 C37 22 35 19 33 15 Z', BRONZE, 3.2) + P('M32 22 L40 26 M34 18 L40 22', ROPE, 2.4))
T['i_helm_0'] = tile(B0, F('M16 42 C16 20 48 20 48 42 C38 39 26 39 16 42 Z', RAG, 3.2) + F('M14 40 H50 L48 47 H16 Z', RAG_D, 3) + F('M32 23 L41 26 L39 34 L30 31 Z', RAG_D, 2.4) + P('M30 27 L33 25 M38 29 L41 27', ROPE, 2))
T['i_pauldrons_0'] = tile(B0, F('M8 42 C6 26 20 18 28 28 C23 36 15 42 8 42 Z', RAG, 3.2) + F('M56 42 C58 26 44 18 36 28 C41 36 49 42 56 42 Z', RAG, 3.2) + P('M14 26 L22 36 M50 26 L42 36 M26 30 H38', ROPE, 2.6))
T['i_plate_0'] = tile(B0, F('M20 16 C27 19 37 19 44 16 L50 26 L44 30 L45 52 L38 50 L32 53 L26 50 L19 52 L20 30 L14 26 Z', RAG, 3.2) + F('M33 26 H41 V35 H33 Z', RAG_D, 2.4) + P('M20 39 H44', ROPE, 3.2))
T['i_sunstaff_0'] = tile(B0, inked('M18 56 C24 42 28 32 36 18 C40 12 46 14 44 20', '#7D5532', 4.8) + F('M38 14 C44 6 52 10 46 18 C42 18 39 16 38 14 Z', '#6EAE46', 2.6))
T['i_hood_0'] = tile(B0, F('M14 52 C11 30 19 12 32 12 C45 12 53 30 50 52 C42 46 22 46 14 52 Z', RAG, 3.2) + F('M22 44 C21 31 25 23 32 23 C39 23 43 31 42 44 Z', '#2B231D', 3) + F('M35 16 L44 20 L41 28 L33 24 Z', RAG_D, 2.4))
T['i_mantle_0'] = tile(B0, F('M8 42 C10 26 20 19 32 19 C44 19 54 26 56 42 L48 40 L40 44 L32 40 L24 44 L16 40 Z', RAG, 3.2) + F('M36 24 H45 V32 H36 Z', RAG_D, 2.2) + P('M26 28 L38 28', '#6B4528', 3.4))
T['i_robe_0'] = tile(B0, F('M22 14 C28 18 36 18 42 14 L48 22 L43 28 L45 53 L37 50 L32 54 L27 50 L19 53 L21 28 L16 22 Z', RAG, 3.2) + F('M34 34 H42 V43 H34 Z', RAG_D, 2.4) + P('M21 31 H43', ROPE, 3.2))
T['i_icestaff_0'] = tile(B0, inked('M18 56 L38 22', '#7D5532', 4.5) + C(41, 17, 6.5, '#8A9BA8', 2.8) + P('M35 23 L43 19 M37 19 L41 25', ROPE, 2.2))
T['i_hat_0'] = tile(B0, F('M10 50 C22 45 42 45 54 50 C44 55 20 55 10 50 Z', '#68768A', 3) + F('M20 48 C21 34 27 22 42 18 C48 17 50 23 44 26 C41 32 42 40 44 48 Z', '#68768A', 3) + F('M25 34 L34 32 L35 40 L26 42 Z', RAG, 2.4))
T['i_dagger_0'] = tile(B0,
                       inked('M14 48 L22 36', '#7D5532', 4.2) + F('M20 34 C26 24 34 16 40 14 C38 22 32 31 24 38 Z', BRONZE, 3) +
                       inked('M26 54 L36 42', '#7D5532', 4.5) + F('M34 40 C42 28 49 20 55 18 C53 26 46 37 38 44 Z', BRONZE, 3.2) +
                       P('M22 38 L28 42 M34 44 L40 48', ROPE, 2.4))
T['i_mask_0'] = tile(B0, F('M16 46 L48 46 L44 26 C36 22 28 22 20 26 Z', RAG, 3.2) + F('M22 32 H42 L40 46 H24 Z', RAG_D, 2.8) + P('M24 38 H40', ROPE, 2.2))
T['i_spaulders_0'] = tile(B0, F('M8 42 C7 26 20 19 28 28 C23 36 15 41 8 42 Z', RAG, 3.2) + F('M56 42 C57 26 44 19 36 28 C41 36 49 41 56 42 Z', RAG, 3.2) + P('M26 30 H38', ROPE, 2.6))
T['i_jerkin_0'] = tile(B0, F('M20 16 C27 19 37 19 44 16 L49 26 L44 30 L45 52 H19 L20 30 L15 26 Z', RAG, 3.2) + P('M24 22 L40 42', ROPE, 3) + P('M20 42 H44', ROPE, 3.2))

# Tier 1: Forged Iron, Studded Leather & Clean Cloth
T['i_axe_1'] = tile(B1, inked('M20 54 L42 14', '#8C6239', 5) + F('M36 12 C47 5 59 13 55 28 C46 26 39 21 36 12 Z', '#9AA7B8', 3.2) + C(20, 54, 3.2, '#5C4028', 2))
T['i_helm_1'] = tile(B1, F('M18 42 C18 18 46 18 46 42 Z', '#9AA7B8', 3.2) + F('M15 39 H49 V46 H15 Z', '#7D8FA3', 3) + F('M30 26 H34 V48 H30 Z', '#7D8FA3', 2.6))
T['i_pauldrons_1'] = tile(B1, F('M7 40 C5 23 22 16 30 27 C24 36 14 41 7 40 Z', '#8C6239', 3.2) + F('M57 40 C59 23 42 16 34 27 C40 36 50 41 57 40 Z', '#8C6239', 3.2) + C(17, 30, 2.6, '#C9D2DC', 1.8) + C(47, 30, 2.6, '#C9D2DC', 1.8))
T['i_plate_1'] = tile(B1, F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#7D8FA3', 3.2) + P('M20 38 H44', '#6B4528', 4) + C(32, 38, 3, '#C9D2DC', 2))
T['i_sunstaff_1'] = tile(B1, inked('M18 58 L38 24', '#8C6239', 4.5) + C(40, 20, 9, '#D08A4E', 3.2) + C(40, 20, 4, '#FFE08A', 2))
T['i_hood_1'] = tile(B1, F('M14 52 C10 30 18 10 32 10 C46 10 54 30 50 52 C42 46 22 46 14 52 Z', '#D9CEB8', 3.2) + F('M22 44 C20 30 24 22 32 22 C40 22 44 30 42 44 Z', '#3A2E40', 3))
T['i_mantle_1'] = tile(B1, F('M6 42 C8 26 20 18 32 18 C44 18 56 26 58 42 C48 38 40 40 32 46 C24 40 16 38 6 42 Z', '#D9CEB8', 3.2) + C(32, 30, 3.8, '#D08A4E', 2.2))
T['i_robe_1'] = tile(B1, F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#3E6B9C', 3.2) + F('M29 16 H35 V54 H29 Z', '#D9CEB8', 2.4))
T['i_icestaff_1'] = tile(B1, inked('M18 58 L36 26', '#8C6239', 4.5) + F('M40 8 L46 19 L40 30 L34 19 Z', '#8FD6FF', 2.8))
T['i_hat_1'] = tile(B1, F('M8 50 C20 44 44 44 56 50 C46 56 18 56 8 50 Z', '#3E6B9C', 3) + F('M20 48 C22 34 30 22 42 10 C41 24 42 36 44 48 Z', '#3E6B9C', 3) + F('M20 46 H44 V50 H20 Z', '#8C6239', 2.4))
T['i_dagger_1'] = tile(B1,
                       inked('M12 46 L22 34', '#5C4028', 4.5) + F('M17 29 L27 39 L24 42 L14 32 Z', '#7D8FA3', 2.8) +
                       F('M20 32 C28 20 38 10 46 8 C44 17 36 29 26 37 Z', '#9AA7B8', 3.2) +
                       inked('M24 54 L36 40', '#5C4028', 4.8) + F('M30 34 L42 46 L39 49 L27 37 Z', '#7D8FA3', 3) +
                       F('M34 38 C44 24 52 14 58 12 C56 22 48 36 39 43 Z', '#C9D2DC', 3.2))
T['i_mask_1'] = tile(B1, F('M14 50 C11 28 19 12 32 12 C45 12 53 28 50 50 C42 45 22 45 14 50 Z', '#6B4528', 3.2) + F('M20 32 H44 L41 48 H23 Z', '#3B2818', 3))
T['i_spaulders_1'] = tile(B1, F('M7 40 C5 23 22 16 30 27 C24 36 14 41 7 40 Z', '#6B4528', 3.2) + F('M57 40 C59 23 42 16 34 27 C40 36 50 41 57 40 Z', '#6B4528', 3.2) + C(17, 30, 2.6, '#9AA7B8', 1.8) + C(47, 30, 2.6, '#9AA7B8', 1.8))
T['i_jerkin_1'] = tile(B1, F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#6B4528', 3.2) + P('M22 22 L42 42', '#3B2818', 3.2) + F('M20 42 H44 V48 H20 Z', '#3B2818', 2.8))

# Tier 2: Runed Steel, Horned/Crested & Gemmed (Rare)
for _k in ['i_axe', 'i_helm', 'i_pauldrons', 'i_plate', 'i_sunstaff', 'i_hood', 'i_mantle', 'i_robe', 'i_icestaff', 'i_hat', 'i_dagger', 'i_mask', 'i_spaulders', 'i_jerkin']:
    T[_k + '_2'] = T[_k].replace(f'fill: {IB}', f'fill: {B2}')

# Tier 3: Ornate Masterwork (Epic)
for _k in ['i_axe', 'i_helm', 'i_pauldrons', 'i_plate', 'i_sunstaff', 'i_hood', 'i_mantle', 'i_robe', 'i_icestaff', 'i_hat', 'i_dagger', 'i_mask', 'i_spaulders', 'i_jerkin']:
    T[_k + '_3'] = gild(T[_k], tile=True).replace(f'fill: {IB}', f'fill: {B3}')

# ---- Barrow set pieces: the slot shape on the set's colour, with the set's mark in the corner
MARKS = {
    'barrowguard': ('#3F5A3A', C(52, 52, 8, '#F0E8D2', 2.6) + C(49.5, 51, 1.6, '#1E1A1A', 0) + C(54.5, 51, 1.6, '#1E1A1A', 0)),
    'candlewake': ('#5E3FA3', F('M48 60 V48 H56 V60 Z', '#F6F1E4', 2.4) + F('M52 46 C55 42 54 39 52 36 C50 39 49 42 52 46 Z', '#F2C230', 2)),
    'rimebone': ('#1F4F7A', P('M52 44 V60 M45 48 L59 56 M45 56 L59 48', '#1E1A1A', 5) + P('M52 44 V60 M45 48 L59 56 M45 56 L59 48', '#DDF3FF', 2.2)),
    'shadeveil': ('#2D4A3E', F('M46 58 L54 42 L58 58 Z', '#7CF06A', 2.4) + C(52, 54, 3, '#F0E8D2', 1.8)),
}
SET_SHAPES = {
    'barrowguard': {'helm': HELM, 'shoulders': PAUL, 'chest': None},
    'candlewake': {'helm': HOOD, 'shoulders': MANT, 'chest': None},
    'rimebone': {'helm': HAT, 'shoulders': MANT, 'chest': None},
    'shadeveil': {'helm': MASK, 'shoulders': SPAULD, 'chest': None},
}
PLATE = F('M18 16 C26 12 38 12 46 16 L50 28 L44 30 V52 H20 V30 L14 28 Z', '#9AA7B8') + P('M32 18 V50', '#7D8FA3', 3)
ROBE_G = F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#F6F1E4') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#E7B53C', 2.6)
ROBE_B = F('M24 12 C28 16 36 16 40 12 L48 20 L44 26 L46 54 H18 L20 26 L16 20 Z', '#4F86C6') + F('M28 18 L32 22 L36 18 L34 54 H30 Z', '#DDF3FF', 2.6)
for set_id, (bg, mark) in MARKS.items():
    shapes = SET_SHAPES[set_id]
    chest = PLATE if set_id == 'barrowguard' else ROBE_G if set_id == 'candlewake' else ROBE_B if set_id == 'rimebone' else JERKIN
    T[f's_{set_id}_helm'] = tile(bg, shapes['helm'] + mark)
    T[f's_{set_id}_shoulders'] = tile(bg, shapes['shoulders'] + mark)
    T[f's_{set_id}_chest'] = tile(bg, chest + mark)

# ---- the Gravekeeper's four weapons
T['u_gravedigger'] = tile('#4E6B45', inked('M18 58 L42 14', '#A0703F', 5) +
                          F('M36 10 C48 2 62 12 58 30 C48 28 40 22 36 10 Z', '#D7DEE6') +
                          F('M12 48 L24 54 L20 64 L6 58 Z', '#8E96A3', 3) + C(30, 36, 3, '#9BE15D', 1.8))
T['u_longnight'] = tile('#2F6F5A', inked('M14 60 L34 22', '#A0703F', 4.5) + P('M34 22 L42 18', '#1E1A1A', 3) +
                        '<circle cx="46" cy="30" r="14" style="fill: #9BE15D; opacity: 0.3"/>' +
                        F('M38 22 H54 L52 42 H40 Z', '#4A4458', 3) + F('M42 26 H50 V38 H42 Z', '#E9FFD9', 2) +
                        F('M46 28 C49 31 49 35 46 37 C43 35 43 31 46 28 Z', '#9BE15D', 1.6))
T['u_gravefrost'] = tile('#1F4F7A', inked('M16 60 L36 26', '#6B5A70', 4.5) +
                         '<circle cx="40" cy="18" r="14" style="fill: #8FD6FF; opacity: 0.35"/>' +
                         F('M30 22 C30 10 50 10 50 22 C50 26 48 28 46 29 V33 H34 V29 C32 28 30 26 30 22 Z', '#F0E8D2', 3) +
                         C(36, 21, 2.8, '#8FD6FF', 0) + C(44, 21, 2.8, '#8FD6FF', 0) + P('M38 30 V33 M42 30 V33', '#1E1A1A', 1.6))
T['u_cryptfangs'] = tile('#244A3C',
                         '<circle cx="34" cy="28" r="18" style="fill: #9BE15D; opacity: 0.28"/>' +
                         inked('M10 48 L20 36', '#4A4458', 4.5) + F('M18 34 C26 20 36 10 46 8 C43 19 35 30 24 38 Z', '#F0E8D2', 3.2) +
                         inked('M24 56 L36 42', '#4A4458', 4.8) + F('M34 40 C44 26 52 14 58 12 C55 24 47 37 38 44 Z', '#F0E8D2', 3.4) +
                         C(20, 36, 3, '#9BE15D', 2) + C(35, 42, 3.2, '#9BE15D', 2))

# ---- looks: rewards that change how you look, never how hard you hit
T['c_dye'] = tile('#5C5070', '<circle cx="32" cy="38" r="20" style="fill: #DCFFF0; opacity: 0.25"/>' +
                  F('M24 22 H40 V28 C48 32 50 40 46 48 C42 56 22 56 18 48 C14 40 16 32 24 28 Z', '#DCFFF0') +
                  F('M26 14 H38 V22 H26 Z', '#A0703F', 3) + P('M24 40 C30 44 36 44 42 40', '#9FD9C6', 2.4) + P('M26 32 L22 38', '#FFFFFF', 2))
T['c_trail'] = tile('#2F6F5A', '<path d="M6 52 C20 48 30 30 58 12" style="fill: none; stroke: #C8F5E8; stroke-width: 12; stroke-linecap: round; opacity: 0.35"/>' +
                    inked('M6 52 C20 48 30 30 58 12', '#C8F5E8', 4) + C(16, 46, 3, '#FFFFFF', 0) + C(34, 30, 2.4, '#FFFFFF', 0) + C(50, 18, 2, '#FFFFFF', 0))
T['c_glow_shield'] = tile('#C8403F', '<circle cx="32" cy="32" r="27" style="fill: #F2C230; opacity: 0.35"/>' +
                          C(32, 32, 21, '#F2C230', 3.5) + C(32, 32, 15, '#C8403F', 3) + C(32, 32, 5.5, '#C9D2DC', 3) +
                          P('M18 18 C24 12 32 11 38 12', '#FFFFFF', 2.6))
T['c_glow_staff'] = tile('#E07A2E', '<circle cx="40" cy="20" r="18" style="fill: #FFE08A; opacity: 0.45"/>' +
                         inked('M16 60 L38 24', '#A0703F', 4.5) + rays + C(40, 20, 7, '#FFF6D0', 3))
T['c_crit_ice'] = tile('#1F4F7A', '<text x="32" y="47" text-anchor="middle" style="font: 40px \'Lilita One\', sans-serif; fill: #DDF3FF; stroke: #1E1A1A; stroke-width: 3; paint-order: stroke">!</text>' +
                       F('M10 20 L16 12 L22 20 L16 28 Z', '#DDF3FF', 2.4) + F('M44 50 L50 44 L56 50 L50 56 Z', '#DDF3FF', 2.4) + F('M46 14 L50 10 L54 14 L50 18 Z', '#8FD6FF', 2))
# ---- account things: marks, kill count, achievements
T['marks'] = tile('#3A3150', C(32, 32, 20, '#C9A040', 3.5) + C(32, 32, 14, '#E7C25A', 2.4) +
                  F('M24 32 C24 24 40 24 40 32 C40 35 38 37 36 38 V41 H28 V38 C26 37 24 35 24 32 Z', '#3A3150', 2) +
                  C(29, 31, 2, '#E7C25A', 0) + C(35, 31, 2, '#E7C25A', 0))


# ---- heroic Barrow drops: the same pieces, gilded
for _n in ['s_barrowguard_helm', 's_barrowguard_shoulders', 's_barrowguard_chest', 's_candlewake_helm', 's_candlewake_shoulders', 's_candlewake_chest',
           's_rimebone_helm', 's_rimebone_shoulders', 's_rimebone_chest', 's_shadeveil_helm', 's_shadeveil_shoulders', 's_shadeveil_chest',
           'u_gravedigger', 'u_longnight', 'u_gravefrost', 'u_cryptfangs']:
    T[_n + '_gilded'] = gild(T[_n], {'#4A4458': '#8A6418'} if _n in ('u_longnight', 'u_cryptfangs') else None, tile=True)
T['c_dye_gilded'] = gild(T['c_dye'], {'#9FD9C6': '#F2C230', '#DCFFF0': '#FFE9A8'}, tile=True)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    json.dump(T, open(OUT + 'icons.json', 'w'))
    cells = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:72px;height:72px;border-radius:13px;overflow:hidden;border:3px solid #1E1A1A;box-shadow:0 4px 0 #1E1A1A">{v.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div><span style="font:12px monospace">{k}</span></div>' for k, v in T.items())
    open(OUT + '_icons_preview.html', 'w').write(f'<body style="margin:0;padding:20px;background:#FFF8EC"><div style="display:flex;gap:14px;flex-wrap:wrap;width:900px">{cells}</div></body>')
    print('tiles', len(T))
