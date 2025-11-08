import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CreatePrescriptionPage() {
    const patients = await prisma.patient.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });
    const medications = await prisma.medication.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });
    const cids = await prisma.cid.findMany({
        select: { id: true, code: true },
        orderBy: { code: 'asc' },
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Create Prescription</h2>
                <Link href="/" className="text-sm text-blue-600 underline">Home</Link>
            </div>
            <p className="text-sm text-gray-600">(UI form not yet implemented)</p>
            <pre className="bg-white p-4 rounded border max-h-72 overflow-auto text-xs">Patients: {JSON.stringify(patients, null, 2)}
                Medications: {JSON.stringify(medications, null, 2)}
                CIDs: {JSON.stringify(cids, null, 2)}</pre>
        </div>
    );
}
