import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Captures the Barrow Crypt's message and loot screens. Usage: dgscreens.py W H prefix [which]
import sys, json, time
sys.argv += []
B = HF_ROOT + '/'
src = open(B + 'tools/dgtest.py').read().split("mode = sys.argv[1]")[0]
exec(src)
W, H, prefix = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
which = sys.argv[4] if len(sys.argv) > 4 else 'all'
out = {}
with sync_playwright() as p:
    if which in ('all', 'wipe'):
        b, pg, errs = open_page(p, W, H, 'scr_wipe', touch=W < 800)
        pg.click('#go'); pg.wait_for_timeout(2500)
        pg.screenshot(path=prefix + '_run.png')
        pg.evaluate('__crypt.wipeNow()'); pg.wait_for_timeout(2600)
        pg.screenshot(path=prefix + '_wipe.png')
        pg.click('#msg-actions .primary'); pg.wait_for_timeout(1500)
        pg.screenshot(path=prefix + '_back.png')
        out['wipe'] = errs[:5]; b.close()
    if which in ('all', 'solo'):
        b, pg, errs = open_page(p, W, H, 'scr_solo', touch=W < 800)
        pg.click('#solo'); pg.wait_for_timeout(1500)
        pg.evaluate('__crypt.wipeNow()'); pg.wait_for_timeout(2600)
        pg.screenshot(path=prefix + '_solo.png')
        out['solo'] = errs[:5]; b.close()
    if which in ('all', 'loot'):
        b, pg, errs = open_page(p, W, H, 'scr_loot', touch=W < 800)
        pg.evaluate('__crypt.start({ role: "tank", auto: true, manual: true, seed: 3, start: "keeper", tier: 3 })')
        for i in range(400):
            st = pg.evaluate('__crypt.step(300)')
            if st['over'] == 'victory': break
            if st['over'] == 'wipe': pg.evaluate('__crypt.respawn()')
        pg.evaluate('__crypt.live()')
        pg.wait_for_timeout(1200)
        pg.screenshot(path=prefix + '_loot.png', full_page=False)
        pg.click('#roll-btn'); pg.wait_for_timeout(2600)
        pg.screenshot(path=prefix + '_rolled.png')
        pg.evaluate('document.querySelector("#ov-loot").scrollTop = 99999'); pg.wait_for_timeout(300)
        pg.screenshot(path=prefix + '_rolled2.png')
        out['loot'] = errs[:5]; out['state'] = st; b.close()
print(json.dumps(out))
