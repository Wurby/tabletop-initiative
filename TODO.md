# TODO — DnD Campaign Web App

## Phase 3 — Item Tracker
- Magic items have no field for their granted abilities — a wand, staff, or wondrous item that lets you cast something has nowhere to record it beyond free-text notes. Add an abilities list per item (name + description), each tagged with its components (V/S/M), so a DM can see at a glance whether using it needs a free hand, a material component, etc.

---

## Phase 6 — AI Note Assistance
- AI assist button in the note edit modal
- Prompt-based editing: rewrite, expand, summarize, format as Markdown, etc.
- Streamed response replaces or appends to the note body
- Costs real tokens → Max tier feature

---

## Phase 7 — Auth Upgrade + Monetization
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

---

## Long-term — Convert Frontend to TypeScript
- `src/` is plain JS (Vite + React); `mcp/` is already TypeScript — bring the frontend in line so the whole project shares one type system
- `mcp/lib/campaignAccess.ts`'s `Campaign`/`Cluster`/`Poi`/etc. interfaces already describe the real Firestore document shape — reuse them (or a shared package) instead of redefining types from scratch
- Incremental, file-by-file `.jsx` → `.tsx` conversion rather than a single flag-day rewrite, given the size of `src/components/`
