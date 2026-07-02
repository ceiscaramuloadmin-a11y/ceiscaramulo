/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const prismaClientMock = vi.fn();
const prismaPgMock = vi.fn();

vi.mock('@/src/generated/prisma/client', () => ({
  PrismaClient: prismaClientMock,
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: prismaPgMock,
}));

describe('prisma client initialization', () => {
  const previousEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (globalThis as typeof globalThis & { prisma?: unknown }).prisma;
    process.env.DATABASE_URL = previousEnv.DATABASE_URL;
    process.env.POSTGRES_URL = previousEnv.POSTGRES_URL;
    process.env.PRISMA_DATABASE_URL = previousEnv.PRISMA_DATABASE_URL;
    process.env.NODE_ENV = previousEnv.NODE_ENV;
  });

  it('does not throw when database URL is not configured', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.PRISMA_DATABASE_URL;

    await expect(import('@/lib/prisma')).resolves.toBeDefined();
    expect(prismaPgMock).not.toHaveBeenCalled();
    expect(prismaClientMock).not.toHaveBeenCalled();
  });

  it('creates Prisma client when database URL is configured', async () => {
    process.env.DATABASE_URL = 'postgresql://example.test/db';
    process.env.NODE_ENV = 'test';
    prismaPgMock.mockReturnValue({ adapter: true });
    prismaClientMock.mockReturnValue({ client: true });

    await expect(import('@/lib/prisma')).resolves.toBeDefined();
    expect(prismaPgMock).toHaveBeenCalledWith({ connectionString: 'postgresql://example.test/db' });
    expect(prismaClientMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes legacy Postgres ssl modes to the current verify-full behavior', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@example.test/db?sslmode=require&schema=public';
    process.env.NODE_ENV = 'test';
    prismaPgMock.mockReturnValue({ adapter: true });
    prismaClientMock.mockReturnValue({ client: true });

    await expect(import('@/lib/prisma')).resolves.toBeDefined();
    expect(prismaPgMock).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@example.test/db?sslmode=verify-full&schema=public',
    });
  });
});
