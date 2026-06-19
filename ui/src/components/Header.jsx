// ui/src/components/Header.jsx
import { useEffect, useRef, useState } from 'react'
import hatciLogo from '../assets/HATCILogo.jpeg'
import { Menu } from '../icons.jsx'

const PANEL_ITEMS = [
  { key: 'center', label: 'Diagram' },
  { key: 'left',   label: 'Settings' },
  { key: 'right',  label: 'Overview' },
]

export default function Header({ mobilePanel, setMobilePanel }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Outside-click closes the dropdown. Uses `mousedown` (not `click`) so the
  // hamburger button's own onClick doesn't race with this listener.
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // ESC closes the dropdown. Capture phase + stopPropagation so we win over
  // the App.jsx ESC handler that cancels pending placement — when the
  // dropdown is closed we don't attach anything, so that handler runs as
  // usual.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <div className="header">
      <img className="header-logo" src={hatciLogo} alt="Hyundai Motor Group (HATCI)" />
      <h1>In-Vehicle Audio Generation Tool</h1>
      <span className="subtitle">HATCI Research Project</span>
      <div className="header-spacer" />
      <div className="header-menu" ref={menuRef}>
        <button
          type="button"
          className="header-hamburger"
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="header-mobile-menu"
          onClick={() => setOpen(o => !o)}
        >
          <Menu size={22} />
        </button>
        {open && (
          <ul id="header-mobile-menu" role="menu" className="header-dropdown">
            {PANEL_ITEMS.map(({ key, label }) => {
              const active = mobilePanel === key
              return (
                <li key={key} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
                    className={`header-dropdown-item${active ? ' is-active' : ''}`}
                    onClick={() => { setMobilePanel(key); setOpen(false) }}
                  >{label}</button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
