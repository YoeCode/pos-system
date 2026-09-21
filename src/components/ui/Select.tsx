import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-label-md font-medium text-text-muted"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${selectId}-error`
            : helperText
              ? `${selectId}-helper`
              : undefined
        }
        className={`w-full h-11 px-3.5 text-body-md rounded-[10px] border bg-white text-text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-colors
          ${error ? 'border-error focus:ring-error/15 focus:border-error' : 'border-border'}
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span
          id={`${selectId}-error`}
          className="text-body-sm text-error"
          role="alert"
        >
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${selectId}-helper`} className="text-body-sm text-text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Select;
