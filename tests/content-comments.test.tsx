import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContentComments from '@/components/ContentComments';

describe('ContentComments', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('submits public comments without asking for an email', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'comment-1',
          name: 'Maria',
          email: '',
          message: 'Muito interessante.',
          createdAt: '2026-07-03T10:00:00.000Z',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<ContentComments section="news" identifier="noticia-teste" title="Notícia teste" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /email/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'Muito interessante.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar comentário' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith('/api/news/noticia-teste/comments', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Maria',
        message: 'Muito interessante.',
      }),
    }));
  });
});
