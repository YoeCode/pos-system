import { describe, it, expect } from 'vitest';
import employeesReducer, {
  setSearchQuery,
  setRoleFilter,
  setStatusFilter,
  clearFilters,
  setDetailEmployee,
  selectFilteredEmployees,
  deleteEmployeeAsync,
} from './employeesSlice';
import type { Employee, RootState } from '../../types';

const mockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0000',
  role: 'Cashier',
  shift: 'Morning 06:00-14:00',
  pin: '1234',
  active: true,
  permissions: {
    processSales: true,
    applyDiscounts: false,
    manageInventory: false,
    accessReports: false,
  },
  startDate: '2024-01-01',
  ...overrides,
});

const createState = (employees: Employee[], filters: Partial<RootState['employees']> = {}): RootState =>
  ({
    employees: {
      employees,
      isModalOpen: false,
      editingEmployee: null,
      detailEmployee: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      roleFilter: 'all',
      statusFilter: 'all',
      ...filters,
    },
  } as RootState);

describe('employeesSlice', () => {
  describe('selectFilteredEmployees', () => {
    const employees = [
      mockEmployee({ id: '1', name: 'Alice', role: 'Admin', active: true }),
      mockEmployee({ id: '2', name: 'Bob', role: 'Cashier', active: false }),
      mockEmployee({ id: '3', name: 'Charlie', role: 'Supervisor', active: true }),
    ];

    it('returns all employees when no filters', () => {
      const state = createState(employees);
      expect(selectFilteredEmployees(state)).toHaveLength(3);
    });

    it('filters by search query (name)', () => {
      const state = createState(employees, { searchQuery: 'Ali' });
      const result = selectFilteredEmployees(state);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('filters by search query (email)', () => {
      const state = createState(employees, { searchQuery: 'john' });
      const result = selectFilteredEmployees(state);
      expect(result).toHaveLength(3);
    });

    it('filters by role', () => {
      const state = createState(employees, { roleFilter: 'Admin' });
      const result = selectFilteredEmployees(state);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('Admin');
    });

    it('filters by status active', () => {
      const state = createState(employees, { statusFilter: 'active' });
      const result = selectFilteredEmployees(state);
      expect(result).toHaveLength(2);
      expect(result.every(e => e.active)).toBe(true);
    });

    it('filters by status inactive', () => {
      const state = createState(employees, { statusFilter: 'inactive' });
      const result = selectFilteredEmployees(state);
      expect(result).toHaveLength(1);
      expect(result[0].active).toBe(false);
    });

    it('combines multiple filters', () => {
      const state = createState(employees, { searchQuery: 'a', roleFilter: 'Admin', statusFilter: 'active' });
      const result = selectFilteredEmployees(state);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('reducers', () => {
    it('setSearchQuery updates searchQuery', () => {
      const state = employeesReducer(undefined, setSearchQuery('test'));
      expect(state.searchQuery).toBe('test');
    });

    it('setRoleFilter updates roleFilter', () => {
      const state = employeesReducer(undefined, setRoleFilter('Admin'));
      expect(state.roleFilter).toBe('Admin');
    });

    it('setStatusFilter updates statusFilter', () => {
      const state = employeesReducer(undefined, setStatusFilter('inactive'));
      expect(state.statusFilter).toBe('inactive');
    });

    it('clearFilters resets all filters', () => {
      let state = employeesReducer(undefined, setSearchQuery('test'));
      state = employeesReducer(state, setRoleFilter('Admin'));
      state = employeesReducer(state, setStatusFilter('inactive'));
      state = employeesReducer(state, clearFilters());
      expect(state.searchQuery).toBe('');
      expect(state.roleFilter).toBe('all');
      expect(state.statusFilter).toBe('all');
    });

    it('setDetailEmployee sets detail employee', () => {
      const emp = mockEmployee();
      const state = employeesReducer(undefined, setDetailEmployee(emp));
      expect(state.detailEmployee).toEqual(emp);
    });
  });

  describe('deleteEmployeeAsync.fulfilled', () => {
    it('marks employee as inactive', () => {
      const initial = employeesReducer(undefined, { type: '@@INIT' });
      const state = {
        ...initial,
        employees: [mockEmployee({ id: '1', active: true })],
      };
      const next = employeesReducer(state, deleteEmployeeAsync.fulfilled('1', '', '1'));
      expect(next.employees[0].active).toBe(false);
    });
  });
});