import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Product, ProductSize } from '../../types';
import type { RootState } from '../../app/store';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  reduceStock,
  restoreStock,
} from './productsService';
import { addCategory } from '../settings/settingsService';

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
  sizeGroupId: string;
}

export const createEmptyForm = (): ProductFormState => ({
  name: '',
  sku: '',
  category: 'Uncategorized',
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
  sizeGroupId: '',
});

interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  searchQuery: string;
  selectedCategory: string;
  statusFilter: string;
  stockFilter: string;
  publishedFilter: string;
  brandFilter: string;
  stockMovements: import('../../types').StockMovement[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  searchQuery: '',
  selectedCategory: 'All',
  statusFilter: 'all',
  stockFilter: 'all',
  publishedFilter: 'all',
  brandFilter: 'all',
  stockMovements: [],
  isLoading: false,
  error: null,
};

export const fetchProductsAsync = createAsyncThunk(
  'products/fetchProductsAsync',
  async (_, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId;
    if (!tenantId) return [];
    return fetchProducts(tenantId);
  }
);

export const createProductAsync = createAsyncThunk(
  'products/createProductAsync',
  async (product: Product, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await createProduct(product, tenantId);
    if (!result) throw new Error('Failed to create product');
    return result;
  }
);

export const updateProductAsync = createAsyncThunk(
  'products/updateProductAsync',
  async (product: Product, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await updateProduct(product, tenantId);
    if (!result) throw new Error('Failed to update product');
    return result;
  }
);

export const deleteProductAsync = createAsyncThunk(
  'products/deleteProductAsync',
  async (productId: string, { getState }) => {
    const tenantId = (getState() as RootState).auth.user?.tenantId || '';
    const result = await deleteProduct(productId, tenantId);
    if (!result) throw new Error('Failed to delete product');
    return productId;
  }
);

export const reduceStockAsync = createAsyncThunk(
  'products/reduceStockAsync',
  async ({ productId, quantity, size }: { productId: string; quantity: number; size?: string }, { getState }) => {
    const state = getState() as RootState;
    const tenantId = state.auth.user?.tenantId || '';
    const employeeId = state.auth.user?.id;
    const employeeName = state.auth.user?.name;
    await reduceStock(productId, quantity, size, tenantId);
    return { productId, quantity, size, employeeId, employeeName };
  }
);

export const restoreStockAsync = createAsyncThunk(
  'products/restoreStockAsync',
  async ({ productId, quantity, size }: { productId: string; quantity: number; size?: string }, { getState }) => {
    const state = getState() as RootState;
    const tenantId = state.auth.user?.tenantId || '';
    const employeeId = state.auth.user?.id;
    const employeeName = state.auth.user?.name;
    await restoreStock(productId, quantity, size, tenantId);
    return { productId, quantity, size, employeeId, employeeName };
  }
);

export const processDeliveryNoteAsync = createAsyncThunk(
  'products/processDeliveryNoteAsync',
  async (
    { restocks, creates }: {
      restocks: { productId: string; quantity: number; costPrice?: number }[];
      creates: Product[];
    },
    { getState }
  ) => {
    const state = getState() as RootState;
    const tenantId = state.auth.user?.tenantId || '';
    const employeeId = state.auth.user?.id;
    const employeeName = state.auth.user?.name;

    const createdProducts: Product[] = [];
    const newCategories = new Set<string>();
    for (const product of creates) {
      const result = await createProduct(product, tenantId);
      if (result) {
        createdProducts.push(result);
        if (product.category) newCategories.add(product.category);
      }
    }

    for (const restock of restocks) {
      await restoreStock(restock.productId, restock.quantity, undefined, tenantId, restock.costPrice);
    }

    const existingCategories = state.settings.pos.categories;
    for (const cat of newCategories) {
      if (!existingCategories.includes(cat)) {
        await addCategory(tenantId, cat);
      }
    }

    return { restocks, creates: createdProducts, tenantId, employeeId, employeeName };
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    selectProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
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
    setBrandFilter: (state, action: PayloadAction<string>) => {
      state.brandFilter = action.payload;
    },
    addStockMovement: (state, action: PayloadAction<import('../../types').StockMovement>) => {
      state.stockMovements.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsAsync.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProductsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(createProductAsync.fulfilled, (state, action: PayloadAction<Product>) => {
        state.items.push(action.payload);
      })
      .addCase(updateProductAsync.fulfilled, (state, action: PayloadAction<Product>) => {
        const idx = state.items.findIndex(p => p.id === action.payload.id);
        if (idx === -1) return;
        const previousStock = state.items[idx].stock;
        state.items[idx] = action.payload;
        const newStock = action.payload.stock;
        if (previousStock !== newStock) {
          state.stockMovements.unshift({
            id: crypto.randomUUID(),
            productId: action.payload.id,
            productName: action.payload.name,
            type: 'adjustment',
            quantity: newStock - previousStock,
            previousStock,
            newStock,
            createdAt: new Date().toISOString(),
          });
        }
      })
      .addCase(deleteProductAsync.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      })
      .addCase(reduceStockAsync.fulfilled, (state, action) => {
        const { productId, quantity, size, employeeId, employeeName } = action.payload;
        const product = state.items.find(p => p.id === productId);
        if (!product) return;
        const previousStock = product.stock;

        if (size && product.sizes) {
          const sizeEntry = product.sizes.find(s => s.size === size);
          if (sizeEntry) {
            sizeEntry.stock = Math.max(0, sizeEntry.stock - quantity);
          }
          product.stock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
        } else {
          product.stock = Math.max(0, product.stock - quantity);
        }

        state.stockMovements.unshift({
          id: crypto.randomUUID(),
          productId,
          productName: product.name,
          type: 'sale',
          quantity: -quantity,
          previousStock,
          newStock: product.stock,
          size,
          employeeId,
          employeeName,
          createdAt: new Date().toISOString(),
        });
      })
      .addCase(restoreStockAsync.fulfilled, (state, action) => {
        const { productId, quantity, size, employeeId, employeeName } = action.payload;
        const product = state.items.find(p => p.id === productId);
        if (!product) return;
        const previousStock = product.stock;

        if (size && product.sizes) {
          const sizeEntry = product.sizes.find(s => s.size === size);
          if (sizeEntry) {
            sizeEntry.stock += quantity;
          }
          product.stock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
        } else {
          product.stock += quantity;
        }

        state.stockMovements.unshift({
          id: crypto.randomUUID(),
          productId,
          productName: product.name,
          type: 'restock',
          quantity,
          previousStock,
          newStock: product.stock,
          size,
          employeeId,
          employeeName,
          createdAt: new Date().toISOString(),
        });
      })
      .addCase(processDeliveryNoteAsync.fulfilled, (state, action) => {
        const { restocks, creates, employeeId, employeeName } = action.payload;

        restocks.forEach(({ productId, quantity, costPrice }) => {
          const product = state.items.find(p => p.id === productId);
          if (!product) return;
          const previousStock = product.stock;
          product.stock += quantity;
          if (costPrice !== undefined) {
            product.costPrice = costPrice;
          }
          state.stockMovements.unshift({
            id: crypto.randomUUID(),
            productId,
            productName: product.name,
            type: 'restock',
            quantity,
            previousStock,
            newStock: product.stock,
            employeeId,
            employeeName,
            createdAt: new Date().toISOString(),
          });
        });

        creates.forEach(product => {
          state.items.push(product);
          state.stockMovements.unshift({
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            type: 'restock',
            quantity: product.stock,
            previousStock: 0,
            newStock: product.stock,
            employeeId,
            employeeName,
            createdAt: new Date().toISOString(),
          });
        });
      });
  },
});

export const {
  selectProduct,
  setSearchQuery,
  setSelectedCategory,
  setStatusFilter,
  setStockFilter,
  setPublishedFilter,
  setBrandFilter,
  addStockMovement,
} = productsSlice.actions;
export default productsSlice.reducer;

export interface StockAlertItem {
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  minStock: number;
  severity: 'critical' | 'warning';
  sizes?: { size: string; stock: number; minStock: number }[];
}

export const selectAllProducts = (state: { products: ProductsState }): Product[] => state.products.items;

const selectProductsItems = (state: { products: ProductsState }) => state.products.items;

export const selectLowStockAlerts = createSelector(
  [selectProductsItems],
  (items): StockAlertItem[] => {
  const alerts: StockAlertItem[] = [];
  items.forEach(product => {
    if (product.status !== 'active') return;
    if (product.sizes && product.sizes.length > 0) {
      const lowSizes = product.sizes.filter(s => s.stock <= (s.minStock || 0));
      if (lowSizes.length > 0) {
        const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
        const totalMin = product.sizes.reduce((sum, s) => sum + (s.minStock || 0), 0);
        alerts.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          stock: totalStock,
          minStock: totalMin,
          severity: totalStock === 0 ? 'critical' : 'warning',
          sizes: lowSizes.map(s => ({ size: s.size, stock: s.stock, minStock: s.minStock || 0 })),
        });
      }
    } else {
      if (product.stock <= product.minStock) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          stock: product.stock,
          minStock: product.minStock,
          severity: product.stock === 0 ? 'critical' : 'warning',
        });
      }
    }
  });
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return (a.stock / a.minStock) - (b.stock / b.minStock);
  });
});

export const selectLowStockCount = createSelector(
  [selectLowStockAlerts],
  (alerts) => alerts.length
);

export const selectCriticalStockCount = createSelector(
  [selectLowStockAlerts],
  (alerts) => alerts.filter(a => a.severity === 'critical').length
);

export const selectStockMovementsForProduct = (state: RootState, productId: string) =>
  state.products.stockMovements.filter(m => m.productId === productId).slice(0, 50);
