import argparse
from pathlib import Path
from typing import Optional, Tuple

import librosa
import numpy as np
import soundfile as sf


def time_stretch(signal: np.ndarray, stretch_rate: float) -> np.ndarray:
    return librosa.effects.time_stretch(signal, rate=stretch_rate)


def pitch_scale(signal: np.ndarray, sr: int, num_semitones: float) -> np.ndarray:
    return librosa.effects.pitch_shift(signal, sr=sr, n_steps=num_semitones)


def add_white_noise(signal: np.ndarray, noise_factor: float, rng: np.random.Generator) -> np.ndarray:
    if signal.size == 0:
        return signal
    noise = rng.normal(0.0, float(signal.std()), signal.size)
    return signal + noise * noise_factor


def random_gain(
    signal: np.ndarray,
    min_gain_factor: float,
    max_gain_factor: float,
    rng: np.random.Generator,
) -> np.ndarray:
    gain_factor = float(rng.uniform(min_gain_factor, max_gain_factor))
    return signal * gain_factor


def load_audio(path: Path) -> Tuple[np.ndarray, int]:
    signal, sr = librosa.load(str(path), mono=True)
    return signal, sr


def augment_signal(
    signal: np.ndarray,
    sr: int,
    stretch_rate: Optional[float] = None,
    num_semitones: Optional[float] = None,
    noise_factor: Optional[float] = None,
    min_gain_factor: Optional[float] = None,
    max_gain_factor: Optional[float] = None,
) -> np.ndarray:
    rng = np.random.default_rng()
    if stretch_rate is None:
        stretch_rate = float(rng.uniform(0.8, 1.2))
    if num_semitones is None:
        num_semitones = float(rng.normal(0.0, 1.0))
    if noise_factor is None:
        noise_factor = float(rng.uniform(0.0, 0.2))
    if min_gain_factor is None:
        min_gain_factor = -2.0
    if max_gain_factor is None:
        max_gain_factor = 2.0

    augmented = time_stretch(signal, stretch_rate)
    augmented = pitch_scale(augmented, sr, num_semitones)
    augmented = add_white_noise(augmented, noise_factor, rng)
    augmented = random_gain(augmented, min_gain_factor, max_gain_factor, rng)
    return augmented


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_wav", type=Path, help="Path to input audio")
    parser.add_argument("--stretch-rate", type=float, default=None)
    parser.add_argument("--num-semitones", type=float, default=None)
    parser.add_argument("--noise-factor", type=float, default=None)
    parser.add_argument("--min-gain-factor", type=float, default=None)
    parser.add_argument("--max-gain-factor", type=float, default=None)
    args = parser.parse_args()

    signal, sr = load_audio(args.input_wav)
    output = augment_signal(
        signal,
        sr,
        stretch_rate=args.stretch_rate,
        num_semitones=args.num_semitones,
        noise_factor=args.noise_factor,
        min_gain_factor=args.min_gain_factor,
        max_gain_factor=args.max_gain_factor
    )
    out_path = args.input_wav.with_name(f"{args.input_wav.stem}_augmented.wav")
    sf.write(str(out_path), output, sr)


if __name__ == "__main__":
    main()