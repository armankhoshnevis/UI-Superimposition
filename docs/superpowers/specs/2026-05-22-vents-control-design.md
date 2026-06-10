# Vents Control — Design

Adds a global "Vents" openness control to the cabin scene, mirroring the existing Windows control. Vents render as small fan symbols at fixed positions on each car model, with a blue opacity gradient driven by openness level.

## Scope

In-scope:
- Left-panel "Vents" slider with 4 levels (Closed / Slightly / Mostly / Open), placed directly under the existing "Windows" panel section.
- Fan-symbol overlays on the GV80 and GV60 car SVGs at fixed positions.
- Opacity-driven color ramp from transparent (Closed) to dark blue (Open).

Out of scope:
- Per-vent control (single global level, like windows).
- Backend audio behavior changes. The config field is added so it flows through `payload` to `/generate`, but no backend logic depends on it yet.
- Vents on any other vehicle (only GV80 and GV60 are registered today).

## Config State

In `ui/src/App.jsx`, extend the initial `config` object with:

```js
vent_state: 'V0',
vent_openness: 0,
```

`vent_openness` is `0..3`; `vent_state` is `V${vent_openness}` (or `V0` when closed). This mirrors the existing `window_openness` / `window_state` pair.

## Left Panel — UI

**`LeftPanel.jsx`** — add a new panel section immediately after the existing "Windows" panel:

```jsx
<div className="panel">
  <h3>Vents</h3>
  <VentControls config={config} setConfig={setConfig} />
</div>
```

**`VentControls.jsx`** (new file in `ui/src/components/left_panel/`) — structurally identical to `CarControls.jsx`:
- Labels: `['Closed', 'Slightly', 'Mostly', 'Open']`
- `<input type="range" min="0" max="3" step="1">` bound to `config.vent_openness`
- On change, sets `vent_openness` and derives `vent_state: 'V${v}'` (or `'V0'`)
- Reuses the existing `.car-controls`, `.car-sliders`, `.car-slider-block`, `.car-slider-title`, `.openness-labels` styles — no new CSS needed.

## Car Model — Vent Positions

Add a `vents` array to each model in `ui/src/car_models.js`, in PNG-pixel coordinates, structured like `mics`:

```js
vents: [
  { id: 'V_FL', x: ..., y: ... }, // front dash left
  { id: 'V_FM', x: ..., y: ... }, // front dash middle
  { id: 'V_FR', x: ..., y: ... }, // front dash right
  ...
]
```

### GV80 — 7 vents

PNG dimensions 908×1731; cabin 162..756 × 173..1471.

| ID    | Location                         | x   | y    |
|-------|----------------------------------|-----|------|
| V_FL  | Front dash, left                 | 270 | 615  |
| V_FM  | Front dash, middle               | 459 | 615  |
| V_FR  | Front dash, right                | 638 | 615  |
| V_ML  | Middle row center panel, left    | 430 | 950  |
| V_MR  | Middle row center panel, right   | 488 | 950  |
| V_RL  | Rear, left side wall             | 180 | 1340 |
| V_RR  | Rear, right side wall            | 738 | 1340 |

Front dash y = 615 sits just below the windshield band, above the wing mirrors (mirrors at y≈606). Middle-row pair sits between mics 3/4 (y=860) and the rear seats. Rear pair hugs the side walls (cabin x = 162 / 756) in the third-row / cargo area.

### GV60 — 5 vents (no rear row, per user direction)

PNG dimensions 996×1578; cabin 217..810 × 237..1421. Front dash y chosen just below the wing-mirror band (mirrors at y≈552); middle-row pair sits between mic rows.

| ID    | Location                         | x   | y    |
|-------|----------------------------------|-----|------|
| V_FL  | Front dash, left                 | 318 | 565  |
| V_FM  | Front dash, middle               | 513 | 565  |
| V_FR  | Front dash, right                | 708 | 565  |
| V_ML  | Middle row center panel, left    | 484 | 840  |
| V_MR  | Middle row center panel, right   | 542 | 840  |

## Center Panel — Rendering

In `ui/src/components/center_panel/CarView.jsx`:

1. Read `vent_openness` from config (defaulting to 0 via the existing `ensure` helper).
2. Compute fill opacity per level:
   ```js
   const VENT_OPACITIES = [0, 0.33, 0.66, 1.0]
   const ventFillOpacity = VENT_OPACITIES[ventOpenness] ?? 0
   ```
   This is the "clear → dark blue" gradient: Closed = fully transparent, Open = solid. Same opacity-driven approach the windows use, just inverted (windows go navy → white; vents go transparent → navy).
3. Render vents AFTER the windows group and BEFORE the microphones (so mics stay on top), with `pointerEvents="none"`:

   ```jsx
   {(model.vents || []).map(v => (
     <g key={v.id} pointerEvents="none">
       <circle cx={v.x} cy={v.y} r={22}
               fill="#1F3A5F" fillOpacity={ventFillOpacity}
               stroke="var(--navy)" strokeWidth={2.5} />
       {/* 3 curved fan blades, rotated 120° each */}
       <g stroke="var(--navy)" strokeWidth={2.5} fill="none">
         <path d="M 0,-12 Q 6,-6 0,0" transform={`translate(${v.x} ${v.y})`} />
         <path d="M 0,-12 Q 6,-6 0,0" transform={`translate(${v.x} ${v.y}) rotate(120)`} />
         <path d="M 0,-12 Q 6,-6 0,0" transform={`translate(${v.x} ${v.y}) rotate(240)`} />
       </g>
       <circle cx={v.x} cy={v.y} r={3} fill="var(--navy)" />
     </g>
   ))}
   ```

   The outer circle is the fan housing; its fill is the dark blue (`#1F3A5F`) ramped by `ventFillOpacity`. The stroke and blades stay at full opacity so the symbol is always visible even when "off."

### Color choice

`#1F3A5F` matches `WINDOW_COLORS[0]` (the dark navy used for closed windows). This keeps both controls visually coherent — same blue family. `var(--navy)` is used for the outline/blades since it's the existing CSS variable for that color.

## File Inventory

Modified:
- `ui/src/App.jsx` — add `vent_state`, `vent_openness` to initial config.
- `ui/src/car_models.js` — add `vents` array to GV80 and GV60.
- `ui/src/components/left_panel/LeftPanel.jsx` — add Vents panel section.
- `ui/src/components/center_panel/CarView.jsx` — render vent overlays.

Created:
- `ui/src/components/left_panel/VentControls.jsx` — slider control component.

No backend changes.

## Verification

Manual checks after implementation:
1. Vents panel appears under Windows panel on the left.
2. Slider moves between Closed / Slightly / Mostly / Open and the active label highlights.
3. On the GV80 car view: 7 fan symbols at the documented positions; opacity ramps from 0 → 1 as the slider moves from Closed → Open; outlines and blades remain visible at all levels.
4. On the GV60 car view: 5 fan symbols (no rear row), same opacity behavior.
5. Windows control still works independently — toggling windows does not affect vents and vice versa.
6. Microphones and FRONT/REAR labels still render on top of vents (no z-order regressions).
