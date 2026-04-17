import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ratingSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { movieId, score, review } = parsed.data;

  const rating = await prisma.rating.upsert({
    where: { userId_movieId: { userId: session.user.id, movieId } },
    create: { userId: session.user.id, movieId, score, review },
    update: { score, review },
  });

  return NextResponse.json(rating);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const movieId = searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  await prisma.rating.deleteMany({
    where: { userId: session.user.id, movieId },
  });

  return NextResponse.json({ ok: true });
}
