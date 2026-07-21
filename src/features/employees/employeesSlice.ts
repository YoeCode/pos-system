import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Employee } from '../../types';
import type { RootState } from '../../app/store';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from './employeesService';

interface EmployeesState {
  employees: Employee[];
  isModalOpen: boolean;
  editingEmployee: Employee | null;
  detailEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  roleFilter: Employee['role'] | 'all';
  statusFilter: 'all' | 'active' | 'inactive';
}

const initialState: EmployeesState = {
  employees: [],
  isModalOpen: false,
  editingEmployee: null,
  detailEmployee: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  roleFilter: 'all',
  statusFilter: 'all',
};

export const fetchEmployeesAsync = createAsyncThunk(
  'employees/fetchEmployeesAsync',
  async (_, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId;
    if (!tenantId) return [];
    return fetchEmployees(tenantId);
  }
);

export const addEmployeeAsync = createAsyncThunk(
  'employees/addEmployeeAsync',
  async (employee: Employee, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await createEmployee(employee, tenantId);
    if (!result) throw new Error('Failed to create employee');
    return result;
  }
);

export const updateEmployeeAsync = createAsyncThunk(
  'employees/updateEmployeeAsync',
  async (employee: Employee, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await updateEmployee(employee, tenantId);
    if (!result) throw new Error('Failed to update employee');
    return result;
  }
);

export const deleteEmployeeAsync = createAsyncThunk(
  'employees/deleteEmployeeAsync',
  async (id: string, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const success = await deleteEmployee(id, tenantId);
    if (!success) throw new Error('Failed to delete employee');
    return id;
  }
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    toggleModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
    setEditingEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.editingEmployee = action.payload;
    },
    setDetailEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.detailEmployee = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<Employee['role'] | 'all'>) => {
      state.roleFilter = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | 'active' | 'inactive'>) => {
      state.statusFilter = action.payload;
    },
    clearFilters: (state) => {
      state.searchQuery = '';
      state.roleFilter = 'all';
      state.statusFilter = 'all';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesAsync.fulfilled, (state, action: PayloadAction<Employee[]>) => {
        state.isLoading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch employees';
      })
      .addCase(addEmployeeAsync.fulfilled, (state, action: PayloadAction<Employee>) => {
        state.employees.push(action.payload);
      })
      .addCase(updateEmployeeAsync.fulfilled, (state, action: PayloadAction<Employee>) => {
        const idx = state.employees.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.employees[idx] = action.payload;
      })
      .addCase(deleteEmployeeAsync.fulfilled, (state, action: PayloadAction<string>) => {
        const idx = state.employees.findIndex(e => e.id === action.payload);
        if (idx !== -1) {
          state.employees[idx].active = false;
        }
      });
  },
});

export const { toggleModal, setEditingEmployee, setDetailEmployee, setSearchQuery, setRoleFilter, setStatusFilter, clearFilters } = employeesSlice.actions;

export const selectFilteredEmployees = (state: RootState): Employee[] => {
  const { employees, searchQuery, roleFilter, statusFilter } = state.employees;
  const query = searchQuery.toLowerCase().trim();

  return employees.filter((e: Employee) => {
    const matchesSearch = !query || e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? e.active : !e.active);
    return matchesSearch && matchesRole && matchesStatus;
  });
};

export const selectActiveEmployees = (state: RootState): Employee[] =>
  state.employees.employees.filter((e: Employee) => e.active);

export const selectEmployees = (state: RootState): Employee[] =>
  state.employees.employees;

export default employeesSlice.reducer;
