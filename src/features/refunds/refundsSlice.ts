import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Refund } from '../../types';

const REFUNDS_STORAGE_KEY = 'nexopos_refunds';

interface RefundsState {
  refunds: Refund[];
}

const loadRefundsFromStorage = (): Refund[] => {
  try {
    const stored = localStorage.getItem(REFUNDS_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Refund[];
  } catch {}
  return [];
};

const saveRefundsToStorage = (refunds: Refund[]): void => {
  try {
    localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(refunds));
  } catch {}
};

const initialState: RefundsState = {
  refunds: loadRefundsFromStorage(),
};

const refundsSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {
    addRefund: (state, action: PayloadAction<Refund>) => {
      state.refunds.push(action.payload);
      saveRefundsToStorage(state.refunds);
    },
  },
});

export const { addRefund } = refundsSlice.actions;
export default refundsSlice.reducer;

interface StateWithRefunds {
  refunds: RefundsState;
}

export const selectAllRefunds = (state: StateWithRefunds): Refund[] =>
  state.refunds.refunds;

export const selectRefundsBySaleId = (state: StateWithRefunds, saleId: string): Refund[] =>
  state.refunds.refunds.filter(r => r.originalSaleId === saleId);

export const selectRefundById = (state: StateWithRefunds, refundId: string): Refund | undefined =>
  state.refunds.refunds.find(r => r.id === refundId);
