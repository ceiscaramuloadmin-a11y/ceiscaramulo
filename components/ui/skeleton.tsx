'use client';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-stone-200/80 ${className}`.trim()} />;
}
