#!/usr/bin/env ts-node
/**
 * Simple CLI to create a user (superadmin only manual process) in Turso.
 * Usage (PowerShell):  npx ts-node scripts/create-user.ts --username alice --password secret --role doctor
 */
import bcrypt from 'bcryptjs';
import { getDb, migrate } from '../src/lib/db';

const args = process.argv.slice(2);
const params: Record<string,string> = {};
for (let i=0;i<args.length;i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace(/^--/,'');
    const val = args[i+1];
    params[key] = val;
    i++;}
}

async function main(){
  const { username, password, role='doctor' } = params;
  if(!username||!password) { console.error('Missing --username or --password'); process.exit(1); }
  if(!['superadmin','doctor','nurse','employee'].includes(role)) { console.error('Invalid role'); process.exit(1); }
  await migrate();
  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE username = ? LIMIT 1', args: [username] });
  if (existing.rows.length) { console.error('Username already exists'); process.exit(1); }
  const hash = await bcrypt.hash(password, 10);
  await db.execute({ sql: 'INSERT INTO users (username, password_hash, role) VALUES (?,?,?)', args: [username, hash, role] });
  console.log('User created:', username, 'role:', role);
}
main();
