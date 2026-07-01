# TODO — DnD Campaign Web App

Phases 1–4 complete. ✓

## Phase 5 — Note Viewing & Markdown
- Notes collapsed by default everywhere (body hidden, click to expand inline)
- "Open" action on each note launches a full modal view with the complete content rendered
- Render note body as Markdown in both inline expanded view and modal (react-markdown or similar)
- Clear visual boundary/separator between individual notes
- Folders should not be easily deletable in Images, DM Notes, Templates, and unit card notes — add friction (confirm step or similar)

---

## Phase 6 — Locations: Display
- DM view restructured: graveyard migrates into initiative panel (scrollable card at tail end of list, after quick-add card); its slot becomes the Locations tab in the existing panel switcher
- Top-level view: drag-and-drop grid of clusters, configurable rows/columns (default: n-clusters + 2 empty slots)
- Click cluster → cluster view covers the grid with breadcrumb to go back (Locations)
- Cluster view: INDEX content (arrival, situation, plot hooks) scrollable on the left; POI drag-and-drop grid on the right (same grid system, default: n-POIs + 2)
- Click POI → POI detail covers cluster view; breadcrumb navigation (Locations > Cluster > POI)
- POI detail: single scrollable doc with sticky jump-nav tabs (Description, Encounters, NPCs, Loot, Quests)
- Editing: inline click-to-edit for quick tweaks OR full document edit mode toggle — both always available
- No map/image support in this phase (see Phase 7.5)

---

## Phase 7 — Locations: Build Wizard
- Default: guided step-by-step wizard; advanced mode toggle for blank canvas (all fields at once)
- Wizard always produces minimum: cluster INDEX + first POI — no cluster can exist with just an INDEX
- Each wizard step has back-and-forth AI conversation (Max tier); prior steps' finalized output passed as context to next step
- Wizard steps cover INDEX fields (name, arrival, situation, plot hooks) then flows into first POI fields (description, encounters, loot, NPCs, quests)
- After creation, a retriggerable POI wizard (or blank canvas) lets you add more POIs to an existing cluster

---

## Phase 7.5 — Locations: Image Generation
- One-click generate image based on a cluster or POI description (Max tier)
- Generated image added to the images library under a location/POI folder automatically

---

## Phase 8 — Firestore MCP Server
- Expose full campaign data to Claude Code via MCP server
- Collections: meta, combat, initiative, graveyard, questXp, images, party, templates, dmNotes, dmNoteFolders, sessionLogs, locations
- Bridges Claude Code location-building (and template/notes) workflows directly into Firestore
- AI authors into the app instead of Obsidian markdown

---

## Phase 9 — AI Note Assistance
- AI assist button in the note edit modal
- Prompt-based editing: rewrite, expand, summarize, format as Markdown, etc.
- Streamed response replaces or appends to the note body
- Costs real tokens → Max tier feature

---

## Phase 10 — Auth Upgrade + Monetization
- Replace anonymous auth with Google OAuth and/or email + password
- Link existing anonymous sessions to real accounts on sign-up
- Stripe integration for subscription management
- Free tier: core features, up to 20 images
- Pro tier: templates, images above 20
- Max tier: all AI features (template generation, location building via MCP)
- Feature flag/entitlement checks throughout app

---

## Long-term — Spell Slot Tracking
- Track spell slots per NPC/unit during combat directly on initiative cards
- Available and expended slots visible at a glance during encounter

---

## Long-term — Grid Map Builder + VTT
- In-app grid-based map builder for dungeon/encounter layouts
- Maps attached to locations or standalone
- Display on table view as a VTT — tokens, grid, DM-controlled reveal
- Reference view for copying onto physical game board

---

## Long-term — Content Marketplace
- Templates and locations shareable/sellable across campaigns
- DMs can publish and monetize their own campaign content (locations, enemy sets, etc.)
- Foundation for selling Joshua's own campaigns

---

## Long-term — Campaign Export & Backup
- Full campaign data export (JSON or portable format)
- Archive finished campaigns
- Restore or migrate between accounts

---

## Phase 1 — Combat Controls ✓
## Phase 2 — DM Notes ✓
## Phase 3 — AI Template Generation ✓
## Phase 4 — Template Polish + Initiative Card Redesign ✓
