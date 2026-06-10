# Vents Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global "Vents" openness control that mirrors the existing Windows control, with fan-symbol overlays on the GV80 and GV60 car views and a blue opacity gradient driven by openness level.

**Architecture:** State lives in `App.jsx` as `vent_openness` (0–3) and derived `vent_state` ('V0'–'V3'), mirroring the Windows pattern. A new `VentControls` component renders the slider in the left panel. Vent positions live in the `car_models.js` registry as PNG-pixel coordinates. `CarView.jsx` reads `vent_openness` and renders a fan-shaped SVG overlay at each registered position with fill opacity scaled by level.

**Tech Stack:** React 19, Vite, plain SVG. The project has no test framework configured — verification is manual via `npm run dev` and observing the browser, plus `npm run build` to confirm no compile errors. (See [spec](../specs/2026-05-22-vents-control-design.md) for the design rationale.)

---

## File Inventory

**Create:**
- `ui/src/components/left_panel/VentControls.jsx` — slider control component

**Modify:**
- `ui/src/App.jsx` — add `vent_state` and `vent_openness` to initial config
- `ui/src/car_models.js` — add `vents` array to GV80 (7 vents) and GV60 (5 vents)
- `ui/src/components/left_panel/LeftPanel.jsx` — add Vents panel section under Windows
- `ui/src/components/center_panel/CarView.jsx` — render fan overlays driven by `vent_openness`

No backend changes. No new CSS — reuses `.car-controls`, `.car-slider-block`, `.openness-labels` from `LeftPanel.css`.

---

### Task 1: Add `vent_openness` and `vent_state` to initial config

Adds the state fields so every subsequent component can read them without `undefined` guards beyond the existing `ensure` helper.

**Files:**
- Modify: `ui/src/App.jsx` (the `useState` initializer around lines 54–66)

- [ ] **Step 1: Modify the initial config in App.jsx**

Edit `ui/src/App.jsx`. In the `useState` initializer for `config`, add two fields right after `window_openness: 0,`:

```jsx
const [config, setConfig] = useState({
  scenario_id: '',
  speed_state: 'S0',
  speed_mph: 0,
  window_state: 'W0',
  window_openness: 0,
  vent_state: 'V0',
  vent_openness: 0,
  sound_sources: [],
  pending_placement: null,
  snr_db: 5,
  speaker_position: 'driver',
  requested_source: null,
  car_model: 'gv80',
})
```

- [ ] **Step 2: Verify the build still compiles**

Run from the `ui/` directory:

```bash
npm run build
```

Expected: build succeeds with no errors. The two new fields aren't read anywhere yet, but the JSON sent to the backend will now include them — backend ignores unknown fields, so that's fine.

- [ ] **Step 3: Commit**

```bash
git add ui/src/App.jsx
git commit -m "feat: add vent_state/vent_openness to config state"
```

---

### Task 2: Add vent positions to car_models.js

Adds a `vents` array to each model with PNG-pixel coordinates from the spec.

**Files:**
- Modify: `ui/src/car_models.js` (GV80 entry around lines 30–53; GV60 entry around lines 54–77)

- [ ] **Step 1: Add vents to the GV80 model**

In `ui/src/car_models.js`, find the GV80 entry. After the `mics: [...]` array (line 52), and before the closing `},` of the GV80 object, add a `vents` array. The final GV80 entry should look like:

```js
gv80: {
  id: 'gv80',
  name: 'Genesis GV80',
  subtitle: '3-row SUV',
  image: gv80Img,
  imageW: 908,
  imageH: 1731,
  contentRect: { x: 105, y:  79, w: 705, h: 1590 },
  cabin:       { x: 162, y: 173, w: 594, h: 1298 },
  windows: [
    { id: 'FL', cx: 178, cy:  790, rx: 18, ry: 78 },
    { id: 'FR', cx: 740, cy:  790, rx: 18, ry: 78 },
    { id: 'RL', cx: 178, cy: 1090, rx: 18, ry: 78 },
    { id: 'RR', cx: 740, cy: 1090, rx: 18, ry: 78 },
  ],
  mics: [
    { id: 'mic1', x: 430, y:  540 },
    { id: 'mic2', x: 488, y:  540 },
    { id: 'mic3', x: 375, y: 860 },
    { id: 'mic4', x: 543, y: 860 },
  ],
  vents: [
    // Front dash (3 across, just below windshield band)
    { id: 'V_FL', x: 270, y:  615 },
    { id: 'V_FM', x: 459, y:  615 },
    { id: 'V_FR', x: 638, y:  615 },
    // Middle row, center panel (between front seats, facing rear)
    { id: 'V_ML', x: 430, y:  950 },
    { id: 'V_MR', x: 488, y:  950 },
    // Rear side walls (third row / cargo area)
    { id: 'V_RL', x: 180, y: 1340 },
    { id: 'V_RR', x: 738, y: 1340 },
  ],
},
```

- [ ] **Step 2: Add vents to the GV60 model**

In the same file, find the GV60 entry. After its `mics` array and before the closing `},`, add:

```js
vents: [
  // Front dash (3 across, just below wing-mirror band)
  { id: 'V_FL', x: 318, y:  565 },
  { id: 'V_FM', x: 513, y:  565 },
  { id: 'V_FR', x: 708, y:  565 },
  // Middle row, center panel (between front seats, facing rear)
  { id: 'V_ML', x: 484, y:  840 },
  { id: 'V_MR', x: 542, y:  840 },
],
```

(No rear-row vents on GV60, per design.)

- [ ] **Step 3: Verify the build still compiles**

Run from the `ui/` directory:

```bash
npm run build
```

Expected: build succeeds with no errors. Vents aren't rendered yet — that comes in Task 4.

- [ ] **Step 4: Commit**

```bash
git add ui/src/car_models.js
git commit -m "feat: register vent positions for GV80 and GV60"
```

---

### Task 3: Create VentControls component and wire it into LeftPanel

Adds the left-panel slider. Structurally identical to `CarControls.jsx`. No new CSS is needed — reuses existing classes.

**Files:**
- Create: `ui/src/components/left_panel/VentControls.jsx`
- Modify: `ui/src/components/left_panel/LeftPanel.jsx` (import + new panel block)

- [ ] **Step 1: Create VentControls.jsx**

Create `ui/src/components/left_panel/VentControls.jsx` with the following content:

```jsx
// ui/src/components/left_panel/VentControls.jsx
// Single global vent-openness control. The slider applies uniformly to
// all vents in the cabin — Closed / Slightly / Mostly / Open.

const VENT_OPENNESS_LABELS = ['Closed', 'Slightly', 'Mostly', 'Open']

function deriveVentState(openness) {
  return openness === 0 ? 'V0' : `V${openness}`
}

export default function VentControls({ config, setConfig }) {
  const ventOpenness = config.vent_openness ?? 0

  function changeVentOpenness(e) {
    const v = Number(e.target.value)
    setConfig({
      ...config,
      vent_openness: v,
      vent_state: deriveVentState(v),
    })
  }

  return (
    <div className="car-controls">
      <div className="car-sliders">
        <div className="car-slider-block">
          <div className="car-slider-title">Vent Openness</div>
          <div className="slider-row" style={{ gridTemplateColumns: '1fr' }}>
            <input
              type="range"
              min="0" max="3" step="1"
              value={ventOpenness}
              onChange={changeVentOpenness}
            />
          </div>
          <div className="openness-labels">
            {VENT_OPENNESS_LABELS.map((label, i) => (
              <span key={label} className={i === ventOpenness ? 'active' : ''}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Import VentControls and add a Vents panel to LeftPanel.jsx**

Edit `ui/src/components/left_panel/LeftPanel.jsx`.

First, add the import alongside the other component imports near the top (after the `CarControls` import, around line 5):

```jsx
import CarControls from './CarControls'
import VentControls from './VentControls'
```

Then, in the JSX, add a new `<div className="panel">` block immediately after the existing Windows panel (the block ending at line 95 in the current file). The Windows panel and the new Vents panel together should look like:

```jsx
<div className="panel">
  <h3>Windows</h3>
  <CarControls config={config} setConfig={setConfig} />
</div>

<div className="panel">
  <h3>Vents</h3>
  <VentControls config={config} setConfig={setConfig} />
</div>
```

- [ ] **Step 3: Manually verify the slider in the browser**

From the `ui/` directory:

```bash
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`). Expected:
- A "Vents" panel appears directly under the "Windows" panel on the left.
- The slider has 4 stops labeled Closed / Slightly / Mostly / Open.
- Moving the slider highlights the active label (matches Windows behavior visually).
- No console errors.

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 4: Commit**

```bash
git add ui/src/components/left_panel/VentControls.jsx ui/src/components/left_panel/LeftPanel.jsx
git commit -m "feat: add Vents panel with openness slider to left panel"
```

---

### Task 4: Render fan-symbol overlays in CarView

Reads `vent_openness` from config, computes a per-level fill opacity, and renders a circular fan icon at each registered vent position.

**Files:**
- Modify: `ui/src/components/center_panel/CarView.jsx`

- [ ] **Step 1: Add the vent opacity ramp constant near the top of CarView.jsx**

Edit `ui/src/components/center_panel/CarView.jsx`. Just after the existing `WINDOW_COLORS` constant (around line 7), add:

```jsx
// Vent fill opacity per openness level: Closed (transparent) → Open (solid).
const VENT_OPACITIES = [0, 0.33, 0.66, 1.0]
// Dark navy fill for vent housings — matches WINDOW_COLORS[0] for visual coherence.
const VENT_FILL = '#1F3A5F'
```

- [ ] **Step 2: Read vent_openness inside the component**

Just after the existing `windowOpenness` line (currently around line 25, `const windowOpenness = ensure(config, 'window_openness', 0)`), add:

```jsx
const ventOpenness = ensure(config, 'vent_openness', 0)
const ventFillOpacity = VENT_OPACITIES[ventOpenness] ?? 0
```

- [ ] **Step 3: Render the vents group between windows and microphones**

In `CarView.jsx`, find the existing microphones rendering block (the one that starts with the comment `{/* Microphones — accept both PNG-pixel coords and legacy 0..1 norms */}` around line 148). Immediately BEFORE that block (and AFTER the windows `.map(...)` block), insert:

```jsx
{/* Vents — fan symbols at registered positions, fill opacity scales with openness */}
{(model.vents || []).map(v => (
  <g key={v.id} pointerEvents="none">
    <circle cx={v.x} cy={v.y} r={22}
            fill={VENT_FILL} fillOpacity={ventFillOpacity}
            stroke="var(--navy)" strokeWidth={2.5} />
    <g stroke="var(--navy)" strokeWidth={2.5} fill="none" strokeLinecap="round">
      <path d="M 0,-12 Q 6,-6 0,0" transform={`translate(${v.x} ${v.y})`} />
      <path d="M 0,-12 Q 6,-6 0,0" transform={`translate(${v.x} ${v.y}) rotate(120)`} />
      <path d="M 0,-12 Q 6,-6 0,0" transform={`translate(${v.x} ${v.y}) rotate(240)`} />
    </g>
    <circle cx={v.x} cy={v.y} r={3} fill="var(--navy)" />
  </g>
))}
```

The outer circle is the fan housing; only its fill is opacity-ramped. The blades, hub dot, and outline use full-opacity navy so the symbol stays visible at every level (including Closed).

- [ ] **Step 4: Manually verify in the browser**

From the `ui/` directory:

```bash
npm run dev
```

Expected on the **GV80** view (default):
- 7 fan symbols visible: 3 at the front dash, 2 in the middle-row center panel, 2 on the rear side walls.
- With Vents = Closed, each fan housing is transparent inside but the navy outline + blades + hub dot remain visible.
- Sliding to Slightly / Mostly / Open progressively fills the housings dark blue.
- Toggling the Windows slider does not affect vents and vice versa.

Switch to **GV60** (via the model selector — wherever that lives in the UI):
- 5 fan symbols visible: 3 front dash, 2 middle row. No rear vents.
- Same opacity behavior as GV80.

Also verify:
- Mics (numbered FL/FR/RL/RR) still render on top of any nearby vents (the vents group is rendered before mics, so mics z-stack above).
- FRONT/REAR labels are unaffected.
- No console errors.

Stop the dev server once verified.

- [ ] **Step 5: Run the production build**

From the `ui/` directory:

```bash
npm run build
```

Expected: build succeeds with no errors or warnings introduced by the new code.

- [ ] **Step 6: Commit**

```bash
git add ui/src/components/center_panel/CarView.jsx
git commit -m "feat: render vent fan overlays driven by vent_openness"
```

---

### Task 5: Final verification

Walk through the spec's verification checklist to confirm everything works end-to-end before declaring the feature complete.

**Files:** none modified — manual verification only.

- [ ] **Step 1: Start the dev server**

From the `ui/` directory:

```bash
npm run dev
```

- [ ] **Step 2: Walk through the spec verification list**

Confirm each of the following in the browser. All must pass:

1. Vents panel is directly under the Windows panel on the left.
2. Slider has 4 stops: Closed / Slightly / Mostly / Open. Active label is highlighted.
3. GV80 view: 7 fan symbols at the documented positions; housing fill ramps from transparent (Closed) → solid dark blue (Open); outline/blades/hub always visible.
4. GV60 view: 5 fan symbols (no rear row); same opacity behavior.
5. Windows control still works independently of vents.
6. Microphones and FRONT/REAR labels render unaffected.
7. Browser console is clear of new errors/warnings.

- [ ] **Step 3: Stop the server and confirm no uncommitted changes**

Stop with Ctrl+C, then:

```bash
git status
```

Expected: working tree clean (all changes from Tasks 1–4 already committed).

---

## Self-Review

**Spec coverage:**
- Config state (`vent_state`, `vent_openness`) → Task 1
- Left-panel slider with 4 labels → Task 3
- `VentControls` component → Task 3
- Vent positions for GV80 (7) and GV60 (5) → Task 2
- Fan-symbol rendering with opacity ramp → Task 4
- Color coherence with windows (`#1F3A5F`, `var(--navy)`) → Task 4
- Z-order (vents below mics) → Task 4 Step 3
- Verification checklist → Task 5

All spec items covered.

**Placeholder scan:** No TBDs, no "implement appropriate X," no vague test instructions. Every code step shows the exact code to write.

**Type/name consistency:** `vent_openness` / `vent_state` used consistently; `VENT_OPACITIES` / `VENT_FILL` introduced in Task 4 Step 1 and used in Steps 2–3; `model.vents` matches the array name added in Task 2; `VentControls` component name consistent between create and import.

**Note on TDD:** The project (`ui/package.json`) has no test framework configured — only `dev`, `build`, `lint`, `preview` scripts. Adding vitest/RTL for this small visual feature would be larger than the feature itself. Per the spec, verification is manual via `npm run dev` plus `npm run build` as a compile-error gate. The plan flags this explicitly so the engineer doesn't go hunting for a test runner.
