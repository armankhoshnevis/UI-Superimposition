// ui/src/components/right_panel/SoundMixer.jsx
// Dynamic mixer: each row corresponds to one entry in config.sound_sources.
// The Add Sound modal itself lives in App.jsx; we receive an `onAddSound`
// callback so the same modal is shared with the button above the car view.
import { getSoundById, getDirection } from '../../sound_library'

function describeEntry(entry) {
  if (entry.category === 'global') return 'Global ambient'
  if (entry.category === 'internal_point') {
    const pos = entry.position
    return pos
      ? `Inside cabin (${Math.round(pos[0])}, ${Math.round(pos[1])})`
      : 'Inside cabin'
  }
  if (entry.category === 'external_directional') {
    const dir = getDirection(entry.direction)
    return `External · ${dir ? dir.label : entry.direction}`
  }
  return ''
}

export default function SoundMixer({
  config, setConfig, onAddSound,
  hover, setHover,
}) {
  const sources = config.sound_sources || []
  const pending = config.pending_placement

  function updateEntry(id, patch) {
    setConfig({
      ...config,
      sound_sources: sources.map(s => s.id === id ? { ...s, ...patch } : s),
    })
  }

  function removeEntry(id) {
    setConfig({
      ...config,
      sound_sources: sources.filter(s => s.id !== id),
    })
  }

  function resetAll() {
    setConfig({
      ...config,
      sound_sources: [],
      pending_placement: null,
    })
  }

  return (
    <div className="sound-mixer-v2">
      <div className="sound-mixer-actions">
        <button
          className="reset-btn"
          onClick={resetAll}
          disabled={sources.length === 0 && !pending}
        >Reset</button>
      </div>

      {pending && (
        <div className="placement-banner">
          Click inside the car to place <strong>{pending.label}</strong>.
          Press Esc to cancel.
        </div>
      )}

      {sources.length === 0 && !pending && (
        <div className="empty-mixer">No sounds added yet.</div>
      )}

      <div className="mixer-rows">
        {sources.map(entry => {
          const meta = getSoundById(entry.sound_id)
          const Icon = meta?.Icon
          const on = !entry.muted
          const isHovered = hover?.id === entry.id
          return (
            <div key={entry.id}
                 className={`mixer-row ${on ? '' : 'off'} ${isHovered ? 'hovered' : ''}`}
                 onMouseEnter={() => setHover?.({ id: entry.id, source: 'mixer' })}
                 onMouseLeave={() => setHover?.(prev => prev?.id === entry.id ? null : prev)}>
              <button
                className={`led ${on ? 'on' : ''}`}
                onClick={() => updateEntry(entry.id, { muted: !entry.muted })}
                aria-label={`${entry.label} ${on ? 'on' : 'off'}`}
                aria-pressed={on}
              />
              <span className="mixer-label mixer-label-with-icon">
                {Icon && <Icon size={14} strokeWidth={1.8} />}
                <span className="mixer-label-text">
                  <span>{entry.label}</span>
                  <small className="mixer-sub">{describeEntry(entry)}</small>
                </span>
              </span>
              <input
                type="range" className="mixer-slider"
                min="-24" max="0" step="1"
                value={entry.gain_db}
                onChange={e => updateEntry(entry.id, { gain_db: Number(e.target.value) })}
                disabled={!on}
              />
              <span className="db-display">{entry.gain_db} dB</span>
              <button
                className="delete-btn"
                onClick={() => removeEntry(entry.id)}
                aria-label={`Delete ${entry.label}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
