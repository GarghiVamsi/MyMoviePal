import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatTitle, formatScore } from "@/lib/utils";
import { MotionDiv } from "@/components/ui/Motion";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "MyMoviePal — Discover Movies & Anime" };

async function fetchFeatured() {
  const [hotAnime, recentMovie] = await Promise.all([
    prisma.movie.findFirst({
      where: { contentType: "anime", mlAvgScore: { not: null }, mlRatingCount: { gt: 0 }, posterUrl: { not: null } },
      orderBy: { mlRatingCount: "desc" },
      select: { id: true, title: true, year: true, posterUrl: true, mlAvgScore: true, genres: true },
    }),
    prisma.movie.findFirst({
      where: { contentType: "movie", mlAvgScore: { not: null }, mlRatingCount: { gt: 0 }, posterUrl: { not: null } },
      orderBy: { year: "desc" },
      select: { id: true, title: true, year: true, posterUrl: true, mlAvgScore: true, genres: true },
    }),
  ]);
  return { hotAnime, recentMovie };
}

export default async function HomePage() {
  const { hotAnime, recentMovie } = await fetchFeatured();
  const heroItem = recentMovie ?? hotAnime;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── HERO ── */}
      <div className="relative h-[72vh] min-h-[520px] overflow-hidden">
        {heroItem?.posterUrl && (
          <Image
            src={heroItem.posterUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-110 blur-md"
          />
        )}
        <div className="absolute inset-0 bg-gray-950/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/30 to-gray-950" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4">
              Your next obsession awaits
            </p>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-4 max-w-3xl leading-[1.1]">
              Movies & Anime,<br />
              <span className="text-amber-400">All in one place.</span>
            </h1>
            <p className="text-gray-300 mb-8 max-w-lg text-lg mx-auto">
              87,000+ movies · 10,000+ anime · Rate, review, discover.
            </p>
            <form action="/movies" method="GET" className="flex w-full max-w-xl gap-2 mx-auto">
              <input
                name="q"
                placeholder="Search a title..."
                className="flex-1 h-12 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md px-5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="h-12 px-6 rounded-xl bg-amber-500 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
              >
                Search
              </button>
            </form>
          </MotionDiv>
        </div>
      </div>

      {/* ── LAYER 2: Featured spotlight ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-1">Featured Right Now</p>
        <h2 className="text-2xl font-extrabold text-white mb-8 tracking-tight">What&apos;s Hot Today</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hotAnime && (
            <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <FeaturedCard item={hotAnime} label="Hottest Anime" accentClass="text-violet-400 border-violet-500/40 bg-violet-500/10" />
            </MotionDiv>
          )}
          {recentMovie && (
            <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <FeaturedCard item={recentMovie} label="Recent Movie" accentClass="text-amber-400 border-amber-500/40 bg-amber-500/10" />
            </MotionDiv>
          )}
        </div>
      </section>

      {/* ── LAYER 3: Browse CTAs ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <BrowseCard
            href="/movies?type=movie"
            title="Browse Movies"
            description="Explore 87,000+ films from classics to blockbusters. Filter by genre, year, and rating."
            accentFrom="from-amber-600"
            accentTo="to-orange-700"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            }
          />
        </MotionDiv>
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <BrowseCard
            href="/movies?type=anime"
            title="Browse Anime"
            description="Discover 10,000+ anime series and films. Find your next obsession."
            accentFrom="from-violet-600"
            accentTo="to-purple-700"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
        </MotionDiv>
      </section>
    </div>
  );
}

type FeaturedItem = {
  id: string; title: string; year: number | null;
  posterUrl: string | null; mlAvgScore: number | null; genres: string[];
};

function FeaturedCard({ item, label, accentClass }: { item: FeaturedItem; label: string; accentClass: string }) {
  return (
    <Link href={`/movies/${item.id}`} className="group relative flex gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-600 transition-colors overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative flex-shrink-0 w-24 h-36 rounded-xl overflow-hidden bg-gray-800">
        {item.posterUrl && (
          <Image src={item.posterUrl} alt={item.title} fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-col justify-between min-w-0">
        <div>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-2 ${accentClass}`}>{label}</span>
          <h3 className="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
            {formatTitle(item.title)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{item.year}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {item.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{g}</span>
            ))}
          </div>
        </div>
        {item.mlAvgScore != null && (
          <div className="flex items-center gap-1 mt-3">
            <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span className="text-sm font-bold text-white">{formatScore(item.mlAvgScore)}</span>
            <span className="text-xs text-gray-500">/ 10</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function BrowseCard({ href, title, description, accentFrom, accentTo, icon }: {
  href: string; title: string; description: string;
  accentFrom: string; accentTo: string; icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group relative flex flex-col justify-between rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 p-8 hover:border-gray-600 transition-all duration-300 min-h-[200px]">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentFrom} ${accentTo}`} />
      <div>
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${accentFrom} ${accentTo} text-white mb-4 shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-xl font-extrabold text-white mb-2 group-hover:text-amber-300 transition-colors tracking-tight">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
        Explore now
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 translate-x-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </Link>
  );
}
