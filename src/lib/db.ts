import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Safe Prisma client that returns null if the database is not configured.
 * This prevents all API routes from crashing with 500 when DATABASE_URL
 * is not a valid PostgreSQL connection string (e.g. local SQLite fallback).
 *
 * Usage:
 *   const prisma = getPrisma();
 *   if (!prisma) return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
 *   const tracks = await prisma.libraryTrack.findMany();
 */
function createPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL || '';

  // Prisma schema declares provider = "postgresql"
  // If DATABASE_URL is not a PostgreSQL URL, PrismaClient will throw on instantiation.
  // We catch this and return null so API routes can gracefully degrade.
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.warn(
      '[db] DATABASE_URL is not a PostgreSQL connection string. ' +
      'Cloud database features are disabled. Set DATABASE_URL to your Supabase PostgreSQL URL.',
    );
    return null;
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV !== 'production' ? ['error'] : [],
    });
  } catch (err) {
    console.error('[db] Failed to create PrismaClient:', err);
    return null;
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// In development, reuse the same instance across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db as PrismaClient | undefined;
}

/**
 * Returns the Prisma client if available, or null if the database is not configured.
 * Use this in API routes to gracefully handle missing database connections.
 */
export function getPrisma(): PrismaClient | null {
  return db || null;
}
