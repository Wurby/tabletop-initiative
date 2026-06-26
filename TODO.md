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
- [x] Max HP in header popover — editable alongside AC and init for non-party units
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

## E2E Test Fixes ✓

- [x] `graveyard.spec.js` — strict mode: `getByText('200 XP')` and `getByPlaceholder('XP')` match multiple elements; scope to graveyard section
- [x] `graveyard.spec.js` — `locator('spinbutton').last()` times out in "changing party size updates per player split"; fixed to `modal.getByRole('spinbutton')`
- [x] `initiative.spec.js` — HP `+` stepper test: decrement to 19 first, then verify `+` brings to 20 (avoids max-cap)
- [x] `sync.spec.js` — "unit added on DM appears on Table": gate on `'Waiting for combat'` text to confirm Firestore listener established

---

## Phase 7 — Post-MVP Features

- [x] Auto-scroll active turn into view — when `combat.activeIndex` changes, scroll the highlighted unit card into view on both DM and table views
- [x] Max HP editable for party/follower units — extend the header popover (currently non-party only) so party members and followers can also have their max HP changed inline alongside init and AC
- [x] Conditions — 5e condition badges per unit (Poisoned, Stunned, etc.), DM toggles with custom free-text notes, table view shows them
- [x] Inspiration tracker — per-party-member inspiration tokens, DM awards/removes
- [x] Initiative tie-breaking — tied units show ▲/▼ order controls in the AC/init popover; secondary sort on `tiebreak` field
- [x] Image folders/groups — folder tabs filter the image grid; images assigned via ⊕ badge in the label row; new folders auto-selected on create

---

## Phase 8 — Polish & LAN Test ✓

- [x] Fix `useEffect` dependency arrays in `DMView` and `TableView` (`shownAt` missing from deps)
- [x] Firebase error toast component — fixed bottom-right, `bg-brand-danger`, auto-dismiss
- [x] Wrap all Firestore writes in try/catch and surface errors to toast
- [x] LAN test: run `npm run dev -- --host`, connect iPad to same network, verify both views work
- [x] Final `npm run lint` — fix all warnings
- [x] Final `npm run format` — format all files

---

## Phase 9 — Backend Maintenance ✓

- [x] Firebase scheduled function — delete campaigns with no activity in the past 30 days (`meta.lastActiveAt` timestamp, updated on any write)
- [x] Firebase scheduled function — delete orphaned Storage files for campaigns that no longer exist in Firestore
- [x] Add `meta.lastActiveAt` write to campaign on any DM action via `dmUpdate()` helper
- [x] `meta.locked` flag — DM can lock a campaign from deletion; visible/toggleable in admin dashboard
- [x] Admin dashboard — password-protected, sortable campaign table, manual cleanup trigger with configurable threshold
- [x] Wake lock on TableView — prevents device screen from sleeping during combat

---

## Phase 10 — Combat Controls (Optional)

> May be cut. Evaluate after Phase 8.

- [ ] "Next Turn" button — increments `combat.activeIndex`, wraps at initiative list length, auto-increments round when wrapping
- [ ] "Prev Turn" button — decrements `combat.activeIndex`
- [ ] `combat.active` toggle — future-proofing field, unplanned behavior as of now

---

## Phase 11 — AI Image Generation

> Uses `firebase/ai` (Firebase AI Logic + Imagen) — already bundled in Firebase v12, no extra packages needed.

- [x] Add sparkle (✨) button to the Images section header in DM view, alongside the existing Clear button
- [x] Build `ImageGenModal` component — prompt textarea, Generate button, preview pane (with loading/spinner state during generation)
- [x] Call Imagen via `firebase/ai` SDK on Generate; display result in preview pane
- [x] Post-generation controls: label input (AI-suggested via Gemini if left blank), Save, Reprompt (keeps prompt editable for iteration), Delete (clears prompt and discards image)
- [x] Save flow: fetch generated image blob → upload to Firebase Storage under `campaigns/{code}/images/` → append entry to `images[]` in Firestore — identical shape to manual uploads so the rest of the image system requires no changes
- [x] Reprompt: DM edits prompt freely and hits Generate again; previous preview is replaced
- [x] AI label suggestion: if DM saves with an empty label field, call Gemini text generation with the prompt to produce a short descriptive name

---

## Phase 12 — Unit Notes & Templates

### Notes Modal

**Trigger & button**
- [x] Add a pencil (✏) icon button to the status row in `UnitCard` body — right side of the same row as the `Status…` input, outside the header
- [x] No badge or count indicator needed — button is always visible

**Modal (centered overlay, same pattern as `PartyModal`)**
- [x] Build `UnitNotesModal` component — receives `unit`, `onUpdate`, `onClose`
- [x] Header: unit name + close button (top-right ×)
- [x] Folder tabs row below header — "All" tab + named folder tabs + `+ Folder` button; same tab/delete pattern as `ImageLibrary`
  - Creating a folder: inline input inline in the tab row (same UX as image folders)
  - Deleting a folder: × badge on hover; notes in that folder move to `folderId: null`
  - Folders are scoped per unit: stored in `unit.noteFolders: []`
- [x] Note list: scrollable area filtered by active folder; empty state copy ("No notes yet…" / "No notes in this folder…")
- [x] Each note card displays: optional title (bold, omitted if empty) + body text; pencil icon (edit) + × with inline confirm (delete)
- [x] Edit mode: title and body become editable inline in the note card; save on blur or Enter (body allows multiline)
- [x] `+` button (bottom of list or top-right of note area): adds inline empty note form (title input + body textarea) that saves as a new note on confirm

**Data model additions to unit object**
```
unit.noteFolders: [{ id, name }]
unit.notes: [{ id, title, body, folderId, createdAt }]
```
- [x] Initialize `noteFolders: []` and `notes: []` on new units in `handleAdd` in `InitiativeTracker`
- [x] Notes and folders travel with the unit to the graveyard on kill (no extra work — full unit object is stored)
- [x] Notes are only permanently gone when the unit is deleted from the graveyard

---

### Unit Templates Sidebar

**Trigger**
- [x] Add "Templates" button to DM header in `DMView`, next to the existing "Party" button
- [x] Button opens a right-side overlay sidebar (`templateOpen` state)

**Sidebar layout**
- [x] Fixed right-side panel, slides over content (not push), `z-40` or similar
- [x] Click-outside closes it (same pattern as existing popovers); also a `×` close button in the top-left of the panel
- [x] Header: "Templates" title + close button
- [x] Scrollable list of template entries + "New Template" form/button at the bottom

**Each template entry (display mode)**
- [x] Shows: name (prominent), HP / AC / type badge inline
- [x] Shows note count as a subtle label (e.g. "2 notes") if notes exist
- [x] "Add to initiative" button — adds a new unit to `campaign.initiative` with all template fields, `initiative: 0`, copying `notes` and `noteFolders` as fresh copies (new UUIDs)
- [x] Pencil icon to enter edit mode inline; × with confirm to delete the template

**Each template entry (edit mode)**
- [x] Editable fields: name, HP max, AC, type (mob/ally/ally toggleable)
- [x] Notes section: same folder-tab + note-list UI as `UnitNotesModal` — full create/edit/delete of notes on the template
- [x] Save / Cancel buttons

**New template form**
- [x] Inline form at bottom of sidebar: name, HP max, AC, type fields (same shape as `AddCard`)
- [x] On save: appends to `campaign.templates[]`; notes start empty

**Data model**
```
campaign.templates: [{
  id,
  name,
  hp: { max },
  ac,
  type,          // 'mob' | 'ally'
  noteFolders: [{ id, name }],
  notes: [{ id, title, body, folderId, createdAt }],
  createdAt,
}]
```
- [x] Initialize `campaign.templates: []` on campaign creation in `JoinScreen`
- [x] All template writes go through `dmUpdate(campaignCode, { templates: [...] })`
