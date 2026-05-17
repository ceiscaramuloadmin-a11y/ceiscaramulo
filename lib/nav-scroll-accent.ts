/** Threshold (px) alinhado ao hero da homepage — só então aparece elevación visual. */
export const NAV_SCROLL_ELEVATION_PX = 8;

/** Classes Tailwind opcionais aplicadas quando o utilizador já fez scroll. */
export function navBarElevatedClasses(
  scrollY: number,
  variant: 'hero' | 'global' = 'global',
): string {
  if (scrollY <= NAV_SCROLL_ELEVATION_PX) {
    return '';
  }

  const elevationShadow =
    variant === 'hero'
      ? 'shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]'
      : 'shadow-[0_8px_24px_-18px_rgba(0,0,0,0.18)]';

  return elevationShadow;
}
