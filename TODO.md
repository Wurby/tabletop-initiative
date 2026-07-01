# TODO — DnD Campaign Web App

Phases 1–4 complete. ✓

## Phase 5 — Note Viewing & Markdown
- Notes collapsed by default everywhere (body hidden, click to expand inline)
- "Open" action on each note launches a full modal view with the complete content rendered
- Render note body as Markdown in both inline expanded view and modal (react-markdown or similar)
- Clear visual boundary/separator between individual notes
- Folders should not be easily deletable in Images, DM Notes, Templates, and unit card notes — add friction (confirm step or similar)

---

## Phase 6 — Locations
- Dedicated Locations panel in DM view (separate from DM notes)
- Location clusters as top-level unit (e.g. Castlehof, Fischerei)
- Each cluster has an INDEX: arrival description, situation/factions, major plot hooks, quick reference table of POIs
- Individual POIs (A, B, C…): zones, opening description (read-aloud), roll-gated discoveries, area breakdown with loot, NPC roster with stat blocks + secrets + DM pacing notes, DM notes/quests
- Map and image support per cluster and per POI
- Full CRUD — not a read-only viewer

---

## Phase 7 — Firestore MCP Server
- Expose full campaign data to Claude Code via MCP server
- Collections: meta, combat, initiative, graveyard, questXp, images, party, templates, dmNotes, dmNoteFolders, sessionLogs, locations
- Bridges Claude Code location-building (and template/notes) workflows directly into Firestore
- AI authors into the app instead of Obsidian markdown

---

## Phase 8 — Auth Upgrade + Monetization
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
