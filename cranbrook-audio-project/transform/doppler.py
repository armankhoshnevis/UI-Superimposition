"""
Implements doppler shift related functions for moving audio sources.
File created by asterisk727 on 2026-05-13.
"""

from __future__ import annotations

import math
from typing import Tuple

import numpy as np

SPEED_OF_SOUND = 343.0


def cartesian_to_azel(pos: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convert positions to azimuth, elevation, and distance.

    Params:
        pos: Array shaped (n_samples, 3) containing (x, y, z) in meters.

    Returns:
        Tuple of (azimuth_deg, elevation_deg, distance_m), each shaped (n_samples,).
    """
    x = pos[:, 0]
    y = pos[:, 1]
    z = pos[:, 2]
    dist = np.sqrt(x * x + y * y + z * z)
    az = np.degrees(np.arctan2(y, x))
    el = np.degrees(np.arctan2(z, np.sqrt(x * x + y * y)))
    return az, el, dist


def radial_velocity_from_positions(pos: np.ndarray, dt: float) -> np.ndarray:
    """Compute radial velocity from positions relative to listener.

    Params:
        pos: Array shaped (n_samples, 3) containing (x, y, z) in meters.
        dt: Time step between samples in seconds.

    Returns:
        Radial velocity in meters per second; positive means approaching.
    """
    _, _, dist = cartesian_to_azel(pos)
    d_dist = np.gradient(dist, dt)
    return -d_dist


def doppler_rate(vr: np.ndarray, c: float = SPEED_OF_SOUND) -> np.ndarray:
    """Compute time-varying Doppler rate from radial velocity.

    Params:
        vr: Radial velocity array in meters per second.
        c: Speed of sound in meters per second.

    Returns:
        Doppler resampling rate for each sample.
    """
    return c / (c - vr)


def _sinc(x: np.ndarray) -> np.ndarray:
    """Compute normalized sinc values.

    Params:
        x: Input array.

    Returns:
        Sinc of each element in x.
    """
    out = np.ones_like(x)
    nz = x != 0.0
    out[nz] = np.sin(math.pi * x[nz]) / (math.pi * x[nz])
    return out


def _kaiser_window(taps: int, beta: float) -> np.ndarray:
    """Create a Kaiser window for band-limited interpolation.

    Params:
        taps: Number of filter taps (window length).
        beta: Kaiser window beta parameter.

    Returns:
        Kaiser window as a float32 array of length taps.
    """
    return np.kaiser(taps, beta).astype(np.float32)


def time_varying_resample(
    x: np.ndarray,
    rate: np.ndarray,
    taps: int = 64,
    beta: float = 8.6,
) -> np.ndarray:
    """Resample with a time-varying rate using windowed-sinc interpolation.

    Params:
        x: Mono input samples as a 1D float array.
        rate: Time-varying resampling rate array.
        taps: Number of filter taps (must be even).
        beta: Kaiser window beta parameter.

    Returns:
        Resampled audio array with length equal to len(rate).
    """
    if taps % 2 != 0:
        raise ValueError("taps must be even")
    if x.ndim != 1:
        raise ValueError("x must be 1D mono")

    half = taps // 2
    window = _kaiser_window(taps, beta)

    # Pad to keep interpolation within bounds.
    pad = half + 2
    xp = np.pad(x.astype(np.float32), (pad, pad))

    out = np.zeros(len(rate), dtype=np.float32)
    phase = 0.0

    for i, r in enumerate(rate):
        phase += float(r)
        idx = int(math.floor(phase))
        frac = phase - idx

        # Centered window around the sample position.
        base = idx + pad - half
        taps_idx = np.arange(taps, dtype=np.int32)
        x_idx = base + taps_idx
        t = (taps_idx - half + 1) - frac
        weights = window * _sinc(t)

        # Normalize to avoid amplitude drift near boundaries.
        wsum = float(np.sum(weights))
        if wsum != 0.0:
            weights = weights / wsum

        out[i] = float(np.sum(xp[x_idx] * weights))

        if idx + half + 2 >= len(xp):
            break

    return out


def doppler_resample(
    x: np.ndarray,
    vr: np.ndarray,
    c: float = SPEED_OF_SOUND,
    taps: int = 64,
    beta: float = 8.6,
) -> np.ndarray:
    """Apply Doppler shift using a radial velocity array.

    Params:
        x: Mono input samples as a 1D float array.
        vr: Radial velocity array in meters per second.
        c: Speed of sound in meters per second.
        taps: Number of filter taps (must be even).
        beta: Kaiser window beta parameter.

    Returns:
        Doppler-shifted audio array.
    """
    rate = doppler_rate(vr, c=c)
    return time_varying_resample(x, rate, taps=taps, beta=beta)
