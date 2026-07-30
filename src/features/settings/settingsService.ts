import { supabase } from '../../supabase/client';
import type { SizeGroup, TaxSettings, StoreSettings, PosSettings, LanguageSettings, LoyaltySettings } from '../../types';

export interface DbCategory {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface DbBrand {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface DbSize {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface DbSizeGroup {
  id: string;
  tenant_id: string;
  name: string;
  sizes: string[];
  created_at: string;
}

export interface DbSettings {
  tenant_id: string;
  currency: string;
  language: string;
  store_name: string;
  store_address: string | null;
  store_email: string | null;
  store_phone: string | null;
  receipt_footer: string | null;
  tax_rate: number;
  tax_included: boolean;
  tax_name: string;
  tax_registration_number: string;
  pos_config: any;
  loyalty_config: any;
  updated_at: string;
}

export interface TenantSettings {
  tax: TaxSettings;
  store: StoreSettings;
  pos: PosSettings;
  language: LanguageSettings;
  loyalty: LoyaltySettings;
}

function mapDbSettings(row: DbSettings): TenantSettings {
  const pos = row.pos_config || {};
  const loyalty = row.loyalty_config || {};

  return {
    tax: {
      taxRate: row.tax_rate ?? 0.21,
      taxName: row.tax_name ?? 'Tax',
      taxIncludedInPrice: row.tax_included ?? false,
      taxRegistrationNumber: row.tax_registration_number ?? '',
    },
    store: {
      storeName: row.store_name ?? 'Casa Lis',
      storeAddress: row.store_address ?? '',
      storePhone: row.store_phone ?? '',
      storeEmail: row.store_email ?? '',
      receiptFooterMessage: row.receipt_footer ?? 'Thank you!',
    },
    language: {
      language: (row.language ?? 'es') as 'en' | 'es',
    },
    pos: {
      defaultPaymentMethod: pos.default_payment_method ?? 'cash',
      defaultCategory: pos.default_category ?? 'All Items',
      categories: [],
      brands: [],
      sizes: [],
      sizeGroups: (pos.size_groups ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        sizes: g.sizes,
      })),
      walkInCustomerLabel: pos.walk_in_customer_label ?? 'Walk-In Customer',
      orderNumberPrefix: pos.order_number_prefix ?? 'ORD-',
      orderNumberSeed: pos.order_number_seed ?? 1042,
      enableManualProduct: pos.enable_manual_product ?? true,
      multiTerminalMode: pos.multi_terminal_mode ?? false,
      enableAiDeliveryNote: pos.enable_ai_delivery_note ?? false,
      terminalId: pos.terminal_id ?? undefined,
      ticketConfig: {
        showLogo: pos.ticket_config?.show_logo ?? false,
        logoUrl: pos.ticket_config?.logo_url ?? undefined,
        showEmployee: pos.ticket_config?.show_employee ?? true,
        showStoreName: pos.ticket_config?.show_store_name ?? true,
        customHeader: pos.ticket_config?.custom_header ?? undefined,
        customFooter: pos.ticket_config?.custom_footer ?? undefined,
      },
      maxSaleWindows: pos.max_sale_windows ?? 5,
      refundSettings: {
        enabled: pos.refund_settings?.enabled ?? true,
        requirePin: pos.refund_settings?.require_pin ?? true,
        pinThreshold: pos.refund_settings?.pin_threshold ?? 50,
        maxRefundDays: pos.refund_settings?.max_refund_days ?? 30,
      },
      ticketSize: pos.ticket_size ?? '58mm',
      shifts: pos.shifts ?? ['Mañana 06:00-14:00', 'Tarde 14:00-22:00', 'Noche 22:00-06:00', 'Jornada completa 08:00-18:00'],
    },
    loyalty: {
      enabled: loyalty.enabled ?? true,
      pointsPerEuro: loyalty.points_per_euro ?? 1,
      tiers: (loyalty.tiers ?? []).map((t: any) => ({
        tier: t.tier,
        threshold: t.threshold,
        discountPct: t.discount_pct ?? t.discountPct,
      })),
    },
  };
}

function buildPosConfig(pos: PosSettings): any {
  return {
    default_payment_method: pos.defaultPaymentMethod,
    default_category: pos.defaultCategory,
    walk_in_customer_label: pos.walkInCustomerLabel,
    order_number_prefix: pos.orderNumberPrefix,
    order_number_seed: pos.orderNumberSeed,
    enable_manual_product: pos.enableManualProduct,
    multi_terminal_mode: pos.multiTerminalMode,
    enable_ai_delivery_note: pos.enableAiDeliveryNote,
    terminal_id: pos.terminalId,
    ticket_config: {
      show_logo: pos.ticketConfig.showLogo,
      logo_url: pos.ticketConfig.logoUrl,
      show_employee: pos.ticketConfig.showEmployee,
      show_store_name: pos.ticketConfig.showStoreName,
      custom_header: pos.ticketConfig.customHeader,
      custom_footer: pos.ticketConfig.customFooter,
    },
    max_sale_windows: pos.maxSaleWindows,
    refund_settings: {
      enabled: pos.refundSettings.enabled,
      require_pin: pos.refundSettings.requirePin,
      pin_threshold: pos.refundSettings.pinThreshold,
      max_refund_days: pos.refundSettings.maxRefundDays,
    },
    ticket_size: pos.ticketSize,
    shifts: pos.shifts,
  };
}

function buildLoyaltyConfig(loyalty: LoyaltySettings): any {
  return {
    enabled: loyalty.enabled,
    points_per_euro: loyalty.pointsPerEuro,
    tiers: loyalty.tiers.map(t => ({
      tier: t.tier,
      threshold: t.threshold,
      discount_pct: t.discountPct,
    })),
  };
}

export async function fetchTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    console.error('Error fetching tenant settings:', error);
    return null;
  }
  return mapDbSettings(data as DbSettings);
}

export async function updateTaxSettings(tenantId: string, tax: TaxSettings): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .update({
      tax_rate: tax.taxRate,
      tax_name: tax.taxName,
      tax_included: tax.taxIncludedInPrice,
      tax_registration_number: tax.taxRegistrationNumber,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating tax settings:', error);
    return false;
  }
  return true;
}

export async function updateStoreSettings(tenantId: string, store: StoreSettings): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .update({
      store_name: store.storeName,
      store_address: store.storeAddress || null,
      store_phone: store.storePhone || null,
      store_email: store.storeEmail || null,
      receipt_footer: store.receiptFooterMessage || null,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating store settings:', error);
    return false;
  }
  return true;
}

export async function updatePosSettings(tenantId: string, pos: PosSettings): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .update({
      pos_config: buildPosConfig(pos),
    })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating POS settings:', error);
    return false;
  }
  return true;
}

export async function updateLanguageSettings(tenantId: string, language: LanguageSettings): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .update({ language: language.language })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating language settings:', error);
    return false;
  }
  return true;
}

export async function updateLoyaltySettings(tenantId: string, loyalty: LoyaltySettings): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .update({ loyalty_config: buildLoyaltyConfig(loyalty) })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error updating loyalty settings:', error);
    return false;
  }
  return true;
}

export async function upsertTenantSettings(tenantId: string, settings: TenantSettings): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .upsert({
      tenant_id: tenantId,
      currency: 'EUR',
      language: settings.language.language,
      store_name: settings.store.storeName,
      store_address: settings.store.storeAddress || null,
      store_phone: settings.store.storePhone || null,
      store_email: settings.store.storeEmail || null,
      receipt_footer: settings.store.receiptFooterMessage || null,
      tax_rate: settings.tax.taxRate,
      tax_name: settings.tax.taxName,
      tax_included: settings.tax.taxIncludedInPrice,
      tax_registration_number: settings.tax.taxRegistrationNumber,
      pos_config: buildPosConfig(settings.pos),
      loyalty_config: buildLoyaltyConfig(settings.loyalty),
    }, { onConflict: 'tenant_id' });

  if (error) {
    console.error('Error upserting tenant settings:', error);
    return false;
  }
  return true;
}

export async function fetchCategories(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return (data as DbCategory[]).map(c => c.name);
}

export async function fetchBrands(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('name')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) {
    console.error('Error fetching brands:', error);
    return [];
  }
  return (data as DbBrand[]).map(b => b.name);
}

export async function fetchSizes(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('sizes')
    .select('name')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) {
    console.error('Error fetching sizes:', error);
    return [];
  }
  return (data as DbSize[]).map(s => s.name);
}

export async function fetchSizeGroups(tenantId: string): Promise<SizeGroup[]> {
  const { data, error } = await supabase
    .from('size_groups')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) {
    console.error('Error fetching size groups:', error);
    return [];
  }
  return (data as DbSizeGroup[]).map(g => ({
    id: g.id,
    name: g.name,
    sizes: g.sizes || [],
  }));
}

export async function syncCategories(
  tenantId: string,
  categories: string[]
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('categories')
    .select('name')
    .eq('tenant_id', tenantId);

  const existingNames = new Set((existing || []).map((c: any) => c.name));
  const newNames = new Set(categories);

  const toAdd = categories.filter(c => !existingNames.has(c));
  const toRemove = (existing || []).filter((c: any) => !newNames.has(c.name)).map((c: any) => c.name);

  if (toAdd.length > 0) {
    const inserts = toAdd.map(name => ({ tenant_id: tenantId, name }));
    const { error } = await supabase.from('categories').insert(inserts);
    if (error) {
      console.error('Error adding categories:', error);
      return false;
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('tenant_id', tenantId)
      .in('name', toRemove);
    if (error) {
      console.error('Error removing categories:', error);
      return false;
    }
  }

  return true;
}

export async function syncBrands(
  tenantId: string,
  brands: string[]
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('brands')
    .select('name')
    .eq('tenant_id', tenantId);

  const existingNames = new Set((existing || []).map((b: any) => b.name));
  const newNames = new Set(brands);

  const toAdd = brands.filter(b => !existingNames.has(b));
  const toRemove = (existing || []).filter((b: any) => !newNames.has(b.name)).map((b: any) => b.name);

  if (toAdd.length > 0) {
    const inserts = toAdd.map(name => ({ tenant_id: tenantId, name }));
    const { error } = await supabase.from('brands').insert(inserts);
    if (error) {
      console.error('Error adding brands:', error);
      return false;
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('tenant_id', tenantId)
      .in('name', toRemove);
    if (error) {
      console.error('Error removing brands:', error);
      return false;
    }
  }

  return true;
}

export async function syncSizes(
  tenantId: string,
  sizes: string[]
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('sizes')
    .select('name')
    .eq('tenant_id', tenantId);

  const existingNames = new Set((existing || []).map((s: any) => s.name));
  const newNames = new Set(sizes);

  const toAdd = sizes.filter(s => !existingNames.has(s));
  const toRemove = (existing || []).filter((s: any) => !newNames.has(s.name)).map((s: any) => s.name);

  if (toAdd.length > 0) {
    const inserts = toAdd.map(name => ({ tenant_id: tenantId, name }));
    const { error } = await supabase.from('sizes').insert(inserts);
    if (error) {
      console.error('Error adding sizes:', error);
      return false;
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('sizes')
      .delete()
      .eq('tenant_id', tenantId)
      .in('name', toRemove);
    if (error) {
      console.error('Error removing sizes:', error);
      return false;
    }
  }

  return true;
}

export async function syncSizeGroups(
  tenantId: string,
  sizeGroups: SizeGroup[]
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('size_groups')
    .select('id, name, sizes')
    .eq('tenant_id', tenantId);

  const existingMap = new Map((existing || []).map((g: any) => [g.name, g]));
  const newMap = new Map(sizeGroups.map(g => [g.name, g]));

  const toAdd = sizeGroups.filter(g => !existingMap.has(g.name));
  const toUpdate = sizeGroups.filter(g => {
    const existing = existingMap.get(g.name);
    return existing && JSON.stringify(existing.sizes.sort()) !== JSON.stringify(g.sizes.sort());
  });
  const toRemove = (existing || []).filter((g: any) => !newMap.has(g.name)).map((g: any) => g.id);

  if (toAdd.length > 0) {
    const inserts = toAdd.map(g => ({
      tenant_id: tenantId,
      name: g.name,
      sizes: g.sizes,
    }));
    const { error } = await supabase.from('size_groups').insert(inserts);
    if (error) {
      console.error('Error adding size groups:', error);
      return false;
    }
  }

  for (const group of toUpdate) {
    const existing = existingMap.get(group.name);
    if (existing) {
      const { error } = await supabase
        .from('size_groups')
        .update({ sizes: group.sizes })
        .eq('id', existing.id);
      if (error) {
        console.error('Error updating size group:', error);
        return false;
      }
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('size_groups')
      .delete()
      .in('id', toRemove);
    if (error) {
      console.error('Error removing size groups:', error);
      return false;
    }
  }

  return true;
}

export async function addCategory(tenantId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name });
  if (error) {
    console.error('Error adding category:', error);
    return false;
  }
  return true;
}

export async function removeCategory(tenantId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('name', name);
  if (error) {
    console.error('Error removing category:', error);
    return false;
  }
  return true;
}

export async function addBrand(tenantId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('brands')
    .insert({ tenant_id: tenantId, name });
  if (error) {
    console.error('Error adding brand:', error);
    return false;
  }
  return true;
}

export async function removeBrand(tenantId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('name', name);
  if (error) {
    console.error('Error removing brand:', error);
    return false;
  }
  return true;
}

export async function addSize(tenantId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('sizes')
    .insert({ tenant_id: tenantId, name });
  if (error) {
    console.error('Error adding size:', error);
    return false;
  }
  return true;
}

export async function removeSize(tenantId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('sizes')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('name', name);
  if (error) {
    console.error('Error removing size:', error);
    return false;
  }
  return true;
}

export async function addSizeGroup(tenantId: string, group: SizeGroup): Promise<boolean> {
  const { error } = await supabase
    .from('size_groups')
    .insert({
      tenant_id: tenantId,
      name: group.name,
      sizes: group.sizes,
    });
  if (error) {
    console.error('Error adding size group:', error);
    return false;
  }
  return true;
}

export async function updateSizeGroup(tenantId: string, group: SizeGroup): Promise<boolean> {
  const { error } = await supabase
    .from('size_groups')
    .update({ sizes: group.sizes })
    .eq('tenant_id', tenantId)
    .eq('name', group.name);
  if (error) {
    console.error('Error updating size group:', error);
    return false;
  }
  return true;
}

export async function removeSizeGroupById(tenantId: string, id: string): Promise<boolean> {
  const { error } = await supabase
    .from('size_groups')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id);
  if (error) {
    console.error('Error removing size group:', error);
    return false;
  }
  return true;
}
