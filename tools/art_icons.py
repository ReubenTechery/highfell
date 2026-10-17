import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Ability icons for the Barrow Crypt (64x64 TV tiles: flat bright ground, one black line, one idea each).
# Usage: python3 tools/art_icons.py -> art/icons.json + art/_icons_preview.html
import json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fighttiles import TV_TILES
from art_sprites import gild, m
from art_wardrobe import cut, parts, _bbox, _fit
from art_wardrobe_tb import cog, taper, bez, oval

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
# the pieces are cut from the wardrobe's stands (art_wardrobe.py), so a set's icon is the piece on its stand.
# A mantle is one long low shape on the stand, too thin for a tile, so its icon is drawn here in the same
# colours: Candlewake's black with a gold hem, a clasp and wax drips; Rimebone's blue with icicles.
CLOTH, CLOTH_L = '#2F2838', '#4A4058'
MANT_CW = (F('M6 42 C8 26 20 18 32 18 C44 18 56 26 58 42 C48 38 40 40 32 46 C24 40 16 38 6 42 Z', CLOTH, 3.4) +
           P('M10 38 C18 35 25 37 32 42 C39 37 46 35 54 38', '#F2C230', 2.6) + C(32, 30, 4, '#F2C230', 2.4) +
           F('M15 38 H20 L19.5 46 C19.5 48.5 15.5 48.5 15.5 46 Z', '#F0E8D2', 2) + F('M43 39 H48 L47.5 45 C47.5 47.5 43.5 47.5 43.5 45 Z', '#F0E8D2', 2) +
           P('M14 30 C18 25 22 23 26 22', CLOTH_L, 2.4))
MANT_RB = (F('M6 40 C8 24 20 16 32 16 C44 16 56 24 58 40 L50 40 C46 36 40 35 32 36 C24 35 18 36 14 40 Z', '#4F6FA8', 3.4) +
           F('M8 40 L14 40 L11 50 Z', '#DDF3FF', 2) + F('M16 39 L22 38 L19 46 Z', '#DDF3FF', 2) + F('M42 38 L48 39 L45 46 Z', '#DDF3FF', 2) + F('M50 40 L56 40 L53 50 Z', '#DDF3FF', 2) +
           C(32, 27, 4, '#8FD6FF', 2.4) + P('M14 28 C18 23 22 21 26 20', '#7D98C8', 2.4))
SHOULDERS = {'barrowguard': cut('barrowguard', 'shoulders', pair=True), 'candlewake': MANT_CW,
             'rimebone': MANT_RB, 'shadeveil': cut('shadeveil', 'shoulders', pair=True)}
for set_id, (bg, mark) in MARKS.items():
    T[f's_{set_id}_helm'] = tile(bg, cut(set_id, 'helm') + mark)
    T[f's_{set_id}_shoulders'] = tile(bg, SHOULDERS[set_id] + mark)
    T[f's_{set_id}_chest'] = tile(bg, cut(set_id, 'chest', (12, 6, 40, 52), 0.7) + mark)

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


# ---- Thimblebriar's set pieces, cut from its stands (art_wardrobe_tb.py) the same way, each set's mark in the corner
def one(set_id, slot, box=(4, 4, 54, 54), weight=0.8):
    """a pair of shoulder pieces cut down to the left one, filling the tile (two side by side read as a face)"""
    sil, det = parts(set_id)[slot]
    return _fit(''.join(x for x in sil + det if 'opacity:' not in x and sum(_bbox(x)[0::2]) / 2 < 0), box, weight)


def toad(x, y, k=1.0):
    """a little toadstool: a cream stem, a red cap, a spot"""
    q = lambda dx, dy: f'{f1(x + dx * k)} {f1(y + dy * k)}'
    return (F(f'M{q(-2, 0)} L{q(-1.6, -5)} L{q(1.6, -5)} L{q(2, 0)} Z', '#F0E8D2', 1.8) +
            F(f'M{q(-5.5, -4.5)} C{q(-5.5, -10)} {q(5.5, -10)} {q(5.5, -4.5)} C{q(2, -3.5)} {q(-2, -3.5)} {q(-5.5, -4.5)} Z', '#C8403F', 2) +
            C(x - 1.8 * k, y - 7 * k, 1.2 * k, '#F0E8D2', 0))


MARKS_TB = {
    'clockguard': ('#7A3B2E', F(cog(52, 52, 8.5, 6, 8), '#F2C230', 2.2) + C(52, 52, 2.4, '#7A5614', 0)),
    'sporebloom': ('#2C3A66', toad(52, 60, 1.45)),
    'arcspark': ('#43307A', F('M54 41 L45 52 L50.5 52 L47 61 L58 48.5 L52.5 48.5 L56 41 Z', '#DDF3FF', 2.2)),
    'gearshade': ('#245048', C(52, 52, 7.6, '#9AA7B8', 2.6) + C(52, 52, 4.2, '#FFB547', 1.6) + C(50.6, 50.6, 1.3, '#FFFFFF', 0)),
}
# the Sporebloom Mantle is one long low shape on its stand, so its tile is drawn here in the same colours: amber
# roots woven over the shoulders, a root end curling out at either side, a bone toggle, toadstools on top
_root = bez((9, 38), (7, 44), (6, 48), (3, 52), 6)
MANT_SB = (F(taper(_root, 7, 1.2), '#E7A13C', 2.4) + F(taper([(64 - x, y) for x, y in _root], 7, 1.2), '#E7A13C', 2.4) +
           F('M5 42 C7 26 19 16 32 16 C45 16 57 26 59 42 C51 39 42 40 32 44 C22 40 13 39 5 42 Z', '#E7A13C', 3.4) +
           P('M27 19 C17 20 10 28 8 40 M28 25 C21 26 18 32 18 40 M29 31 C25 32 24 36 25 41 '
             'M37 19 C47 20 54 28 56 40 M36 25 C43 26 46 32 46 40 M35 31 C39 32 40 36 39 41', '#B8742A', 2.2) +
           P('M12 30 C15 24 20 20 25 19', '#F6C774', 2.2) + F(oval(32, 33, 4.2, 2.6), '#F0E8D2', 1.8) +
           toad(13, 22) + toad(20, 19, 0.75) + toad(50, 21, 0.85))
SHOULDERS_TB = {'clockguard': one('clockguard', 'shoulders'), 'sporebloom': MANT_SB,
                'arcspark': one('arcspark', 'shoulders'), 'gearshade': one('gearshade', 'shoulders')}
for set_id, (bg, mark) in MARKS_TB.items():
    T[f's_{set_id}_helm'] = tile(bg, cut(set_id, 'helm') + mark)
    T[f's_{set_id}_shoulders'] = tile(bg, SHOULDERS_TB[set_id] + mark)
    T[f's_{set_id}_chest'] = tile(bg, cut(set_id, 'chest', (12, 6, 40, 52), 0.7) + mark)


# ---- the Tinker King's four weapons, drawn as on their stands
def turned(x, y, deg, body, k=1):
    return f'<g transform="translate({x} {y}) rotate({deg}) scale({k})">{body}</g>'


EAR = 'M0 -19 C-2 -24 -6 -27 -9.5 -26 C-13.5 -25 -13.5 -19.5 -9.5 -18 C-6 -17 -3 -17.5 0 -19 Z'
FACE = 'M-18 -9 L-12.5 -9 L-12.5 9 L-18 9 C-19 3 -19 -3 -18 -9 Z'
T['u_mainspring'] = tile('#8E4636', inked('M12 60 L30 34', '#8A5A34', 4.5) + C(12, 60, 3.4, '#A87A1E', 2) + turned(32, 31, 34,
                         F('M-2.2 -17 L2.2 -17 L2.2 -10 L-2.2 -10 Z', '#9AA7B8', 2.2) + F(EAR, '#9AA7B8', 2.2) + F(m(EAR), '#9AA7B8', 2.2) +
                         C(0, -18.5, 2.6, '#9AA7B8', 2) + C(-8.5, -22, 1.6, K, 0) + C(8.5, -22, 1.6, K, 0) +
                         F('M-13 -8 C-13 -10 -12 -10.5 -10 -10.5 L10 -10.5 C12 -10.5 13 -10 13 -8 L13 8 C13 10 12 10.5 10 10.5 L-10 10.5 C-12 10.5 -13 10 -13 8 Z', '#D9A520', 3) +
                         F(FACE, '#9AA7B8', 2.6) + F(m(FACE), '#9AA7B8', 2.6) + F('M-12.5 -2.5 L12.5 -2.5 L12.5 2.5 L-12.5 2.5 Z', '#A87A1E', 2) +
                         C(-7, 6.5, 1.4, '#F2C230', 1.2) + C(0, 6.5, 1.4, '#F2C230', 1.2) + C(7, 6.5, 1.4, '#F2C230', 1.2) +
                         P('M-10 -7 C-6 -8.5 -1 -8.5 3 -8', '#FFFFFF', 1.8)))
T['u_sporelight'] = tile('#34457A', '<circle cx="45" cy="41" r="17" style="fill: #FFF3C4; opacity: 0.3"/>' +
                         inked('M10 60 L26 21', '#8A5A34', 4.5) + inked('M26 22 C27 10 40 6 45 13 L45 17', '#D9A520', 3.2) + P('M45 17 L45 26', K, 2.4) +
                         F('M34 35 L56 35 C56 46 51 51 45 51 C39 51 34 46 34 35 Z', '#9AA7B8', 3) + F('M41 50 L49 50 L50 55 L40 55 Z', '#7D8FA3', 2.4) +
                         C(39.5, 42, 2.3, '#FFF3C4', 1.4) + C(45, 44.5, 2.3, '#FFF3C4', 1.4) + C(50.5, 42, 2.3, '#FFF3C4', 1.4) +
                         F('M31 34 C31 22 59 22 59 34 C52 37 38 37 31 34 Z', '#C8403F', 3) + C(45, 23, 2.4, '#F2C230', 1.6) +
                         C(37, 30.5, 2, '#F0E8D2', 1.2) + C(45, 27.5, 1.6, '#F0E8D2', 1) + C(53, 30.5, 2, '#F0E8D2', 1.2) +
                         C(56, 17, 1.6, '#FFF3C4', 0) + C(60, 11, 1.2, '#FFF3C4', 0))
coil = ''.join(inked(f'M{f1(x - 5)} {f1(y - 1)} L{f1(x + 5)} {f1(y + 3.5)}', '#C87533', 2.6) for x, y in ((16, 53), (19, 48.5), (22, 44), (25, 39.5)))
T['u_arcwright'] = tile('#4F3A8A', '<circle cx="38" cy="13" r="14" style="fill: #8FD6FF; opacity: 0.3"/>' +
                        inked('M12 60 L35 25', '#6B4528', 4.5) + coil + inked('M36 24 C33 17 30 12 25 7', '#9AA7B8', 3.6) +
                        inked('M36 24 C42 20 47 17 54 15', '#9AA7B8', 3.6) + F('M30 24 L37 19 L42 26 L35 31 Z', '#D9A520', 2.4) +
                        C(24, 6, 3.8, '#C9D2DC', 2.2) + C(55.5, 14.5, 3.8, '#C9D2DC', 2.2) + inked('M27 11 L33 8 L36 13 L42 10 L46 15 L51 13', '#DDF3FF', 2))


def fusecutter(side):
    """one of the Fusecutters, point up, its fuse curling off the pommel to one side"""
    return (F('M-4 -14 L4 -14 C4.5 -26 3 -36 0 -44 C-3 -36 -4.5 -26 -4 -14 Z', '#D7DEE6', 2.4) + P('M0 -18 L0 -36', '#FFFFFF', 1.4) +
            F('M-9 -12 C-9 -15 -7 -16 -5 -16 L5 -16 C7 -16 9 -15 9 -12 C5 -11 -5 -11 -9 -12 Z', '#D9A520', 2) +
            F('M-2.8 -12 L2.8 -12 L2.8 -3 L-2.8 -3 Z', '#C9B08A', 1.8) + P('M-2.8 -9.5 L2.8 -11 M-2.8 -6 L2.8 -7.5', '#8C6F4A', 1.2) +
            C(0, -1, 3.2, '#D9A520', 1.8) + inked(f'M{1.5 * side} 2 C{3 * side} 5 {6 * side} 6 {8 * side} 4', '#C9B08A', 1.4))


spark = lambda x, y: (f'<circle cx="{x}" cy="{y}" r="6" style="fill: #FFE08A; opacity: 0.45"/>' +
                      F(f'M{x} {y - 5} L{x + 1.5} {y - 1.5} L{x + 5} {y} L{x + 1.5} {y + 1.5} L{x} {y + 5} L{x - 1.5} {y + 1.5} L{x - 5} {y} L{x - 1.5} {y - 1.5} Z', '#FFE08A', 1.6))
T['u_fusecutters'] = tile('#2A5C52', turned(21, 54, 26, fusecutter(-1), 1.2) + turned(43, 54, -26, fusecutter(1), 1.2) + spark(10.5, 54) + spark(53.5, 54))

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
# ---- heroic Thimblebriar drops: the same, gilded as their stands are (their steel, bone and cream turn gold)
for _n in [f's_{_s}_{_p}' for _s in MARKS_TB for _p in ('helm', 'shoulders', 'chest')] + ['u_mainspring', 'u_sporelight', 'u_arcwright', 'u_fusecutters']:
    T[_n + '_gilded'] = gild(T[_n], tile=True)


# ---- the fire mage's four buttons: the fire twins of icicle, comet, blizzard and nova
FIRE, FLAME, HOT = '#FF8A4C', '#FFE08A', '#FFF6D0'


def glow(cx, cy, r, col, op=0.3):
    """light: a soft disc behind a thing, never on it"""
    return f'<circle cx="{f1(cx)}" cy="{f1(cy)}" r="{f1(r)}" style="fill: {col}; opacity: {op}"/>'


def sc(d, k):
    """path data scaled by k about (0, 0), so a shape can shrink while its line weights stay as they are"""
    return re.sub(r'-?\d+(?:\.\d+)?', lambda mm: f1(float(mm.group(0)) * k), d)


def tongue(x, y, w, h, lean=0.0, curl=0.8):
    """a flame tongue standing on (x, y): a round foot w wide, its tip h above it, leaning by lean and curling with it"""
    r, tx, ty = w / 2, x + lean, y - h
    return (f'M{f1(tx)} {f1(ty)} C{f1(tx - lean * curl + r * 0.05)} {f1(ty + h * 0.22)} {f1(x + r * 1.05)} {f1(y - h * 0.62)} {f1(x + r)} {f1(y - r * 0.85)} '
            f'C{f1(x + r * 0.95)} {f1(y + r * 0.18)} {f1(x - r * 0.95)} {f1(y + r * 0.18)} {f1(x - r)} {f1(y - r * 0.85)} '
            f'C{f1(x - r * 1.1)} {f1(y - h * 0.5)} {f1(tx - r * 0.55 - lean * curl)} {f1(ty + h * 0.42)} {f1(tx)} {f1(ty)} Z')


def blaze(x, y, w, h, lean=0.0, wk=3.2):
    """a flame: an orange tongue with a yellow one inside it"""
    return F(tongue(x, y, w, h, lean), FIRE, wk) + F(tongue(x, y - w * 0.04, w * 0.5, h * 0.56, lean * 0.5), FLAME, 0)


def boom(cx, cy, rs, n, a0=-90.0):
    """a cartoon explosion: n points stepping through the radii rs, the edges between them bowed in"""
    pt = lambda r, a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    tips = [pt(rs[i % len(rs)], a0 + i * 360 / n) for i in range(n)]
    d = f'M{f1(tips[0][0])} {f1(tips[0][1])}'
    for i in range(n):
        qx, qy = pt(min(rs) * 0.55, a0 + (i + 0.5) * 360 / n)
        d += f' Q{f1(qx)} {f1(qy)} {f1(tips[(i + 1) % n][0])} {f1(tips[(i + 1) % n][1])}'
    return d + ' Z'


def drop(x, y, r):
    """a drop hanging from its tip, its round end r wide about (x, y)"""
    q = lambda dx, dy: f'{f1(x + dx * r)} {f1(y + dy * r)}'
    return (f'M{q(0, -2.4)} C{q(0.7, -1.4)} {q(1, -0.7)} {q(1, 0)} C{q(1, 0.6)} {q(0.55, 1)} {q(0, 1)} '
            f'C{q(-0.55, 1)} {q(-1, 0.6)} {q(-1, 0)} C{q(-1, -0.7)} {q(-0.7, -1.4)} {q(0, -2.4)} Z')


# the bolt and the comet's tail are drawn flying along +x, then turned into place
BOLT = ('M24 0 C24 -8 17 -13 8 -13 C-2 -13 -14 -14 -26 -16 C-21 -11 -18 -8 -14 -5 C-22 -4 -30 -2 -38 0 '
        'C-30 2 -22 4 -14 5 C-18 8 -21 11 -26 15 C-14 14 -2 13 8 13 C17 13 24 8 24 0 Z')
BOLT_IN = 'M19 0 C19 -5 14 -8 8 -8 C0 -8 -8 -7 -20 -4 C-12 -1 -12 1 -18 4 C-8 6 0 8 8 8 C14 8 19 5 19 0 Z'
TAIL = ('M3 -14.5 C-8 -15.5 -16 -12 -24 -15 C-21 -11.5 -20 -10 -21 -8.5 C-30 -9 -42 -6 -56 -2 '
        'C-44 2 -34 4 -24 6 C-25 8.5 -27 10.5 -30 13 C-20 14 -8 15 3 14.5 Z')
TAIL_IN = 'M2 -9 C-8 -9.5 -20 -7 -40 -2.5 C-26 0.5 -21 2 -22 6.5 C-14 8.5 -6 9 2 9 Z'


def fireball(x, y, k=1.0, wk=3.5):
    """a comet of fire falling down and to the right, its ball 14k round about (x, y)"""
    q = lambda dx, dy: f'{f1(x + dx * k)} {f1(y + dy * k)}'
    return (turned(x, y, 40, F(sc(TAIL, k), FIRE, wk) + F(sc(TAIL_IN, k), FLAME, 0)) + C(x, y, 14 * k, FIRE, wk) +
            C(x + 2 * k, y - 2 * k, 8.5 * k, FLAME, 0) + F(f'M{q(4, -8)} L{q(10, -2)} L{q(2, 0)} Z', '#FFFFFF', 1.8 if k > 0.8 else 0))


T['firebolt'] = tile('#8A2A1E', glow(37, 27, 18, FIRE) +
                     turned(30, 34, -45, F(BOLT, FIRE) + F(BOLT_IN, FLAME, 0) + P('M10 -8.5 C15 -8.5 18.5 -5.5 19.5 -1.5', '#FFFFFF', 2.4)) +
                     P('M52 44 V54 M47 49 H57', FLAME, 2.8) + P('M14 12 V18 M11 15 H17', FLAME, 2.4))
T['comet_fire'] = tile('#4A2A6A', fireball(38, 42))
# the blizzard's cloud as smoke, raining drops of fire onto flames
T['firestorm'] = tile('#5E1F1A', ''.join(turned(x, y, -25, F(drop(0, 0, 3), FLAME, 2)) for x, y in ((16, 35), (31, 32), (46, 34), (24, 42), (40, 43))) +
                      blaze(14, 61, 13, 17, -2, 2.8) + blaze(50, 61, 13, 18, 2, 2.8) + blaze(32, 62, 17, 22, 1, 2.8) +
                      F('M12 26 C6 26 6 17 13 16 C13 8 24 5 28 11 C32 3 46 5 46 13 C54 12 58 22 51 26 Z', '#9C8590') + P('M17 22 H44', '#BBA6B0', 2.4))
T['emberburst'] = tile('#A8322A', P(' '.join(f'M{f1(32 + 25 * math.cos(math.radians(a)))} {f1(32 + 25 * math.sin(math.radians(a)))} '
                                             f'L{f1(32 + 29 * math.cos(math.radians(a)))} {f1(32 + 29 * math.sin(math.radians(a)))}' for a in range(0, 360, 45)), FLAME, 2.6) +
                       F(boom(32, 32, (24, 20, 23, 19), 10), FIRE, 3.2) + F(boom(32, 32, (15, 12, 14, 11), 10, -72), FLAME, 0) + F(boom(32, 32, (7, 6), 8), HOT, 2.4))


# ---- talents: what a point buys, one plain idea on its own colour (they must read at 32 to 48 px)
def heart(cx, cy, k=1.0):
    """a fat round heart about (cx, cy), 38k wide"""
    q = lambda x, y: f'{f1(cx + x * k)} {f1(cy + y * k)}'
    return (f'M{q(0, 18)} C{q(-10, 11)} {q(-19, 3)} {q(-19, -6)} C{q(-19, -14)} {q(-13, -18)} {q(-8, -18)} C{q(-4, -18)} {q(-1, -15)} {q(0, -12)} '
            f'C{q(1, -15)} {q(4, -18)} {q(8, -18)} C{q(13, -18)} {q(19, -14)} {q(19, -6)} C{q(19, 3)} {q(10, 11)} {q(0, 18)} Z')


def burst(cx, cy, rs, n, a0=-90.0):
    """a jagged star of n points stepping through the radii rs (outer, inner, outer, ...); one radius makes a polygon"""
    return 'M' + ' L'.join(f'{f1(cx + rs[i % len(rs)] * math.cos(math.radians(a0 + i * 180 / n)))} '
                           f'{f1(cy + rs[i % len(rs)] * math.sin(math.radians(a0 + i * 180 / n)))}' for i in range(2 * n)) + ' Z'


def star4(cx, cy, r, k=0.22):
    """a four-point sparkle with curved sides"""
    q = r * k
    return (f'M{f1(cx)} {f1(cy - r)} Q{f1(cx + q)} {f1(cy - q)} {f1(cx + r)} {f1(cy)} Q{f1(cx + q)} {f1(cy + q)} {f1(cx)} {f1(cy + r)} '
            f'Q{f1(cx - q)} {f1(cy + q)} {f1(cx - r)} {f1(cy)} Q{f1(cx - q)} {f1(cy - q)} {f1(cx)} {f1(cy - r)} Z')


T['t_dmg'] = tile('#E07A2E', glow(49, 15, 14, FLAME, 0.5) +
                  F('M15.5 41.5 L42.5 14.5 L54 10 L49.5 21.5 L22.5 48.5 Z', '#D7DEE6') + P('M19.5 41 L43.5 17', '#FFFFFF', 2.2, 0.9) +
                  inked('M18 46 L11 53', '#8A5A34', 4.6) + inked('M12 38.5 L25.5 52', '#F2C230', 4.4) + C(9, 55, 3.6, '#F2C230', 2.4) +
                  F(star4(50, 14, 11), '#FFF3C4', 2.6))
T['t_heal'] = tile('#2E8B6E', glow(32, 32, 26, '#D8FFB8', 0.25) + F(heart(32, 34, 1.15), '#E8505B') +
                   P('M16 26 C16.5 22 19 19.5 23 19', '#FFFFFF', 2.6) + inked('M32 25 V43 M23 34 H41', '#FFFFFF', 4.2) +
                   P('M53 10 V17 M49.5 13.5 H56.5', '#FFFFFF', 2.4) + P('M10 47 V53 M7 50 H13', '#FFFFFF', 2.4))
T['t_hp'] = tile('#4F6FA8', F(heart(32, 34, 1.42), '#C8403F', 3.6) + P('M12.5 27 C13 20.5 17 16.5 23 16', '#FFFFFF', 3) + C(13.5, 33, 2, '#FFFFFF', 0))
T['t_crit'] = tile('#4F3780', glow(32, 32, 28, FLAME, 0.25) + F(burst(32, 32, (28, 14, 23, 14), 10), '#F2C230') +
                   F('M28.5 16 C28.5 13.5 35.5 13.5 35.5 16 L34 36 C33.8 38 30.2 38 30 36 Z', '#C8403F', 3) + C(32, 45, 3.8, '#C8403F', 3))
GLASS = 'M-11 -18 H11 C11 -9 3 -5 1.5 0 C3 5 11 9 11 18 H-11 C-11 9 -3 5 -1.5 0 C-3 -5 -11 -9 -11 -18 Z'
T['t_haste'] = tile('#2F6FA8', P('M4 22 H13 M2 33 H11 M5 44 H14', '#DDF3FF', 3.2) +
                    turned(37, 32, 14, inked('M-13.5 -18 V18 M13.5 -18 V18', '#8A5A34', 2.6) + F(GLASS, '#DDF3FF', 3) +
                           F('M-7.5 -11 H7.5 C5.5 -6.5 2 -4 0 -2.5 C-2 -4 -5.5 -6.5 -7.5 -11 Z', '#F2C230', 0) + P('M0 -2 V11', '#F2C230', 2) +
                           F('M-10 17.5 C-8.5 12 -4.5 10 0 10 C4.5 10 8.5 12 10 17.5 Z', '#F2C230', 2.2) + P('M-7 -15 C-7 -12 -6 -10 -4 -8', '#FFFFFF', 2.2) +
                           F('M-16 -25 H16 V-18 H-16 Z', '#8A5A34', 3) + F('M-16 18 H16 V25 H-16 Z', '#8A5A34', 3)))
T['t_armor'] = tile('#8A5A34', F('M17 52 H47 L48 58 C40 60 24 60 16 58 Z', '#9AA7B8', 3) + F('M18 46 H46 L47 52 H17 Z', '#7D8FA3', 3) +
                    F('M14 14 C19 11 24 11 26 12 C28 17 36 17 38 12 C40 11 45 11 50 14 L54 24 L47 29 C48 37 47 43 45 47 H19 C17 43 16 37 17 29 L10 24 Z', '#9AA7B8') +
                    P('M32 17 V46', '#7D8FA3', 3) + P('M20 30 C25 34 29 34 32 31 C35 34 39 34 44 30', '#7D8FA3', 2.6) +
                    ''.join(C(x, y, 1.9, '#C9D2DC', 1.5) for x, y in ((17.5, 17.5), (46.5, 17.5), (22, 49), (42, 49), (22, 55), (42, 55))) +
                    P('M17 21 C19 18 22 16.5 25 16.5', '#FFFFFF', 2.4))
T['t_threat'] = tile('#C8403F', P('M7 9 L12 14 M57 9 L52 14 M32 3 V9', '#FFF3C4', 3) +
                     '<ellipse cx="20" cy="32" rx="9.5" ry="10.5" style="fill: #FFFFFF; stroke: #1E1A1A; stroke-width: 3"/>'
                     '<ellipse cx="44" cy="32" rx="9.5" ry="10.5" style="fill: #FFFFFF; stroke: #1E1A1A; stroke-width: 3"/>' +
                     C(22.5, 34, 3.4, K, 0) + C(41.5, 34, 3.4, K, 0) + F('M7 17 L30 25 L28.5 30 L6 22.5 Z', K, 2) + F('M57 17 L34 25 L35.5 30 L58 22.5 Z', K, 2) +
                     F('M21 51 C23 45.5 41 45.5 43 51 C41 56 23 56 21 51 Z', '#5A1416', 3) + P('M25 48.5 H39', '#FFFFFF', 2.4))

# ---- spec emblems: one per spec, bold, each on its own colour; the spec's capstone sits on the same colour
TOWER = 'M-18 -26 H18 C19.5 -26 20.5 -25 20.5 -23.5 V4 C20.5 15 11 21.5 0 26 C-11 21.5 -20.5 15 -20.5 4 V-23.5 C-20.5 -25 -19.5 -26 -18 -26 Z'
TOWER_IN = 'M-14.5 -22 H14.5 V3.5 C14.5 12 7.5 17.5 0 21 C-7.5 17.5 -14.5 12 -14.5 3.5 Z'
BIT = 'M-4 -40 C-10 -42 -18 -47 -27 -48 C-33 -38 -33 -22 -27 -12 C-18 -13 -10 -18 -4 -20 Z'


def tower(k=1.0):
    """the tower shield, drawn about its middle"""
    return (F(sc(TOWER, k), '#F2C230') + F(sc(TOWER_IN, k), '#C8403F', 3) + C(0, -5 * k, 7.5 * k, '#C9D2DC', 3) + C(0, -5 * k, 2.8 * k, '#9AA7B8', 0) +
            ''.join(C(x * k, y * k, 2 * k, '#F2C230', 1.4) for x, y in ((-10, -17), (10, -17), (-10, 6), (10, 6))) +
            P(sc('M-11 -18.5 C-7 -19.5 -3 -19.5 1 -19', k), '#FFFFFF', 2.2, 0.85))


def great_axe(k=1.0):
    """a two-handed axe with a blade either side, its haft standing on (0, 0)"""
    return (inked(sc('M0 22 L0 -34', k), '#A0703F', 5) + C(0, 23 * k, 3.6, '#6B4528', 2.2) + F(sc(BIT, k), '#D7DEE6') + F(m(sc(BIT, k)), '#D7DEE6') +
            F(sc('M-5.5 -44 H5.5 V-15 H-5.5 Z', k), '#8A8F99', 3) + F(sc('M-3 -44 L0 -51 L3 -44 Z', k), '#8A8F99', 2.4) +
            P(sc('M-25 -41 C-28 -34 -28.5 -26 -25.5 -18 M25 -41 C28 -34 28.5 -26 25.5 -18', k), '#FFFFFF', 2.2, 0.9))


def hammer(k=1.0):
    """a war hammer, gold with steel faces, its head 21.5k above (0, 0)"""
    return (inked(sc('M0 30 L0 -14', k), '#A0703F', 5) + C(0, 31 * k, 3.4, '#F2C230', 2.2) + F(sc('M-15 -30 H15 V-13 H-15 Z', k), '#F2C230') +
            F(sc('M-20 -32.5 H-14 V-10.5 H-20 Z', k), '#D7DEE6', 3) + F(sc('M20 -32.5 H14 V-10.5 H20 Z', k), '#D7DEE6', 3) + P(sc('M-10 -26 H6', k), '#FFF3C4', 2.4))


def spokes(cx, cy, r0, r1, angles, col='#F2C230', w=3):
    """inked rays from r0 out to r1 at the given angles (degrees)"""
    return inked(' '.join(f'M{f1(cx + r0 * math.cos(math.radians(a)))} {f1(cy + r0 * math.sin(math.radians(a)))} '
                          f'L{f1(cx + r1 * math.cos(math.radians(a)))} {f1(cy + r1 * math.sin(math.radians(a)))}' for a in angles), col, w)


def knife(k=1.0):
    """a throwing knife pointing along +x"""
    return (C(-15 * k, 0, 3 * k, '#C9A040', 2) + inked(sc('M-13 0 H-6.5', k), '#5C4028', 4 * k) + inked(sc('M-5.5 -6.5 V6.5', k), '#C9A040', 3.4 * k) +
            F(sc('M-4.5 -4.5 C2 -5 10 -4.5 20 0 C10 4.5 2 5 -4.5 4.5 Z', k), '#D7DEE6', 2.8) + P(sc('M-2 -2 C4 -2.6 10 -2.2 15 -0.6', k), '#FFFFFF', 1.8))


def whirl(cx, cy, r, a0, a1, w0, w1, n=18):
    """a swoosh round a circle from a0 to a1 degrees, w0 wide where it starts and w1 where it ends"""
    return taper([(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)], w0, w1)


VEN = '#7CF06A'
BG_SHIELD, BG_AXE, BG_MERCY, BG_WRATH, BG_FROST, BG_FIRE, BG_VENOM, BG_BLADES = (
    '#4F6FA8', '#E07A2E', '#7A5BB8', '#9E2F2E', '#1F4F7A', '#5E1F1A', '#34224E', '#2A5C52')
T['spec_shield'] = tile(BG_SHIELD, turned(32, 33, 0, tower(1.06)))
T['spec_axe'] = tile(BG_AXE, turned(32, 41, 10, great_axe(0.7)))
T['spec_mercy'] = tile(BG_MERCY, glow(32, 46, 30, '#FFF3C4', 0.3) + spokes(32, 46, 21, 29, (-165, -135, -105, -75, -45, -15), '#F2C230', 3.4) +
                       C(32, 46, 17, '#F2C230', 3.5) + C(26, 40, 4.5, HOT, 0) + F('M-4 50 C10 44 22 43 32 45 C42 43 54 44 68 50 V68 H-4 Z', '#4F3780', 3.5))
T['spec_wrath'] = tile(BG_WRATH, glow(24.6, 23.5, 17, FLAME, 0.4) + spokes(24.6, 23.5, 14, 19, range(0, 360, 45)) + turned(33, 38, -30, hammer(0.78)))
_flake = []
for _k in range(6):
    _a = math.radians(_k * 60 - 90)
    _ux, _uy = math.cos(_a), math.sin(_a)
    _flake.append(f'M32 32 L{f1(32 + 25 * _ux)} {f1(32 + 25 * _uy)}')
    for _d in (-1, 1):
        _b, _bx, _by = _a + _d * math.radians(48), 32 + 14 * _ux, 32 + 14 * _uy
        _flake.append(f'M{f1(_bx)} {f1(_by)} L{f1(_bx + 9 * math.cos(_b))} {f1(_by + 9 * math.sin(_b))}')
T['spec_frost'] = tile(BG_FROST, glow(32, 32, 27, '#8FD6FF', 0.3) + inked(' '.join(_flake), '#DDF3FF', 4.4) + F(burst(32, 32, (7,), 3), '#8FD6FF', 3) + C(32, 32, 2.4, '#FFFFFF', 0))
T['spec_fire'] = tile(BG_FIRE, glow(32, 36, 27, FIRE, 0.3) +
                      F('M34 5 C35 14 40 20 42 27 C44 23 48 20 51 16 C55 26 54 36 53 42 C52 53 43 59 32 59 C21 59 12 53 11 43 '
                        'C10 34 12 26 15 20 C18 25 21 28 23 31 C23 21 28 12 34 5 Z', FIRE) +
                      F('M33 22 C35 29 41 33 41 42 C41 49 37 53 32 53 C27 53 23 49 23 43 C23 36 29 31 33 22 Z', FLAME, 0) +
                      F('M32 39 C34 42.5 36 45 36 48 C36 50.5 34.2 52 32 52 C29.8 52 28 50.5 28 48 C28 45 30 42.5 32 39 Z', HOT, 0))
BLADE_V = 'M24.5 23 H39.5 L38 39 L32 51 L26 39 Z'
T['spec_venom'] = tile(BG_VENOM, glow(32, 52, 11, VEN, 0.25) + inked('M32 9 V21', '#5C4028', 5.4) + C(32, 7, 4.2, '#C9A040', 2.4) +
                       F(BLADE_V, '#D7DEE6', 0) + F('M25.3 33 C28 35.5 30 32 32.5 34.5 C35 37 36.5 33.5 38.7 33.5 L38 39 L32 51 L26 39 Z', VEN, 0) +
                       P(BLADE_V, K, 3.4) + P('M28.5 26.5 L28 32', '#FFFFFF', 2.2) + inked('M18 22 H46', '#C9A040', 4.6) + F(drop(32, 58.5, 3.4), VEN, 2.4))
T['spec_blades'] = tile(BG_BLADES, ''.join(F(whirl(32, 32, 26, a - 110, a - 30, 0.5, 6), '#BDF5E6', 2.2) for a in (-90, 30, 150)) +
                        ''.join(turned(32, 32, k * 120, turned(1, -14, 0, knife(1.1))) for k in range(3)) + C(32, 32, 4.5, '#C9A040', 2.4))

# ---- capstones: the biggest talent of each spec, on its spec's colour, with a little gold
T['cap_payback'] = tile(BG_SHIELD, glow(46, 26, 18, FLAME, 0.45) + F(burst(46, 26, (19, 8, 14, 8), 8, -75), '#F2C230', 3) +
                        P('M4 22 H11 M2 33 H9 M4 44 H11', '#FFF3C4', 3) + turned(27, 35, -12, tower(0.72)))
T['cap_axestorm'] = tile(BG_AXE, F(whirl(32, 32, 26, 110, 290, 0.5, 6.5), '#F2C230', 2.6) + F(whirl(32, 32, 26, 290, 470, 0.5, 6.5), '#F2C230', 2.6) +
                         turned(33, 40, 40, great_axe(0.55)))
WING = 'M-9 -3 C-13 -13 -21 -18 -31 -18 C-30 -14 -29 -12 -27 -10.5 C-28.5 -8 -27.5 -5.5 -24 -4.5 C-25 -2 -23.5 0.5 -20 0.5 C-17 3 -12 2 -9 -3 Z'
T['cap_miracle'] = tile(BG_MERCY, '<path d="M19 64 L26 22 H38 L45 64 Z" style="fill: #FFE08A; opacity: 0.35"/>' + glow(32, 28, 20, FLAME, 0.4) +
                        inked('M32 4 V9 M20 8 L22.5 12 M44 8 L41.5 12', '#F2C230', 2.6) +
                        turned(32, 30, 0, F(WING, '#FFFFFF', 3) + F(m(WING), '#FFFFFF', 3) + F(heart(0, 2, 0.72), '#E8505B', 3.2) +
                               P('M-9 -6 C-8.5 -8.5 -6.5 -10 -4.5 -10', '#FFFFFF', 2)) +
                        F(star4(12, 50, 4.5), '#F2C230', 1.8) + F(star4(52, 46, 5), '#F2C230', 1.8))
T['cap_sunstrike'] = tile(BG_WRATH, glow(48, 16, 14, FLAME, 0.45) + spokes(48, 16, 10, 14.5, range(0, 360, 45), '#F2C230', 2.4) + C(48, 16, 7, '#F2C230', 3) +
                          P('M33 19 L14 38 M45 29 L26 48', '#FFE08A', 2.6, 0.8) + inked('M43 21 L22 42', '#F2C230', 4.4) +
                          turned(22, 42, 135, F('M-6 0 C0 -7 10 -9 24 0 C10 9 0 7 -6 0 Z', '#FFF3C4', 3.2) + P('M2 -2.5 C8 -4.5 14 -4 18 -1.5', '#FFFFFF', 2)) +
                          F(burst(9, 55, (9, 4), 6), '#F2C230', 2.4) + inked('M36 48 V58 M31 53 H41', '#FFFFFF', 2.8) + inked('M54 36 V44 M50 40 H58', '#FFFFFF', 2.4))


def shard(dx, dy, k=0.8):
    """the icicle's shard, smaller, moved by (dx, dy)"""
    q = lambda x, y: f'{f1(32 + (x - 32) * k + dx)} {f1(34 + (y - 34) * k + dy)}'
    return F(f'M{q(8, 58)} L{q(44, 10)} L{q(54, 18)} Z', '#DDF3FF', 3.2) + P(f'M{q(16, 50)} L{q(44, 16)}', '#FFFFFF', 2.2) + P(f'M{q(30, 42)} L{q(48, 22)}', '#8FD6FF', 2.2)


T['cap_hailstorm'] = tile(BG_FROST, glow(38, 22, 18, '#8FD6FF', 0.3) + shard(-7, -6) + shard(7, 6) + F(star4(53, 50, 6), '#F2C230', 2) + F(star4(12, 14, 5), '#F2C230', 1.8))
T['cap_shower'] = tile(BG_FIRE, fireball(22, 20, 0.55, 2.8) + fireball(51, 27, 0.48, 2.8) + fireball(36, 49, 0.62, 2.8) +
                       F(star4(52, 52, 5), '#F2C230', 1.8) + F(star4(10, 40, 4), '#F2C230', 1.6))
T['cap_fangs'] = tile(BG_VENOM, '<path d="M4 26 C18 14 32 8 46 6 M18 60 C32 46 46 36 60 32" style="fill: none; stroke: #1E1A1A; stroke-width: 10; stroke-linecap: round"/>'
                      '<path d="M4 26 C18 14 32 8 46 6 M18 60 C32 46 46 36 60 32" style="fill: none; stroke: #7CF06A; stroke-width: 5; stroke-linecap: round"/>' +
                      inked('M12 46 L22 34', '#5C4028', 4.5) + F('M17 29 L27 39 L24 42 L14 32 Z', '#F2C230', 2.8) + F('M20 32 C28 20 38 10 46 8 C44 17 36 29 26 37 Z', '#D7DEE6', 3.2) +
                      inked('M24 54 L36 40', '#5C4028', 4.8) + F('M30 34 L42 46 L39 49 L27 37 Z', '#F2C230', 3) + F('M34 38 C44 24 52 14 58 12 C56 22 48 36 39 43 Z', '#D7DEE6', 3.4))
T['cap_knifestorm'] = tile(BG_BLADES, glow(32, 32, 14, FLAME, 0.4) + F(whirl(32, 32, 9, 0, 150, 0.5, 4.5), '#F2C230', 2.2) + F(whirl(32, 32, 9, 180, 330, 0.5, 4.5), '#F2C230', 2.2) +
                           ''.join(turned(32, 32, k * 72, turned(0, -20, 0, knife(0.78))) for k in range(5)))

# ---- the second capstone of each spec (row 5 is a pick of two, 18 Oct)
SKULL = ('M0 -12 C8 -12 13 -7 13 0 C13 5 10 8 7 9 V13 H-7 V9 C-10 8 -13 5 -13 0 C-13 -7 -8 -12 0 -12 Z')
T['cap_unbowed'] = tile(BG_SHIELD, F(whirl(32, 34, 25, 200, 340, 0.5, 6), '#F2C230', 2.6) + F(whirl(32, 34, 25, 20, 160, 0.5, 6), '#F2C230', 2.6) +
                        turned(32, 34, 0, tower(0.62)) +
                        ''.join(turned(x, y, a, F('M0 -7 L5 4 L-5 4 Z', '#E8505B', 2.4)) for x, y, a in ((8, 22, 60), (56, 22, -60), (32, 62, 180))))
T['cap_finalword'] = tile(BG_AXE, glow(22, 46, 16, FLAME, 0.45) + F(burst(22, 46, (17, 7, 13, 7), 8, -80), '#F2C230', 2.8) +
                          turned(22, 47, 0, F(sc(SKULL, 0.75), '#F0E8D2', 2.6) + C(-3.5, -1, 2.2, K, 0) + C(3.5, -1, 2.2, K, 0)) +
                          turned(41, 33, -38, great_axe(0.56)))
T['cap_dawn'] = tile(BG_MERCY, glow(32, 44, 26, FLAME, 0.35) + spokes(32, 44, 20, 28, (-170, -145, -120, -95, -70, -45, -20), '#F2C230', 3.2) +
                     F('M14 44 C14 34 22 26 32 26 C42 26 50 34 50 44 Z', '#F2C230', 3.4) + P('M22 36 C24 32 27 30 31 29.5', '#FFFFFF', 2.4) +
                     F('M-4 44 H68 V68 H-4 Z', '#4F3780', 3.5) +
                     ''.join(inked(f'M{x - 5} {y + 3} L{x} {y - 2} L{x + 5} {y + 3}', '#FFF3C4', 2.6) for x, y in ((14, 55), (32, 53), (50, 55))))
T['cap_flashpoint'] = tile(BG_WRATH, glow(32, 32, 26, FLAME, 0.4) + F(boom(32, 32, (27, 21, 25, 20), 12), '#F2C230', 3) +
                           F(boom(32, 32, (15, 12), 10, -72), '#FFF3C4', 2.4) + C(32, 32, 6, '#FFFFFF', 2.4) +
                           ''.join(F(star4(x, y, r), '#FFF3C4', 1.8) for x, y, r in ((9, 9, 5), (55, 10, 4.5), (8, 55, 4), (56, 54, 5))))
_dshard = lambda x, y, k: turned(x, y, 135, F(sc('M-17 0 L9 -6 L15 0 L9 6 Z', k), '#DDF3FF', 2.8) + P(sc('M-11 0 L10 0', k), '#8FD6FF', 2))
T['cap_icefall'] = tile(BG_FROST, F('M10 20 C4 20 4 11 11 10 C11 3 22 0 26 6 C30 -1 44 1 44 9 C52 8 56 17 49 20 Z', '#C9D2DC', 3) + P('M15 16 H43', '#E8EEF3', 2.4) +
                        _dshard(18, 34, 0.75) + _dshard(34, 30, 0.95) + _dshard(48, 36, 0.7) +
                        F(burst(32, 55, (11, 5, 9, 5), 8), '#8FD6FF', 2.6) + F(star4(54, 52, 5), '#F2C230', 1.8) + F(star4(10, 50, 4), '#F2C230', 1.6))
T['cap_pyre'] = tile(BG_FIRE, glow(32, 44, 26, FIRE, 0.3) + '<ellipse cx="32" cy="55" rx="25" ry="7" style="fill: #3A120F; stroke: #1E1A1A; stroke-width: 3"/>' +
                     blaze(14, 57, 10, 14, -1, 2.6) + blaze(30, 58, 14, 25, 1, 2.8) + blaze(48, 58, 17, 36, 2, 3) +
                     inked('M14 30 L30 22 L45 12', '#FFF3C4', 2.4) + F('M41 9 L50 9 L45 17 Z', '#FFF3C4', 2))
T['cap_lastbreath'] = tile(BG_VENOM, glow(40, 44, 16, VEN, 0.3) +
                           turned(40, 46, 0, F(sc(SKULL, 0.9), '#F0E8D2', 2.8) + C(-4, -1, 2.6, K, 0) + C(4, -1, 2.6, K, 0) + P('M-3 9 V12 M0 9 V12 M3 9 V12', K, 1.4)) +
                           P('M28 40 C20 38 16 30 22 25 C27 21 33 26 28 30 C24 33 18 28 18 22', '#E9FFE4', 3) +
                           turned(22, 22, 135, turned(0, 0, 0, knife(1.05))) + F(star4(54, 14, 5), '#F2C230', 1.8))
T['cap_cuttingwind'] = tile(BG_BLADES, ''.join(F(whirl(32, 32, r, a, a + 120, 0.5, w), '#BDF5E6', 2.2) for r, a, w in ((26, -150, 5.5), (19, 10, 4.5), (12, 150, 3.5))) +
                            turned(32, 32, 0, turned(0, -22, 90, knife(0.85))) + turned(32, 32, 130, turned(0, -22, 90, knife(0.85))) +
                            turned(32, 32, 250, turned(0, -22, 90, knife(0.85))) + C(32, 32, 4, '#E8505B', 2.4))

# ---- experience, and the tomes that teach talents
T['xp'] = tile('#2E2A55', glow(32, 32, 24, '#B98CFF', 0.3) + F(star4(32, 32, 26), '#B98CFF', 3.5) + P('M29.5 14 C29 19 28 22 26 24.5', '#FFFFFF', 2.4) +
               F(star4(53, 12, 6.5), '#B98CFF', 2.2) + F(star4(11, 52, 5), '#B98CFF', 2))
PAGE, LINES = 'M-13 -17 H13 V17 H-13 Z', P('M-7 -9 H7 M-7 -3 H7 M-7 3 H3', '#B8A27A', 2)
T['tome_pages'] = tile('#2F6F5A', turned(23, 30, -16, F(PAGE, '#F3E6CC', 3) + LINES) + turned(41, 30, 14, F(PAGE, '#F3E6CC', 3) + LINES) +
                       turned(32, 36, -3, F('M-13 -17 H7 L13 -11 V17 H-13 Z', '#F3E6CC', 3) + F('M7 -17 V-11 H13 Z', '#D8C9A8', 2.4) + LINES))
T['tome_scholar'] = tile('#A0703F', turned(32, 32, -8, F('M-17 -24 H17 C18.5 -24 19 -23.5 19 -22 V24 C19 25.5 18.5 26 17 26 H-17 Z', '#F3E6CC', 3) +
                                                   P('M17 -18 V20', '#D8C9A8', 1.6) + F('M-20 -27 H14 C15.5 -27 16 -26.5 16 -25 V21 C16 22.5 15.5 23 14 23 H-20 Z', '#4F6FA8', 3.5) +
                                                   F('M-20 -27 H-13 V23 H-20 Z', '#3D5A8C', 3) + P('M-7 -20 H9 V16 H-7 Z', '#7D98C8', 2) + F(burst(1, -2, (6.5,), 2), '#F2C230', 2.4) +
                                                   F('M12 -6.5 H21 V1.5 H12 Z', '#6B4528', 2.6) + F('M9 -8.5 H15 V3.5 H9 Z', '#F2C230', 2.4) + C(12, -2.5, 1.2, K, 0)))
T['tome_grand'] = tile('#3B2B54', glow(32, 33, 31, '#FFB547', 0.25) + glow(32, 33, 22, FLAME, 0.35) + P('M32 1 V6 M7 11 L11 14 M57 11 L53 14 M2 33 H7 M62 33 H57', FLAME, 2.6) +
                       turned(32, 35, -6, F('M-20 -22 H21 C22.5 -22 23 -21.5 23 -20 V24 C23 25.5 22.5 26 21 26 H-20 Z', '#FFF3C4', 3) +
                              F('M-23 -25 H18 C19.5 -25 20 -24.5 20 -23 V21 C20 22.5 19.5 23 18 23 H-23 Z', '#6A4BA3', 3.5) +
                              F('M-23 -25 H-15 V23 H-23 Z', '#4F3780', 3) + P('M-23 -15 H-15 M-23 13 H-15', '#F2C230', 3) +
                              ''.join(F(d, '#F2C230', 2.4) for d in ('M-15 -25 H-6 L-15 -16 Z', 'M20 -25 H11 L20 -16 Z', 'M-15 23 H-6 L-15 14 Z', 'M20 23 H11 L20 14 Z')) +
                              C(2.5, -1, 8, '#F2C230', 2.6) + F(burst(2.5, -1, (5.5,), 2), '#E9DDFF', 2) + P('M0.5 -4 L1.5 -5', '#FFFFFF', 1.6)))

# ---- the duo rework: the ranger's buttons, specs, capstones and gear, the warrior's Sword and Greataxe (art_icons_duo.py)
import art_icons_duo  # noqa: E402
T.update(art_icons_duo.tiles(sys.modules[__name__]))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    json.dump(T, open(OUT + 'icons.json', 'w'))
    cells = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:72px;height:72px;border-radius:13px;overflow:hidden;border:3px solid #1E1A1A;box-shadow:0 4px 0 #1E1A1A">{v.replace("<svg ", "<svg style=\"display:block;width:100%;height:100%\" ")}</div><span style="font:12px monospace">{k}</span></div>' for k, v in T.items())
    open(OUT + '_icons_preview.html', 'w').write(f'<body style="margin:0;padding:20px;background:#FFF8EC"><div style="display:flex;gap:14px;flex-wrap:wrap;width:900px">{cells}</div></body>')
    print('tiles', len(T))
