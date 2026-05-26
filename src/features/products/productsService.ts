import { supabase, isSupabaseConfigured } from '../../supabase/client';
import type { Product, ProductSize } from '../../types';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Summit Pro Watch',
    sku: 'WT-992-SMT',
    category: 'Electronics',
    brand: 'TechFit',
    price: 299,
    costPrice: 180,
    stock: 142,
    minStock: 20,
    status: 'active',
    publishedOnline: true,
    version: 'v2.1',
    description: 'Premium smartwatch with advanced fitness tracking and GPS.',
  },
  {
    id: '2',
    name: 'AudioCore Wireless',
    sku: 'AD-402-WRL',
    category: 'Electronics',
    brand: 'SoundPro',
    price: 189,
    costPrice: 95,
    stock: 8,
    minStock: 10,
    status: 'active',
    publishedOnline: true,
    version: 'v1.4',
    description: 'High-fidelity wireless headphones with active noise cancellation.',
  },
  {
    id: '3',
    name: 'Camiseta Básica',
    sku: 'CB-001-BAS',
    category: 'Apparel',
    brand: 'Casa Lis',
    price: 25,
    costPrice: 12,
    stock: 0,
    minStock: 20,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: 'S', stock: 15, minStock: 5 },
      { size: 'M', stock: 8, minStock: 5 },
      { size: 'L', stock: 3, minStock: 5 },
      { size: 'XL', stock: 0, minStock: 5 },
    ],
    description: 'Camiseta básica de algodón.',
  },
  {
    id: '3b',
    name: 'Sujetador Everyday',
    sku: 'SUJ-EVY-01',
    category: 'Lencería',
    brand: 'Casa Lis',
    price: 35,
    costPrice: 15,
    stock: 0,
    minStock: 30,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: '80A', stock: 5, minStock: 3 },
      { size: '80B', stock: 8, minStock: 3 },
      { size: '85A', stock: 12, minStock: 3 },
      { size: '85B', stock: 6, minStock: 3 },
      { size: '90A', stock: 2, minStock: 3 },
      { size: '90B', stock: 0, minStock: 3 },
    ],
    description: 'Sujetador everyday suave.',
  },
  {
    id: '3c',
    name: 'Pantalón Classic',
    sku: 'PNT-CLS-01',
    category: 'Apparel',
    brand: 'Casa Lis',
    price: 45,
    costPrice: 20,
    stock: 0,
    minStock: 15,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: '38', stock: 4, minStock: 3 },
      { size: '40', stock: 6, minStock: 3 },
      { size: '42', stock: 2, minStock: 3 },
      { size: '44', stock: 0, minStock: 3 },
    ],
    description: 'Pantalón classic tela elástica.',
  },
  {
    id: '3d',
    name: 'Vestido Floral',
    sku: 'VST-FLR-01',
    category: 'Apparel',
    brand: 'Casa Lis',
    price: 55,
    costPrice: 25,
    stock: 0,
    minStock: 10,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: 'XS', stock: 3, minStock: 2 },
      { size: 'S', stock: 7, minStock: 2 },
      { size: 'M', stock: 10, minStock: 2 },
      { size: 'L', stock: 5, minStock: 2 },
      { size: 'XL', stock: 1, minStock: 2 },
    ],
    description: 'Vestido floral primavera.',
  },
  {
    id: '3e',
    name: 'Braguita Cotton',
    sku: 'BRG-CTN-01',
    category: 'Lencería',
    brand: 'Casa Lis',
    price: 12,
    costPrice: 5,
    stock: 0,
    minStock: 50,
    status: 'active',
    publishedOnline: true,
    sizes: [
      { size: 'S', stock: 20, minStock: 10 },
      { size: 'M', stock: 25, minStock: 10 },
      { size: 'L', stock: 15, minStock: 10 },
      { size: 'XL', stock: 8, minStock: 10 },
    ],
    description: 'Braguita algodón suave.',
  },
  {
    id: '4',
    name: 'Chocolate Glazed',
    sku: 'CG-001',
    category: 'Food',
    brand: 'FreshBakery',
    price: 4.50,
    costPrice: 1.20,
    stock: 200,
    minStock: 30,
    status: 'active',
    publishedOnline: false,
    description: 'Classic chocolate glazed donut, freshly baked daily.',
  },
  {
    id: '5',
    name: 'Caramel Iced Latte',
    sku: 'CL-002',
    category: 'Drinks',
    brand: 'BeanHouse',
    price: 5.25,
    costPrice: 1.80,
    stock: 150,
    minStock: 20,
    status: 'active',
    publishedOnline: false,
    description: 'Creamy caramel iced latte with oat milk option.',
  },
  {
    id: '6',
    name: 'Classic Cheeseburger',
    sku: 'CB-003',
    category: 'Food',
    brand: 'GrillHouse',
    price: 12.00,
    costPrice: 4.50,
    stock: 80,
    minStock: 15,
    status: 'active',
    publishedOnline: false,
    description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato.',
  },
  {
    id: '7',
    name: 'Artisan Lime Soda',
    sku: 'ALS-004',
    category: 'Drinks',
    brand: 'FizzCo',
    price: 3.75,
    costPrice: 0.90,
    stock: 120,
    minStock: 15,
    status: 'active',
    publishedOnline: false,
    description: 'Refreshing artisan sparkling soda with natural lime flavor.',
  },
  {
    id: '8',
    name: 'Avocado Brunch',
    sku: 'AVB-005',
    category: 'Food',
    brand: 'GreenKitchen',
    price: 14.50,
    costPrice: 6.00,
    stock: 45,
    minStock: 10,
    status: 'active',
    publishedOnline: false,
    description: 'Toasted sourdough with smashed avocado, poached eggs, and chili flakes.',
  },
];

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

async function fetchProductsFromSupabase(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_sizes(*)')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];
  return (data as any[]).map(mapDbProduct);
}

async function createProductInSupabase(product: Product, tenantId: string): Promise<Product | null> {
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
      size: s.size,
      stock: s.stock,
      min_stock: s.minStock,
      sku: s.sku || null,
    }));
    await supabase.from('product_sizes').insert(sizesToInsert);
  }

  return mapDbProduct({ ...data, product_sizes: product.sizes || [] });
}

async function updateProductInSupabase(product: Product, tenantId: string): Promise<Product | null> {
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
    .update(updateData)
    .eq('id', product.id)
    .eq('tenant_id', tenantId);

  if (error) return null;

  await supabase.from('product_sizes').delete().eq('product_id', product.id);

  if (product.sizes && product.sizes.length > 0) {
    const sizesToInsert = product.sizes.map(s => ({
      product_id: product.id,
      size: s.size,
      stock: s.stock,
      min_stock: s.minStock,
      sku: s.sku || null,
    }));
    await supabase.from('product_sizes').insert(sizesToInsert);
  }

  const { data } = await supabase
    .from('products')
    .select('*, product_sizes(*)')
    .eq('id', product.id)
    .single();

  return data ? mapDbProduct(data) : null;
}

async function deleteProductFromSupabase(id: string, tenantId: string): Promise<boolean> {
  const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenantId);
  return !error;
}

export async function fetchProducts(tenantId: string): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    return fetchProductsFromSupabase(tenantId);
  }
  return [...mockProducts];
}

export async function createProduct(product: Product, tenantId: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    return createProductInSupabase(product, tenantId);
  }
  mockProducts.push(product);
  return product;
}

export async function updateProduct(product: Product, tenantId: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    return updateProductInSupabase(product, tenantId);
  }
  const idx = mockProducts.findIndex(p => p.id === product.id);
  if (idx !== -1) {
    mockProducts[idx] = product;
    return product;
  }
  return null;
}

export async function deleteProduct(id: string, tenantId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return deleteProductFromSupabase(id, tenantId);
  }
  const idx = mockProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockProducts.splice(idx, 1);
    return true;
  }
  return false;
}

export async function reduceStock(productId: string, quantity: number, size?: string, tenantId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
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

  const product = mockProducts.find(p => p.id === productId);
  if (!product) return false;

  if (size && product.sizes) {
    const sizeEntry = product.sizes.find(s => s.size === size);
    if (sizeEntry) {
      sizeEntry.stock = Math.max(0, sizeEntry.stock - quantity);
    }
    product.stock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  } else {
    product.stock = Math.max(0, product.stock - quantity);
  }
  return true;
}

export async function restoreStock(productId: string, quantity: number, size?: string, tenantId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
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

  const product = mockProducts.find(p => p.id === productId);
  if (!product) return false;

  if (size && product.sizes) {
    const sizeEntry = product.sizes.find(s => s.size === size);
    if (sizeEntry) {
      sizeEntry.stock += quantity;
    }
    product.stock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  } else {
    product.stock += quantity;
  }
  return true;
}
