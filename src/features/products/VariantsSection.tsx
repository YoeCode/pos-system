import React, { useState, useRef, useEffect } from 'react';
import type { Product, ProductVariant } from '../../types';
import type { ProductAttribute } from '../../types';
import { useI18n } from '../../i18n/useI18n';
import { usePermission } from '../../hooks/usePermission';

interface VariantForm {
  sku: string;
  price: number | null;
  costPrice: number | null;
  stock: number;
  minStock: number;
  attributes: Record<string, string>;
}

interface VariantsSectionProps {
  product: Product;
  isEditing: boolean;
  variantAttributes: string[];
  attributes: ProductAttribute[];
  onAddVariant: (variant: Omit<ProductVariant, 'id'>) => Promise<void>;
  onUpdateVariant: (variant: ProductVariant) => Promise<void>;
  onDeleteVariant: (variantId: string) => Promise<void>;
}

const defaultVariantForm: VariantForm = {
  sku: '',
  price: null,
  costPrice: null,
  stock: 0,
  minStock: 0,
  attributes: {},
};

const VariantsSection: React.FC<VariantsSectionProps> = ({
  product,
  isEditing,
  variantAttributes,
  attributes,
  onAddVariant,
  onUpdateVariant,
  onDeleteVariant,
}) => {
  const t = useI18n();
  const { hasPermission } = usePermission();
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(defaultVariantForm);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canEdit = hasPermission('product:edit');
  const canDelete = hasPermission('product:delete');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetVariantForm = () => {
    setVariantForm({ ...defaultVariantForm, attributes: {} });
  };

  const handleAddVariant = async () => {
    if (!variantForm.sku.trim()) return;
    await onAddVariant({
      productId: product.id,
      sku: variantForm.sku,
      price: variantForm.price,
      costPrice: variantForm.costPrice,
      stock: variantForm.stock,
      minStock: variantForm.minStock,
      image: null,
      attributes: variantForm.attributes,
      status: 'active',
    });
    resetVariantForm();
    setShowVariantForm(false);
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant) return;
    await onUpdateVariant({
      ...editingVariant,
      sku: variantForm.sku,
      price: variantForm.price,
      costPrice: variantForm.costPrice,
      stock: variantForm.stock,
      minStock: variantForm.minStock,
      attributes: variantForm.attributes,
    });
    resetVariantForm();
    setEditingVariant(null);
    setShowVariantForm(false);
  };

  const handleDeleteVariant = async (variantId: string) => {
    await onDeleteVariant(variantId);
    setOpenMenuId(null);
  };

  const openEditForm = (v: ProductVariant) => {
    setEditingVariant(v);
    setVariantForm({
      sku: v.sku,
      price: v.price,
      costPrice: v.costPrice,
      stock: v.stock,
      minStock: v.minStock,
      attributes: { ...v.attributes },
    });
    setShowVariantForm(true);
    setOpenMenuId(null);
  };

  const resolvePrice = (price: number | null): number => price ?? product.price;
  const resolveCostPrice = (costPrice: number | null): number => costPrice ?? product.costPrice;

  const showVariants = product.hasVariants || (isEditing && variantAttributes.length > 0);

  if (!showVariants) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.variants}</label>
        {isEditing && (
          <button
            type="button"
            onClick={() => { resetVariantForm(); setEditingVariant(null); setShowVariantForm(true); }}
            className="text-xs text-primary hover:underline"
          >
            {t.products.detail.addVariant}
          </button>
        )}
      </div>

      {product.variants && product.variants.length > 0 && !showVariantForm && (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-8 gap-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <span>{t.products.sku}</span>
            <span className="col-span-2">{t.products.detail.attributes}</span>
            <span>{t.products.detail.salePrice}</span>
            <span>{t.products.detail.costPrice}</span>
            <span>{t.products.stock}</span>
            <span>{t.products.detail.minStock}</span>
            <span>{t.common.status}</span>
          </div>
          {product.variants.map(v => (
            <div key={v.id} className="grid grid-cols-8 gap-2 items-center px-2 py-2 rounded-lg border border-border bg-background text-sm">
              <span className="font-mono text-xs text-text-primary truncate">{v.sku}</span>
              <div className="col-span-2 flex flex-wrap gap-1">
                {Object.entries(v.attributes).map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {key}: {val}
                  </span>
                ))}
              </div>
              <span className="font-mono text-xs text-text-primary">
                $ {resolvePrice(v.price).toFixed(2)}
              </span>
              <span className="font-mono text-xs text-text-primary">
                $ {resolveCostPrice(v.costPrice).toFixed(2)}
              </span>
              <span className={`font-mono text-xs font-semibold ${v.stock <= v.minStock ? 'text-amber-600' : 'text-text-primary'}`}>
                {v.stock}
              </span>
              <span className="font-mono text-xs text-text-muted">
                {v.minStock}
              </span>
              <div className="flex items-center justify-center">
                {(canEdit || canDelete) ? (
                  <div className="relative" ref={openMenuId === v.id ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                      className="w-7 h-7 flex items-center justify-center text-text-muted border border-border rounded hover:bg-gray-100 transition-colors"
                      aria-label="acciones"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {openMenuId === v.id && (
                      <div className="absolute right-0 top-full mt-1 z-10 w-36 bg-white border border-border rounded-lg shadow-lg py-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditForm(v)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {t.common.edit}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {t.common.delete}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showVariantForm && (
        <div className="flex flex-col gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {editingVariant ? t.products.detail.editVariantTitle : t.products.detail.newVariant}
            </p>
            {!editingVariant && (
              <p className="text-xs text-text-muted mt-1">{t.products.detail.variantHelperText}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.sku}</label>
              <input
                value={variantForm.sku}
                onChange={e => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.salePrice}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={variantForm.price ?? ''}
                  placeholder={`${t.products.detail.inheritsFromParent}: $${product.price.toFixed(2)}`}
                  onChange={e => setVariantForm(prev => ({ ...prev, price: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                  className="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.costPrice}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={variantForm.costPrice ?? ''}
                  placeholder={`${t.products.detail.inheritsFromParent}: $${product.costPrice.toFixed(2)}`}
                  onChange={e => setVariantForm(prev => ({ ...prev, costPrice: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                  className="w-full pl-7 pr-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.stock}</label>
                <input
                  type="number"
                  min="0"
                  value={variantForm.stock}
                  onChange={e => setVariantForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.minStock}</label>
                <input
                  type="number"
                  min="0"
                  value={variantForm.minStock}
                  onChange={e => setVariantForm(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {variantAttributes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.attributes}</p>
              <div className="grid grid-cols-2 gap-3">
                {variantAttributes.map((attrName: string) => {
                  const attr = attributes.find(a => a.name === attrName);
                  const values = attr?.values || [];
                  return (
                    <div key={attrName} className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{attrName}</label>
                      <select
                        value={variantForm.attributes[attrName] || ''}
                        onChange={e => setVariantForm(prev => ({
                          ...prev,
                          attributes: { ...prev.attributes, [attrName]: e.target.value },
                        }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white"
                      >
                        <option value="">{t.products.detail.selectAttribute}</option>
                        {values.map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowVariantForm(false); setEditingVariant(null); resetVariantForm(); }}
              className="px-3 py-1.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.products.detail.cancel}
            </button>
            <button
              type="button"
              onClick={editingVariant ? handleUpdateVariant : handleAddVariant}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              {editingVariant ? t.products.detail.updateVariant : t.products.detail.createVariant}
            </button>
          </div>
        </div>
      )}

      {!showVariantForm && (!product.variants || product.variants.length === 0) && (
        <p className="text-xs text-text-muted italic">{t.products.detail.noVariants}</p>
      )}
    </div>
  );
};

export default VariantsSection;
