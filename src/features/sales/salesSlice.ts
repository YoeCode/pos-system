import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Sale } from '../../types';

interface SalesState {
  sales: Sale[];
  nextOrderNumber: number;
}

const initialState: SalesState = {
  sales: [],
  nextOrderNumber: 1042,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    completeSale: (state, action: PayloadAction<Sale>) => {
      state.sales.push(action.payload);
      state.nextOrderNumber += 1;
    },
  },
});

export const { completeSale } = salesSlice.actions;
export default salesSlice.reducer;

interface StateWithSales {
  sales: SalesState;
}

export const selectNextOrderNumber = (state: StateWithSales): number =>
  state.sales.nextOrderNumber;

export const selectFormattedOrderNumber = (state: StateWithSales): string =>
  `ORD-${state.sales.nextOrderNumber}`;

export const selectSaleById = (state: StateWithSales, saleId: string): Sale | undefined =>
  state.sales.sales.find(s => s.id === saleId);

export const selectAllSales = (state: StateWithSales): Sale[] =>
  state.sales.sales;
