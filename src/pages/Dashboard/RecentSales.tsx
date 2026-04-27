import type { Sale } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';

interface RecentSalesProps {
  sales: Sale[];
}

const RecentSales: React.FC<RecentSalesProps> = ({ sales }) => {
  const t = useI18n();
  const methodColors: Record<string, string> = {
    cash: 'bg-emerald-100 text-emerald-700',
    card: 'bg-blue-100 text-blue-700',
    qr: 'bg-violet-100 text-violet-700',
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t.dashboard.recentSales}</h3>
      {sales.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">{t.dashboard.noData}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {sales.map(sale => (
            <div key={sale.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {sale.order.orderNumber.split('-')[1]}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{sale.order.orderNumber}</p>
                  <p className="text-xs text-text-muted">{sale.order.items.length} items</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${methodColors[sale.paymentMethod]}`}>
                  {sale.paymentMethod}
                </span>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-text-primary">${sale.order.total.toFixed(2)}</p>
                  <p className="text-xs text-text-muted">{formatTime(sale.completedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentSales;
