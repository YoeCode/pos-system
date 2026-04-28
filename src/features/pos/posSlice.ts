import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, PaymentMethod, Product } from '../../types';

interface PosState {
  cart: CartItem[];
  paymentMethod: PaymentMethod;
  selectedCategory: string;
  selectedCustomerId: string | null;
}

const initialState: PosState = {
  cart: [],
  paymentMethod: 'cash',
  selectedCategory: 'All Items',
  selectedCustomerId: null,
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
    startNewSale: (state) => {
      state.cart = [];
      state.selectedCustomerId = null;
    },
    addCustomProductToCart: (state, action: PayloadAction<{ name: string; category: string; price: number }>) => {
      const { name, category, price } = action.payload;
      const customProduct: Product = {
        id: `custom-${Date.now()}`,
        name,
        sku: `CUSTOM-${Date.now().toString(36).toUpperCase()}`,
        category,
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
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setPaymentMethod, setCategory, addCustomProductToCart, setSelectedCustomer, startNewSale } = posSlice.actions;
export default posSlice.reducer;
