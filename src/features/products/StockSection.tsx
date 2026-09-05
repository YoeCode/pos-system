import React from 'react';

interface StockSectionProps {
  stock: number;
  stockLabel: string;
}

const StockSection: React.FC<StockSectionProps> = ({ stock, stockLabel }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{stockLabel}</label>
      <p className="text-lg font-mono font-bold text-text-primary py-2">{stock}</p>
    </div>
  );
};

export default StockSection;
