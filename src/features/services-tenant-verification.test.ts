import { describe, it, expect, vi } from 'vitest';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from './products/productsService';
import { fetchSales, createSale, getNextOrderNumber } from './sales/salesService';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from './employees/employeesService';

vi.mock('../supabase/client', () => ({
  supabase: {},
  isSupabaseConfigured: () => false,
}));

describe('services mock fallback - multi-tenant', () => {
  it('fetchProducts returns mock data with tenantId', async () => {
    const result = await fetchProducts('any-tenant');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('createProduct returns product with tenantId', async () => {
    const product = { id: 'test-1', name: 'Test', sku: 'T1', category: 'Food', price: 10, costPrice: 5, stock: 10, minStock: 1, status: 'active', publishedOnline: false };
    const result = await createProduct(product as any, 'any-tenant');
    expect(result).toBeDefined();
    expect(result?.id).toBe('test-1');
  });

  it('updateProduct returns updated product with tenantId', async () => {
    const product = { id: 'test-1', name: 'Test Updated', sku: 'T1', category: 'Food', price: 15, costPrice: 5, stock: 10, minStock: 1, status: 'active', publishedOnline: false };
    const result = await updateProduct(product as any, 'any-tenant');
    expect(result).toBeDefined();
    expect(result?.name).toBe('Test Updated');
  });

  it('deleteProduct returns true with tenantId', async () => {
    const result = await deleteProduct('test-1', 'any-tenant');
    expect(result).toBe(true);
  });

  it('fetchSales returns mock data with tenantId', async () => {
    const result = await fetchSales('any-tenant');
    expect(Array.isArray(result)).toBe(true);
  });

  it('createSale returns sale with tenantId', async () => {
    const sale = { id: 'sale-1', order: { id: 'o1', orderNumber: 'ORD-1', items: [], subtotal: 10, tax: 2.1, total: 12.1, discount: 0, createdAt: new Date().toISOString() }, paymentMethod: 'cash', amountReceived: 12.1, change: 0, completedAt: new Date().toISOString() } as any;
    const result = await createSale(sale, 'any-tenant');
    expect(result).toBeDefined();
  });

  it('getNextOrderNumber returns number with tenantId', async () => {
    const result = await getNextOrderNumber('any-tenant');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('fetchEmployees returns mock data with tenantId', async () => {
    const result = await fetchEmployees('any-tenant');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('createEmployee returns employee with tenantId', async () => {
    const employee = { id: 'emp-1', name: 'Test', email: 'test@test.com', phone: '', role: 'Cashier', shift: '', pin: '1234', active: true, permissions: { processSales: true }, startDate: '2024-01-01' } as any;
    const result = await createEmployee(employee, 'any-tenant');
    expect(result).toBeDefined();
  });

  it('updateEmployee returns employee with tenantId', async () => {
    const employee = { id: 'emp-1', name: 'Updated', email: 'test@test.com', phone: '', role: 'Cashier', shift: '', pin: '1234', active: true, permissions: { processSales: true }, startDate: '2024-01-01' } as any;
    const result = await updateEmployee(employee, 'any-tenant');
    expect(result).toBeDefined();
    expect(result?.name).toBe('Updated');
  });

  it('deleteEmployee returns true with tenantId', async () => {
    const result = await deleteEmployee('emp-1', 'any-tenant');
    expect(result).toBe(true);
  });
});
