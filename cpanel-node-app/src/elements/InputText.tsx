// 'use client'
// Next.js: Client component — uses forwardRef and interactive input

import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* ──────────────────────────────────────────────
   Input element variants
   Provides consistent text inputs across the app
────────────────────────────────────────────── */

const inputVariants = cva(
  'flex w-full rounded-md border bg-secondary/50 px-3 py-2 font-body text-base text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      inputSize: {
        sm: 'h-9 text-sm px-2',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg px-4',
      },
      inputVariant: {
        default: 'border-input',
        ghost: 'border-transparent bg-transparent',
        filled: 'border-transparent bg-muted',
      },
    },
    defaultVariants: {
      inputSize: 'md',
      inputVariant: 'default',
    },
  }
);

interface InputTextProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
}

const InputText = React.forwardRef<HTMLInputElement, InputTextProps>(
  ({ className, inputSize, inputVariant, label, error, hint, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            inputVariants({ inputSize, inputVariant }),
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
InputText.displayName = 'InputText';

export { InputText, inputVariants };
