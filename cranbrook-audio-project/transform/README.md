# Transform Modules

This folder contains the Doppler and SAF wrapper pieces used by the offline
pass-by pipeline.

## Build the SAF wrapper

```
cmake -S transform -B transform/build -DSAF_PERFORMANCE_LIB=SAF_USE_OPEN_BLAS_AND_LAPACKE
cmake --build transform/build
```

The shared library will be created as transform/build/libsaf_binaural.so. The Python
loader expects it in transform/build.

Notes:
- This build requires OpenBLAS and LAPACKE on the host system.
- `ffmpeg` must be installed and available on PATH to run the pipeline.
- To load SOFA HRTFs, keep SAF_ENABLE_SOFA_READER_MODULE enabled and 
	ensure libmysofa is available on your system.
- You can override SAF_PERFORMANCE_LIB with MKL or other supported backends.

## Python environment (uv)

From the repo root:

```
uv sync
```

Run the pipeline with:

```
uv run python transform/transform.py input.wav
```

See transform.main() for more CLI arguments.
