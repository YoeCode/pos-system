import { supabase } from '../../supabase/client';
import type { Product, ProductSize, ProductAttribute, ProductVariant } from '../../types';

function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function nextSku(categoryName: string): Promise<string> {
  const prefix = slugify(categoryName).substring(0, 3).toUpperCase() || 'GEN';
  const { data, error } = await supabase.rpc('next_sku' as any, { p_prefix: prefix });
  if (error || !data) {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
  }
  return data as string;
}

function mapDbProduct(row: any): Product {
  const sizes: ProductSize[] = (row.product_sizes || [])
    .filter((s: any) => s.size !== null)
    .map((s: any) => ({
      size: s.size,
      stock: s.stock,
      minStock: s.min_stock,
      sku: s.sku,
    }));

  const variants: ProductVariant[] = (row.product_variants || [])
    .filter((v: any) => v.id !== null)
    .map((v: any) => ({
      id: v.id,
      productId: v.product_id,
      sku: v.sku,
      price: v.price,
      costPrice: v.cost_price,
      stock: v.stock,
      minStock: v.min_stock,
      image: v.image_url,
      attributes: v.attributes || {},
      status: v.status,
    }));

  const totalStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : sizes.length > 0
      ? sizes.reduce((sum, s) => sum + s.stock, 0)
      : row.stock;

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    subcategory: row.subcategory || undefined,
    season: row.season || undefined,
    brand: row.brand || undefined,
    price: row.price,
    costPrice: row.cost_price,
    stock: totalStock,
    minStock: row.min_stock,
    image: row.image_url || undefined,
    description: row.description || undefined,
    status: row.status,
    publishedOnline: row.published_online,
    version: row.version || undefined,
    sizes: sizes.length > 0 ? sizes : undefined,
    sizeGroupId: row.size_group_id || undefined,
    hasVariants: row.has_variants || false,
    variantAttributes: row.variant_attributes || [],
    variants: variants.length > 0 ? variants : undefined,
  };
}

export async function fetchProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_sizes(*), product_variants(*)' as any)
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return (data as any[]).map(mapDbProduct);
}

export async function createProduct(product: Product, tenantId: string): Promise<Product | null> {
  const insertData: Record<string, any> = {
    id: product.id,
    tenant_id: tenantId,
    name: product.name,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory || null,
    season: product.season || null,
    brand: product.brand || null,
    price: product.price,
    cost_price: product.costPrice,
    stock: product.stock,
    min_stock: product.minStock,
    image_url: product.image || null,
    description: product.description || null,
    status: product.status,
    published_online: product.publishedOnline,
    version: product.version || null,
    size_group_id: product.sizeGroupId || null,
    has_variants: product.hasVariants || false,
    variant_attributes: product.variantAttributes || [],
  };

  const { data, error } = await supabase
    .from('products')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) return null;

  if (product.sizes && product.sizes.length > 0) {
    const sizesToInsert = product.sizes.map(s => ({
      product_id: (data as any).id,
      tenant_id: tenantId,
      size: s.size,
      stock: s.stock,
      min_stock: s.minStock,
      sku: s.sku || null,
    }));
    await supabase.from('product_sizes').insert(sizesToInsert as any);
  }

  return mapDbProduct({ ...data, product_sizes: product.sizes || [] });
}

export async function updateProduct(product: Product, tenantId: string): Promise<Product | null> {
  const updateData: Record<string, any> = {
    name: product.name,
    sku: product.sku,
    category: product.category,
    subcategory: product.subcategory || null,
    season: product.season || null,
    brand: product.brand || null,
    price: product.price,
    cost_price: product.costPrice,
    stock: product.stock,
    min_stock: product.minStock,
    image_url: product.image || null,
    description: product.description || null,
    status: product.status,
    published_online: product.publishedOnline,
    version: product.version || null,
    size_group_id: product.sizeGroupId || null,
    has_variants: product.hasVariants || false,
    variant_attributes: product.variantAttributes || [],
  };

  const { error } = await supabase
    .from('products')
    .update(updateData as any)
    .eq('id', product.id)
    .eq('tenant_id', tenantId);

  if (error) return null;

  await supabase.from('product_sizes').delete().eq('product_id', product.id).eq('tenant_id', tenantId);

  if (product.sizes && product.sizes.length > 0) {
    const sizesToInsert = product.sizes.map(s => ({
      product_id: product.id,
      tenant_id: tenantId,
      size: s.size,
      stock: s.stock,
      min_stock: s.minStock,
      sku: s.sku || null,
    }));
    await supabase.from('product_sizes').insert(sizesToInsert as any);
  }

  const { data } = await supabase
    .from('products')
    .select('*, product_sizes(*)')
    .eq('id', product.id)
    .single();

  return data ? mapDbProduct(data) : null;
}

export async function deleteProduct(id: string, tenantId: string): Promise<boolean> {
  await (supabase as any).from('product_variants').delete().eq('product_id', id);
  await (supabase as any).from('sale_items').delete().eq('product_id', id);
  const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenantId);
  return !error;
}

export async function reduceStock(productId: string, quantity: number, size?: string, tenantId?: string, variantId?: string): Promise<boolean> {
  if (variantId) {
    const { data: variantRow } = await (supabase as any)
      .from('product_variants')
      .select('stock')
      .eq('id', variantId)
      .single();

    if (variantRow) {
      const newStock = Math.max(0, variantRow.stock - quantity);
      await (supabase as any)
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variantId);
    }
    return true;
  }

  if (size) {
    const { data: sizeRow } = await supabase
      .from('product_sizes')
      .select('stock')
      .eq('product_id', productId)
      .eq('size', size)
      .single();

    if (sizeRow) {
      const newStock = Math.max(0, sizeRow.stock - quantity);
      await supabase
        .from('product_sizes')
        .update({ stock: newStock })
        .eq('product_id', productId)
        .eq('size', size);
    }
  } else {
    const { data: prod } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .eq('tenant_id', tenantId || '')
      .single();

    if (prod) {
      const newStock = Math.max(0, prod.stock - quantity);
      await supabase.from('products').update({ stock: newStock }).eq('id', productId).eq('tenant_id', tenantId || '');
    }
  }
  return true;
}

export async function restoreStock(productId: string, quantity: number, size?: string, tenantId?: string, costPrice?: number, variantId?: string): Promise<boolean> {
  if (variantId) {
    const { data: variantRow } = await (supabase as any)
      .from('product_variants')
      .select('stock')
      .eq('id', variantId)
      .single();

    if (variantRow) {
      const newStock = variantRow.stock + quantity;
      await (supabase as any)
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variantId);
    }
    return true;
  }

  if (size) {
    const { data: sizeRow } = await supabase
      .from('product_sizes')
      .select('stock')
      .eq('product_id', productId)
      .eq('size', size)
      .single();

    if (sizeRow) {
      const newStock = sizeRow.stock + quantity;
      await supabase
        .from('product_sizes')
        .update({ stock: newStock })
        .eq('product_id', productId)
        .eq('size', size);
    }
  } else {
    const { data: prod } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .eq('tenant_id', tenantId || '')
      .single();

    if (prod) {
      const newStock = prod.stock + quantity;
      const updateData: Record<string, any> = { stock: newStock };
      if (costPrice !== undefined) {
        updateData.cost_price = costPrice;
      }
      await supabase.from('products').update(updateData as any).eq('id', productId).eq('tenant_id', tenantId || '');
    }
  }
  return true;
}

// --------------------------------------------
// Product Attributes CRUD
// --------------------------------------------

export async function fetchProductAttributes(tenantId: string): Promise<ProductAttribute[]> {
  const { data, error } = await (supabase as any)
    .from('product_attributes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return (data as any[]).map(row => ({
    id: row.id,
    name: row.name,
    values: row.values || [],
  }));
}

export async function createProductAttribute(tenantId: string, name: string, values: string[]): Promise<ProductAttribute | null> {
  const { data, error } = await (supabase as any)
    .from('product_attributes')
    .insert({ tenant_id: tenantId, name, values })
    .select()
    .single();

  if (error || !data) return null;
  return { id: (data as any).id, name: (data as any).name, values: (data as any).values };
}

export async function updateProductAttribute(tenantId: string, attrId: string, values: string[]): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('product_attributes')
    .update({ values })
    .eq('id', attrId)
    .eq('tenant_id', tenantId);

  return !error;
}

export async function deleteProductAttribute(tenantId: string, attrId: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('product_attributes')
    .delete()
    .eq('id', attrId)
    .eq('tenant_id', tenantId);

  return !error;
}

// --------------------------------------------
// Product Variants CRUD
// --------------------------------------------

export async function fetchProductVariants(tenantId: string, productId: string): Promise<ProductVariant[]> {
  const { data, error } = await (supabase as any)
    .from('product_variants')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('created_at');

  if (error || !data) return [];
  return (data as any[]).map(row => ({
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    price: row.price,
    costPrice: row.cost_price,
    stock: row.stock,
    minStock: row.min_stock,
    image: row.image_url,
    attributes: row.attributes || {},
    status: row.status,
  }));
}

export async function createProductVariant(tenantId: string, variant: Omit<ProductVariant, 'id'>): Promise<ProductVariant | null> {
  const insertData = {
    tenant_id: tenantId,
    product_id: variant.productId,
    sku: variant.sku,
    price: variant.price,
    cost_price: variant.costPrice,
    stock: variant.stock,
    min_stock: variant.minStock,
    image_url: variant.image,
    attributes: variant.attributes,
    status: variant.status,
  };

  const { data, error } = await (supabase as any)
    .from('product_variants')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) return null;
  const row = data as any;
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    price: row.price,
    costPrice: row.cost_price,
    stock: row.stock,
    minStock: row.min_stock,
    image: row.image_url,
    attributes: row.attributes || {},
    status: row.status,
  };
}

export async function updateProductVariant(tenantId: string, variant: ProductVariant): Promise<ProductVariant | null> {
  const updateData = {
    sku: variant.sku,
    price: variant.price,
    cost_price: variant.costPrice,
    stock: variant.stock,
    min_stock: variant.minStock,
    image_url: variant.image,
    attributes: variant.attributes,
    status: variant.status,
  };

  const { error } = await (supabase as any)
    .from('product_variants')
    .update(updateData)
    .eq('id', variant.id)
    .eq('tenant_id', tenantId);

  if (error) return null;

  const { data } = await (supabase as any)
    .from('product_variants')
    .select('*')
    .eq('id', variant.id)
    .single();

  if (!data) return null;
  const row = data as any;
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    price: row.price,
    costPrice: row.cost_price,
    stock: row.stock,
    minStock: row.min_stock,
    image: row.image_url,
    attributes: row.attributes || {},
    status: row.status,
  };
}

export async function deleteProductVariant(tenantId: string, variantId: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('product_variants')
    .delete()
    .eq('id', variantId)
    .eq('tenant_id', tenantId);

  return !error;
}
