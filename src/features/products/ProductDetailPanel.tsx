import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { selectProduct, updateProduct } from './productsSlice';
import type { Product } from '../../types';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';

const CATEGORIES = ['Electronics', 'Food', 'Drinks', 'Apparel', 'Bakery', 'Merchandise'];

interface FormState {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  description: string;
  publishedOnline: boolean;
  status: Product['status'];
  version: string;
}

const ProductDetailPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const product = useAppSelector(state => state.products.selectedProduct);

  const [form, setForm] = useState<FormState>({
    id: '',
    name: '',
    sku: '',
    category: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    description: '',
    publishedOnline: false,
    status: 'active',
    version: '',
  });

  useEffect(() => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        description: product.description ?? '',
        publishedOnline: product.publishedOnline,
        status: product.status,
        version: product.version ?? '',
      });
    }
  }, [product]);

  if (!product) return null;

  const handleSave = () => {
    const updated: Product = {
      ...product,
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: form.price,
      costPrice: form.costPrice,
      stock: form.stock,
      description: form.description,
      publishedOnline: form.publishedOnline,
      status: form.status,
      version: form.version,
    };
    dispatch(updateProduct(updated));
  };

  return (
    <div className="w-[380px] flex-shrink-0 bg-white border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-text-primary text-sm">Product Details</h3>
        <button
          onClick={() => dispatch(selectProduct(null))}
          className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
        {/* Image upload */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Product Image</p>
          <div className="border-2 border-dashed border-border rounded-xl h-32 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs">Click or drag to upload</p>
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Product Name</label>
          <input
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* SKU + Category */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">SKU</label>
            <input
              value={form.sku}
              onChange={e => setForm(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sale Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Cost Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
              <input
                type="number"
                step="0.01"
                value={form.costPrice}
                onChange={e => setForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Stock Level</label>
          <input
            type="number"
            value={form.stock}
            onChange={e => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Toggle */}
        <div className="p-3 rounded-lg border border-border bg-background">
          <Toggle
            checked={form.publishedOnline}
            onChange={val => setForm(prev => ({ ...prev, publishedOnline: val }))}
            label="Publish to online store"
            description="Make this product visible in the online catalog"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <Button variant="primary" fullWidth onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProductDetailPanel;
