import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PrescriptionHistoryPage() {
    const prescriptions = await prisma.prescription.findMany({
        take: 50,
        orderBy: { date_prescribed: 'desc' },
        include: {
            patient: {
                select: { name: true },
            },
        },
    });

    // Transform to match the old format with patient_name
    const formattedPrescriptions = prescriptions.map((p: typeof prescriptions[0]) => ({
        id: p.id,
        date_prescribed: p.date_prescribed,
        patient_name: p.patient.name,
    }));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Prescription History</h2>
                <Link href="/" className="text-sm text-blue-600 underline">Home</Link>
            </div>
            <pre className="bg-white p-4 rounded border max-h-96 overflow-auto text-sm">{JSON.stringify(formattedPrescriptions, null, 2)}</pre>
        </div>
    );
}
