import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SuggestRow = { id: string; title: string; year: number | null; posterUrl: string | null; contentType: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) return NextResponse.json([]);

  const qLower = q.toLowerCase();
  const qEscaped = qLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const movies = await prisma.$queryRawUnsafe<SuggestRow[]>(
    `SELECT id, title, year, "posterUrl", "contentType"
     FROM movies
     WHERE LOWER(title) LIKE $1
     ORDER BY
       CASE
         WHEN LOWER(title) LIKE $2 THEN 0
         WHEN LOWER(title) ~ $3    THEN 1
         ELSE 2
       END ASC,
       "mlRatingCount" DESC NULLS LAST
     LIMIT 6`,
    `%${qLower}%`,
    `${qLower}%`,
    `(^|\\s)${qEscaped}`
  );

  return NextResponse.json(movies);
}
