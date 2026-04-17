export interface Movie {
  id: string;
  title: string;
  year: number | null;
  overview: string;
  posterUrl: string | null;
  runtime: number | null;
  director: string | null;
  genres: string[];
  cast: string[];
  mlMovieId: number | null;
  mlAvgScore: number | null;
  mlRatingCount: number | null;
  createdAt: Date;
}

export interface Rating {
  id: string;
  score: number;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  movieId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface MovieWithStats extends Movie {
  _count: { ratings: number };
  _avg: { score: number | null };
}

export interface MovieWithRatings extends MovieWithStats {
  ratings: Rating[];
}
