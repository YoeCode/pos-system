import type { Sale } from '../../types';
import { useI18n } from '../../i18n/useI18n';

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
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">{t.dashboard.noData}</p>
          <p className="text-xs text-text-muted">Las ventas recientes aparecerán aquí</p>
        </div>
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
