import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTitle, formatScore } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "MyMoviePal — Discover Movies & Anime" };

async function fetchRow(contentType: string | null, orderBy: "mlRatingCount" | "mlAvgScore") {
  return prisma.movie.findMany({
    where: {
      ...(contentType ? { contentType } : {}),
      mlAvgScore: { not: null },
      mlRatingCount: { gt: 0 },
      posterUrl: { not: null },
    },
    orderBy: { [orderBy]: "desc" },
    take: 6,
    select: { id: true, title: true, year: true, posterUrl: true, mlAvgScore: true, contentType: true },
  });
}

function PosterCard({ id, title, year, posterUrl, mlAvgScore, contentType }: {
  id: string; title: string; year: number | null; posterUrl: string | null;
  mlAvgScore: number | null; contentType: string;
}) {
  const isAnime = contentType === "anime";
  return (
    <Link href={`/movies/${id}`} className="group block">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-gray-800">
        {posterUrl && (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 45vw, 180px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{formatTitle(title)}</p>
          <p className="text-xs text-gray-300">{year}</p>
        </div>
        {mlAvgScore != null && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5">
            <svg className={`h-3 w-3 ${isAnime ? "text-violet-400" : "text-amber-400"}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span className="text-xs font-bold text-white">{formatScore(mlAvgScore)}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-400 truncate">{formatTitle(title)}</p>
    </Link>
  );
}

function SectionRow({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-100">{title}</h2>
        <Link href={href} className="text-sm text-amber-400 hover:underline">See all →</Link>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {children}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [popularMovies, topAnime, highestRated] = await Promise.all([
    fetchRow("movie", "mlRatingCount"),
    fetchRow("anime", "mlRatingCount"),
    fetchRow(null, "mlAvgScore"),
  ]);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 py-16 px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-100 mb-3">
          Discover Movies <span className="text-amber-400">&</span> Anime
        </h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          87,000+ movies and 10,000+ anime. Rate, review, and build your watchlist.
        </p>
        <form action="/movies" method="GET" className="flex max-w-lg mx-auto gap-2">
          <input
            name="q"
            placeholder="Search movies and anime..."
            className="flex-1 h-11 rounded-lg border border-gray-700 bg-gray-800 px-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-lg bg-amber-500 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            Search
          </button>
        </form>
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <Link href="/movies?type=movie" className="text-gray-400 hover:text-amber-400 transition-colors">Browse Movies</Link>
          <span className="text-gray-700">·</span>
          <Link href="/movies?type=anime" className="text-gray-400 hover:text-amber-400 transition-colors">Browse Anime</Link>
        </div>
      </div>

      {/* Featured rows */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-12">
        <SectionRow title="Popular Movies" href="/movies?type=movie&sort=popular">
          {popularMovies.map((m) => <PosterCard key={m.id} {...m} />)}
        </SectionRow>

        <SectionRow title="Top Anime" href="/movies?type=anime&sort=popular">
          {topAnime.map((m) => <PosterCard key={m.id} {...m} />)}
        </SectionRow>

        <SectionRow title="Highest Rated" href="/movies?sort=rating">
          {highestRated.map((m) => <PosterCard key={m.id} {...m} />)}
        </SectionRow>
      </div>
    </div>
  );
}
