import { PrismaClient } from "@prisma/client";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";

const prisma = new PrismaClient();
const BATCH_SIZE = 500;
const ZIP_PATH = path.join(__dirname, "../dataset/ml-32m.zip");
const EXTRACT_DIR = "/tmp/ml32m";
const MOVIES_CSV = `${EXTRACT_DIR}/ml-32m/movies.csv`;
const RATINGS_CSV = `${EXTRACT_DIR}/ml-32m/ratings.csv`;
const LINKS_CSV = `${EXTRACT_DIR}/ml-32m/links.csv`;

interface MovieRow {
  mlMovieId: number;
  tmdbId?: number | null;
  title: string;
  year?: number | null;
  genres: string[];
  overview: string;
  cast: string[];
  mlAvgScore: number | null;
  mlRatingCount: number | null;
}

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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function extractIfNeeded() {
  if (fs.existsSync(MOVIES_CSV) && fs.existsSync(RATINGS_CSV)) return;

  if (!fs.existsSync(ZIP_PATH)) {
    throw new Error(`Dataset zip not found at ${ZIP_PATH}`);
  }

  console.log("Extracting ml-32m.zip (this may take a minute)...");
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  cp.execSync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`, { stdio: "inherit" });
  console.log("Extraction complete.");
}

async function buildRatingAggregates(): Promise<Map<number, { sum: number; count: number }>> {
  console.log("Streaming ratings.csv to compute per-movie averages (32M rows)...");
  const agg = new Map<number, { sum: number; count: number }>();
  let processed = 0;
  let isHeader = true;

  await streamLines(RATINGS_CSV, (line) => {
    if (isHeader) { isHeader = false; return; }
    const comma1 = line.indexOf(",");
    const comma2 = line.indexOf(",", comma1 + 1);
    const comma3 = line.indexOf(",", comma2 + 1);
    const movieId = parseInt(line.slice(comma1 + 1, comma2));
    const rating = parseFloat(line.slice(comma2 + 1, comma3));
    if (isNaN(movieId) || isNaN(rating)) return;
    const entry = agg.get(movieId);
    if (entry) { entry.sum += rating; entry.count++; }
    else agg.set(movieId, { sum: rating, count: 1 });
    processed++;
    if (processed % 5_000_000 === 0) process.stdout.write(`  ${processed / 1_000_000}M rows processed...\n`);
  });

  console.log(`Done — ${processed.toLocaleString()} ratings, ${agg.size.toLocaleString()} movies have ratings.`);
  return agg;
}

async function buildTmdbMap(): Promise<Map<number, number>> {
  console.log("Parsing links.csv for TMDB IDs...");
  const map = new Map<number, number>();
  let isHeader = true;

  await streamLines(LINKS_CSV, (line) => {
    if (isHeader) { isHeader = false; return; }
    const cols = line.split(",");
    const mlId = parseInt(cols[0]);
    const tmdbId = parseInt(cols[2]);
    if (!isNaN(mlId) && !isNaN(tmdbId) && tmdbId > 0) map.set(mlId, tmdbId);
  });

  console.log(`Loaded ${map.size.toLocaleString()} TMDB IDs.`);
  return map;
}

async function parseMovies(
  agg: Map<number, { sum: number; count: number }>,
  tmdbMap: Map<number, number>
): Promise<MovieRow[]> {
  console.log("Parsing movies.csv...");
  const movies: MovieRow[] = [];
  let isHeader = true;

  await streamLines(MOVIES_CSV, (line) => {
    if (isHeader) { isHeader = false; return; }
    const cols = parseCSVLine(line);
    if (cols.length < 3) return;

    const mlMovieId = parseInt(cols[0]);
    const rawTitle = cols[1].trim();
    const genreStr = cols[2].trim();

    const yearMatch = rawTitle.match(/\((\d{4})\)\s*$/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    const title = rawTitle.replace(/\s*\(\d{4}\)\s*$/, "").trim();
    const genres = genreStr === "(no genres listed)" ? [] : genreStr.split("|");

    const entry = agg.get(mlMovieId);
    // ML ratings are 0.5–5.0; multiply ×2 to normalise to 1–10 scale
    const mlAvgScore = entry ? Math.round((entry.sum / entry.count) * 2 * 10) / 10 : null;
    const mlRatingCount = entry ? entry.count : null;
    const tmdbId = tmdbMap.get(mlMovieId) ?? null;

    movies.push({ mlMovieId, tmdbId, title, year, genres, overview: "", cast: [], mlAvgScore, mlRatingCount });
  });

  console.log(`Parsed ${movies.length.toLocaleString()} movies.`);
  return movies;
}

async function batchInsert(movies: MovieRow[]) {
  console.log(`Inserting ${movies.length.toLocaleString()} movies in batches of ${BATCH_SIZE}...`);
  let inserted = 0;

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    await prisma.movie.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
    process.stdout.write(`\r  ${inserted.toLocaleString()} / ${movies.length.toLocaleString()}`);
  }
  console.log("\nInsert complete.");
}

async function main() {
  const existing = await prisma.movie.count();
  if (existing > 0) {
    console.log(`Database already has ${existing.toLocaleString()} movies. Skipping seed.\nRun "npx prisma migrate reset" first to reseed.`);
    return;
  }

  const start = Date.now();

  await extractIfNeeded();
  const [agg, tmdbMap] = await Promise.all([buildRatingAggregates(), buildTmdbMap()]);
  const movies = await parseMovies(agg, tmdbMap);
  await batchInsert(movies);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nSeeding complete in ${elapsed}s — ${movies.length.toLocaleString()} movies loaded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
