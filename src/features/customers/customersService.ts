import { supabase } from '../../supabase/client';
import type { Customer, LoyaltyTier, LoyaltyTierConfig } from '../../types';

function mapDbCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    notes: row.notes || '',
    active: row.active,
    loyaltyPoints: row.loyalty_points,
    tier: row.tier as LoyaltyTier,
    totalSpent: row.total_spent,
    createdAt: row.created_at,
  };
}

export function computeTier(points: number, tiers: LoyaltyTierConfig[]): LoyaltyTier {
  const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold);
  const match = sorted.find(t => points >= t.threshold);
  return match ? match.tier : 'bronze';
}

export async function fetchCustomers(tenantId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return (data as any[]).map(mapDbCustomer);
}

export async function createCustomer(
  customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'tier' | 'totalSpent' | 'createdAt'>,
  tenantId: string,
): Promise<Customer | null> {
  const insertData: Record<string, any> = {
    tenant_id: tenantId,
    name: customer.name,
    email: customer.email || null,
    phone: customer.phone || null,
    notes: customer.notes || null,
    active: customer.active,
    loyalty_points: 0,
    total_spent: 0,
    tier: 'bronze',
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbCustomer(data);
}

export async function updateCustomer(
  customer: Partial<Customer> & { id: string },
  tenantId: string,
): Promise<Customer | null> {
  const updateData: Record<string, any> = {};
  if (customer.name !== undefined) updateData.name = customer.name;
  if (customer.email !== undefined) updateData.email = customer.email || null;
  if (customer.phone !== undefined) updateData.phone = customer.phone || null;
  if (customer.notes !== undefined) updateData.notes = customer.notes || null;
  if (customer.active !== undefined) updateData.active = customer.active;

  const { data, error } = await supabase
    .from('customers')
    .update(updateData as any)
    .eq('id', customer.id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbCustomer(data);
}

export async function deactivateCustomer(id: string, tenantId: string): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update({ active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  return !error;
}

export async function updateLoyaltyPoints(
  customerId: string,
  points: number,
  amountSpent: number,
  tier: LoyaltyTier,
  tenantId: string,
): Promise<Customer | null> {
  const { data: current } = await supabase
    .from('customers')
    .select('loyalty_points, total_spent')
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .single();

  if (!current) return null;

  const newPoints = Math.max(0, (current as any).loyalty_points + points);
  const newSpent = Math.max(0, (current as any).total_spent + amountSpent);

  const { data, error } = await supabase
    .from('customers')
    .update({
      loyalty_points: newPoints,
      total_spent: newSpent,
      tier,
    })
    .eq('id', customerId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error || !data) return null;
  return mapDbCustomer(data);
}
