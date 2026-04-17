import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { MovieFilters } from "@/components/movies/MovieFilters";
import { RandomMovieButton } from "@/components/movies/RandomMovieButton";
import { Spinner } from "@/components/ui/Spinner";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse Movies — MyMoviePal" };

interface PageProps {
  searchParams: { q?: string; genre?: string; year?: string; page?: string; sort?: string };
}

async function MovieResults({ searchParams }: PageProps) {
  const q = searchParams.q ?? "";
  const genre = searchParams.genre ?? "";
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  const sort = searchParams.sort ?? "popular";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = 20;

  const where = {
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(genre && { genres: { has: genre } }),
    ...(year && { year }),
    // Only show movies that have ratings (have been seen) when browsing
    ...(sort === "popular" && !q && !genre && !year && { mlRatingCount: { gt: 0 } }),
  };

  const orderBy =
    sort === "title"    ? { title: "asc" as const } :
    sort === "year"     ? { year: "desc" as const } :
    sort === "rating"   ? { mlAvgScore: "desc" as const } :
    /* popular */         { mlRatingCount: "desc" as const };

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: { _count: { select: { ratings: true } } },
    }),
    prisma.movie.count({ where }),
  ]);

  const moviesWithStats = movies.map((m: typeof movies[0]) => ({
    ...m,
    _avg: { score: null as number | null },
  }));

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        {total} {total === 1 ? "movie" : "movies"} found
      </p>
      <MovieGrid movies={moviesWithStats} />
      {total > limit && (
        <Pagination page={page} pages={Math.ceil(total / limit)} searchParams={searchParams} />
      )}
    </div>
  );
}

function Pagination({
  page,
  pages,
  searchParams,
}: {
  page: number;
  pages: number;
  searchParams: Record<string, string | undefined>;
}) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("page", String(p));
    return `/movies?${sp.toString()}`;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <a href={params(page - 1)} className="px-4 py-2 rounded-lg bg-gray-800 text-sm hover:bg-gray-700 transition-colors">
          ← Previous
        </a>
      )}
      <span className="text-sm text-gray-500">Page {page} of {pages}</span>
      {page < pages && (
        <a href={params(page + 1)} className="px-4 py-2 rounded-lg bg-gray-800 text-sm hover:bg-gray-700 transition-colors">
          Next →
        </a>
      )}
    </div>
  );
}

export default function MoviesPage({ searchParams }: PageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Browse Movies</h1>
        <RandomMovieButton />
      </div>
      <div className="mb-6">
        <Suspense>
          <MovieFilters />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <MovieResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
