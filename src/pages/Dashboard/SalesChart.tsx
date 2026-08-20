import type { Sale } from '../../types';
import { useI18n } from '../../i18n/useI18n';

interface SalesChartProps {
  sales: Sale[];
}

const SalesChart: React.FC<SalesChartProps> = ({ sales }) => {
  const t = useI18n();

  const totalSales = sales.reduce((sum, s) => sum + s.order.total, 0);

  if (sales.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-4">{t.dashboard.salesChart}</h3>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">{t.dashboard.noData}</p>
          <p className="text-xs text-text-muted">Los datos de ventas aparecerán tras la primera venta</p>
        </div>
      </div>
    );
  }

  const timeBlocks = [
    { label: '00-04', start: 0, end: 4 },
    { label: '04-08', start: 4, end: 8 },
    { label: '08-12', start: 8, end: 12 },
    { label: '12-16', start: 12, end: 16 },
    { label: '16-20', start: 16, end: 20 },
    { label: '20-24', start: 20, end: 24 },
  ];

  const blockValues = timeBlocks.map(block => {
    let total = 0;
    for (let h = block.start; h < block.end; h++) {
      total += sales
        .filter(s => new Date(s.completedAt).getHours() === h)
        .reduce((sum, s) => sum + s.order.total, 0);
    }
    return { ...block, total };
  });

  const maxVal = Math.max(...blockValues.map(b => b.total), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4">{t.dashboard.salesChart}</h3>
      <p className="text-xs text-text-muted mb-3">{sales.length} ventas · ${totalSales.toFixed(2)} total</p>
      <div className="flex items-end gap-2 h-40">
        {blockValues.map(block => {
          const height = (block.total / maxVal) * 100;
          const hasData = block.total > 0;
          return (
            <div key={block.label} className="flex-1 flex flex-col items-center gap-1.5">
              {hasData && (
                <span className="text-xs font-mono font-bold text-text-primary">${block.total.toFixed(0)}</span>
              )}
              <div
                className={`w-full rounded-t transition-all relative ${hasData ? 'bg-primary hover:bg-primary/80' : 'bg-gray-100'}`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <span className="text-xs text-text-muted font-medium">{block.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesChart;
