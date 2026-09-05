import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { PaymentMethod, TaxSettings, StoreSettings, PosSettings, LanguageSettings, SettingsState, Language, LoyaltySettings, TicketConfig, SizeGroup, CategoryGroup } from '../../types';
import type { RootState } from '../../app/store';
import {
  fetchTenantSettings,
  updateTaxSettings as updateTaxSettingsSupabase,
  updateStoreSettings as updateStoreSettingsSupabase,
  updatePosSettings as updatePosSettingsSupabase,
  updateLanguageSettings as updateLanguageSettingsSupabase,
  updateLoyaltySettings as updateLoyaltySettingsSupabase,
  upsertTenantSettings,
  fetchCategories,
  fetchBrands,
  fetchSeasons,
  fetchSizes,
  fetchSizeGroups,
  syncCategories,
  syncBrands,
  syncSeasons,
  syncSizes,
  syncSizeGroups,
  addCategory,
  removeCategory,
  renameCategory,
  addBrand,
  removeBrand,
  addSeason,
  removeSeason,
  addSize,
  removeSize,
  addSizeGroup,
  updateSizeGroup,
  removeSizeGroupById,
} from './settingsService';

export const DEFAULT_TAX_RATE = 0.21;
export const DEFAULT_TAX_NAME = 'Tax';
export const DEFAULT_STORE_NAME = 'Casa Lis';
export const DEFAULT_ORDER_PREFIX = 'ORD-';
export const DEFAULT_ORDER_SEED = 1042;
export const DEFAULT_BRANDS = ['Nestlé', 'Coca-Cola', 'Pepsi', 'Mondelez', 'Kellogg\'s'];
export const DEFAULT_SEASONS = ['Permanente'];
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const DEFAULT_CATEGORIES: CategoryGroup[] = [
  { name: 'Electronics', subcategories: [] },
  { name: 'Food', subcategories: [] },
  { name: 'Drinks', subcategories: [] },
  { name: 'Apparel', subcategories: [] },
  { name: 'Bakery', subcategories: [] },
  { name: 'Merchandise', subcategories: [] },
];

export const normalizeCategories = (input: unknown): CategoryGroup[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => {
      if (typeof item === 'string') return { name: item, subcategories: [] as string[] };
      const group = item as Partial<CategoryGroup>;
      return {
        id: typeof group.id === 'string' ? group.id : undefined,
        name: String(group.name ?? ''),
        subcategories: Array.isArray(group.subcategories)
          ? group.subcategories.filter((s): s is string => typeof s === 'string')
          : [],
      };
    })
    .filter(g => g.name.length > 0);
};

export const DEFAULT_SIZE_GROUPS: SizeGroup[] = [
  { id: 'standard', name: 'Estándar', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'numerical', name: 'Numérica', sizes: ['38', '40', '42', '44', '46', '48'] },
  { id: 'bras', name: 'Sujetadores', sizes: ['80A', '80B', '85A', '85B', '90A', '90B'] },
  { id: 'shoes', name: 'Zapatos', sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'] },
];

const defaultTaxSettings: TaxSettings = {
  taxRate: DEFAULT_TAX_RATE,
  taxName: DEFAULT_TAX_NAME,
  taxIncludedInPrice: false,
  taxRegistrationNumber: '',
};

const defaultStoreSettings: StoreSettings = {
  storeName: DEFAULT_STORE_NAME,
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  receiptFooterMessage: 'Thank you!',
};

const defaultPosSettings: PosSettings = {
  defaultPaymentMethod: 'cash',
  defaultCategory: 'All Items',
  categories: DEFAULT_CATEGORIES,
  brands: DEFAULT_BRANDS,
  seasons: DEFAULT_SEASONS,
  sizes: DEFAULT_SIZES,
  sizeGroups: DEFAULT_SIZE_GROUPS,
  walkInCustomerLabel: 'Walk-In Customer',
  orderNumberPrefix: DEFAULT_ORDER_PREFIX,
  orderNumberSeed: DEFAULT_ORDER_SEED,
  enableManualProduct: true,
  multiTerminalMode: false,
  enableAiDeliveryNote: false,
  ticketConfig: {
    showLogo: false,
    logoUrl: undefined,
    showEmployee: true,
    showStoreName: true,
    customHeader: undefined,
    customFooter: undefined,
  },
  maxSaleWindows: 5,
  refundSettings: {
    enabled: true,
    requirePin: true,
    pinThreshold: 50,
    maxRefundDays: 30,
  },
  ticketSize: '58mm',
  shifts: ['Mañana 06:00-14:00', 'Tarde 14:00-22:00', 'Noche 22:00-06:00', 'Jornada completa 08:00-18:00'],
};

const defaultLanguageSettings: LanguageSettings = {
  language: 'es',
};

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerEuro: 1,
  tiers: [
    { tier: 'bronze',   threshold: 0,    discountPct: 0 },
    { tier: 'silver',   threshold: 500,  discountPct: 0.05 },
    { tier: 'gold',     threshold: 1500, discountPct: 0.10 },
    { tier: 'platinum', threshold: 5000, discountPct: 0.15 },
  ],
};

const SETTINGS_STORAGE_KEY = 'pos_settings_v2';

const loadStoredSettings = (): Partial<SettingsState> => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const parsedPos = parsed.pos
        ? {
            ...defaultPosSettings,
            ...parsed.pos,
            categories: normalizeCategories(parsed.pos.categories ?? defaultPosSettings.categories),
            seasons: Array.isArray(parsed.pos.seasons) ? parsed.pos.seasons : defaultPosSettings.seasons,
          }
        : undefined;
      return {
        tax: parsed.tax ? { ...defaultTaxSettings, ...parsed.tax } : undefined,
        store: parsed.store ? { ...defaultStoreSettings, ...parsed.store } : undefined,
        pos: parsedPos,
        language: parsed.language ? { ...defaultLanguageSettings, ...parsed.language } : undefined,
        loyalty: parsed.loyalty ? { ...DEFAULT_LOYALTY_SETTINGS, ...parsed.loyalty } : undefined,
      };
    }
  } catch {
    try { localStorage.removeItem(SETTINGS_STORAGE_KEY); } catch { /* ignore */ }
  }
  return {};
};

const stored = loadStoredSettings();

const initialState: SettingsState & {
  isLoading: boolean;
  error: string | null;
} = {
  tax: stored.tax || { ...defaultTaxSettings },
  store: stored.store || { ...defaultStoreSettings },
  pos: stored.pos || { ...defaultPosSettings },
  language: stored.language || { ...defaultLanguageSettings },
  loyalty: stored.loyalty || { ...DEFAULT_LOYALTY_SETTINGS },
  isLoading: false,
  error: null,
};

export const fetchSettingsFromSupabase = createAsyncThunk(
  'settings/fetchFromSupabase',
  async (tenantId: string, { rejectWithValue }) => {
    try {
      const [tenantSettings, categories, brands, seasons, sizes, sizeGroups] = await Promise.all([
        fetchTenantSettings(tenantId),
        fetchCategories(tenantId),
        fetchBrands(tenantId),
        fetchSeasons(tenantId),
        fetchSizes(tenantId),
        fetchSizeGroups(tenantId),
      ]);

      const hasData = !!tenantSettings && (categories.length > 0 || brands.length > 0 || seasons.length > 0 || sizes.length > 0);

      return {
        tenantSettings,
        categories: categories.length > 0 ? categories : undefined,
        brands: brands.length > 0 ? brands : undefined,
        seasons: seasons.length > 0 ? seasons : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        sizeGroups: sizeGroups.length > 0 ? sizeGroups : undefined,
        hasData,
        tenantId,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch settings');
    }
  }
);

export const syncCategoriesToSupabase = createAsyncThunk(
  'settings/syncCategories',
  async ({ tenantId, categories }: { tenantId: string; categories: CategoryGroup[] }, { rejectWithValue }) => {
    try {
      const success = await syncCategories(tenantId, categories);
      if (!success) return rejectWithValue('Failed to sync categories');
      return categories;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to sync categories');
    }
  }
);

export const syncBrandsToSupabase = createAsyncThunk(
  'settings/syncBrands',
  async ({ tenantId, brands }: { tenantId: string; brands: string[] }, { rejectWithValue }) => {
    try {
      const success = await syncBrands(tenantId, brands);
      if (!success) return rejectWithValue('Failed to sync brands');
      return brands;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to sync brands');
    }
  }
);

export const syncSeasonsToSupabase = createAsyncThunk(
  'settings/syncSeasons',
  async ({ tenantId, seasons }: { tenantId: string; seasons: string[] }, { rejectWithValue }) => {
    try {
      const success = await syncSeasons(tenantId, seasons);
      if (!success) return rejectWithValue('Failed to sync seasons');
      return seasons;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to sync seasons');
    }
  }
);

export const syncSizesToSupabase = createAsyncThunk(
  'settings/syncSizes',
  async ({ tenantId, sizes }: { tenantId: string; sizes: string[] }, { rejectWithValue }) => {
    try {
      const success = await syncSizes(tenantId, sizes);
      if (!success) return rejectWithValue('Failed to sync sizes');
      return sizes;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to sync sizes');
    }
  }
);

export const syncSizeGroupsToSupabase = createAsyncThunk(
  'settings/syncSizeGroups',
  async ({ tenantId, sizeGroups }: { tenantId: string; sizeGroups: SizeGroup[] }, { rejectWithValue }) => {
    try {
      const success = await syncSizeGroups(tenantId, sizeGroups);
      if (!success) return rejectWithValue('Failed to sync size groups');
      return sizeGroups;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to sync size groups');
    }
  }
);

export const addCategoryAsync = createAsyncThunk(
  'settings/addCategory',
  async ({ tenantId, name, subcategories = [] }: { tenantId: string; name: string; subcategories?: string[] }, { rejectWithValue }) => {
    try {
      const success = await addCategory(tenantId, name, subcategories);
      if (!success) return rejectWithValue('Failed to add category');
      const categoryGroup: CategoryGroup = { name, subcategories };
      return categoryGroup;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add category');
    }
  }
);

export const updateCategoryAsync = createAsyncThunk(
  'settings/updateCategory',
  async ({ tenantId, oldName, newName }: { tenantId: string; oldName: string; newName: string }, { rejectWithValue }) => {
    try {
      const success = await renameCategory(tenantId, oldName, newName);
      if (!success) return rejectWithValue('Failed to rename category');
      return { oldName, newName };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to rename category');
    }
  }
);

export const removeCategoryAsync = createAsyncThunk(
  'settings/removeCategory',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await removeCategory(tenantId, name);
      if (!success) return rejectWithValue('Failed to remove category');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove category');
    }
  }
);

export const addBrandAsync = createAsyncThunk(
  'settings/addBrand',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await addBrand(tenantId, name);
      if (!success) return rejectWithValue('Failed to add brand');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add brand');
    }
  }
);

export const removeBrandAsync = createAsyncThunk(
  'settings/removeBrand',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await removeBrand(tenantId, name);
      if (!success) return rejectWithValue('Failed to remove brand');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove brand');
    }
  }
);

export const addSeasonAsync = createAsyncThunk(
  'settings/addSeason',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await addSeason(tenantId, name);
      if (!success) return rejectWithValue('Failed to add season');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add season');
    }
  }
);

export const removeSeasonAsync = createAsyncThunk(
  'settings/removeSeason',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await removeSeason(tenantId, name);
      if (!success) return rejectWithValue('Failed to remove season');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove season');
    }
  }
);

export const addSizeAsync = createAsyncThunk(
  'settings/addSize',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await addSize(tenantId, name);
      if (!success) return rejectWithValue('Failed to add size');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add size');
    }
  }
);

export const removeSizeAsync = createAsyncThunk(
  'settings/removeSize',
  async ({ tenantId, name }: { tenantId: string; name: string }, { rejectWithValue }) => {
    try {
      const success = await removeSize(tenantId, name);
      if (!success) return rejectWithValue('Failed to remove size');
      return name;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove size');
    }
  }
);

export const addSizeGroupAsync = createAsyncThunk(
  'settings/addSizeGroup',
  async ({ tenantId, group }: { tenantId: string; group: SizeGroup }, { rejectWithValue }) => {
    try {
      const success = await addSizeGroup(tenantId, group);
      if (!success) return rejectWithValue('Failed to add size group');
      return group;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to add size group');
    }
  }
);

export const updateSizeGroupAsync = createAsyncThunk(
  'settings/updateSizeGroup',
  async ({ tenantId, group }: { tenantId: string; group: SizeGroup }, { rejectWithValue }) => {
    try {
      const success = await updateSizeGroup(tenantId, group);
      if (!success) return rejectWithValue('Failed to update size group');
      return group;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update size group');
    }
  }
);

export const removeSizeGroupAsync = createAsyncThunk(
  'settings/removeSizeGroup',
  async ({ tenantId, id }: { tenantId: string; id: string }, { rejectWithValue }) => {
    try {
      const success = await removeSizeGroupById(tenantId, id);
      if (!success) return rejectWithValue('Failed to remove size group');
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to remove size group');
    }
  }
);

export const updateTaxSettingsAsync = createAsyncThunk(
  'settings/updateTaxSettings',
  async ({ tenantId, tax }: { tenantId: string; tax: TaxSettings }, { rejectWithValue }) => {
    try {
      const success = await updateTaxSettingsSupabase(tenantId, tax);
      if (!success) return rejectWithValue('Failed to update tax settings');
      return tax;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update tax settings');
    }
  }
);

export const updateStoreSettingsAsync = createAsyncThunk(
  'settings/updateStoreSettings',
  async ({ tenantId, store }: { tenantId: string; store: StoreSettings }, { rejectWithValue }) => {
    try {
      const success = await updateStoreSettingsSupabase(tenantId, store);
      if (!success) return rejectWithValue('Failed to update store settings');
      return store;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update store settings');
    }
  }
);

export const updatePosSettingsAsync = createAsyncThunk(
  'settings/updatePosSettings',
  async ({ tenantId, pos }: { tenantId: string; pos: PosSettings }, { rejectWithValue }) => {
    try {
      const success = await updatePosSettingsSupabase(tenantId, pos);
      if (!success) return rejectWithValue('Failed to update POS settings');
      return pos;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update POS settings');
    }
  }
);

export const updateLanguageSettingsAsync = createAsyncThunk(
  'settings/updateLanguageSettings',
  async ({ tenantId, language }: { tenantId: string; language: LanguageSettings }, { rejectWithValue }) => {
    try {
      const success = await updateLanguageSettingsSupabase(tenantId, language);
      if (!success) return rejectWithValue('Failed to update language settings');
      return language;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update language settings');
    }
  }
);

export const updateLoyaltySettingsAsync = createAsyncThunk(
  'settings/updateLoyaltySettings',
  async ({ tenantId, loyalty }: { tenantId: string; loyalty: LoyaltySettings }, { rejectWithValue }) => {
    try {
      const success = await updateLoyaltySettingsSupabase(tenantId, loyalty);
      if (!success) return rejectWithValue('Failed to update loyalty settings');
      return loyalty;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update loyalty settings');
    }
  }
);

export const upsertTenantSettingsAsync = createAsyncThunk(
  'settings/upsertTenantSettings',
  async ({ tenantId, settings }: { tenantId: string; settings: Omit<SettingsState, 'isLoading' | 'error'> }, { rejectWithValue }) => {
    try {
      const success = await upsertTenantSettings(tenantId, settings);
      if (!success) return rejectWithValue('Failed to upsert tenant settings');
      return settings;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to upsert tenant settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTaxSettings: (state, action: PayloadAction<Partial<TaxSettings>>) => {
      state.tax = { ...state.tax, ...action.payload };
    },
    updateStoreSettings: (state, action: PayloadAction<Partial<StoreSettings>>) => {
      state.store = { ...state.store, ...action.payload };
    },
    updatePosSettings: (state, action: PayloadAction<Partial<PosSettings>>) => {
      state.pos = { ...state.pos, ...action.payload };
    },
    updateLanguageSettings: (state, action: PayloadAction<Partial<LanguageSettings>>) => {
      state.language = { ...state.language, ...action.payload };
    },
    resetTaxSettings: (state) => {
      state.tax = { ...defaultTaxSettings };
    },
    resetStoreSettings: (state) => {
      state.store = { ...defaultStoreSettings };
    },
    resetPosSettings: (state) => {
      state.pos = { ...defaultPosSettings };
    },
    resetLanguageSettings: (state) => {
      state.language = { ...defaultLanguageSettings };
    },
    updateLoyaltySettings: (state, action: PayloadAction<Partial<LoyaltySettings>>) => {
      state.loyalty = { ...state.loyalty, ...action.payload };
    },
    resetLoyaltySettings: (state) => {
      state.loyalty = { ...DEFAULT_LOYALTY_SETTINGS };
    },
    updateShifts: (state, action: PayloadAction<string[]>) => {
      state.pos.shifts = action.payload;
    },
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettingsFromSupabase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettingsFromSupabase.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.tenantSettings) {
          state.tax = action.payload.tenantSettings.tax;
          state.store = action.payload.tenantSettings.store;
          state.language = action.payload.tenantSettings.language;
          state.loyalty = action.payload.tenantSettings.loyalty;
          state.pos = { ...state.pos, ...action.payload.tenantSettings.pos };
        }
        if (action.payload.categories) {
          state.pos.categories = normalizeCategories(action.payload.categories);
        }
        if (action.payload.brands) {
          state.pos.brands = action.payload.brands;
        }
        if (action.payload.seasons) {
          state.pos.seasons = action.payload.seasons;
        }
        if (action.payload.sizes) {
          state.pos.sizes = action.payload.sizes;
        }
        if (action.payload.sizeGroups) {
          state.pos.sizeGroups = action.payload.sizeGroups;
        }
      })
      .addCase(fetchSettingsFromSupabase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch settings';
      })

      .addCase(syncCategoriesToSupabase.fulfilled, (state, action) => {
        state.pos.categories = action.payload;
      })
      .addCase(syncCategoriesToSupabase.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to sync categories';
      })

      .addCase(syncBrandsToSupabase.fulfilled, (state, action) => {
        state.pos.brands = action.payload;
      })
      .addCase(syncBrandsToSupabase.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to sync brands';
      })

      .addCase(syncSeasonsToSupabase.fulfilled, (state, action) => {
        state.pos.seasons = action.payload;
      })
      .addCase(syncSeasonsToSupabase.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to sync seasons';
      })

      .addCase(syncSizesToSupabase.fulfilled, (state, action) => {
        state.pos.sizes = action.payload;
      })
      .addCase(syncSizesToSupabase.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to sync sizes';
      })

      .addCase(syncSizeGroupsToSupabase.fulfilled, (state, action) => {
        state.pos.sizeGroups = action.payload;
      })
      .addCase(syncSizeGroupsToSupabase.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to sync size groups';
      })

      .addCase(addCategoryAsync.fulfilled, (state, action) => {
        if (!state.pos.categories.some(c => c.name === action.payload.name)) {
          state.pos.categories = [...state.pos.categories, action.payload];
        }
      })
      .addCase(addCategoryAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to add category';
      })

      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        state.pos.categories = state.pos.categories.map(c =>
          c.name === action.payload.oldName ? { ...c, name: action.payload.newName } : c
        );
      })
      .addCase(updateCategoryAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to rename category';
      })

      .addCase(removeCategoryAsync.fulfilled, (state, action) => {
        state.pos.categories = state.pos.categories.filter(c => c.name !== action.payload);
      })
      .addCase(removeCategoryAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to remove category';
      })

      .addCase(addBrandAsync.fulfilled, (state, action) => {
        if (!state.pos.brands.includes(action.payload)) {
          state.pos.brands = [...state.pos.brands, action.payload];
        }
      })
      .addCase(addBrandAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to add brand';
      })

      .addCase(removeBrandAsync.fulfilled, (state, action) => {
        state.pos.brands = state.pos.brands.filter(b => b !== action.payload);
      })
      .addCase(removeBrandAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to remove brand';
      })

      .addCase(addSeasonAsync.fulfilled, (state, action) => {
        if (!state.pos.seasons.includes(action.payload)) {
          state.pos.seasons = [...state.pos.seasons, action.payload];
        }
      })
      .addCase(addSeasonAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to add season';
      })

      .addCase(removeSeasonAsync.fulfilled, (state, action) => {
        state.pos.seasons = state.pos.seasons.filter(s => s !== action.payload);
      })
      .addCase(removeSeasonAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to remove season';
      })

      .addCase(addSizeAsync.fulfilled, (state, action) => {
        if (!state.pos.sizes.includes(action.payload)) {
          state.pos.sizes = [...state.pos.sizes, action.payload];
        }
      })
      .addCase(addSizeAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to add size';
      })

      .addCase(removeSizeAsync.fulfilled, (state, action) => {
        state.pos.sizes = state.pos.sizes.filter(s => s !== action.payload);
      })
      .addCase(removeSizeAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to remove size';
      })

      .addCase(addSizeGroupAsync.fulfilled, (state, action) => {
        const exists = state.pos.sizeGroups.find(g => g.id === action.payload.id);
        if (!exists) {
          state.pos.sizeGroups = [...state.pos.sizeGroups, action.payload];
        }
      })
      .addCase(addSizeGroupAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to add size group';
      })

      .addCase(updateSizeGroupAsync.fulfilled, (state, action) => {
        const idx = state.pos.sizeGroups.findIndex(g => g.id === action.payload.id);
        if (idx !== -1) {
          state.pos.sizeGroups[idx] = action.payload;
        }
      })
      .addCase(updateSizeGroupAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update size group';
      })

      .addCase(removeSizeGroupAsync.fulfilled, (state, action) => {
        state.pos.sizeGroups = state.pos.sizeGroups.filter(g => g.id !== action.payload);
      })
      .addCase(removeSizeGroupAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to remove size group';
      })

      .addCase(updateTaxSettingsAsync.fulfilled, (state, action) => {
        state.tax = action.payload;
      })
      .addCase(updateTaxSettingsAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update tax settings';
      })

      .addCase(updateStoreSettingsAsync.fulfilled, (state, action) => {
        state.store = action.payload;
      })
      .addCase(updateStoreSettingsAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update store settings';
      })

      .addCase(updatePosSettingsAsync.fulfilled, (state, action) => {
        state.pos = { ...state.pos, ...action.payload };
      })
      .addCase(updatePosSettingsAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update POS settings';
      })

      .addCase(updateLanguageSettingsAsync.fulfilled, (state, action) => {
        state.language = action.payload;
      })
      .addCase(updateLanguageSettingsAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update language settings';
      })

      .addCase(updateLoyaltySettingsAsync.fulfilled, (state, action) => {
        state.loyalty = action.payload;
      })
      .addCase(updateLoyaltySettingsAsync.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update loyalty settings';
      });
  },
});

export const {
  updateTaxSettings,
  updateStoreSettings,
  updatePosSettings,
  updateLanguageSettings,
  resetTaxSettings,
  resetStoreSettings,
  resetPosSettings,
  resetLanguageSettings,
  updateLoyaltySettings,
  resetLoyaltySettings,
  updateShifts,
  clearSettingsError,
} = settingsSlice.actions;

export default settingsSlice.reducer;

export const selectTaxSettings = (state: RootState): TaxSettings => state.settings.tax;
export const selectStoreSettings = (state: RootState): StoreSettings => state.settings.store;
export const selectPosSettings = (state: RootState): PosSettings => state.settings.pos;

export const selectTaxRate = (state: RootState): number => state.settings.tax.taxRate;
export const selectTaxName = (state: RootState): string => state.settings.tax.taxName;
export const selectTaxIncludedInPrice = (state: RootState): boolean => state.settings.tax.taxIncludedInPrice;
export const selectTaxRegistrationNumber = (state: RootState): string => state.settings.tax.taxRegistrationNumber;

export const selectTaxLabel = (state: RootState): string => {
  const { taxName, taxRate } = state.settings.tax;
  return `${taxName} (${(taxRate * 100).toFixed(0)}%)`;
};

export const selectStoreName = (state: RootState): string => state.settings.store.storeName;
export const selectStoreAddress = (state: RootState): string => state.settings.store.storeAddress;
export const selectStorePhone = (state: RootState): string => state.settings.store.storePhone;
export const selectStoreEmail = (state: RootState): string => state.settings.store.storeEmail;
export const selectReceiptFooterMessage = (state: RootState): string => state.settings.store.receiptFooterMessage;

export const selectDefaultPaymentMethod = (state: RootState): PaymentMethod => state.settings.pos.defaultPaymentMethod;
export const selectDefaultCategory = (state: RootState): string => state.settings.pos.defaultCategory;
export const selectCategoryGroups = (state: RootState): CategoryGroup[] => state.settings.pos.categories;
export const selectCategories = createSelector(
  [selectCategoryGroups],
  (groups): string[] => groups.map(c => c.name)
);
export const selectBrands = (state: RootState): string[] => state.settings.pos.brands;
export const selectSeasons = (state: RootState): string[] => state.settings.pos.seasons;
export const selectSizes = (state: RootState): string[] => state.settings.pos.sizes;
export const selectSizeGroups = (state: RootState) => state.settings.pos.sizeGroups;
export const selectWalkInCustomerLabel = (state: RootState): string => state.settings.pos.walkInCustomerLabel;
export const selectOrderNumberPrefix = (state: RootState): string => state.settings.pos.orderNumberPrefix;
export const selectOrderNumberSeed = (state: RootState): number => state.settings.pos.orderNumberSeed;
export const selectEnableManualProduct = (state: RootState): boolean => state.settings.pos.enableManualProduct;
export const selectMultiTerminalMode = (state: RootState): boolean => state.settings.pos.multiTerminalMode;
export const selectTerminalId = (state: RootState): string | undefined => state.settings.pos.terminalId;
export const selectTicketConfig = (state: RootState): TicketConfig => state.settings.pos.ticketConfig;
export const selectMaxSaleWindows = (state: RootState): number => state.settings.pos.maxSaleWindows;
export const selectRefundSettings = (state: RootState) => state.settings.pos.refundSettings;
export const selectTicketSize = (state: RootState): '58mm' | '80mm' => state.settings.pos.ticketSize;

export const selectFormattedOrderNumber = (state: RootState): string =>
  `${state.settings.pos.orderNumberPrefix}${state.sales.nextOrderNumber}`;

export const selectLanguage = (state: RootState): Language => state.settings.language.language;

export const selectLoyaltySettings = (state: RootState): LoyaltySettings => state.settings.loyalty;
export const selectPointsPerEuro = (state: RootState): number => state.settings.loyalty.pointsPerEuro;
export const selectLoyaltyTiers = (state: RootState) => state.settings.loyalty.tiers;

export const selectShifts = (state: RootState): string[] => state.settings.pos.shifts;

export const selectSettingsLoading = (state: RootState): boolean => (state.settings as any).isLoading || false;
export const selectSettingsError = (state: RootState): string | null => (state.settings as any).error || null;
