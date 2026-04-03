import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../types';

export const CATEGORIES = ['Electronics', 'Food', 'Drinks', 'Apparel', 'Bakery', 'Merchandise'];

export interface ProductFormState {
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  description: string;
  publishedOnline: boolean;
  status: Product['status'];
}

export const createEmptyForm = (): ProductFormState => ({
  name: '',
  sku: '',
  category: CATEGORIES[0],
  price: 0,
  costPrice: 0,
  stock: 0,
  description: '',
  publishedOnline: false,
  status: 'draft',
});

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Summit Pro Watch',
    sku: 'WT-992-SMT',
    category: 'Electronics',
    price: 299,
    costPrice: 180,
    stock: 142,
    status: 'active',
    publishedOnline: true,
    version: 'v2.1',
    description: 'Premium smartwatch with advanced fitness tracking and GPS.',
  },
  {
    id: '2',
    name: 'AudioCore Wireless',
    sku: 'AD-402-WRL',
    category: 'Electronics',
    price: 189,
    costPrice: 95,
    stock: 8,
    status: 'active',
    publishedOnline: true,
    version: 'v1.4',
    description: 'High-fidelity wireless headphones with active noise cancellation.',
  },
  {
    id: '3',
    name: 'Velocity Runner X',
    sku: 'FT-881-VRX',
    category: 'Apparel',
    price: 125,
    costPrice: 60,
    stock: 56,
    status: 'active',
    publishedOnline: true,
    version: 'v3.0',
    description: 'Lightweight performance running shoes for professional athletes.',
  },
  {
    id: '4',
    name: 'Chocolate Glazed',
    sku: 'CG-001',
    category: 'Food',
    price: 4.50,
    costPrice: 1.20,
    stock: 200,
    status: 'active',
    publishedOnline: false,
    description: 'Classic chocolate glazed donut, freshly baked daily.',
  },
  {
    id: '5',
    name: 'Caramel Iced Latte',
    sku: 'CL-002',
    category: 'Drinks',
    price: 5.25,
    costPrice: 1.80,
    stock: 150,
    status: 'active',
    publishedOnline: false,
    description: 'Creamy caramel iced latte with oat milk option.',
  },
  {
    id: '6',
    name: 'Classic Cheeseburger',
    sku: 'CB-003',
    category: 'Food',
    price: 12.00,
    costPrice: 4.50,
    stock: 80,
    status: 'active',
    publishedOnline: false,
    description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato.',
  },
  {
    id: '7',
    name: 'Artisan Lime Soda',
    sku: 'ALS-004',
    category: 'Drinks',
    price: 3.75,
    costPrice: 0.90,
    stock: 120,
    status: 'active',
    publishedOnline: false,
    description: 'Refreshing artisan sparkling soda with natural lime flavor.',
  },
  {
    id: '8',
    name: 'Avocado Brunch',
    sku: 'AVB-005',
    category: 'Food',
    price: 14.50,
    costPrice: 6.00,
    stock: 45,
    status: 'active',
    publishedOnline: false,
    description: 'Toasted sourdough with smashed avocado, poached eggs, and chili flakes.',
  },
];

interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  searchQuery: string;
  selectedCategory: string;
}

const initialState: ProductsState = {
  items: mockProducts,
  selectedProduct: null,
  searchQuery: '',
  selectedCategory: 'All',
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
    },
    selectProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.items.push(action.payload);
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
  },
});

export const { setProducts, selectProduct, addProduct, updateProduct, setSearchQuery, setSelectedCategory } = productsSlice.actions;
export default productsSlice.reducer;
