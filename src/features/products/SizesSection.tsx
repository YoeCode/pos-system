import React, { useState, useRef, useEffect } from 'react';
import type { Product, ProductSize } from '../../types';
import { useI18n } from '../../i18n/useI18n';
import { usePermission } from '../../hooks/usePermission';

interface SizesSectionProps {
  product: Product;
  sizes: ProductSize[];
  onSizeFieldChange: (index: number, field: 'stock' | 'minStock', value: number) => void;
  onUpdateSize: (size: ProductSize) => Promise<void>;
}

const SizesSection: React.FC<SizesSectionProps> = ({
  product,
  sizes,
  onSizeFieldChange,
  onUpdateSize,
}) => {
  const t = useI18n();
  const { hasPermission } = usePermission();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editOriginalRef = useRef<ProductSize | null>(null);

  const canEdit = hasPermission('product:edit');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setEditingIndex(null);
    setOpenMenuIndex(null);
    editOriginalRef.current = null;
  }, [product.id]);

  if (product.hasVariants || sizes.length === 0) return null;

  const editingSize = editingIndex !== null ? sizes[editingIndex] : null;

  const openEditForm = (index: number) => {
    editOriginalRef.current = { ...sizes[index] };
    setEditingIndex(index);
    setOpenMenuIndex(null);
  };

  const handleCancelEdit = () => {
    const original = editOriginalRef.current;
    if (original && editingIndex !== null) {
      onSizeFieldChange(editingIndex, 'stock', original.stock);
      onSizeFieldChange(editingIndex, 'minStock', original.minStock ?? 0);
    }
    editOriginalRef.current = null;
    setEditingIndex(null);
  };

  const handleUpdateSize = async () => {
    if (!editingSize || editingIndex === null) return;
    await onUpdateSize(editingSize);
    editOriginalRef.current = null;
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.stockBySize}</label>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-4 gap-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <span>{t.products.detail.size}</span>
          <span>{t.products.stock}</span>
          <span>{t.products.detail.minStock}</span>
          <span aria-hidden="true"></span>
        </div>
        {sizes.map((s, idx) => (
          <div key={s.size} className="grid grid-cols-4 gap-2 items-center px-2 py-2 rounded-lg border border-border bg-background text-sm">
            <span className="font-medium text-text-primary truncate">{s.size}</span>
            <span className={`font-mono text-xs font-semibold ${s.stock <= (s.minStock ?? 0) ? 'text-amber-600' : 'text-text-primary'}`}>
              {s.stock}
            </span>
            <span className="font-mono text-xs text-text-muted">
              {s.minStock ?? 0}
            </span>
            <div className="flex items-center justify-center">
              {canEdit ? (
                <div className="relative" ref={openMenuIndex === idx ? menuRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setOpenMenuIndex(openMenuIndex === idx ? null : idx)}
                    className="w-7 h-7 flex items-center justify-center text-text-muted border border-border rounded hover:bg-gray-100 transition-colors"
                    aria-label="acciones"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {openMenuIndex === idx && (
                    <div className="absolute right-0 top-full mt-1 z-10 w-32 bg-white border border-border rounded-lg shadow-lg py-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(idx)}
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
          </div>
        ))}
      </div>

      {editingSize && editingIndex !== null && (
        <div className="flex flex-col gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {t.products.detail.size}: {editingSize.size}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.stock}</label>
              <input
                type="number"
                min="0"
                value={editingSize.stock}
                onChange={e => onSizeFieldChange(editingIndex, 'stock', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.minStock}</label>
              <input
                type="number"
                min="0"
                value={editingSize.minStock ?? 0}
                onChange={e => onSizeFieldChange(editingIndex, 'minStock', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.products.detail.cancel}
            </button>
            <button
              type="button"
              onClick={handleUpdateSize}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              {t.products.detail.updateSize}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizesSection;
