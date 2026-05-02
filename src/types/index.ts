export type UserRole = 'cashier' | 'supervisor' | 'manager' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  terminal?: string;
  avatar?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  cashier: ['pos'],
  supervisor: ['pos', 'products', 'reports', 'customers', 'inventory'],
  manager: ['pos', 'products', 'reports', 'employees', 'dashboard', 'customers', 'inventory'],
  admin: ['pos', 'products', 'reports', 'employees', 'dashboard', 'settings', 'customers', 'inventory'],
};

export interface ProductSize {
  size: string;
  stock: number;
  minStock?: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  image?: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  publishedOnline: boolean;
  version?: string;
  sizes?: ProductSize[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Cashier' | 'Supervisor' | 'Admin';
  shift: string;
  pin: string;
  active: boolean;
  permissions: {
    processSales: boolean;
    applyDiscounts: boolean;
    manageInventory: boolean;
    accessReports: boolean;
  };
  startDate: string;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyTierConfig {
  tier: LoyaltyTier;
  threshold: number;
  discountPct: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  active: boolean;
  loyaltyPoints: number;
  tier: LoyaltyTier;
  totalSpent: number;
  createdAt: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerEuro: number;
  tiers: LoyaltyTierConfig[];
}

export type PaymentMethod = 'cash' | 'card' | 'bizum';

export interface OrderItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  order: Order;
  paymentMethod: PaymentMethod;
  amountReceived: number | null;
  change: number | null;
  completedAt: string;
  employeeId?: string;
  terminalId?: string;
  customerId?: string;
  loyaltyPointsEarned: number;
  discountApplied: number;
}

export interface TaxSettings {
  taxRate: number;
  taxName: string;
  taxIncludedInPrice: boolean;
  taxRegistrationNumber: string;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  receiptFooterMessage: string;
}

export interface PosSettings {
  defaultPaymentMethod: PaymentMethod;
  defaultCategory: string;
  categories: string[];
  brands: string[];
  walkInCustomerLabel: string;
  orderNumberPrefix: string;
  orderNumberSeed: number;
  enableManualProduct: boolean;
  multiTerminalMode: boolean;
  terminalId?: string;
  ticketConfig: TicketConfig;
}

export interface TicketConfig {
  showLogo: boolean;
  logoUrl?: string;
  showEmployee: boolean;
  showStoreName: boolean;
  customHeader?: string;
  customFooter?: string;
}

export type Language = 'en' | 'es';

export interface LanguageSettings {
  language: Language;
}

export interface SettingsState {
  tax: TaxSettings;
  store: StoreSettings;
  pos: PosSettings;
  language: LanguageSettings;
  loyalty: LoyaltySettings;
}
