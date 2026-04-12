import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders an animated placeholder block', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />);
    const element = container.firstElementChild;

    expect(element).not.toBeNull();
    expect(element?.className).toContain('animate-pulse');
    expect(element?.className).toContain('h-10');
    expect(element?.className).toContain('w-20');
  });
});
