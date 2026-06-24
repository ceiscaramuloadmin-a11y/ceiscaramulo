import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CoverImage from '@/components/CoverImage';

describe('CoverImage', () => {
  it('falls back to the shared placeholder when the cover file cannot be loaded', () => {
    render(<CoverImage src="/uploads/backoffice/activities/missing.heic" alt="Capa da atividade" />);

    const image = screen.getByRole('img', { name: 'Capa da atividade' });
    expect(image).toHaveAttribute('src', '/uploads/backoffice/activities/missing.heic');

    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/placeholder.svg');
  });
});
