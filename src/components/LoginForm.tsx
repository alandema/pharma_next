'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed');
                console.error('Login error:', data);
                return;
            }

            console.log('Login successful:', data);
            router.refresh(); // Refresh to show logged-in state
        } catch (err) {
            console.error('Login exception:', err);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 max-w-xs">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
                <label className="block text-sm">Username</label>
                <input name="username" className="border px-2 py-1 w-full" required />
            </div>
            <div>
                <label className="block text-sm">Password</label>
                <input type="password" name="password" className="border px-2 py-1 w-full" required />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-1 text-sm disabled:opacity-50"
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
}
