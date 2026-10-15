# How heavy the house is: opens the built game in headless Chromium (Chrome's engine, as on Android) at phone
# size with the CPU slowed down, and measures the hearth standing still, being dragged, zoomed with the wheel,
# flown out to the whole house and back, and saved. Numbers come from Chrome's own trace.
# Usage: python3 tools/pw_perf.py [--w 390] [--h 844] [--dpr 3] [--cpu 4] [--look barrow] [--page dist/highfell.html]
#   main thread: how busy the page's main thread was (near 100% and everything feels slow)
#   repaints: how often the page redrew its picture, per second (standing still it should be 0)
#   raster: time spent turning the picture into pixels, per second
#   fps: frames the page managed, per second (60 is smooth)
import argparse, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pw_check import ROOT, wrap

CATS = 'toplevel,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,cc,viz'
LOOK_ROOMS = ['loft', 'bunks', 'armory', 'hall', 'stable', 'brewery', 'cellar']


def measure(pg, client, act, ms):
    """run act() and ms more, tracing, then sum up the main thread, repaints, raster and frames per second"""
    ev, done = [], []
    on_data = lambda e: ev.extend(e['value'])
    on_done = lambda e: done.append(1)
    client.on('Tracing.dataCollected', on_data)
    client.on('Tracing.tracingComplete', on_done)
    client.send('Tracing.start', {'categories': CATS, 'transferMode': 'ReportEvents'})
    pg.evaluate("() => { window.__fps = 0; window.__fpsOn = true; const f = () => { if (!window.__fpsOn) return; window.__fps++; requestAnimationFrame(f); }; requestAnimationFrame(f); }")
    t0 = time.perf_counter()
    act()
    pg.wait_for_timeout(ms)
    ms = (time.perf_counter() - t0) * 1000
    fps = pg.evaluate("() => { window.__fpsOn = false; return window.__fps; }")
    client.send('Tracing.end')
    while not done:
        pg.wait_for_timeout(50)
    client.remove_listener('Tracing.dataCollected', on_data)
    client.remove_listener('Tracing.tracingComplete', on_done)
    names = {(e['pid'], e['tid']): e['args']['name'] for e in ev if e.get('ph') == 'M' and e.get('name') == 'thread_name'}
    main = {k for k, v in names.items() if v == 'CrRendererMain'}
    busy = sum(e['dur'] for e in ev if e.get('ph') == 'X' and (e['pid'], e['tid']) in main and e['name'] == 'ThreadControllerImpl::RunTask') / 1000
    raster = sum(e['dur'] for e in ev if e.get('ph') == 'X' and e['name'] == 'RasterTask') / 1000
    paints = sum(1 for e in ev if e.get('ph') == 'X' and (e['pid'], e['tid']) in main and e['name'] == 'Paint')
    s = ms / 1000
    return f'main thread {min(100, 100 * busy / ms):3.0f}%   repaints {paints / s:3.0f}/s   raster {raster / s:5.0f} ms/s   fps {fps / s:3.0f}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--w', type=int, default=390)
    ap.add_argument('--h', type=int, default=844)
    ap.add_argument('--dpr', type=float, default=3)
    ap.add_argument('--cpu', type=float, default=4, help='how many times slower the CPU runs')
    ap.add_argument('--look', default='', help='a look for every room, like barrow')
    ap.add_argument('--page', default=ROOT + '/dist/highfell.html')
    a = ap.parse_args()
    path = wrap(a.page)
    mobile = a.w < 600
    cx, cy = a.w / 2, a.h / 2
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            ctx = b.new_context(viewport={'width': a.w, 'height': a.h}, device_scale_factor=a.dpr, is_mobile=mobile, has_touch=mobile)
            pg = ctx.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(Path(path).as_uri())
            pg.wait_for_timeout(1200)
            pg.evaluate("() => document.querySelector('#cr-go') && document.querySelector('#cr-go').click()")
            pg.wait_for_timeout(600)
            if a.look:
                pg.evaluate("""([look, rooms]) => { highfell.setDev({ allOpen: true }); highfell.p.hearth.looks = Object.fromEntries(rooms.map((r) => [r, look]));
                  highfell.save(); highfell.showHearth('hall'); }""", [a.look, LOOK_ROOMS])
            pg.evaluate("() => { const t = document.querySelector('#toasts'); if (t) t.innerHTML = ''; }")
            pg.wait_for_timeout(1500)
            client = ctx.new_cdp_session(pg)
            client.send('Emulation.setCPUThrottlingRate', {'rate': a.cpu})

            def drag():
                pg.mouse.move(cx - 80, cy)
                pg.mouse.down()
                for i in range(1, 61):
                    pg.mouse.move(cx - 80 + (i if i <= 30 else 60 - i) * 6, cy + (i % 10))
                    pg.wait_for_timeout(16)
                pg.mouse.up()

            def wheel():
                pg.mouse.move(cx, cy)
                for i in range(24):
                    pg.mouse.wheel(0, -60 if i < 12 else 60)
                    pg.wait_for_timeout(40)

            def fly():
                pg.click('[data-act="zoom"]')
                pg.wait_for_timeout(900)
                pg.click('[data-act="zoom"]')

            print(f'the house at {a.w}x{a.h} @{a.dpr:g}x, CPU {a.cpu:g}x slower, look: {a.look or "as saved"}')
            print('  standing still   ', measure(pg, client, lambda: None, 3000))
            print('  dragging         ', measure(pg, client, drag, 600))
            pg.wait_for_timeout(600)
            print('  wheel zoom       ', measure(pg, client, wheel, 600))
            pg.wait_for_timeout(600)
            print('  fly out and back ', measure(pg, client, fly, 1400))
            pg.wait_for_timeout(600)
            ms = pg.evaluate("() => { const t = []; for (let i = 0; i < 10; i++) { const t0 = performance.now(); highfell.save(); t.push(performance.now() - t0); } return t.reduce((x, y) => x + y) / t.length; }")
            print(f'  a save at home    {ms:.0f} ms on average')
            for e in errs:
                print('pageerror:', e)
            b.close()
    finally:
        os.remove(path)


if __name__ == '__main__':
    main()
