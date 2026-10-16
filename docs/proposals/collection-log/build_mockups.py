# Builds the collection-log mockups as plain HTML pages, from the game's real art (art/*.json) and the
# mockup stands (run mannequins.py first). Writes shots/log-proposal/mock/*.html.
import json, os, urllib.parse
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'shots' / 'log-proposal'
WORK.mkdir(parents=True, exist_ok=True)
ROOT, HERE = str(ROOT), str(WORK)
OUT = os.path.join(HERE, 'mock')
os.makedirs(OUT, exist_ok=True)

ld = lambda p: json.load(open(os.path.join(ROOT, p)))
ICONS = {**ld('art/icons.json'), **ld('art/collect_icons.json')}
SPR = {**ld('art/sprites.json'), **ld('art/hearth.json')}
MAN = json.load(open(os.path.join(HERE, 'mannequins.json')))


def uri(name):
    return 'data:image/svg+xml;charset=utf-8,' + urllib.parse.quote(SPR[name]['svg'])


def tile(name):
    return ICONS[name]


def tile_bare(name, k=1.0):
    """an icon without its coloured square, for standing on a shelf"""
    svg = ICONS[name]
    inner = svg[svg.index('>') + 1: svg.rindex('</svg>')]
    inner = inner[inner.index('/>') + 2:] if inner.startswith('<rect') else inner
    return f'<svg viewBox="0 0 64 64" aria-hidden="true">{inner}</svg>'


def stand(set_id, have=('helm', 'shoulders', 'chest', 'weapon'), gilded=False, new=None, tryon=False):
    src = MAN['gilded' if gilded else 'sets'][set_id]
    x, y, w, h = MAN['vb']
    parts = {}
    for slot in ('weapon', 'chest', 'shoulders', 'helm'):
        g = src[slot]
        cls = []
        if slot not in have:
            cls.append('ghost')
        if slot == new:
            cls.append('drop')
        if cls:
            g = g.replace('class="pc ', f'class="pc {" ".join(cls)} ', 1)
        parts[slot] = g
    return (f'<svg viewBox="{x} {y} {w} {h}" class="stand-svg{" tryon" if tryon else ""}" aria-hidden="true">'
            f'{parts["weapon"]}{MAN["stand"]}{parts["chest"]}{parts["shoulders"]}{parts["helm"]}</svg>')


# ---------------------------------------------------------------- content (from src/content/barrow)
RAR = {'epic': ('Epic', '#8A63D2'), 'unique': ('Unique', '#E7B53C'), 'bonus': ('Bonus', '#9BE15D'), 'trophy': ('Trophy', '#C9A27A')}
SETS = [
    dict(id='barrowguard', name='Barrowguard', role='tank', who='Tank', look='Bone-white plate, skull pauldrons',
         pieces=[('helm', 'barrowguard.helm', 'Barrowguard Helm', 's_barrowguard_helm', 'Cleave hits 25% harder and heals you for 24.'),
                 ('shoulders', 'barrowguard.shoulders', 'Barrowguard Pauldrons', 's_barrowguard_shoulders', 'Charge slams 35% harder and gives an 80 bone shield.'),
                 ('chest', 'barrowguard.chest', 'Barrowguard Plate', 's_barrowguard_chest', 'Slam hits 35% harder and heals 18 per enemy pulled.'),
                 ('weapon', 'gravekeeper.tank', 'The Gravedigger', 'u_gravedigger', 'Every fifth swing stuns, and Charge resets Cleave.')],
         b2='Perfect blocks give you a 150 bone shield.', b3='Slam raises two skeleton thralls for 8 seconds.'),
    dict(id='candlewake', name='Candlewake', role='healer', who='Healer', look='Black robes, a crown of candles',
         pieces=[('helm', 'candlewake.helm', 'Candlewake Crown', 's_candlewake_helm', ''), ('shoulders', 'candlewake.shoulders', 'Candlewake Mantle', 's_candlewake_shoulders', ''),
                 ('chest', 'candlewake.chest', 'Candlewake Robe', 's_candlewake_chest', ''), ('weapon', 'gravekeeper.healer', 'Lantern of the Long Night', 'u_longnight', '')],
         b2='Mend leaves a candle that heals 40 more.', b3='A dying ally becomes a ghost for 6 seconds.'),
    dict(id='rimebone', name='Rimebone', role='dps', who='Mage', look='A frosted bone crown, icicle shoulders',
         pieces=[('helm', 'rimebone.helm', 'Rimebone Crown', 's_rimebone_helm', ''), ('shoulders', 'rimebone.shoulders', 'Rimebone Mantle', 's_rimebone_shoulders', ''),
                 ('chest', 'rimebone.chest', 'Rimebone Robe', 's_rimebone_chest', ''), ('weapon', 'gravekeeper.dps', 'Gravefrost Staff', 'u_gravefrost', '')],
         b2='Comet on a frozen mob gives back half its cooldown.', b3='Blizzard raises frost skeletons that fight for you.'),
    dict(id='shadeveil', name='Shadeveil', role='dps', who='Rogue', look='A stitched mask, bone-bladed spaulders',
         pieces=[('helm', 'shadeveil.helm', 'Shadeveil Mask', 's_shadeveil_helm', ''), ('shoulders', 'shadeveil.shoulders', 'Shadeveil Spaulders', 's_shadeveil_shoulders', ''),
                 ('chest', 'shadeveil.chest', 'Shadeveil Jerkin', 's_shadeveil_chest', ''), ('weapon', 'gravekeeper.rogue', 'The Cryptfangs', 'u_cryptfangs', '')],
         b2='Big crits erupt in shadow for 55 damage.', b3='Shadowstep leaves a shadow clone for 6 seconds.'),
]
SHELF = [  # id, name, sprite or icon, rate, bonus
    ('trophy.rattlebones_plume', 'Sir Rattlebones’ Plume', ('spr', 'tr_plume'), '1/50', False, 'Sir Rattlebones'),
    ('dye.ghostly', 'Ghostly Dye', ('ico', 'c_dye'), '1/1,000', True, 'The Gravekeeper'),
    ('mount.gravehound', 'Gravehound', ('spr', 'mount_hound'), '1/1,000', True, 'The Gravekeeper'),
    ('pet.pint_gravekeeper', 'Pint-sized Gravekeeper', ('spr', 'pet_keeper'), '1/2,500', True, 'The Gravekeeper'),
]
STATES = {
    'mid': {'barrowguard.helm': (12, 1, '28 Sep'), 'barrowguard.chest': (27, 2, '6 Oct'), 'gravekeeper.tank': (33, 1, '11 Oct'),
            'candlewake.shoulders': (19, 1, '1 Oct'), 'rimebone.helm': (41, 1, 'Today', True), 'trophy.rattlebones_plume': (8, 1, '26 Sep')},
}
full = {}
kcs = [12, 77, 27, 33, 58, 19, 102, 49, 41, 66, 140, 188, 91, 120, 155, 214]
for i, (sid, sl) in enumerate([(s['id'], p) for s in SETS for p in s['pieces']]):
    full[sl[1]] = (kcs[i], 2 if i % 5 == 2 else 1, ['28 Sep', '19 Oct'][0])
full['trophy.rattlebones_plume'] = (8, 4, '26 Sep')
full['mount.gravehound'] = (171, 1, '2 Dec')
STATES['full'] = full
STATES['heroic'] = {'barrowguard.helm.gilded': (4, 1, '9 Feb'), 'gravekeeper.tank.gilded': (6, 1, 'Today', True)}

# ---------------------------------------------------------------- the look
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Lilita+One&family=Spectral:wght@400;600&display=swap" rel="stylesheet">'
CSS = r"""
:root {
  --ink: #1E1A1A; --panel: #FFF8EC; --panel-2: #F3E6CC; --panel-3: #E9D9BC; --dim: #5E4E44; --soft: #4A3C34;
  --night: #17121F; --stage: #2E2A55; --stage-2: #3A3150; --track: #2A2234;
  --gold: #F2C230; --gold-d: #D9A520; --green: #6FBF4A; --ghost: #9BE15D; --red: #E04A3F;
  --rar-common: #8E8A84; --rar-uncommon: #4E9A4A; --rar-rare: #3D7FC1; --rar-epic: #8A63D2; --rar-unique: #E7B53C;
  --f-display: 'Lilita One', 'Trebuchet MS', sans-serif; --f-mono: 'DM Mono', ui-monospace, Menlo, monospace; --f-body: 'Spectral', Georgia, serif;
  --t-hero: 40px; --t-title: 22px; --t-name: 16px; --t-label: 12px; --t-tag: 10px;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body { background: var(--night); color: var(--panel); font-family: var(--f-body); -webkit-font-smoothing: antialiased; }
button { font: inherit; color: inherit; cursor: pointer; }
.scene { min-height: 100vh; background: linear-gradient(#2E2A55, #3A3150 220px, #2E2A55); padding-top: 26px; }
.scene.desk { padding: 40px 0; display: grid; place-items: start center; background: radial-gradient(ellipse at 50% 0%, #4A4078 0%, #2E2A55 50%, #17121F 100%); }
.sheet { background: var(--panel); color: var(--ink); border: 3px solid var(--ink); border-bottom: 0; border-radius: 22px 22px 0 0; min-height: calc(100vh - 26px); }
.desk .sheet { width: 1180px; min-height: 0; border-bottom: 3px solid var(--ink); border-radius: 22px; box-shadow: 0 6px 0 var(--ink); }
.sh-head { display: flex; align-items: center; gap: 10px; padding: 12px 12px 0 16px; }
.sh-head h2 { margin: 0; flex: 1; font: 400 var(--t-title)/1 var(--f-display); }
.x { width: 40px; height: 40px; display: grid; place-items: center; border: 3px solid var(--ink); border-radius: 12px; background: var(--panel); box-shadow: 0 3px 0 var(--ink); }
.x svg { width: 18px; height: 18px; }
.tabs { display: flex; gap: 6px; padding: 10px 14px 0; border-bottom: 3px solid var(--ink); }
.tab { min-height: 38px; padding: 0 12px; border: 3px solid var(--ink); border-bottom: 0; border-radius: 12px 12px 0 0; background: var(--panel-2); font: 400 15px var(--f-display); color: var(--ink); }
.tab.on { background: var(--ink); color: var(--panel); }
.body { padding: 12px 14px 28px; display: grid; gap: 18px; }
.switch { display: flex; align-items: center; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.chipbtn { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 12px; border: 3px solid var(--ink); border-radius: 999px; background: var(--panel); box-shadow: 0 3px 0 var(--ink); font: 400 15px var(--f-display); color: var(--ink); }
.chipbtn.on { background: var(--ink); color: var(--panel); }
.chipbtn small { font: 500 var(--t-tag) var(--f-mono); opacity: .8; }
.chipbtn.hero { margin-left: auto; padding: 0 10px 0 6px; }
.chipbtn.hero .gem { width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--ink); background: #3A2C10; display: grid; place-items: center; }
.chipbtn.hero .gem i { width: 10px; height: 10px; background: var(--gold); transform: rotate(45deg); border: 2px solid var(--ink); }
.chipbtn.hero.on { background: var(--gold); color: var(--ink); }
.eyebrow { margin: 0; font: 500 var(--t-label)/1.2 var(--f-mono); letter-spacing: .14em; text-transform: uppercase; color: #E9B96E; }

/* ---- the prize stage: the log's big prize, front and centre ---- */
.prize { position: relative; overflow: hidden; display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 4px 12px; padding: 14px 14px 12px; border: 3px solid var(--ink); border-radius: 18px; background: radial-gradient(circle at 18% 58%, rgba(155, 225, 93, .30) 0, rgba(155, 225, 93, 0) 38%), var(--stage-2); color: var(--panel); box-shadow: 0 4px 0 var(--ink); }
.prize.done { background: repeating-conic-gradient(from 0deg at 18% 60%, rgba(242, 194, 48, .16) 0 10deg, transparent 10deg 20deg), radial-gradient(circle at 18% 58%, rgba(242, 194, 48, .45) 0, rgba(242, 194, 48, 0) 42%), #4A3A20; }
.prize.gilt { background: radial-gradient(circle at 18% 58%, rgba(242, 194, 48, .34) 0, rgba(242, 194, 48, 0) 40%), #3A2C10; }
.plinth { grid-row: span 3; position: relative; display: grid; place-items: end center; height: 188px; }
.plinth img { position: relative; height: 166px; margin-bottom: 18px; filter: saturate(.55) brightness(.82); }
.prize.done .plinth img, .prize.gilt .plinth img.lit { filter: none; }
.plinth .base { position: absolute; left: 10px; right: 10px; bottom: 0; height: 26px; border: 3px solid var(--ink); border-radius: 8px; background: #6E6382; box-shadow: inset 0 -6px 0 #5C5070; }
.plinth .base::after { content: ''; position: absolute; left: 12px; right: 12px; top: 6px; height: 3px; background: #A69BB2; border-radius: 2px; }
.lock { position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 2px solid var(--ink); border-radius: 999px; background: var(--panel); color: var(--ink); font: 500 var(--t-tag) var(--f-mono); box-shadow: 0 2px 0 var(--ink); }
.lock svg { width: 12px; height: 12px; }
.pz-top { align-self: end; }
.count { margin: 2px 0 0; font: 400 var(--t-hero)/1 var(--f-display); color: #FFF; text-shadow: 0 3px 0 var(--ink); }
.count span { font-size: 24px; color: #CFC3DD; }
.pz-line { margin: 2px 0 0; font: 400 var(--t-label)/1.4 var(--f-mono); color: #E9DDCB; }
.pz-line b { color: var(--gold); font-weight: 500; }
.pbar { position: relative; height: 18px; border: 3px solid var(--ink); border-radius: 999px; background: var(--track); overflow: hidden; align-self: center; }
.pbar > i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--gold); border-right: 3px solid var(--ink); }
.pbar > b { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 calc(100% / 17 - 2px), rgba(30, 26, 26, .55) calc(100% / 17 - 2px) calc(100% / 17)); }
.prize.done .pbar > i { background: var(--ghost); border-right: 0; }
.pz-rw { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
.rw { display: grid; justify-items: center; align-content: start; text-align: center; gap: 4px; min-width: 0; padding: 7px 4px 6px; border: 2px solid rgba(255, 248, 236, .22); border-radius: 12px; background: rgba(23, 18, 31, .5); }
.rw .pic { flex: none; width: 40px; height: 40px; border: 2px solid var(--ink); border-radius: 10px; overflow: hidden; background: var(--panel-2); display: grid; place-items: center; }
.rw .pic svg { display: block; width: 100%; height: 100%; }
.rw .pic.main { box-shadow: 0 0 0 2px var(--gold); }
.rw b { display: block; font: 400 13px/1.05 var(--f-display); color: #FFF; }
.rw small { display: block; font: 400 var(--t-tag)/1.2 var(--f-mono); color: #CFC3DD; }
.kcs { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.kc { display: inline-flex; gap: 5px; align-items: center; padding: 3px 9px; border: 2px solid rgba(255, 248, 236, .25); border-radius: 999px; background: rgba(23, 18, 31, .55); font: 400 var(--t-label) var(--f-mono); color: #E9DDCB; white-space: nowrap; }
.kc b { color: #FFF; font-weight: 500; }
.make { grid-column: 1 / -1; display: flex; gap: 8px; margin-top: 10px; }
.make .btn { flex: 1 1 auto; }
.btn { min-height: 46px; padding: 0 18px; border-radius: 14px; border: 3px solid var(--ink); background: var(--panel); color: var(--ink); box-shadow: 0 4px 0 var(--ink); font: 400 18px var(--f-display); display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn.gold { background: var(--gold); }
.btn.small { min-height: 36px; padding: 0 12px; font-size: 15px; border-radius: 12px; box-shadow: 0 3px 0 var(--ink); }
.btn svg { width: 20px; height: 20px; }

/* ---- section headings ---- */
.sec { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 0 0 8px; }
.sec h3 { margin: 0; font: 400 var(--t-title)/1 var(--f-display); }
.sec small { font: 400 var(--t-tag)/1.3 var(--f-mono); color: var(--dim); text-align: right; }

/* ---- the wardrobe: one stand per set ---- */
.stands { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.desk .stands { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stc { position: relative; display: grid; padding: 0; border: 3px solid var(--ink); border-radius: 16px; overflow: hidden; background: var(--panel); box-shadow: 0 4px 0 var(--ink); text-align: left; }
.stc .stg { position: relative; display: grid; place-items: end center; height: 196px; background: radial-gradient(ellipse 60% 22% at 50% 93%, rgba(242, 194, 48, .28) 0, rgba(242, 194, 48, 0) 100%), radial-gradient(circle at 50% 42%, rgba(143, 214, 255, .12) 0, rgba(143, 214, 255, 0) 60%), var(--stage); border-bottom: 3px solid var(--ink); }
.desk .stc .stg { height: 236px; }
.stc.gilt .stg { background: radial-gradient(ellipse 60% 22% at 50% 93%, rgba(242, 194, 48, .38) 0, rgba(242, 194, 48, 0) 100%), #3A2C10; }
.stc .stg svg { width: 100%; height: 100%; padding: 8px 4px 2px; }
.stc.done { box-shadow: 0 0 0 3px var(--gold), 0 4px 0 var(--ink); }
.stc .foot { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 0 6px; padding: 7px 9px 4px; }
.stc .foot b { font: 400 17px/1.1 var(--f-display); color: var(--ink); }
.stc .foot .who { grid-column: 1; font: 400 var(--t-tag) var(--f-mono); color: var(--dim); display: inline-flex; align-items: center; gap: 4px; }
.stc .foot .n { grid-row: 1 / span 2; grid-column: 2; font: 400 20px/1 var(--f-display); color: var(--ink); }
.stc .foot .n small { font-size: 13px; color: var(--dim); }
.rdot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--ink); background: #8E8A84; }
.rdot.tank { background: #5B8BD9; } .rdot.healer { background: #6FBF4A; } .rdot.dps { background: #E04A3F; }
.pips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 2px 8px 9px; }
.pip { display: grid; justify-items: center; gap: 2px; }
.pip .t { width: 100%; max-width: 38px; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2.5px solid var(--rc, #8E8A84); outline: 2px solid var(--ink); }
.pip .t svg { display: block; width: 100%; height: 100%; }
.pip.miss .t { border-style: dashed; border-color: #8C8098; outline-color: #8C8098; }
.pip.miss .t svg { filter: grayscale(.9) opacity(.55); }
.pip small { font: 500 var(--t-tag)/1 var(--f-mono); color: var(--dim); }
.pip.got small { color: #2E6B2A; }
.pip small svg { width: 11px; height: 11px; vertical-align: -1px; }
.ribbon { position: absolute; top: 8px; left: 8px; z-index: 2; padding: 2px 8px; border: 2px solid var(--ink); border-radius: 8px; font: 400 13px/1.2 var(--f-display); letter-spacing: .02em; box-shadow: 0 2px 0 var(--ink); }
.ribbon.new { background: var(--gold); color: var(--ink); }
.ribbon.done { background: #3E9B3A; color: #FFF; }
.ribbon.right { left: auto; right: 8px; }

/* the stands' ghosts: a piece you haven't found is its outline, dashed, so you can see what you're after */
.stand-svg:not(.tryon) .ghost .det { display: none; }
.stand-svg:not(.tryon) .ghost .sil path, .stand-svg:not(.tryon) .ghost .sil circle, .stand-svg:not(.tryon) .ghost .sil ellipse { fill: rgba(255, 248, 236, .10) !important; stroke: rgba(255, 248, 236, .66) !important; stroke-width: 3 !important; stroke-dasharray: 7 6; }
@media (prefers-reduced-motion: no-preference) {
  .stand-svg .drop { animation: drop 1.1s cubic-bezier(.2, 1.4, .4, 1) .5s both; }
  .new-bob { animation: bob 1.6s ease-in-out infinite; }
}
@keyframes drop { from { transform: translateY(-70px); opacity: 0; } 60% { opacity: 1; } to { transform: none; opacity: 1; } }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

/* ---- the trophy shelf: the plume, and the bonus three ---- */
.shelf { position: relative; border: 3px solid var(--ink); border-radius: 16px; overflow: hidden; background: #3A3150; box-shadow: 0 4px 0 var(--ink); }
.shelf .wall { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; gap: 4px; padding: 16px 10px 0; min-height: 130px; background: radial-gradient(ellipse 30% 60% at 12% 100%, rgba(255, 224, 138, .22) 0, rgba(255, 224, 138, 0) 100%), linear-gradient(#463C5A 0 2px, transparent 2px) 0 34px / 100% 34px, #3A3150; }
.desk .shelf .wall { min-height: 150px; padding-top: 20px; }
.shelf .it { position: relative; display: grid; justify-items: center; align-items: end; padding: 0; border: 0; background: none; min-width: 0; }
.shelf .it.got::before { content: ''; position: absolute; left: 50%; bottom: -10px; width: 90px; height: 70px; transform: translateX(-50%); background: radial-gradient(ellipse at 50% 100%, rgba(255, 224, 138, .45) 0, rgba(255, 224, 138, 0) 70%); pointer-events: none; }
.shelf .it img, .shelf .it svg { display: block; }
.shelf .it.miss img, .shelf .it.miss svg { filter: grayscale(1) brightness(1.15) opacity(.38); }
.shelf .it .rate { position: absolute; top: -8px; right: -2px; padding: 1px 6px; border: 2px solid var(--ink); border-radius: 999px; background: var(--panel); color: var(--ink); font: 500 var(--t-tag) var(--f-mono); }
.shelf .plank { position: relative; height: 18px; margin: 0 -3px; background: #8A5A34; border-top: 3px solid var(--ink); border-bottom: 3px solid var(--ink); }
.shelf .plank::before { content: ''; position: absolute; left: 12px; right: 12px; top: 3px; height: 3px; background: #A0703F; border-radius: 2px; }
.shelf .tags { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 7px 8px 9px; background: var(--panel); }
.shelf .tag { display: grid; justify-items: center; text-align: center; gap: 1px; min-width: 0; }
.shelf .tag b { font: 400 12px/1.08 var(--f-display); color: var(--ink); }
.shelf .tag small { font: 500 var(--t-tag)/1.2 var(--f-mono); color: var(--dim); }
.shelf .tag.got small { color: #2E6B2A; }
.shelf .tag .bon { display: inline-block; margin-top: 2px; padding: 0 5px; border: 1.5px solid var(--ink); border-radius: 6px; background: #D8FFB8; font: 500 9px/1.4 var(--f-mono); letter-spacing: .06em; color: var(--ink); }

/* ---- a set's own page ---- */
.back { justify-self: start; }
.setstage { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); border: 3px solid var(--ink); border-radius: 18px; overflow: hidden; box-shadow: 0 4px 0 var(--ink); background: var(--stage); }
.setstage .stg { height: 300px; display: grid; place-items: end center; background: radial-gradient(ellipse 50% 18% at 50% 94%, rgba(242, 194, 48, .3) 0, rgba(242, 194, 48, 0) 100%), radial-gradient(circle at 50% 40%, rgba(143, 214, 255, .14) 0, rgba(143, 214, 255, 0) 55%), var(--stage); }
.setstage .stg svg { height: 100%; width: auto; padding: 12px 0 2px; }
.setstage .cap { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 2px 10px; padding: 10px 12px 12px; border-top: 3px solid var(--ink); background: var(--stage-2); color: var(--panel); }
.setstage .cap h3 { margin: 0; font: 400 26px/1 var(--f-display); color: #FFF; }
.setstage .cap p { margin: 0; grid-column: 1; font: 400 var(--t-label)/1.4 var(--f-mono); color: #E9DDCB; }
.setstage .cap .btn { grid-row: 1 / span 2; grid-column: 2; }
.stamp { position: absolute; top: 12px; right: 12px; padding: 3px 10px; border: 2px solid var(--ink); border-radius: 8px; background: #D8FFB8; color: var(--ink); font: 400 14px var(--f-display); transform: rotate(4deg); box-shadow: 0 2px 0 var(--ink); }
.bon2 { display: grid; gap: 8px; padding: 12px; border: 3px solid var(--ink); border-radius: 16px; background: var(--panel-2); }
.bon2 p { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; align-items: start; margin: 0; font: 400 15px/1.35 var(--f-body); color: var(--soft); }
.bon2 p.on { color: var(--ink); }
.bon2 i { width: 28px; height: 28px; display: grid; place-items: center; border: 2.5px solid var(--ink); border-radius: 50%; font: normal 400 14px var(--f-display); background: var(--panel); }
.bon2 p.on i { background: var(--gold); }
.pieces { display: grid; gap: 8px; }
.piece { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 8px 10px 8px 8px; border: 3px solid var(--ink); border-radius: 14px; background: var(--panel); box-shadow: 0 3px 0 var(--ink); text-align: left; color: var(--ink); }
.piece.miss { background: var(--panel-2); border-style: dashed; box-shadow: none; }
.st { position: relative; width: 72px; height: 72px; }
.st .t { position: absolute; inset: 0; border-radius: 12px; overflow: hidden; border: 3.5px solid var(--rc); outline: 2.5px solid var(--ink); box-shadow: 0 0 14px 2px color-mix(in srgb, var(--rc) 60%, transparent); }
.st .t svg { display: block; width: 100%; height: 100%; }
.miss .st .t { box-shadow: none; border-style: dashed; }
.miss .st .t svg { filter: grayscale(.85) opacity(.55); }
.rar { position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); padding: 0 6px; border: 2px solid var(--ink); border-radius: 6px; background: var(--rc); color: #FFF; font: 400 11px/1.35 var(--f-display); letter-spacing: .04em; white-space: nowrap; text-transform: uppercase; text-shadow: 0 1px 0 var(--ink); }
.miss .rar { background: var(--panel); color: var(--rc); text-shadow: none; }
.piece .main b { display: block; font: 400 17px/1.1 var(--f-display); }
.piece .main small { display: block; margin-top: 2px; font: 400 var(--t-tag)/1.35 var(--f-mono); color: var(--dim); }
.piece .main em { display: block; margin-top: 3px; font: italic 400 13px/1.3 var(--f-body); color: var(--soft); }
.piece .side { display: grid; justify-items: end; text-align: right; gap: 1px; }
.piece .side b { font: 400 19px/1 var(--f-display); }
.piece .side small { font: 400 var(--t-tag)/1.3 var(--f-mono); color: var(--dim); white-space: nowrap; }
.piece.got .side b { color: #2E6B2A; }
.seen { display: inline-block; margin-top: 2px; padding: 0 6px; border: 1.5px solid var(--ink); border-radius: 999px; background: var(--panel-2); font: 500 var(--t-tag)/1.5 var(--f-mono); }

/* ---- the chest: a new slot gets its own beat ---- */
.reveal { min-height: 100vh; background: radial-gradient(ellipse at 50% 30%, #5A4420 0%, #22180F 60%, #0E0A08 100%); padding: 18px 14px 28px; display: grid; gap: 14px; align-content: start; }
.rv-head { text-align: center; display: grid; gap: 8px; justify-items: center; }
.rv-head h1 { margin: 0; font: 400 30px/1 var(--f-display); color: #FFF3C4; text-shadow: 0 3px 0 var(--ink); }
.rv-head .chips { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.dim-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; opacity: .35; filter: saturate(.6); }
.dcard { height: 120px; border: 3px solid var(--ink); border-radius: 16px; background: var(--panel); position: relative; overflow: hidden; }
.dcard .t { position: absolute; left: 50%; top: 14px; width: 66px; height: 66px; transform: translateX(-50%); border: 3px solid var(--ink); border-radius: 12px; overflow: hidden; }
.dcard .t svg { width: 100%; height: 100%; display: block; }
.veil { position: fixed; inset: 0; background: rgba(5, 10, 8, .72); }
.moment { position: fixed; left: 10px; right: 10px; bottom: 14px; border: 3px solid var(--ink); border-radius: 22px; overflow: hidden; background: var(--stage-2); color: var(--panel); box-shadow: 0 0 0 4px var(--gold), 0 6px 0 var(--ink); }
.moment .rays { position: absolute; left: 50%; top: 150px; width: 700px; height: 700px; transform: translate(-50%, -50%); background: repeating-conic-gradient(rgba(242, 194, 48, .16) 0 10deg, transparent 10deg 20deg); border-radius: 50%; pointer-events: none; }
@media (prefers-reduced-motion: no-preference) { .moment .rays { animation: spin 22s linear infinite; } }
@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
.moment .in { position: relative; display: grid; justify-items: center; text-align: center; gap: 6px; padding: 14px 14px 16px; }
.moment .stg { width: 210px; height: 236px; }
.moment .stg svg { width: 100%; height: 100%; }
.moment h2 { margin: 0; font: 400 28px/1 var(--f-display); color: var(--gold); text-shadow: 0 3px 0 var(--ink), 2px 0 0 var(--ink), -2px 0 0 var(--ink), 0 -2px 0 var(--ink); }
.moment .meta { margin: 0; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; font: 400 var(--t-label) var(--f-mono); color: #E9DDCB; }
.tagr { padding: 1px 7px; border: 2px solid var(--ink); border-radius: 6px; background: var(--rar-epic); color: #FFF; font: 400 12px/1.3 var(--f-display); letter-spacing: .04em; text-transform: uppercase; }
.setdone { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border: 3px solid var(--ink); border-radius: 999px; background: #3E9B3A; color: #FFF; font: 400 16px var(--f-display); box-shadow: 0 3px 0 var(--ink); }
.setdone svg { width: 16px; height: 16px; }
.logstrip { width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px 10px; padding: 8px 8px 8px 12px; border: 3px solid var(--ink); border-radius: 14px; background: var(--panel); color: var(--ink); text-align: left; box-shadow: 0 3px 0 var(--ink); }
.logstrip .lbl { font: 400 15px/1.1 var(--f-display); }
.logstrip .lbl small { display: block; font: 400 var(--t-tag) var(--f-mono); color: var(--dim); }
.logstrip .num { font: 400 20px var(--f-display); }
.logstrip .num s { color: var(--dim); font-size: 14px; text-decoration: none; margin-right: 2px; }
.logstrip .pbar { grid-column: 1 / span 2; height: 16px; }
.logstrip .pz { grid-row: 1 / span 2; grid-column: 3; width: 46px; height: 46px; border: 3px solid var(--ink); border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 2px var(--gold); }
.logstrip .pz svg { display: block; width: 100%; height: 100%; }
.logstrip .new { grid-column: 1 / -1; font: 400 var(--t-label) var(--f-mono); color: #2E6B2A; }
.logstrip .new b { color: var(--ink); font-weight: 500; }
.acts { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.panel { border: 3px solid var(--ink); border-radius: 18px; background: var(--panel); color: var(--ink); padding: 12px; display: grid; gap: 10px; box-shadow: 0 4px 0 var(--ink); }
.panel h3 { margin: 0; font: 400 var(--t-title) var(--f-display); }
.kvs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.kv { border: 3px solid var(--ink); border-radius: 12px; background: var(--panel-2); padding: 7px 10px; }
.kv span { display: block; font: 400 var(--t-tag) var(--f-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--dim); }
.kv b { font: 400 22px var(--f-display); }

/* ---- direction B: the ledger (no new art) ---- */
.lrow { border: 3px solid var(--ink); border-radius: 16px; background: var(--panel); overflow: hidden; box-shadow: 0 3px 0 var(--ink); }
.lrow header { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-bottom: 2px dashed #D9C9AE; font: 400 16px var(--f-display); }
.lrow header .n { margin-left: auto; font: 500 var(--t-label) var(--f-mono); color: var(--dim); }
.lrow .cells { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 10px 8px 9px; }
.cell { position: relative; display: grid; justify-items: center; gap: 3px; text-align: center; padding: 0; border: 0; background: none; color: var(--ink); }
.cell .st { width: 64px; height: 64px; }
.cell b { margin-top: 6px; font: 400 12px/1.1 var(--f-display); }
.cell small { font: 500 var(--t-tag)/1.2 var(--f-mono); color: var(--dim); }
.cell.got small { color: #2E6B2A; }
.cell.miss .st .t svg { filter: grayscale(.85) opacity(.55); }
.cell.miss .st .t { box-shadow: none; border-style: dashed; }
.cell.new .st .t { outline: 3px solid var(--gold); }

/* desktop: the log beside its list */
.dgrid { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 18px; padding: 16px 20px 24px; }
.rail { display: grid; gap: 8px; align-content: start; }
.rail .dg { display: grid; gap: 6px; padding: 9px 10px; border: 3px solid var(--ink); border-radius: 14px; background: var(--panel); text-align: left; color: var(--ink); box-shadow: 0 3px 0 var(--ink); }
.rail .dg.on { background: var(--stage-2); color: var(--panel); box-shadow: 0 0 0 3px var(--gold), 0 3px 0 var(--ink); }
.rail .dg b { font: 400 16px var(--f-display); display: flex; justify-content: space-between; }
.rail .dg b span { font: 500 var(--t-label) var(--f-mono); }
.rail .dg .pbar { height: 12px; border-width: 2px; }
.rail .dg small { font: 400 var(--t-tag) var(--f-mono); opacity: .8; }
.mainc { display: grid; gap: 18px; }
.desk .prize { grid-template-columns: 150px minmax(0, 1fr) 300px; gap: 6px 18px; padding: 14px 18px; }
.desk .plinth { grid-column: 1; grid-row: 1 / span 4; height: 200px; }
.desk .pz-top { grid-column: 2; grid-row: 1; }
.desk .prize .pbar { grid-column: 2; grid-row: 2; }
.desk .pz-line { grid-column: 2; grid-row: 3; }
.desk .kcs { grid-column: 2; grid-row: 4; margin: 0; align-self: start; }
.desk .pz-rw { grid-column: 3; grid-row: 1 / span 4; grid-template-columns: minmax(0, 1fr); margin: 0; align-content: center; }
.desk .rw { display: flex; text-align: left; padding: 5px 8px 5px 5px; gap: 8px; align-items: center; }
.two { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 18px; align-items: start; }
"""
GL = {
    'close': '<svg viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" style="fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round"/></svg>',
    'lock': '<svg viewBox="0 0 24 24"><path d="M7.5 11 V8 C7.5 4 16.5 4 16.5 8 V11 M5 11 H19 V20.5 H5 Z M12 14.5 V17" style="fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round"/></svg>',
    'check': '<svg viewBox="0 0 24 24"><path d="M5 12 L10 17 L19 7" style="fill:none;stroke:currentColor;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round"/></svg>',
    'left': '<svg viewBox="0 0 24 24"><path d="M15 5 L8 12 L15 19" style="fill:none;stroke:currentColor;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round"/></svg>',
    'eye': '<svg viewBox="0 0 24 24"><path d="M2.5 12 C6 6 18 6 21.5 12 C18 18 6 18 2.5 12 Z M12 9.5 A2.5 2.5 0 1 0 12.01 9.5" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg>',
    'plus': '<svg viewBox="0 0 24 24"><path d="M12 5 V19 M5 12 H19" style="fill:none;stroke:currentColor;stroke-width:3.2;stroke-linecap:round"/></svg>',
    'home': '<svg viewBox="0 0 24 24"><path d="M3 11 L12 4 L21 11 M6 9 V20 H18 V9" style="fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round"/></svg>',
}
SWATCH_BARROW = ('<svg viewBox="0 0 90 60" aria-hidden="true"><rect width="90" height="60" style="fill: #5C5070"/>'
                 '<path d="M0 12 H90 M0 26 H90 M20 0 V12 M60 0 V12 M40 12 V26 M80 12 V26" style="fill: none; stroke: #463C5A; stroke-width: 2"/>'
                 '<circle cx="45" cy="30" r="34" style="fill: {light}; opacity: 0.3"/><path d="M0 34 H90 V50 H0 Z" style="fill: #4A4060; stroke: #1E1A1A; stroke-width: 2.5"/>'
                 '<path d="M0 34 H90" style="fill: none; stroke: {trim}; stroke-width: 2"/>'
                 + ''.join(f'<path d="M{x - 8} 49 V41 A8 8 0 0 1 {x + 8} 41 V49 Z" style="fill: #2A2234; stroke: #1E1A1A; stroke-width: 2"/>' for x in (15, 45, 75))
                 + '<circle cx="45" cy="44" r="4.5" style="fill: {bone}; stroke: #1E1A1A; stroke-width: 1.5"/><circle cx="15" cy="44" r="4.5" style="fill: {bone}; stroke: #1E1A1A; stroke-width: 1.5"/>'
                 '<path d="M0 50 H90 V60 H0 Z" style="fill: #4A4060; stroke: #1E1A1A; stroke-width: 2.5"/></svg>')
TITLE_PIC = '<svg viewBox="0 0 24 24" style="background:#6A4BA3;padding:5px;color:#FFF"><path d="M4 20 L5 15 L16 4 L20 8 L9 19 Z M13 7 L17 11" style="fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"/></svg>'


def page(title, body, desk=False):
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{title}</title>{FONTS}<style>{CSS}</style></head><body>{body}</body></html>')


def head_tabs(desk=False):
    return (f'<header class="sh-head"><h2>Logs</h2><button class="x" aria-label="Close">{GL["close"]}</button></header>'
            '<nav class="tabs"><button class="tab on">Collection log</button><button class="tab">Achievements</button><button class="tab">Stats</button></nav>')


def switcher(heroic=False, desk=False):
    if desk:
        return ''
    return (f'<div class="switch"><button class="chipbtn{"" if heroic else " on"}">Barrow</button><button class="chipbtn">Garden</button>'
            '<button class="chipbtn">Other</button>'
            f'<button class="chipbtn hero{" on" if heroic else ""}"><span class="gem"><i></i></span>Heroic</button></div>')


def prize(state, desk=False):
    st = STATES[state]
    heroic = state == 'heroic'
    need = 17
    sfx = '.gilded' if heroic else ''
    have = sum(1 for s in SETS for _, pid, *_ in s['pieces'] if pid + sfx in st) + (1 if 'trophy.rattlebones_plume' + sfx in st else 0)
    done = have >= need
    pct = have / need * 100
    risen = 'risen_tank_gilded_f' if heroic else 'risen_tank_f'
    cls = 'prize' + (' done' if done else '') + (' gilt' if heroic else '')
    if heroic:
        rws = [('c_gilded_bones', 'Gilded Bones', 'Risen in gold', True), ('swatch-g', 'Gilded Barrow Hall', 'House look', False), ('title', 'the Undying', 'Title', False)]
    else:
        rws = [('c_risen', 'The Risen', 'New race', True), ('swatch', 'Barrow Hall', 'House look', False), ('title', 'the Gravewarden', 'Title', False)]

    def pic(k):
        if k == 'swatch':
            return SWATCH_BARROW.format(light='#9BE15D', trim='#D8CDB0', bone='#F0E8D2')
        if k == 'swatch-g':
            return SWATCH_BARROW.format(light='#F2C230', trim='#F2C230', bone='#F2C230')
        if k == 'title':
            return TITLE_PIC
        return tile(k)
    rw = ''.join(f'<div class="rw"><span class="pic{" main" if m else ""}">{pic(k)}</span><span><b>{n}</b><small>{w}</small></span></div>' for k, n, w, m in rws)
    lock = '' if done else f'<span class="lock">{GL["lock"]}{need - have} to go</span>'
    kc = ([('Sir Rattlebones', 'KC 7'), ('The Gravekeeper', 'KC 6')] if heroic else
          [('Sir Rattlebones', 'KC 220'), ('The Gravekeeper', 'KC 214'), ('Best', '2:11')] if done else
          [('Sir Rattlebones', 'KC 43'), ('The Gravekeeper', 'KC 41'), ('Best', '3:31')])
    kcs = ''.join(f'<span class="kc">{a} <b>{b}</b></span>' for a, b in kc)
    word = 'Heroic Barrow log' if heroic else 'Barrow Crypt log'
    line = (f'Log complete on <b>14 Mar</b>. Every last bone.' if done else
            f'<b>{need - have} to go</b> for {"Gilded Bones" if heroic else "the Risen"}. The pet, mount and dye are a bonus.')
    make = (f'<div class="make"><button class="btn gold small">{GL["plus"]}Make a Risen</button><button class="btn small">Put up the look</button></div>' if done else '')
    return (f'<section class="{cls}"><div class="plinth"><span class="base"></span><img class="{"lit" if done else ""}" src="{uri(risen)}" alt="The Risen">{lock}</div>'
            f'<div class="pz-top"><p class="eyebrow">{word}</p><p class="count">{have}<span> / {need}</span></p></div>'
            f'<div class="pbar" role="progressbar" aria-valuenow="{have}" aria-valuemax="{need}"><i style="width:{pct:.1f}%"></i><b></b></div>'
            f'<p class="pz-line">{line}</p><div class="pz-rw">{rw}</div><div class="kcs">{kcs}</div>{make}</section>')


def stand_card(state, s, desk=False):
    st = STATES[state]
    heroic = state == 'heroic'
    sfx = '.gilded' if heroic else ''
    have = [slot for slot, pid, *_ in s['pieces'] if (pid + sfx) in st]
    new = next((slot for slot, pid, *_ in s['pieces'] if (pid + sfx) in st and len(st[pid + sfx]) > 3), None)
    n = len(have)
    pips = ''
    for slot, pid, name, ic, _ in s['pieces']:
        o = st.get(pid + sfx)
        rc = '#E7B53C' if slot == 'weapon' else '#8A63D2'
        rate = '1/50' if slot == 'weapon' else '1/35'
        icn = tile(ic + ('_gilded' if heroic else ''))
        pips += (f'<span class="pip {"got" if o else "miss"}" style="--rc:{rc}"><span class="t">{icn}</span>'
                 f'<small>{GL["check"] if o else rate}</small></span>')
    rib = '<span class="ribbon new new-bob">New</span>' if new else ('<span class="ribbon done">Set done</span>' if n == 4 else '')
    return (f'<button class="stc{" done" if n == 4 else ""}{" gilt" if heroic else ""}">{rib}<span class="stg">{stand(s["id"], have, heroic)}</span>'
            f'<span class="foot"><b>{s["name"]}</b><span class="who"><i class="rdot {s["role"]}"></i>{s["who"]}</span><span class="n">{n}<small>/4</small></span></span>'
            f'<span class="pips">{pips}</span></button>')


def shelf(state, desk=False):
    st = STATES[state]
    sizes = {'tr_plume': 66, 'c_dye': 64, 'mount_hound': 80, 'pet_keeper': 78}
    if desk:
        sizes = {k: v * 1.15 for k, v in sizes.items()}
    items, tags = '', ''
    for pid, name, (kind, art), rate, bonus, boss in SHELF:
        o = st.get(pid)
        h = sizes[art]
        if kind == 'spr':
            pic = f'<img src="{uri(art)}" alt="" style="height:{h:.0f}px">'
        else:
            pic = tile_bare(art).replace('<svg ', f'<svg style="width:{h:.0f}px;height:{h:.0f}px;margin-bottom:-6px" ', 1)
        items += f'<button class="it {"got" if o else "miss"}">{pic}{"" if o else f"<span class=rate>{rate}</span>"}</button>'
        sub = (f'KC {o[0]}' + (f' · {o[1]}×' if o[1] > 1 else '')) if o else rate
        tags += f'<span class="tag {"got" if o else ""}"><b>{name}</b><small>{sub}</small>{"<span class=bon>BONUS</span>" if bonus else ""}</span>'
    return (f'<section><header class="sec"><h3>Trophy shelf</h3><small>The plume counts.<br>The other three are a bonus.</small></header>'
            f'<div class="shelf"><div class="wall">{items}</div><div class="plank"></div><div class="tags">{tags}</div></div></section>')


def log_page(state, desk=False):
    heroic = state == 'heroic'
    stands = ''.join(stand_card(state, s, desk) for s in SETS)
    ward = (f'<section><header class="sec"><h3>The wardrobe</h3><small>Each set: 3 pieces at 1/35<br>and a boss weapon at 1/50</small></header>'
            f'<div class="stands">{stands}</div></section>')
    if desk:
        rail = ('<nav class="rail">'
                '<button class="dg on"><b>Barrow Crypt <span>6/17</span></b><span class="pbar"><i style="width:35%"></i><b></b></span><small>Prize: the Risen</small></button>'
                '<button class="dg"><b>Heroic Barrow <span>0/17</span></b><span class="pbar"><i style="width:0"></i><b></b></span><small>Opens after 10 clears</small></button>'
                '<button class="dg"><b>The garden <span>0/9</span></b><span class="pbar"><i style="width:0"></i><b></b></span><small>Harvest rares</small></button>'
                '<button class="dg"><b>Other rewards <span>3/12</span></b><span class="pbar"><i style="width:25%"></i><b></b></span><small>From achievements</small></button>'
                '</nav>')
        body = (f'<div class="scene desk"><section class="sheet">{head_tabs(True)}<div class="dgrid">{rail}'
                f'<div class="mainc">{prize(state, True)}{ward}{shelf(state, True)}</div></div></section></div>')
        return page('Barrow log (desktop)', body, True)
    body = (f'<div class="scene"><section class="sheet">{head_tabs()}<div class="body">{switcher(heroic)}{prize(state)}{ward}'
            f'{"" if heroic else shelf(state)}</div></section></div>')
    return page('Barrow log', body)


def set_page(set_id='barrowguard', state='mid', tryon=False):
    s = next(x for x in SETS if x['id'] == set_id)
    st = STATES[state]
    have = [slot for slot, pid, *_ in s['pieces'] if pid in st]
    rows = ''
    slotword = {'helm': 'Helm', 'shoulders': 'Shoulders', 'chest': 'Chest', 'weapon': 'Weapon'}
    for slot, pid, name, ic, eff in s['pieces']:
        o = st.get(pid)
        uniq = slot == 'weapon'
        rc = '#E7B53C' if uniq else '#8A63D2'
        rate = '1/50' if uniq else '1/35'
        side = (f'<b>KC {o[0]}</b><small>{o[2]}</small>' + (f'<span class="seen">Seen {o[1]}×</span>' if o[1] > 1 else '')) if o else f'<b>{rate}</b><small>not yet</small>'
        rows += (f'<button class="piece {"got" if o else "miss"}" style="--rc:{rc}"><span class="st"><span class="t">{tile(ic)}</span><span class="rar">{"Unique" if uniq else "Epic"}</span></span>'
                 f'<span class="main"><b>{name}</b><small>{slotword[slot]} · The Gravekeeper · {rate}</small>{f"<em>{eff}</em>" if eff else ""}</span>'
                 f'<span class="side">{side}</span></button>')
    n = len(have)
    sets_have = len([x for x in have if x != 'weapon'])
    bon = (f'<div class="bon2"><p class="{"on" if sets_have >= 2 else ""}"><i>2</i><span><b>2 pieces:</b> {s["b2"]}</span></p>'
           f'<p class="{"on" if sets_have >= 3 else ""}"><i>3</i><span><b>3 pieces:</b> {s["b3"]}</span></p></div>')
    stamp = '<span class="stamp">Preview</span>' if tryon else ''
    body = (f'<div class="scene"><section class="sheet">{head_tabs()}<div class="body">'
            f'<button class="btn small back">{GL["left"]}Barrow log</button>'
            f'<section class="setstage">{stamp}<div class="stg">{stand(set_id, have, tryon=tryon)}</div>'
            f'<div class="cap"><h3>{s["name"]}</h3><p><i class="rdot {s["role"]}"></i> {s["who"]} set · {n} of 4 found</p>'
            f'<button class="btn small" aria-pressed="{str(tryon).lower()}">{GL["eye"]}{"Back to mine" if tryon else "Try it on"}</button></div></section>'
            f'{bon}<section><header class="sec"><h3>The pieces</h3><small>Tap one to hold it up<br>against what you wear</small></header><div class="pieces">{rows}</div></section>'
            f'</div></section></div>')
    return page(f'{s["name"]} set', body)


def reveal_moment():
    """the chest, the moment a new piece fills a slot: Barrowguard Pauldrons finish the set"""
    cards = ''.join(f'<div class="dcard"><span class="t">{tile(t)}</span></div>' for t in ('i_helm_2', 'i_robe_1', 's_barrowguard_shoulders', 'c_plume'))
    risen = tile('c_risen')
    body = (f'<div class="reveal"><div class="rv-head"><p class="eyebrow">Barrow Crypt · clear 42</p><h1>The Gravekeeper is buried</h1>'
            f'<div class="chips"><span class="kc">4:07</span><span class="kc">The Gravekeeper <b>KC 42</b></span></div></div>'
            f'<div class="dim-cards">{cards}</div><div class="veil"></div>'
            f'<section class="moment"><span class="rays"></span><div class="in"><p class="eyebrow">New in your collection log</p>'
            f'<div class="stg">{stand("barrowguard", ("helm", "shoulders", "chest", "weapon"), new="shoulders")}</div>'
            f'<h2>Barrowguard Pauldrons</h2><p class="meta"><span class="tagr">Epic</span> 1/35 · got at KC 42</p>'
            f'<span class="setdone">{GL["check"]}Barrowguard set done · 4 of 4</span>'
            f'<div class="logstrip"><span class="lbl">Barrow Crypt log<small>10 to go for the Risen</small></span><span class="num"><s>6 →</s> 7 / 17</span>'
            f'<span class="pbar"><i style="width:{7 / 17 * 100:.1f}%"></i><b></b></span><span class="pz">{risen}</span></div>'
            f'<div class="acts"><button class="btn gold">See it in the log</button><button class="btn">Carry on</button></div></div></section></div>')
    return page('A new log slot', body)


def reveal_summary():
    risen = tile('c_risen')
    body = (f'<div class="reveal"><section class="panel"><h3>This run</h3><div class="kvs">'
            '<div class="kv"><span>Time</span><b>4:07</b></div><div class="kv"><span>The Gravekeeper</span><b>KC 42</b></div>'
            '<div class="kv"><span>Sir Rattlebones</span><b>KC 44</b></div><div class="kv"><span>Party deaths</span><b>0</b></div></div>'
            f'<button class="logstrip"><span class="lbl">Collection log<small>Tap to see your Barrowguard</small></span><span class="num"><s>6 →</s> 7 / 17</span>'
            f'<span class="pbar"><i style="width:{7 / 17 * 100:.1f}%"></i><b></b></span><span class="pz">{risen}</span>'
            '<span class="new">+1 new: <b>Barrowguard Pauldrons</b> · set done</span></button></section>'
            '<div class="acts"><button class="btn gold">Run it again</button><button class="btn">Back to the hearth</button></div></div>')
    return page('Chest summary', body)


def ledger(state='mid'):
    """direction B: no new art. The OSRS log made loud: big tiles in rows by role, rarity and rates on all."""
    st = STATES[state]
    rows = ''
    short = {'helm': None}
    for s in SETS:
        cells = ''
        n = 0
        for slot, pid, name, ic, _ in s['pieces']:
            o = st.get(pid)
            n += 1 if o else 0
            uniq = slot == 'weapon'
            rc = '#E7B53C' if uniq else '#8A63D2'
            rate = '1/50' if uniq else '1/35'
            nm = name.replace(s['name'] + ' ', '') if not uniq else name
            sub = (f'KC {o[0]}' + (f' · {o[1]}×' if o[1] > 1 else '')) if o else rate
            isnew = o and len(o) > 3
            cells += (f'<button class="cell {"got" if o else "miss"}{" new" if isnew else ""}" style="--rc:{rc}"><span class="st"><span class="t">{tile(ic)}</span><span class="rar">{"Unique" if uniq else "Epic"}</span></span>'
                      f'<b>{nm}</b><small>{sub}</small></button>')
        rows += f'<section class="lrow"><header><i class="rdot {s["role"]}"></i>{s["who"]} · {s["name"]}<span class="n">{n}/4</span></header><div class="cells">{cells}</div></section>'
    sh = ''
    for pid, name, (kind, art), rate, bonus, boss in SHELF:
        o = st.get(pid)
        ic = {'tr_plume': 'c_plume', 'c_dye': 'c_dye', 'mount_hound': 'c_mount_hound', 'pet_keeper': 'c_pet_keeper'}[art]
        rc = '#C9A27A' if not bonus else '#9BE15D'
        nm = name
        sub = f'KC {o[0]}' if o else rate
        sh += (f'<button class="cell {"got" if o else "miss"}" style="--rc:{rc}"><span class="st"><span class="t">{tile(ic)}</span><span class="rar">{"Bonus" if bonus else "Trophy"}</span></span>'
               f'<b>{nm}</b><small>{sub}</small></button>')
    rows += f'<section class="lrow"><header>Anyone · trophies<span class="n">plume counts, 3 bonus</span></header><div class="cells">{sh}</div></section>'
    body = (f'<div class="scene"><section class="sheet">{head_tabs()}<div class="body">{switcher()}{prize(state)}'
            f'<section><header class="sec"><h3>Every drop</h3><small>Rows by who can get it</small></header><div style="display:grid;gap:10px">{rows}</div></section>'
            f'</div></section></div>')
    return page('Barrow log (ledger)', body)


FILES = {
    'a-log-phone.html': log_page('mid'),
    'a-log-phone-done.html': log_page('full'),
    'a-log-phone-heroic.html': log_page('heroic'),
    'a-log-desktop.html': log_page('mid', desk=True),
    'a-set-phone.html': set_page('barrowguard', 'mid'),
    'a-set-phone-tryon.html': set_page('barrowguard', 'mid', tryon=True),
    'a-reveal-moment-phone.html': reveal_moment(),
    'a-reveal-summary-phone.html': reveal_summary(),
    'b-ledger-phone.html': ledger('mid'),
}
for name, html in FILES.items():
    open(os.path.join(OUT, name), 'w').write(html)
print('wrote', len(FILES), 'mockups;', {k: len(v) // 1024 for k, v in FILES.items()})
