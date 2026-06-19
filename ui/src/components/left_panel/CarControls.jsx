// ui/src/components/CarControls.jsx
// Single global window-openness control. The slider applies uniformly to
// all four windows — Closed / Crack / Half / Open. Vents are not part of
// this project, and per-window selection has been removed.

const WINDOW_OPENNESS_LABELS = ['Closed', 'Crack', 'Half', 'Open']

function deriveWindowState(openness) {
  return openness === 0 ? 'W0' : `W${openness}`
}

export default function CarControls({ config, setConfig }) {
  const windowOpenness = config.window_openness

  function changeWindowOpenness(e) {
    const v = Number(e.target.value)
    setConfig({
      ...config,
      window_openness: v,
      window_state: deriveWindowState(v),
    })
  }

  return (
    <div className="car-controls">
      <div className="car-sliders">
        <div className="car-slider-block">
          <div className="car-slider-title">Window Openness</div>
          <div className="slider-row" style={{ gridTemplateColumns: '1fr' }}>
            <input
              type="range"
              min="0" max="3" step="1"
              value={windowOpenness}
              onChange={changeWindowOpenness}
            />
          </div>
          <div className="openness-labels">
            {WINDOW_OPENNESS_LABELS.map((label, i) => (
              <span key={label} className={i === windowOpenness ? 'active' : ''}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
