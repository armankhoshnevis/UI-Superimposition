// ui/src/components/center_panel/LastGeneratedModal.jsx
// Popup that surfaces the metadata for the most recently generated audio
// (file name, SNR, duration, speaker position). Reuses the .ase-overlay /
// .ase-modal styling for visual consistency with the other modals.
export default function LastGeneratedModal({ open, onClose, result }) {
  if (!open) return null

  return (
    <div className="ase-overlay" onClick={onClose}>
      <div className="ase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ase-modal-header">
          <h3>Last Generated</h3>
          <button className="ase-close" onClick={onClose}>×</button>
        </div>

        {result ? (
          <div style={{
            fontSize: 13, fontFamily: 'monospace',
            overflowWrap: 'anywhere', wordBreak: 'break-word',
            lineHeight: 1.6,
          }}>
            <div><strong>File:</strong> {result.metadata.file}</div>
            <div><strong>SNR:</strong> {result.metadata.snr_db} dB</div>
            <div><strong>Duration:</strong> {result.metadata.duration_sec.toFixed(2)}s</div>
            <div><strong>Position:</strong> {result.metadata.speaker_position}</div>
          </div>
        ) : (
          <div style={{
            fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic',
          }}>
            No audio generated yet.
          </div>
        )}
      </div>
    </div>
  )
}
