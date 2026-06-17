'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AUTH0_ADMIN_LOGOUT_PATH, adminAuthClient, getAdminAccessToken, getStoredAdminSession, isExportAdminAuthMode } from '@/lib/admin-auth';
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
import { MAX_INLINE_AUDIO_UPLOAD_BYTES, getInlineAudioUploadErrorMessage } from '@/lib/gallery-upload';
import { cn } from '@/lib/utils';
import type {
  Activity,
  AdminPermission,
  AdminRole,
  AdminUser,
  AuditLogEntry,
  ContactMessage,
  ContentSection,
  FooterContactSettings,
  GalleryMediaItem,
  GalleryMediaType,
  LayoutIconName,
  NewsArticle,
  Project,
  Publication,
  SiteLayoutSettings,
} from '@/types';

type ProgrammeGallerySectionId =
  | 'gallery-oficina-do-burel'
  | 'gallery-pon-do-jueus'
  | 'gallery-escola-dos-nossos-avos'
  | 'gallery-biblioteca-jrs'
  | 'gallery-oficinas-de-formacao'
  | 'gallery-publicacoes'
  | 'gallery-biblioteca';
type GallerySectionId = 'gallery' | ProgrammeGallerySectionId;
type SectionId = 'overview' | 'profile' | 'about' | 'admins' | 'audit' | 'layout' | 'contacts' | ContentSection | GallerySectionId;
type AppearanceTab = 'hero' | 'pages' | 'footer' | 'icons' | 'colors' | 'logos' | 'seo';
type AppearancePageKey = keyof SiteLayoutSettings['pages'];
type DashboardStats = {
  news: number;
  activities: number;
  projects: number;
  publications: number;
  contacts: number;
};

const ADMIN_PERMISSION_OPTIONS: Array<{ id: AdminPermission; label: string }> = [
  { id: 'news', label: 'Notícias' },
  { id: 'activities', label: 'Atividades' },
  { id: 'projects', label: 'Projetos' },
  { id: 'publications', label: 'Recursos' },
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
  { id: 'projects', label: 'Projetos' },
  { id: 'publications', label: 'Recursos' },
  { id: 'gallery-oficina-do-burel', label: 'Oficina do Burel' },
  { id: 'gallery-biblioteca-jrs', label: 'Biblioteca JRS' },
  { id: 'gallery-pon-do-jueus', label: 'PON do Jueus' },
  { id: 'gallery-escola-dos-nossos-avos', label: 'Escola dos Nossos Avós' },
  { id: 'gallery-oficinas-de-formacao', label: 'Oficinas de formação' },
  { id: 'gallery-publicacoes', label: 'Publicações' },
  { id: 'layout', label: 'Aparência' },
  { id: 'admins', label: 'Admins' },
  { id: 'contacts', label: 'Mensagens' },
  { id: 'audit', label: 'Histórico' },
];

const APPEARANCE_TABS: Array<{ id: AppearanceTab; label: string }> = [
  { id: 'hero', label: 'Hero' },
  { id: 'pages', label: 'Páginas' },
  { id: 'footer', label: 'Footer' },
  { id: 'seo', label: 'SEO e Metadados' },
];

const APPEARANCE_PAGE_FIELDS: Array<{ id: AppearancePageKey; label: string; hasEmptyMessage?: boolean }> = [
  { id: 'atividades', label: 'Atividades', hasEmptyMessage: true },
  { id: 'biblioteca', label: 'Recursos', hasEmptyMessage: true },
  { id: 'bibliotecaJrs', label: 'Biblioteca JRS' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'escolaDosNossosAvos', label: 'Escola dos Nossos Avós' },
  { id: 'galeria', label: 'Galeria' },
  { id: 'noticias', label: 'Notícias', hasEmptyMessage: true },
  { id: 'oficinaDoBurel', label: 'Oficina do Burel' },
  { id: 'oficinasDeFormacao', label: 'Oficinas de formação' },
  { id: 'ponDoJueus', label: 'PON do Jueus' },
  { id: 'projetos', label: 'Projetos', hasEmptyMessage: true },
  { id: 'publicacoes', label: 'Publicações' },
  { id: 'serra', label: 'Serra do Caramulo' },
  { id: 'sobre', label: 'Sobre Nós' },
];

const PROGRAMME_GALLERY_SECTIONS: Record<ProgrammeGallerySectionId, { label: string; context: string; description: string }> = {
  'gallery-oficina-do-burel': {
    label: 'Oficina do Burel',
    context: 'oficina-do-burel',
    description: 'PDFs, vídeos e outros media associados à página Oficina do Burel.',
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

function galleryTypeLabel(type: GalleryMediaType) {
  if (type === 'photo') return 'Foto';
  if (type === 'video') return 'Vídeo';
  if (type === 'audio') return 'Áudio';
  return 'Documento';
}

function galleryAcceptForType(type: GalleryMediaType) {
  if (type === 'photo') return 'image/*';
  if (type === 'video') return 'video/*';
  if (type === 'audio') return 'audio/*';
  return 'application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
}

function isProgrammeGallerySection(value: SectionId): value is ProgrammeGallerySectionId {
  return value in PROGRAMME_GALLERY_SECTIONS;
}

export default function BackofficePage() {
  const router = useRouter();
  const exportAuthMode = isExportAdminAuthMode();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [appearanceTab, setAppearanceTab] = useState<AppearanceTab>('hero');
  const [busy, setBusy] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoadingDashboardStats, setIsLoadingDashboardStats] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isLoadingGovernance, setIsLoadingGovernance] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettings>(defaultSiteLayoutSettings);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ email: string; role: AdminRole; permissions: AdminPermission[] } | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
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
  const [activityForm, setActivityForm] = useState({ title: '', description: '', date: '', endDate: '', location: '', published: true, imageFile: null as File | null, removeImage: false });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', status: 'planeado', startDate: '', endDate: '', partners: '', published: true, imageFile: null as File | null, removeImage: false });
  const [publicationForm, setPublicationForm] = useState({ title: '', author: '', year: String(new Date().getFullYear()), type: 'documento', description: '', downloadUrl: '', documentFile: null as File | null, published: true, coverImageFile: null as File | null, removeImage: false });
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

  const stats = useMemo(
    () => ({
      news: isLoadingContent && dashboardStats ? dashboardStats.news : news.length,
      activities: isLoadingContent && dashboardStats ? dashboardStats.activities : activities.length,
      projects: isLoadingContent && dashboardStats ? dashboardStats.projects : projects.length,
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
      projects.length,
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
  const availableSections = useMemo(() => {
    if (!currentAdmin) {
      return [] as SectionId[];
    }

    const sections: SectionId[] = ['overview', 'profile'];

    if (exportAuthMode) {
      return sections;
    }
    const permissionSet = new Set(currentAdmin.permissions);

    for (const section of ['news', 'activities', 'projects', 'publications'] as ContentSection[]) {
      if (currentAdmin.role === 'owner' || permissionSet.has(section)) {
        sections.push(section);
      }
    }

    if (currentAdmin.role === 'owner' || permissionSet.has('contacts')) sections.push('contacts');
    if (currentAdmin.role === 'owner' || permissionSet.has('gallery')) {
      sections.push(...(Object.keys(PROGRAMME_GALLERY_SECTIONS) as ProgrammeGallerySectionId[]));
    }
    if (currentAdmin.role === 'owner' || permissionSet.has('admins')) sections.push('admins');
    if (currentAdmin.role === 'owner' || permissionSet.has('audit')) sections.push('audit');
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
    const response = await fetch(`/api/${section}?scope=admin`, { headers });
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
    async (section: ContentSection, file: File, kind: 'image' | 'audio' | 'video') => {
      const fd = new FormData();
      fd.append('section', section);
      fd.append('kind', kind);
      fd.append('file', file);

      const payload = await fetchAdminEndpoint<{ url: string }>('/api/content-assets/rich-text', {
        method: 'POST',
        body: fd,
      });

      if (!payload.url) {
        throw new Error('Não foi possível guardar o ficheiro.');
      }

      return payload.url;
    },
    [fetchAdminEndpoint]
  );

  const refreshDashboardStats = useCallback(async () => {
    setIsLoadingDashboardStats(true);
    const data = await fetchAdminEndpoint<DashboardStats>('/api/admin/stats').catch(() => null);
    setDashboardStats(data);
    setIsLoadingDashboardStats(false);
  }, [fetchAdminEndpoint]);

  const refreshAll = useCallback(async () => {
    setIsLoadingContent(true);
    const safeFetchSection = async <T,>(section: ContentSection) => {
      try {
        return await fetchAdminCollection<T>(section);
      } catch {
        return [] as T[];
      }
    };

    const [newsData, activitiesData, projectsData, publicationsData] = await Promise.all([
      safeFetchSection<NewsArticle>('news'),
      safeFetchSection<Activity>('activities'),
      safeFetchSection<Project>('projects'),
      safeFetchSection<Publication>('publications'),
    ]);

    setNews(newsData);
    setActivities(activitiesData);
    setProjects(projectsData);
    setPublications(publicationsData);
    setIsLoadingContent(false);
  }, [fetchAdminCollection]);

  const refreshGovernance = useCallback(async () => {
    setIsLoadingGovernance(true);
    const [adminsData, auditData] = await Promise.all([
      fetchAdminEndpoint<AdminUser[]>('/api/admin/users').catch(() => []),
      fetchAdminEndpoint<AuditLogEntry[]>('/api/admin/audit').catch(() => []),
    ]);

    setAdmins(adminsData);
    setAuditLogs(auditData);
    setIsLoadingGovernance(false);
  }, [fetchAdminEndpoint]);

  const refreshContactMessages = useCallback(async () => {
    setIsLoadingContacts(true);
    const data = await fetchAdminEndpoint<ContactMessage[]>('/api/admin/contact-messages').catch(() => []);
    setContactMessages(data);
    setIsLoadingContacts(false);
  }, [fetchAdminEndpoint]);

  const refreshLayout = useCallback(async () => {
    setIsLoadingLayout(true);
    const data = await fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout').catch(() => defaultSiteLayoutSettings);
    setLayoutSettings(data);
    setIsLoadingLayout(false);
  }, [fetchAdminEndpoint]);

  const refreshGallery = useCallback(async () => {
    setIsLoadingGallery(true);
    const galleryContext = activeGalleryConfig?.context || 'global';
    const data = await fetchAdminEndpoint<GalleryMediaItem[]>(`/api/gallery?scope=admin&context=${encodeURIComponent(galleryContext)}`).catch(() => []);
    setGalleryItems(data);
    setSelectedGalleryIds([]);
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
      await refreshContactMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar a mensagem.');
    } finally {
      setBusy(false);
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

    if (['news', 'activities', 'projects', 'publications'].includes(activeSection)) {
      void refreshAll();
      return;
    }

    if (activeSection === 'contacts') {
      void refreshContactMessages();
      return;
    }

    if (activeSection === 'admins' || activeSection === 'audit') {
      void refreshGovernance();
      return;
    }

    if (activeSection === 'layout' || activeSection === 'about') {
      void refreshLayout();
      return;
    }

    if (activeGalleryConfig) {
      void refreshGallery();
    }
  }, [
    activeGalleryConfig,
    activeSection,
    exportAuthMode,
    refreshAll,
    refreshContactMessages,
    refreshGallery,
    refreshGovernance,
    refreshLayout,
  ]);

  async function saveLayoutSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      if (heroImageFile) {
        const fd = new FormData();
        fd.append('settings', JSON.stringify(layoutSettings));
        fd.append('heroImage', heroImageFile);
        await fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout', {
          method: 'PUT',
          body: fd,
        });
      } else {
        await fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout', {
          method: 'PUT',
          body: JSON.stringify(layoutSettings),
        });
      }

      toast.success('Layout atualizado com sucesso.');
      setHeroImageFile(null);
      await refreshLayout();
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
    if (activeSection === 'activities') setActivityForm({ title: '', description: '', date: '', endDate: '', location: '', published: true, imageFile: null, removeImage: false });
    if (activeSection === 'projects') setProjectForm({ title: '', description: '', status: 'planeado', startDate: '', endDate: '', partners: '', published: true, imageFile: null, removeImage: false });
    if (activeSection === 'publications') setPublicationForm({ title: '', author: '', year: String(new Date().getFullYear()), type: 'documento', description: '', downloadUrl: '', documentFile: null, published: true, coverImageFile: null, removeImage: false });
  }

  async function saveSection(section: ContentSection, formData: FormData) {
    setBusy(true);
    try {
      const headers = await authHeaders();
      const endpoint = editingId ? `/api/${section}/${editingId}` : `/api/${section}`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, { method, headers, body: formData });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload?.message || 'Erro ao guardar registo.');

      toast.success(editingId ? 'Registo atualizado com sucesso.' : 'Registo criado com sucesso.');
      resetCurrentForm();
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao guardar registo.');
    } finally {
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
      await refreshAll();
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

    const acceptsFile = (file: File) => {
      if (galleryBatchType === 'photo') return file.type.startsWith('image/');
      if (galleryBatchType === 'video') return file.type.startsWith('video/');
      if (galleryBatchType === 'audio') return file.type.startsWith('audio/');
      return Boolean(file.type === 'application/pdf' || file.name.match(/\.(pdf|docx?|xlsx?|pptx?|txt)$/i));
    };

    const rejectedLargeAudio = Array.from(files).some(
      (file) => galleryBatchType === 'audio' && file.type.startsWith('audio/') && file.size > MAX_INLINE_AUDIO_UPLOAD_BYTES
    );

    if (rejectedLargeAudio) {
      toast.error(getInlineAudioUploadErrorMessage());
      return;
    }

    const nextItems = Array.from(files)
      .filter(acceptsFile)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        type: galleryBatchType,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Sem título',
        description: '',
        published: true,
      }));

    if (nextItems.length === 0) {
      if (galleryBatchType === 'document') {
        toast.error('Seleciona apenas PDFs ou documentos para este carregamento em massa.');
        return;
      }

      toast.error(
        galleryBatchType === 'photo'
          ? 'Seleciona apenas ficheiros de imagem para este carregamento em massa.'
          : galleryBatchType === 'video'
            ? 'Seleciona apenas ficheiros de vídeo para este carregamento em massa.'
            : 'Seleciona apenas ficheiros de áudio para este carregamento em massa.'
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
    setGalleryForm({
      title: item.title,
      description: item.description || '',
      type: item.type,
      sourceUrl: item.source.startsWith('data:') ? '' : item.source,
      sourceFile: null,
      thumbnailUrl: item.thumbnail && !item.thumbnail.startsWith('data:') ? item.thumbnail : '',
      thumbnailFile: null,
      published: item.published,
    });
  }

  async function saveGalleryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const fd = new FormData();
      fd.append('context', activeGalleryConfig?.context || 'global');
      fd.append('title', galleryForm.title);
      fd.append('description', galleryForm.description);
      fd.append('type', galleryForm.type);
      fd.append('sourceUrl', galleryForm.sourceUrl);
      fd.append('thumbnailUrl', galleryForm.thumbnailUrl);
      fd.append('published', String(galleryForm.published));
      if (galleryForm.sourceFile) fd.append('sourceFile', galleryForm.sourceFile);
      if (galleryForm.thumbnailFile) fd.append('thumbnailFile', galleryForm.thumbnailFile);

      await fetchAdminEndpoint<GalleryMediaItem>(
        galleryEditingId ? `/api/gallery/${galleryEditingId}` : '/api/gallery',
        {
          method: galleryEditingId ? 'PUT' : 'POST',
          body: fd,
        }
      );

      toast.success(galleryEditingId ? 'Media atualizado com sucesso.' : 'Media criado com sucesso.');
      resetGalleryForm();
      await refreshGallery();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao guardar media da galeria.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteGalleryItem(id: string) {
    if (!window.confirm('Tens a certeza de que queres eliminar este media da galeria?')) return;

    setBusy(true);
    try {
      await fetchAdminEndpoint<null>(`/api/gallery/${id}`, { method: 'DELETE' });
      toast.success('Media removido com sucesso.');
      await refreshGallery();
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
      await refreshGallery();
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
      const uploadOne = (item: (typeof galleryBatchItems)[number]) => {
        const fd = new FormData();
        fd.append('title', item.title.trim());
        fd.append('description', item.description.trim());
        fd.append('type', item.type);
        fd.append('context', galleryContext);
        fd.append('published', String(item.published));
        fd.append('sourceFile', item.file);

        return fetchAdminEndpoint<GalleryMediaItem>('/api/gallery', {
          method: 'POST',
          body: fd,
        });
      };

      const uploadConcurrency = 3;

      for (let index = 0; index < galleryBatchItems.length; index += uploadConcurrency) {
        await Promise.all(galleryBatchItems.slice(index, index + uploadConcurrency).map(uploadOne));
      }

      toast.success(`${galleryBatchItems.length} item(ns) carregado(s) com sucesso.`);
      clearGalleryBatchItems();
      await refreshGallery();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no carregamento em massa da galeria.');
    } finally {
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
      await refreshGovernance();
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
      await refreshGovernance();
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
      await refreshGovernance();
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
    fd.append('published', String(newsForm.published));
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
    fd.append('published', String(activityForm.published));
    fd.append('removeImage', String(activityForm.removeImage));
    if (activityForm.imageFile) fd.append('image', activityForm.imageFile);
    await saveSection('activities', fd);
  }

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData();
    fd.append('title', projectForm.title);
    fd.append('description', projectForm.description);
    fd.append('status', projectForm.status);
    fd.append('startDate', projectForm.startDate);
    fd.append('endDate', projectForm.endDate);
    fd.append('partners', projectForm.partners);
    fd.append('published', String(projectForm.published));
    fd.append('removeImage', String(projectForm.removeImage));
    if (projectForm.imageFile) fd.append('image', projectForm.imageFile);
    await saveSection('projects', fd);
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
    fd.append('published', String(publicationForm.published));
    fd.append('removeImage', String(publicationForm.removeImage));
    if (publicationForm.coverImageFile) fd.append('coverImage', publicationForm.coverImageFile);
    if (publicationForm.documentFile) fd.append('document', publicationForm.documentFile);
    await saveSection('publications', fd);
  }

  function startEdit(section: ContentSection, item: NewsArticle | Activity | Project | Publication) {
    setActiveSection(section);
    setEditingId(item.id);

    if (section === 'news') {
      const v = item as NewsArticle;
      setNewsForm({ title: v.title || '', excerpt: v.excerpt || '', content: v.content || '', author: v.author || '', published: v.published, publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString().slice(0, 10) : '', imageFile: null, removeImage: false });
    }
    if (section === 'activities') {
      const v = item as Activity;
      setActivityForm({ title: v.title || '', description: v.description || '', date: v.date ? new Date(v.date).toISOString().slice(0, 10) : '', endDate: v.endDate ? new Date(v.endDate).toISOString().slice(0, 10) : '', location: v.location || '', published: v.published, imageFile: null, removeImage: false });
    }
    if (section === 'projects') {
      const v = item as Project;
      setProjectForm({ title: v.title || '', description: v.description || '', status: v.status || 'planeado', startDate: v.startDate ? new Date(v.startDate).toISOString().slice(0, 10) : '', endDate: v.endDate ? new Date(v.endDate).toISOString().slice(0, 10) : '', partners: v.partners?.join(', ') || '', published: v.published, imageFile: null, removeImage: false });
    }
    if (section === 'publications') {
      const v = item as Publication;
      setPublicationForm({ title: v.title || '', author: v.author || '', year: String(v.year || new Date().getFullYear()), type: v.type || 'documento', description: v.description || '', downloadUrl: v.downloadUrl || '', documentFile: null, published: v.published, coverImageFile: null, removeImage: false });
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

                window.location.assign(AUTH0_ADMIN_LOGOUT_PATH);
              }}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              Terminar sessão
            </button>
          </div>

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
                <p className="mt-1 max-w-2xl text-sm text-stone-600">
                  Acompanha os conteúdos principais, consulta mensagens recentes e entra rapidamente nas áreas disponíveis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className="inline-flex w-fit items-center justify-center rounded-lg border border-[#0f4c36]/20 px-4 py-2 text-sm font-semibold text-[#0f4c36] transition hover:bg-[#0f4c36]/10"
              >
                Ver perfil
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Notícias" value={stats.news} loading={isLoadingDashboardStats} />
            <Card title="Atividades" value={stats.activities} loading={isLoadingDashboardStats} />
            <Card title="Recursos" value={stats.publications} loading={isLoadingDashboardStats} />
            <Card title="Mensagens" value={stats.contacts} loading={isLoadingDashboardStats} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)]">
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="text-xl font-semibold text-[#0f4c36]">Ações rápidas</h2>
              <p className="mt-1 text-sm text-stone-600">
                Abre diretamente as áreas que podes gerir nesta sessão.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {BACKOFFICE_NAV_ITEMS.filter((item) => availableSections.includes(item.id) && !['overview', 'profile'].includes(item.id))
                  .slice(0, 9)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className="rounded-lg border border-stone-200 px-4 py-3 text-left text-sm font-semibold text-stone-700 transition hover:border-[#0f4c36]/30 hover:bg-[#0f4c36]/5 hover:text-[#0f4c36]"
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="text-xl font-semibold text-[#0f4c36]">Conta</h2>
              <dl className="mt-5 grid gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-stone-500">Utilizador</dt>
                  <dd className="mt-1 break-all text-stone-800">{currentAdmin?.email || 'Sessão ativa'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-stone-500">Função</dt>
                  <dd className="mt-1 text-stone-800">{currentAdmin?.role === 'owner' ? 'Owner' : 'Editor'}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className="mt-5 w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b3d2b]"
              >
                Gerir perfil
              </button>
            </div>
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
              <RichTextEditor label="Conteúdo" value={newsForm.content} onChange={(v) => setNewsForm((c) => ({ ...c, content: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('news', file, kind)} />
              <Input label="Autor" value={newsForm.author} onChange={(v) => setNewsForm((c) => ({ ...c, author: v }))} required />
              <Input label="Data de publicação" type="date" value={newsForm.publishedAt} onChange={(v) => setNewsForm((c) => ({ ...c, publishedAt: v }))} />
              <FileInput label="Imagem" onFile={(file) => setNewsForm((c) => ({ ...c, imageFile: file }))} />
              <Check label="Remover imagem atual" checked={newsForm.removeImage} onChange={(checked) => setNewsForm((c) => ({ ...c, removeImage: checked }))} />
              <Check label="Publicado" checked={newsForm.published} onChange={(checked) => setNewsForm((c) => ({ ...c, published: checked }))} />
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
          onNew={() => { setEditingId(null); setActivityForm({ title: '', description: '', date: '', endDate: '', location: '', published: true, imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('activities', item as Activity)}
          onDelete={(id) => void deleteSectionItem('activities', id)}
          form={<form className="space-y-3" onSubmit={(event) => void handleActivitySubmit(event)}><Input label="Título" value={activityForm.title} onChange={(v) => setActivityForm((c) => ({ ...c, title: v }))} required /><RichTextEditor label="Descrição" value={activityForm.description} onChange={(v) => setActivityForm((c) => ({ ...c, description: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('activities', file, kind)} /><Input label="Data" type="date" value={activityForm.date} onChange={(v) => setActivityForm((c) => ({ ...c, date: v }))} required /><Input label="Data fim" type="date" value={activityForm.endDate} onChange={(v) => setActivityForm((c) => ({ ...c, endDate: v }))} /><Input label="Local" value={activityForm.location} onChange={(v) => setActivityForm((c) => ({ ...c, location: v }))} /><FileInput label="Imagem" onFile={(file) => setActivityForm((c) => ({ ...c, imageFile: file }))} /><Check label="Remover imagem atual" checked={activityForm.removeImage} onChange={(checked) => setActivityForm((c) => ({ ...c, removeImage: checked }))} /><Check label="Publicado" checked={activityForm.published} onChange={(checked) => setActivityForm((c) => ({ ...c, published: checked }))} /><button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>{backofficePrimaryActionLabel(busy, editingId ? 'Guardar alterações' : 'Criar atividade')}</button></form>}
        />
      ) : null}

      {activeSection === 'projects' ? (
        <SectionLayout
          title="Projetos"
          list={projects}
          loading={isLoadingContent}
          busy={busy}
          onNew={() => { setEditingId(null); setProjectForm({ title: '', description: '', status: 'planeado', startDate: '', endDate: '', partners: '', published: true, imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('projects', item as Project)}
          onDelete={(id) => void deleteSectionItem('projects', id)}
          form={<form className="space-y-3" onSubmit={(event) => void handleProjectSubmit(event)}><Input label="Título" value={projectForm.title} onChange={(v) => setProjectForm((c) => ({ ...c, title: v }))} required /><RichTextEditor label="Descrição" value={projectForm.description} onChange={(v) => setProjectForm((c) => ({ ...c, description: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('projects', file, kind)} /><Input label="Estado" value={projectForm.status} onChange={(v) => setProjectForm((c) => ({ ...c, status: v }))} required /><Input label="Data início" type="date" value={projectForm.startDate} onChange={(v) => setProjectForm((c) => ({ ...c, startDate: v }))} required /><Input label="Data fim" type="date" value={projectForm.endDate} onChange={(v) => setProjectForm((c) => ({ ...c, endDate: v }))} /><Input label="Parceiros (separados por vírgula)" value={projectForm.partners} onChange={(v) => setProjectForm((c) => ({ ...c, partners: v }))} /><FileInput label="Imagem" onFile={(file) => setProjectForm((c) => ({ ...c, imageFile: file }))} /><Check label="Remover imagem atual" checked={projectForm.removeImage} onChange={(checked) => setProjectForm((c) => ({ ...c, removeImage: checked }))} /><Check label="Publicado" checked={projectForm.published} onChange={(checked) => setProjectForm((c) => ({ ...c, published: checked }))} /><button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>{backofficePrimaryActionLabel(busy, editingId ? 'Guardar alterações' : 'Criar projeto')}</button></form>}
        />
      ) : null}

      {activeSection === 'publications' ? (
        <SectionLayout
          title="Recursos"
          list={publications}
          loading={isLoadingContent}
          busy={busy}
          onNew={() => { setEditingId(null); setPublicationForm({ title: '', author: '', year: String(new Date().getFullYear()), type: 'documento', description: '', downloadUrl: '', documentFile: null, published: true, coverImageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('publications', item as Publication)}
          onDelete={(id) => void deleteSectionItem('publications', id)}
          form={<form className="space-y-3" onSubmit={(event) => void handlePublicationSubmit(event)}><Input label="Título" value={publicationForm.title} onChange={(v) => setPublicationForm((c) => ({ ...c, title: v }))} required /><Input label="Autor" value={publicationForm.author} onChange={(v) => setPublicationForm((c) => ({ ...c, author: v }))} required /><Input label="Ano" value={publicationForm.year} onChange={(v) => setPublicationForm((c) => ({ ...c, year: v }))} required /><Input label="Tipo" value={publicationForm.type} onChange={(v) => setPublicationForm((c) => ({ ...c, type: v }))} required /><RichTextEditor label="Descrição" value={publicationForm.description} onChange={(v) => setPublicationForm((c) => ({ ...c, description: v }))} onUploadMedia={(file, kind) => uploadRichTextMedia('publications', file, kind)} /><Input label="URL de download" value={publicationForm.downloadUrl} onChange={(v) => setPublicationForm((c) => ({ ...c, downloadUrl: v }))} /><FileInput label="Documento PDF" accept="application/pdf" onFile={(file) => setPublicationForm((c) => ({ ...c, documentFile: file }))} /><FileInput label="Capa" onFile={(file) => setPublicationForm((c) => ({ ...c, coverImageFile: file }))} /><Check label="Remover capa atual" checked={publicationForm.removeImage} onChange={(checked) => setPublicationForm((c) => ({ ...c, removeImage: checked }))} /><Check label="Publicado" checked={publicationForm.published} onChange={(checked) => setPublicationForm((c) => ({ ...c, published: checked }))} /><button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>{backofficePrimaryActionLabel(busy, editingId ? 'Guardar alterações' : 'Criar recurso')}</button></form>}
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
              <div className="space-y-6">
              <form className="space-y-4 rounded-xl border border-stone-200 p-4" onSubmit={(event) => void saveGalleryBatch(event)}>
                <div>
                  <h3 className="text-base font-semibold text-[#0f4c36]">Carregamento em massa</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Escolhe o tipo no dropdown, seleciona vários ficheiros e ajusta os dados de cada um antes de gravar.
                  </p>
                </div>

                <label className="grid gap-1 text-sm text-stone-700">
                  Tipo do lote
                  <select
                    value={galleryBatchType}
                    onChange={(event) => setGalleryBatchType(event.target.value as GalleryMediaType)}
                    className="h-10 rounded-lg border border-stone-300 px-3"
                  >
                    <option value="photo">Fotos</option>
                    <option value="video">Vídeos</option>
                    <option value="audio">Áudios</option>
                    <option value="document">Documentos/PDFs</option>
                  </select>
                </label>

                <label className="grid gap-1 text-sm text-stone-700">
                  Ficheiros
                  <input
                    type="file"
                    accept={galleryAcceptForType(galleryBatchType)}
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

              <form ref={galleryIndividualFormRef} className="space-y-3 rounded-xl border border-stone-200 p-4" onSubmit={(event) => void saveGalleryItem(event)}>
                <div>
                  <h3 className="text-base font-semibold text-[#0f4c36]">Media individual</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    Continua disponível para criar ou editar um item específico da galeria.
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
                    <option value="photo">Foto</option>
                    <option value="video">Vídeo</option>
                    <option value="audio">Áudio</option>
                    <option value="document">Documento/PDF</option>
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

                <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
                  {backofficePrimaryActionLabel(busy, galleryEditingId ? 'Guardar alterações' : 'Criar media')}
                </button>
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
                      onClick={() => void updateAdminUser(admin.email, { role: admin.role === 'owner' ? 'editor' : 'owner' })}
                    >
                      Alternar papel
                    </button>
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
            Registo das alterações feitas no backoffice, com autor, ação e data. Os eventos com mais de 15 dias são apagados automaticamente para não encher a base de dados.
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
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#0f4c36]">Editar página Sobre Nós</h2>
          <p className="mt-1 text-sm text-stone-600">Atualiza o conteúdo institucional publicado em /sobre-nos.</p>

          {isLoadingLayout ? (
            <div className="mt-5">
              <LayoutFormSkeleton />
            </div>
          ) : (
            <form className="mt-5 grid gap-5" onSubmit={(event) => void saveLayoutSettings(event)}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Hero · Título" value={layoutSettings.pages.sobre.title} onChange={(value) => updateAppearancePage('sobre', { title: value })} />
                <TextArea label="Hero · Subtítulo" value={layoutSettings.pages.sobre.description} onChange={(value) => updateAppearancePage('sobre', { description: value })} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="grid gap-3 rounded-lg border border-stone-200 p-3">
                  <Input label="Secção · Quem Somos" value={layoutSettings.aboutPage.whoWeAreTitle} onChange={(value) => updateAboutPage({ whoWeAreTitle: value })} />
                  <TextArea label="Parágrafos · Quem Somos" value={layoutSettings.aboutPage.whoWeAreParagraphs.join('\n')} onChange={(value) => updateAboutParagraphs('whoWeAreParagraphs', value)} />
                </div>
                <div className="grid gap-3 rounded-lg border border-stone-200 p-3">
                  <Input label="Secção · Como Nasceu" value={layoutSettings.aboutPage.originTitle} onChange={(value) => updateAboutPage({ originTitle: value })} />
                  <TextArea label="Parágrafos · Como Nasceu" value={layoutSettings.aboutPage.originParagraphs.join('\n')} onChange={(value) => updateAboutParagraphs('originParagraphs', value)} />
                </div>
                <div className="grid gap-3 rounded-lg border border-stone-200 p-3">
                  <Input label="Secção · Fundadores" value={layoutSettings.aboutPage.foundersTitle} onChange={(value) => updateAboutPage({ foundersTitle: value })} />
                  <TextArea label="Parágrafos · Fundadores" value={layoutSettings.aboutPage.foundersParagraphs.join('\n')} onChange={(value) => updateAboutParagraphs('foundersParagraphs', value)} />
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-stone-200 p-3">
                <Input label="Secção · Corpos Sociais" value={layoutSettings.aboutPage.socialBodiesTitle} onChange={(value) => updateAboutPage({ socialBodiesTitle: value })} />
                <TextArea
                  label="Corpos sociais · Uma linha para o grupo, depois membros com cargo: nome"
                  value={layoutSettings.aboutPage.socialBodies.map((group) => [group.title, ...group.members].join('\n')).join('\n\n')}
                  onChange={updateAboutSocialBodies}
                />
              </div>

              <div className="grid gap-3 rounded-lg border border-stone-200 p-3 md:grid-cols-2">
                <Input label="CTA contacto · Título" value={layoutSettings.aboutPage.contactTitle} onChange={(value) => updateAboutPage({ contactTitle: value })} />
                <TextArea label="CTA contacto · Descrição" value={layoutSettings.aboutPage.contactDescription} onChange={(value) => updateAboutPage({ contactDescription: value })} />
              </div>

              <button className="w-full rounded-lg bg-[#0f4c36] px-4 py-2 text-sm text-white" disabled={busy}>
                {backofficePrimaryActionLabel(busy, 'Publicar Alterações')}
              </button>
            </form>
          )}
        </section>
      ) : null}

      {activeSection === 'layout' ? (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#0f4c36]">Aparência</h2>
          <p className="mt-1 text-sm text-stone-600">Edita hero, footer, textos de páginas e ícones visuais.</p>

          {isLoadingLayout ? (
            <div className="mt-5">
              <LayoutFormSkeleton />
            </div>
          ) : (
          <form className="mt-5 grid gap-6" onSubmit={(event) => void saveLayoutSettings(event)}>
            <div className="sticky top-4 z-10 rounded-xl border border-stone-200 bg-white/95 p-3 shadow-sm backdrop-blur">
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

            {appearanceTab === 'hero' ? (
            <>
            <AppearanceSectionTitle title="Hero da Página Inicial" description="Gere o título, botões e imagem do primeiro ecrã." />
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Hero · Eyebrow" value={layoutSettings.home.hero.eyebrow} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, eyebrow: v } } }))} />
              <Input label="Hero · Linha 1" value={layoutSettings.home.hero.titleLine1} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, titleLine1: v } } }))} />
              <Input label="Hero · Linha 2" value={layoutSettings.home.hero.titleLine2} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, titleLine2: v } } }))} />
              <Input label="Hero · Linha 3" value={layoutSettings.home.hero.titleLine3} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, titleLine3: v } } }))} />
              <Input label="Hero · Linha 4" value={layoutSettings.home.hero.titleLine4} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, titleLine4: v } } }))} />
              <FileInput label="Hero · Upload de imagem" onFile={setHeroImageFile} />
              <Input label="Hero · Alt da imagem" value={layoutSettings.home.hero.imageAlt} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, imageAlt: v } } }))} />
              <Input label="CTA principal · Label" value={layoutSettings.home.hero.primaryCtaLabel} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, primaryCtaLabel: v } } }))} />
              <Input label="CTA principal · Link" value={layoutSettings.home.hero.primaryCtaHref} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, primaryCtaHref: v } } }))} />
              <Input label="CTA secundário · Label" value={layoutSettings.home.hero.secondaryCtaLabel} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, secondaryCtaLabel: v } } }))} />
              <Input label="CTA secundário · Link" value={layoutSettings.home.hero.secondaryCtaHref} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, secondaryCtaHref: v } } }))} />
            </div>

            </>
            ) : null}

            {appearanceTab === 'pages' ? (
            <>
            <AppearanceSectionTitle title="Conteúdo das Páginas" description="Edita títulos, descrições e mensagens públicas das páginas principais." />
            <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-2 md:grid-cols-2">
              {APPEARANCE_PAGE_FIELDS.map((page) => {
                const pageSettings = layoutSettings.pages[page.id];

                return (
                  <div key={page.id} className="grid gap-3 rounded-lg border border-stone-200 p-3">
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
                  </div>
                );
              })}
            </div>
            </>
            ) : null}

            {appearanceTab === 'footer' ? (
            <>
            <AppearanceSectionTitle title="Footer" description="Edita apenas os campos que aparecem no footer público: contactos, redes sociais, navegação, sócio e rodapé legal." />

            <div className="rounded-lg border border-stone-200 p-3">
              <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Contactos</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="Footer · Morada" value={layoutSettings.footer.contactInfo.address} onChange={(v) => updateFooterContact({ address: v })} />
                <Input label="Footer · Código postal" value={layoutSettings.footer.contactInfo.postalCode} onChange={(v) => updateFooterContact({ postalCode: v })} />
                <Input label="Footer · Localidade" value={layoutSettings.footer.contactInfo.city} onChange={(v) => updateFooterContact({ city: v })} />
                <Input label="Footer · Telefone" value={layoutSettings.footer.contactInfo.phone} onChange={(v) => updateFooterContact({ phone: v })} />
                <Input label="Footer · Email" type="email" value={layoutSettings.footer.contactInfo.email} onChange={(v) => updateFooterContact({ email: v })} />
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 p-3">
              <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Redes sociais</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input label="Título da secção" value={layoutSettings.footer.socialTitle} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, socialTitle: v } }))} />
                <Input label="Facebook" value={layoutSettings.footer.contactInfo.socialMedia.facebook || ''} onChange={(v) => updateFooterSocialMedia('facebook', v)} />
                <Input label="Instagram" value={layoutSettings.footer.contactInfo.socialMedia.instagram || ''} onChange={(v) => updateFooterSocialMedia('instagram', v)} />
                <Input label="LinkedIn" value={layoutSettings.footer.contactInfo.socialMedia.linkedin || ''} onChange={(v) => updateFooterSocialMedia('linkedin', v)} />
                <Input label="YouTube" value={layoutSettings.footer.contactInfo.socialMedia.youtube || ''} onChange={(v) => updateFooterSocialMedia('youtube', v)} />
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 p-3">
              <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Navegação visível</h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                A coluna Conhecer é fixa no frontend e mostra Atividades e Notícias. A coluna de iniciativas pode ser ajustada abaixo.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm text-stone-600">
                  <p className="font-semibold text-[#0f4c36]">Conhecer</p>
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
              <div className="rounded-lg border border-stone-200 p-3">
                <h3 className="text-sm font-semibold text-[#0f4c36]">Footer · Tornar-se sócio</h3>
                <div className="mt-3 grid gap-3">
                  <Input label="Título" value={layoutSettings.footer.membership.title} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, title: value } } }))} />
                  <TextArea label="Descrição" value={layoutSettings.footer.membership.description} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, description: value } } }))} />
                  <Input label="Texto do botão" value={layoutSettings.footer.membership.ctaLabel} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, ctaLabel: value } } }))} />
                  <Input label="Link do botão" value={layoutSettings.footer.membership.ctaHref} onChange={(value) => setLayoutSettings((current) => ({ ...current, footer: { ...current.footer, membership: { ...current.footer.membership, ctaHref: value } } }))} />
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
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
                <div key={`${link.href}-${index}`} className="rounded-lg border border-stone-200 p-3">
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
                <div key={section.id} className="rounded-lg border border-stone-200 p-3">
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
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(layoutSettings.visualIdentity.colors).map(([key, value]) => (
                <Input key={key} type="color" label={`Cor · ${key}`} value={value} onChange={(next) => updateVisualColor(key as keyof SiteLayoutSettings['visualIdentity']['colors'], next)} />
              ))}
            </div>
            </>
            ) : null}

            {appearanceTab === 'logos' ? (
            <>
            <AppearanceSectionTitle title="Logótipos" description="Regista os logótipos institucionais usados pelo website e materiais públicos." />
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Logótipo principal" value={layoutSettings.visualIdentity.logos.primary} onChange={(v) => updateLogo('primary', v)} />
              <Input label="Logótipo do footer" value={layoutSettings.visualIdentity.logos.footer} onChange={(v) => updateLogo('footer', v)} />
              <Input label="Logótipo institucional" value={layoutSettings.visualIdentity.logos.institutional} onChange={(v) => updateLogo('institutional', v)} />
            </div>
            </>
            ) : null}

            {appearanceTab === 'seo' ? (
            <>
            <AppearanceSectionTitle title="SEO e Metadados" description="Campos centrais para título, descrição, palavras-chave e imagem social." />
            <Input label="SEO · Título" value={layoutSettings.seo.title} onChange={(v) => updateSeo({ title: v })} />
            <TextArea label="SEO · Descrição" value={layoutSettings.seo.description} onChange={(v) => updateSeo({ description: v })} />
            <TextArea label="SEO · Palavras-chave" value={layoutSettings.seo.keywords} onChange={(v) => updateSeo({ keywords: v })} />
            <Input label="SEO · Imagem Open Graph" value={layoutSettings.seo.ogImage} onChange={(v) => updateSeo({ ogImage: v })} />
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
  list,
  form,
  onEdit,
  onDelete,
  onNew,
  busy,
  loading = false,
}: {
  title: string;
  list: Array<{ id: string; title?: string }>;
  form: React.ReactNode;
  onEdit: (item: { id: string; title?: string }) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  busy: boolean;
  loading?: boolean;
}) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0f4c36]">{title}</h2>
          <button type="button" onClick={onNew} disabled={busy} className="rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:opacity-50">
            Novo
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
      <div className="rounded-xl border border-stone-200 bg-white p-5 opacity-100">
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
    return <img src={item.thumbnail || item.source || '/placeholder.svg'} alt={item.title} className="h-24 w-24 rounded-lg object-cover" />;
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
      {item.source ? <audio controls preload="metadata" className="w-full" src={item.source} /> : <p className="text-sm text-stone-500">Sem áudio associado.</p>}
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

function FileInput({ label, onFile, accept = 'image/*' }: { label: string; onFile: (file: File | null) => void; accept?: string }) {
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
