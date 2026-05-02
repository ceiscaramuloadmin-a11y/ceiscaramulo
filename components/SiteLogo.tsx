import { cn } from '@/lib/utils';

type SiteLogoProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
};

export default function SiteLogo({
  className,
  imageClassName,
  alt = 'CEISCaramulo',
}: SiteLogoProps) {
  return (
    <span className={cn('inline-flex aspect-[474/299] items-center', className)}>
      <img
        src="/ceiscaramulo-logo.svg"
        alt={alt}
        width={474}
        height={299}
        decoding="async"
        className={cn('h-auto w-full object-contain', imageClassName)}
      />
    </span>
  );
}
