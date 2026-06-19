// ui/src/components/LeftPanel.jsx
import { useState, useEffect } from 'react'
import ScenarioPicker from './ScenarioPicker'
import SpeedSlider, { SPEED_AREA } from './SpeedSlider'
import CarControls from './CarControls'
import VentControls from './VentControls'
import './LeftPanel.css'

// SNR readout that's also a typable input.
// - Out-of-range numbers clamp to [min, max].
// - Anything that isn't a clean integer (text, special chars, empty) reverts
//   to the last committed value.
function SnrInput({ value, min, max, onChange }) {
  const [text, setText] = useState(String(value))

  // Keep the text in sync if the slider (or anything external) changes the value.
  useEffect(() => { setText(String(value)) }, [value])

  function commit() {
    const trimmed = text.trim()
    // Only accept an optional minus sign + digits (slider step is 1).
    if (!/^-?\d+$/.test(trimmed)) {
      setText(String(value))
      return
    }
    const n = Number(trimmed)
    if (!Number.isFinite(n)) {
      setText(String(value))
      return
    }
    const clamped = Math.max(min, Math.min(max, n))
    setText(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label="SNR in decibels"
      value={text}
      onChange={e => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setText(String(value))
          e.currentTarget.blur()
        }
      }}
      style={{
        width: '100%',
        textAlign: 'right',
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 12,
        fontFamily: 'inherit',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text)',
      }}
    />
  )
}

export default function LeftPanel({ scenarios, config, setConfig }) {
  const selected = (scenarios || []).find(s => s.scenario_id === config.scenario_id)

  return (
    <div>
      <div className="panel">
        <h3>Scenario</h3>
        <ScenarioPicker scenarios={scenarios || []}
                        value={config.scenario_id}
                        onChange={v => setConfig({...config, scenario_id: v})} />
        {selected && (
          <div className="scenario-selected">
            <div className="scenario-selected-id">{selected.scenario_id}</div>
            <div className="scenario-selected-name">{selected.name}</div>
            {selected.purpose && (
              <div className="scenario-selected-purpose">{selected.purpose}</div>
            )}
          </div>
        )}
      </div>

      <div className="panel">
        <h3>
          Speed
          {SPEED_AREA[config.speed_state] && (
            <span style={{
              fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6,
            }}>({SPEED_AREA[config.speed_state]})</span>
          )}
        </h3>
        <SpeedSlider config={config} setConfig={setConfig} />
      </div>

      <div className="panel">
        <h3>Window Openness</h3>
        <CarControls config={config} setConfig={setConfig} />
      </div>

      <div className="panel">
        <h3>Vent Openness</h3>
        <VentControls config={config} setConfig={setConfig} />
      </div>

      <div className="panel">
        <h3>SNR</h3>
        <div className="slider-row">
          <span>SNR (dB)</span>
          <input type="range" min="-10" max="20" step="1"
                 value={config.snr_db}
                 onChange={e => setConfig({...config, snr_db: Number(e.target.value)})} />
          <SnrInput
            value={config.snr_db}
            min={-10}
            max={20}
            onChange={v => setConfig({...config, snr_db: v})}
          />
        </div>
      </div>
    </div>
  )
}
