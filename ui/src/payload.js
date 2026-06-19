// ui/src/payload.js
// Builds the request body for POST /generate (and the `parameters` block in
// preset/export JSON). Maps the UI's internal state to the schema the backend
// team specified:
//
//   {
//     driving: 0|1|2|3,
//     window:  0|1|2|3,
//     venting: 0|1|2|3,
//     overlays: [{ name, gain?, offset?, location?, velocity? }, ...]
//   }
//
// Spatial conventions (pending backend confirmation):
//   - Coordinates are in meters with origin at cabin center.
//   - +x = forward (toward FRONT of the car).
//   - +y = right (passenger side on left-hand-drive markets).
//   - +z = up (above cabin floor).
//   - Velocity is m/s in the same frame.
//
// The UI has no controls for offset/velocity/Z — those come from per-sound
// defaults in sound_library.js so the catalog is the single source of truth.

import { getSoundById, getDirection } from './sound_library'
import { getCarModel } from './car_models'

const MPH_TO_MPS = 0.44704

// Approximate cabin physical dimensions (GV80-class). Used to translate
// CarView pixel placements into meters. Backend can rescale if they need a
// precise mapping per vehicle.
const CABIN_LEN_M = 3.0
const CABIN_WID_M = 1.6

// Lateral distance from cabin center where external_directional sources
// spawn (just outside the cabin wall).
const EXT_SOURCE_OFFSET_M = 2.4

// Bucket mph into driving 0..3, matching SpeedSlider's mphToSpeedState
// thresholds (0=at rest, 1=residential, 2=normal, 3=highway).
function mphToDriving(mph) {
  if (!mph || mph <= 20) return 0
  if (mph <= 40) return 1
  if (mph <= 60) return 2
  return 3
}

// CarView stores internal-point positions as PNG-pixel coords `[px, py]`.
// Pixel y grows toward the rear, so invert to get a forward-positive x.
function projectCabinPosition(positionPx, model) {
  if (!positionPx || !model?.cabin) return null
  const cabin = model.cabin
  const [px, py] = positionPx
  const cx = cabin.x + cabin.w / 2
  const cy = cabin.y + cabin.h / 2
  const x = -(py - cy) / cabin.h * CABIN_LEN_M
  const y =  (px - cx) / cabin.w * CABIN_WID_M
  return { x, y }
}

function buildOverlay(source, ctx) {
  const sound = getSoundById(source.sound_id)
  if (!sound) return null

  const overlay = {
    name: source.sound_id,
    gain: source.gain_db,
  }

  const offset = source.offset_sec ?? sound.default_offset
  if (offset) overlay.offset = offset

  if (source.category === 'internal_point') {
    const xy = projectCabinPosition(source.position, ctx.model)
    if (xy) overlay.location = { ...xy, z: sound.default_z ?? 0 }
  } else if (source.category === 'external_directional') {
    const dir = getDirection(source.direction)
    if (dir) {
      const yLoc = dir.side === 'right' ? EXT_SOURCE_OFFSET_M : -EXT_SOURCE_OFFSET_M
      overlay.location = { x: 0, y: yLoc, z: sound.default_z ?? 0 }

      const speed = sound.default_speed_mps ?? 0
      // sign === 0 → "same speed as car": source tracks the car at car speed.
      // sign === +1 (with traffic) → forward in car frame.
      // sign === -1 (against traffic) → backward.
      const vx = dir.sign === 0
        ? (ctx.speedMph || 0) * MPH_TO_MPS
        : dir.sign * speed
      overlay.velocity = { x: vx, y: 0, z: 0 }
    }
  }
  // Global sounds: only name + gain.

  return overlay
}

export function buildGeneratePayload(config) {
  const sources = config?.sound_sources || []
  const model = getCarModel(config?.car_model || 'gv80')
  const ctx = { model, speedMph: config?.speed_mph || 0 }

  const overlays = []
  for (const s of sources) {
    if (s.muted) continue
    const o = buildOverlay(s, ctx)
    if (o) overlays.push(o)
  }

  return {
    driving: mphToDriving(config?.speed_mph),
    window:  config?.window_openness ?? 0,
    venting: config?.vent_openness ?? 0,
    overlays,
  }
}
