---
name: Nexora Casa Lis Retail POS
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#525e7d'
  on-secondary: '#ffffff'
  secondary-container: '#cdd9fe'
  on-secondary-container: '#525f7e'
  tertiary: '#0c5b56'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f746f'
  on-tertiary-container: '#b3f7f0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b9c6ea'
  on-secondary-fixed: '#0d1b36'
  on-secondary-fixed-variant: '#3a4664'
  tertiary-fixed: '#abefe8'
  tertiary-fixed-dim: '#8fd3cc'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504b'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Roboto Flex
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Roboto Flex
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Roboto Flex
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Roboto Flex
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Roboto Flex
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Roboto Flex
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  numeric-pos:
    fontFamily: Roboto Flex
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system serves a mission-critical POS and retail enterprise management suite tailored for specialty textile operations. The aesthetic reflects high operational velocity, functional clarity, and industrial reliability. It balances the timeless precision of retail inventory management with modern SaaS efficiency.

The design philosophy aligns with **Corporate Modern** with tactical touches of ergonomic utility:
- **Tone:** Methodical, unshakeable, legible under ambient shop-floor lighting, and rigorously pragmatic.
- **Personality:** Authoritative navigation, tactile certainty for counter transactions, and visual calmness to minimize fatigue across 8-hour cashier shifts.
- **Accessibility & Interaction Standard:** Strictly WCAG AA compliant with minimum tactile touch boundaries of 44×44px across administrative tables and 48×48px for instant point-of-sale checkout interactions.

## Colors

The palette is engineered to separate navigational architecture, core operations, and data hierarchies:

- **Primary (`#0F766E` - Deep Petroleum Blue/Teal):** The operational engine. Applied to primary action buttons, checkout authorizations, active tab highlights, and primary key states.
- **Primary Interactive Variant (`#115E59`):** Dedicated state for hover and active presses on primary elements.
- **Secondary (`#14213D` - Deep Navy):** The structural framing. Reserved for persistent navigation rails, POS header ribbons, role-management panels, and anchored bottom summaries.
- **Base Surfaces (`#F6F8FB` Main Canvas, `#FFFFFF` Cards & Panels):** Provides clean contrast without clinical harshness, reducing optical glare under warehouse or retail strip lights.
- **Typography Hierarchy:**
  - High Emphasis: `#172033` (Slate Charcoal) guarantees a contrast ratio exceeding 9:1 against white surfaces.
  - Medium/Muted Emphasis: `#64748B` (Cool Slate) for secondary metadata, product SKUs, textile batch codes, and inactive labels.
- **Borders & Dividers (`#DDE3EA`):** Structural containment for itemized tickets, tabular grids, and nested form panels.
- **System Feedback States:**
  - Info: `#2563EB` (Synchronizations, stock transfers)
  - Success: `#15803D` (Payment approvals, validated counts)
  - Warning: `#D97706` (Low stock alert, return pending)
  - Danger/Error: `#DC2626` (Void transaction, failed card reader)

## Typography

Typography centers exclusively around **Roboto Flex**, selected for its neutral geometric legibility, structural clarity, and robust support for OpenType features.

- **Tabular Figures (`tnum` / `font-variant-numeric: tabular-nums`):** Mandatory across all monetary amounts, inventory meters, textile roll lengths, barcodes, and transaction lists to guarantee vertical column alignment.
- **Hierarchy Rules:**
  - `display-lg` & `numeric-pos`: High-speed numeric totals on the POS customer checkout display and register tapes.
  - `headline-*`: Module headers, register session summaries, and modal titles.
  - `body-*`: Textile catalog specifications, customer contact profiles, and transaction receipts.
  - `label-*`: Keypad tactile buttons, status badges, table headers, and form inputs.

## Layout & Spacing

The layout is designed around an **8px base rhythmic grid** (`0.5rem` steps), organized into a structured application framework:

- **Structure:**
  - **POS Split-Register View:** Fixed 60/40 screen allocation on desktop/counter tablets. Left pane: 12-column adaptive product matrix. Right pane: Sticky transaction ticket register and immediate payment actions.
  - **Back-Office Management View:** Fluid 12-column operational grid with standard 16px (`1rem`) gutters and 24px (`1.5rem`) outer container margins.
- **Breakpoints:**
  - `Compact (Mobile/Handheld Terminal)`: 360px – 767px. Fluid stack layout, persistent bottom payment bar.
  - `Medium (Countertop Tablet/iPad Landscape)`: 768px – 1024px. Two-column split layout with condensed gutters (8px).
  - `Expanded (Desktop Register/Back-Office)`: 1025px+. Dual persistent workspace with fixed left navigation rail (`#14213D`).
- **Touch-First Guardrails:**
  - Administrative buttons enforce a minimum 44px vertical touch target.
  - Fast-action POS controls (Cash, Card, Charge, Quantity incrementers) enforce a minimum 48px tactile target.

## Elevation & Depth

Visual depth is achieved through **low-contrast containment outlines** combined with **ultra-subtle ambient drop shadows**. This prevents visual noise during busy retail environments.

- **Level 0 (Flat / Canvas):** Applied to the main background canvas (`#F6F8FB`). No shadow, no border.
- **Level 1 (Card & Shelf Surfaces):** Pure white background (`#FFFFFF`) framed with a 1px solid border (`#DDE3EA`) and an ultra-soft ambient shadow: `box-shadow: 0 1px 3px 0 rgba(20, 33, 61, 0.04), 0 1px 2px -1px rgba(20, 33, 61, 0.03)`.
- **Level 2 (Active Dropdowns & Popovers):** Used for customer search results, textile roll selector flyouts, and contextual actions: `box-shadow: 0 4px 6px -1px rgba(20, 33, 61, 0.07), 0 2px 4px -2px rgba(20, 33, 61, 0.05)`, border `1px solid #DDE3EA`.
- **Level 3 (Modals & Critical Register Dialogues):** Used for register cash-drawer reconciliations, refunds, and price overrides: `box-shadow: 0 20px 25px -5px rgba(20, 33, 61, 0.1), 0 8px 10px -6px rgba(20, 33, 61, 0.06)`. Backdropped by a navy scrim at 40% opacity (`rgba(20, 33, 61, 0.4)`).

## Shapes

The design system standardizes on **10px to 12px radii (`roundedness: 2`)** to combine modern ergonomics with industrial efficiency:

- **Cards, Panels & Ticket Summaries:** 12px (`0.75rem`) border-radius.
- **Input Fields, Form Containers & Modal Frames:** 10px (`0.625rem`) border-radius.
- **Buttons, TPV Action Keys & Keypad Numbers:** 10px (`0.625rem`) border-radius for balanced finger placement.
- **Status Tags, Badges & Fabric Composition Chips:** 6px to 8px border-radius. Pill buttons are restricted strictly to transient product attribute filters.

## Components

### Buttons
- **Primary POS Action:** Background `#0F766E`, label `#FFFFFF` (weight: 600), border-radius 10px, min-height 48px. Hover/Active: `#115E59`. Focus ring: 2px solid `#0F766E` with 2px offset.
- **Secondary Action:** Background `#FFFFFF`, border 1px solid `#DDE3EA`, label `#172033`. Hover: `#F6F8FB`.
- **Destructive Action:** Background `#FFFFFF`, border 1px solid `#DC2626`, label `#DC2626`. Hover: `#DC2626` text with `#FEE2E2` background.

### Input Fields
- Background `#FFFFFF`, 1px solid `#DDE3EA`, text `#172033`, placeholder `#64748B`.
- Height: 44px (48px on POS barcode/quick-input fields).
- Active/Focus: Border `#0F766E`, subtle outer glow `0 0 0 3px rgba(15, 118, 110, 0.15)`.

### Cards & Ticket Lists
- **Product Tiles:** White surface, 12px corner radius, 1px solid `#DDE3EA`. Contains product title (`body-md`), price (`numeric-pos`), and inventory stock indicator tag.
- **POS Ticket Item Row:** Height 56px, flex row alignment. Left: product name + variant tag. Center: tabular quantity controls (`- [qty] +`). Right: subtotal formatted in tabular figures.

### Chips & Badges
- 6px radius, padding `4px 8px`, typography `label-sm`.
- **In Stock:** `#15803D` text on `#DCFCE7` background.
- **Low Stock:** `#D97706` text on `#FEF3C7` background.
- **Special Cut / Reserve:** `#2563EB` text on `#DBEAFE` background.

### Checkboxes & Radios
- Size: 20×20px with minimum 44×44px click target container.
- Selected state: `#0F766E` background with white checkmark icon.

### Specialized POS Components
- **Numeric Keypad Grid:** 3×4 matrix with 48px+ touch targets, 10px border radius, high-contrast labels (`headline-md`).
- **Register Status Banner:** Top status line with register ID, active cashier, and cash-in-drawer balance in tabular font.