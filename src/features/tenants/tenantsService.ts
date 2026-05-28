import { supabase, isSupabaseConfigured } from '../../supabase/client';
import type { TenantRole } from '../../types';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: string;
  maxEmployees: number;
  maxProducts: number;
  maxSalesMonthly: number;
}

export interface TenantMemberInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TenantRole;
  joinedAt: string;
}

async function createTenantInSupabase(
  name: string,
  slug: string,
  ownerId: string
): Promise<TenantInfo | null> {
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      owner_id: ownerId,
      plan: 'free',
      subscription_status: 'active',
      max_employees: 2,
      max_products: 100,
      max_sales_monthly: 500,
    })
    .select()
    .single();

  if (error || !data) return null;

  const row = data as Record<string, any>;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    maxEmployees: row.max_employees,
    maxProducts: row.max_products,
    maxSalesMonthly: row.max_sales_monthly,
  };
}

async function addTenantMember(
  tenantId: string,
  userId: string,
  role: TenantRole,
  invitedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from('tenant_members')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role,
      invited_by: invitedBy,
    });

  return !error;
}

export async function createTenant(
  name: string,
  slug: string,
  ownerId: string
): Promise<TenantInfo | null> {
  if (!isSupabaseConfigured()) return null;
  return createTenantInSupabase(name, slug, ownerId);
}

export async function inviteTenantMember(
  tenantId: string,
  userId: string,
  role: TenantRole,
  invitedBy: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  return addTenantMember(tenantId, userId, role, invitedBy);
}

export async function getTenantMembers(tenantId: string): Promise<TenantMemberInfo[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('employees')
    .select('id, name, email, role, user_id, created_at, tenant_members!left(role, joined_at)')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: (row.tenant_members?.role || row.role) as TenantRole,
    joinedAt: row.tenant_members?.joined_at || row.created_at,
  }));
}

export async function getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, any>;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    maxEmployees: row.max_employees,
    maxProducts: row.max_products,
    maxSalesMonthly: row.max_sales_monthly,
  };
}
