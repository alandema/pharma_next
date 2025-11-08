import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().optional(),
  rg: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  zipcode: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  house_number: z.string().nullable().optional(),
  additional_info: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  medical_history: z.string().nullable().optional()
});

export async function GET(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(params.id) },
  });
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PUT(req: Request, context: any) {
  const { params } = context;
  try {
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    if (parsed.cpf && parsed.cpf !== '000.000.000-00') {
      const exists = await prisma.patient.findFirst({
        where: {
          cpf: parsed.cpf,
          NOT: { id: parseInt(params.id) },
        },
        select: { id: true },
      });
      if (exists) return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 });
    }

    const entries = Object.entries(parsed).filter(([, v]) => v !== undefined);
    if (!entries.length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    const patient = await prisma.patient.update({
      where: { id: parseInt(params.id) },
      data: parsed,
    });

    return NextResponse.json(patient);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  await prisma.patient.delete({
    where: { id: parseInt(params.id) },
  });
  return NextResponse.json({ success: true });
}
