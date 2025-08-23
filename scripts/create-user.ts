#!/usr/bin/env ts-node
/**
 * Simple CLI to create a user (superadmin only manual process) in Turso.
 * Usage (PowerShell ONLY supports flag style now):  
 *   npx tsx scripts/create-user.ts --username alice --password secret --role doctor
 *   npm run create-user -- --username alice --password secret --role doctor
 * Positional arguments have been removed; you MUST use -- flags.
 */
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { getDb } from '../src/lib/db';

const args = process.argv.slice(2);
const params: Record<string, string> = {};

// Parse flag style: --username alice --password secret --role doctor
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
    if (value) i++;
    params[key] = value;
  } else {
    // Any positional token is now an error (explicit guidance)
    console.error('Positional arguments are no longer supported. Use: --username <name> --password <pass> --role <role>');
    process.exit(1);
  }
}

async function main() {
  const { username, password, role = 'doctor' } = params;
  if (!username || !password) { console.error('Missing --username or --password'); process.exit(1); }
  if (!['superadmin', 'doctor', 'nurse', 'employee'].includes(role)) { console.error('Invalid role'); process.exit(1); }
  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE username = ? LIMIT 1', args: [username] });
  if (existing.rows.length) { console.error('Username already exists'); process.exit(1); }
  const hash = await bcrypt.hash(password, 10);
  await db.execute({ sql: 'INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', args: [username, hash, role] });
  console.log('User created:', username, 'role:', role);
}
main();
