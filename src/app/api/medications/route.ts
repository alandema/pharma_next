import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1), information: z.string().optional().nullable() });

export async function GET() {
  const medications = await prisma.medication.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(medications);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    // Check if medication already exists (case-insensitive)
    const exist = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM medications WHERE lower(name) = lower(${parsed.name}) LIMIT 1
    `;
    if (exist.length) return NextResponse.json({ error: 'Medicamento já cadastrado' }, { status: 400 });

    const medication = await prisma.medication.create({
      data: {
        name: parsed.name,
        information: parsed.information ?? null,
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
