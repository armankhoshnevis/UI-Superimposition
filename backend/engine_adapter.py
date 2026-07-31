import os
import json
from pathlib import Path

import numpy as np

import soundfile as sf

from superimposition.noise_superimposition import noise_superimposition

# TODO: update the path to get access to both NoRain and Rain datasets
_REPO_ROOT = Path(__file__).resolve().parents[1]
_DEFAULT_DATA_ROOT = (
    _REPO_ROOT.parents[1]
    / "hatci"
    / "Audio_Recording_Directory"
    / "Clip_Directory"
    / "NoRain"
)
_DATA_ROOT = Path(
    os.environ.get("HATCI_NORAIN_ROOT", str(_DEFAULT_DATA_ROOT))
).resolve()

if not _DATA_ROOT.is_dir():
    raise FileNotFoundError(f"NoRain dataset root does not exist: {_DATA_ROOT}")

_DRIVING_TO_SPEED = {
    0: 0,
    1: 25,
    2: 45,
    3: 70,
}


def generate_from_payload(req, scenario):
    scenario_id = scenario["scenario_id"]

    driving = int(req.get("driving", 0))
    window = int(req.get("window", 0))
    vent = int(req.get("venting", 0))

    if "speed_mph" in req:
        speed = int(req["speed_mph"])
    else:
        try:
            speed = _DRIVING_TO_SPEED[driving]
        except KeyError as exc:
            raise ValueError(
                f"Unsupported driving condition {driving!r}. "
                f"Expected one of {tuple(_DRIVING_TO_SPEED)}."
            ) from exc

    synth_dir = _REPO_ROOT / "synthetic"
    meta_dir = _REPO_ROOT / "metadata"
    synth_dir.mkdir(parents=True, exist_ok=True)
    meta_dir.mkdir(parents=True, exist_ok=True)

    loader = noise_superimposition(_DATA_ROOT, fs=48000)

    audio, selected_sources = loader.superimpose_recordings(
        speed=speed,
        window=window,
        vent=vent,
    )

    out_name = (
        f"{scenario_id}_speed{speed}_window{window}_vent{vent}.wav"
    )
    out_path = synth_dir / out_name

    peak = float(np.max(np.abs(audio)))

    print(f"Output peak before writing: {peak:.6f}")

    if peak > 1.0:
        print("Warning: output exceeds [-1, 1] and may clip.")
    else:
        print("Output is within [-1, 1].")
    
    sf.write(out_path, audio, loader.fs)

    selected_source_files = {
        "moving": (
            str(selected_sources["moving"])
            if selected_sources["moving"] is not None
            else None
        ),
        "stationary": (
            str(selected_sources["stationary"])
            if selected_sources["stationary"] is not None
            else None
        ),
        "stationary_baseline": (
            str(selected_sources["stationary_baseline"])
            if selected_sources["stationary_baseline"] is not None
            else None
        ),
    }

    meta = {
        "file": out_name,
        "scenario_id": scenario_id,
        "sample_rate": int(loader.fs),
        "channels": int(audio.shape[1]),
        "duration_sec": float(audio.shape[0] / loader.fs),
        "driving": driving,
        "speed_mph": speed,
        "window": window,
        "venting": vent,
        "channel_number": int(selected_sources["channel_number"]),
        "selected_source_files": selected_source_files,
    }

    meta_name = (
        f"scenario_id{scenario_id}_speed{speed}"
        f"_window{window}_vent{vent}.json"
    )
    meta_path = meta_dir / meta_name

    with meta_path.open("w", encoding="utf-8") as file:
        json.dump(meta, file, indent=2)

    return str(out_path), meta
