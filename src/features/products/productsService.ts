import { supabase } from '../../supabase/client';
import type { Product, ProductSize } from '../../types';

function mapDbProduct(row: any): Product {
  const sizes: ProductSize[] = (row.product_sizes || [])
    .filter((s: any) => s.size !== null)
    .map((s: any) => ({
      size: s.size,
      stock: s.stock,
      minStock: s.min_stock,
      sku: s.sku,
    }));

  const totalStock = sizes.length > 0
    ? sizes.reduce((sum, s) => sum + s.stock, 0)
    : row.stock;

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
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
  };
}

export async function fetchProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_sizes(*)')
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
  const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenantId);
  return !error;
}

export async function reduceStock(productId: string, quantity: number, size?: string, tenantId?: string): Promise<boolean> {
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

export async function restoreStock(productId: string, quantity: number, size?: string, tenantId?: string): Promise<boolean> {
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
      await supabase.from('products').update({ stock: newStock }).eq('id', productId).eq('tenant_id', tenantId || '');
    }
  }
  return true;
}
