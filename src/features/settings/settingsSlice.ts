import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { PaymentMethod, TaxSettings, StoreSettings, PosSettings, LanguageSettings, SettingsState, Language, LoyaltySettings, TicketConfig, SizeGroup } from '../../types';
import type { RootState } from '../../app/store';

// ─── Default Constants (exported for use by mock data generators) ─────────────

export const DEFAULT_TAX_RATE = 0.21;
export const DEFAULT_TAX_NAME = 'Tax';
export const DEFAULT_STORE_NAME = 'Casa Lis';
export const DEFAULT_ORDER_PREFIX = 'ORD-';
export const DEFAULT_ORDER_SEED = 1042;
export const DEFAULT_BRANDS = ['Nestlé', 'Coca-Cola', 'Pepsi', 'Mondelez', 'Kellogg\'s'];
export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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
  categories: ['Electronics', 'Food', 'Drinks', 'Apparel', 'Bakery', 'Merchandise'],
  brands: DEFAULT_BRANDS,
  sizes: DEFAULT_SIZES,
  sizeGroups: DEFAULT_SIZE_GROUPS,
  walkInCustomerLabel: 'Walk-In Customer',
  orderNumberPrefix: DEFAULT_ORDER_PREFIX,
  orderNumberSeed: DEFAULT_ORDER_SEED,
  enableManualProduct: true,
  multiTerminalMode: false,
  ticketConfig: {
    showLogo: false,
    logoUrl: undefined,
    showEmployee: true,
    showStoreName: true,
    customHeader: undefined,
    customFooter: undefined,
  },
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
        language: { ...defaultLanguageSettings, ...parsed.language },
        loyalty: { ...DEFAULT_LOYALTY_SETTINGS, ...parsed.loyalty },
      };
    }
  } catch {
    try { localStorage.removeItem(SETTINGS_STORAGE_KEY); } catch { /* ignore */ }
  }
  return {
    tax: { ...defaultTaxSettings },
    store: { ...defaultStoreSettings },
    pos: { ...defaultPosSettings },
    language: { ...defaultLanguageSettings },
    loyalty: { ...DEFAULT_LOYALTY_SETTINGS },
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
    updateLanguageSettings: (state, action: PayloadAction<Partial<LanguageSettings>>) => {
      state.language = { ...state.language, ...action.payload };
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
    resetLanguageSettings: (state) => {
      state.language = { ...defaultLanguageSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updateLoyaltySettings: (state, action: PayloadAction<Partial<LoyaltySettings>>) => {
      state.loyalty = { ...state.loyalty, ...action.payload };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    resetLoyaltySettings: (state) => {
      state.loyalty = { ...DEFAULT_LOYALTY_SETTINGS };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updateCategories: (state, action: PayloadAction<string[]>) => {
      state.pos.categories = action.payload;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updateBrands: (state, action: PayloadAction<string[]>) => {
      state.pos.brands = action.payload;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updateSizes: (state, action: PayloadAction<string[]>) => {
      state.pos.sizes = action.payload;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    addSizeGroup: (state, action: PayloadAction<SizeGroup>) => {
      state.pos.sizeGroups.push(action.payload);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    updateSizeGroup: (state, action: PayloadAction<SizeGroup>) => {
      const idx = state.pos.sizeGroups.findIndex(g => g.id === action.payload.id);
      if (idx !== -1) state.pos.sizeGroups[idx] = action.payload;
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
    removeSizeGroup: (state, action: PayloadAction<string>) => {
      state.pos.sizeGroups = state.pos.sizeGroups.filter(g => g.id !== action.payload);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    },
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
  updateCategories,
  updateBrands,
  updateSizes,
  addSizeGroup,
  updateSizeGroup,
  removeSizeGroup,
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
export const selectCategories = (state: RootState): string[] => state.settings.pos.categories;
export const selectBrands = (state: RootState): string[] => state.settings.pos.brands;
export const selectSizes = (state: RootState): string[] => state.settings.pos.sizes;
export const selectSizeGroups = (state: RootState) => state.settings.pos.sizeGroups;
export const selectWalkInCustomerLabel = (state: RootState): string => state.settings.pos.walkInCustomerLabel;
export const selectOrderNumberPrefix = (state: RootState): string => state.settings.pos.orderNumberPrefix;
export const selectOrderNumberSeed = (state: RootState): number => state.settings.pos.orderNumberSeed;
export const selectEnableManualProduct = (state: RootState): boolean => state.settings.pos.enableManualProduct;
export const selectMultiTerminalMode = (state: RootState): boolean => state.settings.pos.multiTerminalMode;
export const selectTerminalId = (state: RootState): string | undefined => state.settings.pos.terminalId;
export const selectTicketConfig = (state: RootState): TicketConfig => state.settings.pos.ticketConfig;

// ─── Cross-slice Composed Selector ────────────────────────────────────────────
// Uses type-only import of RootState to avoid circular runtime dependency.
// state.sales is accessed via the full RootState — settingsSlice reads sales but
// salesSlice does NOT import from settingsSlice (one-way dependency).

export const selectFormattedOrderNumber = (state: RootState): string =>
  `${state.settings.pos.orderNumberPrefix}${state.sales.nextOrderNumber}`;

export const selectLanguage = (state: RootState): Language => state.settings.language.language;

// ─── Loyalty Selectors ────────────────────────────────────────────────────────

export const selectLoyaltySettings = (state: RootState): LoyaltySettings => state.settings.loyalty;
export const selectPointsPerEuro = (state: RootState): number => state.settings.loyalty.pointsPerEuro;
export const selectLoyaltyTiers = (state: RootState) => state.settings.loyalty.tiers;
