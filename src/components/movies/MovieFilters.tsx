"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SearchAutocomplete } from "@/components/movies/SearchAutocomplete";

const GENRES = [
  "Action", "Adventure", "Animation", "Children", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Film-Noir", "Horror", "Musical",
  "Mystery", "Romance", "Sci-Fi", "Thriller", "War", "Western",
];

const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

const SELECT_CLASS =
  "h-11 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500";

export function MovieFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      params.set("r", String(Date.now()));
      router.push(`/movies?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <SearchAutocomplete
        defaultValue={searchParams.get("q") ?? ""}
        onSearch={(q) => update("q", q)}
      />
      <label htmlFor="type-filter" className="sr-only">Content type</label>
      <select
        id="type-filter"
        value={searchParams.get("type") ?? ""}
        onChange={(e) => update("type", e.target.value)}
        className={SELECT_CLASS}
        aria-label="Filter by content type"
      >
        <option value="">All</option>
        <option value="movie">Movies</option>
        <option value="anime">Anime</option>
      </select>
      <label htmlFor="genre-filter" className="sr-only">Genre</label>
      <select
        id="genre-filter"
        value={searchParams.get("genre") ?? ""}
        onChange={(e) => update("genre", e.target.value)}
        className={SELECT_CLASS}
        aria-label="Filter by genre"
      >
        <option value="">All Genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <label htmlFor="year-filter" className="sr-only">Year</label>
      <select
        id="year-filter"
        value={searchParams.get("year") ?? ""}
        onChange={(e) => update("year", e.target.value)}
        className={SELECT_CLASS}
        aria-label="Filter by year"
      >
        <option value="">All Years</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <label htmlFor="sort-filter" className="sr-only">Sort by</label>
      <select
        id="sort-filter"
        value={searchParams.get("sort") ?? "popular"}
        onChange={(e) => update("sort", e.target.value)}
        className={SELECT_CLASS}
        aria-label="Sort movies"
      >
        <option value="popular">Most Popular</option>
        <option value="rating">Highest Rated</option>
        <option value="year">Newest First</option>
        <option value="title">A–Z</option>
      </select>
    </div>
  );
}
