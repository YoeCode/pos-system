import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const variants = {
    success: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600',
    error: 'bg-error/10 text-error',
    neutral: 'bg-text-muted/10 text-text-muted',
    info: 'bg-secondary/10 text-secondary',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
