import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-label-md font-medium text-text-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          className={`w-full h-11 px-3.5 text-body-md rounded-[10px] border bg-white text-text-primary placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors
            ${error ? 'border-error focus:ring-error/15 focus:border-error' : 'border-border'}
            ${icon ? 'pr-11' : ''}
            ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} className="text-body-sm text-error" role="alert">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className="text-body-sm text-text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
