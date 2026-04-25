# TODO — DnD Campaign Web App

---

## Phase 1 — Scaffold

- [x] `npm create vite@latest . -- --template react` in project root
- [x] Install runtime deps: `npm install firebase`
- [x] Install dev deps: `npm install -D tailwindcss @tailwindcss/vite prettier eslint-config-prettier`
- [x] Add `@tailwindcss/vite` plugin to `vite.config.js`
- [x] Create `src/index.css` with `@import "tailwindcss"` and `@theme` block for brand tokens
- [x] Add BespokeSerif `@font-face` declarations to `src/index.css`
- [x] Copy BespokeSerif WEB font files to `src/assets/fonts/`
- [x] Create `.env.local` with all `VITE_FIREBASE_*` variable stubs
- [x] Verify `.env.local` is in `.gitignore`
- [x] Create `.prettierrc`
- [x] Update `eslint.config.js` with prettier compat rule
- [x] Smoke test: `npm run dev` renders app with mint background and BespokeSerif font

---

## Phase 2 — Firebase Foundation

- [x] Create `src/lib/firebase.js` — init Firebase app from env vars, export `auth`, `db`, `storage`
- [x] Add anonymous sign-in on app mount (`signInAnonymously`)
- [x] Build `JoinScreen` component — join code input + "Create Campaign" / "Join Campaign" buttons
- [x] Campaign creation: generate join code (nanoid or similar), write `campaigns/{code}/meta` with `{ name, dmUid: uid }`, initialize empty `combat`, `initiative`, `graveyard`, `questXp`, `images` fields
- [x] Campaign join: read `campaigns/{code}/meta`, compare `dmUid` to current UID, set view mode
- [x] Store `{ campaignCode, viewMode }` in top-level React state + localStorage persistence
- [x] Set up real-time `onSnapshot` subscription to campaign document
- [x] Smoke test: two browser tabs — first gets DM view, second gets table view

---

## Phase 3 — Initiative Tracker

- [ ] Build `InitiativeTracker` component (DM) — section wrapper with "Add Unit" form
- [ ] Add unit form: name, initiative (number), HP max, AC inputs — writes new entry to `initiative[]`
- [ ] Build `UnitRow` component — displays unit, all fields editable inline
- [ ] HP current input — write to Firestore on blur
- [ ] Initiative / AC inputs — write to Firestore on blur
- [ ] Visible toggle — checkbox or icon button, writes `visible` flag
- [ ] Delete unit button — removes from `initiative[]`
- [ ] Sort `initiative[]` descending by `initiative` value before render
- [ ] Build `InitiativeList` component (Table view) — filters to `visible: true`, same sort, read-only
- [ ] Smoke test: DM edits HP on laptop, table view updates on second tab in ~1s

---

## Phase 4 — XP & Graveyard

- [x] Create `src/lib/xp.js` — CR → XP table (CR 0–30)
- [x] Kill confirmation redesigned — CR grid (9/page, 4 pages) pre-fills XP input; full unit stored in graveyard entry
- [x] Build `Graveyard` component (DM) — kill list + quest XP entries, running total, Return to initiative, delete, bonus XP form
- [x] Clear graveyard — modal with total XP, editable party size, per-member split; writes to `sessionLogs[]`; broadcasts `combat.lastSplit` for table view
- [x] Build `GraveyardView` component (Table) — read-only list, running total, last session split banner
- [x] Build `SessionLogModal` — past cleared sessions, accessible from DM header "Log" button

---

## Phase 5 — Image System

- [ ] Build `ImageUploader` component — file input, upload to `campaigns/{code}/images/{filename}` in Storage, append `{ url, label, uploadedAt }` to `images[]` in Firestore
- [ ] Build `ImageLibrary` component (DM) — grid of `images[]` entries, click triggers display
- [ ] On image select: write `combat.display = { type: "image", url, label }` to Firestore
- [ ] Clear display button: write `combat.display = { type: "none", url: "", label: "" }`
- [ ] Build `ImageModal` component (Table view) — subscribes to `combat.display`, renders full-screen overlay when `type === "image"`
- [ ] Smoke test: DM selects image, modal appears on table view tab

---

## Phase 6 — Combat Controls

- [ ] Active combat toggle in DM view — writes `combat.active`
- [ ] "Next Turn" button — increments `combat.activeIndex` (wraps at initiative list length)
- [ ] "Prev Turn" button — decrements `combat.activeIndex`
- [ ] Highlight active unit in `InitiativeTracker` and `InitiativeList` by matching index to sorted list

---

## Phase 7 — Polish & LAN Test

- [ ] HP bar component — full: `bg-brand-forest`, ≤50%: `bg-yellow-400`, ≤25%: `bg-brand-danger`
- [ ] Firebase error toast component — bottom-right, `bg-brand-danger`, auto-dismiss
- [ ] Wrap Firebase calls in try/catch and surface errors to toast
- [ ] LAN test: run `npm run dev -- --host`, connect iPad to same network, verify both views work
- [ ] Final `npm run lint` — fix all warnings
- [ ] Final `npm run format` — format all files

---

## Post-MVP Ideas (confirmed wanted)

- [ ] Conditions — 5e condition badges per unit (Poisoned, Stunned, etc.), DM toggles, table view shows them
- [ ] Session notes — persistent DM scratchpad per campaign
- [ ] Encounter presets — DM saves a unit group as a named encounter, drops them all into initiative at once
- [ ] Inspiration tracker — per-party-member inspiration tokens, DM awards/removes
