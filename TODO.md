# TODO — DnD Campaign Web App

---

## Phase 1 — Scaffold ✓

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

## Phase 2 — Firebase Foundation ✓

- [x] Create `src/lib/firebase.js` — init Firebase app from env vars, export `auth`, `db`, `storage`
- [x] Add anonymous sign-in on app mount (`signInAnonymously`)
- [x] Build `JoinScreen` — join code input + "Create Campaign" / "Join Campaign" buttons
- [x] Campaign creation: generate join code, write `campaigns/{code}/meta`, initialize empty `combat`, `initiative`, `graveyard`, `questXp`, `images` fields
- [x] Campaign join: read `campaigns/{code}/meta`, compare `dmUid` to current UID, set view mode
- [x] Store `{ campaignCode, viewMode }` in top-level React state + localStorage persistence
- [x] Set up real-time `onSnapshot` subscription to campaign document
- [x] Smoke test: two browser tabs — first gets DM view, second gets table view

---

## Phase 3 — Initiative Tracker ✓

- [x] Build `InitiativeTracker` component (DM) — section header with round counter, End Combat confirm, and Add Unit card
- [x] Add unit form: name, initiative, HP max, AC inputs — writes new entry to `initiative[]`
- [x] Build `UnitCard` component — all fields editable inline with steppers for HP/AC/initiative
- [x] HP current/max/temp steppers — write to Firestore on blur or button click
- [x] Initiative / AC in header popover — write to Firestore on commit
- [x] Visible toggle — eye icon button, writes `visible` flag; hidden units show placeholder on table
- [x] Kill button — CR grid (9/page, paginated) auto-confirms with XP; moves unit to graveyard
- [x] Delete unit button — removes from `initiative[]`
- [x] Sort `initiative[]` descending by `initiative` value before render
- [x] Build `InitiativeList` component (Table view) — same sort, read-only cards with HP bar, AC/HP visibility gating
- [x] Active turn tracking — `combat.activeIndex` written on ▶ click; highlighted in both tracker and list
- [x] Round counter — DM increments/decrements; displayed in Initiative section header
- [x] End Combat — confirms then clears `initiative[]`, resets `combat.activeIndex` and `combat.round`
- [x] `AddCard` min-h fix — ensure add card matches min height of unit cards
- [x] Smoke test: DM edits HP on laptop, table view updates on second tab in ~1s

---

## Phase 4 — XP & Graveyard ✓

- [x] Create `src/lib/xp.js` — CR → XP table (CR 0–30)
- [x] Kill confirmation — CR grid (9/page, 4 pages) auto-confirms with XP; full unit stored in graveyard entry
- [x] Build `Graveyard` component (DM) — kill list + quest XP entries, running total, Return to initiative, delete, bonus XP form
- [x] Clear graveyard — modal with total XP, editable party size, per-member split; writes to `sessionLogs[]`; broadcasts `combat.lastSplit` for table view
- [x] Session summary modal — auto-shows on both DM and table when session is cleared; DM-only dismiss syncs close to table via `combat.lastSplit.dismissed`
- [x] Build `GraveyardView` component (Table) — read-only list, running total, last session split banner
- [x] Build `SessionLogModal` — past cleared sessions, accessible from DM header "Log" button
- [x] Session log — "Clear all sessions" in `SessionLogModal` header with inline confirmation; wipes `sessionLogs[]` from Firestore
- [x] `GraveyardView` (Table) — last session compact in header right (`Last: X XP ea`); total XP moved to top of kill list as a subtle `Total` row

---

## Phase 5 — Image System ✓

- [x] Build `ImageLibrary` component (DM) — label input + upload button with progress, image grid, active image indicator, delete on hover, Clear button when image is displaying
- [x] Upload: file → Firebase Storage at `campaigns/{code}/images/{uuid}-{filename}`, append `{ id, url, storagePath, label, uploadedAt }` to `images[]`
- [x] On image select: write `combat.display = { type: "image", url, label }` to Firestore
- [x] Clear display button: write `combat.display = { type: "none", url: "", label: "" }`
- [x] Delete image: remove from Storage + Firestore; clears display if that image was active
- [x] Build `ImageModal` component (Table view) — full-screen black overlay when `combat.display.type === "image"`; label shown in bottom bar if present
- [x] Smoke test: DM selects image, modal appears on table view tab

---

## Phase 6 — Follower Type & Party Corrections ✓

- [x] Add `follower` unit type — HP tracking (ally behavior), no death saves, forest header color with inner rivulet border, configured only via party modal
- [x] Party modal — support adding followers (name + HP max + AC); distinguish from PC party members
- [x] Removing a follower from party config also removes them from `initiative[]` if present
- [x] End combat — clear only non-party, non-follower units (allies and mobs); party and followers persist
- [x] Cycle button on `UnitCard` header narrowed to ally ↔ mob only (party and follower are party-config-only)
- [x] Follower color: forest background with a thin rivulet inner border, visually distinct from pure party green and not interfering with the active turn outline

---

## E2E Test Fixes (Remaining)

- [ ] `graveyard.spec.js` — strict mode: `getByText('200 XP')` and `getByPlaceholder('XP')` match multiple elements; scope to graveyard section or use `.first()`
- [ ] `graveyard.spec.js` — `locator('spinbutton').last()` times out in "changing party size updates per player split"; needs a better locator for the End Session party size input
- [ ] `graveyard.spec.js` — `getByDisplayValue('Skeleton')` replaced with `getByRole('textbox')` but confirm no remaining `getByDisplayValue` usage
- [ ] `initiative.spec.js` — HP `+` stepper test intermittently fails (value stays at 20); investigate whether popover state or Firebase write timing causes the miss
- [ ] `sync.spec.js` — "unit added on DM appears on Table" occasionally slow; may need a short wait after `joinAsTable` before adding the unit to ensure Firestore listener is established

---

## Phase 7 — Post-MVP Features

- [ ] Conditions — 5e condition badges per unit (Poisoned, Stunned, etc.), DM toggles, table view shows them
- [ ] Session notes — persistent DM scratchpad per campaign
- [ ] Encounter presets — DM saves a unit group as a named encounter, drops them all into initiative at once
- [ ] Inspiration tracker — per-party-member inspiration tokens, DM awards/removes
- [ ] Image annotation — DM full-screen view with drawing/annotation tools; annotations broadcast live to table view overlay

---

## Phase 8 — Polish & LAN Test ✓

- [x] Fix `useEffect` dependency arrays in `DMView` and `TableView` (`shownAt` missing from deps)
- [x] Firebase error toast component — fixed bottom-right, `bg-brand-danger`, auto-dismiss
- [x] Wrap all Firestore writes in try/catch and surface errors to toast
- [x] LAN test: run `npm run dev -- --host`, connect iPad to same network, verify both views work
- [x] Final `npm run lint` — fix all warnings
- [x] Final `npm run format` — format all files

---

## Phase 9 — Backend Maintenance

- [ ] Firebase scheduled function — delete campaigns with no activity in the past 30 days (`meta.lastActiveAt` timestamp, updated on any write)
- [ ] Firebase scheduled function — delete orphaned Storage files for campaigns that no longer exist in Firestore
- [ ] Add `meta.lastActiveAt` write to campaign on any DM action (can batch with existing `updateDoc` calls)

---

## Phase 10 — Combat Controls (Optional)

> May be cut. Evaluate after Phase 8.

- [ ] "Next Turn" button — increments `combat.activeIndex`, wraps at initiative list length, auto-increments round when wrapping
- [ ] "Prev Turn" button — decrements `combat.activeIndex`
- [ ] `combat.active` toggle — future-proofing field, unplanned behavior as of now
