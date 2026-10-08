# CENTRALIZED DESIGN SYSTEM SPECIFICATION
## Single Medical Shop / Pharmacy AI Review & Customer Card System

---

### 1. PHILOSOPHY & CORE PRINCIPLES

1. **Restrained Healthcare Aesthetic:** A clean, trustworthy, clinical atmosphere. Calming teal/emerald accents, deep slate text, and crisp white surfaces.
2. **Mobile-First Touch Ergonomics:** All interactive buttons and inputs adhere to a **minimum 48px touch target** (`--min-touch-target: 48px`).
3. **Strict Token Centralization:** All styles consume CSS custom properties defined in `src/styles/tokens.css`. **Zero ad-hoc colors, radii, shadows, or fonts.**
4. **Human-Designed, Not Generic SaaS:** No dense enterprise tables, complicated sidebars, or playful cartoonish styles.

---

### 2. COLOR SYSTEM (`src/styles/tokens.css`)

| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--color-bg-app` | `#f8fafc` | Clean, subtle neutral background for all screens |
| `--color-bg-surface` | `#ffffff` | Pure white for cards, modals, and sheets |
| `--color-bg-surface-subtle` | `#f1f5f9` | Cool grey for secondary containers and chips |
| `--color-text-primary` | `#0f172a` | Slate-900: High-contrast headings and primary labels |
| `--color-text-secondary` | `#334155` | Slate-700: Body copy and readable instructions |
| `--color-text-muted` | `#64748b` | Slate-500: Helper text, timestamps, captions |
| `--color-primary` | `#0d9488` | Teal-600: Clinical healthcare brand accent |
| `--color-primary-hover` | `#0f766e` | Teal-700: Hover state for primary buttons |
| `--color-primary-subtle` | `#f0fdfa` | Teal-50: Active tag chips and badge backgrounds |
| `--color-star-active` | `#f59e0b` | Amber-500: Warm gold for star ratings |
| `--color-border` | `#e2e8f0` | Slate-200: Standard container and card borders |
| `--color-focus-ring` | `#0d9488` | High-visibility focus ring (WCAG 2.1 AA) |

**Semantic Statuses:**
- **Success:** `#059669` (bg: `#ecfdf5`, border: `#a7f3d0`)
- **Warning:** `#d97706` (bg: `#fffbeb`, border: `#fde68a`)
- **Danger:** `#dc2626` (bg: `#fef2f2`, border: `#fecaca`)
- **Info:** `#0284c7` (bg: `#f0f9ff`, border: `#bae6fd`)

---

### 3. TYPOGRAPHY HIERARCHY

- **Family:** System sans-serif baseline (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- **Scale:**
  - `xs`: 12px / 16px line-height (Badges, fine print)
  - `sm`: 14px / 20px line-height (Helper text, secondary labels)
  - `base`: 16px / 24px line-height (Standard body text, inputs)
  - `lg`: 18px / 28px line-height (Subheadings, card titles)
  - `xl`: 20px / 28px line-height (Dialog titles, page section headers)
  - `2xl`: 24px / 32px line-height (Page titles on mobile)
  - `3xl`: 30px / 36px line-height (Hero headings on desktop)
- **Weights:** Regular (400), Medium (500), Semibold (600), Bold (700).

---

### 4. SPACING SCALE

Always use strict token multiples:
- `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px)
- `--space-8` (32px), `--space-10` (40px), `--space-12` (48px - touch target standard), `--space-16` (64px), `--space-20` (80px)

---

### 5. RADIUS & SHADOW HIERARCHY

- **Radius:**
  - `sm` (4px): Checkboxes, micro-tags
  - `md` (8px): Inputs, standard buttons, notification cards
  - `lg` (12px): Standard cards, dialogs
  - `xl` (16px): Hero cards, bottom sheets
  - `full` (9999px): Badges, circular icons, pills
- **Shadows:**
  - Subdued elevation: `--shadow-card` (1px elevation), `--shadow-medium` (interactive hover), `--shadow-modal` (overlay dialogs). Never use exaggerated drop shadows.

---

### 6. REUSABLE UI PRIMITIVES (`src/components/ui/`)

All primitives are exported from `@/components/ui`:

1. **`Button`:**
   - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`, `link`
   - Sizes: `sm`, `md` (default 48px touch target), `lg`
   - States: default, hover, active, focus-visible, disabled, `isLoading` (renders accessible spinner with `aria-busy="true"`).
2. **`Card`:**
   - Variants: `default`, `interactive` (hover lift and pointer cursor), `compact`
   - Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
3. **`Badge`:**
   - Statuses: `neutral`, `primary`, `success`, `warning`, `danger`, `info`
   - Supports optional status dot (`hasDot`).
4. **`Input`:**
   - Accessible form field with automatic `id`, `aria-invalid`, `aria-describedby` linking to error/help text. Supports left/right icons.
5. **`Textarea`:**
   - Multiline accessible input matching all `Input` accessibility guarantees.
6. **`Select`:**
   - Accessible dropdown with custom indicator, high-contrast states, and clear focus ring.
7. **`Rating`:**
   - Accessible 1–5 star rating with full keyboard navigation (arrows, numbers 1–5), hover states, read-only mode, and `role="radiogroup"`.
8. **`Divider`:**
   - Horizontal and vertical separators, with optional centered label text.
9. **`Loading` & `Skeleton`:**
   - Accessible `Spinner` with screen-reader announcement; `Skeleton` placeholder with subtle shimmer animation.
10. **`EmptyState`:**
    - Standardized empty view with icon slot, title, description, and action button slot.
11. **`ErrorState`:**
    - Standardized error view with retry action button and accessible `role="alert"`.
12. **`Modal`:**
    - Accessible dialog foundation with backdrop blur, keyboard `Escape` closing, focus lock, and `aria-labelledby`/`aria-describedby`.

---

### 7. RESPONSIVE BREAKPOINTS & VIEWPORTS

- **Mobile First Focus:**
  - Small Mobile: 360px – 390px
  - Standard Mobile: 390px – 430px
  - Container: `.container-customer` max-width `560px`
- **Tablet:**
  - 768px – 1024px (Comfortable single/two-column responsive transitions)
- **Desktop:**
  - 1024px – 1440px
  - Container: `.container-admin` max-width `1120px`

---

### 8. ACCESSIBILITY GUIDELINES (WCAG 2.1 AA)

- Every interactive button and form control has a visible focus outline: `2px solid var(--color-focus-ring)` with `2px` offset.
- Minimum touch target dimension: $48 \times 48$px for touch interactions.
- All form inputs must have associated labels and error IDs linked via `aria-describedby`.
- Motion is automatically disabled for users with `prefers-reduced-motion: reduce`.
