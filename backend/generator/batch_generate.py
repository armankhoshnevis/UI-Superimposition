"""
Generate a baseline dataset for every scenario in scenarios/ using the real
audio engine — via the same adapter the API uses, so batch output matches what
the UI produces. Iterates each scenario's parameter_ranges (snr_db x position).

Run from anywhere:  python backend/generator/batch_generate.py
"""
import os
import sys
import glob

# Make the sibling backend modules importable (audio_io here, engine_adapter
# one level up in backend/).
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from audio_io import load_scenario
from engine_adapter import generate_from_payload

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def main(n_variants=2):
    scenarios = sorted(glob.glob(os.path.join(REPO_ROOT, "scenarios", "*.yaml")))
    if not scenarios:
        print("No scenarios found")
        return

    total = 0
    for path in scenarios:
        scenario = load_scenario(path)
        sid = scenario["scenario_id"]
        ranges = scenario.get("parameter_ranges", {})
        snrs = ranges.get("snr_db", [5])
        positions = ranges.get("speaker_position", ["driver"])
        print(f"Generating: {sid}")
        for snr in snrs:
            for pos in positions:
                for v in range(n_variants):
                    req = {
                        "scenario_id": sid, "snr_db": snr, "speaker_position": pos,
                        "seed": 1000 + v, "driving": 0, "window": 0, "venting": 0,
                        "overlays": [],
                    }
                    try:
                        generate_from_payload(req, scenario)
                        total += 1
                    except Exception as e:
                        print(f"  FAILED {sid} snr={snr} pos={pos}: {e}")

    print(f"\nGenerated {total} files across {len(scenarios)} scenarios.")


if __name__ == "__main__":
    main(n_variants=2)
