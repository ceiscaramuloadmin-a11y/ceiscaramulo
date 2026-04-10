// Next.js: Can be server component — no client interactivity needed
import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* ──────────────────────────────────────────────
   Skeleton loading variants
   Use while content is loading (React.Suspense)
────────────────────────────────────────────── */

const skeletonVariants = cva('animate-pulse rounded-md bg-muted', {
  variants: {
    variant: {
      text: 'h-4 w-3/4',
      title: 'h-8 w-1/2',
      avatar: 'h-12 w-12 rounded-full',
      thumbnail: 'aspect-video w-full',
      card: 'h-64 w-full rounded-lg',
      button: 'h-10 w-28 rounded-md',
      line: 'h-3 w-full',
      paragraph: 'h-20 w-full',
    },
  },
  defaultVariants: { variant: 'text' },
});

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className, variant, count = 1, ...props }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={cn(skeletonVariants({ variant }), className)} {...props} />
    ))}
  </>
);
SkeletonLoader.displayName = 'SkeletonLoader';

/* Composite skeleton for cards */
const SkeletonCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('space-y-3 rounded-lg border border-border bg-card p-6', className)} {...props}>
    <SkeletonLoader variant="thumbnail" />
    <SkeletonLoader variant="title" />
    <SkeletonLoader variant="line" />
    <SkeletonLoader variant="line" className="w-2/3" />
    <SkeletonLoader variant="button" />
  </div>
);
SkeletonCard.displayName = 'SkeletonCard';

/* Skeleton for article lists */
const SkeletonArticle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex gap-4 rounded-lg border border-border bg-card p-4', className)} {...props}>
    <SkeletonLoader variant="avatar" />
    <div className="flex-1 space-y-2">
      <SkeletonLoader variant="title" className="h-5 w-3/4" />
      <SkeletonLoader variant="line" />
      <SkeletonLoader variant="line" className="w-1/2" />
    </div>
  </div>
);
SkeletonArticle.displayName = 'SkeletonArticle';

export { SkeletonLoader, skeletonVariants, SkeletonCard, SkeletonArticle };
