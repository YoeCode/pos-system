import { supabase } from '../../supabase/client';
import type { Employee } from '../../types';

function mapDbRole(dbRole: string): Employee['role'] {
  switch (dbRole) {
    case 'admin':
      return 'Admin';
    case 'manager':
    case 'supervisor':
      return 'Supervisor';
    case 'cashier':
    default:
      return 'Cashier';
  }
}

function mapRoleToDb(role: Employee['role']): string {
  switch (role) {
    case 'Admin':
      return 'admin';
    case 'Supervisor':
      return 'supervisor';
    case 'Cashier':
    default:
      return 'cashier';
  }
}

function mapDbEmployee(row: any): Employee {
  const role = mapDbRole(row.role);
  return {
    id: row.id,
    userId: row.user_id || undefined,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role,
    tenantRole: row.tenant_role || undefined,
    shift: row.shift || '',
    pin: row.pin || '',
    active: row.active ?? true,
    status: row.status || undefined,
    permissions: {
      processSales: role === 'Cashier' || role === 'Supervisor' || role === 'Admin',
      applyDiscounts: role === 'Supervisor' || role === 'Admin',
      manageInventory: role === 'Supervisor' || role === 'Admin',
      accessReports: role === 'Supervisor' || role === 'Admin',
    },
    startDate: row.created_at ? row.created_at.split('T')[0] : '',
  };
}

export async function fetchEmployees(tenantId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return data.map(mapDbEmployee);
}

export async function createEmployee(employee: Employee, tenantId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .insert({
      id: employee.id,
      tenant_id: tenantId,
      name: employee.name,
      email: employee.email,
      role: mapRoleToDb(employee.role),
      pin: employee.pin || null,
      phone: employee.phone || null,
      shift: employee.shift || null,
      active: employee.active,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapDbEmployee(data);
}

export async function updateEmployee(employee: Employee, tenantId: string): Promise<Employee | null> {
  const { error } = await supabase
    .from('employees')
    .update({
      name: employee.name,
      email: employee.email,
      role: mapRoleToDb(employee.role),
      pin: employee.pin || null,
      phone: employee.phone || null,
      shift: employee.shift || null,
      active: employee.active,
    })
    .eq('id', employee.id)
    .eq('tenant_id', tenantId);

  if (error) return null;

  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employee.id)
    .single();

  return data ? mapDbEmployee(data) : null;
}

export async function deleteEmployee(id: string, tenantId: string): Promise<boolean> {
  const { error } = await supabase
    .from('employees')
    .update({ active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  return !error;
}

export async function fetchEmployeeSales(employeeId: string, tenantId: string): Promise<{ orderNumber: string; total: number; completedAt: string }[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('order_number, total, completed_at')
    .eq('employee_id', employeeId)
    .eq('tenant_id', tenantId)
    .order('completed_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((row: any) => ({
    orderNumber: row.order_number,
    total: row.total,
    completedAt: row.completed_at,
  }));
}

export async function fetchEmployeeSalesStats(employeeId: string, tenantId: string): Promise<{ totalSales: number; totalOrders: number; averageTicket: number }> {
  const { data, error } = await supabase
    .from('sales')
    .select('total')
    .eq('employee_id', employeeId)
    .eq('tenant_id', tenantId);

  if (error || !data) return { totalSales: 0, totalOrders: 0, averageTicket: 0 };
  const totalOrders = data.length;
  const totalSales = data.reduce((sum: number, row: any) => sum + (row.total || 0), 0);
  return {
    totalSales,
    totalOrders,
    averageTicket: totalOrders > 0 ? totalSales / totalOrders : 0,
  };
}
