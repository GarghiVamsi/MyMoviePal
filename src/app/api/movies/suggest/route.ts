import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const movies = await prisma.movie.findMany({
    where: { title: { contains: q, mode: "insensitive" } },
    orderBy: { mlRatingCount: "desc" },
    take: 6,
    select: { id: true, title: true, year: true, posterUrl: true, contentType: true },
  });

  return NextResponse.json(movies);
}
