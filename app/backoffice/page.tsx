'use client';

import { upload } from '@vercel/blob/client';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { adminAuthClient, getAdminAccessToken, getAuth0AdminLoginHref, getStoredAdminSession, isExportAdminAuthMode } from '@/lib/admin-auth';
import RichTextEditor from '@/components/RichTextEditor';
import { backofficePrimaryActionLabel } from '@/lib/backoffice-primary-label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { layoutIconMap } from '@/lib/layout-icons';
import { defaultSiteLayoutSettings } from '@/lib/site-layout';
import { cn } from '@/lib/utils';
import type {
  Activity,
  AdminPermission,
  AdminRole,
  AdminUser,
  AuditLogEntry,
  ContactMessage,
  ContentComment,
  ContentSection,
  FooterContactSettings,
  GalleryMediaItem,
  GalleryMediaType,
  ActivityCategory,
  LayoutIconName,
  NewsArticle,
  NewsletterSubscriber,
  Publication,
  PublicationType,
  SiteLayoutSettings,
} from '@/types';

type ProgrammeGallerySectionId =
  | 'gallery-oficina-do-burel'
  | 'gallery-artigos-para-venda'
  | 'gallery-pon-do-jueus'
  | 'gallery-escola-dos-nossos-avos'
  | 'gallery-biblioteca-jrs'
  | 'gallery-oficinas-de-formacao'
  | 'gallery-publicacoes'
  | 'gallery-biblioteca';
type GallerySectionId = 'gallery' | ProgrammeGallerySectionId;
type SectionId = 'overview' | 'profile' | 'about' | 'admins' | 'audit' | 'layout' | 'contacts' | 'comments' | 'newsletter' | ContentSection | GallerySectionId;
type AppearanceTab = 'pages' | 'footer' | 'icons' | 'colors' | 'logos' | 'seo';
type AppearancePageKey = keyof SiteLayoutSettings['pages'];
type DashboardStats = {
  news: number;
  activities: number;
  publications: number;
  contacts: number;
  galleryByContext?: Record<string, number>;
};

const ADMIN_PERMISSION_OPTIONS: Array<{ id: AdminPermission; label: string }> = [
  { id: 'news', label: 'Notícias' },
  { id: 'activities', label: 'Atividades' },
  { id: 'publications', label: 'Publicações' },
  { id: 'contacts', label: 'Mensagens' },
  { id: 'gallery', label: 'Media das páginas' },
  { id: 'layout', label: 'Layout' },
  { id: 'admins', label: 'Admins' },
  { id: 'audit', label: 'Histórico' },
];

const BACKOFFICE_NAV_ITEMS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'profile', label: 'Perfil' },
  { id: 'about', label: 'Sobre Nós' },
  { id: 'news', label: 'Notícias' },
  { id: 'activities', label: 'Atividades' },
  { id: 'gallery-biblioteca', label: 'Recursos' },
  { id: 'gallery-oficina-do-burel', label: 'Oficina do Burel' },
  { id: 'gallery-artigos-para-venda', label: 'Artigos para venda' },
  { id: 'gallery-biblioteca-jrs', label: 'Biblioteca JRS' },
  { id: 'gallery-pon-do-jueus', label: 'PON do Jueus' },
  { id: 'gallery-escola-dos-nossos-avos', label: 'Escola dos Nossos Avós' },
  { id: 'gallery-oficinas-de-formacao', label: 'Oficinas de formação' },
  { id: 'gallery-publicacoes', label: 'Publicações' },
  { id: 'layout', label: 'Aparência' },
  { id: 'admins', label: 'Admins' },
  { id: 'contacts', label: 'Mensagens' },
  { id: 'comments', label: 'Comentários' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'audit', label: 'Histórico' },
];

const ACTIVITY_CATEGORY_OPTIONS: Array<{ value: ActivityCategory; label: string }> = [
  { value: 'evento', label: 'Evento' },
  { value: 'caminhada', label: 'Caminhada' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'palestra', label: 'Palestra' },
  { value: 'formacao', label: 'Formação' },
];

const PUBLICATION_TYPE_OPTIONS: Array<{ value: PublicationType; label: string }> = [
  { value: 'documento', label: 'Documento' },
  { value: 'livro', label: 'Livro' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'tese', label: 'Tese' },
];

function getEmptyPublicationForm() {
  return {
    title: '',
    author: '',
    year: '',
    type: '',
    description: '',
    downloadUrl: '',
    documentFile: null as File | null,
    published: true,
    coverImageFile: null as File | null,
    removeImage: false,
  };
}

const APPEARANCE_TABS: Array<{ id: AppearanceTab; label: string }> = [
  { id: 'pages', label: 'Páginas' },
  { id: 'footer', label: 'Footer' },
  { id: 'seo', label: 'SEO e Metadados' },
];

const APPEARANCE_PANEL_CLASS = 'rounded-lg border border-[#cfe7bd] bg-[#f2faed] p-3';
const ADMIN_CONTENT_LIST_LIMIT = 80;
const ADMIN_CONTACT_MESSAGES_LIMIT = 80;
const ADMIN_AUDIT_LIMIT = 100;
const ADMIN_GALLERY_LIST_LIMIT = 120;
const ADMIN_COMMENTS_LIMIT = 120;
const ADMIN_NEWSLETTER_LIMIT = 300;

const APPEARANCE_PAGE_FIELDS: Array<{ id: AppearancePageKey; label: string; hasEmptyMessage?: boolean }> = [
  { id: 'atividades', label: 'Atividades', hasEmptyMessage: true },
  { id: 'biblioteca', label: 'Recursos', hasEmptyMessage: true },
  { id: 'bibliotecaJrs', label: 'Biblioteca JRS' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'escolaDosNossosAvos', label: 'Escola dos Nossos Avós' },
  { id: 'galeria', label: 'Galeria' },
  { id: 'noticias', label: 'Notícias', hasEmptyMessage: true },
  { id: 'oficinaDoBurel', label: 'Oficina do Burel' },
  { id: 'artigosParaVenda', label: 'Artigos para venda' },
  { id: 'oficinasDeFormacao', label: 'Oficinas de formação' },
  { id: 'ponDoJueus', label: 'PON do Jueus' },
  { id: 'publicacoes', label: 'Publicações' },
  { id: 'sobre', label: 'Sobre Nós' },
];

const ALL_GALLERY_MEDIA_TYPES: GalleryMediaType[] = ['photo', 'video', 'audio', 'document'];

const PROGRAMME_GALLERY_SECTIONS: Record<ProgrammeGallerySectionId, { label: string; context: string; description: string; allowedTypes?: GalleryMediaType[] }> = {
  'gallery-oficina-do-burel': {
    label: 'Oficina do Burel',
    context: 'oficina-do-burel',
    description: 'PDFs, vídeos e outros media associados à página Oficina do Burel.',
  },
  'gallery-artigos-para-venda': {
    label: 'Artigos para venda',
    context: 'artigos-para-venda',
    description: 'Fotografias, vídeos, áudios e documentos associados à página Artigos para venda.',
  },
  'gallery-biblioteca-jrs': {
    label: 'Biblioteca JRS',
    context: 'biblioteca-jrs',
    description: 'PDFs, vídeos e outros media associados à página Biblioteca JRS.',
  },
  'gallery-pon-do-jueus': {
    label: 'PON do Jueus',
    context: 'pon-do-jueus',
    description: 'PDFs, vídeos e outros media associados à página PON do Jueus.',
  },
  'gallery-escola-dos-nossos-avos': {
    label: 'Escola dos Nossos Avós',
    context: 'escola-dos-nossos-avos',
    description: 'PDFs, vídeos e outros media associados à página Escola dos Nossos Avós.',
  },
  'gallery-oficinas-de-formacao': {
    label: 'Oficinas de formação',
    context: 'oficinas-de-formacao',
    description: 'PDFs, vídeos e outros media associados à página Oficinas de formação.',
  },
  'gallery-publicacoes': {
    label: 'Publicações',
    context: 'publicacoes',
    description: 'PDFs, vídeos e outros media associados à página Publicações.',
  },
  'gallery-biblioteca': {
    label: 'Recursos',
    context: 'biblioteca',
    description: 'PDFs, vídeos e outros media associados à página Recursos.',
  },
};

const WEB_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const RESOURCE_ATTACHMENT_ACCEPT = [
  WEB_IMAGE_ACCEPT,
  'application/pdf',
  'video/*',
  'audio/*',
  '.pdf',
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.ogg',
  '.oga',
  '.flac',
].join(',');

function galleryTypeLabel(type: GalleryMediaType) {
  if (type === 'photo') return 'Foto';
  if (type === 'video') return 'Vídeo';
  if (type === 'audio') return 'Áudio';
  return 'Documento';
}

function galleryAcceptForType(type: GalleryMediaType) {
  if (type === 'photo') return WEB_IMAGE_ACCEPT;
  if (type === 'video') return 'video/*';
  if (type === 'audio') return 'audio/*';
  return 'application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
}

function galleryAcceptForTypes(types: GalleryMediaType[]) {
  return types.map(galleryAcceptForType).join(',');
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Sem titulo';
}

function previewKindForResourceFile(file: File): GalleryMediaType {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (mimeType.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(fileName)) return 'photo';
  if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(fileName)) return 'video';
  if (mimeType.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac)$/i.test(fileName)) return 'audio';
  return 'document';
}

const GALLERY_BATCH_ACCEPT = galleryAcceptForTypes(ALL_GALLERY_MEDIA_TYPES);

function inferGalleryBatchType(file: File, fallbackType: GalleryMediaType, allowedTypes = ALL_GALLERY_MEDIA_TYPES): GalleryMediaType | null {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (mimeType.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(fileName)) return allowedTypes.includes('photo') ? 'photo' : null;
  if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi)$/i.test(fileName)) return allowedTypes.includes('video') ? 'video' : null;
  if (mimeType.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|flac)$/i.test(fileName)) return allowedTypes.includes('audio') ? 'audio' : null;
  if (
    mimeType === 'application/pdf' ||
    /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(fileName)
  ) {
    return allowedTypes.includes('document') ? 'document' : null;
  }

  return fallbackType === 'document' || !allowedTypes.includes(fallbackType) ? null : fallbackType;
}

function isGalleryAssetRoute(value: string) {
  return value.trim().startsWith('/api/gallery/assets/');
}

function sanitizeUploadFileName(value: string) {
  const [name = 'ficheiro', ...rest] = value.split('.');
  const extension = rest.length ? `.${rest.at(-1)?.replace(/[^a-z0-9]/gi, '').toLowerCase()}` : '';
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'ficheiro';

  return `${safeName}${extension}`;
}

type UploadProgress = {
  label: string;
  percent: number;
  detail?: string;
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function requestJsonWithUploadProgress<T>(
  path: string,
  method: string,
  body: FormData,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void
) {
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open(method, path);

    for (const [key, value] of Object.entries(headers)) {
      request.setRequestHeader(key, value);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(clampProgress((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const responseText = request.responseText || '';
      const payload = responseText
        ? (() => {
            try {
              return JSON.parse(responseText) as T & { message?: string };
            } catch {
              return null;
            }
          })()
        : null;

      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve(payload as T);
        return;
      }

      if (request.status === 413) {
        reject(new Error('O ficheiro é demasiado grande para ser enviado de uma vez. Usa um ficheiro mais leve ou coloca o ficheiro por URL.'));
        return;
      }

      reject(new Error(payload?.message || responseText.trim() || 'Falha no carregamento.'));
    };

    request.onerror = () => reject(new Error('Falha de rede durante o carregamento. Verifica a ligação e tenta novamente.'));
    request.onabort = () => reject(new Error('Carregamento cancelado.'));
    request.send(body);
  });
}

async function runGalleryBatchQueue<T>(items: T[], worker: (item: T) => Promise<unknown>, concurrency = 3) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();

      if (item) {
        await worker(item);
      }
    }
  });

  await Promise.all(workers);
}

function isProgrammeGallerySection(value: SectionId): value is ProgrammeGallerySectionId {
  return value in PROGRAMME_GALLERY_SECTIONS;
}

export default function BackofficePage() {
  const router = useRouter();
  const exportAuthMode = isExportAdminAuthMode();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [appearanceTab, setAppearanceTab] = useState<AppearanceTab>('pages');
  const [busy, setBusy] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isLoadingGovernance, setIsLoadingGovernance] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isLoadingNewsletter, setIsLoadingNewsletter] = useState(true);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [operationProgress, setOperationProgress] = useState<UploadProgress | null>(null);

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contentComments, setContentComments] = useState<ContentComment[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettings>(defaultSiteLayoutSettings);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ email: string; role: AdminRole; permissions: AdminPermission[] } | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('editor');
  const [newAdminPasswordMode, setNewAdminPasswordMode] = useState<'manual' | 'generated'>('generated');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createdAdminPassword, setCreatedAdminPassword] = useState<string | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState('');
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState<AdminPermission[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', author: '', published: true, publishedAt: '', imageFile: null as File | null, removeImage: false });
  const [activityForm, setActivityForm] = useState({ title: '', description: '', date: '', endDate: '', location: '', category: 'evento' as ActivityCategory, published: true, imageFile: null as File | null, removeImage: false });
  const [publicationForm, setPublicationForm] = useState(getEmptyPublicationForm);
  const [publicationFormResetKey, setPublicationFormResetKey] = useState(0);
  const [galleryEditingId, setGalleryEditingId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    description: '',
    type: 'photo' as GalleryMediaType,
    sourceUrl: '',
    sourceFile: null as File | null,
    thumbnailUrl: '',
    thumbnailFile: null as File | null,
    published: true,
  });
  const [galleryFormResetKey, setGalleryFormResetKey] = useState(0);
  const galleryIndividualFormRef = useRef<HTMLFormElement | null>(null);
  const [galleryBatchType, setGalleryBatchType] = useState<GalleryMediaType>('photo');
  const [galleryBatchItems, setGalleryBatchItems] = useState<Array<{
    id: string;
    file: File;
    previewUrl: string;
    type: GalleryMediaType;
    title: string;
    description: string;
    published: boolean;
  }>>([]);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const loadedContentSectionsRef = useRef<Set<ContentSection>>(new Set());
  const loadedAdminUsersRef = useRef(false);
  const loadedAuditLogsRef = useRef(false);
  const loadedContactMessagesRef = useRef(false);
  const loadedCommentsRef = useRef(false);
  const loadedNewsletterRef = useRef(false);
  const loadedLayoutRef = useRef(false);
  const loadedGalleryContextsRef = useRef<Set<string>>(new Set());
  const cachedGalleryItemsByContextRef = useRef<Map<string, GalleryMediaItem[]>>(new Map());

  const stats = useMemo(
    () => ({
      news: isLoadingContent && dashboardStats ? dashboardStats.news : news.length,
      activities: isLoadingContent && dashboardStats ? dashboardStats.activities : activities.length,
      publications: isLoadingContent && dashboardStats ? dashboardStats.publications : publications.length,
      contacts: isLoadingContacts && dashboardStats ? dashboardStats.contacts : contactMessages.length,
    }),
    [
      activities.length,
      contactMessages.length,
      dashboardStats,
      isLoadingContacts,
      isLoadingContent,
      news.length,
      publications.length,
    ]
  );
  const groupedGalleryItems = useMemo(
    () => ({
      photo: galleryItems.filter((item) => item.type === 'photo'),
      video: galleryItems.filter((item) => item.type === 'video'),
      audio: galleryItems.filter((item) => item.type === 'audio'),
      document: galleryItems.filter((item) => item.type === 'document'),
    }),
    [galleryItems]
  );
  const overviewProgrammeCards = useMemo(
    () =>
      Object.values(PROGRAMME_GALLERY_SECTIONS)
        .filter((section) => section.context !== 'biblioteca')
        .map((section) => ({
          title: section.label,
          value: dashboardStats?.galleryByContext?.[section.context] ?? 0,
        })),
    [dashboardStats?.galleryByContext]
  );
  const visibleGalleryIds = useMemo(() => new Set(galleryItems.map((item) => item.id)), [galleryItems]);
  const selectedVisibleGalleryIds = useMemo(
    () => selectedGalleryIds.filter((id) => visibleGalleryIds.has(id)),
    [selectedGalleryIds, visibleGalleryIds]
  );
  const activeGalleryConfig = useMemo(() => {
    if (activeSection === 'gallery') {
      return {
        label: 'Galeria multimédia',
        context: 'global',
        description: 'Fotos, vídeos e áudios separados por tipo com preview e seleção múltipla.',
      };
    }

    if (isProgrammeGallerySection(activeSection)) {
      return PROGRAMME_GALLERY_SECTIONS[activeSection];
    }

    return null;
  }, [activeSection]);
  const galleryAllowedTypes = activeGalleryConfig?.allowedTypes ?? ALL_GALLERY_MEDIA_TYPES;
  const galleryBatchAccept = galleryAcceptForTypes(galleryAllowedTypes);

  useEffect(() => {
    const fallbackType = galleryAllowedTypes[0] ?? 'photo';

    if (!galleryAllowedTypes.includes(galleryBatchType)) {
      setGalleryBatchType(fallbackType);
    }

    setGalleryForm((current) => (
      galleryAllowedTypes.includes(current.type)
        ? current
        : { ...current, type: fallbackType, sourceFile: null }
    ));

    setGalleryBatchItems((current) => {
      const allowedItems = current.filter((item) => galleryAllowedTypes.includes(item.type));

      if (allowedItems.length === current.length) {
        return current;
      }

      current
        .filter((item) => !galleryAllowedTypes.includes(item.type))
        .forEach((item) => URL.revokeObjectURL(item.previewUrl));

      return allowedItems;
    });
  }, [galleryAllowedTypes, galleryBatchType]);
  const availableSections = useMemo(() => {
    if (!currentAdmin) {
      return [] as SectionId[];
    }

    const sections: SectionId[] = ['overview', 'profile'];

    if (exportAuthMode) {
      return sections;
    }

    sections.push('audit');

    const permissionSet = new Set(currentAdmin.permissions);

    for (const section of ['news', 'activities', 'publications'] as ContentSection[]) {
      if (currentAdmin.role === 'owner' || permissionSet.has(section)) {
        sections.push(section);
      }
    }

    if (currentAdmin.role === 'owner' || permissionSet.has('contacts')) {
      sections.push('contacts');
      sections.push('newsletter');
    }
    if (
      currentAdmin.role === 'owner' ||
      permissionSet.has('news') ||
      permissionSet.has('activities') ||
      permissionSet.has('publications')
    ) {
      sections.push('comments');
    }
    if (currentAdmin.role === 'owner' || permissionSet.has('gallery')) {
      sections.push(...(Object.keys(PROGRAMME_GALLERY_SECTIONS) as ProgrammeGallerySectionId[]));
    }
    if (currentAdmin.role === 'owner' || permissionSet.has('admins')) sections.push('admins');
    if (currentAdmin.role === 'owner' || permissionSet.has('layout')) {
      sections.push('about');
      sections.push('layout');
    }

    return sections;
  }, [currentAdmin, exportAuthMode]);

  const authHeaders = useCallback(async () => {
    if (!exportAuthMode) {
      return {} as Record<string, string>;
    }

    const token = await getAdminAccessToken();
    if (!token) throw new Error('Sessão administrativa expirada.');
    return { Authorization: `Bearer ${token}` } as Record<string, string>;
  }, [exportAuthMode]);

  const fetchAdminCollection = useCallback(async <T,>(section: ContentSection) => {
    const headers = await authHeaders();
    const response = await fetch(`/api/${section}?scope=admin&limit=${ADMIN_CONTENT_LIST_LIMIT}`, { headers });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || `Erro ao carregar ${section}.`);
    return payload as T[];
  }, [authHeaders]);

  const fetchAdminEndpoint = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const headers = await authHeaders();
      const hasBody = typeof init?.body !== 'undefined';
      const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

      const requestHeaders: Record<string, string> = {
        ...headers,
      };

      if (init?.headers) {
        Object.assign(requestHeaders, init.headers as Record<string, string>);
      }

      const hasContentType = Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-type');

      if (hasBody && !isFormData && !hasContentType) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const response = await fetch(path, {
        ...init,
        headers: requestHeaders,
      });
      const payload = await response
        .json()
        .catch(() => (response.status === 204 ? null : {}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão administrativa expirada.');
        }
        throw new Error((payload as { message?: string } | null)?.message || 'Falha no pedido administrativo.');
      }

      return payload as T;
    },
    [authHeaders]
  );

  const uploadRichTextMedia = useCallback(
    async (section: ContentSection, file: File, kind: 'image' | 'audio' | 'video' | 'document') => {
      const fd = new FormData();
      fd.append('section', section);
      fd.append('kind', kind);
      fd.append('file', file);

      try {
        setOperationProgress({ label: 'A carregar ficheiro do editor', percent: 5, detail: file.name });
        const headers = await authHeaders();
        const payload = await requestJsonWithUploadProgress<{ url: string }>(
          '/api/content-assets/rich-text',
          'POST',
          fd,
          headers,
          (percent) => setOperationProgress({ label: 'A carregar ficheiro do editor', percent, detail: file.name })
        );

        if (!payload.url) {
          throw new Error('Não foi possível guardar o ficheiro.');
        }

        return payload.url;
      } finally {
        setOperationProgress(null);
      }
    },
    [authHeaders]
  );

  const uploadGalleryFileToBlob = useCallback(
    async (file: File, galleryContext: string, onProgress?: (percent: number) => void) => {
      const safeContext = galleryContext.replace(/[^a-z0-9-]/g, '-') || 'global';
      const safeName = sanitizeUploadFileName(file.name || 'ficheiro');
      const pathname = `backoffice/gallery-${safeContext}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/gallery/client-upload',
        contentType: file.type || undefined,
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(clampProgress((event.loaded / event.total) * 100));
          }
        },
      });

      onProgress?.(100);
      return blob.url;
    },
    []
  );

  const refreshDashboardStats = useCallback(async () => {
    setIsLoadingDashboardStats(true);
    const data = await fetchAdminEndpoint<DashboardStats>('/api/admin/stats').catch(() => null);
    setDashboardStats(data);
    setIsLoadingDashboardStats(false);
  }, [fetchAdminEndpoint]);

  const refreshContentSection = useCallback(async (section: ContentSection, force = false) => {
    if (!force && loadedContentSectionsRef.current.has(section)) {
      return;
    }

    setIsLoadingContent(true);

    try {
      if (section === 'news') {
        setNews(await fetchAdminCollection<NewsArticle>('news'));
      }

      if (section === 'activities') {
        setActivities(await fetchAdminCollection<Activity>('activities'));
      }

      if (section === 'publications') {
        setPublications(await fetchAdminCollection<Publication>('publications'));
      }

      loadedContentSectionsRef.current.add(section);
    } catch {
      if (section === 'news') setNews([]);
      if (section === 'activities') setActivities([]);
      if (section === 'publications') setPublications([]);
    }

    setIsLoadingContent(false);
  }, [fetchAdminCollection]);

  const refreshAdminUsers = useCallback(async (force = false) => {
    if (!force && loadedAdminUsersRef.current) {
      return;
    }

    setIsLoadingGovernance(true);
    const adminsData = await fetchAdminEndpoint<AdminUser[]>('/api/admin/users').catch(() => []);
    setAdmins(adminsData);
    loadedAdminUsersRef.current = true;
    setIsLoadingGovernance(false);
  }, [fetchAdminEndpoint]);

  const refreshAuditLogs = useCallback(async (force = false) => {
    if (!force && loadedAuditLogsRef.current) {
      return;
    }

    setIsLoadingGovernance(true);
    const auditData = await fetchAdminEndpoint<AuditLogEntry[]>(`/api/admin/audit?limit=${ADMIN_AUDIT_LIMIT}`).catch(() => []);
    setAuditLogs(auditData);
    loadedAuditLogsRef.current = true;
    setIsLoadingGovernance(false);
  }, [fetchAdminEndpoint]);

  const refreshContactMessages = useCallback(async (force = false) => {
    if (!force && loadedContactMessagesRef.current) {
      return;
    }

    setIsLoadingContacts(true);
    const data = await fetchAdminEndpoint<ContactMessage[]>(`/api/admin/contact-messages?limit=${ADMIN_CONTACT_MESSAGES_LIMIT}`).catch(() => []);
    setContactMessages(data);
    loadedContactMessagesRef.current = true;
    setIsLoadingContacts(false);
  }, [fetchAdminEndpoint]);

  const refreshContentComments = useCallback(async (force = false) => {
    if (!force && loadedCommentsRef.current) {
      return;
    }

    setIsLoadingComments(true);
    const data = await fetchAdminEndpoint<ContentComment[]>(`/api/admin/comments?limit=${ADMIN_COMMENTS_LIMIT}`).catch(() => []);
    setContentComments(data);
    loadedCommentsRef.current = true;
    setIsLoadingComments(false);
  }, [fetchAdminEndpoint]);

  const refreshNewsletterSubscribers = useCallback(async (force = false) => {
    if (!force && loadedNewsletterRef.current) {
      return;
    }

    setIsLoadingNewsletter(true);
    const data = await fetchAdminEndpoint<NewsletterSubscriber[]>(`/api/admin/newsletter?limit=${ADMIN_NEWSLETTER_LIMIT}`).catch(() => []);
    setNewsletterSubscribers(data);
    loadedNewsletterRef.current = true;
    setIsLoadingNewsletter(false);
  }, [fetchAdminEndpoint]);

  const refreshLayout = useCallback(async (force = false) => {
    if (!force && loadedLayoutRef.current) {
      return;
    }

    setIsLoadingLayout(true);
    const data = await fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout').catch(() => defaultSiteLayoutSettings);
    setLayoutSettings(data);
    loadedLayoutRef.current = true;
    setIsLoadingLayout(false);
  }, [fetchAdminEndpoint]);

  const refreshGallery = useCallback(async (force = false) => {
    const galleryContext = activeGalleryConfig?.context || 'global';

    if (!force && loadedGalleryContextsRef.current.has(galleryContext)) {
      setGalleryItems(cachedGalleryItemsByContextRef.current.get(galleryContext) ?? []);
      setSelectedGalleryIds([]);
      return;
    }

    setIsLoadingGallery(true);
    const data = await fetchAdminEndpoint<GalleryMediaItem[]>(`/api/gallery?scope=admin&context=${encodeURIComponent(galleryContext)}&limit=${ADMIN_GALLERY_LIST_LIMIT}`).catch(() => []);
    setGalleryItems(data);
    setSelectedGalleryIds([]);
    cachedGalleryItemsByContextRef.current.set(galleryContext, data);
    loadedGalleryContextsRef.current.add(galleryContext);
    setIsLoadingGallery(false);
  }, [activeGalleryConfig, fetchAdminEndpoint]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const sessionResult = await adminAuthClient.adapter.getSession();
        const localSession = sessionResult?.data?.session ?? getStoredAdminSession();

        if (!localSession) {
          router.replace('/backoffice/login');
          return;
        }

        setCurrentAdmin({
          email: localSession.email,
          role: localSession.role,
          permissions: localSession.permissions,
        });
        setIsCheckingSession(false);

        if (exportAuthMode) {
          setIsLoadingDashboardStats(false);
          setIsLoadingContent(false);
          setIsLoadingGovernance(false);
          setIsLoadingContacts(false);
          setIsLoadingComments(false);
          setIsLoadingNewsletter(false);
          setIsLoadingGallery(false);
          setIsLoadingLayout(false);
          return;
        }

        const me = await fetchAdminEndpoint<{ email: string; role: AdminRole; permissions: AdminPermission[] }>('/api/admin/me');
        setCurrentAdmin(me);

        await refreshDashboardStats();
      } catch (error) {
        if (error instanceof Error && (error.message.includes('Sessão administrativa expirada') || error.message.includes('401'))) {
          await adminAuthClient.adapter.signOut().catch(() => undefined);
          router.replace('/backoffice/login');
          return;
        }

        toast.error(error instanceof Error ? error.message : 'Falha ao carregar o backoffice.');
        setIsCheckingSession(false);
        setIsLoadingDashboardStats(false);
        setIsLoadingContent(false);
        setIsLoadingGovernance(false);
        setIsLoadingContacts(false);
        setIsLoadingComments(false);
        setIsLoadingNewsletter(false);
        setIsLoadingGallery(false);
        setIsLoadingLayout(false);
      }
    };

    void bootstrap();
  }, [exportAuthMode, fetchAdminEndpoint, refreshDashboardStats, router]);

  async function updateContactMessage(id: string, read: boolean) {
    setBusy(true);

    try {
      await fetchAdminEndpoint<ContactMessage>('/api/admin/contact-messages', {
        method: 'PATCH',
        body: JSON.stringify({ id, read }),
      });
      toast.success(read ? 'Mensagem marcada como lida.' : 'Mensagem marcada como não lida.');
      await refreshContactMessages(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar a mensagem.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteContentComment(id: string) {
    if (!window.confirm('Tens a certeza de que queres eliminar este comentário?')) return;

    setBusy(true);

    try {
      await fetchAdminEndpoint<null>(`/api/admin/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast.success('Comentário eliminado com sucesso.');
      await refreshContentComments(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao eliminar comentário.');
    } finally {
      setBusy(false);
    }
  }

  async function exportNewsletterSubscribers() {
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/admin/newsletter?format=csv&limit=${ADMIN_NEWSLETTER_LIMIT}`, { headers });
      const csv = await response.text();

      if (!response.ok) {
        throw new Error(csv || 'Falha ao exportar newsletter.');
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'newsletter-ceiscaramulo.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao exportar newsletter.');
    }
  }

  useEffect(() => {
    if (!availableSections.includes(activeSection)) {
      setActiveSection('overview');
    }
  }, [activeSection, availableSections]);

  useEffect(() => {
    if (exportAuthMode) {
      return;
    }

    if (['news', 'activities', 'publications'].includes(activeSection)) {
      void refreshContentSection(activeSection as ContentSection);
      return;
    }

    if (activeSection === 'contacts') {
      void refreshContactMessages();
      return;
    }

    if (activeSection === 'comments') {
      void refreshContentComments();
      return;
    }

    if (activeSection === 'newsletter') {
      void refreshNewsletterSubscribers();
      return;
    }

    if (activeSection === 'admins') {
      void refreshAdminUsers();
      return;
    }

    if (activeSection === 'audit') {
      void refreshAuditLogs();
      return;
    }

    if (activeSection === 'layout' || activeSection === 'about') {
      void refreshLayout();
      return;
    }

    if (activeGalleryConfig) {
      void refreshGallery();
      if (activeSection === 'gallery-biblioteca') {
        void refreshContentSection('publications');
      }
    }
  }, [
    activeGalleryConfig,
    activeSection,
    exportAuthMode,
    refreshAdminUsers,
    refreshAuditLogs,
    refreshContentSection,
    refreshContentComments,
    refreshContactMessages,
    refreshNewsletterSubscribers,
    refreshGallery,
    refreshLayout,
  ]);

  async function saveLayoutSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      await fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout', {
        method: 'PUT',
        body: JSON.stringify(layoutSettings),
      });

      toast.success('Layout atualizado com sucesso.');
      await refreshLayout(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar o layout.');
    } finally {
      setBusy(false);
    }
  }

  function updateFooterContact(updates: Partial<Omit<FooterContactSettings, 'socialMedia'>>) {
    setLayoutSettings((current) => ({
      ...current,
      footer: {
        ...current.footer,
        contactInfo: {
          ...current.footer.contactInfo,
          ...updates,
        },
      },
    }));
  }

  function updateFooterSocialMedia(key: keyof FooterContactSettings['socialMedia'], value: string) {
    setLayoutSettings((current) => ({
      ...current,
      footer: {
        ...current.footer,
        contactInfo: {
          ...current.footer.contactInfo,
          socialMedia: {
            ...current.footer.contactInfo.socialMedia,
            [key]: value,
          },
        },
      },
    }));
  }

  function updateVisualColor(key: keyof SiteLayoutSettings['visualIdentity']['colors'], value: string) {
    setLayoutSettings((current) => ({
      ...current,
      visualIdentity: {
        ...current.visualIdentity,
        colors: {
          ...current.visualIdentity.colors,
          [key]: value,
        },
      },
    }));
  }

  function updateLogo(key: keyof SiteLayoutSettings['visualIdentity']['logos'], value: string) {
    setLayoutSettings((current) => ({
      ...current,
      visualIdentity: {
        ...current.visualIdentity,
        logos: {
          ...current.visualIdentity.logos,
          [key]: value,
        },
      },
    }));
  }

  function updateSeo(updates: Partial<SiteLayoutSettings['seo']>) {
    setLayoutSettings((current) => ({
      ...current,
      seo: {
        ...current.seo,
        ...updates,
      },
    }));
  }

  function updateAppearancePage<Key extends AppearancePageKey>(
    key: Key,
    updates: Partial<SiteLayoutSettings['pages'][Key]>
  ) {
    setLayoutSettings((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [key]: {
          ...current.pages[key],
          ...updates,
        },
      },
    }));
  }

  function textToEditableLines(value: string) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function updateAboutPage(updates: Partial<SiteLayoutSettings['aboutPage']>) {
    // Esta seccao guarda o corpo da pagina "Sobre Nos" dentro do mesmo objeto
    // de layout que ja e auditado pelo backoffice. Assim evitamos criar outro
    // endpoint ou outra tabela so para uma pagina institucional pequena.
    setLayoutSettings((current) => ({
      ...current,
      aboutPage: {
        ...current.aboutPage,
        ...updates,
      },
    }));
  }

  function updateAboutParagraphs(key: 'whoWeAreParagraphs' | 'originParagraphs' | 'foundersParagraphs', value: string) {
    updateAboutPage({ [key]: textToEditableLines(value) } as Partial<SiteLayoutSettings['aboutPage']>);
  }

  function updateAboutSocialBodies(value: string) {
    // Formato editorial simples:
    // - uma linha sem ":" abre um grupo, por exemplo "Direcao";
    // - as linhas seguintes com cargos ficam como membros ate ao proximo grupo.
    // Isto permite editar corpos sociais num textarea sem uma UI pesada.
    const groups: SiteLayoutSettings['aboutPage']['socialBodies'] = [];

    for (const line of textToEditableLines(value)) {
      if (!line.includes(':')) {
        groups.push({ title: line, members: [] });
        continue;
      }

      const lastGroup = groups.at(-1);
      if (lastGroup) {
        lastGroup.members.push(line);
      }
    }

    updateAboutPage({ socialBodies: groups });
  }

  function moveExploreLink(index: number, direction: -1 | 1) {
    setLayoutSettings((current) => {
      const links = [...current.home.explore.links];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= links.length) return current;
      [links[index], links[nextIndex]] = [links[nextIndex], links[index]];
      return { ...current, home: { ...current.home, explore: { ...current.home.explore, links } } };
    });
  }

  function resetCurrentForm() {
    setEditingId(null);
    if (activeSection === 'news') setNewsForm({ title: '', excerpt: '', content: '', author: '', published: true, publishedAt: '', imageFile: null, removeImage: false });
    if (activeSection === 'activities') setActivityForm({ title: '', description: '', date: '', endDate: '', location: '', category: 'evento', published: true, imageFile: null, removeImage: false });
    if (activeSection === 'publications') resetPublicationForm();
  }

  function resetPublicationForm() {
    setEditingId(null);
    setPublicationForm(getEmptyPublicationForm());
    setPublicationFormResetKey((value) => value + 1);
  }

  async function saveSection(section: ContentSection, formData: FormData) {
    setBusy(true);
    try {
      setOperationProgress({ label: 'A guardar conteudo', percent: 5, detail: section });
      const headers = await authHeaders();
      const endpoint = editingId ? `/api/${section}/${editingId}` : `/api/${section}`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, { method, headers, body: formData });
      const responseText = await response.text();
      const payload = responseText
        ? (() => {
            try {
              return JSON.parse(responseText) as { message?: string };
            } catch {
              return null;
            }
          })()
        : null;

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('O ficheiro é demasiado grande para ser enviado de uma vez. Usa um ficheiro mais leve ou coloca o ficheiro por URL.');
        }

        throw new Error(payload?.message || responseText.trim() || 'Erro ao guardar registo.');
      }

      toast.success(editingId ? 'Registo atualizado com sucesso.' : 'Registo criado com sucesso.');
      resetCurrentForm();
      setOperationProgress({ label: 'A atualizar listas', percent: 95, detail: section });
      await Promise.all([refreshContentSection(section, true), refreshDashboardStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao guardar registo.');
    } finally {
      setOperationProgress(null);
      setBusy(false);
    }
  }

  async function deleteSectionItem(section: ContentSection, id: string) {
    if (!window.confirm('Tens a certeza de que queres eliminar este registo?')) return;

    setBusy(true);
    try {
      const headers = await authHeaders();
      const response = await fetch(`/api/${section}/${id}`, { method: 'DELETE', headers });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Erro ao eliminar registo.');

      toast.success('Registo removido com sucesso.');
      await Promise.all([refreshContentSection(section, true), refreshDashboardStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao eliminar registo.');
    } finally {
      setBusy(false);
    }
  }

  function resetGalleryForm() {
    setGalleryEditingId(null);
    setGalleryForm({
      title: '',
      description: '',
      type: 'photo',
      sourceUrl: '',
      sourceFile: null,
      thumbnailUrl: '',
      thumbnailFile: null,
      published: true,
    });
    setGalleryFormResetKey((value) => value + 1);
  }

  function startNewGalleryItem() {
    resetGalleryForm();
    setSelectedGalleryIds([]);
    clearGalleryBatchItems();
    window.requestAnimationFrame(() => {
      galleryIndividualFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function clearGalleryBatchItems() {
    setGalleryBatchItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  }

  function handleGalleryBatchFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const nextItems = Array.from(files)
      .map((file) => ({ file, type: inferGalleryBatchType(file, galleryBatchType, galleryAllowedTypes) }))
      .filter((item): item is { file: File; type: GalleryMediaType } => Boolean(item.type))
      .map(({ file, type }) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          type,
          title: titleFromFileName(file.name),
          description: '',
          published: true,
        }));

    if (nextItems.length === 0) {
      toast.error(
        galleryAllowedTypes.includes('video') || galleryAllowedTypes.includes('audio')
          ? 'Seleciona ficheiros de imagem, vídeo, áudio ou PDF/documento para este carregamento em massa.'
          : 'Seleciona ficheiros de imagem ou PDF/documento para este carregamento em massa.'
      );
      return;
    }

    setGalleryBatchItems((current) => [...current, ...nextItems]);
  }

  function updateGalleryBatchItem(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      published: boolean;
    }>
  ) {
    setGalleryBatchItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }

  function removeGalleryBatchItem(id: string) {
    setGalleryBatchItems((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
  }

  function startEditGallery(item: GalleryMediaItem) {
    setGalleryEditingId(item.id);
    setSelectedGalleryIds([]);
    clearGalleryBatchItems();
    setGalleryFormResetKey((value) => value + 1);
    setGalleryForm({
      title: item.title,
      description: item.description || '',
      type: item.type,
      sourceUrl: item.source.startsWith('data:') || isGalleryAssetRoute(item.source) ? '' : item.source,
      sourceFile: null,
      thumbnailUrl: item.thumbnail && !item.thumbnail.startsWith('data:') && !isGalleryAssetRoute(item.thumbnail) ? item.thumbnail : '',
      thumbnailFile: null,
      published: item.published,
    });
    window.requestAnimationFrame(() => {
      galleryIndividualFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function saveGalleryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const uploadDetail = galleryForm.sourceFile?.name || galleryForm.thumbnailFile?.name || galleryForm.title;
      setOperationProgress({
        label: galleryEditingId ? 'A atualizar media' : 'A carregar media',
        percent: 5,
        detail: uploadDetail,
      });

      const fd = new FormData();
      const galleryContext = activeGalleryConfig?.context || 'global';
      const sourceUrl = galleryForm.sourceFile
        ? await uploadGalleryFileToBlob(galleryForm.sourceFile, galleryContext, (percent) =>
            setOperationProgress({
              label: galleryEditingId ? 'A enviar ficheiro para Blob' : 'A enviar ficheiro para Blob',
              percent,
              detail: uploadDetail,
            })
          )
        : galleryForm.sourceUrl;
      const thumbnailUrl = galleryForm.thumbnailFile
        ? await uploadGalleryFileToBlob(galleryForm.thumbnailFile, `${galleryContext}-thumbnails`, (percent) =>
            setOperationProgress({
              label: 'A enviar thumbnail para Blob',
              percent,
              detail: galleryForm.thumbnailFile?.name || uploadDetail,
            })
          )
        : galleryForm.thumbnailUrl;

      fd.append('context', activeGalleryConfig?.context || 'global');
      fd.append('title', galleryForm.title);
      fd.append('description', galleryForm.description);
      fd.append('type', galleryForm.type);
      fd.append('sourceUrl', sourceUrl);
      fd.append('thumbnailUrl', thumbnailUrl);
      fd.append('mimeType', galleryForm.sourceFile?.type || '');
      fd.append('published', String(galleryForm.published));

      const headers = await authHeaders();
      await requestJsonWithUploadProgress<GalleryMediaItem>(
        galleryEditingId ? `/api/gallery/${galleryEditingId}` : '/api/gallery',
        galleryEditingId ? 'PUT' : 'POST',
        fd,
        headers,
        (percent) =>
          setOperationProgress({
            label: galleryEditingId ? 'A atualizar media' : 'A carregar media',
            percent,
            detail: uploadDetail,
          })
      );

      toast.success(galleryEditingId ? 'Media atualizado com sucesso.' : 'Media criado com sucesso.');
      resetGalleryForm();
      setOperationProgress({ label: 'A atualizar galeria', percent: 95, detail: uploadDetail });
      await Promise.all([refreshGallery(true), refreshDashboardStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao guardar media da galeria.');
    } finally {
      setOperationProgress(null);
      setBusy(false);
    }
  }

  async function deleteGalleryItem(id: string) {
    if (!window.confirm('Tens a certeza de que queres eliminar este media da galeria?')) return;

    setBusy(true);
    try {
      await fetchAdminEndpoint<null>(`/api/gallery/${id}`, { method: 'DELETE' });
      toast.success('Media removido com sucesso.');
      await Promise.all([refreshGallery(true), refreshDashboardStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao eliminar media da galeria.');
    } finally {
      setBusy(false);
    }
  }

  function toggleGallerySelection(id: string, checked: boolean) {
    setSelectedGalleryIds((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((itemId) => itemId !== id)
    );
  }

  function toggleGalleryTypeSelection(type: GalleryMediaType, checked: boolean) {
    const ids = groupedGalleryItems[type].map((item) => item.id);
    setSelectedGalleryIds((current) =>
      checked ? Array.from(new Set([...current, ...ids])) : current.filter((itemId) => !ids.includes(itemId))
    );
  }

  async function deleteSelectedGalleryItems(type?: GalleryMediaType) {
    const visibleSelectedIds = selectedGalleryIds.filter((id) => visibleGalleryIds.has(id));
    const ids = (type ? groupedGalleryItems[type].map((item) => item.id) : visibleSelectedIds).filter((id) =>
      visibleSelectedIds.includes(id)
    );

    if (ids.length === 0) {
      toast.error('Seleciona pelo menos um item da galeria para eliminar.');
      return;
    }

    const confirmed = window.confirm(
      ids.length === 1
        ? 'Deseja eliminar o item selecionado da galeria?'
        : `Deseja eliminar os ${ids.length} itens selecionados da galeria?`
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      await Promise.all(ids.map((id) => fetchAdminEndpoint<null>(`/api/gallery/${id}`, { method: 'DELETE' })));

      setSelectedGalleryIds((current) => current.filter((id) => !ids.includes(id)));
      toast.success(ids.length === 1 ? 'Item eliminado com sucesso.' : `${ids.length} itens eliminados com sucesso.`);
      await Promise.all([refreshGallery(true), refreshDashboardStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao eliminar itens da galeria.');
    } finally {
      setBusy(false);
    }
  }

  async function saveGalleryBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (galleryBatchItems.length === 0) {
      toast.error('Adiciona pelo menos um ficheiro para carregar em massa.');
      return;
    }

    const firstInvalid = galleryBatchItems.find((item) => !item.title.trim());

    if (firstInvalid) {
      toast.error('Cada item precisa de um título antes de gravar.');
      return;
    }

    setBusy(true);

    try {
      const galleryContext = activeGalleryConfig?.context || 'global';
      const totalItems = galleryBatchItems.length;
      let completedItems = 0;
      const headers = await authHeaders();

      setOperationProgress({
        label: 'A carregar lote da galeria',
        percent: 0,
        detail: `0/${totalItems} concluidos`,
      });

      const uploadOne = async (item: (typeof galleryBatchItems)[number]) => {
        const sourceUrl = await uploadGalleryFileToBlob(item.file, galleryContext, (filePercent) => {
          const overallPercent = ((completedItems + filePercent / 100) / totalItems) * 100;
          setOperationProgress({
            label: 'A carregar lote da galeria',
            percent: clampProgress(overallPercent),
            detail: `${completedItems}/${totalItems} concluidos - ${item.file.name}`,
          });
        });

        const fd = new FormData();
        fd.append('title', item.title.trim());
        fd.append('description', item.description.trim());
        fd.append('type', item.type);
        fd.append('context', galleryContext);
        fd.append('published', String(item.published));
        fd.append('sourceUrl', sourceUrl);
        fd.append('mimeType', item.file.type || '');

        const result = await requestJsonWithUploadProgress<GalleryMediaItem>(
          '/api/gallery',
          'POST',
          fd,
          headers,
          (filePercent) => {
            const overallPercent = ((completedItems + filePercent / 100) / totalItems) * 100;
            setOperationProgress({
              label: 'A carregar lote da galeria',
              percent: clampProgress(overallPercent),
              detail: `${completedItems}/${totalItems} concluidos - ${item.file.name}`,
            });
          }
        );

        completedItems += 1;
        setOperationProgress({
          label: 'A carregar lote da galeria',
          percent: clampProgress((completedItems / totalItems) * 100),
          detail: `${completedItems}/${totalItems} concluidos`,
        });

        return result;
      };

      await runGalleryBatchQueue(galleryBatchItems, uploadOne, 1);

      toast.success(`${galleryBatchItems.length} item(ns) carregado(s) com sucesso.`);
      clearGalleryBatchItems();
      setOperationProgress({ label: 'A atualizar galeria', percent: 95, detail: `${totalItems}/${totalItems} concluidos` });
      await Promise.all([refreshGallery(true), refreshDashboardStats()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no carregamento em massa da galeria.');
    } finally {
      setOperationProgress(null);
      setBusy(false);
    }
  }

  async function createAdminUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setCreatedAdminPassword(null);

    try {
      const created = await fetchAdminEndpoint<AdminUser & { generatedPassword?: string | null }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole,
          password: newAdminPasswordMode === 'manual' ? newAdminPassword : undefined,
          generatePassword: newAdminPasswordMode === 'generated',
        }),
      });

      toast.success('Utilizador admin criado com sucesso.');
      setNewAdminEmail('');
      setNewAdminRole('editor');
      setNewAdminPassword('');
      setNewAdminPasswordMode('generated');
      setCreatedAdminPassword(created.generatedPassword ?? null);
      await refreshAdminUsers(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar utilizador admin.');
    } finally {
      setBusy(false);
    }
  }

  async function updateAdminUser(email: string, payload: { role?: AdminRole; active?: boolean; permissions?: AdminPermission[] }) {
    setBusy(true);

    try {
      await fetchAdminEndpoint<AdminUser>('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({
          email,
          ...payload,
        }),
      });

      toast.success('Utilizador admin atualizado com sucesso.');
      await refreshAdminUsers(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar utilizador admin.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAdminUser(email: string) {
    if (!window.confirm(`Tens a certeza de que queres remover ${email}?`)) return;

    setBusy(true);

    try {
      await fetchAdminEndpoint<null>(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      toast.success('Utilizador admin removido com sucesso.');
      await refreshAdminUsers(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao remover utilizador admin.');
    } finally {
      setBusy(false);
    }
  }

  function openAdminDialog(admin: AdminUser) {
    setSelectedAdmin(admin);
    setSelectedAdminPermissions(admin.permissions);
    setIsAdminDialogOpen(true);
  }

  async function copyCreatedAdminPassword() {
    if (!createdAdminPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdAdminPassword);
      toast.success('Palavra-passe copiada para a área de transferência.');
    } catch {
      toast.error('Não foi possível copiar a palavra-passe.');
    }
  }

  async function updateOwnPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      await fetchAdminEndpoint<{ success: boolean }>('/api/admin/password', {
        method: 'POST',
        body: JSON.stringify({
          password: accountPassword,
          confirmPassword: accountPasswordConfirm,
        }),
      });

      toast.success('Palavra-passe atualizada com sucesso.');
      setAccountPassword('');
      setAccountPasswordConfirm('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar a palavra-passe.');
    } finally {
      setBusy(false);
    }
  }

  function toggleSelectedAdminPermission(permission: AdminPermission) {
    setSelectedAdminPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]
    );
  }

  async function saveSelectedAdminPermissions() {
    if (!selectedAdmin) {
      return;
    }

    await updateAdminUser(selectedAdmin.email, { permissions: selectedAdminPermissions });
    setIsAdminDialogOpen(false);
    setSelectedAdmin(null);
  }

  async function handleNewsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData();
    fd.append('title', newsForm.title);
    fd.append('excerpt', newsForm.excerpt);
    fd.append('content', newsForm.content);
    fd.append('author', newsForm.author);
    fd.append('published', 'true');
    fd.append('publishedAt', newsForm.publishedAt);
    fd.append('removeImage', String(newsForm.removeImage));
    if (newsForm.imageFile) fd.append('image', newsForm.imageFile);
    await saveSection('news', fd);
  }

  async function handleActivitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData();
    fd.append('title', activityForm.title);
    fd.append('description', activityForm.description);
    fd.append('date', activityForm.date);
    fd.append('endDate', activityForm.endDate);
    fd.append('location', activityForm.location);
    fd.append('category', activityForm.category);
    fd.append('published', 'true');
    fd.append('removeImage', String(activityForm.removeImage));
    if (activityForm.imageFile) fd.append('image', activityForm.imageFile);
    await saveSection('activities', fd);
  }

  async function handlePublicationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData();
    fd.append('title', publicationForm.title);
    fd.append('author', publicationForm.author);
    fd.append('year', publicationForm.year);
    fd.append('type', publicationForm.type);
    fd.append('description', publicationForm.description);
    fd.append('downloadUrl', publicationForm.downloadUrl);
    fd.append('published', 'true');
    fd.append('removeImage', String(publicationForm.removeImage));
    if (publicationForm.coverImageFile) fd.append('coverImage', publicationForm.coverImageFile);
    if (publicationForm.documentFile) fd.append('document', publicationForm.documentFile);
    await saveSection('publications', fd);
  }

  function startEdit(section: ContentSection, item: NewsArticle | Activity | Publication) {
    setActiveSection(section);
    setEditingId(item.id);

    if (section === 'news') {
      const v = item as NewsArticle;
      setNewsForm({ title: v.title || '', excerpt: v.excerpt || '', content: v.content || '', author: v.author || '', published: v.published, publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString().slice(0, 10) : '', imageFile: null, removeImage: false });
    }
    if (section === 'activities') {
      const v = item as Activity;
      setActivityForm({ title: v.title || '', description: v.description || '', date: v.date ? new Date(v.date).toISOString().slice(0, 10) : '', endDate: v.endDate ? new Date(v.endDate).toISOString().slice(0, 10) : '', location: v.location || '', category: v.category || 'evento', published: v.published, imageFile: null, removeImage: false });
    }
    if (section === 'publications') {
      const v = item as Publication;
      setPublicationForm({ title: v.title || '', author: v.author || '', year: String(v.year || ''), type: v.type || '', description: v.description || '', downloadUrl: v.downloadUrl || '', documentFile: null, published: true, coverImageFile: null, removeImage: false });
      setPublicationFormResetKey((value) => value + 1);
    }
  }

  if (isCheckingSession) {
    return <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-16">A validar sessão…</main>;
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-stone-200 bg-white px-2 py-5 shadow-sm transition-[width] duration-200 sm:px-3',
          isSidebarCollapsed ? 'w-16 sm:w-20' : 'w-56 sm:w-64'
        )}
        aria-label="Navegação do backoffice"
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-sm font-semibold uppercase tracking-[0.16em] text-[#0f4c36]', isSidebarCollapsed && 'sr-only')}>
            Backoffice
          </span>
          <button
            type="button"
            aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
            aria-expanded={!isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 text-stone-700"
          >
            {isSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="mt-6 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1" aria-label="Secções do backoffice">
          {BACKOFFICE_NAV_ITEMS.filter((item) => availableSections.includes(item.id)).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              title={item.label}
              className={sidebarNavClass(activeSection === item.id, isSidebarCollapsed)}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-xs font-semibold text-[#0f4c36]">
                {item.label.charAt(0)}
              </span>
              <span className={cn(isSidebarCollapsed && 'sr-only')}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div
        className={cn(
          'min-h-screen w-full py-8 pr-4 transition-[padding] duration-200 sm:py-10 sm:pr-6 lg:pr-8',
          isSidebarCollapsed ? 'pl-20 sm:pl-28' : 'pl-60 sm:pl-72'
        )}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-[#0f4c36]">Backoffice CEISCaramulo</h1>
              <p className="mt-2 text-sm text-stone-600">
                {exportAuthMode
                  ? 'Modo export: sessão local para aceder ao painel estático.'
                  : 'Autenticação administrativa com CRUD completo nas secções disponíveis.'}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await adminAuthClient.adapter.signOut();
                if (exportAuthMode || typeof window === 'undefined') {
                  router.replace('/backoffice/login');
                  return;
                }

                window.location.assign(`${getAuth0AdminLoginHref()}&prompt=login`);
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              Terminar sessão
            </button>
          </div>

          {operationProgress ? <OperationProgressNotice progress={operationProgress} /> : null}

          {exportAuthMode ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Esta sessão é compatível com `output: "export"` e protege a interface do backoffice no cliente. As operações de gestão de conteúdos continuam a exigir um deploy com runtime servidor.
            </div>
          ) : null}

      {activeSection === 'overview' ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0f4c36]">Painel de visão geral</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-stone-900">Resumo do backoffice</h2>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Notícias" value={stats.news} loading={isLoadingDashboardStats} />
            <Card title="Atividades" value={stats.activities} loading={isLoadingDashboardStats} />
            <Card title="Recursos" value={stats.publications} loading={isLoadingDashboardStats} />
            <Card title="Mensagens" value={stats.contacts} loading={isLoadingDashboardStats} />
            {overviewProgrammeCards.map((card) => (
              <Card
                key={card.title}
                title={card.title}
                value={card.value}
                loading={isLoadingDashboardStats}
              />
            ))}
          </div>

        </section>
      ) : null}

      {activeSection === 'profile' ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-[#0f4c36]">Perfil do utilizador</h2>
            <p className="mt-1 text-sm text-stone-600">
              Consulta os dados da tua conta administrativa e gere a segurança de acesso ao backoffice.
            </p>

            <dl className="mt-6 grid gap-4 text-sm">
              <div className="rounded-lg bg-stone-50 p-4">
                <dt className="font-semibold text-stone-500">Email</dt>
                <dd className="mt-1 text-stone-800">{currentAdmin?.email || 'Sessão sem email associado'}</dd>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <dt className="font-semibold text-stone-500">Função</dt>
                <dd className="mt-1 text-stone-800">{currentAdmin?.role === 'owner' ? 'Owner' : 'Editor'}</dd>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <dt className="font-semibold text-stone-500">Permissões</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {currentAdmin?.role === 'owner' ? (
                    <span className="rounded-full bg-[#0f4c36]/10 px-3 py-1 text-xs font-medium text-[#0f4c36]">Acesso total</span>
                  ) : currentAdmin?.permissions.length ? (
                    currentAdmin.permissions.map((permission) => (
                      <span key={permission} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                        {ADMIN_PERMISSION_OPTIONS.find((option) => option.id === permission)?.label || permission}
                      </span>
                    ))
                  ) : (
                    <span className="text-stone-500">Sem permissões atribuídas.</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-[#0f4c36]">Segurança da conta</h2>
            <p className="mt-1 text-sm text-stone-600">
              Altera a tua palavra-passe sempre que for necessário reforçar a segurança.
            </p>

            {exportAuthMode ? (
              <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                A alteração de palavra-passe exige o modo servidor do backoffice.
              </p>
            ) : (
              <form className="mt-5 grid gap-3" onSubmit={(event) => void updateOwnPassword(event)}>
                <Input
                  label="Nova palavra-passe"
                  type="password"
                  value={accountPassword}
                  onChange={setAccountPassword}
                  required
                />
                <Input
                  label="Confirmar nova palavra-passe"
                  type="password"
                  value={accountPasswordConfirm}
                  onChange={setAccountPasswordConfirm}
                  required
                />
                <button
                  className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white"
                  disabled={busy}
                >
                  {backofficePrimaryActionLabel(busy, 'Atualizar palavra-passe')}
                </button>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {activeSection === 'news' ? (
        <SectionLayout
          title="Notícias"
          list={news}
          loading={isLoadingContent}
          busy={busy}
          onNew={() => { setEditingId(null); setNewsForm({ title: '', excerpt: '', content: '', author: '', published: true, publishedAt: '', imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('news', item as NewsArticle)}
          onDelete={(id) => void deleteSectionItem('news', id)}
          form={
            <form className="space-y-3" onSubmit={(event) => void handleNewsSubmit(event)}>
              <Input label="Título" value={newsForm.title} onChange={(v) => setNewsForm((c) => ({ ...c, title: v }))} required />
              <Input label="Resumo" value={newsForm.excerpt} onChange={(v) => setNewsForm((c) => ({ ...c, excerpt: v }))} required />
              <RichTextEditor label="Conteúdo" value={newsForm.content} onChange={(v) => setNewsForm((c) => ({ ...c, content: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('news', file, kind)} fullscreenEnabled />
              <Input label="Autor" value={newsForm.author} onChange={(v) => setNewsForm((c) => ({ ...c, author: v }))} required />
              <Input label="Data de publicação" type="date" value={newsForm.publishedAt} onChange={(v) => setNewsForm((c) => ({ ...c, publishedAt: v }))} />
              <FileInput label="Imagem" onFile={(file) => setNewsForm((c) => ({ ...c, imageFile: file, removeImage: false }))} />
              <Check label="Remover foto de capa atual" checked={newsForm.removeImage} onChange={(checked) => setNewsForm((c) => ({ ...c, removeImage: checked, imageFile: checked ? null : c.imageFile }))} />
              <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
                {backofficePrimaryActionLabel(busy, editingId ? 'Guardar alterações' : 'Criar notícia')}
              </button>
            </form>
          }
        />
      ) : null}

      {activeSection === 'activities' ? (
        <SectionLayout
          title="Atividades"
          list={activities}
          loading={isLoadingContent}
          busy={busy}
          onNew={() => { setEditingId(null); setActivityForm({ title: '', description: '', date: '', endDate: '', location: '', category: 'evento', published: true, imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('activities', item as Activity)}
          onDelete={(id) => void deleteSectionItem('activities', id)}
          form={
            <form className="space-y-3" onSubmit={(event) => void handleActivitySubmit(event)}>
              <Input label="Título" value={activityForm.title} onChange={(v) => setActivityForm((c) => ({ ...c, title: v }))} required />
              <RichTextEditor label="Descrição" value={activityForm.description} onChange={(v) => setActivityForm((c) => ({ ...c, description: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('activities', file, kind)} fullscreenEnabled />
              <Input label="Data" type="date" value={activityForm.date} onChange={(v) => setActivityForm((c) => ({ ...c, date: v }))} required />
              <Input label="Data fim" type="date" value={activityForm.endDate} onChange={(v) => setActivityForm((c) => ({ ...c, endDate: v }))} />
              <Input label="Local" value={activityForm.location} onChange={(v) => setActivityForm((c) => ({ ...c, location: v }))} />
              <label className="grid gap-1 text-sm text-stone-700">
                Categoria da atividade
                <select
                  value={activityForm.category}
                  onChange={(event) => setActivityForm((c) => ({ ...c, category: event.target.value as ActivityCategory }))}
                  className="h-10 rounded-lg border border-stone-300 px-3"
                >
                  {ACTIVITY_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <FileInput label="Imagem" onFile={(file) => setActivityForm((c) => ({ ...c, imageFile: file, removeImage: false }))} />
              <Check label="Remover foto de capa atual" checked={activityForm.removeImage} onChange={(checked) => setActivityForm((c) => ({ ...c, removeImage: checked, imageFile: checked ? null : c.imageFile }))} />
              <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>{backofficePrimaryActionLabel(busy, editingId ? 'Guardar alterações' : 'Criar atividade')}</button>
            </form>
          }
        />
      ) : null}

      {(activeSection === 'publications' || activeSection === 'gallery-biblioteca') ? (
        <SectionLayout
          title="Recursos"
          description="Biblioteca simples: adiciona título, autor, ano, tipo e ficheiro otimizado (PDF, foto, vídeo ou áudio) ou link quando existir."
          newButtonLabel="Novo recurso"
          list={publications}
          loading={isLoadingContent}
          busy={busy}
          onNew={resetPublicationForm}
          onEdit={(item) => startEdit('publications', item as Publication)}
          onDelete={(id) => void deleteSectionItem('publications', id)}
          form={
            <div className="space-y-6">
              <form className="space-y-3" onSubmit={(event) => void handlePublicationSubmit(event)}>
                <Input label="Título" value={publicationForm.title} onChange={(v) => setPublicationForm((c) => ({ ...c, title: v }))} required />
                <Input label="Autor ou entidade" value={publicationForm.author} onChange={(v) => setPublicationForm((c) => ({ ...c, author: v }))} required />
                <Input label="Ano" value={publicationForm.year} onChange={(v) => setPublicationForm((c) => ({ ...c, year: v }))} required />
                <label className="grid gap-1 text-sm text-stone-700">
                  Tipo de recurso
                  <select value={publicationForm.type} onChange={(event) => setPublicationForm((c) => ({ ...c, type: event.target.value as PublicationType }))} className="h-10 rounded-lg border border-stone-300 px-3" required>
                    <option value="" disabled>Selecionar tipo</option>
                    {PUBLICATION_TYPE_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                  </select>
                </label>
                <RichTextEditor label="Resumo simples" value={publicationForm.description} onChange={(v) => setPublicationForm((c) => ({ ...c, description: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('publications', file, kind)} fullscreenEnabled />
                <Input label="Link externo do recurso (opcional)" value={publicationForm.downloadUrl} onChange={(v) => setPublicationForm((c) => ({ ...c, downloadUrl: v }))} />
                <FileInput key={`publication-document-${publicationFormResetKey}`} label="Ficheiro do recurso (PDF, foto, vídeo ou áudio)" accept={RESOURCE_ATTACHMENT_ACCEPT} onFile={(file) => setPublicationForm((c) => ({ ...c, documentFile: file }))} />
                <FileInput key={`publication-cover-${publicationFormResetKey}`} label="Capa (opcional)" onFile={(file) => setPublicationForm((c) => ({ ...c, coverImageFile: file }))} />
                <Check label="Remover capa atual" checked={publicationForm.removeImage} onChange={(checked) => setPublicationForm((c) => ({ ...c, removeImage: checked }))} />
                <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>{backofficePrimaryActionLabel(busy, editingId ? 'Guardar alterações' : 'Criar recurso')}</button>
              </form>

            </div>
          }
        />
      ) : null}

      {activeSection === 'contacts' ? (
        <section className="mt-8 grid gap-6">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0f4c36]">Mensagens de contacto</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Mensagens enviadas pelo formulário público de contactos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refreshContactMessages()}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700"
                disabled={busy}
              >
                Atualizar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {isLoadingContacts ? <MessageListSkeleton /> : null}
              {contactMessages.map((message) => (
                <article key={message.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[#0f4c36]">{message.subject}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {message.name} · {message.email}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-400">
                        {new Date(message.createdAt).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <span
                      className={
                        message.read
                          ? 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900'
                          : 'rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900'
                      }
                    >
                      {message.read ? 'Lida' : 'Não lida'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
                    {message.message}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`mailto:${message.email}?subject=${encodeURIComponent(`RE: ${message.subject}`)}`}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700"
                    >
                      Responder por email
                    </a>
                    <button
                      type="button"
                      onClick={() => void updateContactMessage(message.id, !message.read)}
                      className="rounded-lg bg-[#0f4c36] px-3 py-2 text-sm text-white"
                      disabled={busy}
                    >
                      {message.read ? 'Marcar como não lida' : 'Marcar como lida'}
                    </button>
                  </div>
                </article>
              ))}

              {!isLoadingContacts && contactMessages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
                  Ainda não há mensagens enviadas pela página de contactos.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === 'comments' ? (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#0f4c36]">Comentários públicos</h2>
              <p className="mt-1 text-sm text-stone-600">Comentários deixados em notícias, atividades e recursos.</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshContentComments(true)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700"
              disabled={busy}
            >
              Atualizar
            </button>
          </div>

          {isLoadingComments ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ) : contentComments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
              Ainda não existem comentários públicos.
            </p>
          ) : (
            <div className="space-y-3">
              {contentComments.map((comment) => (
                <article key={comment.id} className="rounded-lg border border-stone-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.12em] text-stone-500">
                        {comment.contentType === 'news' ? 'Notícia' : comment.contentType === 'activities' ? 'Atividade' : 'Recurso'}
                        {comment.contentTitle ? ` - ${comment.contentTitle}` : ''}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-stone-900">{comment.name}</h3>
                      <p className="text-xs text-stone-500">
                        {[comment.email, new Date(comment.createdAt).toLocaleString('pt-PT')].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteContentComment(comment.id)}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700"
                      disabled={busy}
                    >
                      Eliminar
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{comment.message}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeSection === 'newsletter' ? (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#0f4c36]">Newsletter</h2>
              <p className="mt-1 text-sm text-stone-600">Emails registados pelo formulário público da newsletter.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refreshNewsletterSubscribers(true)}
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700"
                disabled={busy}
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => void exportNewsletterSubscribers()}
                className="rounded-lg bg-[#0f4c36] px-3 py-2 text-sm text-white"
                disabled={busy || newsletterSubscribers.length === 0}
              >
                Exportar CSV
              </button>
            </div>
          </div>

          {isLoadingNewsletter ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : newsletterSubscribers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
              Ainda não existem subscritores registados.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-stone-200">
              {newsletterSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex flex-col gap-1 border-b border-stone-100 px-4 py-3 text-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-stone-900">{subscriber.email}</span>
                  <span className="text-xs text-stone-500">{new Date(subscriber.createdAt).toLocaleString('pt-PT')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeGalleryConfig ? (
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#0f4c36]">{activeGalleryConfig.label}</h2>
                <p className="mt-1 text-sm text-stone-600">{activeGalleryConfig.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={startNewGalleryItem} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">Novo</button>
                <button
                  type="button"
                  onClick={() => void deleteSelectedGalleryItems()}
                  className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700"
                  disabled={busy || selectedVisibleGalleryIds.length === 0}
                >
                  Eliminar selecionados
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {isLoadingGallery ? (
                <>
                  <GalleryGroupSkeleton title="Fotos" />
                  <GalleryGroupSkeleton title="Documentos" />
                  <GalleryGroupSkeleton title="Vídeos" />
                  <GalleryGroupSkeleton title="Áudios" />
                </>
              ) : (
                <>
              <GalleryGroup
                title="Fotos"
                type="photo"
                items={groupedGalleryItems.photo}
                selectedIds={selectedGalleryIds}
                busy={busy}
                onToggleTypeSelection={toggleGalleryTypeSelection}
                onToggleSelection={toggleGallerySelection}
                onEdit={startEditGallery}
                onDelete={(id) => void deleteGalleryItem(id)}
                onDeleteSelected={() => void deleteSelectedGalleryItems('photo')}
              />
              <GalleryGroup
                title="Documentos"
                type="document"
                items={groupedGalleryItems.document}
                selectedIds={selectedGalleryIds}
                busy={busy}
                onToggleTypeSelection={toggleGalleryTypeSelection}
                onToggleSelection={toggleGallerySelection}
                onEdit={startEditGallery}
                onDelete={(id) => void deleteGalleryItem(id)}
                onDeleteSelected={() => void deleteSelectedGalleryItems('document')}
              />
              <GalleryGroup
                title="Vídeos"
                type="video"
                items={groupedGalleryItems.video}
                selectedIds={selectedGalleryIds}
                busy={busy}
                onToggleTypeSelection={toggleGalleryTypeSelection}
                onToggleSelection={toggleGallerySelection}
                onEdit={startEditGallery}
                onDelete={(id) => void deleteGalleryItem(id)}
                onDeleteSelected={() => void deleteSelectedGalleryItems('video')}
              />
              <GalleryGroup
                title="Áudios"
                type="audio"
                items={groupedGalleryItems.audio}
                selectedIds={selectedGalleryIds}
                busy={busy}
                onToggleTypeSelection={toggleGalleryTypeSelection}
                onToggleSelection={toggleGallerySelection}
                onEdit={startEditGallery}
                onDelete={(id) => void deleteGalleryItem(id)}
                onDeleteSelected={() => void deleteSelectedGalleryItems('audio')}
              />
                </>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 opacity-100">
            <div className={busy ? 'pointer-events-none opacity-70' : ''}>
              <div className="flex flex-col gap-6">
              <form className={`${galleryEditingId ? 'order-2' : 'order-1'} space-y-4 rounded-xl border border-stone-200 p-4`} onSubmit={(event) => void saveGalleryBatch(event)}>
                <div>
                  <h3 className="text-base font-semibold text-[#0f4c36]">Carregamento em massa</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Seleciona vários ficheiros e ajusta os dados de cada um antes de gravar. O tipo é detetado automaticamente.
                  </p>
                </div>

                <label className="grid gap-1 text-sm text-stone-700">
                  Tipo predefinido para ficheiros sem formato reconhecido
                  <select
                    value={galleryBatchType}
                    onChange={(event) => setGalleryBatchType(event.target.value as GalleryMediaType)}
                    className="h-10 rounded-lg border border-stone-300 px-3"
                  >
                    {galleryAllowedTypes.map((type) => (
                      <option key={type} value={type}>{type === 'document' ? 'Documentos/PDFs' : `${galleryTypeLabel(type)}s`}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm text-stone-700">
                  Ficheiros
                  <input
                    type="file"
                    accept={galleryBatchAccept}
                    multiple
                    onChange={(event) => {
                      handleGalleryBatchFiles(event.target.files);
                      event.target.value = '';
                    }}
                    className="block w-full text-sm"
                  />
                </label>

                {galleryBatchItems.length > 0 ? (
                  <div className="space-y-3">
                    {galleryBatchItems.map((item, index) => (
                      <article key={item.id} className="rounded-lg border border-stone-200 p-3">
                        <div className="flex items-start gap-3">
                          {item.type === 'photo' ? (
                            <img
                              src={item.previewUrl}
                              alt={item.title}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                          ) : null}
                          {item.type === 'video' ? (
                            <video
                              src={item.previewUrl}
                              className="h-20 w-20 rounded-lg bg-black object-cover"
                              muted
                              playsInline
                            />
                          ) : null}
                          {item.type === 'audio' ? (
                            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-stone-100 text-xs font-medium text-stone-600">
                              Áudio
                            </div>
                          ) : null}
                          {item.type === 'document' ? (
                            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-stone-100 px-2 text-center text-xs font-medium text-stone-600">
                              Documento
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1 space-y-3">
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                              {galleryTypeLabel(item.type)} {index + 1}
                            </p>
                            <Input
                              label="Título"
                              value={item.title}
                              onChange={(value) => updateGalleryBatchItem(item.id, { title: value })}
                              required
                            />
                            <TextArea
                              label="Descrição"
                              value={item.description}
                              onChange={(value) => updateGalleryBatchItem(item.id, { description: value })}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <Check
                                label="Publicado"
                                checked={item.published}
                                onChange={(checked) => updateGalleryBatchItem(item.id, { published: checked })}
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryBatchItem(item.id)}
                                className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                              >
                                Remover desta lista
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-stone-300 px-3 py-4 text-sm text-stone-500">
                    Ainda não há ficheiros selecionados para o carregamento em massa.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white"
                    disabled={busy || galleryBatchItems.length === 0}
                  >
                    {backofficePrimaryActionLabel(busy, 'Guardar lote')}
                  </button>
                  <button
                    type="button"
                    onClick={clearGalleryBatchItems}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700"
                    disabled={busy || galleryBatchItems.length === 0}
                  >
                    Limpar lista
                  </button>
                </div>
              </form>

              <form ref={galleryIndividualFormRef} className={`${galleryEditingId ? 'order-1 ring-2 ring-[#0f4c36]/20' : 'order-2'} space-y-3 rounded-xl border border-stone-200 p-4`} onSubmit={(event) => void saveGalleryItem(event)}>
                <div>
                  <h3 className="text-base font-semibold text-[#0f4c36]">
                    {galleryEditingId ? 'Editar media individual' : 'Media individual'}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {galleryEditingId
                      ? `A editar "${galleryForm.title || 'media selecionado'}". Guarda as alterações ou limpa o formulário para criar outro item.`
                      : 'Continua disponível para criar ou editar um item específico da galeria.'}
                  </p>
                </div>

                <Input label="Título" value={galleryForm.title} onChange={(v) => setGalleryForm((c) => ({ ...c, title: v }))} required />
                <TextArea label="Descrição" value={galleryForm.description} onChange={(v) => setGalleryForm((c) => ({ ...c, description: v }))} />

                <label className="grid gap-1 text-sm text-stone-700">
                  Tipo
                  <select
                    value={galleryForm.type}
                    onChange={(event) => setGalleryForm((c) => ({ ...c, type: (event.target.value as GalleryMediaType) }))}
                    className="h-10 rounded-lg border border-stone-300 px-3"
                  >
                    {galleryAllowedTypes.map((type) => (
                      <option key={type} value={type}>{type === 'document' ? 'Documento/PDF' : galleryTypeLabel(type)}</option>
                    ))}
                  </select>
                </label>

                <Input label="Fonte URL (opcional)" value={galleryForm.sourceUrl} onChange={(v) => setGalleryForm((c) => ({ ...c, sourceUrl: v }))} />
                <FileInput
                  key={`source-${galleryFormResetKey}`}
                  label="Fonte ficheiro"
                  accept={galleryAcceptForType(galleryForm.type)}
                  onFile={(file) => setGalleryForm((c) => ({ ...c, sourceFile: file }))}
                />

                <Input label="Thumbnail URL (opcional)" value={galleryForm.thumbnailUrl} onChange={(v) => setGalleryForm((c) => ({ ...c, thumbnailUrl: v }))} />
                <FileInput key={`thumbnail-${galleryFormResetKey}`} label="Thumbnail ficheiro (opcional)" accept="image/*" onFile={(file) => setGalleryForm((c) => ({ ...c, thumbnailFile: file }))} />
                <Check label="Publicado" checked={galleryForm.published} onChange={(checked) => setGalleryForm((c) => ({ ...c, published: checked }))} />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button className="flex-1 rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
                    {backofficePrimaryActionLabel(busy, galleryEditingId ? 'Guardar alterações' : 'Criar media')}
                  </button>
                  {galleryEditingId ? (
                    <button
                      type="button"
                      onClick={resetGalleryForm}
                      className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700"
                      disabled={busy}
                    >
                      Cancelar edição
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeSection === 'admins' ? (
        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-[#0f4c36]">Gestão de utilizadores admin</h2>
            <p className="mt-1 text-sm text-stone-600">Controla quem pode aceder ao backoffice e com que papel.</p>

            {currentAdmin?.role === 'owner' ? (
              <>
                <form className="mt-5 grid gap-3" onSubmit={(event) => void createAdminUser(event)}>
                  <Input
                    label="Email"
                    type="email"
                    value={newAdminEmail}
                    onChange={setNewAdminEmail}
                    required
                  />
                  <SelectRole
                    label="Papel"
                    value={newAdminRole}
                    onChange={setNewAdminRole}
                  />
                  <label className="grid gap-2 text-sm text-stone-700">
                    Palavra-passe
                    <div className="flex rounded-lg border border-stone-300 p-1">
                      <button
                        type="button"
                        onClick={() => setNewAdminPasswordMode('generated')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm ${newAdminPasswordMode === 'generated' ? 'bg-[#0f4c36] text-white' : 'text-stone-700'}`}
                      >
                        Gerar automaticamente
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAdminPasswordMode('manual')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm ${newAdminPasswordMode === 'manual' ? 'bg-[#0f4c36] text-white' : 'text-stone-700'}`}
                      >
                        Definir manualmente
                      </button>
                    </div>
                  </label>
                  {newAdminPasswordMode === 'manual' ? (
                    <Input
                      label="Palavra-passe inicial"
                      type="text"
                      value={newAdminPassword}
                      onChange={setNewAdminPassword}
                      required
                    />
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      O sistema vai gerar uma palavra-passe segura aleatória e mostrá-la após a criação da conta.
                    </p>
                  )}
                  <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
                    {backofficePrimaryActionLabel(busy, 'Adicionar admin')}
                  </button>
                </form>

                {createdAdminPassword ? (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-900">Palavra-passe gerada</p>
                    <p className="mt-2 break-all rounded-md bg-white px-3 py-2 font-mono text-sm text-emerald-950">
                      {createdAdminPassword}
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyCreatedAdminPassword()}
                      className="mt-3 rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-900"
                    >
                      Copiar palavra-passe
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                Apenas utilizadores com papel owner podem criar novas contas administrativas.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-[#0f4c36]">Admins existentes</h2>

            <div className="mt-4 space-y-3">
              {isLoadingGovernance ? <AdminListSkeleton /> : null}
              {admins.map((admin) => (
                <article key={admin.id} className="rounded-lg border border-stone-200 p-3">
                  <p className="font-medium text-[#0f4c36]">{admin.email}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Papel: {admin.role} · Estado: {admin.active ? 'ativo' : 'inativo'}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Acessos: {admin.role === 'owner' ? 'Tudo' : admin.permissions.length ? admin.permissions.map((permission) => permissionLabel(permission)).join(', ') : 'Sem módulos atribuídos'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => openAdminDialog(admin)}
                    >
                      Permissões
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => void updateAdminUser(admin.email, { active: !admin.active })}
                    >
                      {admin.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
                      onClick={() => void deleteAdminUser(admin.email)}
                    >
                      Remover
                    </button>
                  </div>
                </article>
              ))}

              {!isLoadingGovernance && admins.length === 0 ? <p className="text-sm text-stone-500">Sem admins configurados.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      <Dialog
        open={isAdminDialogOpen}
        onOpenChange={(open) => {
          setIsAdminDialogOpen(open);
          if (!open) {
            setSelectedAdmin(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permissões do utilizador</DialogTitle>
            <DialogDescription>
              O super admin pode escolher exatamente quais módulos este utilizador pode gerir.
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
                <p className="font-medium text-[#0f4c36]">{selectedAdmin.email}</p>
                <p className="mt-1">Papel atual: {selectedAdmin.role}</p>
              </div>

              {selectedAdmin.role === 'owner' ? (
                <p className="text-sm text-stone-600">
                  Owners têm acesso total automaticamente.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ADMIN_PERMISSION_OPTIONS.map((permission) => (
                      <label key={permission.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-sm text-stone-700">
                        <input
                          type="checkbox"
                          checked={selectedAdminPermissions.includes(permission.id)}
                          onChange={() => toggleSelectedAdminPermission(permission.id)}
                        />
                        {permission.label}
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border px-3 py-2 text-xs"
                      onClick={() => setSelectedAdminPermissions(ADMIN_PERMISSION_OPTIONS.map((item) => item.id))}
                    >
                      Marcar tudo
                    </button>
                    <button
                      type="button"
                      className="rounded border px-3 py-2 text-xs"
                      onClick={() => setSelectedAdminPermissions([])}
                    >
                      Limpar tudo
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsAdminDialogOpen(false)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void saveSelectedAdminPermissions()}
              className="rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white"
              disabled={busy || !selectedAdmin || selectedAdmin.role === 'owner'}
            >
              {backofficePrimaryActionLabel(busy, 'Guardar permissões')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeSection === 'audit' ? (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#0f4c36]">Histórico de alterações</h2>
          <p className="mt-1 text-sm text-stone-600">
            Registo das alterações feitas no backoffice, com autor, ação e data. Os eventos com mais de 10 dias são apagados automaticamente para não encher a base de dados.
          </p>

          <div className="mt-4 space-y-3">
            {isLoadingGovernance ? <AuditListSkeleton /> : null}
            {auditLogs.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-stone-200 p-3">
                <p className="text-sm font-medium text-[#0f4c36]">{entry.summary}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(entry.createdAt).toLocaleString('pt-PT')} · {entry.actorEmail} ({entry.actorRole})
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {entry.action} · {entry.targetType}
                  {entry.targetId ? ` · ${entry.targetId}` : ''}
                </p>
              </article>
            ))}

            {!isLoadingGovernance && auditLogs.length === 0 ? <p className="text-sm text-stone-500">Sem eventos no histórico.</p> : null}
          </div>
        </section>
      ) : null}

      {activeSection === 'about' ? (
        <section className="mt-8 rounded-xl border border-[#cfe7bd] bg-[#f2faed] p-5">
          <h2 className="text-xl font-semibold text-[#0f4c36]">Editar página Sobre Nós</h2>
          <p className="mt-1 text-sm text-stone-600">Atualiza o conteúdo institucional publicado em /sobre-nos.</p>

          {isLoadingLayout ? (
            <div className="mt-5">
              <LayoutFormSkeleton />
            </div>
          ) : (
            <form className="mt-5 grid gap-5" onSubmit={(event) => void saveLayoutSettings(event)}>
              <div className={`grid gap-3 md:grid-cols-2 ${APPEARANCE_PANEL_CLASS}`}>
                <Input label="Hero · Título" value={layoutSettings.pages.sobre.title} onChange={(value) => updateAppearancePage('sobre', { title: value })} />
                <TextArea label="Hero · Subtítulo" value={layoutSettings.pages.sobre.description} onChange={(value) => updateAppearancePage('sobre', { description: value })} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}>
                  <Input label="Secção · Quem Somos" value={layoutSettings.aboutPage.whoWeAreTitle} onChange={(value) => updateAboutPage({ whoWeAreTitle: value })} />
                  <TextArea label="Parágrafos · Quem Somos" value={layoutSettings.aboutPage.whoWeAreParagraphs.join('\n')} onChange={(value) => updateAboutParagraphs('whoWeAreParagraphs', value)} />
                </div>
                <div className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}>
                  <Input label="Secção · Como Nasceu" value={layoutSettings.aboutPage.originTitle} onChange={(value) => updateAboutPage({ originTitle: value })} />
                  <TextArea label="Parágrafos · Como Nasceu" value={layoutSettings.aboutPage.originParagraphs.join('\n')} onChange={(value) => updateAboutParagraphs('originParagraphs', value)} />
                </div>
                <div className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}>
                  <Input label="Secção · Fundadores" value={layoutSettings.aboutPage.foundersTitle} onChange={(value) => updateAboutPage({ foundersTitle: value })} />
                  <TextArea label="Parágrafos · Fundadores" value={layoutSettings.aboutPage.foundersParagraphs.join('\n')} onChange={(value) => updateAboutParagraphs('foundersParagraphs', value)} />
                </div>
              </div>

              <div className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}>
                <Input label="Secção · Corpos Sociais" value={layoutSettings.aboutPage.socialBodiesTitle} onChange={(value) => updateAboutPage({ socialBodiesTitle: value })} />
                <TextArea
                  label="Corpos sociais · Uma linha para o grupo, depois membros com cargo: nome"
                  value={layoutSettings.aboutPage.socialBodies.map((group) => [group.title, ...group.members].join('\n')).join('\n\n')}
                  onChange={updateAboutSocialBodies}
                />
              </div>

              <div className={`grid gap-3 md:grid-cols-2 ${APPEARANCE_PANEL_CLASS}`}>
                <Input label="CTA contacto · Título" value={layoutSettings.aboutPage.contactTitle} onChange={(value) => updateAboutPage({ contactTitle: value })} />
                <TextArea label="CTA contacto · Descrição" value={layoutSettings.aboutPage.contactDescription} onChange={(value) => updateAboutPage({ contactDescription: value })} />
                <Input label="CTA contacto · Label da morada" value={layoutSettings.aboutPage.contactAddressLabel} onChange={(value) => updateAboutPage({ contactAddressLabel: value })} />
                <TextArea label="CTA contacto · Morada" value={layoutSettings.aboutPage.contactAddress} onChange={(value) => updateAboutPage({ contactAddress: value })} />
                <Input label="CTA contacto · Label do telefone" value={layoutSettings.aboutPage.contactPhoneLabel} onChange={(value) => updateAboutPage({ contactPhoneLabel: value })} />
                <Input label="CTA contacto · Telefone" value={layoutSettings.aboutPage.contactPhone} onChange={(value) => updateAboutPage({ contactPhone: value })} />
                <Input label="CTA contacto · Label do email" value={layoutSettings.aboutPage.contactEmailLabel} onChange={(value) => updateAboutPage({ contactEmailLabel: value })} />
                <Input label="CTA contacto · Email" type="email" value={layoutSettings.aboutPage.contactEmail} onChange={(value) => updateAboutPage({ contactEmail: value })} />
              </div>

              <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
                {backofficePrimaryActionLabel(busy, 'Publicar Alterações')}
              </button>
            </form>
          )}
        </section>
      ) : null}

      {activeSection === 'layout' ? (
        <section className="mt-8 rounded-xl border border-[#cfe7bd] bg-[#f2faed] p-5">
          <h2 className="text-xl font-semibold text-[#0f4c36]">Aparência</h2>
          <p className="mt-1 text-sm text-stone-600">Edita footer, textos de páginas e metadados públicos.</p>

          {isLoadingLayout ? (
            <div className="mt-5">
              <LayoutFormSkeleton />
            </div>
          ) : (
          <form className="mt-5 grid gap-6" onSubmit={(event) => void saveLayoutSettings(event)}>
            <div className="sticky top-4 z-10 rounded-xl border border-[#cfe7bd] bg-[#f8fcf4]/95 p-3 shadow-sm backdrop-blur">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Separadores da aparência">
                {APPEARANCE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={appearanceTab === tab.id}
                    onClick={() => setAppearanceTab(tab.id)}
                    className={appearanceTab === tab.id ? 'rounded-lg bg-[#0f4c36] px-3 py-2 text-sm text-white' : 'rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700'}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {appearanceTab === 'pages' ? (
            <>
            <AppearanceSectionTitle title="Conteúdo das Páginas" description="Edita títulos, descrições e mensagens públicas das páginas principais." />
            <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-2 md:grid-cols-2">
              {APPEARANCE_PAGE_FIELDS.map((page) => {
                const pageSettings = layoutSettings.pages[page.id];

                return (
                  <div key={page.id} className={`grid gap-3 ${APPEARANCE_PANEL_CLASS}`}>
                    <Input
                      label={`Página ${page.label} · Título`}
                      value={pageSettings.title}
                      onChange={(value) => updateAppearancePage(page.id, { title: value })}
                    />
                    <TextArea
                      label={`Página ${page.label} · Subtítulo`}
                      value={pageSettings.description}
                      onChange={(value) => updateAppearancePage(page.id, { description: value })}
                    />
                    {page.hasEmptyMessage ? (
                      <TextArea
                        label={`Página ${page.label} · Mensagem sem conteúdos`}
                        value={pageSettings.emptyMessage || ''}
                        onChange={(value) =>
                          updateAppearancePage(page.id, { emptyMessage: value } as Partial<(typeof pageSettings)>)
                        }
                      />
                    ) : null}
                    {page.id === 'contactos' ? (
                      <>
                        <Input
                          label="Página Contactos · Título das informações"
                          value={layoutSettings.pages.contactos.institutionalTitle}
                          onChange={(value) => updateAppearancePage('contactos', { institutionalTitle: value })}
                        />
                        <Input
                          label="Página Contactos · Label do presidente"
                          value={layoutSettings.pages.contactos.presidentLabel}
                          onChange={(value) => updateAppearancePage('contactos', { presidentLabel: value })}
                        />
                        <Input
                          label="Página Contactos · Nome do presidente"
                          value={layoutSettings.pages.contactos.presidentName}
                          onChange={(value) => updateAppearancePage('contactos', { presidentName: value })}
                        />
                        <Input
                          label="Página Contactos · Label do telefone"
                          value={layoutSettings.pages.contactos.phoneLabel}
                          onChange={(value) => updateAppearancePage('contactos', { phoneLabel: value })}
                        />
                        <Input
                          label="Página Contactos · Telefone"
                          value={layoutSettings.pages.contactos.phone}
                          onChange={(value) => updateAppearancePage('contactos', { phone: value })}
                        />
                        <Input
                          label="Página Contactos · Label do email"
                          value={layoutSettings.pages.contactos.emailLabel}
                          onChange={(value) => updateAppearancePage('contactos', { emailLabel: value })}
                        />
                        <Input
                          label="Página Contactos · Email"
                          value={layoutSettings.pages.contactos.email}
                          onChange={(value) => updateAppearancePage('contactos', { email: value })}
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
            </>
            ) : null}

            {appearanceTab === 'footer' ? (
            <>
            <AppearanceSectionTitle title="Footer" description="Edita apenas os campos que aparecem no footer público: contactos, redes sociais, navegação, sócio e rodapé legal." />

            <div className={APPEARANCE_PANEL_CLASS}>
              <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Contactos</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="Footer · Morada" value={layoutSettings.footer.contactInfo.address} onChange={(v) => updateFooterContact({ address: v })} />
                <Input label="Footer · Código postal" value={layoutSettings.footer.contactInfo.postalCode} onChange={(v) => updateFooterContact({ postalCode: v })} />
                <Input label="Footer · Localidade" value={layoutSettings.footer.contactInfo.city} onChange={(v) => updateFooterContact({ city: v })} />
                <Input label="Footer · Telefone" value={layoutSettings.footer.contactInfo.phone} onChange={(v) => updateFooterContact({ phone: v })} />
                <Input label="Footer · Email" type="email" value={layoutSettings.footer.contactInfo.email} onChange={(v) => updateFooterContact({ email: v })} />
              </div>
            </div>

            <div className={APPEARANCE_PANEL_CLASS}>
              <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Redes sociais</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="Título da secção" value={layoutSettings.footer.socialTitle} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, socialTitle: v } }))} />
                <Input label="Facebook" value={layoutSettings.footer.contactInfo.socialMedia.facebook || ''} onChange={(v) => updateFooterSocialMedia('facebook', v)} />
                <Input label="Instagram" value={layoutSettings.footer.contactInfo.socialMedia.instagram || ''} onChange={(v) => updateFooterSocialMedia('instagram', v)} />
                <Input label="LinkedIn" value={layoutSettings.footer.contactInfo.socialMedia.linkedin || ''} onChange={(v) => updateFooterSocialMedia('linkedin', v)} />
                <Input label="YouTube" value={layoutSettings.footer.contactInfo.socialMedia.youtube || ''} onChange={(v) => updateFooterSocialMedia('youtube', v)} />
              </div>
            </div>

            <div className={APPEARANCE_PANEL_CLASS}>
              <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Navegação visível</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                A coluna CEISCaramulo em ação é fixa no frontend e mostra Atividades e Notícias. A coluna de iniciativas pode ser ajustada abaixo.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm text-stone-600">
                  <p className="font-semibold text-[#0f4c36]">CEISCaramulo em ação</p>
                  <ul className="mt-3 grid gap-2">
                    <li>Atividades · /atividades</li>
                    <li>Notícias · /noticias</li>
                  </ul>
                </div>
                {layoutSettings.footer.columns
                  .map((column, columnIndex) => ({ column, columnIndex }))
                  .filter(
                    ({ column, columnIndex }) =>
                      columnIndex > 0 &&
                      !column.title.toLowerCase().includes('restrita') &&
                      column.links.some((link) => !link.href.startsWith('/backoffice'))
                  )
                  .map(({ column, columnIndex }) => (
                    <div key={`${column.title}-${columnIndex}`} className="rounded-lg border border-stone-100 p-3">
                      <Input label="Título da coluna" value={column.title} onChange={(value) => setLayoutSettings((current) => {
                        const columns = [...current.footer.columns];
                        columns[columnIndex] = { ...columns[columnIndex], title: value };
                        return { ...current, footer: { ...current.footer, columns } };
                      })} />
                      {column.links.map((link, linkIndex) => (
                        <div key={`${link.href}-${linkIndex}`} className="mt-3 grid gap-2 rounded border border-stone-100 p-2">
                          <Input label="Texto do link" value={link.label} onChange={(value) => setLayoutSettings((current) => {
                            const columns = [...current.footer.columns];
                            const links = [...columns[columnIndex].links];
                            links[linkIndex] = { ...links[linkIndex], label: value };
                            columns[columnIndex] = { ...columns[columnIndex], links };
                            return { ...current, footer: { ...current.footer, columns } };
                          })} />
                          <Input label="URL do link" value={link.href} onChange={(value) => setLayoutSettings((current) => {
                            const columns = [...current.footer.columns];
                            const links = [...columns[columnIndex].links];
                            links[linkIndex] = { ...links[linkIndex], href: value };
                            columns[columnIndex] = { ...columns[columnIndex], links };
                            return { ...current, footer: { ...current.footer, columns } };
                          })} />
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={APPEARANCE_PANEL_CLASS}>
                <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Tornar-se sócio</h3>
                <div className="mt-3 grid gap-3">
                  <Input label="Título" value={layoutSettings.footer.membership.title} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, title: value } } }))} />
                  <TextArea label="Descrição" value={layoutSettings.footer.membership.description} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, description: value } } }))} />
                  <Input label="Texto do botão" value={layoutSettings.footer.membership.ctaLabel} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, ctaLabel: value } } }))} />
                  <Input label="Link do botão" value={layoutSettings.footer.membership.ctaHref} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, ctaHref: value } } }))} />
                </div>
              </div>
              <div className={APPEARANCE_PANEL_CLASS}>
                <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Rodapé legal</h3>
                <div className="mt-3 grid gap-3">
                  <Input label="Copyright" value={layoutSettings.footer.copyrightLine} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, copyrightLine: v } }))} />
                  <Input label="Linha legal" value={layoutSettings.footer.legalLine} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, legalLine: v } }))} />
                </div>
              </div>
            </div>
            </>
            ) : null}

            {appearanceTab === 'icons' ? (
            <>
            <AppearanceSectionTitle title="Ícones e Elementos Visuais" description="Seleciona ícones através de preview visual e reorganiza cartões quando aplicável." />
            <div className="grid gap-4 md:grid-cols-2">
              {layoutSettings.home.explore.links.slice(0, 6).map((link, index) => (
                <div key={`${link.href}-${index}`} className={APPEARANCE_PANEL_CLASS}>
                  <div className="mb-3 flex gap-2">
                    <button type="button" onClick={() => moveExploreLink(index, -1)} className="rounded border px-2 py-1 text-xs" disabled={index === 0}>Subir</button>
                    <button type="button" onClick={() => moveExploreLink(index, 1)} className="rounded border px-2 py-1 text-xs" disabled={index === layoutSettings.home.explore.links.length - 1}>Descer</button>
                  </div>
                  <Input label={`Explore ${index + 1} · Título`} value={link.title} onChange={(v) => setLayoutSettings((c) => {
                    const links = [...c.home.explore.links];
                    links[index] = { ...links[index], title: v };
                    return { ...c, home: { ...c.home, explore: { ...c.home.explore, links } } };
                  })} />
                  <Input label={`Explore ${index + 1} · Descrição`} value={link.description} onChange={(v) => setLayoutSettings((c) => {
                    const links = [...c.home.explore.links];
                    links[index] = { ...links[index], description: v };
                    return { ...c, home: { ...c.home, explore: { ...c.home.explore, links } } };
                  })} />
                  <IconPicker label={`Explore ${index + 1} · Ícone`} value={link.icon} onChange={(v) => setLayoutSettings((c) => {
                    const links = [...c.home.explore.links];
                    links[index] = { ...links[index], icon: v };
                    return { ...c, home: { ...c.home, explore: { ...c.home.explore, links } } };
                  })} />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {layoutSettings.serra.sections.map((section, index) => (
                <div key={section.id} className={APPEARANCE_PANEL_CLASS}>
                  <Input label={`Serra ${index + 1} · Título`} value={section.title} onChange={(v) => setLayoutSettings((c) => {
                    const sections = [...c.serra.sections];
                    sections[index] = { ...sections[index], title: v };
                    return { ...c, serra: { ...c.serra, sections } };
                  })} />
                  <IconPicker label={`Serra ${index + 1} · Ícone`} value={section.icon} onChange={(v) => setLayoutSettings((c) => {
                    const sections = [...c.serra.sections];
                    sections[index] = { ...sections[index], icon: v };
                    return { ...c, serra: { ...c.serra, sections } };
                  })} />
                </div>
              ))}
            </div>
            </>
            ) : null}

            {appearanceTab === 'colors' ? (
            <>
            <AppearanceSectionTitle title="Cores e Identidade Visual" description="Define as cores base que alimentam as variáveis visuais globais do website." />
            <div className={`grid gap-3 md:grid-cols-2 ${APPEARANCE_PANEL_CLASS}`}>
              {Object.entries(layoutSettings.visualIdentity.colors).map(([key, value]) => (
                <Input key={key} type="color" label={`Cor · ${key}`} value={value} onChange={(next) => updateVisualColor(key as keyof SiteLayoutSettings['visualIdentity']['colors'], next)} />
              ))}
            </div>
            </>
            ) : null}

            {appearanceTab === 'logos' ? (
            <>
            <AppearanceSectionTitle title="Logótipos" description="Regista os logótipos institucionais usados pelo website e materiais públicos." />
            <div className={`grid gap-3 md:grid-cols-2 ${APPEARANCE_PANEL_CLASS}`}>
              <Input label="Logótipo principal" value={layoutSettings.visualIdentity.logos.primary} onChange={(v) => updateLogo('primary', v)} />
              <Input label="Logótipo do footer" value={layoutSettings.visualIdentity.logos.footer} onChange={(v) => updateLogo('footer', v)} />
              <Input label="Logótipo institucional" value={layoutSettings.visualIdentity.logos.institutional} onChange={(v) => updateLogo('institutional', v)} />
            </div>
            </>
            ) : null}

            {appearanceTab === 'seo' ? (
            <>
            <AppearanceSectionTitle title="SEO e Metadados" description="Campos centrais para título, descrição, palavras-chave e imagem social." />
            <div className={APPEARANCE_PANEL_CLASS}>
              <div className="grid gap-3">
                <Input label="SEO · Título" value={layoutSettings.seo.title} onChange={(v) => updateSeo({ title: v })} />
                <TextArea label="SEO · Descrição" value={layoutSettings.seo.description} onChange={(v) => updateSeo({ description: v })} />
                <TextArea label="SEO · Palavras-chave" value={layoutSettings.seo.keywords} onChange={(v) => updateSeo({ keywords: v })} />
                <Input label="SEO · Imagem Open Graph" value={layoutSettings.seo.ogImage} onChange={(v) => updateSeo({ ogImage: v })} />
              </div>
            </div>
            </>
            ) : null}

            <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
              {backofficePrimaryActionLabel(busy, 'Publicar Alterações')}
            </button>
          </form>
          )}
        </section>
      ) : null}
        </div>
      </div>
    </main>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm text-stone-700">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24 rounded-lg border border-stone-300 px-3 py-2" />
    </label>
  );
}

function AppearanceSectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-stone-200 pb-3">
      <h3 className="text-lg font-semibold text-[#0f4c36]">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{description}</p>
    </div>
  );
}

function IconPicker({ label, value, onChange }: { label: string; value: LayoutIconName; onChange: (value: LayoutIconName) => void }) {
  return (
    <label className="grid gap-2 text-sm text-stone-700">
      {label}
      <div className="grid grid-cols-4 gap-2 rounded-lg border border-stone-300 p-2">
        {Object.entries(layoutIconMap).map(([name, Icon]) => {
          const iconName = name as LayoutIconName;
          const selected = value === iconName;

          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(iconName)}
              className={selected ? 'rounded-md border border-[#0f4c36] bg-[#eef4ec] p-2 text-[#0f4c36]' : 'rounded-md border border-stone-200 p-2 text-stone-600'}
              aria-label={name}
            >
              <Icon className="mx-auto h-4 w-4" />
              <span className="mt-1 block text-[10px]">{name}</span>
            </button>
          );
        })}
      </div>
    </label>
  );
}

function SelectRole({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AdminRole;
  onChange: (value: AdminRole) => void;
}) {
  return (
    <label className="grid gap-1 text-sm text-stone-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange((event.target.value === 'owner' ? 'owner' : 'editor') as AdminRole)}
        className="h-10 rounded-lg border border-stone-300 px-3"
      >
        <option value="editor">editor</option>
        <option value="owner">owner</option>
      </select>
    </label>
  );
}

function permissionLabel(permission: AdminPermission) {
  const found = ADMIN_PERMISSION_OPTIONS.find((item) => item.id === permission);
  return found?.label || permission;
}

function sidebarNavClass(active: boolean, collapsed: boolean) {
  return cn(
    'flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors',
    collapsed && 'justify-center px-2',
    active
      ? 'bg-[#0f4c36] font-medium text-white [&_span:first-child]:bg-white/15 [&_span:first-child]:text-white'
      : 'text-stone-700 hover:bg-stone-100'
  );
}

function OperationProgressNotice({ progress }: { progress: UploadProgress }) {
  const percent = clampProgress(progress.percent);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{progress.label}</p>
          {progress.detail ? <p className="mt-1 text-emerald-800">{progress.detail}</p> : null}
        </div>
        <span className="font-semibold tabular-nums">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-[#0f4c36] transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Card({ title, value, loading = false }: { title: string; value: number | undefined; loading?: boolean }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{title}</p>
      {loading ? <Skeleton className="mt-3 h-9 w-20" /> : <p className="mt-2 text-3xl font-semibold text-[#0f4c36]">{value ?? '—'}</p>}
    </article>
  );
}

function SectionLayout({
  title,
  description,
  newButtonLabel = 'Novo',
  list,
  form,
  onEdit,
  onDelete,
  onNew,
  busy,
  loading = false,
}: {
  title: string;
  description?: string;
  newButtonLabel?: string;
  list: Array<{ id: string; title?: string }>;
  form: React.ReactNode;
  onEdit: (item: { id: string; title?: string }) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  busy: boolean;
  loading?: boolean;
}) {
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  function handleNewClick() {
    onNew();
    window.requestAnimationFrame(() => {
      formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0f4c36]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
          </div>
          <button type="button" onClick={handleNewClick} disabled={busy} className="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-50">
            {newButtonLabel}
          </button>
        </div>
        <div className="space-y-3">
          {loading ? <SectionListSkeleton /> : null}
          {list.map((item) => (
            <article key={item.id} className="rounded-lg border border-stone-200 p-3">
              <p className="font-medium text-[#0f4c36]">{item.title || item.id}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => onEdit(item)} disabled={busy} className="rounded border px-2 py-1 text-xs disabled:opacity-50">
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={busy}
                  className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
                >
                  Apagar
                </button>
              </div>
            </article>
          ))}
          {!loading && list.length === 0 ? <p className="text-sm text-stone-500">Sem registos.</p> : null}
        </div>
      </div>
      <div ref={formContainerRef} className="rounded-xl border border-stone-200 bg-white p-5 opacity-100">
        <div className={busy ? 'pointer-events-none opacity-70' : ''} aria-busy={busy}>
          {form}
        </div>
      </div>
    </section>
  );
}

function GalleryGroup({
  title,
  type,
  items,
  selectedIds,
  busy,
  onToggleTypeSelection,
  onToggleSelection,
  onEdit,
  onDelete,
  onDeleteSelected,
}: {
  title: string;
  type: GalleryMediaType;
  items: GalleryMediaItem[];
  selectedIds: string[];
  busy: boolean;
  onToggleTypeSelection: (type: GalleryMediaType, checked: boolean) => void;
  onToggleSelection: (id: string, checked: boolean) => void;
  onEdit: (item: GalleryMediaItem) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const selectedCount = items.filter((item) => selectedIds.includes(item.id)).length;

  return (
    <section className="rounded-xl border border-stone-200 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#0f4c36]">{title}</h3>
          <p className="text-sm text-stone-500">{items.length} item(ns)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Check
            label="Selecionar todos"
            checked={allSelected}
            onChange={(checked) => onToggleTypeSelection(type, checked)}
          />
          <button
            type="button"
            onClick={onDeleteSelected}
            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"
            disabled={busy || selectedCount === 0}
          >
            Eliminar selecionados
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 px-3 py-4 text-sm text-stone-500">
          Sem {title.toLowerCase()} na galeria.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-stone-200 p-3">
              <div className="flex items-start gap-3">
                <Check
                  label=""
                  checked={selectedIds.includes(item.id)}
                  onChange={(checked) => onToggleSelection(item.id, checked)}
                />
                <GalleryItemPreview item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#0f4c36]">{item.title || item.id}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {item.published ? 'Publicado' : 'Rascunho'} · {new Date(item.updatedAt).toLocaleDateString('pt-PT')}
                      </p>
                      {item.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => onEdit(item)} disabled={busy} className="rounded border px-2 py-1 text-xs disabled:opacity-50">
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        disabled={busy}
                        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GalleryItemPreview({ item }: { item: GalleryMediaItem }) {
  if (!item.source && !item.thumbnail) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-stone-100 px-2 text-center text-xs text-stone-500">
        Sem origem
      </div>
    );
  }

  if (item.type === 'photo') {
    const previewSource = item.thumbnail || item.source || '/placeholder.svg';

    if (!previewSource.startsWith('/')) {
      return <img src={previewSource} alt={item.title} loading="lazy" decoding="async" className="h-24 w-24 rounded-lg object-cover" />;
    }

    return (
      <Image
        src={previewSource}
        alt={item.title}
        width={96}
        height={96}
        sizes="96px"
        className="h-24 w-24 rounded-lg object-cover"
      />
    );
  }

  if (item.type === 'video') {
    if (!item.source) {
      return (
        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-stone-900 px-2 text-center text-xs text-white">
          Sem vídeo
        </div>
      );
    }

    return (
      <video
        src={item.source}
        poster={item.thumbnail || undefined}
        className="h-24 w-24 rounded-lg bg-black object-cover"
        muted
        playsInline
        preload="none"
        controls
      />
    );
  }

  if (item.type === 'document') {
    return (
      <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg bg-stone-100 p-3">
        <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Documento</div>
        {item.source ? (
          <a href={item.source} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#0f4c36] underline">
            Abrir ficheiro
          </a>
        ) : (
          <p className="text-sm text-stone-500">Sem ficheiro associado.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg bg-stone-100 p-3">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Preview áudio</div>
      {item.source ? <audio controls preload="none" className="w-full" src={item.source} /> : <p className="text-sm text-stone-500">Sem áudio associado.</p>}
    </div>
  );
}

function Input({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-sm text-stone-700">
      {label}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-stone-300 px-3" />
    </label>
  );
}

function FileInput({ label, onFile, accept = WEB_IMAGE_ACCEPT }: { label: string; onFile: (file: File | null) => void; accept?: string }) {
  return (
    <label className="grid gap-1 text-sm text-stone-700">
      {label}
      <input type="file" accept={accept} onChange={(event) => onFile(event.target.files?.[0] || null)} className="block w-full text-sm" />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-stone-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function SectionListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-stone-200 p-3">
          <Skeleton className="h-5 w-2/3" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      ))}
    </>
  );
}

function MessageListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="rounded-2xl border border-stone-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[220px] flex-1 space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-24 w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        </article>
      ))}
    </>
  );
}

function GalleryGroupSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-stone-200 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[#0f4c36]">{title}</h3>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <article key={index} className="rounded-lg border border-stone-200 p-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminListSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="rounded-lg border border-stone-200 p-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
        </article>
      ))}
    </>
  );
}

function AuditListSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="rounded-lg border border-stone-200 p-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </article>
      ))}
    </>
  );
}

function LayoutFormSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-stone-200 p-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-10 w-full" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
