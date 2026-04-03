import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Employee } from '../../types';

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    email: 'alex.rivera@nexopos.com',
    phone: '+1 555 0101',
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
    startDate: '2023-03-15',
  },
  {
    id: '2',
    name: 'Tom Baker',
    email: 'tom.baker@nexopos.com',
    phone: '+1 555 0102',
    role: 'Supervisor',
    shift: 'Evening 14:00-22:00',
    pin: '2345',
    active: true,
    permissions: {
      processSales: true,
      applyDiscounts: true,
      manageInventory: true,
      accessReports: false,
    },
    startDate: '2022-07-01',
  },
  {
    id: '3',
    name: 'Maria Chen',
    email: 'maria.chen@nexopos.com',
    phone: '+1 555 0103',
    role: 'Admin',
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
    name: 'James Wilson',
    email: 'james.wilson@nexopos.com',
    phone: '+1 555 0104',
    role: 'Cashier',
    shift: 'Night 22:00-06:00',
    pin: '4567',
    active: false,
    permissions: {
      processSales: true,
      applyDiscounts: false,
      manageInventory: false,
      accessReports: false,
    },
    startDate: '2023-09-20',
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
export default employeesSlice.reducer;
