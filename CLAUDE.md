# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Casa Lis POS System — a point-of-sale application for a retail business. Built with React 19, TypeScript, Redux Toolkit, and Tailwind CSS. Currently uses mock data (no backend API).

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
- `auth` — login/logout, session persistence via localStorage (`nexopos_session` key), mock user database
- `pos` — cart operations, payment method, category selection
- `products` — product CRUD, filtering, status management
- `employees` — employee CRUD
- `sales` — completed orders, order number sequence
- `dashboard` — KPIs, chart data, alerts

### Routing & Auth

`src/router/index.tsx` defines all routes. `ProtectedRoute` wraps authenticated pages — checks `auth.isAuthenticated` and enforces role-based permissions via `ROLE_PERMISSIONS` map in `src/types/index.ts`.

Roles: `cashier` (POS only) → `supervisor` → `manager` → `admin` (all pages). Cashiers fallback to `/pos`, others to `/dashboard`.

### Layouts

- `AuthLayout` — login screen wrapper
- `DashboardLayout` — sidebar nav + top bar, wraps all authenticated pages

### Feature Organization

Each feature under `src/features/<domain>/` contains its Redux slice and related components. Pages under `src/pages/<PageName>/` are thin wrappers that compose feature components.

### Checkout Flow

`src/features/pos/checkout/` — three-step modal: `CheckoutModal` (step orchestrator) → `PaymentStep` → `ReceiptStep`. Tax rate is a shared constant at `src/constants/tax.ts` (21%).

### UI Components

Reusable primitives in `src/components/ui/`: Button, Input, Badge, Modal, Toggle.

## Testing

Vitest with jsdom environment. Setup file at `src/test/setup.ts`. Testing Library (React + user-event + jest-dom) available.

## Key Conventions

- All domain types are centralized in `src/types/index.ts`
- Tailwind for all styling — no CSS modules, no styled-components
- No backend — all data is mock/in-memory within Redux slices
