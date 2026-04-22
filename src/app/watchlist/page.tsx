import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { formatTitle } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Watchlist — MyMoviePal" };

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/watchlist");

  const items = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    include: {
      movie: {
        select: {
          id: true, title: true, year: true, posterUrl: true,
          genres: true, contentType: true, episodeCount: true, runtime: true,
          mlAvgScore: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100">My Watchlist</h1>
        <p className="text-sm text-gray-400 mt-1">
          {session.user.name ?? session.user.email} · {items.length} {items.length === 1 ? "title" : "titles"} saved
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Your watchlist is empty.</p>
          <Link href="/movies" className="text-amber-400 hover:underline text-sm font-medium">
            Browse movies and anime →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const m = item.movie;
            const isAnime = m.contentType === "anime";
            const meta = isAnime && m.episodeCount
              ? `${m.episodeCount} eps`
              : m.runtime
              ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m`
              : null;

            return (
              <Link
                key={item.id}
                href={`/movies/${m.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 hover:bg-gray-900 transition-colors"
              >
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                  {m.posterUrl ? (
                    <Image src={m.posterUrl} alt={m.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-600 text-xs">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-100 truncate">{formatTitle(m.title)}</p>
                  <p className="text-xs text-gray-400">
                    {m.year}{meta ? ` · ${meta}` : ""}
                    {isAnime && <span className="ml-2 text-violet-400">Anime</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.genres.slice(0, 2).map((g) => <Badge key={g}>{g}</Badge>)}
                  </div>
                </div>
                {m.mlAvgScore != null && (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-blue-400">{m.mlAvgScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-400">{isAnime ? "AniList" : "Score"}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
