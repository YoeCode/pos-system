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
  supervisor: ['pos', 'products', 'reports'],
  manager: ['pos', 'products', 'reports', 'employees', 'dashboard'],
  admin: ['pos', 'products', 'reports', 'employees', 'dashboard', 'settings'],
};

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  image?: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  publishedOnline: boolean;
  version?: string;
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

export type PaymentMethod = 'cash' | 'card' | 'qr';

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
  createdAt: string;
}

export interface Sale {
  id: string;
  order: Order;
  paymentMethod: PaymentMethod;
  amountReceived: number | null;
  change: number | null;
  completedAt: string;
}
