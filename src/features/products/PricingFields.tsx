import React from 'react';
import { useI18n } from '../../i18n/useI18n';

interface PricingFieldsProps {
  isEditing: boolean;
  price: number;
  costPrice: number;
  onPriceChange: (value: number) => void;
  onCostPriceChange: (value: number) => void;
}

const PricingFields: React.FC<PricingFieldsProps> = ({ isEditing, price, costPrice, onPriceChange, onCostPriceChange }) => {
  const t = useI18n();

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.salePrice}</label>
        {isEditing ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        ) : (
          <p className="text-sm font-mono text-text-primary py-2">$ {price.toFixed(2)}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.products.detail.costPrice}</label>
        {isEditing ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-mono">$</span>
            <input
              type="number"
              step="0.01"
              value={costPrice}
              onChange={e => onCostPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        ) : (
          <p className="text-sm font-mono text-text-primary py-2">$ {costPrice.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
};

export default PricingFields;
