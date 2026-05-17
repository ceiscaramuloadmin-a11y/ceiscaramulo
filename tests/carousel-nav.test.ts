import { describe, expect, it } from 'vitest';
import { carouselIndexAfterStep } from '@/lib/carousel-nav';

describe('carouselIndexAfterStep', () => {
  it('avança uma posição à frente em ciclo fechado', () => {
    expect(carouselIndexAfterStep(0, 3, 1)).toBe(1);
    expect(carouselIndexAfterStep(2, 3, 1)).toBe(0);
  });

  it('recua com delta negativo', () => {
    expect(carouselIndexAfterStep(0, 4, -1)).toBe(3);
    expect(carouselIndexAfterStep(1, 4, -1)).toBe(0);
  });

  it('com zero slides devolve 0', () => {
    expect(carouselIndexAfterStep(2, 0, 1)).toBe(0);
  });
});
