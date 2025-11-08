import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ name: z.string().optional(), information: z.string().nullable().optional() });

export async function GET(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const medication = await prisma.medication.findUnique({
    where: { id: parseInt(params.id) },
  });
  if (!medication) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(medication);
}

export async function PUT(req: Request, context: any) {
  const { params } = context;
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const entries = Object.entries(parsed).filter(([, v]) => v !== undefined);
    if (!entries.length) return NextResponse.json({ error: 'No fields' }, { status: 400 });

    if (parsed.name) {
      const exists = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM medications WHERE lower(name) = lower(${parsed.name}) AND id != ${parseInt(params.id)} LIMIT 1
      `;
      if (exists.length) return NextResponse.json({ error: 'Medicamento já cadastrado' }, { status: 400 });
    }

    const medication = await prisma.medication.update({
      where: { id: parseInt(params.id) },
      data: parsed,
    });

    return NextResponse.json(medication);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  await prisma.medication.delete({
    where: { id: parseInt(params.id) },
  });
  return NextResponse.json({ success: true });
}
