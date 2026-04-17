import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatScore } from "@/lib/utils";

interface MovieCardProps {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  genres: string[];
  avgScore?: number | null;
  ratingCount?: number;
  mlAvgScore?: number | null;
}

export function MovieCard({ id, title, year, posterUrl, genres, avgScore, ratingCount, mlAvgScore }: MovieCardProps) {
  const displayScore = avgScore ?? mlAvgScore;
  const scoreColor = avgScore != null ? "text-amber-400" : "text-blue-400";
  return (
    <Link href={`/movies/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-900 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60">
        <div className="relative aspect-[2/3] w-full bg-gray-800">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-opacity duration-300 group-hover:opacity-90"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
          {displayScore != null && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
              <svg className={`h-3 w-3 ${scoreColor}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span className={`text-xs font-bold ${scoreColor}`}>{formatScore(displayScore)}</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="truncate font-semibold text-gray-100 group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{year}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {genres.slice(0, 2).map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </div>
          {ratingCount != null && ratingCount > 0 && (
            <p className="mt-1.5 text-xs text-gray-600">{ratingCount} {ratingCount === 1 ? "rating" : "ratings"}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
