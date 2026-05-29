import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Sale } from '../../types';

interface DashboardState {
  dateRange: 'today' | 'week' | 'month';
}

const initialState: DashboardState = {
  dateRange: 'today',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<'today' | 'week' | 'month'>) => {
      state.dateRange = action.payload;
    },
  },
});

export const { setDateRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;

const selectSales = (state: { sales: { sales: Sale[] } }) => state.sales.sales;
const selectDateRange = (state: { sales: { sales: Sale[] }; dashboard: DashboardState }) =>
  state.dashboard.dateRange;

export const selectTodaySales = createSelector(
  [selectSales],
  (sales) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return sales.filter(s => new Date(s.completedAt) >= startOfDay);
  }
);

export const selectWeekSales = createSelector(
  [selectSales],
  (sales) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sales.filter(s => new Date(s.completedAt) >= weekAgo);
  }
);

export const selectMonthSales = createSelector(
  [selectSales],
  (sales) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return sales.filter(s => new Date(s.completedAt) >= monthAgo);
  }
);

export const selectFilteredSales = createSelector(
  [selectSales, selectDateRange],
  (sales, dateRange) => {
    const now = new Date();
    if (dateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return sales.filter(s => new Date(s.completedAt) >= startOfDay);
    }
    if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sales.filter(s => new Date(s.completedAt) >= weekAgo);
    }
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return sales.filter(s => new Date(s.completedAt) >= monthAgo);
  }
);
