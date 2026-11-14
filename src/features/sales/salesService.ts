import { supabase } from '../../supabase/client';
import { getEffectiveUnitPrice } from '../pos/calculation';
import type { Sale, OrderItem, PaymentMethod, ProductVariant } from '../../types';
import { isManualProductId, MANUAL_PRODUCT_ID_PREFIX } from '../../utils/manualProduct';

function isValidUuid(id: string | undefined | null): id is string {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function mapDbSale(row: any): Sale {
  const items: OrderItem[] = (row.sale_items || []).map((si: any, index: number) => {
    // Synthesize the sold variant from the line snapshot. Only the
    // snapshotted fields are real (id, sku, attributes); the snapshot
    // stores the effective unit price on the line (product.price below),
    // not the variant's own price override, so price stays null.
    const selectedVariant: ProductVariant | undefined = si.variant_id
      ? {
          id: si.variant_id,
          productId: si.product_id,
          sku: si.variant_sku || '',
          price: null,
          costPrice: null,
          stock: 0,
          minStock: 0,
          image: null,
          attributes: si.variant_attributes || {},
          status: 'active',
        }
      : undefined;

    return {
      product: {
        // Manual lines persist product_id NULL: synthesize a line-unique,
        // renderable id that stays recognizable as a manual product.
        id: si.product_id ?? `${MANUAL_PRODUCT_ID_PREFIX}${si.id ?? index}`,
        name: si.product_name,
        sku: si.product_sku || '',
        category: si.product_category || '',
        subcategory: si.product_subcategory || undefined,
        price: si.unit_price,
        costPrice: 0,
        stock: 0,
        minStock: 0,
        status: 'active',
        publishedOnline: false,
      },
      quantity: si.quantity,
      lineTotal: si.line_total,
      selectedSize: si.selected_size || undefined,
      selectedVariant,
    };
  });

  return {
    id: row.id,
    order: {
      id: row.id,
      orderNumber: row.order_number,
      items,
      subtotal: row.subtotal,
      tax: row.tax,
      total: row.total,
      discount: row.discount,
      createdAt: row.completed_at,
    },
    paymentMethod: row.payment_method as PaymentMethod,
    amountReceived: row.amount_received,
    change: row.change,
    completedAt: row.completed_at,
    employeeId: row.employee_id || undefined,
    terminalId: row.terminal_id || undefined,
    customerId: row.customer_id || undefined,
    loyaltyPointsEarned: row.loyalty_points_earned,
    loyaltyPointsRedeemed: row.loyalty_points_redeemed,
    discountApplied: row.discount,
    refundIds: [],
    refundedAmount: row.refunded_amount,
  };
}

export async function fetchSales(tenantId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('tenant_id', tenantId)
    .order('completed_at', { ascending: false });

  if (error || !data) return [];
  return (data as any[]).map(mapDbSale);
}

// Issue #56 — idempotent sale recording. A checkout attempt carries a stable
// client-generated sale id across retries; when the same attempt submits
// again after a partial failure, the insert hits the sales primary key and
// Postgres answers 23505. That is not an error: the sale is already recorded.
async function fetchSaleById(saleId: string, tenantId: string): Promise<Sale | null> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', saleId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return mapDbSale(data);
}

export async function createSale(sale: Sale, tenantId: string): Promise<Sale | null> {
  const saleId = isValidUuid(sale.id) ? sale.id : crypto.randomUUID();

  const insertData: Record<string, any> = {
    id: saleId,
    tenant_id: tenantId,
    order_number: sale.order.orderNumber,
    customer_id: isValidUuid(sale.customerId) ? sale.customerId : null,
    employee_id: isValidUuid(sale.employeeId) ? sale.employeeId : null,
    terminal_id: sale.terminalId || null,
    subtotal: sale.order.subtotal,
    tax: sale.order.tax,
    total: sale.order.total,
    discount: sale.discountApplied,
    loyalty_points_earned: sale.loyaltyPointsEarned,
    loyalty_points_redeemed: sale.loyaltyPointsRedeemed,
    refunded_amount: sale.refundedAmount,
    payment_method: sale.paymentMethod,
    amount_received: sale.amountReceived,
    change: sale.change,
    completed_at: sale.completedAt,
  };

  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert(insertData)
    .select()
    .single();

  if (saleError) {
    // 23505 = unique violation on the explicit sale id: this attempt was
    // already recorded by a previous submit. Return the recorded sale instead
    // of inserting a second row; never swallow unrelated DB errors.
    if ((saleError as { code?: string }).code === '23505') {
      const existing = await fetchSaleById(saleId, tenantId);
      return existing ?? sale;
    }
    throw saleError;
  }

  if (!saleData) return null;

  // Keep every line, including manual (non-catalog) products. Manual lines
  // persist with product_id NULL — their synthetic id must never reach the
  // FK column — while snapshot columns keep them renderable on tickets.
  // unit_price is the effective price (variant override when present).
  const saleItems = sale.order.items.map(item => ({
    id: crypto.randomUUID(),
    sale_id: (saleData as any).id,
    tenant_id: tenantId,
    product_id: isManualProductId(item.product.id) ? null : item.product.id,
    product_name: item.product.name,
    product_sku: item.product.sku,
    product_category: item.product.category,
    product_subcategory: item.product.subcategory ?? null,
    quantity: item.quantity,
    unit_price: getEffectiveUnitPrice(item),
    line_total: item.lineTotal,
    selected_size: item.selectedSize || null,
    variant_id: item.selectedVariant?.id || null,
    variant_sku: item.selectedVariant?.sku || null,
    variant_attributes: item.selectedVariant?.attributes || null,
  }));

  if (saleItems.length > 0) {
    await supabase.from('sale_items').insert(saleItems as any);
  }

  return mapDbSale({ ...saleData, sale_items: saleItems });
}

export async function getNextOrderNumber(tenantId: string): Promise<number> {
  const { data, error } = await supabase
    .from('sales')
    .select('order_number')
    .eq('tenant_id', tenantId)
    .order('order_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return 1042;

  const num = parseInt((data as any).order_number.replace(/^\D*/, ''), 10);
  return isNaN(num) ? 1042 : num + 1;
}
