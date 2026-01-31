import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from './db';

// ROLES place-holder; define granular permissions later
export type Role = 'superadmin' | 'user' | 'employee';

export interface JwtPayload { id: number; username: string; role: Role; }

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES;


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
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES! } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try { return jwt.verify(token, JWT_SECRET!) as JwtPayload; } catch { return null; }
}

export function requireRole(user: JwtPayload | null, allowed: Role[]) {
  if (!user) return false;
  if (user.role === 'superadmin') return true; // superadmin override
  return allowed.includes(user.role);
}

// Minimal placeholder permission map (expand later)
export const RolePermissions: Record<Role, string[]> = {
  superadmin: ['*'],
  user: [],
  employee: []
};

export async function getUserRole(req: Request): Promise<Role | null> {
  // first check cookies for auth_token
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => {
    const [key, ...v] = c.split('=');
    return [key, v.join('=')];
  }));
  const token = cookies['auth_token'];
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.role : null;
}