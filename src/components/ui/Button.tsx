import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary text-white rounded-[10px] hover:bg-primary-dark active:scale-[0.98]',
    secondary:
      'bg-white border border-border text-text-primary rounded-[10px] hover:bg-surface-container-low active:scale-[0.98]',
    danger:
      'bg-white border border-error text-error rounded-[10px] hover:bg-error-container hover:text-on-error-container active:scale-[0.98]',
    ghost:
      'bg-transparent text-text-muted rounded-[10px] hover:text-text-primary hover:bg-surface-container-low active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-label-md min-h-[36px]',
    md: 'px-4 py-2.5 text-label-lg min-h-[44px]',
    lg: 'px-5 py-3 text-label-lg min-h-[48px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
