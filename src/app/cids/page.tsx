import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CidsPage() {
    const cids = await prisma.cid.findMany({
        orderBy: { code: 'asc' },
    });
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">CIDs</h2>
                <Link href="/" className="text-sm text-blue-600 underline">Home</Link>
            </div>
            <pre className="bg-white p-4 rounded border max-h-96 overflow-auto text-sm">{JSON.stringify(cids, null, 2)}</pre>
        </div>
    );
}
