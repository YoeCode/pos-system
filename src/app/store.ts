import { configureStore } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from '../features/auth/authSlice';
import posReducer from '../features/pos/posSlice';
import productsReducer from '../features/products/productsSlice';
import employeesReducer from '../features/employees/employeesSlice';
import salesReducer from '../features/sales/salesSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import settingsReducer from '../features/settings/settingsSlice';
import customersReducer from '../features/customers/customersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pos: posReducer,
    products: productsReducer,
    employees: employeesReducer,
    sales: salesReducer,
    dashboard: dashboardReducer,
    settings: settingsReducer,
    customers: customersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
