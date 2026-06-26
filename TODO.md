# TODO — DnD Campaign Web App

---

## Phase 1 — Combat Controls ✓

**Initiative header layout:** title left · Prev/Next centered · round + timer + End Combat right

- [x] Add Prev (◀) and Next (▶) turn buttons centered in the Initiative section header
  - Next Turn: saves current elapsed time to localStorage (keyed by slot position), resets timer to 0, advances `combat.activeIndex` with wrap, auto-increments `combat.round` when wrapping from last unit back to first
  - Prev Turn: decrements `combat.activeIndex` with wrap, restores that slot's saved elapsed time from localStorage
- [x] Round counter: add manual Reset button alongside existing −; resets to 1 on End Combat; auto-increments on Next Turn wrap (manual + removed — round is now driven by Next Turn)
- [x] Turn timer — count-up, M:SS format (`0:00` → `1:23`)
  - Stored in Firestore as `combat.timerStartedAt` (timestamp), `combat.timerPaused` (bool), `combat.timerAccumulated` (ms accumulated before last pause)
  - Both DM and table view calculate elapsed client-side — no frequent writes
  - DM controls: pause/resume + manual reset (in Initiative header)
  - Auto-resets to 0 on Next Turn; End Combat stops and resets to 0
  - Displays in Initiative header on both DM and table view
- [x] Sticky Initiative header on table view only — header bar (round + timer) pins to top of viewport while unit list scrolls beneath; DM view scrolls normally

---

## Phase 2 — DM Notes ✓

- [x] Add `dmNoteFolders: []` and `dmNotes: []` to campaign initialization in `JoinScreen`
- [x] Build `DMNotesPanel` component — reuses `NotesEditor` (same folder/note structure as unit notes); all writes go through `dmUpdate(campaignCode, { dmNoteFolders: [...], dmNotes: [...] })`
- [x] Integrate `DMNotesPanel` into `DMView` as a third panel alongside Graveyard and Images — all three horizontal on large screens
- [x] Add a desktop breakpoint to `DMView`: below `xl` (1280px), Graveyard / Images / Notes collapse into a tabbed switcher; above it, three panels side by side
- [ ] Smoke test: create a DM note, switch tabs on a narrower window, verify Firestore sync

---

## Phase 4 — Template Polish + Initiative Card Redesign

### Template Sidebar

- [ ] Add `templateFolders: []` to `EMPTY_CAMPAIGN` in JoinScreen
- [ ] Add `folderId: null` to newly created templates
- [ ] Folder tabs across top of sidebar (same pattern as Images): All | named folders | + Folder button; × to delete folder on hover
- [ ] Replace inline add form with a single "+ Template" button that opens `TemplateModal`
- [ ] **TemplateModal** (shared for add and edit): two-pane layout — left pane (name, HP max, AC, type toggle, folder picker that defaults to active folder tab) + right pane (`NotesEditor` as a drawer); Save / Cancel footer
- [ ] **TemplateCard** (replaces list rows): colored header (mob = danger, ally = rivulet) with type badge + name; body showing HP max + AC; footer with Edit (Pen icon), Delete (Trash icon with confirm), and "Add to Initiative" button
- [ ] Edit button opens `TemplateModal` pre-filled with template data
- [ ] Notes in modal carry over to initiative via existing `cloneWithFreshIds` (already works)
- [ ] Smoke test: create a template in a folder with notes, add to initiative, verify notes appear on unit card

### Initiative Card Redesign

- [ ] Split UnitCard header into two rows: row 1 = type badge + name input + initiative number; row 2 = AC + ▶ active button
- [ ] Both AC and initiative number clickable to open the existing controls popover
- [ ] Smoke test: verify popover still works, active turn indicator still visible

---

## Phase 3 — AI Template Generation

- [ ] Add a sparkle/AI button to the `TemplatesSidebar` header — opens `TemplateGenModal`
- [ ] Build `TemplateGenModal` component — generation form + preview pane
- [ ] **Generation form (all fields optional):**
  - Name input (blank → AI auto-names; provided name guides generation)
  - Type toggle: mob / ally
  - CR: free-text input with inline dropdown of common values (1/8, 1/4, 1/2, 1–20+); DM can also type ranges or descriptions
  - Attack style: melee / ranged / both
  - Flying: yes / no toggle
  - Role: solo / boss / swarm
  - Tactical behavior: aggressive / cowardly / targets weak / targets strong / targets closest
  - Freeform context/background text field
  - "Add notes as context" button — opens `NotesContextModal`
- [ ] Build `NotesContextModal` — browse `campaign.dmNotes` by folder; each note shows quick-glance collapsed + expandable full view; toggle-select like a button; folder tab badge shows selected count; Done button closes; total selected count displayed
- [ ] Compose AI prompt from form fields + selected DM notes context; call `geminiModel` and parse JSON response into template shape (name, HP max, AC, type, notes with abilities/skills — no lore)
- [ ] Preview pane: render generated template as a unit card with notes section; multiple reprompts produce new tabs (one visible at a time, switchable); reprompt text field below card layers adjustments onto the original request
- [ ] Save: write current tab's template to `campaign.templates[]` via `dmUpdate`; Cancel: close modal with no write
- [ ] Smoke test: generate a CR 5 mob, reprompt to make it tougher, save and verify it appears in the templates sidebar
