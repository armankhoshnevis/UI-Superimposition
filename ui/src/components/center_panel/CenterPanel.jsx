// ui/src/components/CenterPanel.jsx
import CarView from './CarView'
import { CAR_MODELS, getCarModel } from '../../car_models'
import './CenterPanel.css'

// Re-project an internal_point source's [px, py] (in PNG-pixel space of
// the old model) into the new model's PNG-pixel space, anchored to each
// car's cabin rect, so a sound near the driver stays near the driver.
function reanchorSources(sources, oldModel, newModel) {
  const oldC = oldModel.cabin
  const newC = newModel.cabin
  return (sources || []).map(s => {
    if (s.category !== 'internal_point' || !s.position) return s
    const [x, y] = s.position
    const nx = (x - oldC.x) / oldC.w
    const ny = (y - oldC.y) / oldC.h
    return { ...s, position: [
      newC.x + nx * newC.w,
      newC.y + ny * newC.h,
    ] }
  })
}

function switchCarModel(newId, config, setConfig) {
  if (newId === config.car_model) return
  const oldM = getCarModel(config.car_model)
  const newM = getCarModel(newId)
  setConfig({
    ...config,
    car_model: newId,
    sound_sources: reanchorSources(config.sound_sources, oldM, newM),
    pending_placement: null,
  })
}

export default function CenterPanel({
  config, setConfig, result, generating,
  onGenerate, onAddSound, hover, setHover,
}) {
  const activeModelId = config.car_model || 'gv80'
  const activeModel = getCarModel(activeModelId)
  const sources = config.sound_sources || []
  const pending = config.pending_placement

  function resetScene() {
    setConfig({
      ...config,
      sound_sources: [],
      pending_placement: null,
    })
  }

  return (
    <div>
      <div className="panel panel--hero">
        <h3>Vehicle Sound Scene</h3>

        <div className="car-view-add-row">
          <select
            className="car-model-select"
            aria-label="Vehicle model"
            value={activeModelId}
            onChange={(e) => switchCarModel(e.target.value, config, setConfig)}
          >
            {Object.values(CAR_MODELS).map(m => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.subtitle}
              </option>
            ))}
          </select>
          <button className="primary add-sound-btn" onClick={onAddSound}>
            + Add Sound
          </button>
          <button
            className="reset-btn"
            onClick={resetScene}
            disabled={sources.length === 0 && !pending}
          >Reset</button>
        </div>
        <CarView
          config={config}
          setConfig={setConfig}
          microphones={result?.microphones || activeModel.mics}
          hover={hover}
          setHover={setHover}
        />
        <div className="center-actions">
          <button className="generate-btn"
                  onClick={onGenerate}
                  disabled={generating}>
            {generating
              ? <><span className="spinner" />Generating…</>
              : <>▶ Generate Audio</>}
          </button>
        </div>
      </div>
    </div>
  )
}
