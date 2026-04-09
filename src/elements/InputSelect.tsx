// 'use client'
// Next.js: Client component — uses forwardRef and interactive select

import React from 'react';
import { cn } from '../lib/utils';

/* ──────────────────────────────────────────────
   Select element
   Custom styled native select for simplicity
   and accessibility
────────────────────────────────────────────── */

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface InputSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  selectSize?: 'sm' | 'md' | 'lg';
}

const InputSelect = React.forwardRef<HTMLSelectElement, InputSelectProps>(
  ({ className, label, error, hint, options, placeholder, selectSize = 'md', id, ...props }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s/g, '-')}`;

    const sizeClasses = {
      sm: 'h-9 text-sm px-2',
      md: 'h-10 text-base px-3',
      lg: 'h-12 text-lg px-4',
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="font-body text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'flex w-full appearance-none rounded-md border border-input bg-secondary/50 font-body text-foreground ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            sizeClasses[selectSize],
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
InputSelect.displayName = 'InputSelect';

export { InputSelect, type SelectOption };
