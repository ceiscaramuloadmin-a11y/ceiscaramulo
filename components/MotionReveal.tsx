'use client';

import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export default function MotionReveal({ children, className = '', delayMs = 0 }: MotionRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`motion-reveal ${className}`}
      data-visible={visible ? 'true' : 'false'}
      style={{ '--motion-delay': `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
