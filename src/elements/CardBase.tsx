// 'use client'
// Next.js: Client component if interactive, server component for static cards

import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* ──────────────────────────────────────────────
   CardBase — flexible card element
   Use as foundation for all card-like components
────────────────────────────────────────────── */

const cardBaseVariants = cva(
  'rounded-lg border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        ghost: 'border-transparent bg-transparent',
        elevated: 'border-border bg-card text-card-foreground shadow-lg hover:shadow-xl',
        glass: 'glass border-border/50 text-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        none: '',
        lift: 'hover-lift cursor-pointer',
        glow: 'hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.15)] cursor-pointer',
        scale: 'hover:scale-[1.02] cursor-pointer',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
    },
  }
);

interface CardBaseProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardBaseVariants> {
  as?: 'div' | 'article' | 'li';
}

const CardBase = React.forwardRef<HTMLDivElement, CardBaseProps>(
  ({ className, variant, padding, hover, as: Component = 'div', ...props }, ref) =>
    React.createElement(Component, {
      ref,
      className: cn(cardBaseVariants({ variant, padding, hover }), className),
      ...props,
    })
);
CardBase.displayName = 'CardBase';

export { CardBase, cardBaseVariants };
