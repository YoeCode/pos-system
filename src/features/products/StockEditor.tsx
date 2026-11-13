import React, { useState, useRef, useEffect } from 'react';
import type { Product, ProductSize, ProductVariant, ProductAttribute } from '../../types';
import { useI18n } from '../../i18n/useI18n';
import { usePermission } from '../../hooks/usePermission';
import StockRowForm from './StockRowForm';
import VariantsSection from './VariantsSection';

export interface StockEditorProps {
  product: Product;
  isEditing: boolean;
  variantAttributes: string[];
  attributes: ProductAttribute[];
  sizes: ProductSize[];
  onSizeFieldChange: (index: number, field: 'stock' | 'minStock', value: number) => void;
  onUpdateSize: (size: ProductSize) => Promise<void>;
  onUpdateStock: (stock: number, minStock: number) => Promise<void>;
  onAddVariant: (variant: Omit<ProductVariant, 'id'>) => Promise<void>;
  onUpdateVariant: (variant: ProductVariant) => Promise<void>;
  onDeleteVariant: (variantId: string) => Promise<void>;
}

/**
 * One stock editor for every product shape, built on the variant-style UX
 * (rows -> kebab -> rich inline form -> Cancelar/Actualizar).
 *
 * Persistence routes per backing shape:
 * - Plain products -> onUpdateStock (products.stock / products.min_stock)
 * - Legacy size rows -> onUpdateSize (product_sizes via updateProductSize)
 * - Variant rows -> VariantsSection callbacks (product_variants)
 */
const StockEditor: React.FC<StockEditorProps> = ({
  product,
  isEditing,
  variantAttributes,
  attributes,
  sizes,
  onSizeFieldChange,
  onUpdateSize,
  onUpdateStock,
  onAddVariant,
  onUpdateVariant,
  onDeleteVariant,
}) => {
  const t = useI18n();
  const { hasPermission } = usePermission();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPlain, setEditingPlain] = useState(false);
  const [plainForm, setPlainForm] = useState({ stock: 0, minStock: 0 });
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editOriginalRef = useRef<ProductSize | null>(null);

  const canEdit = hasPermission('product:edit');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setEditingIndex(null);
    setEditingPlain(false);
    setOpenMenuKey(null);
    editOriginalRef.current = null;
  }, [product.id]);

  const openSizeEdit = (index: number) => {
    editOriginalRef.current = { ...sizes[index] };
    setEditingIndex(index);
    setOpenMenuKey(null);
  };

  const handleCancelSizeEdit = () => {
    const original = editOriginalRef.current;
    if (original && editingIndex !== null) {
      onSizeFieldChange(editingIndex, 'stock', original.stock);
      onSizeFieldChange(editingIndex, 'minStock', original.minStock ?? 0);
    }
    editOriginalRef.current = null;
    setEditingIndex(null);
  };

  const handleUpdateSize = async () => {
    if (editingIndex === null) return;
    await onUpdateSize(sizes[editingIndex]);
    editOriginalRef.current = null;
    setEditingIndex(null);
  };

  const openPlainEdit = () => {
    setPlainForm({ stock: product.stock, minStock: product.minStock ?? 0 });
    setEditingPlain(true);
    setOpenMenuKey(null);
  };

  const handleUpdatePlain = async () => {
    await onUpdateStock(plainForm.stock, plainForm.minStock);
    setEditingPlain(false);
  };

  const renderKebab = (menuKey: string, onEdit: () => void) => (
    <div className="flex items-center justify-center">
      {canEdit ? (
        <div className="relative" ref={openMenuKey === menuKey ? menuRef : undefined}>
          <button
            type="button"
            onClick={() => setOpenMenuKey(openMenuKey === menuKey ? null : menuKey)}
            className="w-7 h-7 flex items-center justify-center text-text-muted border border-border rounded hover:bg-gray-100 transition-colors"
            aria-label={t.common.actions}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {openMenuKey === menuKey && (
            <div className="absolute right-0 top-full mt-1 z-10 w-32 bg-white border border-border rounded-lg shadow-lg py-1">
              <button
                type="button"
                onClick={onEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t.common.edit}
              </button>
            </div>
          )}
        </div>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      )}
    </div>
  );

  const showVariants = product.hasVariants || (isEditing && variantAttributes.length > 0);

  if (showVariants) {
    return (
      <VariantsSection
        product={product}
        isEditing={isEditing}
        variantAttributes={variantAttributes}
        attributes={attributes}
        onAddVariant={onAddVariant}
        onUpdateVariant={onUpdateVariant}
        onDeleteVariant={onDeleteVariant}
      />
    );
  }

  if (sizes.length > 0) {
    const editingSize = editingIndex !== null ? sizes[editingIndex] : null;
    return (
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.stockBySize}</label>
        {editingSize && editingIndex !== null ? (
          <StockRowForm
            title={`${t.products.detail.size}: ${editingSize.size}`}
            values={{ stock: editingSize.stock, minStock: editingSize.minStock ?? 0 }}
            onChange={(field, value) => onSizeFieldChange(editingIndex, field, value)}
            onSubmit={handleUpdateSize}
            onCancel={handleCancelSizeEdit}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-4 gap-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <span>{t.products.detail.size}</span>
              <span>{t.products.stock}</span>
              <span>{t.products.detail.minStock}</span>
              <span aria-hidden="true"></span>
            </div>
            {sizes.map((s, idx) => (
              <div key={s.size} className="grid grid-cols-4 gap-2 items-center px-2 py-2 rounded-lg border border-border bg-background text-sm">
                <span className="inline-flex items-center w-fit max-w-full px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium truncate">{s.size}</span>
                <span className={`font-mono text-xs font-semibold ${s.stock <= (s.minStock ?? 0) ? 'text-amber-600' : 'text-text-primary'}`}>
                  {s.stock}
                </span>
                <span className="font-mono text-xs text-text-muted">{s.minStock ?? 0}</span>
                {renderKebab(`size-${idx}`, () => openSizeEdit(idx))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.stockLevel}</label>
      {editingPlain ? (
        <StockRowForm
          title={t.products.detail.stockLevel}
          values={plainForm}
          onChange={(field, value) => setPlainForm(prev => ({ ...prev, [field]: value }))}
          onSubmit={handleUpdatePlain}
          onCancel={() => setEditingPlain(false)}
        />
      ) : (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-4 gap-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <span>{t.products.sku}</span>
            <span>{t.products.stock}</span>
            <span>{t.products.detail.minStock}</span>
            <span aria-hidden="true"></span>
          </div>
          <div className="grid grid-cols-4 gap-2 items-center px-2 py-2 rounded-lg border border-border bg-background text-sm">
            <span className="font-mono text-xs text-text-primary truncate">{product.sku}</span>
            <span className={`font-mono text-xs font-semibold ${product.stock <= (product.minStock ?? 0) ? 'text-amber-600' : 'text-text-primary'}`}>
              {product.stock}
            </span>
            <span className="font-mono text-xs text-text-muted">{product.minStock ?? 0}</span>
            {renderKebab('plain', openPlainEdit)}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockEditor;
