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
  date?: string;
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
  contentTitle?: string | null;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

export type GalleryMediaType = 'photo' | 'video' | 'audio' | 'document';

export interface GalleryMediaItem {
  id: string;
  title: string;
  description?: string | null;
  type: GalleryMediaType;
  context?: string | null;
  source: string;
  thumbnail?: string | null;
  mimeType?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Compatibilidade com dados legados em data/content.ts
export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  type: 'foto' | 'video' | 'audio';
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

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
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
  contacts: number;
}

export type AdminRole = 'owner' | 'editor';
export type AdminPermission =
  | 'news'
  | 'activities'
  | 'projects'
  | 'publications'
  | 'contacts'
  | 'gallery'
  | 'layout'
  | 'admins'
  | 'audit';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export type LayoutIconName =
  | 'Mountain'
  | 'TreePine'
  | 'Bird'
  | 'Pickaxe'
  | 'Users'
  | 'Calendar'
  | 'Newspaper'
  | 'FolderOpen'
  | 'BookOpen'
  | 'Camera'
  | 'Leaf'
  | 'MapPin';

export interface LayoutLinkItem {
  label: string;
  href: string;
}

export interface LayoutHomeLinkItem extends LayoutLinkItem {
  title: string;
  description: string;
  icon: LayoutIconName;
}

export interface FooterContactSettings {
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface SiteVisualIdentitySettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    buttons: string;
    links: string;
    titles: string;
  };
  logos: {
    primary: string;
    footer: string;
    institutional: string;
  };
}

export interface SiteSeoSettings {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

export interface SitePageIntroSettings {
  title: string;
  description: string;
  emptyMessage?: string;
}

export interface SiteContactPageSettings extends SitePageIntroSettings {
  institutionalTitle: string;
  presidentLabel: string;
  presidentName: string;
  phoneLabel: string;
  phone: string;
  emailLabel: string;
  email: string;
}

export interface SiteAboutPageSettings {
  whoWeAreTitle: string;
  whoWeAreParagraphs: string[];
  originTitle: string;
  originParagraphs: string[];
  foundersTitle: string;
  foundersParagraphs: string[];
  socialBodiesTitle: string;
  socialBodies: Array<{ title: string; members: string[] }>;
  contactTitle: string;
  contactDescription: string;
  contactAddressLabel: string;
  contactAddress: string;
  contactPhoneLabel: string;
  contactPhone: string;
  contactEmailLabel: string;
  contactEmail: string;
}

export interface SiteLayoutSettings {
  home: {
    hero: {
      eyebrow: string;
      titleLine1: string;
      titleLine2: string;
      titleLine3: string;
      titleLine4: string;
      description: string;
      primaryCtaLabel: string;
      primaryCtaHref: string;
      secondaryCtaLabel: string;
      secondaryCtaHref: string;
      imageUrl: string;
      imageAlt: string;
    };
    explore: {
      eyebrow: string;
      title: string;
      description: string;
      links: LayoutHomeLinkItem[];
    };
    join: {
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
    };
  };
  pages: {
    sobre: SitePageIntroSettings;
    atividades: SitePageIntroSettings & { emptyMessage: string };
    noticias: SitePageIntroSettings & { emptyMessage: string };
    projetos: SitePageIntroSettings & { emptyMessage: string };
    biblioteca: SitePageIntroSettings & { emptyMessage: string };
    serra: SitePageIntroSettings;
    contactos: SiteContactPageSettings;
    galeria: SitePageIntroSettings;
    bibliotecaJrs: SitePageIntroSettings;
    oficinaDoBurel: SitePageIntroSettings;
    artigosParaVenda: SitePageIntroSettings;
    ponDoJueus: SitePageIntroSettings;
    escolaDosNossosAvos: SitePageIntroSettings;
    oficinasDeFormacao: SitePageIntroSettings;
    publicacoes: SitePageIntroSettings;
  };
  aboutPage: SiteAboutPageSettings;
  serra: {
    sections: Array<{
      id: string;
      title: string;
      description: string;
      items: string[];
      icon: LayoutIconName;
    }>;
    aboutTitle: string;
    aboutParagraph1: string;
    aboutParagraph2: string;
  };
  footer: {
    brandDescription: string;
    contactInfo: FooterContactSettings;
    columns: Array<{ title: string; links: LayoutLinkItem[] }>;
    membership: {
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
    };
    socialTitle: string;
    copyrightLine: string;
    legalLine: string;
  };
  visualIdentity: SiteVisualIdentitySettings;
  seo: SiteSeoSettings;
}

export type ContentSection = 'news' | 'activities' | 'projects' | 'publications';
