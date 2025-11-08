/**
 * Prisma Client Configuration for Turso (libSQL)
 * 
 * This module initializes PrismaClient with the libSQL adapter to connect to Turso.
 * It implements a singleton pattern to prevent multiple instances in development.
 */

import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

// Create Prisma adapter with Turso credentials
// PrismaLibSQL will use the bundled @libsql/client version from @prisma/adapter-libsql
const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Singleton pattern for PrismaClient
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
