import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`bg-white rounded-xl border border-border shadow-card
        ${paddings[padding]}
        ${hover ? 'hover:border-primary/40 hover:shadow-card-hover transition-all' : ''}
        ${onClick ? 'text-left w-full cursor-pointer' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

export default Card;
