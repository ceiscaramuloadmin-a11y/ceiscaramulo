import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NewsletterIntentForm from '@/components/NewsletterIntentForm';

describe('NewsletterIntentForm', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('requires a valid email and at least one preference', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<NewsletterIntentForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'email-invalido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar subscricao' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Introduz um email valido para subscrever.');
  });

  it('submits the selected newsletter preferences', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        message: 'Email guardado com sucesso.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<NewsletterIntentForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maria@example.pt' } });
    fireEvent.click(screen.getByLabelText('Atividades e eventos'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar subscricao' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/newsletter/subscribe',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ email: 'maria@example.pt', wantsNews: true, wantsActivities: false }),
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Email guardado com sucesso.');
  });
});
