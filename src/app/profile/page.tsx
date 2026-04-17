import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Ratings — MyMoviePal" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/profile");

  const ratings = await prisma.rating.findMany({
    where: { userId: session.user.id },
    include: {
      movie: { select: { id: true, title: true, year: true, posterUrl: true, genres: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">My Ratings</h1>
        <p className="text-sm text-gray-500 mt-1">
          {session.user.name ?? session.user.email} · {ratings.length} {ratings.length === 1 ? "movie" : "movies"} rated
        </p>
      </div>

      {ratings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">You haven&apos;t rated any movies yet.</p>
          <Link href="/movies" className="text-amber-400 hover:underline text-sm font-medium">
            Browse movies →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((r: typeof ratings[0]) => (
            <Link
              key={r.id}
              href={`/movies/${r.movie.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 hover:bg-gray-900 transition-colors"
            >
              <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                {r.movie.posterUrl ? (
                  <Image src={r.movie.posterUrl} alt={r.movie.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-600 text-xs">?</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-100 truncate">{r.movie.title}</p>
                <p className="text-xs text-gray-500">{r.movie.year}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.movie.genres.slice(0, 2).map((g: string) => <Badge key={g}>{g}</Badge>)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <StarRating value={r.score} onChange={() => {}} readonly size="sm" />
                {r.review && (
                  <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{r.review}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
