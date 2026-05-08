import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Sale } from '../../types';
import { fetchSales, createSale, getNextOrderNumber } from './salesService';

interface SalesState {
  sales: Sale[];
  nextOrderNumber: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  sales: [],
  nextOrderNumber: 1042,
  isLoading: false,
  error: null,
};

export const fetchSalesAsync = createAsyncThunk(
  'sales/fetchSalesAsync',
  async () => {
    return fetchSales();
  }
);

export const completeSaleAsync = createAsyncThunk(
  'sales/completeSaleAsync',
  async (sale: Sale) => {
    const result = await createSale(sale);
    if (!result) throw new Error('Failed to create sale');
    return result;
  }
);

export const loadNextOrderNumberAsync = createAsyncThunk(
  'sales/loadNextOrderNumberAsync',
  async () => {
    return getNextOrderNumber();
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesAsync.fulfilled, (state, action: PayloadAction<Sale[]>) => {
        state.isLoading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSalesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sales';
      })
      .addCase(completeSaleAsync.fulfilled, (state, action: PayloadAction<Sale>) => {
        state.sales.push(action.payload);
        state.nextOrderNumber += 1;
      })
      .addCase(loadNextOrderNumberAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.nextOrderNumber = action.payload;
      });
  },
});

export default salesSlice.reducer;

interface StateWithSales {
  sales: SalesState;
}

export const selectNextOrderNumber = (state: StateWithSales): number =>
  state.sales.nextOrderNumber;

export const selectSaleById = (state: StateWithSales, saleId: string): Sale | undefined =>
  state.sales.sales.find(s => s.id === saleId);

export const selectAllSales = (state: StateWithSales): Sale[] =>
  state.sales.sales;

export const selectSalesByCustomerId = (state: StateWithSales, customerId: string): Sale[] =>
  state.sales.sales.filter(s => s.customerId === customerId);
