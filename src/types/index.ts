export type UserRole = 'cashier' | 'supervisor' | 'manager' | 'admin';
export type TenantRole = 'owner' | 'admin' | 'manager' | 'supervisor' | 'cashier';

export type Permission =
  | 'pos:sale'
  | 'pos:refund'
  | 'pos:discount'
  | 'pos:manual_product'
  | 'pos:checkout'
  | 'cashbox:open'
  | 'cashbox:close'
  | 'cashbox:add_employee'
  | 'cashbox:remove_employee'
  | 'product:view'
  | 'product:create'
  | 'product:edit'
  | 'product:delete'
  | 'inventory:view'
  | 'report:view'
  | 'report:export'
  | 'employee:view'
  | 'employee:manage'
  | 'customer:view'
  | 'customer:manage'
  | 'setting:view'
  | 'setting:edit'
  | 'dashboard:view';

export interface AuthUser {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId?: string;
  tenantRole?: TenantRole;
  terminal?: string;
  avatar?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  cashier: [
    'pos:sale',
    'pos:checkout',
    'cashbox:open',
    'customer:view',
  ],
  supervisor: [
    'pos:sale',
    'pos:checkout',
    'pos:refund',
    'pos:discount',
    'pos:manual_product',
    'cashbox:open',
    'cashbox:close',
    'cashbox:add_employee',
    'cashbox:remove_employee',
    'product:view',
    'inventory:view',
    'report:view',
    'customer:view',
    'customer:manage',
    'dashboard:view',
  ],
  manager: [
    'pos:sale',
    'pos:checkout',
    'pos:refund',
    'pos:discount',
    'pos:manual_product',
    'cashbox:open',
    'cashbox:close',
    'cashbox:add_employee',
    'cashbox:remove_employee',
    'product:view',
    'product:create',
    'product:edit',
    'inventory:view',
    'report:view',
    'report:export',
    'employee:view',
    'customer:view',
    'customer:manage',
    'setting:view',
    'dashboard:view',
  ],
  admin: [
    'pos:sale',
    'pos:checkout',
    'pos:refund',
    'pos:discount',
    'pos:manual_product',
    'cashbox:open',
    'cashbox:close',
    'cashbox:add_employee',
    'cashbox:remove_employee',
    'product:view',
    'product:create',
    'product:edit',
    'product:delete',
    'inventory:view',
    'report:view',
    'report:export',
    'employee:view',
    'employee:manage',
    'customer:view',
    'customer:manage',
    'setting:view',
    'setting:edit',
    'dashboard:view',
  ],
};

export const PAGE_PERMISSIONS: Record<string, Permission> = {
  '/pos': 'pos:sale',
  '/products': 'product:view',
  '/inventory': 'inventory:view',
  '/employees': 'employee:view',
  '/reports': 'report:view',
  '/settings': 'setting:view',
  '/customers': 'customer:view',
  '/dashboard': 'dashboard:view',
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
  sizeGroupId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  lineId: string;
  selectedSize?: string;
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
  loyaltyPointsRedeemed: number;
  discountApplied: number;
  refundIds: string[];
  refundedAmount: number;
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

export interface SizeGroup {
  id: string;
  name: string;
  sizes: string[];
}

export interface PosSettings {
  defaultPaymentMethod: PaymentMethod;
  defaultCategory: string;
  categories: string[];
  brands: string[];
  sizes: string[];
  sizeGroups: SizeGroup[];
  walkInCustomerLabel: string;
  orderNumberPrefix: string;
  orderNumberSeed: number;
  enableManualProduct: boolean;
  multiTerminalMode: boolean;
  terminalId?: string;
  ticketConfig: TicketConfig;
  maxSaleWindows: number;
  refundSettings: RefundSettings;
  ticketSize: '58mm' | '80mm';
}

export interface SaleWindow {
  id: string;
  name: string;
  cart: CartItem[];
  selectedCustomerId: string | null;
  paymentMethod: PaymentMethod;
  itemDiscounts: Record<string, number>;
  manualDiscount: number;
  pointsToRedeem: number;
  createdAt: string;
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

export interface RefundItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedSize?: string;
}

export interface Refund {
  id: string;
  originalSaleId: string;
  orderNumber: string;
  items: RefundItem[];
  totalAmount: number;
  refundMethod: PaymentMethod;
  reason: string;
  createdAt: string;
  employeeId?: string;
  authorizedBy?: string;
  customerId?: string;
}

export interface RefundSettings {
  enabled: boolean;
  requirePin: boolean;
  pinThreshold: number;
  maxRefundDays: number;
}

export interface CashBoxClosure {
  id: string;
  openedAt: string;
  closedAt: string;
  employeeIds: string[];
  salesByMethod: Record<PaymentMethod, number>;
  totalSales: number;
  countedByMethod: Record<PaymentMethod, number>;
  totalCounted: number;
  differences: Record<PaymentMethod, number>;
  totalDifference: number;
  authorizedBy?: string;
}

export interface SettingsState {
  tax: TaxSettings;
  store: StoreSettings;
  pos: PosSettings;
  language: LanguageSettings;
  loyalty: LoyaltySettings;
}
