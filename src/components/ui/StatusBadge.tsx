import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'error' | 'info';
  label: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const styles = {
    active:
      'bg-success-light text-success border border-success/20',
    inactive:
      'bg-surface-container text-text-muted border border-border',
    warning:
      'bg-warning-light text-warning border border-warning/20',
    error:
      'bg-error-container text-error border border-error/20',
    info: 'bg-info-light text-info border border-info/20',
  };

  const dotColors = {
    active: 'bg-success',
    inactive: 'bg-text-muted',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-semibold ${styles[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
