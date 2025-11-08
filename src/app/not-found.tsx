import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-gray-800">404</h2>
                <h3 className="text-xl font-semibold text-gray-600">Page Not Found</h3>
                <p className="text-gray-500">Could not find the requested resource.</p>
                <Link
                    href="/"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
