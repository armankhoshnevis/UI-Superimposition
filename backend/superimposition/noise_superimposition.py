from pathlib import Path

import soundfile as sf


class noise_superimposition:
    """Select and load complete recordings from the HATCI NoRain dataset."""

    WINDOWS = (0, 1, 2, 3)
    VENTS = (0, 1, 2, 3, 4)
    SPEEDS = (0, 25, 45, 70)

    # For the current integration, only the first microphone channel is used.
    CHANNEL_NUMBER = 1

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

    def recording_path(self, speed, window, vent):
        """Return the first WAV for a requested recording condition.

        Files are sorted by filename before the first one is selected. This
        makes selection deterministic when a Ch_Num_1 directory contains more
        than one WAV.

        Args:
            speed: Vehicle speed in MPH: 0, 25, 45, or 70.
            window: Window setup: 0, 1, 2, or 3.
            vent: Vent setup: 0, 1, 2, 3, or 4.

        Returns:
            pathlib.Path: The selected Ch_Num_1 WAV path.

        Raises:
            ValueError: If a requested condition is unsupported.
            FileNotFoundError: If the condition directory or its WAV files
                are missing.
        """
        self._validate_condition(
            speed=speed,
            window=window,
            vent=vent,
        )

        recording_directory = (
            self._path
            / f"Window_{window}"
            / f"Vent_{vent}"
            / f"{speed}_MPH"
            / f"Ch_Num_{self.CHANNEL_NUMBER}"
        )

        if not recording_directory.is_dir():
            raise FileNotFoundError(
                "Recording directory does not exist for "
                f"window={window}, vent={vent}, speed={speed}: "
                f"{recording_directory}"
            )

        wav_files = sorted(
            (
                file_path
                for file_path in recording_directory.glob("*.wav")
                if file_path.is_file()
            ),
            key=lambda file_path: file_path.name,
        )

        if not wav_files:
            raise FileNotFoundError(
                "No WAV files found for "
                f"window={window}, vent={vent}, speed={speed}: "
                f"{recording_directory}"
            )

        return wav_files[0]

    def load_recording(self, speed, window, vent):
        """Load the first Ch_Num_1 WAV for a recording condition.

        The returned audio always has shape ``(samples, 1)``.
        The available NoRain Ch_Num_1 recordings are expected 
        to be mono and sampled at 48 kHz.

        Args:
            speed: Vehicle speed in MPH: 0, 25, 45, or 70.
            window: Window setup: 0, 1, 2, or 3.
            vent: Vent setup: 0, 1, 2, 3, or 4.

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
                f"Expected a mono Ch_Num_{self.CHANNEL_NUMBER} WAV, "
                f"but {selected_path} contains {audio.shape[1]} channels."
            )

        if audio.shape[0] == 0:
            raise RuntimeError(
                f"Selected recording contains no audio samples: {selected_path}"
            )

        return audio, selected_path