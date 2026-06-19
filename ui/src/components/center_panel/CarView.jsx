// ui/src/components/center_panel/CarView.jsx
import { useEffect, useState } from 'react'
import { getSoundById, getDirection } from '../../sound_library'
import { getCarModel, getViewBox } from '../../car_models'

// Window fill color, keyed by openness (0..3): dark navy → white.
const WINDOW_COLORS = ['#1F3A5F', '#3D6090', '#7DAACE', '#FFFFFF']

// Vents use the same dark-navy → white palette as the windows so the two
// controls read the same visually: dark when closed, progressively lighter
// until white when fully open.
const VENT_COLORS = WINDOW_COLORS

// Mic position role labels (front-left, front-right, rear-left, rear-right).
const MIC_ROLES = ['FL', 'FR', 'RL', 'RR']

function ensure(config, key, fallback) {
  return config && config[key] !== undefined ? config[key] : fallback
}

export default function CarView({
  config, setConfig,
  microphones,
  hover, setHover,
}) {
  // Dim/highlight ONLY fires when the hover originated from the mixer —
  // hovering a source directly in the scene shouldn't fade the others.
  function sourceClass(s) {
    const base = s.muted ? 'sv-source muted' : 'sv-source'
    if (!hover || hover.source !== 'mixer') return base
    return `${base} ${s.id === hover.id ? 'highlighted' : 'dimmed'}`
  }
  // Hover handlers shared by every source <g>. Disabled in placement mode
  // so the click-to-place flow on the SVG isn't interrupted.
  function hoverHandlers(s, inPlacement) {
    if (inPlacement || !setHover) return {}
    return {
      onMouseEnter: () => setHover({ id: s.id, source: 'carview' }),
      onMouseLeave: () => setHover(prev => prev?.id === s.id ? null : prev),
      style: { cursor: 'pointer' },
    }
  }
  const model = getCarModel(ensure(config, 'car_model', 'gv80'))
  const vb    = getViewBox(model)
  const cr    = model.contentRect
  const cabin = model.cabin

  const windowOpenness = ensure(config, 'window_openness', 0)
  const windowsAreOpen = windowOpenness > 0
  const ventOpenness   = ensure(config, 'vent_openness', 0)
  const ventFill       = VENT_COLORS[ventOpenness] ?? VENT_COLORS[0]
  const sources        = ensure(config, 'sound_sources', [])
  const pending        = ensure(config, 'pending_placement', null)

  const [lastOpenLevel, setLastOpenLevel] = useState(
    windowOpenness > 0 ? windowOpenness : 3
  )
  useEffect(() => {
    if (windowOpenness > 0) setLastOpenLevel(windowOpenness)
  }, [windowOpenness])

  function toggleWindows(e) {
    if (e) e.stopPropagation()
    const next = windowsAreOpen ? 0 : (lastOpenLevel || 3)
    setConfig({
      ...config,
      window_openness: next,
      window_state: next === 0 ? 'W0' : `W${next}`,
    })
  }

  // Clamp a click position so the source halo never bleeds past the cabin.
  function clampToCabin(x, y) {
    return [
      Math.max(cabin.x + 30, Math.min(cabin.x + cabin.w - 30, x)),
      Math.max(cabin.y + 30, Math.min(cabin.y + cabin.h - 30, y)),
    ]
  }

  function handleSvgClick(e) {
    if (!pending) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    // Map screen click → viewBox (PNG-pixel) coordinates.
    const x = vb.x + ((e.clientX - rect.left) / rect.width)  * vb.w
    const y = vb.y + ((e.clientY - rect.top)  / rect.height) * vb.h
    if (x < cabin.x || x > cabin.x + cabin.w) return
    if (y < cabin.y || y > cabin.y + cabin.h) return

    const [px, py] = clampToCabin(x, y)
    const id = `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setConfig({
      ...config,
      pending_placement: null,
      sound_sources: [...(sources || []), {
        id,
        category: 'internal_point',
        sound_id: pending.sound_id,
        label: pending.label,
        gain_db: pending.gain_db,
        muted: false,
        position: [px, py],
      }],
    })
  }

  const winFill = WINDOW_COLORS[windowOpenness] ?? WINDOW_COLORS[0]

  const cabinCenterX = cabin.x + cabin.w / 2
  const cabinCenterY = cabin.y + cabin.h / 2

  // Split sources by category for layered rendering.
  const globals = sources.filter(s => s.category === 'global')
  const interns = sources.filter(s => s.category === 'internal_point')
  const exts    = sources.filter(s => s.category === 'external_directional')

  // Layout for global badges above the car — circular, matching the
  // internal/external markers so all sound symbols look consistent.
  const CHIP_R = 58, CHIP_GAP = 24
  const chipsTotalW = globals.length * (CHIP_R * 2) + Math.max(0, globals.length - 1) * CHIP_GAP
  const chipsStartX = (cr.x + cr.w / 2) - chipsTotalW / 2

  const hoveredSource = hover?.id
    ? sources.find(s => s.id === hover.id)
    : null
  const hoveredMeta = hoveredSource ? getSoundById(hoveredSource.sound_id) : null
  const HoveredIcon = hoveredMeta?.Icon

  return (
    <div className={`car-view ${pending ? 'placement-mode' : ''}`}>
      {pending && (
        <div className="car-view-placement-hint">
          Placing <strong>{pending.label}</strong> — click inside the car. Esc to cancel.
        </div>
      )}
      {hoveredSource && !pending && (
        <div className="car-view-hover-label">
          {HoveredIcon && <HoveredIcon size={20} strokeWidth={2} />}
          <span>{hoveredSource.label}</span>
        </div>
      )}

      <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
           onClick={handleSvgClick}
           style={{
             display: 'block',
             margin: '0 auto',
             width: 'auto',
             maxWidth: '100%',
             maxHeight: 440,
             background: 'transparent',
             overflow: 'visible',
             userSelect: 'none',
             position: 'relative',
             zIndex: 2,
           }}>

        {/* Car PNG, native pixel size — viewBox does the cropping */}
        <image href={model.image} x="0" y="0"
               width={model.imageW} height={model.imageH}
               pointerEvents="none" />

        {/* FRONT / REAR chevron badges */}
        <text x={cabinCenterX} y={cr.y - 24}
              textAnchor="middle" fontSize="32" fontWeight="700"
              fill="var(--navy)" letterSpacing="6"
              pointerEvents="none">▲ FRONT</text>
        <text x={cabinCenterX} y={cr.y + cr.h + 52}
              textAnchor="middle" fontSize="32" fontWeight="700"
              fill="var(--navy)" letterSpacing="6"
              pointerEvents="none">REAR ▼</text>

        {/* Windows (4, clickable; all toggle the same state) */}
        {model.windows.map(w => (
          <g key={w.id}
             className={`car-view-window-group ${windowsAreOpen ? 'open' : 'closed'}`}
             onClick={toggleWindows}
             style={{ cursor: 'pointer' }}>
            <ellipse cx={w.cx} cy={w.cy} rx={w.rx} ry={w.ry}
                     fill={winFill} fillOpacity={0.55}
                     stroke="var(--navy)" strokeWidth={3.5} />
          </g>
        ))}

        {/* Vents — fan symbols at registered positions, fill opacity scales with openness */}
        {(model.vents || []).map(v => (
          <g key={v.id} pointerEvents="none">
            <circle cx={v.x} cy={v.y} r={30}
                    fill={ventFill} fillOpacity={0.55}
                    stroke="var(--navy)" strokeWidth={3} />
            <g stroke="var(--navy)" strokeWidth={3} fill="none" strokeLinecap="round">
              <path d="M 0,-17 Q 8,-8 0,0" transform={`translate(${v.x} ${v.y})`} />
              <path d="M 0,-17 Q 8,-8 0,0" transform={`translate(${v.x} ${v.y}) rotate(120)`} />
              <path d="M 0,-17 Q 8,-8 0,0" transform={`translate(${v.x} ${v.y}) rotate(240)`} />
            </g>
            <circle cx={v.x} cy={v.y} r={4} fill="var(--navy)" />
          </g>
        ))}

        {/* Microphones — accept both PNG-pixel coords and legacy 0..1 norms */}
        {(microphones || model.mics).map((mic, i) => {
          const role = MIC_ROLES[i] ?? mic.id
          const mx = mic.x <= 1 ? cabin.x + mic.x * cabin.w : mic.x
          const my = mic.y <= 1 ? cabin.y + mic.y * cabin.h : mic.y
          return (
            <g key={mic.id} pointerEvents="none">
              <circle cx={mx} cy={my} r={18}
                      fill="var(--navy)" stroke="#fff" strokeWidth={5} />
              <text x={mx} y={my + 46} textAnchor="middle"
                    fontSize="28" fontWeight="600" fill="var(--navy)">
                {role}
              </text>
            </g>
          )
        })}

        {/* Global badges above the car */}
        {globals.map((s, i) => {
          const meta = getSoundById(s.sound_id)
          const Icon = meta?.Icon
          const cx = chipsStartX + CHIP_R + i * (CHIP_R * 2 + CHIP_GAP)
          const cy = cr.y - 180
          return (
            <g key={s.id}
               className={sourceClass(s)}
               pointerEvents={pending ? 'none' : 'auto'}
               {...hoverHandlers(s, !!pending)}>
              <circle cx={cx} cy={cy} r={CHIP_R}
                      fill="#ffffff" stroke="var(--blue)" strokeWidth={6} />
              {Icon && (
                <g transform={`translate(${cx - 34}, ${cy - 34})`}>
                  <Icon size={68} color="var(--blue)" strokeWidth={1.8} />
                </g>
              )}
            </g>
          )
        })}

        {/* Internal point markers */}
        {interns.map(s => {
          const [px, py] = s.position || [cabinCenterX, cabinCenterY]
          const meta = getSoundById(s.sound_id)
          const Icon = meta?.Icon
          return (
            <g key={s.id}
               className={sourceClass(s)}
               pointerEvents={pending ? 'none' : 'auto'}
               {...hoverHandlers(s, !!pending)}>
              <circle cx={px} cy={py} r={58}
                      fill="#ffffff" stroke="var(--orange)" strokeWidth={6}
                      opacity={0.95} />
              {Icon && (
                <g transform={`translate(${px - 34}, ${py - 34})`}>
                  <Icon size={68} color="var(--orange)" strokeWidth={1.8} />
                </g>
              )}
            </g>
          )
        })}

        {/* External directional icons with motion arrows */}
        {exts.map(s => {
          const dir = getDirection(s.direction)
          if (!dir) return null
          const meta = getSoundById(s.sound_id)
          const Icon = meta?.Icon
          const sameSide = exts.filter(x => getDirection(x.direction)?.side === dir.side)
          const idx = sameSide.findIndex(x => x.id === s.id)
          const sideX = dir.side === 'left'
            ? cr.x - 100
            : cr.x + cr.w + 100
          const y = cabinCenterY + (idx - (sameSide.length - 1) / 2) * 200

          const hasArrow = dir.sign !== 0
          const arrowDown = dir.sign === -1
          const head = arrowDown ? y + 100 : y - 100
          const headBaseY = head + (arrowDown ? -30 : 30)

          return (
            <g key={s.id}
               className={sourceClass(s)}
               pointerEvents={pending ? 'none' : 'auto'}
               {...hoverHandlers(s, !!pending)}>
              <circle cx={sideX} cy={y} r={58}
                      fill="#ffffff" stroke="var(--blue)" strokeWidth={6} />
              {Icon && (
                <g transform={`translate(${sideX - 34}, ${y - 34})`}>
                  <Icon size={68} color="var(--blue)" strokeWidth={1.8} />
                </g>
              )}
              {hasArrow && (
                <polygon
                  points={`${sideX - 22},${headBaseY} ${sideX + 22},${headBaseY} ${sideX},${head}`}
                  fill="var(--blue)" />
              )}
            </g>
          )
        })}

      </svg>

      <div className="car-view-legend-row">
        <span className="lgd-item">
          <span className="lgd-dot lgd-source" /> Source
        </span>
        <span className="lgd-item">
          <span className="lgd-dot lgd-mic" /> Microphone
        </span>
      </div>

      <div className="car-view-hint">
        Use <strong>+ Add Sound</strong> in the Sound Mixer to add sounds to the scene.
        Tap any window to open/close all four together.
      </div>
    </div>
  )
}
