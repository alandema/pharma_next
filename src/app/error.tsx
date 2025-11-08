'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
                <p className="text-gray-600">{error.message}</p>
                <button
                    onClick={() => reset()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
