// ui/src/sound_library.js
// Canonical catalog of sounds available in the Add Sound modal.
//
// Three categories:
//   - global               : ambient sounds affecting the whole scene
//   - internal_point       : sounds placed at a specific point inside the cabin
//   - external_directional : moving sounds passing the car from a chosen direction
import {
  CloudRain, CloudHail, Wind, CloudLightning, Snowflake,
  Baby, MessageSquare, Phone, Music, Coughing,
  Car, Siren, Bike, Truck, HardHat,
} from './icons.jsx'

export const CATEGORIES = {
  global: {
    id: 'global',
    label: 'Global Ambient',
    blurb: 'Affects the whole scene',
  },
  internal_point: {
    id: 'internal_point',
    label: 'Internal Point',
    blurb: 'Place inside the cabin',
  },
  external_directional: {
    id: 'external_directional',
    label: 'External Directional',
    blurb: 'Movement near car',
  },
}

// sign === +1 -> motion runs with traffic (same direction as the car = toward
//                FRONT = arrow UP on screen, because the car faces up on the view).
// sign === -1 -> motion runs against traffic (oncoming = toward REAR = arrow DOWN).
// Order matters: rendered into a 2-column grid, left options on the left.
// sign === 0 -> matches the car's speed; no directional arrow is drawn.
export const DIRECTIONS = [
  { id: 'left_with',     label: 'Left, with traffic',         side: 'left',  sign: +1 },
  { id: 'right_with',    label: 'Right, with traffic',        side: 'right', sign: +1 },
  { id: 'left_against',  label: 'Left, against traffic',      side: 'left',  sign: -1 },
  { id: 'right_against', label: 'Right, against traffic',     side: 'right', sign: -1 },
  { id: 'left_same',     label: 'Left, same speed as car',    side: 'left',  sign:  0 },
  { id: 'right_same',    label: 'Right, same speed as car',   side: 'right', sign:  0 },
]

// Two-step direction picker: side first, then motion. Combined as `${side}_${motion}`.
export const DIRECTION_SIDES = [
  { id: 'left',  label: 'Left'  },
  { id: 'right', label: 'Right' },
]

export const DIRECTION_MOTIONS = [
  { id: 'with',    label: 'With traffic'    },
  { id: 'against', label: 'Against traffic' },
  { id: 'same',    label: 'Same speed as car' },
]

// Per-sound defaults for the new backend `/generate` schema:
//   - default_z (m)         vertical position relative to cabin floor.
//                           Used for internal_point + external_directional.
//   - default_speed_mps     magnitude of the velocity vector for moving
//                           external sources; combined with the direction
//                           picker (side + sign) at payload time.
//   - default_offset (s)    start-time offset; omitted from payload when 0.
// Global sounds carry no spatial defaults — they're ambient and the schema
// only needs name + gain for them.
export const SOUNDS = [
  // Global
  { id: 'rain',    label: 'Rain',    category: 'global', Icon: CloudRain,      default_gain_db: -6 },
  { id: 'hail',    label: 'Hail',    category: 'global', Icon: CloudHail,      default_gain_db: -4 },
  { id: 'wind',    label: 'Wind',    category: 'global', Icon: Wind,           default_gain_db: -8 },
  { id: 'thunder', label: 'Thunder', category: 'global', Icon: CloudLightning, default_gain_db: -3 },
  { id: 'snow',    label: 'Snow',    category: 'global', Icon: Snowflake,      default_gain_db: -12 },

  // Internal point — Z is the height above cabin floor of the apparent source.
  { id: 'baby_crying',    label: 'Baby Crying',    category: 'internal_point', Icon: Baby,          default_gain_db: -6,  default_z: 0.5 },
  { id: 'people_talking', label: 'People Talking', category: 'internal_point', Icon: MessageSquare, default_gain_db: -9,  default_z: 1.0 },
  { id: 'phone_ringing',  label: 'Phone Ringing',  category: 'internal_point', Icon: Phone,         default_gain_db: -10, default_z: 0.8 },
  { id: 'music',          label: 'Music',          category: 'internal_point', Icon: Music,         default_gain_db: -12, default_z: 0.6 },
  { id: 'coughing',       label: 'Coughing',       category: 'internal_point', Icon: Coughing,      default_gain_db: -10, default_z: 1.0 },

  // External directional — default_speed_mps is the source's own speed; the
  // direction picker decides whether it moves with or against the car.
  { id: 'car_passing',     label: 'Car Passing',     category: 'external_directional', Icon: Car,     default_gain_db: -8, default_speed_mps: 25, default_z: 0.5 },
  { id: 'emergency_siren', label: 'Emergency Siren', category: 'external_directional', Icon: Siren,   default_gain_db: -4, default_speed_mps: 20, default_z: 1.2 },
  { id: 'motorcycle',      label: 'Motorcycle',      category: 'external_directional', Icon: Bike,    default_gain_db: -6, default_speed_mps: 30, default_z: 0.8 },
  { id: 'truck_horn',      label: 'Truck Horn',      category: 'external_directional', Icon: Truck,   default_gain_db: -3, default_speed_mps: 22, default_z: 1.8 },
  // Construction is stationary — speed 0 makes the velocity vector zero
  // regardless of direction sign.
  { id: 'construction',    label: 'Construction',    category: 'external_directional', Icon: HardHat, default_gain_db: -7, default_speed_mps:  0, default_z: 0.5 },
]

export function getSoundsByCategory(catId) {
  return SOUNDS.filter(s => s.category === catId)
}

export function getSoundById(id) {
  return SOUNDS.find(s => s.id === id) || null
}

export function getDirection(id) {
  return DIRECTIONS.find(d => d.id === id) || null
}
