import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dot = false,
  children,
  className = '',
}) => {
  const variants = {
    success: 'bg-success-light text-success border border-success/20',
    warning: 'bg-warning-light text-warning border border-warning/20',
    error: 'bg-error-container text-error border border-error/20',
    neutral: 'bg-surface-container text-text-muted border border-border',
    info: 'bg-info-light text-info border border-info/20',
  };

  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    neutral: 'bg-text-muted',
    info: 'bg-info',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-label-sm font-semibold ${variants[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
