import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
    const patients = await prisma.patient.findMany({
        orderBy: { name: 'asc' },
    });
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Patients</h2>
                <Link href="/" className="text-sm text-blue-600 underline">Home</Link>
            </div>
            <pre className="bg-white p-4 rounded border max-h-96 overflow-auto text-sm">{JSON.stringify(patients, null, 2)}</pre>
        </div>
    );
}
