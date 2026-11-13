import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../supabase/client';
import { reduceStock, restoreStock } from './productsService';

// Stock mutations go through the SECURITY DEFINER RPCs added in migration
// 024. These tests pin the RPC contract: the right function is called with
// the right arguments per product shape (variant id / size / plain), and
// failures are returned as false instead of being swallowed.
vi.mock('../../supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

const rpc = vi.mocked((supabase as any).rpc);

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const VARIANT_ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

beforeEach(() => {
  rpc.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('reduceStock', () => {
  it('routes a variant-shaped line through reduce_stock with the variant id', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const ok = await reduceStock(PRODUCT_ID, 2, undefined, TENANT_ID, VARIANT_ID);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('reduce_stock', {
      p_product_id: PRODUCT_ID,
      p_variant_id: VARIANT_ID,
      p_size: null,
      p_quantity: 2,
      p_tenant_id: TENANT_ID,
    });
  });

  it('routes a legacy sized line through reduce_stock with p_size (RPC resolves the Talla variant)', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const ok = await reduceStock(PRODUCT_ID, 1, 'M', TENANT_ID, undefined);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('reduce_stock', {
      p_product_id: PRODUCT_ID,
      p_variant_id: null,
      p_size: 'M',
      p_quantity: 1,
      p_tenant_id: TENANT_ID,
    });
  });

  it('routes a plain product through reduce_stock with no variant or size', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const ok = await reduceStock(PRODUCT_ID, 3, undefined, TENANT_ID);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('reduce_stock', {
      p_product_id: PRODUCT_ID,
      p_variant_id: null,
      p_size: null,
      p_quantity: 3,
      p_tenant_id: TENANT_ID,
    });
  });

  it('returns false when the RPC fails instead of swallowing the error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });

    await expect(reduceStock(PRODUCT_ID, 1, undefined, TENANT_ID)).resolves.toBe(false);
  });

  it('returns false when the RPC reports the target row was not updated', async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(reduceStock(PRODUCT_ID, 1, undefined, TENANT_ID, VARIANT_ID)).resolves.toBe(false);
  });

  it('forwards a missing tenant as null so the RPC rejects it', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'tenant required' } });

    const ok = await reduceStock(PRODUCT_ID, 1, undefined, undefined, VARIANT_ID);

    expect(ok).toBe(false);
    expect(rpc).toHaveBeenCalledWith('reduce_stock', expect.objectContaining({ p_tenant_id: null }));
  });
});

describe('restoreStock', () => {
  it('routes a variant-shaped line through restore_stock with the variant id', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const ok = await restoreStock(PRODUCT_ID, 2, undefined, TENANT_ID, undefined, VARIANT_ID);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('restore_stock', {
      p_product_id: PRODUCT_ID,
      p_variant_id: VARIANT_ID,
      p_size: null,
      p_quantity: 2,
      p_tenant_id: TENANT_ID,
      p_cost_price: null,
    });
  });

  it('routes a legacy sized line through restore_stock with p_size', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const ok = await restoreStock(PRODUCT_ID, 1, 'L', TENANT_ID);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('restore_stock', {
      p_product_id: PRODUCT_ID,
      p_variant_id: null,
      p_size: 'L',
      p_quantity: 1,
      p_tenant_id: TENANT_ID,
      p_cost_price: null,
    });
  });

  it('forwards the delivery-note cost price on the plain path', async () => {
    rpc.mockResolvedValue({ data: true, error: null });

    const ok = await restoreStock(PRODUCT_ID, 5, undefined, TENANT_ID, 4.5);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('restore_stock', {
      p_product_id: PRODUCT_ID,
      p_variant_id: null,
      p_size: null,
      p_quantity: 5,
      p_tenant_id: TENANT_ID,
      p_cost_price: 4.5,
    });
  });

  it('returns false when the RPC fails instead of swallowing the error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });

    await expect(restoreStock(PRODUCT_ID, 1, undefined, TENANT_ID)).resolves.toBe(false);
  });

  it('returns false when the RPC reports the target row was not updated', async () => {
    rpc.mockResolvedValue({ data: false, error: null });

    await expect(restoreStock(PRODUCT_ID, 1, undefined, TENANT_ID)).resolves.toBe(false);
  });
});
