import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Customer, LoyaltyTier, LoyaltyTierConfig } from '../../types';

interface CustomersState {
  customers: Customer[];
}

function computeTier(points: number, tiers: LoyaltyTierConfig[]): LoyaltyTier {
  const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold);
  const match = sorted.find(t => points >= t.threshold);
  return match ? match.tier : 'bronze';
}

const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'María García',
    email: 'maria.garcia@example.es',
    phone: '+34 600 111 222',
    notes: '',
    active: true,
    loyaltyPoints: 120,
    tier: 'bronze',
    totalSpent: 120,
    createdAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'cust-002',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@example.es',
    phone: '+34 600 222 333',
    notes: 'Prefers email receipts',
    active: true,
    loyaltyPoints: 780,
    tier: 'silver',
    totalSpent: 780,
    createdAt: '2024-08-22T10:00:00Z',
  },
  {
    id: 'cust-003',
    name: 'Lucía Fernández',
    email: 'lucia.fernandez@example.es',
    phone: '+34 600 333 444',
    notes: '',
    active: true,
    loyaltyPoints: 2340,
    tier: 'gold',
    totalSpent: 2340,
    createdAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'cust-004',
    name: 'Javier Moreno',
    email: 'javier.moreno@example.es',
    phone: '+34 600 444 555',
    notes: 'VIP - birthday: Mar 4',
    active: true,
    loyaltyPoints: 6180,
    tier: 'platinum',
    totalSpent: 6180,
    createdAt: '2023-11-02T10:00:00Z',
  },
  {
    id: 'cust-005',
    name: 'Ana Torres',
    email: 'ana.torres@example.es',
    phone: '+34 600 555 666',
    notes: '',
    active: true,
    loyaltyPoints: 0,
    tier: 'bronze',
    totalSpent: 0,
    createdAt: '2025-04-01T10:00:00Z',
  },
];

const initialState: CustomersState = {
  customers: mockCustomers,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer: (
      state,
      action: PayloadAction<Omit<Customer, 'id' | 'loyaltyPoints' | 'tier' | 'totalSpent' | 'createdAt'>>
    ) => {
      state.customers.push({
        ...action.payload,
        id: Date.now().toString(),
        loyaltyPoints: 0,
        tier: 'bronze',
        totalSpent: 0,
        createdAt: new Date().toISOString(),
      });
    },
    updateCustomer: (state, action: PayloadAction<Partial<Customer> & { id: string }>) => {
      const idx = state.customers.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        state.customers[idx] = { ...state.customers[idx], ...action.payload };
      }
    },
    deactivateCustomer: (state, action: PayloadAction<string>) => {
      const customer = state.customers.find(c => c.id === action.payload);
      if (customer) customer.active = false;
    },
    addLoyaltyPoints: (
      state,
      action: PayloadAction<{
        customerId: string;
        points: number;
        amountSpent: number;
        tiers: LoyaltyTierConfig[];
      }>
    ) => {
      const { customerId, points, amountSpent, tiers } = action.payload;
      const customer = state.customers.find(c => c.id === customerId);
      if (customer) {
        customer.loyaltyPoints += points;
        customer.totalSpent += amountSpent;
        customer.tier = computeTier(customer.loyaltyPoints, tiers);
      }
    },
  },
});

export const { addCustomer, updateCustomer, deactivateCustomer, addLoyaltyPoints } =
  customersSlice.actions;
export default customersSlice.reducer;

interface StateWithCustomers {
  customers: CustomersState;
}

export const selectAllCustomers = (state: StateWithCustomers): Customer[] =>
  state.customers.customers;

export const selectActiveCustomers = (state: StateWithCustomers): Customer[] =>
  state.customers.customers.filter(c => c.active);

export const selectCustomerById = (state: StateWithCustomers, id: string): Customer | undefined =>
  state.customers.customers.find(c => c.id === id);
