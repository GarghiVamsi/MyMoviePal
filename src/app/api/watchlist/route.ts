import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { movieId } = await req.json();
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  try {
    await prisma.watchlist.create({
      data: { userId: session.user.id, movieId },
    });
    return NextResponse.json({ saved: true });
  } catch {
    // @@unique constraint hit — already saved
    return NextResponse.json({ saved: true });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const movieId = searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  await prisma.watchlist.deleteMany({
    where: { userId: session.user.id, movieId },
  });
  return NextResponse.json({ saved: false });
}
