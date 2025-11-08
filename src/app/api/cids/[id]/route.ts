import { prisma } from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ code: z.string().optional(), description: z.string().nullable().optional() });

export async function GET(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const cid = await prisma.cid.findUnique({
    where: { id: parseInt(params.id) },
  });
  if (!cid) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cid);
}

export async function PUT(req: Request, context: any) {
  const { params } = context;
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const entries = Object.entries(parsed).filter(([, v]) => v !== undefined);
    if (!entries.length) return NextResponse.json({ error: 'No fields' }, { status: 400 });

    if (parsed.code) {
      const exist = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM cids WHERE lower(code) = lower(${parsed.code}) AND id != ${parseInt(params.id)} LIMIT 1
      `;
      if (exist.length) return NextResponse.json({ error: 'Código CID já cadastrado' }, { status: 400 });
    }

    const cid = await prisma.cid.update({
      where: { id: parseInt(params.id) },
      data: parsed,
    });

    return NextResponse.json(cid);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  await prisma.cid.delete({
    where: { id: parseInt(params.id) },
  });
  return NextResponse.json({ success: true });
}
