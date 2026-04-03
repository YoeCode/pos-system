import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, icon, error, className = '', id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
            error ? 'border-error' : 'border-border'
          } bg-white text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-error/20' : 'focus:ring-primary/20'
          } focus:border-primary transition-colors ${icon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
};

export default Input;
