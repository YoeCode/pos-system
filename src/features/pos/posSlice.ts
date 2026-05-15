import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, PaymentMethod, Product, SaleWindow, CashBoxClosure } from '../../types';
import type { RootState } from '../../app/store';

const CASH_BOX_KEY = 'nexopos_cash_box';
const WINDOWS_KEY = 'nexopos_sale_windows';
const WINDOWS_TTL_HOURS = 24;

interface CashBoxState {
  isOpen: boolean;
  employeeIds: string[];
  openDate: string | null;
}

const isValidUuid = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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
          return {
            ...parsed,
            employeeIds: parsed.employeeIds.filter(isValidUuid),
          };
        }
      }
    }
  } catch { return { isOpen: false, employeeIds: [], openDate: null }; }
  return { isOpen: false, employeeIds: [], openDate: null };
};

const saveCashBoxToStorage = (state: CashBoxState): void => {
  try {
    if (state.isOpen) {
      localStorage.setItem(CASH_BOX_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(CASH_BOX_KEY);
    }
  } catch {}
};

interface StoredWindows {
  windows: SaleWindow[];
  activeWindowId: string | null;
  nextWindowNumber: number;
  savedAt: string;
}

const loadWindowsFromStorage = (): { windows: SaleWindow[]; activeWindowId: string | null; nextWindowNumber: number } => {
  try {
    const stored = localStorage.getItem(WINDOWS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredWindows;
      const savedAt = new Date(parsed.savedAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < WINDOWS_TTL_HOURS && parsed.windows && parsed.windows.length > 0) {
        return {
          windows: parsed.windows,
          activeWindowId: parsed.activeWindowId,
          nextWindowNumber: parsed.nextWindowNumber,
        };
      }
    }
  } catch {}
  return { windows: [], activeWindowId: null, nextWindowNumber: 1 };
};

const saveWindowsToStorage = (state: { windows: SaleWindow[]; activeWindowId: string | null; nextWindowNumber: number }): void => {
  try {
    if (state.windows.length > 0) {
      const toStore: StoredWindows = {
        windows: state.windows,
        activeWindowId: state.activeWindowId,
        nextWindowNumber: state.nextWindowNumber,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(WINDOWS_KEY, JSON.stringify(toStore));
    } else {
      localStorage.removeItem(WINDOWS_KEY);
    }
  } catch {}
};

const CLOSURES_KEY = 'nexopos_closures';

const loadClosuresFromStorage = (): CashBoxClosure[] => {
  try {
    const stored = localStorage.getItem(CLOSURES_KEY);
    if (stored) return JSON.parse(stored) as CashBoxClosure[];
  } catch {}
  return [];
};

const saveClosuresToStorage = (closures: CashBoxClosure[]): void => {
  try {
    localStorage.setItem(CLOSURES_KEY, JSON.stringify(closures));
  } catch {}
};

const storedCashBox = loadCashBoxFromStorage();
const storedWindows = loadWindowsFromStorage();
const storedClosures = loadClosuresFromStorage();

const createDefaultWindow = (num: number): SaleWindow => ({
  id: crypto.randomUUID(),
  name: `Venta ${num}`,
  cart: [],
  selectedCustomerId: null,
  paymentMethod: 'cash',
  itemDiscounts: {},
  manualDiscount: 0,
  pointsToRedeem: 0,
  createdAt: new Date().toISOString(),
});

const initialWindows = storedWindows.windows.length > 0
  ? storedWindows.windows
  : [createDefaultWindow(1)];

const initialActiveWindowId = storedWindows.activeWindowId ?? initialWindows[0].id;

interface PosState {
  windows: SaleWindow[];
  activeWindowId: string | null;
  nextWindowNumber: number;
  selectedCategory: string;
  searchQuery: string;
  currentEmployeeId: string | null;
  isCashBoxOpen: boolean;
  cashBoxEmployeeIds: string[];
  cashBoxOpenTime: string | null;
  closures: CashBoxClosure[];
}

const initialState: PosState = {
  windows: initialWindows,
  activeWindowId: initialActiveWindowId,
  nextWindowNumber: storedWindows.windows.length > 0 ? storedWindows.nextWindowNumber : 2,
  selectedCategory: 'All Items',
  searchQuery: '',
  currentEmployeeId: null,
  isCashBoxOpen: storedCashBox.isOpen,
  cashBoxEmployeeIds: storedCashBox.employeeIds,
  cashBoxOpenTime: storedCashBox.openDate,
  closures: storedClosures,
};

const getActiveWindow = (state: PosState): SaleWindow | undefined => {
  if (!state.activeWindowId) return undefined;
  return state.windows.find(w => w.id === state.activeWindowId);
};

const updateActiveWindow = (state: PosState, updater: (window: SaleWindow) => void): void => {
  const window = getActiveWindow(state);
  if (window) {
    updater(window);
    saveWindowsToStorage({ windows: state.windows, activeWindowId: state.activeWindowId, nextWindowNumber: state.nextWindowNumber });
  }
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    createWindow: (state) => {
      const newWindow = createDefaultWindow(state.nextWindowNumber);
      state.windows.push(newWindow);
      state.activeWindowId = newWindow.id;
      state.nextWindowNumber += 1;
      saveWindowsToStorage({ windows: state.windows, activeWindowId: state.activeWindowId, nextWindowNumber: state.nextWindowNumber });
    },
    closeWindow: (state, action: PayloadAction<string>) => {
      const windowId = action.payload;
      state.windows = state.windows.filter(w => w.id !== windowId);
      if (state.activeWindowId === windowId) {
        state.activeWindowId = state.windows.length > 0 ? state.windows[state.windows.length - 1].id : null;
      }
      if (state.windows.length === 0) {
        const newWindow = createDefaultWindow(state.nextWindowNumber);
        state.windows.push(newWindow);
        state.activeWindowId = newWindow.id;
        state.nextWindowNumber += 1;
      }
      saveWindowsToStorage({ windows: state.windows, activeWindowId: state.activeWindowId, nextWindowNumber: state.nextWindowNumber });
    },
    setActiveWindow: (state, action: PayloadAction<string>) => {
      if (state.windows.find(w => w.id === action.payload)) {
        state.activeWindowId = action.payload;
        saveWindowsToStorage({ windows: state.windows, activeWindowId: state.activeWindowId, nextWindowNumber: state.nextWindowNumber });
      }
    },
    addToCart: (state, action: PayloadAction<{ product: Product; size?: string }>) => {
      const { product, size } = action.payload;
      updateActiveWindow(state, (window) => {
        const existing = window.cart.find(item => item.product.id === product.id && item.selectedSize === size);
        if (existing) {
          existing.quantity += 1;
        } else {
          window.cart.push({ product, quantity: 1, lineId: crypto.randomUUID(), selectedSize: size });
        }
      });
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      updateActiveWindow(state, (window) => {
        window.cart = window.cart.filter(item => item.lineId !== action.payload);
      });
    },
    updateQuantity: (state, action: PayloadAction<{ lineId: string; quantity: number }>) => {
      updateActiveWindow(state, (window) => {
        const item = window.cart.find(i => i.lineId === action.payload.lineId);
        if (item) {
          if (action.payload.quantity <= 0) {
            window.cart = window.cart.filter(i => i.lineId !== action.payload.lineId);
          } else {
            item.quantity = action.payload.quantity;
          }
        }
      });
    },
    splitLine: (state, action: PayloadAction<string>) => {
      updateActiveWindow(state, (window) => {
        const item = window.cart.find(i => i.lineId === action.payload);
        if (item && item.quantity > 1) {
          item.quantity -= 1;
          window.cart.push({ product: item.product, quantity: 1, lineId: crypto.randomUUID() });
        }
      });
    },
    clearCart: (state) => {
      updateActiveWindow(state, (window) => {
        window.cart = [];
        window.pointsToRedeem = 0;
      });
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      updateActiveWindow(state, (window) => {
        window.paymentMethod = action.payload;
      });
    },
    setSelectedCustomer: (state, action: PayloadAction<string | null>) => {
      updateActiveWindow(state, (window) => {
        window.selectedCustomerId = action.payload;
      });
    },
    startNewSale: (state) => {
      updateActiveWindow(state, (window) => {
        window.cart = [];
        window.selectedCustomerId = null;
        window.itemDiscounts = {};
        window.manualDiscount = 0;
        window.pointsToRedeem = 0;
      });
    },
    setPointsToRedeem: (state, action: PayloadAction<number>) => {
      updateActiveWindow(state, (window) => {
        window.pointsToRedeem = Math.max(0, action.payload);
      });
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
      updateActiveWindow(state, (window) => {
        const existing = window.cart.find(item => item.product.id === customProduct.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          window.cart.push({ product: customProduct, quantity: 1, lineId: crypto.randomUUID() });
        }
      });
    },
    setWindowItemDiscounts: (state, action: PayloadAction<Record<string, number>>) => {
      updateActiveWindow(state, (window) => {
        window.itemDiscounts = action.payload;
      });
    },
    setWindowManualDiscount: (state, action: PayloadAction<number>) => {
      updateActiveWindow(state, (window) => {
        window.manualDiscount = action.payload;
      });
    },
    setCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
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
    addCashBoxEmployee: (state, action: PayloadAction<string>) => {
      if (!state.cashBoxEmployeeIds.includes(action.payload)) {
        state.cashBoxEmployeeIds.push(action.payload);
        saveCashBoxToStorage({
          isOpen: true,
          employeeIds: state.cashBoxEmployeeIds,
          openDate: state.cashBoxOpenTime,
        });
      }
    },
    removeCashBoxEmployee: (state, action: PayloadAction<string>) => {
      state.cashBoxEmployeeIds = state.cashBoxEmployeeIds.filter(id => id !== action.payload);
      if (state.currentEmployeeId === action.payload) {
        state.currentEmployeeId = null;
      }
      saveCashBoxToStorage({
        isOpen: true,
        employeeIds: state.cashBoxEmployeeIds,
        openDate: state.cashBoxOpenTime,
      });
    },
    closeCashBox: (state) => {
      state.isCashBoxOpen = false;
      state.cashBoxEmployeeIds = [];
      state.cashBoxOpenTime = null;
      state.currentEmployeeId = null;
      const newWindow = createDefaultWindow(1);
      state.windows = [newWindow];
      state.activeWindowId = newWindow.id;
      state.nextWindowNumber = 2;
      saveCashBoxToStorage({
        isOpen: false,
        employeeIds: [],
        openDate: null,
      });
      saveWindowsToStorage({ windows: state.windows, activeWindowId: state.activeWindowId, nextWindowNumber: state.nextWindowNumber });
    },
    closeCashBoxWithClosure: (state, action: PayloadAction<CashBoxClosure>) => {
      state.closures.push(action.payload);
      saveClosuresToStorage(state.closures);
      state.isCashBoxOpen = false;
      state.cashBoxEmployeeIds = [];
      state.cashBoxOpenTime = null;
      state.currentEmployeeId = null;
      const newWindow = createDefaultWindow(1);
      state.windows = [newWindow];
      state.activeWindowId = newWindow.id;
      state.nextWindowNumber = 2;
      saveCashBoxToStorage({
        isOpen: false,
        employeeIds: [],
        openDate: null,
      });
      saveWindowsToStorage({ windows: state.windows, activeWindowId: state.activeWindowId, nextWindowNumber: state.nextWindowNumber });
    },
  },
});

export const {
  addToCart, removeFromCart, updateQuantity, splitLine, clearCart,
  setPaymentMethod, setCategory, addCustomProductToCart, setSelectedCustomer,
  startNewSale, setSearchQuery, setCurrentEmployee, openCashBox,
  addCashBoxEmployee, removeCashBoxEmployee, closeCashBox, closeCashBoxWithClosure,
  createWindow, closeWindow, setActiveWindow,
  setWindowItemDiscounts, setWindowManualDiscount,
  setPointsToRedeem,
} = posSlice.actions;
export default posSlice.reducer;

export const selectIsCashBoxOpen = (state: RootState): boolean => state.pos.isCashBoxOpen;
export const selectCashBoxEmployeeIds = (state: RootState): string[] => state.pos.cashBoxEmployeeIds;
export const selectWorkingEmployees = (state: RootState): string[] => state.pos.cashBoxEmployeeIds;
export const selectCashBoxOpenTime = (state: RootState): string | null => state.pos.cashBoxOpenTime;

export const selectWindows = (state: RootState): SaleWindow[] => state.pos.windows;
export const selectActiveWindowId = (state: RootState): string | null => state.pos.activeWindowId;
export const selectActiveWindow = (state: RootState): SaleWindow | undefined => {
  if (!state.pos.activeWindowId) return undefined;
  return state.pos.windows.find(w => w.id === state.pos.activeWindowId);
};
export const selectActiveWindowCart = (state: RootState): CartItem[] => {
  const window = selectActiveWindow(state);
  return window?.cart ?? [];
};
export const selectActiveWindowPaymentMethod = (state: RootState): PaymentMethod => {
  const window = selectActiveWindow(state);
  return window?.paymentMethod ?? 'cash';
};
export const selectActiveWindowCustomerId = (state: RootState): string | null => {
  const window = selectActiveWindow(state);
  return window?.selectedCustomerId ?? null;
};
export const selectActiveWindowItemDiscounts = (state: RootState): Record<string, number> => {
  const window = selectActiveWindow(state);
  return window?.itemDiscounts ?? {};
};
export const selectActiveWindowManualDiscount = (state: RootState): number => {
  const window = selectActiveWindow(state);
  return window?.manualDiscount ?? 0;
};
export const selectActiveWindowPointsToRedeem = (state: RootState): number => {
  const window = selectActiveWindow(state);
  return window?.pointsToRedeem ?? 0;
};
export const selectCanCreateWindow = (state: RootState): boolean => {
  const max = state.settings.pos.maxSaleWindows;
  return state.pos.windows.length < max;
};

export const selectClosures = (state: RootState): CashBoxClosure[] => state.pos.closures;

export const selectLastClosure = (state: RootState): CashBoxClosure | undefined => {
  const closures = state.pos.closures;
  return closures.length > 0 ? closures[closures.length - 1] : undefined;
};
