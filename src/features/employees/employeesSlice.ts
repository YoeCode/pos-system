import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Employee } from '../../types';
import type { RootState } from '../../app/store';

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

interface EmployeesState {
  employees: Employee[];
  isModalOpen: boolean;
  editingEmployee: Employee | null;
}

const initialState: EmployeesState = {
  employees: mockEmployees,
  isModalOpen: false,
  editingEmployee: null,
};

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees.push(action.payload);
    },
    updateEmployee: (state, action: PayloadAction<Employee>) => {
      const idx = state.employees.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.employees[idx] = action.payload;
    },
    toggleModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
    setEditingEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.editingEmployee = action.payload;
    },
  },
});

export const { addEmployee, updateEmployee, toggleModal, setEditingEmployee } = employeesSlice.actions;

export const selectActiveEmployees = (state: RootState): Employee[] => 
  state.employees.employees.filter((e: Employee) => e.active);

export const selectEmployees = (state: RootState): Employee[] =>
  state.employees.employees;

export default employeesSlice.reducer;
