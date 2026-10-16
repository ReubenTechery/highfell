import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Heroes in layers: a body (race, sex and class, in plain underclothes) with a layer on it for each gear slot
# (chest, shoulders, helm, weapon), drawn from the item worn there, so what a hero wears is what you see.
#
# Bands: a hero is drawn band by band, back to front (BANDS, one order for the front and one for the back).
# The body and every layer put their shapes in bands, so a layer can sit behind one part of the body and in
# front of another: a shield under the pauldron, a gauntlet over the axe's haft, a beard over the plate.
# Within a band the body goes first, then the layers in SLOT_ORDER.
#
# Anchors: a class's gear is drawn once, on that class's reference body (the warrior's is the dwarf), in game
# units round the ground point. Every body has a fit: where the reference's landmarks fall on it. Each shape
# of a layer names a region, and moves onto the body by it:
#   spine  torso, arms and legs: stretched along the body's height through its knots (y on the reference, y on
#          the body, how wide it is there), so a plate fits a dwarf's barrel and an elf's long waist
#   head   the helm, round the middle of the eyes, scaled to the head
#   sh     pauldrons and mantles, from the shoulder line, scaled the same both ways so domes stay round
#   arm    the weapon arm's sleeve and cuff, from its shoulder to its grip (turned and scaled to fit)
#   arm2   the other arm's, from its shoulder to the other grip
#   main   what the weapon hand holds (and the hand itself), round its grip
#   off    what the other hand holds, round its grip
# Only the coordinates move: the ink keeps its weight, as everywhere in the game. src/ui/heroart.ts does the
# same at run time from art/heroes.json, so a layer is stored once per class, not once per body.
import json, math, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from art_sprites import f, gild, GILD, BONE, BONE_D, GOLD, GOLD_D

BANDS = {
    'f': ('cape', 'mane', 'legs', 'torso', 'trim', 'arms', 'off', 'shoulders', 'hair', 'weapon', 'hands', 'hood', 'head', 'helm'),
    'b': ('legs', 'torso', 'cape', 'trim', 'off', 'arms', 'shoulders', 'hair', 'weapon', 'hands', 'hood', 'head', 'helm', 'mane'),
}
SLOT_ORDER = ('chest', 'shoulders', 'helm', 'weapon')
REGIONS = ('spine', 'head', 'sh', 'arm', 'arm2', 'main', 'off')

# each class's reference landmarks, in game units on its reference body, front and back (from behind, the hands swap)
REF = {}


def ref(cls, head, sh, main, off, arm, arm2):
    """a class's reference landmarks, seen from the front: the middle of the eyes, the shoulder line, the two
    grips and the two shoulder joints (from behind, the hands swap sides)"""
    mx = lambda p: (-p[0], p[1])
    REF[cls] = {'f': {'head': head, 'sh': sh, 'main': main, 'off': off, 'arm': arm, 'arm2': arm2},
                'b': {'head': head, 'sh': sh, 'main': mx(main), 'off': mx(off), 'arm': mx(arm), 'arm2': mx(arm2)}}


def identity_fit(cls, view):
    r = REF[cls][view]
    return {'spine': [[0, 0, 1], [-200, -200, 1]], 'head': [*r['head'], 1], 'sh': [r['sh'], 1], 'main': [*r['main'], 1],
            'off': [*r['off'], 1], 'arm': list(r['arm']), 'arm2': list(r['arm2'])}


def fit(cls, view, spine, head, sh, main, off, arm, arm2):
    """a body's fit, seen from the front (spine knots, [x, y, k] for the head and the grips, [y, k] for the
    shoulder line, [x, y] for the shoulder joints); from behind the hands swap sides"""
    if view == 'b':
        main, off, arm, arm2 = [-main[0], *main[1:]], [-off[0], *off[1:]], [-arm[0], arm[1]], [-arm2[0], arm2[1]]
    return {'spine': [list(k) for k in spine], 'head': list(head), 'sh': list(sh), 'main': list(main), 'off': list(off),
            'arm': list(arm), 'arm2': list(arm2)}


# ---------------------------------------------------------------- moving shapes
TOK = re.compile(r'[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)')
ARGS = {'M': 2, 'L': 2, 'C': 6, 'Q': 4, 'S': 4, 'T': 2, 'H': 1, 'V': 1, 'Z': 0}


def warp_path(d, fn):
    """a path with every point moved by fn(x, y). Absolute commands only; H and V become L (a stretch can
    tilt them)."""
    toks, out, i, cmd = TOK.findall(d), [], 0, None
    cx = cy = sx = sy = 0.0
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            assert t in ARGS, f'warp: absolute M L C Q S T H V Z only, not {t} in {d[:60]}'
            cmd, i = t, i + 1
            if cmd == 'Z':
                out.append('Z')
                cx, cy = sx, sy
                continue
        n = ARGS[cmd]
        v = [float(x) for x in toks[i:i + n]]
        i += n
        pts = [(v[0], cy)] if cmd == 'H' else [(cx, v[0])] if cmd == 'V' else list(zip(v[0::2], v[1::2]))
        out.append(('L' if cmd in 'HV' else cmd) + ' '.join(f'{f(x)} {f(y)}' for x, y in (fn(*p) for p in pts)))
        cx, cy = pts[-1]
        if cmd == 'M':
            sx, sy, cmd = cx, cy, 'L'
    return ' '.join(out)


def scale_at(fn, x, y, h=0.5):
    """how much fn stretches across and down at a point"""
    return abs(fn(x + h, y)[0] - fn(x - h, y)[0]) / (2 * h), abs(fn(x, y + h)[1] - fn(x, y - h)[1]) / (2 * h)


def warp(svg, fn):
    """shapes (paths, circles, ellipses) with their coordinates moved by fn; the ink keeps its weight"""
    assert 'transform' not in svg, 'a layer is plain shapes, no transforms'

    def circ(mm):
        x, y, r = (float(v) for v in mm.groups())
        jx, jy = scale_at(fn, x, y)
        (nx, ny) = fn(x, y)
        return f'<circle cx="{f(nx)}" cy="{f(ny)}" r="{f(r * math.sqrt(jx * jy))}"'

    def ell(mm):
        x, y, rx, ry = (float(v) for v in mm.groups())
        jx, jy = scale_at(fn, x, y)
        (nx, ny) = fn(x, y)
        return f'<ellipse cx="{f(nx)}" cy="{f(ny)}" rx="{f(rx * jx)}" ry="{f(ry * jy)}"'

    svg = re.sub(r' d="([^"]+)"', lambda mm: f' d="{warp_path(mm.group(1), fn)}"', svg)
    svg = re.sub(r'<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"', circ, svg)
    return re.sub(r'<ellipse cx="([-\d.]+)" cy="([-\d.]+)" rx="([-\d.]+)" ry="([-\d.]+)"', ell, svg)


def lerp_knots(knots, y):
    """(y on the body, how wide) at reference height y, through the spine's knots (straight on past the ends)"""
    ks = sorted(knots, key=lambda k: -k[0])  # from the ground up
    for a, b in zip(ks, ks[1:]):
        if y >= b[0] or b is ks[-1]:
            t = (y - a[0]) / (b[0] - a[0])
            return a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * min(1.0, max(0.0, t))
    return ks[0][1], ks[0][2]


def region_fn(cls, view, fit, region):
    """how a point of the class's reference body moves onto a body, for one region"""
    r = REF[cls][view]
    if region == 'spine':
        knots = fit['spine']
        return lambda x, y: (lambda yk: (x * yk[1], yk[0]))(lerp_knots(knots, y))
    if region == 'sh':
        (ty, k), ry = fit['sh'], r['sh']
        return lambda x, y: (x * k, ty + (y - ry) * k)
    if region in ('arm', 'arm2'):
        # the reference arm, shoulder to grip, laid along the body's: turned and scaled about the shoulder
        grip = 'main' if region == 'arm' else 'off'
        (ax, ay), (bx, by) = r[region], r[grip]
        (cx, cy), (dx, dy) = fit[region], fit[grip][:2]
        k = math.hypot(dx - cx, dy - cy) / math.hypot(bx - ax, by - ay)
        a = math.atan2(dy - cy, dx - cx) - math.atan2(by - ay, bx - ax)
        co, si = math.cos(a) * k, math.sin(a) * k
        return lambda x, y: (cx + (x - ax) * co - (y - ay) * si, cy + (x - ax) * si + (y - ay) * co)
    (tx, ty, k), (rx, ry) = fit[region], r[region]
    return lambda x, y: (tx + (x - rx) * k, ty + (y - ry) * k)


def is_identity(fit, cls, view):
    return fit == identity_fit(cls, view)


# ---------------------------------------------------------------- layers and bodies
def frag(band, region, *svg):
    """one part of a layer: the band it is drawn in, the region it moves by, its shapes"""
    assert band in BANDS['f'] and region in REGIONS, (band, region)
    return (band, region, ''.join(svg))


def frags_of(layer, view, fem):
    """a layer's parts for a view; a woman's look where the layer has one"""
    return layer.get(view + 'w', layer[view]) if fem else layer[view]


def compose(body, view, layers, gilded=()):
    """a body wearing some layers ({slot: layer}), as svg shapes in game units; gilded slots through gild()"""
    cls, fit = body['cls'], body[view]['fit']
    same = is_identity(fit, cls, view)
    out = []
    for band in BANDS[view]:
        out.append(body[view]['z'].get(band, ''))
        for slot in SLOT_ORDER:
            L = layers.get(slot)
            if not L:
                continue
            for b, region, svg in frags_of(L, view, body['fem']):
                if b != band:
                    continue
                svg = svg if same else warp(svg, region_fn(cls, view, fit, region))
                out.append(gild(svg) if slot in gilded else svg)
    return ''.join(out)


# ---------------------------------------------------------------- boxes
def bbox(svg):
    """a rough box round some svg: its path points (control points too), circles and ellipses, and heads
    placed with a translate and a scale"""
    xs, ys = [], []

    def add(body, tx=0.0, ty=0.0, k=1.0):
        for d in re.findall(r' d="([^"]+)"', body):
            nums = [float(n) for n in re.findall(r'-?(?:\d+\.?\d*|\.\d+)', d)]
            cmds = re.findall(r'[A-Za-z]', d)
            if any(c in 'HV' for c in cmds):  # H and V carry one number: walk them
                p = warp_path(d, lambda x, y: (x, y))
                nums = [float(n) for n in re.findall(r'-?(?:\d+\.?\d*|\.\d+)', p)]
            xs.extend(tx + v * k for v in nums[0::2]); ys.extend(ty + v * k for v in nums[1::2])
        for cx, cy, r in re.findall(r'<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"', body):
            xs.extend((tx + (float(cx) - float(r)) * k, tx + (float(cx) + float(r)) * k))
            ys.extend((ty + (float(cy) - float(r)) * k, ty + (float(cy) + float(r)) * k))
        for cx, cy, rx, ry in re.findall(r'<ellipse cx="([-\d.]+)" cy="([-\d.]+)" rx="([-\d.]+)" ry="([-\d.]+)"', body):
            xs.extend((tx + (float(cx) - float(rx)) * k, tx + (float(cx) + float(rx)) * k))
            ys.extend((ty + (float(cy) - float(ry)) * k, ty + (float(cy) + float(ry)) * k))

    for tx, ty, k, inner in re.findall(r'<g transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)">(.*?)</g>', svg):
        add(inner, float(tx), float(ty), float(k))
    add(re.sub(r'<g transform=.*?</g>', '', svg))
    return min(xs), min(ys), max(xs), max(ys)


def union(boxes):
    return min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)


def view_box(box, ink=3):
    x0, y0, x1, y1 = box
    x0, y0, x1, y1 = math.floor(x0 - ink), math.floor(y0 - ink), math.ceil(x1 + ink), math.ceil(y1 + ink)
    return [x0, y0, x1 - x0, y1 - y0]


def sprite(svg, vb):
    x, y, w, h = vb
    return {'svg': f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}">{svg}</svg>', 'vb': vb}


def fit_box(body, view, layers):
    """one box for a body that holds it in any of its class's gear, so the picture never changes size"""
    boxes = [bbox(''.join(body[view]['z'].values()))]
    for L in layers:
        boxes.append(bbox(compose(body, view, {L['slot']: L})))
    return view_box(union(boxes))


# ---------------------------------------------------------------- pieces from the wardrobe's stands
def from_stand(parts, k, tx=0.0, ty=0.0, ky=None, flip=False):
    """stand pieces (in the wardrobe's units) moved onto a hero: scaled by k (ky down, if it differs) and moved
    by (tx, ty), mirrored first when flip. The ink keeps its weight."""
    return warp(''.join(parts), lambda x, y: ((-x if flip else x) * k + tx, y * (ky or k) + ty))


def centreline(svg):
    """the middle of a shaft drawn as a closed shape by the wardrobe's bar() or band(): one side's points, then
    the other side's back again, paired up"""
    d = re.search(r' d="([^"]+)"', svg).group(1)
    v = [float(n) for n in TOK.findall(d) if not n.isalpha()]
    pts = list(zip(v[0::2], v[1::2]))
    n = len(pts) // 2
    return [((pts[i][0] + pts[-1 - i][0]) / 2, (pts[i][1] + pts[-1 - i][1]) / 2) for i in range(n)]


def held(piece, shafts, grip, hand, k):
    """a stand's weapon in a hero's hand, mirrored so it faces out, the stand's grip point on the hand (both in
    their own units: the stand's, and the hero's in game units); its shafts ({index in the silhouette: colour})
    redrawn at the hero's weight. From behind it is in the other hand: the same, mirrored."""
    sil, det = piece
    (gx, gy), (hx, hy) = grip, hand
    fn = lambda x, y: (hx + (gx - x) * k, hy + (y - gy) * k)
    front = ''.join(shaft(p, fn, shafts[i]) if i in shafts else warp(p, fn) for i, p in enumerate(sil)) + warp(''.join(det), fn)
    return front, warp(front, lambda x, y: (-x, y))


def shaft(svg, fn, col, w=4.4, edge=4):
    """a stand's shaft redrawn at a hero's weight: a beam down its middle, moved by fn. At hero size the stand's
    own shaft would be all ink."""
    from art_sprites import beam
    pts = [fn(x, y) for x, y in centreline(svg)]
    return beam('M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts), col, w, edge)


def pair_scale(svg, k, px, py):
    """a mirrored pair (two pauldrons) each scaled by k about its own pivot: (px, py) for the left one, (-px, py)
    for the right. Each shape is all on one side, so its points know which pivot is theirs."""
    ax = abs(px)
    return warp(svg, lambda x, y: ((ax + (abs(x) - ax) * k) * (1 if x >= 0 else -1), py + (y - py) * k))



# ---------------------------------------------------------------- art/heroes.json
def class_modules():
    """each class drawn in layers, and the tool that draws its gear"""
    import art_gear_tank, art_gear_healer
    return {'warrior': art_gear_tank, 'cleric': art_gear_healer}


def classes():
    """every class's gear, by look id; each layer knows its class"""
    out = {}
    for cls, mod in class_modules().items():
        for lid, L in mod.layers().items():
            out[lid] = {**L, 'cls': cls}
    return out


def sheets(data):
    """a contact sheet per class (for tools/art_sheet.py): every body in its class's SHEET outfits, front and
    back, as composed from art/heroes.json, with a set's outfit gilded too"""
    import art_bodies
    out = {}
    for cls, mod in class_modules().items():
        sheet = {}
        for bid, make in art_bodies.BODIES.items():
            body = make()
            if body['cls'] != cls:
                continue
            for name, ids in mod.SHEET.items():
                worn = {data['layers'][i]['slot']: data['layers'][i] for i in ids}
                gold = [(name, ())] + ([(name + '_gilded', tuple(worn))] if any(not i.startswith('gear.') for i in ids) and name != 'mixed' else [])
                for label, gl in gold:
                    for v in ('f', 'b'):
                        sheet[f'{bid}.{label}_{v}'] = sprite(compose(body, v, worn, gl), data['bodies'][bid][v]['vb'])
        out[cls] = sheet
    return out


def head_top(body, view, helms):
    """the top of a body's head in any of its helms: what floats over a hero (a curse, a name) goes above it"""
    return min([bbox(body[view]['z']['head'])[1]] + [bbox(compose(body, view, {'helm': L}))[1] for L in helms])


def build():
    import art_bodies
    layers = classes()
    bodies = {}
    for bid, make in art_bodies.BODIES.items():
        body = make()
        mine = [L for L in layers.values() if L['cls'] == body['cls']]
        helms = [L for L in mine if L['slot'] == 'helm']
        bodies[bid] = {'cls': body['cls'], 'fem': body['fem'], **{v: {
            'vb': fit_box(body, v, mine), 'top': round(head_top(body, v, helms), 1), 'fit': body[v]['fit'],
            'z': {b: z for b, z in body[v]['z'].items() if z}} for v in ('f', 'b')}}
    out_layers = {}
    for lid, L in layers.items():
        o = {'cls': L['cls'], 'slot': L['slot'], **{k: [list(fr) for fr in L[k]] for k in ('f', 'b', 'fw', 'bw') if k in L}}
        if 'glow' in L:
            o['glow'] = list(L['glow'])
        out_layers[lid] = o
    # a race's gold look (Gilded Bones, Gilded Gnomes): the colours it turns, and whether its gear's metal goes too
    from art_heroes import GNOME_GILD
    races = {'risen': {'map': {BONE: GOLD, BONE_D: GOLD_D}, 'gear': False},
             'gnome': {'map': {**GILD, **GNOME_GILD}, 'gear': True}}
    return {'bands': {v: list(b) for v, b in BANDS.items()}, 'slots': list(SLOT_ORDER), 'ref': REF, 'bodies': bodies,
            'layers': out_layers, 'gild': GILD, 'races': races}


if __name__ == '__main__':
    # Usage: python3 tools/art_gear.py -> art/heroes.json, and shots/heroes_<class>.json, a contact sheet per class:
    #   python3 tools/art_sheet.py shots/heroes_warrior.png shots/heroes_warrior.json --cols 8
    import art_gear  # the module the bodies and gear register with, not this __main__ copy of it
    data = art_gear.build()
    json.dump(data, open(HF_ROOT + '/art/heroes.json', 'w'), separators=(',', ':'))
    os.makedirs(HF_ROOT + '/shots', exist_ok=True)
    for cls, sheet in art_gear.sheets(data).items():
        json.dump(sheet, open(f'{HF_ROOT}/shots/heroes_{cls}.json', 'w'))
    print('heroes:', len(data['bodies']), 'bodies,', len(data['layers']), 'layers,', os.path.getsize(HF_ROOT + '/art/heroes.json'), 'bytes')
