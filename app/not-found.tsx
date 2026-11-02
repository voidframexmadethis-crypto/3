import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4">
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-gray-400 mb-4">Could not find requested resource</p>
      <Link href="/" className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700">
        Return Home
      </Link>
    </div>
  );
}
