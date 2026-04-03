export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
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
