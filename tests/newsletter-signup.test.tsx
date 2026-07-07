import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NewsletterSignup from '@/components/NewsletterSignup';

describe('NewsletterSignup', () => {
  it('sends users to the full newsletter intent form', () => {
    render(<NewsletterSignup />);

    expect(screen.getByText('Escolhe se queres receber noticias, atividades ou ambas.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Subscrever newsletter' })).toHaveAttribute('href', '/newsletter');
    expect(screen.queryByLabelText('Email da newsletter')).not.toBeInTheDocument();
  });
});
