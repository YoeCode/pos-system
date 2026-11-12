import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../supabase/client';
import { updateProductSize, updateProduct } from './productsService';
import type { Product } from '../../types';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

interface QueuedResult {
  data?: any;
  error?: any;
}

function createBuilder(result: QueuedResult) {
  const builder: any = {
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return builder;
}

let pending: { table: string; builder: any }[] = [];
const calls: { table: string; builder: any }[] = [];

function queueResults(...entries: [string, QueuedResult][]) {
  for (const [table, result] of entries) {
    pending.push({ table, builder: createBuilder(result) });
  }
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Tee',
    sku: 'TEE-1',
    category: 'Apparel',
    price: 20,
    costPrice: 10,
    stock: 12,
    minStock: 2,
    status: 'active',
    publishedOnline: false,
    hasVariants: false,
    variantAttributes: [],
    sizes: [
      { size: 'S', stock: 5, minStock: 1 },
      { size: 'M', stock: 7, minStock: 1 },
    ],
    ...overrides,
  };
}

const dbProductRow = {
  id: 'p1',
  name: 'Tee',
  sku: 'TEE-1',
  category: 'Apparel',
  subcategory: null,
  season: null,
  brand: null,
  price: 20,
  cost_price: 10,
  stock: 8,
  min_stock: 2,
  image_url: null,
  description: null,
  status: 'active',
  published_online: false,
  version: null,
  size_group_id: null,
  has_variants: false,
  variant_attributes: [],
  product_sizes: [
    { size: 'S', stock: 5, min_stock: 1, sku: null },
    { size: 'M', stock: 3, min_stock: 1, sku: null },
  ],
  product_variants: [],
};

beforeEach(() => {
  pending = [];
  calls.length = 0;
  (supabase.from as any).mockImplementation((table: string) => {
    const next = pending.shift();
    if (!next) throw new Error(`Unexpected query on table "${table}"`);
    if (next.table !== table) {
      throw new Error(`Expected query on "${next.table}", got "${table}"`);
    }
    calls.push(next);
    return next.builder;
  });
});

describe('updateProductSize', () => {
  it('updates the targeted product_sizes row and returns it', async () => {
    queueResults(
      ['product_sizes', { error: null }],
      ['product_sizes', { data: { size: 'M', stock: 8, min_stock: 2, sku: null }, error: null }],
    );

    const result = await updateProductSize('p1', 'M', { stock: 8, minStock: 2 }, 't1');

    expect(result).toEqual({ size: 'M', stock: 8, minStock: 2, sku: undefined });
    expect(calls).toHaveLength(2);

    const updateCall = calls[0].builder;
    expect(updateCall.update).toHaveBeenCalledWith({ stock: 8, min_stock: 2 });
    expect(updateCall.eq).toHaveBeenCalledWith('product_id', 'p1');
    expect(updateCall.eq).toHaveBeenCalledWith('size', 'M');
    expect(updateCall.eq).toHaveBeenCalledWith('tenant_id', 't1');

    expect(calls[1].builder.single).toHaveBeenCalled();
  });

  it('returns null (failure) when the update errors instead of silent success', async () => {
    queueResults(['product_sizes', { error: { message: 'permission denied' } }]);

    const result = await updateProductSize('p1', 'M', { stock: 8, minStock: 2 }, 't1');

    expect(result).toBeNull();
    expect(calls).toHaveLength(1);
  });
});

describe('updateProduct size sync', () => {
  it('uses targeted updates and skips delete+reinsert for stock-only edits', async () => {
    queueResults(
      ['products', { error: null }],
      ['product_sizes', {
        data: [
          { size: 'S', stock: 5, min_stock: 1, sku: null },
          { size: 'M', stock: 7, min_stock: 1, sku: null },
        ],
        error: null,
      }],
      ['product_sizes', { error: null }],
      ['product_sizes', { data: { size: 'M', stock: 3, min_stock: 1, sku: null }, error: null }],
      ['products', { data: dbProductRow, error: null }],
    );

    const result = await updateProduct(
      makeProduct({
        sizes: [
          { size: 'S', stock: 5, minStock: 1 },
          { size: 'M', stock: 3, minStock: 1 },
        ],
      }),
      't1'
    );

    expect(result).not.toBeNull();
    expect(result?.stock).toBe(8);

    const sizeCalls = calls.filter(c => c.table === 'product_sizes');
    for (const c of sizeCalls) {
      expect(c.builder.delete).not.toHaveBeenCalled();
      expect(c.builder.insert).not.toHaveBeenCalled();
    }

    // Only the changed row is updated, targeting product_id + size + tenant_id.
    expect(sizeCalls[1].builder.update).toHaveBeenCalledWith({ stock: 3, min_stock: 1 });
    expect(sizeCalls[1].builder.eq).toHaveBeenCalledWith('product_id', 'p1');
    expect(sizeCalls[1].builder.eq).toHaveBeenCalledWith('size', 'M');
    expect(sizeCalls[1].builder.eq).toHaveBeenCalledWith('tenant_id', 't1');

    // The denormalized total is written back as the sum of the per-size stocks.
    expect(calls[0].builder.update).toHaveBeenCalledWith(expect.objectContaining({ stock: 8 }));
  });

  it('keeps delete+reinsert only for actual size-set changes', async () => {
    queueResults(
      ['products', { error: null }],
      ['product_sizes', {
        data: [
          { size: 'S', stock: 5, min_stock: 1, sku: null },
          { size: 'M', stock: 7, min_stock: 1, sku: null },
        ],
        error: null,
      }],
      ['product_sizes', { error: null }],
      ['product_sizes', { error: null }],
      ['products', { data: dbProductRow, error: null }],
    );

    // 'M' removed, 'L' added: the size set changed.
    await updateProduct(
      makeProduct({
        sizes: [
          { size: 'S', stock: 5, minStock: 1 },
          { size: 'L', stock: 4, minStock: 1 },
        ],
      }),
      't1'
    );

    const sizeCalls = calls.filter(c => c.table === 'product_sizes');
    expect(sizeCalls[1].builder.delete).toHaveBeenCalled();
    expect(sizeCalls[2].builder.insert).toHaveBeenCalledWith([
      { product_id: 'p1', tenant_id: 't1', size: 'S', stock: 5, min_stock: 1, sku: null },
      { product_id: 'p1', tenant_id: 't1', size: 'L', stock: 4, min_stock: 1, sku: null },
    ]);
  });

  it('propagates product_sizes errors instead of silently returning success', async () => {
    queueResults(
      ['products', { error: null }],
      ['product_sizes', { data: null, error: { message: 'permission denied' } }],
    );

    const result = await updateProduct(makeProduct(), 't1');

    expect(result).toBeNull();
    // No delete/reinsert is attempted after a failed read.
    expect(calls).toHaveLength(2);
  });
});
