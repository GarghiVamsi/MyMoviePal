"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/Input";

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
      router.push(`/movies?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          placeholder="Search movies..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          className="h-11"
        />
      </div>
      <select
        value={searchParams.get("genre") ?? ""}
        onChange={(e) => update("genre", e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <select
        value={searchParams.get("year") ?? ""}
        onChange={(e) => update("year", e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All Years</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={searchParams.get("sort") ?? "popular"}
        onChange={(e) => update("sort", e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="popular">Most Popular</option>
        <option value="rating">Highest Rated</option>
        <option value="year">Newest First</option>
        <option value="title">A–Z</option>
      </select>
    </div>
  );
}
