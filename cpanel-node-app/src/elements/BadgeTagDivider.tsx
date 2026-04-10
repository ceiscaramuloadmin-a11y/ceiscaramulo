// Next.js: Can be server component
import React from 'react';
import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/* ──────────────────────────────────────────────
   Badge — small status / category indicator
   Tag — removable tag element
   Divider — visual separator
────────────────────────────────────────────── */

// Badge
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/20 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        success: 'bg-forest/20 text-forest-light',
        warning: 'bg-gold/20 text-gold',
        destructive: 'bg-destructive/20 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = 'Badge';

// Tag
interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
}

const Tag: React.FC<TagProps> = ({ className, active, children, ...props }) => (
  <span
    className={cn(
      'inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1 font-body text-sm transition-all',
      active
        ? 'border-primary bg-primary/20 text-primary'
        : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground',
      className
    )}
    role="button"
    tabIndex={0}
    {...props}
  >
    {children}
  </span>
);
Tag.displayName = 'Tag';

// Divider
interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

const Divider: React.FC<DividerProps> = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}) => (
  <hr
    className={cn(
      'border-border',
      orientation === 'horizontal' ? 'w-full border-t' : 'h-full border-l',
      className
    )}
    role={decorative ? 'presentation' : 'separator'}
    aria-orientation={orientation}
    {...props}
  />
);
Divider.displayName = 'Divider';

export { Badge, badgeVariants, Tag, Divider };
