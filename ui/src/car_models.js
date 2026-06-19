// ui/src/car_models.js
// Registry of supported Genesis vehicle models for the sound scene.
//
// All coordinates below are in **PNG-pixel space** for that specific image:
//   - `imageW`/`imageH`        native PNG dimensions
//   - `contentRect`            silhouette bbox in PNG pixels (defines the
//                              SVG viewBox via getViewBox)
//   - `cabin`                  cabin-wall bbox in PNG pixels (where windows
//                              live; used to re-anchor placed sound sources
//                              when the user switches models)
//   - `windows`, `mics`        absolute PNG-pixel coordinates
//
// Values were measured by scanning every pixel of each PNG:
//   GV80  908x1731  cabin walls at PNG x = 162 / 756
//   GV60  996x1578  cabin walls at PNG x = 217 / 810
// Door / seat y-coordinates are visual estimates that we can nudge in raw
// PNG pixels (e.g. cy: 700 → cy: 740) without any normalization math.

import gv80Img from './assets/gv80_top_down_transparent_rotated_right.png'
import gv60Img from './assets/gv60_top_down_transparent_rotated_right.png'

// Padding added to each side of the silhouette bbox to leave room for the
// FRONT / REAR labels above/below, the global-sound chips that sit above
// the car (~130px above contentRect), and the external-directional arrows
// on the sides (centered ~100px outside contentRect with a 42px radius).
// Same for every model.
export const VIEW_PAD = { x: 170, top: 270, bottom: 110 }

export const CAR_MODELS = {
  gv80: {
    id: 'gv80',
    name: 'Genesis GV80',
    subtitle: '3-row SUV',
    image: gv80Img,
    imageW: 908,
    imageH: 1731,
    contentRect: { x: 105, y:  79, w: 705, h: 1590 },
    cabin:       { x: 162, y: 173, w: 594, h: 1298 },
    windows: [
      // Front-row doors sit below the wing-mirror band (mirrors at y≈606).
      { id: 'FL', cx: 178, cy:  790, rx: 18, ry: 78 },
      { id: 'FR', cx: 740, cy:  790, rx: 18, ry: 78 },
      // Second-row doors.
      { id: 'RL', cx: 178, cy: 1090, rx: 18, ry: 78 },
      { id: 'RR', cx: 740, cy: 1090, rx: 18, ry: 78 },
    ],
    mics: [
      { id: 'mic1', x: 430, y:  540 },
      { id: 'mic2', x: 488, y:  540 },
      { id: 'mic3', x: 375, y: 860 },
      { id: 'mic4', x: 543, y: 860 },
    ],
    vents: [
      // Front dash (3 across, just below windshield band)
      { id: 'V_FL', x: 270, y:  615 },
      { id: 'V_FM', x: 459, y:  615 },
      { id: 'V_FR', x: 638, y:  615 },
      // Middle row, center panel (between front seats, facing rear)
      { id: 'V_ML', x: 430, y:  950 },
      { id: 'V_MR', x: 488, y:  950 },
      // Rear side walls (third row / cargo area)
      { id: 'V_RL', x: 180, y: 1340 },
      { id: 'V_RR', x: 738, y: 1340 },
    ],
  },
  gv60: {
    id: 'gv60',
    name: 'Genesis GV60',
    subtitle: 'Crossover',
    image: gv60Img,
    imageW: 996,
    imageH: 1578,
    contentRect: { x: 149, y:  76, w: 729, h: 1395 },
    cabin:       { x: 217, y: 237, w: 593, h: 1184 },
    windows: [
      // Front-row doors sit below the wing-mirror band (mirrors at y≈552).
      { id: 'FL', cx: 232, cy:  720, rx: 18, ry: 78 },
      { id: 'FR', cx: 795, cy:  720, rx: 18, ry: 78 },
      // Rear-row doors (2-row crossover).
      { id: 'RL', cx: 232, cy:  990, rx: 18, ry: 72 },
      { id: 'RR', cx: 795, cy:  990, rx: 18, ry: 72 },
    ],
    mics: [
      { id: 'mic1', x: 380, y:  700 },
      { id: 'mic2', x: 648, y:  700 },
      { id: 'mic3', x: 380, y:  980 },
      { id: 'mic4', x: 648, y:  980 },
    ],
    vents: [
      // Front dash (3 across, just below wing-mirror band)
      { id: 'V_FL', x: 318, y:  565 },
      { id: 'V_FM', x: 513, y:  565 },
      { id: 'V_FR', x: 708, y:  565 },
      // Middle row, center panel (between front seats, facing rear)
      { id: 'V_ML', x: 484, y:  840 },
      { id: 'V_MR', x: 542, y:  840 },
    ],
  },
}

export function getCarModel(id) {
  return CAR_MODELS[id] || CAR_MODELS.gv80
}

export function getViewBox(model) {
  const cr = model.contentRect
  return {
    x: cr.x - VIEW_PAD.x,
    y: cr.y - VIEW_PAD.top,
    w: cr.w + 2 * VIEW_PAD.x,
    h: cr.h + VIEW_PAD.top + VIEW_PAD.bottom,
  }
}
