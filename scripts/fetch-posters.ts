/**
 * One-time script: fetches poster_path, overview, runtime, and cast from TMDB
 * for every movie that has a tmdbId but no posterUrl.
 *
 * Usage:  npm run fetch-posters
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

const CONCURRENCY = 20;   // parallel requests at a time
const RETRY_LIMIT = 3;

if (!API_KEY) {
  console.error("Missing TMDB_API_KEY in .env");
  process.exit(1);
}

interface TmdbMovie {
  poster_path: string | null;
  overview: string | null;
  runtime: number | null;
  credits?: {
    crew: { job: string; name: string }[];
    cast: { name: string; order: number }[];
  };
}

async function fetchTmdb(tmdbId: number, attempt = 1): Promise<TmdbMovie | null> {
  try {
    const url = `${BASE}/movie/${tmdbId}?api_key=${API_KEY}&append_to_response=credits&language=en-US`;
    const res = await fetch(url);

    if (res.status === 429) {
      // Rate limited — back off and retry
      await sleep(2000 * attempt);
      return attempt < RETRY_LIMIT ? fetchTmdb(tmdbId, attempt + 1) : null;
    }
    if (res.status === 404) return null;
    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processChunk(
  chunk: { id: string; tmdbId: number }[]
): Promise<{ updated: number; skipped: number }> {
  const results = await Promise.all(
    chunk.map(async ({ id, tmdbId }) => {
      const data = await fetchTmdb(tmdbId);
      if (!data) return { id, update: null };

      const director = data.credits?.crew.find((c) => c.job === "Director")?.name ?? null;
      const cast = data.credits?.cast
        .sort((a, b) => a.order - b.order)
        .slice(0, 8)
        .map((c) => c.name) ?? [];

      return {
        id,
        update: {
          posterUrl: data.poster_path ? `${IMG_BASE}${data.poster_path}` : null,
          overview: data.overview || "",
          runtime: data.runtime ?? null,
          director,
          cast,
        },
      };
    })
  );

  let updated = 0;
  let skipped = 0;
  for (const { id, update } of results) {
    if (!update) { skipped++; continue; }
    await prisma.movie.update({ where: { id }, data: update });
    updated++;
  }
  return { updated, skipped };
}

async function main() {
  const total = await prisma.movie.count({ where: { tmdbId: { not: null }, posterUrl: null } });

  if (total === 0) {
    console.log("All movies already have posters. Nothing to do.");
    return;
  }

  console.log(`Fetching TMDB data for ${total.toLocaleString()} movies (${CONCURRENCY} concurrent)...`);
  console.log("Estimated time: ~" + Math.round(total / CONCURRENCY * 0.3 / 60) + " minutes\n");

  let offset = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const start = Date.now();

  while (offset < total) {
    const batch = await prisma.movie.findMany({
      where: { tmdbId: { not: null }, posterUrl: null },
      select: { id: true, tmdbId: true },
      take: CONCURRENCY,
      skip: offset,
    });

    if (batch.length === 0) break;

    const chunk = batch
      .filter((m): m is { id: string; tmdbId: number } => m.tmdbId !== null);

    const { updated, skipped } = await processChunk(chunk);
    totalUpdated += updated;
    totalSkipped += skipped;
    offset += batch.length;

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const pct = ((offset / total) * 100).toFixed(1);
    process.stdout.write(
      `\r  ${offset.toLocaleString()} / ${total.toLocaleString()} (${pct}%) — ${totalUpdated} updated, ${totalSkipped} skipped — ${elapsed}s elapsed`
    );
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\nDone in ${elapsed}s — ${totalUpdated.toLocaleString()} posters fetched.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
