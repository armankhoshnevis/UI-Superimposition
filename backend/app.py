# backend/app.py
"""
Flask API for the audio generator.
Run from repo root: python backend/app.py
"""
import os
import re
import sys
import json
import glob
import shutil
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
 
# Make generator/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'generator'))
from audio_io import load_scenario

# Maps the UI payload onto the backend team's audio engine (the single mix path).
from engine_adapter import generate_from_payload
 
app = Flask(__name__)
CORS(app)   # Allow requests from React dev server
 
REPO_ROOT = os.path.join(os.path.dirname(__file__), '..')
 
 
@app.route('/scenarios', methods=['GET'])
def list_scenarios():
    """Return all scenario YAMLs as JSON for the dropdown."""
    paths = sorted(glob.glob(os.path.join(REPO_ROOT, 'scenarios/*.yaml')))
    scenarios = []
    for p in paths:
        try:
            data = load_scenario(p)
            scenarios.append({
                'scenario_id': data['scenario_id'],
                'name': data['name'],
                'purpose': data['purpose'],
                'category': data.get('category', 'unknown'),
                'severity': data.get('severity', 'medium'),
                'parameter_ranges': data.get('parameter_ranges', {}),
            })
        except Exception as e:
            print(f'Skipping {p}: {e}')
    return jsonify(scenarios)
 
 
@app.route('/generate', methods=['POST'])
def generate():
    """Generate one audio file from the request JSON."""
    req = request.json
    sid = req.get('scenario_id')
    if not sid:
        return jsonify({'error': 'scenario_id required'}), 400
 
    # Load the scenario
    scenario_path = os.path.join(REPO_ROOT, 'scenarios', f'{sid}.yaml')
    if not os.path.exists(scenario_path):
        return jsonify({'error': f'scenario not found: {sid}'}), 404
    scenario = load_scenario(scenario_path)

    # The engine adapter runs the backend team's real mix_audio and honors the
    # full UI payload (overlays, speed/window/vent). It degrades gracefully for
    # missing optional layers; a hard failure means a broken scenario or
    # environment, so surface it as a clean 500 rather than a stack trace.
    try:
        wav_path, meta = generate_from_payload(req, scenario)
    except Exception as e:
        print(f'[generate] generation failed: {e}')
        return jsonify({'error': f'generation failed: {e}'}), 500

    return jsonify({
        'file_url': f'/audio/{os.path.basename(wav_path)}',
        'metadata': meta,
        'generated_source': {
            'trajectory': (req.get('requested_source') or {}).get('trajectory', 'static'),
            'estimated_position_over_time': [],
        },
    })
 
 
EXPORTS_DIR = os.path.join(REPO_ROOT, 'exports')
PRESETS_DIR = os.path.join(REPO_ROOT, 'presets')


def _safe_name(name):
    name = (name or '').strip() or 'audio_scenario'
    return re.sub(r'[^A-Za-z0-9_\-]', '_', name)


@app.route('/export', methods=['POST'])
def export_audio():
    """Package the most recently generated audio with a metadata JSON file.

    Request body:
      { file_name, format, duration_sec, parameters, source_file }
    Response:
      { file_url, metadata_url }
    """
    req = request.json or {}
    name = _safe_name(req.get('file_name'))
    fmt  = (req.get('format') or 'wav').lower()
    src  = req.get('source_file')

    os.makedirs(EXPORTS_DIR, exist_ok=True)

    out_audio = os.path.join(EXPORTS_DIR, f'{name}.{fmt}')
    out_meta  = os.path.join(EXPORTS_DIR, f'{name}.json')

    # Copy the generated WAV (if available) into exports/
    if src:
        src_path = os.path.join(REPO_ROOT, 'synthetic', src)
        if os.path.exists(src_path):
            shutil.copyfile(src_path, out_audio)

    # Write the metadata JSON alongside the audio
    metadata = {
        'file_name':    f'{name}.{fmt}',
        'format':       fmt,
        'duration_sec': req.get('duration_sec', 30),
        'parameters':   req.get('parameters', {}),
    }
    with open(out_meta, 'w') as f:
        json.dump(metadata, f, indent=2)

    return jsonify({
        'file_url':     f'/exports/{name}.{fmt}',
        'metadata_url': f'/exports/{name}.json',
    })


@app.route('/preset', methods=['POST'])
def save_preset():
    """Save a preset JSON to presets/ for later reuse."""
    req = request.json or {}
    name = _safe_name(req.get('file_name'))
    os.makedirs(PRESETS_DIR, exist_ok=True)
    out = os.path.join(PRESETS_DIR, f'{name}.json')
    with open(out, 'w') as f:
        json.dump(req, f, indent=2)
    return jsonify({'preset_url': f'/presets/{name}.json'})


@app.route('/exports/<path:fname>')
def serve_export(fname):
    return send_from_directory(EXPORTS_DIR, fname, as_attachment=True)


@app.route('/presets/<path:fname>')
def serve_preset(fname):
    return send_from_directory(PRESETS_DIR, fname, as_attachment=True)


@app.route('/audio/<path:fname>')
def serve_audio(fname):
    """Serve generated WAV files."""
    return send_from_directory(
        os.path.join(REPO_ROOT, 'synthetic'),
        fname
    )
 
 
@app.route('/files', methods=['GET'])
def list_files():
    """List all generated files (for the dataset browser)."""
    metas = sorted(glob.glob(os.path.join(REPO_ROOT, 'metadata/*.json')))
    files = []
    for m in metas:
        with open(m) as f:
            data = json.load(f)
        files.append({
            **data,
            'file_url': f'/audio/{data["file"]}',
        })
    return jsonify(files)
 
 
if __name__ == '__main__':
    print('Starting Flask backend on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)

