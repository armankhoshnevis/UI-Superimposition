// ui/src/components/OverlayChecks.jsx
const KEYS = ['music','speech','road','rain','wipers','ring','extevt']
 
export default function OverlayChecks({ overlays, onChange }) {
  return (
    <div>
      {KEYS.map(key => (
        <label key={key} className="checkbox-row">
          <input type="checkbox"
                 checked={overlays[key]}
                 onChange={e => onChange({...overlays, [key]: e.target.checked})} />
          {key.toUpperCase()}
        </label>
      ))}
    </div>
  )
}

