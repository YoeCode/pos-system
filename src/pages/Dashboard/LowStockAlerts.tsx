import type { Product } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';

interface LowStockAlertsProps {
  products: Product[];
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ products }) => {
  const t = useI18n();
  return (
  <div>
    <h3 className="text-sm font-semibold text-text-primary mb-4">{t.products.lowStock}</h3>
    {products.length === 0 ? (
      <p className="text-sm text-text-muted text-center py-8">{t.dashboard.noData}</p>
    ) : (
      <div className="flex flex-col gap-3">
        {products.map(product => {
          const isOut = product.stock === 0;
          const pct = product.minStock > 0 ? (product.stock / product.minStock) * 100 : 0;
          return (
            <div key={product.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOut ? 'bg-error' : 'bg-amber-500'}`} />
                  <span className="text-sm font-medium text-text-primary truncate max-w-[140px]">
                    {product.name}
                  </span>
                </div>
                <span className={`text-xs font-mono font-semibold ${isOut ? 'text-error' : 'text-amber-600'}`}>
                  {product.stock}/{product.minStock}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOut ? 'bg-error' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);};

export default LowStockAlerts;
