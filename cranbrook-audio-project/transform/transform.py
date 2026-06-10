"""
Provides a pipeline for offline processing of a moving audio source with Doppler shift and HRTF.
File created by asterisk727 on 2026-05-13.
"""

import argparse
import math
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Tuple

import numpy as np

from doppler import cartesian_to_azel, doppler_resample, radial_velocity_from_positions
from saf_cffi import load_library


SPEED_OF_SOUND = 343.0
TARGET_SAMPLE_RATE = 48000
BLOCK_SIZE = 128


def read_wav_mono(path: Path) -> Tuple[np.ndarray, int]:
    """Read a WAV file and return mono float32 samples with the sample rate.

    Params:
        path: Path to a WAV file (16-bit PCM expected).

    Returns:
        A tuple of (mono_samples, sample_rate) where mono_samples is float32 in [-1, 1].
    """
    with wave.open(str(path), "rb") as wf:
        n_channels = wf.getnchannels()
        sample_rate = wf.getframerate()
        sampwidth = wf.getsampwidth()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)

    if sampwidth != 2:
        raise ValueError("Only 16-bit PCM WAV is supported")
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if n_channels == 1:
        mono = data
    else:
        mono = data.reshape(-1, n_channels).mean(axis=1)
    return mono, sample_rate


def write_wav_stereo(path: Path, stereo: np.ndarray, sample_rate: int) -> None:
    """Write a stereo float32 array to a 16-bit PCM WAV file.

    Params:
        path: Output WAV file path.
        stereo: Stereo array shaped (n_samples, 2) with float samples in [-1, 1].
        sample_rate: Sample rate in Hz.

    Returns:
        None.
    """
    if stereo.ndim != 2 or stereo.shape[1] != 2:
        raise ValueError("stereo must be shaped (n_samples, 2)")
    audio_i16 = np.clip(stereo, -1.0, 1.0)
    audio_i16 = (audio_i16 * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_i16.tobytes())


def ensure_wav_mono_48k_16bit(path: Path) -> Path:
    """Convert input audio to a mono 48 kHz 16-bit PCM WAV via ffmpeg.

    Params:
        path: Path to the input audio file.

    Returns:
        Path to a temporary WAV file containing the converted audio.
    """
    temp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp.close()
    out_path = Path(temp.name)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(path),
        "-ac",
        "1",
        "-ar",
        str(TARGET_SAMPLE_RATE),
        "-sample_fmt",
        "s16",
        str(out_path),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out_path


def rms_level(audio: np.ndarray) -> float:
    """Compute the RMS level of audio samples.

    Params:
        audio: Audio samples as a 1D float array.

    Returns:
        RMS value as a float.
    """
    return float(np.sqrt(np.mean(audio * audio)))


def straight_line_positions(
    n_samples: int,
    sample_rate: int,
    initial_pos: Tuple[float, float, float],
    velocity: Tuple[float, float, float],
) -> np.ndarray:
    """Generate positions along a straight-line trajectory.

    Params:
        n_samples: Number of samples to generate positions for.
        sample_rate: Sample rate in Hz.
        initial_pos: Initial (x, y, z) position in meters.
        velocity: Constant (x, y, z) velocity in meters per second.

    Returns:
        Positions array shaped (n_samples, 3).
    """
    t = np.arange(n_samples, dtype=np.float32) / float(sample_rate)
    pos0 = np.array(initial_pos, dtype=np.float32)
    vel = np.array(velocity, dtype=np.float32)
    return pos0[None, :] + t[:, None] * vel[None, :]


def binauralize_blocks(
    mono: np.ndarray,
    positions: np.ndarray,
    sample_rate: int,
    block_size: int,
) -> Tuple[np.ndarray, np.ndarray]:
    """Binauralize mono audio using the SAF binaural processor.

    Params:
        mono: Mono input samples as a 1D float array.
        positions: Source positions array shaped (n_samples, 3).
        sample_rate: Sample rate in Hz.
        block_size: Processing block size for the SAF engine.

    Returns:
        A tuple of (left, right) stereo channels as float arrays.
    """
    if block_size != BLOCK_SIZE:
        raise ValueError(f"block_size must be {BLOCK_SIZE} for this SAF build")

    ffi, lib = load_library()
    handle = lib.saf_create(sample_rate, block_size)
    if handle == ffi.NULL:
        raise RuntimeError("saf_create failed")

    # Default HRTF set.
    lib.saf_set_hrtf(handle, ffi.NULL)

    n_frames = len(mono)
    n_blocks = int(math.ceil(n_frames / block_size))

    out_left = np.zeros(n_blocks * block_size, dtype=np.float32)
    out_right = np.zeros(n_blocks * block_size, dtype=np.float32)

    for b in range(n_blocks):
        start = b * block_size
        end = start + block_size
        block = np.zeros(block_size, dtype=np.float32)
        chunk = mono[start:end]
        block[: len(chunk)] = chunk

        # Use the block midpoint for spatial parameters.
        mid = min(start + block_size // 2, len(positions) - 1)
        az, el, dist = cartesian_to_azel(positions[mid : mid + 1])
        lib.saf_set_source_pos(handle, float(az[0]), float(el[0]), float(dist[0]))

        in_buf = ffi.from_buffer("float[]", block)
        out_l = ffi.from_buffer("float[]", out_left[start:end])
        out_r = ffi.from_buffer("float[]", out_right[start:end])
        lib.saf_process(handle, in_buf, out_l, out_r, block_size)

    lib.saf_destroy(handle)
    return out_left[:n_frames], out_right[:n_frames]


def transform(
    input_wav: Path,
    initial_pos: Tuple[float, float, float],
    direction: Tuple[float, float, float],
    speed: float,
    block_size: int = BLOCK_SIZE,
) -> Tuple[np.ndarray, int]:
    """Run the full Doppler + binaural transform and return stereo output.

    Params:
        input_wav: Path to the input audio file.
        speed: Source speed in meters per second.
        initial_pos: Initial (x, y, z) position in meters.
        direction: Direction vector (x, y, z) for travel.
        block_size: SAF processing block size (must match the build parameter).

    Returns:
        A tuple of (stereo, sample_rate), where stereo is shaped (n_samples, 2).
    """
    converted = ensure_wav_mono_48k_16bit(input_wav)
    try:
        mono, sr = read_wav_mono(converted)
    finally:
        if converted.exists():
            converted.unlink()
    if sr != TARGET_SAMPLE_RATE:
        raise ValueError("Converted input is not 48 kHz as expected")

    if block_size != BLOCK_SIZE:
        raise ValueError(f"block_size must be {BLOCK_SIZE} for this SAF build")

    dir_vec = np.array(direction, dtype=np.float32)
    norm = float(np.linalg.norm(dir_vec))
    if norm == 0.0:
        raise ValueError("Direction vector must be non-zero")
    dir_vec = dir_vec / norm
    velocity = tuple((dir_vec * speed).tolist())

    positions = straight_line_positions(len(mono), sr, initial_pos, velocity)
    vr = radial_velocity_from_positions(positions, 1.0 / sr)

    doppler = doppler_resample(mono, vr, c=SPEED_OF_SOUND)
    left, right = binauralize_blocks(doppler, positions, sr, block_size)
    input_rms = rms_level(mono)
    out_rms = rms_level((left + right) * 0.5)
    if input_rms > 0.0 and out_rms > 0.0:
        gain = input_rms / out_rms
        left = left * gain
        right = right * gain

    stereo = np.stack([left, right], axis=1)
    return stereo, sr


def main() -> None:
    """CLI wrapper to run the transform and write a stereo WAV."""
    parser = argparse.ArgumentParser()
    parser.add_argument("input_wav", type=Path, help="Path to input audio")
    parser.add_argument("--speed", type=float, default=40.0, help="Speed in m/s")
    parser.add_argument("--initial-x", type=float, default=-200.0)
    parser.add_argument("--initial-y", type=float, default=10.0)
    parser.add_argument("--initial-z", type=float, default=0.0)
    parser.add_argument("--dir-x", type=float, default=1.0)
    parser.add_argument("--dir-y", type=float, default=0.0)
    parser.add_argument("--dir-z", type=float, default=0.0)
    args = parser.parse_args()

    initial_pos = (args.initial_x, args.initial_y, args.initial_z)
    direction = (args.dir_x, args.dir_y, args.dir_z)
    stereo, sr = transform(
        args.input_wav,
        initial_pos=initial_pos,
        direction=direction,
        speed=args.speed
    )
    output_wav = args.input_wav.with_name(f"{args.input_wav.stem}_transformed.wav")
    write_wav_stereo(output_wav, stereo, sr)


if __name__ == "__main__":
    main()
