import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { updateProduct, DEFAULT_CATEGORIES } from './productsSlice';
import type { Product, Employee } from '../../types';
import Toggle from '../../components/ui/Toggle';
import Button from '../../components/ui/Button';
import PinAuthModal from '../pos/PinAuthModal';

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
  const [isEditing, setIsEditing] = useState(false);

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

  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({});
  const [sizeMinStocks, setSizeMinStocks] = useState<Record<string, number>>({});

  const [snapshot, setSnapshot] = useState<FormState | null>(null);
  const [sizeSnapshot, setSizeSnapshot] = useState<Record<string, number> | null>(null);
  const [unlockedActions, setUnlockedActions] = useState<Set<'stock' | 'publish'>>(new Set());
  const [authorizedBy, setAuthorizedBy] = useState<Employee | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<'stock' | 'publish' | null>(null);

  const hasSizes = product ? !!(product.sizes && product.sizes.length > 0) : false;
  const totalSizeStock = hasSizes ? product!.sizes!.reduce((s, sz) => s + sz.stock, 0) : form.stock;

  useEffect(() => {
    if (product) {
      const data = {
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
      };
      setForm(data);
      setSnapshot(data);

      const stocks: Record<string, number> = {};
      const minStocks: Record<string, number> = {};
      product.sizes?.forEach(sz => {
        stocks[sz.size] = sz.stock;
        minStocks[sz.size] = sz.minStock ?? 0;
      });
      setSizeStocks(stocks);
      setSizeMinStocks(minStocks);
      setSizeSnapshot({ ...stocks });

      setIsEditing(false);
      setUnlockedActions(new Set());
      setAuthorizedBy(null);
      setPendingAuthAction(null);
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
    const updatedSizes = hasSizes
      ? product.sizes!.map(sz => ({
          ...sz,
          stock: sizeStocks[sz.size] ?? sz.stock,
          minStock: sizeMinStocks[sz.size] ?? sz.minStock ?? 0,
        }))
      : undefined;

    const updated: Product = {
      ...product,
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: form.price,
      costPrice: form.costPrice,
      stock: hasSizes ? totalSizeStock : form.stock,
      minStock: form.minStock,
      description: form.description,
      publishedOnline: form.publishedOnline,
      status: form.status,
      version: form.version,
      image: form.image || undefined,
      sizes: updatedSizes,
    };
    dispatch(updateProduct(updated));
    setIsEditing(false);
    setUnlockedActions(new Set());
    setAuthorizedBy(null);
    setPendingAuthAction(null);
  };

  const handleCancel = () => {
    if (snapshot) setForm(snapshot);
    if (sizeSnapshot) setSizeStocks(sizeSnapshot);
    setIsEditing(false);
    setUnlockedActions(new Set());
    setAuthorizedBy(null);
    setPendingAuthAction(null);
  };

  const handleEdit = () => {
    setSnapshot({ ...form });
    setSizeSnapshot({ ...sizeStocks });
    setIsEditing(true);
    setUnlockedActions(new Set());
    setAuthorizedBy(null);
    setPendingAuthAction(null);
  };

  const requestAuth = (action: 'stock' | 'publish') => {
    setPendingAuthAction(action);
    setShowPinModal(true);
  };

  const handleStockAuthSuccess = (employee: Employee) => {
    setAuthorizedBy(employee);
    if (pendingAuthAction) {
      setUnlockedActions(prev => new Set(prev).add(pendingAuthAction));
    }
    setShowPinModal(false);
    setPendingAuthAction(null);
  };

  const statusLabel = form.status === 'active' ? 'Active' : form.status === 'inactive' ? 'Inactive' : 'Draft';

  const stockLabel = hasSizes ? 'Total Stock (by size)' : 'Stock Level';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white rounded-xl border border-border">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <h3 className="text-xl font-bold text-text-primary">Product Details</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Product Image</p>
          {isEditing ? (
            <>
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
            </>
          ) : form.image ? (
            <div className="h-32 rounded-xl overflow-hidden bg-gray-100">
              <img src={form.image} alt="Product" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="h-32 rounded-xl border border-border bg-gray-50 flex items-center justify-center text-text-muted">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Product Name</label>
          {isEditing ? (
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          ) : (
            <p className="text-sm text-text-primary py-2">{form.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description</label>
          {isEditing ? (
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            />
          ) : (
            <p className="text-sm text-text-muted py-2">{form.description || '—'}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">SKU</label>
            {isEditing ? (
              <input
                value={form.sku}
                onChange={e => setForm(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            ) : (
              <p className="text-sm font-mono text-text-primary py-2">{form.sku}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Category</label>
            {isEditing ? (
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-text-primary py-2">{form.category}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sale Price</label>
            {isEditing ? (
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
            ) : (
              <p className="text-sm font-mono text-text-primary py-2">${form.price.toFixed(2)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Cost Price</label>
            {isEditing ? (
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
            ) : (
              <p className="text-sm font-mono text-text-primary py-2">${form.costPrice.toFixed(2)}</p>
            )}
          </div>
        </div>

        {hasSizes ? (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stockLabel}</label>
              <p className="text-lg font-mono font-bold text-text-primary py-2">{totalSizeStock}</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Stock by Size</label>
                {isEditing && !unlockedActions.has('stock') && (
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock
                  </button>
                )}
              </div>
              {unlockedActions.has('stock') && authorizedBy && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Authorized by {authorizedBy.name}
                </p>
              )}
              <div className="grid grid-cols-4 gap-2">
                {product.sizes!.map(sizeOption => {
                  const minStock = sizeMinStocks[sizeOption.size] ?? sizeOption.minStock ?? 0;
                  const currentStock = sizeStocks[sizeOption.size] ?? sizeOption.stock;
                  const isLow = currentStock <= minStock;
                  const isEditable = isEditing && unlockedActions.has('stock');

                  return (
                    <div
                      key={sizeOption.size}
                      className={`p-3 rounded-lg border text-center ${
                        isLow
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-border bg-background'
                      }`}
                    >
                      <p className="text-sm font-semibold text-text-primary">{sizeOption.size}</p>
                      {isEditable ? (
                        <input
                          type="number"
                          min="0"
                          value={currentStock}
                          onChange={e => setSizeStocks(prev => ({ ...prev, [sizeOption.size]: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 px-2 py-1 text-center text-lg font-mono font-bold border border-primary rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <p className={`text-lg font-mono font-bold mt-1 ${isLow ? 'text-amber-600' : 'text-text-primary'}`}>
                          {currentStock}
                        </p>
                      )}
                      {isEditable ? (
                        <input
                          type="number"
                          min="0"
                          value={minStock}
                          onChange={e => setSizeMinStocks(prev => ({ ...prev, [sizeOption.size]: parseInt(e.target.value) || 0 }))}
                          className="w-full mt-1 px-2 py-0.5 text-center text-xs font-mono border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                          placeholder="min"
                        />
                      ) : (
                        <p className="text-xs text-text-muted mt-0.5">min: {minStock}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stockLabel}</label>
                {isEditing && !unlockedActions.has('stock') && (
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock
                  </button>
                )}
              </div>
              {isEditing ? (
                unlockedActions.has('stock') ? (
                  <div className="flex flex-col gap-1">
                    <input
                      type="number"
                      value={form.stock}
                      onChange={e => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 text-sm border border-primary rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    {authorizedBy && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Authorized by {authorizedBy.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2.5 text-sm border border-border rounded-lg bg-gray-50 text-text-muted font-mono flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {form.stock}
                  </div>
                )
              ) : (
                <p className="text-sm font-mono text-text-primary py-2">{form.stock}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Min. Stock</label>
              {isEditing ? (
                unlockedActions.has('stock') ? (
                  <input
                    type="number"
                    min="0"
                    value={form.minStock}
                    onChange={e => setForm(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 text-sm border border-primary rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2.5 text-sm border border-border rounded-lg bg-gray-50 text-text-muted font-mono flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {form.minStock}
                  </div>
                )
              ) : (
                <p className="text-sm font-mono text-text-primary py-2">{form.minStock}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Status</label>
          {isEditing ? (
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Product['status'] }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          ) : (
            <p className="text-sm text-text-primary py-2">{statusLabel}</p>
          )}
        </div>

        <div className="p-3 rounded-lg border border-border bg-background">
          {isEditing ? (
            <>
              {unlockedActions.has('publish') && authorizedBy && (
                <p className="text-xs text-green-600 flex items-center gap-1 mb-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Authorized by {authorizedBy.name}
                </p>
              )}
              {unlockedActions.has('publish') ? (
              <Toggle
                checked={form.publishedOnline}
                onChange={val => setForm(prev => ({ ...prev, publishedOnline: val }))}
                label="Publish to online store"
                description="Make this product visible in the online catalog"
              />
            ) : (
              <button
                onClick={() => requestAuth('publish')}
                className="w-full flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${form.publishedOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-sm text-text-primary">
                    {form.publishedOnline ? 'Published to online store' : 'Not published'}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Unlock
                </span>
              </button>
            )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${form.publishedOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-text-primary">
                {form.publishedOnline ? 'Published to online store' : 'Not published'}
              </span>
            </div>
          )}
        </div>
      </div>

      <PinAuthModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPendingAuthAction(null); }}
        onSuccess={handleStockAuthSuccess}
        title={pendingAuthAction === 'publish' ? 'Authorize Publish Change' : 'Authorize Stock Edit'}
        description={pendingAuthAction === 'publish' ? 'Publishing changes require supervisor authorization' : 'Stock changes require supervisor authorization'}
      />
    </div>
  );
};

export default ProductDetailPanel;
