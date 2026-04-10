import { useQuery } from '@tanstack/react-query';
import { fetchCollection, fetchComments, fetchItem, fetchStats } from '../lib/api';
import type { ContentSection } from '../types';

export const cmsQueryKeys = {
  stats: ['admin-stats'] as const,
  news: (scope: 'public' | 'admin') => ['news', scope] as const,
  newsItem: (identifier: string, scope: 'public' | 'admin') => ['news-item', identifier, scope] as const,
  activities: (scope: 'public' | 'admin') => ['activities', scope] as const,
  activityItem: (id: string, scope: 'public' | 'admin') => ['activity-item', id, scope] as const,
  projects: (scope: 'public' | 'admin') => ['projects', scope] as const,
  projectItem: (id: string, scope: 'public' | 'admin') => ['project-item', id, scope] as const,
  publications: (scope: 'public' | 'admin') => ['publications', scope] as const,
  publicationItem: (id: string, scope: 'public' | 'admin') => ['publication-item', id, scope] as const,
  comments: (section: ContentSection, identifier: string) => ['comments', section, identifier] as const,
};

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.stats,
    queryFn: fetchStats,
    enabled,
  });
}

export function usePublicNews() {
  return useQuery({
    queryKey: cmsQueryKeys.news('public'),
    queryFn: () => fetchCollection('news', 'public'),
  });
}

export function useAdminNews(enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.news('admin'),
    queryFn: () => fetchCollection('news', 'admin'),
    enabled,
  });
}

export function useNewsArticle(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.newsItem(slug, 'public'),
    queryFn: () => fetchItem('news', slug, 'public'),
    enabled: Boolean(slug),
  });
}

export function usePublicActivities() {
  return useQuery({
    queryKey: cmsQueryKeys.activities('public'),
    queryFn: () => fetchCollection('activities', 'public'),
  });
}

export function useAdminActivities(enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.activities('admin'),
    queryFn: () => fetchCollection('activities', 'admin'),
    enabled,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: cmsQueryKeys.activityItem(id, 'public'),
    queryFn: () => fetchItem('activities', id, 'public'),
    enabled: Boolean(id),
  });
}

export function usePublicProjects() {
  return useQuery({
    queryKey: cmsQueryKeys.projects('public'),
    queryFn: () => fetchCollection('projects', 'public'),
  });
}

export function useAdminProjects(enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.projects('admin'),
    queryFn: () => fetchCollection('projects', 'admin'),
    enabled,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: cmsQueryKeys.projectItem(id, 'public'),
    queryFn: () => fetchItem('projects', id, 'public'),
    enabled: Boolean(id),
  });
}

export function usePublicPublications() {
  return useQuery({
    queryKey: cmsQueryKeys.publications('public'),
    queryFn: () => fetchCollection('publications', 'public'),
  });
}

export function useAdminPublications(enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.publications('admin'),
    queryFn: () => fetchCollection('publications', 'admin'),
    enabled,
  });
}

export function usePublication(id: string) {
  return useQuery({
    queryKey: cmsQueryKeys.publicationItem(id, 'public'),
    queryFn: () => fetchItem('publications', id, 'public'),
    enabled: Boolean(id),
  });
}

export function useContentComments(section: ContentSection, identifier: string, enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.comments(section, identifier),
    queryFn: () => fetchComments(section, identifier),
    enabled: enabled && Boolean(identifier),
  });
}
