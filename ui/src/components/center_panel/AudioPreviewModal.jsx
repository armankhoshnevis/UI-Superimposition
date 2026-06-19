// ui/src/components/center_panel/AudioPreviewModal.jsx
// Modal shown after a successful Generate. Layout:
//   • Waveform (top)
//   • Spectrogram (below)
//   • Play (bottom-left) | duration | Export (bottom-right)
// Reuses the .ase-overlay / .ase-modal pattern from AddSoundModal /
// AudioSaveExport so the popup style stays consistent across the app.
import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

export default function AudioPreviewModal({ open, onClose, result, onExport, onShowDetails }) {
  const waveformRef    = useRef(null)
  const spectrogramRef = useRef(null)
  const wsRef          = useRef(null)
  const [playing,   setPlaying]   = useState(false)
  const [duration,  setDuration]  = useState(0)
  const [specError, setSpecError] = useState(null)
  const [freqMax,   setFreqMax]   = useState(8000)

  useEffect(() => {
    if (!open || !result?.audio_url) return
    let ws
    let cancelled = false

    async function setup() {
      ws = WaveSurfer.create({
        container:     waveformRef.current,
        waveColor:     '#2E75B6',
        progressColor: '#1F3A5F',
        cursorColor:   '#F0AD4E',
        height:        96,
        barWidth:      2,
        barGap:        1,
        // WaveSurfer's default sampleRate is 8000, which forces decodeAudioData
        // into an 8 kHz AudioContext and caps the spectrogram's Nyquist at
        // ~4 kHz. Decode at the source rate (backend produces 16 kHz) so the
        // spectrogram can show the full 0–8 kHz range.
        sampleRate:    16000,
      })
      if (cancelled) { ws.destroy(); return }
      wsRef.current = ws

      let Spectrogram = null
      try {
        const mod = await import('wavesurfer.js/dist/plugins/spectrogram.esm.js')
        if (cancelled) return
        Spectrogram = mod.default
      } catch {
        setSpecError('Spectrogram plugin failed to load — waveform only.')
      }

      // Register the spectrogram only once we know the audio's sample rate, so
      // we can cap frequencyMax to Nyquist. Above Nyquist the plugin fills
      // with the top-of-colormap color (a bright cream band) — that's the
      // "grey box" users saw at the top of the spectrogram.
      ws.on('decode', () => {
        if (!Spectrogram) return
        const buffer = ws.getDecodedData()
        const nyquist = buffer ? buffer.sampleRate / 2 : 8000
        const fMax    = Math.min(8000, Math.floor(nyquist))
        setFreqMax(fMax)
        ws.registerPlugin(Spectrogram.create({
          container:     spectrogramRef.current,
          labels:        true,
          labelsBackground: 'rgba(0, 0, 0, 0)',
          labelsColor:      'rgba(234, 242, 248, 0.95)',
          labelsHzColor:    'rgba(234, 242, 248, 0.8)',
          height:        220,
          frequencyMin:  20,
          frequencyMax:  fMax,
          scale:         'mel',
          splitChannels: false,
        }))
      })

      ws.load(result.audio_url)
      ws.on('ready',  () => setDuration(ws.getDuration()))
      ws.on('play',   () => setPlaying(true))
      ws.on('pause',  () => setPlaying(false))
      ws.on('finish', () => setPlaying(false))
    }

    setup()

    return () => {
      cancelled = true
      if (ws) ws.destroy()
      wsRef.current = null
      setPlaying(false)
      setDuration(0)
      setSpecError(null)
    }
  }, [open, result?.audio_url])

  if (!open) return null

  return (
    <div className="ase-overlay" onClick={onClose}>
      <div className="ase-modal audio-preview-modal"
           onClick={(e) => e.stopPropagation()}>
        <div className="ase-modal-header">
          <h3>Live Audio Preview</h3>
          <button className="ase-close" onClick={onClose}>×</button>
        </div>

        <div ref={waveformRef}    className="apm-waveform" />
        <div ref={spectrogramRef} className="apm-spectrogram" />

        {specError && <div className="apm-spec-error">{specError}</div>}

        <div className="apm-footer">
          <button className="primary apm-play-btn"
                  onClick={() => wsRef.current?.playPause()}>
            {playing ? '❚❚ Pause' : '▶ Play'}
          </button>
          <span className="apm-duration">{duration.toFixed(2)}s</span>
          <span className="apm-range">20 Hz – {(freqMax / 1000).toFixed(freqMax % 1000 === 0 ? 0 : 1)} kHz · mel</span>
          <button className="primary apm-details-btn" onClick={onShowDetails}>
            ⓘ Details
          </button>
          <button className="primary apm-export-btn" onClick={onExport}>
            ↓ Export
          </button>
        </div>
      </div>
    </div>
  )
}
