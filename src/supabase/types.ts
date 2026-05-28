export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cash_box_closures: {
        Row: {
          bizum_counted: number
          bizum_expected: number
          card_counted: number
          card_expected: number
          cash_counted: number
          cash_expected: number
          closed_by: string | null
          created_at: string
          id: string
          pin_verified: boolean
          session_id: string
          tenant_id: string
          total_difference: number
        }
        Insert: {
          bizum_counted?: number
          bizum_expected?: number
          card_counted?: number
          card_expected?: number
          cash_counted?: number
          cash_expected?: number
          closed_by?: string | null
          created_at?: string
          id?: string
          pin_verified?: boolean
          session_id: string
          tenant_id: string
          total_difference?: number
        }
        Update: {
          bizum_counted?: number
          bizum_expected?: number
          card_counted?: number
          card_expected?: number
          cash_counted?: number
          cash_expected?: number
          closed_by?: string | null
          created_at?: string
          id?: string
          pin_verified?: boolean
          session_id?: string
          tenant_id?: string
          total_difference?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_box_closures_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_box_closures_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_box_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_box_closures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_box_sessions: {
        Row: {
          closed_at: string | null
          employee_ids: string[]
          id: string
          is_open: boolean
          opened_at: string
          opened_by: string | null
          tenant_id: string
          terminal_id: string | null
        }
        Insert: {
          closed_at?: string | null
          employee_ids?: string[]
          id?: string
          is_open?: boolean
          opened_at?: string
          opened_by?: string | null
          tenant_id: string
          terminal_id?: string | null
        }
        Update: {
          closed_at?: string | null
          employee_ids?: string[]
          id?: string
          is_open?: boolean
          opened_at?: string
          opened_by?: string | null
          tenant_id?: string
          terminal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_box_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_box_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          loyalty_points: number
          name: string
          notes: string | null
          phone: string | null
          tenant_id: string
          tier: string
          total_spent: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number
          name: string
          notes?: string | null
          phone?: string | null
          tenant_id: string
          tier?: string
          total_spent?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number
          name?: string
          notes?: string | null
          phone?: string | null
          tenant_id?: string
          tier?: string
          total_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          pin: string | null
          pin_hash: string | null
          role: string
          shift: string | null
          status: string | null
          tenant_id: string
          terminal_id: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          pin?: string | null
          pin_hash?: string | null
          role?: string
          shift?: string | null
          status?: string | null
          tenant_id: string
          terminal_id?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          pin?: string | null
          pin_hash?: string | null
          role?: string
          shift?: string | null
          status?: string | null
          tenant_id?: string
          terminal_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          tenant_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          tenant_id: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          id: string
          min_stock: number
          product_id: string
          size: string
          sku: string | null
          stock: number
          tenant_id: string
        }
        Insert: {
          id?: string
          min_stock?: number
          product_id: string
          size: string
          sku?: string | null
          stock?: number
          tenant_id: string
        }
        Update: {
          id?: string
          min_stock?: number
          product_id?: string
          size?: string
          sku?: string | null
          stock?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sizes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_stock: number
          name: string
          price: number
          published_online: boolean
          size_group_id: string | null
          sku: string
          status: string
          stock: number
          tenant_id: string
          updated_at: string
          version: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number
          name: string
          price?: number
          published_online?: boolean
          size_group_id?: string | null
          sku: string
          status?: string
          stock?: number
          tenant_id: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_stock?: number
          name?: string
          price?: number
          published_online?: boolean
          size_group_id?: string | null
          sku?: string
          status?: string
          stock?: number
          tenant_id?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          pin_verified: boolean
          reason: string | null
          sale_id: string
          tenant_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          pin_verified?: boolean
          reason?: string | null
          sale_id: string
          tenant_id: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          pin_verified?: boolean
          reason?: string | null
          sale_id?: string
          tenant_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "refunds_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          id: string
          line_total: number
          product_category: string | null
          product_id: string
          product_name: string
          product_sku: string | null
          quantity: number
          sale_id: string
          selected_size: string | null
          tenant_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          line_total?: number
          product_category?: string | null
          product_id: string
          product_name: string
          product_sku?: string | null
          quantity?: number
          sale_id: string
          selected_size?: string | null
          tenant_id: string
          unit_price?: number
        }
        Update: {
          id?: string
          line_total?: number
          product_category?: string | null
          product_id?: string
          product_name?: string
          product_sku?: string | null
          quantity?: number
          sale_id?: string
          selected_size?: string | null
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_received: number | null
          change: number | null
          completed_at: string
          created_at: string
          customer_id: string | null
          discount: number
          employee_id: string | null
          id: string
          loyalty_points_earned: number
          loyalty_points_redeemed: number
          order_number: string
          payment_method: string
          refunded_amount: number
          subtotal: number
          tax: number
          tenant_id: string
          terminal_id: string | null
          total: number
        }
        Insert: {
          amount_received?: number | null
          change?: number | null
          completed_at?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          loyalty_points_earned?: number
          loyalty_points_redeemed?: number
          order_number: string
          payment_method: string
          refunded_amount?: number
          subtotal?: number
          tax?: number
          tenant_id: string
          terminal_id?: string | null
          total?: number
        }
        Update: {
          amount_received?: number | null
          change?: number | null
          completed_at?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          employee_id?: string | null
          id?: string
          loyalty_points_earned?: number
          loyalty_points_redeemed?: number
          order_number?: string
          payment_method?: string
          refunded_amount?: number
          subtotal?: number
          tax?: number
          tenant_id?: string
          terminal_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          currency: string
          language: string
          receipt_footer: string | null
          store_address: string | null
          store_email: string | null
          store_name: string
          store_phone: string | null
          tax_included: boolean
          tax_rate: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          currency?: string
          language?: string
          receipt_footer?: string | null
          store_address?: string | null
          store_email?: string | null
          store_name?: string
          store_phone?: string | null
          tax_included?: boolean
          tax_rate?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          currency?: string
          language?: string
          receipt_footer?: string | null
          store_address?: string | null
          store_email?: string | null
          store_name?: string
          store_phone?: string | null
          tax_included?: boolean
          tax_rate?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          max_employees: number
          max_products: number
          max_sales_monthly: number
          name: string
          owner_id: string | null
          plan: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_employees?: number
          max_products?: number
          max_sales_monthly?: number
          name: string
          owner_id?: string | null
          plan?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_employees?: number
          max_products?: number
          max_sales_monthly?: number
          name?: string
          owner_id?: string | null
          plan?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_add_employee: { Args: { p_tenant_id: string }; Returns: boolean }
      can_create_product: { Args: { p_tenant_id: string }; Returns: boolean }
      complete_invitation_acceptance: {
        Args: { p_name: string; p_token: string; p_user_id: string }
        Returns: boolean
      }
      current_tenant_id: { Args: never; Returns: string }
      expire_old_invitations: { Args: never; Returns: undefined }
      has_tenant_role: { Args: { required_roles: string[] }; Returns: boolean }
      register_new_business: {
        Args: {
          p_business_name: string
          p_email: string
          p_slug: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
