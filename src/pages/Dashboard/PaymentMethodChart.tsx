import type { Sale } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface PaymentMethodChartProps {
  sales: Sale[];
}

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ sales }) => {
  const t = useI18n();
  const methods: Record<string, number> = { cash: 0, card: 0, bizum: 0 };
  const labels: Record<string, string> = { 
    cash: t.pos.cash, 
    card: t.pos.card, 
    bizum: t.pos.bizum 
  };
  const colors: Record<string, string> = { cash: 'bg-emerald-500', card: 'bg-blue-500', bizum: 'bg-violet-500' };

  sales.forEach(sale => {
    methods[sale.paymentMethod] = (methods[sale.paymentMethod] || 0) + sale.order.total;
  });

  const total = Object.values(methods).reduce((s, v) => s + v, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t.pos.paymentMethod}</h3>
      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">{t.dashboard.noData}</p>
          <p className="text-xs text-text-muted">Los métodos de pago aparecerán tras la primera venta</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(methods).map(([key, value]) => {
            const pct = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[key]}`} />
                    <span className="text-sm text-text-primary">{labels[key]}</span>
                  </div>
                  <span className="text-sm font-mono text-text-muted">${value.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colors[key]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodChart;
