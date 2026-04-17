import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where = {
    ...(q && { title: { contains: q, mode: "insensitive" as const } }),
    ...(genre && { genres: { has: genre } }),
    ...(year && { year }),
  };

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { title: "asc" },
      include: {
        _count: { select: { ratings: true } },
      },
    }),
    prisma.movie.count({ where }),
  ]);

  return NextResponse.json({ movies, total, page, pages: Math.ceil(total / limit) });
}
