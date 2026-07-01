import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CoverImage from '@/components/CoverImage';

describe('CoverImage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders dynamic CMS asset routes directly instead of routing them through next/image', () => {
    render(<CoverImage src="/api/content-assets/news/n1" alt="Capa da noticia" className="h-full w-full object-cover" />);

    const image = screen.getByRole('img', { name: 'Capa da noticia' });
    expect(image).toHaveAttribute('src', '/api/content-assets/news/n1');
    expect(image.getAttribute('src')).not.toContain('/_next/image');
  });

  it('renders backoffice upload covers directly so Vercel image optimization does not 404 dynamic files', () => {
    render(<CoverImage src="/uploads/backoffice/news/foto.jpg" alt="Capa da noticia" className="h-full w-full object-cover" />);

    const image = screen.getByRole('img', { name: 'Capa da noticia' });
    expect(image).toHaveAttribute('src', '/uploads/backoffice/news/foto.jpg');
    expect(image.getAttribute('src')).not.toContain('/_next/image');
  });

  it('falls back to the shared placeholder when the cover file cannot be loaded', () => {
    render(<CoverImage src="/uploads/backoffice/activities/missing.heic" alt="Capa da atividade" />);

    const image = screen.getByRole('img', { name: 'Capa da atividade' });
    expect(image).toHaveAttribute('src', '/uploads/backoffice/activities/missing.heic');

    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });
});
