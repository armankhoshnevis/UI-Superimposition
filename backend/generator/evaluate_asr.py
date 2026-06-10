# generator/evaluate_asr.py
"""
Run generated audio through OpenAI Whisper and measure recognition.
Requires: pip install openai-whisper
"""
import json
import glob
import whisper
from collections import defaultdict
 
EXPECTED_TEXT = {
    'WAKE_HVAC_01': 'hey genesis',
    'CMD_WIPERS_01': 'call mom',
    'OVERLAP_01': 'play music',
    'RAIN_MASK_01': 'call alex',
    'CHILD_NOISE_01': 'navigate home',
    # add as scenarios grow
}
 
 
def main():
    print('Loading Whisper model...')
    model = whisper.load_model('base')
 
    results = defaultdict(lambda: {'total': 0, 'matched': 0})
 
    for meta_path in sorted(glob.glob('metadata/*.json')):
        with open(meta_path) as f:
            meta = json.load(f)
        sid = meta['scenario_id']
        expected = EXPECTED_TEXT.get(sid, '').lower()
        if not expected:
            continue
 
        wav_path = f'synthetic/{meta["file"]}'
        result = model.transcribe(wav_path, language='en')
        got = result['text'].lower().strip()
        matched = expected in got
 
        results[sid]['total']   += 1
        results[sid]['matched'] += int(matched)
 
        status = 'OK' if matched else 'FAIL'
        print(f'[{status}] {meta["file"]}: expected "{expected}", got "{got[:60]}"')
 
    # Summary table
    print('\n=== Recognition Summary ===')
    for sid, stats in sorted(results.items()):
        rate = stats['matched'] / stats['total'] * 100 if stats['total'] else 0
        print(f'{sid}: {stats["matched"]}/{stats["total"]} ({rate:.0f}%)')
 
 
if __name__ == '__main__':
    main()

