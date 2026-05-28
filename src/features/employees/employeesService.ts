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
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role,
    shift: row.shift || '',
    pin: row.pin || '',
    active: row.active ?? true,
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
    .eq('active', true)
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
