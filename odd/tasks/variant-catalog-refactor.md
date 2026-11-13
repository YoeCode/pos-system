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
- [x] T2.2 Size-group presets fill the `Talla` attribute slot in the create modal
- [x] T2.3 Dynamic attribute slots (N, not 2) in create modal
- [x] T2.4 Collision-safe variant SKU generation (no 2-letter prefix collisions)
- [x] T2.5 min_stock configurable for plain products in the same editor (maintainer request)
- [x] T2.6 i18n keys updated (remove dead keys, add new); tests for the editor flows

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

- Phase 2 slice 2.2 (T2.2 + T2.3 + T2.4) closed on `feat/create-modal-variant-presets` with work-unit commit `feat(products): create modal is variant-native with dynamic attributes and safe SKUs`.
  - **Re-slice (disclosed to the maintainer):** T2.4 moved from slice 2.3 into this slice. With N-slot combinations the old 2-letter-prefix SKU generator multiplies silent SKU collisions (`createProductVariant` returns `null`, the UI added ghost variants with fake UUIDs); delivering dynamic slots before safe SKUs would ship a combinatorial ghost factory. SKU safety therefore lands with the slot work it protects.
  - **Chain strategy (maintainer choice): stacked-to-main.** PR order: `2.1 unified stock editor` (delivered) → `2.2 create-modal presets + dynamic attribute slots + collision-safe SKUs` 📍 (this) → `2.3 i18n/tests/doc cleanup`. This branch is independent of `feat/unified-stock-editor` (no shared files: the create modal, its subcomponents, and the variant SKU helpers vs. the stock editor); merge order 2.1 then 2.2, trivial doc conflict resolution expected.
  - **Variant-native creation:** `ProductCreateModal.tsx` no longer writes `product_sizes` rows. The Tallas toggle creates a `Talla`-dimension variant product (`hasVariants: true`, `variantAttributes: ['Talla']`, one `product_variants` row per size with `attributes: {"Talla": size}` and per-row stock/min_stock). Size-group presets (`DEFAULT_SIZE_GROUPS` vocabulary) pre-fill the Talla dimension; manual size entry adds values one by one. Duplicating a legacy sizes product seeds the Talla dimension from `product.sizes`.
  - **Dynamic attribute slots:** N slots with add/remove buttons replace the hard-coded 2; the Talla dimension is one slot and combines with attribute slots (Color × Talla t-shirt); `generateCombinations` computes the cartesian product across N dimensions and preserves already-typed stock/min_stock across regeneration. Subcomponents extracted to keep the modal bounded: `AttributeSlotSelector.tsx`, `VariantCombinationsTable.tsx` (Stock + Min per row), `TallaDimensionEditor.tsx`.
  - **Collision-safe SKUs:** `variantSku.ts` — stable 3-char slug per attribute value (Rojo → `ROJ`, Rosado → `ROS`, unlike the old 2-letter prefix), joined as `{productSku}-{slug...}`, then probe-loop numeric suffixes exactly like migration 022 (`base`, `base-1`, `base-2`, … until free against the tenant's existing `product_variants` SKUs plus the batch's own reservations via `fetchVariantSkus`). Example: `TP-100-M-ROJ`, and for slug collisions `TP-100-ROS-1`, `TP-100-ROS-2`.
  - **No ghost variants:** every generated variant goes through `createProductVariant` (same service path as manual variants). A failed insert is reported in a loud inline `role="alert"` banner (product created; failed SKUs listed; the modal offers only closing) and never lands in Redux state with a fabricated UUID. Product-creation failures are surfaced too instead of the old silent catch.
  - **Verification:** focused `npx vitest run src/features/products/ProductCreateModal.test.tsx`: 21 passed (15 existing kept + 6 new: Talla-variant creation, preset fill, Color × Talla, N-slot cartesian + slot removal, probe-loop SKUs, no-ghost failure reporting). `npm run test:run`: 108 passed / 0 failed (102 baseline + 6 new). `npm run build`: ok. `npm run lint`: exit 0 (known ProductDetailPanel warning). Review count 1182 changed lines (842 + 340) > 400 → `size:exception` recommended: the <300-line component constraint forces extracting the slot/combination subcomponents (moved code counts on both sides), T2.4 was re-sliced into this unit, and the only sub-400 splits would separate behavior from its tests or commit knowingly-buggy intermediate states.
  - **Follow-ups for slice 2.3 (i18n/tests/doc cleanup):** new UI labels added in the modal's existing literal-Spanish style (`+ Añadir atributo`, `Quitar atributo`, error banner texts) need en+es keys; duplicating variant-shaped products does not pre-fill dimensions (`ProductFormState` carries no variants); consider extracting the modal's base form fields to bring the modal under 300 lines.

- Phase 2 slice 2.3 (T2.6 + Phase 2 close-out) closed on `chore/phase2-i18n-cleanup` (branched from the stacked parent `feat/create-modal-variant-presets`) with work-unit commit `chore(products): i18n completeness and duplicate-product parity for the catalog UI`.
  - **Chain strategy (stacked-to-main):** PR order: `2.1 unified stock editor` (PR #47 pending) → `2.2 create-modal variant-native` (PR pending) → `2.3 i18n/tests/doc cleanup` 📍 (this, final). Both parents are unmerged branches; this slice stacks on 2.2 because T2.6 targets 2.2's files. Rebase/retarget on main after each parent merges.
  - **i18n completeness:** every user-facing string in `ProductCreateModal.tsx`, `AttributeSlotSelector.tsx`, `VariantCombinationsTable.tsx` and `TallaDimensionEditor.tsx` now resolves through `useI18n` (en+es). New keys: `products.namePlaceholder`, `products.skuPlaceholder`, `products.descriptionPlaceholder`, `products.autoGenerateSku`, `products.missingConfig`, `products.createFailed`, `products.variantCreateFailedOne/Many`, `products.attributes.*` (slotLabel, removeSlot, add, selectAttribute, selectValues, all, selected, selectAll), `products.combinations.*` (title, total). The modal reuses existing `products.detail.*` form keys (selectCategory, configCategories, subcategory, noSubcategory, season, selectSeason, configSeasons, brand, selectBrand, configBrands) and `products.stock` / `products.detail.min` / `t.inventory.size`; stale `|| 'literal'` fallbacks were removed. `variantSku.ts` has no user-facing strings (verified). The missing-config banner lost its inline `<strong>` (single-translation-string rule).
  - **Dead keys (grep-verified, both unmerged trees):** removed 14 unreferenced `products.*` keys (`editProduct`, `price`, `costPrice`, `minStock`, `image`, `deleteConfirm`, `detail.category`, `detail.totalStockBySize`, `detail.price`, `detail.inherited`, `detail.editVariant`, `detail.deleteVariant`, `detail.priceInherits`, `detail.unlockDescription`). The originally suspected leftovers are NOT dead yet: `detail.updateSize`, `detail.stockBySize`, `detail.size` are referenced by `SizesSection.tsx` (removed in T3.2) and `detail.addSize`/`detail.removeSize` are reused by `TallaDimensionEditor`; `detail.noSubcategory` and `detail.min` were dormant and are now reused by the modal/combinations table. ~105 dead keys remain in other domains (pos, customers, loyalty, settings, reports) — out of Phase 2 scope, listed as a follow-up.
  - **Duplicate-product parity:** `ProductFormState` now carries `variants` (attributes/stock/minStock); `ProductDetailPanel` seeds `hasVariants`/`variantAttributes`/`variants` from the source product instead of hard-coding `false`/`[]`; the create modal seeds the dimension slots and per-variant stock from them the same way a sizes duplicate seeds Talla. Also fixed the combination-regeneration effect's mount run, which wiped seeded stock before re-render (visible when the modal mounts already open).
  - **Verification:** focused `npx vitest run src/features/products/ProductCreateModal.test.tsx`: 22 passed (21 from slice 2.2 updated to i18n-resolved strings + 1 new duplicate-seeding test). `npm run test:run`: 109 passed / 0 failed (108 slice-2.2 baseline + 1 new). `npm run build`: ok. `npm run lint`: exit 0 (known ProductDetailPanel exhaustive-deps warning). Review count: see commit (`git diff --stat feat/create-modal-variant-presets..chore/phase2-i18n-cleanup`) — within the 400-line budget.
  - **Phase 2 complete.** All of T2.1–T2.6 are delivered across the three stacked slices; merge order 2.1 (PR #47) → 2.2 → 2.3.

- **Phase 3 readiness:** T3.1 (migration 022: drop `product_sizes` after verifying zero rows / app references), T3.2 (remove `SizesSection`/`SizeSelectorModal` and shape branches — then remove the surviving `detail.updateSize`/`detail.stockBySize`/`detail.size` keys; keep `detail.addSize`/`detail.removeSize` while `TallaDimensionEditor` uses them), T3.3 (seed to variant shape; AGENTS.md/product docs updated), T3.4 (full verification: suite, build, lint, staging checklist). Known follow-ups queued for Phase 3: extract the create modal's base form fields (reuse `ProductBasicFields`) to bring the modal under the 300-line rule; audit the ~105 dead translation keys in non-catalog domains.

## Next step
Phase 2 is complete. Proceed to Phase 3 (cleanup) after the three stacked Phase 2 PRs merge to main in order.
