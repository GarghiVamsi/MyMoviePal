import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { RatingForm } from "@/components/movies/RatingForm";
import { RatingsList } from "@/components/movies/RatingsList";
import { MovieCard } from "@/components/movies/MovieCard";
import { Rating } from "@/types";
import { formatRuntime, formatScore, formatTitle } from "@/lib/utils";
import { WatchlistButton } from "@/components/movies/WatchlistButton";
import type { Metadata } from "next";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const movie = await prisma.movie.findUnique({ where: { id: params.id } });
  if (!movie) return { title: "Not Found" };
  return { title: `${formatTitle(movie.title)} (${movie.year}) — MyMoviePal` };
}

export default async function MovieDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  const movie = await prisma.movie.findUnique({
    where: { id: params.id },
    include: {
      ratings: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { ratings: true } },
    },
  });

  if (!movie) notFound();

  const avgScore =
    movie.ratings.length
      ? movie.ratings.reduce((s: number, r: { score: number }) => s + r.score, 0) / movie.ratings.length
      : null;

  const userRating = session
    ? movie.ratings.find((r: { userId: string }) => r.userId === session!.user.id) ?? null
    : null;

  const [isWatchlisted, similar] = await Promise.all([
    session
      ? prisma.watchlist.findUnique({
          where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
        }).then(Boolean)
      : Promise.resolve(false),
    prisma.movie.findMany({
      where: {
        id: { not: movie.id },
        contentType: movie.contentType,
        genres: { hasSome: movie.genres },
      },
      orderBy: [{ mlAvgScore: "desc" }, { mlRatingCount: "desc" }],
      take: 8,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/movies"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-6 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to movies
      </Link>

      <div className="flex flex-col gap-8 sm:flex-row">
        {/* Poster */}
        <div className="w-full sm:w-56 shrink-0">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-800 sm:w-56">
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{formatTitle(movie.title)}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span>{movie.year}</span>
              {movie.contentType === "anime" && movie.episodeCount
                ? <span>{movie.episodeCount} episodes</span>
                : movie.runtime ? <span>{formatRuntime(movie.runtime)}</span> : null}
              {movie.contentType !== "anime" && movie.director && (
                <span>Directed by <span className="text-gray-300">{movie.director}</span></span>
              )}
              {movie.contentType === "anime" && (
                <span className="inline-flex items-center rounded-full bg-violet-500/20 text-violet-300 px-2.5 py-0.5 text-xs font-medium">Anime</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <Badge key={g} variant="amber">{g}</Badge>
            ))}
          </div>

          {/* Scores */}
          <div className="flex flex-wrap gap-3">
            {/* App user ratings */}
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-900/60 border border-gray-800">
              <div>
                <p className="text-3xl font-bold text-amber-400">{formatScore(avgScore)}</p>
                <p className="text-xs text-gray-500">
                  {movie._count.ratings} {movie._count.ratings === 1 ? "user rating" : "user ratings"}
                </p>
              </div>
              {avgScore != null && (
                <StarRating value={Math.round(avgScore)} readonly size="sm" />
              )}
            </div>
            {/* Community / AniList score */}
            {movie.mlAvgScore != null && (
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <div>
                  <p className="text-3xl font-bold text-blue-400">{formatScore(movie.mlAvgScore)}</p>
                  <p className="text-xs text-gray-400">
                    {(movie as { contentType?: string }).contentType === "anime"
                      ? `AniList · ${movie.mlRatingCount?.toLocaleString()} votes`
                      : `${movie.mlRatingCount?.toLocaleString()} community ratings`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <WatchlistButton movieId={movie.id} initialSaved={isWatchlisted} />

          {movie.overview && (
            <p className="text-gray-400 leading-relaxed text-sm">{movie.overview}</p>
          )}

          {movie.cast.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Cast</p>
              <div className="flex flex-wrap gap-2">
                {movie.cast.slice(0, 8).map((name) => (
                  <span key={name} className="text-xs bg-gray-800 text-gray-400 rounded-full px-3 py-1">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating + Reviews */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Your Rating</h2>
          <RatingForm
            movieId={movie.id}
            existingRating={
              userRating
                ? { score: userRating.score, review: userRating.review }
                : null
            }
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
            All Reviews <span className="text-gray-600 font-normal">({movie._count.ratings})</span>
          </h2>
          <RatingsList ratings={movie.ratings as Rating[]} />
        </div>
      </div>

      {/* Similar titles */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">More Like This</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
            {similar.map((s) => (
              <div key={s.id} className="w-36 shrink-0">
                <MovieCard
                  id={s.id}
                  title={s.title}
                  year={s.year}
                  posterUrl={s.posterUrl}
                  genres={s.genres}
                  mlAvgScore={s.mlAvgScore}
                  contentType={s.contentType}
                  episodeCount={s.episodeCount}
                  view="grid"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
