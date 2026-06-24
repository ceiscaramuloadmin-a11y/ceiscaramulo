'use client';

import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type CoverImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallbackSrc?: string;
};

export default function CoverImage({ src, fallbackSrc = '/placeholder.svg', onError, ...props }: CoverImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <img
      {...props}
      src={currentSrc}
      onError={(event) => {
        onError?.(event);

        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
