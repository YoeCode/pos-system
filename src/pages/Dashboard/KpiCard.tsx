interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, trend, trendUp, icon }) => (
  <div className="bg-white rounded-xl border border-border p-5 flex items-start justify-between">
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-text-primary font-mono">{value}</p>
      {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      {trend && (
        <div className="flex items-center gap-1">
          <svg
            className={`w-3.5 h-3.5 ${trendUp ? 'text-success' : 'text-error'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={trendUp ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
            />
          </svg>
          <span className={`text-xs font-semibold ${trendUp ? 'text-success' : 'text-error'}`}>
            {trend} vs yesterday
          </span>
        </div>
      )}
    </div>
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
      {icon}
    </div>
  </div>
);

export default KpiCard;
