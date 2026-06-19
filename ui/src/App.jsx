// ui/src/App.jsx
import { useState, useEffect } from 'react'
import './theme.css'
import Header from './components/Header'
import LeftPanel from './components/left_panel/LeftPanel'
import CenterPanel from './components/center_panel/CenterPanel'
import RightPanel from './components/right_panel/RightPanel'
import AudioSaveExport from './components/center_panel/AudioSaveExport'
import AudioPreviewModal from './components/center_panel/AudioPreviewModal'
import LastGeneratedModal from './components/center_panel/LastGeneratedModal'
import AddSoundModal from './components/right_panel/AddSoundModal'
import { fetchScenarios, generateAudio, audioUrl } from './api'
import { buildGeneratePayload } from './payload'

export default function App() {
  // Available scenarios (loaded from backend)
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // The configuration being built
  const [config, setConfig] = useState({
    scenario_id: '',
    speed_state: 'S0',
    speed_mph: 0,
    window_state: 'W0',
    window_openness: 0,
    vent_state: 'V0',
    vent_openness: 0,
    sound_sources: [],
    pending_placement: null,
    snr_db: 5,
    speaker_position: 'driver',
    requested_source: null,
    car_model: 'gv80',
  })

  // The most recently generated result
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [addSoundOpen, setAddSoundOpen] = useState(false)
  // Currently-hovered source as { id, source: 'mixer' | 'carview' }. The
  // origin matters: mixer-originated hover dims every other source in the
  // car view, while carview-originated hover only surfaces the label.
  const [hover, setHover] = useState(null)

  // Which panel is visible in mobile (<900px) mode. Ignored at wider widths
  // where all three panels are visible together, but kept in state so the
  // selection persists across breakpoint resizes.
  const [mobilePanel, setMobilePanel] = useState('center')

  function openAddSound() { setAddSoundOpen(true) }

  // Load scenarios on mount
  useEffect(() => {
    fetchScenarios()
      .then(data => {
        setScenarios(data)
        if (data.length > 0) {
          setConfig(c => ({ ...c, scenario_id: data[0].scenario_id }))
        }
        setLoading(false)
      })
      .catch(err => {
        setError('Could not connect to backend. Is it running on port 5000?')
        setLoading(false)
      })
  }, [])

  // ESC cancels an in-progress internal-point placement.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setConfig(c => c.pending_placement ? { ...c, pending_placement: null } : c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // When the user kicks off an internal-point placement (e.g. from the
  // Overview tab on mobile), surface the car diagram so they can actually
  // click to drop the sound. No-op on desktop because all panels are
  // visible, and a no-op when already on 'center'.
  useEffect(() => {
    if (config.pending_placement) setMobilePanel('center')
  }, [config.pending_placement])

  async function handleGenerate() {
    if (!config.scenario_id) return
    setGenerating(true)
    setError(null)
    try {
      // Strip UI-only fields and legacy string-enum mirrors before sending.
      // The four new top-level keys come from buildGeneratePayload; other
      // backend-relevant fields (scenario_id, snr_db, speaker_position, seed,
      // requested_source, car_model) ride along from `rest`.
      const {
        speed_state, window_state, vent_state,
        speed_mph, window_openness, vent_openness,
        sound_sources, pending_placement,
        ...rest
      } = config
      const payload = { ...rest, ...buildGeneratePayload(config) }
      const res = await generateAudio(payload)
      setResult({
        ...res,
        audio_url: audioUrl(res.file_url),
      })
      setPreviewOpen(true)
    } catch (err) {
      setError(`Generation failed: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  function handleExportFromPreview() {
    // Both modals can be open simultaneously — opening Export does not
    // close the preview, so the user can keep the waveform/spectrogram
    // visible while filling in the export form.
    setExportOpen(true)
  }

  if (loading) {
    return <div className="loading"><span className="spinner" />Loading…</div>
  }

  return (
    <div>
      <Header mobilePanel={mobilePanel} setMobilePanel={setMobilePanel} />
      {/* Preview renders first so the Export modal (rendered after) stacks
          on top when both are open. They are otherwise independent — each
          has its own close handler. */}
      <AudioPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        result={result}
        onExport={handleExportFromPreview}
        onShowDetails={() => setDetailsOpen(true)}
      />
      <AudioSaveExport
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        config={config}
        result={result}
      />
      <LastGeneratedModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        result={result}
      />
      <AddSoundModal
        open={addSoundOpen}
        onClose={() => setAddSoundOpen(false)}
        config={config}
        setConfig={setConfig}
      />
      {error && <div className="error" style={{margin:'8px 16px'}}>{error}</div>}
      <div className="app-layout" data-mobile-panel={mobilePanel}>
        <LeftPanel scenarios={scenarios} config={config} setConfig={setConfig} />
        <CenterPanel config={config} setConfig={setConfig} result={result}
                     generating={generating}
                     onGenerate={handleGenerate}
                     onAddSound={openAddSound}
                     hover={hover}
                     setHover={setHover} />
        <RightPanel config={config} setConfig={setConfig}
                    onAddSound={openAddSound}
                    hover={hover}
                    setHover={setHover} />
      </div>
    </div>
  )
}
