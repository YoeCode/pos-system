import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    description?: string;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  className = '',
}) => {
  const trendColors = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-text-muted',
  };

  return (
    <div
      className={`bg-white p-5 rounded-xl border border-border shadow-card flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-label-md text-text-muted">{label}</span>
        <span className="p-2 rounded-lg bg-surface-container text-primary">
          {icon}
        </span>
      </div>
      <div className="mt-3">
        <div className="text-numeric-pos text-text-primary font-bold font-[tabular-nums]">
          {value}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1.5 mt-1.5 text-label-sm ${trendColors[trend.direction]}`}
          >
            {trend.direction === 'up' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            <span className="font-semibold">{trend.value}</span>
            {trend.description && (
              <span className="text-text-muted font-normal">
                {trend.description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
