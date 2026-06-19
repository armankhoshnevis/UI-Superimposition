// ui/src/components/right_panel/AddSoundModal.jsx
// Modal for picking a sound, its category, and (when applicable) its motion
// direction. Reuses the .ase-overlay / .ase-modal pattern from AudioSaveExport.
import { useEffect, useState } from 'react'
import {
  CATEGORIES,
  DIRECTION_SIDES,
  DIRECTION_MOTIONS,
  getSoundById,
  getSoundsByCategory,
} from '../../sound_library'

export default function AddSoundModal({ open, onClose, config, setConfig }) {
  const [category, setCategory] = useState(null)
  const [soundId, setSoundId]   = useState(null)
  const [side, setSide]         = useState(null)
  const [motion, setMotion]     = useState(null)

  // Reset state and clear any pending placement when the modal opens.
  useEffect(() => {
    if (!open) return
    setCategory(null)
    setSoundId(null)
    setSide(null)
    setMotion(null)
    setConfig(c => c.pending_placement ? { ...c, pending_placement: null } : c)
    // intentionally only react to `open` going true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  function chooseCategory(catId) {
    setCategory(catId)
    setSoundId(null)
    setSide(null)
    setMotion(null)
  }

  function chooseSound(id) {
    setSoundId(id)
    setSide(null)
    setMotion(null)
  }

  function chooseSide(id) {
    setSide(id)
    setMotion(null)
  }

  function handleAdd() {
    const sound = getSoundById(soundId)
    if (!sound || !category) return
    if (atLimit) return
    const baseId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    if (category === 'internal_point') {
      // Defer the commit until the user clicks inside the car on the CarView.
      setConfig({
        ...config,
        pending_placement: {
          sound_id: sound.id,
          label: sound.label,
          gain_db: sound.default_gain_db,
        },
      })
      onClose()
      return
    }

    const entry = {
      id: baseId,
      category,
      sound_id: sound.id,
      label: sound.label,
      gain_db: sound.default_gain_db,
      muted: false,
    }
    if (category === 'external_directional') entry.direction = `${side}_${motion}`

    setConfig({
      ...config,
      sound_sources: [...(config.sound_sources || []), entry],
    })
    onClose()
  }

  const sounds = category ? getSoundsByCategory(category) : []

  const sources = config.sound_sources || []
  const counts = {
    global: sources.filter(s => s.category === 'global').length,
    internal_point:
      sources.filter(s => s.category === 'internal_point').length
      + (config.pending_placement ? 1 : 0),
    external_directional: sources.filter(s => s.category === 'external_directional').length,
  }
  const sideCounts = {
    left:  sources.filter(s => s.category === 'external_directional' && s.direction?.startsWith('left_')).length,
    right: sources.filter(s => s.category === 'external_directional' && s.direction?.startsWith('right_')).length,
  }
  const CATEGORY_LIMIT = 8
  const SIDE_LIMIT = 4
  const categoryFull = category ? counts[category] >= CATEGORY_LIMIT : false
  const sideFull = category === 'external_directional' && side ? sideCounts[side] >= SIDE_LIMIT : false
  const atLimit = categoryFull || sideFull

  return (
    <div className="ase-overlay" onClick={onClose}>
      <div className="ase-modal add-sound-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ase-modal-header">
          <h3>Add Sound</h3>
          <button className="ase-close" onClick={onClose}>×</button>
        </div>

        {/* Step 1 — pick category */}
        <div className="add-sound-cat-tabs">
          {Object.values(CATEGORIES).map(cat => {
            const full = counts[cat.id] >= CATEGORY_LIMIT
            return (
              <button
                key={cat.id}
                className={category === cat.id ? 'active' : ''}
                disabled={full}
                title={full ? `Limit reached (${CATEGORY_LIMIT})` : undefined}
                onClick={() => chooseCategory(cat.id)}
              >
                <span className="cat-label">{cat.label}</span>
                <span className="cat-blurb">
                  {full ? `Full (${counts[cat.id]}/${CATEGORY_LIMIT})` : cat.blurb}
                </span>
              </button>
            )
          })}
        </div>

        {/* Step 2 — pick sound */}
        {category && (
          <div className="add-sound-grid">
            {sounds.map(s => {
              const Icon = s.Icon
              const selected = soundId === s.id
              return (
                <button
                  key={s.id}
                  className={`add-sound-card ${selected ? 'selected' : ''}`}
                  onClick={() => chooseSound(s.id)}
                >
                  <Icon size={28} strokeWidth={1.6} />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 3a — direction: side */}
        {category === 'external_directional' && soundId && (
          <div className="add-sound-direction">
            <label>Side</label>
            <div className="direction-options">
              {DIRECTION_SIDES.map(d => {
                const full = sideCounts[d.id] >= SIDE_LIMIT
                return (
                  <button
                    key={d.id}
                    className={side === d.id ? 'active' : ''}
                    disabled={full}
                    title={full ? `Limit reached (${SIDE_LIMIT} per side)` : undefined}
                    onClick={() => chooseSide(d.id)}
                  >{d.label}{full ? ` (full)` : ''}</button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3b — direction: motion relative to car */}
        {category === 'external_directional' && soundId && side && (
          <div className="add-sound-direction">
            <label>Motion</label>
            <div className="direction-options">
              {DIRECTION_MOTIONS.map(d => (
                <button
                  key={d.id}
                  className={motion === d.id ? 'active' : ''}
                  onClick={() => setMotion(d.id)}
                >{d.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="ase-buttons">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            disabled={
              !soundId ||
              (category === 'external_directional' && (!side || !motion)) ||
              atLimit
            }
            onClick={handleAdd}
          >Add Sound</button>
        </div>
      </div>
    </div>
  )
}
