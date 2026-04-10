import type { Activity, Project, Publication } from '@/types';

function normalizeForSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getActivitySlug(activity: Pick<Activity, 'id' | 'title'>) {
  return normalizeForSlug(activity.title) || activity.id;
}

export function getProjectSlug(project: Pick<Project, 'id' | 'title'>) {
  return normalizeForSlug(project.title) || project.id;
}

export function getPublicationSlug(publication: Pick<Publication, 'id' | 'title'>) {
  return normalizeForSlug(publication.title) || publication.id;
}
