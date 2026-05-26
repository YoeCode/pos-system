import { supabase, isSupabaseConfigured } from '../../supabase/client';
import type { Sale, OrderItem, PaymentMethod } from '../../types';

const mockSales: Sale[] = [];

let localNextOrderNumber = 1042;

function isValidUuid(id: string | undefined | null): id is string {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function mapDbSale(row: any): Sale {
  const items: OrderItem[] = (row.sale_items || []).map((si: any) => ({
    product: {
      id: si.product_id,
      name: si.product_name,
      sku: si.product_sku || '',
      category: si.product_category || '',
      price: si.unit_price,
      costPrice: 0,
      stock: 0,
      minStock: 0,
      status: 'active',
      publishedOnline: false,
    },
    quantity: si.quantity,
    lineTotal: si.line_total,
  }));

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

async function fetchSalesFromSupabase(tenantId: string): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('tenant_id', tenantId)
    .order('completed_at', { ascending: false });

  if (error || !data) return [];
  return (data as any[]).map(mapDbSale);
}

async function createSaleInSupabase(sale: Sale, tenantId: string): Promise<Sale | null> {
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

  if (saleError || !saleData) return null;

  const saleItems = sale.order.items
    .filter(item => isValidUuid(item.product.id))
    .map(item => ({
      sale_id: (saleData as any).id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_sku: item.product.sku,
      product_category: item.product.category,
      quantity: item.quantity,
      unit_price: item.product.price,
      line_total: item.lineTotal,
      selected_size: null,
    }));

  if (saleItems.length > 0) {
    await supabase.from('sale_items').insert(saleItems);
  }

  return mapDbSale({ ...saleData, sale_items: saleItems });
}

async function getNextOrderNumberFromSupabase(tenantId: string): Promise<number> {
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

export async function fetchSales(tenantId: string): Promise<Sale[]> {
  if (isSupabaseConfigured()) {
    return fetchSalesFromSupabase(tenantId);
  }
  return [...mockSales];
}

export async function createSale(sale: Sale, tenantId: string): Promise<Sale | null> {
  if (isSupabaseConfigured()) {
    return createSaleInSupabase(sale, tenantId);
  }
  mockSales.push(sale);
  return sale;
}

export async function getNextOrderNumber(tenantId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    return getNextOrderNumberFromSupabase(tenantId);
  }
  localNextOrderNumber += 1;
  return localNextOrderNumber;
}
