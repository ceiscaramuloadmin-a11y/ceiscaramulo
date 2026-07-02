import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/src/generated/prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.PRISMA_DATABASE_URL;

export function normalizePrismaConnectionString(value: string) {
  try {
    const url = new URL(value);
    const sslMode = url.searchParams.get('sslmode');

    if (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full');
      return url.toString();
    }
  } catch {
    return value;
  }

  return value;
}

const prisma = connectionString
  ? (globalForPrisma.prisma ??
      new PrismaClient({
        adapter: new PrismaPg({ connectionString: normalizePrismaConnectionString(connectionString) }),
      }))
  : ({} as PrismaClient);

if (connectionString && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
