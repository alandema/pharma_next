
// npx dotenv-cli -e .env.production -- npx tsx scripts/create-user.ts --email email@gmail.com --password secretePass123! --role superadmin --full_name "Name Surname"
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })

const args = process.argv.slice(2);
const params: Record<string, string> = {};

// Parse flag style: --email admin@example.com --password secret --role admin|superadmin
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
    if (value) i++;
    params[key] = value;
  } else {
    // Any positional token is now an error (explicit guidance)
    console.error('Positional arguments are no longer supported. Use: --email <email> --password <pass> --role <role>');
    process.exit(1);
  }
}

async function main() {
  const { password, email } = params;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const role = params.role || 'admin';
  if (!password || !normalizedEmail) {
    console.error('Missing --email or --password'); process.exit(1);
  }
  if (role !== 'admin' && role !== 'superadmin') {
    console.error('Invalid --role. Allowed values: admin, superadmin'); process.exit(1);
  }

  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });
  if (existing) { console.error('Email already exists'); process.exit(1); }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      password_hash: hash,
      email: normalizedEmail,
      role,
      full_name: params.full_name || normalizedEmail,
      cpf: params.cpf || (Math.floor(10000000000 + Math.random() * 90000000000)).toString(),
      gender: params.gender || "Not Specified",
      birth_date: params.birth_date ? new Date(params.birth_date) : new Date("1980-01-01"),
      phone: params.phone || "00000000000",
      council: params.council || "CRM",
      council_number: params.council_number || "00000",
      council_state: params.council_state || "SP",
      zipcode: params.zipcode || "00000-000",
      street: params.street || "Admin Street",
      address_number: params.address_number || "0",
      city: params.city || "Admin City",
      state: params.state || "SP",
    },
  });

  console.log('Prescriber account created:', normalizedEmail, 'role:', role);
  await prisma.$disconnect();
}
main();
