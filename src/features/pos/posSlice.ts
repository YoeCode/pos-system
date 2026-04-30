import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, PaymentMethod, Product } from '../../types';
import type { RootState } from '../../app/store';

const CASH_BOX_KEY = 'nexopos_cash_box';

interface CashBoxState {
  isOpen: boolean;
  employeeIds: string[];
  openDate: string | null;
}

const loadCashBoxFromStorage = (): CashBoxState => {
  try {
    const stored = localStorage.getItem(CASH_BOX_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CashBoxState;
      if (parsed.isOpen && parsed.openDate) {
        const openDateObj = new Date(parsed.openDate);
        const today = new Date();
        const isSameDay = 
          openDateObj.getFullYear() === today.getFullYear() &&
          openDateObj.getMonth() === today.getMonth() &&
          openDateObj.getDate() === today.getDate();
        if (isSameDay) {
          return parsed;
        }
      }
    }
  } catch { /* localStorage unavailable */ }
  return { isOpen: false, employeeIds: [], openDate: null };
};

const saveCashBoxToStorage = (state: CashBoxState): void => {
  try {
    if (state.isOpen) {
      localStorage.setItem(CASH_BOX_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(CASH_BOX_KEY);
    }
  } catch { /* localStorage unavailable */ }
};

const storedCashBox = loadCashBoxFromStorage();

interface PosState {
  cart: CartItem[];
  paymentMethod: PaymentMethod;
  selectedCategory: string;
  selectedCustomerId: string | null;
  searchQuery: string;
  currentEmployeeId: string | null;
  isCashBoxOpen: boolean;
  cashBoxEmployeeIds: string[];
  cashBoxOpenTime: string | null;
}

const initialState: PosState = {
  cart: [],
  paymentMethod: 'cash',
  selectedCategory: 'All Items',
  selectedCustomerId: null,
  searchQuery: '',
  currentEmployeeId: null,
  isCashBoxOpen: storedCashBox.isOpen,
  cashBoxEmployeeIds: storedCashBox.employeeIds,
  cashBoxOpenTime: storedCashBox.openDate,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existing = state.cart.find(item => item.product.id === action.payload.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({ product: action.payload, quantity: 1 });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter(item => item.product.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.cart.find(i => i.product.id === action.payload.productId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.cart = state.cart.filter(i => i.product.id !== action.payload.productId);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
    clearCart: (state) => {
      state.cart = [];
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethod = action.payload;
    },
    setCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSelectedCustomer: (state, action: PayloadAction<string | null>) => {
      state.selectedCustomerId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    startNewSale: (state) => {
      state.cart = [];
      state.selectedCustomerId = null;
    },
    addCustomProductToCart: (state, action: PayloadAction<{ name: string; category: string; brand?: string; price: number }>) => {
      const { name, category, brand, price } = action.payload;
      const customProduct: Product = {
        id: `custom-${Date.now()}`,
        name,
        sku: `CUSTOM-${Date.now().toString(36).toUpperCase()}`,
        category,
        brand,
        price,
        costPrice: 0,
        stock: 999,
        minStock: 0,
        status: 'active',
        publishedOnline: false,
      };
      const existing = state.cart.find(item => item.product.id === customProduct.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({ product: customProduct, quantity: 1 });
      }
    },
    setCurrentEmployee: (state, action: PayloadAction<string | null>) => {
      state.currentEmployeeId = action.payload;
    },
    openCashBox: (state, action: PayloadAction<string[]>) => {
      state.isCashBoxOpen = true;
      state.cashBoxEmployeeIds = action.payload;
      state.cashBoxOpenTime = new Date().toISOString();
      saveCashBoxToStorage({
        isOpen: true,
        employeeIds: action.payload,
        openDate: state.cashBoxOpenTime,
      });
    },
    closeCashBox: (state) => {
      state.isCashBoxOpen = false;
      state.cashBoxEmployeeIds = [];
      state.cashBoxOpenTime = null;
      saveCashBoxToStorage({
        isOpen: false,
        employeeIds: [],
        openDate: null,
      });
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setPaymentMethod, setCategory, addCustomProductToCart, setSelectedCustomer, startNewSale, setSearchQuery, setCurrentEmployee, openCashBox, closeCashBox } = posSlice.actions;
export default posSlice.reducer;

export const selectIsCashBoxOpen = (state: RootState): boolean => state.pos.isCashBoxOpen;
export const selectCashBoxEmployeeIds = (state: RootState): string[] => state.pos.cashBoxEmployeeIds;
export const selectWorkingEmployees = (state: RootState): string[] => state.pos.cashBoxEmployeeIds;
