import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OrderItem, Product, Sale } from '../../types';
import { isManualProductId } from '../../utils/manualProduct';
import { createSale, mapDbSale } from './salesService';

const { insertCalls } = vi.hoisted(() => ({
  insertCalls: [] as { table: string; rows: Record<string, any>[] }[],
}));

vi.mock('../../supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
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
    }),
  },
}));

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

describe('salesService — manual product lines', () => {
  beforeEach(() => {
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
