"""
Provides methods for mixing an arbitrary number of audio sources together with specified offsets and gains.
File created by asterisk727 on 2026-05-21.
"""


import argparse
import sys
import numpy as np
import soundfile as sf
import librosa

def apply_gain(audio: np.ndarray, gain_db: float) -> np.ndarray:
    """Applies a given gain in decibels to the audio.

    Params:
        audio: A numpy array of the audio signal.
        gain_db: The gain to apply in decibels.

    Returns:
        The audio signal scaled by the given gain.
    """
    linear_gain = 10 ** (gain_db / 20)
    return audio * linear_gain

def mix_two_sounds(base_audio: np.ndarray, new_audio: np.ndarray, offset_samples: int, gain_db: float) -> np.ndarray:
    """Helper function to merge just two individual sounds.

    Params:
        base_audio: The target audio array to mix into.
        new_audio: The source audio array to add in.
        offset_samples: The offset in samples where new_audio should start.
        gain_db: Gain in decibels applied to new_audio before mixing.

    Returns:
        The combined audio array, clipped to the bounds of base_audio.
    """
    if offset_samples >= len(base_audio):
        return base_audio
    
    processed_new = apply_gain(new_audio, gain_db)
    
    # Determine absolute bounds in the base audio
    start = max(0, offset_samples) # if offset is negative, start at 0
    end = min(len(base_audio), offset_samples + len(processed_new))
    
    # Determine corresponding slice in the new audio
    new_start = 0 if offset_samples >= 0 else -offset_samples
    new_end = new_start + (end - start)
    
    # Ensure dimensions match for channels
    if base_audio.ndim != processed_new.ndim:
        if base_audio.ndim == 1 and processed_new.ndim == 2:
            processed_new = processed_new.mean(axis=1)
        elif base_audio.ndim == 2 and processed_new.ndim == 1:
            processed_new = np.tile(processed_new[:, np.newaxis], (1, base_audio.shape[1]))
    
    result = base_audio.copy()
    result[start:end] += processed_new[new_start:new_end]
    
    return result

def mix_audio(input_data: list, target_sr: int = 44100) -> np.ndarray:
    """Merges an arbitrary number of sounds.

    Params:
        input_data: Formatted input list starting with total sample length in seconds followed by (audio, offset_s, gain_db) tuples representing each track.
        target_sr: The target sample rate (default 44100).

    Returns:
        The fully mixed output audio array.
    """
    if not input_data or len(input_data) < 1:
        raise ValueError("input_data must contain at least a length component [length, ...]")
        
    length = input_data[0]
    tracks = input_data[1:]
    target_length_samples = int(length * target_sr)
    
    # Determine the number of channels by inspecting tracks, default to stereo
    channels = 2
    for track in tracks:
        audio = track[0]
        if audio.ndim > 2:
            channels = max(channels, audio.shape[1])
            
    if channels > 1:
        mixed_audio = np.zeros((target_length_samples, channels), dtype=np.float32)
    else:
        mixed_audio = np.zeros(target_length_samples, dtype=np.float32)

    for track in tracks:
        if len(track) == 3:
            audio, offset, gain = track
        else:
            raise ValueError("Tracks must be tuples of (audio, offset, gain)")
        
        # Up-mix mono to match channels if needed before passing to the base mixer
        if channels > 1 and audio.ndim == 1:
            audio = np.tile(audio[:, np.newaxis], (1, channels))

        offset_samples = int(offset * target_sr)
        mixed_audio = mix_two_sounds(mixed_audio, audio, offset_samples, gain)

    return mixed_audio

def main():
    """CLI wrapper to mix an arbitrary number of audio files."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--length", type=float, required=True, help="Total length of the mixed sample in seconds")
    parser.add_argument("--out", type=str, required=True, help="Output file path (e.g. out.wav)")
    parser.add_argument("--sr", type=int, default=44100, help="Target sample rate (default 44100)")
    parser.add_argument(
        "--track",
        action="append",
        nargs=3
    )

    args = parser.parse_args()

    if not args.track:
        print("Error: At least one --track must be specified.", file=sys.stderr)
        sys.exit(1)

    input_list = [args.length]
    
    for file_path, offset_str, gain_str in args.track:
        offset = float(offset_str)
        gain = float(gain_str)
        
        audio, sr = sf.read(file_path)
        
        # Resample in main if needed to ensure sample rates match before mixing
        if sr != args.sr:
            if audio.ndim > 1:
                audio = np.transpose(audio)
                audio = librosa.resample(audio, orig_sr=sr, target_sr=args.sr)
                audio = np.transpose(audio)
            else:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=args.sr)
        
        input_list.append((audio, offset, gain))

    mixed = mix_audio(input_list, target_sr=args.sr)
    
    sf.write(args.out, mixed, args.sr)

if __name__ == "__main__":
    main()
