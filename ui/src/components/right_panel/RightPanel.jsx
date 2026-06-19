// ui/src/components/right_panel/RightPanel.jsx
import SoundMixer from './SoundMixer'
import { Activity, Volume2, Shield, Mic } from '../../icons.jsx'

function levelNum(s) { return Number(String(s).slice(1)) || 0 }

// Each mixer slider runs -24 (silent) → 0 (max). Convert to a 0..1 weight.
function mixerWeight(value) {
  if (value == null) return 0
  return (Math.max(-24, Math.min(0, value)) + 24) / 24
}

// Per-sound acoustic weights (cabinNoise gain at 0 dB). Falls back to the
// category default when a sound_id isn't listed.
const CATEGORY_WEIGHTS = {
  global: {
    rain: 6, hail: 5, wind: 8, thunder: 4, snow: 2,
    _default: 4,
  },
  internal_point: {
    baby_crying: 3, people_talking: 1, phone_ringing: 2, music: 2, coughing: 1,
    _default: 1,
  },
  external_directional: {
    car_passing: 4, emergency_siren: 6, motorcycle: 5, truck_horn: 5, construction: 4,
    _default: 4,
  },
}

function entryWeight(entry) {
  const cat = CATEGORY_WEIGHTS[entry.category] || {}
  if (entry.sound_id in cat) return cat[entry.sound_id]
  return cat._default ?? 2
}

function deriveMetrics(config) {
  const s = levelNum(config.speed_state)
  const w = levelNum(config.window_state)
  const sources = (config.sound_sources || []).filter(x => !x.muted)

  // Total weighted acoustic load from active sources.
  const acoustic = sources.reduce(
    (sum, e) => sum + entryWeight(e) * mixerWeight(e.gain_db), 0)

  // Cabin noise = baseline + speed (engine/wind) + windows (wind ingress) + active sources.
  const cabinNoise = Math.round(45 + s * 4 + w * 2.5 + acoustic)

  // Stress: speed + window + a smaller acoustic contribution + a per-internal bump
  // (in-cabin sounds annoy occupants more than the same dBA of road noise).
  const internalCount = sources.filter(e => e.category === 'internal_point').length
  const stressRaw =
      s * 1.2
    + w * 0.8
    + acoustic * 0.12
    + internalCount * 0.4
  const stress = Math.min(10, Math.round(stressRaw * 10) / 10)

  // Masking: heavily driven by internal-cabin sounds competing with foreground speech.
  const internalMask = sources
    .filter(e => e.category === 'internal_point')
    .reduce((sum, e) => sum + mixerWeight(e.gain_db), 0)
  let masking = 'Low'
  if (cabinNoise >= 70 || internalMask >= 2.5 || sources.length >= 4) masking = 'High'
  else if (cabinNoise >= 58 || internalMask >= 1.2 || sources.length >= 2) masking = 'Medium'

  const asrImpact = -Math.round(((cabinNoise - 45) * 0.12 + acoustic * 0.05) * 10) / 10

  return { cabinNoise, stress, masking, asrImpact }
}

function Dots({ value, max = 10, color = 'var(--navy)' }) {
  const filled = Math.round((value / max) * 10)
  return (
    <div style={{
      display: 'flex', gap: 2, marginTop: 4,
      // never let the dot row push the card wider than its grid cell
      width: '100%', overflow: 'hidden',
    }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} style={{
          flex: '1 1 0', minWidth: 0,
          height: 6, borderRadius: '50%',
          background: i < filled ? color : 'var(--border)',
        }} />
      ))}
    </div>
  )
}

function MetricCard({ Icon, label, value, dots, dotColor }) {
  const accent = dotColor || 'var(--navy)'
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 6,
      padding: '8px 10px', background: 'var(--card-bg)',
      minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: 'var(--text-muted)', marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {Icon && (
          <Icon size={13} color={accent} strokeWidth={1.8} />
        )}
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 600, color: 'var(--navy)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
      <Dots value={dots} color={accent} />
    </div>
  )
}

export default function RightPanel({
  config, setConfig, onAddSound,
  hover, setHover,
}) {
  const m = deriveMetrics(config)
  const maskingDots = m.masking === 'High' ? 9 : m.masking === 'Medium' ? 6 : 3
  const maskingColor = m.masking === 'High' ? 'var(--red)' : m.masking === 'Medium' ? 'var(--orange)' : 'var(--green)'
  const asrDots = Math.min(10, Math.abs(m.asrImpact) * 2)
  const activeLabels = (config.sound_sources || [])
    .filter(s => !s.muted)
    .map(s => s.label)
    .join(', ')

  return (
    <div>
      <div className="panel">
        <h3>Current State</h3>
        <div style={{
          fontSize: 18, fontWeight: 600, color: 'var(--navy)',
          textAlign: 'center', padding: '8px 0',
        }}>
          {config.speed_state} / {config.window_state}
        </div>
        <div style={{fontSize: 11, color: 'var(--text-muted)', textAlign:'center', marginBottom: 12}}>
          {activeLabels || 'no sounds'}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 6,
        }}>
          <MetricCard Icon={Activity} label="Stress Level" value={`${m.stress.toFixed(1)} / 10`} dots={m.stress} />
          <MetricCard Icon={Volume2}  label="Cabin Noise"  value={`${m.cabinNoise} dBA`} dots={(m.cabinNoise - 40) / 5} />
          <MetricCard Icon={Shield}   label="Masking"      value={m.masking} dots={maskingDots} dotColor={maskingColor} />
          <MetricCard Icon={Mic}      label="ASR Impact"   value={`${m.asrImpact} dB`} dots={asrDots} dotColor="var(--orange)" />
        </div>
      </div>

      <div className="panel">
        <h3>Sound Mixer</h3>
        <SoundMixer config={config} setConfig={setConfig} onAddSound={onAddSound}
                    hover={hover}
                    setHover={setHover} />
      </div>
    </div>
  )
}
