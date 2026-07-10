# TODO — DnD Campaign Web App

## Complete
Phases 1–7.5 (Combat Controls, DM Notes, AI Template Generation, Template Polish + Initiative Card Redesign, Note Viewing & Markdown, Locations: Display, Locations: Build Wizard, Locations: Image Generation) — all shipped and audited against the live code on 2026-07-07.

Phase 3 (Item Tracker) — shipped 2026-07-07.

Phase 4 (Spell Slot Tracking) — shipped 2026-07-07.

Phase 5 (Merge Follower + Ally) — shipped 2026-07-08.

---

## Bugs
- Clicking the turn indicator on an initiative card does not start the timer ✓
- When a unit dies, the turn sometimes advances unexpectedly (current-turn index not adjusted when the initiative array shrinks) ✓
- "End Combat" silently deleted every ally/mob with zero DM input and zero XP awarded ✓ — replaced with `EndCombatModal.jsx`: DM resolves each non-party unit as Kill (same CR-indexed XP picker as the card's Kill flow, awards XP to `graveyard[]`), Remove (no XP), or Leave (stays in `initiative[]`). `mob` rows start unresolved (forces a deliberate choice); `ally`/legacy-`follower` rows default to Leave. Nothing writes until the final confirm, which is disabled until every `mob` row is resolved; closing the modal is a full cancel. Supersedes the `endCombat()` survivor carve-out for `'follower'` from Phase 5 — see `AGENTS.md`
- POI-generated images each got their own image-library folder (named `"{cluster} — {poi}"`) instead of sharing their parent cluster's folder ✓ — `PoiDetail.jsx` now passes `imageFolderName: cluster.name` explicitly, correcting the Phase 1 "per-location image folders" behavior so a cluster's POIs land alongside the cluster's own art, one folder per cluster rather than one per POI
- MCP images had no write coverage at all — only `list_images` (read-only) existed, vs. full CRUD for items/notes/templates ✓ — new `mcp/lib/tools/images.ts` adds `upsert_image_folder`/`delete_image_folder` (mirrors `upsert_item_folder`/`delete_item_folder` exactly) and `update_image`/`delete_image`. `update_image` is deliberately not named/shaped as an upsert_X tool — `id` is *required*, no create path — because there's no Firebase Storage access configured in this MCP server (`lib/firebaseAdmin.ts` only wires up Firestore), so images can only be relabeled/moved between folders via MCP, never created; that stays app-only (upload/AI-generation). `delete_image` mirrors the app's `clearImageReferences` (`src/lib/imageRefs.js`) to null out every reference across locations/POIs/items/templates/initiative units, but can't delete the underlying Storage file for the same no-Storage-access reason — the tool's response text says so explicitly. Backfilled type gaps found along the way: `ImageEntry.storagePath`, `InitiativeUnit.imageUrl`, and `Cluster`/`Poi.imageUrl` were typed `string | undefined` but the app actually stores `null` when cleared — now `string | null`
- `list_templates`/`list_items`/`list_images` showed each entry's folder by bare name only, no id anywhere — `list_dm_notes` was the only list tool with a proper `Folders:` section (id + name) up front, so there was no safe way to reuse an existing template/item/image folder by name via MCP; the only options were guessing an id or leaving things unfiled, and duplicate folders were the likely result ✓ — all three now prepend the same `Folders:` section `list_dm_notes` already had, matching its exact output shape (including `(none)` fallback with no more early-return short-circuit when the list is empty but folders exist)

---

## Phase 1 — Locations Polish
- Full-document edit-mode toggle for cluster INDEX and POI detail ✓
- Per-location image folders — each cluster/POI now gets its own image folder named after it, instead of one shared "Locations" folder ✓

---

## Phase 2 — Firestore MCP Server ✓
- Standalone `mcp/` subproject (hand-rolled JSON-RPC, Vercel-hosted) exposes read tools across every collection and structured write tools for locations/templates/notes
- Auth: per-campaign `meta.mcpKey`, generated from a new plug-icon button in the DM view header, baked into the connector URL (`/api/mcp/<mcpKey>`) — no shared secret, no dependency on Phase 7 auth
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
- DM-only by default — items never surface to players automatically; a DM-triggered "Show to Table" reveal is the only path to the Table view (see below) ✓
- MCP integration: `mcp/lib/tools/items.ts` adds `list_items`/`get_item` reads and `upsert_item`/`delete_item`/`upsert_item_folder`/`delete_item_folder` writes, registered in `mcp/lib/tools/index.ts`; `get_campaign_summary` now includes an item count
- `ItemViewModal.jsx` — read-only detail view (rendered Markdown notes, image, stats) reachable via a "View" button on each item card, separate from the always-editable `ItemDetailModal` ✓
- "Show to Table" for items ✓ — richer than the existing raw-image push: `pushItemToTable` (`lib/campaign.js`) snapshots the item's full card (name, type, rarity, attunement, value, weight, notes, image) into a new `combat.display.type === 'item'`, rendered player-side by the new `ItemDisplayModal.jsx` (mirrors `ImageModal.jsx`'s self-gating idiom, rendered unconditionally alongside it in `TableView.jsx`). Trigger + `isLive`/"Shown on table ✓"/"Clear" lives in `ItemViewModal.jsx`, mirroring `ImagePreviewModal`'s pattern. The item's raw image can still be pushed on its own separately (unchanged, via the image thumbnail's own peek); no laser-pointer/marker support for item-card displays, scoped to images only

---

## Phase 4 — Spell Slot Tracking ✓
- New fields: `spellSlots: [{ level, max, used: boolean[] }]` (sorted by level) and `showSpellSlots` (boolean, default false) on initiative units — `showSpellSlots` mirrors `showDeathSaves` exactly, including player visibility: `InitiativeList.jsx` renders the same pips to players when true
- Scope: any unit type (party/follower/ally/mob), DM opts in per-unit — broader than death saves' party-only restriction, since templates (mob/ally only) need it too
- Toggle: new "SS" button added to the footer row that's already universal across all types (alongside visibility-eye/HP/AC), not the existing AC/init/HP Controls popover and not restricted like the DS/Inspiration row
- Inline editing, no separate modal: "+" adds a level (picks 1–9, skipping already-added ones), "×" per row removes a level entirely, small "−/+" next to each level's pips resizes that level's slot count
- Pips are circles (not death saves' squares), individually click-to-toggle used/available, plus a "Reset" action inside the expanded section that refills every level for that unit in one click
- Templates (`TemplatesSidebar.jsx`'s `TemplateModal`): same inline pip editor — `spellSlots: [{ level, max }]` (no `used`, nothing to expend pre-combat), every pip always renders "available". Carries over to the unit on "+ Init" with `used` freshly initialized to all-`false`, matching how `imageUrl` already carries over
- MCP integration: `upsert_template` gains a `spell_slots` field (config-only, same `{level, max}` shape as the template), validated (level 1-9, max ≥ 1, no duplicate levels) in `mcp/lib/tools/templates.ts`; `list_templates`/`get_template` surface it in their output; `get_initiative` surfaces live `used/max` per level too; `Template`/`SpellSlot`/`InitiativeSpellSlot` types added to `mcp/lib/campaignAccess.ts` (also backfilled the missing `imageUrl` field on `Template` while in there)
- MCP folder-coverage audit: `templateFolders` had no CRUD tool at all (only a template's own nested `noteFolders` was covered, via `upsert_note_folder` scope="template"). Added `upsert_template_folder`/`delete_template_folder`, mirroring the `upsert_item_folder`/`delete_item_folder` pattern. Every `NamedFolder` collection now has MCP coverage — `dmNoteFolders`/template `noteFolders` (note-folder tools, scoped), `itemFolders` (item-folder tools), `templateFolders` (template-folder tools), and (2026-07-09) the image library's `folders` too — see below

---

## Phase 5 — Merge Follower + Ally ✓
- Merged unit type is "ally" (letter "A" on cards). `campaign.party[]`'s `type:'follower'` creation path is removed entirely — Templates + the blank "+ Add" card remain the only way to create an ally, ephemeral in `initiative[]` only, unchanged from today
- `PartyModal.jsx` simplifies to party-members-only: no P/F type toggle, no HP field (only followers ever had one — real party HP lives on the initiative card), `MemberRow`'s type badge removed entirely (dead info once every listed member is `'party'`)
- Legacy `type:'follower'` data is never migrated — it's treated as a permanent synonym for `type:'ally'` everywhere color/label/footer-behavior is derived (`UnitCard.jsx`, `InitiativeList.jsx`, `InitiativeTracker.jsx`'s `AddCard` preview). No Firestore rewrite script. Net effect: legacy followers gain the Kill+Delete footer buttons they never had, since they now render via the merged ally path
- Header color unified to solid `bg-brand-rivulet` for ally — retires the rivulet→forest gradient that `UnitCard.jsx`/`InitiativeList.jsx` inconsistently used for `'follower'` today (a 3rd copy in `InitiativeTracker.jsx` already used solid, so this was already inconsistent pre-merge)
- `campaign.party[]` keeps an explicit `type` field going forward (`'party'` on every new entry) — not dropped from the schema. `PartyModal.jsx` filters its displayed list to `type === 'party'` but every write (add/update/delete) operates on the full unfiltered array, so a pre-existing `'follower'` entry is hidden from the roster UI but never silently dropped or clobbered
- MCP: no `upsert_template` schema change needed (its type enum was already `mob|ally` — templates never had `'follower'`). `get_party` filtered to `type === 'party'` too, matching the app's new stance on what the roster actually is; `PartyMember.hpMax` marked optional in `mcp/lib/campaignAccess.ts` since only legacy followers ever had one
- New `src/lib/unitType.js` (`TYPE_HEADER`/`TYPE_LABEL`/`TYPE_CYCLE`/`isAllyType()`) replaces what turned out to be *four* separate hardcoded copies of the same maps (`UnitCard.jsx`, `InitiativeList.jsx`, `InitiativeTracker.jsx`, `TemplatesSidebar.jsx`, plus a near-duplicate in `TemplateGenModal.jsx`) — the direct root cause of the header-color inconsistency this phase already knew about, now fixed at the source instead of patched five times over
- One exception carved out deliberately: `InitiativeTracker.jsx`'s `endCombat()` survivor filter (`type === 'party' || type === 'follower'`) is untouched — that's about which units persist across combats (a data concern), not color/label/footer rendering, and collapsing it into `isAllyType` would silently wipe out any DM's existing legacy follower the next time combat ends

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
