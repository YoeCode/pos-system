# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Casa Lis POS System — a multi-tenant point-of-sale application for retail businesses. Built with React 19, TypeScript, Redux Toolkit, Tailwind CSS, and Supabase (auth, database, realtime sync).

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — type-check with `tsc -b` then build with Vite
- `npm run lint` — ESLint
- `npm run test` — Vitest in watch mode
- `npm run test:run` — Vitest single run
- `npx vitest run src/path/to/file.test.tsx` — run a single test file

## Architecture

### State Management

Redux Toolkit with feature-based slices. All slices live in `src/features/<domain>/`. Typed hooks (`useAppDispatch`, `useAppSelector`) are exported from `src/app/store.ts` — always use these, never raw `useDispatch`/`useSelector`.

Slices:
- `auth` — login/logout, session persistence via localStorage (`nexopos_session`), tenant selection
- `pos` — cart operations, multi-window state, payment method, category selection (sync, localStorage persistence)
- `products` — product CRUD, filtering, status management
- `employees` — employee CRUD
- `sales` — completed orders, order number sequence
- `dashboard` — KPIs, chart data, alerts (selectors only, no async)
- `settings` — all app configuration (tax, store, POS, categories, brands, seasons, sizes, loyalty, ticket, refunds)
- `customers` — customer CRUD, loyalty points
- `refunds` — refund processing

### Backend

Supabase provides auth, database, and realtime sync. Service files (`<domain>Service.ts`) handle all Supabase queries. Every query filters by `tenantId` for multi-tenancy. Auto-generated types live in `src/supabase/types.ts`.

### Routing & Auth

`src/router/index.tsx` defines all routes. `ProtectedRoute` wraps authenticated pages — checks `auth.isAuthenticated` and enforces role-based permissions via `ROLE_PERMISSIONS` map in `src/types/index.ts`.

Roles: `cashier` (POS only) → `supervisor` → `manager` → `admin` (all pages). Cashiers fallback to `/pos`, others to `/dashboard`.

### Layouts

- `AuthLayout` — login screen wrapper
- `DashboardLayout` — sidebar nav + top bar, wraps all authenticated pages. Filters nav items by user permissions.

### Feature Organization

Each feature under `src/features/<domain>/` contains its Redux slice and related components. Pages under `src/pages/<PageName>/` are thin wrappers that compose feature components.

### Checkout Flow

`src/features/pos/checkout/` — three-step modal: `CheckoutModal` (step orchestrator) → `PaymentStep` → `ReceiptStep`. Tax rate is a shared constant at `src/constants/tax.ts` (21%).

### UI Components

Reusable primitives in `src/components/ui/`: Button, Input, Badge, Modal, Toggle, Select.

### i18n

Translation system in `src/i18n/`: `I18nContext`, `I18nProvider`, `useI18n()` hook. Translations in `src/i18n/translations/en.ts` and `es.ts`.

### Custom Hooks

- `src/hooks/usePermission.ts` — role-based permission checking
- `src/components/useToast.ts` — toast notification system

## Testing

Vitest with jsdom environment. Config at `vitest.config.ts`. Setup file at `src/test/setup.ts`. Testing Library (React + user-event + jest-dom) available.

Tests are co-located with source using `.test.ts`/`.test.tsx` suffix. Only 5 test files exist currently — coverage is low.

## Key Conventions

- All domain types are centralized in `src/types/index.ts`
- Tailwind for all styling — no CSS modules, no styled-components
- `import type` required for type-only imports (`verbatimModuleSyntax: true`)
- No enums or namespaces (`erasableSyntaxOnly: true`)
- Relative imports only — no path aliases
- React functional components with `React.FC<Props>`
- SVG icons are inline JSX — no icon library
