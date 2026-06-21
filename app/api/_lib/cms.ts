import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@/src/generated/prisma/client';
import prisma from '@/lib/prisma';
import { withPublicGalleryAssets } from '@/lib/gallery-public-assets';
import { isPublicDbQuotaExceededError, markPublicDbQuotaExceeded, shouldSkipPublicDb } from '@/lib/public-db-guard';
import { galleryItems as staticGalleryItems } from '@/data/content';
import { defaultSiteLayoutSettings, deepMergeSettings, SITE_LAYOUT_SETTINGS_KEY } from '@/lib/site-layout';
import { getAdminAuthSession } from '@/lib/admin-auth-server';
import type { AdminPermission, GalleryMediaItem, GalleryMediaType, SiteLayoutSettings } from '@/types';

// Tipos suportados pelas secções públicas/administráveis do CMS.
export type ContentSection = 'news' | 'activities' | 'projects' | 'publications';

// Perfis de administração suportados no backoffice.
export type AdminRole = 'owner' | 'editor';
export const ADMIN_PERMISSION_KEYS = ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'admins', 'audit'] as const;
const ADMIN_PERMISSIONS_STORAGE_KEY = 'admin_permissions';
const DEFAULT_EDITOR_PERMISSIONS: AdminPermission[] = ['news', 'activities', 'projects', 'publications', 'contacts', 'gallery', 'layout', 'audit'];

export type AdminUserRecord = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type AuditLogRecord = {
  id: string;
  createdAt: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type AdminContext = {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

type GalleryMediaRecord = GalleryMediaItem;

type SectionConfig = {
  listOrder: Record<string, 'asc' | 'desc'>;
  publicWhere: Record<string, unknown>;
  findUnique: (identifier: string) => Record<string, unknown>;
  uploadField: 'image' | 'coverImage';
};

const MAX_AUDIT_LOGS = 500;
const GALLERY_MEDIA_STORAGE_KEY = 'gallery_media_items';
const OLD_FOOTER_BRAND_DESCRIPTION =
  'Promovendo o estudo, a preservação e a valorização do património natural e cultural da Serra do Caramulo.';
const REQUESTED_FOOTER_BRAND_DESCRIPTION =
  'promover o estudo e a investigação nos vários domínios e interesses, designadamente ambiental, geográfico, biológico, geológico, histórico, etnográfico, gastronómico, ..., da Serra do Caramulo';

// Configuração transversal por secção.
export const sectionConfig: Record<ContentSection, SectionConfig> = {
  news: {
    listOrder: { publishedAt: 'desc' },
    publicWhere: { published: true },
    findUnique: (identifier) => ({ OR: [{ id: identifier }, { slug: identifier }] }),
    uploadField: 'image',
  },
  activities: {
    listOrder: { date: 'asc' },
    publicWhere: { published: true },
    findUnique: (identifier) => ({ id: identifier }),
    uploadField: 'image',
  },
  projects: {
    listOrder: { startDate: 'desc' },
    publicWhere: { published: true },
    findUnique: (identifier) => ({ id: identifier }),
    uploadField: 'image',
  },
  publications: {
    listOrder: { year: 'desc' },
    publicWhere: { published: true },
    findUnique: (identifier) => ({ id: identifier }),
    uploadField: 'coverImage',
  },
};

// Ponte para os delegates Prisma de cada secção.
export const sectionModel: Record<ContentSection, unknown> = {
  news: prisma.news,
  activities: prisma.activity,
  projects: prisma.project,
  publications: prisma.publication,
};

// Fornece uma interface comum sobre delegates Prisma heterogéneos.
export function getSectionModel(section: ContentSection) {
  return sectionModel[section] as {
    findMany: (args: { where: Record<string, unknown>; orderBy: Record<string, 'asc' | 'desc'> }) => Promise<unknown[]>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<({ id: string } & Record<string, unknown>) | null>;
    findUnique: (args: { where: { id: string } }) => Promise<({ id: string } & Record<string, unknown>) | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
}

// Verifica se um valor textual corresponde a uma secção válida.
export function isContentSection(value: string): value is ContentSection {
  return value in sectionConfig;
}

// Validação simples de email para comentários/inputs públicos.
export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Resposta JSON de erro padronizada.
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

const UPLOAD_STORAGE_KEY_PREFIX = 'upload:backoffice:';

// Converte ficheiro recebido para Data URL (compatível com implementação atual).
export async function fileToDataUrl(file: File) {
  const mimeType = file.type || 'application/octet-stream';
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  if (!base64) {
    throw new Error('Não foi possível converter o ficheiro enviado.');
  }

  return `data:${mimeType};base64,${base64}`;
}

// Conversões auxiliares para parsing de formulário.
export function booleanFromForm(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

export function emptyToNull(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

export function toDate(value: unknown) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function requiredDate(value: unknown) {
  const parsed = toDate(value);

  if (!parsed) {
    throw new Error('Data inválida.');
  }

  return parsed;
}

export function slugify(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parsePartners(value: unknown) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const adminEmails = String(process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

// Compatibilidade com deployments onde o Prisma Client em memória ainda não expõe novos delegates.
async function getSiteSettingValue(key: string) {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

async function setSiteSettingValue(key: string, value: string) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

// Faz parse seguro de JSON vindo das definições persistidas.
export async function getStoredUploadedFile(relativePathSegments: string[]) {
  const relativePath = relativePathSegments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');

  if (!relativePath || relativePath.includes('..') || !/^[a-z0-9-]+\/[a-z0-9._-]+$/i.test(relativePath)) {
    return null;
  }

  return getSiteSettingValue(`${UPLOAD_STORAGE_KEY_PREFIX}${relativePath}`);
}

function safeJsonParse<T>(value: string | null, fallback: T) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Obtém as definições de layout do site com fallback para valores por omissão.
export async function getSiteLayoutSettings(): Promise<SiteLayoutSettings> {
  const prismaAny = prisma as unknown as {
    siteLayout?: { findUnique: (args: { where: { key: string } }) => Promise<{ value: unknown } | null> };
  };

  const stored = prismaAny.siteLayout
    ? await prismaAny.siteLayout.findUnique({ where: { key: 'global' } })
    : null;

  const fallbackRaw = stored ? null : await getSiteSettingValue(SITE_LAYOUT_SETTINGS_KEY);
  const parsed = safeJsonParse<unknown>(stored ? JSON.stringify(stored.value) : fallbackRaw, {});
  const settings = deepMergeSettings(defaultSiteLayoutSettings, parsed);

  return {
    ...settings,
    footer: {
      ...settings.footer,
      brandDescription:
        settings.footer.brandDescription === OLD_FOOTER_BRAND_DESCRIPTION
          ? REQUESTED_FOOTER_BRAND_DESCRIPTION
          : settings.footer.brandDescription,
    },
  };
}

// Persiste as definições completas de layout do site.
export async function saveSiteLayoutSettings(settings: SiteLayoutSettings) {
  const serialized = settings as unknown as Prisma.InputJsonValue;

  const prismaAny = prisma as unknown as {
    siteLayout?: {
      upsert: (args: {
        where: { key: string };
        create: { key: string; value: Prisma.InputJsonValue };
        update: { value: Prisma.InputJsonValue };
      }) => Promise<unknown>;
    };
  };

  if (!prismaAny.siteLayout) {
    await setSiteSettingValue(SITE_LAYOUT_SETTINGS_KEY, JSON.stringify(settings));
    return;
  }

  await prismaAny.siteLayout.upsert({
    where: { key: 'global' },
    create: { key: 'global', value: serialized },
    update: { value: serialized },
  });
}

function normalizeRole(value: unknown): AdminRole {
  return value === 'owner' ? 'owner' : 'editor';
}

function normalizePermissions(value: unknown, role: AdminRole): AdminPermission[] {
  if (role === 'owner') {
    return [...ADMIN_PERMISSION_KEYS];
  }

  if (!Array.isArray(value)) {
    return [...DEFAULT_EDITOR_PERMISSIONS];
  }

  return value
    .map((item) => String(item))
    .filter((item): item is AdminPermission => ADMIN_PERMISSION_KEYS.includes(item as AdminPermission));
}

async function getStoredAdminPermissions() {
  const raw = await getSiteSettingValue(ADMIN_PERMISSIONS_STORAGE_KEY);
  const parsed = safeJsonParse<Record<string, unknown>>(raw, {});
  const result = new Map<string, AdminPermission[]>();

  for (const [email, permissions] of Object.entries(parsed)) {
    result.set(email.trim().toLowerCase(), normalizePermissions(permissions, 'editor'));
  }

  return result;
}

async function saveStoredAdminPermissions(records: Map<string, AdminPermission[]>) {
  const serialized: Record<string, AdminPermission[]> = {};

  for (const [email, permissions] of records.entries()) {
    serialized[email] = permissions;
  }

  await setSiteSettingValue(ADMIN_PERMISSIONS_STORAGE_KEY, JSON.stringify(serialized));
}

export async function saveAdminPermissions(email: string, permissions: AdminPermission[]) {
  const records = await getStoredAdminPermissions();
  records.set(email.trim().toLowerCase(), normalizePermissions(permissions, 'editor'));
  await saveStoredAdminPermissions(records);
}

export async function deleteAdminPermissions(email: string) {
  const records = await getStoredAdminPermissions();
  records.delete(email.trim().toLowerCase());
  await saveStoredAdminPermissions(records);
}

function normalizeAdminRecord(value: unknown): AdminUserRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const email = String(candidate.email || '').trim().toLowerCase();

  if (!email) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: String(candidate.id || crypto.randomUUID()),
    email,
    role: normalizeRole(candidate.role),
    permissions: normalizePermissions(candidate.permissions, normalizeRole(candidate.role)),
    active: candidate.active !== false,
    createdAt: String(candidate.createdAt || now),
    updatedAt: String(candidate.updatedAt || now),
    createdBy: candidate.createdBy ? String(candidate.createdBy) : null,
  };
}

function defaultEnvAdmins(): AdminUserRecord[] {
  const now = new Date().toISOString();

  return adminEmails.map((email) => ({
    id: `env:${email}`,
    email,
    role: 'owner' as const,
    permissions: [...ADMIN_PERMISSION_KEYS],
    active: true,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
  }));
}

// Devolve a lista de admins efetivos (base de dados + variáveis de ambiente).
export async function listAdminUsers() {
  const prismaAny = prisma as unknown as {
    adminUser?: {
      findMany: (args: { orderBy: { email: 'asc' } }) => Promise<
        Array<{
          id: string;
          email: string;
          role: 'owner' | 'editor';
          active: boolean;
          createdAt: Date;
          updatedAt: Date;
          createdBy: string | null;
        }>
      >;
    };
  };

  const storedPermissions = await getStoredAdminPermissions();
  const fromDatabase = prismaAny.adminUser
    ? await prismaAny.adminUser.findMany({ orderBy: { email: 'asc' } })
    : [];

  const fromStorage = fromDatabase
    .map((item) =>
      normalizeAdminRecord({
        id: item.id,
        email: item.email,
        role: item.role,
        permissions: storedPermissions.get(item.email.toLowerCase()) ?? undefined,
        active: item.active,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        createdBy: item.createdBy,
      })
    )
    .filter((item): item is AdminUserRecord => Boolean(item));

  const mergedByEmail = new Map<string, AdminUserRecord>();

  for (const admin of fromStorage) {
    mergedByEmail.set(admin.email, admin);
  }

  if (!prismaAny.adminUser) {
    const storedValue = await getSiteSettingValue('admin_users');
    const parsed = safeJsonParse<unknown[]>(storedValue, []);
    for (const item of parsed) {
      const normalized = normalizeAdminRecord(item);
      if (normalized) {
        mergedByEmail.set(normalized.email, normalized);
      }
    }
  }

  for (const envAdmin of defaultEnvAdmins()) {
    mergedByEmail.set(envAdmin.email, envAdmin);
  }

  return Array.from(mergedByEmail.values()).sort((a, b) => a.email.localeCompare(b.email));
}

// Guarda apenas admins editáveis (não sobrescreve admins definidos por ENV).
export async function saveAdminUsers(records: AdminUserRecord[]) {
  const envEmailSet = new Set(adminEmails);
  const persistable = records.filter((record) => !envEmailSet.has(record.email));

  const prismaAny = prisma as unknown as {
    adminUser?: {
      deleteMany: (args: { where: { email: { notIn: string[] } } }) => Promise<unknown>;
      upsert: (args: {
        where: { email: string };
        create: { email: string; role: 'owner' | 'editor'; active: boolean; createdBy: string | null };
        update: { role: 'owner' | 'editor'; active: boolean; createdBy: string | null };
      }) => Promise<unknown>;
    };
  };

  if (!prismaAny.adminUser) {
    await setSiteSettingValue('admin_users', JSON.stringify(persistable));
    const permissionsRecords = new Map<string, AdminPermission[]>();
    for (const record of persistable) {
      permissionsRecords.set(record.email, normalizePermissions(record.permissions, record.role));
    }
    await saveStoredAdminPermissions(permissionsRecords);
    return;
  }

  const adminUserModel = prismaAny.adminUser;

  await adminUserModel.deleteMany({
    where: {
      email: {
        notIn: persistable.map((record) => record.email),
      },
    },
  });

  for (const record of persistable) {
    await adminUserModel.upsert({
      where: { email: record.email },
      create: {
        email: record.email,
        role: record.role,
        active: record.active,
        createdBy: record.createdBy,
      },
      update: {
        role: record.role,
        active: record.active,
        createdBy: record.createdBy,
      },
    });
  }

  const permissionsRecords = new Map<string, AdminPermission[]>();
  for (const record of persistable) {
    permissionsRecords.set(record.email, normalizePermissions(record.permissions, record.role));
  }
  await saveStoredAdminPermissions(permissionsRecords);
}

export async function getAdminByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const storedPermissions = await getStoredAdminPermissions();

  const prismaAny = prisma as unknown as {
    adminUser?: {
      findUnique: (args: { where: { email: string } }) => Promise<{
        id: string;
        email: string;
        role: 'owner' | 'editor';
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
      } | null>;
    };
  };

  const dbAdmin = prismaAny.adminUser
    ? await prismaAny.adminUser.findUnique({ where: { email: normalizedEmail } })
    : null;

  if (dbAdmin) {
    return normalizeAdminRecord({
      id: dbAdmin.id,
      email: dbAdmin.email,
      role: dbAdmin.role,
      permissions: storedPermissions.get(dbAdmin.email.toLowerCase()) ?? undefined,
      active: dbAdmin.active,
      createdAt: dbAdmin.createdAt.toISOString(),
      updatedAt: dbAdmin.updatedAt.toISOString(),
      createdBy: dbAdmin.createdBy,
    });
  }

  if (adminEmails.includes(normalizedEmail)) {
    const now = new Date().toISOString();
    return {
      id: `env:${normalizedEmail}`,
      email: normalizedEmail,
      role: 'owner',
      permissions: [...ADMIN_PERMISSION_KEYS],
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    } as AdminUserRecord;
  }

  return null;
}

// Resolve contexto de admin com email e papel, validando a sessão administrativa.
export async function requireAdminContextFromRequest(request: NextRequest) {
  try {
    const session = await getAdminAuthSession(request);
    const email = session.email;

    if (!email) {
      return {
        context: null,
        error: jsonError('A conta autenticada não tem acesso ao backoffice.', 403),
      };
    }

    const prismaAny = prisma as unknown as {
      adminUser?: {
        count: () => Promise<number>;
        create: (args: {
          data: { email: string; role: 'owner' | 'editor'; active: boolean; createdBy: string };
        }) => Promise<unknown>;
      };
    };

    // Bootstrap automático: primeira conta autenticada torna-se owner quando não há admins configurados.
    if (prismaAny.adminUser && adminEmails.length === 0) {
      const adminsCount = await prismaAny.adminUser.count();
      if (adminsCount === 0) {
        await prismaAny.adminUser.create({
          data: {
            email,
            role: 'owner',
            active: true,
            createdBy: 'bootstrap',
          },
        });
      }
    }

    const admin = await getAdminByEmail(email);

    if (!admin && adminEmails.length === 0) {
      return {
        context: {
          email,
          role: 'owner',
          permissions: [...ADMIN_PERMISSION_KEYS],
        } as AdminContext,
        error: null,
      };
    }

    if (!admin || !admin.active) {
      return {
        context: null,
        error: jsonError('A conta autenticada não tem acesso ao backoffice.', 403),
      };
    }

    return {
      context: {
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      } as AdminContext,
      error: null,
    };
  } catch (error) {
    return {
      context: null,
      error: jsonError(error instanceof Error ? error.message : 'Não foi possível validar a sessão administrativa.', 401),
    };
  }
}

export async function requireAdminFromRequest(request: NextRequest) {
  const { error } = await requireAdminContextFromRequest(request);
  return error;
}

// Verifica se o contexto autenticado tem permissões de gestão de admins.
export function canManageAdmins(context: AdminContext) {
  return context.role === 'owner' || context.permissions.includes('admins');
}

export function hasAdminPermission(context: AdminContext, permission: AdminPermission) {
  return context.role === 'owner' || context.permissions.includes(permission);
}

export function getSectionPermission(section: ContentSection): AdminPermission {
  return section;
}

function normalizeAuditLogRecord(value: unknown): AuditLogRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = String(candidate.id || '');
  const createdAt = String(candidate.createdAt || '');
  const actorEmail = String(candidate.actorEmail || '');
  const action = String(candidate.action || '');
  const targetType = String(candidate.targetType || '');

  if (!id || !createdAt || !actorEmail || !action || !targetType) {
    return null;
  }

  return {
    id,
    createdAt,
    actorEmail,
    actorRole: normalizeRole(candidate.actorRole),
    action,
    targetType,
    targetId: candidate.targetId ? String(candidate.targetId) : null,
    summary: String(candidate.summary || ''),
    before: candidate.before && typeof candidate.before === 'object' ? (candidate.before as Record<string, unknown>) : null,
    after: candidate.after && typeof candidate.after === 'object' ? (candidate.after as Record<string, unknown>) : null,
  };
}

function serializeForAudit(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return { value: String(value) };
  }
}

// Lista os eventos de auditoria por ordem decrescente de criação.
export async function listAuditLogs() {
  const prismaAny = prisma as unknown as {
    adminAuditLog?: {
      findMany: (args: { orderBy: { createdAt: 'desc' }; take: number }) => Promise<
        Array<{
          id: string;
          createdAt: Date;
          actorEmail: string;
          actorRole: 'owner' | 'editor';
          action: string;
          targetType: string;
          targetId: string | null;
          summary: string;
          before: unknown;
          after: unknown;
        }>
      >;
    };
  };

  if (!prismaAny.adminAuditLog) {
    const storedValue = await getSiteSettingValue('admin_audit_logs');
    const parsed = safeJsonParse<unknown[]>(storedValue, []);

    return parsed
      .map((item) => normalizeAuditLogRecord(item))
      .filter((item): item is AuditLogRecord => Boolean(item))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const logs = await prismaAny.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: MAX_AUDIT_LOGS,
  });

  return logs
    .map((item) =>
      normalizeAuditLogRecord({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        actorEmail: item.actorEmail,
        actorRole: item.actorRole,
        action: item.action,
        targetType: item.targetType,
        targetId: item.targetId,
        summary: item.summary,
        before: item.before,
        after: item.after,
      })
    )
    .filter((item): item is AuditLogRecord => Boolean(item))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Regista um evento de auditoria com metadados de ator e alterações.
export async function appendAuditLog(input: {
  actor: AdminContext;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
}) {
  const prismaAny = prisma as unknown as {
    adminUser?: {
      findUnique: (args: { where: { email: string } }) => Promise<{ id: string } | null>;
    };
    adminAuditLog?: {
      create: (args: {
        data: {
          actorId: string | null;
          actorEmail: string;
          actorRole: 'owner' | 'editor';
          action: string;
          targetType: string;
          targetId: string | null;
          summary: string;
          before: unknown;
          after: unknown;
        };
      }) => Promise<unknown>;
    };
  };

  if (!prismaAny.adminAuditLog) {
    const logs = await listAuditLogs();
    const entry: AuditLogRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary,
      before: serializeForAudit(input.before),
      after: serializeForAudit(input.after),
    };

    await setSiteSettingValue('admin_audit_logs', JSON.stringify([entry, ...logs].slice(0, MAX_AUDIT_LOGS)));
    return;
  }

  const actor = prismaAny.adminUser
    ? await prismaAny.adminUser.findUnique({ where: { email: input.actor.email } })
    : null;

  await prismaAny.adminAuditLog.create({
    data: {
      actorId: actor?.id ?? null,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary,
      before: serializeForAudit(input.before),
      after: serializeForAudit(input.after),
    },
  });
}

// Resolve o item de conteúdo por identificador e secção.
export async function findContent(section: ContentSection, identifier: string, scope: 'public' | 'admin') {
  const config = sectionConfig[section];
  const model = getSectionModel(section);

  return model.findFirst({
    where: {
      ...config.findUnique(identifier),
      ...(scope === 'admin' ? {} : config.publicWhere),
    },
  });
}

// Extrai dados de create/update por secção a partir de FormData.
export async function parseSectionFormData(
  section: ContentSection,
  formData: FormData,
  currentItem?: Record<string, unknown> | null
) {
  const config = sectionConfig[section];
  const removeImage = booleanFromForm(formData.get('removeImage'));
  const rawFile = formData.get(config.uploadField);
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  const currentAsset = currentItem?.[config.uploadField] as string | null | undefined;
  const resolvedAsset = file ? await fileToDataUrl(file) : removeImage ? null : (currentAsset ?? null);

  if (section === 'news') {
    const published = booleanFromForm(formData.get('published'));

    return {
      title: String(formData.get('title') || ''),
      slug: String(formData.get('slug') || '') || slugify(String(formData.get('title') || '')),
      excerpt: String(formData.get('excerpt') || ''),
      content: String(formData.get('content') || ''),
      category: 'Geral',
      author: String(formData.get('author') || ''),
      published,
      publishedAt: published ? toDate(formData.get('publishedAt')) || (currentItem?.publishedAt as Date | null) || new Date() : null,
      image: resolvedAsset,
    };
  }

  if (section === 'activities') {
    return {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      date: requiredDate(formData.get('date')),
      endDate: toDate(formData.get('endDate')),
      location: emptyToNull(formData.get('location')),
      category: 'evento',
      published: booleanFromForm(formData.get('published')),
      image: resolvedAsset,
    };
  }

  if (section === 'projects') {
    return {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      status: String(formData.get('status') || ''),
      startDate: requiredDate(formData.get('startDate')),
      endDate: toDate(formData.get('endDate')),
      partners: parsePartners(formData.get('partners')),
      published: booleanFromForm(formData.get('published')),
      image: resolvedAsset,
    };
  }

  return {
    title: String(formData.get('title') || ''),
    author: String(formData.get('author') || ''),
    year: Number(formData.get('year')),
    type: String(formData.get('type') || ''),
    description: String(formData.get('description') || ''),
    downloadUrl: emptyToNull(formData.get('downloadUrl')),
    published: booleanFromForm(formData.get('published')),
    coverImage: resolvedAsset,
  };
}

function normalizeGalleryType(value: unknown): GalleryMediaType {
  if (value === 'video' || value === 'audio') {
    return value;
  }

  return 'photo';
}

function normalizeGalleryRecord(value: unknown): GalleryMediaRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const now = new Date().toISOString();
  const source = String(candidate.source || '').trim();

  if (!source) {
    return null;
  }

  return {
    id: String(candidate.id || crypto.randomUUID()),
    title: String(candidate.title || '').trim() || 'Sem título',
    description: candidate.description ? String(candidate.description) : null,
    type: normalizeGalleryType(candidate.type),
    source,
    thumbnail: candidate.thumbnail ? String(candidate.thumbnail) : null,
    mimeType: candidate.mimeType ? String(candidate.mimeType) : null,
    published: candidate.published !== false,
    createdAt: String(candidate.createdAt || now),
    updatedAt: String(candidate.updatedAt || now),
  };
}

async function listGalleryFromStorage() {
  const raw = await getSiteSettingValue(GALLERY_MEDIA_STORAGE_KEY);
  const parsed = safeJsonParse<unknown[]>(raw, []);

  return parsed
    .map((item) => normalizeGalleryRecord(item))
    .filter((item): item is GalleryMediaRecord => Boolean(item))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function saveGalleryToStorage(items: GalleryMediaRecord[]) {
  await setSiteSettingValue(GALLERY_MEDIA_STORAGE_KEY, JSON.stringify(items));
}

function getStaticGalleryFallback(): GalleryMediaRecord[] {
  return staticGalleryItems.map((item) => {
    const fallbackDate = item.date ? new Date(item.date) : new Date();

    return {
      id: item.id,
      title: item.title,
      description: item.category || null,
      type: item.type === 'foto' ? 'photo' : item.type === 'video' ? 'video' : 'audio',
      source: item.url,
      thumbnail: item.type === 'foto' ? item.url : null,
      mimeType: null,
      published: true,
      createdAt: fallbackDate.toISOString(),
      updatedAt: fallbackDate.toISOString(),
    };
  });
}

function isRetryableGalleryConnectionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === 'P1017' ||
    String(candidate.message || '').includes('exceeded the data transfer quota') ||
    String(candidate.message || '').includes('Server has closed the connection') ||
    String(candidate.message || '').includes('bytes remaining on stream')
  );
}

async function retryGalleryQuery<T>(query: () => Promise<T>) {
  try {
    return await query();
  } catch (error) {
    if (!isRetryableGalleryConnectionError(error)) {
      throw error;
    }

    console.warn('Retrying gallery query after transient Prisma connection error.');
    return query();
  }
}

export async function listGalleryMedia(scope: 'public' | 'admin') {
  if (scope === 'public' && shouldSkipPublicDb()) {
    return getStaticGalleryFallback();
  }

  const prismaAny = prisma as unknown as {
    galleryMedia?: {
      findMany: (args: {
        where?: { published?: boolean };
        orderBy: { createdAt: 'desc' };
      }) => Promise<
        Array<{
          id: string;
          title: string;
          description: string | null;
          type: 'photo' | 'video' | 'audio';
          source: string;
          thumbnail: string | null;
          mimeType: string | null;
          published: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>
      >;
    };
  };

  if (!prismaAny.galleryMedia) {
    const items = await listGalleryFromStorage();
    return scope === 'admin' ? items : items.filter((item) => item.published);
  }

  let items;

  try {
    items = await retryGalleryQuery(() =>
      prismaAny.galleryMedia!.findMany({
        where: scope === 'admin' ? undefined : { published: true },
        orderBy: { createdAt: 'desc' },
      })
    );
  } catch (error) {
    if (scope === 'public' && isPublicDbQuotaExceededError(error)) {
      markPublicDbQuotaExceeded('public gallery');
      console.warn('Gallery query unavailable due to database quota; using fallback data.');
    } else {
      console.error('Gallery query failed, falling back to site settings storage.', error);
    }
    try {
      const fallbackItems = await listGalleryFromStorage();
      return scope === 'admin' ? fallbackItems : fallbackItems.filter((item) => item.published);
    } catch (storageError) {
      if (scope === 'public' && isPublicDbQuotaExceededError(storageError)) {
        markPublicDbQuotaExceeded('public gallery storage');
      } else {
        console.warn('Gallery storage fallback failed.');
      }
      if (scope === 'public') {
        return getStaticGalleryFallback();
      }
      return [];
    }
  }

  const publicItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    source: item.source,
    thumbnail: item.thumbnail,
    mimeType: item.mimeType,
    published: item.published,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return scope === 'public' ? publicItems.map(withPublicGalleryAssets) : publicItems;
}

export async function getGalleryMediaById(id: string, scope: 'public' | 'admin') {
  const prismaAny = prisma as unknown as {
    galleryMedia?: {
      findUnique: (args: { where: { id: string } }) => Promise<{
        id: string;
        title: string;
        description: string | null;
        type: 'photo' | 'video' | 'audio';
        source: string;
        thumbnail: string | null;
        mimeType: string | null;
        published: boolean;
        createdAt: Date;
        updatedAt: Date;
      } | null>;
    };
  };

  if (!prismaAny.galleryMedia) {
    const items = await listGalleryFromStorage();
    const found = items.find((item) => item.id === id) ?? null;

    if (!found) {
      return null;
    }

    return scope === 'admin' || found.published ? found : null;
  }

  let found;

  try {
    found = await retryGalleryQuery(() => prismaAny.galleryMedia!.findUnique({ where: { id } }));
  } catch (error) {
    console.error('Gallery item lookup failed, falling back to site settings storage.', error);
    const items = await listGalleryFromStorage();
    const storageFound = items.find((item) => item.id === id) ?? null;

    if (!storageFound) {
      return null;
    }

    return scope === 'admin' || storageFound.published ? storageFound : null;
  }

  if (!found) {
    return null;
  }

  if (scope !== 'admin' && !found.published) {
    return null;
  }

  return {
    id: found.id,
    title: found.title,
    description: found.description,
    type: found.type,
    source: found.source,
    thumbnail: found.thumbnail,
    mimeType: found.mimeType,
    published: found.published,
    createdAt: found.createdAt.toISOString(),
    updatedAt: found.updatedAt.toISOString(),
  };
}

export async function createGalleryMedia(input: {
  title: string;
  description?: string | null;
  type: GalleryMediaType;
  source: string;
  thumbnail?: string | null;
  mimeType?: string | null;
  published: boolean;
}) {
  const prismaAny = prisma as unknown as {
    galleryMedia?: {
      create: (args: {
        data: {
          title: string;
          description: string | null;
          type: 'photo' | 'video' | 'audio';
          source: string;
          thumbnail: string | null;
          mimeType: string | null;
          published: boolean;
        };
      }) => Promise<{
        id: string;
        title: string;
        description: string | null;
        type: 'photo' | 'video' | 'audio';
        source: string;
        thumbnail: string | null;
        mimeType: string | null;
        published: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };
  };

  if (!prismaAny.galleryMedia) {
    const now = new Date().toISOString();
    const created: GalleryMediaRecord = {
      id: crypto.randomUUID(),
      title: input.title.trim() || 'Sem título',
      description: input.description ?? null,
      type: normalizeGalleryType(input.type),
      source: input.source,
      thumbnail: input.thumbnail ?? null,
      mimeType: input.mimeType ?? null,
      published: input.published,
      createdAt: now,
      updatedAt: now,
    };

    const items = await listGalleryFromStorage();
    await saveGalleryToStorage([created, ...items]);
    return created;
  }

  const created = await prismaAny.galleryMedia.create({
    data: {
      title: input.title.trim() || 'Sem título',
      description: input.description ?? null,
      type: normalizeGalleryType(input.type),
      source: input.source,
      thumbnail: input.thumbnail ?? null,
      mimeType: input.mimeType ?? null,
      published: input.published,
    },
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    type: created.type,
    source: created.source,
    thumbnail: created.thumbnail,
    mimeType: created.mimeType,
    published: created.published,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateGalleryMedia(
  id: string,
  input: {
    title: string;
    description?: string | null;
    type: GalleryMediaType;
    source: string;
    thumbnail?: string | null;
    mimeType?: string | null;
    published: boolean;
  }
) {
  const prismaAny = prisma as unknown as {
    galleryMedia?: {
      update: (args: {
        where: { id: string };
        data: {
          title: string;
          description: string | null;
          type: 'photo' | 'video' | 'audio';
          source: string;
          thumbnail: string | null;
          mimeType: string | null;
          published: boolean;
        };
      }) => Promise<{
        id: string;
        title: string;
        description: string | null;
        type: 'photo' | 'video' | 'audio';
        source: string;
        thumbnail: string | null;
        mimeType: string | null;
        published: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };
  };

  if (!prismaAny.galleryMedia) {
    const items = await listGalleryFromStorage();
    const index = items.findIndex((item) => item.id === id);

    if (index < 0) {
      return null;
    }

    const updated: GalleryMediaRecord = {
      ...items[index],
      title: input.title.trim() || 'Sem título',
      description: input.description ?? null,
      type: normalizeGalleryType(input.type),
      source: input.source,
      thumbnail: input.thumbnail ?? null,
      mimeType: input.mimeType ?? null,
      published: input.published,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updated;
    await saveGalleryToStorage(items);
    return updated;
  }

  const updated = await prismaAny.galleryMedia.update({
    where: { id },
    data: {
      title: input.title.trim() || 'Sem título',
      description: input.description ?? null,
      type: normalizeGalleryType(input.type),
      source: input.source,
      thumbnail: input.thumbnail ?? null,
      mimeType: input.mimeType ?? null,
      published: input.published,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    type: updated.type,
    source: updated.source,
    thumbnail: updated.thumbnail,
    mimeType: updated.mimeType,
    published: updated.published,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteGalleryMedia(id: string) {
  const prismaAny = prisma as unknown as {
    galleryMedia?: {
      delete: (args: { where: { id: string } }) => Promise<unknown>;
    };
  };

  if (!prismaAny.galleryMedia) {
    const items = await listGalleryFromStorage();
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) {
      return false;
    }

    await saveGalleryToStorage(filtered);
    return true;
  }

  await prismaAny.galleryMedia.delete({ where: { id } });
  return true;
}
