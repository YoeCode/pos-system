import type { Sale } from '../../types';

interface PaymentMethodChartProps {
  sales: Sale[];
}

const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ sales }) => {
  const methods: Record<string, number> = { cash: 0, card: 0, qr: 0 };
  const labels: Record<string, string> = { cash: 'Cash', card: 'Card', qr: 'QR Code' };
  const colors: Record<string, string> = { cash: 'bg-emerald-500', card: 'bg-blue-500', qr: 'bg-violet-500' };

  sales.forEach(sale => {
    methods[sale.paymentMethod] = (methods[sale.paymentMethod] || 0) + sale.order.total;
  });

  const total = Object.values(methods).reduce((s, v) => s + v, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Payment Methods</h3>
      {total === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">No sales data</p>
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
