import type { Sale } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface PaymentMethodChartProps {
  sales: Sale[];
}

const formatEUR = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const methodConfig: Record<
  string,
  { label: string; color: string; barColor: string }
> = {
  cash: { label: 'Efectivo', color: 'bg-success', barColor: 'bg-success' },
  card: {
    label: 'Tarjeta bancaria',
    color: 'bg-primary',
    barColor: 'bg-primary',
  },
  bizum: { label: 'Bizum', color: 'bg-info', barColor: 'bg-info' },
  qr: { label: 'QR', color: 'bg-info', barColor: 'bg-info' },
};

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ sales }) => {
  const t = useI18n();
  const methods: Record<string, number> = {};

  sales.forEach((sale) => {
    methods[sale.paymentMethod] =
      (methods[sale.paymentMethod] || 0) + sale.order.total;
  });

  const total = Object.values(methods).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-headline-sm text-text-primary">
          {t.pos.paymentMethod}
        </h3>
        <span className="text-label-sm text-text-muted">Hoy</span>
      </div>

      {total === 0 ? (
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <p className="text-body-md font-medium text-text-primary">
            {t.dashboard.noData}
          </p>
          <p className="text-body-sm text-text-muted">
            Los métodos de pago aparecerán tras la primera venta
          </p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex mb-4">
            {Object.entries(methods).map(([key, value]) => {
              const pct = (value / total) * 100;
              const config = methodConfig[key] || {
                barColor: 'bg-text-muted',
              };
              return (
                <div
                  key={key}
                  className={`${config.barColor} h-full`}
                  style={{ width: `${pct}%` }}
                  title={`${config?.label || key}: ${pct.toFixed(0)}%`}
                />
              );
            })}
          </div>

          {/* Method cards */}
          <div className="space-y-2.5">
            {Object.entries(methods)
              .sort(([, a], [, b]) => b - a)
              .map(([key, value]) => {
                const pct = ((value / total) * 100).toFixed(0);
                const config = methodConfig[key] || {
                  label: key,
                  color: 'bg-text-muted',
                };
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-[10px] bg-surface-container-low"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3 h-3 rounded-full ${config.color}`}
                      />
                      <span className="text-body-md font-semibold text-text-primary">
                        {config.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-body-md font-bold text-text-primary font-[tabular-nums]">
                        {formatEUR(value)}
                      </span>
                      <span className="text-label-sm text-text-muted ml-2">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentMethodChart;
