import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const movies = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM movies WHERE "mlRatingCount" > 0 ORDER BY RANDOM() LIMIT 1
  `;
  if (movies.length === 0) return NextResponse.json({ error: "No movies" }, { status: 404 });

  return NextResponse.json(movies[0]);
}
