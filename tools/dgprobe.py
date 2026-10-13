import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Detailed boss-fight probe: autopilot from the boss, logs every 4s what each hero is doing.
import sys, json
sys.argv += []
from playwright.sync_api import sync_playwright
sys.path.insert(0, HF_ROOT + '/tools')
import importlib.util
spec = importlib.util.spec_from_file_location('dgt', HF_ROOT + '/tools/dgtest.py')
role, seed, start = sys.argv[1], int(sys.argv[2]), sys.argv[3]
PROBE = """(S, u) => { const dist = u.dist;
  const b = S.boss || S.mobs.find(m => m.isBoss && m.alive);
  const o = { t: +S.t.toFixed(1), over: S.over, boss: b ? { hp: Math.round(b.hp/b.maxHp*100), ph: b.phase, act: b.act ? b.act.k : '', hid: b.hidden, x: Math.round(b.x), y: Math.round(b.y), st: b.st.stun.toFixed(1), state: b.state } : null, hz: S.hazards.length, wisps: S.mobs.filter(m=>m.alive&&m.M.wisp).length, chains: S.chains.length, ring: S.ring ? Math.round(S.ring.r) : 0 };
  o.h = S.heroes.map(h => ({ r: h.role[0], hp: Math.round(h.hp), al: h.alive, x: Math.round(h.x), y: Math.round(h.y), tg: h.target ? (h.target.isBoss ? 'B' : h.target.type) : '-', pk: h.picked ? (h.picked.isBoss ? 'B' : h.picked.type) : '-', hf: !!h.holdFire, mv: h.moving > 0, st: +h.stillT.toFixed(1), cast: h.cast ? h.cast.key : '', d: b ? Math.round(dist(h, b)) : 0, dmg: Math.round(h.stats.dmg), mana: Math.round(h.mana) }));
  return o;
}"""
with sync_playwright() as p:
    exec(open(HF_ROOT + '/tools/dgtest.py').read().split("mode = sys.argv[1]")[0])
    b, pg, errs = open_page(p, 800, 600, 'probe')
    pg.evaluate(f'__crypt.start({{ role: "{role}", auto: true, manual: true, seed: {seed}, start: "{start}" }})')
    for i in range(int(sys.argv[4]) if len(sys.argv) > 4 else 110):
        st = pg.evaluate('__crypt.step(240)')
        o = pg.evaluate('__crypt.peek(' + PROBE + ')')
        hs = ' | '.join(f"{h['r']}:{h['hp']}{'' if h['al'] else 'X'} tg={h['tg']} pk={h['pk']}{' HF' if h['hf'] else ''}{' mv' if h['mv'] else ''} st={h['st']} d={h['d']} dmg={h['dmg']}{' c=' + h['cast'] if h['cast'] else ''}" for h in o['h'])
        if o['boss'] or i % 10 == 0: print(f"t={o['t']} boss={o['boss']} hz={o['hz']} w={o['wisps']} ch={o['chains']} ring={o['ring']} || {hs}")
        if st['over'] in ('victory', 'lost') or st['over'] == 'wipe':
            print('END', st['over']); break
    print(errs[:5])
    b.close()
