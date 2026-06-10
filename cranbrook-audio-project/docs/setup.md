# Setup

This repo uses uv for Python dependencies and CMake for the SAF wrapper.


## Docker (Recommended)

Build:

```
docker compose build
```

Run:

```
docker compose run --rm hatci-audio-mixer
```

Inside the container:

```
uv run python transform/transform.py path/to/input.wav
uv run python augment/augment.py path/to/input.wav
```

## Linux (Ubuntu/Debian)

Run:

```
./scripts/setup_ubuntu.sh
uv sync
cmake -S transform -B transform/build -DSAF_PERFORMANCE_LIB=SAF_USE_OPEN_BLAS_AND_LAPACKE
cmake --build transform/build
```

## Linux (Arch)

Run:

```
./scripts/setup_arch.sh
uv sync
cmake -S transform -B transform/build -DSAF_PERFORMANCE_LIB=SAF_USE_OPEN_BLAS_AND_LAPACKE
cmake --build transform/build
```

## Windows

Run:

```
./scripts/setup_windows.ps1
```

OpenBLAS and LAPACKE must be manually installed system-wide.
See https://github.com/OpenMathLib/OpenBLAS,
    https://github.com/Reference-LAPACK/lapack

Then,

```
cmake -S transform -B transform/build -DSAF_PERFORMANCE_LIB=SAF_USE_OPEN_BLAS_AND_LAPACKE
cmake --build transform/build
```

Notes:
- This script must be run from an elevated PowerShell.
- Install winget (App Installer) before running the script.
- Use Docker or WSL for the most reliable setup.
