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
├── components/
│   ├── admin/           # AdminModal.jsx — app-owner-only panel (hidden header dot), cross-campaign
│   ├── graveyard/       # Graveyard.jsx, GraveyardView.jsx
│   ├── images/          # ImageLibrary.jsx, ImageModal.jsx, ImageGenModal.jsx, LaserPointerModal.jsx
│   ├── initiative/      # InitiativeTracker.jsx, InitiativeList.jsx, UnitCard.jsx,
│   │                    # ActiveTurnWrapper.jsx, UnitNotesModal.jsx (exports NotesEditor too),
│   │                    # SpellSlotsEditor.jsx (also used by templates/TemplatesSidebar.jsx),
│   │                    # EndCombatModal.jsx
│   ├── items/           # ItemsDrawer.jsx, ItemDetailModal.jsx (edit), ItemViewModal.jsx (read-only) — item tracker
│   ├── locations/       # LocationsPanel.jsx, ClusterGrid/View.jsx, PoiDetail.jsx,
│   │                    # LocationWizardModal.jsx
│   ├── mcp/             # CampaignMcpModal.jsx — per-campaign MCP connector URL (DM view header)
│   ├── notes/           # DMNotesPanel.jsx — wraps NotesEditor for campaign-level notes
│   ├── party/           # PartyModal.jsx
│   ├── session/         # SessionLogModal.jsx, SplitModal.jsx
│   ├── templates/       # TemplatesSidebar.jsx, TemplateGenModal.jsx
│   └── icons.jsx        # All SVG icon components
├── views/
│   ├── DMView.jsx        # Full DM controls
│   ├── TableView.jsx     # Read-only player view
│   └── JoinScreen.jsx    # Campaign join/create entry point
├── lib/
│   ├── firebase.js       # Firebase app init
│   ├── campaign.js       # dmUpdate() helper — wraps updateDoc + serverTimestamp
│   ├── mcp.js            # generateMcpKey() / mcpServerUrl() for the MCP connector
│   ├── imageGen.js       # generateEntityImage() — shared AI image gen, used by
│   │                     # locations, items, and templates
│   ├── unitType.js       # TYPE_HEADER/TYPE_LABEL/TYPE_CYCLE + isAllyType() — single
│   │                     # source of truth for unit-type color/label/cycle, used by
│   │                     # UnitCard, InitiativeList, InitiativeTracker, TemplatesSidebar, TemplateGenModal
│   ├── toast.jsx         # Toast context + useToast hook
│   └── xp.js            # 5e XP thresholds constant
├── App.jsx
└── main.jsx

mcp/                      # Sibling subproject — standalone Vercel-hosted MCP server.
                           # See mcp/README.md for architecture and deployment.
```

---

## Firebase Architecture

**Auth:** Anonymous sign-in only. First user to join a campaign becomes the DM — their UID is written to `campaigns/{joinCode}/meta.dmUid`. All subsequent joins get the table view.

**Firestore schema:**

```
campaigns/{joinCode}/
├── meta:           { name, dmUid, locked, lastActiveAt, mcpKey }
├── combat:         { active, activeIndex, round,
│                     display: { type, url, label },
│                     lastSplit: { clearedAt, dismissed },
│                     tableError: string | null,
│                     timerStartedAt, timerPaused, timerAccumulated }
├── initiative:     [{ id, name, initiative, hp: { current, max }, ac, visible, imageUrl,
│                      type: 'party'|'ally'|'mob' ('follower' retired, legacy-only — see Key Conventions),
│                      showSpellSlots, spellSlots: [{ level, max, used: boolean[] }],
│                      notes: [...], noteFolders: [...] }]
├── graveyard:      [{ id, name, xp, killedAt }]
├── questXp:        [{ id, label, xp, awardedAt }]
├── images:         [{ id, url, storagePath, label, folderId, uploadedAt }]
├── folders:        [{ id, name }]  — image library folders
├── party:          [{ id, name, type: 'party', ac }]  — 'follower' is a retired type,
│                      no longer created; may still exist on legacy entries (no hpMax then)
├── templates:      [{ id, name, type: 'mob'|'ally', hp: { max }, ac, imageUrl,
│                      spellSlots: [{ level, max }], noteFolders: [...], notes: [...], folderId }]
├── templateFolders: [{ id, name }]
├── dmNotes:        [{ id, title, body, folderId, createdAt }]
├── dmNoteFolders:  [{ id, name }]
├── items:          [{ id, name, type, quantity, value, weight, rarity, attunement,
│                      ownerIds, folderId, imageUrl, notes, createdAt }]
├── itemFolders:    [{ id, name }]
├── sessionLogs:    [{ id, timestamp, ... }]
└── locations:      [{ id, name, gridRow, gridCol, arrival, situation, plotHooks, imageUrl,
│                      poiGridRows, poiGridCols,
│                      pois: [{ id, letter, name, gridRow, gridCol, description, encounters,
│                               whatIsHere, whoIsHere, quests, imageUrl }] }]
```

**`meta.mcpKey`** is a per-campaign secret (generated from the DM view's plug icon)
that authenticates the standalone MCP server in `mcp/` — see `mcp/README.md`.
There is no login flow; anyone holding a campaign's MCP URL can read/write it.

**Storage path:** `campaigns/{joinCode}/images/{filename}`

**XP is always derived at runtime** — never stored as a total. `totalXp = sum(graveyard[].xp) + sum(questXp[].xp)`. Party level comes from the local 5e threshold constant in `src/lib/xp.js`.

---

## Key Conventions

- **Firestore writes on blur/submit**, not on every keystroke — avoid write-per-keypress patterns on initiative/HP inputs.
- **Join code is the document ID** in Firestore and never changes for the lifetime of a campaign.
- **No drag-and-drop** on the initiative list — it is sorted by numeric `initiative` value.
- **`visible` flag** on initiative entries controls whether a unit appears in the table view. DM always sees all units.
- **Item `ownerIds`** is a plain list of party member ids (not a per-owner split count) capped at the item's `quantity` — it tracks who holds some of a stack, not how many each owns. Items are DM-only and never surfaced in Table view.
- **AI image generation** (`generateEntityImage` in `lib/imageGen.js`) always saves into the shared `images`/`folders` library, in a folder named `imageFolderName` (created if missing). `ClusterView.jsx` passes no `imageFolderName`, so it defaults to the cluster's own name. `PoiDetail.jsx` explicitly passes `imageFolderName: cluster.name` too, so a POI's generated image lands in its parent cluster's folder rather than getting its own — one folder per cluster, not one per POI. Items and templates instead pass the name of their own assigned folder (`itemFolders`/`templateFolders`), falling back to a generic `"Items"`/`"Templates"` catch-all when unassigned — so generated art lands alongside its siblings rather than one folder per entity.
- **The `images`/`folders` library is the single source of truth for image lifecycle.** Every `imageUrl` field (on locations, POIs, items, templates, initiative units) is just a reference to a library entry's `url` — entities never own their image. Deleting an image in `ImageLibrary.jsx` calls `clearImageReferences` (`lib/imageRefs.js`) to null out every reference across all five domains in the same write, so nothing is left pointing at a dead URL. "Choose existing" buttons (via `ImagePickerModal`) let a DM re-link an entity to any library image instead of only ever generating a new one; "Regenerate" always adds a new library entry rather than overwriting the old one in place.
- **Two distinct click behaviors, by design.** In `ImageLibrary.jsx` (the Images panel), clicking a thumbnail directly calls `pushImageToTable` (`lib/campaign.js`) — that grid's whole purpose is picking what's live on the table, with a highlight/Clear UI built around it. Everywhere else a thumbnail appears (locations, POIs, items, templates, initiative units), clicking instead opens `ImagePreviewModal` — a private, DM-only peek with an explicit "Show to Table" button inside it that calls the same `pushImageToTable`. Peeking never touches `combat.display`; only the explicit button does. This keeps a stray click on, say, an item icon mid-session from accidentally revealing it to players.
- **`ImagePreviewModal` also surfaces the laser-pointer/label workflow.** It takes `campaign` (not just `campaignCode`) so it can derive `isLive` by comparing its `url` against `campaign.combat.display`. Once an image is live, the modal shows "Add Pointer / Labels" (swaps in `LaserPointerModal` for marker/text annotation, same as the Images panel's pointer icon) and "Clear from table" (`clearTableDisplay` in `lib/campaign.js`) — so the full annotate/clear workflow is reachable from any thumbnail, not just the Images panel.
- **Spell slots follow the `showDeathSaves` pattern, but broader.** `showSpellSlots` gates visibility identically on both `UnitCard.jsx` (DM) and `InitiativeList.jsx` (players) — off by default, one boolean drives both views. Unlike death saves, it's not `isParty`-gated: any unit type can have it toggled on, since templates (mob/ally only) need to configure slots too. `SpellSlotsEditor.jsx` (`components/initiative/`) is the single editable pip UI shared by `UnitCard` (`expendable={true}` — click a pip to toggle used/available, plus a "Reset" that refills every level) and `TemplateModal` (`expendable={false}` — pips are configuration-only, always render "available"). Levels are an explicit add/remove list (`+`/`×`), not a fixed 1–9 table with zeros. On "+ Init", a template's `spellSlots: [{level, max}]` clones onto the new unit with `used` freshly initialized to `Array(max).fill(false)`.
- **Templates carry their `imageUrl` onto the initiative unit** when added via "+ Init" (`TemplatesSidebar.jsx`'s `handleAddToInitiative`) — shown as a small clickable thumbnail next to the notes button on `UnitCard`.
- **`'follower'` and `'ally'` are merged into one type: `'ally'`.** `PartyModal.jsx` only ever creates `type:'party'` now — the follower-creation path (with its own HP field and P/F toggle) is gone entirely. `'ally'` is still only ever created via Templates or the blank "+ Add" card, ephemeral in `initiative[]` only, same as before. Legacy `type:'follower'` data is **never migrated** — `isAllyType(type)` (`lib/unitType.js`) treats it as a permanent synonym for `'ally'` everywhere color/label/footer-capability is derived (`UnitCard`, `InitiativeList`, `InitiativeTracker`'s `AddCard` preview, and `TemplatesSidebar`/`TemplateGenModal` which import the same shared `TYPE_HEADER`/`TYPE_LABEL`/`TYPE_CYCLE` instead of each keeping their own copy — the color-inconsistency-between-files bug that motivated this). `PartyModal.jsx` filters its displayed roster to `type === 'party'` (hiding legacy followers from that UI) but every write there operates on the full unfiltered `campaign.party[]` array, so a pre-existing follower entry is never silently dropped. (The `endCombat()` survivor carve-out for `'follower'` that originally shipped with this merge was superseded by the End Combat review flow below — see that entry.)
- **End Combat is a two-step, no-silent-writes flow.** "End" → inline "End combat? Yes/No" confirm (unchanged) → **Yes** opens `EndCombatModal.jsx`, which lists every non-`party` unit (`ally`, `mob`, and any legacy `follower` — all treated uniformly now, no special-casing) for the DM to resolve individually as **Kill** (expands the same CR-indexed XP picker `UnitCard`'s Kill flow uses, appends `{...unit, xp, killedAt}` to `graveyard[]`), **Remove** (dropped, no XP — same as the card's plain Delete), or **Leave** (stays in `initiative[]` untouched). `mob` rows start unresolved; `ally`/legacy-`follower` rows default to **Leave**. Everything is staged in the modal's local state — nothing is written to Firestore until the final "End Combat" button, which stays disabled while any `mob` row is unresolved. Closing the modal without confirming is a full cancel: no writes, combat keeps running exactly as it was. `party` units are never shown in the modal — they always survive untouched, matching the app's original behavior.
- Tailwind utility classes only — no CSS modules, no inline styles, no styled-components.
- Component files use `.jsx` extension.
- Firebase config is loaded from environment variables — never hardcode keys.
- **Never start the dev server or verify changes via the browser** — the user handles all manual/visual verification themselves. Rely on lint/build/reading code to confirm correctness instead.

---

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_MCP_BASE_URL   # deployed mcp/ server origin, e.g. https://dnd-mcp.vercel.app
```

These live in `.env.local` (gitignored). `mcp/` is a separate Vercel-deployed
subproject with its own env vars — see `mcp/README.md`.

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
