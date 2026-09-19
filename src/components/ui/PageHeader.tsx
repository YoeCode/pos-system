import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <section
      className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${className}`}
    >
      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-headline-lg text-text-primary tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-body-md text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </section>
  );
};

export default PageHeader;
