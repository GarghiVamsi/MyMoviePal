import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const count = await prisma.movie.count();
  if (count === 0) return NextResponse.json({ error: "No movies" }, { status: 404 });

  const skip = Math.floor(Math.random() * count);
  const [movie] = await prisma.movie.findMany({ take: 1, skip });

  return NextResponse.json(movie);
}
