"""
Generate synthetic PLACEHOLDER sound effects for the UI sound-library ids that
have no real recording in raw/ yet (rain, siren, car_passing, ...).

These are crude procedural approximations so the whole UI catalog produces
*some* audible, recognizable-ish output for end-to-end demos. Replace them with
real recordings when the audio team sources them — just drop a wav with the same
name into raw/distributed/sfx/ and the adapter's SOUND_FILE_MAP keeps working.

Run from the repo root:  python backend/make_placeholder_sfx.py
"""
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, sawtooth

SR = 16000
DUR = 3.0
N = int(SR * DUR)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "raw", "distributed", "sfx")

_rng = np.random.default_rng(0)
_t = np.arange(N) / SR


def _noise():
    return _rng.standard_normal(N)


def _filt(x, kind, cutoff):
    sos = butter(4, cutoff, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


def _norm(x, peak=0.7):
    x = np.asarray(x, dtype=np.float64)
    m = np.max(np.abs(x))
    return (x * (peak / m)).astype(np.float32) if m > 1e-9 else x.astype(np.float32)


def _fm_tone(base, depth, rate):
    """Sine whose frequency wobbles base ± depth Hz at `rate` Hz (for sirens)."""
    inst_f = base + depth * np.sin(2 * np.pi * rate * _t)
    phase = 2 * np.pi * np.cumsum(inst_f) / SR
    return np.sin(phase)


def _gate(period_on, period_off):
    cycle = period_on + period_off
    return (np.mod(_t, cycle) < period_on).astype(np.float64)


def _bursts(rate_hz, width_s, band=(200, 2000)):
    """Repeating filtered-noise impacts (cough/jackhammer-style)."""
    env = np.zeros(N)
    step = int(SR / rate_hz)
    w = int(SR * width_s)
    for start in range(0, N, step):
        seg = np.linspace(1.0, 0.0, w) ** 2
        end = min(start + w, N)
        env[start:end] += seg[: end - start]
    shaped = _filt(_noise(), "bandpass", band)
    return shaped * np.clip(env, 0, 1)


def build():
    s = {}
    s["rain"] = _filt(_noise(), "highpass", 2000) * (0.8 + 0.2 * np.sin(2 * np.pi * 3 * _t))
    s["hail"] = s["rain"] + _bursts(18, 0.01, band=(3000, 6000)) * 2.0
    s["wind"] = _filt(_noise(), "lowpass", 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * _t))
    s["snow"] = _filt(_noise(), "highpass", 4000) * 0.3
    thunder_env = np.exp(-2.0 * _t) + 0.6 * np.exp(-1.5 * np.clip(_t - 1.2, 0, None))
    s["thunder"] = _filt(_noise(), "lowpass", 120) * thunder_env
    s["phone_ringing"] = (np.sin(2 * np.pi * 440 * _t) + np.sin(2 * np.pi * 480 * _t)) * _gate(0.4, 0.2)
    chord = sum(np.sin(2 * np.pi * f * _t) for f in (261.6, 329.6, 392.0))
    s["music"] = chord * (1 + 0.05 * np.sin(2 * np.pi * 5 * _t))
    s["coughing"] = _bursts(1.2, 0.18, band=(200, 1800))
    swell = np.exp(-((_t - DUR / 2) ** 2) / (2 * 0.5 ** 2))
    s["car_passing"] = _filt(_noise(), "lowpass", 1500) * swell
    s["emergency_siren"] = _fm_tone(900, 300, 0.4)
    moto = sawtooth(2 * np.pi * 85 * _t) * (1 + 0.3 * np.sin(2 * np.pi * 8 * _t))
    s["motorcycle"] = _filt(moto, "lowpass", 3000)
    s["truck_horn"] = np.sin(2 * np.pi * 150 * _t) + np.sin(2 * np.pi * 185 * _t)
    s["construction"] = _bursts(11, 0.04, band=(150, 1200))
    return s


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, sig in build().items():
        path = os.path.join(OUT_DIR, f"{name}.wav")
        sf.write(path, _norm(sig), SR, subtype="PCM_16")
        print(f"wrote {os.path.relpath(path)}")


if __name__ == "__main__":
    main()
