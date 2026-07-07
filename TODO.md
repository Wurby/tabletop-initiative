# TODO — DnD Campaign Web App

## Complete
Phases 1–7.5 (Combat Controls, DM Notes, AI Template Generation, Template Polish + Initiative Card Redesign, Note Viewing & Markdown, Locations: Display, Locations: Build Wizard, Locations: Image Generation) — all shipped and audited against the live code on 2026-07-07.

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
- Auth: per-campaign `meta.mcpKey`, generated from a new plug-icon button in the DM view header, baked into the connector URL (`/api/mcp/<mcpKey>`) — no shared secret, no dependency on Phase 4 auth
- Deployed and live at https://tabletop-initiative-mcp.vercel.app (Vercel project `wurbys-projects/tabletop-initiative-mcp`, Root Directory `mcp/`, `.vercel` link lives at repo root); `VITE_MCP_BASE_URL` set in the app's `.env.local`
- Smoke-tested: tools/list returns all 21 tools, tools/call correctly rejects an invalid key, confirming the Firebase Admin service account auth works end-to-end

---

## Phase 3 — AI Note Assistance
- AI assist button in the note edit modal
- Prompt-based editing: rewrite, expand, summarize, format as Markdown, etc.
- Streamed response replaces or appends to the note body
- Costs real tokens → Max tier feature

---

## Phase 4 — Auth Upgrade + Monetization
- Replace anonymous auth with Google OAuth and/or email + password
- Link existing anonymous sessions to real accounts on sign-up
- Stripe integration for subscription management
- Free tier: core features, up to 20 images
- Pro tier: templates, images above 20
- Max tier: all AI features (template generation, location building via MCP)
- Feature flag/entitlement checks throughout app
- Retroactively wire up "Max tier" gating on the location wizard's AI conversation and image generation (built ungated in Phase 7/7.5, pending this phase's entitlement system)

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
