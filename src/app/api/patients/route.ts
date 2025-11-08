import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const patientSchema = z.object({
  name: z.string().min(1),
  rg: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  zipcode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  house_number: z.string().optional().nullable(),
  additional_info: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  medical_history: z.string().optional().nullable()
});

export async function GET() {
  const patients = await prisma.patient.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = patientSchema.parse(body);

    // Unique CPF check
    if (parsed.cpf && parsed.cpf !== '000.000.000-00') {
      const existing = await prisma.patient.findUnique({
        where: { cpf: parsed.cpf },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 });
      }
    }

    const patient = await prisma.patient.create({
      data: parsed,
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
