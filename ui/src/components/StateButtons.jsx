// ui/src/components/StateButtons.jsx
export default function StateButtons({ options, value, onChange }) {
  return (
    <div className="button-group">
      {options.map(opt => (
        <button key={opt}
                className={value === opt ? 'active' : ''}
                onClick={() => onChange(opt)}>
          {opt}
        </button>
      ))}
    </div>
  )
}
