import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Sale } from '../../types';

interface SalesState {
  sales: Sale[];
  nextOrderNumber: number;
}

/** Read the stored order seed from pos_settings without importing settingsSlice (avoids circular dependency). */
const loadStoredOrderSeed = (): number => {
  try {
    const stored = localStorage.getItem('pos_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      const seed = parsed?.pos?.orderNumberSeed;
      if (typeof seed === 'number' && seed >= 1) return seed;
    }
  } catch {
    // ignore — fall through to default
  }
  return 1042;
};

const initialState: SalesState = {
  sales: [],
  nextOrderNumber: loadStoredOrderSeed(),
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

export const selectSaleById = (state: StateWithSales, saleId: string): Sale | undefined =>
  state.sales.sales.find(s => s.id === saleId);

export const selectAllSales = (state: StateWithSales): Sale[] =>
  state.sales.sales;
