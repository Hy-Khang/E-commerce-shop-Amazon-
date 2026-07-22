# DESIGN.md — Frontend Design System

This document captures the visual design patterns, tokens, and component conventions used across the Nook storefront. Use it as the reference when building new UI so pages stay visually consistent without rereading the entire codebase.

---

## 1. Brand Identity

- **Name:** Nook
- **Logo font:** `font-display` (Instrument Serif) — used only for the brand wordmark
- **Logo pattern:** `Nook` + colored period — storefront uses `text-brand`, auth-left-pane uses `text-primary-300`
- **Personality:** Warm, curated marketplace — earthy greens, warm neutrals, rounded shapes

---

## 2. Color System

### 2.1 Primitive Ramps (defined in `@theme` in `globals.css`)

| Ramp | Usage |
|------|-------|
| `primary-50…900` | Evergreen brand palette (green tones) |
| `neutral-50…900` | Warm stone neutrals (UI chrome, text, borders) |
| `success-500/600` | Positive states |
| `warning-500/600` | Caution states |
| `error-500/600` | Destructive / error states |
| `info-500/600` | Informational states |

### 2.2 Semantic Tokens (always prefer these over raw ramp values)

**Text:**

| Token | Resolves to | When to use |
|-------|-------------|-------------|
| `text-text-primary` | neutral-900 | Headings, product names, prices, primary content |
| `text-text-secondary` | neutral-500 | Supporting text, metadata labels, secondary info |
| `text-text-muted` | neutral-400 | Hints, placeholders, disabled text, timestamps |
| `text-text-inverse` | #ffffff | Text on dark/brand backgrounds |
| `text-text-brand` | primary-600 | Links, hover states, brand-accented text |
| `text-text-price` | primary-500 | Sale/effective prices |

**Backgrounds:**

| Token | Resolves to | When to use |
|-------|-------------|-------------|
| `bg-page` | neutral-50 | Page-level background (MainLayout) |
| `bg-surface` | #ffffff | Drawer panels, auth form container |
| `bg-surface-hover` | neutral-50 | Hover state for clickable surfaces |
| `bg-elevated` | #ffffff | Cards that float above page |
| `bg-brand` | primary-500 | Primary action buttons, active pagination |
| `bg-brand-hover` | primary-600 | Hover for brand buttons |
| `bg-brand-light` | primary-50 | Subtle brand backgrounds |

**Borders:**

| Token | Resolves to | When to use |
|-------|-------------|-------------|
| `border-border-default` | neutral-200 | Cards, inputs, dividers, separators |
| `border-border-strong` | neutral-300 | Hover states on cards |
| `border-border-brand` | primary-500 | Focused inputs, brand-outline buttons |

**Interactive:**

| Token | When to use |
|-------|-------------|
| `ring-ring-focus` | Focus-visible rings (primary-500) |

### 2.3 Status Colors (inline, not tokenized)

| Status | Background | Text | Ring |
|--------|-----------|------|------|
| Success | `bg-emerald-50` | `text-emerald-700` | `ring-emerald-600/20` |
| Warning | `bg-amber-50` | `text-amber-700` | `ring-amber-600/20` |
| Error | `bg-rose-50` | `text-rose-700` | `ring-rose-600/20` |
| Info | `bg-blue-50` | `text-blue-700` | `ring-blue-600/20` |
| Neutral | `bg-neutral-100` | `text-neutral-600` | `ring-neutral-500/20` |

### 2.4 Rules

- **Never use raw gray-\*** (`text-gray-500`, `bg-gray-50`, etc.) — always use semantic tokens or neutral ramp
- **Admin dashboard** uses `slate-*` ramp (separate from storefront) — this is intentional, do not migrate admin to semantic tokens
- **Storefront/customer** pages always use semantic tokens

---

## 3. Typography

### 3.1 Font Stack

| Token | Font | Usage |
|-------|------|-------|
| `font-jakarta` | Plus Jakarta Sans | Body text, UI (default) |
| `font-display` | Instrument Serif | Brand wordmark only |

### 3.2 Text Scale

| Element | Classes |
|---------|---------|
| Page title (h1) | `text-2xl font-bold tracking-tight text-text-primary` |
| Section title (h2) | `text-lg font-bold tracking-tight text-text-primary` |
| Card title / item name | `text-sm font-semibold text-text-primary` |
| Body text | `text-sm text-text-secondary` |
| Small / metadata | `text-xs text-text-muted` |
| Micro labels | `text-[10px] font-bold uppercase tracking-wider text-text-muted` |
| Price (effective) | `text-sm font-bold text-text-price` |
| Price (original/struck) | `text-xs text-text-muted line-through` |

### 3.3 Rules

- Use `tracking-tight` on page titles and section headings
- Use `tracking-wider` or `tracking-widest` on uppercase micro labels
- Product names in lists: `truncate text-sm font-semibold`
- Use `font-bold` for totals, subtotals, primary prices; `font-semibold` for item names and section titles

---

## 4. Spacing & Layout

### 4.1 Page Layout

```
MainLayout: bg-page → shop-container (max-w-[1200px] mx-auto px-4) → py-6
AdminLayout: flex → sidebar (w-64) + main (bg-slate-50 p-8)
AuthLayout: flex → left-pane (brand gradient) + right-pane (centered max-w-md)
```

### 4.2 Container

Use the `.shop-container` utility class for all storefront page content:
```css
.shop-container { @apply w-full mx-auto max-w-[1200px] px-4; }
```

### 4.3 Common Spacing Patterns

| Pattern | Classes |
|---------|---------|
| Page title to content | `mb-6` |
| Between list items (stacked cards) | `space-y-4` |
| Grid gap (product cards) | `gap-4` |
| Grid gap (page sections) | `gap-8` |
| Card internal padding | `p-4` to `p-6` |
| Between icon and text | `gap-1.5` to `gap-2.5` |
| Metadata items inline | `gap-x-3` with `flex-wrap` |

### 4.4 Grid Patterns

| Layout | Grid |
|--------|------|
| Product listing | `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4` |
| Cart / checkout (2-col) | `grid-cols-1 lg:grid-cols-3 gap-8` (content=col-span-2, sidebar=1) |
| Footer | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8` |

---

## 5. Component Patterns

### 5.1 Cards

**Storefront card (`.shop-card`):**
```css
.shop-card { @apply rounded-xl bg-elevated border border-border-default shadow-sm; }
```

Hover: `hover:border-border-strong hover:shadow-sm`

**Admin card (`.admin-card`):**
```css
.admin-card { @apply rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5; }
```

### 5.2 Border Radius Scale

| Element | Radius |
|---------|--------|
| Cards, modals, toasts | `rounded-xl` (12px) |
| Buttons, inputs, thumbnails, small cards | `rounded-lg` (8px) |
| Badges, chips, search bar | `rounded-full` |
| Skeleton blocks | `rounded` to `rounded-lg` |

### 5.3 Inputs

**Storefront input (`.shop-input`):**
```css
.shop-input {
  @apply w-full rounded-lg border border-border-default bg-white px-3 py-2
         text-sm text-text-primary placeholder:text-text-muted
         focus:border-border-brand focus:ring-2 focus:ring-ring-focus/20
         focus:outline-none transition-colors;
}
```

Error state: add `border-error-500 focus:border-error-500 focus:ring-error-500/20`

**Admin input (`.admin-input`):**
```css
.admin-input {
  @apply w-full rounded-lg border border-slate-200 bg-white px-3 py-2
         text-sm text-slate-900 placeholder:text-slate-400
         focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
         focus:outline-none transition-colors;
}
```

### 5.4 Buttons

**Variants (from Button component):**

| Variant | Classes | Context |
|---------|---------|---------|
| `brand` | `bg-brand hover:bg-brand-hover text-white shadow-sm` | Storefront primary actions |
| `brand-outline` | `border-border-brand text-text-brand hover:bg-brand-light` | Storefront secondary actions |
| `primary` | `bg-teal-600 hover:bg-teal-700 text-white shadow-sm` | Admin primary actions |
| `secondary` | `border-slate-200 bg-white hover:bg-slate-50 text-slate-700` | Both portals, secondary |
| `danger` | `bg-rose-600 hover:bg-rose-700 text-white shadow-sm` | Destructive actions |
| `ghost` | `text-slate-500 hover:bg-slate-100 hover:text-slate-700` | Tertiary / icon triggers |

**Sizes:** `sm` (px-3 py-1.5 text-xs), `md` (px-4 py-2 text-sm)

**Inline buttons** (not using Button component):
```
rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white
  transition-colors hover:bg-brand-hover shadow-xs
```

**Icon buttons:**
```
rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover transition-colors
```

### 5.5 Badges

Pill shape: `rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset`

Variants: `success`, `warning`, `error`, `info`, `neutral`, `brand`

**Status dot pattern** (OrderStatusBadge):
```
<span class="h-1.5 w-1.5 rounded-full bg-{color}">
```

### 5.6 Empty States

Centered column (`flex flex-col items-center py-16 text-center`): icon (`h-16 w-16 text-text-muted/60`) → title (`mt-4 text-lg font-semibold`) → description (`mt-1 text-sm text-text-secondary`) → action button (`mt-6`).

### 5.7 Skeletons

- Base: `bg-neutral-200` with shimmer animation
- Match the shape of the real content (same width/height/border-radius)
- Container skeleton: same `rounded-xl border border-border-default` as the real card
- Admin skeletons use `bg-slate-200`

### 5.8 Item Rows (list items in cards)

Pattern for cart, order, wishlist rows: `flex items-center gap-4 border-b border-border-default py-4 last:border-b-0`. Thumbnail (`h-16..20 w-16..20 flex-shrink-0 rounded-lg border border-border-default bg-neutral-50`) → name (`truncate text-sm font-semibold text-text-primary`) → metadata (`flex flex-wrap gap-x-3 text-xs text-text-muted`) → price (`text-sm font-bold text-text-primary` or `text-text-price` for sale).

### 5.9 Modals & Drawers

- Overlay: `bg-black/50` (drawer) or `bg-black/40 backdrop-blur-xs` (modal)
- Panel: `rounded-2xl bg-white p-6 shadow-xl` (modal), `bg-surface shadow-xl` (drawer)
- Header: `border-b border-border-default px-4 py-3` with `text-lg font-semibold text-text-primary`
- Close button: `rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover`
- Animation: `motion/react` with spring transitions

### 5.10 Tables (column header pattern)

**Storefront (CartItemList style):**
```
text-xs font-medium uppercase tracking-wider text-text-muted
```

**Admin (AdminDataTable):**
```css
.admin-table-header {
  @apply bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-400;
}
```

---

## 6. Interactive States

| State | Pattern |
|-------|---------|
| Hover (card) | `hover:border-border-strong hover:shadow-sm` |
| Hover (button) | `hover:bg-{next-shade}` |
| Hover (link text) | `hover:text-text-brand transition-colors` |
| Hover (icon button) | `hover:bg-surface-hover` or `hover:bg-neutral-100` |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-2` |
| Disabled | `disabled:opacity-50 disabled:pointer-events-none` or `disabled:cursor-not-allowed` |
| Active pagination | `bg-brand text-white` |
| Loading (button) | Loader2 spinner icon with `animate-spin` |

---

## 7. Transitions & Animation

- All interactive elements: `transition-colors`
- Card hover (product images): `transition-transform duration-300 group-hover:scale-105`
- Dashboard cards: `animate-slide-up` (custom keyframe)
- Admin content: `animate-in` (custom keyframe), wrapped in `motion-safe:`
- Drawers: motion/react spring `damping: 30, stiffness: 300`
- Modals: motion/react spring `damping: 25, stiffness: 350`
- Skeleton shimmer: `animation: shimmer 1.5s infinite ease-in-out`
- Scroll: React Router `<ScrollRestoration />`

---

## 8. Responsive Breakpoints

- `sm` — 2→3 col grids, side-by-side form+button
- `md` — Show search bar, desktop nav, hide mobile menu
- `lg` — Category sidebar, 3-col cart layout, footer 4-col
- `xl` — 4-col product grid

### Mobile patterns
- Hamburger menu → `MobileNav` drawer (left side)
- Category chips (horizontal scroll) on mobile, sidebar on desktop
- Stack cart layout (items above summary) on mobile, side-by-side on lg

---

## 9. Icon System

- **Library:** Lucide React
- **Default size:** `h-4 w-4` (buttons, inline), `h-5 w-5` (header actions, close buttons)
- **Large icons:** `h-8 w-8` (empty state inner), `h-16 w-16` (empty state wrapper)
- **Small icons:** `h-3.5 w-3.5` (breadcrumb chevrons, nav links)
- **Color:** inherits from parent text color — use `text-text-muted`, `text-text-secondary`, etc.

---

## 10. Toasts (Sonner)

- Position: `bottom-right`
- Duration: 3000ms
- Base: `border border-border-default bg-elevated text-text-primary shadow-lg rounded-xl px-4 py-3`
- Success: `!border-emerald-100 !bg-emerald-50/80 !text-emerald-800`
- Error: `!border-rose-100 !bg-rose-50/80 !text-rose-800`
- Info: `!border-sky-100 !bg-sky-50/80 !text-sky-800`
- Warning: `!border-amber-100 !bg-amber-50/80 !text-amber-800`

---

## 11. Footer

- Background: `bg-primary-900` with `border-t border-primary-950/30`
- Section headings: `text-xs font-bold uppercase tracking-wider text-primary-300/90`
- Links: `text-primary-300/80 hover:text-white transition-colors`
- Bottom bar: `bg-primary-950/20` with `text-xs text-primary-400`

---

## 12. Two Design Languages

This project has **two distinct visual systems**:

### Storefront (Customer-facing)

- Semantic tokens: `text-text-primary`, `bg-brand`, `border-border-default`
- Warm neutrals: `neutral-*` ramp
- CSS utilities: `.shop-card`, `.shop-input`, `.shop-container`
- Green brand accent
- `rounded-xl` cards, `rounded-lg` buttons/inputs

### Admin Dashboard

- Raw Tailwind: `text-slate-900`, `bg-teal-600`, `border-slate-200`
- Cool neutrals: `slate-*` ramp
- CSS utilities: `.admin-card`, `.admin-input`, `.admin-table-header`
- Teal accent
- Dark sidebar: `bg-gradient-to-b from-slate-950 to-slate-900`

**Do not mix** — admin pages should not use semantic tokens; storefront pages should not use `slate-*` or `teal-*`.

---

## 13. Formatting Utilities

| Function | Import | Output |
|----------|--------|--------|
| `formatPrice(number)` | `@/common/utils/format.util` | Vietnamese VND: `250.000 ₫` |
| `formatDate(string\|Date)` | `@/common/utils/format.util` | Vietnamese format: `07/05/2026, 10:30` |
| `truncateText(text, max)` | `@/common/utils/format.util` | Ellipsis truncation |

---

## 14. Z-Index Scale

| Layer | z-index | Usage |
|-------|---------|-------|
| Header | `z-40` | Sticky header |
| Drawers | `z-60` | Side drawers |
| Modals | `z-70` | Confirm modal, dialog |
