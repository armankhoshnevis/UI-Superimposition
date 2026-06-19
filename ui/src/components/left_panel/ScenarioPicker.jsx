// ui/src/components/ScenarioPicker.jsx
export default function ScenarioPicker({ scenarios, value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {scenarios.map(s => (
        <option key={s.scenario_id} value={s.scenario_id}>
          {s.scenario_id} — {s.name}
        </option>
      ))}
    </select>
  )
}
