import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
import sys, json
B = HF_ROOT + '/'
exec(open(B + 'tools/dgtest.py').read().split("mode = sys.argv[1]")[0])
res = {}
with sync_playwright() as p:
    for role in ['tank', 'healer', 'dps']:
        b, pg, errs = open_page(p, 1440, 900, 'keys_' + role)
        pg.click(f'.role[data-role="{role}"]'); pg.click('#go'); pg.wait_for_timeout(600)
        r = {}
        y0 = pg.evaluate('__crypt.peek((S) => S.player.y)')
        pg.keyboard.down('KeyW'); pg.wait_for_timeout(700); pg.keyboard.up('KeyW')
        r['w_moved'] = round(y0 - pg.evaluate('__crypt.peek((S) => S.player.y)'))
        pg.keyboard.press('Space'); pg.wait_for_timeout(50)
        r['space_dodge'] = pg.evaluate('__crypt.peek((S) => S.player.cd.dodge > 0)')
        pg.wait_for_timeout(400)
        if role == 'tank':
            pg.keyboard.down('Digit2'); pg.wait_for_timeout(200)
            r['hold2_block'] = pg.evaluate('__crypt.peek((S) => S.player.blocking)')
            pg.keyboard.up('Digit2'); pg.wait_for_timeout(100)
            r['release2'] = not pg.evaluate('__crypt.peek((S) => S.player.blocking)')
        if role == 'healer':
            pg.evaluate('__crypt.peek((S, u) => { u.heroBy("tank").hp = 400; return 1; })')
            pg.keyboard.press('KeyZ'); pg.wait_for_timeout(100)
            r['z_heal'] = pg.evaluate('__crypt.peek((S, u) => u.heroBy("tank").hp)')
            pg.mouse.move(720, 300); pg.wait_for_timeout(50)
            pg.keyboard.press('Digit1'); pg.wait_for_timeout(100)
            r['circle_at_mouse'] = pg.evaluate('__crypt.peek((S) => S.zones.filter(z => z.kind === "heal").map(z => [Math.round(z.x), Math.round(z.y), Math.round(S.player.x), Math.round(S.player.y)]))')
        if role == 'dps':
            pg.mouse.move(720, 250); pg.wait_for_timeout(50)
            pg.keyboard.press('Digit1'); pg.wait_for_timeout(100)
            r['blizzard_at_mouse'] = pg.evaluate('__crypt.peek((S) => S.zones.filter(z => z.kind === "blizzard").map(z => [Math.round(z.x), Math.round(z.y), Math.round(S.player.x), Math.round(S.player.y)]))')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        r['esc_pause'] = pg.evaluate("!document.getElementById('ov-msg').hidden")
        r['errors'] = errs[:4]
        res[role] = r
        b.close()
    b, pg, errs = open_page(p, 844, 390, 'land', touch=True)
    pg.click('.role[data-role="dps"]'); pg.click('#go'); pg.wait_for_timeout(1500)
    pg.screenshot(path=B + 'shots/dg/land_play.png')
    b.close()
    b, pg, errs = open_page(p, 1440, 900, 'startdesk')
    pg.screenshot(path=B + 'shots/dg/start_desk2.png')
    b.close()
print(json.dumps(res, indent=1))
