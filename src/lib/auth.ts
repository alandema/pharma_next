import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from './prisma';

// ROLES place-holder; define granular permissions later
export type Role = 'superadmin' | 'doctor' | 'nurse' | 'employee';

export interface JwtPayload { id: number; username: string; role: Role; }

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change';
const JWT_EXPIRES = '8h';

export async function findUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password_hash: true,
      role: true,
    },
  });
  return user as any | undefined;
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: number; username: string; role: Role }) {
  const payload: JwtPayload = { id: user.id, username: user.username, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): JwtPayload | null {
  try { return jwt.verify(token, JWT_SECRET) as JwtPayload; } catch { return null; }
}

export function requireRole(user: JwtPayload | null, allowed: Role[]) {
  if (!user) return false;
  if (user.role === 'superadmin') return true; // superadmin override
  return allowed.includes(user.role);
}

// Minimal placeholder permission map (expand later)
export const RolePermissions: Record<Role, string[]> = {
  superadmin: ['*'],
  doctor: [],
  nurse: [],
  employee: []
};
