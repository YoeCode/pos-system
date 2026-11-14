import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCart, getEffectiveUnitPrice } from '../pos/calculation';
import { supabase } from '../../supabase/client';
import type { CartItem, OrderItem, Product, ProductVariant, Sale } from '../../types';
import { isManualProductId } from '../../utils/manualProduct';
import { createSale, fetchSales, mapDbSale } from './salesService';

// Unified supabase mock: the default `from` behavior records insert calls
// (manual-product suite), while the variant suites override `from` per test
// with mockImplementation. Both shapes must keep working.
const { insertCalls, defaultFrom } = vi.hoisted(() => {
  const insertCalls: { table: string; rows: Record<string, any>[] }[] = [];
  const defaultFrom = (table: string) => ({
    insert: (rows: Record<string, any> | Record<string, any>[]) => {
      const normalized = Array.isArray(rows) ? rows : [rows];
      insertCalls.push({ table, rows: normalized });
      if (table === 'sales') {
        return {
          select: () => ({
            single: async () => ({ data: normalized[0], error: null }),
          }),
        };
      }
      return Promise.resolve({ error: null });
    },
  });
  return { insertCalls, defaultFrom };
});

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn(defaultFrom) },
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

const CATALOG_ID = '11111111-2222-4333-8444-555555555555';
const SALE_ID = '99999999-8888-4777-8666-555555555555';

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: CATALOG_ID,
    name: 'Catalog Product',
    sku: 'CAT-001',
    category: 'Food',
    price: 10,
    costPrice: 5,
    stock: 100,
    minStock: 5,
    status: 'active',
    publishedOnline: false,
    hasVariants: false,
    variantAttributes: [],
    ...overrides,
  };
}

function makeSale(items: OrderItem[]): Sale {
  return {
    id: SALE_ID,
    order: {
      id: SALE_ID,
      orderNumber: '#1042',
      items,
      subtotal: 35,
      tax: 7.35,
      total: 42.35,
      discount: 0,
      createdAt: '2026-11-09T10:00:00.000Z',
    },
    paymentMethod: 'cash',
    amountReceived: 50,
    change: 7.65,
    completedAt: '2026-11-09T10:00:00.000Z',
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

describe('createSale — variant snapshots on sale lines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes variant_sku and variant_attributes alongside variant_id', async () => {
    const { saleItemsQuery } = mockSupabaseTables();

    const cart: CartItem[] = [{ product: PRODUCT, quantity: 1, lineId: 'l1', selectedVariant: VARIANT }];
    await createSale(buildSale(cart.map(cartItemToOrderItem)), 'tenant-1');

    const rows = saleItemsQuery.insertedRows[0] as any[];
    expect(rows[0].variant_id).toBe(VARIANT_ID);
    expect(rows[0].variant_sku).toBe('TS-BLU-M');
    expect(rows[0].variant_attributes).toEqual({ Color: 'Blue', Size: 'M' });
  });

  it('writes selected_size as-is and leaves snapshot columns null for plain lines', async () => {
    const { saleItemsQuery } = mockSupabaseTables();

    const cart: CartItem[] = [
      { product: PRODUCT, quantity: 1, lineId: 'l1', selectedSize: 'M' },
      { product: PRODUCT, quantity: 1, lineId: 'l2' },
    ];
    await createSale(buildSale(cart.map(cartItemToOrderItem)), 'tenant-1');

    const rows = saleItemsQuery.insertedRows[0] as any[];
    expect(rows[0].selected_size).toBe('M');
    expect(rows[0].variant_id).toBeNull();
    expect(rows[0].variant_sku).toBeNull();
    expect(rows[0].variant_attributes).toBeNull();
    expect(rows[1].selected_size).toBeNull();
    expect(rows[1].variant_id).toBeNull();
  });
});

describe('mapDbSale — history read-back of the sold dimension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockFetchSalesRows(rows: unknown[]) {
    const salesQuery = createQueryMock({ data: rows, error: null });
    vi.mocked(supabase.from).mockImplementation((() => salesQuery) as never);
    return salesQuery;
  }

  const dbRow = {
    id: SALES_ID,
    order_number: '#1042',
    subtotal: 60,
    tax: 0,
    total: 60,
    discount: 0,
    completed_at: '2026-11-12T10:00:00.000Z',
    payment_method: 'cash',
    amount_received: 100,
    change: 40,
    employee_id: null,
    terminal_id: null,
    customer_id: null,
    loyalty_points_earned: 0,
    loyalty_points_redeemed: 0,
    refunded_amount: 0,
    sale_items: [
      {
        product_id: PRODUCT_ID,
        product_name: 'T-Shirt',
        product_sku: 'TS-001',
        product_category: 'Ropa',
        product_subcategory: null,
        quantity: 2,
        unit_price: 25,
        line_total: 50,
        selected_size: null,
        variant_id: VARIANT_ID,
        variant_sku: 'TS-BLU-M',
        variant_attributes: { Color: 'Blue', Size: 'M' },
      },
      {
        product_id: PRODUCT_ID,
        product_name: 'T-Shirt',
        product_sku: 'TS-001',
        product_category: 'Ropa',
        product_subcategory: null,
        quantity: 1,
        unit_price: 10,
        line_total: 10,
        selected_size: 'M',
        variant_id: null,
        variant_sku: null,
        variant_attributes: null,
      },
    ],
  };

  it('restores selectedVariant from the variant snapshot', async () => {
    mockFetchSalesRows([dbRow]);

    const sales = await fetchSales('tenant-1');
    const variantLine = sales[0].order.items[0];

    expect(variantLine.selectedVariant).toEqual({
      id: VARIANT_ID,
      productId: PRODUCT_ID,
      sku: 'TS-BLU-M',
      price: null,
      costPrice: null,
      stock: 0,
      minStock: 0,
      image: null,
      attributes: { Color: 'Blue', Size: 'M' },
      status: 'active',
    });
    expect(variantLine.selectedSize).toBeUndefined();
  });

  it('restores selectedSize from the line snapshot', async () => {
    mockFetchSalesRows([dbRow]);

    const sales = await fetchSales('tenant-1');
    const sizeLine = sales[0].order.items[1];

    expect(sizeLine.selectedSize).toBe('M');
    expect(sizeLine.selectedVariant).toBeUndefined();
  });

  it('keeps the sold unit price on the line product', async () => {
    mockFetchSalesRows([dbRow]);

    const sales = await fetchSales('tenant-1');

    expect(sales[0].order.items[0].product.price).toBe(25);
    expect(sales[0].order.items[1].product.price).toBe(10);
  });

  it('returns a synthesized variant from createSale round-trip', async () => {
    const { saleItemsQuery } = mockSupabaseTables();
    void saleItemsQuery;

    const cart: CartItem[] = [{ product: PRODUCT, quantity: 1, lineId: 'l1', selectedVariant: VARIANT }];
    const saved = await createSale(buildSale(cart.map(cartItemToOrderItem)), 'tenant-1');

    expect(saved?.order.items[0].selectedVariant?.id).toBe(VARIANT_ID);
    expect(saved?.order.items[0].selectedVariant?.sku).toBe('TS-BLU-M');
    expect(saved?.order.items[0].selectedVariant?.attributes).toEqual({ Color: 'Blue', Size: 'M' });
  });
});

describe('salesService — manual product lines', () => {
  beforeEach(() => {
    // Variant suites override `supabase.from` via mockImplementation; restore
    // the recording default before each manual-product test.
    vi.mocked(supabase.from).mockImplementation(defaultFrom as never);
    insertCalls.length = 0;
  });

  it('persists a manual line with product_id null and keeps it in the returned sale', async () => {
    const sale = makeSale([
      { product: makeProduct({}), quantity: 2, lineTotal: 20 },
      {
        product: makeProduct({
          id: 'custom-1700000000000-abc123',
          name: 'Manual Thing',
          sku: 'CUSTOM-ABC123',
          category: 'Other',
          price: 15,
        }),
        quantity: 1,
        lineTotal: 15,
      },
    ]);

    const result = await createSale(sale, 'tenant-1');

    expect(result).not.toBeNull();

    // Rows prepared for the sale_items insert keep the manual line.
    const itemsCall = insertCalls.find(c => c.table === 'sale_items');
    expect(itemsCall).toBeDefined();
    expect(itemsCall!.rows).toHaveLength(2);

    const manualRow = itemsCall!.rows.find(r => r.product_name === 'Manual Thing')!;
    expect(manualRow).toBeDefined();
    expect(manualRow.product_id).toBeNull();
    expect(manualRow.product_sku).toBe('CUSTOM-ABC123');
    expect(manualRow.product_category).toBe('Other');
    expect(manualRow.quantity).toBe(1);
    expect(manualRow.unit_price).toBe(15);
    expect(manualRow.line_total).toBe(15);

    const catalogRow = itemsCall!.rows.find(r => r.product_name === 'Catalog Product')!;
    expect(catalogRow.product_id).toBe(CATALOG_ID);

    // The returned sale feeds the ticket (UI, PDF, print, email) with all lines.
    expect(result!.order.items).toHaveLength(2);
    const manualItem = result!.order.items.find(i => i.product.name === 'Manual Thing')!;
    expect(manualItem).toBeDefined();
    expect(manualItem.quantity).toBe(1);
    expect(manualItem.lineTotal).toBe(15);
    expect(manualItem.product.price).toBe(15);
    expect(isManualProductId(manualItem.product.id)).toBe(true);
    expect(result!.order.items.find(i => i.product.name === 'Catalog Product')!.product.id).toBe(CATALOG_ID);
  });

  it('assigns distinct product ids to each manual line of the returned sale', async () => {
    const sale = makeSale([
      { product: makeProduct({ id: 'custom-1-aaaaaa', name: 'Manual A', price: 5 }), quantity: 1, lineTotal: 5 },
      { product: makeProduct({ id: 'custom-2-bbbbbb', name: 'Manual B', price: 7 }), quantity: 1, lineTotal: 7 },
    ]);

    const result = await createSale(sale, 'tenant-1');

    const ids = result!.order.items.map(i => i.product.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('maps persisted manual rows (product_id null) to renderable items', () => {
    const sale = mapDbSale({
      id: SALE_ID,
      order_number: '#1043',
      subtotal: 17,
      tax: 3.57,
      total: 20.57,
      discount: 0,
      payment_method: 'cash',
      amount_received: 20,
      change: 0,
      completed_at: '2026-11-09T11:00:00.000Z',
      loyalty_points_earned: 0,
      loyalty_points_redeemed: 0,
      refunded_amount: 0,
      sale_items: [
        {
          id: 'row-a',
          product_id: null,
          product_name: 'Manual A',
          product_sku: 'CUSTOM-A',
          product_category: 'Other',
          product_subcategory: null,
          quantity: 2,
          unit_price: 5,
          line_total: 10,
        },
        {
          id: 'row-b',
          product_id: CATALOG_ID,
          product_name: 'Catalog Product',
          product_sku: 'CAT-001',
          product_category: 'Food',
          product_subcategory: null,
          quantity: 1,
          unit_price: 7,
          line_total: 7,
        },
      ],
    });

    expect(sale.order.items).toHaveLength(2);

    const manual = sale.order.items[0];
    expect(typeof manual.product.id).toBe('string');
    expect(manual.product.id).toBeTruthy();
    expect(isManualProductId(manual.product.id)).toBe(true);
    expect(manual.product.name).toBe('Manual A');
    expect(manual.product.sku).toBe('CUSTOM-A');
    expect(manual.quantity).toBe(2);
    expect(manual.lineTotal).toBe(10);

    expect(sale.order.items[1].product.id).toBe(CATALOG_ID);
    expect(sale.order.items[1].product.name).toBe('Catalog Product');
  });
});

describe('createSale — idempotent recording (issue #56)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Row as the previous (already recorded) submit persisted it: its lines
  // differ from the in-memory attempt so the test can prove the fetch path.
  const dbSaleRow = {
    id: SALES_ID,
    order_number: '#1042',
    subtotal: 20,
    tax: 0,
    total: 20,
    discount: 0,
    completed_at: '2026-11-09T10:00:00.000Z',
    payment_method: 'cash',
    amount_received: 50,
    change: 30,
    employee_id: null,
    terminal_id: null,
    customer_id: null,
    loyalty_points_earned: 0,
    loyalty_points_redeemed: 0,
    refunded_amount: 0,
    sale_items: [
      {
        product_id: CATALOG_ID,
        product_name: 'Catalog Product',
        product_sku: 'CAT-001',
        product_category: 'Food',
        product_subcategory: null,
        quantity: 2,
        unit_price: 10,
        line_total: 20,
        selected_size: null,
        variant_id: null,
        variant_sku: null,
        variant_attributes: null,
      },
    ],
  };

  // Insert is attempted exactly once and answered with `insertError`; the
  // select path serves the already-recorded row (or nothing).
  function mockIdempotentFrom(
    insertError: { code: string; message: string } | null,
    existingRow: unknown | null = dbSaleRow,
  ) {
    const salesInserts: unknown[] = [];
    const saleItemInserts: unknown[] = [];
    const from = (table: string) => ({
      insert: (rows: unknown) => {
        (table === 'sales' ? salesInserts : saleItemInserts).push(rows);
        return {
          select: () => ({
            single: async () => ({ data: insertError ? null : { id: SALES_ID }, error: insertError }),
          }),
        };
      },
      select: () => {
        const query: Record<string, unknown> = {
          eq: () => query,
          maybeSingle: async () => ({ data: existingRow, error: null }),
          single: async () => ({ data: existingRow, error: null }),
        };
        return query;
      },
    });
    vi.mocked(supabase.from).mockImplementation(from as never);
    return { salesInserts, saleItemInserts };
  }

  it('returns the already-recorded sale on a unique violation without inserting a second row', async () => {
    const { salesInserts, saleItemInserts } = mockIdempotentFrom({
      code: '23505',
      message: 'duplicate key value violates unique constraint "sales_pkey"',
    });

    // The in-memory attempt carries different lines than the recorded row.
    const attempt = buildSale([{ product: PRODUCT, quantity: 1, lineTotal: 10 }]);
    const result = await createSale(attempt, 'tenant-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe(SALES_ID);
    expect(result!.order.orderNumber).toBe('#1042');
    // Fetched from the recorded row, not fabricated from the retry attempt.
    expect(result!.order.items).toHaveLength(1);
    expect(result!.order.items[0].product.name).toBe('Catalog Product');

    // The rejected attempt is the ONLY insert: no second sales row and no
    // duplicated sale_items.
    expect(salesInserts).toHaveLength(1);
    expect(saleItemInserts).toHaveLength(0);
  });

  it('returns the in-memory sale when the recorded row cannot be fetched', async () => {
    mockIdempotentFrom(
      { code: '23505', message: 'duplicate key value violates unique constraint "sales_pkey"' },
      null,
    );

    const attempt = buildSale([{ product: PRODUCT, quantity: 1, lineTotal: 10 }]);
    const result = await createSale(attempt, 'tenant-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe(SALES_ID);
    expect(result!.order.items[0].product.name).toBe('T-Shirt');
  });

  it('propagates non-unique-violation insert errors instead of swallowing them', async () => {
    mockIdempotentFrom({ code: '500', message: 'internal error' });

    const attempt = buildSale([{ product: PRODUCT, quantity: 1, lineTotal: 10 }]);
    await expect(createSale(attempt, 'tenant-1')).rejects.toMatchObject({ code: '500' });
  });
});
