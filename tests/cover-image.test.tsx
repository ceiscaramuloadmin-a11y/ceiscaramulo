import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CoverImage from '@/components/CoverImage';

describe('CoverImage', () => {
  it('uses responsive optimized images for local CMS cover routes', () => {
    render(<CoverImage src="/api/content-assets/news/n1" alt="Capa da notícia" className="h-full w-full object-cover" />);

    const image = screen.getByRole('img', { name: 'Capa da notícia' });
    expect(image.getAttribute('src')).toContain('/_next/image?url=%2Fapi%2Fcontent-assets%2Fnews%2Fn1');
    expect(image).toHaveAttribute('sizes', '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw');
  });

  it('falls back to the shared placeholder when the cover file cannot be loaded', () => {
    render(<CoverImage src="/uploads/backoffice/activities/missing.heic" alt="Capa da atividade" />);

    const image = screen.getByRole('img', { name: 'Capa da atividade' });
    expect(image).toHaveAttribute('src', '/uploads/backoffice/activities/missing.heic');

    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });
});
