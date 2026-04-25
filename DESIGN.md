---
brand:
  name: "Tabletop Initiative"
  personality: "Clean, optimistic, bright, cheerful — a tool that feels like a well-lit game table, not a dungeon."
  audience: "DM and players at a live D&D session"

colors:
  primary:
    mint:        { hex: "#EDF7F2", usage: "Page background, main surface (60%)" }
    mint-dark:   { hex: "#D6EFE3", usage: "Cards, modals, panel insets" }
  secondary:
    forest:      { hex: "#2E7D52", usage: "Sidebar, nav bar, table headers (30%)" }
    forest-dark: { hex: "#1F5C3A", usage: "Hover state on forest elements" }
  accent:
    rivulet:      { hex: "#2D8FC4", usage: "Primary buttons, active states, links (10%)" }
    rivulet-dark: { hex: "#1A6E9E", usage: "Hover state on rivulet elements" }
  semantic:
    danger:       { hex: "#C62828", usage: "HP bar (low), kill indicators, error toasts" }
    danger-dark:  { hex: "#9B1C1C", usage: "Hover/pressed state on danger elements" }
    ink:          { hex: "#1A3D2A", usage: "Body text on mint backgrounds" }

typography:
  primary_font: "BespokeSerif"
  source: "Indian Type Foundry — ITF Free Font License (non-commercial)"
  fallback: "Georgia, serif"
  weights:
    - { name: "Light",   value: 300, usage: "Hero text, campaign name, large display (2xl+)" }
    - { name: "Regular", value: 400, usage: "Section headings, card titles, stat values (lg-xl)" }
    - { name: "Medium",  value: 500, usage: "Body copy, UI labels, table headers (sm-base)" }
    - { name: "Bold",    value: 700, usage: "XS labels, badges, metadata needing legibility boost" }
  scale:
    xs:  "0.75rem"
    sm:  "0.875rem"
    base: "1rem"
    lg:  "1.125rem"
    xl:  "1.25rem"
    2xl: "1.5rem"
    3xl: "1.875rem"

spacing:
  base_unit: "4px"
  scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24]

border_radius: none

elevation:
  card:   "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)"
  modal:  "0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)"
  toast:  "0 4px 12px rgba(0,0,0,0.10)"
---

# Design System — Tabletop Initiative

## Brand & Style

Clean, optimistic, bright, cheerful. This tool lives on a lit table next to dice and snacks — it should feel friendly and fast, not dark or dungeon-y. The palette pulls from nature (forest green, running water blue, meadow mint) and keeps a sense of openness and calm. The DM should feel in control without the UI feeling heavy.

---

## Color Usage (60-30-10)

| Role | Token | Hex | Where |
|------|-------|-----|-------|
| 60% Surface | `brand-mint` | #EDF7F2 | Page background, main surface |
| 60% Cards | `brand-mint-dark` | #D6EFE3 | Cards, modals, panel insets |
| 30% Structure | `brand-forest` | #2E7D52 | Sidebar, nav bar, table headers |
| 30% Hover | `brand-forest-dark` | #1F5C3A | Nav item hover state |
| 10% Action | `brand-rivulet` | #2D8FC4 | Buttons, active states, links |
| 10% Hover | `brand-rivulet-dark` | #1A6E9E | Button hover state |
| Semantic | `brand-danger` | #C62828 | HP alerts, kill indicators, errors |
| Semantic | `brand-danger-dark` | #9B1C1C | Danger hover/pressed |
| Text | `brand-ink` | #1A3D2A | Body text on mint backgrounds |

---

## Typography

**BespokeSerif** (Indian Type Foundry, ITF Free Font License) is the sole typeface. It carries warmth and character without tipping into full fantasy-serif territory.

Font files live at `src/assets/fonts/`. Load via `@font-face` in `src/index.css`. Always provide `Georgia, serif` as the fallback stack.

### Weight usage

The larger the text, the lighter the weight. Size carries visual authority — font weight compensates, not amplifies.

- **Light (300)** — hero text, campaign name, large display headings (2xl and up)
- **Regular (400)** — section headings, card titles, stat values (lg–xl)
- **Medium (500)** — body copy, UI labels, table column headers (sm–base)
- **Bold (700)** — very small labels, metadata, badges where legibility needs a boost (xs)

---

## Components

### Buttons

- **Primary:** `bg-brand-rivulet text-white px-4 py-2 font-normal hover:bg-brand-rivulet-dark`
- **Destructive:** `bg-brand-danger text-white px-4 py-2 font-normal hover:bg-brand-danger-dark`
- **Ghost:** `text-brand-forest border border-brand-forest px-4 py-2 font-light hover:bg-brand-mint-dark`

### Cards

`bg-brand-mint-dark p-4 shadow-sm` — used for initiative entries, image library items, XP log entries.

### Inputs

`bg-white border border-brand-mint-dark px-3 py-2 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rivulet`

### Nav / Sidebar

`bg-brand-forest text-white` — nav bar and any structural chrome. Text on forest must pass contrast; use `text-white` or `text-brand-mint`.

### HP Bar

Full HP: `bg-brand-forest`. Below 50%: `bg-yellow-400`. Below 25%: `bg-brand-danger`. Bar container: `bg-brand-mint-dark`.

### Modal (image overlay)

`fixed inset-0 bg-black/70 flex items-center justify-center z-50` — backdrop. Inner: `bg-brand-mint-dark shadow-modal p-4 max-w-4xl w-full`.

### Toast / Error

`bg-brand-danger text-white px-4 py-3 shadow-toast` — bottom-right corner.

---

## Spacing

Base unit is 4px (Tailwind default). Use the standard Tailwind spacing scale — avoid arbitrary values. Prefer `gap-*` for flex/grid layouts over margin-stacking.

---

## Layout

### DM View

Single scrollable page, sections stacked vertically. Section order (top to bottom): initiative tracker → image library → XP / graveyard. Each section uses a card container with a forest-green section heading.

### Table View

Clean, centered, full-height. Initiative list takes the full viewport width. When a modal image is active it overlays everything with the black/70 backdrop.

---

## Tailwind Config Extension

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: {
        mint:           '#EDF7F2',
        'mint-dark':    '#D6EFE3',
        forest:         '#2E7D52',
        'forest-dark':  '#1F5C3A',
        rivulet:        '#2D8FC4',
        'rivulet-dark': '#1A6E9E',
        danger:         '#C62828',
        'danger-dark':  '#9B1C1C',
        ink:            '#1A3D2A',
      },
    },
    fontFamily: {
      serif: ['BespokeSerif', 'Georgia', 'serif'],
    },
    boxShadow: {
      card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      modal: '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
      toast: '0 4px 12px rgba(0,0,0,0.10)',
    },
  },
},
```
