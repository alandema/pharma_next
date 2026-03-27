import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
export const prisma = new PrismaClient({ adapter })

const args = process.argv.slice(2);
const params: Record<string, string> = {};

// Parse flag style: --username alice --password secret --email alice@example.com --role admin|superadmin
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
    if (value) i++;
    params[key] = value;
  } else {
    // Any positional token is now an error (explicit guidance)
    console.error('Positional arguments are no longer supported. Use: --username <name> --password <pass> --email <email> --role <role>');
    process.exit(1);
  }
}

async function main() {
  const { username, password, email } = params;
  const role = params.role || 'admin';
  if (!username || !password || !email) { 
    console.error('Missing --username, --password, or --email'); process.exit(1);
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
      email,
      role,
      full_name: params.full_name || username,
      cpf: params.cpf || (Math.floor(10000000000 + Math.random() * 90000000000)).toString(),
      gender: params.gender || "Not Specified",
      birth_date: params.birth_date ? new Date(params.birth_date) : new Date("1980-01-01"),
      phone: params.phone || "00000000000",
      professional_type: params.professional_type || "Admin",
      council: params.council || "CRM",
      council_number: params.council_number || "00000",
      council_state: params.council_state || "SP",
      specialties: params.specialties ? JSON.parse(params.specialties) : ["Admin"],
      zipcode: params.zipcode || "00000-000",
      street: params.street || "Admin Street",
      address_number: params.address_number || "0",
      city: params.city || "Admin City",
      state: params.state || "SP",
    },
  });

  console.log('User created:', username, 'role:', role);
  await prisma.$disconnect();
}
main();
