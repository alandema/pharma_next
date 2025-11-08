import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const prescription = await prisma.prescription.findUnique({
    where: { id: parseInt(params.id) },
    include: { patient: true },
  });
  if (!prescription) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prescription);
}

export async function DELETE(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  await prisma.prescription.delete({
    where: { id: parseInt(params.id) },
  });
  return NextResponse.json({ success: true });
}
