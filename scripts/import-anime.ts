/**
 * Imports anime from AniList GraphQL API into the movies table.
 * Fetches the top PAGE_LIMIT pages (50 per page) sorted by popularity.
 * Upserts by anilistId so re-runs are safe.
 *
 * Usage: npm run import-anime
 * No API key required — AniList is a public GraphQL API.
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();
const ANILIST_URL = "https://graphql.anilist.co";
const PER_PAGE = 50;
const PAGE_LIMIT = 200; // 200 × 50 = 10,000 anime max
const REQUEST_DELAY_MS = 700; // stay well within 90 req/min rate limit

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      total
    }
    media(type: ANIME, sort: POPULARITY_DESC, countryOfOrigin: "JP") {
      id
      title {
        romaji
        english
      }
      description(asHtml: false)
      episodes
      coverImage {
        large
      }
      genres
      startDate {
        year
      }
      averageScore
      popularity
    }
  }
}
`;

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null };
  description: string | null;
  episodes: number | null;
  coverImage: { large: string | null };
  genres: string[];
  startDate: { year: number | null };
  averageScore: number | null;
  popularity: number;
}

interface AniListResponse {
  data: {
    Page: {
      pageInfo: { hasNextPage: boolean; total: number };
      media: AniListMedia[];
    };
  };
  errors?: { message: string }[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(page: number): Promise<AniListResponse | null> {
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
    });

    if (res.status === 429) {
      console.log("\nRate limited — waiting 60s...");
      await sleep(60_000);
      return fetchPage(page);
    }
    if (!res.ok) return null;

    const json = (await res.json()) as AniListResponse;
    if (json.errors?.length) {
      console.error("\nAniList error:", json.errors[0].message);
      return null;
    }
    return json;
  } catch (e) {
    console.error("\nFetch error:", e);
    return null;
  }
}

function mapGenres(anilistGenres: string[]): string[] {
  // Normalize AniList genre names to match existing genre vocabulary where possible
  const map: Record<string, string> = {
    "Sci-Fi": "Sci-Fi",
    "Science Fiction": "Sci-Fi",
    "Slice of Life": "Drama",
    "Supernatural": "Fantasy",
    "Mecha": "Sci-Fi",
    "Sports": "Action",
    "Ecchi": "Comedy",
    "Hentai": "Drama",
  };
  return anilistGenres.map((g) => map[g] ?? g);
}

async function main() {
  console.log("Importing anime from AniList GraphQL API...\n");

  // Check how many already exist
  const existingCount = await prisma.movie.count({ where: { contentType: "anime" } });
  console.log(`${existingCount.toLocaleString()} anime already in DB`);

  const existingIds = new Set<number>();
  if (existingCount > 0) {
    const existing = await prisma.movie.findMany({
      where: { contentType: "anime", anilistId: { not: null } },
      select: { anilistId: true },
    });
    existing.forEach((m) => { if (m.anilistId) existingIds.add(m.anilistId); });
  }

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let page = 1;
  let hasNextPage = true;
  const start = Date.now();

  while (hasNextPage && page <= PAGE_LIMIT) {
    const response = await fetchPage(page);

    if (!response) {
      console.log(`\nFailed to fetch page ${page}, stopping.`);
      break;
    }

    const { pageInfo, media } = response.data.Page;
    hasNextPage = pageInfo.hasNextPage;

    for (const anime of media) {
      const title = anime.title.english ?? anime.title.romaji;
      const year = anime.startDate.year ?? null;
      // AniList scores are 0–100; convert to 0–10
      const score = anime.averageScore != null ? anime.averageScore / 10 : null;
      const genres = mapGenres(anime.genres);
      const posterUrl = anime.coverImage.large ?? null;
      const overview = anime.description ?? "";

      const isNew = !existingIds.has(anime.id);

      try {
        await prisma.movie.upsert({
          where: { anilistId: anime.id },
          update: {
            title,
            year,
            overview,
            posterUrl,
            genres,
            episodeCount: anime.episodes ?? null,
            mlAvgScore: score,
            mlRatingCount: anime.popularity,
          },
          create: {
            title,
            year,
            overview,
            posterUrl,
            genres,
            episodeCount: anime.episodes ?? null,
            mlAvgScore: score,
            mlRatingCount: anime.popularity,
            contentType: "anime",
            anilistId: anime.id,
            cast: [],
          },
        });
        if (isNew) totalInserted++; else totalUpdated++;
      } catch {
        totalSkipped++;
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    process.stdout.write(
      `\r  Page ${page} / ${Math.min(pageInfo.total ? Math.ceil(pageInfo.total / PER_PAGE) : PAGE_LIMIT, PAGE_LIMIT)} — ${totalInserted} inserted, ${totalUpdated} updated, ${totalSkipped} skipped — ${elapsed}s`
    );

    page++;
    if (hasNextPage) await sleep(REQUEST_DELAY_MS);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\nDone in ${elapsed}s — ${totalInserted.toLocaleString()} anime added, ${totalUpdated.toLocaleString()} updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
