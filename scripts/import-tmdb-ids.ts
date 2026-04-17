/**
 * One-time backfill: reads links.csv and sets tmdbId on every movie
 * that was seeded before the tmdbId column existed.
 *
 * Usage: npm run import-tmdb-ids
 */

import { PrismaClient } from "@prisma/client";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();
const ZIP_PATH = path.join(__dirname, "../dataset/ml-32m.zip");
const EXTRACT_DIR = "/tmp/ml32m";
const LINKS_CSV = `${EXTRACT_DIR}/ml-32m/links.csv`;
const BATCH_SIZE = 500;

function streamLines(filePath: string, onLine: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    });
    rl.on("line", onLine);
    rl.on("close", resolve);
    rl.on("error", reject);
  });
}

async function main() {
  // Extract zip if not already done
  if (!fs.existsSync(LINKS_CSV)) {
    console.log("Extracting ml-32m.zip...");
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    cp.execSync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`, { stdio: "inherit" });
  }

  // Check how many movies still need tmdbId
  const missing = await prisma.movie.count({ where: { tmdbId: null, mlMovieId: { not: null } } });
  if (missing === 0) {
    console.log("All movies already have tmdbId. Run npm run fetch-posters next.");
    return;
  }
  console.log(`Backfilling tmdbId for ${missing.toLocaleString()} movies...`);

  // Build mlMovieId → tmdbId map from links.csv
  const links = new Map<number, number>();
  let isHeader = true;
  await streamLines(LINKS_CSV, (line) => {
    if (isHeader) { isHeader = false; return; }
    const cols = line.split(",");
    const mlId = parseInt(cols[0]);
    const tmdbId = parseInt(cols[2]);
    if (!isNaN(mlId) && !isNaN(tmdbId) && tmdbId > 0) links.set(mlId, tmdbId);
  });
  console.log(`Loaded ${links.size.toLocaleString()} links from links.csv.`);

  // Fetch all movies that need updating (in pages to avoid loading all 87k into memory)
  // Track which tmdbIds we've already assigned so duplicates don't conflict
  const usedTmdbIds = new Set<number>();
  let processed = 0;
  let cursor: string | undefined;

  while (true) {
    const movies = await prisma.movie.findMany({
      where: { tmdbId: null, mlMovieId: { not: null } },
      select: { id: true, mlMovieId: true },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (movies.length === 0) break;

    // Build update pairs, skipping duplicate tmdbIds within this run
    const updates = movies
      .filter((m): m is { id: string; mlMovieId: number } => m.mlMovieId !== null)
      .flatMap((m) => {
        const tmdbId = links.get(m.mlMovieId);
        if (!tmdbId || usedTmdbIds.has(tmdbId)) return [];
        usedTmdbIds.add(tmdbId);
        return [{ id: m.id, tmdbId }];
      });

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map(({ id, tmdbId }) =>
          prisma.movie.update({ where: { id }, data: { tmdbId } })
        )
      );
    }

    processed += movies.length;
    cursor = movies[movies.length - 1].id;
    process.stdout.write(`\r  ${processed.toLocaleString()} / ${missing.toLocaleString()} processed`);
  }

  console.log(`\n\nDone — tmdbId set on ${processed.toLocaleString()} movies.`);
  console.log("Now run:  npm run fetch-posters");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
