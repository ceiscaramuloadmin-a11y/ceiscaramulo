import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewsletterSignup from '@/components/NewsletterSignup';

describe('NewsletterSignup', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('does not call the API when the email is invalid', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText('Email da newsletter'), {
      target: { value: 'email-invalido' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscrever' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Introduce um email válido para subscrever.');
  });

  it('subscribes a valid email and shows success feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message: 'Pedido registado com sucesso. Obrigado pelo interesse na newsletter.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<NewsletterSignup />);

    fireEvent.change(screen.getByLabelText('Email da newsletter'), {
      target: { value: 'maria@example.pt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscrever' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/newsletter/subscribe', expect.objectContaining({
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ email: 'maria@example.pt' }),
    }));
    expect(await screen.findByRole('status')).toHaveTextContent('Pedido registado com sucesso.');
    expect(screen.getByLabelText('Email da newsletter')).toHaveValue('');
  });
});
