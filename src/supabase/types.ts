export interface Database {
  public: {
    Tables: {
      employees: {
        Row: EmployeeRow;
        Insert: EmployeeInsert;
        Update: EmployeeUpdate;
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_sizes: {
        Row: ProductSizeRow;
        Insert: ProductSizeInsert;
        Update: ProductSizeUpdate;
      };
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      sales: {
        Row: SaleRow;
        Insert: SaleInsert;
        Update: SaleUpdate;
      };
      sale_items: {
        Row: SaleItemRow;
        Insert: SaleItemInsert;
        Update: SaleItemUpdate;
      };
      cash_box_sessions: {
        Row: CashBoxSessionRow;
        Insert: CashBoxSessionInsert;
        Update: CashBoxSessionUpdate;
      };
      cash_box_closures: {
        Row: CashBoxClosureRow;
        Insert: CashBoxClosureInsert;
        Update: CashBoxClosureUpdate;
      };
      refunds: {
        Row: RefundRow;
        Insert: RefundInsert;
        Update: RefundUpdate;
      };
      settings: {
        Row: SettingsRow;
        Insert: SettingsInsert;
        Update: SettingsUpdate;
      };
    };
  };
}

export type UserRole = 'cashier' | 'supervisor' | 'manager' | 'admin';

export interface EmployeeRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: UserRole;
  pin: string | null;
  phone: string | null;
  shift: string | null;
  active: boolean;
  created_at: string;
}

export interface EmployeeInsert {
  id?: string;
  user_id?: string | null;
  name: string;
  email: string;
  role?: UserRole;
  pin?: string | null;
  phone?: string | null;
  shift?: string | null;
  active?: boolean;
}

export interface EmployeeUpdate {
  id?: string;
  user_id?: string | null;
  name?: string;
  email?: string;
  role?: UserRole;
  pin?: string | null;
  phone?: string | null;
  shift?: string | null;
  active?: boolean;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string | null;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  description: string | null;
  status: 'active' | 'inactive' | 'draft';
  published_online: boolean;
  image_url: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: string;
  name: string;
  sku: string;
  category: string;
  brand?: string | null;
  price: number;
  cost_price?: number;
  stock?: number;
  min_stock?: number;
  description?: string | null;
  status?: 'active' | 'inactive' | 'draft';
  published_online?: boolean;
  image_url?: string | null;
  version?: string | null;
}

export interface ProductUpdate {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  brand?: string | null;
  price?: number;
  cost_price?: number;
  stock?: number;
  min_stock?: number;
  description?: string | null;
  status?: 'active' | 'inactive' | 'draft';
  published_online?: boolean;
  image_url?: string | null;
  version?: string | null;
}

export interface ProductSizeRow {
  id: string;
  product_id: string;
  size: string;
  sku: string | null;
  stock: number;
  min_stock: number;
}

export interface ProductSizeInsert {
  id?: string;
  product_id: string;
  size: string;
  sku?: string | null;
  stock?: number;
  min_stock?: number;
}

export interface ProductSizeUpdate {
  id?: string;
  product_id?: string;
  size?: string;
  sku?: string | null;
  stock?: number;
  min_stock?: number;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  loyalty_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_spent: number;
  created_at: string;
}

export interface CustomerInsert {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  active?: boolean;
  loyalty_points?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_spent?: number;
}

export interface CustomerUpdate {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  active?: boolean;
  loyalty_points?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_spent?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'bizum';

export interface SaleRow {
  id: string;
  order_number: string;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  payment_method: PaymentMethod;
  amount_received: number | null;
  change: number | null;
  employee_id: string | null;
  terminal_id: string | null;
  customer_id: string | null;
  loyalty_points_earned: number;
  loyalty_points_redeemed: number;
  completed_at: string;
  created_at: string;
}

export interface SaleInsert {
  id?: string;
  order_number: string;
  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
  payment_method: PaymentMethod;
  amount_received?: number | null;
  change?: number | null;
  employee_id?: string | null;
  terminal_id?: string | null;
  customer_id?: string | null;
  loyalty_points_earned?: number;
  loyalty_points_redeemed?: number;
  completed_at?: string;
}

export interface SaleUpdate {
  id?: string;
  order_number?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  discount?: number;
  payment_method?: PaymentMethod;
  amount_received?: number | null;
  change?: number | null;
  employee_id?: string | null;
  terminal_id?: string | null;
  customer_id?: string | null;
  loyalty_points_earned?: number;
  loyalty_points_redeemed?: number;
  completed_at?: string;
}

export interface SaleItemRow {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  selected_size: string | null;
}

export interface SaleItemInsert {
  id?: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  selected_size?: string | null;
}

export interface SaleItemUpdate {
  id?: string;
  sale_id?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  selected_size?: string | null;
}

export interface CashBoxSessionRow {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opened_by: string | null;
  employee_ids: string[];
  terminal_id: string | null;
  is_open: boolean;
}

export interface CashBoxSessionInsert {
  id?: string;
  opened_at?: string;
  closed_at?: string | null;
  opened_by?: string | null;
  employee_ids?: string[];
  terminal_id?: string | null;
  is_open?: boolean;
}

export interface CashBoxSessionUpdate {
  id?: string;
  opened_at?: string;
  closed_at?: string | null;
  opened_by?: string | null;
  employee_ids?: string[];
  terminal_id?: string | null;
  is_open?: boolean;
}

export interface CashBoxClosureRow {
  id: string;
  session_id: string;
  cash_expected: number;
  cash_counted: number;
  card_expected: number;
  card_counted: number;
  bizum_expected: number;
  bizum_counted: number;
  total_difference: number;
  closed_by: string | null;
  pin_verified: boolean;
  created_at: string;
}

export interface CashBoxClosureInsert {
  id?: string;
  session_id: string;
  cash_expected: number;
  cash_counted: number;
  card_expected: number;
  card_counted: number;
  bizum_expected: number;
  bizum_counted: number;
  total_difference: number;
  closed_by?: string | null;
  pin_verified?: boolean;
}

export interface CashBoxClosureUpdate {
  id?: string;
  session_id?: string;
  cash_expected?: number;
  cash_counted?: number;
  card_expected?: number;
  card_counted?: number;
  bizum_expected?: number;
  bizum_counted?: number;
  total_difference?: number;
  closed_by?: string | null;
  pin_verified?: boolean;
}

export interface RefundRow {
  id: string;
  sale_id: string;
  employee_id: string | null;
  total_amount: number;
  reason: string | null;
  pin_verified: boolean;
  created_at: string;
}

export interface RefundInsert {
  id?: string;
  sale_id: string;
  employee_id?: string | null;
  total_amount: number;
  reason?: string | null;
  pin_verified?: boolean;
}

export interface RefundUpdate {
  id?: string;
  sale_id?: string;
  employee_id?: string | null;
  total_amount?: number;
  reason?: string | null;
  pin_verified?: boolean;
}

export interface SettingsRow {
  id: string;
  store_name: string;
  store_address: string | null;
  store_phone: string | null;
  store_email: string | null;
  receipt_footer: string | null;
  tax_rate: number;
  tax_included: boolean;
  language: 'en' | 'es';
  currency: string;
  updated_at: string;
}

export interface SettingsInsert {
  id?: string;
  store_name?: string;
  store_address?: string | null;
  store_phone?: string | null;
  store_email?: string | null;
  receipt_footer?: string | null;
  tax_rate?: number;
  tax_included?: boolean;
  language?: 'en' | 'es';
  currency?: string;
}

export interface SettingsUpdate {
  id?: string;
  store_name?: string;
  store_address?: string | null;
  store_phone?: string | null;
  store_email?: string | null;
  receipt_footer?: string | null;
  tax_rate?: number;
  tax_included?: boolean;
  language?: 'en' | 'es';
  currency?: string;
}
