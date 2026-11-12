import React from 'react';

interface StockSectionProps {
  stock: number;
  stockLabel: string;
  isEditing?: boolean;
  onStockChange?: (value: number) => void;
}

const StockSection: React.FC<StockSectionProps> = ({ stock, stockLabel, isEditing, onStockChange }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stockLabel}</label>
      {isEditing && onStockChange ? (
        <input
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={e => onStockChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          aria-label={stockLabel}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      ) : (
        <p className="text-lg font-mono font-bold text-text-primary py-2">{stock}</p>
      )}
    </div>
  );
};

export default StockSection;
