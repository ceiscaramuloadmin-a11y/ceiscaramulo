import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';
import { expect } from 'vitest';

expect.extend(matchers);

(globalThis as typeof globalThis & { React: typeof React }).React = React;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
