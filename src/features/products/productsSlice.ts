import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Product, ProductSize } from '../../types';

export const DEFAULT_CATEGORIES = ['Electronics', 'Food', 'Drinks', 'Apparel', 'Lencería', 'Bakery', 'Merchandise'];

export interface ProductFormState {
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  description: string;
  publishedOnline: boolean;
  status: Product['status'];
  sizes: ProductSize[];
  hasSizes: boolean;
}

export const createEmptyForm = (): ProductFormState => ({
  name: '',
  sku: '',
  category: DEFAULT_CATEGORIES[0],
  brand: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  minStock: 0,
  description: '',
  publishedOnline: false,
  status: 'draft',
  sizes: [],
  hasSizes: false,
});

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Summit Pro Watch',
    sku: 'WT-992-SMT',
    category: 'Electronics',
    brand: 'TechFit',
    price: 299,
    costPrice: 180,
    stock: 142,
    minStock: 20,
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
    brand: 'SoundPro',
    price: 189,
    costPrice: 95,
    stock: 8,
    minStock: 10,
    status: 'active',
    publishedOnline: true,
    version: 'v1.4',
    description: 'High-fidelity wireless headphones with active noise cancellation.',
  },
  {
    id: '3',
    name: 'Camiseta Básica',
    sku: 'CB-001-BAS',
    category: 'Apparel',
    brand: 'Casa Lis',
    price: 25,
    costPrice: 12,
    stock: 0,
    minStock: 20,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: 'S', stock: 15, minStock: 5 },
      { size: 'M', stock: 8, minStock: 5 },
      { size: 'L', stock: 3, minStock: 5 },
      { size: 'XL', stock: 0, minStock: 5 },
    ],
    description: 'Camiseta básica de algodón.',
  },
  {
    id: '3b',
    name: 'Sujetador Everyday',
    sku: 'SUJ-EVY-01',
    category: 'Lencería',
    brand: 'Casa Lis',
    price: 35,
    costPrice: 15,
    stock: 0,
    minStock: 30,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: '80A', stock: 5, minStock: 3 },
      { size: '80B', stock: 8, minStock: 3 },
      { size: '85A', stock: 12, minStock: 3 },
      { size: '85B', stock: 6, minStock: 3 },
      { size: '90A', stock: 2, minStock: 3 },
      { size: '90B', stock: 0, minStock: 3 },
    ],
    description: 'Sujetador everyday suave.',
  },
  {
    id: '3c',
    name: 'Pantalón Classic',
    sku: 'PNT-CLS-01',
    category: 'Apparel',
    brand: 'Casa Lis',
    price: 45,
    costPrice: 20,
    stock: 0,
    minStock: 15,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: '38', stock: 4, minStock: 3 },
      { size: '40', stock: 6, minStock: 3 },
      { size: '42', stock: 2, minStock: 3 },
      { size: '44', stock: 0, minStock: 3 },
    ],
    description: 'Pantalón classic tela elástica.',
  },
  {
    id: '4',
    name: 'Chocolate Glazed',
    sku: 'CG-001',
    category: 'Food',
    brand: 'FreshBakery',
    price: 4.50,
    costPrice: 1.20,
    stock: 200,
    minStock: 30,
    status: 'active',
    publishedOnline: false,
    description: 'Classic chocolate glazed donut, freshly baked daily.',
  },
  {
    id: '5',
    name: 'Caramel Iced Latte',
    sku: 'CL-002',
    category: 'Drinks',
    brand: 'BeanHouse',
    price: 5.25,
    costPrice: 1.80,
    stock: 150,
    minStock: 20,
    status: 'active',
    publishedOnline: false,
    description: 'Creamy caramel iced latte with oat milk option.',
  },
  {
    id: '6',
    name: 'Classic Cheeseburger',
    sku: 'CB-003',
    category: 'Food',
    brand: 'GrillHouse',
    price: 12.00,
    costPrice: 4.50,
    stock: 80,
    minStock: 15,
    status: 'active',
    publishedOnline: false,
    description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato.',
  },
  {
    id: '7',
    name: 'Artisan Lime Soda',
    sku: 'ALS-004',
    category: 'Drinks',
    brand: 'FizzCo',
    price: 3.75,
    costPrice: 0.90,
    stock: 120,
    minStock: 15,
    status: 'active',
    publishedOnline: false,
    description: 'Refreshing artisan sparkling soda with natural lime flavor.',
  },
  {
    id: '8',
    name: 'Avocado Brunch',
    sku: 'AVB-005',
    category: 'Food',
    brand: 'GreenKitchen',
    price: 14.50,
    costPrice: 6.00,
    stock: 45,
    minStock: 10,
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
  statusFilter: string;
  stockFilter: string;
  publishedFilter: string;
}

const initialState: ProductsState = {
  items: mockProducts,
  selectedProduct: null,
  searchQuery: '',
  selectedCategory: 'All',
  statusFilter: 'all',
  stockFilter: 'all',
  publishedFilter: 'all',
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
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setStockFilter: (state, action: PayloadAction<string>) => {
      state.stockFilter = action.payload;
    },
    setPublishedFilter: (state, action: PayloadAction<string>) => {
      state.publishedFilter = action.payload;
    },
  },
});

export const { setProducts, selectProduct, addProduct, updateProduct, setSearchQuery, setSelectedCategory, setStatusFilter, setStockFilter, setPublishedFilter } = productsSlice.actions;
export default productsSlice.reducer;
