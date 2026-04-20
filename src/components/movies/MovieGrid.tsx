import { MovieCard } from "./MovieCard";
import { MovieWithStats } from "@/types";

interface MovieGridProps {
  movies: MovieWithStats[];
}

export function MovieGrid({ movies }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p className="text-lg font-medium text-gray-500">No movies found</p>
        <p className="text-sm text-gray-600 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          id={movie.id}
          title={movie.title}
          year={movie.year}
          posterUrl={movie.posterUrl}
          genres={movie.genres}
          overview={movie.overview ?? ""}
          avgScore={movie._avg.score}
          ratingCount={movie._count.ratings}
          mlAvgScore={movie.mlAvgScore}
        />
      ))}
    </div>
  );
}
