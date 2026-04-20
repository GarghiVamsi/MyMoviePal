import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatScore, formatTitle } from "@/lib/utils";

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
}

export function MovieCard({ id, title, year, posterUrl, genres, overview, avgScore, ratingCount, mlAvgScore }: MovieCardProps) {
  const displayScore = avgScore ?? mlAvgScore;
  const scoreColor = avgScore != null ? "text-amber-400" : "text-blue-400";

  return (
    <Link href={`/movies/${id}`} className="group block">
      <div className="flex gap-4 rounded-xl bg-gray-900 p-3 transition-all duration-200 group-hover:bg-gray-800 group-hover:shadow-2xl group-hover:shadow-black/60">
        {/* Poster */}
        <div className="relative w-24 shrink-0 overflow-hidden rounded-lg bg-gray-800 aspect-[2/3]">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="96px"
              className="object-cover transition-opacity duration-300 group-hover:opacity-90"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
        </div>

        {/* Right side: two columns */}
        <div className="flex flex-1 gap-4 min-w-0">
          {/* Synopsis column */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-100 group-hover:text-amber-400 transition-colors leading-tight">
              {formatTitle(title)}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">{year}</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {genres.slice(0, 3).map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>
            {overview && (
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{overview}</p>
            )}
          </div>

          {/* Ratings column */}
          <div className="w-28 shrink-0 flex flex-col items-center justify-center gap-2 border-l border-gray-700 pl-4">
            {displayScore != null ? (
              <>
                <div className="flex items-center gap-1">
                  <svg className={`h-4 w-4 ${scoreColor}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <span className={`text-lg font-bold ${scoreColor}`}>{formatScore(displayScore)}</span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {avgScore != null ? "User score" : "Community"}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-600 text-center">No ratings yet</p>
            )}
            {ratingCount != null && ratingCount > 0 && (
              <p className="text-xs text-gray-600 text-center">{ratingCount} {ratingCount === 1 ? "rating" : "ratings"}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
