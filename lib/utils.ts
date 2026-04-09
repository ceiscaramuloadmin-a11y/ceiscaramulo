import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getAssetUrl(value?: string | null): string {
  if (!value) {
    return '/placeholder.svg';
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

    if (apiBaseUrl) {
      return `${apiBaseUrl.replace(/\/+$/, '')}${value}`;
    }

    return '/placeholder.svg';
  }

  return value;
}
