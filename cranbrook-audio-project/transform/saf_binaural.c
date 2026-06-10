/*
 * Implements saf_binaural.h.
 * File created by asterisk727 on 2026-05-13.
*/

#include "saf_binaural.h"

#include <stdlib.h>
#include "binauraliser.h"

typedef struct saf_binaural {
        void* hBin;
        int sample_rate;
        int block_size;
        int frame_size;
        float az_deg;
        float el_deg;
        float dist_m;
} saf_binaural;

saf_binaural* saf_create(int sample_rate, int block_size) {
    saf_binaural* h = (saf_binaural*)calloc(1, sizeof(saf_binaural));
    if (!h) {
        return NULL;
    }
    h->sample_rate = sample_rate;
    h->block_size = block_size;
    h->dist_m = 1.0f;

    binauraliser_create(&(h->hBin));
    if (!h->hBin) {
        free(h);
        return NULL;
    }

    h->frame_size = binauraliser_getFrameSize();
    if (block_size != h->frame_size) {
        binauraliser_destroy(&(h->hBin));
        free(h);
        return NULL;
    }

    binauraliser_setInputConfigPreset(h->hBin, SOURCE_CONFIG_PRESET_MONO);
    binauraliser_setNumSources(h->hBin, 1);
    binauraliser_setEnableRotation(h->hBin, 0);
    binauraliser_setEnableHRIRsDiffuseEQ(h->hBin, 1);
    binauraliser_setSourceAzi_deg(h->hBin, 0, 0.0f);
    binauraliser_setSourceElev_deg(h->hBin, 0, 0.0f);

    binauraliser_init(h->hBin, sample_rate);
    binauraliser_initCodec(h->hBin);
    return h;
}

void saf_set_hrtf(saf_binaural* h, const char* hrtf_path) {
    if (!h) {
        return;
    }

    if (hrtf_path == NULL || hrtf_path[0] == '\0') {
        binauraliser_setUseDefaultHRIRsflag(h->hBin, 1);
    } else {
        binauraliser_setSofaFilePath(h->hBin, hrtf_path);
    }
    binauraliser_initCodec(h->hBin);
}

void saf_set_source_pos(saf_binaural* h, float az_deg, float el_deg, float dist_m) {
    if (!h) {
        return;
    }
    h->az_deg = az_deg;
    h->el_deg = el_deg;
    h->dist_m = dist_m;
    binauraliser_setSourceAzi_deg(h->hBin, 0, az_deg);
    binauraliser_setSourceElev_deg(h->hBin, 0, el_deg);
}

void saf_process(
    saf_binaural* h,
    const float* in_mono,
    float* out_left,
    float* out_right,
    int nframes
) {
    if (!h || !in_mono || !out_left || !out_right || nframes <= 0) {
        return;
    }

    if (nframes != h->frame_size) {
        return;
    }

    {
        const float* inputs[1] = { in_mono };
        float* outputs[2] = { out_left, out_right };
        binauraliser_process(h->hBin, inputs, outputs, 1, 2, nframes);
    }
}

void saf_destroy(saf_binaural* h) {
    if (!h) {
        return;
    }
    if (h->hBin) {
        binauraliser_destroy(&(h->hBin));
    }
    free(h);
}
