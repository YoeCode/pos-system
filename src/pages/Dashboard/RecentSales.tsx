import type { Sale } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface RecentSalesProps {
  sales: Sale[];
}

const formatEUR = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  bizum: 'Bizum',
  qr: 'QR',
};

const methodStyles: Record<string, string> = {
  cash: 'bg-success-light text-success',
  card: 'bg-surface-container text-text-primary',
  bizum: 'bg-info-light text-info',
  qr: 'bg-info-light text-info',
};

const RecentSales: React.FC<RecentSalesProps> = ({ sales }) => {
  const t = useI18n();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-headline-sm text-text-primary">
            {t.dashboard.recentSales}
          </h3>
        </div>
      </div>
      {sales.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-body-md font-medium text-text-primary">
            {t.dashboard.noData}
          </p>
          <p className="text-body-sm text-text-muted">
            Las ventas recientes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-label-sm text-text-muted">
                <th className="pb-3 font-semibold">Ticket</th>
                <th className="pb-3 font-semibold">Hora</th>
                <th className="pb-3 font-semibold">Método</th>
                <th className="pb-3 font-semibold text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-body-md">
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-3 font-mono font-semibold text-primary">
                    {sale.order.orderNumber}
                  </td>
                  <td className="py-3 text-text-muted">
                    {formatTime(sale.completedAt)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-semibold ${methodStyles[sale.paymentMethod] || 'bg-surface-container text-text-muted'}`}
                    >
                      {methodLabels[sale.paymentMethod] || sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-text-primary font-[tabular-nums]">
                    {formatEUR(sale.order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentSales;
