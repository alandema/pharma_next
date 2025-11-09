import LoginForm from '@/src/components/LoginForm';
import Link from 'next/link';

async function getUser() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  try {
    const res = await fetch(base + '/api/auth/me', { cache: 'no-store' });
    const data = await res.json();
    return data.user;
  } catch { return null; }
}

export default async function HomePage() {
  const user = await getUser();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pharma App</h1>
      {!user && <LoginForm />}
      {user && (
        <div className="space-y-2">
          <div>Logged in as <strong>{user.username}</strong> ({user.role})</div>
          <form action="/api/auth/logout" method="post">
            <button className="bg-gray-700 text-white px-3 py-1 text-sm" formAction={async () => {
              'use server';
              const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
              await fetch(base + '/api/auth/logout', { method: 'POST' });
            }}>Logout</button>
          </form>
        </div>
      )}
      <p>Choose an action:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><Link className="text-blue-600 underline" href="/patients">Manage Patients</Link></li>
        <li><Link className="text-blue-600 underline" href="/prescriptions/create">Create Prescription</Link></li>
        <li><Link className="text-blue-600 underline" href="/prescriptions/history">Prescription History</Link></li>
        <li><Link className="text-blue-600 underline" href="/cids">Manage CIDs</Link></li>
        <li><Link className="text-blue-600 underline" href="/medications">Manage Medications</Link></li>
      </ul>
    </div>
  );
}
