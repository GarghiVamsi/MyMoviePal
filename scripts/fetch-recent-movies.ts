/**
 * Fetches movies released 2024–present from TMDB and upserts them into the DB.
 * Skips any movie whose tmdbId already exists.
 *
 * Usage: npm run fetch-recent-movies
 * Requires TMDB_API_KEY in .env
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();
const API_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const CONCURRENCY = 15;
const RETRY_LIMIT = 3;

if (!API_KEY) {
  console.error("Missing TMDB_API_KEY in .env");
  process.exit(1);
}

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  53: "Thriller", 10752: "War", 37: "Western",
};

interface DiscoverResult {
  id: number;
  title: string;
  release_date: string;
  genre_ids: number[];
  overview: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
}

interface DiscoverPage {
  results: DiscoverResult[];
  total_pages: number;
  total_results: number;
}

interface TmdbDetail {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  runtime: number | null;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  credits: {
    crew: { job: string; name: string }[];
    cast: { name: string; order: number }[];
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tmdbFetch<T>(url: string, attempt = 1): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(2000 * attempt);
      return attempt < RETRY_LIMIT ? tmdbFetch(url, attempt + 1) : null;
    }
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function discoverPage(page: number): Promise<DiscoverPage | null> {
  const today = new Date().toISOString().split("T")[0];
  const url =
    `${BASE}/discover/movie?api_key=${API_KEY}` +
    `&primary_release_date.gte=2024-01-01` +
    `&primary_release_date.lte=${today}` +
    `&sort_by=popularity.desc` +
    `&vote_count.gte=10` +
    `&language=en-US` +
    `&page=${page}`;
  return tmdbFetch<DiscoverPage>(url);
}

async function fetchDetail(tmdbId: number): Promise<TmdbDetail | null> {
  const url = `${BASE}/movie/${tmdbId}?api_key=${API_KEY}&append_to_response=credits&language=en-US`;
  return tmdbFetch<TmdbDetail>(url);
}

async function processChunk(tmdbIds: number[]): Promise<{ inserted: number; failed: number }> {
  const details = await Promise.all(tmdbIds.map(fetchDetail));
  let inserted = 0;
  let failed = 0;

  for (const detail of details) {
    if (!detail) { failed++; continue; }

    const year = detail.release_date ? parseInt(detail.release_date.split("-")[0]) : null;
    const director = detail.credits?.crew.find((c) => c.job === "Director")?.name ?? null;
    const cast = detail.credits?.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 8)
      .map((c) => c.name) ?? [];
    const genres = detail.genres.map((g) => g.name);

    try {
      const exists = await prisma.movie.findFirst({ where: { tmdbId: detail.id }, select: { id: true } });
      if (!exists) {
        await prisma.movie.create({
          data: {
            title: detail.title,
            year,
            overview: detail.overview ?? "",
            posterUrl: detail.poster_path ? `${IMG_BASE}${detail.poster_path}` : null,
            runtime: detail.runtime ?? null,
            director,
            cast,
            genres,
            tmdbId: detail.id,
            mlAvgScore: detail.vote_average > 0 ? detail.vote_average : null,
            mlRatingCount: detail.vote_count > 0 ? detail.vote_count : null,
            contentType: "movie",
          },
        });
        inserted++;
      }
    } catch {
      failed++;
    }
  }

  return { inserted, failed };
}

async function main() {
  console.log("Discovering recent movies (2024–present) from TMDB...\n");

  // Collect all tmdbIds from discover pages
  const firstPage = await discoverPage(1);
  if (!firstPage) {
    console.error("Failed to fetch first discover page.");
    process.exit(1);
  }

  const totalPages = Math.min(firstPage.total_pages, 500); // TMDB caps at 500 pages
  console.log(`Found ${firstPage.total_results.toLocaleString()} movies across ${totalPages} pages`);

  // Fetch existing tmdbIds from DB to skip re-imports
  console.log("Loading existing tmdbIds from DB...");
  const existing = await prisma.movie.findMany({
    where: { tmdbId: { not: null }, contentType: "movie" },
    select: { tmdbId: true },
  });
  const existingIds = new Set(existing.map((m) => m.tmdbId as number));
  console.log(`${existingIds.size.toLocaleString()} movies already in DB\n`);

  const newIds: number[] = [];

  // Page through discover results
  process.stdout.write(`Scanning discover pages: 1 / ${totalPages}`);
  for (let page = 1; page <= totalPages; page++) {
    const data = page === 1 ? firstPage : await discoverPage(page);
    if (!data) continue;

    for (const movie of data.results) {
      if (!existingIds.has(movie.id)) newIds.push(movie.id);
    }

    process.stdout.write(`\rScanning discover pages: ${page} / ${totalPages} — ${newIds.length} new found`);
  }
  console.log(`\n\n${newIds.length} new movies to import\n`);

  if (newIds.length === 0) {
    console.log("Nothing to import. DB is up to date.");
    return;
  }

  // Fetch full details and insert in chunks
  let totalInserted = 0;
  let totalFailed = 0;
  const start = Date.now();

  for (let i = 0; i < newIds.length; i += CONCURRENCY) {
    const chunk = newIds.slice(i, i + CONCURRENCY);
    const { inserted, failed } = await processChunk(chunk);
    totalInserted += inserted;
    totalFailed += failed;

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const pct = (((i + chunk.length) / newIds.length) * 100).toFixed(1);
    process.stdout.write(
      `\r  ${(i + chunk.length).toLocaleString()} / ${newIds.length.toLocaleString()} (${pct}%) — ${totalInserted} inserted, ${totalFailed} failed — ${elapsed}s`
    );
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\nDone in ${elapsed}s — ${totalInserted.toLocaleString()} movies added.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
