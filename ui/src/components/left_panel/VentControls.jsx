// ui/src/components/left_panel/VentControls.jsx
// Single global vent-openness control. The slider applies uniformly to
// all vents in the cabin — Closed / Slightly / Mostly / Open.

const VENT_OPENNESS_LABELS = ['Closed', 'Slightly', 'Mostly', 'Open']

function deriveVentState(openness) {
  return openness === 0 ? 'V0' : `V${openness}`
}

export default function VentControls({ config, setConfig }) {
  const ventOpenness = config.vent_openness ?? 0

  function changeVentOpenness(e) {
    const v = Number(e.target.value)
    setConfig({
      ...config,
      vent_openness: v,
      vent_state: deriveVentState(v),
    })
  }

  return (
    <div className="car-controls">
      <div className="car-sliders">
        <div className="car-slider-block">
          <div className="slider-row" style={{ gridTemplateColumns: '1fr' }}>
            <input
              type="range"
              min="0" max="3" step="1"
              value={ventOpenness}
              onChange={changeVentOpenness}
            />
          </div>
          <div className="openness-labels">
            {VENT_OPENNESS_LABELS.map((label, i) => (
              <span key={label} className={i === ventOpenness ? 'active' : ''}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
