'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

type CoverImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallbackSrc?: string;
};

export default function CoverImage({ src, fallbackSrc = '/placeholder.svg', onError, ...props }: CoverImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const shouldUseOptimizedImage =
    currentSrc.startsWith('/') && !/\.(svg|heic|heif)$/i.test(currentSrc.split('?')[0] || '');

  const handleError: NonNullable<ImgHTMLAttributes<HTMLImageElement>['onError']> = (event) => {
    onError?.(event);

    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  if (shouldUseOptimizedImage) {
    const { width: _width, height: _height, alt, ...imageProps } = props;

    return (
      <Image
        {...imageProps}
        src={currentSrc}
        alt={alt || ''}
        width={640}
        height={480}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        onError={handleError}
      />
    );
  }

  return (
    <img
      {...props}
      src={currentSrc}
      onError={handleError}
    />
  );
}
