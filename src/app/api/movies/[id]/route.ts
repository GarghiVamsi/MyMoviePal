import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const movie = await prisma.movie.findUnique({
    where: { id: params.id },
    include: {
      ratings: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { ratings: true } },
    },
  });

  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const avg = movie.ratings.length
    ? movie.ratings.reduce((s: number, r: { score: number }) => s + r.score, 0) / movie.ratings.length
    : null;

  return NextResponse.json({ ...movie, _avg: { score: avg } });
}
