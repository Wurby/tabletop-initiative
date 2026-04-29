# Manual Testing Checklist

Open two browser tabs for all tests: **Tab A** as DM (first to create), **Tab B** as Table (second to join with the same code).

---

## Setup

- [ ] `npm run dev` starts without errors
- [ ] App renders with mint background and BespokeSerif font
- [ ] Tab A: "Create Campaign" → lands on DM view, shows campaign name and join code
- [ ] Tab B: enter join code → lands on Table view (no DM controls visible)
- [ ] Refresh Tab A → still on DM view (localStorage persistence)
- [ ] Refresh Tab B → still on Table view (localStorage persistence)
- [ ] "Leave" button on either tab → returns to join screen and clears stored session

---

## Phase 3 — Initiative Tracker

### Adding units

- [ ] Add card: leave name blank → name field shows error state, unit not added
- [ ] Add card: leave initiative blank → initiative field shows error state
- [ ] Add card: leave HP blank → HP field shows error state
- [ ] Add card: fill all fields, click Add → card appears in tracker
- [ ] Add card: fill fields, press Enter in any field → unit added
- [ ] New mob card appears with M label and red header
- [ ] Cycle type button (M label) on add card: M → A → M (only mob ↔ ally, no P)
- [ ] Add an ally (A) — rivulet header
- [ ] Units sort descending by initiative value immediately on add

### UnitCard — DM view

- [ ] Click AC / initiative display in header → popover opens with steppers
- [ ] Click outside popover → popover closes
- [ ] AC stepper: +/- buttons and direct input all update the value
- [ ] Initiative stepper: change value → card re-sorts in the list
- [ ] Status field: type text, tab away → persists
- [ ] HP current stepper: click +1 → value updates; click −1 → decrements; won't go below 0 or above max
- [ ] HP max shown below the stepper
- [ ] TMP stepper: set a temp HP value → temp bar appears on health bar
- [ ] HP bar colors: near-full = green, 50–75% = yellow, 25–50% = orange, below 25% = red
- [ ] Eye button (footer): toggle → unit dims to 50% opacity on DM view
- [ ] HP toggle (footer): toggles HP visibility flag
- [ ] AC toggle: only visible on mob cards (not ally, party, follower)
- [ ] Mob cycle button: M → A → M (no other types)
- [ ] Kill button → CR grid appears (9 entries, paginated)
- [ ] CR grid page nav: ‹ / › buttons; first page has ‹ disabled, last has › disabled
- [ ] Click a CR entry → unit disappears from initiative, appears in Graveyard
- [ ] Delete button (✕) → unit removed from initiative with no confirmation

### Active turn

- [ ] Click ▶ on a card → that card gets the active outline on DM view
- [ ] Active outline syncs to Table view (Tab B) within ~1 second
- [ ] Clicking ▶ on a different card moves the outline

### Round counter

- [ ] Round counter shows "1" on load
- [ ] - increments, − decrements; can't go below 1
- [ ] Round value syncs to Table view

### End combat

- [ ] "End" button → inline confirm appears (Yes / No)
- [ ] No → confirm dismisses, nothing changes
- [ ] Yes with only mobs/allies → initiative clears, round resets to 1, activeIndex resets
- [ ] Yes with party and follower units present → party and follower cards survive; mobs and allies are removed
- [ ] Table view reflects cleared initiative

### Table view — InitiativeList

- [ ] Cards match DM sort order
- [ ] Cards are centered (flex-wrap justify-center)
- [ ] All cards have the same minimum height
- [ ] Hidden unit (eye toggled off on DM) shows a placeholder card on Table view
- [ ] AC hidden for mobs by default (eye icon); visible after DM toggles showAc
- [ ] HP hidden for mobs by default; visible after DM toggles showHp
- [ ] HP bar visible on non-party, non-follower cards on Table view
- [ ] Active turn card highlighted on Table view

---

## Phase 4 — XP & Graveyard

### DM Graveyard

- [ ] Kill list shows killed units in order with XP amounts
- [ ] Quest XP entry: label + XP fields, Add button adds row
- [ ] Quest XP entries shown in rivulet color
- [ ] Running total at top updates as kills/quest XP are added
- [ ] Return button on a kill → unit moves back to initiative at initiative 0
- [ ] Delete (✕) on a kill or quest entry → row removed, total updates
- [ ] "Clear Graveyard" button → modal opens
- [ ] Clear modal shows total XP and editable party size
- [ ] Per-member split updates when party size changes
- [ ] Confirm → graveyard clears, entry written to session log
- [ ] Cancel → modal closes, graveyard unchanged

### Session summary modal

- [ ] After clearing graveyard: split modal appears on DM view (Tab A)
- [ ] Split modal appears on Table view (Tab B) at the same time
- [ ] Table view modal has no dismiss button
- [ ] DM dismisses → modal closes on both Tab A and Tab B

### Table GraveyardView

- [ ] Kill list visible on Table view (read-only)
- [ ] "Total" row appears at top when entries exist
- [ ] "Last: X XP ea" appears in section header after a session is cleared
- [ ] Clearing all sessions (see below) removes "Last:" from header

### Session Log (DM)

- [ ] "Log" button in DM header opens SessionLogModal
- [ ] Past sessions listed in reverse chronological order (most recent first)
- [ ] Each entry shows date, total XP, party size, XP per member
- [ ] Empty state: "No sessions logged yet"
- [ ] "Clear all" button appears when logs exist
- [ ] Click "Clear all" → inline Yes/No confirmation
- [ ] No → confirmation dismisses
- [ ] Yes → all sessions wiped; "Last: X XP ea" disappears from Table header

---

## Phase 5 — Image System

### DM ImageLibrary

- [ ] Label field accepts text
- [ ] Upload button: select an image file → progress % shows during upload, then disappears
- [ ] Uploaded image appears in the grid
- [ ] Uploading multiple images fills the grid
- [ ] Click an image → it becomes the active display (outline indicator matching active turn style)
- [ ] Active image: only ✕ button visible on hover
- [ ] Inactive image: only trash icon visible on hover
- [ ] Click ✕ on active image → clears display (indicator gone), Table modal closes
- [ ] Click trash on inactive image → inline delete confirmation appears on the card
- [ ] Confirm delete → image removed from grid and from Firebase Storage
- [ ] Cancel delete → card returns to normal

### Table ImageModal

- [ ] When DM selects an image: full-screen black modal covers Table view
- [ ] Label shown in translucent bottom bar (if label was set)
- [ ] No close button on Table modal
- [ ] When DM clears display: modal closes on Table view

---

## Phase 6 — Party & Followers

### Party modal

- [ ] "Party" button in DM header opens PartyModal
- [ ] Empty state: "No members yet"
- [ ] P/F toggle in add form: defaults to P (green label), click → switches to F (rivulet label)
- [ ] Adding a P member: Name + AC fields; no HP field
- [ ] Adding an F member: Name + HP + AC fields all present
- [ ] Add → member appears in list and a matching unit card appears in initiative
- [ ] P member row shows green "P" label; F member shows rivulet "F" label
- [ ] Edit name in a P row → change syncs to the initiative card's header name
- [ ] Edit AC in a P row → change syncs to the initiative card's AC
- [ ] Edit HP in an F row → change syncs to the initiative card's HP max
- [ ] Delete a P member (✕) → removed from party list AND removed from initiative
- [ ] Delete an F member (✕) → removed from party list AND removed from initiative

### Follower UnitCard (DM view)

- [ ] Follower card: forest (green) header with a thin rivulet border-b line underneath
- [ ] "F" label in header is non-interactive (not a cycle button)
- [ ] Party "P" label in header is also non-interactive
- [ ] HP box visible on follower card (same as ally/mob)
- [ ] No AC toggle button on follower footer
- [ ] No death saves button on follower footer
- [ ] Kill button present; delete (✕) button absent
- [ ] Kill a follower → moves to graveyard; follower is NOT removed from party config

### Follower on Table view

- [ ] Follower card: green header with rivulet border-b
- [ ] AC always visible (no eye icon gating)
- [ ] HP bar shown

### End combat with mixed unit types

- [ ] Add a mob, an ally, a party member, and a follower to initiative
- [ ] End combat → mob and ally removed; party member and follower cards remain
- [ ] Round resets to 1, active index resets

---

## Cross-tab sync (run all with two tabs open)

- [ ] Add a unit on DM → appears on Table within ~1s
- [ ] Edit HP on DM → Table card updates
- [ ] Toggle unit visibility on DM → Table shows/hides placeholder
- [ ] Set active turn on DM → Table highlights matching card
- [ ] Kill a unit on DM → disappears from Table initiative list
- [ ] Clear graveyard → session summary appears on both tabs simultaneously
- [ ] DM dismiss → modal closes on both tabs
- [ ] DM selects image → Table modal opens
- [ ] DM clears image → Table modal closes
- [ ] Add party member → unit card appears on both DM and Table initiative
- [ ] Delete party member → unit card disappears on both DM and Table initiative
