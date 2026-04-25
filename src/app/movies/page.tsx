import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { MovieFilters } from "@/components/movies/MovieFilters";
import { RandomMovieButton } from "@/components/movies/RandomMovieButton";
import { MovieGridSkeleton } from "@/components/movies/MovieCardSkeleton";
import { ViewToggle } from "@/components/movies/ViewToggle";
import type { Metadata } from "next";
import type { MovieWithStats } from "@/types";

export const metadata: Metadata = { title: "Browse — MyMoviePal" };

interface PageProps {
  searchParams: { q?: string; genre?: string; year?: string; page?: string; sort?: string; type?: string; view?: string; r?: string };
}

async function MovieResults({ searchParams }: PageProps) {
  const q = searchParams.q ?? "";
  const genre = searchParams.genre ?? "";
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  const sort = searchParams.sort ?? "popular";
  const type = searchParams.type ?? "";
  const view = (searchParams.view === "grid" ? "grid" : "list") as "list" | "grid";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const limit = view === "grid" ? 24 : 20;

  const where = {
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(genre && { genres: { has: genre } }),
    ...(year && { year }),
    ...(type && { contentType: type }),
    ...(sort === "popular" && { mlRatingCount: { gt: 0 } }),
  };

  let moviesWithStats: MovieWithStats[];
  let total: number;

  if (sort === "popular" || sort === "title" || sort === "rating") {
    type RawMovie = {
      id: string; title: string; year: number | null; overview: string | null;
      posterUrl: string | null; runtime: number | null; director: string | null;
      genres: string[]; cast: string[]; mlMovieId: number | null;
      mlAvgScore: number | null; mlRatingCount: number | null;
      contentType: string; episodeCount: number | null; anilistId: number | null;
      createdAt: Date;
    };

    // Build parameterized WHERE string — avoids Prisma.empty comma injection bug
    let idx = 1;
    const sqlParams: (string | number)[] = [];
    let extra = sort === "popular"
      ? `"mlRatingCount" > 0 AND "posterUrl" IS NOT NULL`
      : sort === "rating"
        ? `"mlAvgScore" IS NOT NULL AND "mlRatingCount" > 0`
        : `TRUE`;
    if (q)     { extra += ` AND LOWER(title) LIKE $${idx++}`;  sqlParams.push(`%${q.toLowerCase()}%`); }
    if (genre) { extra += ` AND $${idx++} = ANY(genres)`;      sqlParams.push(genre); }
    if (year)  { extra += ` AND year = $${idx++}`;             sqlParams.push(year); }
    if (type)  { extra += ` AND "contentType" = $${idx++}`;    sqlParams.push(type); }

    const orderBySql = sort === "popular"
      ? `ORDER BY RANDOM()`
      : sort === "rating"
        ? `ORDER BY ("mlRatingCount" * "mlAvgScore" + 1000 * 7.0) / ("mlRatingCount" + 1000.0) DESC`
        : `ORDER BY CASE WHEN title ~ '^[a-zA-Z]' THEN 0 WHEN title ~ '^[0-9]' THEN 1 ELSE 2 END, LOWER(title) ASC`;

    const [rawMovies, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<RawMovie[]>(
        `SELECT id, title, year, overview, "posterUrl", runtime, director, genres, "cast",
                "mlMovieId", "mlAvgScore", "mlRatingCount", "contentType", "episodeCount",
                "anilistId", "createdAt"
         FROM movies WHERE ${extra}
         ${orderBySql} LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
        ...sqlParams
      ),
      prisma.$queryRawUnsafe<[{ count: bigint | string }]>(
        `SELECT COUNT(*) as count FROM movies WHERE ${extra}`,
        ...sqlParams
      ),
    ]);

    total = Number(countResult[0].count);
    moviesWithStats = rawMovies.map((m) => ({
      ...m,
      overview: m.overview ?? "",
      cast: m.cast ?? [],
      _count: { ratings: 0 },
      _avg: { score: null },
    })) as MovieWithStats[];
  } else {
    const orderBy =
      sort === "year"   ? { year: "desc" as const } :
                          { mlAvgScore: "desc" as const };

    const [movies, count] = await Promise.all([
      prisma.movie.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy, include: { _count: { select: { ratings: true } } } }),
      prisma.movie.count({ where }),
    ]);

    total = count;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    moviesWithStats = movies.map((m: any) => ({ ...m, _avg: { score: null as number | null } })) as MovieWithStats[];
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">{total.toLocaleString()} {total === 1 ? "result" : "results"}</p>
      <MovieGrid movies={moviesWithStats} view={view} />
      {total > limit && <Pagination page={page} pages={Math.ceil(total / limit)} searchParams={searchParams} />}
    </div>
  );
}

function Pagination({ page, pages, searchParams }: { page: number; pages: number; searchParams: Record<string, string | undefined> }) {
  const params = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => v && sp.set(k, v));
    sp.set("page", String(p));
    return `/movies?${sp.toString()}`;
  };
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <a href={params(page - 1)} className="px-4 py-2 rounded-lg bg-gray-800 text-sm hover:bg-gray-700 transition-colors">← Previous</a>
      )}
      <span className="text-sm text-gray-500">Page {page} of {pages}</span>
      {page < pages && (
        <a href={params(page + 1)} className="px-4 py-2 rounded-lg bg-gray-800 text-sm hover:bg-gray-700 transition-colors">Next →</a>
      )}
    </div>
  );
}

export default function MoviesPage({ searchParams }: PageProps) {
  const view = (searchParams.view === "grid" ? "grid" : "list") as "list" | "grid";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Browse</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <ViewToggle view={view} />
          </Suspense>
          <RandomMovieButton />
        </div>
      </div>
      <div className="mb-6">
        <Suspense>
          <MovieFilters />
        </Suspense>
      </div>
      <Suspense fallback={<MovieGridSkeleton view={view} />}>
        <MovieResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
