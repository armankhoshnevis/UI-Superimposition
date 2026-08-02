from pathlib import Path

import random
import numpy as np

import soundfile as sf


class noise_superimposition:
    """Select and load complete recordings from the HATCI NoRain dataset."""

    WINDOWS = (0, 1, 2, 3)
    VENTS = (0, 1, 2, 3, 4)
    SPEEDS = (0, 25, 45, 70)
    CHANNEL_NUMBERS = (1, 2)

    def __init__(self, path, fs=48000):
        """Create a loader for the NoRain dataset.

        Args:
            path: Path to the NoRain directory.
            fs: Expected sampling frequency of the selected recordings.
        """
        self._path = Path(path).expanduser().resolve()
        self._fs = int(fs)

    @property
    def path(self):
        """Return the resolved NoRain dataset root."""
        return self._path

    @property
    def fs(self):
        """Return the expected sampling frequency."""
        return self._fs

    def _validate_condition(self, speed, window, vent):
        """Validate a requested NoRain recording condition."""
        if window not in self.WINDOWS:
            raise ValueError(
                f"Unsupported window condition {window!r}. "
                f"Expected one of {self.WINDOWS}."
            )

        if vent not in self.VENTS:
            raise ValueError(
                f"Unsupported vent condition {vent!r}. "
                f"Expected one of {self.VENTS}."
            )

        if speed not in self.SPEEDS:
            raise ValueError(
                f"Unsupported speed condition {speed!r}. "
                f"Expected one of {self.SPEEDS}."
            )
    
    def _validate_channel(self, channel_number):
        """Validate a requested microphone channel."""
        if channel_number not in self.CHANNEL_NUMBERS:
            raise ValueError(
                f"Unsupported channel number {channel_number!r}. "
                f"Expected one of {self.CHANNEL_NUMBERS}."
            )
    
    def recording_path(self, speed, window, vent, channel_number):
        """Return a randomly selected WAV for a recording condition.

        Args:
            speed: Vehicle speed in MPH: 0, 25, 45, or 70.
            window: Window setup: 0, 1, 2, or 3.
            vent: Vent setup: 0, 1, 2, 3, or 4.
            channel_number: The microphone channel number to load (1, 2, 3, or 4).

        Returns:
            pathlib.Path: A randomly selected WAV path.

        Raises:
            ValueError: If the requested condition is unsupported.
            FileNotFoundError: If the condition directory or its WAV files
                are missing.
        """
        self._validate_condition(
            speed=speed,
            window=window,
            vent=vent,
        )
        self._validate_channel(channel_number)

        recording_directory = (
            self._path
            / f"Window_{window}"
            / f"Vent_{vent}"
            / f"{speed}_MPH"
            / f"Ch_Num_{channel_number}"
        )

        if not recording_directory.is_dir():
            raise FileNotFoundError(
                "Recording directory does not exist for "
                f"window={window}, vent={vent}, speed={speed}: "
                f"{recording_directory}"
            )

        wav_files = [
            file_path
            for file_path in recording_directory.glob("*.wav")
            if file_path.is_file()
        ]

        if not wav_files:
            raise FileNotFoundError(
                "No WAV files found for "
                f"window={window}, vent={vent}, speed={speed}: "
                f"{recording_directory}"
            )

        return random.choice(wav_files)

    def load_recording(self, speed, window, vent, channel_number):
        """Load a random channel WAV for a recording condition.

        The returned audio always has shape ``(samples, 1)``.
        The available NoRain Ch_Num_1 recordings are expected 
        to be mono and sampled at 48 kHz.

        Args:
            speed: Vehicle speed in MPH: 0, 25, 45, or 70.
            window: Window setup: 0, 1, 2, or 3.
            vent: Vent setup: 0, 1, 2, 3, or 4.
            channel_number: The microphone channel number to load (1, 2, 3, or 4).

        Returns:
            tuple:
                audio: float32 array with shape ``(samples, 1)``.
                selected_path: pathlib.Path of the loaded WAV.

        Raises:
            ValueError: If the selected WAV has an unexpected sample rate or
                is not mono.
            RuntimeError: If the selected WAV contains no samples.
        """
        selected_path = self.recording_path(
            speed=speed,
            window=window,
            vent=vent,
            channel_number=channel_number,
        )

        audio, source_fs = sf.read(
            selected_path,
            dtype="float32",
            always_2d=True,
        )

        if source_fs != self.fs:
            raise ValueError(
                f"Unexpected sample rate in {selected_path}: "
                f"expected {self.fs} Hz, found {source_fs} Hz."
            )
        
        if audio.shape[1] != 1:
            raise ValueError(
                f"Expected a mono Ch_Num_{channel_number} WAV, "
                f"but {selected_path} contains {audio.shape[1]} channels."
            )
        
        if audio.shape[0] == 0:
            raise RuntimeError(
                f"Selected recording contains no audio samples: {selected_path}"
            )
        
        return audio, selected_path
    
    @classmethod
    def match_duration(cls, audio_list, crossfade_seconds, fs):
        """Match mono recordings to the duration of the first recording.

        Every input must have the (samples, 1) shape. Longer recordings
        are truncated. Shorter recordings are looped using a specified
        (default: one-second) sine/cosine crossfade.

        Args:
            audio_list: Sequence of mono arrays with shape (samples, 1).
            crossfade_seconds: The duration of the crossfade in seconds.
            fs: Sampling frequency in Hz.

        Returns:
            list[numpy.ndarray]: Mono arrays with matching (samples, 1) shapes.
        """

        audio_list = list(audio_list)

        for audio in audio_list:
            if audio.ndim != 2 or audio.shape[1] != 1:
                raise ValueError(
                    "All audio components must be mono arrays with shape "
                    f"(samples, 1); found {audio.shape}."
                )
            
            if audio.shape[0] == 0:
                raise ValueError("Audio components cannot be empty.")
        
        if len(audio_list) == 1:
            return [audio_list[0].copy()]
        
        def create_sine_cosine_masks(period):
            f = 1 / period
            samples = np.arange(period * fs) / fs

            sine = np.sin(2 * np.pi * f * samples)
            cosine = np.cos(2 * np.pi * f * samples)

            quarter_period = int(len(samples) / 4)

            return (sine[:quarter_period], cosine[:quarter_period])
        
        def match_mono_channel(audio, crossfade_seconds, reference_len):
            """Match one one-dimensional mono signal to reference_len."""
            if len(audio) >= reference_len:
                return audio[:reference_len].copy()
            
            crossfade_samples = int(crossfade_seconds * fs)

            # Very short recordings cannot support the crossfade duration cycle.
            if len(audio) <= 2 * crossfade_samples:
                repeats = int(np.ceil(reference_len / len(audio)))
                return np.tile(audio,repeats)[:reference_len]
            
            sine, cosine = create_sine_cosine_masks(4 * crossfade_seconds)

            start = audio[:crossfade_samples]
            middle = audio[crossfade_samples : len(audio) - crossfade_samples]
            end = audio[-crossfade_samples:]

            crossfade = start * sine + end * cosine

            result = np.concatenate((start, middle, crossfade))

            while len(result) < reference_len:
                result = np.concatenate((result, middle))

                if len(result) + len(crossfade) > reference_len:
                    result = np.concatenate((result, end))
                else:
                    result = np.concatenate((result, crossfade))
            
            return result[:reference_len]
        
        reference_len = audio_list[0].shape[0]
        matched_audio = [audio_list[0][:reference_len].copy()]

        for audio in audio_list[1:]:
            # Convert (samples, 1) to (samples,) for the original mono algorithm.
            mono_channel = audio[:, 0]

            matched_channel = match_mono_channel(
                crossfade_seconds=crossfade_seconds,
                audio=mono_channel,
                reference_len=reference_len,
            )

            # Restore the project-wide (samples, 1) representation.
            matched_audio.append(
                matched_channel[:, np.newaxis].astype(
                    audio.dtype,
                    copy=False,
                )
            )
        
        return matched_audio

    def superimpose_recordings(self, speed, window, vent, crossfade_seconds=1.0):
        """Super-impose recordings for a requested speed, window, and vent condition.

        One microphone channel is selected randomly per generated output. The same
        channel is used for every component of the output.

        For a stationary condition, the corresponding stationary recording is 
        returned directly.

        For a moving condition with vent 0, the corresponding moving recording 
        is returned directly.

        For a moving condition with an active vent, the output is:
        + moving(speed, window, vent=0)
        + stationary(0, window, vent)
        - stationary(0, window, vent=0)

        All stationary components are matched to the duration of the moving
        recording before the arithmetic is performed.

        Args:
            speed: Requested speed: 0, 25, 45, or 70.
            window: Requested window condition: 0, 1, 2, or 3.
            vent: Requested vent condition: 0, 1, 2, 3, or 4.
            crossfade_seconds: Crossfade duration in seconds when looping
                shorter recordings.
        
        Returns:
            tuple:
                audio: Resulting float32 audio with shape ``(samples, 1)``.
                selected_sources: Dictionary containing the selected channel
                    and source WAV paths.
        """
        self._validate_condition(speed=speed, window=window, vent=vent)

        channel_number = random.choice(self.CHANNEL_NUMBERS)
        
        # The requested condition is already stationary.
        if speed == 0:
            stationary, stationary_path = self.load_recording(
                speed=speed,
                window=window,
                vent=vent,
                channel_number=channel_number
            )

            selected_sources = {
                "channel_number": channel_number,
                "moving": None,
                "stationary": stationary_path,
                "stationary_baseline": None,
            }

            return stationary, selected_sources
        
        # Every moving reconstruction starts with the moving Vent-0 recording.
        moving_vent0, moving_vent0_path = self.load_recording(
            speed=speed,
            window=window,
            vent=0,
            channel_number=channel_number,
        )

        # No stationary component is needed for moving Vent-0 recordings.
        if vent == 0:
            selected_sources = {
                "channel_number": channel_number,
                "moving": moving_vent0_path,
                "stationary": None,
                "stationary_baseline": None,
            }
            
            return moving_vent0, selected_sources
        
        # Load the stationary recording containing the requested vent.
        stationary_vent, stationary_vent_path = self.load_recording(
            speed=0,
            window=window,
            vent=vent,
            channel_number=channel_number,
        )

        # Load the stationary baseline recording containing vent 0.
        stationary_vent0, stationary_vent0_path = self.load_recording(
                speed=0,
                window=window,
                vent=0,
                channel_number=channel_number,
            )
        
        (moving_vent0, stationary_vent, stationary_vent0) = self.match_duration(
            audio_list=[moving_vent0, stationary_vent, stationary_vent0],
            crossfade_seconds=crossfade_seconds,
            fs=self.fs,
        )

        superimposed_audio = (
            + moving_vent0
            + stationary_vent
            - stationary_vent0
        )

        if not np.all(np.isfinite(superimposed_audio)):
            raise RuntimeError(
                "Superimposed audio contains NaN or infinite values."
            )
        
        selected_sources = {
            "channel_number": channel_number,
            "moving": (
                moving_vent0_path
                if moving_vent0_path is not None
                else None
            ),
            "stationary": (
                stationary_vent_path
                if stationary_vent_path is not None
                else None
            ),
            "stationary_baseline": (
                stationary_vent0_path
                if stationary_vent0_path is not None
                else None
            ),
        }
        
        return (
            superimposed_audio.astype(np.float32, copy=False),
            selected_sources,
        )