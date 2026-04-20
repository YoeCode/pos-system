import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { PaymentMethod, TaxSettings, StoreSettings, PosSettings, SettingsState } from '../../types';
import type { RootState } from '../../app/store';

// ─── Default Constants (exported for use by mock data generators) ─────────────

export const DEFAULT_TAX_RATE = 0.21;
export const DEFAULT_TAX_NAME = 'Tax';
export const DEFAULT_STORE_NAME = 'Casa Lis';
export const DEFAULT_ORDER_PREFIX = 'ORD-';
export const DEFAULT_ORDER_SEED = 1042;

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
  walkInCustomerLabel: 'Walk-In Customer',
  orderNumberPrefix: DEFAULT_ORDER_PREFIX,
  orderNumberSeed: DEFAULT_ORDER_SEED,
};

// ─── localStorage Persistence ─────────────────────────────────────────────────

const SETTINGS_STORAGE_KEY = 'pos_settings';

const loadStoredSettings = (): SettingsState => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        tax: { ...defaultTaxSettings, ...parsed.tax },
        store: { ...defaultStoreSettings, ...parsed.store },
        pos: { ...defaultPosSettings, ...parsed.pos },
      };
    }
  } catch {
    try { localStorage.removeItem(SETTINGS_STORAGE_KEY); } catch { /* ignore */ }
  }
  return {
    tax: { ...defaultTaxSettings },
    store: { ...defaultStoreSettings },
    pos: { ...defaultPosSettings },
  };
};

const initialState: SettingsState = loadStoredSettings();

// ─── Slice ────────────────────────────────────────────────────────────────────

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTaxSettings: (state, action: PayloadAction<Partial<TaxSettings>>) => {
      state.tax = { ...state.tax, ...action.payload };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updateStoreSettings: (state, action: PayloadAction<Partial<StoreSettings>>) => {
      state.store = { ...state.store, ...action.payload };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updatePosSettings: (state, action: PayloadAction<Partial<PosSettings>>) => {
      state.pos = { ...state.pos, ...action.payload };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    resetTaxSettings: (state) => {
      state.tax = { ...defaultTaxSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    resetStoreSettings: (state) => {
      state.store = { ...defaultStoreSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    resetPosSettings: (state) => {
      state.pos = { ...defaultPosSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
  },
});

export const {
  updateTaxSettings,
  updateStoreSettings,
  updatePosSettings,
  resetTaxSettings,
  resetStoreSettings,
  resetPosSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// ─── Section Selectors ────────────────────────────────────────────────────────

export const selectTaxSettings = (state: RootState): TaxSettings => state.settings.tax;
export const selectStoreSettings = (state: RootState): StoreSettings => state.settings.store;
export const selectPosSettings = (state: RootState): PosSettings => state.settings.pos;

// ─── Granular Tax Selectors ───────────────────────────────────────────────────

export const selectTaxRate = (state: RootState): number => state.settings.tax.taxRate;
export const selectTaxName = (state: RootState): string => state.settings.tax.taxName;
export const selectTaxIncludedInPrice = (state: RootState): boolean => state.settings.tax.taxIncludedInPrice;
export const selectTaxRegistrationNumber = (state: RootState): string => state.settings.tax.taxRegistrationNumber;

/** Composed display label: e.g. "Tax (21%)" or "IVA (10%)" */
export const selectTaxLabel = (state: RootState): string => {
  const { taxName, taxRate } = state.settings.tax;
  return `${taxName} (${(taxRate * 100).toFixed(0)}%)`;
};

// ─── Granular Store Selectors ─────────────────────────────────────────────────

export const selectStoreName = (state: RootState): string => state.settings.store.storeName;
export const selectStoreAddress = (state: RootState): string => state.settings.store.storeAddress;
export const selectStorePhone = (state: RootState): string => state.settings.store.storePhone;
export const selectStoreEmail = (state: RootState): string => state.settings.store.storeEmail;
export const selectReceiptFooterMessage = (state: RootState): string => state.settings.store.receiptFooterMessage;

// ─── Granular POS Selectors ───────────────────────────────────────────────────

export const selectDefaultPaymentMethod = (state: RootState): PaymentMethod => state.settings.pos.defaultPaymentMethod;
export const selectDefaultCategory = (state: RootState): string => state.settings.pos.defaultCategory;
export const selectWalkInCustomerLabel = (state: RootState): string => state.settings.pos.walkInCustomerLabel;
export const selectOrderNumberPrefix = (state: RootState): string => state.settings.pos.orderNumberPrefix;
export const selectOrderNumberSeed = (state: RootState): number => state.settings.pos.orderNumberSeed;

// ─── Cross-slice Composed Selector ────────────────────────────────────────────
// Uses type-only import of RootState to avoid circular runtime dependency.
// state.sales is accessed via the full RootState — settingsSlice reads sales but
// salesSlice does NOT import from settingsSlice (one-way dependency).

export const selectFormattedOrderNumber = (state: RootState): string =>
  `${state.settings.pos.orderNumberPrefix}${state.sales.nextOrderNumber}`;
