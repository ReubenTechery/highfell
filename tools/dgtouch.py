import os as _hf_os
HF_ROOT = _hf_os.environ.get('HIGHFELL_ROOT') or _hf_os.path.dirname(_hf_os.path.dirname(_hf_os.path.abspath(__file__)))
# Checks the touch controls on a phone-sized page with synthetic pointer events.
import sys, json
B = HF_ROOT + '/'
exec(open(B + 'tools/dgtest.py').read().split("mode = sys.argv[1]")[0])
PTR = """(a) => {
  const [type, x, y, id, sel] = a;
  const el = sel ? document.querySelector(sel) : document.elementFromPoint(x, y);
  el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
  return el.id || el.className;
}"""
def ptr(pg, type, x, y, pid=7, sel=None):
    return pg.evaluate('(' + PTR + ')', [type, x, y, pid, sel])
def center(pg, sel):
    return pg.evaluate("(s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }", sel)
res = {}
with sync_playwright() as p:
    for role in ['tank', 'healer', 'dps']:
        b, pg, errs = open_page(p, 390, 844, 'touch_' + role, touch=True)
        pg.click(f'.role[data-role="{role}"]')
        pg.click('#go'); pg.wait_for_timeout(800)
        r = {}
        y0 = pg.evaluate('__crypt.peek((S) => S.player.y)')
        ptr(pg, 'pointerdown', 90, 700, 3); pg.wait_for_timeout(50)
        for k in range(1, 8): ptr(pg, 'pointermove', 90, 700 - k * 9, 3, '#touch'); pg.wait_for_timeout(20)
        pg.wait_for_timeout(900)
        stick_vis = pg.evaluate("!document.getElementById('stick').hidden")
        ptr(pg, 'pointerup', 90, 637, 3, '#touch'); pg.wait_for_timeout(100)
        y1 = pg.evaluate('__crypt.peek((S) => S.player.y)')
        r['stick_moved_up'] = round(y0 - y1); r['stick_visible'] = stick_vis
        ptr(pg, 'pointerdown', 260, 420, 4); pg.wait_for_timeout(40)
        ptr(pg, 'pointermove', 300, 420, 4, '#touch'); pg.wait_for_timeout(30)
        ptr(pg, 'pointermove', 340, 418, 4, '#touch'); pg.wait_for_timeout(20)
        ptr(pg, 'pointerup', 340, 418, 4, '#touch'); pg.wait_for_timeout(60)
        r['swipe_dodged'] = pg.evaluate('__crypt.peek((S) => S.player.cd.dodge > 0)')
        if role == 'tank':
            x, y = center(pg, '.ab[data-slot="a2"]')
            ptr(pg, 'pointerdown', x, y, 5); pg.wait_for_timeout(250)
            r['shield_held'] = pg.evaluate('__crypt.peek((S) => S.player.blocking)')
            ptr(pg, 'pointerup', x, y, 5, '.ab[data-slot="a2"]'); pg.wait_for_timeout(100)
            r['shield_released'] = not pg.evaluate('__crypt.peek((S) => S.player.blocking)')
            x, y = center(pg, '.ab[data-slot="a1"]')
            ptr(pg, 'pointerdown', x, y, 6); pg.wait_for_timeout(100)
            r['taunt_cd'] = pg.evaluate('__crypt.peek((S) => +S.player.cd.a1.toFixed(1))')
        if role == 'healer':
            pg.evaluate('__crypt.peek((S, u) => { const t = u.heroBy("tank"); t.hp = 500; return 1; })')
            pg.wait_for_timeout(100)
            x, y = center(pg, '.pd[data-role="tank"]')
            ptr(pg, 'pointerdown', x, y, 8); pg.wait_for_timeout(120)
            r['pad_heal'] = pg.evaluate('__crypt.peek((S, u) => [u.heroBy("tank").hp, Math.round(S.player.mana)])')
            pg.wait_for_timeout(600)
            x, y = center(pg, '.fr[data-role="tank"]')
            ptr(pg, 'pointerdown', x, y, 9); pg.wait_for_timeout(120)
            r['frame_heal'] = pg.evaluate('__crypt.peek((S, u) => [u.heroBy("tank").hp, Math.round(S.player.mana)])')
            x, y = center(pg, '.ab[data-slot="a1"]')
            ptr(pg, 'pointerdown', x, y, 10); pg.wait_for_timeout(60)
            for k in range(1, 6): ptr(pg, 'pointermove', x - k * 4, y - k * 14, 10, '.ab[data-slot="a1"]'); pg.wait_for_timeout(20)
            pg.screenshot(path=B + 'shots/dg/touch_aim.png')
            ptr(pg, 'pointerup', x - 20, y - 70, 10, '.ab[data-slot="a1"]'); pg.wait_for_timeout(100)
            r['circle_zone'] = pg.evaluate('__crypt.peek((S) => S.zones.map(z => [z.kind, Math.round(z.x - S.player.x), Math.round(z.y - S.player.y)]))')
        if role == 'dps':
            x, y = center(pg, '.ab[data-slot="a1"]')
            ptr(pg, 'pointerdown', x, y, 11); pg.wait_for_timeout(60)
            for k in range(1, 6): ptr(pg, 'pointermove', x, y - k * 16, 11, '.ab[data-slot="a1"]'); pg.wait_for_timeout(20)
            ptr(pg, 'pointerup', x, y - 80, 11, '.ab[data-slot="a1"]'); pg.wait_for_timeout(100)
            r['blizzard_zone'] = pg.evaluate('__crypt.peek((S) => S.zones.map(z => [z.kind, Math.round(z.x - S.player.x), Math.round(z.y - S.player.y)]))')
        r['errors'] = errs[:4]
        res[role] = r
        b.close()
print(json.dumps(res, indent=1))
