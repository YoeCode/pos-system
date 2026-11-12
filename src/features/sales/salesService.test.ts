import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSale } from './salesService';
import { calculateCart, getEffectiveUnitPrice } from '../pos/calculation';
import { supabase } from '../../supabase/client';
import type { CartItem, OrderItem, Product, ProductVariant, Sale } from '../../types';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insertedRows: unknown[];
}

function createQueryMock(result: { data: unknown; error: unknown }): QueryMock {
  const insertedRows: unknown[] = [];
  const query: any = {
    select: vi.fn(() => query),
    insert: vi.fn((rows: unknown) => {
      insertedRows.push(rows);
      return query;
    }),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: unknown, onRejected: unknown) =>
      Promise.resolve(result).then(onFulfilled as never, onRejected as never),
  };
  return { ...query, insertedRows };
}

const SALES_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const VARIANT_ID = '22222222-2222-4222-8222-222222222222';

const PRODUCT: Product = {
  id: PRODUCT_ID,
  name: 'T-Shirt',
  sku: 'TS-001',
  category: 'Ropa',
  price: 10,
  costPrice: 4,
  stock: 50,
  minStock: 5,
  status: 'active',
  publishedOnline: false,
  hasVariants: true,
  variantAttributes: ['Color', 'Size'],
};

const VARIANT: ProductVariant = {
  id: VARIANT_ID,
  productId: PRODUCT_ID,
  sku: 'TS-BLU-M',
  price: 25,
  costPrice: null,
  stock: 10,
  minStock: 2,
  image: null,
  attributes: { Color: 'Blue', Size: 'M' },
  status: 'active',
};

function cartItemToOrderItem(item: CartItem): OrderItem {
  return {
    product: item.product,
    quantity: item.quantity,
    lineTotal: getEffectiveUnitPrice(item) * item.quantity,
    selectedSize: item.selectedSize,
    selectedVariant: item.selectedVariant,
  };
}

function buildSale(items: OrderItem[]): Sale {
  return {
    id: SALES_ID,
    order: {
      id: SALES_ID,
      orderNumber: '#1042',
      items,
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
      tax: 0,
      total: items.reduce((sum, i) => sum + i.lineTotal, 0),
      discount: 0,
      createdAt: '2026-11-12T10:00:00.000Z',
    },
    paymentMethod: 'cash',
    amountReceived: 100,
    change: 0,
    completedAt: '2026-11-12T10:00:00.000Z',
    loyaltyPointsEarned: 0,
    loyaltyPointsRedeemed: 0,
    discountApplied: 0,
    refundIds: [],
    refundedAmount: 0,
  };
}

function mockSupabaseTables() {
  const salesQuery = createQueryMock({ data: { id: SALES_ID }, error: null });
  const saleItemsQuery = createQueryMock({ data: null, error: null });
  vi.mocked(supabase.from).mockImplementation(((table: string) =>
    table === 'sales' ? salesQuery : saleItemsQuery) as never);
  return { salesQuery, saleItemsQuery };
}

describe('createSale — effective unit price persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists the variant price as unit_price, not the product base price', async () => {
    const { saleItemsQuery } = mockSupabaseTables();

    const cart: CartItem[] = [{ product: PRODUCT, quantity: 2, lineId: 'l1', selectedVariant: VARIANT }];
    const sale = buildSale(cart.map(cartItemToOrderItem));
    await createSale(sale, 'tenant-1');

    const rows = saleItemsQuery.insertedRows[0] as any[];
    expect(rows[0].unit_price).toBe(25);
  });

  it('round-trips: cart totals and persisted unit_price agree on the variant price', async () => {
    const { saleItemsQuery } = mockSupabaseTables();

    const cart: CartItem[] = [{ product: PRODUCT, quantity: 2, lineId: 'l1', selectedVariant: VARIANT }];
    const calc = calculateCart(cart, { taxRate: 0, taxIncludedInPrice: true, itemDiscounts: {} });

    const sale = buildSale(cart.map(cartItemToOrderItem));
    const saved = await createSale(sale, 'tenant-1');

    const rows = saleItemsQuery.insertedRows[0] as any[];
    expect(calc.grossSubtotal).toBe(50);
    expect(rows[0].unit_price).toBe(25);
    expect(rows[0].line_total).toBe(50);
    expect(saved?.order.items[0].product.price).toBe(25);
  });

  it('persists the product base price when the variant has no custom price', async () => {
    const { saleItemsQuery } = mockSupabaseTables();

    const cart: CartItem[] = [
      { product: PRODUCT, quantity: 1, lineId: 'l1', selectedVariant: { ...VARIANT, price: null } },
      { product: PRODUCT, quantity: 3, lineId: 'l2', selectedSize: 'M' },
    ];
    await createSale(buildSale(cart.map(cartItemToOrderItem)), 'tenant-1');

    const rows = saleItemsQuery.insertedRows[0] as any[];
    expect(rows[0].unit_price).toBe(10);
    expect(rows[1].unit_price).toBe(10);
  });
});
