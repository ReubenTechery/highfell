# The sound pipeline: asks ElevenLabs for takes, then trims, normalises and compresses the picked one.
# What to ask for and which take we kept live in tools/audio_list.py. Needs ffmpeg, and the API key in
# ELEVENLABS_API_KEY for new takes. Takes are kept in .cache/audio (not in git).
#
#   python3 tools/audio.py takes [NAME ...] [--n 3] [--again]   new takes of effects (all, or the ones named)
#   python3 tools/audio.py make [NAME ...]                       picked takes -> audio/sfx/NAME.mp3, then pack
#   python3 tools/audio.py pack                                  audio/sfx/*.mp3 -> audio/sfx.json (the build embeds it)
#   python3 tools/audio.py music NAME [--n 2] [--again]          new takes of a music track
#   python3 tools/audio.py loop [NAME ...]                       picked music takes -> audio/music/NAME.mp3 + audio/music.json
#   python3 tools/audio.py page OUT.html [NAME ...]              a page to listen to every take, the kept one starred
import base64, json, math, os, subprocess, sys, tempfile, time, urllib.error, urllib.request, wave
from array import array
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_list import JINGLE, MUSIC, SFX, STYLE  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.cache', 'audio')
OUT_SFX = os.path.join(ROOT, 'audio', 'sfx')
OUT_MUSIC = os.path.join(ROOT, 'audio', 'music')
SR = 44100          # effects are worked on at this rate, in mono (and shipped as 40 kbps mono MP3 at 32 kHz)
PEAK = -1.0         # dBFS: no effect's peak goes over this


# ---------------------------------------------------------------- ElevenLabs
def api(path, body, query):
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        sys.exit('Set ELEVENLABS_API_KEY to make new takes.')
    req = urllib.request.Request(f'https://api.elevenlabs.io{path}?{query}', data=json.dumps(body).encode(),
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    for i in range(6):
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and i < 5:
                time.sleep(3 * 2 ** i)
                continue
            raise RuntimeError(f'ElevenLabs said {e.code}: {e.read()[:400]!r}')
        except urllib.error.URLError:
            if i < 5:
                time.sleep(3 * 2 ** i)
                continue
            raise


def take_path(kind, name, k):
    return os.path.join(CACHE, kind, name, f'{k}.wav')


def takes_of(kind, name):
    d = os.path.join(CACHE, kind, name)
    return sorted(int(f[:-4]) for f in os.listdir(d) if f.endswith('.wav')) if os.path.isdir(d) else []


def new_sfx_take(name, k):
    s = SFX[name]
    if s['music']:
        mp3 = api('/v1/music', {'prompt': s['prompt'], 'music_length_ms': max(3000, int(s['dur'] * 1000)),
                                'model_id': 'music_v2_5', 'force_instrumental': True}, 'output_format=mp3_44100_192')
    else:
        text = f"{s['prompt']} {JINGLE if s['jingle'] else STYLE}"
        mp3 = api('/v1/sound-generation', {'text': text, 'duration_seconds': s['dur'], 'prompt_influence': 0.55,
                                           'model_id': 'eleven_text_to_sound_v2'}, 'output_format=mp3_44100_192')
    to_wav(mp3, take_path('sfx', name, k), SR, mono=True)
    return name, k


def new_music_take(name, k):
    m = MUSIC[name]
    mp3 = api('/v1/music', {'prompt': m['prompt'], 'music_length_ms': m['ms'], 'model_id': 'music_v2_5',
                            'force_instrumental': True}, 'output_format=mp3_48000_192')
    to_wav(mp3, take_path('music', name, k), 48000, mono=False)
    return name, k


# ---------------------------------------------------------------- audio in and out
def ffmpeg(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


def to_wav(data, path, rate, mono):
    """decode what the API sent into a 16-bit WAV; a mono mixdown keeps the louder channel if L+R cancels"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        src = os.path.join(t, 'in.mp3')
        open(src, 'wb').write(data)
        ffmpeg('-i', src, '-ar', str(rate), '-ac', '2', '-c:a', 'pcm_s16le', os.path.join(t, 'st.wav'))
        ch, sr, x = read_wav(os.path.join(t, 'st.wav'))
    if mono:
        L, R = x[0::2], x[1::2]
        m = [(a + b) / 2 for a, b in zip(L, R)]
        if rms(m) < 0.7 * max(rms(L), rms(R)):
            m = L if rms(L) >= rms(R) else R
        write_wav(path, m, sr, 1)
    else:
        write_wav(path, x, sr, 2)


def read_wav(path):
    with wave.open(path, 'rb') as w:
        ch, sr, n = w.getnchannels(), w.getframerate(), w.getnframes()
        a = array('h'); a.frombytes(w.readframes(n))
    if sys.byteorder == 'big':
        a.byteswap()
    return ch, sr, [v / 32768 for v in a]


def write_wav(path, x, sr, ch):
    a = array('h', (max(-32768, min(32767, int(round(v * 32767)))) for v in x))
    if sys.byteorder == 'big':
        a.byteswap()
    with wave.open(path, 'wb') as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())


def rms(x):
    return math.sqrt(sum(v * v for v in x) / max(1, len(x)))


def db(v):
    return 20 * math.log10(max(v, 1e-9))


# ---------------------------------------------------------------- effects
def highpass(x, hz=50.0):
    """2nd-order Butterworth: takes out rumble a phone can't play, which only eats headroom"""
    w = math.tan(math.pi * hz / SR); n = 1 / (1 + math.sqrt(2) * w + w * w)
    b0, b1, b2 = n, -2 * n, n
    a1, a2 = 2 * (w * w - 1) * n, (1 - math.sqrt(2) * w + w * w) * n
    y, x1, x2, y1, y2 = [], 0.0, 0.0, 0.0, 0.0
    for v in x:
        o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, v, y1, o
        y.append(o)
    return y


def loudness(y):
    """the loudest 100 ms, as RMS in dBFS: how loud a short effect feels"""
    w = int(0.1 * SR)
    if len(y) <= w:
        return db(rms(y))
    sq = [v * v for v in y]
    run = sum(sq[:w]); best = run
    for i in range(w, len(sq)):
        run += sq[i] - sq[i - w]; best = max(best, run)
    return db(math.sqrt(best / w))


def shape(x, keep, level, gain=0, at=0):
    """from the first sound (after `at` seconds) to its natural end (or `keep` seconds, faded), then as loud as
    `level` (the loudest 100 ms, in dBFS) without its peak going over -1 dBFS, then `gain` dB"""
    x = highpass(x[int(at * SR):])
    peak = max(abs(v) for v in x) or 1.0
    on = peak * 10 ** (-36 / 20)
    i0 = next(i for i, v in enumerate(x) if abs(v) >= on)
    i0 = max(0, i0 - int(0.003 * SR))
    blk = int(0.005 * SR)
    env = [max(abs(v) for v in x[i:i + blk]) for i in range(i0, len(x), blk)]
    top = max(env)
    last = max(j for j, e in enumerate(env) if e >= top * 10 ** (-38 / 20))
    natural = i0 + (last + 2) * blk
    i1 = min(len(x), natural, i0 + int(keep * SR))
    y = x[i0:i1]
    cut = i1 < natural - blk
    fade = int(SR * (max(0.06, min(0.15, 0.25 * len(y) / SR)) if cut else 0.03))
    fade = min(fade, len(y) // 2)
    for i in range(min(int(0.002 * SR), len(y))):
        y[i] *= i / (0.002 * SR)
    for i in range(fade):
        y[len(y) - fade + i] *= 0.5 + 0.5 * math.cos(math.pi * (i + 1) / fade)
    k = 10 ** (PEAK / 20) / (max(abs(v) for v in y) or 1.0)
    y = [v * k for v in y]
    need = level - loudness(y) + gain
    y = [v * 10 ** (min(need, 6.0) / 20) for v in y]
    return (limit(y) if need > 0 else y), cut


def limit(x):
    """a fast limiter for spiky sounds made louder: peaks come down smoothly to -1 dBFS (1 ms in, 60 ms out),
    and anything that still gets through is rounded off"""
    top = 10 ** (PEAK / 20)
    att, rel = math.exp(-1 / (0.001 * SR)), math.exp(-1 / (0.06 * SR))
    env, y = 0.0, []
    for v in x:
        a = abs(v)
        env = a + (env - a) * (att if a > env else rel)
        g = min(1.0, top / env) if env > 0 else 1.0
        y.append(top * math.tanh(v * g / top))
    return y


def make(names):
    os.makedirs(OUT_SFX, exist_ok=True)
    for name in names:
        s = SFX[name]
        if not s['take']:
            print(f'{name}: no take picked yet'); continue
        src = take_path('sfx', name, s['take'])
        if not os.path.exists(src):
            print(f'{name}: take {s["take"]} is not in .cache/audio (make new takes)'); continue
        _, _, x = read_wav(src)
        y, cut = shape(x, s['keep'], s['level'], s['gain'], s['at'])
        with tempfile.TemporaryDirectory() as t:
            w = os.path.join(t, 'a.wav')
            write_wav(w, y, SR, 1)
            ffmpeg('-i', w, '-c:a', 'libmp3lame', '-b:a', '40k', '-ac', '1', '-ar', '32000', '-map_metadata', '-1',
                   '-id3v2_version', '0', '-write_id3v1', '0', os.path.join(OUT_SFX, name + '.mp3'))
        kb = os.path.getsize(os.path.join(OUT_SFX, name + '.mp3')) / 1024
        print(f'{name:10} take {s["take"]}  {len(y) / SR:.2f}s{" (cut)" if cut else ""}  {loudness(y):.1f} dB  {kb:.1f} KB')
    pack()


def pack():
    """every finished effect, base64, in one file the build embeds"""
    out = {}
    for f in sorted(os.listdir(OUT_SFX)):
        if f.endswith('.mp3') and f[:-4] in SFX:
            out[f[:-4]] = base64.b64encode(open(os.path.join(OUT_SFX, f), 'rb').read()).decode()
    path = os.path.join(ROOT, 'audio', 'sfx.json')
    json.dump(out, open(path, 'w'), indent=0, sort_keys=True)
    print(f'audio/sfx.json: {len(out)} effects, {os.path.getsize(path) / 1024:.0f} KB')


# ---------------------------------------------------------------- music
def loop(names):
    """a seamless loop: the tail of the loop crossfaded into its head, with a copy of the loop's end before it
    and of its start after it, so the game can loop the middle without caring how its decoder pads the file"""
    os.makedirs(OUT_MUSIC, exist_ok=True)
    path = os.path.join(ROOT, 'audio', 'music.json')
    meta = json.load(open(path)) if os.path.exists(path) else {}
    for name in names:
        m = MUSIC[name]
        if not m.get('take'):
            print(f'{name}: no take picked yet'); continue
        ch, sr, x = read_wav(take_path('music', name, m['take']))
        a, L, F = int(m['start'] * sr), int(round(m['len'] * sr)), int(m['xfade'] * sr)
        b = a + L
        if b + F > len(x) // ch:
            sys.exit(f'{name}: the loop runs past the end of the take')
        y = x[a * ch:b * ch]
        for i in range(F):
            g, h = math.sin(0.5 * math.pi * i / F), math.cos(0.5 * math.pi * i / F)   # equal power
            for c in range(ch):
                y[i * ch + c] = x[(a + i) * ch + c] * g + x[(b + i) * ch + c] * h
        pre = int(0.5 * sr)
        y = y[(L - pre) * ch:] + y + y[:pre * ch]
        k = 10 ** (m['gain'] / 20) / (max(abs(v) for v in y) or 1.0)
        out = os.path.join(OUT_MUSIC, name + '.mp3')
        with tempfile.TemporaryDirectory() as t:
            w = os.path.join(t, 'a.wav')
            write_wav(w, [v * k for v in y], sr, ch)
            ffmpeg('-i', w, '-c:a', 'libmp3lame', '-abr', '1', '-b:a', '72k', '-ar', '44100', '-map_metadata', '-1',
                   '-id3v2_version', '0', '-write_id3v1', '0', out)
        kb = os.path.getsize(out) / 1024
        meta[name] = {'file': f'music/{name}.mp3', 'loopStart': round(pre / sr, 5), 'loopEnd': round((pre + L) / sr, 5),
                      'kb': round(kb), 'lufs': lufs(out)}
        print(f'{name:8} take {m["take"]}  {L / sr:.2f}s loop  {kb:.0f} KB')
    json.dump(meta, open(path, 'w'), indent=1, sort_keys=True)


def lufs(path):
    """integrated loudness, so the game can play every loop at the same level"""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True)
    return float([ln for ln in r.stderr.splitlines() if ln.strip().startswith('I:')][-1].split()[1])


# ---------------------------------------------------------------- listening
def page(out, names):
    """every take as a little player, so a person can pick by ear"""
    rows = []
    for kind, table in (('sfx', SFX), ('music', MUSIC)):
        for name in table:
            if names and name not in names:
                continue
            cells = []
            for k in takes_of(kind, name):
                with tempfile.TemporaryDirectory() as t:
                    o = os.path.join(t, 'a.mp3')
                    ffmpeg('-i', take_path(kind, name, k), '-c:a', 'libmp3lame', '-b:a', '64k', o)
                    b64 = base64.b64encode(open(o, 'rb').read()).decode()
                star = ' ★' if table[name].get('take') == k else ''
                cells.append(f'<div><b>{k}{star}</b><audio controls preload="none" src="data:audio/mpeg;base64,{b64}"></audio></div>')
            if cells:
                rows.append(f'<section><h2>{name}</h2><p>{table[name]["prompt"]}</p>{"".join(cells)}</section>')
    html = ('<!doctype html><meta charset="utf-8"><title>Highfell takes</title><style>body{font:15px system-ui;margin:16px;'
            'background:#17121F;color:#F4ECDD}section{border-top:1px solid #444;padding:8px 0}div{display:inline-flex;'
            'gap:6px;align-items:center;margin:4px 12px 4px 0}p{opacity:.7;margin:2px 0}</style>' + ''.join(rows))
    open(out, 'w').write(html)
    print(f'{out}: {len(rows)} sounds')


def main():
    args = sys.argv[1:]
    if not args:
        print(open(__file__).read().split('\nimport')[0]); return
    cmd, rest = args[0], args[1:]
    n = 3 if cmd == 'takes' else 2
    if '--n' in rest:
        i = rest.index('--n'); n = int(rest[i + 1]); del rest[i:i + 2]
    again = '--again' in rest
    rest = [r for r in rest if r != '--again']
    if cmd in ('takes', 'music'):
        table, kind, fn = (SFX, 'sfx', new_sfx_take) if cmd == 'takes' else (MUSIC, 'music', new_music_take)
        names = rest or list(table)
        jobs = []
        for name in names:
            have = [] if again else takes_of(kind, name)
            start = max(takes_of(kind, name) or [0]) + 1 if again else 1
            jobs += [(name, k) for k in range(start, start + n) if k not in have]
        with ThreadPoolExecutor(4 if kind == 'sfx' else 2) as ex:
            for name, k in ex.map(lambda j: fn(*j), jobs):
                print(f'{name} take {k}')
    elif cmd == 'make':
        make(rest or list(SFX))
    elif cmd == 'pack':
        pack()
    elif cmd == 'loop':
        loop(rest or list(MUSIC))
    elif cmd == 'page':
        page(rest[0], rest[1:])
    else:
        sys.exit(f'unknown command {cmd}')


if __name__ == '__main__':
    main()
