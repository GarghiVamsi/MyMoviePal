/**
 * Fills missing anime episode thumbnails using two sources:
 *  1. Jikan (MyAnimeList) videos/episodes  — MAL IDs via AniList GraphQL
 *  2. TMDB TV season stills                — TMDB show/season IDs via Fribb anime-lists mapping
 *
 * Only updates episodes that currently have no thumbnail.
 * Skips any URL already stored elsewhere — guards against cross-series duplicates.
 *
 * Usage: npm run fill-episode-thumbnails
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();
const ANILIST_URL = "https://graphql.anilist.co";
const JIKAN_BASE = "https://api.jikan.moe/v4";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_KEY = process.env.TMDB_API_KEY;
const FRIBB_URL =
  "https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-mini.json";
const DELAY_MS = 400;

const ALLOWED_HOSTS = new Set([
  "s4.anilist.co",
  "img1.ak.crunchyroll.com",
  "media.kitsu.io",
  "image.tmdb.org",
]);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isAllowedThumb(url: string): boolean {
  try {
    return ALLOWED_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

// ─── AniList ──────────────────────────────────────────────────────────────────

async function getIdMal(anilistId: number): Promise<number | null> {
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `query($id:Int!){Media(id:$id,type:ANIME){idMal}}`,
        variables: { id: anilistId },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data?.Media?.idMal as number | null) ?? null;
  } catch {
    return null;
  }
}

// ─── Jikan ────────────────────────────────────────────────────────────────────

function parseEpNumber(epField: string): number | null {
  const m = epField.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function getJikanThumbnails(malId: number): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  let page = 1;
  while (true) {
    try {
      const res = await fetch(`${JIKAN_BASE}/anime/${malId}/videos/episodes?page=${page}`);
      if (!res.ok) break;
      const data = await res.json();
      for (const ep of data.data ?? []) {
        const num = parseEpNumber(ep.episode ?? "");
        const thumb: string | null = ep.images?.jpg?.image_url ?? null;
        if (num != null && thumb && isAllowedThumb(thumb)) map.set(num, thumb);
      }
      if (!data.pagination?.has_next_page) break;
      page++;
      await sleep(DELAY_MS);
    } catch {
      break;
    }
  }
  return map;
}

// ─── TMDB ─────────────────────────────────────────────────────────────────────

interface FribbEntry {
  anilist_id?: number;
  themoviedb_id?: number;
  season?: { tmdb?: number };
}

async function loadFribbMapping(): Promise<Map<number, { tmdbId: number; tmdbSeason: number }>> {
  const res = await fetch(FRIBB_URL);
  const data: FribbEntry[] = await res.json();
  const map = new Map<number, { tmdbId: number; tmdbSeason: number }>();
  for (const entry of data) {
    if (entry.anilist_id && entry.themoviedb_id) {
      map.set(entry.anilist_id, {
        tmdbId: entry.themoviedb_id,
        tmdbSeason: entry.season?.tmdb ?? 1,
      });
    }
  }
  return map;
}

// Fetches one season → returns episode_number → still URL
async function getTmdbSeasonThumbnails(
  tmdbId: number,
  season: number
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const res = await fetch(
      `${TMDB_BASE}/tv/${tmdbId}/season/${season}?api_key=${TMDB_KEY}`
    );
    if (!res.ok) return map;
    const data = await res.json();
    for (const ep of data.episodes ?? []) {
      if (ep.episode_number && ep.still_path) {
        map.set(ep.episode_number, `${TMDB_IMG}${ep.still_path}`);
      }
    }
  } catch {
    // ignore
  }
  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!TMDB_KEY) {
    console.error("Missing TMDB_API_KEY in .env");
    process.exit(1);
  }

  const animeWithGaps = await prisma.episode.groupBy({
    by: ["animeId"],
    where: { thumbnail: null },
    _count: { id: true },
  });

  if (animeWithGaps.length === 0) {
    console.log("No missing thumbnails. Nothing to do.");
    return;
  }

  const animeIds = animeWithGaps.map((a) => a.animeId);
  const animeList = await prisma.movie.findMany({
    where: { id: { in: animeIds }, anilistId: { not: null } },
    select: { id: true, title: true, anilistId: true },
  });

  console.log(`\nLoading Fribb anime-lists mapping...`);
  const fribbMap = await loadFribbMapping();
  console.log(`Loaded ${fribbMap.size.toLocaleString()} entries.\n`);

  console.log(`Filling thumbnails for ${animeList.length} anime series...\n`);

  // Pre-load all stored thumbnails for in-memory duplicate checks
  const existingThumbs = new Set<string>(
    (
      await prisma.episode.findMany({
        where: { thumbnail: { not: null } },
        select: { thumbnail: true },
      })
    ).map((r) => r.thumbnail as string)
  );

  let totalFilled = 0;

  for (const anime of animeList) {
    process.stdout.write(`  ${anime.title}...\n`);

    const missing = await prisma.episode.findMany({
      where: { animeId: anime.id, thumbnail: null },
      select: { id: true, number: true },
    });

    const remaining = new Map(missing.map((e) => [e.number, e.id]));

    // ── Source 1: Jikan ───────────────────────────────────────────────────────
    const malId = await getIdMal(anime.anilistId!);
    await sleep(DELAY_MS);

    if (malId) {
      const jikanThumbs = await getJikanThumbnails(malId);
      await sleep(DELAY_MS);

      for (const [num, id] of Array.from(remaining)) {
        const thumb = jikanThumbs.get(num);
        if (!thumb || existingThumbs.has(thumb)) continue;
        await prisma.episode.update({ where: { id }, data: { thumbnail: thumb } });
        existingThumbs.add(thumb);
        remaining.delete(num);
        totalFilled++;
      }
      process.stdout.write(`    Jikan: filled ${missing.length - remaining.size} / ${missing.length}\n`);
    } else {
      process.stdout.write(`    Jikan: no MAL ID\n`);
    }

    if (remaining.size === 0) continue;

    // ── Source 2: TMDB ────────────────────────────────────────────────────────
    const fribb = fribbMap.get(anime.anilistId!);
    if (!fribb) {
      process.stdout.write(`    TMDB:  no Fribb mapping\n`);
      continue;
    }

    const tmdbThumbs = await getTmdbSeasonThumbnails(fribb.tmdbId, fribb.tmdbSeason);
    await sleep(DELAY_MS);

    let tmdbFilled = 0;
    for (const [num, id] of Array.from(remaining)) {
      const thumb = tmdbThumbs.get(num);
      if (!thumb || existingThumbs.has(thumb)) continue;
      await prisma.episode.update({ where: { id }, data: { thumbnail: thumb } });
      existingThumbs.add(thumb);
      remaining.delete(num);
      tmdbFilled++;
      totalFilled++;
    }
    process.stdout.write(`    TMDB:  filled ${tmdbFilled} / ${missing.length - (missing.length - remaining.size - tmdbFilled)} remaining (show ${fribb.tmdbId} S${fribb.tmdbSeason})\n`);
  }

  console.log(`\nDone — ${totalFilled} episode thumbnails filled.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
