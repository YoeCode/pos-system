import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Employee } from '../../types';
import type { RootState } from '../../app/store';
import { fetchEmployees, createEmployee, updateEmployee } from './employeesService';

interface EmployeesState {
  employees: Employee[];
  isModalOpen: boolean;
  editingEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  employees: [],
  isModalOpen: false,
  editingEmployee: null,
  isLoading: false,
  error: null,
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
      });
  },
});

export const { toggleModal, setEditingEmployee } = employeesSlice.actions;

export const selectActiveEmployees = (state: RootState): Employee[] => 
  state.employees.employees.filter((e: Employee) => e.active);

export const selectEmployees = (state: RootState): Employee[] =>
  state.employees.employees;

export default employeesSlice.reducer;
