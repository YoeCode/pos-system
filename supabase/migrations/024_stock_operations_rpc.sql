-- ============================================
-- Casa Lis POS - Stock mutations through SECURITY DEFINER RPCs
--
-- Why: stock decrements at checkout (reduceStock) and increments on refunds /
-- delivery-note restocks (restoreStock) are written from ANY role, including
-- cashiers. The `products_tenant_update` policy (migration 001) only allows
-- owner/admin/manager writes on `products`, and the same class of restriction
-- applies to `product_variants`. Today those writes appear to work because RLS
-- is still disabled on `products`; once the RLS lockdown migration activates
-- it, a cashier's UPDATE silently filters to 0 rows and the sale completes
-- with NO stock change - a silent data-loss bug.
--
-- Fix: route every stock mutation through two SECURITY DEFINER functions that
-- (a) run with owner privileges so the write always lands, and (b) re-impose
-- the checks RLS would have enforced - caller is a member of the target
-- tenant - plus sanity checks on the arguments. Two functions instead of one
-- signed function (reduce vs restore) so each operation keeps its own
-- EXECUTE grant surface and its own validation.
--
-- Shape routing (mirrors the client logic being replaced):
--   1. p_variant_id present      -> update that product_variants row
--                                   (tenant-scoped; see note below).
--   2. p_size present            -> resolve the product's {"Talla": size}
--                                   variant (legacy sized sale/refund lines);
--                                   if no match, fall through to 3.
--   3. otherwise                 -> update products.stock directly
--                                   (plain products).
--
-- Behavior matched from the previous client implementation:
--   * Decrement floors stock at 0 (GREATEST(0, stock - quantity)); the
--     previous client used Math.max(0, ...).
--   * Restore adds without ceiling.
--   * restore_stock optionally updates products.cost_price (delivery-note
--     restocks pass a cost price); the write only happens on the plain
--     products path, exactly like the previous client. Variant-path cost
--     updates were never performed client-side and are not added here.
--   * Returns FALSE when the target row was not found / not in the tenant
--     (0 rows updated). The previous client returned TRUE in that case,
--     which is exactly the "silent no-op" class of bug this migration kills:
--     a caller that needs the write to happen can now detect that it did not.
--
-- TRIGGER CONSISTENCY NOTE: updating `product_variants` fires
-- `trg_update_variant_stock` (migration 016), which recomputes
-- `products.stock = SUM(variant stock)`. Because that UPDATE happens inside a
-- SECURITY DEFINER function, the trigger runs with the function owner's
-- privileges (not the calling cashier's), so the aggregate sync succeeds even
-- for callers who cannot update `products` themselves. This is exactly what
-- keeps products.stock consistent for cashier-driven variant writes.
--
-- SECURITY NOTE: SECURITY DEFINER bypasses RLS, so these functions must not
-- become a cross-tenant write oracle. Every write is scoped by
-- tenant_id = p_tenant_id, and p_tenant_id is validated against the caller's
-- `employees` membership (the same table current_tenant_id() uses). Note the
-- membership check is deliberately NOT gated on tenant_role/role: cashiers
-- must be able to mutate stock at sale time - that is the whole point of this
-- migration.
--
-- Grants: EXECUTE is revoked from PUBLIC/anon and granted to `authenticated`
-- only, matching how the RPCs are meant to be reached (PostgREST as a logged
-- in user).
-- ============================================

-- --------------------------------------------
-- reduce_stock: decrement stock for a sale.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.reduce_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_size text,
  p_quantity integer,
  p_tenant_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant_id uuid;
  v_updated integer;
BEGIN
  -- Argument sanity: reject nonsense before touching any row.
  IF p_product_id IS NULL OR p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'reduce_stock: product and tenant are required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'reduce_stock: quantity must be a positive integer';
  END IF;

  -- Tenant membership (mirrors current_tenant_id()'s employees lookup):
  -- the caller must have an employees row in the target tenant. auth.uid()
  -- schema-qualified because search_path is pinned to public.
  IF NOT EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'reduce_stock: caller is not a member of tenant %', p_tenant_id;
  END IF;

  -- Shape 1: explicit variant id. Tenant-scoped because SECURITY DEFINER
  -- bypasses RLS (the old client relied on RLS for this isolation).
  v_variant_id := p_variant_id;

  -- Shape 2: legacy sized line -> resolve its {"Talla": size} variant.
  IF v_variant_id IS NULL AND p_size IS NOT NULL THEN
    SELECT pv.id INTO v_variant_id
    FROM product_variants pv
    WHERE pv.product_id = p_product_id
      AND pv.tenant_id = p_tenant_id
      AND pv.attributes->>'Talla' = p_size
    LIMIT 1;
    -- No Talla variant: fall through to the plain products.stock path,
    -- matching the previous client.
  END IF;

  IF v_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = v_variant_id
      AND tenant_id = p_tenant_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    -- trg_update_variant_stock re-syncs products.stock from the variant sum
    -- as the function owner (see TRIGGER CONSISTENCY NOTE above).
    RETURN v_updated > 0;
  END IF;

  -- Shape 3: plain product. Floor at 0 like the previous Math.max(0, ...).
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id
    AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;

-- --------------------------------------------
-- restore_stock: increment stock for a refund or a delivery-note restock.
-- Optional p_cost_price updates products.cost_price on the plain path only
-- (delivery-note restocks relied on this; variant-path cost updates were
-- never done client-side).
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_stock(
  p_product_id uuid,
  p_variant_id uuid,
  p_size text,
  p_quantity integer,
  p_tenant_id uuid,
  p_cost_price numeric DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant_id uuid;
  v_updated integer;
BEGIN
  IF p_product_id IS NULL OR p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'restore_stock: product and tenant are required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'restore_stock: quantity must be a positive integer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'restore_stock: caller is not a member of tenant %', p_tenant_id;
  END IF;

  v_variant_id := p_variant_id;

  IF v_variant_id IS NULL AND p_size IS NOT NULL THEN
    SELECT pv.id INTO v_variant_id
    FROM product_variants pv
    WHERE pv.product_id = p_product_id
      AND pv.tenant_id = p_tenant_id
      AND pv.attributes->>'Talla' = p_size
    LIMIT 1;
  END IF;

  IF v_variant_id IS NOT NULL THEN
    -- No ceiling, matching the previous client. Trigger re-syncs the
    -- products.stock aggregate (see TRIGGER CONSISTENCY NOTE).
    UPDATE product_variants
    SET stock = stock + p_quantity
    WHERE id = v_variant_id
      AND tenant_id = p_tenant_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
  END IF;

  UPDATE products
  SET stock = stock + p_quantity,
      cost_price = COALESCE(p_cost_price, cost_price)
  WHERE id = p_product_id
    AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;

-- --------------------------------------------
-- Grants: authenticated only. PostgreSQL grants EXECUTE to PUBLIC by default,
-- so the revoke comes first. service_role reaches tables directly and does
-- not need these.
-- --------------------------------------------
REVOKE ALL ON FUNCTION public.reduce_stock(uuid, uuid, text, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reduce_stock(uuid, uuid, text, integer, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reduce_stock(uuid, uuid, text, integer, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.restore_stock(uuid, uuid, text, integer, uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_stock(uuid, uuid, text, integer, uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.restore_stock(uuid, uuid, text, integer, uuid, numeric) TO authenticated;
