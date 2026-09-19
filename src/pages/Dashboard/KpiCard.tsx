interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendUp,
  icon,
}) => (
  <div className="bg-white p-5 rounded-xl border border-border shadow-card flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-label-md text-text-muted">{title}</span>
      <span className="p-2 rounded-[10px] bg-surface-container text-primary">
        {icon}
      </span>
    </div>
    <div className="mt-3">
      <div className="text-numeric-pos text-text-primary font-bold font-[tabular-nums]">
        {value}
      </div>
      {subtitle && (
        <p className="text-body-sm text-text-muted mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg
            className={`w-4 h-4 ${trendUp ? 'text-success' : 'text-error'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={trendUp ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
            />
          </svg>
          <span
            className={`text-label-sm font-semibold ${trendUp ? 'text-success' : 'text-error'}`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default KpiCard;
