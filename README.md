# Hyundai Senior May Mixer — UI

React UI for composing in-cabin acoustic scenes used to stress-test Hyundai / Genesis in-car AI voice systems against external noise (traffic, weather, passenger sounds, etc.).

## Background

Senior May capstone project under contract with HATCI / Hyundai. The system synthesizes realistic in-cabin audio scenes — target speech plus background noise and competing speech, run through a cabin impulse response — so ASR pipelines can be evaluated across a range of signal-to-noise ratios.

This README covers the **frontend** half of the project. The Flask backend at [backend/app.py](backend/app.py) is treated here as a dependency the UI talks to over HTTP.

The backend is **out of scope** for this README. See [backend/app.py](backend/app.py) directly for endpoint definitions until a dedicated `backend/README.md` is written.

## Tech stack

Sourced from [ui/package.json](ui/package.json):

- React 19 + React DOM 19
- Vite 8 with `@vitejs/plugin-react`
- `axios` — HTTP client to Flask
- `wavesurfer.js` — waveform rendering in the preview modal
- ESLint (config in [ui/eslint.config.js](ui/eslint.config.js))

## UI features

- **Responsive layout** — 3-panel desktop; switches to a 3-page mobile layout below ~900px (no in-between sizes).
- **Left panel** ([ui/src/components/left_panel/](ui/src/components/left_panel/)): 
    - scenario picker 
    - speed slider (S0–S3)
    - window openness (W0–W3)
    - vent openness (V0–V3)
    - SNR slider (−10 to +20 dB).
- **Center panel** ([ui/src/components/center_panel/](ui/src/components/center_panel/)): 
    - top-down GV80 / GV60 car diagram 
    - click inside the cabin to place internal point sounds
    - Generate button 
    - preview modal (waveform + spectrogram via wavesurfer.js) 
    - "Last Generated" metadata modal and export form.
- **Right panel** ([ui/src/components/right_panel/](ui/src/components/right_panel/)): 
    - live metrics cards (stress, cabin dBA, masking level, ASR impact) 
    - sound mixer (mute LED, gain −24 → 0 dB, delete per row).
- **Sound library** — 
    - 15 sounds across 3 categories (global ambient, internal point, external directional); defined in [ui/src/sound_library.js](ui/src/sound_library.js). 
    - Hard cap of 8 sounds per category and 4 per side for external directional — enforced in [ui/src/components/right_panel/AddSoundModal.jsx](ui/src/components/right_panel/AddSoundModal.jsx).
- **Hover sync** — hovering a mixer row highlights its source in the car view, and vice versa.
- **Themed custom scrollbar** — see `ui/src/theme.css` / `ui/src/index.css`.

## Repository layout (frontend slice)

```
ui/
  src/
    App.jsx              # root: config state, modals, mobile panel switch
    main.jsx             # React DOM entry
    api.js               # axios calls to http://localhost:5000
    sound_library.js     # 15-sound catalog (3 categories)
    car_models.js        # GV80 / GV60 pixel coords, window/vent/mic anchors
    icons.jsx            # inline SVG icons
    theme.css / index.css / App.css
    components/
      Header.jsx
      left_panel/
      center_panel/
      right_panel/
  public/                # favicon, icons.svg
  package.json, vite.config.js, eslint.config.js

backend/                 # Flask API (out of scope — see backend/app.py)
raw/, scenarios/,        # data dirs used by the backend
synthetic/, metadata/,
exports/, presets/
```

## Prerequisites

- Node.js 18+ (required by Vite 8).
- A running backend at `http://localhost:5000`. The URL is **hardcoded** in [ui/src/api.js](ui/src/api.js); without it, the UI loads but `/scenarios` and `/generate` calls fail.

## Setup & run

```bash
cd ui
npm install
npm run dev       # Vite dev server, default http://localhost:5173
npm run build     # production build to ui/dist/
npm run preview   # serve the built bundle
npm run lint      # ESLint
```

## Running the backend (pointer)

Just enough to unblock a frontend dev:

```bash
# from repo root
python backend/app.py
```

Python deps are pinned in [backend/requirements.txt](backend/requirements.txt) (`pip install -r backend/requirements.txt`). Note: `librosa` has no wheels for Python 3.14 — use Python 3.12 or the Docker image ([Dockerfile.backend](Dockerfile.backend)) if you need it; the backend stubs it for the core mix path otherwise.

Backend exposes (full list in [backend/app.py](backend/app.py)): `GET /scenarios`, `POST /generate`, `GET /files`, `GET /audio/<f>`, `GET /exports/<f>`, `POST /export`, `POST /preset`.

## Configuration

- Backend URL is **hardcoded** in [ui/src/api.js](ui/src/api.js). To make it environment-driven, switch to `import.meta.env.VITE_API_BASE` and add `ui/.env.local`. Known follow-up.
- No other env vars currently.

## Where to make common changes

| Change | File |
|---|---|
| Add / edit a sound | [ui/src/sound_library.js](ui/src/sound_library.js) |
| Add / re-anchor a car model | [ui/src/car_models.js](ui/src/car_models.js) |
| Change category / side limits (8 / 4) | [ui/src/components/right_panel/AddSoundModal.jsx](ui/src/components/right_panel/AddSoundModal.jsx) |
| Change backend URL or endpoint shape | [ui/src/api.js](ui/src/api.js) |
| Adjust mobile breakpoint | [ui/src/App.jsx](ui/src/App.jsx) (look for the `< 900` check) |
| Theme / scrollbar | `ui/src/theme.css`, `ui/src/index.css` |

## Schema note

[ui/src/App.jsx](ui/src/App.jsx) has a `deriveLegacyPayload()` helper that translates the new `sound_sources` schema into the older `overlays` / `mixer` schema the backend originally expected. Don't remove it while "cleaning up duplicate state" — it's the compatibility shim that keeps `/generate` working.

## Status

- UI is complete enough for end-to-end demos against the Flask backend.
- Frontend-only team scope at this stage.
- Open follow-ups: env-driven backend URL, replacing the default Vite template in [ui/README.md](ui/README.md), and a dedicated `backend/README.md`.
