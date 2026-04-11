'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { adminAuthClient, getAdminAccessToken, getStoredAdminSession, isExportAdminAuthMode } from '@/lib/admin-auth';
import RichTextEditor from '@/components/RichTextEditor';
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
import type {
  Activity,
  AdminPermission,
  AdminRole,
  AdminUser,
  AuditLogEntry,
  ContentSection,
  GalleryMediaItem,
  GalleryMediaType,
  LayoutIconName,
  NewsArticle,
  Project,
  Publication,
  SiteLayoutSettings,
} from '@/types';

type SectionId = 'overview' | 'admins' | 'audit' | 'layout' | 'gallery' | ContentSection;
const ADMIN_PERMISSION_OPTIONS: Array<{ id: AdminPermission; label: string }> = [
  { id: 'news', label: 'Notícias' },
  { id: 'activities', label: 'Atividades' },
  { id: 'projects', label: 'Projetos' },
  { id: 'publications', label: 'Biblioteca' },
  { id: 'gallery', label: 'Galeria' },
  { id: 'layout', label: 'Layout' },
  { id: 'admins', label: 'Admins' },
  { id: 'audit', label: 'Auditoria' },
];

export default function BackofficePage() {
  const router = useRouter();
  const exportAuthMode = isExportAdminAuthMode();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [busy, setBusy] = useState(false);

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [layoutSettings, setLayoutSettings] = useState<SiteLayoutSettings>(defaultSiteLayoutSettings);
  const [currentAdmin, setCurrentAdmin] = useState<{ email: string; role: AdminRole; permissions: AdminPermission[] } | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('editor');
  const [newAdminPasswordMode, setNewAdminPasswordMode] = useState<'manual' | 'generated'>('generated');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createdAdminPassword, setCreatedAdminPassword] = useState<string | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [selectedAdminPermissions, setSelectedAdminPermissions] = useState<AdminPermission[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', excerpt: '', content: '', author: '', published: true, publishedAt: '', imageFile: null as File | null, removeImage: false });
  const [activityForm, setActivityForm] = useState({ title: '', description: '', date: '', endDate: '', location: '', published: true, imageFile: null as File | null, removeImage: false });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', status: 'planeado', startDate: '', endDate: '', partners: '', published: true, imageFile: null as File | null, removeImage: false });
  const [publicationForm, setPublicationForm] = useState({ title: '', author: '', year: String(new Date().getFullYear()), type: 'documento', description: '', downloadUrl: '', published: true, coverImageFile: null as File | null, removeImage: false });
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
    () => ({ news: news.length, activities: activities.length, projects: projects.length, publications: publications.length, gallery: galleryItems.length }),
    [news.length, activities.length, projects.length, publications.length, galleryItems.length]
  );
  const groupedGalleryItems = useMemo(
    () => ({
      photo: galleryItems.filter((item) => item.type === 'photo'),
      video: galleryItems.filter((item) => item.type === 'video'),
      audio: galleryItems.filter((item) => item.type === 'audio'),
    }),
    [galleryItems]
  );
  const availableSections = useMemo(() => {
    if (!currentAdmin) {
      return [] as SectionId[];
    }

    if (exportAuthMode) {
      return ['overview'] as SectionId[];
    }

    const sections: SectionId[] = ['overview'];
    const permissionSet = new Set(currentAdmin.permissions);

    for (const section of ['news', 'activities', 'projects', 'publications'] as ContentSection[]) {
      if (currentAdmin.role === 'owner' || permissionSet.has(section)) {
        sections.push(section);
      }
    }

    if (currentAdmin.role === 'owner' || permissionSet.has('gallery')) sections.push('gallery');
    if (currentAdmin.role === 'owner' || permissionSet.has('admins')) sections.push('admins');
    if (currentAdmin.role === 'owner' || permissionSet.has('audit')) sections.push('audit');
    if (currentAdmin.role === 'owner' || permissionSet.has('layout')) sections.push('layout');

    return sections;
  }, [currentAdmin, exportAuthMode]);

  const authHeaders = useCallback(async () => {
    const token = await getAdminAccessToken();
    if (!token) throw new Error('Sessão administrativa expirada.');
    return { Authorization: `Bearer ${token}` };
  }, []);

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

  const refreshAll = useCallback(async () => {
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
  }, [fetchAdminCollection]);

  const refreshGovernance = useCallback(async () => {
    const [adminsData, auditData] = await Promise.all([
      fetchAdminEndpoint<AdminUser[]>('/api/admin/users').catch(() => []),
      fetchAdminEndpoint<AuditLogEntry[]>('/api/admin/audit').catch(() => []),
    ]);

    setAdmins(adminsData);
    setAuditLogs(auditData);
  }, [fetchAdminEndpoint]);

  const refreshLayout = useCallback(async () => {
    const data = await fetchAdminEndpoint<SiteLayoutSettings>('/api/admin/layout').catch(() => defaultSiteLayoutSettings);
    setLayoutSettings(data);
  }, [fetchAdminEndpoint]);

  const refreshGallery = useCallback(async () => {
    const data = await fetchAdminEndpoint<GalleryMediaItem[]>('/api/gallery?scope=admin').catch(() => []);
    setGalleryItems(data);
    setSelectedGalleryIds([]);
  }, [fetchAdminEndpoint]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const sessionResult = await adminAuthClient.adapter.getSession();
        const localSession = sessionResult?.data?.session ?? getStoredAdminSession();

        if (!localSession) {
          router.replace('/backoffice/login');
          return;
        }

        setIsCheckingSession(false);

        if (exportAuthMode) {
          setCurrentAdmin({
            email: localSession.email,
            role: localSession.role,
            permissions: localSession.permissions,
          });
          return;
        }

        const token = await getAdminAccessToken();

        if (!token) {
          await adminAuthClient.adapter.signOut();
          router.replace('/backoffice/login');
          return;
        }

        const me = await fetchAdminEndpoint<{ email: string; role: AdminRole; permissions: AdminPermission[] }>('/api/admin/me');
        setCurrentAdmin(me);

        await Promise.allSettled([refreshAll(), refreshGovernance(), refreshLayout(), refreshGallery()]);
      } catch (error) {
        if (error instanceof Error && (error.message.includes('Sessão administrativa expirada') || error.message.includes('401'))) {
          await adminAuthClient.adapter.signOut().catch(() => undefined);
          router.replace('/backoffice/login');
          return;
        }

        toast.error(error instanceof Error ? error.message : 'Falha ao carregar o backoffice.');
        setIsCheckingSession(false);
      }
    };

    void bootstrap();
  }, [exportAuthMode, fetchAdminEndpoint, refreshAll, refreshGovernance, refreshLayout, refreshGallery, router]);

  useEffect(() => {
    if (!availableSections.includes(activeSection)) {
      setActiveSection('overview');
    }
  }, [activeSection, availableSections]);

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

  function resetCurrentForm() {
    setEditingId(null);
    if (activeSection === 'news') setNewsForm({ title: '', excerpt: '', content: '', author: '', published: true, publishedAt: '', imageFile: null, removeImage: false });
    if (activeSection === 'activities') setActivityForm({ title: '', description: '', date: '', endDate: '', location: '', published: true, imageFile: null, removeImage: false });
    if (activeSection === 'projects') setProjectForm({ title: '', description: '', status: 'planeado', startDate: '', endDate: '', partners: '', published: true, imageFile: null, removeImage: false });
    if (activeSection === 'publications') setPublicationForm({ title: '', author: '', year: String(new Date().getFullYear()), type: 'documento', description: '', downloadUrl: '', published: true, coverImageFile: null, removeImage: false });
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

    const acceptedPrefix =
      galleryBatchType === 'photo' ? 'image/' : galleryBatchType === 'video' ? 'video/' : 'audio/';

    const rejectedLargeAudio = Array.from(files).some(
      (file) => galleryBatchType === 'audio' && file.type.startsWith('audio/') && file.size > MAX_INLINE_AUDIO_UPLOAD_BYTES
    );

    if (rejectedLargeAudio) {
      toast.error(getInlineAudioUploadErrorMessage());
      return;
    }

    const nextItems = Array.from(files)
      .filter((file) => file.type.startsWith(acceptedPrefix))
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
    setActiveSection('gallery');
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
    const ids = (type ? groupedGalleryItems[type].map((item) => item.id) : selectedGalleryIds).filter((id) =>
      selectedGalleryIds.includes(id)
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
      for (const id of ids) {
        await fetchAdminEndpoint<null>(`/api/gallery/${id}`, { method: 'DELETE' });
      }

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
      for (const item of galleryBatchItems) {
        const fd = new FormData();
        fd.append('title', item.title.trim());
        fd.append('description', item.description.trim());
        fd.append('type', item.type);
        fd.append('published', String(item.published));
        fd.append('sourceFile', item.file);

        await fetchAdminEndpoint<GalleryMediaItem>('/api/gallery', {
          method: 'POST',
          body: fd,
        });
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
      setPublicationForm({ title: v.title || '', author: v.author || '', year: String(v.year || new Date().getFullYear()), type: v.type || 'documento', description: v.description || '', downloadUrl: v.downloadUrl || '', published: v.published, coverImageFile: null, removeImage: false });
    }
  }

  if (isCheckingSession) {
    return <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-16">A validar sessão…</main>;
  }

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-[#27441d]">Backoffice CEISCaramulo</h1>
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
            router.replace('/backoffice/login');
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {availableSections.includes('overview') ? <button type="button" onClick={() => setActiveSection('overview')} className={tabClass(activeSection === 'overview')}>Visão geral</button> : null}
        {availableSections.includes('news') ? <button type="button" onClick={() => setActiveSection('news')} className={tabClass(activeSection === 'news')}>Notícias</button> : null}
        {availableSections.includes('activities') ? <button type="button" onClick={() => setActiveSection('activities')} className={tabClass(activeSection === 'activities')}>Atividades</button> : null}
        {availableSections.includes('projects') ? <button type="button" onClick={() => setActiveSection('projects')} className={tabClass(activeSection === 'projects')}>Projetos</button> : null}
        {availableSections.includes('publications') ? <button type="button" onClick={() => setActiveSection('publications')} className={tabClass(activeSection === 'publications')}>Biblioteca</button> : null}
        {availableSections.includes('gallery') ? <button type="button" onClick={() => setActiveSection('gallery')} className={tabClass(activeSection === 'gallery')}>Galeria</button> : null}
        {availableSections.includes('admins') ? <button type="button" onClick={() => setActiveSection('admins')} className={tabClass(activeSection === 'admins')}>Admins</button> : null}
        {availableSections.includes('audit') ? <button type="button" onClick={() => setActiveSection('audit')} className={tabClass(activeSection === 'audit')}>Auditoria</button> : null}
        {availableSections.includes('layout') ? <button type="button" onClick={() => setActiveSection('layout')} className={tabClass(activeSection === 'layout')}>Layout CMS</button> : null}
      </div>

      {activeSection === 'overview' ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Notícias" value={stats.news} />
          <Card title="Atividades" value={stats.activities} />
          <Card title="Projetos" value={stats.projects} />
          <Card title="Biblioteca" value={stats.publications} />
          <Card title="Galeria" value={stats.gallery} />
        </section>
      ) : null}

      {activeSection === 'news' ? (
        <SectionLayout
          title="Notícias"
          list={news}
          busy={busy}
          onNew={() => { setEditingId(null); setNewsForm({ title: '', excerpt: '', content: '', author: '', published: true, publishedAt: '', imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('news', item as NewsArticle)}
          onDelete={(id) => void deleteSectionItem('news', id)}
          form={
            <form className="space-y-3" onSubmit={(event) => void handleNewsSubmit(event)}>
              <Input label="Título" value={newsForm.title} onChange={(v) => setNewsForm((c) => ({ ...c, title: v }))} required />
              <Input label="Resumo" value={newsForm.excerpt} onChange={(v) => setNewsForm((c) => ({ ...c, excerpt: v }))} required />
              <RichTextEditor label="Conteúdo" value={newsForm.content} onChange={(v) => setNewsForm((c) => ({ ...c, content: v }))} />
              <Input label="Autor" value={newsForm.author} onChange={(v) => setNewsForm((c) => ({ ...c, author: v }))} required />
              <Input label="Data de publicação" type="date" value={newsForm.publishedAt} onChange={(v) => setNewsForm((c) => ({ ...c, publishedAt: v }))} />
              <FileInput label="Imagem" onFile={(file) => setNewsForm((c) => ({ ...c, imageFile: file }))} />
              <Check label="Remover imagem atual" checked={newsForm.removeImage} onChange={(checked) => setNewsForm((c) => ({ ...c, removeImage: checked }))} />
              <Check label="Publicado" checked={newsForm.published} onChange={(checked) => setNewsForm((c) => ({ ...c, published: checked }))} />
              <button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>{editingId ? 'Guardar alterações' : 'Criar notícia'}</button>
            </form>
          }
        />
      ) : null}

      {activeSection === 'activities' ? (
        <SectionLayout
          title="Atividades"
          list={activities}
          busy={busy}
          onNew={() => { setEditingId(null); setActivityForm({ title: '', description: '', date: '', endDate: '', location: '', published: true, imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('activities', item as Activity)}
          onDelete={(id) => void deleteSectionItem('activities', id)}
          form={<form className="space-y-3" onSubmit={(event) => void handleActivitySubmit(event)}><Input label="Título" value={activityForm.title} onChange={(v) => setActivityForm((c) => ({ ...c, title: v }))} required /><RichTextEditor label="Descrição" value={activityForm.description} onChange={(v) => setActivityForm((c) => ({ ...c, description: v }))} /><Input label="Data" type="date" value={activityForm.date} onChange={(v) => setActivityForm((c) => ({ ...c, date: v }))} required /><Input label="Data fim" type="date" value={activityForm.endDate} onChange={(v) => setActivityForm((c) => ({ ...c, endDate: v }))} /><Input label="Local" value={activityForm.location} onChange={(v) => setActivityForm((c) => ({ ...c, location: v }))} /><FileInput label="Imagem" onFile={(file) => setActivityForm((c) => ({ ...c, imageFile: file }))} /><Check label="Remover imagem atual" checked={activityForm.removeImage} onChange={(checked) => setActivityForm((c) => ({ ...c, removeImage: checked }))} /><Check label="Publicado" checked={activityForm.published} onChange={(checked) => setActivityForm((c) => ({ ...c, published: checked }))} /><button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>{editingId ? 'Guardar alterações' : 'Criar atividade'}</button></form>}
        />
      ) : null}

      {activeSection === 'projects' ? (
        <SectionLayout
          title="Projetos"
          list={projects}
          busy={busy}
          onNew={() => { setEditingId(null); setProjectForm({ title: '', description: '', status: 'planeado', startDate: '', endDate: '', partners: '', published: true, imageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('projects', item as Project)}
          onDelete={(id) => void deleteSectionItem('projects', id)}
          form={<form className="space-y-3" onSubmit={(event) => void handleProjectSubmit(event)}><Input label="Título" value={projectForm.title} onChange={(v) => setProjectForm((c) => ({ ...c, title: v }))} required /><RichTextEditor label="Descrição" value={projectForm.description} onChange={(v) => setProjectForm((c) => ({ ...c, description: v }))} /><Input label="Estado" value={projectForm.status} onChange={(v) => setProjectForm((c) => ({ ...c, status: v }))} required /><Input label="Data início" type="date" value={projectForm.startDate} onChange={(v) => setProjectForm((c) => ({ ...c, startDate: v }))} required /><Input label="Data fim" type="date" value={projectForm.endDate} onChange={(v) => setProjectForm((c) => ({ ...c, endDate: v }))} /><Input label="Parceiros (separados por vírgula)" value={projectForm.partners} onChange={(v) => setProjectForm((c) => ({ ...c, partners: v }))} /><FileInput label="Imagem" onFile={(file) => setProjectForm((c) => ({ ...c, imageFile: file }))} /><Check label="Remover imagem atual" checked={projectForm.removeImage} onChange={(checked) => setProjectForm((c) => ({ ...c, removeImage: checked }))} /><Check label="Publicado" checked={projectForm.published} onChange={(checked) => setProjectForm((c) => ({ ...c, published: checked }))} /><button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>{editingId ? 'Guardar alterações' : 'Criar projeto'}</button></form>}
        />
      ) : null}

      {activeSection === 'publications' ? (
        <SectionLayout
          title="Biblioteca"
          list={publications}
          busy={busy}
          onNew={() => { setEditingId(null); setPublicationForm({ title: '', author: '', year: String(new Date().getFullYear()), type: 'documento', description: '', downloadUrl: '', published: true, coverImageFile: null, removeImage: false }); }}
          onEdit={(item) => startEdit('publications', item as Publication)}
          onDelete={(id) => void deleteSectionItem('publications', id)}
          form={<form className="space-y-3" onSubmit={(event) => void handlePublicationSubmit(event)}><Input label="Título" value={publicationForm.title} onChange={(v) => setPublicationForm((c) => ({ ...c, title: v }))} required /><Input label="Autor" value={publicationForm.author} onChange={(v) => setPublicationForm((c) => ({ ...c, author: v }))} required /><Input label="Ano" value={publicationForm.year} onChange={(v) => setPublicationForm((c) => ({ ...c, year: v }))} required /><Input label="Tipo" value={publicationForm.type} onChange={(v) => setPublicationForm((c) => ({ ...c, type: v }))} required /><RichTextEditor label="Descrição" value={publicationForm.description} onChange={(v) => setPublicationForm((c) => ({ ...c, description: v }))} /><Input label="URL de download" value={publicationForm.downloadUrl} onChange={(v) => setPublicationForm((c) => ({ ...c, downloadUrl: v }))} /><FileInput label="Capa" onFile={(file) => setPublicationForm((c) => ({ ...c, coverImageFile: file }))} /><Check label="Remover capa atual" checked={publicationForm.removeImage} onChange={(checked) => setPublicationForm((c) => ({ ...c, removeImage: checked }))} /><Check label="Publicado" checked={publicationForm.published} onChange={(checked) => setPublicationForm((c) => ({ ...c, published: checked }))} /><button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>{editingId ? 'Guardar alterações' : 'Criar publicação'}</button></form>}
        />
      ) : null}

      {activeSection === 'gallery' ? (
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#27441d]">Galeria multimédia</h2>
                <p className="mt-1 text-sm text-stone-600">Fotos, vídeos e áudios separados por tipo com preview e seleção múltipla.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={resetGalleryForm} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">Novo</button>
                <button
                  type="button"
                  onClick={() => void deleteSelectedGalleryItems()}
                  className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700"
                  disabled={busy || selectedGalleryIds.length === 0}
                >
                  Eliminar selecionados
                </button>
              </div>
            </div>

            <div className="space-y-5">
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
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 opacity-100">
            <div className={busy ? 'pointer-events-none opacity-70' : ''}>
              <div className="space-y-6">
              <form className="space-y-4 rounded-xl border border-stone-200 p-4" onSubmit={(event) => void saveGalleryBatch(event)}>
                <div>
                  <h3 className="text-base font-semibold text-[#27441d]">Carregamento em massa</h3>
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
                  </select>
                </label>

                <label className="grid gap-1 text-sm text-stone-700">
                  Ficheiros
                  <input
                    type="file"
                    accept={galleryBatchType === 'photo' ? 'image/*' : galleryBatchType === 'video' ? 'video/*' : 'audio/*'}
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
                          <div className="min-w-0 flex-1 space-y-3">
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">
                              {item.type === 'photo' ? 'Foto' : item.type === 'video' ? 'Vídeo' : 'Áudio'} {index + 1}
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
                    className="flex-1 rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white"
                    disabled={busy || galleryBatchItems.length === 0}
                  >
                    Guardar lote
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

              <form className="space-y-3 rounded-xl border border-stone-200 p-4" onSubmit={(event) => void saveGalleryItem(event)}>
                <div>
                  <h3 className="text-base font-semibold text-[#27441d]">Media individual</h3>
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
                  </select>
                </label>

                <Input label="Fonte URL (opcional)" value={galleryForm.sourceUrl} onChange={(v) => setGalleryForm((c) => ({ ...c, sourceUrl: v }))} />
                <FileInput
                  label="Fonte ficheiro"
                  accept={galleryForm.type === 'photo' ? 'image/*' : galleryForm.type === 'video' ? 'video/*' : 'audio/*'}
                  onFile={(file) => setGalleryForm((c) => ({ ...c, sourceFile: file }))}
                />

                <Input label="Thumbnail URL (opcional)" value={galleryForm.thumbnailUrl} onChange={(v) => setGalleryForm((c) => ({ ...c, thumbnailUrl: v }))} />
                <FileInput label="Thumbnail ficheiro (opcional)" accept="image/*" onFile={(file) => setGalleryForm((c) => ({ ...c, thumbnailFile: file }))} />
                <Check label="Publicado" checked={galleryForm.published} onChange={(checked) => setGalleryForm((c) => ({ ...c, published: checked }))} />

                <button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>
                  {galleryEditingId ? 'Guardar alterações' : 'Criar media'}
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
            <h2 className="text-xl font-semibold text-[#27441d]">Gestão de utilizadores admin</h2>
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
                        className={`flex-1 rounded-md px-3 py-2 text-sm ${newAdminPasswordMode === 'generated' ? 'bg-[#27441d] text-white' : 'text-stone-700'}`}
                      >
                        Gerar automaticamente
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAdminPasswordMode('manual')}
                        className={`flex-1 rounded-md px-3 py-2 text-sm ${newAdminPasswordMode === 'manual' ? 'bg-[#27441d] text-white' : 'text-stone-700'}`}
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
                  <button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>
                    Adicionar admin
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
            <h2 className="text-xl font-semibold text-[#27441d]">Admins existentes</h2>

            <div className="mt-4 space-y-3">
              {admins.map((admin) => (
                <article key={admin.id} className="rounded-lg border border-stone-200 p-3">
                  <p className="font-medium text-[#27441d]">{admin.email}</p>
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

              {admins.length === 0 ? <p className="text-sm text-stone-500">Sem admins configurados.</p> : null}
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
                <p className="font-medium text-[#27441d]">{selectedAdmin.email}</p>
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
              className="rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white"
              disabled={busy || !selectedAdmin || selectedAdmin.role === 'owner'}
            >
              Guardar permissões
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeSection === 'audit' ? (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#27441d]">Registo de auditoria</h2>
          <p className="mt-1 text-sm text-stone-600">Histórico de alterações administrativas com ator, ação e timestamp.</p>

          <div className="mt-4 space-y-3">
            {auditLogs.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-stone-200 p-3">
                <p className="text-sm font-medium text-[#27441d]">{entry.summary}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(entry.createdAt).toLocaleString('pt-PT')} · {entry.actorEmail} ({entry.actorRole})
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {entry.action} · {entry.targetType}
                  {entry.targetId ? ` · ${entry.targetId}` : ''}
                </p>
              </article>
            ))}

            {auditLogs.length === 0 ? <p className="text-sm text-stone-500">Sem eventos de auditoria.</p> : null}
          </div>
        </section>
      ) : null}

      {activeSection === 'layout' ? (
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#27441d]">Layout do site</h2>
          <p className="mt-1 text-sm text-stone-600">Edita hero, footer, textos de páginas e ícones visuais.</p>

          <form className="mt-5 grid gap-6" onSubmit={(event) => void saveLayoutSettings(event)}>
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

            <TextArea label="Hero · Descrição" value={layoutSettings.home.hero.description} onChange={(v) => setLayoutSettings((c) => ({ ...c, home: { ...c.home, hero: { ...c.home.hero, description: v } } }))} />

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Página Sobre · Título" value={layoutSettings.pages.sobre.title} onChange={(v) => setLayoutSettings((c) => ({ ...c, pages: { ...c.pages, sobre: { ...c.pages.sobre, title: v } } }))} />
              <Input label="Página Serra · Título" value={layoutSettings.pages.serra.title} onChange={(v) => setLayoutSettings((c) => ({ ...c, pages: { ...c.pages, serra: { ...c.pages.serra, title: v } } }))} />
              <Input label="Página Atividades · Título" value={layoutSettings.pages.atividades.title} onChange={(v) => setLayoutSettings((c) => ({ ...c, pages: { ...c.pages, atividades: { ...c.pages.atividades, title: v } } }))} />
              <Input label="Página Notícias · Título" value={layoutSettings.pages.noticias.title} onChange={(v) => setLayoutSettings((c) => ({ ...c, pages: { ...c.pages, noticias: { ...c.pages.noticias, title: v } } }))} />
              <Input label="Página Projetos · Título" value={layoutSettings.pages.projetos.title} onChange={(v) => setLayoutSettings((c) => ({ ...c, pages: { ...c.pages, projetos: { ...c.pages.projetos, title: v } } }))} />
              <Input label="Página Biblioteca · Título" value={layoutSettings.pages.biblioteca.title} onChange={(v) => setLayoutSettings((c) => ({ ...c, pages: { ...c.pages, biblioteca: { ...c.pages.biblioteca, title: v } } }))} />
            </div>

            <TextArea label="Footer · Descrição da marca" value={layoutSettings.footer.brandDescription} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, brandDescription: v } }))} />
            <Input label="Footer · Copyright" value={layoutSettings.footer.copyrightLine} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, copyrightLine: v } }))} />
            <Input label="Footer · Linha legal" value={layoutSettings.footer.legalLine} onChange={(v) => setLayoutSettings((c) => ({ ...c, footer: { ...c.footer, legalLine: v } }))} />

            <div className="grid gap-4 md:grid-cols-2">
              {layoutSettings.home.explore.links.slice(0, 6).map((link, index) => (
                <div key={`${link.href}-${index}`} className="rounded-lg border border-stone-200 p-3">
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

            <button className="w-full rounded-lg bg-[#27441d] px-4 py-2 text-sm text-white" disabled={busy}>
              Guardar layout
            </button>
          </form>
        </section>
      ) : null}
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
              className={selected ? 'rounded-md border border-[#27441d] bg-[#eef4ec] p-2 text-[#27441d]' : 'rounded-md border border-stone-200 p-2 text-stone-600'}
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

function tabClass(active: boolean) {
  return active
    ? 'rounded-lg bg-[#27441d] px-4 py-2 text-sm font-medium text-white'
    : 'rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700';
}

function Card({ title, value }: { title: string; value: number | undefined }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-[#27441d]">{value ?? '—'}</p>
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
}: {
  title: string;
  list: Array<{ id: string; title?: string }>;
  form: React.ReactNode;
  onEdit: (item: { id: string; title?: string }) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  busy: boolean;
}) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#27441d]">{title}</h2>
          <button type="button" onClick={onNew} className="rounded-lg border border-stone-300 px-3 py-2 text-sm">Novo</button>
        </div>
        <div className="space-y-3">
          {list.map((item) => (
            <article key={item.id} className="rounded-lg border border-stone-200 p-3">
              <p className="font-medium text-[#27441d]">{item.title || item.id}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => onEdit(item)} className="rounded border px-2 py-1 text-xs">Editar</button>
                <button type="button" onClick={() => onDelete(item.id)} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700">Apagar</button>
              </div>
            </article>
          ))}
          {list.length === 0 ? <p className="text-sm text-stone-500">Sem registos.</p> : null}
        </div>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-5 opacity-100">
        <div className={busy ? 'pointer-events-none opacity-70' : ''}>{form}</div>
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
          <h3 className="text-base font-semibold text-[#27441d]">{title}</h3>
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
                      <p className="font-medium text-[#27441d]">{item.title || item.id}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {item.published ? 'Publicado' : 'Rascunho'} · {new Date(item.updatedAt).toLocaleDateString('pt-PT')}
                      </p>
                      {item.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => onEdit(item)} className="rounded border px-2 py-1 text-xs">Editar</button>
                      <button type="button" onClick={() => onDelete(item.id)} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700">Apagar</button>
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
  if (item.type === 'photo') {
    return <img src={item.thumbnail || item.source} alt={item.title} className="h-24 w-24 rounded-lg object-cover" />;
  }

  if (item.type === 'video') {
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

  return (
    <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg bg-stone-100 p-3">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">Preview áudio</div>
      <audio controls preload="metadata" className="w-full" src={item.source} />
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
