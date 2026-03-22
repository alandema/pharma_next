import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })

const args = process.argv.slice(2);
const params: Record<string, string> = {};

// Parse flag style: --username alice --password secret --role admin|superadmin
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
  const { username, password } = params;
  const role = params.role || 'admin';
  if (!username || !password) { 
    console.error('Missing --username or --password'); process.exit(1);
  }
  if (role !== 'admin' && role !== 'superadmin') {
    console.error('Invalid --role. Allowed values: admin, superadmin'); process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) { console.error('Username already exists'); process.exit(1); }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username,
      password_hash: hash,
      role,
    },
  });

  console.log('User created:', username, 'role:', role);
  await prisma.$disconnect();
}
main();
