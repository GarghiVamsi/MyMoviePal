"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  thumbnail: string | null;
  airDate: string | null;
}

interface EpisodesResponse {
  episodes: Episode[];
  total: number;
  page: number;
  totalPages: number;
}

interface Props {
  animeId: string;
  episodeCount: number | null;
}

function EpisodeSkeleton() {
  return (
    <div className="animate-pulse rounded-lg bg-gray-800/60 border border-gray-700/40">
      <div className="aspect-video w-full rounded-t-lg bg-gray-700/60" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 rounded bg-gray-700/60" />
        <div className="h-3 w-full rounded bg-gray-700/40" />
      </div>
    </div>
  );
}

export function EpisodesSection({ animeId, episodeCount }: Props) {
  const [data, setData] = useState<EpisodesResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/anime/${animeId}/episodes?page=${p}`);
        if (!res.ok) throw new Error();
        const json: EpisodesResponse = await res.json();
        setData(json);
        setPage(p);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [animeId]
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const total = data?.total ?? episodeCount ?? 0;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-100">
          Episodes
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {total.toLocaleString()} total
            </span>
          )}
        </h2>
      </div>

      {error && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
          <p className="text-sm text-gray-500">
            Failed to load episodes.{" "}
            <button
              onClick={() => fetchPage(page)}
              className="text-amber-400 hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      )}

      {!error && loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <EpisodeSkeleton key={i} />
          ))}
        </div>
      )}

      {!error && !loading && total === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 text-center">
          <p className="text-sm text-gray-500">No episode data available.</p>
        </div>
      )}

      {!error && !loading && data && data.episodes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.episodes.map((ep) => (
              <div
                key={ep.id}
                className="rounded-lg border border-gray-800 bg-gray-900/60 overflow-hidden hover:border-gray-600 transition-colors"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-gray-800">
                  {ep.thumbnail ? (
                    <Image
                      src={ep.thumbnail}
                      alt={`Episode ${ep.number}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {ep.number}
                      </span>
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-gray-200">
                    EP {ep.number}
                  </span>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs text-gray-300 leading-snug min-h-[2.5rem]">
                    {ep.title ?? `Episode ${ep.number}`}
                  </p>
                  {ep.airDate && (
                    <p className="mt-1 text-[10px] text-gray-600">
                      {new Date(ep.airDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => fetchPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-800 text-sm hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => fetchPage(page + 1)}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-lg bg-gray-800 text-sm hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
