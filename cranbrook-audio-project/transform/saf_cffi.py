"""
CFFI loader for the C/C++ SAF binaural wrapper library.
File created by asterisk727 on 2026-05-13.
"""

from __future__ import annotations

from pathlib import Path

from cffi import FFI


_CDEF = """
    typedef struct saf_binaural saf_binaural;

    saf_binaural* saf_create(int sample_rate, int block_size);
    void saf_set_hrtf(saf_binaural* h, const char* hrtf_path);
    void saf_set_source_pos(saf_binaural* h, float az_deg, float el_deg, float dist_m);

    void saf_process(
        saf_binaural* h,
        const float* in_mono,
        float* out_left,
        float* out_right,
        int nframes
    );

    void saf_destroy(saf_binaural* h);
"""


def load_library() -> tuple[FFI, object]:
    ffi = FFI()
    ffi.cdef(_CDEF)

    lib_path = Path(__file__).resolve().parent / "build" / "libsaf_binaural.so"
    if not lib_path.exists():
        raise FileNotFoundError(
            "Could not find libsaf_binaural.so. Build the library in transform/build."
        )
    lib = ffi.dlopen(str(lib_path))
    return ffi, lib
