// ui/src/components/SpeedSlider.jsx
const ALLOWED_MPH = [0, 25, 45, 70]

export const SPEED_AREA = {
  S0: 'At rest',
  S1: 'Residential area',
  S2: 'Normal road',
  S3: 'Highway',
}

function mphToSpeedState(mph) {
  if (mph <= 20) return 'S0'
  if (mph <= 40) return 'S1'
  if (mph <= 60) return 'S2'
  return 'S3'
}

function snapToAllowed(mph) {
  let best = ALLOWED_MPH[0]
  let bestDist = Math.abs(mph - best)
  for (const v of ALLOWED_MPH) {
    const d = Math.abs(mph - v)
    if (d < bestDist) { best = v; bestDist = d }
  }
  return best
}

export default function SpeedSlider({ config, setConfig }) {
  const mph = ALLOWED_MPH.includes(config.speed_mph)
    ? config.speed_mph
    : snapToAllowed(config.speed_mph)
  const speedState = config.speed_state
  const idx = ALLOWED_MPH.indexOf(mph)

  function handleChange(e) {
    const newIdx = Number(e.target.value)
    const newMph = ALLOWED_MPH[newIdx]
    setConfig({
      ...config,
      speed_mph: newMph,
      speed_state: mphToSpeedState(newMph),
    })
  }

  return (
    <div>
      <div className="speed-readout">
        <span className="speed-value">{mph}</span>
        <span className="speed-unit">mph</span>
        <span className="speed-state">{speedState}</span>
      </div>

      <div className="speed-slider-wrap">
        <input
          type="range"
          min="0"
          max={ALLOWED_MPH.length - 1}
          step="1"
          value={idx}
          onChange={handleChange}
        />
        <div className="speed-ticks">
          {ALLOWED_MPH.map(v => (
            <span key={v} className="major" />
          ))}
        </div>
        <div className="speed-labels">
          {ALLOWED_MPH.map(v => <span key={v}>{v}</span>)}
        </div>
      </div>
    </div>
  )
}
