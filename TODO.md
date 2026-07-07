# TODO — DnD Campaign Web App

## Complete
Phases 1–7.5 (Combat Controls, DM Notes, AI Template Generation, Template Polish + Initiative Card Redesign, Note Viewing & Markdown, Locations: Display, Locations: Build Wizard, Locations: Image Generation) — all shipped and audited against the live code on 2026-07-07.

Phase 3 (Item Tracker) — shipped 2026-07-07.

Phase 4 (Spell Slot Tracking) — shipped 2026-07-07.

---

## Bugs
- Clicking the turn indicator on an initiative card does not start the timer ✓
- When a unit dies, the turn sometimes advances unexpectedly (current-turn index not adjusted when the initiative array shrinks) ✓

---

## Phase 1 — Locations Polish
- Full-document edit-mode toggle for cluster INDEX and POI detail ✓
- Per-location image folders — each cluster/POI now gets its own image folder named after it, instead of one shared "Locations" folder ✓

---

## Phase 2 — Firestore MCP Server ✓
- Standalone `mcp/` subproject (hand-rolled JSON-RPC, Vercel-hosted) exposes read tools across every collection and structured write tools for locations/templates/notes
- Auth: per-campaign `meta.mcpKey`, generated from a new plug-icon button in the DM view header, baked into the connector URL (`/api/mcp/<mcpKey>`) — no shared secret, no dependency on Phase 6 auth
- Deployed and live at https://tabletop-initiative-mcp.vercel.app (Vercel project `wurbys-projects/tabletop-initiative-mcp`, Root Directory `mcp/`, `.vercel` link lives at repo root); `VITE_MCP_BASE_URL` set in the app's `.env.local`
- Smoke-tested: tools/list returns all 21 tools, tools/call correctly rejects an invalid key, confirming the Firebase Admin service account auth works end-to-end

---

## Phase 3 — Item Tracker ✓
- New `items[]` / `itemFolders[]` collections on the campaign doc, mirroring the `dmNotes`/`dmNoteFolders` pattern
- Item shape: `{ id, name, type, quantity, value (gp), weight, rarity, attunement, ownerIds, folderId, imageUrl, notes }`
- Item type: Weapon / Armor / Consumable / Wondrous Item / Gear / Treasure / Misc
- Rarity: standard 5e six-tier (Common, Uncommon, Rare, Very Rare, Legendary, Artifact)
- Ownership: single owner by default; multiple owners only allowed when quantity > 1, capped at quantity — tracks who holds some of a stack, not a per-owner split count
- Organization: folder tabs (same pattern as DM Notes) plus an owner filter (party members + "Unattached")
- Add/edit flow: quick inline "+ Item" (name only) creates the item immediately; opening it launches a full modal for the remaining fields, reusing the markdown body editor from notes for the description
- Optional per-item image, generated the same way as template/location art (`TemplateGenModal` / `locationImageGen.js` pattern)
- New pinnable drawer panel, left-anchored (mirrors `TemplatesSidebar` but on the left):
  - Unpinned (default): floating overlay, covers `DMNotesPanel` (left column of the 3-col grid), closes on backdrop click — same behavior as the Templates drawer today
  - Pinned (toggle button in the drawer header): stays open regardless of outside clicks, and the DM view's 3-column grid gains a left margin so `DMNotesPanel` is never covered
- DM-only — items are never surfaced to players in Table view
- MCP integration: `mcp/lib/tools/items.ts` adds `list_items`/`get_item` reads and `upsert_item`/`delete_item`/`upsert_item_folder`/`delete_item_folder` writes, registered in `mcp/lib/tools/index.ts`; `get_campaign_summary` now includes an item count
- `ItemViewModal.jsx` — read-only detail view (rendered Markdown notes, image, stats) reachable via a "View" button on each item card, separate from the always-editable `ItemDetailModal` ✓

---

## Phase 4 — Spell Slot Tracking ✓
- New fields: `spellSlots: [{ level, max, used: boolean[] }]` (sorted by level) and `showSpellSlots` (boolean, default false) on initiative units — `showSpellSlots` mirrors `showDeathSaves` exactly, including player visibility: `InitiativeList.jsx` renders the same pips to players when true
- Scope: any unit type (party/follower/ally/mob), DM opts in per-unit — broader than death saves' party-only restriction, since templates (mob/ally only) need it too
- Toggle: new "SS" button added to the footer row that's already universal across all types (alongside visibility-eye/HP/AC), not the existing AC/init/HP Controls popover and not restricted like the DS/Inspiration row
- Inline editing, no separate modal: "+" adds a level (picks 1–9, skipping already-added ones), "×" per row removes a level entirely, small "−/+" next to each level's pips resizes that level's slot count
- Pips are circles (not death saves' squares), individually click-to-toggle used/available, plus a "Reset" action inside the expanded section that refills every level for that unit in one click
- Templates (`TemplatesSidebar.jsx`'s `TemplateModal`): same inline pip editor — `spellSlots: [{ level, max }]` (no `used`, nothing to expend pre-combat), every pip always renders "available". Carries over to the unit on "+ Init" with `used` freshly initialized to all-`false`, matching how `imageUrl` already carries over

---

## Phase 5 — AI Note Assistance
- AI assist button in the note edit modal
- Prompt-based editing: rewrite, expand, summarize, format as Markdown, etc.
- Streamed response replaces or appends to the note body
- Costs real tokens → Max tier feature

---

## Phase 6 — Auth Upgrade + Monetization
- Replace anonymous auth with Google OAuth and/or email + password
- Link existing anonymous sessions to real accounts on sign-up
- Stripe integration for subscription management
- Free tier: core features, up to 20 images
- Pro tier: templates, images above 20
- Max tier: all AI features (template generation, location building via MCP)
- Feature flag/entitlement checks throughout app
- Retroactively wire up "Max tier" gating on the location wizard's AI conversation and image generation (built ungated in Phase 7/7.5, pending this phase's entitlement system)

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
