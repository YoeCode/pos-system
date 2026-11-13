import React from 'react';
import { useI18n } from '../../i18n/useI18n';

export interface StockRowFormValues {
  stock: number;
  minStock: number;
}

interface StockRowFormProps {
  title: string;
  values: StockRowFormValues;
  onChange: (field: 'stock' | 'minStock', value: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Rich inline form card shared by every stock row (plain products and legacy
 * size rows). It mirrors the variant form UX: fields + Cancelar/Actualizar.
 * The row's persistence target is owned by the caller (updateProduct for
 * plain stock, updateProductSize for legacy size rows).
 */
const StockRowForm: React.FC<StockRowFormProps> = ({ title, values, onChange, onSubmit, onCancel }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.stock}</label>
          <input
            type="number"
            min="0"
            value={values.stock}
            onChange={e => onChange('stock', parseInt(e.target.value) || 0)}
            aria-label={t.products.stock}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.minStock}</label>
          <input
            type="number"
            min="0"
            value={values.minStock ?? 0}
            onChange={e => onChange('minStock', parseInt(e.target.value) || 0)}
            aria-label={t.products.detail.minStock}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t.products.detail.cancel}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
        >
          {t.products.detail.updateStock}
        </button>
      </div>
    </div>
  );
};

export default StockRowForm;
