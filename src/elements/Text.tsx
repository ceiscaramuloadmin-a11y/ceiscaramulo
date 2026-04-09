// 'use client'
// Next.js: This component uses client-side interactivity (variants via props)
// In Next.js, add 'use client' directive at the top

import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* ──────────────────────────────────────────────
   Text variant definitions
   Use these to render any text element with
   consistent styling across the application.
────────────────────────────────────────────── */

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl',
      h2: 'font-display text-3xl font-semibold tracking-tight md:text-4xl',
      h3: 'font-display text-2xl font-semibold md:text-3xl',
      h4: 'font-display text-xl font-semibold md:text-2xl',
      h5: 'font-display text-lg font-medium md:text-xl',
      h6: 'font-display text-base font-medium md:text-lg',
      body: 'font-body text-base leading-relaxed',
      'body-lg': 'font-body text-lg leading-relaxed',
      'body-sm': 'font-body text-sm leading-relaxed',
      caption: 'font-body text-xs text-muted-foreground',
      label: 'font-body text-sm font-medium',
      lead: 'font-body text-xl text-muted-foreground leading-relaxed',
      quote: 'font-display italic text-lg border-l-2 border-primary pl-4',
      overline: 'font-body text-xs font-semibold uppercase tracking-widest text-primary',
    },
    color: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      accent: 'text-accent-foreground',
      gradient: 'text-gradient',
      white: 'text-foreground',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
    align: 'left',
  },
});

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'blockquote' | 'label';

interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}

const variantToElement: Record<string, TextElement> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  'body-lg': 'p',
  'body-sm': 'p',
  caption: 'span',
  label: 'label',
  lead: 'p',
  quote: 'blockquote',
  overline: 'span',
};

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant, color, align, as, children, ...props }, ref) => {
    const Component = as || variantToElement[variant || 'body'] || 'p';

    return React.createElement(
      Component,
      {
        ref,
        className: cn(textVariants({ variant, color, align }), className),
        ...props,
      },
      children
    );
  }
);
Text.displayName = 'Text';

export { Text, textVariants, type TextProps };
