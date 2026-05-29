import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Customer, LoyaltyTierConfig } from '../../types';
import type { RootState } from '../../app/store';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  updateLoyaltyPoints,
  computeTier,
} from './customersService';

interface CustomersState {
  items: Customer[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchCustomersAsync = createAsyncThunk(
  'customers/fetchCustomersAsync',
  async (_, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId;
    if (!tenantId) return [];
    return fetchCustomers(tenantId);
  },
);

export const createCustomerAsync = createAsyncThunk(
  'customers/createCustomerAsync',
  async (
    customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'tier' | 'totalSpent' | 'createdAt'>,
    { getState },
  ) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await createCustomer(customer, tenantId);
    if (!result) throw new Error('Failed to create customer');
    return result;
  },
);

export const updateCustomerAsync = createAsyncThunk(
  'customers/updateCustomerAsync',
  async (customer: Partial<Customer> & { id: string }, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await updateCustomer(customer, tenantId);
    if (!result) throw new Error('Failed to update customer');
    return result;
  },
);

export const deactivateCustomerAsync = createAsyncThunk(
  'customers/deactivateCustomerAsync',
  async (customerId: string, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await deactivateCustomer(customerId, tenantId);
    if (!result) throw new Error('Failed to deactivate customer');
    return customerId;
  },
);

export const addLoyaltyPointsAsync = createAsyncThunk(
  'customers/addLoyaltyPointsAsync',
  async (
    { customerId, points, amountSpent, tiers }: { customerId: string; points: number; amountSpent: number; tiers: LoyaltyTierConfig[] },
    { getState },
  ) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const newTier = computeTier(points, tiers);
    const result = await updateLoyaltyPoints(customerId, points, amountSpent, newTier, tenantId);
    if (!result) throw new Error('Failed to update loyalty points');
    return result;
  },
);

export const deductLoyaltyPointsAsync = createAsyncThunk(
  'customers/deductLoyaltyPointsAsync',
  async (
    { customerId, points, amountSpent, tiers }: { customerId: string; points: number; amountSpent: number; tiers: LoyaltyTierConfig[] },
    { getState },
  ) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const newTier = computeTier(points, tiers);
    const result = await updateLoyaltyPoints(customerId, -points, -amountSpent, newTier, tenantId);
    if (!result) throw new Error('Failed to deduct loyalty points');
    return result;
  },
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomersAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomersAsync.fulfilled, (state, action: PayloadAction<Customer[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomersAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      .addCase(createCustomerAsync.fulfilled, (state, action: PayloadAction<Customer>) => {
        state.items.push(action.payload);
      })
      .addCase(updateCustomerAsync.fulfilled, (state, action: PayloadAction<Customer>) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deactivateCustomerAsync.fulfilled, (state, action: PayloadAction<string>) => {
        const customer = state.items.find(c => c.id === action.payload);
        if (customer) customer.active = false;
      })
      .addCase(addLoyaltyPointsAsync.fulfilled, (state, action: PayloadAction<Customer>) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deductLoyaltyPointsAsync.fulfilled, (state, action: PayloadAction<Customer>) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });
  },
});

export default customersSlice.reducer;

interface StateWithCustomers {
  customers: CustomersState;
}

export const selectAllCustomers = (state: StateWithCustomers): Customer[] =>
  state.customers.items;

export const selectActiveCustomers = createSelector(
  [selectAllCustomers],
  (items) => items.filter(c => c.active)
);

export const selectCustomerById = (state: StateWithCustomers, id: string): Customer | undefined =>
  state.customers.items.find(c => c.id === id);

export const selectCustomersLoading = (state: StateWithCustomers): boolean =>
  state.customers.isLoading;
