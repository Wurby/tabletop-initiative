# Build Plan — DnD Campaign Web App

## Phases

### Phase 1 — Scaffold
Get a running Vite + React app with all tooling wired up before writing any feature code. Nothing worse than untangling a misconfigured Tailwind setup halfway through the initiative tracker.

- Vite + React (latest)
- Tailwind v4 (CSS-based config via `@theme` block, no tailwind.config.js)
- ESLint (flat config, recommended + react rules)
- Prettier
- Firebase SDK installed, env vars stubbed
- BespokeSerif fonts copied in, `@font-face` declared
- App renders with correct background color and font — that's the pass condition

### Phase 2 — Firebase Foundation
The join flow is the skeleton everything else hangs on. Get auth, Firestore read/write, and view-mode assignment working before building any UI features.

- Anonymous sign-in on load
- Join screen: create campaign (generates join code, writes `meta.dmUid`) or join existing
- On join: compare UID to `meta.dmUid` → assign `dm` or `table` view mode
- Real-time subscription to campaign document
- Pass condition: two browser tabs, one gets DM view, one gets table view

### Phase 3 — Initiative Tracker
The most-used feature. DM adds/edits/removes units; table view shows the sorted visible list in real time.

- DM: add unit, edit name/initiative/HP/AC inline, visible toggle, delete
- All writes on blur (not keystroke)
- Sorted descending by initiative value
- Table: shows only `visible: true` units, same sort order
- Pass condition: DM edits HP on laptop, iPad updates within ~1s

### Phase 4 — Image System
DM uploads an image → it appears full-screen on the iPad. Also needs a session library for re-use.

- DM: upload to Firebase Storage → URL written to `images[]`
- Session image library: grid of past uploads, click to set as active display
- Write `combat.display` on trigger
- Table: modal overlay subscribes to `combat.display`, renders image full-screen
- DM: clear display button
- Pass condition: DM selects image on laptop, modal appears on iPad

### Phase 5 — XP & Graveyard
Kill tracking and XP are fully derived — no totals stored. Party level comes from a local constant.

- DM: kill a unit from initiative list → set XP value → moves to graveyard
- Quest XP: add label + amount entries
- XP summary: derives total and party level at runtime from both arrays
- Clear graveyard (graveyard[] only — questXp[] is persistent)
- Pass condition: graveyard + quest XP entries sum to correct total, correct 5e level displayed

### Phase 6 — Combat Controls
Turn order management: activate combat, advance turns, highlight active unit.

- Active combat toggle (`combat.active`)
- Next/prev turn (`combat.activeIndex`)
- Active unit highlighted in both views

### Phase 7 — Polish & LAN Test
- HP bar with color thresholds
- Firebase error toasts
- LAN verify: iPad can reach Vite dev server via `--host`
- Final lint + format pass

---

## Key Decisions

**Tailwind v4** — CSS `@theme` block instead of `tailwind.config.js`. Brand tokens defined as CSS custom properties.

**Firestore writes on blur** — Inputs are local state; Firestore only updated when the user leaves the field. Avoids per-keystroke writes.

**XP derived at runtime** — `totalXp` is never stored. Computed from `graveyard[]` and `questXp[]` on every render. 5e level thresholds in `src/lib/xp.js`.

**Join code = Firestore document ID** — Simple, no lookup table needed. First writer wins the DM seat.

**View mode in React state** — After the join check, view mode (`dm` | `table`) lives in component state. No URL routing needed.
