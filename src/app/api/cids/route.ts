import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ code: z.string().min(1), description: z.string().optional().nullable() });

export async function GET() {
  const cids = await prisma.cid.findMany({
    orderBy: { code: 'asc' },
  });
  return NextResponse.json(cids);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    // Check if CID code already exists (case-insensitive)
    const existing = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM cids WHERE lower(code) = lower(${parsed.code}) LIMIT 1
    `;
    if (existing.length) return NextResponse.json({ error: 'Código CID já cadastrado' }, { status: 400 });

    const cid = await prisma.cid.create({
      data: {
        code: parsed.code,
        description: parsed.description ?? null,
      },
    });

    return NextResponse.json(cid, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
