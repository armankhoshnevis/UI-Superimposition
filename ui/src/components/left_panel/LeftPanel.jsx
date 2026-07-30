// ui/src/components/LeftPanel.jsx
import ScenarioPicker from './ScenarioPicker'
import SpeedSlider, { SPEED_AREA } from './SpeedSlider'
import CarControls from './CarControls'
import VentControls from './VentControls'
import './LeftPanel.css'

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

    </div>
  )
}
