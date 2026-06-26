/* @vitest-environment node */

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  activityCreate,
  activityFindUnique,
  activityUpdate,
  requireAdminContextFromRequest,
  appendAuditLog,
  hasAdminPermission,
  enqueueActivityPublishedNotifications,
  storePublicUpload,
} = vi.hoisted(() => ({
  activityCreate: vi.fn(),
  activityFindUnique: vi.fn(),
  activityUpdate: vi.fn(),
  requireAdminContextFromRequest: vi.fn(),
  appendAuditLog: vi.fn(),
  hasAdminPermission: vi.fn(),
  enqueueActivityPublishedNotifications: vi.fn(),
  storePublicUpload: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    activity: {
      create: activityCreate,
      findUnique: activityFindUnique,
      update: activityUpdate,
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    contentComment: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/newsletter-on-publish', () => ({
  enqueueActivityPublishedNotifications,
  enqueueNewsPublishedNotifications: vi.fn(),
}));

vi.mock('@/lib/upload-storage', () => ({
  storePublicUpload,
}));

vi.mock('@/app/api/_lib/cms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api/_lib/cms')>();
  return {
    ...actual,
    requireAdminContextFromRequest,
    appendAuditLog,
    hasAdminPermission,
  };
});

function activityForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set('title', overrides.title ?? 'Atividade');
  formData.set('description', overrides.description ?? '<p>Descricao</p>');
  formData.set('date', overrides.date ?? '2026-07-10T10:00:00.000Z');
  formData.set('endDate', overrides.endDate ?? '');
  formData.set('location', overrides.location ?? 'Caramulo');
  formData.set('category', overrides.category ?? 'caminhada');
  formData.set('published', overrides.published ?? 'true');
  return formData;
}

describe('activities content API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminContextFromRequest.mockResolvedValue({
      context: { email: 'owner@ceis.pt', role: 'owner', permissions: ['activities'] },
      error: null,
    });
    hasAdminPermission.mockReturnValue(true);
    appendAuditLog.mockResolvedValue(undefined);
    storePublicUpload.mockResolvedValue({ publicUrl: 'https://blob.example/backoffice/activities/capa.png' });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('POST /api/[section] notifies newsletter subscribers when creating a published activity', async () => {
    activityCreate.mockResolvedValue({
      id: 'activity-1',
      title: 'Atividade',
      description: '<p>Descricao</p>',
      date: new Date('2026-07-10T10:00:00.000Z'),
      endDate: null,
      location: 'Caramulo',
      category: 'caminhada',
      published: true,
      image: null,
    });

    const { POST } = await import('@/app/api/[section]/route');
    const response = await POST(
      new NextRequest('http://localhost/api/activities', {
        method: 'POST',
        body: activityForm(),
      }),
      { params: Promise.resolve({ section: 'activities' }) }
    );

    expect(response.status).toBe(201);
    expect(activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        category: 'caminhada',
      }),
    });
    expect(enqueueActivityPublishedNotifications).toHaveBeenCalledWith(null, {
      id: 'activity-1',
      title: 'Atividade',
      description: '<p>Descricao</p>',
      published: true,
    });
  });

  it('POST /api/[section] stores the activity cover image as a public upload URL', async () => {
    activityCreate.mockImplementation(async ({ data }) => ({
      id: 'activity-cover',
      ...data,
    }));

    const formData = activityForm({ category: 'workshop' });
    formData.set('image', new File(['cover'], 'capa.png', { type: 'image/png' }));

    const { POST } = await import('@/app/api/[section]/route');
    const response = await POST(
      new NextRequest('http://localhost/api/activities', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ section: 'activities' }) }
    );

    expect(response.status).toBe(201);
    expect(storePublicUpload).toHaveBeenCalled();
    expect(activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        category: 'workshop',
        image: 'https://blob.example/backoffice/activities/capa.png',
      }),
    });
  });

  it('PUT /api/[section]/[identifier] notifies only when an activity first becomes published', async () => {
    activityFindUnique.mockResolvedValue({
      id: 'activity-1',
      title: 'Atividade antiga',
      description: '<p>Antiga</p>',
      date: new Date('2026-07-10T10:00:00.000Z'),
      published: false,
    });
    activityUpdate.mockResolvedValue({
      id: 'activity-1',
      title: 'Atividade nova',
      description: '<p>Nova</p>',
      date: new Date('2026-07-10T10:00:00.000Z'),
      published: true,
    });

    const { PUT } = await import('@/app/api/[section]/[identifier]/route');
    const response = await PUT(
      new NextRequest('http://localhost/api/activities/activity-1', {
        method: 'PUT',
        body: activityForm({ title: 'Atividade nova', description: '<p>Nova</p>', published: 'true' }),
      }),
      { params: Promise.resolve({ section: 'activities', identifier: 'activity-1' }) }
    );

    expect(response.status).toBe(200);
    expect(enqueueActivityPublishedNotifications).toHaveBeenCalledWith(false, {
      id: 'activity-1',
      title: 'Atividade nova',
      description: '<p>Nova</p>',
      published: true,
    });
  });
});
