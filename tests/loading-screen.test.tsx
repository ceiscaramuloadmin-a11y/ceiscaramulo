import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loading from '@/app/loading';

describe('app loading screen', () => {
  it('covers the viewport while content is loading', () => {
    render(<Loading />);

    const loading = screen.getByRole('main');

    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveClass('fixed', 'inset-0', 'min-h-screen');
    expect(screen.getByText('A carregar conteúdo...')).toBeInTheDocument();
  });
});
