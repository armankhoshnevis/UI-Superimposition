"""
Audio + scenario I/O helpers shared by the backend.

This is the glue the engine adapter needs around the backend team's mixer:
load a scenario YAML, load/resample a WAV to the canonical rate, normalize
level, convolve a cabin impulse response, and guard the peak. The actual
mixing is done by the real engine (cranbrook-audio-project/mixer), not here.
"""
import yaml
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, resample

TARGET_SAMPLE_RATE = 16000


def load_scenario(path):
    """Parse a scenario YAML into a dict."""
    with open(path) as f:
        return yaml.safe_load(f)


def load_wav(path):
    """Load a WAV as a mono float32 array resampled to TARGET_SAMPLE_RATE."""
    data, sr = sf.read(path)
    if data.ndim > 1:
        data = data.mean(axis=1)  # stereo -> mono
    if sr != TARGET_SAMPLE_RATE:
        data = resample(data, int(len(data) * TARGET_SAMPLE_RATE / sr))
    return data.astype(np.float32), TARGET_SAMPLE_RATE


def normalize_rms(audio, target_db=-20):
    """Scale audio to a target RMS level in dBFS."""
    rms = np.sqrt(np.mean(audio ** 2))
    if rms < 1e-9:
        return audio
    return audio * (10 ** (target_db / 20) / rms)


def prevent_clipping(audio, max_peak=0.99):
    """Scale down if the peak exceeds the threshold."""
    peak = np.max(np.abs(audio))
    if peak > max_peak:
        return audio * (max_peak / peak)
    return audio


def apply_cabin_ir(audio, ir, normalize=True):
    """Convolve mono audio with a cabin impulse response (FFT convolution).

    Trims back to the input length and, when normalize is set, restores the
    input RMS so the IR colors the sound without changing its level.
    """
    output = fftconvolve(audio, ir, mode="full")[:len(audio)]
    if normalize:
        in_rms = np.sqrt(np.mean(audio ** 2))
        out_rms = np.sqrt(np.mean(output ** 2))
        if out_rms > 1e-9:
            output = output * (in_rms / out_rms)
    return output.astype(np.float32)
