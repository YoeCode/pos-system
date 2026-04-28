import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Sale, Product, PaymentMethod, OrderItem } from '../../types';
import { TAX_RATE } from '../../constants/tax';

const mockProducts: Product[] = [
  { id: '1', name: 'Summit Pro Watch', sku: 'WT-992-SMT', category: 'Electronics', price: 299, costPrice: 180, stock: 142, minStock: 20, status: 'active', publishedOnline: true, version: 'v2.1', description: 'Premium smartwatch' },
  { id: '2', name: 'AudioCore Wireless', sku: 'AD-402-WRL', category: 'Electronics', price: 189, costPrice: 95, stock: 8, minStock: 10, status: 'active', publishedOnline: true, version: 'v1.4', description: 'Wireless headphones' },
  { id: '3', name: 'Velocity Runner X', sku: 'FT-881-VRX', category: 'Apparel', price: 125, costPrice: 60, stock: 56, minStock: 10, status: 'active', publishedOnline: true, version: 'v3.0', description: 'Running shoes' },
  { id: '4', name: 'Chocolate Glazed', sku: 'CG-001', category: 'Food', price: 4.50, costPrice: 1.20, stock: 200, minStock: 30, status: 'active', publishedOnline: false, description: 'Chocolate donut' },
  { id: '5', name: 'Caramel Iced Latte', sku: 'CL-002', category: 'Drinks', price: 5.25, costPrice: 1.80, stock: 150, minStock: 20, status: 'active', publishedOnline: false, description: 'Iced latte' },
  { id: '6', name: 'Classic Cheeseburger', sku: 'CB-003', category: 'Food', price: 12, costPrice: 4.50, stock: 0, minStock: 15, status: 'active', publishedOnline: false, description: 'Cheeseburger' },
  { id: '7', name: 'Artisan Lime Soda', sku: 'ALS-004', category: 'Drinks', price: 3.75, costPrice: 0.90, stock: 120, minStock: 15, status: 'active', publishedOnline: false, description: 'Lime soda' },
  { id: '8', name: 'Avocado Brunch', sku: 'AVB-005', category: 'Food', price: 14.50, costPrice: 6, stock: 45, minStock: 10, status: 'active', publishedOnline: false, description: 'Avocado toast' },
];

function makeSale(id: string, orderNum: number, hoursAgo: number, items: { productId: string; qty: number }[], method: PaymentMethod, employeeId?: string): Sale {
  const orderItems: OrderItem[] = items.map(i => {
    const p = mockProducts.find(pr => pr.id === i.productId)!;
    return { product: p, quantity: i.qty, lineTotal: p.price * i.qty };
  });
  const subtotal = orderItems.reduce((s, i) => s + i.lineTotal, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return {
    id,
    order: { id: `ord-${id}`, orderNumber: `ORD-${orderNum}`, items: orderItems, subtotal, tax, total, discount: 0, createdAt: date.toISOString() },
    paymentMethod: method,
    amountReceived: method === 'cash' ? Math.ceil(total) : total,
    change: method === 'cash' ? Math.ceil(total) - total : null,
    completedAt: date.toISOString(),
    employeeId,
    loyaltyPointsEarned: 0,
    discountApplied: 0,
  };
}

const mockSales: Sale[] = [
  makeSale('s1', 1041, 0.3, [{ productId: '1', qty: 1 }, { productId: '4', qty: 2 }], 'card', '1'),
  makeSale('s2', 1040, 1.2, [{ productId: '5', qty: 3 }], 'cash', '2'),
  makeSale('s3', 1039, 2.5, [{ productId: '3', qty: 1 }, { productId: '7', qty: 2 }], 'qr', '1'),
  makeSale('s4', 1038, 4, [{ productId: '8', qty: 2 }], 'card', '3'),
  makeSale('s5', 1037, 5.5, [{ productId: '2', qty: 1 }], 'cash', '2'),
  makeSale('s6', 1036, 7, [{ productId: '4', qty: 5 }, { productId: '5', qty: 3 }], 'card', '1'),
  makeSale('s7', 1035, 9, [{ productId: '1', qty: 1 }], 'qr', '4'),
  makeSale('s8', 1034, 12, [{ productId: '3', qty: 2 }, { productId: '8', qty: 1 }], 'cash', '3'),
  makeSale('s9', 1033, 18, [{ productId: '7', qty: 4 }], 'card', '2'),
  makeSale('s10', 1032, 24, [{ productId: '2', qty: 1 }, { productId: '5', qty: 2 }], 'cash', '1'),
  makeSale('s11', 1031, 30, [{ productId: '4', qty: 10 }], 'card', '5'),
  makeSale('s12', 1030, 36, [{ productId: '1', qty: 2 }], 'qr', '4'),
  makeSale('s13', 1029, 48, [{ productId: '3', qty: 1 }, { productId: '4', qty: 3 }, { productId: '7', qty: 2 }], 'cash', '2'),
  makeSale('s14', 1028, 55, [{ productId: '8', qty: 4 }], 'card', '3'),
  makeSale('s15', 1027, 60, [{ productId: '2', qty: 2 }, { productId: '5', qty: 1 }], 'cash', '1'),
];

interface DashboardState {
  sales: Sale[];
  dateRange: 'today' | 'week' | 'month';
}

const initialState: DashboardState = {
  sales: mockSales,
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

export const selectTodaySales = (state: { dashboard: DashboardState }) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return state.dashboard.sales.filter(s => new Date(s.completedAt) >= startOfDay);
};

export const selectWeekSales = (state: { dashboard: DashboardState }) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return state.dashboard.sales.filter(s => new Date(s.completedAt) >= weekAgo);
};

export const selectMonthSales = (state: { dashboard: DashboardState }) => {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return state.dashboard.sales.filter(s => new Date(s.completedAt) >= monthAgo);
};

export const selectFilteredSales = (state: { dashboard: DashboardState }) => {
  const { dateRange } = state.dashboard;
  if (dateRange === 'today') return selectTodaySales(state);
  if (dateRange === 'week') return selectWeekSales(state);
  return selectMonthSales(state);
};
