/** Avanço circular seguro mesmo com `delta` negativo ou `current` fora dos limites. */
export function carouselIndexAfterStep(currentIndex: number, slideCount: number, delta: number): number {
  if (slideCount <= 0) {
    return 0;
  }

  return ((currentIndex + delta) % slideCount + slideCount) % slideCount;
}
