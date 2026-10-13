import sys
import numpy as np
import lameenc
from kokoro_onnx import Kokoro

model, voices, text_path, out_path = sys.argv[1:5]
voice = sys.argv[5] if len(sys.argv) > 5 else "af_heart"
speed = float(sys.argv[6]) if len(sys.argv) > 6 else 1.0

kokoro = Kokoro(model, voices)
paras = [p.strip() for p in open(text_path, encoding="utf-8").read().split("\n\n") if p.strip()]

chunks, rate = [], 24000
for p in paras:
    samples, rate = kokoro.create(p, voice=voice, speed=speed, lang="en-us")
    chunks.append(samples.astype(np.float32))
    chunks.append(np.zeros(int(rate * 0.6), dtype=np.float32))

audio = np.concatenate(chunks)
peak = float(np.max(np.abs(audio))) or 1.0
pcm = (audio / peak * 0.9 * 32767).astype(np.int16).tobytes()

enc = lameenc.Encoder()
enc.set_bit_rate(96)
enc.set_in_sample_rate(rate)
enc.set_channels(1)
enc.set_quality(2)
mp3 = enc.encode(pcm) + enc.flush()
open(out_path, "wb").write(mp3)
print(f"{len(paras)} paragraphs, {len(audio) / rate / 60:.1f} min, {len(mp3) / 1e6:.1f} MB")
