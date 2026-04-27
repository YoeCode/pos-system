import type { Sale } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';

interface SalesChartProps {
  sales: Sale[];
}

const SalesChart: React.FC<SalesChartProps> = ({ sales }) => {
  const t = useI18n();
  const hoursMap = new Map<number, number>();
  sales.forEach(sale => {
    const hour = new Date(sale.completedAt).getHours();
    hoursMap.set(hour, (hoursMap.get(hour) || 0) + sale.order.total);
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxVal = Math.max(...hours.map(h => hoursMap.get(h) || 0), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t.dashboard.salesChart}</h3>
      <div className="flex items-end gap-1 h-40">
        {hours.map(hour => {
          const val = hoursMap.get(hour) || 0;
          const height = (val / maxVal) * 100;
          return (
            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/40 relative group"
                style={{ height: `${Math.max(height, 2)}%` }}
              >
                {val > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${val.toFixed(0)}
                  </div>
                )}
              </div>
              {hour % 4 === 0 && (
                <span className="text-xs text-text-muted">{hour.toString().padStart(2, '0')}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesChart;
