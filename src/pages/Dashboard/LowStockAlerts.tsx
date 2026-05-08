import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/store';
import { selectLowStockAlerts } from '../../features/products/productsSlice';
import { useI18n } from '../../i18n/I18nProvider';

const LowStockAlerts: React.FC = () => {
  const t = useI18n();
  const navigate = useNavigate();
  const alerts = useAppSelector(selectLowStockAlerts);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{t.products.lowStock}</h3>
        {alerts.length > 0 && (
          <button
            onClick={() => navigate('/inventory?tab=lowstock')}
            className="text-xs text-primary hover:text-primary-dark font-medium"
          >
            Ver todo
          </button>
        )}
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">{t.dashboard.noData}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.slice(0, 5).map(alert => {
            const isCritical = alert.severity === 'critical';
            const pct = alert.minStock > 0 ? (alert.stock / alert.minStock) * 100 : 0;
            return (
              <div key={alert.productId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-medium text-text-primary truncate max-w-[140px]">
                      {alert.productName}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-semibold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                    {alert.stock}/{alert.minStock}
                  </span>
                </div>
                {alert.sizes && alert.sizes.length > 0 && (
                  <div className="flex gap-1 ml-4 flex-wrap">
                    {alert.sizes.map(s => (
                      <span
                        key={s.size}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${s.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {s.size}: {s.stock}
                      </span>
                    ))}
                  </div>
                )}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {alerts.length > 5 && (
            <p className="text-xs text-text-muted text-center">
              +{alerts.length - 5} más
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;
