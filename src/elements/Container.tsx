// Next.js: Can be server component — no client interactivity
// Remove 'use client' if used only for layout in Next.js

import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* ──────────────────────────────────────────────
   Container — restricts content width
   Section — adds vertical padding + semantic tag
   Grid — responsive grid layout
────────────────────────────────────────────── */

// Container
const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
  variants: {
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(containerVariants({ size }), className)} {...props} />
  )
);
Container.displayName = 'Container';

// Section
const sectionVariants = cva('', {
  variants: {
    spacing: {
      sm: 'py-8 md:py-12',
      md: 'py-12 md:py-16',
      lg: 'py-16 md:py-24',
      xl: 'py-24 md:py-32',
      none: '',
    },
    background: {
      default: '',
      muted: 'bg-muted/30',
      card: 'bg-card',
      accent: 'bg-accent/20',
      gradient: 'bg-gradient-to-b from-background to-card',
    },
  },
  defaultVariants: {
    spacing: 'lg',
    background: 'default',
  },
});

interface SectionProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof sectionVariants> {
  as?: 'section' | 'article' | 'aside' | 'div';
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, background, as: Component = 'section', ...props }, ref) =>
    React.createElement(Component, {
      ref,
      className: cn(sectionVariants({ spacing, background }), className),
      ...props,
    })
);
Section.displayName = 'Section';

// Grid
const gridVariants = cva('grid gap-6', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    },
  },
  defaultVariants: {
    cols: 3,
    gap: 'md',
  },
});

interface GridProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, ...props }, ref) => (
    <div ref={ref} className={cn(gridVariants({ cols, gap }), className)} {...props} />
  )
);
Grid.displayName = 'Grid';

export { Container, containerVariants, Section, sectionVariants, Grid, gridVariants };
