export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
}

export type ActivityCategory = 'caminhada' | 'workshop' | 'palestra' | 'evento' | 'formacao';
export type ProjectStatus = 'em_curso' | 'concluido' | 'planeado';
export type PublicationType = 'livro' | 'artigo' | 'relatorio' | 'tese' | 'documento';

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string | null;
  category: ActivityCategory;
  image?: string | null;
  location?: string | null;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image?: string | null;
  author: string;
  published: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  slug: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string | null;
  image?: string | null;
  partners?: string[];
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Publication {
  id: string;
  title: string;
  author: string;
  year: number;
  type: PublicationType;
  description: string;
  downloadUrl?: string | null;
  coverImage?: string | null;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentComment {
  id: string;
  contentType: ContentSection;
  contentId: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  type: 'foto' | 'video';
  url: string;
  thumbnail?: string;
  category: string;
  date?: string;
}

export interface ContactInfo {
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  coordinates: { lat: number; lng: number };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
  };
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

export interface SerraInfo {
  title: string;
  description: string;
  icon?: string;
  items?: string[];
}

export interface AdminStats {
  news: number;
  activities: number;
  projects: number;
  publications: number;
}

export type ContentSection = 'news' | 'activities' | 'projects' | 'publications';
