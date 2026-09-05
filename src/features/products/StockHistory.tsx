import React from 'react';
import type { StockMovement } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface StockHistoryProps {
  movements: StockMovement[];
}

const StockHistory: React.FC<StockHistoryProps> = ({ movements }) => {
  const t = useI18n();

  if (movements.length === 0) return null;

  return (
    <div className="px-6 py-5 border-t border-border">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t.products.detail.stockHistory}</p>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {movements.map(m => (
          <div key={m.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                m.type === 'sale' ? 'bg-red-400' :
                m.type === 'restock' ? 'bg-green-400' :
                'bg-amber-400'
              }`} />
              <span className="text-text-primary font-medium capitalize">{m.type}</span>
              {m.size && <span className="text-xs text-text-muted">({m.size})</span>}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-text-muted">{m.previousStock} → {m.newStock}</span>
              <span className={`font-mono text-xs font-semibold ${m.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {m.quantity >= 0 ? '+' : ''}{m.quantity}
              </span>
              <span className="text-xs text-text-muted w-28 text-right">
                {new Date(m.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockHistory;
