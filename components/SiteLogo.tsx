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
    <span className={cn('inline-flex items-center', className)}>
      <img
        src="/ceiscaramulo-logo.svg"
        alt={alt}
        className={cn('h-auto w-full object-contain', imageClassName)}
      />
    </span>
  );
}
