# AGENTS.md — Tabletop Initiative

Guidance for AI coding agents working in this repository.

---

## Project Overview

Tabletop Initiative is a local LAN web app for running D&D sessions. A laptop runs the DM view; an iPad on the same network hits the same Vite dev server for the table view. No cloud hosting — this is a dev server tool.

**Stack:** Vite + React + Firebase (anonymous auth, Firestore, Storage) + Tailwind CSS (vanilla) + ESLint + Prettier

---

## Running the Dev Server

```bash
npm run dev          # localhost only
npm run dev -- --host  # expose to LAN (required for iPad access)
```

---

## Project Structure

```
src/
├── assets/
│   └── fonts/           # BespokeSerif web fonts (.woff2, .woff)
├── components/          # Shared UI components
├── views/
│   ├── DMView.jsx        # Full DM controls
│   └── TableView.jsx     # Read-only player view
├── hooks/               # Firebase + Firestore hooks
├── lib/
│   ├── firebase.js       # Firebase app init
│   └── xp.js            # 5e XP thresholds constant
├── App.jsx
└── main.jsx
```

---

## Firebase Architecture

**Auth:** Anonymous sign-in only. First user to join a campaign becomes the DM — their UID is written to `campaigns/{joinCode}/meta.dmUid`. All subsequent joins get the table view.

**Firestore schema:**

```
campaigns/{joinCode}/
├── meta:        { name, dmUid }
├── combat:      { active, activeIndex, display: { type, url, label } }
├── initiative:  [{ id, name, initiative, hp: { current, max }, ac, visible }]
├── graveyard:   [{ id, name, xp, killedAt }]
├── questXp:     [{ id, label, xp, awardedAt }]
└── images:      [{ url, label, uploadedAt }]
```

**Storage path:** `campaigns/{joinCode}/images/{filename}`

**XP is always derived at runtime** — never stored as a total. `totalXp = sum(graveyard[].xp) + sum(questXp[].xp)`. Party level comes from the local 5e threshold constant in `src/lib/xp.js`.

---

## Key Conventions

- **Firestore writes on blur/submit**, not on every keystroke — avoid write-per-keypress patterns on initiative/HP inputs.
- **Join code is the document ID** in Firestore and never changes for the lifetime of a campaign.
- **No drag-and-drop** on the initiative list — it is sorted by numeric `initiative` value.
- **`visible` flag** on initiative entries controls whether a unit appears in the table view. DM always sees all units.
- Tailwind utility classes only — no CSS modules, no inline styles, no styled-components.
- Component files use `.jsx` extension.
- Firebase config is loaded from environment variables — never hardcode keys.

---

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

These live in `.env.local` (gitignored).

---

## Linting & Formatting

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

ESLint uses the default recommended ruleset. Prettier uses project defaults (see `.prettierrc`).

---

## Out of Scope (for now)

- VTT map — planned for a future phase
- Multi-DM or DM auth beyond first-join UID matching
- Cloud deployment / hosting
- Dark mode
