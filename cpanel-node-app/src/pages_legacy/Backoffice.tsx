import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Calendar,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SEOHead from '../components/SEOHead';
import RichTextEditor from '../components/RichTextEditor';
import { cmsQueryKeys, useAdminActivities, useAdminNews, useAdminProjects, useAdminPublications } from '../hooks/useCmsContent';
import { createItem, deleteItem, getAssetUrl, updateItem } from '../lib/api';
import { adminAuthClient } from '../lib/admin-auth';
import type { Activity, ContentSection, NewsArticle, Project, Publication } from '../types';

const sectionList = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'news', label: 'Notícias', icon: Newspaper },
  { id: 'activities', label: 'Atividades', icon: Calendar },
  { id: 'projects', label: 'Projetos', icon: FolderKanban },
  { id: 'publications', label: 'Biblioteca', icon: BookOpen },
] as const;

type SectionId = (typeof sectionList)[number]['id'];

type NewsFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  published: boolean;
  publishedAt: string;
  imageFile: File | null;
  removeImage: boolean;
};

type ActivityFormState = {
  title: string;
  description: string;
  date: string;
  endDate: string;
  location: string;
  category: Activity['category'];
  published: boolean;
  imageFile: File | null;
  removeImage: boolean;
};

type ProjectFormState = {
  title: string;
  description: string;
  status: Project['status'];
  startDate: string;
  endDate: string;
  partners: string;
  published: boolean;
  imageFile: File | null;
  removeImage: boolean;
};

type PublicationFormState = {
  title: string;
  author: string;
  year: string;
  type: Publication['type'];
  description: string;
  downloadUrl: string;
  published: boolean;
  imageFile: File | null;
  removeImage: boolean;
};

const createNewsState = (item?: NewsArticle): NewsFormState => ({
  title: item?.title || '',
  slug: item?.slug || '',
  excerpt: item?.excerpt || '',
  content: item?.content || '',
  category: item?.category || '',
  author: item?.author || '',
  published: item?.published ?? true,
  publishedAt: toDateInput(item?.publishedAt || item?.createdAt),
  imageFile: null,
  removeImage: false,
});

const createActivityState = (item?: Activity): ActivityFormState => ({
  title: item?.title || '',
  description: item?.description || '',
  date: toDateInput(item?.date),
  endDate: toDateInput(item?.endDate),
  location: item?.location || '',
  category: item?.category || 'evento',
  published: item?.published ?? true,
  imageFile: null,
  removeImage: false,
});

const createProjectState = (item?: Project): ProjectFormState => ({
  title: item?.title || '',
  description: item?.description || '',
  status: item?.status || 'planeado',
  startDate: toDateInput(item?.startDate),
  endDate: toDateInput(item?.endDate),
  partners: item?.partners?.join(', ') || '',
  published: item?.published ?? true,
  imageFile: null,
  removeImage: false,
});

const createPublicationState = (item?: Publication): PublicationFormState => ({
  title: item?.title || '',
  author: item?.author || '',
  year: item?.year ? String(item.year) : '',
  type: item?.type || 'documento',
  description: item?.description || '',
  downloadUrl: item?.downloadUrl || '',
  published: item?.published ?? true,
  imageFile: null,
  removeImage: false,
});

const Backoffice: React.FC = () => {
  const navigate = useNavigate();
  const session = adminAuthClient.adapter.useSession();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [isReady, setIsReady] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState<NewsFormState>(createNewsState());
  const [activityForm, setActivityForm] = useState<ActivityFormState>(createActivityState());
  const [projectForm, setProjectForm] = useState<ProjectFormState>(createProjectState());
  const [publicationForm, setPublicationForm] = useState<PublicationFormState>(createPublicationState());
  const isAuthenticated = Boolean(session.data?.session);

  const newsQuery = useAdminNews(isAuthenticated);
  const activitiesQuery = useAdminActivities(isAuthenticated);
  const projectsQuery = useAdminProjects(isAuthenticated);
  const publicationsQuery = useAdminPublications(isAuthenticated);

  const news = newsQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const publications = publicationsQuery.data ?? [];

  useEffect(() => {
    setIsReady(true);
  }, []);

  const invalidateSection = async (section: ContentSection) => {
    const key = cmsQueryKeys[section]('admin')[0];

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [key] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: ({ section, values }: { section: ContentSection; values: Record<string, FormDataEntryValue | null> }) => createItem(section, values),
    onSuccess: async (_, variables) => {
      await invalidateSection(variables.section);
      toast.success('Registo criado com sucesso.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ section, id, values }: { section: ContentSection; id: string; values: Record<string, FormDataEntryValue | null> }) => updateItem(section, id, values),
    onSuccess: async (_, variables) => {
      await invalidateSection(variables.section);
      toast.success('Registo atualizado com sucesso.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ section, id }: { section: ContentSection; id: string }) => deleteItem(section, id),
    onSuccess: async (_, variables) => {
      await invalidateSection(variables.section);
      toast.success('Registo removido com sucesso.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stats = useMemo(
    () => [
      { label: 'Notícias', value: news.length, helper: 'Publicações geridas', icon: Newspaper },
      { label: 'Atividades', value: activities.length, helper: 'Agenda do site', icon: Calendar },
      { label: 'Projetos', value: projects.length, helper: 'Iniciativas acompanhadas', icon: FolderKanban },
      { label: 'Biblioteca', value: publications.length, helper: 'Recursos disponíveis', icon: BookOpen },
    ],
    [activities.length, news.length, projects.length, publications.length]
  );

  if (!isReady || session.isPending) return null;
  if (!session.data?.session) return <Navigate to="/backoffice/login" replace />;

  const logout = async () => {
    await adminAuthClient.adapter.signOut();
    navigate('/backoffice/login', { replace: true });
  };

  const selectedNews = news.find((item) => item.id === editingNewsId);
  const selectedActivity = activities.find((item) => item.id === editingActivityId);
  const selectedProject = projects.find((item) => item.id === editingProjectId);
  const selectedPublication = publications.find((item) => item.id === editingPublicationId);

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsForm(createNewsState());
  };

  const resetActivityForm = () => {
    setEditingActivityId(null);
    setActivityForm(createActivityState());
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjectForm(createProjectState());
  };

  const resetPublicationForm = () => {
    setEditingPublicationId(null);
    setPublicationForm(createPublicationState());
  };

  const handleNewsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      title: newsForm.title,
      slug: newsForm.slug,
      excerpt: newsForm.excerpt,
      content: newsForm.content,
      category: newsForm.category,
      author: newsForm.author,
      published: String(newsForm.published),
      publishedAt: newsForm.publishedAt,
      image: newsForm.imageFile,
      removeImage: String(newsForm.removeImage),
    };

    if (editingNewsId) {
      await updateMutation.mutateAsync({ section: 'news', id: editingNewsId, values });
    } else {
      await createMutation.mutateAsync({ section: 'news', values });
    }

    resetNewsForm();
  };

  const handleActivitySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      title: activityForm.title,
      description: activityForm.description,
      date: activityForm.date,
      endDate: activityForm.endDate,
      location: activityForm.location,
      category: activityForm.category,
      published: String(activityForm.published),
      image: activityForm.imageFile,
      removeImage: String(activityForm.removeImage),
    };

    if (editingActivityId) {
      await updateMutation.mutateAsync({ section: 'activities', id: editingActivityId, values });
    } else {
      await createMutation.mutateAsync({ section: 'activities', values });
    }

    resetActivityForm();
  };

  const handleProjectSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      title: projectForm.title,
      description: projectForm.description,
      status: projectForm.status,
      startDate: projectForm.startDate,
      endDate: projectForm.endDate,
      partners: projectForm.partners,
      published: String(projectForm.published),
      image: projectForm.imageFile,
      removeImage: String(projectForm.removeImage),
    };

    if (editingProjectId) {
      await updateMutation.mutateAsync({ section: 'projects', id: editingProjectId, values });
    } else {
      await createMutation.mutateAsync({ section: 'projects', values });
    }

    resetProjectForm();
  };

  const handlePublicationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      title: publicationForm.title,
      author: publicationForm.author,
      year: publicationForm.year,
      type: publicationForm.type,
      description: publicationForm.description,
      downloadUrl: publicationForm.downloadUrl,
      published: String(publicationForm.published),
      coverImage: publicationForm.imageFile,
      removeImage: String(publicationForm.removeImage),
    };

    if (editingPublicationId) {
      await updateMutation.mutateAsync({ section: 'publications', id: editingPublicationId, values });
    } else {
      await createMutation.mutateAsync({ section: 'publications', values });
    }

    resetPublicationForm();
  };

  const confirmDelete = async (section: ContentSection, id: string, reset: () => void) => {
    const confirmed = window.confirm('Tens a certeza de que queres eliminar este registo?');
    if (!confirmed) return;

    await deleteMutation.mutateAsync({ section, id });
    reset();
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-4">
        {stats.map((item) => (
          <article key={item.label} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">{item.label}</span>
              <item.icon className="h-5 w-5 text-[#3e5c32]" />
            </div>
            <p className="mt-5 font-display text-[2.4rem] text-[#27441d]">{item.value}</p>
            <p className="mt-2 text-sm text-stone-500">{item.helper}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OverviewCard
          title="Últimas notícias"
          items={news.slice(0, 4).map((item) => ({ id: item.id, title: item.title, meta: item.category, extra: item.author }))}
          emptyMessage="Sem notícias registadas."
        />
        <OverviewCard
          title="Próximas atividades"
          items={activities.slice(0, 4).map((item) => ({ id: item.id, title: item.title, meta: item.location || 'Sem local', extra: formatDate(item.date) }))}
          emptyMessage="Sem atividades registadas."
        />
      </div>
    </div>
  );

  const renderSection = () => {
    if (activeSection === 'overview') {
      return renderOverview();
    }

    if (activeSection === 'news') {
      return (
        <CrudLayout
          title="Gestão de notícias"
          description="Cria, edita e publica notícias do site com imagem em Base64 e conteúdo rich text com media embebida."
          listTitle="Notícias registadas"
          items={news}
          renderForm={() => (
            <form className="space-y-4" onSubmit={handleNewsSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Título"><input required value={newsForm.title} onChange={(event) => setNewsForm((current) => ({ ...current, title: event.target.value }))} className={inputClassName} /></Field>
                <Field label="Slug"><input value={newsForm.slug} onChange={(event) => setNewsForm((current) => ({ ...current, slug: event.target.value }))} className={inputClassName} placeholder="gerado automaticamente se vazio" /></Field>
              </div>
              <Field label="Resumo"><textarea required value={newsForm.excerpt} onChange={(event) => setNewsForm((current) => ({ ...current, excerpt: event.target.value }))} className={textareaClassName} rows={3} /></Field>
              <RichTextEditor label="Conteúdo" value={newsForm.content} onChange={(content) => setNewsForm((current) => ({ ...current, content }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Categoria"><input required value={newsForm.category} onChange={(event) => setNewsForm((current) => ({ ...current, category: event.target.value }))} className={inputClassName} /></Field>
                <Field label="Autor"><input required value={newsForm.author} onChange={(event) => setNewsForm((current) => ({ ...current, author: event.target.value }))} className={inputClassName} /></Field>
              </div>
              <Field label="Data de publicação"><input type="date" value={newsForm.publishedAt} onChange={(event) => setNewsForm((current) => ({ ...current, publishedAt: event.target.value }))} className={inputClassName} /></Field>
              <ImageField label="Imagem" currentImage={selectedNews?.image} file={newsForm.imageFile} removeImage={newsForm.removeImage} onFileChange={(file) => setNewsForm((current) => ({ ...current, imageFile: file, removeImage: false }))} onRemoveToggle={(checked) => setNewsForm((current) => ({ ...current, removeImage: checked }))} />
              <CheckboxRow label="Publicado" checked={newsForm.published} onChange={(checked) => setNewsForm((current) => ({ ...current, published: checked }))} />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={primaryButtonClassName} disabled={createMutation.isPending || updateMutation.isPending}><Save className="h-4 w-4" />{editingNewsId ? 'Guardar alterações' : 'Criar notícia'}</button>
                {editingNewsId ? <button type="button" onClick={resetNewsForm} className={secondaryButtonClassName}><X className="h-4 w-4" />Cancelar edição</button> : null}
              </div>
            </form>
          )}
          renderListItem={(item) => (
            <ListItem
              key={item.id}
              title={item.title}
              meta={item.category}
              extra={`${item.author} • ${formatDate(item.publishedAt || item.createdAt)}`}
              image={item.image}
              onEdit={() => {
                setEditingNewsId(item.id);
                setNewsForm(createNewsState(item));
              }}
              onDelete={() => confirmDelete('news', item.id, resetNewsForm)}
            />
          )}
          onCreate={resetNewsForm}
        />
      );
    }

    if (activeSection === 'activities') {
      return (
        <CrudLayout
          title="Gestão de atividades"
          description="Mantém a agenda do site atualizada com datas, local e imagem guardada em Base64."
          listTitle="Atividades registadas"
          items={activities}
          renderForm={() => (
            <form className="space-y-4" onSubmit={handleActivitySubmit}>
              <Field label="Título"><input required value={activityForm.title} onChange={(event) => setActivityForm((current) => ({ ...current, title: event.target.value }))} className={inputClassName} /></Field>
              <Field label="Descrição"><textarea required value={activityForm.description} onChange={(event) => setActivityForm((current) => ({ ...current, description: event.target.value }))} className={textareaClassName} rows={6} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Data"><input required type="date" value={activityForm.date} onChange={(event) => setActivityForm((current) => ({ ...current, date: event.target.value }))} className={inputClassName} /></Field>
                <Field label="Data de fim"><input type="date" value={activityForm.endDate} onChange={(event) => setActivityForm((current) => ({ ...current, endDate: event.target.value }))} className={inputClassName} /></Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Categoria">
                  <select value={activityForm.category} onChange={(event) => setActivityForm((current) => ({ ...current, category: event.target.value as Activity['category'] }))} className={inputClassName}>
                    <option value="caminhada">Caminhada</option>
                    <option value="workshop">Workshop</option>
                    <option value="palestra">Palestra</option>
                    <option value="evento">Evento</option>
                    <option value="formacao">Formação</option>
                  </select>
                </Field>
                <Field label="Local"><input value={activityForm.location} onChange={(event) => setActivityForm((current) => ({ ...current, location: event.target.value }))} className={inputClassName} /></Field>
              </div>
              <ImageField label="Imagem" currentImage={selectedActivity?.image} file={activityForm.imageFile} removeImage={activityForm.removeImage} onFileChange={(file) => setActivityForm((current) => ({ ...current, imageFile: file, removeImage: false }))} onRemoveToggle={(checked) => setActivityForm((current) => ({ ...current, removeImage: checked }))} />
              <CheckboxRow label="Publicado" checked={activityForm.published} onChange={(checked) => setActivityForm((current) => ({ ...current, published: checked }))} />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={primaryButtonClassName} disabled={createMutation.isPending || updateMutation.isPending}><Save className="h-4 w-4" />{editingActivityId ? 'Guardar alterações' : 'Criar atividade'}</button>
                {editingActivityId ? <button type="button" onClick={resetActivityForm} className={secondaryButtonClassName}><X className="h-4 w-4" />Cancelar edição</button> : null}
              </div>
            </form>
          )}
          renderListItem={(item) => (
            <ListItem
              key={item.id}
              title={item.title}
              meta={item.category}
              extra={`${item.location || 'Sem local'} • ${formatDate(item.date)}`}
              image={item.image}
              onEdit={() => {
                setEditingActivityId(item.id);
                setActivityForm(createActivityState(item));
              }}
              onDelete={() => confirmDelete('activities', item.id, resetActivityForm)}
            />
          )}
          onCreate={resetActivityForm}
        />
      );
    }

    if (activeSection === 'projects') {
      return (
        <CrudLayout
          title="Gestão de projetos"
          description="Administra os projetos, estado de execução, datas, parceiros e imagem em Base64."
          listTitle="Projetos registados"
          items={projects}
          renderForm={() => (
            <form className="space-y-4" onSubmit={handleProjectSubmit}>
              <Field label="Título"><input required value={projectForm.title} onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))} className={inputClassName} /></Field>
              <Field label="Descrição"><textarea required value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} className={textareaClassName} rows={6} /></Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Estado">
                  <select value={projectForm.status} onChange={(event) => setProjectForm((current) => ({ ...current, status: event.target.value as Project['status'] }))} className={inputClassName}>
                    <option value="planeado">Planeado</option>
                    <option value="em_curso">Em curso</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </Field>
                <Field label="Data de início"><input required type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value }))} className={inputClassName} /></Field>
                <Field label="Data de fim"><input type="date" value={projectForm.endDate} onChange={(event) => setProjectForm((current) => ({ ...current, endDate: event.target.value }))} className={inputClassName} /></Field>
              </div>
              <Field label="Parceiros"><input value={projectForm.partners} onChange={(event) => setProjectForm((current) => ({ ...current, partners: event.target.value }))} className={inputClassName} placeholder="Separar por vírgulas" /></Field>
              <ImageField label="Imagem" currentImage={selectedProject?.image} file={projectForm.imageFile} removeImage={projectForm.removeImage} onFileChange={(file) => setProjectForm((current) => ({ ...current, imageFile: file, removeImage: false }))} onRemoveToggle={(checked) => setProjectForm((current) => ({ ...current, removeImage: checked }))} />
              <CheckboxRow label="Publicado" checked={projectForm.published} onChange={(checked) => setProjectForm((current) => ({ ...current, published: checked }))} />
              <div className="flex flex-wrap gap-3">
                <button type="submit" className={primaryButtonClassName} disabled={createMutation.isPending || updateMutation.isPending}><Save className="h-4 w-4" />{editingProjectId ? 'Guardar alterações' : 'Criar projeto'}</button>
                {editingProjectId ? <button type="button" onClick={resetProjectForm} className={secondaryButtonClassName}><X className="h-4 w-4" />Cancelar edição</button> : null}
              </div>
            </form>
          )}
          renderListItem={(item) => (
            <ListItem
              key={item.id}
              title={item.title}
              meta={item.status}
              extra={`${item.partners?.join(', ') || 'Sem parceiros'} • ${formatDate(item.startDate)}`}
              image={item.image}
              onEdit={() => {
                setEditingProjectId(item.id);
                setProjectForm(createProjectState(item));
              }}
              onDelete={() => confirmDelete('projects', item.id, resetProjectForm)}
            />
          )}
          onCreate={resetProjectForm}
        />
      );
    }

    return (
      <CrudLayout
        title="Gestão da biblioteca"
        description="Publica livros, artigos, relatórios e documentos, incluindo capa guardada como Base64."
        listTitle="Publicações registadas"
        items={publications}
        renderForm={() => (
          <form className="space-y-4" onSubmit={handlePublicationSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título"><input required value={publicationForm.title} onChange={(event) => setPublicationForm((current) => ({ ...current, title: event.target.value }))} className={inputClassName} /></Field>
              <Field label="Autor"><input required value={publicationForm.author} onChange={(event) => setPublicationForm((current) => ({ ...current, author: event.target.value }))} className={inputClassName} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ano"><input required type="number" value={publicationForm.year} onChange={(event) => setPublicationForm((current) => ({ ...current, year: event.target.value }))} className={inputClassName} /></Field>
              <Field label="Tipo">
                <select value={publicationForm.type} onChange={(event) => setPublicationForm((current) => ({ ...current, type: event.target.value as Publication['type'] }))} className={inputClassName}>
                  <option value="livro">Livro</option>
                  <option value="artigo">Artigo</option>
                  <option value="relatorio">Relatório</option>
                  <option value="tese">Tese</option>
                  <option value="documento">Documento</option>
                </select>
              </Field>
            </div>
            <Field label="Descrição"><textarea required value={publicationForm.description} onChange={(event) => setPublicationForm((current) => ({ ...current, description: event.target.value }))} className={textareaClassName} rows={6} /></Field>
            <Field label="URL de download"><input value={publicationForm.downloadUrl} onChange={(event) => setPublicationForm((current) => ({ ...current, downloadUrl: event.target.value }))} className={inputClassName} placeholder="https://..." /></Field>
            <ImageField label="Capa" currentImage={selectedPublication?.coverImage} file={publicationForm.imageFile} removeImage={publicationForm.removeImage} onFileChange={(file) => setPublicationForm((current) => ({ ...current, imageFile: file, removeImage: false }))} onRemoveToggle={(checked) => setPublicationForm((current) => ({ ...current, removeImage: checked }))} />
            <CheckboxRow label="Publicado" checked={publicationForm.published} onChange={(checked) => setPublicationForm((current) => ({ ...current, published: checked }))} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={primaryButtonClassName} disabled={createMutation.isPending || updateMutation.isPending}><Save className="h-4 w-4" />{editingPublicationId ? 'Guardar alterações' : 'Criar publicação'}</button>
              {editingPublicationId ? <button type="button" onClick={resetPublicationForm} className={secondaryButtonClassName}><X className="h-4 w-4" />Cancelar edição</button> : null}
            </div>
          </form>
        )}
        renderListItem={(item) => (
          <ListItem
            key={item.id}
            title={item.title}
            meta={item.type}
            extra={`${item.author} • ${item.year}`}
            image={item.coverImage}
            onEdit={() => {
              setEditingPublicationId(item.id);
              setPublicationForm(createPublicationState(item));
            }}
            onDelete={() => confirmDelete('publications', item.id, resetPublicationForm)}
          />
        )}
        onCreate={resetPublicationForm}
      />
    );
  };

  return (
    <>
      <SEOHead title="Backoffice — CEISCaramulo" description="Backoffice de gestão do CEISCaramulo." keywords="backoffice, gestão, administração" noindex />
      <div className="min-h-screen bg-[#f3f5ef]">
        <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[300px_1fr]">
          <aside className="border-r border-stone-200 bg-white px-5 py-6">
            <div className="rounded-2xl bg-[#27441d] px-5 py-6 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-[#aed09c]">Backoffice</p>
              <h1 className="mt-3 font-display text-[2rem]">CEISCaramulo</h1>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#aed09c]">{session.data.user.email}</p>
              <p className="mt-3 text-sm text-[#d6e6cb]">Gestão editorial com Prisma, Base64 embebido e CRUD completo.</p>
            </div>

            <nav className="mt-6 grid gap-2" aria-label="Navegação do backoffice">
              {sectionList.map((section) => (
                <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={activeSection === section.id ? 'flex items-center gap-3 rounded-xl bg-[#edf3e8] px-4 py-3 text-left text-sm font-medium text-[#27441d]' : 'flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-stone-600 transition hover:bg-stone-100'}>
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </nav>

            <button type="button" onClick={logout} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600">
              <LogOut className="h-4 w-4" />
              Terminar sessão
            </button>
          </aside>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#27441d]">Painel de gestão</p>
                <h2 className="mt-3 font-display text-[2.6rem] text-[#27441d]">Operação diária do site</h2>
              </div>
              <p className="max-w-xl text-sm leading-[1.8] text-stone-500">Todo o conteúdo principal do site está ligado à base de dados e pronto para edição no backoffice.</p>
            </div>

            {renderSection()}
          </main>
        </div>
      </div>
    </>
  );
};

type CrudLayoutProps<T> = {
  title: string;
  description: string;
  listTitle: string;
  items: T[];
  onCreate: () => void;
  renderForm: () => React.ReactNode;
  renderListItem: (item: T) => React.ReactNode;
};

function CrudLayout<T>({ title, description, listTitle, items, onCreate, renderForm, renderListItem }: CrudLayoutProps<T>) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[2rem] text-[#27441d]">{title}</h2>
            <p className="mt-2 text-sm text-stone-500">{description}</p>
          </div>
          <button type="button" onClick={onCreate} className={secondaryButtonClassName}>
            <Plus className="h-4 w-4" />
            Novo
          </button>
        </div>
        <div className="mt-6">{renderForm()}</div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
        <h3 className="font-display text-[1.7rem] text-[#27441d]">{listTitle}</h3>
        <div className="mt-6 space-y-4">
          {items.map(renderListItem)}
          {items.length === 0 ? <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">Ainda não existem registos.</div> : null}
        </div>
      </section>
    </div>
  );
}

function OverviewCard({ title, items, emptyMessage }: { title: string; items: Array<{ id: string; title: string; meta: string; extra: string }>; emptyMessage: string }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
      <h2 className="font-display text-[2rem] text-[#27441d]">{title}</h2>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">{item.meta}</p>
            <p className="mt-2 text-lg font-semibold text-[#27441d]">{item.title}</p>
            <p className="mt-2 text-sm text-stone-500">{item.extra}</p>
          </div>
        ))}
        {items.length === 0 ? <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">{emptyMessage}</div> : null}
      </div>
    </section>
  );
}

function ListItem({ title, meta, extra, image, onEdit, onDelete }: { title: string; meta: string; extra: string; image?: string | null; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-stone-200 p-4">
      <div className="flex gap-4">
        <img src={getAssetUrl(image)} alt={title} className="h-20 w-20 rounded-xl object-cover ring-1 ring-stone-200" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-stone-500">{meta}</p>
              <p className="mt-1 text-lg font-semibold text-[#27441d]">{title}</p>
              <p className="mt-2 text-sm text-stone-500">{extra}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onEdit} className={secondaryButtonClassName}><Pencil className="h-4 w-4" />Editar</button>
              <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"><Trash2 className="h-4 w-4" />Apagar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-stone-600">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-600">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function ImageField({ label, currentImage, file, removeImage, onFileChange, onRemoveToggle }: { label: string; currentImage?: string | null; file: File | null; removeImage: boolean; onFileChange: (file: File | null) => void; onRemoveToggle: (checked: boolean) => void }) {
  const preview = file ? URL.createObjectURL(file) : currentImage ? getAssetUrl(currentImage) : null;

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 p-4">
      <p className="text-sm text-stone-600">{label}</p>
      {preview ? <img src={preview} alt={label} className="h-32 w-full rounded-xl object-cover md:w-56" /> : <div className="rounded-xl border border-dashed border-stone-300 px-4 py-8 text-sm text-stone-500">Sem imagem.</div>}
      <input type="file" accept="image/*" onChange={(event) => onFileChange(event.target.files?.[0] || null)} className="block w-full text-sm text-stone-600" />
      {currentImage ? <CheckboxRow label="Remover imagem atual" checked={removeImage} onChange={onRemoveToggle} /> : null}
    </div>
  );
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

const inputClassName = 'h-12 rounded-xl border border-stone-200 bg-stone-50 px-4 outline-none transition focus:border-[#3e5c32]';
const textareaClassName = 'rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-[#3e5c32]';
const primaryButtonClassName = 'inline-flex items-center gap-2 rounded-xl bg-[#27441d] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2f5224]';
const secondaryButtonClassName = 'inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50';

export default Backoffice;
