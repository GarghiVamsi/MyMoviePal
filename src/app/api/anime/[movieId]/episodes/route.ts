import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 8;
const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_TIMEOUT_MS = 10_000;

// Only thumbnails from these hosts are stored — must match next.config.mjs allowlist
const ALLOWED_THUMBNAIL_HOSTS = new Set([
  "s4.anilist.co",
  "img1.ak.crunchyroll.com",
  "media.kitsu.io",
  "image.tmdb.org",
]);

const anilistSchema = z.object({
  data: z.object({
    Media: z
      .object({
        episodes: z.number().nullable().optional(),
        streamingEpisodes: z
          .array(
            z.object({
              title: z.string(),
              thumbnail: z.string(),
            })
          )
          .default([]),
        airingSchedule: z
          .object({
            nodes: z.array(
              z.object({
                episode: z.number().int().positive(),
                airingAt: z.number().int().positive(),
              })
            ),
          })
          .nullable()
          .default(null),
      })
      .nullable(),
  }),
});

function isThumbnailAllowed(url: string): boolean {
  try {
    return ALLOWED_THUMBNAIL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

// Try to extract episode number from AniList streaming episode title.
// Common formats: "Episode 1 - Title", "Ep. 1: Title", "1 - Title"
function parseEpisodeNumber(title: string): number | null {
  const patterns = [
    /(?:episode|ep)\.?\s*(\d+)/i,
    /^(\d+)\s*[-:.\s]/,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n <= 10_000) return n;
    }
  }
  return null;
}

async function fetchAndStoreEpisodes(
  animeId: string,
  anilistId: number,
  episodeCount: number | null
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANILIST_TIMEOUT_MS);

  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `
          query ($id: Int!) {
            Media(id: $id, type: ANIME) {
              episodes
              streamingEpisodes { title thumbnail }
              airingSchedule(notYetAired: false, perPage: 150) {
                nodes { episode airingAt }
              }
            }
          }
        `,
        variables: { id: anilistId },
      }),
      signal: controller.signal,
    });

    if (!res.ok) return;

    const raw = await res.json();
    const parsed = anilistSchema.safeParse(raw);
    if (!parsed.success || !parsed.data.data.Media) return;

    const media = parsed.data.data.Media;
    const count = media.episodes ?? episodeCount ?? 0;
    if (count <= 0 || count > 10_000) return;

    // episode number → air date
    const airDates = new Map<number, Date>();
    if (media.airingSchedule?.nodes) {
      for (const node of media.airingSchedule.nodes) {
        if (node.episode <= count) {
          airDates.set(node.episode, new Date(node.airingAt * 1000));
        }
      }
    }

    // Collect all allowed thumbnail URLs from this fetch
    const candidateThumbnails = new Set<string>();
    for (const ep of media.streamingEpisodes) {
      if (isThumbnailAllowed(ep.thumbnail)) candidateThumbnails.add(ep.thumbnail);
    }

    // Any thumbnail already stored for a *different* anime is a cross-season
    // duplicate leaked by AniList's streamingEpisodes — exclude it.
    const takenRows = candidateThumbnails.size > 0
      ? await prisma.episode.findMany({
          where: { thumbnail: { in: Array.from(candidateThumbnails) }, animeId: { not: animeId } },
          select: { thumbnail: true },
          distinct: ["thumbnail"],
        })
      : [];
    const takenThumbnails = new Set(takenRows.map((r) => r.thumbnail as string));

    // episode number → title + thumbnail (only from allowed host, not a cross-season dupe)
    const streamingByNum = new Map<number, { title: string; thumbnail: string | null }>();
    for (const ep of media.streamingEpisodes) {
      const num = parseEpisodeNumber(ep.title);
      if (num && num <= count) {
        const allowed = isThumbnailAllowed(ep.thumbnail) && !takenThumbnails.has(ep.thumbnail);
        streamingByNum.set(num, {
          title: ep.title,
          thumbnail: allowed ? ep.thumbnail : null,
        });
      }
    }

    const records = Array.from({ length: count }, (_, i) => {
      const number = i + 1;
      const streaming = streamingByNum.get(number);
      return {
        animeId,
        number,
        title: streaming?.title ?? null,
        thumbnail: streaming?.thumbnail ?? null,
        airDate: airDates.get(number) ?? null,
      };
    });

    await prisma.episode.createMany({ data: records, skipDuplicates: true });
  } catch {
    // Network/timeout errors are silently swallowed — the endpoint will
    // return an empty list and the client can retry later.
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(
  req: Request,
  { params }: { params: { movieId: string } }
) {
  const movieId = params.movieId;
  if (!movieId || typeof movieId !== "string" || movieId.length > 64) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

  const anime = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { id: true, contentType: true, anilistId: true, episodeCount: true },
  });

  if (!anime) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (anime.contentType !== "anime") {
    return NextResponse.json({ error: "Not an anime" }, { status: 400 });
  }

  // Lazy-populate on first visit
  const existing = await prisma.episode.count({ where: { animeId: movieId } });
  if (existing === 0 && anime.anilistId) {
    await fetchAndStoreEpisodes(movieId, anime.anilistId, anime.episodeCount);
  }

  const [episodes, total] = await Promise.all([
    prisma.episode.findMany({
      where: { animeId: movieId },
      orderBy: { number: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, number: true, title: true, thumbnail: true, airDate: true },
    }),
    prisma.episode.count({ where: { animeId: movieId } }),
  ]);

  return NextResponse.json({
    episodes,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
