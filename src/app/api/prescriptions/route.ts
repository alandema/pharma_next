import { prisma } from '@/src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createPrescriptionSchema = z.object({
  patientId: z.number(),
  currentDate: z.string(), // dd/mm/YYYY expected
  // Accept any other fields as passthrough JSON
}).passthrough();

export async function GET() {
  // Using raw query to maintain the JOIN and custom select with patient_name
  const prescriptions = await prisma.$queryRaw<Array<any>>`
    SELECT p.*, pat.name as patient_name 
    FROM prescriptions p 
    JOIN patients pat ON pat.id = p.patient_id 
    ORDER BY date(p.date_prescribed) DESC 
    LIMIT 50
  `;
  return NextResponse.json(prescriptions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPrescriptionSchema.parse(body);

    // Convert date format dd/mm/YYYY -> YYYY-MM-DD
    const [d, m, y] = parsed.currentDate.split('/');
    const isoDate = `${y}-${m}-${d}`; // naive trust

    const prescription = await prisma.prescription.create({
      data: {
        patient_id: parsed.patientId,
        date_prescribed: isoDate,
        json_form_info: JSON.stringify(body),
      },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
