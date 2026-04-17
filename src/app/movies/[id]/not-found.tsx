import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4">
      <p className="text-6xl font-bold text-amber-400 mb-4">404</p>
      <h2 className="text-xl font-semibold text-gray-200 mb-2">Movie not found</h2>
      <p className="text-sm text-gray-500 mb-6">This movie doesn&apos;t exist or was removed.</p>
      <Link href="/movies" className="text-amber-400 hover:underline text-sm font-medium">
        ← Back to movies
      </Link>
    </div>
  );
}
