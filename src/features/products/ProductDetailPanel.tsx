import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateProduct, DEFAULT_CATEGORIES } from './productsSlice';
import type { Product } from '../../types';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';

interface FormState {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  description: string;
  publishedOnline: boolean;
  status: Product['status'];
  version: string;
  image: string;
}

const ProductDetailPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const product = useAppSelector(state => state.products.selectedProduct);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState<FormState>({
    id: '',
    name: '',
    sku: '',
    category: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 0,
    description: '',
    publishedOnline: false,
    status: 'active',
    version: '',
    image: '',
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
        minStock: product.minStock,
        description: product.description ?? '',
        publishedOnline: product.publishedOnline,
        status: product.status,
        version: product.version ?? '',
        image: product.image ?? '',
      });
    }
  }, [product]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) setForm(prev => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
      minStock: form.minStock,
      description: form.description,
      publishedOnline: form.publishedOnline,
      status: form.status,
      version: form.version,
      image: form.image || undefined,
    };
    dispatch(updateProduct(updated));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white rounded-xl border border-border">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <h3 className="text-xl font-bold text-text-primary">Product Details</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Image upload */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Product Image</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {form.image ? (
              <div className="relative w-full h-full">
                <img src={form.image} alt="Product" className="w-full h-full object-contain rounded-xl" />
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setForm(prev => ({ ...prev, image: '' }));
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs">Click or drag to upload</p>
              </>
            )}
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
              {DEFAULT_CATEGORIES.map(cat => (
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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Stock Level</label>
            <input
              type="number"
              value={form.stock}
              onChange={e => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Min. Stock</label>
            <input
              type="number"
              min="0"
              value={form.minStock}
              onChange={e => setForm(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
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
      <div className="px-6 py-5 border-t border-border">
        <Button variant="primary" fullWidth onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProductDetailPanel;
