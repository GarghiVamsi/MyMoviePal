import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatScore, formatTitle, stripHtml } from "@/lib/utils";

interface MovieCardProps {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  genres: string[];
  overview?: string;
  avgScore?: number | null;
  ratingCount?: number;
  mlAvgScore?: number | null;
  contentType?: string;
  episodeCount?: number | null;
  runtime?: number | null;
  view?: "list" | "grid";
}

export function MovieCard({
  id, title, year, posterUrl, genres, overview, avgScore, ratingCount,
  mlAvgScore, contentType, episodeCount, runtime, view = "list",
}: MovieCardProps) {
  const displayScore = avgScore ?? mlAvgScore;
  const scoreColor = avgScore != null ? "text-amber-400" : "text-blue-400";
  const isAnime = contentType === "anime";
  const scoreLabel = avgScore != null ? "User score" : isAnime ? "AniList score" : "Community";

  if (view === "grid") {
    return (
      <Link href={`/movies/${id}`} className="group block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-800">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width:640px) 45vw, 200px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{formatTitle(title)}</p>
            <p className="text-xs text-gray-300 mt-0.5">{year}</p>
          </div>
          {displayScore != null && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5">
              <svg className={`h-3 w-3 ${isAnime ? "text-violet-400" : "text-amber-400"}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span className="text-xs font-bold text-white">{formatScore(displayScore)}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/movies/${id}`} className="group block">
      <div className="flex gap-4 rounded-xl bg-gray-900 p-3 transition-all duration-200 group-hover:bg-gray-800 group-hover:shadow-2xl group-hover:shadow-black/60">
        <div className="relative w-24 shrink-0 overflow-hidden rounded-lg bg-gray-800 aspect-[2/3]">
          {posterUrl ? (
            <Image src={posterUrl} alt={title} fill sizes="96px" className="object-cover transition-opacity duration-300 group-hover:opacity-90" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-1 gap-4 min-w-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-100 group-hover:text-amber-400 transition-colors leading-tight">
              {formatTitle(title)}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-2">
              {year}
              {isAnime && episodeCount ? ` · ${episodeCount} eps` : !isAnime && runtime ? ` · ${Math.floor(runtime / 60)}h ${runtime % 60}m` : ""}
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {genres.slice(0, 3).map((g) => <Badge key={g}>{g}</Badge>)}
            </div>
            {overview && (
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{stripHtml(overview)}</p>
            )}
          </div>

          <div className="w-28 shrink-0 flex flex-col items-center justify-center gap-2 border-l border-gray-700 pl-4">
            {displayScore != null ? (
              <>
                <div className="flex items-center gap-1">
                  <svg className={`h-4 w-4 ${scoreColor}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <span className={`text-lg font-bold ${scoreColor}`}>{formatScore(displayScore)}</span>
                </div>
                <p className="text-xs text-gray-400 text-center">{scoreLabel}</p>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center">No ratings yet</p>
            )}
            {ratingCount != null && ratingCount > 0 && (
              <p className="text-xs text-gray-400 text-center">{ratingCount} {ratingCount === 1 ? "rating" : "ratings"}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
