/*
 * Provides a wrapper API for the SAF binauraliser library.
 * File created by asterisk727 on 2026-05-13.
*/

#ifndef SAF_BINAURAL_H
#define SAF_BINAURAL_H

#ifdef __cplusplus
extern "C" {
#endif

typedef struct saf_binaural saf_binaural;

// Create a SAF binauraliser instance.
// sample_rate: Sampling rate in Hz (see SAF binauraliser documentation).
// block_size: Frame size in samples; must match SAF binauraliser frame size.
saf_binaural* saf_create(int sample_rate, int block_size);

// Configure the HRTF set.
// hrtf_path: Path to a SOFA file; NULL or empty uses SAF default HRIRs.
// See SAF binauraliser SOFA/HRIR documentation for supported formats.
void saf_set_hrtf(saf_binaural* h, const char* hrtf_path);

// Set the source position for the single source.
// az_deg: Azimuth in degrees; see SAF coordinate conventions.
// el_deg: Elevation in degrees; see SAF coordinate conventions.
// dist_m: Distance in meters; retained for SAF API parity.
void saf_set_source_pos(saf_binaural* h, float az_deg, float el_deg, float dist_m);

// Process a single block of audio.
// in_mono: Pointer to mono input samples (length nframes).
// out_left/out_right: Output buffers for stereo samples (length nframes).
// nframes: Block size; must match SAF frame size.
void saf_process(
    saf_binaural* h,
    const float* in_mono,
    float* out_left,
    float* out_right,
    int nframes
);

void saf_destroy(saf_binaural* h);

#ifdef __cplusplus
}
#endif

#endif
