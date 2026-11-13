# Feature: Variant Catalog Refactor (Option A — everything from variants)

## Objective
Unify the product catalog stock model onto `product_variants`: sizes ("Tallas") become one-dimension variants with a `Talla` attribute, so every product shape (plain / sizes / variants) shares one editor, one stock model, and N dimensions (e.g. t-shirt size+color) become expressible.

## Problem
Three parallel stock shapes coexist (`products.stock`, `product_sizes`, `product_variants`) with divergent behavior: size+color products cannot be expressed, two UIs disagree (variants = rich form, sizes = plain table), and several paths make data lie (variant price is display-only, refunds restore to the wrong row, sale history drops the size/variant dimension). Migration 016 half-migrated sizes into variants and left dual-row products behind.

## Why (decision)
Maintainer chose Option A on 2026-11-12 after a model exploration: `product_variants.attributes` is JSONB and already supports N dimensions at DB, POS selection, and edit form; `product_sizes` is the historical accident. Option B (compatibility façade) keeps dual write paths forever; Option C (normalized join tables) is unjustified at POS scale.

## Scope
In scope: data migration (sizes → variants with dedupe), unified stock editor (stock + min_stock for all shapes), dynamic attribute slots in create modal, collision-safe variant SKUs, size-group presets filling the `Talla` slot, cleanup of `product_sizes`.
Out of scope: per-dimension analytics, attribute normalization (Option C), RLS changes (tracked in #31/#39), POS redesign beyond shape selection.

## Constraints
- AGENTS.md conventions: feature-based structure, relative imports, `import type`, Tailwind-only, kebab row actions, i18n for user-facing strings (en+es), tests with behavior.
- Issue-first PRs; Conventional Commits; no AI attribution.
- Migrations idempotent and ledger-doctrine compliant (repo is source of truth; `db push` records; prod applied-migrations reconciled with `supabase migration repair` when needed).
- Production data must survive the migration (dedupe dual rows, repair stock gaps, preserve sale history).
- Staging validation via the local stack before merging anything behavioral to main.

## Delivery strategy
`ask-on-risk`. Forecast total: >400 authored lines (phase 2 alone will exceed). Plan: one PR per phase, each merged to main before the next (main is the integration point — no branch chain needed). If a single phase PR forecast exceeds ~400 lines, ask the chain strategy before that phase's commits. Resolve `chained-pr` skill before planning any chained slice.

## Tasks (stable IDs)
### Phase 0 — Data integrity (make the data tell the truth) — branch `fix/sale-line-integrity`
- [ ] T0.1 Variant price integrity: totals and persistence use `selectedVariant?.price ?? product.price` (Cart.tsx totals, POSPage subtotal, PaymentStep lineTotal, salesService unit_price)
- [ ] T0.2 Sale line snapshots: write `variant_sku`/`variant_attributes` at sale insert
- [ ] T0.3 History read path: `mapDbSale` maps `selected_size`/`variant_id` back onto `OrderItem` (fields already exist in types)
- [ ] T0.4 Refunds restore to the right row: `RefundItem` gains `variantId`; RefundModal threads variantId/size from the sale line; line selection keyed by line identity, not `product.id`
- [ ] T0.5 Regression tests per fix (price round-trip, refund restore target, history read-back)

### Phase 1 — Data migration (sizes → variants)
- [ ] T1.1 Migration 021: dedupe dual-row products (prefer `product_variants`), convert remaining `product_sizes` rows to `{"Talla": size}` variants, repair skipped stock, set `has_variants`/`variant_attributes`
- [ ] T1.2 Idempotence + prod reconciliation notes (repair as applied if run manually)
- [ ] T1.3 Migration tests/verification against local stack with seed data

### Phase 2 — Unified UI
- [x] T2.1 One stock editor for all shapes (variant-style form: SKU, prices inherit, stock, min_stock, attributes); sizes products render as 1-dim variant tables
- [ ] T2.2 Size-group presets fill the `Talla` attribute slot in the create modal
- [ ] T2.3 Dynamic attribute slots (N, not 2) in create modal
- [ ] T2.4 Collision-safe variant SKU generation (no 2-letter prefix collisions)
- [x] T2.5 min_stock configurable for plain products in the same editor (maintainer request)
- [ ] T2.6 i18n keys updated (remove dead keys, add new); tests for the editor flows

### Phase 3 — Cleanup
- [ ] T3.1 Migration 022: drop `product_sizes` (after verifying zero rows / app references)
- [ ] T3.2 Remove SizesSection/SizeSelectorModal and shape branches in favor of variant paths
- [ ] T3.3 Seed updated to variant shape; AGENTS.md/product docs updated
- [ ] T3.4 Full verification: suite green, build, lint, staging checklist (catalog + POS + refunds + reports)

## Authorized scope
User authorized the Option A refactor ("A: Todo desde variantes") and the step-by-step execution ("vamos paso a paso"). Phase 0 authorized to start immediately. Later phases proceed in order under the same authorization; product-visible decisions (e.g. SKU format) get one focused question each when truly open.

## Acceptance criteria
- A t-shirt can be configured with size AND color dimensions from the create modal.
- One editor (variant-style) edits stock/min_stock for every product shape.
- Sales record and display the exact variant/size sold; refunds restore to the same row; reports can group by the dimension.
- `product_sizes` no longer exists; no shape-branching UI remains.
- Suite green (baseline 77 + new), build, lint exit 0.

## Applicable checks
Per task: `npm run test:run`, `npm run build`, `npm run lint` (exit 0; known warning ProductDetailPanel exhaustive-deps out of scope). Staging click-through for user-visible behavior. Migration phases: `supabase db reset` locally clean.

## Route record
- Phase 0: delegated writer (multi-file: ~10 files across cart/checkout/sales/refunds — writer trigger).
- Phase 1: delegated writer (migration authoring + verification — preparation trigger).
- Phase 2: delegated writer(s) (multi-file UI — writer trigger); chain question if >400 lines.
- Phase 3: delegated writer (removal + docs — writer trigger).

## Progress / verification evidence
(Updated as tasks close.)

- Phase 2 slice 2.1 (T2.1 + T2.5) closed on `feat/unified-stock-editor` with work-unit commit `feat(products): unified stock editor for all product shapes` (component + panel wiring + i18n + tests together).
  - **Chain strategy (maintainer choice): stacked-to-main.** Phase 2 splits into three PRs targeting `main` in order: `2.1 unified stock editor` 📍 (this) → `2.2 create-modal presets + dynamic attribute slots` → `2.3 collision-safe SKUs + i18n/tests cleanup`. Prior dependency: PR #45 (migration 022, `feat/db-migrate-sizes-to-variants`) merges first; this slice works with or without 022 — the editor serves the pre-022 `product.sizes` shape and the variant shape through the same UX.
  - **Unified editor:** `StockEditor.tsx` + `StockRowForm.tsx` replace `StockSection`/`SizesSection` (both removed). Per shape: plain = sku/stock/min_stock row → kebab → rich form (stock + min_stock, T2.5) → Cancelar/Actualizar → `updateProductAsync`; legacy sizes = 1-dim rows (size chip, amber low-stock) with the same form → `updateProductSize`/sizes-diff paths; variants = `VariantsSection` unchanged, rendered as the editor's variant mode (SKU / prices inherit / attributes / add / delete preserved).
  - **Verification:** focused `npx vitest run StockEditor.test.tsx ProductDetailPanel.plainStock.test.tsx`: 11 passed. `npm run test:run`: 111 passed / 0 failed (102 baseline + 9 new). `npm run build`: ok. `npm run lint`: exit 0 (known ProductDetailPanel warning). Review count 889 changed lines (650 + 239) > 400 → `size:exception` recommended (no cohesive split fits; tests stay with behavior).
  - **Base note:** this branch is based on `main` before PR #45; the Phase 0/1 evidence and checkbox ticks live on `feat/db-migrate-sizes-to-variants` and land with #45. Merge order: #45 first, then this slice (trivial doc conflict resolution expected).

## Next step
Launch Phase 2 slice 2.2 (T2.2 + T2.3 — create-modal presets + dynamic attribute slots) on its own branch (stacked-to-main).
