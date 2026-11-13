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
- [x] T1.1 Migration 021: dedupe dual-row products (prefer `product_variants`), convert remaining `product_sizes` rows to `{"Talla": size}` variants, repair skipped stock, set `has_variants`/`variant_attributes`
- [x] T1.2 Idempotence + prod reconciliation notes (repair as applied if run manually)
- [x] T1.3 Migration tests/verification against local stack with seed data

### Phase 2 — Unified UI
- [ ] T2.1 One stock editor for all shapes (variant-style form: SKU, prices inherit, stock, min_stock, attributes); sizes products render as 1-dim variant tables
- [ ] T2.2 Size-group presets fill the `Talla` attribute slot in the create modal
- [ ] T2.3 Dynamic attribute slots (N, not 2) in create modal
- [ ] T2.4 Collision-safe variant SKU generation (no 2-letter prefix collisions)
- [ ] T2.5 min_stock configurable for plain products in the same editor (maintainer request)
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

- Phase 0 (T0.1–T0.5) merged to main via #43 — `fix(sales): la línea de venta refleja lo vendido (precio de variante, snapshots, devoluciones)`.
- Phase 1 (T1.1–T1.3) closed on `feat/db-migrate-sizes-to-variants` with work-unit commit `feat(db): converge product sizes into variants` (migration 022 + seed alignment + this doc update together).
  - **Numbering decision:** the plan drafted this migration as 021, but 020 is taken and 021 is reserved for a later phase adjustment, so it ships as **022** (`022_migrate_remaining_product_sizes_to_variants.sql`). T3.1's `DROP TABLE product_sizes` migration will be numbered after 022.
  - **Stock-merge decision (dual rows):** **GREATEST(variant, size row)** for stock and min_stock. Migration 016 created the variant as a copy of the size row's stock and left the size row in place; every later write decremented/restored exactly one of the two rows, so both drifted apart from the same base S. SUM double-counts the shared base (overcount = S); GREATEST overcounts by at most the smaller drift and never drops units one of the rows still reports. min_stock keeps the higher low-stock threshold for the same reason. (Full rationale in the migration header.)
  - **Collision-safe SKUs:** rows whose computed SKU (`COALESCE(ps.sku, p.sku || '-' || ps.size)`) collides under `UNIQUE(tenant_id, sku)` get `-1`, `-2`, … appended until free — no row is ever skipped (016's `ON CONFLICT (tenant_id, sku) DO NOTHING` silently dropped colliding rows and their stock).
  - **Attribute upsert fix:** the per-tenant `Talla` entry in `product_attributes` is aggregated to exactly one row per tenant; 016's upsert emitted one candidate row per size and would abort with `ON CONFLICT DO UPDATE command cannot affect row a second time` for any tenant with more than one distinct size.
  - **Seed alignment:** `product_sizes` inserts converted to `product_variants` `{"Talla": size}` rows (price/cost_price NULL = inherit parent), plus the flag/attribute statements 022 would otherwise provide — 022 runs before the seed on fresh resets and sees empty tables.
  - **Prod reconciliation:** if 022 is ever applied by hand instead of via `supabase db push`, record it with `supabase migration repair --status applied 022_migrate_remaining_product_sizes_to_variants` (ledger doctrine).
  - **Verification (local stack):** `supabase db reset` clean (migrations 000-022 + seed); post-reset `product_sizes` = 0 rows; the 5 ex-size products hold 23 Talla variants with stock sums 26 / 33 / 12 / 26 / 68 equal to `products.stock` (= `SUM(variant stock)` per product, maintained by `trg_update_variant_stock`); `product_attributes.Talla` = union of all 15 size names. Synthetic legacy-data run of the 022 body (dual row + explicit-SKU collision + generated-SKU collision + skipped row) converted every row with the expected GREATEST merges and `-1` suffixed SKUs; a second run was fully no-op (idempotent). `npm run test:run`: 102 passed / 0 failed. `npm run build`: ok. `npm run lint`: exit 0 (known ProductDetailPanel warning).

## Next step
Launch Phase 2 (T2.1–T2.6) — unified stock editor — on its own branch.
