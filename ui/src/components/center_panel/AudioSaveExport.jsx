// ui/src/components/center_panel/AudioSaveExport.jsx
// Popup modal for saving presets and exporting audio + metadata.
import { useState, useEffect } from 'react'
import axios from 'axios'
import { buildGeneratePayload } from '../../payload'

const BASE_URL = 'http://localhost:5000'

export default function AudioSaveExport({ open, onClose, config, result }) {
  const [fileName, setFileName] = useState('')
  const [busy, setBusy]         = useState(false)
  const [status, setStatus]     = useState(null)
  const [exported, setExported] = useState(null)  // { file_url, metadata_url }
  const [preset, setPreset]     = useState(null)  // { preset_url }

  useEffect(() => {
    if (open) {
      setStatus(null)
      setExported(null)
      setPreset(null)
    }
  }, [open])

  if (!open) return null

  const safeName = (fileName.trim() || 'audio_scenario').replace(/[^a-zA-Z0-9_\-]/g, '_')

  function buildPayload() {
    const { driving, window, venting, overlays } = buildGeneratePayload(config)
    return {
      file_name: safeName,
      format: 'wav',
      duration_sec: result?.metadata?.duration_sec ?? 30,
      parameters: { driving, window, venting, overlays },
      source_file: result?.metadata?.file || null,
    }
  }

  async function handleSavePreset() {
    if (!fileName.trim()) {
      setStatus({ type: 'error', text: 'Enter a name before saving a preset.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const res = await axios.post(`${BASE_URL}/preset`, buildPayload())
      setPreset(res.data)
      setStatus({ type: 'ok', text: `Preset saved: ${res.data.preset_url}` })
    } catch (err) {
      setStatus({ type: 'error', text: `Save failed: ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  async function handleExportAudio() {
    if (!result) {
      setStatus({ type: 'error', text: 'Generate audio first before exporting.' })
      return
    }
    if (!fileName.trim()) {
      setStatus({ type: 'error', text: 'Enter a file name before exporting.' })
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const res = await axios.post(`${BASE_URL}/export`, buildPayload())
      setExported(res.data)
      setStatus({ type: 'ok', text: `Exported "${res.data.file_url}".` })
    } catch (err) {
      setStatus({ type: 'error', text: `Export failed: ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  const downloadHref = exported ? `${BASE_URL}${exported.file_url}` : null
  const metadataHref = exported ? `${BASE_URL}${exported.metadata_url}` : null
  const presetHref   = preset ? `${BASE_URL}${preset.preset_url}` : null

  return (
    <div className="ase-overlay" onClick={onClose}>
      <div className="ase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ase-modal-header">
          <h3>Audio Save and Export</h3>
          <button className="ase-close" onClick={onClose}>×</button>
        </div>

        <div className="audio-save-export">
          <div className="ase-row">
            <label htmlFor="ase-filename">File / Preset Name</label>
            <input
              id="ase-filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. highway_cruise_v1"
              disabled={busy}
            />
          </div>

          <div className="ase-buttons">
            <button className="primary" onClick={handleSavePreset} disabled={busy}>
              Save Preset
            </button>
            <button className="primary" onClick={handleExportAudio}
                    disabled={busy || !result}>
              Export Audio
            </button>
            <a
              className={`ase-download-btn ${presetHref ? '' : 'disabled'}`}
              href={presetHref || undefined}
              download={presetHref ? `${safeName}.json` : undefined}
              onClick={(e) => { if (!presetHref) e.preventDefault() }}
            >
              ⬇ Download Preset
            </a>
            <a
              className={`ase-download-btn ${downloadHref ? '' : 'disabled'}`}
              href={downloadHref || undefined}
              download={downloadHref ? `${safeName}.wav` : undefined}
              onClick={(e) => { if (!downloadHref) e.preventDefault() }}
            >
              ⬇ Download Audio
            </a>
            {metadataHref && (
              <a
                className="ase-download-btn"
                href={metadataHref}
                download={`${safeName}.json`}
              >
                ⬇ Metadata
              </a>
            )}
          </div>

          {status && (
            <div className={`ase-status ${status.type}`}>{status.text}</div>
          )}
        </div>
      </div>
    </div>
  )
}
