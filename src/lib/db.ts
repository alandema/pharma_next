/**
 * Database Access Module
 * 
 * This module is deprecated. Use the Prisma client from '@/lib/prisma' instead.
 * This file is kept for backwards compatibility with existing scripts.
 */

import { prisma } from './prisma';

/**
 * @deprecated Use prisma client directly from '@/lib/prisma'
 * This function returns the Prisma client for raw SQL operations
 */
export function getDb() {
  return prisma;
}
