import { supabase, isSupabaseConfigured } from '../../supabase/client';
import type { Employee } from '../../types';

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ana Martínez',
    email: 'admin@casalis.com',
    phone: '+34 555 0101',
    role: 'Admin',
    shift: 'Morning 06:00-14:00',
    pin: '1234',
    active: true,
    permissions: {
      processSales: true,
      applyDiscounts: true,
      manageInventory: true,
      accessReports: true,
    },
    startDate: '2023-03-15',
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'manager@casalis.com',
    phone: '+34 555 0102',
    role: 'Supervisor',
    shift: 'Evening 14:00-22:00',
    pin: '2345',
    active: true,
    permissions: {
      processSales: true,
      applyDiscounts: true,
      manageInventory: true,
      accessReports: true,
    },
    startDate: '2022-07-01',
  },
  {
    id: '3',
    name: 'María García',
    email: 'supervisor@casalis.com',
    phone: '+34 555 0103',
    role: 'Supervisor',
    shift: 'Morning 06:00-14:00',
    pin: '3456',
    active: true,
    permissions: {
      processSales: true,
      applyDiscounts: true,
      manageInventory: true,
      accessReports: true,
    },
    startDate: '2021-01-10',
  },
  {
    id: '4',
    name: 'Juan Rodríguez',
    email: 'cashier@casalis.com',
    phone: '+34 555 0104',
    role: 'Cashier',
    shift: 'Night 22:00-06:00',
    pin: '4567',
    active: true,
    permissions: {
      processSales: true,
      applyDiscounts: false,
      manageInventory: false,
      accessReports: false,
    },
    startDate: '2023-09-20',
  },
  {
    id: '5',
    name: 'Laura Fernández',
    email: 'cashier2@casalis.com',
    phone: '+34 555 0105',
    role: 'Cashier',
    shift: 'Morning 06:00-14:00',
    pin: '5678',
    active: true,
    permissions: {
      processSales: true,
      applyDiscounts: false,
      manageInventory: false,
      accessReports: false,
    },
    startDate: '2024-01-15',
  },
];

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

async function fetchEmployeesFromSupabase(tenantId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('name');

  if (error || !data) return [];
  return data.map(mapDbEmployee);
}

async function createEmployeeInSupabase(employee: Employee, tenantId: string): Promise<Employee | null> {
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

async function updateEmployeeInSupabase(employee: Employee, tenantId: string): Promise<Employee | null> {
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

async function deleteEmployeeFromSupabase(id: string, tenantId: string): Promise<boolean> {
  const { error } = await supabase
    .from('employees')
    .update({ active: false })
    .eq('id', id)
    .eq('tenant_id', tenantId);

  return !error;
}

export async function fetchEmployees(tenantId: string): Promise<Employee[]> {
  if (isSupabaseConfigured()) {
    return fetchEmployeesFromSupabase(tenantId);
  }
  return [...mockEmployees];
}

export async function createEmployee(employee: Employee, tenantId: string): Promise<Employee | null> {
  if (isSupabaseConfigured()) {
    return createEmployeeInSupabase(employee, tenantId);
  }
  mockEmployees.push(employee);
  return employee;
}

export async function updateEmployee(employee: Employee, tenantId: string): Promise<Employee | null> {
  if (isSupabaseConfigured()) {
    return updateEmployeeInSupabase(employee, tenantId);
  }
  const idx = mockEmployees.findIndex(e => e.id === employee.id);
  if (idx !== -1) {
    mockEmployees[idx] = employee;
    return employee;
  }
  return null;
}

export async function deleteEmployee(id: string, tenantId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return deleteEmployeeFromSupabase(id, tenantId);
  }
  const idx = mockEmployees.findIndex(e => e.id === id);
  if (idx !== -1) {
    mockEmployees.splice(idx, 1);
    return true;
  }
  return false;
}
