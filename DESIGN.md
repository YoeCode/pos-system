---
name: Casa Lis POS
description: Point-of-sale system designed for retail operations with multi-tenancy support
colors:
  primary: "#00C853"
  secondary: "#0091EA"
  background: "#F5F6FA"
  surface: "#FFFFFF"
  text-primary: "#0A0B0D"
  text-muted: "#7A8194"
  border: "#E2E5EE"
  error: "#FF5370"
  dark-bg: "#1C2128"
  dark-surface: "#252B33"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Sora, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Sora, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.body}"
  badge-success:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.label}"
---

# Design System: Casa Lis POS

## Overview

**Creative North Star: "The Fresh Market Counter"**

Casa Lis POS is designed to feel like a modern retail environment: clean, bright, and effortlessly organized. The visual system takes inspiration from fresh market counters — surfaces that are easy to wipe clean, colors that signal freshness and trust, and a layout that prioritizes speed of operation over decorative flourish. Every element is engineered for clarity under the pressure of a busy workday.

The system balances warmth with professionalism. It avoids the cold sterility of traditional enterprise software while maintaining the density and efficiency that cashiers, supervisors, and managers need. The result is an interface that feels approachable to new users and deeply efficient to experienced operators.

**Key Characteristics:**
- **Bright and breathable**: Light backgrounds with generous whitespace reduce visual fatigue during long shifts
- **Color-coded operations**: Green signals success and primary actions; blue provides secondary guidance
- **Refined restraint**: Animations are fast (150ms) and subtle; feedback exists but never competes with the task
- **Layered depth**: Surfaces stack cleanly — flat by default, elevated only when context demands it
- **Touch-ready**: Components are sized for both mouse and touchscreen interaction in a retail environment

## Colors

The palette is built around a fresh green accent that signals "go" and "success" in a retail context, supported by a clean neutral system and a precise blue for secondary actions.

### Primary
- **Fresh Signal Green** (#00C853): The system's voice of action. Used for primary buttons, success states, active navigation, and positive metrics. Chosen for its high visibility and cultural association with "proceed" in point-of-sale contexts.
- **Signal Green Dark** (#00A846): Hover and pressed states for primary actions. Deepens the green without shifting hue.

### Secondary
- **Clear Sky Blue** (#0091EA): Informational accents, secondary buttons, and navigation highlights. Provides contrast to the green without competing for attention.

### Neutral
- **Clean Porcelain** (#F5F6FA): The default canvas. A warm-leaning gray that reduces eye strain compared to pure white while maintaining brightness.
- **Pure Surface** (#FFFFFF): Cards, modals, input backgrounds — any elevated surface that needs maximum contrast against the porcelain canvas.
- **Deep Slate** (#0A0B0D): Primary text. Near-black with a hint of warmth for readability without harsh contrast.
- **Mist Gray** (#7A8194): Secondary text, placeholders, disabled states, and metadata. Used generously to establish hierarchy without adding color noise.
- **Soft Border** (#E2E5EE): Dividers, input borders, and subtle separators. Keeps structure visible without visual weight.

### Semantic
- **Alert Rose** (#FF5370): Errors, destructive actions, and validation failures. A warm red that feels human rather than alarming.
- **Warning Amber** (from Tailwind amber-500/600): Cautions and pending states. Used sparingly in badges and alerts.

### Dark Mode
- **Deep Chamber** (#1C2128): Dark mode background. A rich dark blue-gray that reduces glare in low-light environments.
- **Raised Surface** (#252B33): Cards and elevated surfaces in dark mode.
- **Elevated Surface** (#2D333B): Higher elevation cards and active states.

### Named Rules
**The One Voice Rule.** The primary green is used on ≤15% of any given screen. Its rarity in large surfaces makes its appearance on buttons and success states feel intentional and powerful.

**The Porcelain Canvas Rule.** Backgrounds stay at #F5F6FA or darker. Pure white (#FFFFFF) is reserved for interactive surfaces and cards, never for full-screen canvas.

## Typography

**Body Font:** Sora (weights 300–700)  
**Mono Font:** DM Mono (weights 400–500)  

Sora is a geometric sans-serif with humanist warmth — friendly enough for retail staff, precise enough for financial data. Its wide proportions maintain legibility at small sizes (common in dense POS interfaces). DM Mono handles order numbers, prices, and tabular data with excellent distinction between similar characters (0 vs O, 1 vs l).

**Character:** Open, modern, and approachable. The geometric structure feels organized and retail-appropriate without becoming cold or clinical.

### Hierarchy
- **Display** (600 weight, clamp(1.5rem, 4vw, 2.5rem), line-height 1.2): Page titles and dashboard KPIs. Used sparingly — only on landing views and major section headers.
- **Headline** (600 weight, 1.25rem, line-height 1.3): Card titles, modal headers, section divisions. The workhorse of the interface.
- **Title** (600 weight, 1rem, line-height 1.4): Subsection headers, table column titles, and grouped content labels.
- **Body** (400 weight, 0.875rem, line-height 1.5): Descriptions, form helper text, and general content. Comfortable reading length; max-width 70ch when used in paragraphs.
- **Label** (600 weight, 0.75rem, letter-spacing 0.05em, uppercase): Input labels, badges, chip text, and metadata. The all-caps treatment with wide tracking creates clear hierarchy without size alone.

### Named Rules
**The Label Shouts Rule.** Input labels are always uppercase, 0.75rem, with 0.05em tracking. This consistency trains users to scan forms rapidly and identifies interactive controls instantly.

**The Weight Ladder Rule.** Only two weights are used for 90% of the UI: 400 for body, 600 for everything that needs emphasis. The 300 and 700 weights are reserved for special moments (hero text, critical alerts).

## Layout

The spatial system follows a simple 8px grid with a 4px sub-grid for fine adjustments. Density is medium-high — retail interfaces need information density, but not clutter.

- **Base unit:** 8px
- **Spacing scale:** 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl)
- **Container max-width:** Fluid; the POS interface fills available viewport width
- **Card padding:** 24px (lg) standard, 16px (md) for compact tables and lists
- **Form spacing:** 16px (md) between fields, 8px (sm) between label and input
- **Section separation:** 32px (xl) between major content blocks

**Responsive behavior:** The system is primarily desktop-first (cashier terminals, manager workstations). Touch targets maintain a minimum 44px height. On smaller viewports, the sidebar collapses and tables switch to card-based layouts.

**Density zones:**
- **POS screen:** High density, minimal padding, maximum information per viewport
- **Dashboard:** Medium density, breathing room for data visualization and KPIs
- **Settings/Forms:** Standard density, generous spacing for readability and reduced error rates

## Elevation & Depth

The system is **layered and breathable**. Depth is expressed through a combination of subtle tonal shifts, backdrop blur, and restrained shadow vocabulary. Surfaces are not flat for flatness' sake — they stack when functionality requires separation.

### Shadow Vocabulary
- **Ambient Modal** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)`): Used exclusively for modals and dialogs. The large diffuse shadow creates clear separation from the operational layer beneath.
- **Surface Lift** (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)`): Cards and elevated containers in dashboards. Subtle enough to not compete with content.

### Backdrop Treatment
- **Modal Overlay** (`background: rgba(0,0,0,0.5); backdrop-filter: blur(4px)`): The overlay behind modals uses a semi-transparent black with a light blur. This dims the operational context without fully obscuring it — a subtle reminder of what the user was doing.

### Named Rules
**The Functional Lift Rule.** Shadows appear only as a response to state or elevation purpose. A card at rest may have no shadow; the same card in a modal receives Surface Lift. Depth is functional, never decorative.

**The No-Glassmorphism Rule.** Backdrop blur is reserved for modal overlays only. No frosted-glass cards, no blurred navigation bars. The interface values clarity over trend.

## Shapes

The form language is **confidently rounded**. Corners are softened enough to feel approachable in a retail context, but not so much that the interface feels playful or childish.

- **Buttons and Inputs:** 8px radius (`rounded-lg`). The standard unit for all interactive controls.
- **Cards and Modals:** 12px radius (`rounded-xl`). Slightly larger than controls to visually contain them.
- **Badges and Chips:** 9999px radius (`rounded-full`). Pill-shaped for scanability and to differentiate from actionable buttons.
- **Small elements (icons, thumbnails):** 4px radius (`rounded-sm`) or 10px (`rounded-10`) for medium containers.

**Border strategy:** 1px solid borders using `border` color (#E2E5EE) for input outlines, card delineation, and table row separators. Borders are light and structural, never decorative.

**Corner consistency:** All corners on a given element use the same radius. No asymmetric rounding (e.g., top-rounded, bottom-sharp) outside of special UI moments like bottom sheets.

## Components

### Buttons
- **Shape:** 8px radius, inline-flex centered
- **Primary:** Fresh Signal Green background (#00C853), white text, 600 weight. Hover deepens to #00A846. Active state scales to 0.98 with a 150ms transition.
- **Secondary:** Transparent background, 1px Soft Border, Deep Slate text. Hover fills with a light gray (#F9FAFB). Used for cancel, back, and non-critical actions.
- **Danger:** Alert Rose background (#FF5370), white text. Hover deepens to a darker red. Reserved for destructive actions (delete, remove, refund).
- **Sizes:** sm (px-3 py-1.5), md (px-4 py-2), lg (px-6 py-3)
- **Focus:** 2px ring with 20% opacity of the button's base color. Visible and accessible without being visually loud.

### Inputs / Fields
- **Style:** 8px radius, 1px Soft Border, Pure Surface background. Text in Deep Slate, placeholder in Mist Gray.
- **Focus:** Border shifts to Fresh Signal Green, 2px green ring at 20% opacity. Smooth transition over 150ms.
- **Error:** Border becomes Alert Rose, focus ring matches rose at 20% opacity. Error text below in Alert Rose, 0.75rem.
- **Labels:** Always uppercase, 0.75rem, Mist Gray, 600 weight, 0.05em tracking. Positioned 4px above the input.
- **Icon support:** Optional right-aligned icon in Mist Gray, vertically centered.

### Badges / Chips
- **Style:** Pill-shaped (full radius), 0.75rem semibold text, background at 10% opacity of the semantic color.
- **Success:** 10% Fresh Signal Green background, Fresh Signal Green text.
- **Warning:** 10% amber background, amber-600 text.
- **Error:** 10% Alert Rose background, Alert Rose text.
- **Neutral:** 10% Mist Gray background, Mist Gray text.
- **Info:** 10% Clear Sky Blue background, Clear Sky Blue text.

### Cards / Containers
- **Corner Style:** 12px radius for primary cards, 8px for nested containers.
- **Background:** Pure Surface (#FFFFFF) on Porcelain canvas. Raised Surface (#252B33) in dark mode.
- **Shadow Strategy:** Surface Lift shadow for dashboard cards; flat for POS screen cards where speed matters more than visual separation.
- **Border:** 1px Soft Border only when the card needs definition against a white background (rare).
- **Internal Padding:** 24px standard, 16px for compact data-dense cards.

### Modals / Dialogs
- **Container:** 12px radius, Pure Surface, max-width 672px (max-w-2xl), max-height 90vh with overflow scrolling.
- **Header:** 24px padding, 1px bottom border in Soft Border. Title in Headline (600, 1.25rem), optional subtitle in Body (0.875rem, Mist Gray).
- **Close Button:** Top-right, Mist Gray X icon, hover shifts to Deep Slate.
- **Overlay:** Semi-transparent black (50%) with 4px backdrop blur.
- **Shadow:** Ambient Modal shadow for clear elevation above all other content.

### Navigation / Sidebar
- **Style:** Vertical stack of links/buttons. Active state uses a 3px left border in Fresh Signal Green with a light green background tint (10% opacity).
- **Typography:** Label style (0.875rem, 600 weight). Icons paired with text, 20px size.
- **Hover:** Background shifts to a subtle gray tint, no border change.
- **Collapsed state:** Icons only, 64px width, tooltips on hover.

## Do's and Don'ts

### Do:
- **Do** use Fresh Signal Green only for primary actions, success states, and positive metrics. Its rarity is its power.
- **Do** maintain the 8px grid for all spacing, padding, and margins. The rhythm is part of the system's feel.
- **Do** use uppercase labels with 0.05em tracking for all form controls and metadata. Consistency builds scanning speed.
- **Do** apply Surface Lift shadows to dashboard cards and data containers. The subtle depth helps organize information.
- **Do** ensure touch targets are minimum 44px height in POS screens. Cashiers may use tablets or touch displays.
- **Do** use DM Mono for all numerical data (prices, order numbers, quantities). Tabular alignment improves error detection.

### Don't:
- **Don't** use shadows on POS screen operational elements (product grid, cart items). Flatness signals speed and directness.
- **Don't** apply glassmorphism, frosted effects, or backdrop blur outside modal overlays. Clarity over trend.
- **Don't** use border radius larger than 12px on any element. The system is friendly but professional, not playful.
- **Don't** use more than two font weights in a single view. Stick to 400 (body) and 600 (emphasis) for cohesion.
- **Don't** place decorative gradients or background patterns. The Porcelain canvas is intentionally plain to reduce visual noise.
- **Don't** use Alert Rose for anything other than errors and destructive confirmations. Reserve its emotional weight for moments that need attention.

## Exceptions & Edge Cases

### Print Surfaces (Thermal Receipts)
The `PrintableReceipt` component renders for physical thermal printers (58mm–80mm paper width). Standard typography rules are intentionally relaxed:
- **8–11px font sizes** are permitted for header metadata, item lines, and footer disclaimers.
- **DM Mono at 400 weight** is required for all numerical columns (price, quantity, totals) to maintain tabular alignment in a narrow canvas.
- **Gray tones (`text-gray-400`, `text-gray-500`)** are allowed for secondary print metadata where contrast against white thermal paper remains sufficient.
These exceptions exist only inside receipt/reports contexts; they do not apply to on-screen UI.

### Dense Data Tables (Delivery Notes)
The `DeliveryNoteReviewModal` displays parsed supplier delivery notes in a dense review grid. Standard rules are relaxed:
- **10px (`text-xs` minimum)** is permitted for table cell text when the grid must display 8+ columns (SKU, description, qty, price, category, suggested category, action buttons) in a single viewport.
- **Compact padding (`px-1.5 py-0.5`)** on badges and chips inside table rows is allowed to prevent horizontal overflow.
These exceptions are scoped strictly to data-dense review tables; standard form labels and headings inside the same modal follow the normal type ramp.
