// ui/src/icons.jsx
// Inline SVG icons used by the sound library. Match lucide-react's
// (size, strokeWidth, color) prop shape so call sites stay identical to
// what they would look like with that package — but without any dependency.
function Svg({ size = 24, strokeWidth = 1.6, color = 'currentColor', children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >{children}</svg>
  )
}

// --- weather / global ----------------------------------------------------

export function CloudRain(p) {
  return (
    <Svg {...p}>
      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9" />
      <line x1="8"  y1="19" x2="8"  y2="21" />
      <line x1="8"  y1="13" x2="8"  y2="15" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="12" y1="15" x2="12" y2="17" />
      <line x1="16" y1="19" x2="16" y2="21" />
      <line x1="16" y1="13" x2="16" y2="15" />
    </Svg>
  )
}

export function CloudHail(p) {
  return (
    <Svg {...p}>
      <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
      <circle cx="8"  cy="19" r="1" fill={p?.color || 'currentColor'} />
      <circle cx="12" cy="21" r="1" fill={p?.color || 'currentColor'} />
      <circle cx="16" cy="19" r="1" fill={p?.color || 'currentColor'} />
      <circle cx="8"  cy="15" r="1" fill={p?.color || 'currentColor'} />
      <circle cx="16" cy="15" r="1" fill={p?.color || 'currentColor'} />
    </Svg>
  )
}

export function Wind(p) {
  return (
    <Svg {...p}>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h17a3 3 0 1 1-3 3" />
      <path d="M3 16h9a3 3 0 1 1-3 3" />
    </Svg>
  )
}

export function CloudLightning(p) {
  return (
    <Svg {...p}>
      <path d="M6 16.3A5 5 0 1 1 9 7h.5a6 6 0 0 1 11.5 2.5 4 4 0 0 1-1 7.8" />
      <polyline points="13 11 9 17 13 17 11 22" />
    </Svg>
  )
}

export function Snowflake(p) {
  return (
    <Svg {...p}>
      <line x1="12" y1="2"  x2="12" y2="22" />
      <line x1="2"  y1="12" x2="22" y2="12" />
      <line x1="5"  y1="5"  x2="19" y2="19" />
      <line x1="19" y1="5"  x2="5"  y2="19" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="9 19 12 22 15 19" />
      <polyline points="5 9 2 12 5 15" />
      <polyline points="19 9 22 12 19 15" />
    </Svg>
  )
}

// --- internal point ------------------------------------------------------

export function Baby(p) {
  return (
    <Svg {...p}>
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
    </Svg>
  )
}

export function MessageSquare(p) {
  return (
    <Svg {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

export function Phone(p) {
  return (
    <Svg {...p}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z" />
    </Svg>
  )
}

export function Music(p) {
  return (
    <Svg {...p}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6"  cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Svg>
  )
}

export function Mic(p) {
  return (
    <Svg {...p}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </Svg>
  )
}

export function Coughing(p) {
  return (
    <Svg {...p}>
      {/* round face */}
      <circle cx="10" cy="12" r="8.5" />
      {/* squinting eyes: > on left, < on right */}
      <polyline points="6 9.5 8 11 6 12.5" />
      <polyline points="13 9.5 11 11 13 12.5" />
      {/* open round mouth */}
      <circle cx="10.5" cy="15.5" r="2" />
      {/* cough specks flying out to the right */}
      <line x1="14" y1="13.5" x2="15.5" y2="13" />
      <line x1="15" y1="15" x2="17" y2="14.7" />
      <line x1="17.5" y1="13.5" x2="19" y2="13" />
      <line x1="18" y1="15.8" x2="20" y2="15.4" />
      <line x1="15" y1="17.5" x2="16.5" y2="17.8" />
      <line x1="17" y1="18.5" x2="19" y2="19" />
      <line x1="20" y1="17" x2="21.5" y2="16.7" />
    </Svg>
  )
}

// --- external directional ------------------------------------------------

export function Car(p) {
  return (
    <Svg {...p}>
      <path d="M5 17h-1a1 1 0 0 1-1-1v-3.3a2 2 0 0 1 .2-.9l1.7-3.4A2 2 0 0 1 6.7 7h10.6a2 2 0 0 1 1.8 1.1l1.7 3.4a2 2 0 0 1 .2.9V16a1 1 0 0 1-1 1h-1" />
      <circle cx="7"  cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </Svg>
  )
}

export function Siren(p) {
  return (
    <Svg {...p}>
      <path d="M7 12a5 5 0 1 1 10 0v6H7z" />
      <path d="M5 20h14" />
      <path d="M12 4V2" />
      <path d="M5 9 3.3 7.3" />
      <path d="m18.7 7.3 1.6-1.6" />
    </Svg>
  )
}

export function Bike(p) {
  return (
    <Svg {...p}>
      <circle cx="5.5"  cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </Svg>
  )
}

export function Truck(p) {
  return (
    <Svg {...p}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-2" />
      <circle cx="7"  cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  )
}

export function HardHat(p) {
  return (
    <Svg {...p}>
      <path d="M2 17h20v3H2z" />
      <path d="M5 17a7 7 0 0 1 14 0" />
      <path d="M10 6V4a2 2 0 0 1 4 0v2" />
      <path d="M10 7v6" />
      <path d="M14 7v6" />
    </Svg>
  )
}

// --- metric icons (Current State panel) ----------------------------------

export function Activity(p) {
  return (
    <Svg {...p}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Svg>
  )
}

export function Volume2(p) {
  return (
    <Svg {...p}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Svg>
  )
}

export function Shield(p) {
  return (
    <Svg {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  )
}

// --- ui chrome -----------------------------------------------------------

export function Menu(p) {
  return (
    <Svg {...p}>
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Svg>
  )
}
